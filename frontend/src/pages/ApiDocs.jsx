import { useState, useEffect } from 'react'
import { Plug, ShieldCheck, Film, KeyRound, Copy, Check, Users, Activity, Gauge, RefreshCw } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { getUsage } from '../api.js'
import { useLang, t } from '../i18n.js'

const BASE = (import.meta.env.VITE_API_URL || `${window.location.origin}/api`).replace(/\/$/, '')

function Code({ children }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200) })
  }
  return (
    <div className="relative group">
      <pre className="bg-ink-900 border border-white/10 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto font-mono whitespace-pre">{children}</pre>
      <button onClick={copy} className="absolute top-2 right-2 text-gray-500 hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

function Endpoint({ method, path, desc }) {
  const c = { GET: 'text-emerald-400 border-emerald-500/30', POST: 'text-brand border-brand/40' }[method]
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5">
      <span className={`shrink-0 text-[10px] font-700 border rounded px-2 py-0.5 ${c}`}>{method}</span>
      <code className="text-xs text-gray-200 font-mono">{path}</code>
      <span className="text-xs text-gray-500 ml-auto text-right">{desc}</span>
    </div>
  )
}

export default function ApiDocs() {
  const [tab, setTab] = useState('partner')
  useLang()

  return (
    <>
      <PageHeader title={t('API &', 'API और')} accent={t('Integrations', 'इंटीग्रेशन')}
        subtitle={t('Two independent REST surfaces — embed Kavach detection, or run the awareness automation agent',
                    'दो स्वतंत्र REST सतहें — Kavach डिटेक्शन जोड़ें, या जागरूकता ऑटोमेशन एजेंट चलाएँ')} />
      <div className="p-4 md:p-8 max-w-4xl space-y-6">
        {/* base + auth */}
        <div className="rounded-xl border border-white/8 bg-ink-700 p-5 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Base URL</div>
            <code className="text-sm text-brand font-mono break-all">{BASE}</code>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><KeyRound size={12} /> Auth</div>
            <p className="text-sm text-gray-300">Send header <code className="text-brand">X-API-Key: &lt;key&gt;</code>. Each surface has its own key.</p>
          </div>
        </div>

        <UsagePanel />

        {/* tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('partner')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 border transition-colors ${tab === 'partner' ? 'bg-brand/15 text-brand border-brand/40' : 'text-gray-400 border-white/10 hover:text-white'}`}>
            <ShieldCheck size={16} /> {t('Embed Kavach Detection', 'Kavach डिटेक्शन जोड़ें')}
          </button>
          <button onClick={() => setTab('automation')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 border transition-colors ${tab === 'automation' ? 'bg-brand/15 text-brand border-brand/40' : 'text-gray-400 border-white/10 hover:text-white'}`}>
            <Film size={16} /> {t('Awareness Agent', 'जागरूकता एजेंट')}
          </button>
          <button onClick={() => setTab('citizen')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 border transition-colors ${tab === 'citizen' ? 'bg-brand/15 text-brand border-brand/40' : 'text-gray-400 border-white/10 hover:text-white'}`}>
            <Users size={16} /> {t('Citizen Tools', 'नागरिक उपकरण')}
          </button>
        </div>

        {tab === 'partner' ? <Partner /> : tab === 'automation' ? <Automation /> : <Citizen />}
      </div>
    </>
  )
}

function UsagePanel() {
  const [u, setU] = useState(null)
  const load = () => getUsage().then(setU).catch(() => setU({ error: true }))
  useEffect(() => {
    load()
    const iv = setInterval(load, 5000)   // live-refresh every 5s
    return () => clearInterval(iv)
  }, [])

  if (!u || u.error) return null
  return (
    <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-600 text-white flex items-center gap-2">
          <Activity size={18} className="text-brand" /> {t('Live API usage', 'लाइव API उपयोग')}
        </h3>
        <button onClick={load} className="text-gray-400 hover:text-brand" title="Refresh"><RefreshCw size={15} /></button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          [t('Total calls', 'कुल कॉल'), u.total_calls],
          [t('Active keys', 'सक्रिय कीज़'), u.active_keys],
          [t('Rate limit', 'दर सीमा'), `${u.rate_limit_per_window}/${u.window_seconds}s`],
          [t('Rejected (429)', 'अस्वीकृत (429)'), u.total_rejected],
        ].map(([label, val], i) => (
          <div key={i} className="rounded-lg bg-ink-900 border border-white/8 p-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
            <div className="font-display text-xl font-700 text-white mt-0.5">{val}</div>
          </div>
        ))}
      </div>
      {u.keys?.length ? (
        <div className="space-y-2">
          {u.keys.map((k, i) => (
            <div key={i} className="rounded-lg bg-ink-900 border border-white/8 p-3">
              <div className="flex items-center justify-between gap-3">
                <code className="text-xs text-brand font-mono">{k.key}</code>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Gauge size={12} /> {k.calls_last_window}/{k.rate_limit} · {k.total_calls} {t('total', 'कुल')}
                  {k.rejected > 0 && <span className="text-red-400">· {k.rejected} 429</span>}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-ink-500 overflow-hidden">
                <div className={`h-full ${k.utilization >= 0.8 ? 'bg-red-500' : k.utilization >= 0.5 ? 'bg-orange-500' : 'bg-brand'}`}
                  style={{ width: `${Math.round(k.utilization * 100)}%` }} />
              </div>
              {Object.keys(k.top_endpoints || {}).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(k.top_endpoints).map(([ep, n]) => (
                    <span key={ep} className="text-[10px] font-mono text-gray-400 bg-white/5 border border-white/8 rounded px-1.5 py-0.5">{ep} · {n}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('No API calls yet — hit a keyed endpoint below to see it here live.', 'अभी कोई API कॉल नहीं — नीचे कोई कीड एंडपॉइंट कॉल करें और यहाँ लाइव देखें।')}</p>
      )}
    </div>
  )
}

function Card({ children }) {
  return <div className="rounded-xl border border-white/8 bg-ink-700 p-5 space-y-3">{children}</div>
}
function H({ icon: Icon, children }) {
  return <h3 className="font-display font-600 text-white flex items-center gap-2">{Icon && <Icon size={18} className="text-brand" />}{children}</h3>
}

function Partner() {
  return (
    <div className="space-y-5">
      <Card>
        <H icon={Plug}>Embed Kavach Detection in any application</H>
        <p className="text-sm text-gray-400">
          Add real-time scam, voice-spoof and counterfeit detection to your product with a single API key.
          Demo key: <code className="text-brand">kavach-partner-demo</code> (set <code>PARTNER_API_KEYS</code> in production).
        </p>
        <div className="mt-2">
          <Endpoint method="POST" path="/partner/scam/analyze" desc="text → risk, tactics, advisory" />
          <Endpoint method="POST" path="/partner/voice/analyze" desc="WAV → synthetic-voice risk" />
          <Endpoint method="POST" path="/partner/counterfeit/screen" desc="note image → FICN risk" />
          <Endpoint method="GET" path="/partner/health" desc="auth check" />
        </div>
      </Card>

      <Card>
        <H>Example — analyse a message</H>
        <Code>{`curl -X POST ${BASE}/partner/scam/analyze \\
  -H "X-API-Key: kavach-partner-demo" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"CBI digital arrest, transfer funds now","language":"en"}'`}</Code>
        <div className="text-xs text-gray-500">Response (excerpt)</div>
        <Code>{`{
  "risk_score": 100,
  "risk_level": "CRITICAL",
  "is_scam": true,
  "tactics_detected": ["Authority Impersonation", "'Digital Arrest' Confinement", ...],
  "advisory": "🚨 SCAM ALERT: ...",
  "recommended_actions": ["DISCONNECT the call now.", ...]
}`}</Code>
      </Card>

      <Card>
        <H>JavaScript</H>
        <Code>{`const res = await fetch("${BASE}/partner/scam/analyze", {
  method: "POST",
  headers: { "X-API-Key": "kavach-partner-demo", "Content-Type": "application/json" },
  body: JSON.stringify({ text: message, language: "en" })
});
const verdict = await res.json();`}</Code>
      </Card>
    </div>
  )
}

function Citizen() {
  return (
    <div className="space-y-5">
      <Card>
        <H icon={Users}>Open citizen-safety endpoints</H>
        <p className="text-sm text-gray-400">
          Keyless, same-origin endpoints powering the in-app citizen tools — link/QR phishing checks,
          crowdsourced number/UPI reputation, deepfake-image triage and a court-admissible PDF report.
        </p>
        <div className="mt-2">
          <Endpoint method="POST" path="/link/scan" desc="url → phishing risk + factors" />
          <Endpoint method="GET" path="/reputation?value=" desc="number/UPI/link reputation" />
          <Endpoint method="POST" path="/report" desc="crowd-report a fraud contact" />
          <Endpoint method="GET" path="/reports/recent" desc="live community feed + stats" />
          <Endpoint method="POST" path="/deepfake/screen" desc="image → AI-generated likelihood" />
          <Endpoint method="POST" path="/report/scam/pdf" desc="analysis → tamper-evident PDF" />
        </div>
      </Card>

      <Card>
        <H>Example — scan a suspicious link</H>
        <Code>{`curl -X POST ${BASE}/link/scan \\
  -H "Content-Type: application/json" \\
  -d '{"url":"http://sbi-kyc-verify.xyz/login@secure"}'`}</Code>
        <div className="text-xs text-gray-500">Response (excerpt)</div>
        <Code>{`{
  "risk_score": 66,
  "risk_level": "HIGH",
  "verdict": "LIKELY PHISHING - DO NOT OPEN",
  "factors": [ { "factor": "Brand impersonation", "impact": 22, ... } ],
  "recommended_actions": [ "Do NOT enter any login, OTP, card or UPI details.", ... ]
}`}</Code>
      </Card>

      <Card>
        <H>Example — look up a number's reputation</H>
        <Code>{`curl "${BASE}/reputation?value=%2B919821000001"`}</Code>
        <div className="text-xs text-gray-500">Bots too — the Telegram Fraud Shield reuses the same engine</div>
        <Code>{`# Run the citizen fraud-shield bot (separate process)
export TELEGRAM_BOT_TOKEN=...   # from @BotFather
python -m app.telegram_bot`}</Code>
      </Card>
    </div>
  )
}

function Automation() {
  return (
    <div className="space-y-5">
      <Card>
        <H icon={Film}>Awareness-Reel Automation Agent</H>
        <p className="text-sm text-gray-400">
          Ranks trending Economic Times cyber-fraud stories and turns the top one into a narrated,
          subtitled reel (Gemini script · Pexels visuals · Kokoro TTS · ffmpeg render).
          A cron can run it automatically. Demo key: <code className="text-brand">kavach-automation-demo</code>.
        </p>
        <div className="mt-2">
          <Endpoint method="GET" path="/automation/rank" desc="ranked cyber-fraud articles" />
          <Endpoint method="POST" path="/automation/generate" desc="build a reel (voice, link, publish)" />
          <Endpoint method="GET" path="/automation/reels" desc="list generated reels" />
          <Endpoint method="GET" path="/automation/reels/{id}" desc="full manifest" />
          <Endpoint method="GET" path="/automation/reels/{id}/video" desc="download MP4" />
          <Endpoint method="POST" path="/automation/reels/{id}/publish" desc="publish to YouTube" />
        </div>
      </Card>

      <Card>
        <H>Example — rank & generate</H>
        <Code>{`# 1) Rank trending ET cyber-fraud stories
curl ${BASE}/automation/rank -H "X-API-Key: kavach-automation-demo"

# 2) Generate a reel (female | male voice; optional publish)
curl -X POST ${BASE}/automation/generate \\
  -H "X-API-Key: kavach-automation-demo" \\
  -H "Content-Type: application/json" \\
  -d '{"voice":"female","publish":false}'`}</Code>
        <div className="text-xs text-gray-500">Response (excerpt)</div>
        <Code>{`{
  "id": "reel-1783964574",
  "status": "storyboard_ready",       // or "rendered" when the local worker runs
  "article": { "title": "...", "link": "https://economictimes...", "score": 31.0 },
  "script": { "narration": "...", "segments": [...], "ai_written": true },
  "storyboard": [ { "url": "https://images.pexels.com/..." } ],
  "subtitles_srt": "media/reels/reel-.../subtitles.srt",
  "mp4": null
}`}</Code>
      </Card>

      <Card>
        <H>Fully automated loop (cron → generate → YouTube)</H>
        <ul className="text-sm text-gray-400 space-y-1.5 list-disc pl-5">
          <li><b>Cron</b>: <code className="text-brand">ENABLE_AUTOMATION_CRON=1</code> — on a schedule (<code>AUTOMATION_CRON</code>, crontab) it picks the top story and generates a reel automatically.</li>
          <li><b>Voice</b>: <code>{'{"voice":"female"}'}</code> or <code>{'"male"'}</code> — server render uses Kokoro (af_heart / am_adam); the in-app player also picks a matching browser voice.</li>
          <li><b>Local render</b> (for the MP4): <code>pip install kokoro soundfile moviepy</code> + ffmpeg, plus <code>PEXELS_API_KEY</code> &amp; <code>GEMINI_API_KEY</code>.</li>
          <li><b>YouTube auto-publish</b>: one-time OAuth (<code>python -m app.youtube_upload</code>), then <code>ENABLE_YOUTUBE_UPLOAD=1</code>. The cron uploads each rendered reel and stores its <code>youtube_url</code>. Publish manually via <code>POST /automation/reels/{'{id}'}/publish</code>.</li>
        </ul>
      </Card>
    </div>
  )
}
