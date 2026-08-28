from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.models import Order, OrderStatus
from app.schemas.store import PaymentCallbackIn, PaymentCallbackOut
from app.services.cache import cache_delete_pattern
from app.services.orders import verify_and_finalize
from app.services.zarinpal import verify_payment

router = APIRouter()


@router.post("/payment/callback", response_model=PaymentCallbackOut)
async def payment_callback(
    payload: PaymentCallbackIn, session: Session = Depends(get_session)
) -> PaymentCallbackOut:
    """Server-side ZarinPal verification + atomic status update & stock deduction."""
    if payload.Status != "OK":
        order = session.exec(
            select(Order).where(Order.payment_authority == payload.Authority)  # type: ignore[arg-type]
        ).first()
        if order and order.status == OrderStatus.pending:
            from app.services.orders import _restock

            _restock(session, order)
            order.status = OrderStatus.cancelled
            session.add(order)
        session.commit()
        cache_delete_pattern("products:*")
        return PaymentCallbackOut(
            ok=False,
            message="پرداخت توسط کاربر لغو شد.",
            order_number=order.order_number if order else None,
        )

    ok, message, _order = await verify_and_finalize(session, payload.Authority, verify_payment)
    if not ok:
        session.commit()  # persist cancellation when applicable
        raise HTTPException(400, message)

    session.commit()
    cache_delete_pattern("products:*")  # stock changed → invalidate list caches
    return PaymentCallbackOut(
        ok=True,
        message=message or "پرداخت تأیید شد.",
        order_number=_order.order_number if _order else None,
    )
