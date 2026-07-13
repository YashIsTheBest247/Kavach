"""
Phishing URL / QR-link scanner (explainable).
Flags the tell-tale signs of a malicious link so a citizen can check before
tapping: IP hosts, punycode look-alikes, brand typosquats, credential-bait
paths, suspicious TLDs, shorteners, and more. Every signal is returned with a
weight so the verdict is auditable — same philosophy as the scam engine.
"""
from __future__ import annotations

import re
import urllib.parse
from typing import Dict, List

SUSPICIOUS_TLDS = {"zip", "mov", "xyz", "top", "tk", "ml", "ga", "cf", "gq", "click",
                   "buzz", "country", "kim", "work", "link", "rest", "click", "loan"}
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly",
              "rebrand.ly", "shorturl.at", "rb.gy", "t.ly"}
# brands frequently impersonated in India (bare tokens)
BRANDS = ["sbi", "hdfc", "icici", "axis", "kotak", "paytm", "phonepe", "gpay", "googlepay",
          "rbi", "npci", "upi", "irctc", "epfo", "incometax", "aadhaar", "uidai", "cowin",
          "amazon", "flipkart", "whatsapp", "netflix", "microsoft", "apple", "customs"]
BAIT = ["login", "verify", "verification", "kyc", "otp", "secure", "account", "update",
        "wallet", "refund", "reward", "prize", "gift", "unlock", "reactivate", "suspend",
        "confirm", "signin", "password", "bank", "paytm", "netbanking"]


def scan(url: str) -> Dict:
    if not url or not url.strip():
        return {"risk_score": 0, "risk_level": "LOW", "verdict": "NO URL", "factors": []}
    raw = url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw):
        raw = "http://" + raw
    p = urllib.parse.urlparse(raw)
    host = (p.hostname or "").lower()
    path_q = (p.path + "?" + p.query).lower()
    full = raw.lower()

    factors: List[Dict] = []
    risk = 0.0

    def add(cond, weight, label, detail):
        nonlocal risk
        if cond:
            risk += weight
            factors.append({"factor": label, "detail": detail, "impact": round(weight * 100), "direction": "raises"})

    add(p.scheme == "http", 0.12, "No HTTPS", "Connection is not encrypted (http://) — legitimate sites use https.")
    add(bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host)), 0.28, "IP-address host",
        "The link points to a raw IP address instead of a domain name.")
    add("@" in raw.split("//", 1)[-1].split("/", 1)[0], 0.30, "Embedded credentials / '@' trick",
        "An '@' in the host tricks you into trusting a fake domain before it.")
    add(host.startswith("xn--") or ".xn--" in host, 0.28, "Punycode look-alike",
        "Uses punycode (xn--) — a common way to mimic a real brand with foreign characters.")
    labels = host.split(".")
    add(len(labels) >= 5, 0.14, "Excessive subdomains", f"{len(labels)} dotted labels — brand names are often buried in fake subdomains.")
    tld = labels[-1] if labels else ""
    add(tld in SUSPICIOUS_TLDS, 0.18, "Suspicious TLD", f".{tld} is a low-cost TLD heavily used for phishing.")
    add(host in SHORTENERS or any(host == s for s in SHORTENERS), 0.14, "URL shortener",
        "A shortener hides the real destination — expand it before trusting.")
    add(len(raw) > 90, 0.08, "Very long URL", "Unusually long URLs are used to hide the true destination.")
    add(raw.count("-") >= 4, 0.08, "Many hyphens", "Excessive hyphens are typical of throwaway phishing domains.")

    # brand token present but not on an official-looking domain
    brand_hit = next((b for b in BRANDS if b in host or b in path_q), None)
    official = host.endswith(".gov.in") or host.endswith(".nic.in") or host.endswith(".rbi.org.in")
    add(brand_hit and not official, 0.22, "Brand impersonation",
        f"Mentions '{brand_hit}' but is not an official (.gov.in / brand) domain.")

    bait_hits = [b for b in BAIT if b in path_q or b in host]
    add(len(bait_hits) >= 1, min(0.2, 0.07 * len(bait_hits)), "Credential-bait keywords",
        "Contains: " + ", ".join(sorted(set(bait_hits))[:5]))
    add(p.scheme in ("data", "javascript"), 0.5, "Dangerous scheme", f"Uses a {p.scheme}: scheme — never open this.")

    risk = max(0.0, min(1.0, risk))
    score = int(round(risk * 100))
    if score >= 60:
        verdict, level = "LIKELY PHISHING — DO NOT OPEN", "HIGH"
    elif score >= 30:
        verdict, level = "SUSPICIOUS — VERIFY FIRST", "MEDIUM"
    else:
        verdict, level = "NO STRONG PHISHING SIGNS", "LOW"

    return {
        "url": url, "host": host, "risk_score": score, "risk_level": level, "verdict": verdict,
        "factors": factors,
        "recommended_actions": (
            ["Do NOT enter any login, OTP, card or UPI details.",
             "Type the official website address yourself instead of clicking.",
             "Report to 1930 / cybercrime.gov.in if received unsolicited."]
            if score >= 30 else
            ["No strong phishing indicators — still avoid entering credentials via links you didn't request."]),
    }
