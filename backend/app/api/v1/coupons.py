from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.session import get_session
from app.models import Coupon
from app.schemas.store import CouponValidateIn, CouponValidateOut

router = APIRouter()


@router.post("/coupons/validate", response_model=CouponValidateOut)
async def validate_coupon(
    payload: CouponValidateIn, session: Session = Depends(get_session)
) -> CouponValidateOut:
    coupon = session.exec(
        select(Coupon).where(Coupon.code == payload.code.strip().upper())  # type: ignore[arg-type]
    ).first()
    if not coupon:
        return CouponValidateOut(valid=False, message="کد تخفیف یافت نشد.")

    valid, message = coupon.is_valid(payload.order_total)
    if not valid:
        return CouponValidateOut(valid=False, message=message)

    discount = coupon.compute_discount(payload.order_total)
    return CouponValidateOut(valid=True, message="کد تخفیف اعمال شد.", discount_amount=discount)
