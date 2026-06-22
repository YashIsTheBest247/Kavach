"""
Counterfeit Currency Screening (MVP)
------------------------------------
Honest MVP: real FICN detection needs UV/IR hardware + a trained CNN on a
labelled note dataset. Here we run an explainable image-forensics pass over an
uploaded note image — denomination heuristics, resolution/print-quality
indicators, colour-profile checks against expected note palettes, and a
security-feature checklist the operator confirms — and return a calibrated
risk score. Every contributing factor is reported so a teller can audit the
verdict. We never claim certainty from a phone photo.
"""
from __future__ import annotations

import io
from typing import Dict, List

# Expected dominant hue bands (approx) for current Indian notes — used as a weak prior.
DENOMINATION_PROFILE = {
    "500": {"hue": "stone grey", "aspect_ratio": 2.13, "rgb_hint": (140, 130, 120)},
    "200": {"hue": "bright yellow", "aspect_ratio": 2.07, "rgb_hint": (210, 180, 90)},
    "100": {"hue": "lavender", "aspect_ratio": 2.07, "rgb_hint": (150, 130, 160)},
    "2000": {"hue": "magenta", "aspect_ratio": 2.30, "rgb_hint": (190, 120, 160)},
}

SECURITY_FEATURES = [
    {"key": "security_thread", "label": "Windowed security thread reads 'भारत' / 'RBI' and colour-shifts green→blue"},
    {"key": "watermark", "label": "Mahatma Gandhi watermark + electrotype denomination visible against light"},
    {"key": "intaglio", "label": "Raised (intaglio) print felt on portrait, Ashoka pillar and identity mark"},
    {"key": "latent_image", "label": "Latent denomination numeral appears when held at 45°"},
    {"key": "microlettering", "label": "Microlettering 'RBI' + denomination legible under magnification"},
    {"key": "see_through", "label": "See-through register: floral design forms complete denomination"},
]


def _analyze_pixels(img_bytes: bytes) -> Dict:
    """Best-effort forensic read using Pillow. Degrades gracefully if unavailable."""
    out = {"available": False}
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        w, h = img.size
        out["available"] = True
        out["width"] = w
        out["height"] = h
        out["aspect_ratio"] = round(w / h, 3) if h else 0
        out["megapixels"] = round((w * h) / 1_000_000, 2)

        # Downsample for a fast average-colour + variance read.
        small = img.resize((64, 32))
        pixels = list(small.getdata())
        n = len(pixels)
        avg = tuple(round(sum(p[i] for p in pixels) / n) for i in range(3))
        out["avg_rgb"] = avg
        # Colour variance as a crude proxy for print richness / detail.
        var = sum((p[0] - avg[0]) ** 2 + (p[1] - avg[1]) ** 2 + (p[2] - avg[2]) ** 2 for p in pixels) / n
        out["colour_variance"] = round(var, 1)
        out["low_detail"] = var < 800  # flat/washed image => possibly a poor photocopy
    except Exception as e:  # pragma: no cover
        out["error"] = str(e)
    return out


def screen_note(img_bytes: bytes, denomination: str, confirmed_features: List[str]) -> Dict:
    forensics = _analyze_pixels(img_bytes)
    profile = DENOMINATION_PROFILE.get(str(denomination))

    risk = 0.0
    factors: List[Dict] = []

    # 1) Security-feature checklist — the strongest signal a human can confirm.
    total_feats = len(SECURITY_FEATURES)
    confirmed = [f for f in SECURITY_FEATURES if f["key"] in (confirmed_features or [])]
    missing = [f for f in SECURITY_FEATURES if f["key"] not in (confirmed_features or [])]
    miss_ratio = len(missing) / total_feats
    feat_risk = miss_ratio * 0.6
    risk += feat_risk
    factors.append({
        "factor": "Security features",
        "detail": f"{len(confirmed)}/{total_feats} genuine features confirmed",
        "impact": round(feat_risk * 100),
        "direction": "raises" if miss_ratio > 0.3 else "lowers",
    })

    # 2) Image quality forensics.
    if forensics.get("available"):
        if forensics.get("megapixels", 0) < 0.4:
            risk += 0.12
            factors.append({"factor": "Image resolution", "detail": "Very low resolution — capture sharper image for reliable screening", "impact": 12, "direction": "raises"})
        if forensics.get("low_detail"):
            risk += 0.15
            factors.append({"factor": "Print detail", "detail": "Low colour variance — flat/washed appearance typical of photocopies", "impact": 15, "direction": "raises"})
        else:
            factors.append({"factor": "Print detail", "detail": "Healthy colour variance — consistent with intaglio printing", "impact": 8, "direction": "lowers"})

        # 3) Aspect-ratio / colour prior vs denomination.
        if profile:
            ar = forensics.get("aspect_ratio", 0)
            if ar and abs(ar - profile["aspect_ratio"]) > 0.35:
                risk += 0.1
                factors.append({"factor": "Note geometry", "detail": f"Aspect ratio {ar} deviates from genuine ₹{denomination} note", "impact": 10, "direction": "raises"})
            r, g, b = forensics.get("avg_rgb", (0, 0, 0))
            hr, hg, hb = profile["rgb_hint"]
            colour_dist = ((r - hr) ** 2 + (g - hg) ** 2 + (b - hb) ** 2) ** 0.5
            if colour_dist > 90:
                risk += 0.08
                factors.append({"factor": "Colour profile", "detail": f"Dominant colour deviates from genuine ₹{denomination} ({profile['hue']}) palette", "impact": 8, "direction": "raises"})
    else:
        factors.append({"factor": "Forensics engine", "detail": "Pixel analysis unavailable — verdict based on feature checklist only", "impact": 0, "direction": "neutral"})

    risk = max(0.0, min(1.0, risk))
    score = int(round(risk * 100))
    if score >= 65:
        verdict, level = "LIKELY COUNTERFEIT", "HIGH"
    elif score >= 35:
        verdict, level = "SUSPECT — MANUAL INSPECTION REQUIRED", "MEDIUM"
    else:
        verdict, level = "LIKELY GENUINE", "LOW"

    return {
        "denomination": denomination,
        "counterfeit_risk_score": score,
        "risk_level": level,
        "verdict": verdict,
        "confidence": round(0.55 + 0.4 * (len(confirmed) / total_feats), 2),
        "factors": factors,
        "confirmed_features": [f["label"] for f in confirmed],
        "missing_features": [f["label"] for f in missing],
        "forensics": forensics,
        "disclaimer": "MVP screening aid. For legal seizure, confirm with UV/IR machine and forward to RBI/forensic lab.",
    }


def feature_catalogue() -> List[Dict]:
    return SECURITY_FEATURES
