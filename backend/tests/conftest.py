"""Shared fixtures: isolated Postgres test DB, HTTP client, seeded catalog."""

import os

# Must run before any app import so cached Settings pick up the test DB.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://ceramics_test:ceramics_test@localhost:5433/ceramics_test",
)
# Override Docker hostnames for services that tests need locally
os.environ.setdefault("S3_ENDPOINT", "http://localhost:9000")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlmodel import Session, SQLModel, select  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.db.session import engine as app_engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Product as Product_  # noqa: E402
from scripts.seed import seed  # noqa: E402

# Clear settings cache so newly-set env vars (S3_ENDPOINT, REDIS_URL) take effect
get_settings.cache_clear()


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    """Fresh schema for the whole test session."""
    SQLModel.metadata.drop_all(app_engine)
    SQLModel.metadata.create_all(app_engine)
    yield


@pytest.fixture()
def session(_create_schema):
    """Function-scoped session on a clean table set (truncate between tests)."""
    with Session(app_engine) as s:
        yield s


@pytest.fixture(autouse=True)
def _clean_tables(session):
    """Truncate all tables + flush cache keys after each test (full isolation)."""
    yield
    session.rollback()
    from sqlalchemy import text as _text

    for table in reversed(SQLModel.metadata.sorted_tables):
        session.exec(_text(f'TRUNCATE TABLE "{table.name}" CASCADE'))  # type: ignore[arg-type]
    session.commit()
    from app.services.cache import cache_delete_pattern

    cache_delete_pattern("catids:*")
    cache_delete_pattern("products:*")


@pytest.fixture()
def seeded_session(session: Session) -> Session:
    """Session containing the full Persian demo catalog."""
    seed(session)
    session.rollback()  # detach; rows are committed by seed()
    return session


@pytest.fixture(autouse=True)
def _mock_zarinpal_request(monkeypatch):
    """Never hit the real gateway from tests; callback tests patch verify separately."""
    import app.api.v1.orders as orders_module

    async def fake_request_payment(amount_rials: int, callback_url: str, description: str):
        return "TEST" + "0" * 60, "https://sandbox.zarinpal.com/pg/StartPay/TESTAUTH"

    monkeypatch.setattr(orders_module, "request_payment", fake_request_payment)


@pytest.fixture()
async def client(seeded_session):
    """Async HTTP client bound to the FastAPI app (dependency override below)."""
    from app.db.session import get_session

    def override():
        with Session(app_engine) as s:
            yield s

    app.dependency_overrides[get_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def sample_product(seeded_session: Session) -> dict:
    row = seeded_session.exec(select(Product_)).first()
    assert row is not None
    return {
        "id": row.id,
        "slug": row.slug,
        "name": row.name,
        "price": float(row.price),
        "stock_qty": row.stock_qty,
    }


@pytest.fixture()
def order_payload(sample_product: dict) -> dict:
    return {
        "items": [{"product_id": sample_product["id"], "quantity": 1}],
        "customer_name": "آرش رضایی",
        "phone": "09121234567",
        "address": "تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳",
        "city": "تهران",
        "province": "تهران",
        "postal_code": "1234567890",
    }
