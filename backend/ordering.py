"""Online orders for pickup: priced from the menu on the server, paid by card through Teya Hosted Checkout
or at the counter on pickup. Once an order is confirmed (card payment verified with Teya, or straight away
when paying at pickup) the restaurant gets an SMS (GoSMS) and the customer a confirmation e-mail (SMTP)."""
import html
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
import mailer
import teya_client as teya
from auth import get_current_user
from db import db
from models import User, daily_item_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["orders"])

PRAGUE = ZoneInfo("Europe/Prague")
PUBLIC_SITE_URL = (os.environ.get("PUBLIC_SITE_URL") or "").rstrip("/")
ORDER_SMS_TO = [n.strip() for n in (os.environ.get("ORDER_SMS_TO") or "").split(",") if n.strip()]
PHONE_RE = re.compile(r"^\+?[0-9 ]{9,17}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HHMM_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
SMS_RETRY_SECONDS = 120
# Orders the kitchen should make: paid by card, or placed to be paid at pickup.
CONFIRMED = ("paid", "confirmed")
# Unpaid pickup orders cost the kitchen food if nobody comes, so one phone number gets only a few a day.
STORE_ORDERS_PER_PHONE = 3

# Editable in the admin; the hours match the opening hours on the site.
DEFAULTS = {"enabled": True, "pay_store": True, "open": "10:30", "close": "22:30", "lead_minutes": 20, "step_minutes": 15,
            "last_before_close": 15}


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
    payment: Literal["card", "store"] = "card"

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
    pay_store: bool = True
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
    daily = [line for line in lines if line.item_id.startswith("daily-")]
    regular = [line for line in lines if not line.item_id.startswith("daily-")]
    if not all(ObjectId.is_valid(line.item_id) for line in regular):
        raise HTTPException(status_code=409, detail="item_unavailable")
    ids = [ObjectId(line.item_id) for line in regular]
    docs = {str(d["_id"]): d for d in await db.menu_items.find({"_id": {"$in": ids}, "visible": True}).to_list(200)} if ids else {}
    if daily:
        # Only today's published daily menu can be ordered; its dishes have no number or variants.
        today = datetime.now(PRAGUE).date().isoformat()
        menu = await db.daily_menus.find_one({"date": today, "published": True}) or {}
        for i, it in enumerate(menu.get("items") or []):
            docs[daily_item_id(today, i, it["name"], it["price"])] = {"name": it["name"], "price": it["price"]}
        if any(line.variant is not None for line in daily):
            raise HTTPException(status_code=409, detail="item_unavailable")
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
    return {"ref": doc["ref"], "number": doc.get("number"), "status": doc["status"], "payment": doc.get("payment", "card"), "pickup": doc["pickup"],
            "total": doc["total"], "name": doc["name"], "mail": mailer.configured(),
            "lines": [{k: line[k] for k in ("number", "name", "name_en", "label", "qty", "price")} for line in doc["lines"]]}


def _sms_text(doc: dict) -> str:
    """For the kitchen, in Vietnamese. gosms.plain() drops the diacritics: 160 characters per SMS part instead of 70."""
    items = "\n".join(f"{line['qty']}x {line['number'] + ' ' if line['number'] else ''}{line['name']}{' (' + line['label'] + ')' if line['label'] else ''}"
                      for line in doc["lines"])
    text = (f"ĐƠN HÀNG SỐ #{doc['number']}\nGiờ lấy: {doc['pickup']}\nTên: {doc['name']}\nSĐT: {doc['phone']}\n"
            f"Món:\n{items}\nTổng: {doc['total']} Kč, {'CHƯA THANH TOÁN - THU TIỀN KHI LẤY' if doc.get('payment') == 'store' else 'ĐÃ THANH TOÁN'}")
    return text + (f"\n\nGhi chú: {doc['note']}" if doc.get("note") else "")


async def _next_number() -> int:
    """Order numbers start at #1 and keep counting up across days, so every confirmed order has its own number."""
    counter = await db.counters.find_one_and_update({"_id": "orders"}, {"$inc": {"n": 1}}, upsert=True, return_document=True)
    return counter["n"]


MAIL_TEXT = {
    "cs": {"subject": "Objednávka č. {n} je potvrzená – Sapa Food", "hello": "Dobrý den, {name},", "intro": "děkujeme, vaši objednávku máme a kuchyně už o ní ví.",
           "number": "Číslo objednávky", "pickup": "Vyzvednutí dnes v", "where": "Sapa Food, Vodičkova 699/28, Praha 1", "total": "Celkem",
           "paid": "Zaplaceno kartou.", "store": "Zaplatíte při vyzvednutí.", "note": "Poznámka", "show": "Při vyzvednutí řekněte číslo objednávky nebo jméno.",
           "contact": "Potřebujete něco změnit? Zavolejte nám na +420 774 994 679 nebo napište na lecongdiencz@gmail.com."},
    "en": {"subject": "Order no. {n} confirmed – Sapa Food", "hello": "Hello {name},", "intro": "thank you, we have your order and the kitchen is on it.",
           "number": "Order number", "pickup": "Pickup today at", "where": "Sapa Food, Vodičkova 699/28, Prague 1", "total": "Total",
           "paid": "Paid by card.", "store": "You pay when you pick it up.", "note": "Note", "show": "When you pick it up, give your order number or name.",
           "contact": "Need to change something? Call us on +420 774 994 679 or write to lecongdiencz@gmail.com."},
}


def _mail(doc: dict):
    """Confirmation for the customer in the language they ordered in: subject, plain text, HTML."""
    en = doc.get("lang") == "en"
    t = MAIL_TEXT["en" if en else "cs"]
    price = lambda v: f"{v} Kč"  # noqa: E731
    rows = [(f"{line['qty']}× {line['number'] + ' ' if line['number'] else ''}{(line['name_en'] if en and line['name_en'] else line['name'])}"
             f"{' (' + line['label'] + ')' if line['label'] else ''}", price(line["price"] * line["qty"])) for line in doc["lines"]]
    pay = t["store"] if doc.get("payment") == "store" else t["paid"]
    note = doc.get("note") or ""
    text = "\n".join([t["hello"].format(name=doc["name"]), t["intro"], "", f"{t['number']}: #{doc['number']}",
                      f"{t['pickup']} {doc['pickup']}, {t['where']}", "", *[f"{a}  {b}" for a, b in rows],
                      f"{t['total']}: {price(doc['total'])}", pay, *([f"{t['note']}: {note}"] if note else []), "", t["show"], t["contact"]])
    e = html.escape
    items = "".join(f'<tr><td style="padding:6px 0">{e(a)}</td><td style="padding:6px 0;text-align:right;white-space:nowrap">{e(b)}</td></tr>' for a, b in rows)
    body = f"""<div style="font-family:Arial,Helvetica,sans-serif;color:#3b2a20;max-width:520px;margin:0 auto;line-height:1.5">
<p>{e(t['hello'].format(name=doc['name']))}<br>{e(t['intro'])}</p>
<p style="margin:24px 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#a3312a">{e(t['number'])}</p>
<p style="margin:0;font-size:40px;font-weight:bold">#{doc['number']}</p>
<p>{e(t['pickup'])} <strong>{e(doc['pickup'])}</strong><br>{e(t['where'])}</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #e5dccf;border-bottom:1px solid #e5dccf">{items}
<tr><td style="padding:8px 0;border-top:1px solid #e5dccf"><strong>{e(t['total'])}</strong></td>
<td style="padding:8px 0;border-top:1px solid #e5dccf;text-align:right"><strong>{e(price(doc['total']))}</strong></td></tr></table>
<p><strong>{e(pay)}</strong></p>{f"<p>{e(t['note'])}: {e(note)}</p>" if note else ""}
<p style="color:#6b5a4e">{e(t['show'])}<br>{e(t['contact'])}</p></div>"""
    return t["subject"].format(n=doc["number"]), text, body


async def _send_sms(doc: dict) -> None:
    if not ORDER_SMS_TO:
        raise gosms.GoSmsError("no_recipient")
    await gosms.send(ORDER_SMS_TO, _sms_text(doc))


async def _send_mail(doc: dict) -> None:
    await mailer.send(doc["email"], *_mail(doc))


async def _deliver(ref: str, key: str, send) -> None:
    """Sends one message (the restaurant SMS or the customer e-mail) once per order. The state switch is atomic,
    so a webhook and a poll can't both send it; a failure is retried on a later status check."""
    claimed = await db.orders.find_one_and_update(
        {"ref": ref, "status": {"$in": list(CONFIRMED)}, "$or": [{f"{key}_state": None},
                                                                 {f"{key}_state": "error", f"{key}_attempt_at": {"$lt": time.time() - SMS_RETRY_SECONDS}}]},
        {"$set": {f"{key}_state": "sending", f"{key}_attempt_at": time.time()}},
        return_document=True,
    )
    if not claimed:
        return
    try:
        await send(claimed)
        update = {f"{key}_state": "sent", f"{key}_error": None}
    except (gosms.GoSmsError, mailer.MailError) as e:
        # The order stays valid and visible in the admin.
        logger.error("Order %s %s failed: %s", ref, key, e)
        update = {f"{key}_state": "error", f"{key}_error": str(e)}
    await db.orders.update_one({"ref": ref}, {"$set": update})


async def _notify(doc: dict) -> dict:
    if doc.get("sms_state") != "sent":
        await _deliver(doc["ref"], "sms", _send_sms)
    if doc.get("mail_state") != "sent":
        await _deliver(doc["ref"], "mail", _send_mail)
    return await db.orders.find_one({"ref": doc["ref"]})


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
                      "number": await _next_number()}
        elif status in ("COMPLETED", "MISMATCH"):
            update = {"status": "failed"}
        elif status == "EXPIRED":
            update = {"status": "expired"}
        if update:
            doc = await db.orders.find_one_and_update({"ref": doc["ref"], "status": "pending"}, {"$set": update}, return_document=True) \
                or await db.orders.find_one({"ref": doc["ref"]})
    if doc["status"] in CONFIRMED and (doc.get("sms_state") != "sent" or doc.get("mail_state") != "sent"):
        doc = await _notify(doc)
    return doc


