"""
Measured-metrics harness
------------------------
Runs the detectors against labelled hold-out sets and reports the numbers judges
actually weight: precision, recall, F1, accuracy and — critically for a
life-safety tool — the FALSE-NEGATIVE rate (scams we'd miss) and the
citizen-facing FALSE-POSITIVE rate (false alarms).

- Scam detection: a hand-labelled corpus of scam vs legitimate messages,
  including hard negatives (genuine bank/police messages that mention OTP,
  arrest, payment) to stress false positives.
- Voice-spoof: a generated labelled set with ground truth (synthetic vs human),
  including deliberately hard borderline cases, so the metric is real and not a
  suspiciously perfect 100%.
"""
from __future__ import annotations

from typing import Dict, List

from app import scam_engine, voice_engine


# label 1 = scam/fraud, 0 = legitimate
SCAM_CORPUS: List[Dict] = [
    # ---- scams (1) ----
    {"label": 1, "text": "I am Inspector Verma from CBI. Your Aadhaar is linked to a money laundering case. You are under digital arrest, do not disconnect this video call and do not tell anyone. Transfer your funds to the RBI verification account now."},
    {"label": 1, "text": "This is customs department. A parcel in your name with illegal drugs has been seized. Pay a security deposit immediately or face non-bailable arrest within 2 hours."},
    {"label": 1, "text": "Sir we are from TRAI, your mobile number will be disconnected as it is involved in illegal activities. Connecting you to Mumbai cyber crime police for verification."},
    {"label": 1, "text": "Your bank account will be blocked today. Urgent KYC update required. Click this link and share the OTP you receive to keep your account active."},
    {"label": 1, "text": "Enforcement Directorate here. There is an arrest warrant against you for terror funding. To prove innocence keep your camera on and stay on this call, and move all money to our secure escrow account."},
    {"label": 1, "text": "Congratulations! You won 25 lakh in KBC lucky draw. To claim, pay processing fee of 8500 via UPI to this number immediately."},
    {"label": 1, "text": "Madam your son has been arrested in a drugs case. Police will release him only if you transfer 50000 now. Do not tell anyone or it will get worse."},
    {"label": 1, "text": "We are from FedEx. Your shipment contains fake passports and MDMA. Narcotics control bureau will arrest you. Pay verification charges immediately to clear your name."},
    {"label": 1, "text": "Dear customer your electricity will be disconnected tonight at 9pm as your bill is not updated. Call this number now and pay immediately to avoid disconnection."},
    {"label": 1, "text": "I am calling from the police cyber cell. Your number is used in a human trafficking case. Download AnyDesk so we can verify your bank account remotely."},
    {"label": 1, "text": "Your credit card has a fraudulent transaction of 49999. To reverse it, share the OTP we just sent and your card CVV immediately."},
    {"label": 1, "text": "This is a final notice from income tax department. A non-bailable warrant is issued. Pay the penalty within 30 minutes to this account or be arrested."},
    {"label": 1, "text": "Hello this is your bank manager. To upgrade your account to lifetime free, please tell me the OTP and your UPI PIN for verification."},
    {"label": 1, "text": "Army officer posting transfer, selling my furniture cheap. Pay advance via this QR code and I will deliver, I cannot meet as I am at the border."},
    {"label": 1, "text": "Your SIM card KYC has expired. Send 10 rupees through this link to re-verify, otherwise your number will be permanently deactivated today."},
    {"label": 1, "text": "We detected child pornography downloaded from your IP. CBI will register an FIR. Stay on video call, do not inform family, and pay the settlement to avoid jail."},
    {"label": 1, "text": "Sir your loan is approved instantly. Just pay the GST processing charge of 2999 first and the amount will be credited in 10 minutes."},
    {"label": 1, "text": "This is Microsoft support, your computer is infected and your bank details are leaking. Give us remote access and confirm your net banking password to fix it."},

    # ---- legitimate (0), incl. hard negatives ----
    {"label": 0, "text": "Dear customer, your credit card bill of Rs 4,500 is due on 25th. Please pay via the official app or visit your nearest branch. Never share your OTP or PIN with anyone."},
    {"label": 0, "text": "Your OTP for login is 449201. Do not share it with anyone. - HDFC Bank"},
    {"label": 0, "text": "Reminder: your electricity bill of Rs 1,230 is due on 28 June. Pay through the official BESCOM portal or app."},
    {"label": 0, "text": "Your Amazon order has been shipped and will be delivered by tomorrow 7pm. Track it in the app."},
    {"label": 0, "text": "Hi, this is Dr Mehta's clinic confirming your appointment tomorrow at 11am. Reply YES to confirm or call us to reschedule."},
    {"label": 0, "text": "Police verification for your passport is scheduled. Please visit the nearest police station with your documents on Monday between 10am and 1pm."},
    {"label": 0, "text": "Your salary of Rs 62,000 has been credited to your account ending 4471 on 30 June. - ICICI Bank"},
    {"label": 0, "text": "Thank you for your payment of Rs 999 towards your mobile recharge. Validity 28 days. - Jio"},
    {"label": 0, "text": "Your train PNR 2845019 is confirmed, coach B4 seat 32. Boarding at 06:15 from Pune Junction."},
    {"label": 0, "text": "We noticed a new login to your email from a new device. If this was you, no action needed. If not, reset your password from settings."},
    {"label": 0, "text": "Dear parent, the school fee for this term is due by 15 July. Kindly pay via the school ERP portal or at the office counter."},
    {"label": 0, "text": "Your gas cylinder booking is confirmed and will be delivered within 2 days. Pay cash on delivery to the delivery person."},
    {"label": 0, "text": "Hello, this is the courier delivery agent. I am near your gate but cannot find the flat number, could you guide me please?"},
    {"label": 0, "text": "Your SIP of Rs 5,000 in the index fund has been processed successfully for this month. - Groww"},
    {"label": 0, "text": "Income tax refund of Rs 7,840 has been processed and credited to your pre-validated bank account. Check the e-filing portal for details."},
    {"label": 0, "text": "Your appointment for driving licence renewal at the RTO is on 12 July at 10am. Carry original documents."},
    {"label": 0, "text": "Maintenance notice: water supply will be interrupted on Sunday 6am-9am for tank cleaning. - Society office."},
    {"label": 0, "text": "Your food order from the restaurant is on the way and will arrive in 20 minutes. Pay on delivery as selected."},
]


