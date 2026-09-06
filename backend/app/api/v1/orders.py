from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.session import get_session
from app.api.v1.auth import optional_user
from app.models import Coupon, Order, OrderStatus, PaymentTransaction
from app.schemas.store import OrderCreate, OrderCreatedOut, OrderItemOut, OrderStatusOut
from app.services.orders import OrderError, create_order
from app.services.cache import cache_delete_pattern
from app.services.notifier import RTL_EMAIL_SHELL, send_email
from app.services.rate_limit import rate_limit
from app.services.zarinpal import ZarinPalError, request_payment

router = APIRouter()


@router.post("/orders", response_model=OrderCreatedOut, status_code=201, dependencies=[Depends(rate_limit("order_create", 20, 60))])
async def create_order_endpoint(
    payload: OrderCreate,
    session: Session = Depends(get_session),
    user=Depends(optional_user),
) -> OrderCreatedOut:
    coupon = None
    if payload.coupon_code:
        coupon = session.exec(
            select(Coupon).where(Coupon.code == payload.coupon_code.strip().upper())  # type: ignore[arg-type]
        ).first()

    items = [i.model_dump() for i in payload.items]
    customer = payload.model_dump(exclude={"items", "coupon_code", "variant_selections"})

    try:
        order, order_items = create_order(
            session,
            items,
            coupon,
            customer,
            user=user,
            variant_selections=payload.variant_selections or {},
        )
        authority, paypage_url = await request_payment(
            amount_rials=int(order.total_amount * 10),
            callback_url=f"{get_settings().next_public_site_url}/api/payment/callback",
            description=f"سفارش {order.order_number} — فروشگاه تن‌سِرام",
        )
    except OrderError as exc:
        session.rollback()
        raise HTTPException(exc.status_code, exc.message_fa) from exc
    except ZarinPalError as exc:
        session.rollback()
        raise HTTPException(502, f"خطای درگاه پرداخت: {exc}") from exc

    order.payment_authority = authority
    session.add(order)
    session.add(
        PaymentTransaction(
            order_id=order.id, gateway="zarinpal", authority=authority,
            amount_toman=order.total_amount, status="initiated",
        )
    )
    session.commit()
    # Stock is reserved before redirecting to the gateway; do not serve stale
    # availability from the catalog cache while the payment is pending.
    cache_delete_pattern("products:*")

    if user and user.email and not user.email.endswith("@otp.tinceram.local"):
        import asyncio

        rows = "".join(
            f"<li>{oi.product_name_snapshot} × {oi.quantity} — {int(oi.subtotal):,} تومان</li>"
            for oi in order_items
        )
        asyncio.ensure_future(
            send_email(
                user.email,
                f"سفارش {order.order_number} ثبت شد — تن‌سِرام",
                RTL_EMAIL_SHELL.format(
                    body=f"<p>سفارش شما با شماره <b>{order.order_number}</b> ثبت شد و در انتظار پرداخت است.</p>"
                         f"<ul>{rows}</ul>"
                         f"<p>مبلغ کل: <b>{int(order.total_amount):,} تومان</b></p>"
                ),
            )
        )

    return OrderCreatedOut(
        order_number=order.order_number,
        status=order.status,
        total_amount=order.total_amount,
        shipping_cost=order.shipping_cost,
        discount_amount=order.discount_amount,
        tax_rate=order.tax_rate,
        tax_amount=order.tax_amount,
        payment_url=paypage_url,
        items=[
            {
                "product_id": oi.product_id,
                "product_name_snapshot": oi.product_name_snapshot,
                "unit_price_snapshot": float(oi.unit_price_snapshot),
                "quantity": oi.quantity,
                "subtotal": float(oi.subtotal),
                "variant_id": oi.variant_id,
                "variant_name_snapshot": oi.variant_name_snapshot,
            }
            for oi in order_items
        ],
    )


@router.get("/orders/{order_number}/status", response_model=OrderStatusOut)
async def order_status(
    order_number: str, session: Session = Depends(get_session)
) -> OrderStatusOut:
    order = session.exec(
        select(Order).where(Order.order_number == order_number)  # type: ignore[arg-type]
    ).first()
    if not order:
        raise HTTPException(404, "سفارش یافت نشد.")
    from app.models import OrderItem
    items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    return OrderStatusOut(
        order_number=order.order_number,
        status=order.status,
        updated_at=order.updated_at,
        total_amount=float(order.total_amount),
        shipping_cost=float(order.shipping_cost),
        discount_amount=float(order.discount_amount),
        tax_rate=float(order.tax_rate),
        tax_amount=float(order.tax_amount),
        tracking_code=order.tracking_code,
        carrier=order.carrier,
        shipping_method_name=order.shipping_method_name,
        items=[
            OrderItemOut(
                product_id=i.product_id,
                product_name_snapshot=i.product_name_snapshot,
                unit_price_snapshot=float(i.unit_price_snapshot),
                quantity=i.quantity,
                subtotal=float(i.subtotal),
                variant_id=i.variant_id,
                variant_name_snapshot=i.variant_name_snapshot,
            )
            for i in items
        ],
    )


@router.get("/orders/{order_number}/pay", dependencies=[Depends(rate_limit("order_pay", 20, 60))])
async def order_pay_url(
    order_number: str,
    session: Session = Depends(get_session),
    user=Depends(optional_user),
):
    """Re-initiate payment for a pending order (retry after gateway failure).

    Ownership is enforced: orders linked to a user account can only be
    re-paid by that user (or an admin). Guest orders (user_id IS NULL) remain
    payable by anyone possessing the order_number (required for guest checkout),
    but the order_number entropy makes guessing infeasible.
    """
    order = session.exec(
        select(Order).where(Order.order_number == order_number)  # type: ignore[arg-type]
    ).first()
    if not order:
        raise HTTPException(404, "سفارش یافت نشد.")
    # Ownership check: prevent one user from hijacking another user's payment authority
    if order.user_id is not None:
        if not user:
            raise HTTPException(401, "برای پرداخت این سفارش وارد حساب شوید.")
        if user.id != order.user_id and not user.is_admin:
            raise HTTPException(403, "شما به این سفارش دسترسی ندارید.")
    if order.status != OrderStatus.pending:
        raise HTTPException(400, "این سفارش قابل پرداخت مجدد نیست.")
    try:
        authority, paypage_url = await request_payment(
            amount_rials=int(order.total_amount * 10),
            callback_url=f"{get_settings().next_public_site_url}/api/payment/callback",
            description=f"سفارش {order.order_number} — فروشگاه تن‌سِرام",
        )
    except ZarinPalError as exc:
        raise HTTPException(502, f"خطای درگاه پرداخت: {exc}") from exc
    order.payment_authority = authority
    session.add(order)
    session.add(
        PaymentTransaction(
            order_id=order.id, gateway="zarinpal", authority=authority,
            amount_toman=order.total_amount, status="initiated",
            message="retry",
        )
    )
    session.commit()
    return {"payment_url": paypage_url}
