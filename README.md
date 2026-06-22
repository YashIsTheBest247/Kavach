# 🛡️ Kavach AI — Digital Public Safety Intelligence Platform

> **ET AI Hackathon 2026 · Problem Statement #6** — *AI for Digital Public Safety: Defeating Counterfeiting, Fraud & Digital Arrest Scams*

Kavach AI shifts law enforcement, banks and citizens from **reactive case investigation**
to **predictive threat neutralisation** — detecting digital-arrest scams *before money moves*,
mapping fraud networks into court-auditable intelligence packages, screening counterfeit
currency at the point of contact, and shielding citizens in 6 Indian languages.

Built with **React + FastAPI**. The detection engine works on **English, Hinglish and Hindi**
input, the entire UI is **bilingual (English / हिन्दी)** with a live toggle, ships **light & dark
themes**, is fully **responsive**, and carries a live **Economic Times scam-news** ticker + feed.

---

##  What's inside (10 capabilities)

| Module | What it does | Maps to problem-statement bullet |
|---|---|---|
| **Agentic Threat Fusion** | An **orchestrator** that chains cooperating agents (Triage → escalation gate → Network-Correlation → Geo-Context → Response) so the modules act as one brain: on a high-risk scam it links the fraud ring, attaches geo context, computes a **fused threat score** and auto-drafts citizen + telecom + MHA-NCRP responses. Every agent step is auditable. | *Agentic AI for multi-source intelligence fusion* |
| **Digital Arrest Detector** | Real-time, explainable classifier for scam scripts with an **auditable evidence trail** (every flagged phrase + tactic + weight). 11 tactic categories spanning digital-arrest, KYC/phishing, remote-access, prize/advance-fee, account-compromise. | *Digital Arrest Scam Detection & Alerting* |
| **Voice-Spoof / Deepfake Detection** | Explainable audio forensics that flags AI-cloned / synthetic voices used in scam calls; ships **built-in labelled demo clips** (synthetic vs human) so it's demoable without audio files. | *Speech AI (voice spoofing & AI-voice detection)* |
| **Fraud Network Graph** | Clusters victims, mule accounts, spoofed numbers & devices into coordinated rings; emits **intelligence packages** and detects shared infrastructure linking campaigns. | *Fraud Network Graph Intelligence* |
| **Counterfeit Currency Screen** | Image-forensics + security-feature checklist → calibrated FICN risk score with contributing factors. | *Counterfeit Currency Identification Agent* |
| **Citizen Fraud Shield** | Multi-channel, **6-language** conversational assistant giving instant verdicts + guided reporting to 1930 / cybercrime.gov.in. | *Citizen Fraud Shield (Multi-channel)* |
| **Geospatial Crime Map** | Live hotspot map of fraud complaints & FICN seizures for patrol prioritisation. | *Geospatial Crime Pattern Intelligence* |
| **Measured Metrics** | Detectors evaluated on **labelled hold-out sets** → precision / recall / F1 / accuracy + the safety-critical **false-positive & false-negative** rates, with confusion matrices. | *Evaluation Focus (precision/recall, very-low FP)* |
| **Scam News Watch** | Live fraud/cyber-scam/counterfeit coverage from **Economic Times RSS** (keyword-filtered, cached, curated fallback) — plus a scrolling ticker on the landing page. | Situational awareness / threat context |
| **Command Dashboard** | Unified situational picture: detection volumes, rings tracked, ₹ protected, latency, FP rate. | Cross-cutting fusion layer |

### 📊 Measured performance (on the bundled labelled sets — reproducible at `/console/metrics`)
| Detector | Accuracy | Precision | Recall | F1 | False-Positive | False-Negative |
|---|---|---|---|---|---|---|
| **Scam / Digital-Arrest** (n=36) | 91.7% | 100% | 83.3% | 90.9% | **0%** (no citizen false alarms) | 16.7% |
| **Voice-Spoof / Deepfake** (n=40) | 90.0% | 83.3% | 100% | 90.9% | 20% | **0%** (no deepfake missed) |
| **Counterfeit / FICN** (n=30) | 90.0% | 100% | 80.0% | 88.9% | **0%** | 20% (crude fakes caught; high-quality fakes need UV/IR) |

### 🎨 Platform UX
- **Bilingual UI** — English / हिन्दी toggle (in the navbar & every page header) switches all static UI live; citizen advisories render in **6 Indian languages**.
- **Light & dark themes** — CSS-variable-driven, live toggle, no flash; graph/map/charts adapt.
- **Responsive** — mobile drawer sidebar, adaptive layouts, animated route transitions.
- **Live ET ticker** — scrolling scam-news headlines across the top of the landing page.

---

## Run it (2 terminals)

