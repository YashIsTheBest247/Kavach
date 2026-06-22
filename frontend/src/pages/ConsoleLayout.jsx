import { useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquareWarning, Network, ScanLine,
  PhoneCall, MapPin, ArrowLeft, Mic, Target, Workflow, Menu, X,
} from 'lucide-react'
import { Logo, ThemeToggle, LangToggle } from '../components/ui.jsx'
import { useLang, t } from '../i18n.js'

const LINKS = [
  { to: '/console', end: true, icon: LayoutDashboard, en: 'Command Dashboard', hi: 'कमांड डैशबोर्ड' },
  { to: '/console/fusion', icon: Workflow, en: 'Threat Fusion (Agentic)', hi: 'थ्रेट फ्यूज़न (एजेंटिक)' },
  { to: '/console/scam-detector', icon: MessageSquareWarning, en: 'Digital Arrest Detector', hi: 'डिजिटल अरेस्ट डिटेक्टर' },
  { to: '/console/voice-spoof', icon: Mic, en: 'Voice-Spoof Detection', hi: 'वॉइस-स्पूफ़ डिटेक्शन' },
  { to: '/console/fraud-graph', icon: Network, en: 'Fraud Network Graph', hi: 'फ्रॉड नेटवर्क ग्राफ़' },
  { to: '/console/counterfeit', icon: ScanLine, en: 'Counterfeit Screen', hi: 'नकली नोट स्क्रीनिंग' },
  { to: '/console/fraud-shield', icon: PhoneCall, en: 'Citizen Fraud Shield', hi: 'नागरिक फ्रॉड शील्ड' },
  { to: '/console/crime-map', icon: MapPin, en: 'Crime Map', hi: 'क्राइम मैप' },
  { to: '/console/metrics', icon: Target, en: 'Measured Metrics', hi: 'मापे गए मेट्रिक्स' },
]

export default function ConsoleLayout() {
  const [open, setOpen] = useState(false)
  useLang()

  return (
    <div className="min-h-screen bg-ink-900 lg:flex">
      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-white/5 bg-ink-800">
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <button onClick={() => setOpen(true)} aria-label="Open menu"
            className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:text-brand hover:border-brand/50">
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* backdrop (mobile only) */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* sidebar: drawer on mobile, static on desktop */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 shrink-0 h-screen border-r border-white/5 bg-ink-800 flex flex-col
                         transform transition-transform duration-300 lg:translate-x-0
                         ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 h-16 flex items-center justify-between border-b border-white/5">
          <Link to="/" onClick={() => setOpen(false)}><Logo /></Link>
          <button onClick={() => setOpen(false)} aria-label="Close menu"
            className="lg:hidden text-gray-400 hover:text-brand">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/15 text-brand font-600'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }>
              <l.icon size={18} />
              {t(l.en, l.hi)}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <Link to="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand px-3 py-2">
            <ArrowLeft size={14} /> {t('Back to site', 'साइट पर वापस')}
          </Link>
          <div className="px-3 mt-2 text-[10px] text-gray-600">
            {t('Helpline', 'हेल्पलाइन')} <span className="text-brand">1930</span> · cybercrime.gov.in
          </div>
        </div>
      </aside>

      <ConsoleMain />
    </div>
  )
}

function ConsoleMain() {
  const location = useLocation()
  return (
    <main className="flex-1 min-w-0 overflow-x-hidden">
      <div key={location.pathname} className="page-enter">
        <Outlet />
      </div>
    </main>
  )
}

export function PageHeader({ title, subtitle, accent }) {
  return (
    <div className="border-b border-white/5 bg-ink-800/60 px-4 md:px-8 py-5 md:py-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-700 uppercase text-white">
          {title} {accent && <span className="text-brand">{accent}</span>}
        </h1>
        {subtitle && <p className="text-xs md:text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="shrink-0 hidden lg:flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>
    </div>
  )
}
