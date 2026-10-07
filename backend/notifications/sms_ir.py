import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BASE = "https://api.sms.ir/v1"
TIMEOUT = 10


def _headers():
    return {
        "X-API-KEY": settings.SMS_IR_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def send_verify(mobile: str, template_id: int, parameters: list[dict]) -> dict:
    """POST /send/verify - service line, bypasses blacklist. Returns data dict."""
    resp = requests.post(
        f"{BASE}/send/verify",
        json={"mobile": mobile, "templateId": int(template_id), "parameters": parameters},
        headers=_headers(),
        timeout=TIMEOUT,
    )
    payload = resp.json() if resp.content else {}
    if resp.status_code != 200 or payload.get("status") != 1:
        raise RuntimeError(f"sms.ir verify failed {resp.status_code}: {payload}")
    return payload.get("data", {})


def send_bulk(line_number, message_text: str, mobiles: list[str]) -> dict:
    resp = requests.post(
        f"{BASE}/send/bulk",
        json={
            "lineNumber": int(line_number) if str(line_number).isdigit() else line_number,
            "messageText": message_text,
            "mobiles": mobiles,
        },
        headers={**_headers(), "Accept": "application/json"},
        timeout=TIMEOUT,
    )
    payload = resp.json() if resp.content else {}
    if resp.status_code != 200 or payload.get("status") != 1:
        raise RuntimeError(f"sms.ir bulk failed {resp.status_code}: {payload}")
    return payload.get("data", {})


def get_credit():
    resp = requests.get(f"{BASE}/credit", headers=_headers(), timeout=TIMEOUT)
    payload = resp.json() if resp.content else {}
    if resp.status_code != 200 or payload.get("status") != 1:
        raise RuntimeError(f"sms.ir credit failed: {payload}")
    return payload.get("data")
