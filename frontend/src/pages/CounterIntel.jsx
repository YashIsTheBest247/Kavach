import { useEffect, useRef, useState } from 'react'
import {
  Bot, Send, ShieldAlert, Crosshair, Phone, AtSign, Link2, Landmark,
  Sparkles, UserRound, Skull, Trash2,
} from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { Select, Spinner } from '../components/ui.jsx'
import { honeypotPersonas, honeypotEngage } from '../api.js'
import { useLang, t } from '../i18n.js'

const OPENERS = [
  'This is Inspector Sharma from CBI. Your Aadhaar is linked to a money-laundering case. You are under digital arrest. Transfer ₹50,000 to UPI verify@okaxis now or we send police.',
  'Congratulations! Your number won ₹25 lakh in KBC lottery. To claim, pay ₹4,999 processing fee to 9812345678 via PhonePe.',
  'Sir your electricity will be disconnected tonight. Update immediately, call our officer at +91 98200 11223 and pay on this link http://bses-update.xyz.',
]

function IntelRow({ icon: Icon, label, items }) {
  if (!items?.length) return null
  return (
    <div className="flex items-start gap-2.5 text-sm border-b border-white/5 pb-2">
      <span className="grid place-items-center w-7 h-7 shrink-0 rounded-lg bg-red-500/10 text-red-300"><Icon size={14} /></span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {items.map((v, i) => (
            <code key={i} className="text-xs bg-ink-900 border border-red-500/30 text-red-200 rounded px-1.5 py-0.5 break-all">{v}</code>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CounterIntel() {
  const [personas, setPersonas] = useState([])
  const [persona, setPersona] = useState('confused_elder')
  const [conv, setConv] = useState([])
  const [input, setInput] = useState(OPENERS[0])
  const [loading, setLoading] = useState(false)
  const [intel, setIntel] = useState({ upis: [], phones: [], accounts: [], links: [] })
  const [tactics, setTactics] = useState([])
  const [reported, setReported] = useState([])
  const [engine, setEngine] = useState(null)
  const feedRef = useRef(null)
  const lang = useLang()

  useEffect(() => { honeypotPersonas().then((d) => setPersonas(d.personas)).catch(() => {}) }, [])
  useEffect(() => { feedRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }) }, [conv, loading])

  const merge = (h) => setIntel((cur) => {
    const u = (a, b) => Array.from(new Set([...(a || []), ...(b || [])]))
    return { upis: u(cur.upis, h.upis), phones: u(cur.phones, h.phones),
             accounts: u(cur.accounts, h.accounts), links: u(cur.links, h.links) }
  })

  const send = async () => {
    if (!input.trim() || loading) return
    const next = [...conv, { role: 'scammer', text: input.trim() }]
    setConv(next); setInput(''); setLoading(true)
    try {
      const r = await honeypotEngage(next, persona, lang)
      setConv([...next, { role: 'victim', text: r.reply }])
      merge(r.harvested); setEngine(r.engine)
      setTactics((cur) => Array.from(new Set([...cur, ...(r.tactics || [])])))
      setReported((cur) => Array.from(new Set([...cur, ...(r.reported || [])])))
    } catch {
      setConv([...next, { role: 'victim', text: '(backend not reachable on :8000)' }])
    } finally { setLoading(false) }
  }

  const reset = () => { setConv([]); setIntel({ upis: [], phones: [], accounts: [], links: [] }); setTactics([]); setReported([]) }
  const intelCount = intel.upis.length + intel.phones.length + intel.accounts.length + intel.links.length

  return (
    <>
      <PageHeader title={t('Counter-Intel', 'काउंटर-इंटेल')} accent={t('Scammer Honeypot', 'स्कैमर हनीपॉट')}
        subtitle={t('An AI persona bait-talks the scammer, wastes their time and harvests their UPI, number & accounts into the fraud database — defence turned offence',
          'एक AI किरदार स्कैमर को उलझाकर उसका समय बर्बाद करता है और उसकी UPI, नंबर व खाते फ्रॉड डेटाबेस में दर्ज करता है — बचाव बना आक्रमण')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-3 gap-6">
        {/* chat */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-4 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1"><UserRound size={14} /> {t('Persona', 'किरदार')}</span>
            <div className="min-w-[220px]">
              <Select value={persona} onChange={setPersona}
                options={personas.map((p) => ({ value: p.key, label: p.key.replace('_', ' ') }))} />
            </div>
            {engine && <span className="text-[10px] text-gray-500 flex items-center gap-1 ml-auto">
              <Sparkles size={11} className="text-brand" /> {engine === 'gemini' ? 'Gemini persona' : 'template persona'}</span>}
            <button onClick={reset} className="text-xs text-gray-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={13} /> {t('Reset', 'रीसेट')}</button>
          </div>

          <div ref={feedRef} className="rounded-xl border border-white/8 bg-ink-800 p-4 h-[420px] overflow-y-auto space-y-3">
            {conv.length === 0 && (
              <div className="h-full grid place-items-center text-center text-gray-500 text-sm px-6">
                <div>
                  <Skull size={38} className="mx-auto mb-3 text-gray-600" />
                  {t('Paste what the scammer said below. Kavach will reply as a believable target, keep them talking, and extract every payment detail they leak.',
                     'नीचे स्कैमर का संदेश डालें। कवच एक विश्वसनीय शिकार बनकर जवाब देगा, उन्हें उलझाए रखेगा और उनके हर भुगतान विवरण निकालेगा।')}
                </div>
              </div>
            )}
            {conv.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'scammer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'scammer'
                    ? 'bg-red-500/10 border border-red-500/25 text-red-100 rounded-tl-sm'
                    : 'bg-brand/15 border border-brand/30 text-gray-100 rounded-tr-sm'}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${m.role === 'scammer' ? 'text-red-400' : 'text-brand'}`}>
                    {m.role === 'scammer' ? <><Skull size={11} /> {t('Scammer', 'स्कैमर')}</> : <><Bot size={11} /> {t('Kavach honeypot', 'कवच हनीपॉट')}</>}
                  </div>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-end"><div className="bg-brand/10 border border-brand/20 rounded-2xl px-4 py-2.5"><Spinner label={t('Baiting…', 'फँसाया जा रहा है…')} /></div></div>}
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-3">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              className="w-full bg-ink-900 border border-ink-500 rounded-lg p-3 text-sm focus:outline-none focus:border-brand resize-none"
              placeholder={t("Paste the scammer's next message…", 'स्कैमर का अगला संदेश डालें…')} />
            <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                {OPENERS.map((o, i) => (
                  <button key={i} onClick={() => setInput(o)}
                    className="text-[11px] border border-white/10 text-gray-400 hover:text-white hover:border-brand/40 rounded px-2 py-1">
                    {t('Sample', 'नमूना')} {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={send} disabled={loading}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 px-5 py-2 rounded transition-colors">
                <Send size={15} /> {t('Bait', 'फँसाएँ')}
              </button>
            </div>
          </div>
        </div>

        {/* harvested intel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-brand/30 bg-gradient-to-br from-brand/10 to-transparent p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-600 text-white flex items-center gap-2"><Crosshair size={18} className="text-brand" /> {t('Harvested Intel', 'एकत्रित खुफ़िया')}</h3>
              <span className="font-display text-3xl font-700 text-brand">{intelCount}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('Identifiers extracted from the scammer', 'स्कैमर से निकाले गए पहचानकर्ता')}</p>
            <div className="mt-4 space-y-2">
              {intelCount === 0 && <p className="text-sm text-gray-500">{t('Nothing yet — keep the scammer talking to leak a UPI / number.', 'अभी कुछ नहीं — स्कैमर को उलझाए रखें ताकि UPI / नंबर निकले।')}</p>}
              <IntelRow icon={AtSign} label={t('UPI IDs', 'UPI आईडी')} items={intel.upis} />
              <IntelRow icon={Phone} label={t('Phone numbers', 'फ़ोन नंबर')} items={intel.phones} />
              <IntelRow icon={Landmark} label={t('Accounts', 'खाते')} items={intel.accounts} />
              <IntelRow icon={Link2} label={t('Links', 'लिंक')} items={intel.links} />
            </div>
          </div>

          {tactics.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
              <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3"><ShieldAlert size={18} className="text-brand" /> {t('Tactics observed', 'देखी गई युक्तियाँ')}</h3>
              <div className="flex flex-wrap gap-2">
                {tactics.map((tac) => <span key={tac} className="text-xs bg-red-500/10 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full">{tac}</span>)}
              </div>
            </div>
          )}

          {reported.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <h3 className="font-display font-600 text-white flex items-center gap-2 mb-2"><Crosshair size={16} className="text-emerald-400" /> {t('Filed to fraud DB', 'फ्रॉड DB में दर्ज')}</h3>
              <p className="text-xs text-gray-400">{t('These identifiers now raise a reputation flag for every other citizen who looks them up.', 'ये पहचानकर्ता अब हर दूसरे नागरिक के लिए प्रतिष्ठा चेतावनी दिखाएँगे।')}</p>
              <div className="mt-2 text-sm text-emerald-300">{reported.length} {t('identifier(s) auto-reported', 'पहचानकर्ता स्वतः रिपोर्ट')}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
