import { useEffect, useState } from 'react'
import { Zap, FileText, ShieldAlert, ListChecks, Languages } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { analyzeScam, getScamSamples } from '../api.js'

const LANGS = [
  ['en', 'English'], ['hi', 'हिन्दी'], ['ta', 'தமிழ்'],
  ['kn', 'ಕನ್ನಡ'], ['te', 'తెలుగు'], ['bn', 'বাংলা'],
]
const CHANNELS = ['Phone Call', 'Video Call', 'WhatsApp', 'SMS', 'Email']

function Highlighted({ text, spans }) {
  if (!spans?.length) return <p className="whitespace-pre-wrap">{text}</p>
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const out = []
  let cur = 0
  sorted.forEach((s, i) => {
    if (s.start < cur) return
    if (s.start > cur) out.push(<span key={`t${i}`}>{text.slice(cur, s.start)}</span>)
    out.push(
      <mark key={`m${i}`} title={s.category}
        className="bg-red-500/25 text-red-200 rounded px-0.5 border-b-2 border-red-500/60">
        {text.slice(s.start, s.end)}
      </mark>
    )
    cur = s.end
  })
  if (cur < text.length) out.push(<span key="end">{text.slice(cur)}</span>)
  return <p className="whitespace-pre-wrap leading-relaxed">{out}</p>
}

export default function ScamDetector() {
  const [samples, setSamples] = useState([])
  const [text, setText] = useState('')
  const [channel, setChannel] = useState('Video Call')
  const [language, setLanguage] = useState('en')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getScamSamples().then((d) => {
      setSamples(d)
      if (d?.length) setText(d[0].text)
    }).catch(() => {})
  }, [])

  const run = async () => {
    if (!text.trim()) return
    setLoading(true)
    try { setRes(await analyzeScam(text, channel, language)) }
    catch { setRes({ error: 'Backend not reachable on :8000' }) }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title="Digital Arrest" accent="Detector"
        subtitle="Real-time, explainable classification of scam scripts — with an auditable evidence trail" />
      <div className="p-8 grid lg:grid-cols-2 gap-6">
        {/* input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-600 text-gray-300 flex items-center gap-2">
                <FileText size={16} className="text-brand" /> Message / call transcript
              </label>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
              className="w-full bg-ink-900 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-brand resize-none"
              placeholder="Paste the suspicious message or call transcript…" />

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-xs text-gray-500">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)}
                  className="w-full mt-1 bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
                  {CHANNELS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Languages size={12} /> Advisory language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full mt-1 bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
                  {LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </div>
            </div>

            <button onClick={run} disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-3 rounded transition-colors">
              <Zap size={16} /> {loading ? 'Analysing…' : 'Analyse threat'}
            </button>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="text-xs font-600 text-gray-400 uppercase tracking-wider mb-3">Load a sample scenario</div>
            <div className="space-y-2">
              {samples.map((s, i) => (
                <button key={i} onClick={() => { setText(s.text); setChannel(s.channel); setRes(null) }}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-ink-900 border border-white/8 hover:border-brand/40 transition-colors">
                  <div className="text-sm text-gray-200 font-600">{s.title}</div>
                  <div className="text-xs text-gray-500">{s.channel}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* output */}
        <div className="space-y-4">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner /></div>}
          {res?.error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400 text-sm">{res.error}</div>}
          {res && !res.error && !loading && (
            <>
              <div className={`rounded-xl border p-6 ${res.risk_level === 'CRITICAL' ? 'border-red-500/40 bg-red-500/5' : res.risk_level === 'HIGH' ? 'border-orange-500/40 bg-orange-500/5' : 'border-white/8 bg-ink-700'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-xs text-gray-500">confidence {Math.round(res.confidence * 100)}%</span>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <span className="font-display text-6xl font-700 text-white leading-none">{res.risk_score}</span>
                  <span className="text-gray-500 mb-1">/ 100 risk score</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-ink-900 overflow-hidden">
                  <div className={`h-full ${res.risk_score >= 75 ? 'bg-red-500' : res.risk_score >= 50 ? 'bg-orange-500' : res.risk_score >= 25 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${res.risk_score}%` }} />
                </div>
                <p className="text-sm text-gray-300 mt-4">{res.summary}</p>
                <div className="mt-4 rounded-lg bg-ink-900 border border-white/10 p-3 text-sm text-gray-100">
                  {res.advisory}
                </div>
              </div>

              {res.tactics_detected?.length > 0 && (
                <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                  <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
                    <ShieldAlert size={18} className="text-brand" /> Tactics detected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {res.tactics_detected.map((t) => (
                      <span key={t} className="text-xs bg-red-500/10 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white mb-3">Evidence — flagged language</h3>
                <div className="bg-ink-900 border border-white/10 rounded-lg p-4 text-sm text-gray-300 max-h-56 overflow-auto">
                  <Highlighted text={text} spans={res.highlighted} />
                </div>
              </div>

              {res.signals?.length > 0 && (
                <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                  <h3 className="font-display font-600 text-white mb-3">Auditable signal log</h3>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {res.signals.map((sig, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm border-b border-white/5 pb-2">
                        <span className="text-xs font-mono bg-red-500/10 text-red-300 px-2 py-0.5 rounded">"{sig.matched_text}"</span>
                        <div className="min-w-0">
                          <div className="text-gray-200 font-600">{sig.label} <span className="text-gray-500 font-400">· weight {sig.weight}</span></div>
                          <div className="text-gray-500 text-xs">{sig.why}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
                  <ListChecks size={18} className="text-brand" /> Recommended actions
                </h3>
                <ol className="space-y-2">
                  {res.recommended_actions.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-200">
                      <span className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-brand text-black text-xs font-700">{i + 1}</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <ShieldAlert size={40} className="mx-auto mb-3 text-gray-600" />
              Load a sample or paste a message, then hit <span className="text-brand">Analyse threat</span>.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
