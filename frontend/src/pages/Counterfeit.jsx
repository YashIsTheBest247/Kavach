import { useEffect, useState, useRef } from 'react'
import { Upload, ScanLine, CheckCircle2, XCircle, Info } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { getCounterfeitFeatures, screenNote } from '../api.js'
import { useLang, t } from '../i18n.js'

const DENOMS = ['100', '200', '500', '2000']

const FEATURE_HI = {
  security_thread: "विंडोड सुरक्षा धागा 'भारत' / 'RBI' दिखाता है और रंग हरा→नीला बदलता है",
  watermark: 'महात्मा गांधी वॉटरमार्क + इलेक्ट्रोटाइप मूल्यवर्ग रोशनी में दिखता है',
  intaglio: 'पोर्ट्रेट, अशोक स्तंभ और पहचान चिह्न पर उभरी (इंटैग्लियो) छपाई महसूस होती है',
  latent_image: '45° पर पकड़ने पर गुप्त मूल्यवर्ग अंक दिखाई देता है',
  microlettering: "माइक्रोलेटरिंग 'RBI' + मूल्यवर्ग आवर्धन में पढ़ने योग्य",
  see_through: 'सी-थ्रू रजिस्टर: फूलों का डिज़ाइन पूरा मूल्यवर्ग बनाता है',
}

