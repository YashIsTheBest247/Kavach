"""
AI-generated / deepfake image screening (explainable MVP).

Honest MVP: robust deepfake detection needs a trained CNN. Here we run an
explainable image-forensics pass that flags the statistical fingerprints common
to AI-generated / manipulated images — missing camera EXIF, over-smooth
high-frequency content (GAN/diffusion look), near-square generator dimensions,
and unnatural noise — and returns a calibrated score with every contributing
factor. Useful as a triage signal for fake profile photos and forged IDs.
"""
from __future__ import annotations

import io
from typing import Dict, List


def screen(img_bytes: bytes) -> Dict:
    try:
        from PIL import Image
        import numpy as np
    except Exception as e:
        return {"error": f"imaging libs unavailable: {e}"}
    try:
        img = Image.open(io.BytesIO(img_bytes))
    except Exception as e:
        return {"error": f"could not read image: {e}"}

    factors: List[Dict] = []
    risk = 0.0

    def add(cond, weight, label, hi, lo):
        nonlocal risk
        if cond:
            risk += weight
            factors.append({"factor": label, "detail": hi, "impact": round(weight * 100), "direction": "raises"})
        else:
            factors.append({"factor": label, "detail": lo, "impact": round(weight * 40), "direction": "lowers"})

    # 1) EXIF / camera metadata — real photos usually carry it; generators don't.
    exif = None
    try:
        exif = img.getexif()
    except Exception:
        exif = None
    has_camera = bool(exif) and any(t in exif for t in (271, 272, 305, 36867))  # Make, Model, Software, DateTimeOriginal
    add(not has_camera, 0.25, "Camera metadata",
        "No camera EXIF (make/model/date) — typical of AI-generated or scrubbed images.",
        "Camera EXIF present — consistent with a real photo.")

    rgb = img.convert("RGB")
    w, h = rgb.size
    arr = np.asarray(rgb.resize((256, 256))).astype("float32")

    # 2) High-frequency detail — GAN/diffusion images are often over-smooth.
    gray = arr.mean(axis=2)
    lap = (np.abs(np.diff(gray, axis=0)[:, :-1]) + np.abs(np.diff(gray, axis=1)[:-1, :]))
    hf = float(lap.mean())
    add(hf < 6.0, 0.22, "High-frequency detail",
        f"Low micro-detail (index {hf:.1f}) — over-smooth, GAN/diffusion-like.",
        f"Healthy micro-detail (index {hf:.1f}).")

    # 3) Generator-typical near-square dimensions (512/768/1024).
    ratio = w / h if h else 1
    square_dim = (abs(w - h) <= 4) and (w in (256, 512, 640, 768, 1024) or h in (512, 768, 1024))
    add(square_dim or (0.98 <= ratio <= 1.02 and w >= 480), 0.14, "Image geometry",
        f"Near-square generator dimensions ({w}x{h}).",
        f"Natural aspect ratio ({w}x{h}).")

    # 4) Noise uniformity — real sensors leave uneven noise; generators are uniform.
    noise = gray - np.clip(gray, gray.mean() - 30, gray.mean() + 30)
    var_spread = float(np.std([arr[:128, :128].std(), arr[128:, :128].std(),
                               arr[:128, 128:].std(), arr[128:, 128:].std()]))
    add(var_spread < 4.0, 0.12, "Noise uniformity",
        f"Very uniform texture across regions (spread {var_spread:.1f}) — synthetic-like.",
        f"Natural texture variation (spread {var_spread:.1f}).")

    risk = max(0.0, min(1.0, risk))
    score = int(round(risk * 100))
    if score >= 60:
        verdict, level = "LIKELY AI-GENERATED / MANIPULATED", "HIGH"
    elif score >= 35:
        verdict, level = "SUSPECT — MANUAL REVIEW", "MEDIUM"
    else:
        verdict, level = "LIKELY AUTHENTIC", "LOW"

    return {
        "risk_score": score, "risk_level": level, "verdict": verdict,
        "confidence": round(0.55 + 0.4 * abs(risk - 0.5), 2),
        "factors": factors,
        "dimensions": f"{w}x{h}",
        "disclaimer": "Heuristic forensics MVP. Use as a triage signal for fake "
                      "profile photos / forged IDs, alongside human review.",
    }
