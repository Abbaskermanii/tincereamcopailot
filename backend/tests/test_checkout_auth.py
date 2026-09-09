"""Integration tests: checkout auth enforcement + address_id linking."""

import pytest
from sqlmodel import select

from app.models import Address, Order, User
from app.core.security import create_access_token, hash_password

pytestmark = pytest.mark.asyncio


async def _make_user_and_headers(session, email="buyer@example.com", full_name="Test Buyer"):
    """Create a user directly in DB and return (user_row, auth_headers)."""
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        session.delete(existing)
        session.commit()
    user = User(
        email=email,
        password_hash=hash_password("Str0ngP@ss"),
        full_name=full_name,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


class TestCheckoutAuth:
    async def test_no_auth_returns_401(self, client, sample_product):
        """POST /orders without any auth token must return 401."""
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer_name": "Guest",
            "phone": "09121234567",
            "address": "Tehran, Vali-Asr 12",
            "city": "Tehran",
            "province": "Tehran",
            "postal_code": "1234567890",
        }
        resp = await client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 401

    async def test_with_auth_and_own_address_id_returns_201(
        self, client, session, sample_product
    ):
        """Authenticated user creating order with their own address_id succeeds."""
        user, headers = await _make_user_and_headers(session)
        # Create an address for this user directly in DB
        addr = Address(
            user_id=user.id,
            recipient_name="\u0622\u0631\u0634 \u0631\u0636\u0627\u06cc",
            phone="09121234567",
            address="\u062a\u0647\u0631\u0627\u0646\u060c \u062e\u06cc\u0627\u0628\u0627\u0646 \u0648\u0644\u06cc\u0639\u0635\u0631\u060c \u067e\u0644\u0627\u06a9 \u06f1\u06f2",
            city="\u062a\u0647\u0631\u0627\u0646",
            province="\u062a\u0647\u0631\u0627\u0646",
            postal_code="1234567890",
            is_default=True,
        )
        session.add(addr)
        session.commit()
        session.refresh(addr)
        address_id = addr.id

        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "address_id": address_id,
            "email": "buyer@example.com",
        }
        resp = await client.post("/api/v1/orders", json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["status"] == "pending"
        # Verify order was created with snapshot from address
        order = session.exec(
            select(Order).where(Order.order_number == body["order_number"])
        ).first()
        assert order is not None
        assert order.address_id == address_id
        assert order.customer_name == "\u0622\u0631\u0634 \u0631\u0636\u0627\u06cc"  # recipient_name snapshot

    async def test_with_auth_and_other_user_address_id_returns_404(
        self, client, session, sample_product
    ):
        """Using address_id belonging to another user returns 404 (no enumeration)."""
        # Create user A with an address
        user_a, headers_a = await _make_user_and_headers(
            session, email="user_a@example.com", full_name="User A"
        )
        addr_a = Address(
            user_id=user_a.id,
            recipient_name="User A Addr",
            phone="09120000001",
            address="Address A",
            city="Tehran",
            province="Tehran",
            postal_code="1111111111",
        )
        session.add(addr_a)
        session.commit()
        session.refresh(addr_a)
        address_id_a = addr_a.id

        # Create user B and try to use A's address
        user_b, headers_b = await _make_user_and_headers(
            session, email="user_b@example.com", full_name="User B"
        )
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "address_id": address_id_a,
        }
        resp = await client.post("/api/v1/orders", json=payload, headers=headers_b)
        assert resp.status_code == 404

    async def test_with_auth_and_inline_fields_returns_201(
        self, client, session, sample_product
    ):
        """Authenticated user with inline address fields (no address_id) still works."""
        user, headers = await _make_user_and_headers(session)
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer_name": "\u0645\u0631\u06cc\u0645 \u06a9\u0627\u0638\u0645\u06cc",
            "phone": "09351112233",
            "address": "\u0627\u0635\u0641\u0647\u0627\u0646\u060c \u062e\u06cc\u0627\u0628\u0627\u0646 \u0686\u0647\u0627\u0631\u0628\u0627\u063a \u0628\u0627\u0644\u0627",
            "city": "\u0627\u0635\u0641\u0647\u0627\u0646",
            "province": "\u0627\u0635\u0641\u0647\u0627\u0646",
            "postal_code": "8173764445",
        }
        resp = await client.post("/api/v1/orders", json=payload, headers=headers)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["status"] == "pending"

    async def test_with_auth_and_incomplete_inline_returns_422(
        self, client, session, sample_product
    ):
        """Authenticated user with incomplete inline address fields returns 422."""
        user, headers = await _make_user_and_headers(session)
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer_name": "Test",
            # phone, address, city, province, postal_code all missing
        }
        resp = await client.post("/api/v1/orders", json=payload, headers=headers)
        assert resp.status_code == 422

    async def test_with_auth_and_nonexistent_address_id_returns_404(
        self, client, session, sample_product
    ):
        """Using a non-existent address_id returns 404."""
        user, headers = await _make_user_and_headers(session)
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "address_id": "00000000-0000-0000-0000-000000000000",
        }
        resp = await client.post("/api/v1/orders", json=payload, headers=headers)
        assert resp.status_code == 404
