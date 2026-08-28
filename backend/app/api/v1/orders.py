from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.session import get_session
from app.models import Coupon, Order
from app.schemas.store import OrderCreate, OrderCreatedOut, OrderStatusOut
from app.services.orders import OrderError, create_order
from app.services.cache import cache_delete_pattern
from app.services.zarinpal import ZarinPalError, request_payment

router = APIRouter()


@router.post("/orders", response_model=OrderCreatedOut, status_code=201)
async def create_order_endpoint(
    payload: OrderCreate, session: Session = Depends(get_session)
) -> OrderCreatedOut:
    coupon = None
    if payload.coupon_code:
        coupon = session.exec(
            select(Coupon).where(Coupon.code == payload.coupon_code.strip().upper())  # type: ignore[arg-type]
        ).first()

    items = [i.model_dump() for i in payload.items]
    customer = payload.model_dump(exclude={"items", "coupon_code"})

    try:
        order, order_items = create_order(session, items, coupon, customer)
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
    session.commit()
    # Stock is reserved before redirecting to the gateway; do not serve stale
    # availability from the catalog cache while the payment is pending.
    cache_delete_pattern("products:*")

    return OrderCreatedOut(
        order_number=order.order_number,
        status=order.status,
        total_amount=order.total_amount,
        shipping_cost=order.shipping_cost,
        discount_amount=order.discount_amount,
        payment_url=paypage_url,
        items=[
            {
                "product_id": oi.product_id,
                "product_name_snapshot": oi.product_name_snapshot,
                "unit_price_snapshot": float(oi.unit_price_snapshot),
                "quantity": oi.quantity,
                "subtotal": float(oi.subtotal),
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
    return OrderStatusOut(
        order_number=order.order_number,
        status=order.status,
        updated_at=order.updated_at,
    )
