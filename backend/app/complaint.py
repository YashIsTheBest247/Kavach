"""
One-tap NCRP / 1930 complaint filing.

Closes the loop from DETECTION -> ACTION. Turns any Kavach detection into a
complete, ready-to-submit cyber-crime complaint for the National Cyber Crime
Reporting Portal (cybercrime.gov.in) / helpline 1930:

  • auto-classified into the correct NCRP category & sub-category,
  • a first-person incident narrative (Gemini-written, template fallback),
  • extracted suspect entities (UPI / phone / account / links),
  • an evidence checklist + exact filing steps,
  • a printable, SHA-256 tamper-evident complaint PDF to attach.

This is the adoption story: a citizen goes from "is this a scam?" to a filed
complaint in one tap.
"""
from __future__ import annotations

import time
from typing import Dict, List, Optional

from app import scam_engine, advisory, llm
from app.honeypot import _harvest
from app.report_pdf import ORANGE, DARK, GRAY, _clean, _mc, _hash

PORTAL = "https://cybercrime.gov.in"
HELPLINE = "1930"


def _classify(text: str, tactics: List[str]) -> Dict:
    low = (text or "").lower()
    joined = " ".join(tactics).lower()
    if "digital arrest" in low or "arrest" in joined or "cbi" in low or "impersonat" in joined:
        return {"category": "Online Financial Fraud",
                "sub_category": "Digital Arrest / Impersonation of Law-Enforcement",
                "act": "IPC 66-D IT Act + 419/420 IPC (cheating by impersonation)"}
    if any(k in low for k in ("upi", "netbanking", "bank", "account", "otp", "card")):
        return {"category": "Online Financial Fraud",
                "sub_category": "UPI / Internet Banking / Card Fraud",
                "act": "Sec 66-C/66-D IT Act + 420 IPC"}
    if any(k in low for k in ("kyc", "link", "http", "phish", "verify")):
        return {"category": "Online Financial Fraud",
                "sub_category": "Phishing / Fraudulent Link",
                "act": "Sec 66-C/66-D IT Act"}
    if any(k in low for k in ("counterfeit", "fake note", "ficn", "currency")):
        return {"category": "Any Other Cyber Crime",
                "sub_category": "Counterfeit Currency / FICN",
                "act": "Sec 489A-489E IPC"}
    return {"category": "Any Other Cyber Crime",
            "sub_category": "Online Cheating / Fraud",
            "act": "Sec 66-D IT Act + 420 IPC"}


def _narrative(text: str, cls: Dict, entities: Dict, victim: Dict, amount: Optional[str]) -> str:
    name = victim.get("name") or "the complainant"
    when = victim.get("datetime") or "recently"
    tmpl = (
        f"I, {name}, wish to report a cyber-fraud attempt. On {when} I was contacted via "
        f"{victim.get('channel', 'phone/message')} by an unknown fraudster. "
        f"The communication showed clear signs of a {cls['sub_category'].lower()} scam. "
        + (f"The fraudster demanded/received approximately {amount}. " if amount else "")
        + (f"Suspect payment/contact identifiers observed: "
           f"{', '.join(entities.get('upis', []) + entities.get('phones', []) + entities.get('accounts', []) + entities.get('links', []))}. "
           if any(entities.get(k) for k in ('upis', 'phones', 'accounts', 'links')) else "")
        + "I did not authorise any transaction knowingly and request registration of a complaint, "
          "freezing of the suspect accounts, and investigation. The original message/transcript is attached."
    )
    if not llm.status().get("available"):
        return tmpl
    try:
        from google.genai import types
        prompt = (
            "Write a concise, factual first-person cyber-crime complaint narrative (120-160 words) "
            "for India's National Cyber Crime Reporting Portal, based on the details below. "
            "Neutral, formal tone. Do NOT invent facts not given. End by requesting registration, "
            "account freezing and investigation.\n\n"
            f"Complainant: {name}\nChannel: {victim.get('channel','')}\nWhen: {when}\n"
            f"Scam type: {cls['sub_category']}\nAmount: {amount or 'not specified'}\n"
            f"Suspect identifiers: {entities}\nOriginal message: {text[:600]}"
        )
        r = llm.generate(contents=prompt,
                         config=types.GenerateContentConfig(temperature=0.4, max_output_tokens=400))
        return (r.text or "").strip() or tmpl if r is not None else tmpl
    except Exception:
        return tmpl


