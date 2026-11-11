"""Online orders for pickup: priced from the menu on the server, paid by card through Teya Hosted Checkout,
and announced to the restaurant by SMS (GoSMS) once Teya confirms the payment."""
import logging
import os
import re
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import List, Literal, Optional
from zoneinfo import ZoneInfo

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

import gosms
import teya_client as teya
from auth import get_current_user
from db import db
from models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["orders"])

PRAGUE = ZoneInfo("Europe/Prague")
PUBLIC_SITE_URL = (os.environ.get("PUBLIC_SITE_URL") or "").rstrip("/")
ORDER_SMS_TO = [n.strip() for n in (os.environ.get("ORDER_SMS_TO") or "").split(",") if n.strip()]
PHONE_RE = re.compile(r"^\+?[0-9 ]{9,17}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HHMM_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
SMS_RETRY_SECONDS = 120

# Editable in the admin; the hours match the opening hours on the site.
DEFAULTS = {"enabled": True, "open": "10:30", "close": "22:30", "lead_minutes": 20, "step_minutes": 15, "last_before_close": 15}


class OrderLine(BaseModel):
    item_id: str
    variant: Optional[int] = None
    qty: int = Field(ge=1, le=20)


class OrderStart(BaseModel):
    lines: List[OrderLine] = Field(min_length=1, max_length=40)
    name: str
    phone: str
    email: str
    pickup: str
    note: str = ""
    lang: Literal["cs", "en"] = "cs"

    @field_validator("name")
    @classmethod
    def v_name(cls, v: str) -> str:
        v = v.strip()
        if not 2 <= len(v) <= 80:
            raise ValueError("name")
        return v

    @field_validator("phone")
    @classmethod
    def v_phone(cls, v: str) -> str:
        v = v.strip()
        if not PHONE_RE.match(v):
            raise ValueError("phone")
        return v

    @field_validator("email")
    @classmethod
    def v_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v) or len(v) > 120:
            raise ValueError("email")
        return v

    @field_validator("note")
    @classmethod
    def v_note(cls, v: str) -> str:
        return v.strip()[:300]


class OrderingSettings(BaseModel):
    enabled: bool
    open: str
    close: str
    lead_minutes: int = Field(ge=0, le=180)

    @field_validator("open", "close")
    @classmethod
    def v_time(cls, v: str) -> str:
        if not HHMM_RE.match(v):
            raise ValueError("time")
        return v


async def _settings() -> dict:
    doc = await db.settings.find_one({"_id": "ordering"}) or {}
    return {**DEFAULTS, **{k: v for k, v in doc.items() if k in DEFAULTS}}


