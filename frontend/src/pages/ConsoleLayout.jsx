import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquareWarning, Network, ScanLine,
  PhoneCall, MapPin, ArrowLeft, Mic, Target,
} from 'lucide-react'
import { Logo, ThemeToggle } from '../components/ui.jsx'

const LINKS = [
  { to: '/console', end: true, icon: LayoutDashboard, label: 'Command Dashboard' },
  { to: '/console/scam-detector', icon: MessageSquareWarning, label: 'Digital Arrest Detector' },
  { to: '/console/voice-spoof', icon: Mic, label: 'Voice-Spoof Detection' },
  { to: '/console/fraud-graph', icon: Network, label: 'Fraud Network Graph' },
  { to: '/console/counterfeit', icon: ScanLine, label: 'Counterfeit Screen' },
  { to: '/console/fraud-shield', icon: PhoneCall, label: 'Citizen Fraud Shield' },
  { to: '/console/crime-map', icon: MapPin, label: 'Crime Map' },
  { to: '/console/metrics', icon: Target, label: 'Measured Metrics' },
]

export default function ConsoleLayout() {
  return (
    <div className="min-h-screen bg-ink-900 flex">
      <aside className="w-64 shrink-0 border-r border-white/5 bg-ink-800 flex flex-col sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center border-b border-white/5">
          <Link to="/"><Logo /></Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/15 text-brand font-600'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }>
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <Link to="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand px-3 py-2">
            <ArrowLeft size={14} /> Back to site
          </Link>
          <div className="px-3 mt-2 text-[10px] text-gray-600">
            Helpline <span className="text-brand">1930</span> · cybercrime.gov.in
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export function PageHeader({ title, subtitle, accent }) {
  return (
    <div className="border-b border-white/5 bg-ink-800/60 px-8 py-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-700 uppercase text-white">
          {title} {accent && <span className="text-brand">{accent}</span>}
        </h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <ThemeToggle className="shrink-0" />
    </div>
  )
}
