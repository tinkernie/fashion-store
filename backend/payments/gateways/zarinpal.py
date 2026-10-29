import uuid

import uuid

import requests
from django.conf import settings
from django.urls import reverse
from common.exceptions import BusinessException
from payments.selectors import PaymentSelector

SANDBOX_HOST = "sandbox.zarinpal.com"
PRODUCTION_HOST = "payment.zarinpal.com"
# Sandbox accepts any UUID v4 as merchant id; used when none is configured.
SANDBOX_FALLBACK_MERCHANT = "9d15c1e2-2f7e-4a3f-9b1e-2c6b45af31d7"

# Zarinpal verify codes that mean the payment is confirmed.
# 100 = verified now, 101 = verified earlier (repeat callback).
_VERIFIED_CODES = (100, 101)


class ZarinpalGateway:
    """Zarinpal PG v4 gateway (sandbox toggle via settings.ZARINPAL_SANDBOX)."""

    def _api_base(self) -> str:
        host = SANDBOX_HOST if getattr(settings, "ZARINPAL_SANDBOX", True) else PRODUCTION_HOST
        return f"https://{host}"

    def _merchant_id(self) -> str:
        merchant_id = getattr(settings, "ZARINPAL_MERCHANT_ID", "")
        if not merchant_id:
            if getattr(settings, "ZARINPAL_SANDBOX", True):
                return SANDBOX_FALLBACK_MERCHANT
            raise BusinessException("ZARINPAL_MERCHANT_ID is not configured.", code="zarinpal_unconfigured")
        return merchant_id

    def _callback_url(self, request) -> str:
        path = reverse("payment-callback-result", kwargs={"gateway": "zarinpal"})
        if request is not None:
            return request.build_absolute_uri(path)
        return f"http://localhost:8000{path}"

    def create_transaction(self, payment, order, request=None) -> dict:
        base = self._api_base()
        payload = {
            "merchant_id": self._merchant_id(),
            "amount": int(round(float(payment.amount))),
            "currency": getattr(settings, "ZARINPAL_CURRENCY", "IRT"),
            "callback_url": self._callback_url(request),
            "description": f"پرداخت سفارش {order.order_number} - ماوی پوش",
            "metadata": {
                "order_id": order.order_number,
                "mobile": getattr(payment.user, "phone_number", "") or "",
            },
        }
        try:
            response = requests.post(
                f"{base}/pg/v4/payment/request.json",
                json=payload,
                timeout=15,
            )
            response.raise_for_status()
            body = response.json()
        except (requests.RequestException, OSError):
            raise BusinessException(
                "Payment initiation failed. Please try again.",
                code="zarinpal_unreachable",
            )
        data = body.get("data") or {}
        # Zarinpal errors can arrive via HTTP status, an errors array, or the
        # data.code != 100 — all three must be checked (v4 has no fixed
        # top-level "status" field in real responses).
        if data.get("code") != 100:
            raise BusinessException(
                "Payment initiation rejected by gateway.",
                code="zarinpal_request_failed",
            )
        authority = data.get("authority")
        startpay = f"{base}/pg/StartPay/{authority}"
        return {
            "gateway_reference": f"zarinpal-{authority[-12:]}",
            "authority": authority,
            "status": "pending",
            "raw_response": {
                "code": data.get("code"),
                "authority": authority,
                "redirect_url": startpay,
                "base": base,
            },
        }

    def verify_callback(self, request_data: dict) -> dict:
        params = {str(k).lower(): v for k, v in (request_data or {}).items()}
        authority = params.get("authority") or params.get("aauthority")
        status_param = (params.get("status") or "").upper()
        if not authority:
            raise BusinessException("Callback missing authority.", code="zarinpal_no_authority")
        payment = PaymentSelector.get_payment_by_authority(authority)
        if payment is None:
            raise BusinessException("Payment not found for this authority.", code="zarinpal_unknown_authority")
        raw = {"authority": authority, "status_param": status_param}
        if status_param != "OK":
            return {"authority": authority, "gateway_reference": None, "status": "failed", "raw_response": raw}
        base = self._api_base()
        try:
            response = requests.post(
                f"{base}/pg/v4/payment/verify.json",
                json={
                    "merchant_id": self._merchant_id(),
                    "amount": int(round(float(payment.amount))),
                    "authority": authority,
                },
                timeout=15,
            )
            response.raise_for_status()
            body = response.json()
        except (requests.RequestException, OSError):
            raise BusinessException("Payment verification failed. Try again shortly.", code="zarinpal_verify_unreachable")
        data = body.get("data") or {}
        code = data.get("code")
        raw["verify"] = {"code": code, "ref_id": data.get("ref_id"), "card_pan": data.get("card_pan"), "fee": data.get("fee")}
        succeeded = code in _VERIFIED_CODES
        ref_id = data.get("ref_id")
        return {
            "authority": authority,
            "gateway_reference": str(ref_id) if succeeded and ref_id else None,
            "status": "succeeded" if succeeded else "failed",
            "raw_response": raw,
        }
