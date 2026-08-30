"""Order creation & payment verification — atomic, overselling-safe."""

import secrets
import string
from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import (
    Campaign,
    Coupon,
    CouponRedemption,
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusHistory,
    Product,
    ProductVariant,
    ShippingMethod,
    User,
)
from app.services.zarinpal import ZarinPalError

FALLBACK_SHIPPING_FEE = 55000  # تومان؛ وقتی روش ارسال انتخاب نشده باشد
GIFT_WRAP_FEE = 30000  # تومان


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


def active_campaign_for(session: Session, category_ids: list[str], subtotal: float) -> Campaign | None:
    """Best running campaign covering the cart's categories (deepest discount wins) — uses actual subtotal."""
    import json as _json

    now = datetime.now(UTC)
    campaigns = session.exec(
        select(Campaign).where(
            Campaign.is_active == True,  # noqa: E712
            (Campaign.starts_at == None) | (Campaign.starts_at <= now),  # noqa: E711
            (Campaign.ends_at == None) | (Campaign.ends_at >= now),  # noqa: E711
        )
    ).all()
    best: Campaign | None = None
    best_amount = 0.0
    for campaign in campaigns:
        if not campaign.applies_to_all:
            try:
                covered = set(_json.loads(campaign.category_ids or "[]"))
            except Exception:
                covered = set()
            if not covered.intersection(category_ids):
                continue
        amount = campaign.compute_discount(subtotal)
        if amount > best_amount:
            best, best_amount = campaign, amount
    return best


def shipping_cost_for(session: Session, method: ShippingMethod | None, subtotal: float) -> float:
    if method is None:
        return FALLBACK_SHIPPING_FEE
    if method.free_over_amount and subtotal >= float(method.free_over_amount):
        return 0
    return float(method.cost)


def compute_totals(
    subtotal: float,
    coupon: Coupon | None,
    gift_wrap: bool,
    shipping_cost: float = 0,
    campaign: Campaign | None = None,
    tax_rate: float = 0,
) -> dict:
    discount = coupon.compute_discount(subtotal) if coupon else 0
    campaign_discount = 0
    if campaign:
        campaign_discount = campaign.compute_discount(max(subtotal - discount, 0))
    gift_fee = GIFT_WRAP_FEE if gift_wrap else 0
    taxable = max(subtotal - discount - campaign_discount, 0)
    tax_amount = round(taxable * tax_rate) if tax_rate else 0
    return {
        "discount_amount": round(discount),
        "campaign_discount_amount": round(campaign_discount),
        "gift_wrap_fee": gift_fee,
        "tax_amount": tax_amount,
        "tax_rate": tax_rate,
        "total_amount": max(round(taxable + gift_fee + shipping_cost + tax_amount), 0),
    }


