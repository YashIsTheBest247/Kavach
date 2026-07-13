"""
Kavach Fraud Shield — full Telegram front-end.

Brings EVERY Kavach engine to citizens inside Telegram — no app install needed:

  • Scam / digital-arrest text analysis      (+ court-admissible PDF report)
  • Link / QR phishing scan
  • Number / UPI / link reputation lookup     (+ crowd-report a fraud)
  • Deepfake / AI-image screening             (send a photo)
  • Counterfeit currency screening            (send a note photo)
  • Voice-spoof detection                     (send a voice note / audio)
  • Live scam-news watch  &  platform stats
  • Auto-generated awareness reel             (English / Hindi)

It reuses the exact same engines as the web app and REST API, so verdicts match.

Run (separate process):
    set TELEGRAM_BOT_TOKEN=...      (from @BotFather)
    python -m app.telegram_bot
"""
from __future__ import annotations

import asyncio
import os
import time

from app import (scam_engine, advisory, link_scanner, reports, ai_image,
                 counterfeit, voice_engine, news, geo_stats, report_pdf, video_agent)

EMOJI = {"CRITICAL": "🚨", "HIGH": "⚠️", "MEDIUM": "🔎", "LOW": "✅"}


# ----------------------------------------------------------------------------- helpers
def _bar(score: int) -> str:
    filled = max(0, min(10, round(score / 10)))
    return "█" * filled + "░" * (10 - filled)


def _lang(ctx) -> str:
    return (ctx.user_data or {}).get("lang", "en")


def _to_wav(data: bytes) -> bytes:
    """Convert any audio (Telegram voice = OGG/Opus) → 16k mono PCM WAV via bundled ffmpeg."""
    import subprocess
    import tempfile
    import imageio_ffmpeg
    exe = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "in"), os.path.join(d, "out.wav")
        with open(src, "wb") as f:
            f.write(data)
        subprocess.run([exe, "-y", "-i", src, "-ar", "16000", "-ac", "1", dst],
                       capture_output=True)
        with open(dst, "rb") as f:
            return f.read()


# ----------------------------------------------------------------------------- formatters
def fmt_scam(text: str, lang: str = "en") -> str:
    r = scam_engine.analyze_text(text)
    lines = [f"{EMOJI.get(r.risk_level, '❓')} <b>{r.risk_level}</b>  ·  risk {r.risk_score}/100",
             f"<code>{_bar(r.risk_score)}</code>"]
    if r.tactics_detected:
        lines.append("\n<b>Tactics:</b> " + ", ".join(r.tactics_detected[:5]))
    lines.append("\n" + advisory.advisory_for(r.risk_level, lang))
    if r.risk_level in ("CRITICAL", "HIGH"):
        lines.append("\n☎️ Report now: <b>1930</b> · cybercrime.gov.in")
    lines.append("\n<i>Tap 📄 below for a court-admissible PDF.</i>")
    return "\n".join(lines)


def fmt_link(url: str) -> str:
    r = link_scanner.scan(url)
    lines = [f"{EMOJI.get(r['risk_level'], '❓')} <b>{r['verdict']}</b>",
             f"risk {r['risk_score']}/100  <code>{_bar(r['risk_score'])}</code>",
             f"host: <code>{r.get('host', '')}</code>"]
    if r.get("factors"):
        lines.append("\n<b>Why:</b>")
        for f in r["factors"][:6]:
            lines.append(f"• {f['factor']} (+{f['impact']})")
    lines.append("\n" + r["recommended_actions"][0])
    return "\n".join(lines)


def fmt_reputation(value: str) -> str:
    r = reports.reputation(value)
    lines = [f"{EMOJI.get(r['risk_level'], '❓')} <b>{r['verdict']}</b>",
             f"{r['reports']} report(s) · risk {r['risk_score']}/100  <code>{_bar(r['risk_score'])}</code>",
             f"type: {r['kind']}"]
    if r.get("reasons"):
        lines.append("\n<b>Reported for:</b>\n" + "\n".join(f"• {x}" for x in r["reasons"]))
    if r["reports"] == 0:
        lines.append("\nNo reports yet. Use 🚩 Report to warn others if this is a scam.")
    return "\n".join(lines)


