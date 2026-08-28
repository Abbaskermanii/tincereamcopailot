import contextlib
import json
from typing import Any

from redis import Redis

from app.core.config import get_settings

_client: Redis | None = None


def get_redis() -> Redis:
    global _client
    if _client is None:
        _client = Redis.from_url(get_settings().redis_url, decode_responses=True)
    return _client


def cache_get_json(key: str) -> Any | None:
    try:
        raw = get_redis().get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None  # cache must never take the API down


def cache_set_json(key: str, value: Any, ttl_seconds: int = 120) -> None:
    with contextlib.suppress(Exception):
        get_redis().setex(key, ttl_seconds, json.dumps(value, default=str))


def cache_delete_pattern(pattern: str) -> None:
    try:
        client = get_redis()
        for key in client.scan_iter(match=pattern, count=100):
            client.delete(key)
    except Exception:
        pass
