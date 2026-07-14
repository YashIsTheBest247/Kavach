"""
Kavach AI — Digital Public Safety Intelligence Platform
ET AI Hackathon 2026 · Problem Statement #6
FastAPI backend.
"""
from __future__ import annotations

import os
from dataclasses import asdict
from typing import List, Optional

import urllib.parse
import urllib.request

from fastapi import FastAPI, File, Form, UploadFile, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import time

from app import (scam_engine, fraud_graph, counterfeit, geo_stats, advisory, llm,
                 voice_engine, metrics, orchestrator, news, video_agent, security,
                 link_scanner, reports, ai_image, report_pdf, usage,
                 honeypot, deepfake_video, complaint, outbreak, telegram_bot, ivr,
                 whatsapp_bot)

app = FastAPI(
    title="Kavach AI — Digital Public Safety Intelligence",
    version="1.0.0",
    description="Detect, disrupt and respond to digital fraud, counterfeit currency and digital-arrest scams.",
)

# CORS allow-list. Default "*" for the demo; set CORS_ORIGINS to a comma-separated
# list of exact origins (e.g. "https://kavach.vercel.app") to lock it down.
_cors = os.getenv("CORS_ORIGINS", "*").strip()
_allow_origins = ["*"] if _cors == "*" else [o.strip() for o in _cors.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated reels (mp4/subtitles) so the app gallery can preview them.
_media_root = os.path.join(os.path.dirname(__file__), "media")
os.makedirs(_media_root, exist_ok=True)
app.mount("/media", StaticFiles(directory=_media_root), name="media")


# ---------- models ----------
class ScamRequest(BaseModel):
    text: str
    channel: Optional[str] = "Unknown"
    language: Optional[str] = "en"
    use_ai: Optional[bool] = False   # opt-in Gemini augmentation


class FusionRequest(BaseModel):
    text: str
    channel: Optional[str] = "Phone Call"
    language: Optional[str] = "en"
    location: Optional[str] = None
    phone: Optional[str] = None


# ---------- meta ----------
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "kavach-ai", "version": "1.0.0"}


@app.get("/api/stats")
def stats():
    return geo_stats.dashboard_stats()


@app.get("/api/news")
def news_feed():
    return news.get_news()


@app.get("/api/llm/status")
def llm_status():
    return llm.status()


# ---------- scam / fraud-shield detection ----------
@app.post("/api/scam/analyze")
def analyze_scam(req: ScamRequest):
    result = scam_engine.analyze_text(req.text)
    payload = asdict(result)
    payload["channel"] = req.channel
    payload["advisory"] = advisory.advisory_for(result.risk_level, req.language or "en")
    payload["language"] = req.language or "en"
    payload["ai"] = {"requested": bool(req.use_ai)}

    # Optional Gemini augmentation layered on top of the deterministic verdict.
    if req.use_ai:
        ai = llm.analyze(req.text)
        payload["ai"] = {**payload["ai"], **ai}
        if ai.get("available") and "risk_score" in ai:
            # Fuse: rule engine weighted slightly higher (auditable), AI adds nuance.
            fused = round(0.55 * result.risk_score + 0.45 * ai["risk_score"])
            payload["fused_risk_score"] = fused
            payload["fused_risk_level"] = scam_engine._level_from_score(fused)
    return payload


@app.get("/api/scam/samples")
def scam_samples():
    return advisory.SAMPLE_SCENARIOS


@app.get("/api/scam/languages")
def scam_languages():
    return {"languages": advisory.LANGUAGES, "detail": advisory.languages()}


# ============================================================================
# Citizen Fraud Shield — multi-channel access (WhatsApp · IVR · web/mobile app)
# ============================================================================
@app.get("/api/channels")
def channels_status():
    # 'live'  = actually reachable by a citizen right now.
    # 'ready' = engine + webhook built and tested, awaiting a provider connection.
    wa_code = os.getenv("WHATSAPP_SANDBOX_CODE")
    ivr_num = os.getenv("IVR_NUMBER")
    tg = bool(os.getenv("TELEGRAM_BOT_TOKEN"))
    return {
        "web": {"status": "live", "note": "React SPA + installable PWA (mobile app)"},
        "telegram": {"status": "live" if tg else "ready", "handle": "@Kavach_support_bot"},
        "whatsapp": {"status": "live" if wa_code else "ready",
                     "note": "Free Twilio WhatsApp Sandbox — auto-checks any message",
                     "number": os.getenv("WHATSAPP_SANDBOX_NUMBER", "+1 415 523 8886"),
                     "join_code": wa_code or None},
        "ivr": {"status": "live" if ivr_num else "ready",
                "note": "TwiML voice webhook — connect a Twilio/Exotel number",
                "number": ivr_num or None},
        "languages": advisory.languages(),
    }


