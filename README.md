# 🛡️ Kavach AI — Digital Public Safety Intelligence Platform

> **ET AI Hackathon 2026 · Problem Statement #6** — *AI for Digital Public Safety: Defeating Counterfeiting, Fraud & Digital Arrest Scams*

Kavach AI shifts law enforcement, banks and citizens from **reactive case investigation**
to **predictive threat neutralisation** — detecting digital-arrest scams *before money moves*,
mapping fraud networks into court-auditable intelligence packages, screening counterfeit
currency at the point of contact, and shielding citizens in 12 Indian languages.

Built with **React + FastAPI**. The detection engine works on **English, Hinglish and Hindi**
input, the entire UI is **bilingual (English / हिन्दी)** with a live toggle, ships **light & dark
themes**, is fully **responsive**, and carries a live **Economic Times scam-news** ticker + feed.

---

## The Kavach loop: **Detect → Disrupt → Act**

Most tools stop at *detect*. Kavach also **disrupts** the scammer (harvests their intel) and drives a **real-world action** (a filed complaint) — closing the loop from suspicion to enforcement.

### 🔥 Flagship differentiators

| Module | What it does | Why it matters |
|---|---|---|
| **Counter-Intel Honeypot** | An AI persona **bait-talks the scammer**, wastes their time and **extracts their UPI / phone / account / links**, auto-filing every identifier into the crowd fraud DB so one engagement protects everyone. Defence turned offence. | Nobody else fights back — it *generates* intelligence, live. |
| **Video-Call Shield** | Screens the **fake-officer video call** — the flagship digital-arrest vector — frame-by-frame for deepfake signatures, with the caller-verification facts police never give you. | Directly neutralises the exact attack in the problem statement's name. |
| **One-Tap NCRP Complaint** | Turns any detection into a **ready-to-submit cyber-crime complaint** — auto-classified to the right NCRP category + law, first-person narrative, suspect entities, evidence checklist and a tamper-evident PDF. | Closes **detect → act**: the adoption/impact story. |
| **Outbreak Early-Warning** | Fuses live scam-news + crowd reports to detect **which scams are spiking right now** and issues national threat-level alerts. | Prevention *before* the next victim — predictive, not reactive. |

### 🧠 Detection & intelligence engines

| Module | What it does | Maps to problem-statement bullet |
|---|---|---|
| **Agentic Threat Fusion** | An **orchestrator** chaining cooperating agents (Triage → escalation gate → Network-Correlation → Geo-Context → Response) so modules act as one brain: links the fraud ring, attaches geo context, computes a **fused threat score** and auto-drafts citizen + telecom + MHA-NCRP responses. Every step auditable. | *Agentic AI for multi-source intelligence fusion* |
| **Digital Arrest Detector** | Real-time, explainable scam-script classifier with an **auditable evidence trail** (every flagged phrase + tactic + weight) → export a **court-admissible SHA-256 PDF** or file a complaint in one tap. | *Digital Arrest Scam Detection & Alerting* |
| **Voice-Spoof Detection** | Explainable audio forensics flagging AI-cloned / synthetic voices; ships **labelled demo clips** so it's demoable without files. | *Speech AI (voice spoofing & AI-voice detection)* |
| **Deepfake Image Detector** | Explainable image-forensics triage for fake profile photos / forged IDs (EXIF, high-freq detail, generator geometry, noise). | *Deepfake / synthetic-media detection* |
| **Link / QR Phishing Scanner** | Explains the tell-tale signs of a malicious link (IP host, punycode, brand typosquat, credential-bait, shorteners) with weighted factors. | *Phishing / malicious-link detection* |
| **Number / UPI Reputation** | Crowdsourced fraud reports → a live reputation score anyone can look up before trusting a contact; a live community feed. | *Community fraud intelligence* |
| **Fraud Network Graph** | Clusters victims, mules, spoofed numbers & devices into rings; emits **intelligence packages** and shared-infrastructure links. | *Fraud Network Graph Intelligence* |
| **Counterfeit Currency Agent** | Four explainable CV analyses — **microprint**, **security-thread**, **serial-number (RBI format)** and **UV-feature simulation** — + operator checklist → calibrated FICN risk. **All 7 denominations**, deployable on phone / counter / POS. | *Counterfeit Currency Identification Agent* |
| **Citizen Fraud Shield** | **Multi-channel** (Web · Telegram · IVR voice call · installable mobile app) assistant giving instant verdicts + guided 1930/NCRP reporting in **12 Indian languages**. | *Citizen Fraud Shield (Multi-channel)* |
| **Geospatial Crime Map** | Live hotspot map of fraud complaints & FICN seizures for patrol prioritisation. | *Geospatial Crime Pattern Intelligence* |
| **Measured Metrics** | Detectors on **labelled hold-out sets** → precision/recall/F1 + safety-critical FP/FN, with confusion matrices. | *Evaluation Focus (precision/recall, very-low FP)* |

