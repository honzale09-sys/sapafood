import json
from pathlib import Path

from db import db
from models import Category, DailyMenu, MenuItem

FEATURED = {"12", "40", "43", "45", "47", "80"}


async def seed_content():
    if await db.categories.count_documents({}) == 0:
        data = json.loads((Path(__file__).parent / "seed" / "seed.json").read_text(encoding="utf-8"))
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
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.daily_menus.create_index("date", unique=True)
    await db.menu_items.create_index([("category_id", 1), ("sort_order", 1)])
    await db.files.create_index("storage_path")