# ---- WhatsApp (free Twilio Sandbox — auto-check any inbound message) ----
@app.post("/api/whatsapp/twilio")
async def whatsapp_twilio(request: Request):
    form = await request.form()
    body = form.get("Body", "") or ""
    return Response(content=whatsapp_bot.twiml(body), media_type="application/xml")


# ---- IVR (Twilio-compatible voice) ----
@app.post("/api/ivr/welcome")
def ivr_welcome(lang: str = "en"):
    return Response(content=ivr.welcome_twiml(lang), media_type="application/xml")


@app.post("/api/ivr/analyze")
async def ivr_analyze(request: Request, lang: str = "en"):
    form = await request.form()
    speech = form.get("SpeechResult") or form.get("speech") or ""
    return Response(content=ivr.analyze_twiml(speech, lang), media_type="application/xml")


# ---------- fraud network graph ----------
@app.get("/api/fraud/graph")
def fraud_graph_endpoint():
    return fraud_graph.get_graph()


@app.get("/api/fraud/packages")
def fraud_packages():
    return {"packages": fraud_graph.get_intelligence_packages()}


# ---------- counterfeit currency ----------
@app.get("/api/counterfeit/features")
def counterfeit_features():
    return {"features": counterfeit.feature_catalogue()}


@app.post("/api/counterfeit/screen")
async def counterfeit_screen(
    denomination: str = Form("500"),
    confirmed_features: str = Form(""),  # comma-separated keys
    serial: str = Form(""),              # optional note serial number
    file: UploadFile = File(...),
):
    img_bytes = await file.read()
    feats: List[str] = [f for f in confirmed_features.split(",") if f]
    return counterfeit.screen_note(img_bytes, denomination, feats, serial=serial)


# ---------- agentic fusion orchestrator ----------
@app.post("/api/fusion/orchestrate")
def fusion_orchestrate(req: FusionRequest):
    return orchestrator.orchestrate(req.text, req.channel or "Unknown",
                                    req.language or "en", req.location, req.phone)


# ---------- voice-spoof / deepfake-voice ----------
@app.post("/api/voice/analyze")
async def voice_analyze(file: UploadFile = File(...)):
    data = await file.read()
    return voice_engine.analyze_bytes(data)


@app.get("/api/voice/demo")
def voice_demo(kind: str = "synthetic"):
    kind = kind if kind in ("synthetic", "human") else "synthetic"
    return voice_engine.demo(kind)


# ---------- measured metrics ----------
@app.get("/api/metrics")
def metrics_all():
    return metrics.all_metrics()


# ---------- geospatial ----------
@app.get("/api/geo/hotspots")
def geo_hotspots():
    return {"hotspots": geo_stats.hotspots()}


# ---------- link / QR phishing scanner ----------
class LinkRequest(BaseModel):
    url: str


@app.post("/api/link/scan")
def link_scan(req: LinkRequest):
    return link_scanner.scan(req.url)


# ---------- crowdsourced reports + reputation ----------
class ReportRequest(BaseModel):
    value: str
    reason: Optional[str] = ""


@app.post("/api/report")
def report_submit(req: ReportRequest):
    return reports.submit(req.value, req.reason or "")


@app.get("/api/reputation")
def reputation(value: str):
    return reports.reputation(value)


@app.get("/api/reports/recent")
def reports_recent():
    return {"recent": reports.recent(), "stats": reports.stats()}


# ---------- deepfake / AI-image screening ----------
@app.post("/api/deepfake/screen")
async def deepfake_screen(file: UploadFile = File(...)):
    return ai_image.screen(await file.read())


# ---------- Counter-Intel honeypot ----------
class HoneypotRequest(BaseModel):
    conversation: List[dict]            # [{role:'scammer'|'victim', text:str}, ...]
    persona: Optional[str] = "confused_elder"
    language: Optional[str] = "en"


@app.get("/api/honeypot/personas")
def honeypot_personas():
    return {"personas": honeypot.personas()}


@app.post("/api/honeypot/engage")
def honeypot_engage(req: HoneypotRequest):
    return honeypot.engage(req.conversation, persona=req.persona or "confused_elder",
                           lang=req.language or "en")


