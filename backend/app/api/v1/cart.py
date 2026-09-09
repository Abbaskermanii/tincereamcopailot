"""Server-side cart: persistent, authenticated, cross-device."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from datetime import datetime, timedelta, timezone



from app.api.v1.auth import current_user
from app.db.session import get_session
from app.models import CartItem, Product, ProductVariant, User

router = APIRouter(prefix="/cart", tags=["cart"])

CART_EXPIRY = timedelta(minutes=15)


def _purge_expired(user_id, session):
    """Lazy-purge cart items older than CART_EXPIRY."""
    cutoff = datetime.now(timezone.utc) - CART_EXPIRY
    expired = session.exec(
        select(CartItem).where(CartItem.user_id == user_id, CartItem.created_at < cutoff)
    ).all()  # type: ignore[arg-type]
    for item in expired:
        session.delete(item)
    if expired:
        session.commit()




class CartAddIn(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99, default=1)
    variant_id: str | None = None


class CartUpdateIn(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartMergeIn(BaseModel):
    items: list[CartAddIn]


def _to_out(item: CartItem, session: Session) -> dict:
    product = session.get(Product, item.product_id)
    variant = session.get(ProductVariant, item.variant_id) if item.variant_id else None
    # Effective price and name
    base_price = float(product.price) if product else 0
    if variant and variant.absolute_price is not None:
        price = float(variant.absolute_price)
    elif variant:
        price = base_price + float(variant.price_delta)
    else:
        price = base_price
    # Prefer variant image when variant has one, fallback to product primary
    image = None
    if variant and variant.image_url:
        image = variant.image_url
    elif product and product.images:
        primary = next((i for i in product.images if i.is_primary), product.images[0] if product.images else None)
        image = primary.url if primary else None
    return {
        "id": item.id,
        "product_id": item.product_id,
        "variant_id": item.variant_id,
        "quantity": item.quantity,
        "product": {
            "id": product.id if product else item.product_id,
            "name": product.name if product else "",
            "slug": product.slug if product else "",
            "price": price,
            "stock_qty": variant.stock_qty if variant else (product.stock_qty if product else 0),
            "primary_image_url": image,
            "variant_name": variant.name if variant else None,
            "variant_sku": variant.sku if variant else None,
            "variant_image_url": variant.image_url if variant else None,
        },
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


@router.get("", response_model=list[dict])
def list_cart(user: User = Depends(current_user), session: Session = Depends(get_session)):
    _purge_expired(user.id, session)

    items = session.exec(select(CartItem).where(CartItem.user_id == user.id).order_by(CartItem.created_at)).all()  # type: ignore[arg-type]
    return [_to_out(i, session) for i in items]


@router.post("/items", status_code=201, response_model=dict)
def add_to_cart(payload: CartAddIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    product = session.get(Product, payload.product_id)
    if not product or not product.is_active:
        raise HTTPException(404, "محصول یافت نشد.")
    variant = None
    if payload.variant_id:
        variant = session.get(ProductVariant, payload.variant_id)
        if not variant or variant.product_id != payload.product_id or not variant.is_active:
            raise HTTPException(400, "ورنت انتخابی معتبر نیست.")
        if variant.stock_qty < payload.quantity:
            raise HTTPException(409, "موجودی ورنت کافی نیست.")
    else:
        if product.stock_qty < payload.quantity:
            raise HTTPException(409, "موجودی کافی نیست.")

    # Find existing line for same product+variant
    existing = session.exec(
        select(CartItem).where(
            CartItem.user_id == user.id,
            CartItem.product_id == payload.product_id,
            CartItem.variant_id == payload.variant_id,
        )
    ).first()
    if existing:
        new_qty = min(existing.quantity + payload.quantity, 99)
        # Validate stock again for merged qty
        stock = variant.stock_qty if variant else product.stock_qty
        if stock < new_qty:
            raise HTTPException(409, "موجودی کافی نیست.")
        existing.quantity = new_qty
        existing.created_at = datetime.now(timezone.utc)  # reset expiry on merge
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return _to_out(existing, session)

    item = CartItem(
        user_id=user.id,
        product_id=payload.product_id,
        variant_id=payload.variant_id,
        quantity=payload.quantity,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item, session)


@router.patch("/items/{item_id}", response_model=dict)
def update_cart_item(item_id: str, payload: CartUpdateIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    item = session.get(CartItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(404, "آیتم سبد یافت نشد.")
    product = session.get(Product, item.product_id)
    variant = session.get(ProductVariant, item.variant_id) if item.variant_id else None
    stock = variant.stock_qty if variant else (product.stock_qty if product else 99)
    if stock < payload.quantity:
        raise HTTPException(409, "موجودی کافی نیست.")
    item.quantity = payload.quantity
    item.created_at = datetime.now(timezone.utc)  # reset expiry timer on update

    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item, session)


@router.delete("/items/{item_id}")
def remove_cart_item(item_id: str, user: User = Depends(current_user), session: Session = Depends(get_session)):
    item = session.get(CartItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(404, "آیتم سبد یافت نشد.")
    session.delete(item)
    session.commit()
    return {"ok": True}


@router.delete("")
def clear_cart(user: User = Depends(current_user), session: Session = Depends(get_session)):
    items = session.exec(select(CartItem).where(CartItem.user_id == user.id)).all()
    for it in items:
        session.delete(it)
    session.commit()
    return {"ok": True}


@router.post("/merge", response_model=list[dict])
def merge_guest_cart(payload: CartMergeIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    """Merge guest local cart (passed as list) into server cart. Idempotent."""
    for line in payload.items:
        product = session.get(Product, line.product_id)
        if not product or not product.is_active:
            continue
        variant = None
        if line.variant_id:
            variant = session.get(ProductVariant, line.variant_id)
            if not variant or variant.product_id != line.product_id or not variant.is_active:
                continue
        # Find existing
        existing = session.exec(
            select(CartItem).where(
                CartItem.user_id == user.id,
                CartItem.product_id == line.product_id,
                CartItem.variant_id == line.variant_id,
            )
        ).first()
        if existing:
            new_qty = min(existing.quantity + line.quantity, 99)
            stock = variant.stock_qty if variant else product.stock_qty
            if stock < new_qty:
                new_qty = stock
            existing.quantity = new_qty
            existing.created_at = datetime.now(timezone.utc)  # reset expiry on merge
            session.add(existing)
        else:
            # Clamp to stock
            stock = variant.stock_qty if variant else product.stock_qty
            qty = min(line.quantity, stock, 99)
            if qty < 1:
                continue
            item = CartItem(user_id=user.id, product_id=line.product_id, variant_id=line.variant_id, quantity=qty)
            session.add(item)
    session.commit()
    items = session.exec(select(CartItem).where(CartItem.user_id == user.id).order_by(CartItem.created_at)).all()  # type: ignore[arg-type]
    return [_to_out(i, session) for i in items]
