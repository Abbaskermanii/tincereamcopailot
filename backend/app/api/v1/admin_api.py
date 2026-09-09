"""Unified admin API v2: RBAC-protected CRUD + dashboard analytics.

Older admin endpoints live in operations.py; this module owns every entity
introduced with the admin-panel revamp and is the surface the new UI uses.
"""

import json
import secrets
from datetime import datetime, timedelta

from app.compat import UTC

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, text
from sqlmodel import Session, select

from app.api.v1.auth import admin_user
from app.core.permissions import PERMISSIONS, ROLE_PRESETS, require_permission
from app.db.session import get_session
from app.models import (
    Article,
    ArticleCategory,
    Attribute,
    AttributeValue,
    Category,
    ContactMessage,
    Coupon,
    CouponRedemption,
    DiscountType,
    FAQItem,
    Notification,
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusHistory,
    PaymentTransaction,
    Product,
    ProductImage,
    ProductQuestion,
    ProductReview,
    ProductVariant,
    ReturnRequest,
    Setting,
    ShippingMethod,
    StockNotifyRequest,
    User,
    Role,
)
from app.services.cache import cache_delete_pattern
from app.services.orders import add_status_history, cancel_order_and_restock
from app.services.storage import put_image

admin = APIRouter(prefix="/admin")

def _require_perm(perm: str):
    return Depends(require_permission(perm))

# ============================ Dashboard ============================

@admin.get("/dashboard")
def dashboard(
    days: int = Query(default=30, ge=1, le=365),
    _: None = _require_perm("dashboard"),
    session: Session = Depends(get_session),
) -> dict:
    since = datetime.now(UTC) - timedelta(days=days)
    prev_since = since - timedelta(days=days)

    def window_totals(start: datetime, end: datetime) -> tuple[int, float]:
        row = session.exec(
            select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.created_at >= start, Order.created_at < end,
                Order.status != OrderStatus.cancelled,  # noqa: E712
            )
        ).one()
        return int(row[0] or 0), float(row[1] or 0)

    orders_n, revenue = window_totals(since, datetime.now(UTC))
    prev_n, prev_revenue = window_totals(prev_since, since)

    paid_n = int(session.exec(
        select(func.count(Order.id)).where(Order.created_at >= since, Order.status != OrderStatus.pending, Order.status != OrderStatus.cancelled)  # noqa: E712
    ).one() or 0)
    customers_n = int(session.exec(
        select(func.count(User.id)).where(User.is_admin == False)  # noqa: E712
    ).one() or 0)
    products_n = int(session.exec(select(func.count(Product.id))).one() or 0)
    pending_n = int(session.exec(
        select(func.count(Order.id)).where(Order.status == OrderStatus.pending)  # noqa: E712
    ).one() or 0)

    status_counts = {
        row[0]: int(row[1])
        for row in session.exec(select(Order.status, func.count(Order.id)).group_by(Order.status)).all()
    }

    sales_series = [
        {"date": str(r[0]), "orders": int(r[1]), "revenue": float(r[2] or 0)}
        for r in session.exec(
            text(
                "SELECT DATE(created_at) AS d, COUNT(*), SUM(total_amount) FROM orders "
                "WHERE created_at >= :since AND status != 'cancelled' "
                "GROUP BY DATE(created_at) ORDER BY d"
            ).bindparams(since=since)
        ).all()
    ]

    top_products = [
        {"product_id": r[0], "name": r[1], "qty": int(r[2]), "revenue": float(r[3] or 0)}
        for r in session.exec(
            text(
                "SELECT oi.product_id, oi.product_name_snapshot, SUM(oi.quantity), SUM(oi.subtotal) "
                "FROM order_items oi JOIN orders o ON o.id = oi.order_id "
                "WHERE o.created_at >= :since AND o.status != 'cancelled' "
                "GROUP BY oi.product_id, oi.product_name_snapshot ORDER BY 3 DESC LIMIT 10"
            ).bindparams(since=since)
        ).all()
    ]

    top_customers = [
        {"user_id": r[0], "name": r[1], "orders": int(r[2]), "spent": float(r[3] or 0)}
        for r in session.exec(
            text(
                "SELECT o.user_id, MAX(o.customer_name), COUNT(*), SUM(o.total_amount) FROM orders o "
                "WHERE o.user_id IS NOT NULL AND o.created_at >= :since AND o.status != 'cancelled' "
                "GROUP BY o.user_id ORDER BY 4 DESC LIMIT 10"
            ).bindparams(since=since)
        ).all()
    ]

    low_stock = [
        {"id": p.id, "name": p.name, "stock_qty": p.stock_qty, "slug": p.slug}
        for p in session.exec(
            select(Product).where(Product.stock_qty <= 5, Product.is_active == True).order_by(Product.stock_qty)  # noqa: E712
            .limit(10)
        ).all()
    ]

    recent_orders = [
        {
            "id": o.id, "order_number": o.order_number, "customer_name": o.customer_name,
            "total_amount": float(o.total_amount), "status": o.status.value if isinstance(o.status, OrderStatus) else o.status,
            "created_at": o.created_at,
        }
        for o in session.exec(select(Order).order_by(Order.created_at.desc()).limit(10)).all()
    ]

    aov = round(revenue / orders_n) if orders_n else 0

    def pct(cur: float, prev: float) -> float | None:
        if not prev:
            return None
        return round((cur - prev) / prev * 100, 1)

    return {
        "period_days": days,
        "orders": orders_n,
        "orders_change_pct": pct(orders_n, prev_n),
        "revenue": revenue,
        "revenue_change_pct": pct(revenue, prev_revenue),
        "average_order_value": aov,
        "customers": customers_n,
        "products": products_n,
        "pending_orders": pending_n,
        "status_counts": status_counts,
        "sales_series": sales_series,
        "top_products": top_products,
        "top_customers": top_customers,
        "low_stock": low_stock,
        "recent_orders": recent_orders,
    }