def fmt_deepfake(data: bytes) -> str:
    r = ai_image.screen(data)
    if r.get("error"):
        return "Could not read image: " + r["error"]
    lines = [f"{EMOJI.get(r['risk_level'], '❓')} <b>{r['verdict']}</b>",
             f"synthetic likelihood {r['risk_score']}/100  <code>{_bar(r['risk_score'])}</code>",
             f"dimensions: {r['dimensions']}", "\n<b>Signals:</b>"]
    for f in r["factors"]:
        arrow = "▲" if f["direction"] == "raises" else "▼"
        lines.append(f"{arrow} {f['factor']}")
    lines.append("\n<i>" + r["disclaimer"] + "</i>")
    return "\n".join(lines)


def fmt_counterfeit(data: bytes, denom: str = "500") -> str:
    r = counterfeit.screen_note(data, denom, [])
    lvl = r.get("risk_level", "LOW")
    score = r.get("counterfeit_risk_score", 0)
    lines = [f"{EMOJI.get(lvl, '❓')} <b>{r.get('verdict', '')}</b>",
             f"₹{denom} note · risk {score}/100  <code>{_bar(score)}</code>"]
    raised = [f for f in r.get("factors", []) if f.get("direction") == "raises"]
    if raised:
        lines.append("\n<b>Flags:</b>")
        for f in raised[:6]:
            lines.append(f"• {f['factor']} — {f['detail']}")
    lines.append("\n<i>Confirm the security features (thread, watermark, intaglio) by hand — "
                 "this is a triage aid, not legal-tender verification.</i>")
    return "\n".join(lines)


def fmt_voice(data: bytes) -> str:
    try:
        wav = _to_wav(data)
    except Exception as e:
        return f"Could not process audio: {e}"
    r = voice_engine.analyze_bytes(wav)
    if r.get("error"):
        return r["error"]
    lvl = r.get("risk_level", "LOW")
    lines = [f"{EMOJI.get(lvl, '❓')} <b>{r.get('verdict', '')}</b>",
             f"synthetic-voice risk {r.get('synthetic_risk_score', 0)}/100  "
             f"<code>{_bar(r.get('synthetic_risk_score', 0))}</code>"]
    if r.get("factors"):
        lines.append("\n<b>Signals:</b>")
        for f in r["factors"][:6]:
            lab = f.get("factor") or f.get("label") or str(f)
            lines.append(f"• {lab}")
    lines.append("\n<i>" + r.get("disclaimer", "") + "</i>")
    return "\n".join(lines)


def fmt_news() -> str:
    d = news.get_news()
    items = d.get("items", [])[:6]
    lines = ["📰 <b>Scam News Watch</b>" + ("  ·  live" if d.get("live") else "")]
    for it in items:
        lines.append(f"\n• <a href=\"{it['link']}\">{it['title']}</a>")
    return "\n".join(lines) or "No news right now."


def fmt_stats() -> str:
    s = geo_stats.dashboard_stats()
    h, p = s["headline"], s["platform"]
    return ("📊 <b>Kavach — Live Situational Picture</b>\n\n"
            f"• Cybercrime complaints (2023): <b>{h['cybercrime_complaints_2023']}</b>\n"
            f"• Digital-arrest loss (9m 2024): <b>₹{h['digital_arrest_loss_2024_9m_cr']} Cr</b>\n"
            f"• YoY complaint growth: <b>{h['yoy_complaint_growth']}</b>\n\n"
            f"• Scams screened: <b>{p['scams_screened']:,}</b>\n"
            f"• Fraud rings tracked: <b>{p['active_fraud_rings_tracked']}</b>\n"
            f"• Mule accounts flagged: <b>{p['mule_accounts_flagged']:,}</b>\n"
            f"• Rupees protected: <b>₹{p['rupees_protected_cr']} Cr</b>\n"
            f"• Avg detection latency: <b>{p['avg_detection_latency_ms']} ms</b>")


