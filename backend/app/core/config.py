from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# Insecure defaults that must never be used in production
_INSECURE_SECRET = "change-me-in-production"
_INSECURE_ADMIN_PASS = "admin123"
_INSECURE_SEED_PASS = "admin1234"
_INSECURE_S3_KEY = "minioadmin"
_INSECURE_S3_SECRET = "minioadmin123"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "TinCeram API"
    environment: str = "development"  # development | production | test

    database_url: str = "postgresql+psycopg://ceramics:ceramics_dev@db:5432/ceramics"
    redis_url: str = "redis://redis:6379/0"

    zarinpal_merchant_id: str = ""
    zarinpal_sandbox: bool = True

    # SECURITY: In development these defaults allow `docker compose up` to work
    # without extra setup. In production `validate_production_settings()` aborts
    # startup if any insecure default is still in use.
    secret_key: str = Field(default="change-me-in-production", min_length=1)
    # Separate secret for refresh tokens — if empty, falls back to secret_key.
    # In production a distinct value is strongly recommended.
    refresh_secret_key: str = Field(default="")
    admin_username: str = "admin"
    admin_password: str = "admin123"

    # First-run seeding: the seed script promotes/creates this account as admin.
    seed_admin_email: str = "admin@tinceram.local"
    seed_admin_password: str = "admin1234"

    next_public_site_url: str = "http://localhost:3000"
    s3_endpoint: str = "http://minio:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin123"
    s3_bucket: str = "tinceram-media"
    s3_secure: bool = False

    # --- Security ---
    # Rate limiting (requests/seconds). Set RATE_LIMIT_ENABLED=false in tests.
    rate_limit_enabled: bool = True
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    auth_cookies_secure: bool = False  # true behind HTTPS in production
    max_login_attempts: int = 8
    login_lock_minutes: int = 15

    # --- Outgoing email (transactional). Empty SMTP host → dev console sink. ---
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "TinCeram <no-reply@tinceram.local>"
    smtp_tls: bool = True

    # --- SMS provider (Kavenegar-compatible HTTP GET template). ---
    # {api_key}, {sender}, {receptor} and {message} placeholders are substituted.
    sms_api_url: str = ""
    sms_api_key: str = ""
    sms_sender: str = ""
    # development helper: return OTP codes in API responses — FORBIDDEN in production
    sms_debug: bool = False

    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def get_refresh_secret(self) -> str:
        """Return the refresh-token secret (falls back to access secret in dev)."""
        return self.refresh_secret_key or self.secret_key

    def validate_production_settings(self) -> None:
        """Abort startup if insecure defaults are still active in production.

        Raises:
            RuntimeError: if any critical secret is insecure while ENVIRONMENT=production.
        """
        if not self.is_production():
            return
        errors: list[str] = []
        if not self.secret_key or self.secret_key == _INSECURE_SECRET or len(self.secret_key) < 32:
            errors.append("SECRET_KEY must be set to a strong random value (≥32 chars) in production")
        if self.refresh_secret_key and len(self.refresh_secret_key) < 32:
            errors.append("REFRESH_SECRET_KEY must be ≥32 chars if set")
        if not self.admin_password or self.admin_password == _INSECURE_ADMIN_PASS:
            errors.append("ADMIN_PASSWORD must not be the default in production")
        if not self.seed_admin_password or self.seed_admin_password == _INSECURE_SEED_PASS:
            errors.append("SEED_ADMIN_PASSWORD must not be the default in production")
        if not self.auth_cookies_secure:
            errors.append("AUTH_COOKIES_SECURE must be true in production (HTTPS required)")
        if self.sms_debug:
            errors.append("SMS_DEBUG must be false in production")
        if self.s3_access_key == _INSECURE_S3_KEY or self.s3_secret_key == _INSECURE_S3_SECRET:
            errors.append("S3_ACCESS_KEY / S3_SECRET_KEY must not be default minio values in production")
        if errors:
            raise RuntimeError("Insecure production configuration:\n- " + "\n- ".join(errors))


@lru_cache
def get_settings() -> Settings:
    return Settings()
