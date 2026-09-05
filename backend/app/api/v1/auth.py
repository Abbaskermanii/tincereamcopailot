import hashlib
import secrets
from datetime import datetime, timedelta
from app.compat import UTC

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_session
from app.models import (
    Address,
    OtpCode,
    OtpPurpose,
    PasswordResetToken,
    Product,
    RefreshToken,
    User,
    WishlistItem,
)
from app.services import notifier
from app.services.rate_limit import rate_limit

router = APIRouter(prefix="/auth")
users_router = APIRouter(prefix="/users")
admin_router = APIRouter(prefix="/admin")
wishlist_router = APIRouter(prefix="/wishlist")
bearer = HTTPBearer(auto_error=False)

ACCESS_COOKIE = "tinceram_access"
REFRESH_COOKIE = "tinceram_refresh"


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = ""
    phone: str | None = Field(default=None, pattern=r"^09\d{9}$")


class LoginIn(BaseModel):
    email: str
    password: str


class RefreshIn(BaseModel):
    refresh_token: str | None = None


class ResetRequest(BaseModel):
    email: EmailStr


class ResetConfirm(BaseModel):
    token: str
    password: str = Field(min_length=8)


class OtpRequestIn(BaseModel):
    phone: str = Field(pattern=r"^09\d{9}$")
    purpose: OtpPurpose = OtpPurpose.login


class OtpVerifyIn(BaseModel):
    phone: str = Field(pattern=r"^09\d{9}$")
    code: str = Field(min_length=4, max_length=8)
    full_name: str = ""


class AddressIn(BaseModel):
    title: str = ""
    recipient_name: str
    phone: str
    address: str
    city: str
    province: str
    postal_code: str
    is_default: bool = False


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, pattern=r"^09\d{9}$")
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8)
    current_password: str | None = Field(default=None, min_length=8)


class UserUpdate(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None
    role_id: str | None = None


def _ensure_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt

def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _set_auth_cookies(response: Response, tokens: dict[str, str]) -> None:
    s = get_settings()
    response.set_cookie(
        ACCESS_COOKIE, tokens["access_token"],
        max_age=s.access_token_expire_minutes * 60, httponly=True,
        samesite="lax", secure=s.auth_cookies_secure, path="/",
    )
    response.set_cookie(
        REFRESH_COOKIE, tokens["refresh_token"],
        max_age=s.refresh_token_expire_days * 86400, httponly=True,
        samesite="lax", secure=s.auth_cookies_secure, path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/")


def _tokens(user: User, session: Session, response: Response | None = None) -> dict[str, str]:
    refresh = create_refresh_token(user.id)
    session.add(
        RefreshToken(
            token_hash=_hash(refresh),
            user_id=user.id,
            expires_at=datetime.now(UTC) + timedelta(days=get_settings().refresh_token_expire_days),
        )
    )
    user.last_login_at = datetime.now(UTC)
    session.add(user)
    session.commit()
    tokens = {
        "access_token": create_access_token(user.id),
        "refresh_token": refresh,
        "token_type": "bearer",
    }
    if response is not None:
        _set_auth_cookies(response, tokens)
    return tokens


def _resolve_token(
    credentials: HTTPAuthorizationCredentials | None,
    request: Request,
) -> str | None:
    if credentials:
        return credentials.credentials
    return request.cookies.get(ACCESS_COOKIE)


def current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_session),
) -> User:
    token = _resolve_token(credentials, request)
    if not token:
        raise HTTPException(401, "احراز هویت لازم است.", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(token)
    except Exception as exc:
        raise HTTPException(401, "توکن نامعتبر است.") from exc
    user = session.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(401, "کاربر یافت نشد.")
    return user


def optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_session),
) -> User | None:
    """Like current_user but returns None for guests (used by guest checkout)."""
    token = _resolve_token(credentials, request)
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    user = session.get(User, payload["sub"])
    return user if user and user.is_active else None


def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "دسترسی مدیر لازم است.")
    return user


@router.post("/register", status_code=201, dependencies=[Depends(rate_limit("register", 10, 3600))])
def register(payload: RegisterIn, response: Response, session: Session = Depends(get_session)):
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
    return {"user": user, **_tokens(user, session, response)}


@router.post("/login", dependencies=[Depends(rate_limit("login", 10, 300))])
def login(payload: LoginIn, response: Response, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email.lower())).first()
    now = datetime.now(UTC)
    s = get_settings()
    if user and user.locked_until and _ensure_aware(user.locked_until) > now:
        raise HTTPException(423, f"حساب شما موقتاً قفل شده است. {s.login_lock_minutes} دقیقه دیگر تلاش کنید.")
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= s.max_login_attempts:
                user.locked_until = now + timedelta(minutes=s.login_lock_minutes)
                user.failed_login_attempts = 0
            session.add(user)
            session.commit()
        raise HTTPException(401, "ایمیل یا رمز عبور نادرست است.")
    user.failed_login_attempts = 0
    user.locked_until = None
    session.add(user)
    return {"user": user, **_tokens(user, session, response)}


