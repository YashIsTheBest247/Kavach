import { useState, useRef, useEffect } from 'react'
import { Shield, Sun, Moon, ChevronDown, Check } from 'lucide-react'
import { useTheme, toggleTheme } from '../theme.js'

/**
 * Custom dropdown — fully themed (curved, brand highlight, no native blue).
 * options: array of { value, label } or plain strings.
 */
export function Select({ value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const norm = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const current = norm.find((o) => o.value === value) || norm[0]

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-ink-900 border border-ink-500 rounded-xl px-3 py-2 text-sm text-gray-200 hover:border-brand/50 focus:outline-none focus:border-brand transition-colors">
        <span className="truncate">{current?.label}</span>
        <ChevronDown size={16} className={`text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-ink-500 bg-ink-700 shadow-xl overflow-hidden py-1 max-h-64 overflow-y-auto">
          {norm.map((o) => {
            const active = o.value === value
            return (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-brand/15 text-brand font-600' : 'text-gray-300 hover:bg-brand/10 hover:text-white'
                }`}>
                <span className="truncate">{o.label}</span>
                {active && <Check size={15} className="shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ThemeToggle({ className = '' }) {
  const theme = useTheme()
  return (
    <button onClick={toggleTheme} aria-label="Toggle light / dark theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:text-brand hover:border-brand/50 transition-colors ${className}`}>
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

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
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
}

export function RiskBadge({ level, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[11px] font-600 uppercase tracking-wider ${
        LEVEL_STYLES[level] || LEVEL_STYLES.LOW
      } ${className}`}
    >
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
