import { useEffect, useState } from 'react'
import { Radar, RefreshCw, TrendingUp, Newspaper, Users, AlertTriangle, Activity, ExternalLink } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { getOutbreakAlerts } from '../api.js'
import { useLang, t } from '../i18n.js'

const TREND = {
  surging: { label: 'SURGING', cls: 'text-red-400' },
  rising: { label: 'RISING', cls: 'text-orange-400' },
  watch: { label: 'WATCH', cls: 'text-yellow-300' },
}
const LVL_BORDER = {
  HIGH: 'border-red-500/40 bg-red-500/5',
  MEDIUM: 'border-orange-500/40 bg-orange-500/5',
  LOW: 'border-white/8 bg-ink-700',
}

export default function OutbreakAlerts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useLang()

  const load = () => { getOutbreakAlerts().then((d) => { setData(d); setLoading(false) }).catch(() => { setData({ error: true }); setLoading(false) }) }
  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv) }, [])

  return (
    <>
      <PageHeader title={t('Scam-Outbreak', 'घोटाला-प्रकोप')} accent={t('Early Warning', 'पूर्व चेतावनी')}
        subtitle={t('Fuses live scam-news and crowd fraud reports to detect which scams are spiking right now — prevention before the next victim',
          'लाइव घोटाला-समाचार और भीड़ रिपोर्टों को मिलाकर पता लगाता है कि अभी कौन-से घोटाले बढ़ रहे हैं — अगले शिकार से पहले रोकथाम')} />
      <div className="p-4 md:p-8 space-y-6">
        {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Scanning signals…', 'संकेत स्कैन हो रहे हैं…')} /></div>}
        {data?.error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400 text-sm">Backend not reachable on :8000</div>}
        {data && !data.error && !loading && (
          <>
            {/* national threat banner */}
            <div className={`rounded-2xl border p-6 ${LVL_BORDER[data.national_threat_level]}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative grid place-items-center w-12 h-12 rounded-full border border-brand/60 pulse-ring"><Radar size={22} className="text-brand" /></span>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gray-400">{t('National threat level', 'राष्ट्रीय खतरा स्तर')}</div>
                    <div className="font-display text-2xl font-700 text-white flex items-center gap-3">{data.national_threat_level} <RiskBadge level={data.national_threat_level} /></div>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <div className="text-center"><div className="font-display text-2xl font-700 text-brand">{data.active_alerts}</div><div className="text-[11px] text-gray-500">{t('active alerts', 'सक्रिय चेतावनी')}</div></div>
                  <div className="text-center"><div className="font-display text-2xl font-700 text-white">{data.sources?.news_items ?? 0}</div><div className="text-[11px] text-gray-500">{t('news items', 'समाचार')}</div></div>
                  <div className="text-center"><div className="font-display text-2xl font-700 text-white">{data.sources?.reports_scanned ?? 0}</div><div className="text-[11px] text-gray-500">{t('reports', 'रिपोर्ट')}</div></div>
                  <button onClick={load} className="text-gray-400 hover:text-brand" title="Refresh"><RefreshCw size={16} /></button>
                </div>
              </div>
            </div>

            {/* alert cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {data.alerts.map((a, i) => {
                const tr = TREND[a.trend] || TREND.watch
                return (
                  <div key={i} className={`rounded-xl border p-5 ${LVL_BORDER[a.severity]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-600 text-white flex items-center gap-2"><AlertTriangle size={17} className="text-brand" /> {a.scam_type}</h3>
                      <span className={`text-xs font-700 flex items-center gap-1 ${tr.cls}`}><TrendingUp size={13} /> {tr.label}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Newspaper size={13} /> {a.news_mentions} {t('news', 'समाचार')}</span>
                      <span className="flex items-center gap-1"><Users size={13} /> {a.citizen_reports} {t('reports', 'रिपोर्ट')}</span>
                      <span className="flex items-center gap-1"><Activity size={13} /> {a.reports_last_14d} {t('recent', 'हालिया')}</span>
                    </div>
                    {a.headline_sample && (
                      a.headline_link ? (
                        <a href={a.headline_link} target="_blank" rel="noreferrer"
                          className="mt-3 flex items-start gap-1.5 text-xs text-gray-400 bg-ink-900 border border-white/8 rounded-lg p-2.5 hover:border-brand/40 hover:text-gray-200 transition-colors">
                          <span className="line-clamp-2">“{a.headline_sample}”</span>
                          <ExternalLink size={12} className="shrink-0 mt-0.5 text-brand" />
                        </a>
                      ) : (
                        <div className="mt-3 text-xs text-gray-400 bg-ink-900 border border-white/8 rounded-lg p-2.5 line-clamp-2">“{a.headline_sample}”</div>
                      )
                    )}
                    <div className="mt-3 rounded-lg bg-brand/5 border border-brand/20 p-3 text-sm text-gray-100">{a.advice}</div>
                  </div>
                )
              })}
            </div>
            {data.alerts.length === 0 && <p className="text-center text-gray-500 py-10">{t('No active outbreaks detected right now.', 'अभी कोई सक्रिय प्रकोप नहीं मिला।')}</p>}
            <p className="text-[11px] text-gray-500">{data.disclaimer}</p>
          </>
        )}
      </div>
    </>
  )
}