export default function Counterfeit() {
  const [features, setFeatures] = useState([])
  const [denom, setDenom] = useState('500')
  const [confirmed, setConfirmed] = useState([])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const resultRef = useRef(null)
  useLang()

  useEffect(() => {
    getCounterfeitFeatures().then((d) => setFeatures(d.features)).catch(() => {})
  }, [])

  // Scroll to the result panel once a verdict is ready.
  useEffect(() => {
    if (res && !loading) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [res, loading])

  const onFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setRes(null)
  }

  const toggle = (key) =>
    setConfirmed((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]))

  const run = async () => {
    if (!file) { setErr('Upload a note image first'); return }
    setErr(null); setLoading(true)
    try { setRes(await screenNote(file, denom, confirmed)) }
    catch { setErr('Backend not reachable on :8000') }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title={t('Counterfeit Currency', 'नकली मुद्रा')} accent={t('Screening', 'स्क्रीनिंग')}
        subtitle={t('Explainable image-forensics + security-feature checklist for FICN screening at point of contact', 'संपर्क बिंदु पर नकली नोट जाँच हेतु व्याख्यायोग्य इमेज-फोरेंसिक + सुरक्षा-फ़ीचर चेकलिस्ट')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <label className="text-sm font-600 text-gray-300">{t('Denomination', 'मूल्यवर्ग')}</label>
            <div className="flex gap-2 mt-2">
              {DENOMS.map((d) => (
                <button key={d} onClick={() => setDenom(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-600 border transition-colors ${denom === d ? 'bg-brand text-black border-brand' : 'bg-ink-900 text-gray-300 border-white/10 hover:border-brand/40'}`}>
                  ₹{d}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-brand/40 transition-colors">
                {preview ? (
                  <img src={preview} alt="note" className="max-h-44 mx-auto rounded-lg" />
                ) : (
                  <div className="text-gray-500">
                    <Upload size={32} className="mx-auto mb-2" />
                    <div className="text-sm">{t('Click to upload note image', 'नोट इमेज अपलोड करने हेतु क्लिक करें')}</div>
                    <div className="text-xs mt-1">{t('JPG / PNG · capture in good light', 'JPG / PNG · अच्छी रोशनी में कैप्चर करें')}</div>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="text-sm font-600 text-gray-300 mb-1">{t('Confirm visible security features', 'दिखाई देने वाली सुरक्षा विशेषताएँ पुष्टि करें')}</div>
            <p className="text-xs text-gray-500 mb-3">{t('Tick each genuine feature the operator can verify on the note.', 'नोट पर ऑपरेटर जो असली विशेषता सत्यापित कर सके उसे टिक करें।')}</p>
            <div className="space-y-2">
              {features.map((f) => (
                <label key={f.key} className="flex items-start gap-3 text-sm cursor-pointer bg-ink-900 border border-white/8 rounded-lg px-3 py-2.5 hover:border-brand/30">
                  <input type="checkbox" checked={confirmed.includes(f.key)} onChange={() => toggle(f.key)}
                    className="mt-0.5 accent-brand" />
                  <span className="text-gray-300">{t(f.label, FEATURE_HI[f.key])}</span>
                </label>
              ))}
            </div>
            <button onClick={run} disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-3 rounded transition-colors">
              <ScanLine size={16} /> {loading ? t('Screening…', 'जाँच हो रही है…') : t('Screen note', 'नोट जाँचें')}
            </button>
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
          </div>
        </div>

        <div ref={resultRef} className="space-y-4 scroll-mt-24">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Running forensics…', 'फोरेंसिक चल रहा है…')} /></div>}
          {res && !loading && (
            <>
              <div className={`rounded-xl border p-6 ${res.risk_level === 'HIGH' ? 'border-red-500/40 bg-red-500/5' : res.risk_level === 'MEDIUM' ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-xs text-gray-500">{t('confidence', 'विश्वास')} {Math.round(res.confidence * 100)}%</span>
                </div>
                <div className="mt-4 font-display text-2xl font-700 text-white">{res.verdict}</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-display text-5xl font-700 text-white">{res.counterfeit_risk_score}</span>
                  <span className="text-gray-500 mb-1">{t('/ 100 counterfeit risk', '/ 100 नकली जोखिम')}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-ink-900 overflow-hidden">
                  <div className={`h-full ${res.counterfeit_risk_score >= 65 ? 'bg-red-500' : res.counterfeit_risk_score >= 35 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${res.counterfeit_risk_score}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white mb-3">{t('Contributing factors', 'योगदान कारक')}</h3>
                <div className="space-y-2">
                  {res.factors.map((f, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm border-b border-white/5 pb-2">
                      <div>
                        <div className="text-gray-200 font-600">{f.factor}</div>
                        <div className="text-gray-500 text-xs">{f.detail}</div>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded ${f.direction === 'raises' ? 'bg-red-500/15 text-red-300' : f.direction === 'lowers' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-gray-400'}`}>
                        {f.direction === 'raises' ? '+' : f.direction === 'lowers' ? '−' : ''}{f.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/20 bg-ink-700 p-4">
                  <div className="text-xs text-emerald-400 font-600 mb-2 flex items-center gap-1"><CheckCircle2 size={14} /> {t('Confirmed', 'पुष्टि')}</div>
                  {res.confirmed_features.length ? res.confirmed_features.map((f, i) => (
                    <div key={i} className="text-xs text-gray-400 mb-1">• {f}</div>
                  )) : <div className="text-xs text-gray-600">{t('None', 'कोई नहीं')}</div>}
                </div>
                <div className="rounded-xl border border-red-500/20 bg-ink-700 p-4">
                  <div className="text-xs text-red-400 font-600 mb-2 flex items-center gap-1"><XCircle size={14} /> {t('Missing / unverified', 'अनुपस्थित / असत्यापित')}</div>
                  {res.missing_features.length ? res.missing_features.map((f, i) => (
                    <div key={i} className="text-xs text-gray-400 mb-1">• {f}</div>
                  )) : <div className="text-xs text-gray-600">{t('None', 'कोई नहीं')}</div>}
                </div>
              </div>

              {res.forensics?.available && (
                <div className="rounded-xl border border-white/8 bg-ink-700 p-5 text-xs text-gray-400">
                  <div className="font-600 text-gray-300 mb-2">{t('Image forensics', 'इमेज फोरेंसिक')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <span>Resolution: {res.forensics.width}×{res.forensics.height} ({res.forensics.megapixels} MP)</span>
                    <span>Aspect ratio: {res.forensics.aspect_ratio}</span>
                    <span>Avg RGB: {res.forensics.avg_rgb?.join(', ')}</span>
                    <span>Colour variance: {res.forensics.colour_variance}</span>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-ink-800 border border-white/8 p-3 text-xs text-gray-500 flex gap-2">
                <Info size={14} className="shrink-0 mt-0.5" /> {res.disclaimer}
              </div>
            </>
          )}
          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <ScanLine size={40} className="mx-auto mb-3 text-gray-600" />
              {t('Upload a note, confirm visible features, then', 'नोट अपलोड करें, दिखाई देने वाली विशेषताएँ पुष्टि करें, फिर')} <span className="text-brand">{t('Screen note', 'नोट जाँचें')}</span>.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
