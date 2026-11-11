import io
import re
import uuid
from datetime import date, datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import Image

from auth import get_current_user
from db import db
from models import (Category, CategoryIn, DailyMenu, DailyMenuIn, MenuItem, MenuItemIn,
                    OrderIn, VisibilityIn)
from storage import APP_NAME, put_object

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_user)])

MAX_UPLOAD = 5 * 1024 * 1024
IMAGE_TYPES = {"JPEG": ("image/jpeg", "jpg"), "PNG": ("image/png", "png"), "WEBP": ("image/webp", "webp")}


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(404, "Không tìm thấy dữ liệu.")


def check_date(d: str) -> str:
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d):
            raise ValueError
        date.fromisoformat(d)
    except ValueError:
        raise HTTPException(422, "Ngày không hợp lệ (định dạng NNNN-TT-NN).")
    return d


def check_allergens(values, errs, label="Alergeny"):
    if any(a < 1 or a > 14 for a in values):
        errs.append(f"{label}: chỉ được là số 1–14.")


def validate_item(body: MenuItemIn):
    errs = []
    body.name = body.name.strip()
    if not body.name:
        errs.append("Tên món (tiếng Séc) là bắt buộc.")
    if body.price is not None and body.price <= 0:
        errs.append("Giá phải là số nguyên dương.")
    if body.price is None and not body.variants:
        errs.append("Hãy nhập giá hoặc thêm ít nhất một loại.")
    for v in body.variants:
        if not v.label_cz.strip():
            errs.append("Mỗi loại phải có tên.")
        if v.price <= 0:
            errs.append("Giá của loại phải là số nguyên dương.")
        check_allergens(v.allergens, errs, "Alergeny varianty")
    check_allergens(body.allergens, errs)
    if errs:
        raise HTTPException(422, " ".join(dict.fromkeys(errs)))
    body.allergens = sorted(set(body.allergens))


def validate_daily(body: DailyMenuIn):
    errs = []
    for idx, it in enumerate(body.items, 1):
        it.name = it.name.strip()
        if not it.name:
            errs.append(f"Món {idx}: tên là bắt buộc.")
        if it.price <= 0:
            errs.append(f"Món {idx}: giá phải là số nguyên dương.")
        check_allergens(it.allergens, errs, f"Món {idx}: chất gây dị ứng")
        it.allergens = sorted(set(it.allergens))
    if body.published and not body.items:
        errs.append("Không thể đăng thực đơn trống – hãy thêm ít nhất một món.")
    if errs:
        raise HTTPException(422, " ".join(errs))


# ---------- categories ----------
@router.get("/categories")
async def list_categories():
    cats = [Category.from_mongo(c) for c in await db.categories.find().sort("sort_order", 1).to_list(500)]
    out = []
    for c in cats:
        count = await db.menu_items.count_documents({"category_id": c.id})
        out.append({**c.model_dump(), "item_count": count})
    return out


@router.post("/categories", response_model=Category)
async def create_category(body: CategoryIn):
    if not body.name_cz.strip():
        raise HTTPException(422, "Tên danh mục (tiếng Séc) là bắt buộc.")
    last = await db.categories.find_one(sort=[("sort_order", -1)])
    cat = Category(name_cz=body.name_cz.strip(), name_en=body.name_en.strip(), sort_order=(last["sort_order"] + 1) if last else 0)
    res = await db.categories.insert_one(cat.to_mongo())
    cat.id = str(res.inserted_id)
    return cat


@router.put("/categories/{cid}", response_model=Category)
async def update_category(cid: str, body: CategoryIn):
    if not body.name_cz.strip():
        raise HTTPException(422, "Tên danh mục (tiếng Séc) là bắt buộc.")
    res = await db.categories.find_one_and_update(
        {"_id": oid(cid)}, {"$set": {"name_cz": body.name_cz.strip(), "name_en": body.name_en.strip()}}, return_document=True)
    if not res:
        raise HTTPException(404, "Kategorie nenalezena.")
    return Category.from_mongo(res)


@router.delete("/categories/{cid}")
async def delete_category(cid: str):
    if await db.menu_items.count_documents({"category_id": cid}):
        raise HTTPException(409, "Danh mục còn món. Hãy xóa hoặc chuyển các món sang danh mục khác trước.")
    res = await db.categories.delete_one({"_id": oid(cid)})
    if not res.deleted_count:
        raise HTTPException(404, "Kategorie nenalezena.")
    return {"ok": True}


@router.put("/categories-order")
async def order_categories(body: OrderIn):
    for i, cid in enumerate(body.ids):
        await db.categories.update_one({"_id": oid(cid)}, {"$set": {"sort_order": i}})
    return {"ok": True}