# ============================ Product variants ============================

class VariantIn(BaseModel):
    name: str
    sku: str
    image_url: str | None = None
    price_delta: float = 0
    absolute_price: float | None = None
    stock_qty: int = 0
    sort_order: int = 0
    is_active: bool = True

@admin.get("/products/{product_id}/variants")
def list_variants(product_id: str, _: None = _require_perm("products"), session: Session = Depends(get_session)):
    return session.exec(
        select(ProductVariant).where(ProductVariant.product_id == product_id).order_by(ProductVariant.sort_order)  # type: ignore[arg-type]
    ).all()

@admin.post("/products/{product_id}/variants", status_code=201)
def create_variant(product_id: str, payload: VariantIn, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    if not session.get(Product, product_id):
        raise HTTPException(404, "محصول یافت نشد.")
    if session.exec(select(ProductVariant).where(ProductVariant.product_id == product_id, ProductVariant.sku == payload.sku)).first():
        raise HTTPException(409, "SKU وارینت تکراری است.")
    row = ProductVariant(product_id=product_id, **payload.model_dump())
    session.add(row)
    session.commit()
    cache_delete_pattern("products:*")
    session.refresh(row)
    return row

@admin.patch("/variants/{variant_id}")
def update_variant(variant_id: str, payload: dict, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    row = session.get(ProductVariant, variant_id)
    if not row:
        raise HTTPException(404, "وارینت یافت نشد.")
    for key in ("name", "sku", "image_url", "price_delta", "absolute_price", "stock_qty", "sort_order", "is_active"):
        if key in payload:
            setattr(row, key, payload[key])
    session.add(row)
    session.commit()
    cache_delete_pattern("products:*")
    return row

@admin.delete("/variants/{variant_id}")
def delete_variant(variant_id: str, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    row = session.get(ProductVariant, variant_id)
    if not row:
        raise HTTPException(404, "وارینت یافت نشد.")
    session.delete(row)
    session.commit()
    cache_delete_pattern("products:*")
    return {"ok": True}

# ============================ Reviews & Q&A moderation ============================

@admin.get("/reviews")
def admin_reviews(
    approved: bool | None = None,
    _: None = _require_perm("reviews"),
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(50, le=200),
):
    filters = []
    if approved is not None:
        filters.append(ProductReview.is_approved == approved)
    rows = session.exec(
        select(ProductReview).where(*filters).order_by(ProductReview.created_at.desc())  # type: ignore[arg-type]
        .offset(offset).limit(limit)
    ).all()
    out = []
    for r in rows:
        p = session.get(Product, r.product_id)
        out.append({
            "id": r.id, "product_id": r.product_id, "product_name": p.name if p else None,
            "author_name": r.author_name, "rating": r.rating, "title": r.title, "body": r.body,
            "is_approved": r.is_approved, "is_buyer": r.is_buyer, "helpful_count": r.helpful_count,
            "admin_reply": r.admin_reply, "created_at": r.created_at,
        })
    return out

class ReviewModerateIn(BaseModel):
    is_approved: bool | None = None
    admin_reply: str | None = None

@admin.patch("/reviews/{review_id}")
def moderate_review(review_id: str, payload: ReviewModerateIn, user: User = Depends(require_permission("reviews")), session: Session = Depends(get_session)):
    row = session.get(ProductReview, review_id)
    if not row:
        raise HTTPException(404, "نظر یافت نشد.")
    if payload.is_approved is not None:
        row.is_approved = payload.is_approved
    if payload.admin_reply is not None:
        row.admin_reply = payload.admin_reply
        row.replied_at = datetime.now(UTC)
    session.add(row)
    session.commit()
    return row

@admin.delete("/reviews/{review_id}")
def delete_review(review_id: str, user: User = Depends(require_permission("reviews")), session: Session = Depends(get_session)):
    row = session.get(ProductReview, review_id)
    if not row:
        raise HTTPException(404, "نظر یافت نشد.")
    session.delete(row)
    session.commit()
    return {"ok": True}

@admin.get("/questions")
def admin_questions(published: bool | None = None, _: None = _require_perm("reviews"), session: Session = Depends(get_session)):
    filters = []
    if published is not None:
        filters.append(ProductQuestion.is_published == published)
    rows = session.exec(
        select(ProductQuestion).where(*filters).order_by(ProductQuestion.created_at.desc())  # type: ignore[arg-type]
    ).all()
    out = []
    for q in rows:
        p = session.get(Product, q.product_id)
        out.append({
            "id": q.id, "product_id": q.product_id, "product_name": p.name if p else None,
            "author_name": q.author_name, "question": q.question, "answer": q.answer,
            "is_published": q.is_published, "created_at": q.created_at,
        })
    return out

class QuestionAnswerIn(BaseModel):
    answer: str = Field(min_length=1, max_length=4000)
    is_published: bool = True

@admin.patch("/questions/{question_id}")
def answer_question(question_id: str, payload: QuestionAnswerIn, user: User = Depends(require_permission("reviews")), session: Session = Depends(get_session)):
    row = session.get(ProductQuestion, question_id)
    if not row:
        raise HTTPException(404, "پرسش یافت نشد.")
    row.answer = payload.answer
    row.is_published = payload.is_published
    row.answered_by = user.id
    session.add(row)
    session.commit()
    return row

@admin.delete("/questions/{question_id}")
def delete_question(question_id: str, user: User = Depends(require_permission("reviews")), session: Session = Depends(get_session)):
    row = session.get(ProductQuestion, question_id)
    if not row:
        raise HTTPException(404, "پرسش یافت نشد.")
    session.delete(row)
    session.commit()
    return {"ok": True}

# ============================ Stock-notify requests ============================


# ============================ Shipping methods ============================

class ShippingIn(BaseModel):
    name: str
    code: str
    cost: float = 0
    free_over_amount: float | None = None
    estimated_days_min: int = 2
    estimated_days_max: int = 5
    is_active: bool = True
    sort_order: int = 0

@admin.get("/shipping-methods")
def list_shipping(_: None = _require_perm("shipping"), session: Session = Depends(get_session)):
    return session.exec(select(ShippingMethod).order_by(ShippingMethod.sort_order)).all()

@admin.post("/shipping-methods", status_code=201)
def create_shipping(payload: ShippingIn, user: User = Depends(require_permission("shipping")), session: Session = Depends(get_session)):
    if session.exec(select(ShippingMethod).where(ShippingMethod.code == payload.code)).first():
        raise HTTPException(409, "کد روش ارسال تکراری است.")
    row = ShippingMethod(**payload.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row

@admin.patch("/shipping-methods/{method_id}")
def update_shipping(method_id: str, payload: dict, user: User = Depends(require_permission("shipping")), session: Session = Depends(get_session)):
    row = session.get(ShippingMethod, method_id)
    if not row:
        raise HTTPException(404, "روش ارسال یافت نشد.")
    for key in ("name", "code", "cost", "free_over_amount", "estimated_days_min", "estimated_days_max", "is_active", "sort_order"):
        if key in payload:
            setattr(row, key, payload[key])
    session.add(row)
    session.commit()
    return row

@admin.delete("/shipping-methods/{method_id}")
def delete_shipping(method_id: str, user: User = Depends(require_permission("shipping")), session: Session = Depends(get_session)):
    row = session.get(ShippingMethod, method_id)
    if not row:
        raise HTTPException(404, "روش ارسال یافت نشد.")
    session.delete(row)
    session.commit()
    return {"ok": True}

# ============================ Returns (RMA) ============================

@admin.get("/returns")
def list_returns(status: str | None = None, _: None = _require_perm("returns"), session: Session = Depends(get_session)):
    filters = []
    if status:
        filters.append(ReturnRequest.status == status)
    rows = session.exec(
        select(ReturnRequest).where(*filters).order_by(ReturnRequest.created_at.desc())  # type: ignore[arg-type]
    ).all()
    out = []
    for r in rows:
        order = session.get(Order, r.order_id)
        out.append({
            "id": r.id, "order_id": r.order_id, "order_number": order.order_number if order else None,
            "reason": r.reason, "status": r.status, "admin_note": r.admin_note,
            "refund_amount": float(r.refund_amount), "created_at": r.created_at, "resolved_at": r.resolved_at,
        })
    return out

class ReturnUpdateIn(BaseModel):
    status: str | None = None
    admin_note: str | None = None
    refund_amount: float | None = None

@admin.patch("/returns/{return_id}")
def update_return(return_id: str, payload: ReturnUpdateIn, user: User = Depends(require_permission("returns")), session: Session = Depends(get_session)):
    row = session.get(ReturnRequest, return_id)
    if not row:
        raise HTTPException(404, "درخواست مرجوعی یافت نشد.")
    if payload.status and payload.status not in {"requested", "approved", "rejected", "received", "refunded"}:
        raise HTTPException(400, "وضعیت نامعتبر است.")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(row, key, value)
    if payload.status in {"received", "refunded", "rejected"} and not row.resolved_at:
        row.resolved_at = datetime.now(UTC)
    session.add(row)
    session.commit()
    return row

# ============================ Orders: detail & fulfilment ============================

@admin.get("/orders/{order_id}")
def order_detail(order_id: str, _: None = _require_perm("orders"), session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(404, "سفارش یافت نشد.")
    items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    history = session.exec(
        select(OrderStatusHistory).where(OrderStatusHistory.order_id == order.id).order_by(OrderStatusHistory.created_at)  # type: ignore[arg-type]
    ).all()
    txns = session.exec(
        select(PaymentTransaction).where(PaymentTransaction.order_id == order.id).order_by(PaymentTransaction.created_at)  # type: ignore[arg-type]
    ).all()
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status.value,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "email": order.email,
        "address": order.address, "city": order.city, "province": order.province, "postal_code": order.postal_code,
        "total_amount": float(order.total_amount), "shipping_cost": float(order.shipping_cost),
        "discount_amount": float(order.discount_amount),
        "coupon_code": order.coupon_code, "gift_wrap": order.gift_wrap, "gift_note": order.gift_note,
        "shipping_method_name": order.shipping_method_name,
        "tracking_code": order.tracking_code, "carrier": order.carrier,
        "admin_note": order.admin_note,
        "payment_authority": order.payment_authority, "payment_ref_id": order.payment_ref_id,
        "user_id": order.user_id,
        "created_at": order.created_at, "updated_at": order.updated_at,
        "items": [
            {
                "product_id": i.product_id, "variant_name": i.variant_name_snapshot,
                "product_name": i.product_name_snapshot, "unit_price": float(i.unit_price_snapshot),
                "quantity": i.quantity, "subtotal": float(i.subtotal),
            }
            for i in items
        ],
        "history": [
            {"from": h.from_status, "to": h.to_status, "note": h.note, "at": h.created_at}
            for h in history
        ],
        "transactions": [
            {"id": t.id, "gateway": t.gateway, "status": t.status, "ref_id": t.ref_id,
             "amount": float(t.amount_toman), "message": t.message, "at": t.created_at}
            for t in txns
        ],
    }

class OrderFulfilIn(BaseModel):
    status: str | None = None
    tracking_code: str | None = Field(default=None, max_length=64)
    carrier: str | None = Field(default=None, max_length=64)
    admin_note: str | None = Field(default=None, max_length=1024)

@admin.patch("/orders/{order_id}/fulfil")
def fulfil_order(order_id: str, payload: OrderFulfilIn, user: User = Depends(require_permission("orders")), session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(404, "سفارش یافت نشد.")
    data = payload.model_dump(exclude_unset=True)
    if payload.status:
        if payload.status not in {s.value for s in OrderStatus}:
            raise HTTPException(400, "وضعیت نامعتبر است.")
        new_status = OrderStatus(payload.status)
        if new_status != order.status:
            if new_status == OrderStatus.cancelled:
                cancel_order_and_restock(session, order, actor_id=user.id, note="لغو توسط مدیر")
            else:
                previous = order.status.value
                order.status = new_status
                add_status_history(session, order, new_status.value, actor_id=user.id, note=f"تغییر وضعیت از {previous} توسط مدیر")
    if payload.tracking_code is not None:
        order.tracking_code = payload.tracking_code
    if payload.carrier is not None:
        order.carrier = payload.carrier
    if payload.admin_note is not None:
        order.admin_note = payload.admin_note
    session.add(order)
    session.commit()
    session.refresh(order)
    from app.api.v1.auth import notify_user
    notify_user(session, str(order.user_id), "order", "بروزرسانی وضعیت سفارش", f"وضعیت سفارش شما به «{order.status.value}» تغییر یافت.", link="/account?tab=orders")
    cache_delete_pattern("products:*")
    return {"ok": True, "status": order.status.value}

# ============================ Users & roles ============================

@admin.get("/users")
def admin_users_list(
    search: str | None = None,
    _: None = _require_perm("users"),
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(50, le=200),
):
    filters = []
    if search:
        like = f"%{search}%"
        from sqlalchemy import or_
        filters.append(or_(User.email.ilike(like), User.full_name.ilike(like), User.phone.ilike(like)))
    rows = session.exec(select(User).where(*filters).order_by(User.created_at.desc()).offset(offset).limit(limit)).all()  # type: ignore[arg-type]
    total = int(session.exec(select(func.count(User.id)).where(*filters)).one() or 0)
    roles = {r.id: r.name for r in session.exec(select(Role)).all()}
    return {
        "total": total,
        "items": [
            {
                "id": u.id, "email": u.email, "full_name": u.full_name, "phone": u.phone,
                "is_admin": u.is_admin, "is_active": u.is_active, "role_id": u.role_id,
                "role_name": roles.get(u.role_id), "last_login_at": u.last_login_at, "created_at": u.created_at,
            }
            for u in rows
        ],
    }

@admin.get("/roles")
def list_roles(_: None = _require_perm("users"), session: Session = Depends(get_session)):
    return [
        {"id": r.id, "name": r.name, "permissions": [p for p in r.permissions.split(",") if p]}
        for r in session.exec(select(Role)).all()
    ]

@admin.get("/permissions")
def permission_catalog(_: None = _require_perm("users")):
    return {"permissions": PERMISSIONS, "presets": ROLE_PRESETS}

class RoleIn(BaseModel):
    name: str
    permissions: list[str] = []

@admin.post("/roles", status_code=201)
def create_role(payload: RoleIn, user: User = Depends(require_permission("users")), session: Session = Depends(get_session)):
    if session.exec(select(Role).where(Role.name == payload.name)).first():
        raise HTTPException(409, "نقش تکراری است.")
    invalid = [p for p in payload.permissions if p not in PERMISSIONS and p != "*"]
    if invalid:
        raise HTTPException(400, f"دسترسی نامعتبر: {invalid}")
    row = Role(name=payload.name, permissions=",".join(payload.permissions))
    session.add(row)
    session.commit()
    session.refresh(row)
    return {"id": row.id, "name": row.name, "permissions": payload.permissions}

@admin.patch("/roles/{role_id}")
def update_role(role_id: str, payload: RoleIn, user: User = Depends(require_permission("users")), session: Session = Depends(get_session)):
    row = session.get(Role, role_id)
    if not row:
        raise HTTPException(404, "نقش یافت نشد.")
    invalid = [p for p in payload.permissions if p not in PERMISSIONS and p != "*"]
    if invalid:
        raise HTTPException(400, f"دسترسی نامعتبر: {invalid}")
    row.name = payload.name
    row.permissions = ",".join(payload.permissions)
    session.add(row)
    session.commit()
    return {"id": row.id, "name": row.name, "permissions": payload.permissions}

@admin.delete("/roles/{role_id}")
def delete_role(role_id: str, user: User = Depends(require_permission("users")), session: Session = Depends(get_session)):
    row = session.get(Role, role_id)
    if not row:
        raise HTTPException(404, "نقش یافت نشد.")
    if session.exec(select(User).where(User.role_id == role_id)).first():
        raise HTTPException(409, "کاربرانی با این نقش وجود دارند.")
    session.delete(row)
    session.commit()
    return {"ok": True}

# ============================ Notifications broadcast ============================

class BroadcastIn(BaseModel):
    title: str = Field(max_length=255)
    body: str = Field(default="", max_length=2000)

# ============================ Contact messages & newsletter ============================

@admin.get("/messages")
def contact_messages(_: None = _require_perm("messages"), session: Session = Depends(get_session)):
    return session.exec(select(ContactMessage).order_by(ContactMessage.created_at.desc())).all()  # type: ignore[arg-type]

class MessageReplyIn(BaseModel):
    reply: str = Field(min_length=1, max_length=4000)
    mark_read: bool = True

@admin.patch("/messages/{message_id}")
def reply_message(message_id: str, payload: MessageReplyIn, user: User = Depends(require_permission("messages")), session: Session = Depends(get_session)):
    row = session.get(ContactMessage, message_id)
    if not row:
        raise HTTPException(404, "پیام یافت نشد.")
    row.reply = payload.reply
    row.replied_at = datetime.now(UTC)
    if payload.mark_read:
        row.is_read = True
    session.add(row)
    session.commit()
    return row

@admin.patch("/messages/{message_id}/read")
def mark_message_read(message_id: str, user: User = Depends(require_permission("messages")), session: Session = Depends(get_session)):
    row = session.get(ContactMessage, message_id)
    if not row:
        raise HTTPException(404, "پیام یافت نشد.")
    row.is_read = True
    session.add(row)
    session.commit()
    return row

@admin.delete("/messages/{message_id}")
def delete_message(message_id: str, user: User = Depends(require_permission("messages")), session: Session = Depends(get_session)):
    row = session.get(ContactMessage, message_id)
    if not row:
        raise HTTPException(404, "پیام یافت نشد.")
    session.delete(row)
    session.commit()
    return {"ok": True}

@admin.get("/coupon-redemptions")
def coupon_redemptions(coupon_id: str | None = None, _: None = _require_perm("coupons"), session: Session = Depends(get_session)):
    filters = []
    if coupon_id:
        filters.append(CouponRedemption.coupon_id == coupon_id)
    rows = session.exec(
        select(CouponRedemption).where(*filters).order_by(CouponRedemption.created_at.desc()).limit(500)  # type: ignore[arg-type]
    ).all()
    return [
        {
            "id": r.id, "coupon_id": r.coupon_id, "user_id": r.user_id, "order_id": r.order_id,
            "discount_amount": float(r.discount_amount), "created_at": r.created_at,
        }
        for r in rows
    ]

# ============================ Static pages & FAQ ============================

class PageIn(BaseModel):
    title: str
    slug: str
    content: str = ""
    meta_title: str | None = None
    meta_description: str | None = None
    is_published: bool = False
    sort_order: int = 0

class FAQIn(BaseModel):
    question: str = Field(max_length=512)
    answer: str
    category: str = "عمومی"
    sort_order: int = 0
    is_active: bool = True

@admin.get("/faq")
def admin_faq(_: None = _require_perm("content"), session: Session = Depends(get_session)):
    return session.exec(select(FAQItem).order_by(FAQItem.sort_order)).all()

@admin.post("/faq", status_code=201)
def create_faq(payload: FAQIn, user: User = Depends(require_permission("content")), session: Session = Depends(get_session)):
    row = FAQItem(**payload.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row

@admin.patch("/faq/{faq_id}")
def update_faq(faq_id: str, payload: dict, user: User = Depends(require_permission("content")), session: Session = Depends(get_session)):
    row = session.get(FAQItem, faq_id)
    if not row:
        raise HTTPException(404, "سؤال یافت نشد.")
    for key in ("question", "answer", "category", "sort_order", "is_active"):
        if key in payload:
            setattr(row, key, payload[key])
    session.add(row)
    session.commit()
    return row

@admin.delete("/faq/{faq_id}")
def delete_faq(faq_id: str, user: User = Depends(require_permission("content")), session: Session = Depends(get_session)):
    row = session.get(FAQItem, faq_id)
    if not row:
        raise HTTPException(404, "سؤال یافت نشد.")
    session.delete(row)
    session.commit()
    return {"ok": True}



# ============================ Generic media upload ============================

ALLOWED_IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

@admin.post("/media/upload", status_code=201)
async def upload_media(file: UploadFile = File(...), user: User = Depends(admin_user), session: Session = Depends(get_session)):
    """Upload any admin image (brand logo, category, article cover, carousel, …)
    and return its URL. Product images keep their dedicated endpoint."""
    from app.core.config import get_settings as _gs
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(415, "فرمت تصویر پشتیبانی نمی‌شود (JPG، PNG یا WebP).")
    data = await file.read()
    max_bytes = _gs().max_upload_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(413, f"حجم تصویر باید کمتر از {_gs().max_upload_size_mb} مگابایت باشد.")
    extension = ALLOWED_IMAGE_TYPES[content_type]
    object_name = f"uploads/{datetime.now(UTC):%Y/%m}/{secrets.token_hex(12)}.{extension}"
    url = put_image(object_name, data, content_type)
    session.commit()
    return {"url": url, "object_name": object_name}

@admin.post("/avatar/upload", status_code=201)
async def upload_avatar(file: UploadFile = File(...), user: User = Depends(admin_user), session: Session = Depends(get_session)):
    """Upload user avatar image (configurable max size, image only). Updates user.avatar_url."""
    from app.core.config import get_settings as _gs
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(415, "فرمت تصویر پشتیبانی نمی‌شود (JPG، PNG یا WebP).")
    data = await file.read()
    max_bytes = _gs().max_avatar_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(413, f"حجم تصویر باید کمتر از {_gs().max_avatar_size_mb} مگابایت باشد.")
    extension = ALLOWED_IMAGE_TYPES[content_type]
    object_name = f"avatars/{user.id}/{secrets.token_hex(12)}.{extension}"
    url = put_image(object_name, data, content_type)
    user.avatar_url = url
    session.add(user)
    session.commit()
    return {"url": url, "object_name": object_name}

# ============================ Settings (grouped) ============================

SETTING_DEFINITIONS: list[dict] = [
    {"key": "store_name", "group": "general", "label": "نام فروشگاه", "type": "string", "default": "تن‌سِرام"},
    {"key": "store_logo_url", "group": "general", "label": "لوگو", "type": "image", "default": ""},
    {"key": "store_phone", "group": "general", "label": "تلفن تماس", "type": "string", "default": ""},
    {"key": "store_email", "group": "general", "label": "ایمیل", "type": "string", "default": ""},
    {"key": "store_address", "group": "general", "label": "آدرس", "type": "text", "default": ""},
    {"key": "instagram_url", "group": "social", "label": "اینستاگرام", "type": "string", "default": ""},
    {"key": "telegram_url", "group": "social", "label": "تلگرام", "type": "string", "default": ""},
    {"key": "whatsapp_url", "group": "social", "label": "واتس‌اپ", "type": "string", "default": ""},
    {"key": "seo_default_title", "group": "seo", "label": "عنوان پیش‌فرض", "type": "string", "default": ""},
    {"key": "seo_default_description", "group": "seo", "label": "توضیح پیش‌فرض", "type": "text", "default": ""},
    {"key": "tax_rate_percent", "group": "store", "label": "مالیات (٪)", "type": "number", "default": "0"},
    {"key": "shipping_note", "group": "store", "label": "یادداشت ارسال", "type": "text", "default": ""},
    {"key": "gift_fee", "group": "store", "label": "هزینه بسته‌بندی هدیه", "type": "number", "default": "30000"},
    {"key": "welcome_notification_title", "group": "general", "label": "متن اعلان خوشآمد (عنوان)", "type": "string", "default": "خوش آمدید به تنسِرام"},
    {"key": "welcome_notification_body", "group": "general", "label": "متن اعلان خوشآمد (متن)", "type": "text", "default": "حساب شما ساخته شد. وضعیت سفارشها و تخفیفها را در پروفایل دنبال کنید."},
]
SETTING_GROUPS = [
    {"key": "general", "label": "عمومی"},
    {"key": "social", "label": "شبکه‌های اجتماعی"},
    {"key": "seo", "label": "سئو"},
    {"key": "store", "label": "فروشگاه"},
]

# ============================ Product images (list for editor) ============================

@admin.get("/products/{product_id}/images")
def admin_product_images(product_id: str, _: None = _require_perm("products"), session: Session = Depends(get_session)):
    rows = session.exec(
        select(ProductImage).where(ProductImage.product_id == product_id).order_by(ProductImage.is_primary.desc(), ProductImage.sort_order)  # type: ignore[arg-type]
    ).all()
    return [
        {"id": i.id, "url": i.url, "alt_text": i.alt_text, "sort_order": i.sort_order, "is_primary": i.is_primary}
        for i in rows
    ]

# ============================ Admin list v2: products & orders ============================

@admin.get("/products-v2")
def admin_products_v2(
    search: str | None = None,
    category_id: str | None = None,
    brand_id: str | None = None,
    status: str | None = None,          # active | inactive
    stock: str | None = None,           # in | low | out
    _: None = _require_perm("products"),
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(20, le=100),
):
    filters = []
    if search:
        like = f"%{search}%"
        from sqlalchemy import or_
        filters.append(or_(Product.name.ilike(like), Product.sku.ilike(like)))
    if category_id:
        filters.append(Product.category_id == category_id)
    if brand_id:
        filters.append(Product.brand_id == brand_id)
    if status == "active":
        filters.append(Product.is_active == True)  # noqa: E712
    elif status == "inactive":
        filters.append(Product.is_active == False)  # noqa: E712
    if stock == "out":
        filters.append(Product.stock_qty == 0)
    elif stock == "low":
        filters.append(Product.stock_qty > 0, Product.stock_qty <= 5)  # type: ignore[arg-type]
    elif stock == "in":
        filters.append(Product.stock_qty > 5)

    total = int(session.exec(select(func.count(Product.id)).where(*filters)).one() or 0)
    rows = session.exec(
        select(Product).where(*filters).order_by(Product.created_at.desc()).offset(offset).limit(limit)  # type: ignore[arg-type]
    ).all()
    categories = {c.id: c.name for c in session.exec(select(Category)).all()} if rows else {}
    items = []
    for p in rows:
        img = p.primary_image
        items.append({
            "id": p.id, "name": p.name, "slug": p.slug, "sku": p.sku,
            "price": float(p.price), "compare_at_price": float(p.compare_at_price) if p.compare_at_price else None,
            "stock_qty": p.stock_qty, "is_active": p.is_active,
            "category_name": categories.get(p.category_id),
            "image_url": img.url if img else None, "created_at": p.created_at,
        })
    return {"total": total, "items": items}

@admin.get("/orders-v2")
def admin_orders_v2(
    search: str | None = None,
    status: str | None = None,
    days: int | None = Query(default=None, ge=1, le=365),
    _: None = _require_perm("orders"),
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(20, le=100),
):
    filters = []
    if search:
        like = f"%{search}%"
        from sqlalchemy import or_
        filters.append(or_(Order.order_number.ilike(like), Order.customer_name.ilike(like), Order.phone.ilike(like)))
    if status:
        try:
            filters.append(Order.status == OrderStatus(status))
        except ValueError:
            raise HTTPException(400, "وضعیت نامعتبر است.")
    if days:
        filters.append(Order.created_at >= datetime.now(UTC) - timedelta(days=days))

    total = int(session.exec(select(func.count(Order.id)).where(*filters)).one() or 0)
    rows = session.exec(
        select(Order).where(*filters).order_by(Order.created_at.desc()).offset(offset).limit(limit)  # type: ignore[arg-type]
    ).all()
    items = [
        {
            "id": o.id, "order_number": o.order_number, "customer_name": o.customer_name,
            "phone": o.phone, "total_amount": float(o.total_amount),
            "status": o.status.value if isinstance(o.status, OrderStatus) else str(o.status),
            "items_count": int(session.exec(
                select(func.coalesce(func.sum(OrderItem.quantity), 0)).where(OrderItem.order_id == o.id)  # type: ignore[arg-type]
            ).one() or 0),
            "created_at": o.created_at,
        }
        for o in rows
    ]
    return {"total": total, "items": items}

# ============================ Attributes & Product Specs ============================

class AttributeIn(BaseModel):
    name: str = Field(max_length=64)
    slug: str = Field(max_length=64)
    description: str | None = None
    attr_type: str = Field(default="other", max_length=32)
    is_filterable: bool = False
    sort_order: int = 0

class AttributeValueIn(BaseModel):
    attribute_id: str
    value: str = Field(max_length=128)
    slug: str = Field(max_length=128)
    swatch_image_url: str | None = None
    sort_order: int = 0

class ProductSpecIn(BaseModel):
    attribute_id: str
    attribute_value_id: str
    custom_value: str | None = None
    sort_order: int = 0

@admin.get("/attributes")
def list_attributes(_: None = _require_perm("products"), session: Session = Depends(get_session)):
    rows = session.exec(select(Attribute).order_by(Attribute.sort_order)).all()  # type: ignore[arg-type]
    result = []
    for a in rows:
        vals = session.exec(
            select(AttributeValue).where(AttributeValue.attribute_id == a.id).order_by(AttributeValue.sort_order)  # type: ignore[arg-type]
        ).all()
        result.append({
            "id": a.id, "name": a.name, "slug": a.slug, "description": a.description,
            "attr_type": a.attr_type, "is_filterable": a.is_filterable, "sort_order": a.sort_order,
            "values": [{"id": v.id, "value": v.value, "slug": v.slug, "swatch_image_url": v.swatch_image_url, "sort_order": v.sort_order} for v in vals],
        })
    return result

@admin.post("/attributes", status_code=201)
def create_attribute(payload: AttributeIn, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    existing = session.exec(select(Attribute).where(Attribute.slug == payload.slug)).first()  # type: ignore[arg-type]
    if existing:
        raise HTTPException(400, "Slug تکراری است.")
    row = Attribute(**payload.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return {"id": row.id, "name": row.name, "slug": row.slug}

@admin.patch("/attributes/{attribute_id}")
def update_attribute(attribute_id: str, payload: AttributeIn, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    row = session.get(Attribute, attribute_id)
    if not row:
        raise HTTPException(404, "ویژگی یافت نشد.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    session.add(row)
    session.commit()
    return {"ok": True}

@admin.delete("/attributes/{attribute_id}")
def delete_attribute(attribute_id: str, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    row = session.get(Attribute, attribute_id)
    if not row:
        raise HTTPException(404, "ویژگی یافت نشد.")
    session.delete(row)
    session.commit()
    return {"ok": True}

@admin.post("/attribute-values", status_code=201)
def create_attribute_value(payload: AttributeValueIn, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    attr = session.get(Attribute, payload.attribute_id)
    if not attr:
        raise HTTPException(404, "ویژگی یافت نشد.")
    existing = session.exec(select(AttributeValue).where(AttributeValue.slug == payload.slug)).first()  # type: ignore[arg-type]
    if existing:
        raise HTTPException(400, "Slug تکراری است.")
    row = AttributeValue(**payload.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return {"id": row.id, "value": row.value, "slug": row.slug}

@admin.delete("/attribute-values/{value_id}")
def delete_attribute_value(value_id: str, user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    row = session.get(AttributeValue, value_id)
    if not row:
        raise HTTPException(404, "مقدار ویژگی یافت نشد.")
    session.delete(row)
    session.commit()
    return {"ok": True}

@admin.get("/products/{product_id}/specs")
def list_product_specs(product_id: str, _: None = _require_perm("products"), session: Session = Depends(get_session)):
    from app.models import ProductAttributeValue
    rows = session.exec(
        select(ProductAttributeValue).where(ProductAttributeValue.product_id == product_id).order_by(ProductAttributeValue.sort_order)  # type: ignore[arg-type]
    ).all()
    result = []
    for ps in rows:
        attr = session.get(Attribute, ps.attribute_id)
        val = session.get(AttributeValue, ps.attribute_value_id)
        result.append({
            "id": ps.id,
            "attribute_id": ps.attribute_id,
            "attribute_name": attr.name if attr else None,
            "attribute_value_id": ps.attribute_value_id,
            "attribute_value": val.value if val else None,
            "custom_value": ps.custom_value,
            "sort_order": ps.sort_order,
        })
    return result

@admin.put("/products/{product_id}/specs")
def set_product_specs(product_id: str, specs: list[ProductSpecIn], user: User = Depends(require_permission("products")), session: Session = Depends(get_session)):
    from app.models import ProductAttributeValue
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(404, "محصول یافت نشد.")
    for existing in session.exec(select(ProductAttributeValue).where(ProductAttributeValue.product_id == product_id)).all():
        session.delete(existing)
    for idx, spec in enumerate(specs):
        session.add(ProductAttributeValue(
            product_id=product_id,
            attribute_id=spec.attribute_id,
            attribute_value_id=spec.attribute_value_id,
            custom_value=spec.custom_value,
            sort_order=spec.sort_order or idx * 10,
        ))
    session.commit()
    cache_delete_pattern(f"products:*")
    return {"ok": True, "count": len(specs)}

# ============================ Loyalty Program ============================

@admin.get("/loyalty/{user_id}")
def get_user_loyalty(user_id: str, _: None = _require_perm("users"), session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "کاربر یافت نشد.")
    total_points = getattr(user, "loyalty_points", 0) or 0
    tier = "bronze"
    for t, threshold in sorted(LOYALTY_TIER_THRESHOLDS.items(), key=lambda x: -x[1]):
        if total_points >= threshold:
            tier = t
            break
    return {"user_id": user_id, "points": total_points, "tier": tier}

LOYALTY_TIER_THRESHOLDS = {
    "bronze": 0,
    "silver": 100000,
    "gold": 500000,
    "platinum": 2000000,
}

# ============================ Navigation CMS ============================

class NavigationItemIn(BaseModel):
    label: str = Field(max_length=128)
    url: str = Field(max_length=512)
    sort_order: int = 0
    is_active: bool = True
    open_in_new_tab: bool = False


# ============================ Notifications (admin sender) ============================


class NotificationSendIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    body: str = ""
    user_ids: list[str] | None = None
    all_users: bool = False


@admin.post("/notifications", status_code=201)
def send_notifications(payload: NotificationSendIn, _: User = Depends(admin_user), session: Session = Depends(get_session)):
    from app.models import Notification

    if payload.all_users:
        targets = [u.id for u in session.exec(select(User)).all()]
    else:
        targets = [uid for uid in (payload.user_ids or []) if session.get(User, uid)]
    if not targets:
        raise HTTPException(400, "حداقل یک کاربر مقصد انتخاب کنید.")
    for uid in targets:
        session.add(
            Notification(user_id=uid, title=payload.title, body=payload.body)
        )
    session.commit()
    return {"ok": True, "sent": len(targets)}


@admin.get("/notifications")
def list_notifications(
    offset: int = 0,
    limit: int = Query(50, le=100),
    _: User = Depends(admin_user),
    session: Session = Depends(get_session),
):
    from app.models import Notification

    rows = session.exec(
        select(Notification).order_by(Notification.created_at.desc()).offset(offset).limit(limit)  # type: ignore[arg-type]
    ).all()
    return [
        {
            "id": n.id, "user_id": n.user_id, "type": n.type, "title": n.title,
            "body": n.body, "link": n.link, "is_read": n.is_read, "created_at": n.created_at,
        }
        for n in rows
    ]
