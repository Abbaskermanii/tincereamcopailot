"""Order creation & payment verification — atomic, overselling-safe."""

import secrets
import string
from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import Coupon, Order, OrderItem, OrderStatus, Product
from app.services.zarinpal import ZarinPalError

GIFT_WRAP_FEE = 30000  # تومان
SHIPPING_FEE = 55000  # تومان؛ هزینه ثابت ارسال به سراسر ایران


def generate_order_number() -> str:
    alphabet = string.ascii_uppercase + string.digits
    tail = "".join(secrets.choice(alphabet) for _ in range(6))
    stamp = datetime.now(UTC).strftime("%y%m%d")
    return f"TC-{stamp}-{tail}"


class OrderError(Exception):
    def __init__(self, message_fa: str, status_code: int = 400) -> None:
        self.message_fa = message_fa
        self.status_code = status_code
        super().__init__(message_fa)


def compute_totals(subtotal: float, coupon: Coupon | None, gift_wrap: bool) -> dict:
    discount = coupon.compute_discount(subtotal) if coupon else 0
    gift_fee = GIFT_WRAP_FEE if gift_wrap else 0
    return {
        "discount_amount": round(discount),
        "gift_wrap_fee": gift_fee,
        "total_amount": max(round(subtotal - discount + gift_fee + SHIPPING_FEE), 0),
    }


def create_order(
    session: Session,
    payload_items: list[dict],
    coupon: Coupon | None,
    customer: dict,
) -> tuple[Order, list[OrderItem]]:
    """Atomically reserve stock and persist order + items.

    Rows are locked with SELECT ... FOR UPDATE and stock is *reserved*
    (decremented) inside this transaction, so concurrent checkouts can never
    oversell the last unit: the loser blocks, then sees the reduced stock.
    On payment failure or user cancellation `restock_order` returns units.
    """
    wanted: dict[str, int] = {}
    for item in payload_items:
        wanted[item["product_id"]] = wanted.get(item["product_id"], 0) + item["quantity"]

    rows = session.exec(
        select(Product)
        .where(Product.id.in_(list(wanted)), Product.is_active == True)  # noqa: E712
        .with_for_update()
    ).all()

    if len(rows) != len(wanted):
        raise OrderError("یکی از محصولات یافت نشد یا غیرفعال است.", 404)

    items_spec: list[tuple[str, str, float, int]] = []
    subtotal = 0.0
    for product in rows:
        qty = wanted[product.id]
        if product.stock_qty < qty:
            raise OrderError(f"موجودی «{product.name}» کافی نیست.", 409)
        product.stock_qty -= qty  # reserve under row lock
        session.add(product)
        subtotal += float(product.price) * qty
        items_spec.append((product.id, product.name, float(product.price), qty))

    if coupon is not None:
        valid, msg = coupon.is_valid(subtotal)
        if not valid:
            raise OrderError(msg, 400)

    totals = compute_totals(subtotal, coupon, bool(customer.get("gift_wrap")))

    order = Order(
        order_number=generate_order_number(),
        customer_name=customer["customer_name"],
        phone=customer["phone"],
        email=customer.get("email"),
        address=customer["address"],
        city=customer["city"],
        province=customer["province"],
        postal_code=customer["postal_code"],
        total_amount=totals["total_amount"],
        shipping_cost=SHIPPING_FEE,
        discount_amount=totals["discount_amount"],
        coupon_code=coupon.code if coupon else None,
        gift_wrap=bool(customer.get("gift_wrap")),
        gift_note=customer.get("gift_note"),
        status=OrderStatus.pending,
    )
    session.add(order)
    session.flush()

    order_items = [
        OrderItem(
            order_id=order.id,
            product_id=pid,
            product_name_snapshot=name,
            unit_price_snapshot=price,
            quantity=qty,
            subtotal=round(price * qty),
        )
        for pid, name, price, qty in items_spec
    ]
    session.add_all(order_items)

    if coupon is not None:
        coupon.used_count += 1
        session.add(coupon)

    return order, order_items


async def verify_and_finalize(
    session: Session, authority: str, verify_fn
) -> tuple[bool, str | None, Order | None]:
    """Verify a ZarinPal payment and finalize the order atomically.

    Success: keep the reservation (stock already deducted), set status=paid.
    Failure/user-cancel: restock and cancel. Gateway timeout: stay pending,
    reservation remains held until retry or cancellation.
    """
    stmt = (
        select(Order)
        .where(Order.payment_authority == authority)  # type: ignore[arg-type]
        .with_for_update()
    )
    order = session.exec(stmt).first()
    if order is None:
        return False, "سفارشی برای این پرداخت یافت نشد.", None

    try:
        verified, ref_id = await verify_fn(int(order.total_amount * 10), authority)
    except ZarinPalError:
        return False, "درگاه پرداخت پاسخگو نبود؛ سفارش همچنان در انتظار پرداخت است.", order

    if not verified:
        if order.status == OrderStatus.pending:
            _restock(session, order)
            order.status = OrderStatus.cancelled
            session.add(order)
        return False, "پرداخت تأیید نشد؛ سفارش لغو شد.", order

    if order.status != OrderStatus.pending:
        return False, "این سفارش قبلاً نهایی شده است.", order

    # Stock was reserved at creation; nothing further to deduct.
    order.status = OrderStatus.paid
    order.payment_ref_id = ref_id
    session.add(order)
    return True, "پرداخت با موفقیت انجام شد.", order


def _restock(session: Session, order: Order) -> None:
    """Return reserved units to inventory (called under row locks)."""
    for item in order.items:
        product = session.exec(
            select(Product).where(Product.id == item.product_id).with_for_update()
        ).one()
        product.stock_qty += item.quantity
        session.add(product)