# ---------- items ----------
@router.get("/items", response_model=list[MenuItem])
async def list_items():
    return [MenuItem.from_mongo(d) for d in await db.menu_items.find().sort("sort_order", 1).to_list(2000)]


async def _ensure_category(cid: str):
    if not await db.categories.find_one({"_id": oid(cid)}):
        raise HTTPException(422, "Hãy chọn danh mục có sẵn.")


@router.post("/items", response_model=MenuItem)
async def create_item(body: MenuItemIn):
    validate_item(body)
    await _ensure_category(body.category_id)
    last = await db.menu_items.find_one({"category_id": body.category_id}, sort=[("sort_order", -1)])
    item = MenuItem(**body.model_dump(), sort_order=(last["sort_order"] + 1) if last else 0)
    res = await db.menu_items.insert_one(item.to_mongo())
    item.id = str(res.inserted_id)
    return item


@router.put("/items/{iid}", response_model=MenuItem)
async def update_item(iid: str, body: MenuItemIn):
    validate_item(body)
    await _ensure_category(body.category_id)
    res = await db.menu_items.find_one_and_update({"_id": oid(iid)}, {"$set": body.model_dump()}, return_document=True)
    if not res:
        raise HTTPException(404, "Không tìm thấy món.")
    return MenuItem.from_mongo(res)


@router.patch("/items/{iid}/visibility", response_model=MenuItem)
async def set_visibility(iid: str, body: VisibilityIn):
    res = await db.menu_items.find_one_and_update({"_id": oid(iid)}, {"$set": {"visible": body.visible}}, return_document=True)
    if not res:
        raise HTTPException(404, "Không tìm thấy món.")
    return MenuItem.from_mongo(res)


@router.delete("/items/{iid}")
async def delete_item(iid: str):
    res = await db.menu_items.delete_one({"_id": oid(iid)})
    if not res.deleted_count:
        raise HTTPException(404, "Không tìm thấy món.")
    return {"ok": True}


@router.put("/items-order")
async def order_items(body: OrderIn):
    for i, iid in enumerate(body.ids):
        await db.menu_items.update_one({"_id": oid(iid)}, {"$set": {"sort_order": i}})
    return {"ok": True}


# ---------- upload ----------
@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "Ảnh quá lớn (tối đa 5 MB).")
    try:
        fmt = Image.open(io.BytesIO(data)).format
    except Exception:
        fmt = None
    if fmt not in IMAGE_TYPES:
        raise HTTPException(415, "Định dạng không hỗ trợ. Chỉ nhận JPG, PNG và WEBP.")
    ctype, ext = IMAGE_TYPES[fmt]
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    try:
        result = await run_in_threadpool(put_object, path, data, ctype)
    except Exception:
        raise HTTPException(502, "Tải ảnh lên không thành công. Vui lòng thử lại.")
    await db.files.insert_one({
        "storage_path": result["path"], "original_filename": file.filename, "content_type": ctype,
        "size": result.get("size", len(data)), "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": f"/api/files/{result['path']}"}


# ---------- daily menus ----------
@router.get("/daily-menus")
async def list_daily(start: str, end: str):
    docs = await db.daily_menus.find({"date": {"$gte": check_date(start), "$lte": check_date(end)}}).sort("date", 1).to_list(400)
    return [{"date": d["date"], "published": d.get("published", False), "count": len(d.get("items", []))} for d in docs]


@router.get("/daily-menus/{d}")
async def get_daily(d: str):
    menu = DailyMenu.from_mongo(await db.daily_menus.find_one({"date": check_date(d)}))
    return {"menu": menu.model_dump() if menu else None}


@router.get("/daily-menus/{d}/previous")
async def previous_daily(d: str):
    doc = await db.daily_menus.find_one({"date": {"$lt": check_date(d)}, "items.0": {"$exists": True}}, sort=[("date", -1)])
    if not doc:
        raise HTTPException(404, "Không có thực đơn trước đó để sao chép.")
    return {"menu": DailyMenu.from_mongo(doc).model_dump()}


@router.put("/daily-menus/{d}", response_model=DailyMenu)
async def save_daily(d: str, body: DailyMenuIn):
    check_date(d)
    validate_daily(body)
    menu = DailyMenu(date=d, updated_at=datetime.now(timezone.utc).isoformat(), **body.model_dump())
    doc = menu.to_mongo()
    res = await db.daily_menus.find_one_and_update({"date": d}, {"$set": doc}, upsert=True, return_document=True)
    return DailyMenu.from_mongo(res)


@router.delete("/daily-menus/{d}")
async def delete_daily(d: str):
    await db.daily_menus.delete_one({"date": check_date(d)})
    return {"ok": True}