@router.post("/refresh")
def refresh(payload: RefreshIn, request: Request, response: Response, session: Session = Depends(get_session)):
    raw = payload.refresh_token or request.cookies.get(REFRESH_COOKIE)
    if not raw:
        raise HTTPException(401, "توکن تازه‌سازی یافت نشد.")
    try:
        claims = decode_token(raw, expected_type="refresh")
    except Exception as exc:
        raise HTTPException(401, "توکن نامعتبر است.") from exc
    row = session.exec(select(RefreshToken).where(RefreshToken.token_hash == _hash(raw))).first()
    if not row or row.revoked_at or (_ensure_aware(row.expires_at) <= datetime.now(UTC)):
        raise HTTPException(401, "توکن منقضی یا لغو شده است.")
    row.revoked_at = datetime.now(UTC)
    session.add(row)
    user = session.get(User, claims["sub"])
    if not user:
        raise HTTPException(401, "کاربر یافت نشد.")
    return {"user": user, **_tokens(user, session, response)}


@router.post("/logout")
def logout(payload: RefreshIn, request: Request, response: Response, session: Session = Depends(get_session), _: User = Depends(current_user)):
    raw = payload.refresh_token or request.cookies.get(REFRESH_COOKIE)
    if raw:
        row = session.exec(select(RefreshToken).where(RefreshToken.token_hash == _hash(raw))).first()
        if row:
            row.revoked_at = datetime.now(UTC)
            session.add(row)
            session.commit()
    _clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(current_user)):
    return user


# ---------- OTP login (phone + SMS code) ----------

@router.post("/otp/request", dependencies=[Depends(rate_limit("otp_request", 5, 600))])
async def otp_request(payload: OtpRequestIn, session: Session = Depends(get_session)):
    if payload.purpose == OtpPurpose.login:
        existing = session.exec(select(User).where(User.phone == payload.phone)).first()
        if existing and not existing.is_active:
            raise HTTPException(403, "حساب شما غیرفعال است.")
    code = f"{secrets.randbelow(1000000):06d}"
    session.add(
        OtpCode(
            destination=payload.phone,
            purpose=payload.purpose,
            code_hash=_hash(code),
            expires_at=datetime.now(UTC) + timedelta(minutes=3),
        )
    )
    session.commit()
    await notifier.send_sms(payload.phone, f"کد ورود شما به تن‌سِرام: {code}")
    out: dict = {"ok": True}
    # Hard production guard: debug_code is NEVER returned when ENVIRONMENT=production
    s = get_settings()
    if s.sms_debug and not s.is_production():
        out["debug_code"] = code  # dev/test only — never in production
    return out


