"""Race condition: concurrent checkouts must not oversell the last unit."""

import asyncio

from sqlmodel import Session, select

from app.db.session import engine
from app.models import Product
from app.services.orders import OrderError, create_order


async def test_concurrent_checkout_no_oversell(sample_product):
    """Two simultaneous buyers race for a product with exactly 1 unit left."""
    with Session(engine) as setup:
        product = setup.exec(select(Product).where(Product.id == sample_product["id"])).one()
        product.stock_qty = 1
        setup.add(product)
        setup.commit()

    customer = {
        "customer_name": "buyer",
        "phone": "09123334455",
        "address": "tabriz st 4",
        "city": "tabriz",
        "province": "azarbayjan",
        "postal_code": "5164778899",
    }
    item = {"product_id": sample_product["id"], "quantity": 1}

    results: list = []

    async def buyer():
        loop = asyncio.get_running_loop()

        def blocking():
            with Session(engine) as s:
                try:
                    order, _ = create_order(s, [item], None, dict(customer))
                    s.commit()
                    return ("ok", order.order_number)
                except OrderError:
                    s.rollback()
                    return ("fail", "stock")

        results.append(await loop.run_in_executor(None, blocking))

    await asyncio.gather(buyer(), buyer())

    outcomes = [r[0] for r in results]
    assert outcomes.count("ok") == 1, f"expected exactly one success, got {outcomes}"

    with Session(engine) as verify:
        final = verify.exec(select(Product).where(Product.id == sample_product["id"])).one()
        assert final.stock_qty == 0  # deducted exactly once, no oversell


async def test_concurrent_checkout_different_products_both_succeed(sample_product):
    with Session(engine) as setup:
        p = setup.exec(select(Product).where(Product.id == sample_product["id"])).one()
        p.stock_qty = 10
        setup.add(p)
        setup.commit()

    customer = {
        "customer_name": "buyer2",
        "phone": "09127778899",
        "address": "shiraz blvd 9",
        "city": "shiraz",
        "province": "fars",
        "postal_code": "7134811223",
    }
    item = {"product_id": sample_product["id"], "quantity": 2}
    results: list = []

    async def buyer():
        loop = asyncio.get_running_loop()

        def blocking():
            with Session(engine) as s:
                try:
                    order, _ = create_order(s, [dict(item)], None, dict(customer))
                    s.commit()
                    return "ok"
                except OrderError:
                    s.rollback()
                    return "fail"

        results.append(await loop.run_in_executor(None, blocking))

    await asyncio.gather(buyer(), buyer())
    assert all(r == "ok" for r in results)

    with Session(engine) as verify:
        final = verify.exec(select(Product).where(Product.id == sample_product["id"])).one()
        assert final.stock_qty == 6  # both orders reserved 2 units each
