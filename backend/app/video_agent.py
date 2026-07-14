"""
Awareness-Reel Automation Agent
-------------------------------
Ranks trending Economic Times cyber-fraud articles, picks the top story, and
turns it into a narrated, subtitled short video:

    rank  ->  script (Gemini)  ->  visuals (Pexels)  ->  voice (Kokoro TTS)
          ->  subtitles (.srt)  ->  assemble (ffmpeg / moviepy)  ->  MP4

Designed to degrade gracefully so it runs *anywhere*:
  • Ranking + script + subtitles + storyboard always work (no heavy deps).
  • Pexels visuals require PEXELS_API_KEY.
  • Voice requires the optional `kokoro` package; assembly requires `moviepy` + ffmpeg.
  When a stage's tool is missing the job still completes with everything up to that
  stage and a clear `status`, so a local worker can finish the render later.

Exposed to Economic Times / partners via the /api/automation/* REST surface.
"""
from __future__ import annotations

import json
import os
import re
import time
import urllib.parse
import urllib.request
from typing import Dict, List, Optional

from app import news, scam_engine, llm

MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media", "reels")
INDEX = os.path.join(MEDIA_DIR, "index.json")

# generic, safe Pexels fallback queries so visuals are always on-theme
FALLBACK_QUERIES = ["cyber security", "online fraud", "smartphone scam", "hacker laptop", "money transfer"]
FRAUD_TERMS = ["scam", "fraud", "cyber", "phishing", "digital arrest", "otp", "counterfeit",
               "deepfake", "upi", "kyc", "ponzi", "mule", "impersonat", "cheat"]


# ------------------------------------------------------------------ ranking
def _relevance(title: str, summary: str) -> Dict:
    blob = f"{title} {summary}"
    risk = scam_engine.analyze_text(blob).risk_score          # cyber-fraud signal
    low = blob.lower()
    kw = [t for t in FRAUD_TERMS if t in low]
    kw_boost = min(30, len(kw) * 6)
    return {"risk": risk, "keyword_hits": kw, "kw_boost": kw_boost}


def _keywords(title: str) -> List[str]:
    words = re.findall(r"[A-Za-z]{4,}", title)
    stop = {"scam", "scams", "news", "your", "with", "from", "that", "this", "will", "amid", "over"}
    picks = [w.lower() for w in words if w.lower() not in stop][:2]
    q = list(dict.fromkeys(picks + FALLBACK_QUERIES))
    return q[:5]


def rank_articles(limit: int = 10) -> List[Dict]:
    feed = news.get_news()
    ranked = []
    for i, it in enumerate(feed.get("items", [])):
        rel = _relevance(it["title"], it.get("summary", ""))
        recency = max(0, 15 - i)                              # feed order as recency proxy
        score = round(0.6 * rel["risk"] + rel["kw_boost"] + recency, 1)
        ranked.append({
            "title": it["title"], "link": it["link"], "summary": it.get("summary", ""),
            "source": it.get("source", "Economic Times"),
            "score": score, "cyberfraud_relevance": rel["risk"],
            "keyword_hits": rel["keyword_hits"], "keywords": _keywords(it["title"]),
        })
    ranked.sort(key=lambda a: a["score"], reverse=True)
    return ranked[:limit]


# ------------------------------------------------------------------ script
def build_script(article: Dict, language: str = "en") -> Dict:
    """~35s narration + timed subtitle segments. Gemini if available, else template."""
    narration = _gemini_script(article, language) or _template_script(article, language)
    # split into subtitle segments (~1 sentence each); handle Hindi danda "।" too.
    parts = [p.strip() for p in re.split(r"(?<=[.!?।])\s+", narration) if p.strip()]
    segs, t = [], 0.0
    for p in parts:
        dur = max(1.6, round(len(p.split()) / 2.6, 2))
        segs.append({"text": p, "start": round(t, 2), "end": round(t + dur, 2)})
        t += dur
    return {"narration": narration, "segments": segs, "duration_s": round(t, 2),
            "ai_written": bool(_gemini_available())}


def _gemini_available() -> bool:
    return llm.status().get("available", False)


