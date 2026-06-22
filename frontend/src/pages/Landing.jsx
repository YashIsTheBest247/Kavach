import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play, ShieldCheck, Network, ScanLine, MessageSquareWarning, MapPin,
  PhoneCall, ArrowRight, Mic, Target, Workflow,
} from 'lucide-react'
import { Logo, RiskBadge, ThemeToggle } from '../components/ui.jsx'
import { analyzeScam } from '../api.js'

const NAV = [
  { label: 'HOME', href: '#home' },
  { label: 'FEATURES', href: '#features' },
  { label: 'LIVE DEMO', href: '#demo' },
]

const FEATURES = [
  { icon: Workflow, title: 'Agentic Threat Fusion', desc: 'Cooperating agents correlate the scam, fraud ring and geo context, then auto-draft citizen, telecom and MHA-NCRP responses — one coordinated brain.', to: '/console/fusion' },
  { icon: MessageSquareWarning, title: 'Digital Arrest Detector', desc: 'Real-time classifier that flags fake-CBI / digital-arrest scripts before money moves — with an explainable evidence trail.', to: '/console/scam-detector' },
  { icon: Mic, title: 'Voice-Spoof Detection', desc: 'Explainable audio forensics that flags AI-cloned / synthetic voices used in scam calls — try it with built-in demo clips.', to: '/console/voice-spoof' },
  { icon: Network, title: 'Fraud Network Graph', desc: 'Clusters victims, mule accounts and spoofed numbers into coordinated rings and emits court-auditable intelligence packages.', to: '/console/fraud-graph' },
  { icon: ScanLine, title: 'Counterfeit Currency Screen', desc: 'On-device image forensics + security-feature checklist to screen FICN at the point of contact.', to: '/console/counterfeit' },
  { icon: PhoneCall, title: 'Citizen Fraud Shield', desc: 'Multi-channel assistant giving instant scam verdicts and guided reporting in 6 Indian languages.', to: '/console/fraud-shield' },
  { icon: MapPin, title: 'Geospatial Crime Map', desc: 'Live hotspot map of fraud complaints and FICN seizures for patrol prioritisation and inter-district sharing.', to: '/console/crime-map' },
  { icon: Target, title: 'Measured Metrics', desc: 'Precision, recall and false-positive/negative rates on labelled hold-out sets — the numbers that actually save lives.', to: '/console/metrics' },
  { icon: ShieldCheck, title: 'Command Dashboard', desc: 'Unified situational picture: detection volumes, rings tracked, rupees protected and response latency.', to: '/console' },
]

