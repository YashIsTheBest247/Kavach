import { useState, useRef, useEffect } from 'react'
import { Upload, ScanEye, ArrowUpRight, ArrowDownRight, Info, ImageOff } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { screenImage } from '../api.js'
import { useLang, t } from '../i18n.js'

export default function DeepfakeImage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const resultRef = useRef(null)
  useLang()

  useEffect(() => {
    if (res && !loading) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [res, loading])

  const onFile = (f) => {
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f)); setRes(null); setErr(null)
  }

  const run = async () => {
    if (!file) { setErr(t('Upload an image first', 'पहले एक छवि अपलोड करें')); return }
    setErr(null); setLoading(true)
    try { setRes(await screenImage(file)) }
    catch { setErr('Backend not reachable on :8000') }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title={t('Deepfake / AI-Image', 'डीपफेक / AI-छवि')} accent={t('Detector', 'डिटेक्टर')}
        subtitle={t('Explainable image-forensics triage for fake profile photos and forged IDs — every signal shown',
          'नकली प्रोफ़ाइल फ़ोटो और जाली पहचान-पत्रों हेतु व्याख्यायोग्य इमेज-फोरेंसिक — हर संकेत दर्शाया गया')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        {/* input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <label className="text-sm font-600 text-gray-300 flex items-center gap-2 mb-3">
              <Upload size={16} className="text-brand" /> {t('Upload image to screen', 'जाँचने हेतु छवि अपलोड करें')}
            </label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-white/15 hover:border-brand/50 rounded-xl p-6 text-center transition-colors">
                {preview ? (
                  <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-lg" />
                ) : (
                  <div className="text-gray-500 py-8">
                    <Upload size={36} className="mx-auto mb-2 text-gray-600" />
                    {t('Click to choose a photo (JPG / PNG)', 'फ़ोटो चुनने हेतु क्लिक करें (JPG / PNG)')}
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <button onClick={run} disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-3 rounded transition-colors">
              <ScanEye size={18} /> {loading ? t('Screening…', 'जाँच हो रही है…') : t('Screen image', 'छवि जाँचें')}
            </button>
            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          </div>

          <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-4 text-xs text-yellow-200/90 flex items-start gap-2">
            <Info size={15} className="shrink-0 mt-0.5" />
            {t('Heuristic forensics MVP — a triage signal, not a trained CNN. Combine with human review for high-stakes decisions.',
              'ह्यूरिस्टिक फोरेंसिक MVP — यह एक ट्रायेज संकेत है, प्रशिक्षित CNN नहीं। महत्वपूर्ण निर्णयों हेतु मानव समीक्षा के साथ प्रयोग करें।')}
          </div>
        </div>

        {/* output */}
        <div ref={resultRef} className="space-y-4">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Analysing pixels…', 'पिक्सल विश्लेषण…')} /></div>}
          {res?.error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400 text-sm">{res.error}</div>}
          {res && !res.error && !loading && (
            <>
              <div className={`rounded-xl border p-6 ${res.risk_level === 'HIGH' ? 'border-red-500/40 bg-red-500/5' : res.risk_level === 'MEDIUM' ? 'border-orange-500/40 bg-orange-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-xs text-gray-500">{res.dimensions} · {t('confidence', 'विश्वास')} {Math.round(res.confidence * 100)}%</span>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <span className="font-display text-6xl font-700 text-white leading-none">{res.risk_score}</span>
                  <span className="text-gray-500 mb-1">/ 100 {t('synthetic likelihood', 'कृत्रिम संभावना')}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-ink-900 overflow-hidden">
                  <div className={`h-full ${res.risk_score >= 60 ? 'bg-red-500' : res.risk_score >= 35 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${res.risk_score}%` }} />
                </div>
                <p className={`text-sm font-600 mt-4 ${res.risk_level === 'HIGH' ? 'text-red-300' : res.risk_level === 'MEDIUM' ? 'text-orange-300' : 'text-emerald-300'}`}>{res.verdict}</p>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
                  <ScanEye size={18} className="text-brand" /> {t('Forensic signals', 'फोरेंसिक संकेत')}
                </h3>
                <div className="space-y-2">
                  {res.factors.map((f, i) => {
                    const raises = f.direction === 'raises'
                    return (
                      <div key={i} className="flex items-start gap-3 text-sm border-b border-white/5 pb-2 last:border-0">
                        <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${raises ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                          {raises ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {f.impact}
                        </span>
                        <div className="min-w-0">
                          <div className="text-gray-200 font-600">{f.factor}</div>
                          <div className="text-gray-500 text-xs">{f.detail}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-4 text-xs text-gray-500 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" /> {res.disclaimer}
              </div>
            </>
          )}
          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <ImageOff size={40} className="mx-auto mb-3 text-gray-600" />
              {t('Upload a photo, then hit', 'फ़ोटो अपलोड करें, फिर दबाएँ')} <span className="text-brand">{t('Screen image', 'छवि जाँचें')}</span>.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
