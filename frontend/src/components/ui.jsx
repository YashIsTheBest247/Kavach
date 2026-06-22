import { Shield } from 'lucide-react'

export function Logo({ size = 'md' }) {
  const s = size === 'lg' ? 'text-2xl' : 'text-xl'
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="relative">
        <Shield className="text-brand" size={size === 'lg' ? 30 : 26} strokeWidth={2.5} />
      </div>
      <div className={`font-display font-700 ${s} tracking-wide leading-none`}>
        <span className="text-white">KAVACH</span>{' '}
        <span className="text-brand">AI</span>
        <div className="text-[9px] tracking-[0.25em] text-gray-500 font-sans font-500 mt-0.5">
          DIGITAL PUBLIC SAFETY
        </div>
      </div>
    </div>
  )
}

const LEVEL_STYLES = {
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/40',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
  MEDIUM: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
}

export function RiskBadge({ level, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-700 tracking-wide font-display ${
        LEVEL_STYLES[level] || LEVEL_STYLES.LOW
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent
          ? 'border-brand/40 bg-gradient-to-br from-brand/10 to-transparent'
          : 'border-ink-500 bg-ink-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-gray-400">{label}</span>
        {Icon && <Icon size={18} className={accent ? 'text-brand' : 'text-gray-500'} />}
      </div>
      <div className="mt-2 font-display text-3xl font-700 text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  )
}

export function SectionTitle({ kicker, title, accent }) {
  return (
    <div className="text-center">
      {kicker && (
        <div className="text-brand text-xs font-700 tracking-[0.3em] uppercase mb-3">{kicker}</div>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-700 uppercase text-white">
        {title} {accent && <span className="text-brand">{accent}</span>}
      </h2>
      <div className="mx-auto mt-4 h-1 w-16 bg-brand rounded-full" />
    </div>
  )
}

export function Spinner({ label = 'Analysing…' }) {
  return (
    <div className="flex items-center gap-3 text-gray-400 text-sm">
      <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  )
}
