"""
Kavach Counter-Intel — scammer honeypot / time-waster agent.

Flips defence into offence. Given a scammer's message, an AI persona (a naive,
slightly confused target) replies to KEEP THE SCAMMER TALKING and coax them into
revealing operational details — UPI IDs, phone numbers, account numbers, links.
Every identifier the scammer leaks is harvested and auto-filed into the crowd
fraud database (reports.py), so engaging one scammer protects everyone.

Never shares real user data and never pays — it only extracts intelligence.
Gemini drives the persona when a key is set; a deterministic template keeps it
working offline.
"""
from __future__ import annotations

import re
from typing import Dict, List

from app import llm, scam_engine, reports

# --- identifier extractors -------------------------------------------------
_RE_UPI = re.compile(r"\b[\w.\-]{2,}@[a-zA-Z]{2,}\b")
_RE_PHONE = re.compile(r"(?:\+?91[\-\s]?)?[6-9]\d{9}\b")
_RE_LINK = re.compile(r"\b(?:https?://|www\.)[^\s]+", re.I)
_RE_ACCOUNT = re.compile(r"\b\d{9,18}\b")
_RE_AMOUNT = re.compile(r"(?:₹|rs\.?|inr)\s?[\d,]+(?:\.\d+)?", re.I)

PERSONAS = {
    "confused_elder": "a polite but easily-confused 68-year-old retired person who is not tech-savvy",
    "eager_victim": "an anxious person who is scared of the 'arrest' and seems willing to comply",
    "busy_parent": "a distracted working parent who keeps mishearing details and asks to repeat",
}


def _harvest(text: str) -> Dict[str, List[str]]:
    upis = [u for u in _RE_UPI.findall(text) if "." not in u.split("@")[-1]]
    phones = ["+91" + re.sub(r"\D", "", p)[-10:] for p in _RE_PHONE.findall(text)]
    links = _RE_LINK.findall(text)
    # account numbers = long digit runs that aren't phone numbers
    accts = [a for a in _RE_ACCOUNT.findall(text) if not (10 <= len(a) <= 12 and a[0] in "6789")]
    amounts = _RE_AMOUNT.findall(text)
    dedup = lambda xs: list(dict.fromkeys(xs))
    return {"upis": dedup(upis), "phones": dedup(phones), "links": dedup(links),
            "accounts": dedup(accts), "amounts": dedup(amounts)}


def _template_reply(persona: str, harvested: Dict, turn: int) -> str:
    if harvested["upis"] or harvested["accounts"]:
        return ("Okay okay I am trying... the screen is very small, can you please repeat "
                "the UPI ID slowly once more? And which number should I call you back on?")
    banks = ["Beta, I am very worried. How much do I have to pay exactly, and to which UPI ID?",
             "I don't understand these apps. Can you send me the account number and your phone number?",
             "Sir please don't arrest me. Tell me the exact UPI or account where I should send the money."]
    return banks[turn % len(banks)]


def _gemini_reply(conversation: List[Dict], persona: str, lang: str) -> str:
    persona_desc = PERSONAS.get(persona, PERSONAS["confused_elder"])
    lang_line = "Reply in simple Hindi (Devanagari)." if lang == "hi" else "Reply in simple English."
    transcript = "\n".join(f"{'SCAMMER' if m.get('role') == 'scammer' else 'YOU'}: {m.get('text','')}"
                           for m in conversation)
    prompt = (
        "You are a COUNTER-FRAUD honeypot. You role-play as "
        f"{persona_desc} to WASTE a phone/WhatsApp scammer's time and bait them into "
        "revealing operational details — their UPI ID, phone number, bank account number "
        "or payment link. Techniques: sound cooperative but confused, ask them to repeat or "
        "spell out payment details, stall with small clarifying questions, express worry.\n"
        "HARD RULES: never share any real personal/financial data, never actually pay, never "
        "reveal you are a bot, keep it to 1-3 short sentences. Your goal each turn is to nudge "
        "them to state a UPI/number/account. " + lang_line + "\n\n"
        f"Conversation so far:\n{transcript}\n\nYOUR NEXT REPLY:"
    )
    try:
        from google.genai import types
        r = llm.generate(contents=prompt,
                         config=types.GenerateContentConfig(temperature=0.9, max_output_tokens=800))
        return (r.text or "").strip() if r is not None else ""
    except Exception:
        return ""


def engage(conversation: List[Dict], persona: str = "confused_elder",
           lang: str = "en", auto_report: bool = True) -> Dict:
    """Advance the honeypot one turn.

    conversation: [{role: 'scammer'|'victim', text: str}, ...] (most recent last)
    Returns the persona's stalling reply + all intel harvested from scammer turns.
    """
    scam_text = " ".join(m.get("text", "") for m in conversation if m.get("role") == "scammer")
    harvested = _harvest(scam_text)

    analysis = scam_engine.analyze_text(scam_text or "hello")
    tactics = analysis.tactics_detected

    reply = _gemini_reply(conversation, persona, lang) or _template_reply(
        persona, harvested, len([m for m in conversation if m.get("role") == "victim"]))
    engine = "gemini" if llm.status().get("available") else "template"

    # File every leaked identifier into the crowd fraud DB.
    reported = []
    if auto_report:
        for kind, vals in (("phone", harvested["phones"]), ("upi", harvested["upis"]),
                           ("link", harvested["links"]), ("account", harvested["accounts"])):
            for v in vals:
                reports.submit(v, reason="Harvested via Kavach Counter-Intel honeypot", kind=kind)
                reported.append(v)

    n_intel = sum(len(harvested[k]) for k in ("phones", "upis", "links", "accounts"))
    return {
        "reply": reply,
        "persona": persona,
        "engine": engine,
        "harvested": harvested,
        "intel_count": n_intel,
        "tactics": tactics,
        "scam_risk": analysis.risk_score,
        "reported": reported,
        "note": ("Intel captured and filed to the fraud database — this scammer's identifiers "
                 "now raise a reputation flag for every other citizen." if reported else
                 "No payment identifiers leaked yet. Keep the scammer talking to extract UPI / number."),
    }


def personas() -> List[Dict]:
    return [{"key": k, "description": v} for k, v in PERSONAS.items()]
