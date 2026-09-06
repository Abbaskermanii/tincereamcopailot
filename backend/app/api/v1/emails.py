"""Email endpoints — wired to the notifier service for real SMTP delivery."""

import secrets
from datetime import datetime, timedelta
from app.compat import UTC

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.session import get_session
from app.models import User, PasswordResetToken
from app.services.notifier import RTL_EMAIL_SHELL, send_email

router = APIRouter(prefix="/email", tags=["email"])

class EmailResponse(BaseModel):
    success: bool
    message: str

# ───────────────────────── Password Reset ─────────────────────────

@router.post("/password-reset")
def request_password_reset(email: str, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return EmailResponse(success=True, message="اگر ایمیل معتبر باشد، لینک بازیابی ارسال شد.")

    token = secrets.token_urlsafe(32)
    expires = datetime.now(UTC) + timedelta(hours=1)
    session.add(PasswordResetToken(token_hash=token, user_id=user.id, expires_at=expires))
    session.commit()

    settings = get_settings()
    reset_url = f"{settings.next_public_site_url}/auth/reset-password?token={token}"
    body = f"""
    <h2>بازیابی رمز عبور</h2>
    <p>سلام {user.full_name or ''}،</p>
    <p>برای تغییر رمز عبور خود روی لینک زیر کلیک کنید:</p>
    <p><a href="{reset_url}" style="display:inline-block;padding:12px 24px;background:#8d5b4c;color:#fff;border-radius:8px;text-decoration:none;">تغییر رمز عبور</a></p>
    <p style="color:#888;font-size:12px;">این لینک تا ۱ ساعت معتبر است.</p>
    """
    import asyncio
    asyncio.get_event_loop().run_until_complete(
        send_email(user.email, "بازیابی رمز عبور — تن‌سِرام", RTL_EMAIL_SHELL.format(body=body))
    )
    return EmailResponse(success=True, message="لینک بازیابی رمز عبور ارسال شد.")

# ───────────────────────── Order Confirmation ─────────────────────────

@router.post("/order-confirmation")
def send_order_confirmation(order_id: str, session: Session = Depends(get_session)):
    from app.models import Order, OrderItem
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(404, "سفارش یافت نشد.")
    if not order.email:
        return EmailResponse(success=True, message="ایمیلی برای این سفارش ثبت نشده.")

    body = f"""
    <h2>تأیید سفارش {order.order_number}</h2>
    <p>سلام {order.customer_name}،</p>
    <p>سفارش شما با موفقیت ثبت شد.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">شماره سفارش</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">{order.order_number}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">مبلغ کل</td><td style="padding:8px;border-bottom:1px solid #eee;">{order.total_amount:,.0f} تومان</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">وضعیت</td><td style="padding:8px;border-bottom:1px solid #eee;">در انتظار پرداخت</td></tr>
    </table>
    <p><a href="{get_settings().next_public_site_url}/order/tracking/{order.order_number}" style="display:inline-block;padding:12px 24px;background:#8d5b4c;color:#fff;border-radius:8px;text-decoration:none;">پیگیری سفارش</a></p>
    """
    import asyncio
    asyncio.get_event_loop().run_until_complete(
        send_email(order.email, f"تأیید سفارش {order.order_number} — تن‌سِرام", RTL_EMAIL_SHELL.format(body=body))
    )
    return EmailResponse(success=True, message="ایمیل تأیید سفارش ارسال شد.")

# ───────────────────────── Order Status Update ─────────────────────────

@router.post("/order-update")
def send_order_update(order_id: str, new_status: str, status_message: str = "", session: Session = Depends(get_session)):
    from app.models import Order
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(404, "سفارش یافت نشد.")
    if not order.email:
        return EmailResponse(success=True, message="ایمیلی ثبت نشده.")

    status_labels = {
        "paid": "پرداخت شده", "processing": "در حال پردازش", "shipped": "ارسال شده",
        "delivered": "تحویل شده", "cancelled": "لغو شده",
    }
    label = status_labels.get(new_status, new_status)
    body = f"""
    <h2>بروزرسانی سفارش {order.order_number}</h2>
    <p>سلام {order.customer_name}،</p>
    <p>وضعیت سفارش شما به <strong>{label}</strong> تغییر کرد.</p>
    {"<p>" + status_message + "</p>" if status_message else ""}
    <p><a href="{get_settings().next_public_site_url}/order/tracking/{order.order_number}" style="display:inline-block;padding:12px 24px;background:#8d5b4c;color:#fff;border-radius:8px;text-decoration:none;">مشاهده سفارش</a></p>
    """
    import asyncio
    asyncio.get_event_loop().run_until_complete(
        send_email(order.email, f"بروزرسانی سفارش {order.order_number} — تن‌سِرام", RTL_EMAIL_SHELL.format(body=body))
    )
    return EmailResponse(success=True, message="ایمیل بروزرسانی ارسال شد.")

# ───────────────────────── Welcome ─────────────────────────

@router.post("/welcome")
def send_welcome_email(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user or not user.email:
        raise HTTPException(404, "کاربر یافت نشد.")

    body = f"""
    <h2>خوش آمدید!</h2>
    <p>سلام {user.full_name or ''}،</p>
    <p>حساب کاربری شما در تن‌سِرام با موفقیت ایجاد شد.</p>
    <p>از خرید لذت ببرید!</p>
    <p><a href="{get_settings().next_public_site_url}/shop" style="display:inline-block;padding:12px 24px;background:#8d5b4c;color:#fff;border-radius:8px;text-decoration:none;">مشاهده فروشگاه</a></p>
    """
    import asyncio
    asyncio.get_event_loop().run_until_complete(
        send_email(user.email, "خوش آمدید به تن‌سِرام", RTL_EMAIL_SHELL.format(body=body))
    )
    return EmailResponse(success=True, message="ایمیل خوش‌آمدگویی ارسال شد.")

# ───────────────────────── Newsletter Subscribe ─────────────────────────

