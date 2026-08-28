"""Integration tests: catalog endpoints (happy path + errors)."""

import pytest

pytestmark = pytest.mark.asyncio


class TestCategories:
    async def test_list_categories_tree(self, client):
        resp = await client.get("/api/v1/categories")
        assert resp.status_code == 200
        cats = resp.json()
        assert len(cats) == 4
        assert {c["name"] for c in cats} >= {"ماگ‌های دست‌ساز", "زیرسیگاری سرامیکی"}

    async def test_category_detail_with_count(self, client):
        resp = await client.get("/api/v1/categories/handmade-mugs")
        assert resp.status_code == 200
        body = resp.json()
        assert body["slug"] == "handmade-mugs"
        assert body["product_count"] == 6

    async def test_category_404(self, client):
        resp = await client.get("/api/v1/categories/nope")
        assert resp.status_code == 404


class TestProductList:
    @pytest.mark.parametrize(
        ("params", "expected_total"),
        [
            ({}, 24),
            ({"category": "handmade-mugs"}, 6),
            ({"search": "لاجوردی"}, None),
            ({"min_price": 500000}, None),
            ({"max_price": 300000}, None),
            ({"sort": "price_asc"}, 24),
            ({"in_stock_only": "true"}, 24),
        ],
    )
    async def test_filters_and_sort(self, client, params, expected_total):
        resp = await client.get("/api/v1/products", params=params)
        assert resp.status_code == 200
        body = resp.json()
        if expected_total is not None:
            assert body["total"] == expected_total
        else:
            assert body["total"] > 0
        prices = [i["price"] for i in body["items"]]
        if params.get("sort") == "price_asc" and len(prices) > 1:
            assert prices == sorted(prices)

    async def test_pagination_math(self, client):
        resp = await client.get("/api/v1/products", params={"page_size": 10, "page": 3})
        body = resp.json()
        assert body["pages"] == 3
        assert len(body["items"]) == 4  # 24 items / page_size 10

    async def test_unknown_category_returns_empty(self, client):
        resp = await client.get("/api/v1/products", params={"category": "ghost"})
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    async def test_items_carry_primary_image(self, client):
        resp = await client.get("/api/v1/products", params={"page_size": 5})
        for item in resp.json()["items"]:
            assert item["primary_image_url"].startswith("/products/")


class TestProductDetail:
    async def test_detail_happy_path(self, client):
        resp = await client.get("/api/v1/products/maag-lajevardi-solomoni")
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "ماگ لاجوردی سلیمانی"
        assert len(body["images"]) == 3
        assert body["images"][0]["is_primary"]
        assert body["discount_percent"] > 0
        assert body["category_slug"] == "handmade-mugs"

    async def test_detail_404(self, client):
        resp = await client.get("/api/v1/products/does-not-exist")
        assert resp.status_code == 404
