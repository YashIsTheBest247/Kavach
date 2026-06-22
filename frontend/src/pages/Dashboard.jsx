import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts'
import { ShieldCheck, Network, Banknote, Timer, AlertTriangle, IndianRupee } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { StatCard, Spinner } from '../components/ui.jsx'
import { getStats } from '../api.js'

const PIE_COLORS = ['#f7941e', '#ff6b6b', '#4dabf7', '#ffd43b', '#9775fa', '#38d9a9']

export default function Dashboard() {
  const [s, setS] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    getStats().then(setS).catch(() => setErr('Backend not reachable on :8000'))
  }, [])

  if (err) return <Wrap><p className="text-red-400">{err}</p></Wrap>
  if (!s) return <Wrap><Spinner label="Loading command dashboard…" /></Wrap>

  const p = s.platform
  return (
    <>
      <PageHeader title="Command" accent="Dashboard"
        subtitle="Unified situational picture across all detection surfaces" />
      <div className="p-8 space-y-8">
        {/* national context banner */}
        <div className="rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 to-transparent p-5 flex items-start gap-3">
          <AlertTriangle className="text-brand shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-gray-300">
            <span className="font-600 text-white">National threat context:</span>{' '}
            {s.headline.cybercrime_complaints_2023} complaints in 2023 ({s.headline.yoy_complaint_growth} YoY).
            Digital-arrest losses crossed ₹{s.headline.digital_arrest_loss_2024_9m_cr} cr in 9 months of 2024.
            FICN: {s.headline.ficn_trend}.
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShieldCheck} accent label="Scams Screened" value={p.scams_screened.toLocaleString()} sub="across all channels" />
          <StatCard icon={Network} label="Fraud Rings Tracked" value={p.active_fraud_rings_tracked} sub={`${p.mule_accounts_flagged} mule a/cs flagged`} />
          <StatCard icon={IndianRupee} label="Rupees Protected" value={`₹${p.rupees_protected_cr} Cr`} sub="prevented transfers" />
          <StatCard icon={Timer} label="Detection Latency" value={`${p.avg_detection_latency_ms} ms`} sub={`FP rate ${p.citizen_false_positive_rate}`} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-white/8 bg-ink-700 p-6">
            <h3 className="font-display font-600 text-white text-lg mb-4">Weekly Detections — flagged vs blocked</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={s.weekly_detections} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7941e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f7941e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4dabf7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4dabf7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#26262d" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={{ background: '#16161a', border: '1px solid #26262d', borderRadius: 8 }} />
                <Area type="monotone" dataKey="flagged" stroke="#f7941e" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" stroke="#4dabf7" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-6">
            <h3 className="font-display font-600 text-white text-lg mb-4 flex items-center gap-2">
              <Banknote size={18} className="text-brand" /> Scam Mix
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={s.scam_mix} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                  {s.scam_mix.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#16161a', border: '1px solid #26262d', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-ink-700 p-6">
          <h3 className="font-display font-600 text-white text-lg mb-1">Geographic footprint</h3>
          <p className="text-sm text-gray-400">
            Tracking {s.geo_summary.tracked_cities} cities · {s.geo_summary.total_complaints.toLocaleString()} complaints ·
            ₹{s.geo_summary.total_loss_cr} cr aggregate reported loss. Open the Crime Map for hotspot detail.
          </p>
        </div>
      </div>
    </>
  )
}

function Wrap({ children }) {
  return (
    <>
      <PageHeader title="Command" accent="Dashboard" />
      <div className="p-8">{children}</div>
    </>
  )
}
