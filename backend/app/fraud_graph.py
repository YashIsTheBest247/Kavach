"""
Fraud Network Graph Intelligence
--------------------------------
Builds an entity graph from victim reports, scammer infrastructure (phone
numbers / VoIP), device fingerprints, and mule bank accounts — then clusters
them into coordinated campaigns and produces an auditable intelligence package
per ring (the kind of artefact that can support a chargesheet).

The sample dataset models a realistic multi-jurisdiction digital-arrest ring.
Replace `_SEED` with a live feed (UPI logs, CDRs, NCRP complaints) in production.
"""
from __future__ import annotations

from collections import defaultdict, deque
from typing import Dict, List

# Node types: victim, scammer_phone, mule_account, device, voip_gateway, kingpin
_SEED_NODES = [
    # Ring A — "Fake CBI" compound (cross-border VoIP)
    {"id": "VOIP-A1", "type": "voip_gateway", "label": "VoIP +call-spoof", "ring": "A", "location": "Cross-border", "risk": 0.95},
    {"id": "PH-9821x001", "type": "scammer_phone", "label": "+91 982x xxx001", "ring": "A", "location": "Delhi NCR", "risk": 0.9},
    {"id": "PH-9821x002", "type": "scammer_phone", "label": "+91 982x xxx002", "ring": "A", "location": "Delhi NCR", "risk": 0.88},
    {"id": "DEV-A1", "type": "device", "label": "IMEI ...a91f", "ring": "A", "location": "Delhi NCR", "risk": 0.85},
    {"id": "MULE-A1", "type": "mule_account", "label": "A/c ...4471 (Pvt Bank)", "ring": "A", "location": "Mumbai", "risk": 0.82},
    {"id": "MULE-A2", "type": "mule_account", "label": "A/c ...9920 (Co-op)", "ring": "A", "location": "Surat", "risk": 0.8},
    {"id": "KING-A", "type": "kingpin", "label": "Hub wallet (USDT)", "ring": "A", "location": "Cross-border", "risk": 0.98},
    {"id": "VIC-A1", "type": "victim", "label": "Victim (Bengaluru)", "ring": "A", "location": "Bengaluru", "risk": 0.2, "loss": 4200000},
    {"id": "VIC-A2", "type": "victim", "label": "Victim (Pune)", "ring": "A", "location": "Pune", "risk": 0.2, "loss": 1850000},
    {"id": "VIC-A3", "type": "victim", "label": "Victim (Chennai)", "ring": "A", "location": "Chennai", "risk": 0.2, "loss": 920000},

    # Ring B — "Parcel/Customs" scam
    {"id": "PH-7700x110", "type": "scammer_phone", "label": "+91 770x xxx110", "ring": "B", "location": "Hyderabad", "risk": 0.84},
    {"id": "DEV-B1", "type": "device", "label": "IMEI ...c33d", "ring": "B", "location": "Hyderabad", "risk": 0.8},
    {"id": "MULE-B1", "type": "mule_account", "label": "A/c ...1182 (Pvt Bank)", "ring": "B", "location": "Hyderabad", "risk": 0.78},
    {"id": "KING-B", "type": "kingpin", "label": "Hub wallet (B)", "ring": "B", "location": "Cross-border", "risk": 0.93},
    {"id": "VIC-B1", "type": "victim", "label": "Victim (Kolkata)", "ring": "B", "location": "Kolkata", "risk": 0.2, "loss": 670000},
    {"id": "VIC-B2", "type": "victim", "label": "Victim (Delhi)", "ring": "B", "location": "Delhi", "risk": 0.2, "loss": 1340000},

    # Bridge node — shared mule links Ring A and Ring B (key intelligence finding)
    {"id": "MULE-SHARED", "type": "mule_account", "label": "A/c ...7788 (SHARED)", "ring": "A+B", "location": "Mumbai", "risk": 0.99},
]

_SEED_EDGES = [
    ("VOIP-A1", "PH-9821x001", "routes"), ("VOIP-A1", "PH-9821x002", "routes"),
    ("DEV-A1", "PH-9821x001", "operates"), ("DEV-A1", "PH-9821x002", "operates"),
    ("PH-9821x001", "VIC-A1", "called"), ("PH-9821x002", "VIC-A2", "called"),
    ("PH-9821x001", "VIC-A3", "called"),
    ("VIC-A1", "MULE-A1", "transferred"), ("VIC-A2", "MULE-A2", "transferred"),
    ("VIC-A3", "MULE-A1", "transferred"),
    ("MULE-A1", "KING-A", "layered"), ("MULE-A2", "KING-A", "layered"),
    ("MULE-A1", "MULE-SHARED", "layered"),

    ("DEV-B1", "PH-7700x110", "operates"),
    ("PH-7700x110", "VIC-B1", "called"), ("PH-7700x110", "VIC-B2", "called"),
    ("VIC-B1", "MULE-B1", "transferred"), ("VIC-B2", "MULE-B1", "transferred"),
    ("MULE-B1", "MULE-SHARED", "layered"),
    ("MULE-SHARED", "KING-B", "layered"), ("MULE-SHARED", "KING-A", "layered"),
]


