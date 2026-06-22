import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { getNews } from '../api.js'
import { useLang, t } from '../i18n.js'

export default function NewsTicker() {
  const [items, setItems] = useState([])
  useLang()

  useEffect(() => {
    getNews().then((d) => setItems(d.items || [])).catch(() => {})
  }, [])

  if (!items.length) return null
  const loop = [...items, ...items]   // duplicate for seamless -50% loop

  return (
    <div className="relative z-50 flex items-stretch bg-ink-900 border-b border-white/10 text-xs">
      {/* fixed label */}
      <div className="shrink-0 flex items-center gap-2 bg-brand text-black font-700 uppercase tracking-wider px-3 md:px-4 whitespace-nowrap text-[10px] md:text-xs">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-black opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-black" />
        </span>
        {t('ET Scam Alerts', 'ET घोटाला अलर्ट')}
      </div>

      {/* scrolling headlines */}
      <div className="marquee-mask flex-1 overflow-hidden">
        <div className="marquee-track items-center py-2">
          {loop.map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noreferrer"
              className="group flex items-center gap-2 px-6 whitespace-nowrap text-gray-300 hover:text-brand transition-colors">
              <span className="text-brand">●</span>
              <span>{n.title}</span>
              <ArrowUpRight size={12} className="text-gray-500 group-hover:text-brand" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
