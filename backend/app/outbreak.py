"""
Scam-outbreak early-warning.

Preventive, not just reactive. Fuses two live signals — the crowd fraud reports
(reports.py) and the scam-news feed (news.py) — to detect which scam types are
SPIKING right now and raise citizen-facing outbreak alerts ("a courier-parcel
scam is spreading today"). Turns Kavach from a lookup tool into an early-warning
system.
"""
from __future__ import annotations

import re
import time
from typing import Dict, List

from app import news, reports

# Scam families and the tokens that identify them in news headlines / reports.
FAMILIES = [
    ("Digital Arrest", ["digital arrest", "cbi", "ed officer", "customs", "parcel scam", "fake police", "arrest warrant", "impersonation"]),
    ("UPI / Banking Fraud", ["upi fraud", "upi scam", "netbanking", "bank fraud", "money mule", "mule account", "unauthorised transaction"]),
    ("KYC / Phishing", ["kyc", "phishing", "otp scam", "otp share", "fake link", "sim swap", "credential"]),
    ("Investment / Task Scam", ["investment scam", "trading scam", "task scam", "part-time job scam", "crypto scam", "stock tip", "ponzi"]),
    ("Loan App Harassment", ["loan app", "instant loan", "loan scam", "recovery agent", "blackmail", "harassment"]),
    ("Counterfeit Currency", ["counterfeit", "fake note", "ficn", "fake currency"]),
    ("Deepfake / AI Voice", ["deepfake", "ai voice", "voice clone", "voice cloning", "morphed", "face swap"]),
]

_RECENCY_WINDOW = 14 * 86400  # reports within 14 days weigh into "spiking"
_TOK_RE = {}


def _match(text: str, tokens: List[str]) -> bool:
    """Word-boundary match so 'customs' never fires on 'customer' or 'loan app'
    on 'loan application'."""
    t = (text or "").lower()
    for tok in tokens:
        rx = _TOK_RE.get(tok)
        if rx is None:
            rx = _TOK_RE[tok] = re.compile(r"\b" + re.escape(tok) + r"\b")
        if rx.search(t):
            return True
    return False


def alerts() -> Dict:
    now = int(time.time())
    feed = news.get_news().get("items", [])
    news_text = [f"{it.get('title','')} {it.get('summary','')}" for it in feed]
    recent_reports = reports.recent(300)

    out: List[Dict] = []
    for name, tokens in FAMILIES:
        news_hits = sum(1 for tx in news_text if _match(tx, tokens))
        rep_hits = [r for r in recent_reports if _match(r.get("reason", "") + " " + r.get("value", ""), tokens)]
        fresh = sum(1 for r in rep_hits if now - r.get("ts", 0) <= _RECENCY_WINDOW)

        # weighted signal: news coverage + reports, recent reports count double
        score = news_hits * 2 + len(rep_hits) + fresh
        if score <= 0:
            continue
        if score >= 6:
            severity, trend = "HIGH", "surging"
        elif score >= 3:
            severity, trend = "MEDIUM", "rising"
        else:
            severity, trend = "LOW", "watch"

        # Prefer a headline whose TITLE actually matches (relevant to the family);
        # only fall back to a title+summary match so we never show an off-topic story.
        sample_item = (next((it for it in feed if _match(it.get("title", ""), tokens)), None)
                       or next((it for it, tx in zip(feed, news_text) if _match(tx, tokens)), None))
        out.append({
            "scam_type": name,
            "severity": severity,
            "trend": trend,
            "score": score,
            "news_mentions": news_hits,
            "citizen_reports": len(rep_hits),
            "reports_last_14d": fresh,
            "headline_sample": sample_item.get("title") if sample_item else None,
            "headline_link": sample_item.get("link") if sample_item else None,
            "advice": _advice(name),
        })

    out.sort(key=lambda a: a["score"], reverse=True)
    highest = out[0]["severity"] if out else "LOW"
    return {
        "generated": now,
        "national_threat_level": highest,
        "active_alerts": len(out),
        "alerts": out,
        "sources": {"news_items": len(feed), "reports_scanned": len(recent_reports)},
        "disclaimer": "Signal fusion from live news + crowd reports. Indicative trend detection, "
                      "not an official advisory.",
    }


def _advice(name: str) -> str:
    return {
        "Digital Arrest": "No agency arrests over a call/video. Hang up, never pay to 'clear' a case, call 1930.",
        "UPI / Banking Fraud": "Never approve a UPI 'collect' request to receive money. Banks never ask for OTP/PIN.",
        "KYC / Phishing": "Don't click KYC/verify links. Update KYC only in the official bank app or branch.",
        "Investment / Task Scam": "Guaranteed returns / paid 'like-and-earn' tasks are scams. Verify SEBI registration.",
        "Loan App Harassment": "Use only RBI-registered lenders. Report harassment & data misuse to 1930.",
        "Counterfeit Currency": "Check thread, watermark and intaglio. Refuse and report suspect notes.",
        "Deepfake / AI Voice": "Verify a 'relative in trouble' call on a known number before paying. Voices can be cloned.",
    }.get(name, "Stay alert, verify independently, and report to 1930 / cybercrime.gov.in.")
