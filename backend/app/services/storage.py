from functools import lru_cache
from io import BytesIO

from minio import Minio

from app.core.config import get_settings


@lru_cache
def client() -> Minio:
    settings = get_settings()
    host = settings.s3_endpoint.removeprefix("http://").removeprefix("https://")
    return Minio(
        host,
        access_key=settings.s3_access_key,
        secret_key=settings.s3_secret_key,
        secure=settings.s3_secure,
    )


def ensure_bucket() -> None:
    settings = get_settings()
    storage = client()
    if not storage.bucket_exists(settings.s3_bucket):
        storage.make_bucket(settings.s3_bucket)


def put_image(object_name: str, content: bytes, content_type: str) -> str:
    settings = get_settings()
    ensure_bucket()
    client().put_object(
        settings.s3_bucket,
        object_name,
        BytesIO(content),
        len(content),
        content_type=content_type,
    )
    # Store RELATIVE media URLs. Absolute origins (frontend or backend) break as
    # soon as the deployment host changes; the frontend mediaUrl() helper prefixes
    # the correct API origin at render time.
    return f"/api/v1/media/{object_name}"


def read_image(object_name: str) -> tuple[bytes, str]:
    settings = get_settings()
    response = client().get_object(settings.s3_bucket, object_name)
    try:
        return response.read(), response.headers.get("Content-Type", "application/octet-stream")
    finally:
        response.close()
        response.release_conn()
