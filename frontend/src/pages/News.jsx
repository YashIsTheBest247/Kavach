import { useEffect, useState } from 'react'
import { Newspaper, ExternalLink, AlertTriangle } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { Spinner } from '../components/ui.jsx'
import { getNews } from '../api.js'
import { useLang, t } from '../i18n.js'

export default function News() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  useLang()

  useEffect(() => {
    getNews().then(setData).catch(() => setErr(t('Backend not reachable on :8000', 'बैकएंड उपलब्ध नहीं :8000')))
  }, [])

  return (
    <>
      <PageHeader title={t('Scam', 'घोटाला')} accent={t('News Watch', 'समाचार निगरानी')}
        subtitle={t('Live fraud, cyber-scam & counterfeit coverage from Economic Times', 'इकोनॉमिक टाइम्स से लाइव फ्रॉड, साइबर-घोटाला और नकली नोट कवरेज')} />
      <div className="p-4 md:p-8">
        {err && <p className="text-red-400">{err}</p>}
        {!data && !err && <Spinner label={t('Fetching latest scam news…', 'नवीनतम घोटाला समाचार लाया जा रहा है…')} />}

        {data && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-5 pb-4 border-b border-white/8">
              {data.live ? (
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {t('Live feed', 'लाइव फ़ीड')}
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-300 normal-case tracking-normal">Economic Times</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertTriangle size={13} className="text-gray-500" />
                  {t('Curated headlines · ET feed unavailable', 'क्यूरेटेड हेडलाइन · ET फ़ीड अनुपलब्ध')}
                </div>
              )}
              <span className="text-xs text-gray-500">{data.items.length} {t('stories', 'समाचार')}</span>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.items.map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noreferrer"
                  className="group rounded-xl border border-white/8 bg-ink-700 p-5 hover:border-brand/50 hover:-translate-y-1 transition-all flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand/15 text-brand">
                      <Newspaper size={16} />
                    </div>
                    <span className="text-[11px] text-gray-500">{n.source}{n.pubDate ? ` · ${shortDate(n.pubDate)}` : ''}</span>
                  </div>
                  <h3 className="text-white font-600 leading-snug group-hover:text-brand transition-colors">{n.title}</h3>
                  {n.summary && <p className="text-sm text-gray-400 mt-2 leading-relaxed line-clamp-4">{n.summary}</p>}
                  <div className="inline-flex items-center gap-1.5 text-brand text-xs font-600 mt-auto pt-4 group-hover:gap-2.5 transition-all">
                    {t('Read on Economic Times', 'इकोनॉमिक टाइम्स पर पढ़ें')} <ExternalLink size={13} />
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function shortDate(s) {
  // ET pubDate like "Sun, 22 Jun 2026 10:30:00 +0530" — show the date portion.
  const m = s.match(/\d{1,2}\s+\w{3}\s+\d{4}/)
  return m ? m[0] : s.slice(0, 16)
}
