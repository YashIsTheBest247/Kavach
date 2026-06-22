"""
Kavach AI — Digital Public Safety Intelligence Platform
ET AI Hackathon 2026 · Problem Statement #6
FastAPI backend.
"""
from __future__ import annotations

from dataclasses import asdict
from typing import List, Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import scam_engine, fraud_graph, counterfeit, geo_stats, advisory

app = FastAPI(
    title="Kavach AI — Digital Public Safety Intelligence",
    version="1.0.0",
    description="Detect, disrupt and respond to digital fraud, counterfeit currency and digital-arrest scams.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- models ----------
class ScamRequest(BaseModel):
    text: str
    channel: Optional[str] = "Unknown"
    language: Optional[str] = "en"


# ---------- meta ----------
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "kavach-ai", "version": "1.0.0"}


@app.get("/api/stats")
def stats():
    return geo_stats.dashboard_stats()


# ---------- scam / fraud-shield detection ----------
@app.post("/api/scam/analyze")
def analyze_scam(req: ScamRequest):
    result = scam_engine.analyze_text(req.text)
    payload = asdict(result)
    payload["channel"] = req.channel
    payload["advisory"] = advisory.advisory_for(result.risk_level, req.language or "en")
    payload["language"] = req.language or "en"
    return payload


@app.get("/api/scam/samples")
def scam_samples():
    return advisory.SAMPLE_SCENARIOS


@app.get("/api/scam/languages")
def scam_languages():
    return {"languages": advisory.LANGUAGES}


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
    file: UploadFile = File(...),
):
    img_bytes = await file.read()
    feats: List[str] = [f for f in confirmed_features.split(",") if f]
    return counterfeit.screen_note(img_bytes, denomination, feats)


# ---------- geospatial ----------
@app.get("/api/geo/hotspots")
def geo_hotspots():
    return {"hotspots": geo_stats.hotspots()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
