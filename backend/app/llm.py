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

# ---------------------------------------------------------------------------
# API key rotation
# ---------------------------------------------------------------------------
# Supply multiple keys to survive per-key quota / rate limits. Any of:
#   GEMINI_API_KEY, GEMINI_API_KEY_2 ... GEMINI_API_KEY_5   (numbered slots)
#   GEMINI_API_KEYS = "key1,key2,key3"                       (comma bundle)
# On a quota / rate-limit / transient error we transparently rotate to the next
# key and retry; the last key that worked becomes the new starting point.
_clients: Dict[str, object] = {}       # key -> genai.Client (cached)
_idx = 0                               # index of the current preferred key
_init_error: Optional[str] = None


def _load_keys() -> list:
    keys = []
    for name in ("GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3",
                 "GEMINI_API_KEY_4", "GEMINI_API_KEY_5"):
        v = (os.getenv(name) or "").strip()
        if v:
            keys.append(v)
    for v in (os.getenv("GEMINI_API_KEYS") or "").split(","):
        v = v.strip()
        if v:
            keys.append(v)
    seen, out = set(), []
    for k in keys:                     # dedupe, preserve order
        if k not in seen:
            seen.add(k); out.append(k)
    return out


def _client_for(key: str):
    c = _clients.get(key)
    if c is None:
        from google import genai       # google-genai SDK
        c = genai.Client(api_key=key)
        _clients[key] = c
    return c


def _is_transient(e: Exception) -> bool:
    """Quota / rate-limit / temporary errors worth rotating keys for."""
    s = str(e).lower()
    return any(x in s for x in ("429", "resource_exhausted", "quota", "rate limit",
                                "rate_limit", "exhausted", "unavailable", "503",
                                "overloaded", "500", "deadline"))


def _get_client():
    """Current preferred client (back-compat; prefer generate())."""
    global _idx, _init_error
    keys = _load_keys()
    if not keys:
        _init_error = "GEMINI_API_KEY not set"
        return None
    try:
        return _client_for(keys[_idx % len(keys)])
    except Exception as e:  # pragma: no cover
        _init_error = f"google-genai unavailable: {e}"
        return None


def generate(contents, config=None, model: Optional[str] = None):
    """generate_content with automatic key rotation. Returns the response, or
    None if every configured key failed. Raises nothing — callers degrade."""
    global _idx, _init_error
    keys = _load_keys()
    if not keys:
        _init_error = "GEMINI_API_KEY not set"
        return None
    model = model or MODEL
    n = len(keys)
    last_err = None
    for attempt in range(n):
        i = (_idx + attempt) % n
        try:
            resp = _client_for(keys[i]).models.generate_content(
                model=model, contents=contents, config=config)
            _idx = i                    # stick with the key that worked
            _init_error = None
            return resp
        except Exception as e:          # rotate on any error, remember the last
            last_err = e
            if not _is_transient(e) and attempt == n - 1:
                break
            continue
    _init_error = f"all {n} Gemini key(s) failed: {last_err}"
    return None


def status() -> Dict:
    keys = _load_keys()
    client = _get_client() if keys else None
    return {
        "available": client is not None,
        "model": MODEL if client is not None else None,
        "keys_configured": len(keys),
        "active_key_index": (_idx % len(keys)) + 1 if keys else 0,
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
    if not _load_keys():
        return {"available": False, "reason": "GEMINI_API_KEY not set"}

    try:
        from google.genai import types
        resp = generate(
            contents=f"{SYSTEM_PROMPT}\n\n--- MESSAGE TO ANALYSE ---\n{text}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
                # High ceiling: gemini-2.5-flash's hidden "thinking" also draws
                # from this budget — too low and the JSON gets truncated.
                max_output_tokens=2048,
            ),
        )
        if resp is None:
            return {"available": False, "reason": _init_error}
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
