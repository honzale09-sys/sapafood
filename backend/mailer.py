"""Order confirmation e-mails over SMTP: any mailbox or sending service (e.g. Resend SMTP) works."""
import asyncio
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr, formatdate, make_msgid

HOST = os.environ.get("SMTP_HOST")
PORT = int(os.environ.get("SMTP_PORT") or 465)
USER = os.environ.get("SMTP_USER")
PASSWORD = os.environ.get("SMTP_PASSWORD")
FROM = os.environ.get("MAIL_FROM") or USER
REPLY_TO = os.environ.get("MAIL_REPLY_TO")


class MailError(Exception):
    pass


def configured() -> bool:
    return bool(HOST and FROM)


def _send(msg: EmailMessage) -> None:
    # 465 is SMTP over TLS; other ports (587, 25) upgrade with STARTTLS.
    if PORT == 465:
        server = smtplib.SMTP_SSL(HOST, PORT, timeout=20, context=ssl.create_default_context())
    else:
        server = smtplib.SMTP(HOST, PORT, timeout=20)
        server.starttls(context=ssl.create_default_context())
    with server:
        if USER and PASSWORD:
            server.login(USER, PASSWORD)
        server.send_message(msg)


async def send(to: str, subject: str, text: str, html: str) -> None:
    if not configured():
        raise MailError("mail_not_configured")
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr(("Sapa Food", FROM))
    msg["To"] = to
    # smtplib adds no Date header, and spam filters count a missing one against the message.
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=FROM.split("@")[-1])
    # Marks it as an automatic transactional message, so mail servers don't send out-of-office replies to it.
    msg["Auto-Submitted"] = "auto-generated"
    if REPLY_TO:
        msg["Reply-To"] = REPLY_TO
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    try:
        await asyncio.to_thread(_send, msg)
    except (smtplib.SMTPException, OSError) as e:
        raise MailError(type(e).__name__) from e
