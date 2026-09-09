import hashlib
import secrets
from datetime import datetime, timedelta
from app.compat import UTC

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
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
    purpose: OtpPurpose = OtpPurpose.login


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
        raise HTTPException(401, "Ø§Ø­Ø±Ø§Ø² Ù‡ÙˆÛŒØª Ù„Ø§Ø²Ù… Ø§Ø³Øª.", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(token)
    except Exception as exc:
        raise HTTPException(401, "ØªÙˆÚ©Ù† Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª.") from exc
    user = session.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(401, "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯.")
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
        raise HTTPException(403, "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ø¯ÛŒØ± Ù„Ø§Ø²Ù… Ø§Ø³Øª.")
    return user


@router.post("/register", status_code=201, dependencies=[Depends(rate_limit("register", 10, 3600))])
def register(payload: RegisterIn, response: Response, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.email == payload.email.lower())).first():
        raise HTTPException(409, "Ø§ÛŒÙ…ÛŒÙ„ Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª.")
    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    # پیام خوشآمد برای ورود اول (قابل تنظیم از پنل مدیریت)
    try:
        from app.models import Setting
        _t = session.exec(select(Setting).where(Setting.key == "welcome_notification_title")).first()
        _wt = _t.value if _t else "خوش آمدید به تنسِرام"
        _b = session.exec(select(Setting).where(Setting.key == "welcome_notification_body")).first()
        _wb = _b.value if _b else "حساب شما ساخته شد. وضعیت سفارشها و تخفیفها را در پروفایل دنبال کنید."
        from app.services.notifications import create_notification
        create_notification(session, user.id, _wt, _wb)
    except Exception:
        pass
    _tokens(user, session, response)  # tokens delivered via httponly cookies only
    return {"user": user}


@router.post("/login", dependencies=[Depends(rate_limit("login", 10, 300))])
def login(payload: LoginIn, response: Response, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email.lower())).first()
    now = datetime.now(UTC)
    s = get_settings()
    if user and user.locked_until and _ensure_aware(user.locked_until) > now:
        raise HTTPException(423, f"Ø­Ø³Ø§Ø¨ Ø´Ù…Ø§ Ù…ÙˆÙ‚ØªØ§Ù‹ Ù‚ÙÙ„ Ø´Ø¯Ù‡ Ø§Ø³Øª. {s.login_lock_minutes} Ø¯Ù‚ÛŒÙ‚Ù‡ Ø¯ÛŒÚ¯Ø± ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.")
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= s.max_login_attempts:
                user.locked_until = now + timedelta(minutes=s.login_lock_minutes)
                user.failed_login_attempts = 0
            session.add(user)
            session.commit()
        raise HTTPException(401, "Ø§ÛŒÙ…ÛŒÙ„ ÛŒØ§ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ù†Ø§Ø¯Ø±Ø³Øª Ø§Ø³Øª.")
    user.failed_login_attempts = 0
    user.locked_until = None
    session.add(user)
    _tokens(user, session, response)  # tokens delivered via httponly cookies only
    return {"user": user}


