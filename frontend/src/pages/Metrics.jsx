import { useEffect, useState } from 'react'
import { Target, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { Spinner } from '../components/ui.jsx'
import { getMetrics } from '../api.js'

export default function Metrics() {
  const [m, setM] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    getMetrics().then(setM).catch(() => setErr('Backend not reachable on :8000'))
  }, [])

  return (
    <>
      <PageHeader title="Measured" accent="Metrics"
        subtitle="Detectors evaluated on labelled hold-out sets — the numbers that actually save lives" />
      <div className="p-8 space-y-8">
        {err && <p className="text-red-400">{err}</p>}
        {!m && !err && <Spinner label="Running evaluation…" />}
        {m && (
          <>
            <div className="rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 to-transparent p-5 flex items-start gap-3">
              <Target className="text-brand shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-gray-300">
                <span className="font-600 text-white">Why these two numbers matter most:</span>{' '}
                for a citizen-facing tool the <span className="text-emerald-400 font-600">false-positive rate</span> must be near-zero
                (no false alarms), and for a life-safety tool the <span className="text-red-400 font-600">false-negative rate</span> is
                the metric that decides whether a scam slips through. Both are reported below, openly.
              </div>
            </div>

            <MetricBlock data={m.scam} icon={ShieldCheck} highlight="false_positive_rate"
              highlightLabel="False-positive rate (citizen false alarms)" />
            <MetricBlock data={m.voice} icon={ShieldCheck} highlight="false_negative_rate"
              highlightLabel="False-negative rate (deepfakes missed)" />
            {m.counterfeit && (
              <MetricBlock data={m.counterfeit} icon={ShieldCheck} highlight="false_negative_rate"
                highlightLabel="False-negative rate (fakes passed as genuine)" />
            )}
          </>
        )}
      </div>
    </>
  )
}

function MetricBlock({ data, highlight, highlightLabel }) {
  const c = data.confusion
  const cards = [
    ['Accuracy', c.accuracy], ['Precision', c.precision],
    ['Recall', c.recall], ['F1', c.f1],
  ]
  return (
    <div className="rounded-xl border border-white/8 bg-ink-700 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <h3 className="font-display text-xl font-600 text-white">{data.name}</h3>
        <span className="text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1">
          decision: {data.threshold}{data.sample_size ? ` · n=${data.sample_size}` : ` · n=${c.n}`}
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
          <div className="text-xs text-gray-400 mb-2">Confusion matrix</div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <Cell label="True Positive" v={c.tp} />
            <Cell label="False Negative" v={c.fn} />
            <Cell label="False Positive" v={c.fp} />
            <Cell label="True Negative" v={c.tn} />
          </div>
        </div>
      </div>

      {data.examples && (
        <details className="mt-4">
          <summary className="text-sm text-brand cursor-pointer">Show sample evaluated items ({data.examples.length})</summary>
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
