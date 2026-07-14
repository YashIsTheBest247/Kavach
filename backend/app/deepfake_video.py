"""
Live Digital-Arrest Video-Call Shield.

The signature 'digital arrest' attack is a WhatsApp / Skype video call with a
fake uniformed 'CBI / police officer'. This screens a short clip (or recorded
call) by sampling frames across its length, running each through the explainable
image-forensics engine (ai_image), and aggregating a per-call verdict — plus a
plain-language reminder that police NEVER arrest over a video call.

Frame extraction uses the ffmpeg binary bundled with imageio-ffmpeg (via a
subprocess) — no moviepy needed, so it stays lightweight and works on small
cloud tiers. Honest MVP: frame-level forensics.
"""
from __future__ import annotations

import os
import re
import subprocess
import tempfile
from typing import Dict, List, Optional

from app import ai_image


def _ffmpeg_exe() -> Optional[str]:
    # 1) bundled binary (preferred, always present with imageio-ffmpeg)
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    # 2) an explicit override or a system ffmpeg on PATH
    return os.getenv("IMAGEIO_FFMPEG_EXE") or _which("ffmpeg")


def _which(name: str) -> Optional[str]:
    from shutil import which
    return which(name)


def _duration(exe: str, path: str) -> Optional[float]:
    """Parse the clip duration from ffmpeg's stderr banner (no ffprobe needed)."""
    try:
        p = subprocess.run([exe, "-i", path], capture_output=True, text=True, timeout=30)
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", p.stderr or "")
        if m:
            h, mn, s = m.groups()
            return int(h) * 3600 + int(mn) * 60 + float(s)
    except Exception:
        pass
    return None


def _extract_frame(exe: str, path: str, t: float, out: str) -> bool:
    try:
        r = subprocess.run(
            [exe, "-ss", f"{max(0.0, t):.3f}", "-i", path, "-frames:v", "1",
             "-q:v", "3", "-y", out],
            capture_output=True, timeout=30)
        return r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 0
    except Exception:
        return False


def screen_video(video_bytes: bytes, max_frames: int = 8) -> Dict:
    exe = _ffmpeg_exe()
    if not exe:
        return {"error": "ffmpeg unavailable — install imageio-ffmpeg (in requirements) and redeploy"}

    workdir = tempfile.mkdtemp(prefix="kavach_vid_")
    src = os.path.join(workdir, "in.mp4")
    try:
        with open(src, "wb") as f:
            f.write(video_bytes)

        dur = _duration(exe, src) or 6.0
        dur = max(0.5, dur)
        n = max(3, min(max_frames, int(dur) + 2))
        times = [dur * (i + 0.5) / n for i in range(n)]

        frames: List[Dict] = []
        scores: List[int] = []
        for i, t in enumerate(times):
            fp = os.path.join(workdir, f"f{i}.jpg")
            if not _extract_frame(exe, src, min(t, dur - 0.05), fp):
                continue
            try:
                with open(fp, "rb") as fh:
                    res = ai_image.screen(fh.read())
            except Exception:
                continue
            if res.get("error"):
                continue
            scores.append(res["risk_score"])
            frames.append({"t": round(t, 2), "risk_score": res["risk_score"],
                           "risk_level": res["risk_level"],
                           "top_factor": (res["factors"][0]["factor"] if res.get("factors") else "")})

        if not scores:
            return {"error": "could not sample any frames — try a shorter MP4/MOV clip"}

        # Aggregate: emphasise the worst frames (a deepfake need only slip in briefly).
        scores_sorted = sorted(scores, reverse=True)
        top = scores_sorted[:max(1, len(scores_sorted) // 2)]
        overall = int(round(sum(top) / len(top)))
        high_frames = sum(1 for s in scores if s >= 60)

        if overall >= 60 or high_frames >= max(2, len(scores) // 2):
            verdict, level = "LIKELY DEEPFAKE / SYNTHETIC VIDEO", "HIGH"
        elif overall >= 35:
            verdict, level = "SUSPECT — VERIFY THE CALLER", "MEDIUM"
        else:
            verdict, level = "NO STRONG DEEPFAKE SIGNS", "LOW"

        return {
            "risk_score": overall,
            "risk_level": level,
            "verdict": verdict,
            "frames_analysed": len(frames),
            "high_risk_frames": high_frames,
            "duration_s": round(dur, 1),
            "frames": frames,
            "advice": [
                "Police, CBI, ED and courts NEVER conduct arrests or interrogations over a video call.",
                "'Digital arrest' is not a real legal procedure — it does not exist in Indian law.",
                "Do not stay on the call, do not pay, do not share OTP/Aadhaar. Hang up.",
                "Report immediately to 1930 and cybercrime.gov.in.",
            ],
            "disclaimer": "Frame-level forensics MVP — a triage signal for the video-call scam vector, "
                          "Combine with the caller-verification advice above.",
        }
    finally:
        try:
            for f in os.listdir(workdir):
                os.remove(os.path.join(workdir, f))
            os.rmdir(workdir)
        except Exception:
            pass