@router.post("/refresh")
def refresh(payload: RefreshIn, request: Request, response: Response, session: Session = Depends(get_session)):
    raw = payload.refresh_token or request.cookies.get(REFRESH_COOKIE)
    if not raw:
        raise HTTPException(401, "ØªÙˆÚ©Ù† ØªØ§Ø²Ù‡â€ŒØ³Ø§Ø²ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯.")
    try:
        claims = decode_token(raw, expected_type="refresh")
    except Exception as exc:
        raise HTTPException(401, "ØªÙˆÚ©Ù† Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª.") from exc
    row = session.exec(select(RefreshToken).where(RefreshToken.token_hash == _hash(raw))).first()
    if not row or row.revoked_at or (_ensure_aware(row.expires_at) <= datetime.now(UTC)):
        raise HTTPException(401, "ØªÙˆÚ©Ù† Ù…Ù†Ù‚Ø¶ÛŒ ÛŒØ§ Ù„ØºÙˆ Ø´Ø¯Ù‡ Ø§Ø³Øª.")
    row.revoked_at = datetime.now(UTC)
    session.add(row)
    user = session.get(User, claims["sub"])
    if not user:
        raise HTTPException(401, "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯.")
    _tokens(user, session, response)  # tokens delivered via httponly cookies only
    return {"user": user}


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
            raise HTTPException(403, "Ø­Ø³Ø§Ø¨ Ø´Ù…Ø§ ØºÛŒØ±ÙØ¹Ø§Ù„ Ø§Ø³Øª.")
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
    await notifier.send_sms(payload.phone, f"Ú©Ø¯ ÙˆØ±ÙˆØ¯ Ø´Ù…Ø§ Ø¨Ù‡ ØªÙ†â€ŒØ³ÙØ±Ø§Ù…: {code}")
    out: dict = {"ok": True}
    # Hard production guard: debug_code is NEVER returned when ENVIRONMENT=production
    s = get_settings()
    if s.sms_debug and not s.is_production():
        out["debug_code"] = code  # dev/test only â€” never in production
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
        raise HTTPException(400, "Ú©Ø¯ Ù…Ù†Ù‚Ø¶ÛŒ Ø´Ø¯Ù‡ Ø§Ø³Øª. Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ú©Ù†ÛŒØ¯.")
    row.attempts += 1
    if row.code_hash != _hash(payload.code):
        session.add(row)
        session.commit()
        raise HTTPException(400, "Ú©Ø¯ ÙˆØ§Ø±Ø¯ Ø´Ø¯Ù‡ Ù†Ø§Ø¯Ø±Ø³Øª Ø§Ø³Øª.")
    row.used_at = datetime.now(UTC)
    session.add(row)

    user = session.exec(select(User).where(User.phone == payload.phone)).first()
    if not user:
        # phone-first registration: create the account on first OTP login
        if payload.purpose not in (OtpPurpose.login, OtpPurpose.register):
            raise HTTPException(400, "Ø§Ø¨ØªØ¯Ø§ Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ú©Ù†ÛŒØ¯.")
        user = User(
            email=f"{payload.phone}@otp.tinceram.local",
            full_name=payload.full_name or f"Ú©Ø§Ø±Ø¨Ø± {payload.phone[-4:]}",
            phone=payload.phone,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    if not user.is_active:
        raise HTTPException(403, "Ø­Ø³Ø§Ø¨ Ø´Ù…Ø§ ØºÛŒØ±ÙØ¹Ø§Ù„ Ø§Ø³Øª.")
    _tokens(user, session, response)  # tokens delivered via httponly cookies only
    return {"user": user}


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
            user.email, "Ø¨Ø§Ø²Ù†Ø´Ø§Ù†ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± â€” ØªÙ†â€ŒØ³ÙØ±Ø§Ù…",
            notifier.RTL_EMAIL_SHELL.format(
                body=f"<p>Ø¨Ø±Ø§ÛŒ Ø¨Ø§Ø²Ù†Ø´Ø§Ù†ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø±ÙˆÛŒ Ù„ÛŒÙ†Ú© Ø²ÛŒØ± Ú©Ù„ÛŒÚ© Ú©Ù†ÛŒØ¯ (Ø§Ø¹ØªØ¨Ø§Ø± Û± Ø³Ø§Ø¹Øª):</p>"
                     f"<p><a href='{link}'>Ø¨Ø§Ø²Ù†Ø´Ø§Ù†ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±</a></p>"
                     f"<p style='color:#888;font-size:12px'>Ø§Ú¯Ø± Ø´Ù…Ø§ Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ù†Ø¯Ø§Ø¯Ù‡â€ŒØ§ÛŒØ¯ØŒ Ø§ÛŒÙ† Ø§ÛŒÙ…ÛŒÙ„ Ø±Ø§ Ù†Ø§Ø¯ÛŒØ¯Ù‡ Ø¨Ú¯ÛŒØ±ÛŒØ¯.</p>"
            ),
        )
    # Do not disclose account existence either way.
    return {"ok": True}


