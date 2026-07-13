"""
Live Digital-Arrest Video-Call Shield.

The signature 'digital arrest' attack is a WhatsApp / Skype video call with a
fake uniformed 'CBI / police officer'. This screens a short clip (or recorded
call) by sampling frames across its length, running each through the explainable
image-forensics engine (ai_image), and aggregating a per-call verdict — plus a
plain-language reminder that police NEVER arrest over a video call.

Honest MVP: frame-level forensics, not a trained video-deepfake CNN. Designed as
a live triage signal for the exact vector named in the problem statement.
"""
from __future__ import annotations

import io
import os
import tempfile
from typing import Dict, List

from app import ai_image


def _frame_to_png(frame) -> bytes:
    from PIL import Image
    im = Image.fromarray(frame)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return buf.getvalue()


def screen_video(video_bytes: bytes, max_frames: int = 8) -> Dict:
    try:
        import imageio_ffmpeg
        os.environ.setdefault("IMAGEIO_FFMPEG_EXE", imageio_ffmpeg.get_ffmpeg_exe())
        from moviepy import VideoFileClip
    except Exception as e:
        return {"error": f"video libs unavailable: {e}"}

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
            tf.write(video_bytes)
            tmp_path = tf.name

        clip = VideoFileClip(tmp_path)
        dur = max(0.1, float(clip.duration or 0.1))
        n = max(3, min(max_frames, int(dur) + 2))
        times = [dur * (i + 0.5) / n for i in range(n)]

        frames: List[Dict] = []
        scores = []
        for t in times:
            try:
                arr = clip.get_frame(min(t, dur - 0.01))
                res = ai_image.screen(_frame_to_png(arr))
                if res.get("error"):
                    continue
                scores.append(res["risk_score"])
                frames.append({"t": round(t, 2), "risk_score": res["risk_score"],
                               "risk_level": res["risk_level"],
                               "top_factor": (res["factors"][0]["factor"] if res.get("factors") else "")})
            except Exception:
                continue
        clip.close()

        if not scores:
            return {"error": "could not sample any frames from the video"}

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
                          "not a trained video-deepfake CNN. Combine with the caller-verification advice above.",
        }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