### 📣 Reach, awareness & integration

| Module | What it does |
|---|---|
| **Telegram Fraud Shield bot** | Every Kavach engine inside Telegram — send a message/link/photo/voice-note and get a verdict; menu, PDF reports, EN/हिं, on-demand reels. No app install. |
| **Awareness-Reel Agent** | Autonomously ranks trending ET fraud stories, writes a script (Gemini), narrates it (neural TTS, **EN/Hindi, M/F**), burns subtitles and renders a publish-ready reel — optional YouTube auto-publish + cron. |
| **Scam News Watch** | Live ET-RSS fraud coverage (keyword-filtered, cached, curated fallback) + landing-page ticker. |
| **Partner + Automation APIs** | Two key-protected REST surfaces (embed Kavach detection / run the reel agent) with **per-key rate limiting + a live usage dashboard**. |
| **Command Dashboard** | Unified situational picture: detection volumes, rings tracked, ₹ protected, latency, FP rate. |

### 📊 Measured performance (on the bundled labelled sets — reproducible at `/console/metrics`)
| Detector | Accuracy | Precision | Recall | F1 | False-Positive | False-Negative |
|---|---|---|---|---|---|---|
| **Scam / Digital-Arrest** (n=36) | 91.7% | 100% | 83.3% | 90.9% | **0%** (no citizen false alarms) | 16.7% |
| **Voice-Spoof / Deepfake** (n=40) | 90.0% | 83.3% | 100% | 90.9% | 20% | **0%** (no deepfake missed) |
| **Counterfeit / FICN** (n=30) | 90.0% | 100% | 80.0% | 88.9% | **0%** | 20% (crude fakes caught; high-quality fakes need UV/IR) |

### 🎨 Platform UX
- **Bilingual UI** — English / हिन्दी toggle (in the navbar & every page header) switches all static UI live; citizen advisories render in **12 Indian languages** (English, Hindi, Bengali, Tamil, Telugu, Kannada, Marathi, Gujarati, Malayalam, Punjabi, Odia, Urdu).
- **Installable mobile app (PWA)** — an "Install app" prompt on mobile adds Kavach to the home screen (manifest + service worker).
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
           ├── counterfeit.py     microprint · thread · serial · UV-sim CV analyses (all 7 denoms)
           ├── advisory.py        12-language citizen advisories + sample scenarios
           ├── geo_stats.py       hotspot geodata + dashboard metrics
           ├── voice_engine.py    audio forensics + labelled demo-clip generation (numpy)
           ├── metrics.py         labelled eval sets → precision/recall/FP/FN
           ├── orchestrator.py    agentic fusion chain (triage→correlate→geo→respond)
           ├── news.py            Economic Times RSS fetch + filter + cache + fallback
           ├── llm.py             Gemini augmentation + multi-key ROTATION (graceful fallback)
           │
           ├── honeypot.py        Counter-Intel: bait persona + scammer-intel harvesting
           ├── deepfake_video.py  video-call shield: frame-sampled deepfake screening
           ├── complaint.py       one-tap NCRP complaint draft + tamper-evident PDF
           ├── outbreak.py        scam-outbreak early-warning (news + reports fusion)
           ├── link_scanner.py    explainable phishing URL/QR scanner
           ├── reports.py         crowdsourced fraud reports + number/UPI reputation
           ├── ai_image.py        deepfake / AI-image forensics triage
           ├── report_pdf.py      court-admissible SHA-256 evidence PDF
           ├── video_agent.py     awareness-reel agent (rank→script→TTS→render→publish)
           ├── security.py        two API-key surfaces (partner / automation)
           ├── usage.py           per-key rate limiting + usage dashboard
           ├── telegram_bot.py    full Telegram front-end to every engine (webhook / polling)
           └── ivr.py             Fraud Shield IVR — Twilio-compatible voice webhook (TwiML)
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
| POST | `/api/link/scan` | phishing URL/QR scan → risk + weighted factors |
| POST | `/api/report` · GET `/api/reputation` | crowd-report a fraud contact · look up its reputation |
| GET | `/api/reports/recent` | live community fraud-report feed + stats |
| POST | `/api/deepfake/screen` | screen an image for AI-generation / manipulation |
| POST | `/api/report/scam/pdf` | court-admissible SHA-256 evidence PDF |
| **POST** | **`/api/honeypot/engage`** | **Counter-Intel: advance the honeypot, return bait reply + harvested scammer intel** |
| **POST** | **`/api/deepfake/video`** | **Video-Call Shield: frame-by-frame deepfake screening of a clip** |
| **POST** | **`/api/complaint/draft`** · **`/api/complaint/pdf`** | **one-tap NCRP complaint (JSON draft · ready-to-file PDF)** |
| **GET** | **`/api/outbreak/alerts`** | **scam-outbreak early-warning: spiking scam types + threat level** |
| GET | `/api/usage` | live per-key API usage + rate-limit utilisation |
| GET | `/api/channels` | Fraud Shield channel status (web · telegram · ivr) + 12 languages |
| GET | `/api/scam/languages` | the 12 supported advisory languages |
| POST | `/api/whatsapp/twilio` | WhatsApp auto-check (free Twilio Sandbox → TwiML reply) |
| POST | `/api/ivr/welcome` · `/api/ivr/analyze` | IVR voice webhook (Twilio-compatible TwiML) |
| POST | `/api/automation/*` · `/api/partner/*` | key-protected reel-agent & embeddable-detection surfaces |

