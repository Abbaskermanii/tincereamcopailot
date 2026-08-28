import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_session
from app.models import Address, PasswordResetToken, Product, RefreshToken, User, WishlistItem

router = APIRouter(prefix="/auth")
users_router = APIRouter(prefix="/users")
admin_router = APIRouter(prefix="/admin")
wishlist_router = APIRouter(prefix="/wishlist")
bearer = HTTPBearer(auto_error=False)


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str = ""
    phone: str | None = None


class LoginIn(BaseModel):
    email: str
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class ResetRequest(BaseModel):
    email: str


class ResetConfirm(BaseModel):
    token: str
    password: str = Field(min_length=8)


class AddressIn(BaseModel):
    title: str = ""
    recipient_name: str
    phone: str
    address: str
    city: str
    province: str
    postal_code: str
    is_default: bool = False


class UserUpdate(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None
    role_id: str | None = None


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _tokens(user: User, session: Session) -> dict[str, str]:
    refresh = create_refresh_token(user.id)
    session.add(
        RefreshToken(
            token_hash=_hash(refresh),
            user_id=user.id,
            expires_at=datetime.now(UTC) + timedelta(days=30),
        )
    )
    session.commit()
    return {"access_token": create_access_token(user.id), "refresh_token": refresh, "token_type": "bearer"}


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_session),
) -> User:
    if not credentials:
        raise HTTPException(401, "احراز هویت لازم است.", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(401, "توکن نامعتبر است.") from exc
    user = session.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(401, "کاربر یافت نشد.")
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "دسترسی مدیر لازم است.")
    return user


@router.post("/register", status_code=201)
def register(payload: RegisterIn, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.email == payload.email.lower())).first():
        raise HTTPException(409, "ایمیل قبلاً ثبت شده است.")
    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"user": user, **_tokens(user, session)}


@router.post("/login")
def login(payload: LoginIn, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email.lower())).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "ایمیل یا رمز عبور نادرست است.")
    return {"user": user, **_tokens(user, session)}


@router.post("/refresh")
def refresh(payload: RefreshIn, session: Session = Depends(get_session)):
    try:
        claims = decode_token(payload.refresh_token, expected_type="refresh")
    except Exception as exc:
        raise HTTPException(401, "توکن نامعتبر است.") from exc
    row = session.exec(select(RefreshToken).where(RefreshToken.token_hash == _hash(payload.refresh_token))).first()
    if not row or row.revoked_at or row.expires_at <= datetime.now(UTC):
        raise HTTPException(401, "توکن منقضی یا لغو شده است.")
    row.revoked_at = datetime.now(UTC)
    session.add(row)
    user = session.get(User, claims["sub"])
    if not user:
        raise HTTPException(401, "کاربر یافت نشد.")
    return _tokens(user, session)


@router.post("/logout")
def logout(payload: RefreshIn, session: Session = Depends(get_session), _: User = Depends(current_user)):
    row = session.exec(select(RefreshToken).where(RefreshToken.token_hash == _hash(payload.refresh_token))).first()
    if row:
        row.revoked_at = datetime.now(UTC)
        session.add(row)
        session.commit()
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(current_user)):
    return user


@router.post("/password-reset/request")
def password_reset_request(payload: ResetRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email.lower())).first()
    # Do not disclose account existence. In production this token is emailed by a delivery boundary.
    if user:
        token = secrets.token_urlsafe(32)
        session.add(PasswordResetToken(token_hash=_hash(token), user_id=user.id, expires_at=datetime.now(UTC) + timedelta(hours=1)))
        session.commit()
        # The reset token is delivered by the email boundary, never returned over HTTP.
        return {"ok": True}
    return {"ok": True}


@router.post("/password-reset/confirm")
def password_reset_confirm(payload: ResetConfirm, session: Session = Depends(get_session)):
    row = session.exec(select(PasswordResetToken).where(PasswordResetToken.token_hash == _hash(payload.token))).first()
    if not row or row.used_at or row.expires_at <= datetime.now(UTC):
        raise HTTPException(400, "توکن بازنشانی نامعتبر است.")
    user = session.get(User, row.user_id)
    if not user:
        raise HTTPException(400, "کاربر یافت نشد.")
    user.password_hash = hash_password(payload.password)
    row.used_at = datetime.now(UTC)
    session.add(user)
    session.add(row)
    session.commit()
    return {"ok": True}


@router.get("/users/me")
def user_me(user: User = Depends(current_user)):
    return user


@users_router.get("/me")
def users_me(user: User = Depends(current_user)):
    return user


@users_router.get("/me/addresses")
def users_addresses(user: User = Depends(current_user), session: Session = Depends(get_session)):
    return session.exec(select(Address).where(Address.user_id == user.id)).all()


@users_router.post("/me/addresses", status_code=201)
def users_add_address(payload: AddressIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    address = Address(user_id=user.id, **payload.model_dump())
    session.add(address)
    session.commit()
    session.refresh(address)
    return address


@router.get("/users", dependencies=[Depends(admin_user)])
def list_users(session: Session = Depends(get_session), offset: int = 0, limit: int = 50):
    return session.exec(select(User).offset(offset).limit(min(limit, 100))).all()


@router.delete("/users/{user_id}", dependencies=[Depends(admin_user)])
def delete_user(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "کاربر یافت نشد.")
    user.is_active = False
    session.add(user)
    session.commit()
    return {"ok": True}


@admin_router.get("/users")
def admin_users(_: User = Depends(admin_user), session: Session = Depends(get_session), offset: int = 0, limit: int = 50):
    return session.exec(select(User).offset(offset).limit(min(limit, 100))).all()


@admin_router.patch("/users/{user_id}")
def admin_update_user(user_id: str, payload: UserUpdate, _: User = Depends(admin_user), session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "کاربر یافت نشد.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/addresses")
def addresses(user: User = Depends(current_user), session: Session = Depends(get_session)):
    return session.exec(select(Address).where(Address.user_id == user.id)).all()


@router.post("/addresses", status_code=201)
def add_address(payload: AddressIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    data = payload.model_dump()
    address = Address(user_id=user.id, **data)
    session.add(address)
    session.commit()
    session.refresh(address)
    return address


@router.delete("/addresses/{address_id}")
def delete_address(address_id: str, user: User = Depends(current_user), session: Session = Depends(get_session)):
    address = session.get(Address, address_id)
    if not address or address.user_id != user.id:
        raise HTTPException(404, "نشانی یافت نشد.")
    session.delete(address)
    session.commit()
    return {"ok": True}


@wishlist_router.get("")
def wishlist(user: User = Depends(current_user), session: Session = Depends(get_session)):
    items = session.exec(select(WishlistItem).where(WishlistItem.user_id == user.id)).all()
    products = [session.get(Product, item.product_id) for item in items]
    return [product for product in products if product]


@wishlist_router.post("/{product_id}", status_code=201)
def wishlist_add(product_id: str, user: User = Depends(current_user), session: Session = Depends(get_session)):
    if not session.get(Product, product_id):
        raise HTTPException(404, "محصول یافت نشد.")
    item = session.exec(select(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id)).first()
    if not item:
        item = WishlistItem(user_id=user.id, product_id=product_id)
        session.add(item)
        session.commit()
    return {"ok": True, "product_id": product_id}


@wishlist_router.delete("/{product_id}")
def wishlist_remove(product_id: str, user: User = Depends(current_user), session: Session = Depends(get_session)):
    item = session.exec(select(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id)).first()
    if item:
        session.delete(item)
        session.commit()
    return {"ok": True}
