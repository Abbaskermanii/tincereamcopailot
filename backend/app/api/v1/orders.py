from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.session import get_session
from app.api.v1.auth import current_user, optional_user
from app.models import Coupon, Order, OrderStatus, PaymentTransaction
from app.models.identity import Address
from app.schemas.store import OrderCreate, OrderCreatedOut, OrderItemOut, OrderStatusOut
from app.services.orders import OrderError, create_order
from app.services.cache import cache_delete_pattern
from app.services.notifier import RTL_EMAIL_SHELL, send_email
from app.services.rate_limit import rate_limit
from app.services.zarinpal import ZarinPalError, request_payment

router = APIRouter()


@router.get("/orders/me", response_model=list[dict])
def my_orders(user = Depends(current_user), session: Session = Depends(get_session)):
    """Orders of the logged-in user for the account dashboard."""
    rows = session.exec(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())  # type: ignore[arg-type]
    ).all()
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "status": o.status.value if hasattr(o.status, "value") else str(o.status),
            "total_amount": float(o.total_amount) if o.total_amount is not None else 0,
            "created_at": o.created_at,
            "tracking_code": o.tracking_code,
        }
        for o in rows
    ]

@router.post("/orders", response_model=OrderCreatedOut, status_code=201, dependencies=[Depends(rate_limit("order_create", 20, 60))])
async def create_order_endpoint(
    payload: OrderCreate,
    session: Session = Depends(get_session),
    user=Depends(current_user),
) -> OrderCreatedOut:
    coupon = None
    if payload.coupon_code:
        coupon = session.exec(
            select(Coupon).where(Coupon.code == payload.coupon_code.strip().upper())  # type: ignore[arg-type]
        ).first()

    items = [i.model_dump() for i in payload.items]

    # Resolve address: either from saved Address row or inline fields
    address_id: str | None = None
    if payload.address_id:
        address_id = payload.address_id
        addr = session.get(Address, payload.address_id)
        if not addr or addr.user_id != user.id:
            raise HTTPException(404, "\u0622\u062f\u0631\u0633 \u0627\u0646\u062a\u062e\u0627\u0628\u06cc \u06cc\u0627\u0641\u062a \u0646\u0634\u062f.")
        customer = {
            "customer_name": addr.recipient_name,
            "phone": addr.phone,
            "email": payload.email,
            "address": addr.address,
            "city": addr.city,
            "province": addr.province,
            "postal_code": addr.postal_code,
            "gift_wrap": payload.gift_wrap,
            "gift_note": payload.gift_note,
            "shipping_method_id": payload.shipping_method_id,
        }
    else:
        # Inline fields must all be provided
        required_inline = {
            "customer_name": payload.customer_name,
            "phone": payload.phone,
            "address": payload.address,
            "city": payload.city,
            "province": payload.province,
            "postal_code": payload.postal_code,
        }
        missing = [k for k, v in required_inline.items() if v is None]
        if missing:
            raise HTTPException(422, "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0622\u062f\u0631\u0633 \u0646\u0627\u0642\u0635 \u0627\u0633\u062a. \u06cc\u06a9 \u0622\u062f\u0631\u0633 \u0630\u062e\u06cc\u0631\u0647\u200c\u0634\u062f\u0647 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f \u06cc\u0627 \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0622\u062f\u0631\u0633 \u0631\u0627 \u06a9\u0627\u0645\u0644 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.")
        customer = payload.model_dump(exclude={"items", "coupon_code", "variant_selections", "address_id"})

    try:
        order, order_items = create_order(
            session,
            items,
            coupon,
            customer,
            user=user,
            variant_selections=payload.variant_selections or {},
            address_id=address_id,
        )
        authority, paypage_url = await request_payment(
            amount_rials=int(order.total_amount * 10),
            callback_url=f"{get_settings().next_public_site_url}/api/payment/callback",
            description=f"\u0633\u0641\u0627\u0631\u0634 {order.order_number} \u2014 \u0641\u0631\u0648\u0634\u06af\u0627\u0647 \u062a\u0646\u200c\u0633\u0650\u0631\u0627\u0645",
        )
    except OrderError as exc:
        session.rollback()
        raise HTTPException(exc.status_code, exc.message_fa) from exc
    except ZarinPalError as exc:
        session.rollback()
        raise HTTPException(502, f"\u062e\u0637\u0627\u06cc \u062f\u0631\u06af\u0627\u0647 \u067e\u0631\u062f\u0627\u062e\u062a: {exc}") from exc

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
            f"<li>{oi.product_name_snapshot} \u00d7 {oi.quantity} \u2014 {int(oi.subtotal):,} \u062a\u0648\u0645\u0627\u0646</li>"
            for oi in order_items
        )
        asyncio.ensure_future(
            send_email(
                user.email,
                f"\u0633\u0641\u0627\u0631\u0634 {order.order_number} \u062b\u0628\u062a \u0634\u062f \u2014 \u062a\u0646\u200c\u0633\u0650\u0631\u0627\u0645",
                RTL_EMAIL_SHELL.format(
                    body=f"<p>\u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627 \u0628\u0627 \u0634\u0645\u0627\u0631\u0647 <b>{order.order_number}</b> \u062b\u0628\u062a \u0634\u062f \u0648 \u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631 \u067e\u0631\u062f\u0627\u062e\u062a \u0627\u0633\u062a.</p>"
                         f"<ul>{rows}</ul>"
                         f"<p>\u0645\u0628\u0644\u063a \u06a9\u0644: <b>{int(order.total_amount):,} \u062a\u0648\u0645\u0627\u0646</b></p>"
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
        raise HTTPException(404, "\u0633\u0641\u0627\u0631\u0634 \u06cc\u0627\u0641\u062a \u0646\u0634\u062f.")
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
        admin_note=order.admin_note,
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
        raise HTTPException(404, "\u0633\u0641\u0627\u0631\u0634 \u06cc\u0627\u0641\u062a \u0646\u0634\u062f.")
    # Ownership check: prevent one user from hijacking another user's payment authority
    if order.user_id is not None:
        if not user:
            raise HTTPException(401, "\u0628\u0631\u0627\u06cc \u067e\u0631\u062f\u0627\u062e\u062a \u0627\u06cc\u0646 \u0633\u0641\u0627\u0631\u0634 \u0648\u0627\u0631\u062f \u062d\u0633\u0627\u0628 \u0634\u0648\u06cc\u062f.")
        if user.id != order.user_id and not user.is_admin:
            raise HTTPException(403, "\u0634\u0645\u0627 \u0628\u0647 \u0627\u06cc\u0646 \u0633\u0641\u0627\u0631\u0634 \u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0631\u06cc\u062f.")
    if order.status != OrderStatus.pending:
        raise HTTPException(400, "\u0627\u06cc\u0646 \u0633\u0641\u0627\u0631\u0634 \u0642\u0627\u0628\u0644 \u067e\u0631\u062f\u0627\u062e\u062a \u0645\u062c\u062f\u062f \u0646\u06cc\u0633\u062a.")
    try:
        authority, paypage_url = await request_payment(
            amount_rials=int(order.total_amount * 10),
            callback_url=f"{get_settings().next_public_site_url}/api/payment/callback",
            description=f"\u0633\u0641\u0627\u0631\u0634 {order.order_number} \u2014 \u0641\u0631\u0648\u0634\u06af\u0627\u0647 \u062a\u0646\u200c\u0633\u0650\u0631\u0627\u0645",
        )
    except ZarinPalError as exc:
        raise HTTPException(502, f"\u062e\u0637\u0627\u06cc \u062f\u0631\u06af\u0627\u0647 \u067e\u0631\u062f\u0627\u062e\u062a: {exc}") from exc
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
