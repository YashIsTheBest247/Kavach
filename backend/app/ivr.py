"""
Citizen Fraud Shield — IVR channel (Twilio-compatible voice webhook).

Lets a citizen simply CALL a number, describe the suspicious call/message in
their language, and hear an instant scam verdict + advisory — reaching people who
don't use apps at all (the elderly, feature-phone users). Returns TwiML, so it
works with Twilio Programmable Voice or any TwiML-compatible telephony (Exotel).

Point your voice number's webhook at  <public-url>/api/ivr/welcome  (POST).
No credentials needed in this codebase — the telephony provider calls these URLs.
"""
from __future__ import annotations

import re
from typing import Dict

from app import scam_engine, advisory

# Kavach lang code → Twilio TTS/ASR locale (falls back to en-IN).
TW_LOCALE = {
    "en": "en-IN", "hi": "hi-IN", "ta": "ta-IN", "te": "te-IN", "kn": "kn-IN",
    "ml": "ml-IN", "gu": "gu-IN", "mr": "mr-IN", "bn": "bn-IN", "pa": "en-IN",
    "or": "en-IN", "ur": "hi-IN",
}
PROMPT = {
    "en": "Welcome to Kavach Fraud Shield. After the beep, describe the suspicious call, message or payment request. Then stay on the line for your safety verdict.",
    "hi": "कवच फ्रॉड शील्ड में आपका स्वागत है। बीप के बाद, संदिग्ध कॉल, संदेश या भुगतान अनुरोध का वर्णन करें। फिर अपने सुरक्षा निर्णय के लिए लाइन पर बने रहें।",
}
NO_INPUT = {
    "en": "Sorry, we did not catch that. Please call again and describe the message. Stay alert and report fraud to 1930.",
    "hi": "क्षमा करें, हम समझ नहीं पाए। कृपया दोबारा कॉल करें। सतर्क रहें और धोखाधड़ी की सूचना 1930 पर दें।",
}


def _esc(s: str) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def _speakable(s: str) -> str:
    # strip emoji / symbols the TTS would read awkwardly
    return re.sub(r"[^\w\s.,:;!?/₹%'ऀ-෿-]", "", s).strip()


def welcome_twiml(lang: str = "en") -> str:
    lang = lang if lang in TW_LOCALE else "en"
    loc = TW_LOCALE[lang]
    prompt = PROMPT.get(lang, PROMPT["en"])
    noinput = NO_INPUT.get(lang, NO_INPUT["en"])
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        f'  <Gather input="speech" language="{loc}" speechTimeout="auto" '
        f'action="/api/ivr/analyze?lang={lang}" method="POST">\n'
        f'    <Say language="{loc}">{_esc(prompt)}</Say>\n'
        "  </Gather>\n"
        f'  <Say language="{loc}">{_esc(noinput)}</Say>\n'
        "</Response>"
    )


def analyze_twiml(speech: str, lang: str = "en") -> str:
    lang = lang if lang in TW_LOCALE else "en"
    loc = TW_LOCALE[lang]
    r = scam_engine.analyze_text(speech or "")
    spoken_level = {"CRITICAL": "Critical risk", "HIGH": "High risk",
                    "MEDIUM": "Medium risk", "LOW": "Low risk"}.get(r.risk_level, r.risk_level)
    verdict = f"Kavach verdict: {spoken_level}. Risk score {r.risk_score} out of 100."
    adv = _speakable(advisory.advisory_for(r.risk_level, lang))
    tail = ("Do not pay or share any O T P. Report to 1 9 3 0."
            if r.risk_level in ("CRITICAL", "HIGH") else "Stay alert. Report fraud to 1 9 3 0.")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        f'  <Say language="en-IN">{_esc(verdict)}</Say>\n'
        f'  <Say language="{loc}">{_esc(adv)}</Say>\n'
        f'  <Say language="en-IN">{_esc(tail)}</Say>\n'
        "  <Hangup/>\n"
        "</Response>"
    )
