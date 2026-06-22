import { useEffect, useState } from 'react'
import { Target, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { Spinner } from '../components/ui.jsx'
import { getMetrics } from '../api.js'
import { useLang, t } from '../i18n.js'

export default function Metrics() {
  const [m, setM] = useState(null)
  const [err, setErr] = useState(null)
  useLang()

  useEffect(() => {
    getMetrics().then(setM).catch(() => setErr('Backend not reachable on :8000'))
  }, [])

  return (
    <>
      <PageHeader title={t('Measured', 'मापे गए')} accent={t('Metrics', 'मेट्रिक्स')}
        subtitle={t('Detectors evaluated on labelled hold-out sets — the numbers that actually save lives', 'लेबल किए गए डेटासेट पर मूल्यांकित डिटेक्टर — वे आँकड़े जो वास्तव में जान बचाते हैं')} />
      <div className="p-4 md:p-8 space-y-8">
        {err && <p className="text-red-400">{err}</p>}
        {!m && !err && <Spinner label={t('Running evaluation…', 'मूल्यांकन चल रहा है…')} />}
        {m && (
          <>
            <div className="rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 to-transparent p-5 flex items-start gap-3">
              <Target className="text-brand shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-gray-300">
                <span className="font-600 text-white">{t('Why these two numbers matter most:', 'ये दो आँकड़े सबसे ज़्यादा क्यों मायने रखते हैं:')}</span>{' '}
                {t('for a citizen-facing tool the', 'नागरिक-सामना उपकरण के लिए')} <span className="text-emerald-400 font-600">{t('false-positive rate', 'फ़ॉल्स-पॉज़िटिव दर')}</span> {t('must be near-zero (no false alarms), and for a life-safety tool the', 'लगभग शून्य होनी चाहिए (कोई झूठा अलार्म नहीं), और जीवन-सुरक्षा उपकरण के लिए')} <span className="text-red-400 font-600">{t('false-negative rate', 'फ़ॉल्स-नेगेटिव दर')}</span> {t('is the metric that decides whether a scam slips through. Both are reported below, openly.', 'वह आँकड़ा है जो तय करता है कि घोटाला छूट जाएगा या नहीं। दोनों नीचे खुलकर दिए गए हैं।')}
              </div>
            </div>

            <MetricBlock data={m.scam} icon={ShieldCheck} highlight="false_positive_rate"
              highlightLabel={t('False-positive rate (citizen false alarms)', 'फ़ॉल्स-पॉज़िटिव दर (नागरिक झूठे अलार्म)')} />
            <MetricBlock data={m.voice} icon={ShieldCheck} highlight="false_negative_rate"
              highlightLabel={t('False-negative rate (deepfakes missed)', 'फ़ॉल्स-नेगेटिव दर (छूटे डीपफेक)')} />
            {m.counterfeit && (
              <MetricBlock data={m.counterfeit} icon={ShieldCheck} highlight="false_negative_rate"
                highlightLabel={t('False-negative rate (fakes passed as genuine)', 'फ़ॉल्स-नेगेटिव दर (असली माने गए नकली)')} />
            )}
          </>
        )}
      </div>
    </>
  )
}

const NAME_HI = {
  'Scam / Digital-Arrest Detection': 'घोटाला / डिजिटल-अरेस्ट डिटेक्शन',
  'Voice-Spoof / Deepfake Detection': 'वॉइस-स्पूफ़ / डीपफेक डिटेक्शन',
  'Counterfeit Currency (FICN) Screening': 'नकली मुद्रा (FICN) स्क्रीनिंग',
}

function MetricBlock({ data, highlight, highlightLabel }) {
  const c = data.confusion
  const name = t(data.name, NAME_HI[data.name])
  const cards = [
    [t('Accuracy', 'सटीकता'), c.accuracy], [t('Precision', 'प्रिसिज़न'), c.precision],
    [t('Recall', 'रिकॉल'), c.recall], [t('F1', 'F1'), c.f1],
  ]
  return (
    <div className="rounded-xl border border-white/8 bg-ink-700 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <h3 className="font-display text-xl font-600 text-white">{name}</h3>
        <span className="text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1">
          {t('decision', 'निर्णय')}: {data.threshold}{data.sample_size ? ` · n=${data.sample_size}` : ` · n=${c.n}`}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-ink-900 border border-white/8 p-4 text-center">
            <div className="font-display text-3xl font-700 text-brand">{v}%</div>
            <div className="text-xs text-gray-400 mt-1">{k}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* highlighted safety metric */}
        <div className={`rounded-lg border p-4 ${c[highlight] <= 5 ? 'border-emerald-500/40 bg-emerald-500/5' : c[highlight] <= 20 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            {c[highlight] <= 5 ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-yellow-400" />}
            {highlightLabel}
          </div>
          <div className="font-display text-4xl font-700 text-white mt-1">{c[highlight]}%</div>
        </div>

        {/* confusion matrix */}
        <div className="rounded-lg bg-ink-900 border border-white/8 p-4">
          <div className="text-xs text-gray-400 mb-2">{t('Confusion matrix', 'कन्फ्यूज़न मैट्रिक्स')}</div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <Cell label={t('True Positive', 'ट्रू पॉज़िटिव')} v={c.tp} />
            <Cell label={t('False Negative', 'फ़ॉल्स नेगेटिव')} v={c.fn} />
            <Cell label={t('False Positive', 'फ़ॉल्स पॉज़िटिव')} v={c.fp} />
            <Cell label={t('True Negative', 'ट्रू नेगेटिव')} v={c.tn} />
          </div>
        </div>
      </div>

      {data.examples && (
        <details className="mt-4">
          <summary className="text-sm text-brand cursor-pointer">{t('Show sample evaluated items', 'मूल्यांकित नमूना आइटम दिखाएँ')} ({data.examples.length})</summary>
          <div className="mt-3 space-y-1.5 max-h-64 overflow-auto">
            {data.examples.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs border-b border-white/5 pb-1.5">
                <span className={`px-2 py-0.5 rounded ${e.correct ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                  {e.correct ? '✓' : '✗'}
                </span>
                <span className="text-gray-500 w-20 shrink-0">truth {e.label} / pred {e.pred}</span>
                <span className="text-gray-500 w-14 shrink-0">score {e.score}</span>
                <span className="text-gray-400 truncate">{e.text || e.kind + (e.hard ? ' (hard)' : '')}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function Cell({ label, v }) {
  return (
    <div className="rounded p-2 bg-ink-700 border border-white/8">
      <div className="font-display text-2xl font-700 text-gray-200">{v}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  )
}
