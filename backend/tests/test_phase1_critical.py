"""Phase 1 Critical Fixes — regression tests for C1-C7.

These tests verify each critical audit fix and must all pass before Phase 1 is
marked complete. They run against the isolated Postgres test DB (same as other
integration tests) and are intentionally exhaustive.

C1 — Variant overselling must be impossible under concurrency
C2 — Coupon per-user limit enforced at checkout and via validate endpoint
C3 — GET /orders/{order_number}/pay requires ownership
C4 — Production config validation aborts on insecure defaults
C6 — JWTs carry jti, refresh uses distinct secret
C7 — OTP debug_code never leaks in production
"""

import asyncio
import os
from datetime import timedelta
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel import Session, select
from sqlalchemy import func

from app.core.config import Settings, get_settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.session import engine as app_engine
from app.main import app
from app.models import (
    Coupon,
    CouponRedemption,
    DiscountType,
    Order,
    Product,
    ProductVariant,
    User,
)
from app.models.base import utcnow
from app.services.orders import create_order, OrderError

# ---------- helpers ----------
def _make_user(session: Session, email: str, is_admin: bool = False) -> User:
    from app.core.security import hash_password

    u = User(email=email.lower(), password_hash=hash_password("Secret123!"), full_name="Test", is_admin=is_admin)
    session.add(u)
    session.commit()
    session.refresh(u)
    return u


def _auth_header(user: User) -> dict:
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


