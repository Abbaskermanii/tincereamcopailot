from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "TinCeram API"

    database_url: str = "postgresql+psycopg://ceramics:ceramics_dev@db:5432/ceramics"
    redis_url: str = "redis://redis:6379/0"

    zarinpal_merchant_id: str = ""
    zarinpal_sandbox: bool = True

    secret_key: str = "change-me-in-production"
    admin_username: str = "admin"
    admin_password: str = "admin123"

    next_public_site_url: str = "http://localhost:3000"
    s3_endpoint: str = "http://minio:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin123"
    s3_bucket: str = "tinceram-media"
    s3_secure: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
