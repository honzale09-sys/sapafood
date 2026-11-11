import json
from pathlib import Path

from pymongo.errors import DuplicateKeyError

from db import db
from models import Category, DailyMenu, MenuItem

SEED_DIR = Path(__file__).parent / "seed"
SNAPSHOT = SEED_DIR / "snapshot.json"
FEATURED = {"12", "40", "43", "45", "47", "80"}


async def _seed_snapshot(data: dict):
    # Same ids as in the preview, so item.category_id keeps pointing at the right category.
    for c in data["categories"]:
        await db.categories.insert_one(Category(**c).to_mongo())
    for it in data["items"]:
        await db.menu_items.insert_one(MenuItem(**it).to_mongo())


async def _seed_scrape():
    data = json.loads((SEED_DIR / "seed.json").read_text(encoding="utf-8"))
    for ci, c in enumerate(data["categories"]):
        cat = Category(name_cz=c["name_cz"], name_en=c["name_en"], sort_order=ci)
        cid = str((await db.categories.insert_one(cat.to_mongo())).inserted_id)
        for ii, it in enumerate(c["items"]):
            it = {k: v for k, v in it.items() if k != "source_id"}
            item = MenuItem(category_id=cid, sort_order=ii, featured=it["number"] in FEATURED, **it)
            await db.menu_items.insert_one(item.to_mongo())
    if await db.daily_menus.count_documents({}) == 0:
        for m in data["daily_menus"]:
            await db.daily_menus.insert_one(DailyMenu(**m).to_mongo())


async def _claim(name: str) -> bool:
    # Production runs several replicas: only the one that inserts the marker first does the seeding.
    try:
        await db.settings.insert_one({"_id": name})
        return True
    except DuplicateKeyError:
        return False


async def seed_content():
    # Only fills an empty database; existing data is never touched.
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8")) if SNAPSHOT.exists() else None
    if await db.categories.count_documents({}) == 0 and await db.menu_items.count_documents({}) == 0 and await _claim("seed_menu"):
        await (_seed_snapshot(snapshot) if snapshot else _seed_scrape())
    if snapshot and snapshot.get("ordering_settings") and not await db.settings.find_one({"_id": "ordering"}):
        try:
            await db.settings.insert_one({"_id": "ordering", **snapshot["ordering_settings"]})
        except DuplicateKeyError:
            pass
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.daily_menus.create_index("date", unique=True)
    await db.menu_items.create_index([("category_id", 1), ("sort_order", 1)])
    await db.files.create_index("storage_path")
    await db.orders.create_index("token", unique=True, sparse=True)
