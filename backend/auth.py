import hashlib
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from db import db
from models import ChangePasswordIn, LoginIn, User

JWT_ALGORITHM = "HS256"
ACCESS_MINUTES = 60
REFRESH_DAYS = 7
MAX_ATTEMPTS = 5
LOCK_MINUTES = 15

router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


def _token(sub: str, kind: str, delta: timedelta, **extra) -> str:
    payload = {"sub": sub, "type": kind, "exp": datetime.now(timezone.utc) + delta, **extra}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def _set_cookies(response: Response, user_id: str, email: str):
    access = _token(user_id, "access", timedelta(minutes=ACCESS_MINUTES), email=email)
    refresh = _token(user_id, "refresh", timedelta(days=REFRESH_DAYS))
    opts = dict(httponly=True, secure=True, samesite="lax", path="/")
    response.set_cookie("access_token", access, max_age=ACCESS_MINUTES * 60, **opts)
    response.set_cookie("refresh_token", refresh, max_age=REFRESH_DAYS * 86400, **opts)


def _decode(token: str, kind: str) -> dict:
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Đăng nhập không hợp lệ.")
    if payload.get("type") != kind:
        raise HTTPException(401, "Đăng nhập không hợp lệ.")
    return payload


async def get_current_user(request: Request) -> User:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(401, "Chưa đăng nhập.")
    payload = _decode(token, "access")
    doc = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not doc:
        raise HTTPException(401, "Người dùng không tồn tại.")
    return User.from_mongo(doc)


async def seed_admin():
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    fp = hashlib.sha256(password.encode()).hexdigest()
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "email": email, "password_hash": hash_password(password), "name": "Sapa Food",
            "role": "admin", "env_fp": fp, "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif existing.get("env_fp") != fp:
        # env password changed deliberately -> reset; UI password changes are kept otherwise
        await db.users.update_one({"_id": existing["_id"]}, {"$set": {"password_hash": hash_password(password), "env_fp": fp}})


@router.post("/login", response_model=User)
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.strip().lower()
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "").split(",")[0].strip()
    ident = f"{ip}:{email}"
    now = datetime.now(timezone.utc)
    att = await db.login_attempts.find_one({"identifier": ident})
    if att and att.get("locked_until") and datetime.fromisoformat(att["locked_until"]) > now:
        raise HTTPException(429, "Quá nhiều lần thử sai. Vui lòng thử lại sau 15 phút.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        count = (att.get("count", 0) if att else 0) + 1
        upd = {"count": count}
        if count >= MAX_ATTEMPTS:
            upd = {"count": 0, "locked_until": (now + timedelta(minutes=LOCK_MINUTES)).isoformat()}
        await db.login_attempts.update_one({"identifier": ident}, {"$set": upd}, upsert=True)
        raise HTTPException(401, "Sai email hoặc mật khẩu.")
    await db.login_attempts.delete_one({"identifier": ident})
    _set_cookies(response, str(user["_id"]), email)
    return User.from_mongo(user)


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "Chưa đăng nhập.")
    payload = _decode(token, "refresh")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(401, "Người dùng không tồn tại.")
    _set_cookies(response, str(user["_id"]), user["email"])
    return {"ok": True}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@router.get("/me", response_model=User)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password")
async def change_password(body: ChangePasswordIn, user: User = Depends(get_current_user)):
    doc = await db.users.find_one({"_id": ObjectId(user.id)})
    if not verify_password(body.current_password, doc["password_hash"]):
        raise HTTPException(400, "Mật khẩu hiện tại không đúng.")
    if len(body.new_password) < 8:
        raise HTTPException(422, "Mật khẩu mới phải có ít nhất 8 ký tự.")
    await db.users.update_one({"_id": doc["_id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
    return {"ok": True}
