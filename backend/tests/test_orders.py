"""Integration tests: order creation, coupon validation, status lookup."""

from datetime import timedelta

import pytest
from sqlmodel import select

from app.models import Coupon, DiscountType, Product
from app.models.base import utcnow
from app.services.orders import OrderError, compute_totals  # noqa: F401

pytestmark = pytest.mark.asyncio


def _make_coupon(session, code="WELCOME15", **kw):
    base = dict(
        code=code,
        discount_type=DiscountType.percentage,
        discount_value=15,
        min_order_amount=0,
        expires_at=utcnow() + timedelta(days=7),
        usage_limit=0,
        used_count=0,
    )
    base.update(kw)
    existing = session.exec(select(Coupon).where(Coupon.code == code)).first()
    if existing:
        session.delete(existing)
        session.commit()
    coupon = Coupon(**base)
    session.add(coupon)
    session.commit()
    session.refresh(coupon)
    return coupon


class TestCouponValidateEndpoint:
    async def test_valid_coupon(self, client, seeded_session):
        _make_coupon(seeded_session)
        resp = await client.post(
            "/api/v1/coupons/validate",
            json={"code": "welcome15", "order_total": 1000000},
        )
        body = resp.json()
        assert resp.status_code == 200 and body["valid"] is True
        assert body["discount_amount"] == 150000

    async def test_unknown_coupon(self, client):
        resp = await client.post(
            "/api/v1/coupons/validate",
            json={"code": "GHOST", "order_total": 1000000},
        )
        assert resp.json()["valid"] is False

    async def test_expired_coupon_rejected(self, client, seeded_session):
        _make_coupon(seeded_session, expires_at=utcnow() - timedelta(days=1))
        resp = await client.post(
            "/api/v1/coupons/validate",
            json={"code": "WELCOME15", "order_total": 1000000},
        )
        body = resp.json()
        assert not body["valid"] and "منقضی" in body["message"]

    async def test_min_order_not_met(self, client, seeded_session):
        _make_coupon(seeded_session, min_order_amount=900000)
        resp = await client.post(
            "/api/v1/coupons/validate",
            json={"code": "WELCOME15", "order_total": 100000},
        )
        assert not resp.json()["valid"]

    async def test_usage_limit_exhausted(self, client, seeded_session):
        _make_coupon(seeded_session, usage_limit=2, used_count=2)
        resp = await client.post(
            "/api/v1/coupons/validate",
            json={"code": "WELCOME15", "order_total": 1000000},
        )
        assert not resp.json()["valid"]


class TestCreateOrder:
    async def test_happy_path_creates_pending_order(self, client, sample_product):
        from app.services.orders import FALLBACK_SHIPPING_FEE

        resp = await client.post("/api/v1/orders", json=_payload(sample_product))
        assert resp.status_code == 201
        body = resp.json()
        assert body["status"] == "pending"
        # total includes fallback shipping (55k) when no shipping_method_id is sent
        assert body["total_amount"] == sample_product["price"] + FALLBACK_SHIPPING_FEE
        assert body["payment_url"].startswith("https://sandbox.zarinpal.com/pg/StartPay/")
        assert len(body["items"]) == 1
        assert body["items"][0]["product_name_snapshot"] == sample_product["name"]

    async def test_stock_reserved_at_creation(self, client, seeded_session, sample_product):
        await client.post("/api/v1/orders", json=_payload(sample_product))
        row = seeded_session.exec(select(Product).where(Product.id == sample_product["id"])).one()
        assert row.stock_qty == sample_product["stock_qty"] - 1

    async def test_insufficient_stock_409(self, client, sample_product):
        payload = _payload(sample_product, quantity=sample_product["stock_qty"] + 5)
        resp = await client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 409
        assert "کافی نیست" in str(resp.json())

    async def test_unknown_product_404(self, client, sample_product):
        payload = _payload(sample_product)
        payload["items"] = [{"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1}]
        resp = await client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 404

    async def test_invalid_phone_rejected(self, client, sample_product):
        payload = _payload(sample_product)
        payload["phone"] = "12345"
        resp = await client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 422

    async def test_invalid_postal_code_rejected(self, client, sample_product):
        payload = _payload(sample_product)
        payload["postal_code"] = "abc"
        resp = await client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 422

    async def test_empty_items_rejected(self, client, sample_product):
        payload = _payload(sample_product)
        payload["items"] = []
        resp = await client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 422

    async def test_gift_wrap_increases_total(self, client, sample_product):
        plain = await client.post("/api/v1/orders", json=_payload(sample_product))
        wrapped_payload = _payload(sample_product)
        wrapped_payload["gift_wrap"] = True
        wrapped = await client.post("/api/v1/orders", json=wrapped_payload)
        diff = wrapped.json()["total_amount"] - plain.json()["total_amount"]
        assert diff == 30000

    async def test_coupon_applied_to_order(self, client, seeded_session, sample_product):
        from app.services.orders import FALLBACK_SHIPPING_FEE

        _make_coupon(seeded_session)
        payload = _payload(sample_product)
        payload["coupon_code"] = "WELCOME15"
        resp = await client.post("/api/v1/orders", json=payload)
        body = resp.json()
        expected_discount = round(sample_product["price"] * 0.15)
        assert body["discount_amount"] == expected_discount
        assert body["total_amount"] == sample_product["price"] - expected_discount + FALLBACK_SHIPPING_FEE

    async def test_invalid_coupon_at_checkout_fails(self, client, seeded_session, sample_product):
        _make_coupon(seeded_session, min_order_amount=999999999)
        payload = _payload(sample_product)
        payload["coupon_code"] = "WELCOME15"
        resp = await client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 400


def _payload(sample_product: dict, quantity: int = 1) -> dict:
    return {
        "items": [{"product_id": sample_product["id"], "quantity": quantity}],
        "customer_name": "مریم کاظمی",
        "phone": "09351112233",
        "address": "اصفهان، خیابان چهارباغ بالا، کوچه گلستان، پلاک ۷",
        "city": "اصفهان",
        "province": "اصفهان",
        "postal_code": "8173764445",
    }


class TestOrderStatus:
    async def test_status_lookup(self, client, sample_product):
        created = (await client.post("/api/v1/orders", json=_payload(sample_product))).json()
        resp = await client.get(f"/api/v1/orders/{created['order_number']}/status")
        assert resp.status_code == 200
        assert resp.json()["status"] == "pending"

    async def test_status_unknown_order_404(self, client):
        resp = await client.get("/api/v1/orders/TC-000000-NOPE00/status")
        assert resp.status_code == 404