def get_graph() -> Dict:
    nodes = [dict(n) for n in _SEED_NODES]
    edges = [{"source": s, "target": t, "relation": r} for s, t, r in _SEED_EDGES]
    return {"nodes": nodes, "edges": edges}


def _connected_components(nodes, edges):
    adj = defaultdict(set)
    for e in edges:
        adj[e["source"]].add(e["target"])
        adj[e["target"]].add(e["source"])
    seen, comps = set(), []
    for n in nodes:
        nid = n["id"]
        if nid in seen:
            continue
        q, comp = deque([nid]), []
        seen.add(nid)
        while q:
            cur = q.popleft()
            comp.append(cur)
            for nb in adj[cur]:
                if nb not in seen:
                    seen.add(nb)
                    q.append(nb)
        comps.append(comp)
    return comps


def get_ring_context(ring_key: str) -> Dict:
    """Return the infrastructure + victim impact for a given ring tag ('A','B')."""
    nodes = [n for n in _SEED_NODES if ring_key in n["ring"]]
    victims = [n for n in nodes if n["type"] == "victim"]
    return {
        "ring": ring_key,
        "scammer_numbers": [n["label"] for n in nodes if n["type"] == "scammer_phone"],
        "mule_accounts": [n["label"] for n in nodes if n["type"] == "mule_account"],
        "voip_gateways": [n["label"] for n in nodes if n["type"] == "voip_gateway"],
        "kingpins": [n["label"] for n in nodes if n["type"] == "kingpin"],
        "victim_count": len(victims),
        "reported_loss_inr": sum(v.get("loss", 0) for v in victims),
        "jurisdictions": sorted({v["location"] for v in victims}),
        "shared_infrastructure": any("SHARED" in n["id"] for n in nodes),
    }


def get_intelligence_packages() -> List[Dict]:
    """Cluster the graph into campaigns and emit an evidence package per ring."""
    g = get_graph()
    by_id = {n["id"]: n for n in g["nodes"]}
    comps = _connected_components(g["nodes"], g["edges"])

    packages = []
    for idx, comp in enumerate(comps):
        members = [by_id[i] for i in comp]
        victims = [m for m in members if m["type"] == "victim"]
        mules = [m for m in members if m["type"] == "mule_account"]
        phones = [m for m in members if m["type"] == "scammer_phone"]
        kingpins = [m for m in members if m["type"] == "kingpin"]
        total_loss = sum(v.get("loss", 0) for v in victims)
        jurisdictions = sorted({m["location"] for m in victims})

        packages.append({
            "campaign_id": f"RING-{chr(65 + idx)}",
            "node_count": len(members),
            "victim_count": len(victims),
            "mule_account_count": len(mules),
            "scammer_number_count": len(phones),
            "kingpin_count": len(kingpins),
            "total_reported_loss_inr": total_loss,
            "jurisdictions_spanned": jurisdictions,
            "shared_infrastructure": any(m["id"] == "MULE-SHARED" for m in members),
            "priority": "CRITICAL" if total_loss > 3000000 or any("SHARED" in m["id"] for m in members) else "HIGH",
            "key_findings": _findings(members, total_loss, jurisdictions),
        })
    # Merge note: shared mule means rings are one network — surface as top finding.
    packages.sort(key=lambda p: p["total_reported_loss_inr"], reverse=True)
    return packages


def _findings(members, total_loss, jurisdictions) -> List[str]:
    f = []
    if any("SHARED" in m["id"] for m in members):
        f.append("Shared mule account links multiple campaigns — treat as a SINGLE coordinated network, not isolated cases.")
    if any(m["type"] == "voip_gateway" for m in members):
        f.append("Calls routed via cross-border VoIP gateway with number spoofing — telecom + MLAT coordination required.")
    if len(jurisdictions) > 1:
        f.append(f"Victims span {len(jurisdictions)} jurisdictions ({', '.join(jurisdictions)}) — inter-state intelligence sharing needed.")
    f.append(f"Funds layered through mule accounts toward a crypto hub wallet — freeze mules within the golden hour.")
    return f
