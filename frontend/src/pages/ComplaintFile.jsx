import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FileText, Gavel, Download, ListChecks, Landmark, ShieldCheck, Search } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner, Select } from '../components/ui.jsx'
import { draftComplaint, complaintPdf } from '../api.js'
import { useLang, t } from '../i18n.js'

const CHANNELS = ['Phone Call', 'Video Call', 'WhatsApp', 'SMS', 'Email', 'Website / Link']
const SAMPLE = 'I am Inspector Sharma from CBI. Your Aadhaar is linked to a money-laundering case and there is an arrest warrant. You are under digital arrest. Transfer ₹50,000 to UPI verify@okaxis immediately to prove your innocence, it is refundable.'

export default function ComplaintFile() {
  const loc = useLocation()
  const seeded = loc.state?.text
  const [form, setForm] = useState({
    text: seeded || SAMPLE,
    channel: loc.state?.channel || 'Video Call',
    name: '', phone: '', city: '', amount_lost: '', datetime: '',
  })
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  useLang()

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }))

  const run = async () => {
    if (!form.text.trim()) return
    setLoading(true)
    try { setRes(await draftComplaint(form)) }
    catch { setRes({ error: 'Backend not reachable on :8000' }) }
    finally { setLoading(false) }
  }

  const download = async () => {
    setPdfLoading(true)
    try {
      const blob = await complaintPdf(form)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'kavach-cybercrime-complaint.pdf'
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch { /* ignore */ } finally { setPdfLoading(false) }
  }

  const Field = ({ label, k, placeholder, half }) => (
    <div className={half ? '' : 'col-span-2'}>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input value={form[k]} onChange={set(k)} placeholder={placeholder}
        className="w-full bg-ink-900 border border-ink-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
    </div>
  )

  return (
    <>
      <PageHeader title={t('One-Tap', 'वन-टैप')} accent={t('Complaint Filing', 'शिकायत दर्ज')}
        subtitle={t('Turn any scam into a ready-to-submit NCRP / 1930 cyber-crime complaint — auto-classified, with suspect entities, evidence checklist and a tamper-evident PDF',
          'किसी भी घोटाले को जमा करने योग्य NCRP / 1930 साइबर-अपराध शिकायत में बदलें — स्वतः वर्गीकृत, साक्ष्य चेकलिस्ट और छेड़छाड़-प्रमाण PDF के साथ')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        {/* form */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <label className="text-sm font-600 text-gray-300 flex items-center gap-2 mb-2"><FileText size={16} className="text-brand" /> {t('What happened? (paste the message / describe it)', 'क्या हुआ? (संदेश पेस्ट करें / वर्णन करें)')}</label>
            <textarea value={form.text} onChange={set('text')} rows={6}
              className="w-full bg-ink-900 border border-ink-500 rounded-lg p-3 text-sm focus:outline-none focus:border-brand resize-none" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">{t('Channel', 'चैनल')}</label>
                <Select value={form.channel} onChange={set('channel')} options={CHANNELS} />
              </div>
              <Field label={t('Your name (optional)', 'आपका नाम (वैकल्पिक)')} k="name" placeholder="—" half />
              <Field label={t('Your phone (optional)', 'आपका फ़ोन (वैकल्पिक)')} k="phone" placeholder="—" half />
              <Field label={t('City (optional)', 'शहर (वैकल्पिक)')} k="city" placeholder="—" half />
              <Field label={t('Amount lost (optional)', 'हानि राशि (वैकल्पिक)')} k="amount_lost" placeholder="₹ —" half />
            </div>
            <button onClick={run} disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-3 rounded transition-colors">
              <Gavel size={18} /> {loading ? t('Drafting…', 'तैयार हो रहा है…') : t('Generate complaint', 'शिकायत बनाएँ')}
            </button>
          </div>
        </div>

        {/* result */}
        <div className="space-y-4">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Classifying & drafting…', 'वर्गीकरण व प्रारूपण…')} /></div>}
          {res?.error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400 text-sm">{res.error}</div>}
          {res && !res.error && !loading && (
            <>
              <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-display font-600 text-white flex items-center gap-2"><Landmark size={18} className="text-brand" /> {t('NCRP classification', 'NCRP वर्गीकरण')}</h3>
                  <RiskBadge level={res.risk_level} />
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div><span className="text-gray-500">{t('Category', 'श्रेणी')}:</span> <span className="text-gray-100 font-600">{res.category}</span></div>
                  <div><span className="text-gray-500">{t('Sub-category', 'उप-श्रेणी')}:</span> <span className="text-gray-100">{res.sub_category}</span></div>
                  <div><span className="text-gray-500">{t('Applicable law', 'लागू कानून')}:</span> <span className="text-gray-100">{res.applicable_law}</span></div>
                  <div><span className="text-gray-500">{t('Reference', 'संदर्भ')}:</span> <code className="text-brand">{res.reference}</code></div>
                </div>
                <button onClick={download} disabled={pdfLoading}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-2.5 rounded transition-colors">
                  <Download size={16} /> {pdfLoading ? t('Preparing…', 'तैयार हो रहा है…') : t('Download complaint PDF', 'शिकायत PDF डाउनलोड करें')}
                </button>
                <a href={res.portal} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs text-brand hover:underline">{res.portal} · {t('Helpline', 'हेल्पलाइन')} {res.helpline}</a>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white mb-2">{t('Incident narrative', 'घटना विवरण')}</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{res.narrative}</p>
              </div>

              {(res.suspect_entities?.upis?.length || res.suspect_entities?.phones?.length || res.suspect_entities?.accounts?.length || res.suspect_entities?.links?.length) ? (
                <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                  <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3"><Search size={16} className="text-brand" /> {t('Suspect identifiers', 'संदिग्ध पहचानकर्ता')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...(res.suspect_entities.upis || []), ...(res.suspect_entities.phones || []), ...(res.suspect_entities.accounts || []), ...(res.suspect_entities.links || [])].map((e, i) => (
                      <code key={i} className="text-xs bg-ink-900 border border-red-500/30 text-red-200 rounded px-2 py-0.5 break-all">{e}</code>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3"><ListChecks size={16} className="text-brand" /> {t('Evidence to attach', 'संलग्न करने हेतु साक्ष्य')}</h3>
                <ul className="space-y-1.5">
                  {res.evidence_checklist.map((e, i) => <li key={i} className="flex gap-2 text-sm text-gray-300"><span className="text-brand">•</span>{e}</li>)}
                </ul>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3"><ShieldCheck size={16} className="text-brand" /> {t('How to file', 'कैसे दर्ज करें')}</h3>
                <ol className="space-y-2">
                  {res.filing_steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-200"><span className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-brand text-black text-xs font-700">{i + 1}</span>{s}</li>
                  ))}
                </ol>
              </div>
            </>
          )}
          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <Gavel size={40} className="mx-auto mb-3 text-gray-600" />
              {t('Describe the incident, then generate a ready-to-file complaint.', 'घटना का वर्णन करें, फिर जमा करने योग्य शिकायत बनाएँ।')}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