export default function Landing() {
  return (
    <div id="home" className="min-h-screen bg-ink-900 text-gray-200 fade-in">
      <TopNav />
      <Hero />
      <LiveDemo />
      <Features />
      <Footer />
    </div>
  )
}

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-900/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            <a key={n.label} href={n.href}
              className="text-xs font-600 tracking-widest text-gray-300 hover:text-brand transition-colors">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/console"
            className="bg-brand hover:bg-brand-600 text-black font-700 text-sm px-5 py-2.5 rounded transition-colors shadow-glow">
            LAUNCH CONSOLE
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative hero-bokeh overflow-hidden">
      <div className="absolute inset-0 diag-stripes" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900" />
      <div className="relative mx-auto max-w-6xl px-5 py-10 md:py-12 text-center">
        <div className="text-gray-400 text-xs md:text-sm tracking-[0.2em] uppercase mb-3">
          ₹1,776 crore stolen in 9 months. The data existed. The defence did not.
        </div>
        <h1 className="font-display font-700 uppercase leading-[0.92] text-white text-4xl md:text-5xl">
          Can you spot a scam<br />
          <span className="text-brand">before it steals everything?</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-400 text-sm md:text-[15px] leading-relaxed">
          Kavach AI is a Digital Public Safety Intelligence platform that detects digital-arrest
          scams, maps fraud networks, screens counterfeit currency and shields citizens — shifting
          law enforcement from reactive investigation to predictive threat neutralisation.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
          <Link to="/console"
            className="group inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-black font-700 px-7 py-3.5 rounded transition-colors shadow-glow">
            ENTER COMMAND CENTRE
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#demo"
            className="inline-flex items-center gap-3 text-gray-200 hover:text-brand transition-colors">
            <span className="relative grid place-items-center w-12 h-12 rounded-full border border-brand/60 pulse-ring">
              <Play size={18} className="text-brand fill-brand ml-0.5" />
            </span>
            <span className="text-sm font-600 tracking-wide">Try live detection</span>
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
          {[
            ['1.14M', 'Cybercrime complaints, 2023'],
            ['+60%', 'YoY growth in complaints'],
            ['₹1,776 Cr', 'Digital-arrest loss (9m 2024)'],
            ['38 ms', 'Avg. detection latency'],
          ].map(([v, l]) => (
            <div key={l} className="bg-ink-800 px-4 py-5">
              <div className="font-display text-3xl font-700 text-brand">{v}</div>
              <div className="text-[11px] text-gray-400 mt-1 leading-tight">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const PRESET = "Sir I am Inspector from CBI. Your Aadhaar is linked to a money laundering case and there is an arrest warrant. You are under digital arrest — do not disconnect this video call and do not tell anyone. Transfer all your funds to this RBI verification account immediately to prove innocence, it is refundable."

function LiveDemo() {
  const [text, setText] = useState(PRESET)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      setRes(await analyzeScam(text, 'Demo', 'en'))
    } catch (e) {
      setRes({ error: 'Backend not reachable. Start the FastAPI server on :8000.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="demo" className="bg-ink-900">
      <div className="mx-auto max-w-5xl px-5 py-20">
        <div className="text-center mb-10">
          <div className="text-brand text-xs font-700 tracking-[0.3em] uppercase mb-3">Try it now</div>
          <h2 className="font-display text-3xl md:text-4xl font-700 uppercase text-white">
            Paste a suspicious <span className="text-brand">message or call</span>
          </h2>
          <p className="text-gray-400 text-sm mt-3">Real engine. Real verdict. No sign-up.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-700 p-6 md:p-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full bg-ink-900 border border-white/10 rounded-lg p-4 text-sm text-gray-200 focus:outline-none focus:border-brand resize-none"
            placeholder="Paste the message or call transcript here…"
          />
          <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
            <span className="text-xs text-gray-500">Tip: edit the preset to test your own message.</span>
            <button onClick={run} disabled={loading}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 px-6 py-2.5 rounded transition-colors">
              {loading ? 'Analysing…' : 'Analyse threat'}
            </button>
          </div>

          {res && !res.error && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-gray-300 text-sm">
                    Risk score <span className="font-display text-2xl text-white font-700">{res.risk_score}</span>/100
                  </span>
                </div>
                <span className="text-xs text-gray-500">confidence {Math.round(res.confidence * 100)}%</span>
              </div>
              <p className="text-sm text-gray-300 mt-4">{res.summary}</p>
              {res.tactics_detected?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {res.tactics_detected.map((t) => (
                    <span key={t} className="text-xs bg-red-500/10 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              <Link to="/console/scam-detector"
                className="inline-flex items-center gap-1.5 text-brand text-sm font-600 mt-5 hover:gap-2.5 transition-all">
                Open full detector with evidence trail <ArrowRight size={15} />
              </Link>
            </div>
          )}
          {res?.error && <p className="mt-5 text-sm text-red-400">{res.error}</p>}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="bg-ink-800 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center mb-14">
          <div className="text-brand text-xs font-700 tracking-[0.3em] uppercase mb-3">Capabilities</div>
          <h2 className="font-display text-3xl md:text-4xl font-700 uppercase text-white">Main Features</h2>
          <div className="mx-auto mt-4 h-1 w-16 bg-brand rounded-full" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Link key={f.title} to={f.to}
              className="group rounded-xl border border-white/8 bg-ink-700 p-7 hover:border-brand/50 hover:-translate-y-1 transition-all">
              <div className="grid place-items-center w-12 h-12 rounded-lg bg-brand/15 text-brand mb-5 group-hover:bg-brand group-hover:text-black transition-colors">
                <f.icon size={22} />
              </div>
              <h3 className="font-display font-600 text-white text-xl">{f.title}</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{f.desc}</p>
              <div className="inline-flex items-center gap-1.5 text-brand text-sm font-600 mt-4 group-hover:gap-2.5 transition-all">
                Open tool <ArrowRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-800">
      <div className="mx-auto max-w-7xl px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-xs text-gray-500 text-center">
           Helpline <span className="text-brand font-600">1930</span> · cybercrime.gov.in
        </p>
      </div>
    </footer>
  )
}
