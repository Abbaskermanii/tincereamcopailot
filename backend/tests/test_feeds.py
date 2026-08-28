"""Feed output tests: Torob & Google Merchant XML against seeded data."""

import xml.etree.ElementTree as ET

import pytest

pytestmark = pytest.mark.asyncio

TOROB_NS = {}
GOOGLE_NS = {"g": "http://base.google.com/ns/1.0"}


class TestTorobFeed:
    async def test_valid_xml_and_schema(self, client):
        resp = await client.get("/api/v1/feed/torob")
        assert resp.status_code == 200
        assert "xml" in resp.headers["content-type"]

        root = ET.fromstring(resp.text)
        assert root.tag == "products"
        products = root.findall("product")
        assert len(products) == 24

        first = products[0]
        for tag in ("id", "title", "price", "image_link", "link", "availability", "category"):
            el = first.find(tag)
            assert el is not None and (el.text or "").strip(), f"<{tag}> must be non-empty"

    async def test_prices_match_catalog(self, client):
        detail = await client.get("/api/v1/products/maag-lajevardi-solomoni")
        price = detail.json()["price"]

        resp = await client.get("/api/v1/feed/torob")
        root = ET.fromstring(resp.text)
        match = [p for p in root.findall("product") if "solomoni" in p.findtext("link", "")]
        assert len(match) == 1
        assert int(match[0].findtext("price")) == price


class TestGoogleMerchantFeed:
    async def test_valid_rss_with_g_namespace(self, client):
        resp = await client.get("/api/v1/feed/google-merchant")
        assert resp.status_code == 200
        root = ET.fromstring(resp.text)
        assert root.tag == "rss"
        channel = root.find("channel")
        assert channel is not None
        items = channel.findall("item")
        assert len(items) == 24

        item = items[0]
        for tag in (
            "id",
            "title",
            "description",
            "link",
            "image_link",
            "condition",
            "availability",
            "price",
            "brand",
        ):
            el = item.find(f"g:{tag}", GOOGLE_NS)
            assert el is not None and (el.text or "").strip(), f"g:{tag} must be non-empty"

    async def test_availability_reflects_stock(self, client, seeded_session):
        from sqlmodel import select as _select

        from app.models import Product

        # make one product out of stock
        row = seeded_session.exec(
            _select(Product).where(Product.slug == "maag-lajevardi-solomoni")
        ).one()
        row.stock_qty = 0
        seeded_session.add(row)
        seeded_session.commit()

        resp = await client.get("/api/v1/feed/google-merchant")
        root = ET.fromstring(resp.text)
        target = None
        for item in root.find("channel").findall("item"):  # type: ignore[union-attr]
            if "solomoni" in item.findtext("g:link", "", GOOGLE_NS):
                target = item
                break
        assert target is not None
        assert target.findtext("g:availability", "", GOOGLE_NS) == "out of stock"

    async def test_links_use_site_url(self, client):
        resp = await client.get("/api/v1/feed/google-merchant")
        root = ET.fromstring(resp.text)
        first_link = root.find("channel").find("item").findtext("g:link", "", GOOGLE_NS)  # type: ignore[union-attr]
        assert first_link.startswith("http://localhost:3000/product/")
