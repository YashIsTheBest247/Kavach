"""
API-key authentication for the two integration surfaces.

Kavach exposes TWO separate, independently-keyed REST APIs so partners can adopt
either one alone:

  • /api/automation/*  — the ET awareness-reel automation agent  (AUTOMATION_API_KEYS)
  • /api/partner/*     — embeddable Kavach detection for any app  (PARTNER_API_KEYS)

Keys are read from env (comma-separated). Demo defaults are provided so the
feature works out of the box; set real keys in production.
"""
from __future__ import annotations

import os
import time
from fastapi import Header, HTTPException, Request

from app import usage


def _keys(env: str, default: str) -> set:
    raw = os.getenv(env, default)
    return {k.strip() for k in raw.split(",") if k.strip()}


AUTOMATION_KEYS = _keys("AUTOMATION_API_KEYS", "kavach-automation-demo")
PARTNER_KEYS = _keys("PARTNER_API_KEYS", "kavach-partner-demo")


def _meter(key: str, request: Request):
    """Record the call and enforce the per-key sliding-window rate limit."""
    endpoint = request.url.path if request else "?"
    if not usage.check_and_record(key, endpoint, time.time()):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded — max {usage.RATE_LIMIT} requests / {usage.WINDOW}s per key.",
            headers={"Retry-After": str(usage.WINDOW)},
        )


def require_automation_key(request: Request, x_api_key: str = Header(None, alias="X-API-Key")):
    if x_api_key not in AUTOMATION_KEYS:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key (automation API)")
    _meter(x_api_key, request)
    return x_api_key


def require_partner_key(request: Request, x_api_key: str = Header(None, alias="X-API-Key")):
    if x_api_key not in PARTNER_KEYS:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key (partner API)")
    _meter(x_api_key, request)
    return x_api_key
