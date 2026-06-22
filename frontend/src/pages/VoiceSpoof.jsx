import { useState } from 'react'
import { Mic, Upload, Waves, Volume2, Info } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { voiceDemo, analyzeVoice } from '../api.js'

export default function VoiceSpoof() {
  const [res, setRes] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const runDemo = async (kind) => {
    setErr(null); setLoading(true); setRes(null); setAudioUrl(null)
    try {
      const d = await voiceDemo(kind)
      setRes(d)
      if (d.audio_b64) setAudioUrl(`data:audio/wav;base64,${d.audio_b64}`)
    } catch { setErr('Backend not reachable on :8000') }
    finally { setLoading(false) }
  }

  const onFile = async (f) => {
    if (!f) return
    setErr(null); setLoading(true); setRes(null)
    setAudioUrl(URL.createObjectURL(f))
    try {
      const d = await analyzeVoice(f)
      if (d.error) { setErr(d.error); setRes(null) } else setRes(d)
    } catch { setErr('Backend not reachable on :8000') }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title="Voice-Spoof" accent="& Deepfake Detection"
        subtitle="Explainable audio forensics that flags synthetic / AI-cloned voices used in scam calls" />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        {/* input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="text-sm font-600 text-gray-300 mb-1 flex items-center gap-2">
              <Waves size={16} className="text-brand" /> Try a labelled demo clip
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Generates a clip with known ground truth, plays it, and screens it — no audio file needed.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => runDemo('synthetic')} disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-ink-900 text-gray-300 py-3 hover:border-brand/50 hover:text-white transition-colors disabled:opacity-60">
                Synthetic / AI voice
              </button>
              <button onClick={() => runDemo('human')} disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-ink-900 text-gray-300 py-3 hover:border-brand/50 hover:text-white transition-colors disabled:opacity-60">
                Human voice
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="text-sm font-600 text-gray-300 mb-3">…or upload a call recording (WAV)</div>
            <label className="block">
              <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-brand/40 transition-colors">
                <Upload size={30} className="mx-auto mb-2 text-gray-500" />
                <div className="text-sm text-gray-400">Click to upload a .wav clip</div>
                <div className="text-xs text-gray-600 mt-1">mono/stereo PCM WAV · a few seconds is enough</div>
                <input type="file" accept="audio/wav,.wav" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
              </div>
            </label>
            {audioUrl && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Volume2 size={12} /> Playback</div>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
          </div>

          <div className="rounded-lg bg-ink-800 border border-white/8 p-3 text-xs text-gray-500 flex gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            Heuristic MVP — pairs with the scam-script detector to catch AI-voice digital-arrest calls. Measured accuracy on the Metrics page.
          </div>
        </div>

        {/* output */}
        <div className="space-y-4">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label="Running audio forensics…" /></div>}
          {res && !loading && (
            <>
              <div className={`rounded-xl border p-6 ${res.risk_level === 'HIGH' ? 'border-red-500/40 bg-red-500/5' : res.risk_level === 'MEDIUM' ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-xs text-gray-500">confidence {Math.round(res.confidence * 100)}%</span>
                </div>
                <div className="mt-4 font-display text-2xl font-700 text-white">{res.verdict}</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-display text-5xl font-700 text-white">{res.synthetic_risk_score}</span>
                  <span className="text-gray-500 mb-1">/ 100 synthetic-voice risk</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-ink-900 overflow-hidden">
                  <div className={`h-full ${res.synthetic_risk_score >= 60 ? 'bg-red-500' : res.synthetic_risk_score >= 35 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${res.synthetic_risk_score}%` }} />
                </div>
                {res.demo_kind && (
                  <div className="mt-3 text-xs text-gray-500">
                    Ground truth for this demo clip: <span className="text-gray-300 font-600">{res.demo_kind === 'synthetic' ? 'Synthetic / AI' : 'Human'}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white mb-3">Acoustic factors</h3>
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

              {res.features && (
                <div className="rounded-xl border border-white/8 bg-ink-700 p-5 text-xs text-gray-400">
                  <div className="font-600 text-gray-300 mb-2">Extracted features</div>
                  <div className="grid grid-cols-2 gap-2">
                    <span>Duration: {res.features.duration_s}s @ {res.features.sample_rate} Hz</span>
                    <span>Energy CV: {res.features.energy_cv}</span>
                    <span>Silence ratio: {res.features.silence_ratio}</span>
                    <span>Noise floor: {res.features.noise_floor}</span>
                    <span>HF ratio: {res.features.hf_ratio}</span>
                    <span>Spectral flatness: {res.features.spectral_flatness}</span>
                    <span>Pitch jitter: {res.features.pitch_jitter}</span>
                    <span>Centroid: {res.features.spectral_centroid_hz} Hz</span>
                  </div>
                </div>
              )}
            </>
          )}
          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <Mic size={40} className="mx-auto mb-3 text-gray-600" />
              Try a demo clip or upload a recording to screen for AI-cloned voice.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
