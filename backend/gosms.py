"""GoSMS (gosms.eu): text messages to the restaurant's phone. API spec: https://doc.gosms.eu"""
import os
import time
import logging
import unicodedata
import httpx

logger = logging.getLogger(__name__)

API_URL = os.environ.get("GOSMS_API_URL", "https://app.gosms.eu/api")
# The token endpoint lives outside /api, unlike the path in GoSMS's spec suggests.
TOKEN_URL = os.environ.get("GOSMS_TOKEN_URL", "https://app.gosms.eu/oauth/v2/token")
CLIENT_ID = os.environ.get("GOSMS_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOSMS_CLIENT_SECRET")
CHANNEL = os.environ.get("GOSMS_CHANNEL")

_token = None
_token_expires_at = 0.0


class GoSmsError(Exception):
    pass


def configured() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET and CHANNEL)


def plain(text: str) -> str:
    """Without diacritics a message part holds 160 characters instead of 70, so long orders cost fewer SMS."""
    return "".join(ch for ch in unicodedata.normalize("NFKD", text) if not unicodedata.combining(ch)).replace("đ", "d").replace("Đ", "D")


async def _get_token(client: httpx.AsyncClient) -> str:
    global _token, _token_expires_at
    if _token and time.time() < _token_expires_at - 60:
        return _token
    resp = await client.get(TOKEN_URL, params={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "grant_type": "client_credentials"})
    if resp.status_code != 200:
        logger.error("GoSMS token request failed %s", resp.status_code)
        raise GoSmsError("token_error")
    data = resp.json()
    _token = data["access_token"]
    _token_expires_at = time.time() + int(data.get("expires_in", 3600))
    return _token


async def send(recipients: list, message: str) -> dict:
    if not configured():
        raise GoSmsError("gosms_not_configured")
    async with httpx.AsyncClient(timeout=20) as client:
        token = await _get_token(client)
        resp = await client.post(
            f"{API_URL}/v1/messages",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": plain(message), "recipients": recipients, "channel": int(CHANNEL)},
        )
    if resp.status_code != 201:
        logger.error("GoSMS send failed %s: %s", resp.status_code, resp.text[:300])
        raise GoSmsError("send_failed")
    return resp.json()
