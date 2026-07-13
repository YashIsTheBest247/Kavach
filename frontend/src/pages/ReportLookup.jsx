import { useEffect, useState } from 'react'
import { Search, Flag, Users, ShieldAlert, Phone, AtSign, Link2, Clock } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner, StatCard } from '../components/ui.jsx'
import { lookupReputation, submitReport, getRecentReports } from '../api.js'
import { useLang, t } from '../i18n.js'

const KIND_ICON = { phone: Phone, upi: AtSign, link: Link2 }

function KindIcon({ kind, size = 14 }) {
  const I = KIND_ICON[kind] || Flag
  return <I size={size} />
}

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor(Date.now() / 1000) - ts
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function ReportLookup() {
  const [value, setValue] = useState('+919821000001')
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [flash, setFlash] = useState('')
  const [feed, setFeed] = useState({ recent: [], stats: {} })
  useLang()

  const loadFeed = () => getRecentReports().then(setFeed).catch(() => {})
  useEffect(() => { loadFeed() }, [])

  const check = async () => {
    if (!value.trim()) return
    setLoading(true)
    try { setRep(await lookupReputation(value)) }
    catch { setRep({ error: 'Backend not reachable on :8000' }) }
    finally { setLoading(false) }
  }

  const report = async () => {
    if (!value.trim()) return
    setSubmitting(true)
    try {
      const r = await submitReport(value, reason)
      setRep(r.reputation)
      setReason('')
      setFlash(t('Report submitted — thank you for protecting others.', 'रिपोर्ट सबमिट हुई — दूसरों की सुरक्षा हेतु धन्यवाद।'))
      loadFeed()
      setTimeout(() => setFlash(''), 4000)
    } catch { setFlash('Could not submit — backend unreachable.') }
    finally { setSubmitting(false) }
  }

  return (
    <>
      <PageHeader title={t('Number / UPI / Link', 'नंबर / UPI / लिंक')} accent={t('Reputation', 'प्रतिष्ठा')}
        subtitle={t('Community-powered fraud lookup — check a contact before you trust it, or report one to warn others',
          'समुदाय-संचालित फ्रॉड लुकअप — भरोसा करने से पहले संपर्क जाँचें, या दूसरों को चेताने हेतु रिपोर्ट करें')} />
      <div className="p-4 md:p-8 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard icon={Flag} label={t('Total reports', 'कुल रिपोर्ट')} value={feed.stats?.total_reports ?? '—'} accent />
          <StatCard icon={Users} label={t('Unique flagged', 'अद्वितीय चिह्नित')} value={feed.stats?.unique_flagged ?? '—'} />
          <StatCard icon={ShieldAlert} label={t('Categories', 'श्रेणियाँ')}
            value={feed.stats?.by_kind ? Object.keys(feed.stats.by_kind).length : '—'}
            sub={feed.stats?.by_kind ? Object.entries(feed.stats.by_kind).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* lookup / report */}
          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
              <label className="text-sm font-600 text-gray-300 flex items-center gap-2 mb-3">
                <Search size={16} className="text-brand" /> {t('Phone number, UPI ID or link', 'फ़ोन नंबर, UPI ID या लिंक')}
              </label>
              <input value={value} onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && check()}
                className="w-full bg-ink-900 border border-ink-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
                placeholder="+91… / name@upi / https://…" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={check} disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-2.5 rounded transition-colors">
                  <Search size={16} /> {t('Check reputation', 'प्रतिष्ठा जाँचें')}
                </button>
                <button onClick={report} disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-60 font-700 py-2.5 rounded transition-colors">
                  <Flag size={16} /> {t('Report as fraud', 'फ्रॉड रिपोर्ट करें')}
                </button>
              </div>
              <input value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full mt-3 bg-ink-900 border border-ink-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand"
                placeholder={t('Optional: what happened? (e.g. fake CBI arrest call)', 'वैकल्पिक: क्या हुआ? (जैसे नकली CBI अरेस्ट कॉल)')} />
              {flash && <div className="mt-3 text-xs text-emerald-300">{flash}</div>}
            </div>

            {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Checking…', 'जाँच हो रही है…')} /></div>}
            {rep?.error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400 text-sm">{rep.error}</div>}
            {rep && !rep.error && !loading && (
              <div className={`rounded-xl border p-6 ${rep.risk_level === 'HIGH' ? 'border-red-500/40 bg-red-500/5' : rep.risk_level === 'MEDIUM' ? 'border-orange-500/40 bg-orange-500/5' : 'border-white/8 bg-ink-700'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <RiskBadge level={rep.risk_level} />
                  <span className="text-xs text-gray-500 inline-flex items-center gap-1"><KindIcon kind={rep.kind} /> {rep.kind}</span>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <span className="font-display text-6xl font-700 text-white leading-none">{rep.reports}</span>
                  <span className="text-gray-500 mb-1">{t('report(s)', 'रिपोर्ट')} · {t('risk', 'जोखिम')} {rep.risk_score}/100</span>
                </div>
                <p className={`text-sm font-600 mt-3 ${rep.risk_level === 'HIGH' ? 'text-red-300' : rep.risk_level === 'MEDIUM' ? 'text-orange-300' : 'text-gray-300'}`}>{rep.verdict}</p>
                {rep.reasons?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rep.reasons.map((r, i) => (
                      <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full">{r}</span>
                    ))}
                  </div>
                )}
                {rep.last_reported && <div className="mt-3 text-xs text-gray-500">{t('Last reported', 'अंतिम रिपोर्ट')} {timeAgo(rep.last_reported)}</div>}
              </div>
            )}
          </div>

          {/* live feed */}
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
              <Clock size={18} className="text-brand" /> {t('Live community reports', 'लाइव समुदाय रिपोर्ट')}
            </h3>
            <div className="space-y-2 max-h-[520px] overflow-auto">
              {feed.recent?.length ? feed.recent.map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-sm border-b border-white/5 pb-2 last:border-0">
                  <span className="shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-red-500/10 text-red-300"><KindIcon kind={r.kind} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-200 font-mono text-xs truncate">{r.value}</div>
                    <div className="text-gray-500 text-xs">{r.reason || t('(no reason given)', '(कोई कारण नहीं)')}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-600">{timeAgo(r.ts)}</span>
                </div>
              )) : <p className="text-sm text-gray-500">{t('No reports yet.', 'अभी कोई रिपोर्ट नहीं।')}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
