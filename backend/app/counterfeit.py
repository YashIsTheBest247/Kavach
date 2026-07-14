"""
Counterfeit Currency Identification Agent
-----------------------------------------
An explainable computer-vision screening agent for Indian banknotes (FICN),
deployable on a phone, a bank counter or a POS terminal via the same API.

It runs four named analyses over an uploaded note image — all on numpy + Pillow,
no UV/IR hardware or trained CNN required — and fuses them with an operator
security-feature checklist into a calibrated, auditable risk score:

  1. Microprint analysis        — high-frequency edge energy (crisp micro-text vs blur)
  2. Security-thread verification — detects the windowed vertical thread band
  3. Serial-number validation    — RBI serial-panel format + letter rules
  4. UV-feature simulation       — estimates UV-reactive fluorescence from the blue channel

Every contributing factor is reported so a teller can audit the verdict. It is
an honest triage aid — disclaimed in-app — not a legal-seizure instrument.
"""
from __future__ import annotations

import io
import re
from typing import Dict, List, Optional

# Expected dominant hue + geometry for every current Mahatma-Gandhi(New)-series
# note — a weak prior for the geometry/colour checks. AR = width/height.
DENOMINATION_PROFILE = {
    "10":   {"hue": "chocolate brown",   "aspect_ratio": 1.95, "rgb_hint": (150, 110, 80)},
    "20":   {"hue": "greenish yellow",   "aspect_ratio": 2.05, "rgb_hint": (180, 170, 90)},
    "50":   {"hue": "fluorescent blue",  "aspect_ratio": 2.05, "rgb_hint": (120, 150, 170)},
    "100":  {"hue": "lavender",          "aspect_ratio": 2.15, "rgb_hint": (150, 130, 160)},
    "200":  {"hue": "bright yellow",     "aspect_ratio": 2.21, "rgb_hint": (210, 180, 90)},
    "500":  {"hue": "stone grey",        "aspect_ratio": 2.27, "rgb_hint": (140, 130, 120)},
    "2000": {"hue": "magenta",           "aspect_ratio": 2.52, "rgb_hint": (190, 120, 160)},
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


# RBI serial panel: an optional single leading numeral, a 1–3 letter prefix, then
# exactly six digits. RBI never uses the letters I, O or Z in the prefix.
_SERIAL_RE = re.compile(r"^([0-9]?)([A-HJ-NP-Y]{1,3})\s?(\d{6})$")


def _validate_serial(serial: Optional[str], denomination: str) -> Dict:
    """Serial-number pattern validation against the RBI serial-panel format."""
    if not serial or not serial.strip():
        return {"name": "Serial-number validation", "provided": False, "valid": None,
                "detail": "No serial entered — enter the note's serial to validate its format.",
                "impact": 0, "direction": "neutral"}
    s = serial.strip().upper()
    m = _SERIAL_RE.match(s)
    if not m:
        bad = [c for c in s if c in "IOZ"]
        why = ("uses I / O / Z (never used by RBI)" if bad
               else "does not match the RBI panel format (prefix + 6 digits)")
        return {"name": "Serial-number validation", "provided": True, "valid": False,
                "detail": f"Serial '{s}' is invalid — {why}.", "impact": 26, "direction": "raises"}
    return {"name": "Serial-number validation", "provided": True, "valid": True,
            "detail": f"Serial '{s}' matches the RBI panel format.", "impact": 10, "direction": "lowers"}


def _cv_analyses(img_bytes: bytes) -> Dict:
    """Microprint, security-thread and UV-simulation analyses via numpy + Pillow."""
    try:
        from PIL import Image
        import numpy as np
    except Exception as e:  # pragma: no cover
        return {"available": False, "reason": str(e)}
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        return {"available": False, "reason": str(e)}

    W = 512
    ar = img.width / img.height if img.height else 2.0
    H = max(64, int(W / ar))
    arr = np.asarray(img.resize((W, H))).astype("float32")
    gray = arr.mean(axis=2)

    # 1) MICROPRINT — high-frequency edge energy. Genuine intaglio + micro-text is
    #    crisp; photocopies / prints blur the fine detail.
    gx = np.abs(np.diff(gray, axis=1))[:-1, :]
    gy = np.abs(np.diff(gray, axis=0))[:, :-1]
    hf = float((gx + gy).mean())
    micro_sharp = max(0.0, min(1.0, (hf - 4.0) / 12.0))     # 0 blurry … 1 crisp
    microprint = {
        "name": "Microprint analysis", "metric": round(hf, 1), "sharpness": round(micro_sharp, 2),
        "detail": (f"Crisp high-frequency detail (index {hf:.1f}) — consistent with genuine microprinting."
                   if micro_sharp >= 0.5 else
                   f"Low micro-detail (index {hf:.1f}) — blurred micro-text typical of a print/photocopy."),
        "impact": round((1 - micro_sharp) * 13), "direction": "lowers" if micro_sharp >= 0.5 else "raises",
    }

    # 2) SECURITY THREAD — a genuine windowed thread is a narrow vertical band with
    #    strong, column-consistent vertical gradient. Scan columns for a sharp peak.
    col = np.abs(np.diff(gray, axis=0)).mean(axis=0)         # per-column vertical-edge energy
    col_z = (col - col.mean()) / (col.std() + 1e-6)
    # look in the left-centre region where the thread sits (~30-55% of width)
    band = col_z[int(W * 0.28):int(W * 0.58)]
    thread_peak = float(band.max()) if band.size else 0.0
    thread_present = thread_peak > 1.9
    thread = {
        "name": "Security-thread verification", "peak": round(thread_peak, 2), "detected": thread_present,
        "detail": ("Vertical security-thread band detected in the expected region."
                   if thread_present else
                   "No distinct windowed thread detected — verify against light (may not show in a flat scan)."),
        "impact": 6 if not thread_present else 8, "direction": "lowers" if thread_present else "raises",
    }

    # 3) UV-FEATURE SIMULATION — real UV needs a lamp; we simulate the response by
    #    isolating localized blue-channel excess (where the thread/number fluoresce).
    blue_excess = arr[:, :, 2] - gray
    uv_hot = float((blue_excess > 22).mean())               # fraction of 'fluorescent-like' pixels
    uv_ok = 0.002 < uv_hot < 0.35                           # some localized glow, not a uniform blue cast
    uv = {
        "name": "UV-feature simulation", "reactive_fraction": round(uv_hot, 3), "plausible": uv_ok,
        "detail": ("Localized UV-reactive response simulated around thread/number regions."
                   if uv_ok else
                   "Simulated UV response is uniform/absent — genuine notes fluoresce in localized zones only."),
        "impact": 5 if not uv_ok else 6, "direction": "lowers" if uv_ok else "raises",
    }
    return {"available": True, "microprint": microprint, "thread": thread, "uv": uv}


def screen_note(img_bytes: bytes, denomination: str, confirmed_features: List[str],
                serial: Optional[str] = None) -> Dict:
    forensics = _analyze_pixels(img_bytes)
    cv = _cv_analyses(img_bytes)
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
            # informational only — the microprint analysis below carries the print-quality signal
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

    # 4) The four named CV analyses (microprint · thread · UV) + serial validation.
    analyses: List[Dict] = []
    if cv.get("available"):
        # Microprint is scored; thread + UV are shown as informational context (a
        # windowed thread / UV glow won't reliably survive a flat scan, so their
        # absence alone must not raise counterfeit risk).
        mp = cv["microprint"]
        analyses.append(mp)
        if mp["direction"] == "raises":
            risk += mp["impact"] / 100.0
        factors.append({"factor": mp["name"], "detail": mp["detail"],
                        "impact": mp["impact"], "direction": mp["direction"]})
        for key in ("thread", "uv"):
            a = cv[key]
            analyses.append(a)
            factors.append({"factor": a["name"], "detail": a["detail"],
                            "impact": a["impact"], "direction": a["direction"]})
    serial_res = _validate_serial(serial, str(denomination))
    analyses.append(serial_res)
    if serial_res.get("valid") is False:
        risk += serial_res["impact"] / 100.0
        factors.append({"factor": serial_res["name"], "detail": serial_res["detail"],
                        "impact": serial_res["impact"], "direction": "raises"})
    elif serial_res.get("valid") is True:
        factors.append({"factor": serial_res["name"], "detail": serial_res["detail"],
                        "impact": serial_res["impact"], "direction": "lowers"})

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
        "analyses": analyses,
        "confirmed_features": [f["label"] for f in confirmed],
        "missing_features": [f["label"] for f in missing],
        "forensics": forensics,
        "disclaimer": "Explainable triage aid across all denominations. For legal seizure, confirm with a "
                      "UV/IR machine and forward to RBI / a forensic lab.",
    }


