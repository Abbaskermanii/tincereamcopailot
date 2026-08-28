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
    children: list["CategoryNode"] = []


class CategoryDetail(CategoryNode):
    product_count: int = 0


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


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    customer_name: str = Field(min_length=2, max_length=255)
    phone: str = Field(pattern=r"^09\d{9}$")
    email: str | None = None
    address: str = Field(min_length=10, max_length=1024)
    city: str = Field(min_length=2, max_length=128)
    province: str = Field(min_length=2, max_length=128)
    postal_code: str = Field(pattern=r"^\d{10}$")
    coupon_code: str | None = None
    gift_wrap: bool = False
    gift_note: str | None = Field(default=None, max_length=512)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: str
    product_name_snapshot: str
    unit_price_snapshot: float
    quantity: int
    subtotal: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_number: str
    status: OrderStatus
    total_amount: float
    shipping_cost: float
    discount_amount: float
    items: list[OrderItemOut]


class OrderCreatedOut(OrderOut):
    payment_url: str


class OrderStatusOut(BaseModel):
    order_number: str
    status: OrderStatus
    updated_at: datetime


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
