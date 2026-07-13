import { useRef, useState, useEffect } from 'react'
import { Video, Upload, ShieldAlert, VideoOff, Film, Info, PhoneOff } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { screenVideo } from '../api.js'
import { useLang, t } from '../i18n.js'

const LVL_COLOR = { HIGH: 'bg-red-500', MEDIUM: 'bg-orange-500', LOW: 'bg-emerald-500' }

export default function VideoShield() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const resultRef = useRef(null)
  useLang()

  useEffect(() => { if (res && !loading) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [res, loading])

  const onFile = (f) => {
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f)); setRes(null); setErr(null)
  }

  const run = async () => {
    if (!file) { setErr(t('Upload a short clip first', 'पहले एक छोटी क्लिप अपलोड करें')); return }
    setErr(null); setLoading(true)
    try { setRes(await screenVideo(file)) }
    catch { setErr(t('Backend not reachable, or clip too large / long.', 'बैकएंड उपलब्ध नहीं, या क्लिप बहुत बड़ी/लंबी है।')) }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title={t('Digital-Arrest', 'डिजिटल-अरेस्ट')} accent={t('Video-Call Shield', 'वीडियो-कॉल शील्ड')}
        subtitle={t('The fake-officer video call is the flagship digital-arrest vector. Screen a recorded clip frame-by-frame for deepfake signs — with the caller-verification facts police won’t tell you',
          'नकली-अधिकारी वीडियो कॉल डिजिटल-अरेस्ट का मुख्य हथियार है। रिकॉर्ड की गई क्लिप को फ्रेम-दर-फ्रेम डीपफेक हेतु जाँचें')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        {/* input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <label className="text-sm font-600 text-gray-300 flex items-center gap-2 mb-3">
              <Video size={16} className="text-brand" /> {t('Upload the video-call clip', 'वीडियो-कॉल क्लिप अपलोड करें')}
            </label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-white/15 hover:border-brand/50 rounded-xl p-4 text-center transition-colors">
                {preview ? (
                  <video src={preview} controls className="max-h-64 mx-auto rounded-lg" />
                ) : (
                  <div className="text-gray-500 py-8">
                    <Upload size={36} className="mx-auto mb-2 text-gray-600" />
                    {t('Click to choose a short MP4 / MOV clip (a few seconds is enough)', 'एक छोटी MP4 / MOV क्लिप चुनें (कुछ सेकंड काफ़ी हैं)')}
                  </div>
                )}
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <button onClick={run} disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 py-3 rounded transition-colors">
              <ShieldAlert size={18} /> {loading ? t('Analysing frames…', 'फ्रेम विश्लेषण…') : t('Screen the call', 'कॉल जाँचें')}
            </button>
            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          </div>

          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
            <h3 className="font-display font-600 text-white flex items-center gap-2 mb-2"><PhoneOff size={18} className="text-red-400" /> {t('Know this — it stops the scam cold', 'यह जानें — यह घोटाला तुरंत रोकता है')}</h3>
            <ul className="text-sm text-gray-300 space-y-1.5 list-disc pl-5">
              <li>{t('Police, CBI, ED & courts NEVER arrest or interrogate over a video call.', 'पुलिस, CBI, ED और अदालतें कभी वीडियो कॉल पर गिरफ़्तार/पूछताछ नहीं करतीं।')}</li>
              <li>{t("'Digital arrest' does not exist in Indian law.", "'डिजिटल अरेस्ट' भारतीय कानून में मौजूद ही नहीं है।")}</li>
              <li>{t('Never pay to "clear" a case. Hang up and call 1930.', 'केस "क्लियर" करने हेतु कभी भुगतान न करें। कॉल काटें, 1930 पर कॉल करें।')}</li>
            </ul>
          </div>
        </div>

        {/* output */}
        <div ref={resultRef} className="space-y-4">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Sampling frames & running forensics…', 'फ्रेम सैंपलिंग व फोरेंसिक…')} /></div>}
          {res?.error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400 text-sm">{res.error}</div>}
          {res && !res.error && !loading && (
            <>
              <div className={`rounded-xl border p-6 ${res.risk_level === 'HIGH' ? 'border-red-500/40 bg-red-500/5' : res.risk_level === 'MEDIUM' ? 'border-orange-500/40 bg-orange-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-xs text-gray-500">{res.frames_analysed} {t('frames', 'फ्रेम')} · {res.duration_s}s · {res.high_risk_frames} {t('high-risk', 'उच्च-जोखिम')}</span>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <span className="font-display text-6xl font-700 text-white leading-none">{res.risk_score}</span>
                  <span className="text-gray-500 mb-1">/ 100 {t('deepfake likelihood', 'डीपफेक संभावना')}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-ink-900 overflow-hidden">
                  <div className={`h-full ${LVL_COLOR[res.risk_level]}`} style={{ width: `${res.risk_score}%` }} />
                </div>
                <p className={`text-sm font-600 mt-4 ${res.risk_level === 'HIGH' ? 'text-red-300' : res.risk_level === 'MEDIUM' ? 'text-orange-300' : 'text-emerald-300'}`}>{res.verdict}</p>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3"><Film size={18} className="text-brand" /> {t('Frame-by-frame timeline', 'फ्रेम-दर-फ्रेम टाइमलाइन')}</h3>
                <div className="flex items-end gap-1.5 h-28">
                  {res.frames.map((f, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end group" title={`${f.t}s · ${f.risk_score} · ${f.top_factor}`}>
                      <div className={`w-full rounded-t ${LVL_COLOR[f.risk_level]}`} style={{ height: `${Math.max(6, f.risk_score)}%` }} />
                      <span className="text-[9px] text-gray-500 mt-1">{f.t}s</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-2">{t('Each bar is a sampled frame. A deepfake often slips only in a few frames — the worst frames drive the verdict.', 'हर बार एक सैंपल फ्रेम है। डीपफेक अक्सर कुछ ही फ्रेम में दिखता है — सबसे खराब फ्रेम निर्णय तय करते हैं।')}</p>
              </div>

              <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3"><ShieldAlert size={18} className="text-brand" /> {t('What to do', 'क्या करें')}</h3>
                <ol className="space-y-2">
                  {res.advice.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-200">
                      <span className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-brand text-black text-xs font-700">{i + 1}</span>{a}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-4 text-xs text-gray-500 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" /> {res.disclaimer}
              </div>
            </>
          )}
          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <VideoOff size={40} className="mx-auto mb-3 text-gray-600" />
              {t('Upload a clip, then hit', 'क्लिप अपलोड करें, फिर दबाएँ')} <span className="text-brand">{t('Screen the call', 'कॉल जाँचें')}</span>.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
