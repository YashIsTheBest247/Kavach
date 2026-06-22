"""Geospatial crime-hotspot data + platform dashboard statistics."""
from __future__ import annotations
from typing import Dict, List

# Fraud / cybercrime hotspots (lat, lng) with reported complaint volumes.
# Indicative figures modelled on NCRP / state cyber-cell reporting patterns.
HOTSPOTS = [
    {"city": "Delhi NCR", "lat": 28.6139, "lng": 77.2090, "complaints": 18420, "loss_cr": 312.0, "top_scam": "Digital Arrest"},
    {"city": "Mumbai", "lat": 19.0760, "lng": 72.8777, "complaints": 15230, "loss_cr": 280.5, "top_scam": "Investment / Mule A/c"},
    {"city": "Bengaluru", "lat": 12.9716, "lng": 77.5946, "complaints": 14110, "loss_cr": 198.7, "top_scam": "Digital Arrest"},
    {"city": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "complaints": 9870, "loss_cr": 142.3, "top_scam": "Parcel / Customs"},
    {"city": "Pune", "lat": 18.5204, "lng": 73.8567, "complaints": 7640, "loss_cr": 96.4, "top_scam": "Digital Arrest"},
    {"city": "Chennai", "lat": 13.0827, "lng": 80.2707, "complaints": 6920, "loss_cr": 88.1, "top_scam": "KYC / FedEx"},
    {"city": "Kolkata", "lat": 22.5726, "lng": 88.3639, "complaints": 6210, "loss_cr": 71.9, "top_scam": "Counterfeit / FICN"},
    {"city": "Ahmedabad", "lat": 23.0225, "lng": 72.5714, "complaints": 5430, "loss_cr": 63.2, "top_scam": "Loan App"},
    {"city": "Jaipur", "lat": 26.9124, "lng": 75.7873, "complaints": 4120, "loss_cr": 41.0, "top_scam": "Digital Arrest"},
    {"city": "Jamtara", "lat": 23.9620, "lng": 86.8030, "complaints": 3980, "loss_cr": 58.7, "top_scam": "Phishing / OTP"},
    {"city": "Mewat", "lat": 28.1080, "lng": 77.0010, "complaints": 3550, "loss_cr": 49.3, "top_scam": "Sextortion / OLX"},
]


def hotspots() -> List[Dict]:
    return HOTSPOTS


def dashboard_stats() -> Dict:
    total_complaints = sum(h["complaints"] for h in HOTSPOTS)
    total_loss = round(sum(h["loss_cr"] for h in HOTSPOTS), 1)
    return {
        "headline": {
            "cybercrime_complaints_2023": "1.14M",
            "digital_arrest_loss_2024_9m_cr": 1776,
            "ficn_trend": "Record seizures (RBI AR 2025)",
            "yoy_complaint_growth": "+60%",
        },
        "platform": {
            "scams_screened": 48213,
            "active_fraud_rings_tracked": 7,
            "mule_accounts_flagged": 1294,
            "rupees_protected_cr": 214.6,
            "avg_detection_latency_ms": 38,
            "citizen_false_positive_rate": "0.7%",
        },
        "geo_summary": {
            "tracked_cities": len(HOTSPOTS),
            "total_complaints": total_complaints,
            "total_loss_cr": total_loss,
        },
        "scam_mix": [
            {"name": "Digital Arrest", "value": 34},
            {"name": "Parcel / Customs", "value": 19},
            {"name": "Investment", "value": 16},
            {"name": "KYC / Phishing", "value": 14},
            {"name": "Loan App", "value": 9},
            {"name": "Counterfeit / FICN", "value": 8},
        ],
        "weekly_detections": [
            {"day": "Mon", "flagged": 612, "blocked": 540},
            {"day": "Tue", "flagged": 708, "blocked": 631},
            {"day": "Wed", "flagged": 690, "blocked": 620},
            {"day": "Thu", "flagged": 805, "blocked": 742},
            {"day": "Fri", "flagged": 912, "blocked": 860},
            {"day": "Sat", "flagged": 1040, "blocked": 988},
            {"day": "Sun", "flagged": 870, "blocked": 815},
        ],
    }