> **Telegram:** run `python -m app.telegram_bot` (set `TELEGRAM_BOT_TOKEN`) to expose every engine in chat.
> **IVR:** point a Twilio/Exotel number's voice webhook at `/api/ivr/welcome`.


---

## Scope 
- **Counterfeit screening** runs four explainable CV analyses (microprint, security-thread, RBI serial-format, UV-simulation) + an operator checklist across all 7 denominations — but it is **not** a UV/IR-hardware + trained-CNN system (UV is *simulated* from the photo); clearly disclaimed in-app, and high-quality fakes are the measured ~20% false-negatives.
- **Voice-spoof** is heuristic audio forensics, not an ASVspoof-grade model; it ships labelled demo clips so the metric is real and reproducible.
- **Fraud-graph & geo data** are realistic **synthetic** datasets modelled on NCRP/RBI reporting patterns — swap in live UPI/CDR/NCRP feeds in production.
- **News** is live ET RSS, keyword-filtered; when ET has no fresh consumer-scam stories (or is unreachable) it shows curated fallback headlines, flagged in the UI.
- **Bilingual UI**: all static UI + citizen advisories switch to Hindi. Some **engine-generated prose** (verdict summaries, factor descriptions, fraud-graph findings) is still emitted in English and would need a backend-localization pass for 100% Hindi.
- **Counter-Intel honeypot** never pays and never shares real data — it only stalls the scammer and extracts *their* identifiers; the Gemini persona degrades to a template offline.
- **Video-Call Shield** is frame-level forensics (a triage signal for the video-call vector), not a trained video-deepfake CNN — it pairs the score with the decisive caller-verification advice.
- **One-Tap Complaint** generates a fully-drafted, NCRP-ready complaint + PDF for the citizen to submit; it does **not** auto-file into government systems (no public write API).
- **Outbreak Early-Warning** is indicative trend-detection from live news + crowd reports, not an official government advisory.
- **Fraud Shield channels**: Web, installable PWA and Telegram are live; **WhatsApp** (free Twilio Sandbox — auto-checks any inbound message, reply auto-localized to the sender's script) and **IVR** voice are Twilio-compatible TwiML webhooks that activate when a Twilio number/sandbox is pointed at them — no backend keys or Meta business verification needed. All 12 languages localize the *verdict advisory*; the chat greeting/sample chips are localized too.

Helpline **1930** · **cybercrime.gov.in**

---

