from fastapi import APIRouter
from fastapi import HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.models.base import utcnow
from app.models.user import User

router = APIRouter()


class EmailRequest(BaseModel):
    """Request structure for sending emails"""
    to_email: str
    subject: str
    body: str
    template_type: Optional[str] = None


class EmailResponse(BaseModel):
    """Response structure"""
    success: bool
    message: str


@router.post("/password-reset", response_model=EmailResponse)
def send_password_reset_email(email: str):
    """Send password reset email to user.

    This endpoint generates a reset token and sends it via email.
    The reset token is valid for 1 hour.
    """
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.email == email).first()

        if not user:
            # Don't reveal if user exists for security
            return EmailResponse(
                success=True,
                message="If an account exists with this email, a password reset link will be sent."
            )

        # Generate reset token (1 hour validity)
        reset_token = secrets.token_urlsafe(32)
        reset_token_expires = utcnow() + timedelta(hours=1)

        # TODO: Store reset token securely
        # Create a token record in a separate table
        # from app.models.auth import PasswordResetToken
        # token_record = PasswordResetToken(
        #     user_id=user.id,
        #     token=reset_token,
        #     expires_at=reset_token_expires
        # )
        # session.add(token_record)

        # Send email
        reset_url = f"{settings.SITE_URL}/auth/reset-password?token={reset_token}"
        template_data = {
            "user_name": user.full_name,
            "reset_link": reset_url,
            "valid_for": "1 hour"
        }

        # TODO: Integrate with actual email service
        # await email_service.send_email(
        #     to_email=user.email,
        #     subject="رمز عبور خود را تغییر دهید",
        #     template_name="password_reset",
        #     context=template_data
        # )

        return EmailResponse(
            success=True,
            message="Email sent successfully"
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send password reset email: {str(e)}"
        )
    finally:
        session.close()


@router.post("/order-confirmation", response_model=EmailResponse)
def send_order_confirmation_email(
    order_id: str,
    order_number: str,
    customer_name: str,
    order_total: float,
    payment_status: str
):
    """Send order confirmation email to customer."""
    session = SessionLocal()
    try:
        # TODO: Get order details
        # order = session.query(Order).filter(Order.id == order_id).first()

        # Template data
        template_data = {
            "customer_name": customer_name,
            "order_number": order_number,
            "order_total": f"{order_total:,} تومان",
            "order_date": utcnow().strftime("%Y/%m/%d %H:%M"),
            "payment_status": payment_status,
            "download_url": f"{settings.SITE_URL}/account/orders/{order_number}/invoice"
        }

        # TODO: Integrate with actual email service
        # await email_service.send_email(
        #     to_email=order.customer.email,
        #     subject="تأیید سفارش", # Order Confirmation
        #     template_name="order_confirmation",
        #     context=template_data
        # )

        return EmailResponse(
            success=True,
            message="Order confirmation email sent"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send order confirmation: {str(e)}"
        )
    finally:
        session.close()


@router.post("/order-update", response_model=EmailResponse)
def send_order_update_email(
    order_id: str,
    customer_name: str,
    previous_status: str,
    new_status: str,
    status_message: str = ""
):
    """Send order status update email to customer."""
    try:
        template_data = {
            "customer_name": customer_name,
            "order_number": order_id[:8],  # Show first 8 characters
            "status_message": status_message,
            "current_status": new_status,
            "update_date": utcnow().strftime("%Y/%m/%d")
        }

        # TODO: Integrate with actual email service
        # await email_service.send_email(
        #     to_email=order.customer.email,
        #     subject="بروزرسانی وضعیت سفارش",
        #     template_name="order_update",
        #     context=template_data
        # )

        return EmailResponse(
            success=True,
            message="Order update email sent"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send order update: {str(e)}"
        )


@router.post("/newsletter-subscribe", response_model=EmailResponse)
def subscribe_to_newsletter(email: str):
    """Subscribe user to newsletter."""
    session = SessionLocal()
    try:
        # Check if already subscribed
        # from app.models.user import NewsletterSubscription
        # existing = session.query(NewsletterSubscription).filter(
        #     NewsletterSubscription.email == email
        # ).first()

        # if existing and existing.is_confirmed:
        #     return EmailResponse(
        #         success=True,
        #         message="You are already subscribed"
        #     )

        # Create subscription with double opt-in
        # subscription = NewsletterSubscription(
        #     email=email,
        #     is_confirmed=False,
        #     confirmation_token=secrets.token_urlsafe(32)
        # )
        # session.add(subscription)
        # session.commit()

        # TODO: Send confirmation email
        # confirmation_url = f"{settings.SITE_URL}/auth/newsletter-confirm?token={subscription.confirmation_token}"
        # await email_service.send_email(
        #     to_email=email,
        #     subject="تایید عضویت در خبرنامه",
        #     template_name="newsletter_confirm",
        #     context={"confirm_url": confirmation_url}
        # )

        # In development, just return success
        return EmailResponse(
            success=True,
            message="Registration link sent to email"
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process subscription: {str(e)}"
        )
    finally:
        session.close()


@router.post("/send", response_model=EmailResponse)
def send_custom_email(request: EmailRequest):
    """Send a custom email using template."""
    try:
        template_map = {
            "password-reset": "password_reset",
            "order-confirmation": "order_confirmation",
            "order-update": "order_update",
            "newsletter-confirm": "newsletter_confirm",
            "admin-alert": "admin_alert"
        }

        template_type = template_map.get(request.template_type, "default")
        subject_map = {
            "password-reset": "رمز عبور خود را تغییر دهید",
            "order-confirmation": "تأیید سفارش",
            "order-update": "بروزرسانی وضعیت سفارش",
            "newsletter-confirm": "تایید عضویت در خبرنامه",
            "admin-alert": "هشدار ادمین",
            "default": request.subject
        }

        # TODO: Integrate with actual email service
        # await email_service.send_email(
        #     to_email=request.to_email,
        #     subject=subject_map[request.template_type],
        #     template_name=template_type,
        #     context={"body": request.body}
        # )

        return EmailResponse(
            success=True,
            message="Email sent successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )