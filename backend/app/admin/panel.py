"""SQLAdmin panel at /admin — env-based auth, full CRUD + order management."""

from fastapi import FastAPI, Request
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.responses import RedirectResponse

from app.core.config import get_settings
from app.db.session import engine


class EnvAuth(AuthenticationBackend):
    """Session-cookie auth against ADMIN_USERNAME / ADMIN_PASSWORD."""

    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        s = get_settings()
        valid = username == s.admin_username and password == s.admin_password
        if valid:
            request.session["admin_user"] = str(username)
        return bool(valid)

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request):  # type: ignore[override]
        if not request.session.get("admin_user"):
            return RedirectResponse(request.url_for("admin:login"), status_code=302)
        return None


def _register_views(admin: Admin) -> None:
    from app.models import Category, Coupon, Order, Product, ProductImage

    class CategoryAdmin(ModelView, model=Category):
        name = "دسته‌بندی"
        name_plural = "دسته‌بندی‌ها"
        column_list = [Category.name, Category.slug, Category.parent_id]
        column_searchable_list = [Category.name, Category.slug]

    class ProductAdmin(ModelView, model=Product):
        name = "محصول"
        name_plural = "محصولات"
        column_list = [
            Product.name,
            Product.slug,
            Product.price,
            Product.stock_qty,
            Product.is_active,
        ]
        column_searchable_list = [Product.name, Product.sku, Product.slug]
        form_excluded_columns = [Product.images]

    class ProductImageAdmin(ModelView, model=ProductImage):
        name = "تصویر محصول"
        name_plural = "تصاویر محصولات"
        column_list = [ProductImage.url, ProductImage.product_id, ProductImage.is_primary]

    class OrderAdmin(ModelView, model=Order):
        name = "سفارش"
        name_plural = "سفارش‌ها"
        can_create = False
        can_delete = False
        can_edit = True  # status updates only (form_columns below)
        column_list = [
            Order.order_number,
            Order.customer_name,
            Order.total_amount,
            Order.status,
            Order.created_at,
        ]
        column_searchable_list = [Order.order_number, Order.customer_name, Order.phone]
        form_columns = ["status", "payment_ref_id"]

    class CouponAdmin(ModelView, model=Coupon):
        name = "کد تخفیف"
        name_plural = "کدهای تخفیف"
        column_list = [
            Coupon.code,
            Coupon.discount_type,
            Coupon.discount_value,
            Coupon.used_count,
            Coupon.expires_at,
        ]
        column_searchable_list = [Coupon.code]

    for view in (CategoryAdmin, ProductAdmin, ProductImageAdmin, OrderAdmin, CouponAdmin):
        admin.add_view(view)


def mount_admin(app: FastAPI) -> None:
    # Mount legacy SQLAdmin at /admin-sql to avoid collision with Next.js admin at /admin (H11/M11)
    # Production nginx should route /admin/* to Next.js (3000) and /admin-sql/* to FastAPI (8000)
    admin = Admin(
        app,
        engine=engine,
        base_url="/admin-sql",
        title="تن‌سِرام | پنل مدیریت (قدیمی)",
        authentication_backend=EnvAuth(secret_key=get_settings().secret_key),
    )
    _register_views(admin)
