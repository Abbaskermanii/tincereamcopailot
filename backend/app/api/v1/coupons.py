from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.v1.auth import optional_user
from app.db.session import get_session
from app.models import Coupon, CouponRedemption
from app.schemas.store import CouponValidateIn, CouponValidateOut

router = APIRouter()


@router.post("/coupons/validate", response_model=CouponValidateOut)
async def validate_coupon(
    payload: CouponValidateIn,
    session: Session = Depends(get_session),
    user=Depends(optional_user),
) -> CouponValidateOut:
    coupon = session.exec(
        select(Coupon).where(Coupon.code == payload.code.strip().upper())  # type: ignore[arg-type]
    ).first()
    if not coupon:
        return CouponValidateOut(valid=False, message="کد تخفیف یافت نشد.")

    user_uses = 0
    if user is not None and coupon.per_user_limit > 0:
        user_uses = int(
            session.exec(
                select(func.count(CouponRedemption.id)).where(
                    CouponRedemption.coupon_id == coupon.id,
                    CouponRedemption.user_id == user.id,
                )
            ).one()
            or 0
        )

    valid, message = coupon.is_valid(payload.order_total, user_uses)
    if not valid:
        return CouponValidateOut(valid=False, message=message)

    discount = coupon.compute_discount(payload.order_total)
    return CouponValidateOut(valid=True, message="کد تخفیف اعمال شد.", discount_amount=discount)
