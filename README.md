# 🛡️ Kavach AI — Digital Public Safety Intelligence Platform

> **ET AI Hackathon 2026 · Problem Statement #6** — *AI for Digital Public Safety: Defeating Counterfeiting, Fraud & Digital Arrest Scams*

Kavach AI shifts law enforcement, banks and citizens from **reactive case investigation**
to **predictive threat neutralisation** — detecting digital-arrest scams *before money moves*,
mapping fraud networks into court-auditable intelligence packages, screening counterfeit
currency at the point of contact, and shielding citizens in 6 Indian languages.

Built with **React + FastAPI**.

---

## ✨ What's inside (6 capabilities)

| Module | What it does | Maps to problem-statement bullet |
|---|---|---|
| **Digital Arrest Detector** | Real-time, explainable classifier for scam scripts with an **auditable evidence trail** (every flagged phrase + tactic + weight). | *Digital Arrest Scam Detection & Alerting* |
| **Fraud Network Graph** | Clusters victims, mule accounts, spoofed numbers & devices into coordinated rings; emits **intelligence packages** and detects shared infrastructure linking campaigns. | *Fraud Network Graph Intelligence* |
| **Counterfeit Currency Screen** | Image-forensics + security-feature checklist → calibrated FICN risk score with contributing factors. | *Counterfeit Currency Identification Agent* |
| **Citizen Fraud Shield** | Multi-channel, **6-language** conversational assistant giving instant verdicts + guided reporting to 1930 / cybercrime.gov.in. | *Citizen Fraud Shield (Multi-channel)* |
| **Geospatial Crime Map** | Live hotspot map of fraud complaints & FICN seizures for patrol prioritisation. | *Geospatial Crime Pattern Intelligence* |
| **Command Dashboard** | Unified situational picture: detection volumes, rings tracked, ₹ protected, latency, FP rate. | Cross-cutting fusion layer |

### Why the detection engine wins on the rubric
- **Explainable & auditable** — not a black box. Every verdict ships a signal log (matched text, tactic, weight) → defensible for *legal admissibility* (an explicit evaluation focus).
- **Compound-tactic scoring** — the lethal combo (authority impersonation + false accusation + money demand) is boosted, mirroring how real digital-arrest scams escalate.
- **Low false-positive design** — "safe signals" (e.g. *"visit your nearest branch"*) pull the score down; the rubric demands a *very low* citizen false-positive rate.

---

## 🚀 Run it (2 terminals)

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
           └── geo_stats.py       hotspot geodata + dashboard metrics
```

- **Frontend:** React 18, React Router, Tailwind (dark/orange theme), Recharts (dashboard),
  `react-force-graph-2d` (network graph), React-Leaflet (crime map), Lucide icons.
- **Backend:** FastAPI, Pydantic, Pillow. Pure-Python, deterministic engines → reliable demo,
  no API keys required. (An LLM layer can be added on top of the same interfaces.)

---

## 🔌 API surface
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | health check |
| GET | `/api/stats` | dashboard metrics |
| POST | `/api/scam/analyze` | analyse a message/transcript → risk, tactics, evidence, advisory |
| GET | `/api/scam/samples` | sample scam scenarios |
| GET | `/api/fraud/graph` | fraud network nodes + edges |
| GET | `/api/fraud/packages` | clustered ring intelligence packages |
| GET | `/api/counterfeit/features` | security-feature catalogue |
| POST | `/api/counterfeit/screen` | screen an uploaded note image |
| GET | `/api/geo/hotspots` | geospatial crime hotspots |

---

## 🎬 Suggested demo flow (for judges)
1. **Landing → "Analyse threat"** on the preset fake-CBI message → instant CRITICAL verdict.
2. **Console → Digital Arrest Detector** → load *"Fake CBI Digital Arrest"* sample → show highlighted
   evidence, tactic breakdown, auditable signal log, and switch advisory to **हिन्दी**.
3. Run the **"Genuine bank reminder"** sample → scores LOW (proves low false-positive design).
4. **Fraud Network Graph** → point out the **shared mule account** linking Ring A & B → "this is one network".
5. **Counterfeit Screen** → upload a note, untick features → risk jumps; tick them → drops.
6. **Citizen Fraud Shield** → chat a scam in a regional language.
7. **Crime Map** → hotspot bubbles for patrol prioritisation.

---