def draft(incident: Dict) -> Dict:
    """Build a structured, ready-to-file NCRP complaint from an incident.

    incident = {text, channel?, name?, phone?, city?, amount_lost?, datetime?}
    """
    text = incident.get("text", "") or ""
    analysis = scam_engine.analyze_text(text or "reported fraud")
    entities = _harvest(text)
    cls = _classify(text, analysis.tactics_detected)
    victim = {"name": incident.get("name"), "phone": incident.get("phone"),
              "city": incident.get("city"), "channel": incident.get("channel"),
              "datetime": incident.get("datetime")}
    amount = incident.get("amount_lost")
    narrative = _narrative(text, cls, entities, victim, amount)

    subject = f"{cls['sub_category']} — request for registration & investigation"
    return {
        "reference": f"KAVACH-{int(time.time())}",
        "portal": PORTAL,
        "helpline": HELPLINE,
        "category": cls["category"],
        "sub_category": cls["sub_category"],
        "applicable_law": cls["act"],
        "subject": subject,
        "risk_level": analysis.risk_level,
        "risk_score": analysis.risk_score,
        "tactics": analysis.tactics_detected,
        "suspect_entities": entities,
        "narrative": narrative,
        "complainant": {k: v for k, v in victim.items() if v},
        "amount_involved": amount,
        "evidence_checklist": [
            "Screenshot / recording of the call, SMS or WhatsApp chat",
            "Transaction reference / UTR numbers and bank statement (if money was lost)",
            "The suspect's phone number, UPI ID or account number",
            "Any links, documents or 'notices' the fraudster sent",
            "This Kavach detection report (attach the PDF)",
        ],
        "filing_steps": [
            f"Call {HELPLINE} immediately if money was lost in the last 24 hours (golden hour for freezing).",
            f"Go to {PORTAL} → 'File a Complaint' → 'Financial Fraud' / 'Report Other Cyber Crime'.",
            f"Select category '{cls['category']}' and sub-category '{cls['sub_category']}'.",
            "Paste the narrative below into the incident description and upload the evidence + PDF.",
            "Note the acknowledgement number; follow up with your bank to freeze the beneficiary account.",
        ],
        "advisory": advisory.advisory_for(analysis.risk_level, incident.get("language", "en")),
    }


def draft_pdf(incident: Dict) -> bytes:
    from fpdf import FPDF
    d = draft(incident)
    now = int(time.time())
    digest = _hash({"complaint": d, "ts": now})

    pdf = FPDF()
    pdf.set_auto_page_break(True, margin=16)
    pdf.add_page()
    pdf.set_fill_color(*ORANGE); pdf.rect(0, 0, 210, 4, "F")
    pdf.set_font("Helvetica", "B", 17); pdf.set_text_color(*DARK)
    pdf.cell(0, 12, "CYBER-CRIME COMPLAINT  (NCRP-ready)", ln=1)
    pdf.set_font("Helvetica", "", 9); pdf.set_text_color(*GRAY)
    pdf.cell(0, 5, _clean(f"Ref {d['reference']}  |  Generated {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(now))} UTC  "
                          f"|  Portal {PORTAL}  |  Helpline {HELPLINE}"), ln=1)
    pdf.ln(3)

    def section(title):
        pdf.set_font("Helvetica", "B", 12); pdf.set_text_color(*ORANGE)
        pdf.cell(0, 8, _clean(title), ln=1)
        pdf.set_text_color(*DARK); pdf.set_font("Helvetica", "", 10)

    def kv(k, v):
        pdf.set_font("Helvetica", "B", 10); pdf.write(6, _clean(k) + ":  ")
        pdf.set_font("Helvetica", "", 10); pdf.write(6, _clean(v)); pdf.ln(7)

    section("1. Classification")
    kv("Category", d["category"])
    kv("Sub-category", d["sub_category"])
    kv("Applicable law", d["applicable_law"])
    kv("Assessed risk", f"{d['risk_score']}/100 ({d['risk_level']})")
    if d["tactics"]:
        kv("Tactics", ", ".join(d["tactics"][:6]))
    pdf.ln(1)

    if d["complainant"]:
        section("2. Complainant")
        for k, v in d["complainant"].items():
            kv(k.capitalize(), str(v))
        if d.get("amount_involved"):
            kv("Amount involved", str(d["amount_involved"]))
        pdf.ln(1)

    section("3. Incident narrative")
    pdf.set_font("Helvetica", "", 10)
    _mc(pdf, 5, d["narrative"])
    pdf.ln(1)

    ent = d["suspect_entities"]
    if any(ent.get(k) for k in ("upis", "phones", "accounts", "links")):
        section("4. Suspect identifiers")
        for label, key in (("UPI IDs", "upis"), ("Phone numbers", "phones"),
                           ("Accounts", "accounts"), ("Links", "links")):
            if ent.get(key):
                kv(label, ", ".join(ent[key]))
        pdf.ln(1)

    section("5. Evidence to attach")
    for i, e in enumerate(d["evidence_checklist"], 1):
        _mc(pdf, 5, f"  {i}. {e}")
    pdf.ln(1)

    section("6. How to file")
    for i, s in enumerate(d["filing_steps"], 1):
        _mc(pdf, 5, f"  {i}. {s}")
    pdf.ln(2)

    pdf.set_draw_color(*GRAY); pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(2)
    pdf.set_font("Courier", "", 8); pdf.set_text_color(*GRAY)
    _mc(pdf, 4, f"Integrity SHA-256: {digest}")
    _mc(pdf, 4, "Auto-generated by Kavach AI. Tamper-evident: any edit changes the hash above.")
    return bytes(pdf.output())
