"""Payment flow tests: mocked ZarinPal success / failure / timeout paths."""

import pytest
from sqlmodel import select

from app.models import Order, OrderStatus, Product
from app.services.zarinpal import ZarinPalError

pytestmark = pytest.mark.asyncio


async def _create_order(client, sample_product) -> dict:
    payload = {
        "items": [{"product_id": sample_product["id"], "quantity": 1}],
        "customer_name": "سارا محمدی",
        "phone": "09121110000",
        "address": "شیراز، بلوار زند، ساختمان نیلوفر، طبقه ۲",
        "city": "شیراز",
        "province": "فارس",
        "postal_code": "7134845566",
    }
    resp = await client.post("/api/v1/orders", json=payload)
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture()
def patched_verify(monkeypatch):
    """Patch the module-level verify used by the callback route."""
    holder = {}

    def install(verified: bool | Exception):
        async def fake_verify(amount_rials: int, authority: str):
            if isinstance(verified, Exception):
                raise verified
            return verified, "987654"

        holder["fn"] = fake_verify
        import app.api.v1.payments as payments_module

        monkeypatch.setattr(payments_module, "verify_payment", fake_verify)

    return install


class TestPaymentCallback:
    async def test_successful_payment_deducts_stock(
        self, client, seeded_session, sample_product, patched_verify
    ):
        order = await _create_order(client, sample_product)
        patched_verify(True)
        # attach authority: the endpoint already stored it; fetch from DB
        row = seeded_session.exec(
            select(Order).where(Order.order_number == order["order_number"])
        ).one()
        authority = row.payment_authority

        resp = await client.post(
            "/api/v1/payment/callback", json={"Authority": authority, "Status": "OK"}
        )
        body = resp.json()
        assert resp.status_code == 200 and body["ok"] is True

        seeded_session.expire_all()
        paid = seeded_session.exec(select(Order).where(Order.id == row.id)).one()
        assert paid.status == OrderStatus.paid
        assert paid.payment_ref_id == "987654"

        product = seeded_session.exec(
            select(Product).where(Product.id == sample_product["id"])
        ).one()
        assert product.stock_qty == sample_product["stock_qty"] - 1  # stays deducted

    async def test_user_cancellation_cancels_order(self, client, seeded_session, sample_product):
        order = await _create_order(client, sample_product)
        row = seeded_session.exec(
            select(Order).where(Order.order_number == order["order_number"])
        ).one()

        resp = await client.post(
            "/api/v1/payment/callback", json={"Authority": row.payment_authority, "Status": "NOK"}
        )
        body = resp.json()
        assert body["ok"] is False and "لغو" in body["message"]
        seeded_session.expire_all()
        cancelled = seeded_session.exec(select(Order).where(Order.id == row.id)).one()
        assert cancelled.status == OrderStatus.cancelled
        # reserved units returned to inventory
        product = seeded_session.exec(
            select(Product).where(Product.id == sample_product["id"])
        ).one()
        assert product.stock_qty == sample_product["stock_qty"]

    async def test_gateway_rejection_cancels_order(
        self, client, seeded_session, sample_product, patched_verify
    ):
        order = await _create_order(client, sample_product)
        row = seeded_session.exec(
            select(Order).where(Order.order_number == order["order_number"])
        ).one()
        patched_verify(False)

        resp = await client.post(
            "/api/v1/payment/callback", json={"Authority": row.payment_authority, "Status": "OK"}
        )
        assert resp.status_code == 400
        seeded_session.expire_all()
        cancelled = seeded_session.exec(select(Order).where(Order.id == row.id)).one()
        assert cancelled.status == OrderStatus.cancelled
        product = seeded_session.exec(
            select(Product).where(Product.id == sample_product["id"])
        ).one()
        assert product.stock_qty == sample_product["stock_qty"]

    async def test_gateway_timeout_keeps_pending(
        self, client, seeded_session, sample_product, patched_verify
    ):
        order = await _create_order(client, sample_product)
        row = seeded_session.exec(
            select(Order).where(Order.order_number == order["order_number"])
        ).one()
        patched_verify(ZarinPalError("timeout"))

        resp = await client.post(
            "/api/v1/payment/callback", json={"Authority": row.payment_authority, "Status": "OK"}
        )
        assert resp.status_code == 400
        seeded_session.expire_all()
        pending = seeded_session.exec(select(Order).where(Order.id == row.id)).one()
        assert pending.status == OrderStatus.pending
        # reservation remains held while the order is still payable
        product = seeded_session.exec(
            select(Product).where(Product.id == sample_product["id"])
        ).one()
        assert product.stock_qty == sample_product["stock_qty"] - 1

    async def test_unknown_authority_errors(self, client, patched_verify):
        patched_verify(True)
        resp = await client.post(
            "/api/v1/payment/callback",
            json={"Authority": "AUTH-DOES-NOT-EXIST", "Status": "OK"},
        )
        assert resp.status_code == 400

    async def test_double_verification_rejected(
        self, client, seeded_session, sample_product, patched_verify
    ):
        order = await _create_order(client, sample_product)
        row = seeded_session.exec(
            select(Order).where(Order.order_number == order["order_number"])
        ).one()
        patched_verify(True)

        first = await client.post(
            "/api/v1/payment/callback", json={"Authority": row.payment_authority, "Status": "OK"}
        )
        assert first.json()["ok"] is True

        # second attempt with same authority — order already paid
        second = await client.post(
            "/api/v1/payment/callback", json={"Authority": row.payment_authority, "Status": "OK"}
        )
        assert second.status_code == 400

        product = seeded_session.exec(
            select(Product).where(Product.id == sample_product["id"])
        ).one()
        assert product.stock_qty == sample_product["stock_qty"] - 1  # deducted exactly once
