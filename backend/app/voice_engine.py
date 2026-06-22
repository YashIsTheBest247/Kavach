"""
Voice-spoof / deepfake-voice screening (MVP, explainable)
---------------------------------------------------------
Honest MVP: production-grade synthetic-voice detection uses a CNN trained on
ASVspoof-style corpora. Here we run an explainable audio-forensics pass over an
uploaded WAV and score the signal against the tell-tale signatures of TTS /
vocoder output:

  • over-steady energy envelope (real speech breathes; TTS is flat)
  • absence of natural pauses / micro-silences
  • pristine noise floor (real phone audio carries channel noise)
  • over-smooth pitch contour (low f0 jitter)
  • band-limited / vocoder-style spectral roll-off

Every factor is reported with its contribution so the verdict is auditable.
The module can also GENERATE labelled demo clips (synthetic vs human-like) so the
feature is demoable end-to-end without sourcing audio files — and those same
generators feed the measured-metrics evaluation.
"""
from __future__ import annotations

import io
import wave
from typing import Dict, List, Tuple

import numpy as np

SR = 16000


# ---------------------------------------------------------------- generation
def generate_clip(kind: str, seconds: float = 3.0, sr: int = SR, seed: int | None = None) -> np.ndarray:
    """Generate a mono float32 signal in [-1,1]. kind = 'synthetic' | 'human'."""
    rng = np.random.default_rng(seed)
    t = np.linspace(0, seconds, int(seconds * sr), endpoint=False)

    if kind == "synthetic":
        # Steady glottal tone + fixed harmonics, gentle vibrato, near-zero noise,
        # constant amplitude envelope, no pauses -> classic TTS signature.
        f0 = rng.uniform(110, 150)
        vibrato = 1.0 + 0.004 * np.sin(2 * np.pi * 5 * t)   # tiny, over-regular
        sig = np.zeros_like(t)
        for k, amp in enumerate([1.0, 0.5, 0.33, 0.25], start=1):
            sig += amp * np.sin(2 * np.pi * f0 * k * vibrato * t)
        env = 0.9 + 0.02 * np.sin(2 * np.pi * 3 * t)        # almost flat envelope
        sig = sig * env
        sig += rng.normal(0, 0.0008, t.shape)               # pristine noise floor
    else:
        # Human-like: variable pitch (jitter), breathy noise, random pauses,
        # syllabic amplitude modulation.
        f0 = rng.uniform(95, 180) + 12 * np.cumsum(rng.normal(0, 0.02, t.shape))
        f0 = np.clip(f0, 80, 260)
        phase = 2 * np.pi * np.cumsum(f0) / sr
        sig = np.sin(phase) + 0.4 * np.sin(2 * phase) + 0.2 * np.sin(3 * phase)
        # syllabic envelope ~4 Hz with randomness
        env = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * rng.uniform(3, 5) * t + rng.normal(0, 0.4, t.shape)))
        sig = sig * env
        # insert a few natural pauses
        for _ in range(rng.integers(2, 5)):
            s = rng.integers(0, len(t) - sr // 2)
            sig[s:s + rng.integers(sr // 6, sr // 2)] *= 0.03
        sig += rng.normal(0, 0.02, t.shape)                 # channel/background noise

    peak = np.max(np.abs(sig)) or 1.0
    return (0.9 * sig / peak).astype(np.float32)


def to_wav_bytes(sig: np.ndarray, sr: int = SR) -> bytes:
    pcm = np.clip(sig, -1, 1)
    pcm = (pcm * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def read_wav_bytes(data: bytes) -> Tuple[np.ndarray, int]:
    with wave.open(io.BytesIO(data), "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        ch = w.getnchannels()
        sw = w.getsampwidth()
        raw = w.readframes(n)
    dtype = {1: np.int8, 2: np.int16, 4: np.int32}.get(sw, np.int16)
    x = np.frombuffer(raw, dtype=dtype).astype(np.float32)
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    maxv = float(np.iinfo(dtype).max)
    return x / maxv, sr


# ---------------------------------------------------------------- features
def _frames(x: np.ndarray, frame: int, hop: int) -> np.ndarray:
    if len(x) < frame:
        x = np.pad(x, (0, frame - len(x)))
    n = 1 + (len(x) - frame) // hop
    idx = np.arange(frame)[None, :] + hop * np.arange(n)[:, None]
    return x[idx]


def extract_features(x: np.ndarray, sr: int) -> Dict:
    if len(x) == 0:
        return {}
    frame = int(0.025 * sr)
    hop = int(0.010 * sr)
    fr = _frames(x, frame, hop)
    win = np.hanning(frame)

    rms = np.sqrt((fr ** 2).mean(axis=1) + 1e-12)
    mean_rms = float(rms.mean())
    energy_cv = float(rms.std() / (mean_rms + 1e-9))                  # dynamics
    silence_ratio = float((rms < 0.2 * (rms.max() + 1e-9)).mean())    # pauses
    noise_floor = float(np.percentile(rms, 5) / (mean_rms + 1e-9))    # cleanliness

    # spectra
    mag = np.abs(np.fft.rfft(fr * win, axis=1)) + 1e-9
    freqs = np.fft.rfftfreq(frame, 1 / sr)
    centroid = (mag * freqs).sum(axis=1) / mag.sum(axis=1)
    flatness = np.exp(np.log(mag).mean(axis=1)) / mag.mean(axis=1)
    hf_ratio = mag[:, freqs > 4000].sum(axis=1) / mag.sum(axis=1)

    # pitch proxy: dominant low-freq bin per voiced frame -> jitter
    voiced = rms > np.median(rms)
    band = (freqs >= 80) & (freqs <= 320)
    dom = freqs[band][np.argmax(mag[:, band], axis=1)]
    dom_v = dom[voiced] if voiced.any() else dom
    pitch_jitter = float(dom_v.std() / (dom_v.mean() + 1e-9)) if len(dom_v) else 0.0

    return {
        "duration_s": round(len(x) / sr, 2),
        "sample_rate": sr,
        "energy_cv": round(energy_cv, 3),
        "silence_ratio": round(silence_ratio, 3),
        "noise_floor": round(noise_floor, 4),
        "spectral_flatness": round(float(flatness.mean()), 4),
        "hf_ratio": round(float(hf_ratio.mean()), 4),
        "pitch_jitter": round(pitch_jitter, 4),
        "spectral_centroid_hz": round(float(centroid.mean()), 1),
    }


# ---------------------------------------------------------------- scoring
def score_features(f: Dict) -> Dict:
    if not f:
        return {"synthetic_risk_score": 0, "risk_level": "LOW", "verdict": "NO AUDIO", "factors": []}

    risk = 0.0
    factors: List[Dict] = []

    def add(cond_val, threshold, weight, label, detail_hi, detail_lo, lower_is_synth=True):
        nonlocal risk
        triggered = (cond_val < threshold) if lower_is_synth else (cond_val > threshold)
        if triggered:
            risk += weight
            factors.append({"factor": label, "detail": detail_hi, "impact": round(weight * 100), "direction": "raises"})
        else:
            factors.append({"factor": label, "detail": detail_lo, "impact": round(weight * 40), "direction": "lowers"})

    # energy dynamics — real speech "breathes"; TTS stays flat (low CV => synthetic)
    add(f["energy_cv"], 0.25, 0.30, "Energy dynamics",
        "Over-steady loudness envelope — real speech 'breathes', synthetic stays flat",
        "Natural variation in loudness across the clip")
    # natural pauses — synthetic rarely inserts micro-silences (low ratio => synthetic)
    add(f["silence_ratio"], 0.05, 0.25, "Natural pauses",
        "Almost no micro-pauses — synthetic speech rarely inserts natural breaks",
        "Natural pauses / silences present")
    # noise floor steadiness — p5/mean high means no quiet frames => over-clean/steady => synthetic
    add(f["noise_floor"], 0.55, 0.23, "Background / noise floor",
        "No quiet frames — pristine, over-steady level typical of studio TTS, not phone audio",
        "Realistic channel/background noise present", lower_is_synth=False)
    # spectral roll-off — band-limited HF is a vocoder/codec artifact (low ratio => synthetic)
    add(f["hf_ratio"], 0.02, 0.22, "Spectral roll-off",
        "Band-limited high frequencies — vocoder / codec artifact",
        "Full-band spectral content present")

    # pitch jitter reported as informational context only (FFT-bin proxy, no score impact)
    factors.append({"factor": "Pitch micro-variation", "detail": f"f0 jitter index {f['pitch_jitter']}",
                    "impact": 0, "direction": "neutral"})

    risk = max(0.0, min(1.0, risk))
    score = int(round(risk * 100))
    if score >= 60:
        verdict, level = "LIKELY SYNTHETIC / DEEPFAKE", "HIGH"
    elif score >= 35:
        verdict, level = "SUSPECT — MANUAL REVIEW", "MEDIUM"
    else:
        verdict, level = "LIKELY HUMAN", "LOW"

    n_raise = sum(1 for x in factors if x["direction"] == "raises")
    confidence = round(min(0.95, 0.55 + 0.08 * len(factors) * (0.5 + abs(risk - 0.5))), 2)

    return {
        "synthetic_risk_score": score,
        "risk_level": level,
        "verdict": verdict,
        "is_synthetic": score >= 50,
        "confidence": confidence,
        "factors": factors,
        "flags_raised": n_raise,
    }


def analyze_bytes(data: bytes) -> Dict:
    try:
        x, sr = read_wav_bytes(data)
    except Exception as e:
        return {"error": f"Could not read audio (upload a mono/stereo PCM WAV): {e}"}
    return analyze_signal(x, sr)


def analyze_signal(x: np.ndarray, sr: int) -> Dict:
    feats = extract_features(x, sr)
    result = score_features(feats)
    result["features"] = feats
    result["disclaimer"] = ("Heuristic audio-forensics MVP — not a substitute for a CNN trained on "
                            "ASVspoof-grade data. Use as a triage signal alongside content analysis.")
    return result


def generate_eval_clip(label: str, seed: int, hard: bool = False) -> np.ndarray:
    """Labelled clips for the metrics harness. `hard` makes borderline cases:
    deepfakes played over a noisy line, or monotone humans on a clean line."""
    rng = np.random.default_rng(seed + 5000)
    if label == "synthetic":
        sig = generate_clip("synthetic", seed=seed)
        if hard:
            sig = sig + rng.normal(0, 0.02, sig.shape)          # mild line noise
            s = rng.integers(0, len(sig) - 4000)
            sig[s:s + 2500] *= 0.05                               # one inserted pause
    else:
        if hard:
            # monotone speaker on a clean line — intrinsically human but TTS-like cues
            t = np.linspace(0, 3.0, int(3.0 * SR), endpoint=False)
            f0 = rng.uniform(110, 140)
            sig = np.sin(2 * np.pi * f0 * t) + 0.4 * np.sin(2 * np.pi * 2 * f0 * t)
            sig = sig * (0.85 + 0.05 * np.sin(2 * np.pi * 2 * t))
            sig += rng.normal(0, 0.004, t.shape)
        else:
            sig = generate_clip("human", seed=seed)
    peak = np.max(np.abs(sig)) or 1.0
    return (0.9 * sig / peak).astype(np.float32)


def demo(kind: str) -> Dict:
    sig = generate_clip(kind, seconds=3.0, seed=None if kind == "human" else 7)
    res = analyze_signal(sig, SR)
    import base64
    res["audio_b64"] = base64.b64encode(to_wav_bytes(sig)).decode()
    res["demo_kind"] = kind
    return res
