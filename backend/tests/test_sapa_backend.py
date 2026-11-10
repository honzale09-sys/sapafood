"""Sapa Food backend API tests."""
import os
import io
import pytest
import requests
from datetime import datetime
from zoneinfo import ZoneInfo
from PIL import Image

TODAY = datetime.now(ZoneInfo("Europe/Prague")).date().isoformat()

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://sapa-food-revamp.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@sapa-food.cz"
ADMIN_PASSWORD = "Sapa-tlWaTuUHUpYDvdD5!"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def anon():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies or r.cookies.get("access_token"), "access_token cookie missing"
    return s


# ---------- Health / OpenAPI ----------
class TestBasics:
    def test_health(self, anon):
        r = anon.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json() == {"ok": True}

    def test_openapi(self, anon):
        r = anon.get(f"{API}/openapi.json")
        assert r.status_code == 200
        data = r.json()
        assert data["info"]["title"] == "Sapa Food API"


# ---------- Public menu ----------
class TestPublicMenu:
    def test_menu_categories_count(self, anon):
        r = anon.get(f"{API}/menu")
        assert r.status_code == 200
        data = r.json()
        assert len(data["categories"]) == 10, f"expected 10 categories, got {len(data['categories'])}"
        total = sum(len(c["items"]) for c in data["categories"])
        assert total == 53, f"expected 53 items, got {total}"

    def test_menu_specific_items(self, anon):
        r = anon.get(f"{API}/menu").json()
        all_items = [it for c in r["categories"] for it in c["items"]]
        # 40. Pho Bo 219 Kč allergen 4
        pho = next((i for i in all_items if i.get("number") == "40" and "Pho Bo" in i["name"]), None)
        assert pho is not None, "40. Pho Bo not found"
        assert pho["price"] == 219
        assert 4 in pho["allergens"]
        # 23. Tom Kha variants Krevety 129 / Kuřecí 109 / Tofu 99 Kč
        tom = next((i for i in all_items if i.get("number") == "23" and "Tom Kha" in i["name"]), None)
        assert tom is not None, "23. Tom Kha not found"
        v_prices = {v["label_cz"]: v["price"] for v in tom["variants"]}
        assert v_prices.get("Krevety") == 129
        assert v_prices.get("Kuřecí") == 109
        assert v_prices.get("Tofu") == 99

    def test_daily_today_none(self, anon):
        r = anon.get(f"{API}/daily-menu/today")
        assert r.status_code == 200
        d = r.json()
        assert d["today"] == TODAY
        if d["menu"] is not None:
            assert d["menu"]["date"] == TODAY and d["menu"]["published"] is True


# ---------- Auth ----------
class TestAuth:
    def test_wrong_password(self, anon):
        # use a non-real email to avoid locking admin
        r = anon.post(f"{API}/auth/login", json={"email": "noone@sapa-food.cz", "password": "wrong"})
        assert r.status_code == 401
        assert "Nesprávný" in r.json()["detail"]

    def test_admin_login_and_me(self, admin):
        r = admin.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------- Admin auth requirement ----------
class TestAdminAuthRequired:
    @pytest.mark.parametrize("method,path", [
        ("POST", "/admin/categories"),
        ("PUT", "/admin/categories/507f1f77bcf86cd799439011"),
        ("DELETE", "/admin/categories/507f1f77bcf86cd799439011"),
        ("POST", "/admin/items"),
        ("PUT", "/admin/items/507f1f77bcf86cd799439011"),
        ("PATCH", "/admin/items/507f1f77bcf86cd799439011/visibility"),
        ("DELETE", "/admin/items/507f1f77bcf86cd799439011"),
        ("POST", "/admin/upload"),
        ("PUT", "/admin/daily-menus/2000-01-01"),
        ("DELETE", "/admin/daily-menus/2000-01-01"),
    ])
    def test_write_endpoint_requires_auth(self, method, path):
        r = requests.request(method, f"{API}{path}", json={})
        assert r.status_code == 401, f"{method} {path} expected 401, got {r.status_code}"