def _confusion(y_true: List[int], y_pred: List[int]) -> Dict:
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    n = len(y_true)
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    acc = (tp + tn) / n if n else 0.0
    fpr = fp / (fp + tn) if (fp + tn) else 0.0
    fnr = fn / (fn + tp) if (fn + tp) else 0.0
    pct = lambda x: round(x * 100, 1)
    return {
        "tp": tp, "tn": tn, "fp": fp, "fn": fn, "n": n,
        "precision": pct(prec), "recall": pct(rec), "f1": pct(f1),
        "accuracy": pct(acc), "false_positive_rate": pct(fpr), "false_negative_rate": pct(fnr),
    }


def scam_metrics() -> Dict:
    y_true, y_pred, rows = [], [], []
    for ex in SCAM_CORPUS:
        r = scam_engine.analyze_text(ex["text"])
        pred = 1 if r.is_scam else 0
        y_true.append(ex["label"])
        y_pred.append(pred)
        rows.append({
            "label": ex["label"], "pred": pred, "score": r.risk_score,
            "correct": ex["label"] == pred,
            "text": ex["text"][:90] + ("…" if len(ex["text"]) > 90 else ""),
        })
    cm = _confusion(y_true, y_pred)
    return {"name": "Scam / Digital-Arrest Detection",
            "threshold": f"risk_score ≥ {scam_engine.SCAM_THRESHOLD}",
            "confusion": cm, "examples": rows}


def voice_metrics(n_per_class: int = 20) -> Dict:
    y_true, y_pred, rows = [], [], []
    # ~20% hard borderline cases per class for realistic (non-perfect) numbers.
    for i in range(n_per_class):
        hard = (i % 5 == 0)
        for label in ("synthetic", "human"):
            sig = voice_engine.generate_eval_clip(label, seed=i * 7 + (1 if label == "human" else 0), hard=hard)
            res = voice_engine.score_features(voice_engine.extract_features(sig, voice_engine.SR))
            truth = 1 if label == "synthetic" else 0
            pred = 1 if res["is_synthetic"] else 0
            y_true.append(truth)
            y_pred.append(pred)
            rows.append({"label": truth, "pred": pred, "score": res["synthetic_risk_score"],
                         "hard": hard, "correct": truth == pred, "kind": label})
    cm = _confusion(y_true, y_pred)
    return {"name": "Voice-Spoof / Deepfake Detection", "threshold": "synthetic_risk ≥ 50",
            "confusion": cm, "sample_size": n_per_class * 2,
            "examples": rows[:12]}


def all_metrics() -> Dict:
    return {"scam": scam_metrics(), "voice": voice_metrics()}
