"""
Citizen Fraud Shield — WhatsApp channel via the FREE Twilio WhatsApp Sandbox.

No Meta business verification, no expiring tokens, no cost. A citizen sends any
suspicious call transcript / SMS / message to the sandbox WhatsApp number and
Kavach auto-checks it and replies with a verdict + localized advisory + guided
1930 reporting — the same engine as the web app and Telegram bot.

Twilio posts inbound messages (form-encoded: Body, From) to
    POST /api/whatsapp/twilio
and expects a TwiML <Message> reply, which this module builds.

Setup (free): Twilio Console → Messaging → Try WhatsApp → set the sandbox
'When a message comes in' webhook to  <public-url>/api/whatsapp/twilio  (POST).
Citizens opt in by texting 'join <your-code>' to the sandbox number once.
"""
from __future__ import annotations

import re

from app import scam_engine, advisory

EMOJI = {"CRITICAL": "🚨", "HIGH": "⚠️", "MEDIUM": "🔎", "LOW": "✅"}

# Unicode script → Kavach language, so the reply auto-matches the sender's script.
_SCRIPTS = [
    ("ऀ", "ॿ", "hi"),  # Devanagari (Hindi/Marathi)
    ("ঀ", "৿", "bn"),  # Bengali
    ("஀", "௿", "ta"),  # Tamil
    ("ఀ", "౿", "te"),  # Telugu
    ("ಀ", "೿", "kn"),  # Kannada
    ("ഀ", "ൿ", "ml"),  # Malayalam
    ("઀", "૿", "gu"),  # Gujarati
    ("਀", "੿", "pa"),  # Gurmukhi (Punjabi)
    ("଀", "୿", "or"),  # Odia
    ("؀", "ۿ", "ur"),  # Arabic (Urdu)
]


def detect_lang(text: str) -> str:
    for ch in text or "":
        for lo, hi, lang in _SCRIPTS:
            if lo <= ch <= hi:
                return lang
    return "en"


def _esc(s: str) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def verdict_message(body: str, lang: str = None) -> str:
    lang = lang or detect_lang(body)
    r = scam_engine.analyze_text(body or "")
    lines = [f"{EMOJI.get(r.risk_level, '❓')} *{r.risk_level}* — risk {r.risk_score}/100"]
    if r.tactics_detected:
        lines.append("Tactics: " + ", ".join(r.tactics_detected[:5]))
    lines.append("")
    lines.append(advisory.advisory_for(r.risk_level, lang))
    if r.risk_level in ("CRITICAL", "HIGH"):
        lines.append("\n☎️ Report now: *1930* · cybercrime.gov.in")
    return "\n".join(lines)


def twiml(body: str, lang: str = None) -> str:
    """TwiML reply for the Twilio WhatsApp webhook."""
    msg = _esc(verdict_message(body, lang))
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f"<Response><Message>{msg}</Message></Response>")
