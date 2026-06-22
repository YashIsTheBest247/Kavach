import { useState, useEffect, useRef } from 'react'
import {
  Workflow, Cpu, ShieldAlert, Network, MapPin, FileText,
  CircleSlash, Building2, Phone, Scale, ListChecks,
} from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner, Select } from '../components/ui.jsx'
import { orchestrateFusion } from '../api.js'
import { useLang, t } from '../i18n.js'

const CHANNELS = ['Phone Call', 'Video Call', 'WhatsApp', 'SMS', 'Email']
const LOCATIONS = ['Bengaluru', 'Delhi NCR', 'Mumbai', 'Pune', 'Chennai', 'Kolkata', 'Hyderabad', 'Jaipur']
const PRESET = "I am Inspector Sharma from CBI Mumbai. Your Aadhaar is linked to a money laundering case and there is an arrest warrant against you. You are under digital arrest — keep this video call on and do not tell anyone. Transfer all your funds to this RBI verification account immediately to prove your innocence; it is fully refundable."

const AGENT_ICON = {
  'Triage Agent': ShieldAlert,
  'Orchestrator': Cpu,
  'Network Correlation Agent': Network,
  'Geo-Context Agent': MapPin,
  'Response Orchestrator Agent': FileText,
}
const AGENT_HI = {
  'Triage Agent': 'ट्रायेज एजेंट',
  'Orchestrator': 'ऑर्केस्ट्रेटर',
  'Network Correlation Agent': 'नेटवर्क सहसंबंध एजेंट',
  'Geo-Context Agent': 'भू-संदर्भ एजेंट',
  'Response Orchestrator Agent': 'प्रतिक्रिया ऑर्केस्ट्रेटर एजेंट',
}
const STATUS_STYLE = {
  done: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  escalate: 'text-brand border-brand/40 bg-brand/10',
  halted: 'text-gray-400 border-white/15 bg-white/5',
  'no-match': 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
}

