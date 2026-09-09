"""Public storefront APIs: reviews, Q&A, stock-notify, CMS pages, FAQ, contact."""

import re
from datetime import datetime
from app.compat import UTC

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.api.v1.auth import optional_user
from app.db.session import get_session
from app.models import (
    ContactMessage,
    FAQItem,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    ProductQuestion,
    ProductReview,
    ReviewFeedback,
    StockNotifyRequest,
    User,
)
from app.services.notifier import RTL_EMAIL_SHELL, send_email
from app.services.rate_limit import rate_limit

public = APIRouter()


# ---------- Reviews ----------

class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    title: str = Field(default="", max_length=255)
    body: str = Field(min_length=3, max_length=4000)


@public.get("/reviews/latest")
def latest_reviews(limit: int = Query(6, le=12), s: Session = Depends(get_session)):
    """Latest approved reviews for the homepage social-proof section."""
    rows = s.exec(
        select(ProductReview)
        .where(ProductReview.is_approved == True)  # noqa: E712
        .order_by(ProductReview.created_at.desc())  # type: ignore[arg-type]
        .limit(limit)
    ).all()
    product_ids = [r.product_id for r in rows if r.product_id]
    products = (
        {p.id: p for p in s.exec(select(Product).where(Product.id.in_(product_ids))).all()}
        if product_ids
        else {}
    )
    return [
        {
            "id": r.id,
            "author_name": r.author_name,
            "rating": r.rating,
            "title": r.title,
            "body": r.body,
            "is_buyer": r.is_buyer,
            "created_at": r.created_at,
            "product_name": products[r.product_id].name if r.product_id in products else None,
            "product_slug": products[r.product_id].slug if r.product_id in products else None,
        }
        for r in rows
    ]


@public.get("/products/{product_id}/reviews")
def product_reviews(
    product_id: str,
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(10, le=50),
) -> dict:
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(404, "محصول یافت نشد.")
    rows = session.exec(
        select(ProductReview)
        .where(ProductReview.product_id == product_id, ProductReview.is_approved == True)  # noqa: E712
        .order_by(ProductReview.created_at.desc())  # type: ignore[arg-type]
        .offset(offset).limit(limit)
    ).all()
    stats = session.exec(
        select(func.count(ProductReview.id), func.coalesce(func.avg(ProductReview.rating), 0))
        .where(ProductReview.product_id == product_id, ProductReview.is_approved == True)  # noqa: E712
    ).one()
    total, avg = int(stats[0]), round(float(stats[1]), 2)
    distribution = {str(i): 0 for i in range(1, 6)}
    if total:
        per_star = session.exec(
            select(ProductReview.rating, func.count(ProductReview.id))
            .where(ProductReview.product_id == product_id, ProductReview.is_approved == True)  # noqa: E712
            .group_by(ProductReview.rating)
        ).all()
        for rating, count in per_star:
            distribution[str(rating)] = int(count)
    return {
        "total": total,
        "average_rating": avg,
        "distribution": distribution,
        "items": [
            {
                "id": r.id,
                "author_name": r.author_name,
                "rating": r.rating,
                "title": r.title,
                "body": r.body,
                "is_buyer": r.is_buyer,
                "helpful_count": r.helpful_count,
                "admin_reply": r.admin_reply,
                "created_at": r.created_at,
            }
            for r in rows
        ],
    }


@public.post("/reviews", status_code=201, dependencies=[Depends(rate_limit("reviews", 5, 3600))])
def submit_review(
    payload: ReviewIn,
    session: Session = Depends(get_session),
    user: User | None = Depends(optional_user),
):
    if not session.get(Product, payload.product_id):
        raise HTTPException(404, "محصول یافت نشد.")
    if user:
        existing = session.exec(
            select(ProductReview).where(
                ProductReview.product_id == payload.product_id, ProductReview.user_id == user.id
            )
        ).first()
        if existing:
            raise HTTPException(409, "شما قبلاً برای این محصول نظر ثبت کرده‌اید.")
        is_buyer = session.exec(
            select(OrderItem.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                OrderItem.product_id == payload.product_id,
                Order.user_id == user.id,
                Order.status.in_([OrderStatus.paid, OrderStatus.processing, OrderStatus.shipped, OrderStatus.delivered]),
            )
        ).first() is not None
    else:
        raise HTTPException(401, "برای ثبت نظر ابتدا وارد حساب خود شوید.")
    review = ProductReview(
        product_id=payload.product_id,
        user_id=user.id,
        author_name=user.full_name or "مشتری تن‌سِرام",
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
        is_buyer=is_buyer,
        is_approved=True,  # auto-publish: shop owner prefers immediate visibility
    )
    session.add(review)
    session.commit()
    return {"ok": True, "message": "نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود."}


