
from __future__ import annotations

import time
from typing import Dict, List, Optional

from app import scam_engine, fraud_graph, geo_stats, advisory, llm

ESCALATION_GATE = 50   # only mobilise downstream agents at/above this risk


def _now_ms() -> float:
    return time.perf_counter() * 1000.0


def _classify_ring(text: str, tactics: List[str]) -> Optional[str]:
    """Correlate the message to a known ring by its modus operandi."""
    t = text.lower()
    if any(k in t for k in ["parcel", "customs", "fedex", "courier", "shipment"]):
        return "B"   # parcel / customs ring
    if any(k in t for k in ["cbi", "ed ", "enforcement", "digital arrest", "police", "arrest"]):
        return "A"   # fake-authority digital-arrest ring
    if "Authority Impersonation" in tactics or "'Digital Arrest' Confinement" in tactics:
        return "A"
    return None


def _legal_sections(tactics: List[str]) -> List[str]:
    base = ["IT Act 2000 — s.66D (cheating by personation using computer resource)",
            "IT Act 2000 — s.66C (identity theft)",
            "BNS 2023 — s.318 (cheating)  / IPC 420"]
    if any("Arrest" in x or "Impersonation" in x for x in tactics):
        base.append("BNS 2023 — s.204 (personating a public servant) / IPC 170")
    if any("Money" in x or "Transfer" in x for x in tactics):
        base.append("BNS 2023 — s.308 (extortion) / IPC 384")
    return base


def orchestrate(text: str, channel: str = "Unknown", language: str = "en",
                location: Optional[str] = None, phone: Optional[str] = None) -> Dict:
    steps: List[Dict] = []

    def step(agent, action, status, detail, output=None, t0=None):
        steps.append({
            "agent": agent, "action": action, "status": status, "detail": detail,
            "output": output, "latency_ms": round(_now_ms() - t0, 1) if t0 else 0.0,
        })

    # ---- Agent 1: Triage ----
    t0 = _now_ms()
    sa = scam_engine.analyze_text(text)
    step("Triage Agent", "Classify message risk & tactics",
         "done", f"Risk {sa.risk_score}/100 ({sa.risk_level}); {len(sa.tactics_detected)} tactics.",
         {"risk_score": sa.risk_score, "risk_level": sa.risk_level,
          "tactics": sa.tactics_detected}, t0)

    escalated = sa.risk_score >= ESCALATION_GATE

    # ---- Decision gate ----
    t0 = _now_ms()
    if not escalated:
        step("Orchestrator", "Evaluate escalation gate", "halted",
             f"Risk {sa.risk_score} below gate ({ESCALATION_GATE}). No mass-victimisation pattern — "
             f"downstream agents not mobilised (prevents false alarms).", None, t0)
        return {
            "escalated": False, "risk_score": sa.risk_score, "risk_level": sa.risk_level,
            "steps": steps,
            "advisory": advisory.advisory_for(sa.risk_level, language),
            "fused_threat_score": sa.risk_score,
        }
    step("Orchestrator", "Evaluate escalation gate", "escalate",
         f"Risk {sa.risk_score} ≥ gate ({ESCALATION_GATE}). Mobilising correlation, geo & response agents.",
         None, t0)

    # ---- Agent 2: Network Correlation ----
    t0 = _now_ms()
    ring = _classify_ring(text, sa.tactics_detected)
    ring_ctx = fraud_graph.get_ring_context(ring) if ring else None
    if ring_ctx:
        step("Network Correlation Agent", "Match modus operandi to known fraud rings", "done",
             f"Linked to RING-{ring}: {ring_ctx['victim_count']} prior victims, "
             f"₹{ring_ctx['reported_loss_inr'] // 100000}L reported loss, "
             f"{len(ring_ctx['mule_accounts'])} mule a/cs.", ring_ctx, t0)
    else:
        step("Network Correlation Agent", "Match modus operandi to known fraud rings", "no-match",
             "No existing ring matched — flagged as a potential new campaign for analyst review.", None, t0)

    # ---- Agent 3: Geo-Context ----
    t0 = _now_ms()
    hotspots = geo_stats.hotspots()
    geo_match = None
    if location:
        geo_match = next((h for h in hotspots if h["city"].lower() == location.lower()), None)
    if not geo_match:
        # fall back to the dominant hotspot for this scam type
        geo_match = max(hotspots, key=lambda h: h["complaints"])
    step("Geo-Context Agent", "Attach geospatial risk context", "done",
         f"{geo_match['city']}: {geo_match['complaints']:,} complaints, "
         f"₹{geo_match['loss_cr']} cr loss, top scam '{geo_match['top_scam']}'.", geo_match, t0)

    # ---- Agent 4: Response Orchestrator ----
    t0 = _now_ms()
    case_id = f"KAV-{abs(hash(text)) % 1000000:06d}"
    legal = _legal_sections(sa.tactics_detected)

    # Optional Gemini-written modus-operandi narrative; template fallback.
    narrative = None
    ai = llm.analyze(text) if True else {"available": False}
    if ai.get("available") and ai.get("reasoning"):
        narrative = ai["reasoning"]
    if not narrative:
        narrative = (f"Caller used {', '.join(sa.tactics_detected[:3]) or 'fraudulent tactics'} "
                     f"over {channel} to coerce the victim toward a financial transfer "
                     f"under the guise of an official process.")

    response_bundle = {
        "case_id": case_id,
        "citizen_alert": advisory.advisory_for(sa.risk_level, language),
        "telecom_action": {
            "recommendation": "Flag/throttle originating number, request CDR, push spam-warning to nearby subscribers.",
            "number": phone or "(caller ID spoofed — request CDR via telecom)",
        },
        "mha_ncrp_report": {
            "case_id": case_id,
            "category": (ai.get("scam_type") if ai.get("available") else None) or "Digital Arrest / Impersonation Fraud",
            "channel": channel,
            "modus_operandi": narrative,
            "tactics": sa.tactics_detected,
            "linked_ring": f"RING-{ring}" if ring else "New campaign (unlinked)",
            "suggested_legal_sections": legal,
            "priority_actions": [
                "Freeze linked mule accounts within the golden hour (NPCI/bank coordination).",
                "Issue lookout on linked scammer numbers / VoIP gateway.",
                "Escalate to state cyber cell for the affected jurisdiction.",
            ],
        },
    }
    step("Response Orchestrator Agent", "Draft cross-channel response & incident report", "done",
         f"Case {case_id} drafted: citizen advisory, telecom action, MHA-NCRP preliminary report "
         f"({'AI-written' if narrative and ai.get('available') else 'templated'} modus operandi).",
         response_bundle, t0)

    # ---- Fused threat score ----
    ring_boost = 15 if ring_ctx and ring_ctx.get("shared_infrastructure") else (8 if ring_ctx else 0)
    geo_boost = 6 if geo_match and geo_match["complaints"] > 12000 else 3
    fused = min(100, sa.risk_score + ring_boost + geo_boost)

    return {
        "escalated": True,
        "risk_score": sa.risk_score,
        "risk_level": sa.risk_level,
        "fused_threat_score": fused,
        "fused_threat_level": scam_engine._level_from_score(fused),
        "matched_ring": f"RING-{ring}" if ring else None,
        "ai_used": bool(ai.get("available")),
        "steps": steps,
        "response": response_bundle,
        "tactics": sa.tactics_detected,
        "highlighted": sa.highlighted,
    }
