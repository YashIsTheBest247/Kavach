import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ShieldCheck, Phone } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Select } from '../components/ui.jsx'
import { analyzeScam } from '../api.js'

const LANGS = [
  ['en', 'English'], ['hi', 'हिन्दी'], ['ta', 'தமிழ்'],
  ['kn', 'ಕನ್ನಡ'], ['te', 'తెలుగు'], ['bn', 'বাংলা'],
]

const QUICK = [
  'Caller says he is from CBI and I am under digital arrest, must transfer money to verify.',
  'Got SMS: your KYC expired, click link and share OTP to keep account active.',
  'FedEx says my parcel has drugs, police will arrest me unless I pay now.',
]

export default function FraudShield() {
  const [lang, setLang] = useState('en')
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([
    { who: 'bot', kind: 'text', text: 'Namaste 🙏 I am Kavach Shield. Paste any suspicious call, SMS or WhatsApp message and I will tell you in seconds whether it is a scam — and what to do. Pick your language above.' },
  ])
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])

  const send = async (textArg) => {
    const text = (textArg ?? input).trim()
    if (!text || busy) return
    setMsgs((m) => [...m, { who: 'user', kind: 'text', text }])
    setInput('')
    setBusy(true)
    try {
      const r = await analyzeScam(text, 'Citizen', lang)
      setMsgs((m) => [...m, { who: 'bot', kind: 'verdict', data: r }])
    } catch {
      setMsgs((m) => [...m, { who: 'bot', kind: 'text', text: '⚠️ Could not reach the analysis server (start FastAPI on :8000).' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Citizen" accent="Fraud Shield"
        subtitle="Multi-channel, multi-language scam verdicts for the public — instant and guided" />
      <div className="p-8">
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/8 bg-ink-700 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          {/* header */}
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between bg-ink-800">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center w-9 h-9 rounded-full bg-brand/20 text-brand"><ShieldCheck size={18} /></div>
              <div>
                <div className="text-sm font-600 text-white">Kavach Shield</div>
                <div className="text-[11px] text-emerald-400">● online · helpline 1930</div>
              </div>
            </div>
            <Select value={lang} onChange={setLang} className="w-36"
              options={LANGS.map(([c, n]) => ({ value: c, label: n }))} />
          </div>

          {/* messages */}
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {msgs.map((m, i) => <Bubble key={i} m={m} />)}
            {busy && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Bot size={16} /> <span className="animate-pulse">Analysing…</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* quick chips */}
          <div className="px-4 pt-2 flex flex-wrap gap-2 border-t border-white/8">
            {QUICK.map((q, i) => (
              <button key={i} onClick={() => send(q)}
                className="text-[11px] text-gray-400 border border-white/10 rounded-full px-3 py-1 hover:border-brand/40 hover:text-gray-200">
                {q.slice(0, 38)}…
              </button>
            ))}
          </div>

          {/* input */}
          <div className="p-4 flex items-center gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Paste a suspicious message…"
              className="flex-1 bg-ink-900 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
            <button onClick={() => send()} disabled={busy}
              className="grid place-items-center w-11 h-11 rounded-full bg-brand hover:bg-brand-600 disabled:opacity-60 text-black transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Bubble({ m }) {
  if (m.who === 'user') {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%] bg-brand/20 border border-brand/30 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-100">{m.text}</div>
        <div className="grid place-items-center w-8 h-8 rounded-full bg-ink-900 text-gray-400 shrink-0"><User size={15} /></div>
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <div className="grid place-items-center w-8 h-8 rounded-full bg-brand/20 text-brand shrink-0"><Bot size={15} /></div>
      <div className="max-w-[85%]">
        {m.kind === 'text' && (
          <div className="bg-ink-900 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-200">{m.text}</div>
        )}
        {m.kind === 'verdict' && <VerdictCard r={m.data} />}
      </div>
    </div>
  )
}

function VerdictCard({ r }) {
  const accent = r.risk_level === 'CRITICAL' ? 'border-red-500/40' : r.risk_level === 'HIGH' ? 'border-orange-500/40' : r.risk_level === 'MEDIUM' ? 'border-yellow-500/40' : 'border-emerald-500/40'
  return (
    <div className={`bg-ink-900 border ${accent} rounded-2xl rounded-tl-sm p-4 space-y-3`}>
      <div className="flex items-center gap-3">
        <RiskBadge level={r.risk_level} />
        <span className="text-sm text-gray-400">score <span className="text-white font-700">{r.risk_score}</span>/100</span>
      </div>
      <div className="text-sm text-gray-100 font-600">{r.advisory}</div>
      {r.tactics_detected?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.tactics_detected.map((t) => (
            <span key={t} className="text-[10px] bg-red-500/10 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}
      <div className="border-t border-white/8 pt-2 space-y-1">
        {r.recommended_actions.slice(0, 3).map((a, i) => (
          <div key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-brand">{i + 1}.</span>{a}</div>
        ))}
      </div>
      {r.risk_level !== 'LOW' && (
        <a href="tel:1930" className="inline-flex items-center gap-1.5 text-xs bg-red-500/15 text-red-300 border border-red-500/30 rounded-full px-3 py-1.5">
          <Phone size={12} /> Call 1930 now
        </a>
      )}
    </div>
  )
}