@router.post("/password-reset/confirm")
def password_reset_confirm(payload: ResetConfirm, session: Session = Depends(get_session)):
    row = session.exec(select(PasswordResetToken).where(PasswordResetToken.token_hash == _hash(payload.token))).first()
    if not row or row.used_at or (_ensure_aware(row.expires_at) <= datetime.now(UTC)):
        raise HTTPException(400, "ØªÙˆÚ©Ù† Ø¨Ø§Ø²Ù†Ø´Ø§Ù†ÛŒ Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª.")
    user = session.get(User, row.user_id)
    if not user:
        raise HTTPException(400, "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯.")
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
            raise HTTPException(409, "Ø§ÛŒÙ† Ø§ÛŒÙ…ÛŒÙ„ Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª.")
        user.email = new_email
    if "phone" in data and data["phone"]:
        clash = session.exec(select(User).where(User.phone == data["phone"], User.id != user.id)).first()
        if clash:
            raise HTTPException(409, "Ø§ÛŒÙ† Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª.")
        user.phone = data["phone"]
    if data.get("full_name") is not None:
        user.full_name = data["full_name"]
    if data.get("password"):
        if not user.password_hash:
            raise HTTPException(400, "Ø­Ø³Ø§Ø¨ Ø´Ù…Ø§ Ø¨Ø§ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø³Ø§Ø®ØªÙ‡ Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª.")
        # M6 fix: require current password to prevent stolen JWT takeover
        current = data.get("current_password")
        if not current or not verify_password(current, user.password_hash):
            raise HTTPException(400, "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± ÙØ¹Ù„ÛŒ Ù†Ø§Ø¯Ø±Ø³Øª Ø§Ø³Øª.")
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
        raise HTTPException(404, "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯.")
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
        raise HTTPException(404, "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯.")
    data = payload.model_dump(exclude_unset=True)
    # never let the last active admin be demoted or deactivated
    if user.is_admin and (data.get("is_admin") is False or data.get("is_active") is False):
        other_admins = session.exec(
            select(User).where(User.is_admin == True, User.is_active == True, User.id != user.id)  # noqa: E712
        ).all()
        if not other_admins:
            raise HTTPException(400, "Ø­Ø¯Ø§Ù‚Ù„ ÛŒÚ© Ù…Ø¯ÛŒØ± ÙØ¹Ø§Ù„ Ø¨Ø§ÛŒØ¯ Ø¨Ø§Ù‚ÛŒ Ø¨Ù…Ø§Ù†Ø¯.")
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
        raise HTTPException(404, "Ù†Ø´Ø§Ù†ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯.")
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
        raise HTTPException(404, "Ù†Ø´Ø§Ù†ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯.")
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
        raise HTTPException(404, "Ù…Ø­ØµÙˆÙ„ ÛŒØ§ÙØª Ù†Ø´Ø¯.")
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

# ============================ Notifications (user) ============================


@users_router.post("/me/notifications/read-all")
def mark_all_notifications_read(
    user: User = Depends(current_user), session: Session = Depends(get_session)
):
    from app.models import Notification

    rows = session.exec(
        select(Notification).where(
            Notification.user_id == user.id, Notification.is_read == False  # noqa: E712
        )
    ).all()
    for n in rows:
        n.is_read = True
        session.add(n)
    session.commit()
    return {"ok": True, "updated": len(rows)}


# ============================ User avatar (self-service) ============================


@users_router.post("/me/avatar", status_code=201)
async def upload_my_avatar(
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
):
    from app.services.storage import put_image

    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    content_type = file.content_type or ""
    if content_type not in allowed:
        raise HTTPException(415, "ÙØ±Ù…Øª ØªØµÙˆÛŒØ± Ù¾Ø´ØªÛŒØ¨Ø§Ù†ÛŒ Ù†Ù…ÛŒØ´ÙˆØ¯ (JPGØŒ PNG ÛŒØ§ WebP).")
    data = await file.read()
    max_bytes = get_settings().max_avatar_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(413, f"Ø­Ø¬Ù… ØªØµÙˆÛŒØ± Ø¨Ø§ÛŒØ¯ Ú©Ù…ØªØ± Ø§Ø² {get_settings().max_avatar_size_mb} Ù…Ú¯Ø§Ø¨Ø§ÛŒØª Ø¨Ø§Ø´Ø¯.")
    object_name = f"avatars/{user.id}/{secrets.token_hex(12)}.{allowed[content_type]}"
    url = put_image(object_name, data, content_type)
    user.avatar_url = url
    session.add(user)
    session.commit()
    return {"url": url, "object_name": object_name}


@users_router.delete("/me/addresses/{address_id}")
def delete_my_address(
    address_id: str,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
):
    from app.models import Address

    addr = session.get(Address, address_id)
    if not addr or addr.user_id != user.id:
        raise HTTPException(404, "Ù†Ø´Ø§Ù†ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯.")
    session.delete(addr)
    session.commit()
    return {"ok": True}


# ============================ Notifications (triggers) ============================


def notify_user(
    session: Session, user_id: str, ntype: str, title: str, body: str = "", link: str | None = None
) -> None:
    """Small wrapper so api modules can trigger notifications without import cycles."""
    from app.services.notifications import create_notification

    create_notification(session, user_id, title, body)