@router.get("/ordering/status")
async def ordering_status():
    s = await _settings()
    slots = _slots(s) if s["enabled"] else []
    card, store = teya.configured(), s["pay_store"]
    return {"accepting": bool(s["enabled"] and slots and (card or store)), "enabled": s["enabled"], "slots": slots,
            "card": card, "store": store, "open": s["open"], "close": s["close"]}


@router.post("/orders/start")
async def start_order(body: OrderStart, request: Request, background: BackgroundTasks):
    s = await _settings()
    store = body.payment == "store"
    if store and not s["pay_store"]:
        raise HTTPException(status_code=409, detail="pay_store_off")
    if not store and not teya.configured():
        raise HTTPException(status_code=503, detail="payments_not_configured")
    if not s["enabled"]:
        raise HTTPException(status_code=409, detail="ordering_closed")
    if body.pickup not in _slots(s):
        raise HTTPException(status_code=409, detail="pickup_unavailable")
    lines, total = await _price(body.lines)
    today = datetime.now(PRAGUE).date().isoformat()
    if store and await db.orders.count_documents({"date": today, "phone": body.phone, "payment": "store", "status": "confirmed"}) >= STORE_ORDERS_PER_PHONE:
        raise HTTPException(status_code=429, detail="too_many_orders")
    site = None if store else _site_url(request)
    ref = await _new_ref()
    # Unguessable key for every public lookup; the short ref stays for the counter, SMS and e-mail.
    token = secrets.token_urlsafe(24)
    doc = {"ref": ref, "token": token, "status": "pending", "payment": body.payment, "created_at": datetime.now(timezone.utc), "date": today,
           "pickup": body.pickup, "name": body.name, "phone": body.phone, "email": body.email, "note": body.note, "lang": body.lang,
           "lines": lines, "total": total, "sms_state": None, "mail_state": None}
    if store:
        # Nothing to pay online: the order counts straight away and the kitchen and customer are told in the background.
        doc.update(status="confirmed", number=await _next_number())
        await db.orders.insert_one(doc)
        background.add_task(_notify, doc)
        return {"ref": ref, "token": token, "payment": "store"}
    await db.orders.insert_one(doc)

    done = f"{site}{'/en/order/done/' if body.lang == 'en' else '/objednavka/hotovo/'}?t={token}"
    back = f"{site}{'/en/order/' if body.lang == 'en' else '/objednavka/'}?cancelled=1"
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
    return {"ref": ref, "token": token, "redirectUrl": session["session_url"]}