export default function FusionOrchestrator() {
  const [text, setText] = useState(PRESET)
  const [channel, setChannel] = useState('Video Call')
  const [location, setLocation] = useState('Bengaluru')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(0)   // staggered step reveal
  const [err, setErr] = useState(null)
  const timers = useRef([])
  const resultRef = useRef(null)
  useLang()

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const run = async () => {
    setErr(null); setLoading(true); setRes(null); setVisible(0)
    timers.current.forEach(clearTimeout); timers.current = []
    try {
      const d = await orchestrateFusion({ text, channel, location, language: 'en' })
      setRes(d)
      // reveal agents one by one for an "agents working" feel
      d.steps.forEach((_, i) => {
        timers.current.push(setTimeout(() => setVisible(i + 1), 550 * (i + 1)))
      })
    } catch { setErr('Backend not reachable on :8000') }
    finally { setLoading(false) }
  }

  const allRevealed = res && visible >= res.steps.length

  useEffect(() => {
    if (allRevealed) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [allRevealed])

  return (
    <>
      <PageHeader title={t('Threat Fusion', 'थ्रेट फ्यूज़न')} accent={t('Orchestrator', 'ऑर्केस्ट्रेटर')}
        subtitle={t('Agentic multi-source fusion — cooperating agents correlate the scam, fraud ring, geo context & draft the response', 'एजेंटिक बहु-स्रोत फ्यूज़न — सहयोगी एजेंट घोटाला, फ्रॉड रिंग, भू-संदर्भ जोड़ते हैं और प्रतिक्रिया तैयार करते हैं')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        {/* input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <label className="text-sm font-600 text-gray-300 flex items-center gap-2 mb-2">
              <Workflow size={16} className="text-brand" /> {t('Incoming suspicious message', 'आने वाला संदिग्ध संदेश')}
            </label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
              className="w-full bg-ink-900 border border-ink-500 rounded-xl p-4 text-sm focus:outline-none focus:border-brand resize-none" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-xs text-gray-500">{t('Channel', 'चैनल')}</label>
                <Select className="mt-1" value={channel} onChange={setChannel} options={CHANNELS} />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t('Victim location', 'पीड़ित का स्थान')}</label>
                <Select className="mt-1" value={location} onChange={setLocation} options={LOCATIONS} />
              </div>
            </div>
            <button onClick={run} disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-3 rounded transition-colors">
              {loading ? t('Orchestrating…', 'ऑर्केस्ट्रेशन हो रहा है…') : t('Run agent orchestration', 'एजेंट ऑर्केस्ट्रेशन चलाएँ')}
            </button>
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="text-xs font-600 text-gray-400 uppercase tracking-wider mb-3">{t('The agent chain', 'एजेंट श्रृंखला')}</div>
            <div className="space-y-2 text-sm text-gray-400">
              {['Triage Agent', 'Orchestrator', 'Network Correlation Agent', 'Geo-Context Agent', 'Response Orchestrator Agent'].map((a, i) => {
                const Icon = AGENT_ICON[a]
                return (
                  <div key={a} className="flex items-center gap-2">
                    <span className="text-gray-600 font-mono text-xs w-4">{i + 1}</span>
                    <Icon size={15} className="text-brand" /> {t(a, AGENT_HI[a])}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* output */}
        <div ref={resultRef} className="space-y-4 scroll-mt-24">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Dispatching agents…', 'एजेंट भेजे जा रहे हैं…')} /></div>}

          {res && (
            <>
              {/* agent timeline */}
              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white mb-4 flex items-center gap-2">
                  <Cpu size={18} className="text-brand" /> {t('Agent execution trace', 'एजेंट निष्पादन ट्रेस')}
                </h3>
                <div className="space-y-3">
                  {res.steps.slice(0, visible).map((s, i) => {
                    const Icon = AGENT_ICON[s.agent] || Cpu
                    return (
                      <div key={i} className="flex gap-3 rise">
                        <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand/15 text-brand shrink-0">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-600 text-white">{t(s.agent, AGENT_HI[s.agent])}</span>
                            <span className={`text-[10px] uppercase tracking-wide border rounded px-2 py-0.5 ${STATUS_STYLE[s.status] || STATUS_STYLE.done}`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{s.action} · {s.latency_ms}ms</div>
                          <div className="text-sm text-gray-300 mt-1">{s.detail}</div>
                        </div>
                      </div>
                    )
                  })}
                  {visible < res.steps.length && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm pl-11">
                      <span className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      {t('next agent working…', 'अगला एजेंट काम कर रहा है…')}
                    </div>
                  )}
                </div>
              </div>

              {allRevealed && !res.escalated && (
                <div className="rounded-xl border border-white/10 bg-ink-700 p-6 fade-in flex items-start gap-3">
                  <CircleSlash className="text-gray-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <div className="font-display text-lg font-600 text-white">{t('Not escalated', 'एस्केलेट नहीं किया गया')}</div>
                    <p className="text-sm text-gray-400 mt-1">
                      {t('Risk', 'जोखिम')} {res.risk_score}/100 {t('is below the escalation gate, so downstream agents were not mobilised — this is the design that keeps citizen false alarms at zero.', 'एस्केलेशन गेट से कम है, इसलिए डाउनस्ट्रीम एजेंट सक्रिय नहीं हुए — यही डिज़ाइन नागरिक झूठे अलार्म को शून्य रखता है।')}
                    </p>
                  </div>
                </div>
              )}

              {allRevealed && res.escalated && (
                <div className="space-y-4 fade-in">
                  {/* fused score */}
                  <div className="rounded-xl border border-brand/40 bg-gradient-to-br from-brand/10 to-transparent p-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <RiskBadge level={res.fused_threat_level} />
                      {res.matched_ring && <span className="text-xs text-gray-400">{t('linked →', 'जुड़ा →')} <span className="text-brand font-600">{res.matched_ring}</span></span>}
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <span className="font-display text-6xl font-700 text-white leading-none">{res.fused_threat_score}</span>
                      <span className="text-gray-500 mb-1">{t('/ 100 fused threat score', '/ 100 संयुक्त खतरा स्कोर')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('Fusion of scam risk + fraud-ring linkage + geospatial severity', 'घोटाला जोखिम + फ्रॉड-रिंग संबंध + भू-स्थानिक गंभीरता का संयोजन')}{res.ai_used ? t(' + Gemini reasoning', ' + जेमिनी विश्लेषण') : ''}.
                    </p>
                  </div>

                  {/* response bundle */}
                  <ResponseBundle r={res.response} />
                </div>
              )}
            </>
          )}

          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <Workflow size={40} className="mx-auto mb-3 text-gray-600" />
              {t('Run the orchestration to watch the agents correlate signals and draft a coordinated response.', 'एजेंटों को संकेत जोड़ते और समन्वित प्रतिक्रिया तैयार करते देखने हेतु ऑर्केस्ट्रेशन चलाएँ।')}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ResponseBundle({ r }) {
  const m = r.mha_ncrp_report
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-600 text-white flex items-center gap-2">
            <FileText size={18} className="text-brand" /> {t('Drafted response — case', 'तैयार प्रतिक्रिया — केस')} {r.case_id}
          </h3>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <Block icon={ShieldAlert} title={t('Citizen alert', 'नागरिक चेतावनी')}>{r.citizen_alert}</Block>
          <Block icon={Phone} title={t('Telecom action', 'टेलीकॉम कार्रवाई')}>
            {r.telecom_action.recommendation}
            <div className="text-xs text-gray-500 mt-1">Number: {r.telecom_action.number}</div>
          </Block>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
        <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
          <Building2 size={18} className="text-brand" /> {t('MHA / NCRP preliminary report', 'MHA / NCRP प्रारंभिक रिपोर्ट')}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Field k={t('Case ID', 'केस आईडी')} v={m.case_id} />
          <Field k={t('Category', 'श्रेणी')} v={m.category} />
          <Field k={t('Channel', 'चैनल')} v={m.channel} />
          <Field k={t('Linked ring', 'जुड़ी रिंग')} v={m.linked_ring} />
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">{t('Modus operandi', 'कार्यप्रणाली')}</div>
          <p className="text-sm text-gray-300">{m.modus_operandi}</p>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Scale size={12} /> {t('Suggested legal sections', 'सुझाई गई कानूनी धाराएँ')}</div>
          <ul className="space-y-1">
            {m.suggested_legal_sections.map((s, i) => (
              <li key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-brand">§</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><ListChecks size={12} /> {t('Priority actions', 'प्राथमिकता कार्रवाई')}</div>
          <ol className="space-y-1.5">
            {m.priority_actions.map((a, i) => (
              <li key={i} className="text-sm text-gray-200 flex gap-2">
                <span className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-brand text-black text-xs font-700">{i + 1}</span>{a}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

function Block({ icon: Icon, title, children }) {
  return (
    <div className="rounded-lg bg-ink-900 border border-white/8 p-3">
      <div className="text-xs text-gray-400 font-600 flex items-center gap-1.5 mb-1"><Icon size={13} className="text-brand" /> {title}</div>
      <div className="text-gray-200">{children}</div>
    </div>
  )
}

function Field({ k, v }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{k}</div>
      <div className="text-gray-200 font-600">{v}</div>
    </div>
  )
}