def _slots(s: dict, now: Optional[datetime] = None) -> List[str]:
    """Today's pickup times: from now + lead time, on the step grid, until shortly before closing."""
    now = now or datetime.now(PRAGUE)
    minute = lambda hhmm: int(hhmm[:2]) * 60 + int(hhmm[3:])  # noqa: E731
    step = s["step_minutes"]
    earliest = max(minute(s["open"]), now.hour * 60 + now.minute + 1 + s["lead_minutes"])
    first = -(-earliest // step) * step
    last = minute(s["close"]) - s["last_before_close"]
    return [f"{m // 60:02d}:{m % 60:02d}" for m in range(first, last + 1, step)]


def _site_url(request: Request) -> str:
    if PUBLIC_SITE_URL:
        return PUBLIC_SITE_URL
    origin = request.headers.get("origin") or ""
    if re.fullmatch(r"https?://[A-Za-z0-9.-]+(:\d+)?", origin):
        return origin
    raise HTTPException(status_code=500, detail="site_url_not_configured")


async def _price(lines: List[OrderLine]):
    """Prices come from the menu in the database; the browser only says what and how many."""
    if not all(ObjectId.is_valid(line.item_id) for line in lines):
        raise HTTPException(status_code=409, detail="item_unavailable")
    ids = [ObjectId(line.item_id) for line in lines]
    docs = {str(d["_id"]): d for d in await db.menu_items.find({"_id": {"$in": ids}, "visible": True}).to_list(200)}
    priced, total = [], 0
    for line in lines:
        item = docs.get(line.item_id)
        if not item:
            raise HTTPException(status_code=409, detail="item_unavailable")
        label = ""
        if line.variant is None:
            price = item.get("price")
        else:
            variants = item.get("variants") or []
            if not 0 <= line.variant < len(variants):
                raise HTTPException(status_code=409, detail="item_unavailable")
            price, label = variants[line.variant]["price"], variants[line.variant].get("label_cz") or ""
        if not price or price <= 0:
            raise HTTPException(status_code=409, detail="item_unavailable")
        priced.append({"item_id": line.item_id, "variant": line.variant, "number": item.get("number") or "", "name": item["name"],
                       "name_en": item.get("name_en") or "", "label": label, "qty": line.qty, "price": price})
        total += price * line.qty
    return priced, total


async def _new_ref() -> str:
    # Short enough to read out at the counter.
    for _ in range(10):
        ref = "S" + secrets.token_hex(3).upper()
        if not await db.orders.find_one({"ref": ref}):
            return ref
    raise HTTPException(status_code=500, detail="ref_failed")


def _public(doc: dict) -> dict:
    return {"ref": doc["ref"], "number": doc.get("number"), "status": doc["status"], "pickup": doc["pickup"], "total": doc["total"], "name": doc["name"],
            "lines": [{k: line[k] for k in ("number", "name", "name_en", "label", "qty", "price")} for line in doc["lines"]]}


def _sms_text(doc: dict) -> str:
    """For the kitchen, in Vietnamese. gosms.plain() drops the diacritics: 160 characters per SMS part instead of 70."""
    items = "\n".join(f"{line['qty']}x {line['number'] + ' ' if line['number'] else ''}{line['name']}{' (' + line['label'] + ')' if line['label'] else ''}"
                      for line in doc["lines"])
    text = (f"ĐƠN HÀNG SỐ #{doc['number']}\nGiờ lấy: {doc['pickup']}\nTên: {doc['name']}\nSĐT: {doc['phone']}\n"
            f"Món:\n{items}\nTổng: {doc['total']} Kč, ĐÃ THANH TOÁN")
    return text + (f"\n\nGhi chú: {doc['note']}" if doc.get("note") else "")


async def _next_number(date: str) -> int:
    """Order numbers start at #1 every day, so the kitchen and the customer can say them out loud."""
    counter = await db.counters.find_one_and_update({"_id": f"orders-{date}"}, {"$inc": {"n": 1}}, upsert=True, return_document=True)
    return counter["n"]


async def _notify(doc: dict) -> dict:
    """Sends the restaurant SMS once. The state switch is atomic, so a webhook and a poll can't both send it."""
    claimed = await db.orders.find_one_and_update(
        {"ref": doc["ref"], "status": "paid", "$or": [{"sms_state": None},
                                                      {"sms_state": "error", "sms_attempt_at": {"$lt": time.time() - SMS_RETRY_SECONDS}}]},
        {"$set": {"sms_state": "sending", "sms_attempt_at": time.time()}},
        return_document=True,
    )
    if not claimed:
        return await db.orders.find_one({"ref": doc["ref"]})
    try:
        if not ORDER_SMS_TO:
            raise gosms.GoSmsError("no_recipient")
        await gosms.send(ORDER_SMS_TO, _sms_text(claimed))
        update = {"sms_state": "sent", "sms_error": None}
    except gosms.GoSmsError as e:
        # The order stays paid and visible in the admin; the SMS is retried on the next status check.
        logger.error("Order %s SMS failed: %s", claimed["ref"], e)
        update = {"sms_state": "error", "sms_error": str(e)}
    return await db.orders.find_one_and_update({"ref": claimed["ref"]}, {"$set": update}, return_document=True)


async def _confirm(doc: dict) -> dict:
    """Asks Teya for the session state; never trusts the browser or the webhook body alone."""
    if doc["status"] == "pending" and doc.get("teya_session_id"):
        try:
            s = await teya.get_session(doc["teya_session_id"])
        except teya.TeyaError:
            return doc
        status = s.get("session_status")
        paid = status == "COMPLETED" and s.get("payment_status") == "SUCCESS"
        amount = s.get("amount") or {}
        if paid and (amount.get("value") != doc["total"] * 100 or amount.get("currency") != "CZK"):
            logger.error("Teya amount mismatch for %s: %s", doc["ref"], amount)
            paid, status = False, "MISMATCH"
        update = None
        if paid:
            update = {"status": "paid", "paid_at": datetime.now(timezone.utc), "teya_transaction_id": s.get("transaction_id"),
                      "number": await _next_number(doc["date"])}
        elif status in ("COMPLETED", "MISMATCH"):
            update = {"status": "failed"}
        elif status == "EXPIRED":
            update = {"status": "expired"}
        if update:
            doc = await db.orders.find_one_and_update({"ref": doc["ref"], "status": "pending"}, {"$set": update}, return_document=True) \
                or await db.orders.find_one({"ref": doc["ref"]})
    if doc["status"] == "paid" and doc.get("sms_state") != "sent":
        doc = await _notify(doc)
    return doc


@router.get("/ordering/status")
async def ordering_status():
    s = await _settings()
    slots = _slots(s) if s["enabled"] else []
    return {"accepting": bool(s["enabled"] and slots and teya.configured()), "enabled": s["enabled"], "slots": slots,
            "open": s["open"], "close": s["close"]}


@router.post("/orders/start")
async def start_order(body: OrderStart, request: Request):
    if not teya.configured():
        raise HTTPException(status_code=503, detail="payments_not_configured")
    s = await _settings()
    if not s["enabled"]:
        raise HTTPException(status_code=409, detail="ordering_closed")
    if body.pickup not in _slots(s):
        raise HTTPException(status_code=409, detail="pickup_unavailable")
    lines, total = await _price(body.lines)
    site = _site_url(request)
    ref = await _new_ref()
    doc = {"ref": ref, "status": "pending", "created_at": datetime.now(timezone.utc), "date": datetime.now(PRAGUE).date().isoformat(),
           "pickup": body.pickup, "name": body.name, "phone": body.phone, "email": body.email, "note": body.note, "lang": body.lang,
           "lines": lines, "total": total, "sms_state": None}
    await db.orders.insert_one(doc)

    done = f"{site}{'/en/order/done/' if body.lang == 'en' else '/objednavka/hotovo/'}?ref={ref}"
    back = f"{site}{'/en/order/' if body.lang == 'en' else '/objednavka/'}?cancelled={ref}"
    phone = re.sub(r"[^\d+]", "", body.phone)
    session_body = {
        "type": "SALE",
        "amount": {"currency": "CZK", "value": total * 100},
        "line_items": [{"description": f"{line['name']}{' – ' + line['label'] if line['label'] else ''}"[:120], "quantity": line["qty"],
                        "unit_price": line["price"] * 100} for line in lines],
        "merchant_reference": ref,
        "metadata": {"ref": ref},
        "customer": {"email": body.email, "name": body.name, **({"phone_number": phone} if phone.startswith("+") else {})},
        "language": "en-GB" if body.lang == "en" else "cs-CZ",
        "success_url": done,
        "failure_url": done,
        "cancel_url": back,
        "post_success_payment": "REDIRECT",
    }
    try:
        session = await teya.create_session(session_body, idempotency_key=ref)
    except teya.TeyaError:
        await db.orders.update_one({"ref": ref}, {"$set": {"status": "failed", "error": "session_create_failed"}})
        raise HTTPException(status_code=502, detail="payment_unavailable")
    await db.orders.update_one({"ref": ref}, {"$set": {"teya_session_id": session["session_id"]}})
    return {"ref": ref, "redirectUrl": session["session_url"]}


@router.get("/orders/status/{ref}")
async def order_status(ref: str):
    doc = await db.orders.find_one({"ref": ref.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="not_found")
    return _public(await _confirm(doc))


@router.post("/orders/teya-webhook")
async def teya_webhook(request: Request, background: BackgroundTasks):
    body = await request.body()
    if teya.webhook_key_configured() and not teya.verify_webhook(body, request.headers.get("x-teya-signature", "")):
        raise HTTPException(status_code=401, detail="invalid_signature")
    try:
        data = (await request.json()).get("data") or {}
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid_body")
    query = {"teya_session_id": data["session_id"]} if data.get("session_id") else {"ref": data.get("merchant_reference")}
    doc = await db.orders.find_one(query) if any(query.values()) else None
    if not doc:
        return {"status": "ignored"}
    # Answer within Teya's 30 s; the payment itself is re-checked with Teya before the order counts as paid.
    background.add_task(_confirm, doc)
    return {"status": "accepted"}


@router.get("/admin/orders")
async def admin_orders(date: Optional[str] = None, _: User = Depends(get_current_user)):
    day = date or datetime.now(PRAGUE).date().isoformat()
    docs = await db.orders.find({"date": day, "status": {"$in": ["paid", "done"]}}).sort([("pickup", 1), ("number", 1)]).to_list(500)
    return {"date": day, "orders": [{**_public(d), "phone": d["phone"], "email": d["email"], "note": d.get("note") or "",
                                     "sms_state": d.get("sms_state")} for d in docs]}


@router.put("/admin/orders/{ref}/done")
async def admin_order_done(ref: str, _: User = Depends(get_current_user)):
    res = await db.orders.update_one({"ref": ref, "status": {"$in": ["paid", "done"]}}, {"$set": {"status": "done"}})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")
    return {"ok": True}


@router.get("/admin/ordering")
async def admin_get_ordering(_: User = Depends(get_current_user)):
    s = await _settings()
    return {**{k: s[k] for k in ("enabled", "open", "close", "lead_minutes")}, "payments": teya.configured(),
            "sms": gosms.configured() and bool(ORDER_SMS_TO)}


@router.put("/admin/ordering")
async def admin_put_ordering(body: OrderingSettings, _: User = Depends(get_current_user)):
    await db.settings.update_one({"_id": "ordering"}, {"$set": body.model_dump()}, upsert=True)
    return await admin_get_ordering(_)
