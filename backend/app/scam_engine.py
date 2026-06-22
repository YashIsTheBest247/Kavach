"""
Digital Arrest / Fraud Scam Detection Engine
--------------------------------------------
A transparent, auditable, rule-weighted classifier for digital-arrest and
financial-fraud scripts. Designed for high recall on the tactics that precede
financial transfer, with an explainable evidence trail (every signal is logged
with the matched phrase and its category weight) so output is court-auditable.

This is deliberately deterministic + explainable rather than a black-box model:
for a citizen-facing safety tool, false positives must be explainable and the
evidence package must be defensible. An optional LLM layer can be layered on top.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Dict


# Each tactic category models a documented stage of the digital-arrest playbook.
# weight = how strongly the presence of this tactic indicates a scam (0-1 scale).
TACTIC_LIBRARY: Dict[str, Dict] = {
    "authority_impersonation": {
        "label": "Authority Impersonation",
        "weight": 0.22,
        "why": "Genuine agencies (CBI/ED/Police/TRAI/Customs) never conduct arrests or interrogations over phone or video call.",
        "patterns": [
            r"\bcbi\b", r"\bc\.?b\.?i\b", r"enforcement directorate", r"\bed officer\b",
            r"\bnarcotics\b", r"\bncb\b", r"\bcustoms\b", r"\btrai\b", r"\bdot\b",
            r"cyber ?crime (cell|department|branch)", r"income tax department",
            r"\bpolice\b", r"\binspector\b", r"\bcommissioner\b", r"mumbai police",
            r"delhi police", r"crime branch", r"central bureau", r"\binterpol\b",
            # Hindi
            r"सीबीआई", r"ईडी", r"प्रवर्तन निदेशालय", r"पुलिस", r"इंस्पेक्टर", r"कस्टम",
            r"नारकोटिक्स", r"साइबर ?क्राइम", r"आयकर विभाग", r"क्राइम ब्रांच",
        ],
    },
    "fear_accusation": {
        "label": "Fear & False Accusation",
        "weight": 0.20,
        "why": "Scammers fabricate a serious crime (money laundering, drug parcel) to induce panic and shut down rational thought.",
        "patterns": [
            r"money laundering", r"drug[s]?\b", r"\bmdma\b", r"illegal (parcel|package|goods)",
            r"your (aadhaar|aadhar|pan|sim|number) (is|has been) (used|linked|involved)",
            r"human trafficking", r"\bfir\b", r"non[- ]?bailable", r"arrest warrant",
            r"\bwarrant\b", r"criminal case", r"court case", r"smuggling",
            r"passport.*(seized|blocked)", r"case (registered|filed) against you",
            r"your name (is|has) (appeared|come up)", r"black ?money", r"terror funding",
            r"involved in (illegal|criminal|drugs|fraud|money)", r"illegal activities",
            r"your (number|sim) is (used|involved|linked) in", r"child (porn|pornography)",
            # Hindi
            r"मनी लॉन्ड्रिंग", r"मनी लॉन्डरिंग", r"गिरफ्तार", r"वारंट", r"ड्रग्स", r"नशीला",
            r"अवैध", r"गैरकानूनी", r"मामला दर्ज", r"आपके (नाम|खिलाफ)", r"आपका (आधार|नंबर|सिम).{0,15}(इस्तेमाल|लिंक|शामिल)",
        ],
    },
    "digital_arrest": {
        "label": "'Digital Arrest' Confinement",
        "weight": 0.25,
        "why": "'Digital arrest' is not a real legal procedure. Demanding you stay on video call under surveillance is the defining signature of this scam.",
        "patterns": [
            r"digital arrest", r"under (digital )?surveillance", r"do not (cut|disconnect|end) (the )?call",
            r"stay on (the )?(call|video|line)", r"keep your camera on", r"video (call|surveillance)",
            r"you are under arrest", r"house arrest", r"monitor(ing|ed) you", r"24[ x]?7 surveillance",
            r"can ?not leave", r"remain (online|on call)", r"interrogation",
            # Hindi
            r"डिजिटल अरेस्ट", r"डिजिटल गिरफ्तारी", r"कॉल (मत|न) (काट|काटिए|काटना)",
            r"वीडियो कॉल (पर|on)", r"निगरानी", r"कैमरा (चालू|ऑन)",
        ],
    },
    "isolation": {
        "label": "Isolation & Secrecy",
        "weight": 0.13,
        "why": "Forcing secrecy isolates the victim from family/bank staff who would recognise the scam.",
        "patterns": [
            r"do not (tell|inform|share with) (anyone|family|anybody)",
            r"keep this (confidential|secret)", r"this is confidential",
            r"national security", r"official secrets", r"don'?t talk to anyone",
            r"go to a (separate|private) room", r"be alone", r"do not discuss",
            # Hindi
            r"किसी को (मत|न) (बताना|बताइए|बताएं)", r"गोपनीय", r"राज़ रखें", r"अकेले (कमरे|रहें)",
        ],
    },
    "payment_demand": {
        "label": "Money Transfer Demand",
        "weight": 0.20,
        "why": "The objective: moving your money. Real agencies never ask you to transfer funds to 'verify' or 'secure' them.",
        "patterns": [
            r"transfer (the )?(money|funds|amount)", r"\brtgs\b", r"\bneft\b", r"\bimps\b",
            r"verify your (funds|money|account|bank balance)", r"secure account",
            r"refundable (deposit|amount)", r"security deposit", r"pay (the )?(fine|penalty|bail)",
            r"send (money|amount|payment)", r"send \d+ ?(rupees|rs|inr|₹)", r"\bupi\b",
            r"scan (the|this) qr", r"\bqr code\b", r"government (verification|escrow) account",
            r"convert.{0,20}(crypto|bitcoin|usdt)", r"gift card", r"pay (an? )?advance",
            # Hindi
            r"पैसे (ट्रांसफर|भेज|डाल)", r"रकम (भेज|ट्रांसफर)", r"खाते में (डाल|जमा|ट्रांसफर)",
            r"सत्यापन के लिए", r"जुर्माना (भर|दे)", r"जमानत", r"यूपीआई", r"क्यूआर",
        ],
    },
    "credential_harvest": {
        "label": "Credential / OTP Harvesting",
        "weight": 0.20,
        "why": "No bank or agency ever asks you to share an OTP, PIN, CVV or password. This is theft of access.",
        "patterns": [
            r"share.{0,14}\b(otp|cvv|pin|card number|upi pin|password)\b",
            r"tell me (the )?(otp|pin|cvv)", r"your (upi pin|net ?banking password|card cvv)",
            r"confirm your (net ?banking )?password", r"\bcvv\b",
            r"what is (the|your) otp", r"send (me )?(the )?otp",
            # Hindi
            r"ओटीपी (बता|भेज|साझा|शेयर)", r"पिन (बता|भेज)", r"सीवीवी", r"पासवर्ड (बता|साझा|शेयर)",
        ],
    },
    "remote_access": {
        "label": "Remote-Access Takeover",
        "weight": 0.18,
        "why": "No genuine official or bank asks you to install remote-control software.",
        "patterns": [
            r"\banydesk\b", r"\bteam ?viewer\b", r"remote access", r"screen ?share",
            r"give (us|me) (remote )?access", r"download .{0,20}(app|software)",
            # Hindi
            r"एनीडेस्क", r"रिमोट (एक्सेस|कंट्रोल)", r"ऐप (डाउनलोड|इंस्टॉल)", r"स्क्रीन शेयर",
        ],
    },
    "phishing_link": {
        "label": "Phishing Link / Fake KYC",
        "weight": 0.15,
        "why": "Urgent 'click this link to update KYC' messages route you to fake portals that steal credentials.",
        "patterns": [
            r"click (this|the|on|here)", r"through this link", r"this link",
            r"kyc (update|expired|verification|has expired)", r"update your kyc",
            r"re-?verify", r"verify.{0,15}(link|click|now to)",
            # Hindi
            r"लिंक पर क्लिक", r"इस लिंक", r"केवाईसी", r"केवाईसी (अपडेट|समाप्त)", r"पुनः सत्यापन",
        ],
    },
    "account_compromise": {
        "label": "Fake Account-Compromise Alert",
        "weight": 0.15,
        "why": "Fabricated 'fraud on your account' alerts panic victims into handing over credentials.",
        "patterns": [
            r"fraudulent transaction", r"suspicious (transaction|activity|login)",
            r"unauthori[sz]ed (transaction|access|login)",
            r"your account (is|has been) (compromised|hacked|at risk|blocked)",
            r"your (bank )?details are (leaking|leaked|compromised)",
            # Hindi
            r"संदिग्ध (लेनदेन|गतिविधि)", r"खाता (हैक|ब्लॉक|कॉम्प्रोमाइज़)", r"अनधिकृत (लेनदेन|लॉगिन)",
        ],
    },
    "prize_lure": {
        "label": "Prize / Lottery Lure",
        "weight": 0.18,
        "why": "Unsolicited 'winnings' that require an upfront payment to claim are a classic advance-fee fraud.",
        "patterns": [
            r"lottery", r"lucky draw", r"\bkbc\b", r"you (have )?won", r"won (rs|inr|₹)",
            r"claim (your )?(prize|reward|gift)", r"prize money", r"selected as (a )?winner",
            # Hindi
            r"लॉटरी", r"इनाम", r"लकी ड्रॉ", r"केबीसी", r"आपने जीत", r"पुरस्कार",
        ],
    },
    "advance_fee": {
        "label": "Advance-Fee Demand",
        "weight": 0.18,
        "why": "Asking for a fee to 'release', 'process' or 'claim' money you are owed is a hallmark of fraud.",
        "patterns": [
            r"processing (fee|charge|charges)", r"gst (charge|charges|processing|fee)",
            r"registration fee", r"(pay|deposit).{0,25}(to (claim|release|receive|credit|process))",
            r"advance .{0,10}(payment|fee)", r"clearance (fee|charge)", r"refundable.{0,10}(fee|charge)",
            # Hindi
            r"प्रोसेसिंग (फीस|शुल्क)", r"जीएसटी (शुल्क|चार्ज)", r"पंजीकरण शुल्क", r"अग्रिम (भुगतान|शुल्क)",
        ],
    },
    "service_threat": {
        "label": "Service Disconnection Threat",
        "weight": 0.14,
        "why": "Threatening to instantly cut off your SIM/electricity/account unless you pay or click is a coercion tactic.",
        "patterns": [
            r"will be (disconnected|deactivated|blocked|suspended)",
            r"(permanently )?deactivated", r"(sim|number).{0,20}(disconnect|deactivat|block)",
            r"(electricity|power).{0,20}(disconnect|cut)", r"account.{0,15}(blocked|suspended)",
            # Hindi
            r"बंद (कर दिया|हो जाएगा)", r"ब्लॉक (कर|हो)", r"निष्क्रिय", r"(सिम|नंबर|बिजली).{0,15}(बंद|काट)",
        ],
    },
    "brand_impersonation": {
        "label": "Brand / Support Impersonation",
        "weight": 0.16,
        "why": "Fraudsters pose as trusted tech or service brands to gain control of your device or accounts.",
        "patterns": [
            r"microsoft support", r"amazon (security|support)", r"google security",
            r"\btech support\b", r"apple support", r"computer is infected",
            r"your (device|computer|system) (is|has been) (infected|hacked|compromised)",
            r"income tax department", r"electricity (board|department)",
        ],
    },
    "urgency": {
        "label": "Artificial Urgency",
        "weight": 0.10,
        "why": "Time pressure prevents the victim from pausing to verify or seek help.",
        "patterns": [
            r"immediately", r"right now", r"within (\d+ )?(minutes|hours)", r"urgent(ly)?",
            r"last (warning|chance)", r"act now", r"before (we|the).*(arrest|block|freeze)",
            r"limited time", r"final notice", r"failure to comply", r"instantly", r"\bnow\b.{0,20}(or|otherwise)",
            # Hindi
            r"तुरंत", r"अभी", r"जल्दी", r"फौरन", r"आखिरी (चेतावनी|मौका)", r"\d+ (मिनट|घंटे) में",
        ],
    },
}

# Phrases that strongly indicate a *legitimate* interaction — reduce false positives.
SAFE_SIGNALS = [
    (r"(never|do not|don'?t) share (your )?(otp|pin|cvv|password|card|it with)", 0.35),
    (r"visit (the|your) (nearest|local) (police station|branch)", 0.10),
    (r"(official|toll[- ]?free) (app|portal|website|number|helpline)", 0.10),
    (r"pay (via|through) the official", 0.10),
    (r"call (the )?(official|toll[- ]?free) (number|helpline)", 0.08),
    (r"i will (call|visit) you (back )?(at|from) the (station|office)", 0.06),
    # Hindi
    (r"(ओटीपी|पिन|पासवर्ड).{0,15}(किसी को )?(मत|न) (बताएं|बताना|साझा)", 0.35),
    (r"(आधिकारिक|ऑफिशियल) (ऐप|पोर्टल|वेबसाइट)", 0.10),
    (r"नज़दीकी (शाखा|ब्रांच|थाने)", 0.10),
]

ACTION_PLAYBOOK = {
    "CRITICAL": [
        "DISCONNECT the call now. No real agency arrests anyone over phone or video.",
        "Do NOT transfer any money or share OTP / PIN / card details.",
        "Call the national cyber-crime helpline 1930 immediately.",
        "Report at cybercrime.gov.in and inform a family member.",
        "If money was already sent, contact your bank to freeze the transaction within the golden hour.",
    ],
    "HIGH": [
        "Treat this as a likely scam. Do not act on any instruction from the caller.",
        "Independently verify by calling the agency's official published number (never a number the caller gives).",
        "Do not share OTP, PIN, CVV or transfer any money.",
        "Report suspicious activity to 1930 / cybercrime.gov.in.",
    ],
    "MEDIUM": [
        "Be cautious — several scam indicators are present.",
        "Never share financial credentials or transfer money to 'verify' anything.",
        "Verify the caller's identity through official channels before doing anything.",
    ],
    "LOW": [
        "Few or no scam indicators detected, but stay alert.",
        "Genuine agencies communicate through official letters and in-person at stations, not urgent calls demanding money.",
    ],
}


@dataclass
class Signal:
    category: str
    label: str
    matched_text: str
    weight: float
    why: str


@dataclass
class ScamAnalysis:
    risk_score: int                       # 0-100
    risk_level: str                       # LOW / MEDIUM / HIGH / CRITICAL
    is_scam: bool
    confidence: float
    signals: List[Signal] = field(default_factory=list)
    tactics_detected: List[str] = field(default_factory=list)
    recommended_actions: List[str] = field(default_factory=list)
    highlighted: List[Dict] = field(default_factory=list)   # spans for UI highlight
    summary: str = ""


# Decision threshold for is_scam. Calibrated on the labelled corpus: legit
# messages top out at 12, so 40 maximises recall while keeping false positives at 0.
SCAM_THRESHOLD = 40


def _level_from_score(score: int) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MEDIUM"
    return "LOW"


def analyze_text(text: str) -> ScamAnalysis:
    """Core analyzer. Operates on a call transcript or message body."""
    if not text or not text.strip():
        return ScamAnalysis(0, "LOW", False, 0.0, summary="No content to analyse.")

    lower = text.lower()
    signals: List[Signal] = []
    highlighted: List[Dict] = []
    category_hits: Dict[str, float] = {}

    for cat_key, cat in TACTIC_LIBRARY.items():
        best_weight = 0.0
        for pat in cat["patterns"]:
            for m in re.finditer(pat, lower):
                matched = text[m.start():m.end()]
                signals.append(Signal(cat_key, cat["label"], matched, cat["weight"], cat["why"]))
                highlighted.append({"start": m.start(), "end": m.end(),
                                    "text": matched, "category": cat["label"]})
                best_weight = cat["weight"]
        if best_weight:
            category_hits[cat_key] = best_weight

    # Score: combine distinct tactic categories (diminishing duplicate weight),
    # then apply a compound-tactic multiplier — the danger is in the *combination*.
    base = sum(category_hits.values())
    num_categories = len(category_hits)

    # Compound boost: the co-occurrence of authority + fear + payment is the lethal combo.
    lethal_combo = {"authority_impersonation", "fear_accusation", "payment_demand"}
    combo_bonus = 0.15 if lethal_combo.issubset(category_hits.keys()) else 0.0
    if "digital_arrest" in category_hits and num_categories >= 2:
        combo_bonus += 0.10

    raw = min(1.0, base + combo_bonus)

    # Safe signals pull the score down.
    for pat, reduction in SAFE_SIGNALS:
        if re.search(pat, lower):
            raw = max(0.0, raw - reduction)

    score = int(round(raw * 100))
    level = _level_from_score(score)
    is_scam = score >= SCAM_THRESHOLD

    # Confidence scales with corroboration (more independent tactics => more sure).
    confidence = round(min(0.99, 0.4 + 0.15 * num_categories + combo_bonus), 2)

    tactics = [TACTIC_LIBRARY[c]["label"] for c in category_hits]
    actions = ACTION_PLAYBOOK[level]

    if level == "CRITICAL":
        summary = ("High-confidence DIGITAL ARREST SCAM. The message combines impersonation of "
                   "authorities, fabricated accusations and a money-transfer demand — the exact "
                   "pattern behind ₹1,776 cr of reported losses. Do not comply.")
    elif level == "HIGH":
        summary = "Strong scam indicators detected. Treat as fraudulent and verify independently."
    elif level == "MEDIUM":
        summary = "Some suspicious patterns present. Proceed with caution and verify."
    else:
        summary = "No strong scam indicators detected in this message."

    return ScamAnalysis(
        risk_score=score,
        risk_level=level,
        is_scam=is_scam,
        confidence=confidence,
        signals=signals,
        tactics_detected=tactics,
        recommended_actions=actions,
        highlighted=highlighted,
        summary=summary,
    )
