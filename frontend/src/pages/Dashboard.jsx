import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts'
import { ShieldCheck, Network, Banknote, Timer, AlertTriangle, IndianRupee } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { StatCard, Spinner } from '../components/ui.jsx'
import { getStats } from '../api.js'
import { useTheme } from '../theme.js'
import { useLang, t } from '../i18n.js'

const PIE_COLORS = ['#f7941e', '#ff6b6b', '#4dabf7', '#ffd43b', '#9775fa', '#38d9a9']

const SCAMMIX_HI = {
  'Digital Arrest': 'डिजिटल अरेस्ट',
  'Parcel / Customs': 'पार्सल / कस्टम',
  'Investment': 'निवेश',
  'KYC / Phishing': 'KYC / फ़िशिंग',
  'Loan App': 'लोन ऐप',
  'Counterfeit / FICN': 'नकली नोट / FICN',
}

export default function Dashboard() {
  const [s, setS] = useState(null)
  const [err, setErr] = useState(null)
  const theme = useTheme()
  useLang()
  const light = theme === 'light'
  const gridColor = light ? '#e5e7eb' : '#26262d'
  const tip = { background: light ? '#ffffff' : '#16161a', border: `1px solid ${gridColor}`, borderRadius: 8, color: light ? '#1f2937' : '#e7e7ea' }

  useEffect(() => {
    getStats().then(setS).catch(() => setErr('Backend not reachable on :8000'))
  }, [])

  if (err) return <Wrap><p className="text-red-400">{err}</p></Wrap>
  if (!s) return <Wrap><Spinner label={t('Loading command dashboard…', 'कमांड डैशबोर्ड लोड हो रहा है…')} /></Wrap>

  const p = s.platform
  return (
    <>
      <PageHeader title={t('Command', 'कमांड')} accent={t('Dashboard', 'डैशबोर्ड')}
        subtitle={t('Unified situational picture across all detection surfaces', 'सभी डिटेक्शन सतहों का एकीकृत स्थिति चित्र')} />
      <div className="p-4 md:p-8 space-y-8">
        {/* national context banner */}
        <div className="rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 to-transparent p-5 flex items-start gap-3">
          <AlertTriangle className="text-brand shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-gray-300">
            <span className="font-600 text-white">{t('National threat context:', 'राष्ट्रीय खतरा संदर्भ:')}</span>{' '}
            {s.headline.cybercrime_complaints_2023} {t('complaints in 2023', 'शिकायतें 2023 में')} ({s.headline.yoy_complaint_growth} {t('YoY', 'वार्षिक')}).
            {' '}{t('Digital-arrest losses crossed', 'डिजिटल-अरेस्ट हानि पार कर गई')} ₹{s.headline.digital_arrest_loss_2024_9m_cr} {t('cr in 9 months of 2024.', 'करोड़ 2024 के 9 महीनों में।')}
            {' '}FICN: {s.headline.ficn_trend}.
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShieldCheck} accent label={t('Scams Screened', 'जाँचे गए घोटाले')} value={p.scams_screened.toLocaleString()} sub={t('across all channels', 'सभी चैनलों में')} />
          <StatCard icon={Network} label={t('Fraud Rings Tracked', 'ट्रैक की गई फ्रॉड रिंग')} value={p.active_fraud_rings_tracked} sub={`${p.mule_accounts_flagged} ${t('mule a/cs flagged', 'म्यूल खाते चिह्नित')}`} />
          <StatCard icon={IndianRupee} label={t('Rupees Protected', 'बचाए गए रुपये')} value={`₹${p.rupees_protected_cr} Cr`} sub={t('prevented transfers', 'रोके गए ट्रांसफर')} />
          <StatCard icon={Timer} label={t('Detection Latency', 'डिटेक्शन विलंब')} value={`${p.avg_detection_latency_ms} ms`} sub={`${t('FP rate', 'FP दर')} ${p.citizen_false_positive_rate}`} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-white/8 bg-ink-700 p-6">
            <h3 className="font-display font-600 text-white text-lg mb-4">{t('Weekly Detections — flagged vs blocked', 'साप्ताहिक डिटेक्शन — चिह्नित बनाम अवरुद्ध')}</h3>
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
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="flagged" stroke="#f7941e" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" stroke="#4dabf7" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-6">
            <h3 className="font-display font-600 text-white text-lg mb-4 flex items-center gap-2">
              <Banknote size={18} className="text-brand" /> {t('Scam Mix', 'घोटाला मिश्रण')}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={s.scam_mix.map((e) => ({ ...e, name: t(e.name, SCAMMIX_HI[e.name]) }))} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                  {s.scam_mix.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-ink-700 p-6">
          <h3 className="font-display font-600 text-white text-lg mb-1">{t('Geographic footprint', 'भौगोलिक पदचिह्न')}</h3>
          <p className="text-sm text-gray-400">
            {t('Tracking', 'ट्रैकिंग')} {s.geo_summary.tracked_cities} {t('cities', 'शहर')} · {s.geo_summary.total_complaints.toLocaleString()} {t('complaints', 'शिकायतें')} ·
            ₹{s.geo_summary.total_loss_cr} {t('cr aggregate reported loss. Open the Crime Map for hotspot detail.', 'करोड़ कुल रिपोर्ट हानि। हॉटस्पॉट विवरण हेतु क्राइम मैप खोलें।')}
          </p>
        </div>
      </div>
    </>
  )
}

function Wrap({ children }) {
  return (
    <>
      <PageHeader title={t('Command', 'कमांड')} accent={t('Dashboard', 'डैशबोर्ड')} />
      <div className="p-4 md:p-8">{children}</div>
    </>
  )
}