# ---------- video-call deepfake shield ----------
@app.post("/api/deepfake/video")
async def deepfake_video_screen(file: UploadFile = File(...)):
    return deepfake_video.screen_video(await file.read())


# ---------- one-tap NCRP complaint ----------
class ComplaintRequest(BaseModel):
    text: str
    channel: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    amount_lost: Optional[str] = None
    datetime: Optional[str] = None
    language: Optional[str] = "en"


@app.post("/api/complaint/draft")
def complaint_draft(req: ComplaintRequest):
    return complaint.draft(req.model_dump())


@app.post("/api/complaint/pdf")
def complaint_pdf(req: ComplaintRequest):
    pdf = complaint.draft_pdf(req.model_dump())
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=kavach-cybercrime-complaint.pdf"})


# ---------- scam-outbreak early-warning ----------
@app.get("/api/outbreak/alerts")
def outbreak_alerts():
    return outbreak.alerts()


# ---------- court-admissible PDF report ----------
@app.post("/api/report/scam/pdf")
def scam_pdf(req: ScamRequest):
    result = scam_engine.analyze_text(req.text)
    payload = asdict(result)
    payload["advisory"] = advisory.advisory_for(result.risk_level, req.language or "en")
    pdf = report_pdf.scam_report(payload, req.text)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=kavach-fraud-report.pdf"})


# ============================================================================
# SURFACE 1 — Awareness-Reel Automation Agent  (/api/automation/*)
# Key-protected REST API for Economic Times / partners. Ranks trending ET
# cyber-fraud stories and turns the top one into a narrated, subtitled reel.
# ============================================================================
class GenerateRequest(BaseModel):
    link: Optional[str] = None          # generate from a specific article; else the top-ranked one
    voice: Optional[str] = "female"     # 'female' | 'male'
    language: Optional[str] = "en"
    publish: Optional[bool] = False     # also upload to YouTube if configured


@app.get("/api/automation/rank", dependencies=[Depends(security.require_automation_key)])
def automation_rank(limit: int = 10):
    return {"ranked": video_agent.rank_articles(limit)}


@app.post("/api/automation/generate", dependencies=[Depends(security.require_automation_key)])
def automation_generate(req: GenerateRequest):
    article = None
    if req.link:
        article = next((a for a in video_agent.rank_articles(50) if a["link"] == req.link), None)
    # Honour the explicit publish flag (default False). Only the unattended cron
    # (which calls run_pipeline() with no args → None) falls back to
    # ENABLE_YOUTUBE_UPLOAD. This keeps interactive "Generate" from ever
    # auto-uploading to YouTube unless the caller explicitly asks to publish.
    return video_agent.run_pipeline(article, voice=req.voice or "female",
                                    language=req.language or "en",
                                    auto_publish=bool(req.publish))


@app.post("/api/automation/reels/{reel_id}/publish", dependencies=[Depends(security.require_automation_key)])
def automation_publish(reel_id: str):
    """Manually publish a rendered reel to YouTube (if configured)."""
    return video_agent.publish_to_youtube(reel_id)


@app.get("/api/automation/reels", dependencies=[Depends(security.require_automation_key)])
def automation_reels():
    return {"reels": video_agent.list_reels()}


_IMG_HOSTS = ("pexels.com", "loremflickr.com", "staticflickr.com", "unsplash.com",
              "picsum.photos", "wikimedia.org", "wikipedia.org", "imgur.com",
              "openverse.org", "flickr.com", "stocksnap.io", "pixabay.com", "rawpixel.com")


@app.get("/api/img")
def img_proxy(url: str):
    """Same-origin, CORS-enabled image proxy so the browser can draw storyboard
    images onto a <canvas> and record/download the reel without tainting it."""
    host = urllib.parse.urlparse(url).netloc.lower()
    if not any(host == h or host.endswith("." + h) for h in _IMG_HOSTS):
        raise HTTPException(status_code=400, detail="host not allowed")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (KavachAI)"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            ct = r.headers.get("Content-Type", "image/jpeg")
        return Response(content=data, media_type=ct, headers={"Cache-Control": "public, max-age=86400"})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"image fetch failed: {e}")


@app.get("/api/automation/reels/{reel_id}", dependencies=[Depends(security.require_automation_key)])
def automation_reel(reel_id: str):
    r = video_agent.get_reel(reel_id)
    return r or {"error": "not found"}


