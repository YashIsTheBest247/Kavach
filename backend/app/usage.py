"""
In-memory API usage tracking + sliding-window rate limiting.

Powers the partner usage dashboard and protects the keyed surfaces from abuse.
Deliberately dependency-free (a dict + deque per key) so it runs anywhere; swap
for Redis in a multi-process deployment.
"""
from __future__ import annotations

import os
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict

# requests allowed per key within WINDOW seconds
RATE_LIMIT = int(os.getenv("API_RATE_LIMIT", "60"))
WINDOW = int(os.getenv("API_RATE_WINDOW", "60"))

_lock = threading.Lock()
_hits: Dict[str, Deque[float]] = defaultdict(deque)          # key -> recent call timestamps (for rate limit)
_total: Dict[str, int] = defaultdict(int)                    # key -> lifetime call count
_by_endpoint: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
_rejected: Dict[str, int] = defaultdict(int)                 # key -> rate-limited count
_first_seen: Dict[str, float] = {}


def _mask(key: str) -> str:
    if not key:
        return "anonymous"
    return key[:6] + "…" + key[-2:] if len(key) > 8 else key


def check_and_record(key: str, endpoint: str, now: float) -> bool:
    """Record a call. Returns False if the key is over its rate limit."""
    with _lock:
        dq = _hits[key]
        cutoff = now - WINDOW
        while dq and dq[0] < cutoff:
            dq.popleft()
        if len(dq) >= RATE_LIMIT:
            _rejected[key] += 1
            return False
        dq.append(now)
        _total[key] += 1
        _by_endpoint[key][endpoint] += 1
        _first_seen.setdefault(key, now)
        return True


def summary(now: float) -> Dict:
    """Snapshot for the usage dashboard."""
    with _lock:
        keys = []
        for k in sorted(_total, key=lambda x: _total[x], reverse=True):
            dq = _hits[k]
            recent = sum(1 for ts in dq if ts >= now - WINDOW)
            keys.append({
                "key": _mask(k),
                "total_calls": _total[k],
                "calls_last_window": recent,
                "rate_limit": RATE_LIMIT,
                "utilization": round(min(1.0, recent / RATE_LIMIT), 2),
                "rejected": _rejected[k],
                "top_endpoints": dict(sorted(_by_endpoint[k].items(), key=lambda kv: kv[1], reverse=True)[:5]),
                "first_seen": int(_first_seen.get(k, now)),
            })
        return {
            "window_seconds": WINDOW,
            "rate_limit_per_window": RATE_LIMIT,
            "total_calls": sum(_total.values()),
            "total_rejected": sum(_rejected.values()),
            "active_keys": len(_total),
            "keys": keys,
        }