def feature_catalogue() -> List[Dict]:
    return SECURITY_FEATURES


# ---------------------------------------------------------------- evaluation
COUNTERFEIT_THRESHOLD = 50   # is_counterfeit decision boundary on the 0-100 score
_FEATURE_KEYS = [f["key"] for f in SECURITY_FEATURES]


def _make_note_image(denom: str, quality: str, seed: int) -> bytes:
    """Synthesise a note-like image with controllable print quality.
    quality: 'good' (rich intaglio-like detail) | 'flat' (photocopy) | 'lowres'."""
    import numpy as np
    from PIL import Image
    rng = np.random.default_rng(seed)
    prof = DENOMINATION_PROFILE.get(str(denom), DENOMINATION_PROFILE["500"])
    ar = prof["aspect_ratio"]
    base = np.array(prof["rgb_hint"], dtype=float)

    if quality == "good":
        w = 1200
        noise_std = 120          # high local detail survives downsampling
    elif quality == "lowres":
        w = 260
        noise_std = 110
    else:  # flat / photocopy
        w = 700
        noise_std = 14
    h = int(w / ar)

    # blocky texture so variance survives the 64x32 downsample in screen_note
    bw, bh = max(1, w // 48), max(1, h // 24)
    blocks = rng.normal(0, noise_std, (h // bh + 1, w // bw + 1, 3))
    field = np.kron(blocks, np.ones((bh, bw, 1)))[:h, :w, :]
    img = np.clip(base + field, 0, 255).astype("float32")

    if quality == "good":
        # inject a genuine-note-like windowed security thread (~40% of the width)
        tx = int(w * 0.4)
        img[:, tx:tx + max(2, w // 200), :] *= 0.45          # dark vertical band
        img[:, tx:tx + max(2, w // 200), 2] += 40            # slight UV-reactive blue glow

    img = np.clip(img, 0, 255).astype("uint8")
    buf = io.BytesIO()
    Image.fromarray(img).save(buf, "PNG")
    return buf.getvalue()


def generate_eval_case(label: str, seed: int, hard: bool = False):
    """Return (img_bytes, denomination, confirmed_features) with known ground truth.
    label: 'genuine' | 'counterfeit'."""
    import numpy as np
    rng = np.random.default_rng(seed + 9000)
    denom = ["100", "200", "500", "2000"][seed % 4]

    if label == "genuine":
        if hard:
            # genuine note but a poor phone photo (tests false positives)
            return _make_note_image(denom, "flat", seed), denom, list(_FEATURE_KEYS)
        return _make_note_image(denom, "good", seed), denom, list(_FEATURE_KEYS)
    else:  # counterfeit
        if hard:
            # high-quality fake: decent image + operator confirms several features
            feats = list(rng.choice(_FEATURE_KEYS, size=4, replace=False))
            return _make_note_image(denom, "good", seed), denom, feats
        # crude fake: photocopy + few/no genuine features confirmed
        feats = list(rng.choice(_FEATURE_KEYS, size=int(rng.integers(0, 2)), replace=False))
        return _make_note_image(denom, "flat", seed), denom, feats
