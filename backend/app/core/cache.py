import time
from typing import Optional, Dict, Any


class TTLCache:
    """Simple TTL (Time-To-Live) cache with expiry support.

    Uses internal time tracking so entries auto-expire after configured TTL.
    Designed for CSRF tokens and similar short-lived data.
    """

    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._ttls: Dict[str, float] = {}

    def set(self, key: str, value: Dict[str, Any], expiry: int = 300) -> None:
        """Store a value with a TTL (time-to-live) in seconds."""
        self._store[key] = value
        self._ttls[key] = time.time() + expiry

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve a value if it hasn't expired.

        Returns None if the key doesn't exist or has expired.
        Automatically removes expired entries.
        """
        if key not in self._store:
            return None

        if time.time() > self._ttls.get(key, 0):
            # Expired - remove and return None
            self.delete(key)
            return None

        return self._store.get(key)

    def delete(self, key: str) -> None:
        """Remove a key from the cache."""
        self._store.pop(key, None)
        self._ttls.pop(key, None)

    def exists(self, key: str) -> bool:
        """Check if a key exists and hasn't expired."""
        return self.get(key) is not None


# Global CSRF cache instance (shared across requests in single-process mode)
csrf_cache = TTLCache()