# ---------- Daily menu admin flow ----------
class TestDailyMenuFlow:
    def test_create_publish_verify_delete(self, admin):
        today = TODAY
        backup = admin.get(f"{API}/admin/daily-menus/{today}").json()["menu"]
        # Save published menu
        body = {
            "published": True,
            "note_cz": "TEST", "note_en": "TEST",
            "items": [{"name": "TEST Denní Polévka", "price": 59, "allergens": [1, 3], "desc_cz": "", "desc_en": ""}],
        }
        r = admin.put(f"{API}/admin/daily-menus/{today}", json=body)
        assert r.status_code == 200, r.text
        # Public should now see it
        pub = requests.get(f"{API}/daily-menu/today").json()
        assert pub["menu"] is not None
        assert pub["menu"]["items"][0]["name"] == "TEST Denní Polévka"
        # Unpublish
        body["published"] = False
        r = admin.put(f"{API}/admin/daily-menus/{today}", json=body)
        assert r.status_code == 200
        pub = requests.get(f"{API}/daily-menu/today").json()
        assert pub["menu"] is None
        # Delete to clean up, then restore any real menu for today
        r = admin.delete(f"{API}/admin/daily-menus/{today}")
        assert r.status_code == 200
        if backup:
            keep = {k: backup[k] for k in ("published", "note_cz", "note_en", "items")}
            assert admin.put(f"{API}/admin/daily-menus/{today}", json=keep).status_code == 200

    def test_daily_validation_empty_name(self, admin):
        r = admin.put(f"{API}/admin/daily-menus/2000-01-01",
                      json={"published": False, "items": [{"name": "", "price": 50, "allergens": []}]})
        assert r.status_code == 422
        assert "název" in r.json()["detail"].lower() or "povinný" in r.json()["detail"].lower()

    def test_daily_validation_zero_price(self, admin):
        r = admin.put(f"{API}/admin/daily-menus/2000-01-01",
                      json={"published": False, "items": [{"name": "X", "price": 0, "allergens": []}]})
        assert r.status_code == 422
        assert "cena" in r.json()["detail"].lower()

    def test_daily_non_int_price(self, admin):
        r = admin.put(f"{API}/admin/daily-menus/2000-01-01",
                      json={"published": False, "items": [{"name": "X", "price": 12.5, "allergens": []}]})
        assert r.status_code == 422

    def test_copy_previous_day(self, admin):
        # seeded published menu exists at 2026-09-29
        r = admin.get(f"{API}/admin/daily-menus/2026-09-30/previous")
        assert r.status_code == 200
        assert r.json()["menu"] is not None


# ---------- Item edit / visibility / upload ----------
class TestItemAndUpload:
    def _get_pho(self, admin):
        r = admin.get(f"{API}/admin/items")
        assert r.status_code == 200
        for it in r.json():
            if it.get("number") == "40" and "Pho Bo" in it["name"]:
                return it
        pytest.fail("Pho Bo not found in admin items")

    def test_edit_price_and_restore(self, admin):
        pho = self._get_pho(admin)
        original = pho["price"]
        payload = {**{k: pho[k] for k in ["category_id", "number", "name", "name_en", "desc_cz", "desc_en",
                                          "allergens", "variants", "image", "vegetarian", "vegan", "visible", "featured"]},
                   "price": 999}
        r = admin.put(f"{API}/admin/items/{pho['id']}", json=payload)
        assert r.status_code == 200, r.text
        # verify via public
        pub = requests.get(f"{API}/menu").json()
        found = [i for c in pub["categories"] for i in c["items"] if i.get("number") == "40"][0]
        assert found["price"] == 999
        # restore
        payload["price"] = original
        r = admin.put(f"{API}/admin/items/{pho['id']}", json=payload)
        assert r.status_code == 200

    def test_visibility_toggle_and_restore(self, admin):
        pho = self._get_pho(admin)
        r = admin.patch(f"{API}/admin/items/{pho['id']}/visibility", json={"visible": False})
        assert r.status_code == 200
        pub = requests.get(f"{API}/menu").json()
        found = [i for c in pub["categories"] for i in c["items"] if i.get("number") == "40"]
        assert not found, "Pho Bo should be hidden"
        # restore
        r = admin.patch(f"{API}/admin/items/{pho['id']}/visibility", json={"visible": True})
        assert r.status_code == 200

    def test_price_validation_zero(self, admin):
        pho = self._get_pho(admin)
        payload = {**{k: pho[k] for k in ["category_id", "number", "name", "name_en", "desc_cz", "desc_en",
                                          "allergens", "variants", "image", "vegetarian", "vegan", "visible", "featured"]},
                   "price": 0}
        r = admin.put(f"{API}/admin/items/{pho['id']}", json=payload)
        assert r.status_code == 422

    def test_upload_bad_type(self, admin):
        files = {"file": ("test.txt", b"hello world", "text/plain")}
        r = admin.post(f"{API}/admin/upload", files=files)
        assert r.status_code == 415
        assert "podporovan" in r.json()["detail"].lower() or "formát" in r.json()["detail"].lower()

    def test_upload_too_large(self, admin):
        big = b"\x00" * (5 * 1024 * 1024 + 10)
        files = {"file": ("big.jpg", big, "image/jpeg")}
        r = admin.post(f"{API}/admin/upload", files=files)
        assert r.status_code == 413

    def test_upload_valid_png(self, admin):
        img = Image.new("RGB", (10, 10), (255, 0, 0))
        buf = io.BytesIO()
        img.save(buf, "PNG")
        buf.seek(0)
        files = {"file": ("test.png", buf.getvalue(), "image/png")}
        r = admin.post(f"{API}/admin/upload", files=files)
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        assert url.startswith("/api/files/")
        # fetch it
        fr = requests.get(f"{BASE_URL}{url}")
        assert fr.status_code == 200


# ---------- Category ----------
class TestCategory:
    def test_delete_non_empty_category_409(self, admin):
        r = admin.get(f"{API}/admin/categories")
        cats = r.json()
        non_empty = next((c for c in cats if c["item_count"] > 0), None)
        assert non_empty
        r = admin.delete(f"{API}/admin/categories/{non_empty['id']}")
        assert r.status_code == 409
        assert "obsahuje" in r.json()["detail"].lower() or "položky" in r.json()["detail"].lower()

    def test_create_missing_name_422(self, admin):
        r = admin.post(f"{API}/admin/categories", json={"name_cz": "  ", "name_en": ""})
        assert r.status_code == 422
