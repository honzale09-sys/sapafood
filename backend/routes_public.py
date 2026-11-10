from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response

from db import db
from models import Category, DailyMenu, MenuItem
from storage import get_object

router = APIRouter(prefix="/api", tags=["public"])
PRAGUE = ZoneInfo("Europe/Prague")


def prague_today() -> str:
    return datetime.now(PRAGUE).date().isoformat()


@router.get("/health")
async def health():
    return {"ok": True}


@router.get("/menu")
async def public_menu():
    cats = [Category.from_mongo(c) for c in await db.categories.find().sort("sort_order", 1).to_list(500)]
    items = [MenuItem.from_mongo(i) for i in await db.menu_items.find({"visible": True}).sort("sort_order", 1).to_list(2000)]
    out = []
    for c in cats:
        its = [i.model_dump() for i in items if i.category_id == c.id]
        if its:
            out.append({**c.model_dump(), "items": its})
    return {"categories": out}


@router.get("/menu/featured", response_model=list[MenuItem])
async def featured():
    docs = await db.menu_items.find({"visible": True, "featured": True}).sort("sort_order", 1).to_list(24)
    return [MenuItem.from_mongo(d) for d in docs]


@router.get("/daily-menu/today")
async def daily_today():
    today = prague_today()
    doc = await db.daily_menus.find_one({"date": today, "published": True})
    menu = DailyMenu.from_mongo(doc)
    return {"today": today, "menu": menu.model_dump() if menu and menu.items else None}


@router.get("/files/{path:path}")
async def serve_file(path: str):
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not rec:
        raise HTTPException(404, "Soubor nenalezen.")
    data, ctype = await run_in_threadpool(get_object, path)
    return Response(content=data, media_type=rec.get("content_type") or ctype,
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})
