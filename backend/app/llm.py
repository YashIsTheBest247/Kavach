"""
Gemini LLM augmentation layer
-----------------------------
The rule engine (scam_engine.py) stays the deterministic, auditable backbone —
it always runs and never needs a key, so the demo can't break. Gemini is layered
ON TOP to add what keywords can't: reasoning over intent, detection of *novel*
manipulation tactics not in the rule library, and a natural-language advisory.

Set GEMINI_API_KEY in the environment (or backend/.env) to activate. Without it,
every function degrades gracefully to `available=False` and the platform falls
back to the rule engine alone.
"""
from __future__ import annotations

import json
import os
from typing import Dict, Optional

# Optional .env support — never hard-fail if python-dotenv isn't installed.
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

_client = None
_init_error: Optional[str] = None


def _get_client():
    global _client, _init_error
    if _client is not None:
        return _client
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        _init_error = "GEMINI_API_KEY not set"
        return None
    try:
        from google import genai  # google-genai SDK
        _client = genai.Client(api_key=key)
        return _client
    except Exception as e:  # pragma: no cover
        _init_error = f"google-genai unavailable: {e}"
        return None


def status() -> Dict:
    client = _get_client()
    return {
        "available": client is not None,
        "model": MODEL if client is not None else None,
        "reason": None if client is not None else _init_error,
    }


SYSTEM_PROMPT = """You are a fraud-analysis expert for India's cyber-crime helpline (1930).
You analyse a suspicious phone/SMS/WhatsApp/video-call message for signs of a digital-arrest
scam, financial fraud or impersonation of authorities (CBI, ED, Customs, TRAI, police).

Reason about INTENT and manipulation psychology — not just keywords. Identify tactics a simple
keyword filter would miss (e.g. building false rapport, fabricated case numbers, manufactured
authority, isolation pressure, sunk-cost framing).

Indian agencies NEVER arrest over a call, never demand money/OTP to "verify" funds, and
"digital arrest" is not a real legal procedure.

Return ONLY valid JSON with EXACTLY these keys:
{
  "is_scam": boolean,
  "risk_score": integer 0-100,
  "scam_type": short string (e.g. "Digital Arrest Impersonation", "KYC Phishing", "Likely Genuine"),
  "reasoning": 2-3 sentence plain-English explanation of WHY,
  "novel_tactics": array of short strings — manipulation tactics you detected (may be empty),
  "advisory": one actionable sentence for the citizen
}
Be calibrated: a genuine bank reminder that says "never share your OTP" is NOT a scam (low score)."""


def analyze(text: str) -> Dict:
    """Run Gemini analysis. Returns {available: False, ...} if not configured."""
    client = _get_client()
    if client is None:
        return {"available": False, "reason": _init_error}

    try:
        from google.genai import types
        resp = client.models.generate_content(
            model=MODEL,
            contents=f"{SYSTEM_PROMPT}\n\n--- MESSAGE TO ANALYSE ---\n{text}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
                max_output_tokens=600,
            ),
        )
        raw = (resp.text or "").strip()
        data = _safe_json(raw)
        if data is None:
            return {"available": True, "error": "Could not parse model output", "raw": raw[:300]}

        # Normalise / clamp.
        score = int(data.get("risk_score", 0))
        score = max(0, min(100, score))
        return {
            "available": True,
            "model": MODEL,
            "is_scam": bool(data.get("is_scam", score >= 50)),
            "risk_score": score,
            "scam_type": str(data.get("scam_type", "Unknown")),
            "reasoning": str(data.get("reasoning", "")),
            "novel_tactics": list(data.get("novel_tactics", []) or []),
            "advisory": str(data.get("advisory", "")),
        }
    except Exception as e:  # pragma: no cover
        return {"available": True, "error": str(e)}


def _safe_json(raw: str) -> Optional[Dict]:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        pass
    # strip ```json fences or surrounding prose
    start, end = raw.find("{"), raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start:end + 1])
        except Exception:
            return None
    return None
