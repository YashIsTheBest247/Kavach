"""
Crowdsourced fraud reports + number/UPI/link reputation.

Citizens report a scam number, UPI ID or link; reports accumulate into a live
reputation score that anyone can look up before trusting a contact. This also
turns the platform's fraud data from static → community-driven.
"""
from __future__ import annotations

import json
import os
import re
import time
from collections import Counter
from typing import Dict, List, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STORE = os.path.join(DATA_DIR, "reports.json")

# seed so reputation lookups demo well out of the box
_SEED = [
    {"value": "+919821000001", "kind": "phone", "reason": "Fake CBI digital arrest call", "ts": 1_700_000_000},
    {"value": "+919821000001", "kind": "phone", "reason": "Threatened arrest, asked to transfer money", "ts": 1_700_100_000},
    {"value": "+919821000001", "kind": "phone", "reason": "Impersonated ED officer", "ts": 1_700_200_000},
    {"value": "scam@okhdfcbank", "kind": "upi", "reason": "KYC refund scam UPI", "ts": 1_700_050_000},
    {"value": "scam@okhdfcbank", "kind": "upi", "reason": "Collected 'verification' money", "ts": 1_700_150_000},
    {"value": "https://sbi-kyc-update.xyz", "kind": "link", "reason": "Fake SBI KYC phishing page", "ts": 1_700_090_000},
]


def _norm(value: str) -> str:
    v = (value or "").strip().lower()
    if re.match(r"^[+\d][\d\s-]{6,}$", v):          # phone → digits only
        return "+" + re.sub(r"\D", "", v)
    return v


def _kind(value: str) -> str:
    v = value.strip().lower()
    if re.match(r"^[+\d][\d\s-]{6,}$", v):
        return "phone"
    if "@" in v and " " not in v and "." not in v.split("@")[-1]:
        return "upi"
    if "://" in v or "." in v:
        return "link"
    return "other"


def _load() -> List[Dict]:
    try:
        with open(STORE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return list(_SEED)


def _save(items: List[Dict]):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STORE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


def submit(value: str, reason: str = "", kind: Optional[str] = None) -> Dict:
    value = value.strip()
    if not value:
        return {"ok": False, "error": "empty value"}
    items = _load()
    rec = {"value": value, "norm": _norm(value), "kind": kind or _kind(value),
           "reason": reason.strip()[:200], "ts": int(time.time())}
    items.append(rec)
    _save(items)
    return {"ok": True, "report": rec, "reputation": reputation(value)}


def reputation(value: str) -> Dict:
    norm = _norm(value)
    items = _load()
    hits = [r for r in items if r.get("norm", _norm(r["value"])) == norm or _norm(r["value"]) == norm]
    n = len(hits)
    reasons = [h["reason"] for h in hits if h.get("reason")]
    top = [r for r, _ in Counter(reasons).most_common(4)]
    # score: reports drive risk, saturating
    score = min(100, n * 32)
    if score >= 65:
        level, verdict = "HIGH", "REPORTED FRAUD — avoid"
    elif score >= 30:
        level, verdict = "MEDIUM", "Some reports — be cautious"
    elif n > 0:
        level, verdict = "LOW", "A report exists"
    else:
        level, verdict = "LOW", "No reports found"
    return {"value": value, "kind": _kind(value), "reports": n,
            "risk_score": score, "risk_level": level, "verdict": verdict,
            "reasons": top, "last_reported": max([h["ts"] for h in hits], default=None)}


def recent(limit: int = 20) -> List[Dict]:
    items = sorted(_load(), key=lambda r: r.get("ts", 0), reverse=True)
    return items[:limit]


def stats() -> Dict:
    items = _load()
    return {"total_reports": len(items),
            "unique_flagged": len({_norm(r["value"]) for r in items}),
            "by_kind": dict(Counter(_kind(r["value"]) for r in items))}
