import { useEffect, useRef, useState } from 'react'
import {
  Film, Sparkles, TrendingUp, Wand2, FileText, Subtitles, Images,
  Play, Pause, RotateCcw, Download, ExternalLink, RefreshCw, Clock, Mic,
} from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { Spinner } from '../components/ui.jsx'
import { rankArticles, generateReel, listReels, getReel } from '../api.js'
import { useLang, t } from '../i18n.js'

function VoiceToggle({ voice, setVoice, size = '' }) {
  return (
    <div className={`inline-flex rounded-lg border border-white/10 overflow-hidden ${size}`}>
      {['female', 'male'].map((g) => (
        <button key={g} onClick={() => setVoice(g)}
          className={`px-3 py-1.5 text-xs font-600 transition-colors ${voice === g ? 'bg-brand text-black' : 'text-gray-400 hover:text-white'}`}>
          {g === 'female' ? t('Female', 'महिला') : t('Male', 'पुरुष')}
        </button>
      ))}
    </div>
  )
}

const STAGES = [
  ['Ranking trending ET stories…', 'ट्रेंडिंग ET कहानियाँ रैंक हो रही हैं…'],
  ['Writing the script…', 'स्क्रिप्ट लिखी जा रही है…'],
  ['Fetching visuals…', 'विज़ुअल्स लाए जा रहे हैं…'],
  ['Composing subtitles…', 'सबटाइटल बन रहे हैं…'],
  ['Assembling the reel…', 'रील असेंबल हो रही है…'],
]
const STATUS_STYLE = {
  rendered: 'text-emerald-500 border-emerald-500/40 bg-emerald-500/15',
  storyboard_ready: 'text-amber-500 border-amber-500/50 bg-amber-500/15',
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function AwarenessReels() {
  const [ranked, setRanked] = useState(null)
  const [reels, setReels] = useState([])
  const [active, setActive] = useState(null)
  const [gen, setGen] = useState(false)
  const [stage, setStage] = useState(0)
  const [err, setErr] = useState(null)
  const [voice, setVoice] = useState('female')
  const topRef = useRef(null)
  useLang()

  const scrollTop = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)

  const refresh = () => {
    rankArticles(8).then((d) => setRanked(d.ranked)).catch(() => setErr('Backend not reachable on :8000'))
    listReels().then((d) => setReels(d.reels)).catch(() => {})
  }
  useEffect(refresh, [])

  const openReel = (r) => { setGen(false); setActive(r); scrollTop() }

  const generate = async (link) => {
    setErr(null); setActive(null); setGen(true); setStage(0); scrollTop()
    const iv = setInterval(() => setStage((s) => Math.min(STAGES.length - 1, s + 1)), 900)
    const started = Date.now()
    try {
      const r = await generateReel(link, voice)
      await sleep(Math.max(0, 3800 - (Date.now() - started)))   // let the animation breathe
      setActive(r); scrollTop()
      listReels().then((d) => setReels(d.reels)).catch(() => {})
    } catch { setErr('Generation failed — is the backend running?') }
    finally { clearInterval(iv); setGen(false) }
  }

  return (
    <>
      <PageHeader title={t('Awareness', 'जागरूकता')} accent={t('Reels', 'रील्स')}
        subtitle={t('An agent ranks trending ET cyber-fraud stories and turns the top one into a narrated, subtitled reel',
                    'एक एजेंट ट्रेंडिंग ET साइबर-फ्रॉड कहानियों को रैंक करता है और शीर्ष को सुनाई गई, सबटाइटल रील में बदलता है')} />
      <div ref={topRef} className="p-4 md:p-8 space-y-6 scroll-mt-4">
        {/* HERO / GENERATOR */}
        {gen ? (
          <GeneratingCard stage={stage} />
        ) : active ? (
          <ActiveReel reel={active} onClose={() => setActive(null)} />
        ) : (
          <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 to-transparent p-8 text-center fade-in">
            <Film size={40} className="mx-auto mb-3 text-brand" />
            <h2 className="font-display text-2xl font-700 text-white">{t('Auto-generate a scam-awareness reel', 'स्वतः घोटाला-जागरूकता रील बनाएँ')}</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              {t('The agent picks the top-ranked Economic Times cyber-fraud story and produces a narrated, subtitled reel — press play to watch it right here.',
                 'एजेंट शीर्ष-रैंक इकोनॉमिक टाइम्स साइबर-फ्रॉड कहानी चुनता है और सुनाई गई, सबटाइटल रील बनाता है — यहीं चलाकर देखें।')}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400 flex items-center gap-1"><Mic size={14} /> {t('Voice', 'आवाज़')}</span>
              <VoiceToggle voice={voice} setVoice={setVoice} />
            </div>
            <button onClick={() => generate(null)}
              className="mt-4 inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-black font-700 px-7 py-3 rounded transition-colors">
              <Wand2 size={18} /> {t('Generate reel from top story', 'शीर्ष कहानी से रील बनाएँ')}
            </button>
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
          </div>
        )}

        {/* RANKED + LIBRARY */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-600 text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-brand" /> {t('Ranked cyber-fraud stories', 'रैंक की गई साइबर-फ्रॉड कहानियाँ')}
              </h3>
              <button onClick={refresh} className="text-gray-400 hover:text-brand" title="Refresh"><RefreshCw size={15} /></button>
            </div>
            {!ranked && !err && <Spinner label={t('Ranking articles…', 'लेख रैंक हो रहे हैं…')} />}
            <div className="space-y-2">
              {ranked?.map((a, i) => (
                <div key={i} className="rounded-lg bg-ink-900 border border-white/8 p-3 flex items-start gap-3">
                  <span className="font-display text-lg font-700 text-brand w-6 shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <a href={a.link} target="_blank" rel="noreferrer" className="text-sm text-gray-200 font-600 hover:text-brand line-clamp-2">{a.title}</a>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-1.5 w-24 rounded-full bg-ink-500 overflow-hidden">
                        <div className="h-full bg-brand" style={{ width: `${Math.min(100, a.score)}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-500">{t('score', 'स्कोर')} {a.score}</span>
                    </div>
                  </div>
                  <button onClick={() => generate(a.link)} disabled={gen}
                    className="shrink-0 text-xs border border-brand/40 text-brand rounded px-2.5 py-1 hover:bg-brand/10 disabled:opacity-50">
                    {t('Reel', 'रील')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
              <Film size={18} className="text-brand" /> {t('Reel library', 'रील लाइब्रेरी')}
            </h3>
            {reels.length === 0 && <p className="text-sm text-gray-500">{t('No reels yet — generate one above.', 'अभी कोई रील नहीं — ऊपर से बनाएँ।')}</p>}
            <div className="space-y-2">
              {reels.map((r) => (
                <button key={r.id} onClick={() => getReel(r.id).then(openReel)}
                  className="w-full text-left rounded-lg bg-ink-900 border border-white/8 p-3 hover:border-brand/40 transition-colors flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-200 line-clamp-1">{r.article?.title || r.id}</span>
                  <span className={`shrink-0 text-[10px] uppercase border rounded px-2 py-0.5 ${STATUS_STYLE[r.status] || 'text-gray-400 border-white/15'}`}>{r.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ---------------- generating animation ---------------- */
function GeneratingCard({ stage }) {
  return (
    <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 to-transparent p-8 fade-in">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full border-[3px] border-brand/25 border-t-brand animate-spin" />
        <div className="mt-6 font-display text-xl md:text-2xl font-700 text-brand uppercase tracking-wide min-h-[2rem]">
          {t(...STAGES[stage])}
        </div>
        <div className="mt-5 w-full max-w-md space-y-2">
          {STAGES.map(([en, hi], i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all ${i <= stage ? 'text-gray-200' : 'text-gray-600'}`}>
              <span className={`w-4 h-4 rounded-full grid place-items-center text-[9px] ${i < stage ? 'bg-brand text-black' : i === stage ? 'border-2 border-brand' : 'border border-white/15'}`}>
                {i < stage ? '✓' : ''}
              </span>
              {t(en, hi)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- active reel = player + details ---------------- */
function ActiveReel({ reel, onClose }) {
  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs uppercase tracking-wide border rounded px-2.5 py-1 ${STATUS_STYLE[reel.status] || 'text-gray-400 border-white/15'}`}>{reel.status}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> {reel.id}</span>
        </div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-brand">✕ {t('close', 'बंद करें')}</button>
      </div>

      <ReelPlayer reel={reel} />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
          <h4 className="font-display font-600 text-white flex items-center gap-2 mb-2">
            <FileText size={16} className="text-brand" /> {reel.script?.ai_written ? t('Script (Gemini)', 'स्क्रिप्ट (जेमिनी)') : t('Script', 'स्क्रिप्ट')}
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">{reel.script?.narration}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
          <h4 className="font-display font-600 text-white flex items-center gap-2 mb-3">
            <Subtitles size={16} className="text-brand" /> {t('Subtitles', 'सबटाइटल')}
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-auto">
            {reel.script?.segments?.map((s, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="text-gray-500 w-20 shrink-0 font-mono">{s.start}s–{s.end}s</span>
                <span className="text-gray-300">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <a href={reel.article?.link} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-brand text-sm font-600 hover:gap-2.5 transition-all">
        <Images size={14} /> {t('Source article on Economic Times', 'इकोनॉमिक टाइम्स पर स्रोत लेख')} <ExternalLink size={14} />
      </a>
    </div>
  )
}

/* ---------------- canvas reel player ---------------- */
function pickVoice(langCode, gender) {
  const vs = window.speechSynthesis?.getVoices() || []
  if (!vs.length) return null
  const inLang = vs.filter((v) => v.lang.toLowerCase().startsWith(langCode))
  const pool = inLang.length ? inLang : vs
  const female = /female|zira|samantha|heera|swara|neerja|kalpana|aria|jenny|susan|linda|eva|salli/i
  const male = /male|david|mark|ravi|prabhat|rishi|alex|daniel|george|guy|matthew/i
  const rx = gender === 'male' ? male : female
  return pool.find((v) => rx.test(v.name))
    || pool.find((v) => (gender === 'male' ? male.test(v.name) : !male.test(v.name)))
    || pool[0]
}

function ReelPlayer({ reel }) {
  const canvasRef = useRef(null)
  const stRef = useRef({ t: 0, last: 0, raf: 0, playing: false, imgs: [], rec: null, recording: false, voice: reel.voice || 'female' })
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pvoice, setPVoice] = useState(reel.voice || 'female')
  const lang = useLang()

  useEffect(() => {  // populate speech voices asap
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {}
  }, [])

  const duration = reel.script?.duration_s || 20
  const segments = reel.script?.segments || []
  const sources = (reel.storyboard || []).map((s) => s.url)

  // preload images through the CORS-safe proxy
  useEffect(() => {
    let alive = true
    Promise.all(sources.map((url) => new Promise((res) => {
      const im = new Image(); im.crossOrigin = 'anonymous'
      im.onload = () => res(im); im.onerror = () => res(null)
      im.src = `/api/img?url=${encodeURIComponent(url)}`
    }))).then((list) => { if (alive) { stRef.current.imgs = list.filter(Boolean); draw(0) } })
    return () => { alive = false; stop(); window.speechSynthesis?.cancel() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel.id])

  function drawCover(ctx, img, W, H, zoom) {
    const ir = img.width / img.height, cr = W / H
    let w, h
    if (ir > cr) { h = H * zoom; w = h * ir } else { w = W * zoom; h = w / ir }
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
  }

  function wrap(ctx, text, maxW) {
    const words = text.split(' '); const lines = []; let line = ''
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w } else line = test
    }
    if (line) lines.push(line)
    return lines
  }

  function draw(t) {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); const W = c.width, H = c.height
    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, W, H)
    const imgs = stRef.current.imgs
    if (imgs.length) {
      const per = duration / imgs.length
      const idx = Math.min(imgs.length - 1, Math.floor(t / per))
      const p = Math.max(0, Math.min(1, (t - idx * per) / per))
      if (imgs[idx]) drawCover(ctx, imgs[idx], W, H, 1.05 + 0.09 * p)
    } else {
      ctx.fillStyle = '#16161a'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#555'; ctx.font = '20px Inter, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Loading visuals…', W / 2, H / 2)
    }
    // bottom gradient
    const g = ctx.createLinearGradient(0, H * 0.5, 0, H)
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.88)')
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5)
    // brand
    ctx.textAlign = 'left'
    ctx.fillStyle = '#f7941e'; ctx.font = 'bold 30px Inter, sans-serif'; ctx.fillText('KAVACH AI', 30, 50)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '16px Inter, sans-serif'; ctx.fillText('SCAM AWARENESS', 30, 74)
    // subtitle
    const seg = segments.find((s) => t >= s.start && t < s.end) || (t >= duration ? segments[segments.length - 1] : null)
    if (seg) {
      ctx.font = 'bold 34px Inter, sans-serif'; ctx.textAlign = 'center'
      const lines = wrap(ctx, seg.text, W * 0.82)
      let y = H - 60 - (lines.length - 1) * 42
      for (const ln of lines) {
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(ln, W / 2, y)
        ctx.fillStyle = '#fff'; ctx.fillText(ln, W / 2, y); y += 42
      }
    }
    // progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(0, H - 8, W, 8)
    ctx.fillStyle = '#f7941e'; ctx.fillRect(0, H - 8, W * Math.min(1, t / duration), 8)
  }

  function speak() {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(reel.script?.narration || '')
    const g = stRef.current.voice
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
    const v = pickVoice(lang === 'hi' ? 'hi' : 'en', g)
    if (v) u.voice = v
    u.rate = 1.0; u.pitch = g === 'female' ? 1.06 : 0.94
    window.speechSynthesis.speak(u)
  }

  function changeVoice(g) {
    stRef.current.voice = g; setPVoice(g)
    if (stRef.current.playing) restart()
  }

  function loop(now) {
    const st = stRef.current
    if (!st.playing) return
    const dt = (now - st.last) / 1000; st.last = now
    st.t += dt
    if (st.t >= duration) {
      st.t = duration; draw(st.t); setProgress(1)
      finish()
      return
    }
    draw(st.t); setProgress(st.t / duration)
    st.raf = requestAnimationFrame(loop)
  }

  function play() {
    const st = stRef.current
    if (st.t >= duration) st.t = 0
    st.playing = true; st.last = performance.now()
    setPlaying(true)
    if (!st.recording) { if (st.t < 0.05) speak(); else window.speechSynthesis?.resume() }
    st.raf = requestAnimationFrame(loop)
  }

  function stop() {
    const st = stRef.current
    st.playing = false; setPlaying(false)
    cancelAnimationFrame(st.raf)
  }

  function pause() { stop(); window.speechSynthesis?.pause() }
  function restart() { window.speechSynthesis?.cancel(); stRef.current.t = 0; setProgress(0); play() }

  function finish() {
    const st = stRef.current
    st.playing = false; setPlaying(false)
    if (st.recording && st.rec) { st.rec.stop() }
  }

  async function download() {
    if (reel.mp4) {                       // server-rendered MP4 (has audio)
      const a = document.createElement('a'); a.href = `/${reel.mp4}`; a.download = `${reel.id}.mp4`; a.click(); return
    }
    // record the canvas slideshow (visuals + subtitles) to a WebM
    const c = canvasRef.current; if (!c || !c.captureStream) { alert('Recording not supported in this browser.'); return }
    window.speechSynthesis?.cancel()
    const stream = c.captureStream(30)
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
    const chunks = []
    const rec = new MediaRecorder(stream, { mimeType: mime })
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${reel.id}.webm`; a.click()
      stRef.current.recording = false; stRef.current.rec = null; setRecording(false)
    }
    stRef.current.recording = true; stRef.current.rec = rec; setRecording(true)
    rec.start()
    stRef.current.t = 0; setProgress(0); play()
  }

  const btn = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-600 transition-colors'
  return (
    <div className="rounded-2xl border border-white/8 bg-ink-800 overflow-hidden">
      <canvas ref={canvasRef} width={1280} height={720} className="w-full block bg-black" />
      <div className="flex items-center gap-2 p-3 flex-wrap">
        {playing ? (
          <button onClick={pause} className={`${btn} bg-brand text-black hover:bg-brand-600`}><Pause size={16} /> {t('Pause', 'रोकें')}</button>
        ) : (
          <button onClick={play} className={`${btn} bg-brand text-black hover:bg-brand-600`}><Play size={16} /> {t('Play', 'चलाएँ')}</button>
        )}
        <button onClick={restart} className={`${btn} border border-white/10 text-gray-300 hover:text-white`}><RotateCcw size={15} /> {t('Restart', 'फिर से')}</button>
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500"><Mic size={13} /></span>
        <VoiceToggle voice={pvoice} setVoice={changeVoice} />
        <button onClick={download} disabled={recording}
          className={`${btn} border border-brand/40 text-brand hover:bg-brand/10 disabled:opacity-50 ml-auto`}>
          <Download size={15} /> {recording ? t('Recording…', 'रिकॉर्ड हो रहा है…') : (reel.mp4 ? t('Download MP4', 'MP4 डाउनलोड') : t('Download clip', 'क्लिप डाउनलोड'))}
        </button>
      </div>
      <div className="h-1 bg-ink-500"><div className="h-full bg-brand transition-[width]" style={{ width: `${progress * 100}%` }} /></div>
      {!reel.mp4 && (
        <p className="text-[11px] text-gray-500 px-3 py-2">
          {t('Narration is spoken live in your browser. The downloadable clip contains the visuals + subtitles; run the local render worker (Kokoro + ffmpeg) for an audio MP4.',
             'नैरेशन आपके ब्राउज़र में लाइव बोला जाता है। डाउनलोड क्लिप में विज़ुअल + सबटाइटल हैं; ऑडियो MP4 हेतु लोकल रेंडर वर्कर चलाएँ।')}
        </p>
      )}
    </div>
  )
}