def _gemini_script(article: Dict, language: str = "en") -> Optional[str]:
    if not _gemini_available():
        return None
    if language == "hi":
        prompt = (
            "आप एक जन-सुरक्षा स्क्रिप्ट लेखक हैं। नीचे दी गई इकोनॉमिक टाइम्स हेडलाइन पर आधारित एक "
            "घोटाला-जागरूकता रील के लिए 30-40 सेकंड की वॉइस-ओवर स्क्रिप्ट लिखें (4-6 छोटे वाक्य, "
            "सरल बोलचाल की हिन्दी में, देवनागरी लिपि में)। नागरिकों को चेतावनी दें, चाल को सरलता से "
            "समझाएँ, और अंत में यह वाक्य रखें: 'संदेह हो तो कॉल काट दें और 1930 पर कॉल करें।' "
            "केवल नैरेशन टेक्स्ट लौटाएँ।\n\n"
            f"हेडलाइन: {article['title']}\nसारांश: {article.get('summary','')}"
        )
    else:
        prompt = (
            "You are a public-safety scriptwriter. Write a 30-40 second voice-over script "
            "(4-6 short sentences, plain spoken English) for a scam-awareness reel based on this "
            "Economic Times headline. Warn citizens, explain the trick simply, and end with: "
            "'If in doubt, hang up and call 1930.' Return ONLY the narration text.\n\n"
            f"Headline: {article['title']}\nSummary: {article.get('summary','')}"
        )
    try:
        from google.genai import types
        # gemini-2.5-flash spends output tokens on hidden "thinking"; give a large
        # ceiling so the actual narration isn't truncated (was cutting to 1 line).
        r = llm.generate(contents=prompt,
                         config=types.GenerateContentConfig(temperature=0.6, max_output_tokens=2048))
        return (r.text or "").strip() or None if r is not None else None
    except Exception:
        return None


def _template_script(article: Dict, language: str = "en") -> str:
    if language == "hi":
        return (f"यह एक ज़रूरी घोटाला चेतावनी है। {article['title']}। "
                "ठग डर और जल्दबाज़ी पैदा करते हैं ताकि आप सोचे बिना कदम उठा लें। "
                "कभी भी OTP, PIN या पासवर्ड साझा न करें, और किसी भी चीज़ को 'वेरिफाई' करने के लिए पैसे न भेजें। "
                "संदेह हो तो कॉल काट दें और 1930 पर कॉल करें।")
    return (f"Here's a scam alert you need to know about. {article['title']}. "
            f"{article.get('summary','')[:180]} "
            "Fraudsters create urgency and fear to make you act before you think. "
            "Never share an OTP, PIN or password, and never transfer money to 'verify' anything. "
            "If in doubt, hang up and call 1930.")


# ------------------------------------------------------------------ visuals
def _clean_query(title: str) -> str:
    words = re.findall(r"[A-Za-z]{3,}", title)
    stop = {"the", "and", "for", "with", "from", "that", "this", "news", "your", "over", "amid"}
    kw = [w for w in words if w.lower() not in stop][:6]
    q = " ".join(kw)
    low = q.lower()
    if not any(x in low for x in ("scam", "fraud", "cyber", "phish", "otp", "digital", "counterfeit")):
        q = (q + " cyber fraud").strip()
    return q or "cyber fraud scam"


def _openverse(query: str, n: int) -> List[Dict]:
    """Query-relevance-ranked free images (no API key)."""
    try:
        url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
            {"q": query, "page_size": max(3, n), "mature": "false"})
        req = urllib.request.Request(url, headers={"User-Agent": "KavachAI/1.0"})
        data = json.loads(urllib.request.urlopen(req, timeout=12).read())
        out = []
        for r in data.get("results", [])[:n]:
            u = r.get("url")
            if u:
                out.append({"query": query, "url": u,
                            "photographer": r.get("creator") or "Openverse", "source": "openverse"})
        return out
    except Exception:
        return []


def _pexels(queries: List[str], n: int, per_page: int = 2) -> List[Dict]:
    key = os.getenv("PEXELS_API_KEY")
    if not key:
        return []
    images, seen = [], set()
    for q in queries:
        if len(images) >= n:
            break
        try:
            url = "https://api.pexels.com/v1/search?" + urllib.parse.urlencode(
                {"query": q, "per_page": per_page, "orientation": "landscape"})
            req = urllib.request.Request(url, headers={
                "Authorization": key, "User-Agent": "Mozilla/5.0 (KavachAI reel agent)"})
            data = json.loads(urllib.request.urlopen(req, timeout=8).read())
            for ph in data.get("photos", []):
                src = ph["src"].get("large2x") or ph["src"]["large"]
                if src in seen:
                    continue
                seen.add(src)
                images.append({"query": q, "url": src,
                               "photographer": ph.get("photographer"), "source": "pexels"})
                if len(images) >= n:
                    break
        except Exception:
            continue
    return images


