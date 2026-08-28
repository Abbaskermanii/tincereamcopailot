"""Unit tests: model validation, discount math, stock logic, order numbers."""

from datetime import timedelta

from app.models import Coupon, DiscountType, Product
from app.services.orders import GIFT_WRAP_FEE, compute_totals, generate_order_number
from scripts.seed_data import build_rows


# ---------- Coupons ----------
def _coupon(**kw) -> Coupon:
    base = dict(
        code="TEST10",
        discount_type=DiscountType.percentage,
        discount_value=10,
        min_order_amount=0,
        expires_at=None,
        usage_limit=0,
        used_count=0,
    )
    base.update(kw)
    return Coupon(**base)


class TestCoupon:
    def test_percentage_discount(self):
        assert _coupon(discount_value=25).compute_discount(1000000) == 250000

    def test_fixed_discount(self):
        c = _coupon(discount_type=DiscountType.fixed, discount_value=50000)
        assert c.compute_discount(1000000) == 50000

    def test_discount_capped_at_total(self):
        c = _coupon(discount_type=DiscountType.fixed, discount_value=999999)
        assert c.compute_discount(10000) == 10000

    def test_expired_coupon_invalid(self):
        from app.models.base import utcnow

        expired = _coupon(expires_at=utcnow() - timedelta(days=1))
        ok, msg = expired.is_valid(100000)
        assert not ok and "منقضی" in msg

    def test_exhausted_coupon_invalid(self):
        c = _coupon(usage_limit=5, used_count=5)
        ok, msg = c.is_valid(100000)
        assert not ok and "ظرفیت" in msg

    def test_min_order_enforced(self):
        c = _coupon(min_order_amount=200000)
        ok, msg = c.is_valid(150000)
        assert not ok and "کافی نیست" in msg

    def test_valid_coupon_passes(self):
        assert _coupon(min_order_amount=200000).is_valid(300000)[0] is True


# ---------- Product ----------
class TestProduct:
    def test_discount_percent(self):
        p = Product(name="x", slug="x", category_id="c", sku="s", price=800, compare_at_price=1000)
        assert p.discount_percent == 20

    def test_no_discount_without_compare(self):
        p = Product(name="x", slug="x", category_id="c", sku="s", price=800)
        assert p.discount_percent == 0

    def test_compare_lower_than_price_gives_zero(self):
        p = Product(name="x", slug="x", category_id="c", sku="s", price=1200, compare_at_price=1000)
        assert p.discount_percent == 0

    def test_in_stock_flag(self):
        assert Product(name="x", slug="x", category_id="c", sku="s", price=1, stock_qty=2).in_stock
        assert not Product(
            name="x", slug="x", category_id="c", sku="s", price=1, stock_qty=0
        ).in_stock


# ---------- Totals & order numbers ----------
class TestTotals:
    def test_totals_without_coupon_or_gift(self):
        t = compute_totals(500000, None, False)
        assert t["discount_amount"] == 0
        assert t["total_amount"] == 500000

    def test_totals_with_coupon_and_gift(self):
        t = compute_totals(1000000, _coupon(discount_value=20), True)
        assert t["discount_amount"] == 200000
        assert t["gift_wrap_fee"] == GIFT_WRAP_FEE
        assert t["total_amount"] == 1000000 - 200000 + GIFT_WRAP_FEE

    def test_generate_order_number_shape(self):
        n1, n2 = generate_order_number(), generate_order_number()
        assert n1.startswith("TC-") and len(n1.split("-")[-1]) == 6
        assert n1 != n2  # random tail makes collisions practically impossible


# ---------- Seed dataset integrity ----------
class TestSeedData:
    def test_four_categories_six_products_each(self):
        rows = build_rows()
        assert len(rows["categories"]) == 4
        assert len(rows["products"]) >= 24
        slugs = [p["slug"] for p in rows["products"]]
        assert len(slugs) == len(set(slugs)), "product slugs must be unique"

    def test_every_product_has_three_images_with_primary(self):
        rows = build_rows()
        per_product = {}
        for img in rows["images"]:
            per_product.setdefault(img["product_slug"], []).append(img)
        for product in rows["products"]:
            imgs = per_product[product["slug"]]
            assert len(imgs) == 3
            assert sum(1 for i in imgs if i["is_primary"]) == 1
            assert all(i["alt_text"].strip() for i in imgs)

    def test_all_prices_positive_toman(self):
        for p in build_rows()["products"]:
            assert p["price"] > 0
            if p["compare_at_price"]:
                assert p["compare_at_price"] > p["price"]