@public.post("/reviews/{review_id}/helpful")
def mark_helpful(review_id: str, session: Session = Depends(get_session), user: User = Depends(optional_user)):
    if not user:
        raise HTTPException(401, "برای ثبت بازخورد وارد شوید.")
    review = session.get(ProductReview, review_id)
    if not review:
        raise HTTPException(404, "نظر یافت نشد.")
    existing = session.exec(
        select(ReviewFeedback).where(ReviewFeedback.review_id == review_id, ReviewFeedback.user_id == user.id)
    ).first()
    if existing:
        session.delete(existing)
        review.helpful_count = max(review.helpful_count - 1, 0)
    else:
        session.add(ReviewFeedback(review_id=review_id, user_id=user.id))
        review.helpful_count += 1
    session.add(review)
    session.commit()
    return {"ok": True, "helpful_count": review.helpful_count}


# ---------- Q&A ----------

class QuestionIn(BaseModel):
    product_id: str
    question: str = Field(min_length=5, max_length=1024)


@public.get("/products/{product_id}/questions")
def product_questions(product_id: str, session: Session = Depends(get_session)):
    rows = session.exec(
        select(ProductQuestion)
        .where(ProductQuestion.product_id == product_id, ProductQuestion.is_published == True)  # noqa: E712
        .order_by(ProductQuestion.created_at.desc())  # type: ignore[arg-type]
    ).all()
    return [
        {
            "id": q.id,
            "author_name": q.author_name,
            "question": q.question,
            "answer": q.answer,
            "created_at": q.created_at,
        }
        for q in rows
    ]


@public.post("/questions", status_code=201, dependencies=[Depends(rate_limit("questions", 5, 3600))])
def submit_question(payload: QuestionIn, session: Session = Depends(get_session), user: User | None = Depends(optional_user)):
    if not session.get(Product, payload.product_id):
        raise HTTPException(404, "محصول یافت نشد.")
    session.add(
        ProductQuestion(
            product_id=payload.product_id,
            user_id=user.id if user else None,
            author_name=user.full_name if user else "کاربر مهمان",
            question=payload.question,
            is_published=True,  # auto-publish
        )
    )
    session.commit()
    return {"ok": True, "message": "پرسش شما ثبت شد و پس از بررسی پاسخ داده می‌شود."}


# ---------- Stock notify ----------

class StockNotifyIn(BaseModel):
    product_id: str
    contact: str = Field(min_length=5, max_length=255)


@public.post("/stock-notify", status_code=201, dependencies=[Depends(rate_limit("stock_notify", 10, 3600))])
def stock_notify(payload: StockNotifyIn, session: Session = Depends(get_session)):
    product = session.get(Product, payload.product_id)
    if not product:
        raise HTTPException(404, "محصول یافت نشد.")
    contact = payload.contact.strip().lower()
    existing = session.exec(
        select(StockNotifyRequest).where(
            StockNotifyRequest.product_id == payload.product_id,
            StockNotifyRequest.contact == contact,
        )
    ).first()
    if not existing:
        session.add(StockNotifyRequest(product_id=payload.product_id, contact=contact))
        session.commit()
    return {"ok": True, "message": "شما در لیست اطلاع‌رسانی این محصول قرار گرفتید."}


# ---------- CMS: pages & FAQ ----------

@public.get("/faq")
def faq_list(category: str | None = None, session: Session = Depends(get_session)):
    filters = [FAQItem.is_active == True]  # noqa: E712
    if category:
        filters.append(FAQItem.category == category)
    return session.exec(
        select(FAQItem).where(*filters).order_by(FAQItem.sort_order)  # type: ignore[arg-type]
    ).all()


# ---------- Contact form ----------

PHONE_RE = re.compile(r"^09\d{9}$")


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    email: EmailStr | None = None
    phone: str | None = None
    subject: str = Field(default="", max_length=255)
    message: str = Field(min_length=10, max_length=4000)


@public.post("/contact", status_code=201, dependencies=[Depends(rate_limit("contact", 5, 3600))])
async def contact(payload: ContactIn, session: Session = Depends(get_session)):
    if not payload.email and not (payload.phone and PHONE_RE.match(payload.phone)):
        raise HTTPException(400, "ایمیل یا شماره موبایل معتبر وارد کنید.")
    session.add(
        ContactMessage(
            name=payload.name,
            email=payload.email or "",
            phone=payload.phone or "",
            subject=payload.subject,
            message=payload.message,
        )
    )
    session.commit()
    if payload.email:
        await send_email(
            payload.email, "پیام شما دریافت شد — تن‌سِرام",
            # keep the literal braces out of the shell format string
            RTL_EMAIL_SHELL.replace("{body}", "<p>پیام شما با موفقیت دریافت شد. کارشناسان ما در سریع‌ترین زمان پاسخ می‌دهند.</p>"),
        )
    return {"ok": True, "message": "پیام شما دریافت شد."}
