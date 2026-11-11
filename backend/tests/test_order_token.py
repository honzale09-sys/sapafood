"""Order lookup tokens. Teya, GoSMS and SMTP are replaced by fakes: no real payment, SMS or e-mail."""
import asyncio
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import os  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

# Belt and braces: without credentials no real Teya/GoSMS/SMTP call could succeed even if a fake were missing.
for _k in [k for k in os.environ if k.startswith(("TEYA_", "GOSMS_", "SMTP_", "MAIL_")) or k == "ORDER_SMS_TO"]:
    del os.environ[_k]
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Motor binds to the current event loop, so it must be set before db is imported.
LOOP = asyncio.new_event_loop()
asyncio.set_event_loop(LOOP)

import gosms  # noqa: E402
import mailer  # noqa: E402
import ordering  # noqa: E402
import teya_client  # noqa: E402
from db import db  # noqa: E402
from server import app  # noqa: E402

NAME = "TEST_TOKEN_ORDER"
SENT = {"sms": [], "mail": [], "teya": []}


def run(coro):
    return LOOP.run_until_complete(coro)


@pytest.fixture(autouse=True)
def fakes(monkeypatch):
    async def create_session(body, idempotency_key=None):
        SENT["teya"].append(body)
        return {"session_id": f"sess_{idempotency_key}", "session_url": "https://teya.invalid/pay"}

    async def get_session(_sid):
        return {"session_status": "OPEN"}

    async def sms(to, text):
        SENT["sms"].append(text)

    async def mail(to, subject, text, html):
        SENT["mail"].append(subject)

    async def settings():
        return dict(ordering.DEFAULTS)

    async def number(_date):
        return 999

    monkeypatch.setattr(teya_client, "configured", lambda: True)
    monkeypatch.setattr(teya_client, "create_session", create_session)
    monkeypatch.setattr(teya_client, "get_session", get_session)
    monkeypatch.setattr(gosms, "send", sms)
    monkeypatch.setattr(mailer, "send", mail)
    monkeypatch.setattr(mailer, "configured", lambda: True)
    monkeypatch.setattr(ordering, "ORDER_SMS_TO", ["+420000000000"])
    monkeypatch.setattr(ordering, "_settings", settings)
    monkeypatch.setattr(ordering, "_slots", lambda s, now=None: ["12:00"])
    monkeypatch.setattr(ordering, "_next_number", number)
    yield


def teardown_module():
    run(db.orders.delete_many({"name": NAME}))
    LOOP.close()


async def _call(method, url, **kw):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as c:
        return await c.request(method, url, headers={"Origin": "https://www.sapa-food.cz"}, **kw)


def _order(payment, phone):
    item = run(db.menu_items.find_one({"visible": True, "price": {"$ne": None}}))
    body = {"lines": [{"item_id": str(item["_id"]), "qty": 1}], "name": NAME, "phone": phone,
            "email": "test@example.com", "pickup": "12:00", "payment": payment}
    r = run(_call("POST", "/api/orders/start", json=body))
    assert r.status_code == 200, r.text
    return r.json()


def test_card_order_uses_token_return_urls():
    d = _order("card", "+420 600 000 101")
    assert len(d["token"]) >= 32 and d["redirectUrl"] == "https://teya.invalid/pay"
    session = SENT["teya"][-1]
    assert session["success_url"].endswith(f"?t={d['token']}") and session["failure_url"] == session["success_url"]
    assert d["ref"] not in session["success_url"] and d["ref"] not in session["cancel_url"]


def test_store_order_returns_token_and_lookup_works():
    d = _order("store", "+420 600 000 102")
    assert len(d["token"]) >= 32
    r = run(_call("GET", f"/api/orders/status/{d['token']}"))
    assert r.status_code == 200 and r.json()["ref"] == d["ref"] and r.json()["status"] == "confirmed"
    assert SENT["sms"] and SENT["mail"]


def test_new_order_not_found_by_short_ref():
    d = _order("store", "+420 600 000 103")
    assert run(_call("GET", f"/api/orders/status/{d['ref']}")).status_code == 404
    assert run(_call("GET", f"/api/orders/status/{d['ref'].lower()}")).status_code == 404


def test_legacy_order_found_by_ref():
    run(db.orders.insert_one({"ref": "STESTLG", "status": "done", "payment": "card", "date": "2026-01-01", "pickup": "12:00",
                              "total": 100, "name": NAME, "phone": "+420600000104", "email": "test@example.com",
                              "lines": [], "number": 1, "sms_state": "sent", "mail_state": "sent"}))
    r = run(_call("GET", "/api/orders/status/STESTLG"))
    assert r.status_code == 200 and r.json()["ref"] == "STESTLG"


def test_unknown_key_404():
    assert run(_call("GET", "/api/orders/status/doesnotexist")).status_code == 404
