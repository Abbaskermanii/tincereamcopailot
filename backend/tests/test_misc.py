"""Instant search + health + admin panel access control tests."""

import pytest

pytestmark = pytest.mark.asyncio


class TestSearch:
    async def test_search_finds_products_and_categories(self, client):
        resp = await client.get("/api/v1/search", params={"q": "ماگ"})
        body = resp.json()
        assert resp.status_code == 200
        assert len(body["products"]) == 6
        assert any(c["slug"] == "handmade-mugs" for c in body["categories"])
        row = body["products"][0]
        assert {"slug", "name", "price", "image_url"} <= set(row.keys())

    async def test_search_empty_query(self, client):
        resp = await client.get("/api/v1/search", params={"q": ""})
        assert resp.json() == {"query": "", "products": [], "categories": []}

    async def test_search_no_results(self, client):
        resp = await client.get("/api/v1/search", params={"q": "zzzzzz"})
        assert resp.json()["products"] == []


class TestHealth:
    async def test_health_ok(self, client):
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestAdminPanel:
    async def test_login_page_reachable(self, client):
        # sqladmin now mounts at /admin-sql to avoid collision with Next.js /admin (H11/M11)
        resp = await client.get("/admin-sql", follow_redirects=False)
        assert resp.status_code in (302, 307)

    @pytest.mark.parametrize(
        ("path", "status"),
        [
            ("/admin-sql/product/list", (302, 307)),
            ("/admin-sql/order/list", (302, 307)),
            ("/admin-sql/coupon/list", (302, 307)),
        ],
    )
    async def test_admin_requires_auth(self, client, path, status):
        resp = await client.get(path, follow_redirects=False)
        assert resp.status_code in status