@app.get("/api/automation/reels/{reel_id}/video", dependencies=[Depends(security.require_automation_key)])
def automation_reel_video(reel_id: str):
    r = video_agent.get_reel(reel_id)
    if not r or not r.get("mp4"):
        return {"error": "video not rendered on this host — run the local worker"}
    path = os.path.join(os.path.dirname(__file__), r["mp4"])
    return FileResponse(path, media_type="video/mp4", filename=f"{reel_id}.mp4")


# ============================================================================
# SURFACE 2 — Embeddable Kavach Detection  (/api/partner/*)
# Separate key. Lets ANY application embed Kavach's detection engines.
# ============================================================================
@app.post("/api/partner/scam/analyze", dependencies=[Depends(security.require_partner_key)])
def partner_scam(req: ScamRequest):
    return analyze_scam(req)


@app.post("/api/partner/voice/analyze", dependencies=[Depends(security.require_partner_key)])
async def partner_voice(file: UploadFile = File(...)):
    return voice_engine.analyze_bytes(await file.read())


@app.post("/api/partner/counterfeit/screen", dependencies=[Depends(security.require_partner_key)])
async def partner_counterfeit(denomination: str = Form("500"),
                              confirmed_features: str = Form(""),
                              serial: str = Form(""),
                              file: UploadFile = File(...)):
    feats = [f for f in confirmed_features.split(",") if f]
    return counterfeit.screen_note(await file.read(), denomination, feats, serial=serial)


@app.get("/api/partner/health", dependencies=[Depends(security.require_partner_key)])
def partner_health():
    return {"status": "ok", "surface": "partner-detection", "version": "1.0.0"}


# ---------- API usage + rate-limit dashboard ----------
@app.get("/api/usage")
def api_usage():
    """Live per-key usage + rate-limit utilisation across both keyed surfaces."""
    return usage.summary(time.time())


# ============================================================================
# Telegram Fraud Shield — webhook mode (works on the deployed backend)
# On startup, if TELEGRAM_BOT_TOKEN + a public base URL are present, the bot is
# wired up and its webhook is registered at /api/telegram/webhook. Telegram then
# PUSHES updates here — no always-on polling process needed.
# ============================================================================
_tg: dict = {"app": None, "secret": None}


@app.on_event("startup")
async def _start_telegram():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    # Render auto-provides RENDER_EXTERNAL_URL; else set TELEGRAM_WEBHOOK_URL.
    base = os.getenv("TELEGRAM_WEBHOOK_URL") or os.getenv("RENDER_EXTERNAL_URL")
    if not token or not base or os.getenv("ENABLE_TELEGRAM_WEBHOOK", "1") != "1":
        return
    try:
        application = telegram_bot.build_application(token, for_webhook=True)
        await application.initialize()
        await application.start()
        secret = os.getenv("TELEGRAM_WEBHOOK_SECRET") or None
        url = base.rstrip("/") + "/api/telegram/webhook"
        # drop_pending_updates=False so messages queued while a free-tier service
        # was asleep are still delivered when it wakes.
        await application.bot.set_webhook(
            url=url, secret_token=secret, drop_pending_updates=False,
            allowed_updates=["message", "callback_query"])
        _tg["app"], _tg["secret"] = application, secret
        print("Telegram webhook registered:", url)
    except Exception as e:  # pragma: no cover
        print("telegram webhook not started:", e)


@app.on_event("shutdown")
async def _stop_telegram():
    application = _tg.get("app")
    if application:
        try:
            await application.stop()
            await application.shutdown()
        except Exception:  # pragma: no cover
            pass


@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request):
    application = _tg.get("app")
    if not application:
        raise HTTPException(status_code=404, detail="Telegram webhook not enabled")
    secret = _tg.get("secret")
    if secret and request.headers.get("X-Telegram-Bot-Api-Secret-Token") != secret:
        raise HTTPException(status_code=403, detail="bad secret token")
    from telegram import Update
    update = Update.de_json(await request.json(), application.bot)
    await application.process_update(update)
    return {"ok": True}


# ---------- automation cron (opt-in) ----------
@app.on_event("startup")
def _start_cron():
    if os.getenv("ENABLE_AUTOMATION_CRON", "0") != "1":
        return
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
        sched = BackgroundScheduler(daemon=True)
        # default: once a day at 08:00; override with AUTOMATION_CRON (crontab syntax)
        cron = os.getenv("AUTOMATION_CRON", "0 8 * * *")
        sched.add_job(video_agent.run_pipeline, CronTrigger.from_crontab(cron))
        sched.start()
        app.state.scheduler = sched
    except Exception as e:  # pragma: no cover
        print("automation cron not started:", e)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
