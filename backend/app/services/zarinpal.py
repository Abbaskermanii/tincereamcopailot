import httpx

from app.core.config import get_settings

SANDBOX_BASE = "https://sandbox.zarinpal.com/pg/v4/payment"
PROD_BASE = "https://payment.zarinpal.com/pg/v4/payment"
SANDBOX_PAYPAGE = "https://sandbox.zarinpal.com/pg/StartPay/"
PROD_PAYPAGE = "https://payment.zarinpal.com/pg/StartPay/"


class ZarinPalError(Exception):
    """Raised when the gateway returns an unexpected/error payload."""


def _base() -> tuple[str, str]:
    s = get_settings()
    if s.zarinpal_sandbox:
        return SANDBOX_BASE, SANDBOX_PAYPAGE
    return PROD_BASE, PROD_PAYPAGE


async def request_payment(
    amount_rials: int,
    callback_url: str,
    description: str,
) -> tuple[str, str]:
    """Create a payment request. Returns (authority, paypage_url)."""
    base, paypage = _base()
    s = get_settings()
    payload = {
        "merchant_id": s.zarinpal_merchant_id,
        "amount": amount_rials,
        "callback_url": callback_url,
        "description": description,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.post(f"{base}/request.json", json=payload)
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise ZarinPalError(f"gateway unreachable: {exc}") from exc

    data = resp.json().get("data") or {}
    authority = data.get("authority")
    code = data.get("code")
    if not authority or code != 100:
        raise ZarinPalError(f"request rejected: {resp.json().get('errors') or data}")
    return authority, f"{paypage}{authority}"


async def verify_payment(amount_rials: int, authority: str) -> tuple[bool, str | None]:
    """Verify a completed payment. Returns (verified, ref_id)."""
    base, _ = _base()
    s = get_settings()
    payload = {
        "merchant_id": s.zarinpal_merchant_id,
        "amount": amount_rials,
        "authority": authority,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.post(f"{base}/verify.json", json=payload)
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise ZarinPalError(f"gateway unreachable: {exc}") from exc

    body = resp.json()
    data = body.get("data") or {}
    # code 100 = verified, 101 = already verified
    if data.get("code") in (100, 101):
        return True, data.get("ref_id")
    return False, None