def _make_coupon(session: Session, code="LIMITED1", **kw):
    base = dict(
        code=code,
        discount_type=DiscountType.percentage,
        discount_value=15,
        min_order_amount=0,
        expires_at=utcnow() + timedelta(days=7),
        usage_limit=0,
        used_count=0,
        per_user_limit=kw.pop("per_user_limit", 0),
        is_active=True,
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


# ---------- C1: Variant race ----------
async def test_variant_concurrent_no_oversell(sample_product, seeded_session):
    """Two concurrent buyers race for a variant with stock 1 — only one may win."""
    # Ensure product has a variant with stock 1
    with Session(app_engine) as s:
        product = s.exec(select(Product).where(Product.id == sample_product["id"])).one()
        # Clean any existing variants for determinism
        for v in s.exec(select(ProductVariant).where(ProductVariant.product_id == product.id)).all():
            s.delete(v)
        s.commit()
        variant = ProductVariant(
            product_id=product.id, name="رنگ: فیروزه‌ای", sku=f"SKU-VARIANT-RACE-{product.id[:6]}",
            stock_qty=1, is_active=True,
        )
        s.add(variant)
        s.commit()
        s.refresh(variant)
        variant_id = variant.id
        product_id = product.id

    customer = {
        "customer_name": "buyer-variant",
        "phone": "09123334455",
        "address": "tabriz st 4, unit 2, floor 1",
        "city": "tabriz",
        "province": "azarbayjan",
        "postal_code": "5164778899",
    }

    results: list = []

    async def buyer():
        loop = asyncio.get_running_loop()

        def blocking():
            with Session(app_engine) as sess:
                try:
                    order, _ = create_order(
                        sess,
                        [{"product_id": product_id, "quantity": 1}],
                        None,
                        dict(customer),
                        variant_selections={product_id: variant_id},
                    )
                    sess.commit()
                    return ("ok", order.order_number)
                except OrderError:
                    sess.rollback()
                    return ("fail", "stock")

        results.append(await loop.run_in_executor(None, blocking))

    await asyncio.gather(buyer(), buyer())

    outcomes = [r[0] for r in results]
    assert outcomes.count("ok") == 1, f"expected exactly one success, got {outcomes}"
    assert outcomes.count("fail") == 1

    with Session(app_engine) as verify:
        v = verify.exec(select(ProductVariant).where(ProductVariant.id == variant_id)).one()
        assert v.stock_qty == 0


# ---------- C2: Coupon per-user limit ----------
async def test_coupon_per_user_limit_at_checkout(seeded_session, sample_product):
    coupon = _make_coupon(seeded_session, code="PERUSER1", per_user_limit=1, discount_value=10)
    # Create an authenticated user
    with Session(app_engine) as s:
        user = _make_user(s, "coupon_user@test.local")
        user_id = user.id

    # Need a client that sends auth header for this user — we use dependency override via HTTP
    from app.db.session import get_session

    def override():
        with Session(app_engine) as sess:
            yield sess

    app.dependency_overrides[get_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer_name": "مریم کاظمی",
            "phone": "09351112233",
            "address": "اصفهان، خیابان چهارباغ بالا، کوچه گلستان، پلاک ۷",
            "city": "اصفهان",
            "province": "اصفهان",
            "postal_code": "8173764445",
            "coupon_code": "PERUSER1",
        }
        # Build real header via helper
        with Session(app_engine) as s:
            real_user = s.get(User, user_id)
            h = _auth_header(real_user)
        # First checkout as authenticated user — should succeed
        r1 = await client.post("/api/v1/orders", json=payload, headers=h)
        assert r1.status_code == 201, r1.text

        # Second checkout with same coupon + same user — must be rejected
        r2 = await client.post("/api/v1/orders", json=payload, headers=h)
        assert r2.status_code == 400
        assert "سهمیه" in r2.json()["detail"] or "سهمیه" in r2.text

        # Validate endpoint must also report per-user exhaustion for authenticated user
        v = await client.post("/api/v1/coupons/validate", json={"code": "PERUSER1", "order_total": 1000000}, headers=h)
        assert v.status_code == 200
        assert v.json()["valid"] is False
        assert "سهمیه" in v.json()["message"]

        # Anonymous user should still be able to validate (per_user_limit not checked for guest)
        v2 = await client.post("/api/v1/coupons/validate", json={"code": "PERUSER1", "order_total": 1000000})
        assert v2.json()["valid"] is True

    app.dependency_overrides.clear()


async def test_coupon_validate_per_user_without_auth_allows(seeded_session):
    """Anonymous validate should not count per_user_limit."""
    _make_coupon(seeded_session, code="ANONOK", per_user_limit=1, discount_value=10)
    from app.db.session import get_session

    def override():
        with Session(app_engine) as s:
            yield s

    app.dependency_overrides[get_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/coupons/validate", json={"code": "ANONOK", "order_total": 500000})
        assert resp.json()["valid"] is True
    app.dependency_overrides.clear()


# ---------- C3: Pay endpoint ownership ----------
async def test_pay_endpoint_requires_ownership(seeded_session, sample_product):
    from app.db.session import get_session

    # Create two users
    with Session(app_engine) as s:
        owner = _make_user(s, "owner_pay@test.local")
        attacker = _make_user(s, "attacker_pay@test.local")
        owner_id, attacker_id = owner.id, attacker.id

    def override():
        with Session(app_engine) as s:
            yield s

    app.dependency_overrides[get_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create an order owned by owner
        with Session(app_engine) as s:
            o = s.get(User, owner_id)
            oh = _auth_header(o)
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer_name": "مالک سفارش",
            "phone": "09121234567",
            "address": "تهران، خیابان آزادی، پلاک ۱۰",
            "city": "تهران",
            "province": "تهران",
            "postal_code": "1234567890",
        }
        created = (await client.post("/api/v1/orders", json=payload, headers=oh)).json()
        order_number = created["order_number"]

        # Attacker tries to re-initiate payment — must be forbidden
        with Session(app_engine) as s:
            ah = _auth_header(s.get(User, attacker_id))
        resp_attack = await client.get(f"/api/v1/orders/{order_number}/pay", headers=ah)
        assert resp_attack.status_code == 403

        # Anonymous tries to pay owned order — must be 401
        resp_anon = await client.get(f"/api/v1/orders/{order_number}/pay")
        assert resp_anon.status_code == 401

        # Owner can pay — should succeed (mocked gateway returns payment_url)
        # Patch request_payment for this specific test to avoid real gateway call
        import app.api.v1.orders as orders_mod

        async def fake_pay(amount_rials, callback_url, description):
            return "FAKEAUTH123", "https://sandbox.zarinpal.com/pg/StartPay/FAKEAUTH123"

        with patch.object(orders_mod, "request_payment", fake_pay):
            resp_owner = await client.get(f"/api/v1/orders/{order_number}/pay", headers=oh)
            assert resp_owner.status_code == 200
            assert "payment_url" in resp_owner.json()

    app.dependency_overrides.clear()


async def test_guest_order_pay_still_allowed(sample_product):
    """Guest orders (user_id NULL) should still be payable without auth (order_number is secret)."""
    from app.db.session import get_session

    def override():
        with Session(app_engine) as s:
            yield s

    app.dependency_overrides[get_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer_name": "مهمان",
            "phone": "09121112222",
            "address": "شیراز، بلوار زند، ساختمان نیلوفر",
            "city": "شیراز",
            "province": "فارس",
            "postal_code": "7134845566",
        }
        created = (await client.post("/api/v1/orders", json=payload)).json()
        order_number = created["order_number"]

        import app.api.v1.orders as orders_mod

        async def fake_pay(amount_rials, callback_url, description):
            return "GUESTAUTH", "https://sandbox.zarinpal.com/pg/StartPay/GUESTAUTH"

        with patch.object(orders_mod, "request_payment", fake_pay):
            resp = await client.get(f"/api/v1/orders/{order_number}/pay")
            assert resp.status_code == 200

    app.dependency_overrides.clear()


# ---------- C4: Production config validation ----------
def test_production_config_rejects_insecure_defaults():
    s = Settings(
        environment="production",
        secret_key="change-me-in-production",
        admin_password="admin123",
        seed_admin_password="admin1234",
        auth_cookies_secure=False,
        sms_debug=True,
        s3_access_key="minioadmin",
        s3_secret_key="minioadmin123",
    )
    try:
        s.validate_production_settings()
        assert False, "should have raised RuntimeError"
    except RuntimeError as exc:
        msg = str(exc)
        assert "SECRET_KEY" in msg
        assert "ADMIN_PASSWORD" in msg
        assert "AUTH_COOKIES_SECURE" in msg
        assert "SMS_DEBUG" in msg


def test_production_config_accepts_strong_values():
    s = Settings(
        environment="production",
        secret_key="a" * 40,
        refresh_secret_key="b" * 40,
        admin_password="Str0ng!Passw0rd#2026",
        seed_admin_password="AnotherStr0ng#99",
        auth_cookies_secure=True,
        sms_debug=False,
        s3_access_key="real-access-key",
        s3_secret_key="real-secret-key-long-enough",
    )
    # Should not raise
    s.validate_production_settings()


# ---------- C6: JWT jti + separate secrets ----------
def test_jwt_has_jti_and_type():
    tok = create_access_token("user-123")
    payload = decode_token(tok, expected_type="access")
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"
    assert "jti" in payload

    rtok = create_refresh_token("user-123")
    rpayload = decode_token(rtok, expected_type="refresh")
    assert rpayload["type"] == "refresh"
    assert "jti" in rpayload


def test_refresh_token_uses_separate_secret(monkeypatch):
    # Configure distinct secrets and ensure tokens are bound to correct secret
    import app.core.config as cfg

    # Build a Settings with distinct secrets without touching the global cache
    s = Settings(
        environment="development",
        secret_key="a" * 32,
        refresh_secret_key="b" * 32,
    )
    monkeypatch.setattr(cfg, "get_settings", lambda: s)
    # Need to clear jose cache — just create new tokens under patched settings
    from app.core import security as sec

    atok = sec.create_access_token("u1")
    rtok = sec.create_refresh_token("u1")
    # Access token must decode as access, not as refresh with same secret
    assert sec.decode_token(atok, expected_type="access")["sub"] == "u1"
    assert sec.decode_token(rtok, expected_type="refresh")["sub"] == "u1"
    # Cross-type must fail
    with pytest.raises(Exception):
        sec.decode_token(atok, expected_type="refresh")
    with pytest.raises(Exception):
        sec.decode_token(rtok, expected_type="access")


# ---------- C7: OTP debug leak ----------
async def test_otp_debug_not_leaked_in_production(monkeypatch):
    from app.db.session import get_session

    # Force production + sms_debug=True
    s = Settings(environment="production", sms_debug=True, secret_key="a" * 32, admin_password="x" * 12, seed_admin_password="y" * 12, auth_cookies_secure=True, s3_access_key="k1", s3_secret_key="k2")
    import app.core.config as cfg
    import app.api.v1.auth as auth_mod

    monkeypatch.setattr(cfg, "get_settings", lambda: s)
    monkeypatch.setattr(auth_mod, "get_settings", lambda: s)

    # Stub SMS sending to avoid external call
    async def fake_sms(phone, msg):
        return True

    monkeypatch.setattr(auth_mod.notifier, "send_sms", fake_sms)

    def override():
        with Session(app_engine) as sess:
            yield sess

    app.dependency_overrides[get_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/auth/otp/request", json={"phone": "09121111111", "purpose": "login"})
        assert resp.status_code == 200
        body = resp.json()
        assert "debug_code" not in body, "debug_code must never be returned in production"

    app.dependency_overrides.clear()


async def test_otp_debug_leaked_in_development(monkeypatch):
    from app.db.session import get_session

    s = Settings(environment="development", sms_debug=True, secret_key="a" * 32)
    import app.core.config as cfg
    import app.api.v1.auth as auth_mod

    monkeypatch.setattr(cfg, "get_settings", lambda: s)
    monkeypatch.setattr(auth_mod, "get_settings", lambda: s)

    async def fake_sms(phone, msg):
        return True

    monkeypatch.setattr(auth_mod.notifier, "send_sms", fake_sms)

    def override():
        with Session(app_engine) as sess:
            yield sess

    app.dependency_overrides[get_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/auth/otp/request", json={"phone": "09121111112", "purpose": "login"})
        assert resp.status_code == 200
        assert "debug_code" in resp.json()

    app.dependency_overrides.clear()