### 1. Backend — FastAPI (port 8000)
```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate      |  macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
API docs auto-served at **http://localhost:8000/docs**

### 2. Frontend — React + Vite (port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** — Vite proxies `/api/*` to the backend automatically.

> Tested on Node 24 / Python 3.14. The landing page even runs a **live scam check** against the real engine.

---

## 🧱 Architecture

```
Browser (React SPA, dark UI)
   │  /api/*  (Vite dev proxy)
   ▼
FastAPI  ──┬── scam_engine.py     rule-weighted, explainable scam classifier
           ├── fraud_graph.py     entity graph + connected-component ring clustering
           ├── counterfeit.py     Pillow image forensics + feature checklist scoring
           ├── advisory.py        6-language citizen advisories + sample scenarios
           ├── geo_stats.py       hotspot geodata + dashboard metrics
           ├── voice_engine.py    audio forensics + labelled demo-clip generation (numpy)
           ├── metrics.py         labelled eval sets → precision/recall/FP/FN
           ├── orchestrator.py    agentic fusion chain (triage→correlate→geo→respond)
           ├── news.py            Economic Times RSS fetch + filter + cache + fallback
           └── llm.py             optional Gemini augmentation (graceful fallback)
```

- **Frontend:** React 18, React Router, Tailwind (CSS-variable theming), Recharts (dashboard),
  `react-force-graph-2d` (network graph), React-Leaflet (crime map), Lucide icons.
  Lightweight stores for **theme** (`theme.js`) and **language** (`i18n.js`).
- **Backend:** FastAPI, Pydantic, Pillow. Pure-Python, deterministic engines → reliable demo,
  no API keys required.
- **AI layer (optional):** **Google Gemini** (`gemini-2.5-flash` via `google-genai`) augments
  the scam detector with intent-level reasoning and *novel-tactic* detection. It's layered ON TOP
  of the rule engine and **degrades gracefully** — no `GEMINI_API_KEY` ⇒ the platform runs on the
  deterministic engine alone, so the demo never breaks.

### Enabling Gemini
```bash
cd backend
cp .env.example .env        # then edit .env
# GEMINI_API_KEY=...   (get one free at https://aistudio.google.com/apikey)
```
In the **Digital Arrest Detector**, toggle **"Gemini AI deep analysis"** before analysing.
The result shows the rule verdict, Gemini's verdict + reasoning + novel tactics, and a
**fused score** (rule 55% / AI 45%). The toggle auto-disables if no key is configured.

---

## API surface
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | health check |
| GET | `/api/stats` | dashboard metrics |
| GET | `/api/news` | live scam/fraud news from Economic Times RSS (filtered, cached, fallback) |
| GET | `/api/llm/status` | whether the Gemini AI layer is configured |
| POST | `/api/scam/analyze` | analyse a message/transcript → risk, tactics, evidence, advisory (+ Gemini if `use_ai:true`) |
| GET | `/api/scam/samples` | sample scam scenarios |
| GET | `/api/fraud/graph` | fraud network nodes + edges |
| GET | `/api/fraud/packages` | clustered ring intelligence packages |
| GET | `/api/counterfeit/features` | security-feature catalogue |
| POST | `/api/counterfeit/screen` | screen an uploaded note image |
| POST | `/api/voice/analyze` | screen an uploaded WAV for synthetic/AI voice |
| GET | `/api/voice/demo?kind=synthetic\|human` | generate + screen a labelled demo clip (returns audio) |
| GET | `/api/metrics` | measured precision/recall/FP/FN on labelled sets |
| POST | `/api/fusion/orchestrate` | run the agentic fusion chain → trace + fused score + drafted response |
| GET | `/api/geo/hotspots` | geospatial crime hotspots |


---

## Scope 
- **Counterfeit screening** is an explainable MVP (phone-photo forensics + security-feature checklist), **not** a UV/IR-hardware + trained-CNN system — clearly disclaimed in-app; high-quality fakes are the measured 20% false-negatives.
- **Voice-spoof** is heuristic audio forensics, not an ASVspoof-grade model; it ships labelled demo clips so the metric is real and reproducible.
- **Fraud-graph & geo data** are realistic **synthetic** datasets modelled on NCRP/RBI reporting patterns — swap in live UPI/CDR/NCRP feeds in production.
- **News** is live ET RSS, keyword-filtered; when ET has no fresh consumer-scam stories (or is unreachable) it shows curated fallback headlines, flagged in the UI.
- **Bilingual UI**: all static UI + citizen advisories switch to Hindi. Some **engine-generated prose** (verdict summaries, factor descriptions, fraud-graph findings) is still emitted in English and would need a backend-localization pass for 100% Hindi.

Helpline **1930** · **cybercrime.gov.in**

---