def _topic_queries(article: Dict) -> List[str]:
    """Short, on-topic queries (Openverse uses AND semantics — long queries return nothing)."""
    hits = set(article.get("keyword_hits") or [])
    qs = []
    if hits & {"phishing", "otp", "kyc"}:
        qs.append("phishing scam")
    if hits & {"digital arrest", "cyber", "cheat"}:
        qs.append("cyber crime")
    if hits & {"upi", "fraud", "mule"}:
        qs.append("online banking fraud")
    if "counterfeit" in hits:
        qs.append("fake money")
    if "deepfake" in hits:
        qs.append("deepfake")
    qs += ["online scam", "cyber fraud", "hacker laptop", "phone scam", "money fraud", "cyber security"]
    seen, out = set(), []
    for q in qs:
        if q not in seen:
            seen.add(q); out.append(q)
    return out


# Words in the script that map to good, concrete Pexels/stock search queries.
_SCRIPT_LEX = {
    "otp": "otp fraud", "pin": "atm pin", "cvv": "credit card",
    "police": "police officer", "arrest": "handcuffs arrest", "cbi": "police investigation",
    "bank": "online banking", "account": "bank account", "money": "money cash",
    "transfer": "money transfer", "upi": "mobile payment", "card": "credit card fraud",
    "call": "scam phone call", "phone": "smartphone", "video": "video call",
    "link": "phishing email", "kyc": "identity document", "aadhaar": "identity card",
    "digital": "cyber crime", "cyber": "cyber security", "hacker": "hacker",
    "fake": "fake identity", "fraud": "fraud", "scam": "online scam",
    "victim": "worried person phone", "elderly": "senior citizen phone", "warning": "warning sign",
    "counterfeit": "fake currency", "currency": "indian currency", "deepfake": "artificial intelligence face",
}
_SCRIPT_STOP = {"this", "that", "with", "from", "your", "know", "need", "make", "them", "will",
                "have", "what", "when", "into", "hang", "call", "doubt", "here", "about", "they"}


def _script_queries(article: Dict, script: Optional[Dict]) -> List[str]:
    """Build concrete stock-photo queries from the actual script + topic."""
    out, seen = [], set()

    def add(q):
        if q and q not in seen:
            seen.add(q); out.append(q)

    text = ((script or {}).get("narration", "") + " " + article.get("title", "")).lower()
    for w in re.findall(r"[a-z]{3,}", text):
        if w in _SCRIPT_LEX:
            add(_SCRIPT_LEX[w])
    for q in _topic_queries(article):        # category + generic on-topic queries
        add(q)
    # a couple of significant nouns straight from the story for extra variety
    for w in re.findall(r"[a-z]{5,}", article.get("title", "").lower()):
        if w not in _SCRIPT_STOP and w not in _SCRIPT_LEX:
            add(w)
    return out[:12]


def fetch_visuals(article: Dict, keywords: List[str], n: int = 8, script: Optional[Dict] = None) -> Dict:
    """Topic-driven visuals derived from the script. Pexels (if key) → Openverse → LoremFlickr."""
    queries = _script_queries(article, script)
    imgs = _pexels(queries, n)
    for q in queries:
        if len(imgs) >= n:
            break
        imgs += _openverse(q, 2)
    # de-dupe by url
    seen, out = set(), []
    for im in imgs:
        if im["url"] in seen:
            continue
        seen.add(im["url"]); out.append(im)
    if len(out) < n:                                  # last resort so a reel always has visuals
        for i, q in enumerate(_topic_queries(article)[:n - len(out)]):
            tag = urllib.parse.quote(",".join(q.split()))
            out.append({"query": q, "url": f"https://loremflickr.com/1280/720/{tag}?lock={i + 1}",
                        "photographer": "LoremFlickr", "source": "loremflickr"})
    if out:
        return {"available": True, "images": out[:n], "source": out[0]["source"]}
    return {"available": False, "reason": "no visuals available", "images": []}


# backwards-compat alias
def fetch_pexels(keywords: List[str], n: int = 5) -> Dict:
    return fetch_visuals({"title": " ".join(keywords)}, keywords, n)


# ------------------------------------------------------------------ voice + assemble (optional local)
# Kokoro voices by gender (+ Hindi variants). af_* American female, am_* male,
# hf_* Hindi female, hm_* Hindi male.
VOICE_MAP = {
    ("female", "en"): "af_heart", ("male", "en"): "am_adam",
    ("female", "hi"): "hf_alpha", ("male", "hi"): "hm_omega",
}