# ----------------------------------------------------------------------------- UI
MENU_HINT = {
    "scam": ("🛡️ <b>Scam Detector</b>", "Send me the suspicious SMS / WhatsApp / call transcript."),
    "link": ("🔗 <b>Link / QR Scanner</b>", "Send the URL (or the link your QR decodes to)."),
    "lookup": ("🔎 <b>Reputation Lookup</b>", "Send a phone number, UPI ID or link to check."),
    "report": ("🚩 <b>Report a Fraud</b>", "Send the number/UPI/link to report (optionally: value | reason)."),
    "deepfake": ("🖼️ <b>Deepfake Image</b>", "Send a photo to screen for AI-generation / manipulation."),
    "counterfeit": ("💵 <b>Counterfeit Note</b>", "Send a clear photo of the banknote (defaults to ₹500)."),
    "voice": ("🎙️ <b>Voice-Spoof</b>", "Send a voice note or audio clip to check for AI-cloned speech."),
}


def _main_menu():
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    rows = [
        [InlineKeyboardButton("🛡️ Scam text", callback_data="mode:scam"),
         InlineKeyboardButton("🔗 Link / QR", callback_data="mode:link")],
        [InlineKeyboardButton("🔎 Number/UPI lookup", callback_data="mode:lookup"),
         InlineKeyboardButton("🚩 Report fraud", callback_data="mode:report")],
        [InlineKeyboardButton("🖼️ Deepfake image", callback_data="mode:deepfake"),
         InlineKeyboardButton("💵 Counterfeit note", callback_data="mode:counterfeit")],
        [InlineKeyboardButton("🎙️ Voice-spoof", callback_data="mode:voice"),
         InlineKeyboardButton("📰 Scam news", callback_data="act:news")],
        [InlineKeyboardButton("📊 Live stats", callback_data="act:stats"),
         InlineKeyboardButton("🎬 Awareness reel", callback_data="act:reel")],
        [InlineKeyboardButton("🌐 EN", callback_data="lang:en"),
         InlineKeyboardButton("🌐 हिं", callback_data="lang:hi"),
         InlineKeyboardButton("ℹ️ Help", callback_data="act:help")],
    ]
    return InlineKeyboardMarkup(rows)


def _pdf_button():
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    return InlineKeyboardMarkup([[InlineKeyboardButton("📄 PDF report", callback_data="act:pdf"),
                                  InlineKeyboardButton("🏠 Menu", callback_data="act:menu")]])


def _menu_button():
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    return InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Menu", callback_data="act:menu")]])


WELCOME = ("🛡️ <b>Kavach Fraud Shield</b>\n\n"
           "Your pocket defence against digital-arrest scams, phishing, deepfakes, "
           "fake notes and cloned voices — every Kavach tool, right here in Telegram.\n\n"
           "Pick a tool below, or just <b>send me anything</b>:\n"
           "• a message → scam check\n"
           "• a link → phishing scan\n"
           "• a photo → deepfake / note check\n"
           "• a voice note → spoof check\n\n"
           "Use /menu anytime · /hi for Hindi replies.")