def create_order(
    session: Session,
    payload_items: list[dict],
    coupon: Coupon | None,
    customer: dict,
    user: User | None = None,
    variant_selections: dict[str, str] | None = None,
) -> tuple[Order, list[OrderItem]]:
    """Atomically reserve stock and persist order + items.

    Rows are locked with SELECT ... FOR UPDATE and stock is *reserved*
    (decremented) inside this transaction, so concurrent checkouts can never
    oversell the last unit: the loser blocks, then sees the reduced stock.
    On payment failure or user cancellation `restock_order` returns units.

    ``variant_selections`` maps product_id → variant_id when the customer
    bought a specific variant of a product.
    """
    variant_selections = variant_selections or {}
    # Normalize payload_items: support both {product_id, variant_id?, quantity} and legacy variant_selections dict
    # Group by (product_id, variant_id) to support multiple variants of same product
    grouped: dict[tuple[str, str | None], int] = {}
    for item in payload_items:
        pid = item["product_id"]
        # variant may be inline or via legacy selections
        vid = item.get("variant_id") or variant_selections.get(pid)
        key = (pid, vid)
        grouped[key] = grouped.get(key, 0) + int(item["quantity"])

    # Build wanted totals per product for locking/validation (sum of all variants + base)
    wanted: dict[str, int] = {}
    for (pid, _vid), qty in grouped.items():
        wanted[pid] = wanted.get(pid, 0) + qty

    rows = session.exec(
        select(Product)
        .where(Product.id.in_(list(wanted)), Product.is_active == True)  # noqa: E712
        .with_for_update()
    ).all()

    if len(rows) != len(wanted):
        raise OrderError("یکی از محصولات یافت نشد یا غیرفعال است.", 404)
    rows_by_id: dict[str, Product] = {p.id: p for p in rows}

    # Load all required variants
    variant_ids = [vid for (_pid, vid) in grouped.keys() if vid]
    variants_by_id: dict[str, ProductVariant] = {}
    if variant_ids:
        variant_rows = session.exec(
            select(ProductVariant).where(ProductVariant.id.in_(variant_ids)).with_for_update()
        ).all()
        variants_by_id = {v.id: v for v in variant_rows}

    items_spec: list[tuple[str, str, float, int, str | None, str | None]] = []
    subtotal = 0.0
    category_ids: list[str] = []
    # Process each grouped line individually — preserves multiple variants of same product
    for (pid, vid), qty in grouped.items():
        product = rows_by_id[pid]
        variant = variants_by_id.get(vid) if vid else None
        unit_price = float(product.price)
        variant_id: str | None = None
        variant_name: str | None = None
        if variant is not None:
            if variant.product_id != product.id or not variant.is_active:
                raise OrderError(f"ورنت انتخابی «{product.name}» معتبر نیست.", 400)
            if variant.stock_qty < qty:
                raise OrderError(f"موجودی «{variant.name}» از {product.name} کافی نیست.", 409)
            if product.stock_qty < qty:
                raise OrderError(f"موجودی «{product.name}» کافی نیست.", 409)
            variant.stock_qty -= qty
            product.stock_qty -= qty  # keep parent product in sync with variant
            session.add(variant)
            session.add(product)
            variant_id = variant.id
            variant_name = variant.name
            if variant.absolute_price is not None:
                unit_price = float(variant.absolute_price)
            else:
                unit_price += float(variant.price_delta)
        else:
            # Check if vid was requested but not found (invalid variant id)
            if vid is not None:
                raise OrderError(f"ورنت انتخابی «{product.name}» معتبر نیست.", 400)
            if product.stock_qty < qty:
                raise OrderError(f"موجودی «{product.name}» کافی نیست.", 409)
            product.stock_qty -= qty  # reserve under row lock
            session.add(product)
        category_ids.append(product.category_id)
        subtotal += unit_price * qty
        items_spec.append((product.id, product.name, unit_price, qty, variant_id, variant_name))

    # Coupon per-user limit must be enforced against real redemption count.
    # Lock the coupon row to make used_count / per-user check atomic under concurrency.
    if coupon is not None:
        locked_coupon = session.exec(
            select(Coupon).where(Coupon.id == coupon.id).with_for_update()  # type: ignore[arg-type]
        ).one_or_none()
        if locked_coupon is None:
            raise OrderError("کد تخفیف یافت نشد.", 404)
        coupon = locked_coupon
        user_uses = 0
        if user is not None:
            from sqlalchemy import func as _func

            user_uses = int(
                session.exec(
                    select(_func.count(CouponRedemption.id)).where(
                        CouponRedemption.coupon_id == coupon.id,
                        CouponRedemption.user_id == user.id,
                    )
                ).one()
                or 0
            )
        valid, msg = coupon.is_valid(subtotal, user_uses)
        if not valid:
            raise OrderError(msg, 400)

    campaign = active_campaign_for(session, category_ids, subtotal)

    shipping_method: ShippingMethod | None = None
    if customer.get("shipping_method_id"):
        shipping_method = session.get(ShippingMethod, customer["shipping_method_id"])
        if shipping_method is None or not shipping_method.is_active:
            raise OrderError("روش ارسال انتخاب‌شده معتبر نیست.", 400)

    shipping_cost = shipping_cost_for(session, shipping_method, subtotal)
    # Tax rate from Setting (e.g., 0.09) — 0 if not configured
    tax_rate = 0.0
    try:
        from app.models import Setting

        _tax_row = session.exec(select(Setting).where(Setting.key == "tax_rate")).first()  # type: ignore[arg-type]
        if _tax_row and _tax_row.value not in (None, "", "0"):
            tax_rate = float(_tax_row.value)
    except Exception:
        tax_rate = 0.0
    totals = compute_totals(subtotal, coupon, bool(customer.get("gift_wrap")), shipping_cost, campaign, tax_rate)

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
        shipping_cost=shipping_cost,
        discount_amount=totals["discount_amount"],
        tax_rate=totals["tax_rate"],
        tax_amount=totals["tax_amount"],
        campaign_discount_amount=totals["campaign_discount_amount"],
        campaign_id=campaign.id if campaign else None,
        coupon_code=coupon.code if coupon else None,
        gift_wrap=bool(customer.get("gift_wrap")),
        gift_note=customer.get("gift_note"),
        shipping_method_id=shipping_method.id if shipping_method else None,
        shipping_method_name=shipping_method.name if shipping_method else None,
        status=OrderStatus.pending,
        user_id=user.id if user else None,
    )
    session.add(order)
    session.flush()

    order_items = [
        OrderItem(
            order_id=order.id,
            product_id=pid,
            variant_id=vid,
            variant_name_snapshot=vname,
            product_name_snapshot=name,
            unit_price_snapshot=price,
            quantity=qty,
            subtotal=round(price * qty),
        )
        for pid, name, price, qty, vid, vname in items_spec
    ]
    session.add_all(order_items)

    if coupon is not None:
        coupon.used_count += 1
        session.add(coupon)
        session.add(
            CouponRedemption(
                coupon_id=coupon.id,
                user_id=user.id if user else None,
                order_id=order.id,
                discount_amount=totals["discount_amount"],
            )
        )

    session.add(
        OrderStatusHistory(order_id=order.id, from_status=None, to_status=OrderStatus.pending.value)
    )
    return order, order_items


