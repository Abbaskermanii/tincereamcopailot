"""Pydantic response/request schemas for the public API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import OrderStatus


# ---------- Categories ----------
class CategoryNode(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    image_url: str | None = None
    description: str | None = None
    product_count: int = 0
    children: list["CategoryNode"] = []


class CategoryDetail(CategoryNode):
    pass


# ---------- Products ----------
class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    alt_text: str
    sort_order: int
    is_primary: bool


class ProductListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    price: float
    compare_at_price: float | None
    short_description: str | None
    stock_qty: int
    primary_image_url: str | None = None


class ProductVariantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    sku: str
    image_url: str | None = None
    price_delta: float
    absolute_price: float | None
    stock_qty: int
    is_active: bool


class ProductDetail(ProductListItem):
    description: str
    sku: str
    weight_grams: int
    material: str | None
    dimensions: str | None
    meta_title: str | None
    meta_description: str | None
    category_id: str
    category_name: str | None = None
    category_slug: str | None = None
    discount_percent: int = 0
    images: list[ProductImageOut]
    variants: list[ProductVariantOut] = []


class ProductPage(BaseModel):
    items: list[ProductListItem]
    total: int
    page: int
    page_size: int
    pages: int


# ---------- Orders ----------
class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = Field(gt=0, le=99)
    variant_id: str | None = None


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    address_id: str | None = None
    customer_name: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, pattern=r"^09\d{9}$")
    email: str | None = None
    address: str | None = Field(default=None, min_length=10, max_length=1024)
    city: str | None = Field(default=None, min_length=2, max_length=128)
    province: str | None = Field(default=None, min_length=2, max_length=128)
    postal_code: str | None = Field(default=None, pattern=r"^\d{10}$")
    coupon_code: str | None = None
    gift_wrap: bool = False
    gift_note: str | None = Field(default=None, max_length=512)
    shipping_method_id: str | None = None
    # legacy: product_id -> variant_id for variant purchases (kept for backward compat)
    variant_selections: dict[str, str] | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: str
    product_name_snapshot: str
    unit_price_snapshot: float
    quantity: int
    subtotal: float
    variant_id: str | None = None
    variant_name_snapshot: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_number: str
    status: OrderStatus
    total_amount: float
    shipping_cost: float
    discount_amount: float
    tax_rate: float = 0
    tax_amount: float = 0
    campaign_discount_amount: float = 0
    items: list[OrderItemOut]


class OrderCreatedOut(OrderOut):
    payment_url: str


class OrderStatusOut(BaseModel):
    order_number: str
    status: OrderStatus
    updated_at: datetime
    total_amount: float = 0
    shipping_cost: float = 0
    discount_amount: float = 0
    tax_rate: float = 0
    tax_amount: float = 0
    campaign_discount_amount: float = 0
    tracking_code: str | None = None
    carrier: str | None = None
    shipping_method_name: str | None = None
    admin_note: str | None = None
    items: list[OrderItemOut] = []


# ---------- Coupons ----------
class CouponValidateIn(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    order_total: float = Field(gt=0)


class CouponValidateOut(BaseModel):
    valid: bool
    message: str
    discount_amount: float = 0


# ---------- Payment ----------
class PaymentCallbackIn(BaseModel):
    Authority: str
    Status: str


class PaymentCallbackOut(BaseModel):
    ok: bool
    message: str
    order_number: str | None = None