# ----------------------------------------------------------------------------- main
def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Set TELEGRAM_BOT_TOKEN (from @BotFather) and re-run.")
        return

    from telegram import Update
    from telegram.ext import (Application, CommandHandler, MessageHandler,
                              CallbackQueryHandler, filters, ContextTypes)

    async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(WELCOME, parse_mode="HTML", reply_markup=_main_menu(),
                                        disable_web_page_preview=True)

    async def menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("Choose a Kavach tool:", reply_markup=_main_menu())

    async def set_hi(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        ctx.user_data["lang"] = "hi"
        await update.message.reply_text("ठीक है — अब मैं हिन्दी में सलाह दूँगा।", reply_markup=_main_menu())

    async def set_en(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        ctx.user_data["lang"] = "en"
        await update.message.reply_text("OK — advisories in English now.", reply_markup=_main_menu())

    async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(WELCOME, parse_mode="HTML", reply_markup=_main_menu(),
                                        disable_web_page_preview=True)

    # ---- direct command shortcuts ----
    def _mode_cmd(mode):
        async def h(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
            ctx.user_data["mode"] = mode
            title, hint = MENU_HINT[mode]
            arg = " ".join(ctx.args) if getattr(ctx, "args", None) else ""
            if arg and mode in ("scam", "link", "lookup", "report"):
                await route_text(update, ctx, arg)
            else:
                await update.message.reply_text(f"{title}\n{hint}", parse_mode="HTML")
        return h

    async def news_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(fmt_news(), parse_mode="HTML",
                                        disable_web_page_preview=True, reply_markup=_menu_button())

    async def stats_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(fmt_stats(), parse_mode="HTML", reply_markup=_menu_button())

    async def reel_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await do_reel(update, ctx)

    # ---- routing ----
    async def route_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE, text: str):
        mode = ctx.user_data.get("mode", "scam")
        lang = _lang(ctx)
        if mode == "link" or ("://" in text or (("." in text) and " " not in text.strip() and len(text.split()) == 1)):
            if mode in ("link",) or "://" in text:
                await update.message.reply_text(fmt_link(text), parse_mode="HTML", reply_markup=_menu_button())
                return
        if mode == "lookup":
            await update.message.reply_text(fmt_reputation(text), parse_mode="HTML", reply_markup=_menu_button())
            return
        if mode == "report":
            value, _, reason = text.partition("|")
            res = reports.submit(value.strip(), reason.strip())
            rep = res.get("reputation", {})
            await update.message.reply_text(
                "🚩 <b>Report recorded</b> — thank you for protecting others.\n\n" +
                fmt_reputation(value.strip()), parse_mode="HTML", reply_markup=_menu_button())
            return
        # default: scam text analysis (store for PDF)
        ctx.user_data["last_scam_text"] = text
        await update.message.reply_text(fmt_scam(text, lang), parse_mode="HTML", reply_markup=_pdf_button())

    async def on_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await route_text(update, ctx, update.message.text or "")

    async def on_photo(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        mode = ctx.user_data.get("mode")
        photo = update.message.photo[-1] if update.message.photo else None
        doc = update.message.document
        f = await (photo.get_file() if photo else doc.get_file())
        data = bytes(await f.download_as_bytearray())
        await update.message.chat.send_action("typing")
        if mode == "counterfeit":
            denom = ctx.user_data.get("denom", "500")
            await update.message.reply_text(fmt_counterfeit(data, denom), parse_mode="HTML", reply_markup=_menu_button())
        else:
            await update.message.reply_text(fmt_deepfake(data), parse_mode="HTML", reply_markup=_menu_button())

    async def on_voice(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        v = update.message.voice or update.message.audio
        f = await v.get_file()
        data = bytes(await f.download_as_bytearray())
        await update.message.chat.send_action("typing")
        await update.message.reply_text(fmt_voice(data), parse_mode="HTML", reply_markup=_menu_button())

    async def do_reel(update, ctx):
        lang = _lang(ctx)
        chat = update.effective_chat
        msg = await chat.send_message("🎬 Generating an awareness reel from today's top fraud story — "
                                      "this takes ~1–2 minutes. Please wait…")
        try:
            reel = await asyncio.to_thread(video_agent.run_pipeline, None, "female", lang, False)
        except Exception as e:
            await msg.edit_text(f"Reel generation failed: {e}")
            return
        title = (reel.get("article") or {}).get("title", "")
        narration = (reel.get("script") or {}).get("narration", "")
        cap = f"🎬 <b>{title}</b>\n\n{narration[:700]}"
        mp4 = reel.get("mp4")
        if mp4:
            path = os.path.join(os.path.dirname(os.path.dirname(__file__)), mp4)
            try:
                with open(path, "rb") as fh:
                    await chat.send_video(fh, caption=cap, parse_mode="HTML")
                await msg.delete()
                return
            except Exception:
                pass
        await msg.edit_text(cap + "\n\n<i>(Storyboard ready; run the local render worker for the MP4.)</i>",
                            parse_mode="HTML")

    # ---- inline-button callbacks ----
    async def on_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        q = update.callback_query
        await q.answer()
        kind, _, val = q.data.partition(":")
        if kind == "mode":
            ctx.user_data["mode"] = val
            title, hint = MENU_HINT[val]
            await q.message.reply_text(f"{title}\n{hint}", parse_mode="HTML")
        elif kind == "lang":
            ctx.user_data["lang"] = val
            await q.message.reply_text("भाषा: हिन्दी ✅" if val == "hi" else "Language: English ✅")
        elif kind == "act":
            if val == "news":
                await q.message.reply_text(fmt_news(), parse_mode="HTML",
                                           disable_web_page_preview=True, reply_markup=_menu_button())
            elif val == "stats":
                await q.message.reply_text(fmt_stats(), parse_mode="HTML", reply_markup=_menu_button())
            elif val == "reel":
                await do_reel(update, ctx)
            elif val == "menu":
                await q.message.reply_text("Choose a Kavach tool:", reply_markup=_main_menu())
            elif val == "help":
                await q.message.reply_text(WELCOME, parse_mode="HTML", reply_markup=_main_menu(),
                                           disable_web_page_preview=True)
            elif val == "pdf":
                text = ctx.user_data.get("last_scam_text")
                if not text:
                    await q.message.reply_text("Send a message to analyse first, then tap 📄 PDF report.")
                    return
                from dataclasses import asdict
                r = scam_engine.analyze_text(text)
                payload = asdict(r)
                payload["advisory"] = advisory.advisory_for(r.risk_level, _lang(ctx))
                pdf = report_pdf.scam_report(payload, text)
                import io
                bio = io.BytesIO(pdf); bio.name = "kavach-fraud-report.pdf"
                await q.message.reply_document(bio, filename="kavach-fraud-report.pdf",
                                               caption="📄 Court-admissible report (SHA-256 tamper-evident).")

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("menu", menu))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("hi", set_hi))
    app.add_handler(CommandHandler("en", set_en))
    app.add_handler(CommandHandler("scam", _mode_cmd("scam")))
    app.add_handler(CommandHandler("link", _mode_cmd("link")))
    app.add_handler(CommandHandler("lookup", _mode_cmd("lookup")))
    app.add_handler(CommandHandler("report", _mode_cmd("report")))
    app.add_handler(CommandHandler("deepfake", _mode_cmd("deepfake")))
    app.add_handler(CommandHandler("note", _mode_cmd("counterfeit")))
    app.add_handler(CommandHandler("voice", _mode_cmd("voice")))
    app.add_handler(CommandHandler("news", news_cmd))
    app.add_handler(CommandHandler("stats", stats_cmd))
    app.add_handler(CommandHandler("reel", reel_cmd))
    app.add_handler(CallbackQueryHandler(on_callback))
    app.add_handler(MessageHandler(filters.PHOTO | filters.Document.IMAGE, on_photo))
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, on_voice))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))

    print("Kavach Fraud Shield bot running…  (Ctrl+C to stop)")
    app.run_polling()


# Backwards-compatible helper used elsewhere/tests.
def format_reply(text: str, lang: str = "en") -> str:
    return fmt_scam(text, lang)


if __name__ == "__main__":
    main()