@router.get("/orders/status/{key}")
async def order_status(key: str):
    # New orders only by token; orders created before tokens existed still by their short ref.
    doc = await db.orders.find_one({"token": key}) or await db.orders.find_one({"ref": key.upper(), "token": {"$exists": False}})
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
    docs = await db.orders.find({"date": day, "status": {"$in": [*CONFIRMED, "done"]}}).sort([("pickup", 1), ("number", 1)]).to_list(500)
    return {"date": day, "orders": [{**_public(d), "phone": d["phone"], "email": d["email"], "note": d.get("note") or "",
                                     "sms_state": d.get("sms_state"), "mail_state": d.get("mail_state")} for d in docs]}


@router.put("/admin/orders/{ref}/done")
async def admin_order_done(ref: str, _: User = Depends(get_current_user)):
    res = await db.orders.update_one({"ref": ref, "status": {"$in": [*CONFIRMED, "done"]}}, {"$set": {"status": "done"}})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")
    return {"ok": True}


@router.get("/admin/ordering")
async def admin_get_ordering(_: User = Depends(get_current_user)):
    s = await _settings()
    return {**{k: s[k] for k in ("enabled", "pay_store", "open", "close", "lead_minutes")}, "payments": teya.configured(),
            "sms": gosms.configured() and bool(ORDER_SMS_TO), "mail": mailer.configured()}


@router.put("/admin/ordering")
async def admin_put_ordering(body: OrderingSettings, _: User = Depends(get_current_user)):
    await db.settings.update_one({"_id": "ordering"}, {"$set": body.model_dump()}, upsert=True)
    return await admin_get_ordering(_)