def add_status_history(
    session: Session, order: Order, to_status: str, actor_id: str | None = None, note: str | None = None
) -> None:
    session.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=order.status.value if isinstance(order.status, OrderStatus) else str(order.status),
            to_status=to_status,
            actor_id=actor_id,
            note=note,
        )
    )


def cancel_order_and_restock(session: Session, order: Order, actor_id: str | None = None, note: str | None = None) -> None:
    """Cancel an order, restock inventory (product or variant) and log history."""
    _restock(session, order)
    previous = order.status.value if isinstance(order.status, OrderStatus) else str(order.status)
    order.status = OrderStatus.cancelled
    session.add(order)
    add_status_history(session, order, OrderStatus.cancelled.value, actor_id=actor_id, note=note or f"لغو سفارش از وضعیت {previous}")


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
            cancel_order_and_restock(session, order, note="پرداخت تأیید نشد")
        return False, "پرداخت تأیید نشد؛ سفارش لغو شد.", order

    if order.status != OrderStatus.pending:
        return False, "این سفارش قبلاً نهایی شده است.", order

    # Stock was reserved at creation; nothing further to deduct.
    previous = order.status.value
    order.status = OrderStatus.paid
    order.payment_ref_id = ref_id
    session.add(order)
    add_status_history(session, order, OrderStatus.paid.value, note=f"پرداخت تأیید شد (از {previous})")
    return True, "پرداخت با موفقیت انجام شد.", order


def expire_stale_pending_orders(session: Session, ttl_minutes: int = 30) -> int:
    """Cancel pending orders older than TTL and restore stock. Returns count expired."""
    from datetime import timedelta

    cutoff = datetime.now(UTC) - timedelta(minutes=ttl_minutes)
    stale = session.exec(
        select(Order).where(Order.status == OrderStatus.pending, Order.created_at < cutoff)  # type: ignore[arg-type]
    ).all()
    count = 0
    for order in stale:
        _restock(session, order)
        order.status = OrderStatus.cancelled
        session.add(order)
        add_status_history(session, order, OrderStatus.cancelled.value, note="انقضای خودکار رزرو پس از ۳۰ دقیقه")
        count += 1
    if count:
        session.commit()
        try:
            from app.services.cache import cache_delete_pattern

            cache_delete_pattern("products:*")
        except Exception:
            pass
    return count


def _restock(session: Session, order: Order) -> None:
    """Return reserved units to inventory (product row and variant row when applicable)."""
    for item in order.items:
        # Always restock the parent product (keeps product/variant in sync, M3)
        product = session.exec(
            select(Product).where(Product.id == item.product_id).with_for_update()
        ).one()
        product.stock_qty += item.quantity
        session.add(product)
        if item.variant_id:
            variant = session.exec(
                select(ProductVariant).where(ProductVariant.id == item.variant_id).with_for_update()
            ).first()
            if variant:
                variant.stock_qty += item.quantity
                session.add(variant)