@router.post("/otp/verify", dependencies=[Depends(rate_limit("otp_verify", 10, 600))])
def otp_verify(payload: OtpVerifyIn, response: Response, session: Session = Depends(get_session)):
    # Use naive-aware tolerant filter: fetch latest and check in python to avoid DB tz mismatch
    row = session.exec(
        select(OtpCode)
        .where(
            OtpCode.destination == payload.phone,
            OtpCode.used_at == None,  # noqa: E711
        )
        .order_by(OtpCode.created_at.desc())  # type: ignore[arg-type]
    ).first()
    if row and _ensure_aware(row.expires_at) <= datetime.now(UTC):
        row = None
    if not row or row.attempts >= 5:
        raise HTTPException(400, "کد منقضی شده است. دوباره درخواست کنید.")
    row.attempts += 1
    if row.code_hash != _hash(payload.code):
        session.add(row)
        session.commit()
        raise HTTPException(400, "کد وارد شده نادرست است.")
    row.used_at = datetime.now(UTC)
    session.add(row)

    user = session.exec(select(User).where(User.phone == payload.phone)).first()
    if not user:
        # phone-first registration: create the account on first OTP login
        if payload.purpose not in (OtpPurpose.login, OtpPurpose.register):
            raise HTTPException(400, "ابتدا ثبت‌نام کنید.")
        user = User(
            email=f"{payload.phone}@otp.tinceram.local",
            full_name=payload.full_name or f"کاربر {payload.phone[-4:]}",
            phone=payload.phone,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    if not user.is_active:
        raise HTTPException(403, "حساب شما غیرفعال است.")
    return {"user": user, **_tokens(user, session, response)}


# ---------- Password reset (token delivered by email/SMS) ----------

@router.post("/password-reset/request", dependencies=[Depends(rate_limit("reset_request", 5, 3600))])
async def password_reset_request(payload: ResetRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email.lower())).first()
    if user:
        token = secrets.token_urlsafe(32)
        session.add(
            PasswordResetToken(
                token_hash=_hash(token), user_id=user.id,
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        session.commit()
        link = f"{get_settings().next_public_site_url}/auth/reset?token={token}"
        await notifier.send_email(
            user.email, "بازنشانی رمز عبور — تن‌سِرام",
            notifier.RTL_EMAIL_SHELL.format(
                body=f"<p>برای بازنشانی رمز عبور روی لینک زیر کلیک کنید (اعتبار ۱ ساعت):</p>"
                     f"<p><a href='{link}'>بازنشانی رمز عبور</a></p>"
                     f"<p style='color:#888;font-size:12px'>اگر شما درخواست نداده‌اید، این ایمیل را نادیده بگیرید.</p>"
            ),
        )
    # Do not disclose account existence either way.
    return {"ok": True}


@router.post("/password-reset/confirm")
def password_reset_confirm(payload: ResetConfirm, session: Session = Depends(get_session)):
    row = session.exec(select(PasswordResetToken).where(PasswordResetToken.token_hash == _hash(payload.token))).first()
    if not row or row.used_at or (_ensure_aware(row.expires_at) <= datetime.now(UTC)):
        raise HTTPException(400, "توکن بازنشانی نامعتبر است.")
    user = session.get(User, row.user_id)
    if not user:
        raise HTTPException(400, "کاربر یافت نشد.")
    user.password_hash = hash_password(payload.password)
    user.locked_until = None
    user.failed_login_attempts = 0
    row.used_at = datetime.now(UTC)
    session.add(user)
    session.add(row)
    session.commit()
    return {"ok": True}


# ---------- Profile ----------

@users_router.patch("/me")
def update_profile(payload: ProfileUpdate, user: User = Depends(current_user), session: Session = Depends(get_session)):
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"]:
        new_email = data["email"].lower()
        clash = session.exec(select(User).where(User.email == new_email, User.id != user.id)).first()
        if clash:
            raise HTTPException(409, "این ایمیل قبلاً ثبت شده است.")
        user.email = new_email
    if "phone" in data and data["phone"]:
        clash = session.exec(select(User).where(User.phone == data["phone"], User.id != user.id)).first()
        if clash:
            raise HTTPException(409, "این شماره موبایل قبلاً ثبت شده است.")
        user.phone = data["phone"]
    if data.get("full_name") is not None:
        user.full_name = data["full_name"]
    if data.get("password"):
        if not user.password_hash:
            raise HTTPException(400, "حساب شما با رمز عبور ساخته نشده است.")
        # M6 fix: require current password to prevent stolen JWT takeover
        current = data.get("current_password")
        if not current or not verify_password(current, user.password_hash):
            raise HTTPException(400, "رمز عبور فعلی نادرست است.")
        user.password_hash = hash_password(data["password"])
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


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
    return _add_address(payload, user, session)


def _add_address(payload: AddressIn, user: User, session: Session) -> Address:
    data = payload.model_dump()
    if data.get("is_default"):
        for row in session.exec(select(Address).where(Address.user_id == user.id)).all():
            row.is_default = False
            session.add(row)
    address = Address(user_id=user.id, **data)
    session.add(address)
    session.commit()
    session.refresh(address)
    return address


# ---------- Admin: user management ----------

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
def admin_update_user(
    user_id: str, payload: UserUpdate,
    admin: User = Depends(admin_user), session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "کاربر یافت نشد.")
    data = payload.model_dump(exclude_unset=True)
    # never let the last active admin be demoted or deactivated
    if user.is_admin and (data.get("is_admin") is False or data.get("is_active") is False):
        other_admins = session.exec(
            select(User).where(User.is_admin == True, User.is_active == True, User.id != user.id)  # noqa: E712
        ).all()
        if not other_admins:
            raise HTTPException(400, "حداقل یک مدیر فعال باید باقی بماند.")
    for key, value in data.items():
        setattr(user, key, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ---------- Addresses (legacy path kept for compatibility) ----------

@router.get("/addresses")
def addresses(user: User = Depends(current_user), session: Session = Depends(get_session)):
    return session.exec(select(Address).where(Address.user_id == user.id)).all()


@router.post("/addresses", status_code=201)
def add_address(payload: AddressIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    return _add_address(payload, user, session)


@users_router.patch("/me/addresses/{address_id}")
def update_address_me(address_id: str, payload: AddressIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    return _update_address(address_id, payload, user, session)


@router.patch("/addresses/{address_id}")
def update_address(address_id: str, payload: AddressIn, user: User = Depends(current_user), session: Session = Depends(get_session)):
    return _update_address(address_id, payload, user, session)


def _update_address(address_id: str, payload: AddressIn, user: User, session: Session) -> Address:
    address = session.get(Address, address_id)
    if not address or address.user_id != user.id:
        raise HTTPException(404, "نشانی یافت نشد.")
    data = payload.model_dump(exclude_unset=True)
    if data.get("is_default"):
        for row in session.exec(select(Address).where(Address.user_id == user.id)).all():
            if row.id != address_id:
                row.is_default = False
                session.add(row)
    for key, value in data.items():
        setattr(address, key, value)
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


# ---------- Wishlist ----------

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
