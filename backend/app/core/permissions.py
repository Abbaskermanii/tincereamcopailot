"""Role-based access control: permission catalog + FastAPI dependencies."""

from fastapi import Depends, HTTPException
from sqlmodel import Session

from app.api.v1.deps import admin_user
from app.db.session import get_session
from app.models import Role, User


# ---- Permission catalog (admin UI groups by these) ----
PERMISSIONS: dict[str, str] = {
    "dashboard": "مشاهده داشبورد و گزارش‌ها",
    "products": "مدیریت محصولات، ورنت‌ها و تصاویر",
    "categories": "مدیریت دسته‌بندی‌ها و برندها",
    "orders": "مدیریت سفارش‌ها و مرسولات",
    "returns": "مدیریت مرجوعی‌ها",
    "coupons": "مدیریت کدهای تخفیف و کمپین‌ها",
    "shipping": "مدیریت روش‌های ارسال",
    "users": "مدیریت کاربران و نقش‌ها",
    "reviews": "تأیید و پاسخ نظرات و پرسش‌ها",
    "content": "مدیریت مقالات، صفحات، بنرها و FAQ",
    "messages": "پیام‌های تماس و خبرنامه",
    "settings": "تنظیمات فروشگاه و اعلان‌ها",
}

ROLE_PRESETS: list[dict] = [
    {"name": "superadmin", "permissions": ["*"], "label": "مدیر کل"},
    {"name": "sales_manager", "permissions": ["dashboard", "orders", "returns", "coupons", "shipping", "messages"], "label": "مدیر فروش"},
    {"name": "content_manager", "permissions": ["dashboard", "content", "reviews", "categories"], "label": "مدیر محتوا"},
    {"name": "warehouse", "permissions": ["dashboard", "products", "orders", "shipping"], "label": "انباردار"},
]


def user_permissions(session: Session, user: User) -> set[str]:
    """Effective permission set for a user (is_admin + role permissions)."""
    if not user.is_admin:
        return set()
    if user.role_id:
        role = session.get(Role, user.role_id)
        if role and "*" in role.permissions.split(","):
            return set(PERMISSIONS.keys()) | {"*"}
        if role:
            return {p for p in role.permissions.split(",") if p}
    # admins without a role keep full access (backwards compatible)
    return set(PERMISSIONS.keys()) | {"*"}


def has_permission(session: Session, user: User, permission: str) -> bool:
    perms = user_permissions(session, user)
    return permission in perms or "*" in perms


def require_permission(permission: str):
    """FastAPI dependency factory: 403 unless the admin holds the permission."""

    def dependency(
        user: User = Depends(admin_user),
        session: Session = Depends(get_session),
    ) -> User:
        if not has_permission(session, user, permission):
            raise HTTPException(403, "شما به این بخش دسترسی ندارید.")
        return user

    return dependency