# edge-tts neural voices (works on Python 3.14; no model download).
EDGE_VOICES = {
    ("female", "en"): "en-US-AriaNeural", ("male", "en"): "en-US-GuyNeural",
    ("female", "hi"): "hi-IN-SwaraNeural", ("male", "hi"): "hi-IN-MadhurNeural",
}


def synth_voice(text: str, out_path: str, voice: str = "female", language: str = "en") -> Dict:
    """Neural narration → audio file. edge-tts first, Kokoro fallback."""
    try:
        import asyncio
        import edge_tts
        vname = EDGE_VOICES.get((voice, language), "en-US-AriaNeural")

        async def _run():
            await edge_tts.Communicate(text, vname).save(out_path)
        asyncio.run(_run())
        return {"available": True, "path": out_path, "engine": "edge-tts", "voice": vname}
    except Exception as e_edge:
        wav = os.path.splitext(out_path)[0] + ".wav"
        k = kokoro_tts(text, wav, voice, language)
        if k.get("available"):
            k["engine"] = "kokoro"
            return k
        return {"available": False, "reason": f"edge-tts: {e_edge}; kokoro: {k.get('reason')}"}


def kokoro_tts(text: str, out_wav: str, voice: str = "female", language: str = "en") -> Dict:
    try:
        from kokoro import KPipeline           # optional heavy dep
        import soundfile as sf
        import numpy as np
        vname = VOICE_MAP.get((voice, language), "af_heart")
        pipe = KPipeline(lang_code="h" if vname.startswith("h") else "a")
        audio = np.concatenate([a for _, _, a in pipe(text, voice=vname)])
        sf.write(out_wav, audio, 24000)
        return {"available": True, "path": out_wav, "voice": vname}
    except Exception as e:
        return {"available": False, "reason": f"Kokoro unavailable: {e}"}


