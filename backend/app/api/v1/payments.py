from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.models import Order, OrderStatus, PaymentTransaction
from app.schemas.store import PaymentCallbackIn, PaymentCallbackOut
from app.services.cache import cache_delete_pattern
from app.services.orders import verify_and_finalize
from app.services.rate_limit import rate_limit
from app.services.zarinpal import verify_payment

router = APIRouter()


def _fail_pending(session: Session, authority: str) -> PaymentCallbackOut:
    order = session.exec(
        select(Order).where(Order.payment_authority == authority)  # type: ignore[arg-type]
    ).first()
    if order and order.status == OrderStatus.pending:
        from app.services.orders import _restock, add_status_history

        _restock(session, order)
        order.status = OrderStatus.cancelled
        session.add(order)
        add_status_history(session, order, OrderStatus.cancelled.value, note="پرداخت توسط کاربر لغو شد")
    session.commit()
    if order:
        txn = session.exec(
            select(PaymentTransaction).where(
                PaymentTransaction.order_id == order.id,
                PaymentTransaction.authority == authority,  # type: ignore[arg-type]
            )
        ).first()
        if txn:
            txn.status = "cancelled"
            txn.message = "پرداخت توسط کاربر لغو شد"
            session.add(txn)
            session.commit()
    cache_delete_pattern("products:*")
    return PaymentCallbackOut(
        ok=False,
        message="پرداخت توسط کاربر لغو شد.",
        order_number=order.order_number if order else None,
    )


@router.post("/payment/callback", response_model=PaymentCallbackOut, dependencies=[Depends(rate_limit("payment_callback", 30, 60))])
async def payment_callback(
    payload: PaymentCallbackIn, session: Session = Depends(get_session)
) -> PaymentCallbackOut:
    """Server-side ZarinPal verification + atomic status update & stock deduction."""
    if payload.Status != "OK":
        return _fail_pending(session, payload.Authority)

    ok, message, _order = await verify_and_finalize(session, payload.Authority, verify_payment)
    if not ok:
        session.commit()  # persist cancellation when applicable
        if _order:
            _record_txn(session, _order.id, payload.Authority, "failed", message)
        raise HTTPException(400, message)

    session.commit()
    if _order:
        _record_txn(session, _order.id, payload.Authority, "verified", message)
    cache_delete_pattern("products:*")  # stock changed → invalidate list caches
    return PaymentCallbackOut(
        ok=True,
        message=message or "پرداخت تأیید شد.",
        order_number=_order.order_number if _order else None,
    )


@router.get("/payment/callback", response_model=PaymentCallbackOut, dependencies=[Depends(rate_limit("payment_callback_get", 30, 60))])
async def payment_callback_get(
    Authority: str, Status: str, session: Session = Depends(get_session)
) -> PaymentCallbackOut:
    """The real ZarinPal redirect is a browser GET; route it to the same handler."""
    return await payment_callback(PaymentCallbackIn(Authority=Authority, Status=Status), session)


def _record_txn(session: Session, order_id: str, authority: str, status: str, message: str | None) -> None:
    try:
        session.add(
            PaymentTransaction(
                order_id=order_id, gateway="zarinpal", authority=authority,
                status=status, message=message,
            )
        )
        session.commit()
    except Exception:
        session.rollback()
