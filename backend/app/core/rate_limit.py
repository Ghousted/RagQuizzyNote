"""In-memory sliding-window rate limiter — no Redis required for dev.

For production, swap the _Store backend with Redis INCR + EXPIRE.
"""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from threading import Lock

from fastapi import HTTPException


class _SlidingWindowLimiter:
    def __init__(self, max_calls: int, window_minutes: int):
        self._max = max_calls
        self._window = timedelta(minutes=window_minutes)
        self._log: dict[str, list[datetime]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> None:
        """Raise HTTP 429 if key has exceeded the rate limit."""
        now = datetime.now(timezone.utc)
        cutoff = now - self._window
        with self._lock:
            self._log[key] = [t for t in self._log[key] if t > cutoff]
            if len(self._log[key]) >= self._max:
                raise HTTPException(
                    status_code=429,
                    detail=(
                        f"Rate limit exceeded: {self._max} requests per "
                        f"{int(self._window.total_seconds() // 60)} minutes."
                    ),
                )
            self._log[key].append(now)


# Singletons — one per concern
ai_limiter = _SlidingWindowLimiter(max_calls=30, window_minutes=60)
auth_limiter = _SlidingWindowLimiter(max_calls=10, window_minutes=15)