def _win_font():
    for f in ("C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/Arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(f):
            return f
    return None


def assemble_video(image_paths: List[str], audio_path: str, segments: List[Dict], out_mp4: str) -> Dict:
    """Assemble a 1280x720 reel: image slideshow + narration + burned subtitles (moviepy 2.x)."""
    try:
        import imageio_ffmpeg
        os.environ.setdefault("IMAGEIO_FFMPEG_EXE", imageio_ffmpeg.get_ffmpeg_exe())
        from moviepy import (ImageClip, AudioFileClip, CompositeVideoClip,
                             concatenate_videoclips, TextClip)
        W, H = 1280, 720
        audio = AudioFileClip(audio_path)
        dur = max(1.0, audio.duration)
        per = dur / max(1, len(image_paths))
        clips = [ImageClip(p).resized((W, H)).with_duration(per) for p in image_paths]
        base = concatenate_videoclips(clips, method="compose").with_duration(dur)

        overlays = [base]
        font = _win_font()
        for s in segments:
            try:
                txt = TextClip(text=s["text"], font=font, font_size=38, color="white",
                               stroke_color="black", stroke_width=3, method="caption",
                               size=(int(W * 0.9), None), text_align="center")
                txt = (txt.with_position(("center", H - 130))
                          .with_start(s["start"]).with_duration(max(0.1, s["end"] - s["start"])))
                overlays.append(txt)
            except Exception:
                pass   # subtitles best-effort; images + audio still render

        video = CompositeVideoClip(overlays, size=(W, H)).with_audio(audio)
        # This is a STATIC-image slideshow (no motion), so frame generation — not
        # x264 — dominates. 12 fps looks identical for static content and halves the
        # frames; 'ultrafast' + all cores handle the rest. ~3x faster, same look.
        video.write_videofile(out_mp4, fps=12, codec="libx264", audio_codec="aac",
                              preset="ultrafast", threads=os.cpu_count() or 4,
                              ffmpeg_params=["-crf", "28"], logger=None)
        return {"available": True, "path": out_mp4}
    except Exception as e:
        return {"available": False, "reason": f"Renderer error: {e}"}


def _download(url: str, path: str) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (KavachAI)"})
        with urllib.request.urlopen(req, timeout=15) as r, open(path, "wb") as f:
            f.write(r.read())
        return True
    except Exception:
        return False


def _srt(segments: List[Dict]) -> str:
    def ts(s):
        h, rem = divmod(int(s), 3600); m, sec = divmod(rem, 60); ms = int((s - int(s)) * 1000)
        return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"
    return "\n".join(f"{i+1}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n"
                     for i, s in enumerate(segments))


# ------------------------------------------------------------------ pipeline
def _load_index() -> List[Dict]:
    try:
        with open(INDEX, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_index(items: List[Dict]):
    os.makedirs(MEDIA_DIR, exist_ok=True)
    with open(INDEX, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


def _save_manifest(manifest: Dict):
    folder = os.path.join(MEDIA_DIR, manifest["id"])
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    idx = _load_index()
    idx = [r for r in idx if r.get("id") != manifest["id"]]
    idx.insert(0, {k: manifest.get(k) for k in ("id", "created", "status", "article", "mp4", "youtube_url")})
    _save_index(idx[:50])


def run_pipeline(article: Optional[Dict] = None, voice: str = "female",
                 language: str = "en", auto_publish: Optional[bool] = None) -> Dict:
    ranked = rank_articles()
    if article is None:
        if not ranked:
            return {"status": "no_articles"}
        article = ranked[0]

    reel_id = f"reel-{int(time.time())}"
    folder = os.path.join(MEDIA_DIR, reel_id)
    os.makedirs(folder, exist_ok=True)

    script = build_script(article, language=language)
    n_imgs = min(14, max(8, len(script.get("segments", [])) + 2))   # richer, varied visuals
    visuals = fetch_visuals(article, article.get("keywords") or _keywords(article["title"]),
                            n=n_imgs, script=script)
    srt_text = _srt(script["segments"])
    with open(os.path.join(folder, "subtitles.srt"), "w", encoding="utf-8") as f:
        f.write(srt_text)

    stages = {"ranked": True, "script": True, "subtitles": True, "visuals": visuals["available"]}
    status, mp4 = "storyboard_ready", None

    img_urls = [i["url"] for i in visuals.get("images", [])]
    if img_urls:
        audio_path = os.path.join(folder, "narration.mp3")
        vres = synth_voice(script["narration"], audio_path, voice=voice, language=language)
        stages["voice"] = vres["available"]
        if vres["available"]:
            local = []
            for i, u in enumerate(img_urls):
                p = os.path.join(folder, f"img{i}.jpg")
                if _download(u, p):
                    local.append(p)
            stages["images_downloaded"] = len(local)
            if local:
                render = assemble_video(local, vres["path"], script["segments"],
                                        os.path.join(folder, "reel.mp4"))
                stages["render"] = render["available"]
                if render["available"]:
                    status, mp4 = "rendered", os.path.join("media", "reels", reel_id, "reel.mp4")
                else:
                    stages["render_error"] = render.get("reason", "")[:160]

    manifest = {
        "id": reel_id, "created": int(time.time()), "status": status,
        "article": {"title": article["title"], "link": article["link"], "score": article.get("score")},
        "script": script, "storyboard": visuals.get("images", []),
        "subtitles_srt": "media/reels/%s/subtitles.srt" % reel_id,
        "mp4": mp4, "voice": voice, "language": language, "youtube_url": None, "stages": stages,
        "note": ("Rendered locally." if mp4 else
                 "Script, subtitles and storyboard ready. Run the local worker "
                 "(Kokoro + ffmpeg) to produce the MP4."),
    }
    _save_manifest(manifest)

    # auto-publish to YouTube when enabled + a real MP4 exists
    if auto_publish is None:
        auto_publish = os.getenv("ENABLE_YOUTUBE_UPLOAD", "0") == "1"
    if auto_publish and mp4:
        publish_to_youtube(reel_id)
        manifest = get_reel(reel_id) or manifest
    return manifest


def publish_to_youtube(reel_id: str) -> Dict:
    """Upload a rendered reel's MP4 to YouTube (if configured). Updates the manifest."""
    from app import youtube_upload
    manifest = get_reel(reel_id)
    if not manifest:
        return {"ok": False, "error": "reel not found"}
    if not manifest.get("mp4"):
        return {"ok": False, "error": "no rendered MP4 to publish (run the local render worker)"}
    if not youtube_upload.is_configured():
        return {"ok": False, "error": "YouTube not configured"}
    mp4_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), manifest["mp4"])
    title = f"⚠️ Scam Alert: {manifest['article']['title'][:80]}"
    desc = (manifest["script"]["narration"] + "\n\nSource: " + manifest["article"]["link"] +
            "\nAuto-generated by Kavach AI · Helpline 1930 · cybercrime.gov.in")
    res = youtube_upload.upload(mp4_path, title, desc)
    if res.get("ok"):
        manifest["youtube_url"] = res["url"]
        manifest["status"] = "published"
        manifest.setdefault("stages", {})["published"] = True
        _save_manifest(manifest)
    return res


def list_reels() -> List[Dict]:
    return _load_index()


def get_reel(reel_id: str) -> Optional[Dict]:
    path = os.path.join(MEDIA_DIR, reel_id, "manifest.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None
