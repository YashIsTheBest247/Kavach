import { useEffect, useState } from 'react'
import { FileText, ShieldAlert, ListChecks, Languages, Sparkles, FileDown } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner, Select } from '../components/ui.jsx'
import { analyzeScam, getScamSamples, getLlmStatus, scamReportPdf } from '../api.js'
import { Link } from 'react-router-dom'
import { Gavel } from 'lucide-react'
import { useLang, t } from '../i18n.js'

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

function AIPanel({ ai }) {
  if (!ai.available) {
    return (
      <div className="rounded-xl border border-white/8 bg-ink-700 p-5 text-sm text-gray-400 flex items-start gap-3">
        <Sparkles size={18} className="text-gray-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-gray-300 font-600">Gemini AI layer inactive</div>
          {ai.reason || 'Set GEMINI_API_KEY in backend/.env to enable deep reasoning.'} The verdict above is from the deterministic rule engine.
        </div>
      </div>
    )
  }
  if (ai.error) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 text-sm text-yellow-300">
        Gemini call failed: {ai.error}
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-brand/30 bg-gradient-to-br from-brand/10 to-transparent p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-600 text-white flex items-center gap-2">
          <Sparkles size={18} className="text-brand" /> Gemini AI analysis
        </h3>
        <span className="text-[10px] text-gray-500">{ai.model}</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <RiskBadge level={ai.risk_score >= 75 ? 'CRITICAL' : ai.risk_score >= 50 ? 'HIGH' : ai.risk_score >= 25 ? 'MEDIUM' : 'LOW'} />
        <span className="text-sm text-gray-300">AI score <span className="text-white font-700">{ai.risk_score}</span>/100</span>
        <span className="text-xs text-gray-500">· {ai.scam_type}</span>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">{ai.reasoning}</p>
      {ai.novel_tactics?.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-1.5">Tactics surfaced by reasoning (beyond keyword rules):</div>
          <div className="flex flex-wrap gap-2">
            {ai.novel_tactics.map((t, i) => (
              <span key={i} className="text-xs bg-brand/15 text-brand border border-brand/30 px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}
      {ai.advisory && (
        <div className="mt-3 rounded-lg bg-ink-900 border border-white/10 p-3 text-sm text-gray-100">{ai.advisory}</div>
      )}
    </div>
  )
}

export default function ScamDetector() {
  const [samples, setSamples] = useState([])
  const [text, setText] = useState('')
  const [channel, setChannel] = useState('Video Call')
  const [language, setLanguage] = useState('en')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [useAi, setUseAi] = useState(false)
  const [llm, setLlm] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  useLang()

  const downloadPdf = async () => {
    if (!text.trim()) return
    setPdfLoading(true)
    try {
      const blob = await scamReportPdf(text, channel, language)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'kavach-fraud-report.pdf'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { /* backend unreachable */ }
    finally { setPdfLoading(false) }
  }

  useEffect(() => {
    getScamSamples().then((d) => {
      setSamples(d)
      if (d?.length) setText(d[0].text)
    }).catch(() => {})
    getLlmStatus().then(setLlm).catch(() => setLlm({ available: false }))
  }, [])

  const run = async () => {
    if (!text.trim()) return
    setLoading(true)
    try { setRes(await analyzeScam(text, channel, language, useAi)) }
    catch { setRes({ error: 'Backend not reachable on :8000' }) }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title={t('Digital Arrest', 'डिजिटल अरेस्ट')} accent={t('Detector', 'डिटेक्टर')}
        subtitle={t('Real-time, explainable classification of scam scripts — with an auditable evidence trail', 'घोटाला स्क्रिप्ट का रियल-टाइम, व्याख्यायोग्य वर्गीकरण — एक ऑडिट-योग्य साक्ष्य ट्रेल के साथ')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        {/* input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-600 text-gray-300 flex items-center gap-2">
                <FileText size={16} className="text-brand" /> {t('Message / call transcript', 'संदेश / कॉल ट्रांसक्रिप्ट')}
              </label>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
              className="w-full bg-ink-900 border border-ink-500 rounded-lg p-4 text-sm focus:outline-none focus:border-brand resize-none"
              placeholder={t('Paste the suspicious message or call transcript…', 'संदिग्ध संदेश या कॉल ट्रांसक्रिप्ट पेस्ट करें…')} />

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="h-5 flex items-center gap-1 text-xs text-gray-500 mb-1">{t('Channel', 'चैनल')}</label>
                <Select value={channel} onChange={setChannel} options={CHANNELS} />
              </div>
              <div>
                <label className="h-5 flex items-center gap-1 text-xs text-gray-500 mb-1"><Languages size={12} /> {t('Advisory language', 'सलाह भाषा')}</label>
                <Select value={language} onChange={setLanguage}
                  options={LANGS.map(([c, n]) => ({ value: c, label: n }))} />
              </div>
            </div>

            <label className={`mt-4 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${useAi ? 'border-brand/50 bg-brand/10' : 'border-white/10 bg-ink-900'} ${llm && !llm.available ? 'opacity-60' : ''}`}>
              <span className="flex items-center gap-2 text-sm text-gray-200">
                <Sparkles size={16} className="text-brand" />
                {t('Gemini AI deep analysis', 'जेमिनी AI गहन विश्लेषण')}
                {llm && !llm.available && <span className="text-[10px] text-gray-500">{t('(set GEMINI_API_KEY to enable)', '(सक्षम करने हेतु GEMINI_API_KEY सेट करें)')}</span>}
                {llm?.available && <span className="text-[10px] text-emerald-400">● {llm.model}</span>}
              </span>
              <input type="checkbox" checked={useAi} disabled={llm && !llm.available}
                onChange={(e) => setUseAi(e.target.checked)} className="accent-brand w-4 h-4" />
            </label>

            <button onClick={run} disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-3 rounded transition-colors">
              {loading ? t('Analysing…', 'विश्लेषण हो रहा है…') : t('Analyse threat', 'खतरे का विश्लेषण करें')}
            </button>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="text-xs font-600 text-gray-400 uppercase tracking-wider mb-3">{t('Load a sample scenario', 'एक नमूना परिदृश्य लोड करें')}</div>
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
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  <button onClick={downloadPdf} disabled={pdfLoading}
                    className="w-full inline-flex items-center justify-center gap-2 border border-brand/40 text-brand hover:bg-brand/10 disabled:opacity-60 font-700 py-2.5 rounded transition-colors">
                    <FileDown size={16} />
                    {pdfLoading ? t('Preparing…', 'तैयार…') : t('Evidence PDF', 'साक्ष्य PDF')}
                  </button>
                  <Link to="/console/complaint" state={{ text, channel }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-black font-700 py-2.5 rounded transition-colors">
                    <Gavel size={16} /> {t('File complaint', 'शिकायत दर्ज')}
                  </Link>
                </div>
                <p className="mt-2 text-[11px] text-gray-500 text-center">
                  {t('SHA-256 tamper-evident report · one-tap NCRP / 1930 complaint.', 'SHA-256 छेड़छाड़-प्रमाण रिपोर्ट · वन-टैप NCRP / 1930 शिकायत।')}
                </p>
                {res.fused_risk_score != null && (
                  <div className="mt-3 text-xs text-gray-400">
                    Fused score (rule 55% + AI 45%):{' '}
                    <span className="text-white font-700">{res.fused_risk_score}</span>/100 ·{' '}
                    <span className="text-brand">{res.fused_risk_level}</span>
                  </div>
                )}
              </div>

              {res.ai?.requested && <AIPanel ai={res.ai} />}

              {res.tactics_detected?.length > 0 && (
                <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                  <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
                    <ShieldAlert size={18} className="text-brand" /> {t('Tactics detected', 'पहचानी गई युक्तियाँ')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {res.tactics_detected.map((t) => (
                      <span key={t} className="text-xs bg-red-500/10 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white mb-3">{t('Evidence — flagged language', 'साक्ष्य — चिह्नित भाषा')}</h3>
                <div className="bg-ink-900 border border-white/10 rounded-lg p-4 text-sm text-gray-300 max-h-56 overflow-auto">
                  <Highlighted text={text} spans={res.highlighted} />
                </div>
              </div>

              {res.signals?.length > 0 && (
                <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                  <h3 className="font-display font-600 text-white mb-3">{t('Auditable signal log', 'ऑडिट-योग्य सिग्नल लॉग')}</h3>
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
                  <ListChecks size={18} className="text-brand" /> {t('Recommended actions', 'अनुशंसित कार्रवाई')}
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
              {t('Load a sample or paste a message, then hit', 'एक नमूना लोड करें या संदेश पेस्ट करें, फिर दबाएँ')} <span className="text-brand">{t('Analyse threat', 'खतरे का विश्लेषण')}</span>.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
