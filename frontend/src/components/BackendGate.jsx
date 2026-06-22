import { useEffect, useState } from 'react'
import { getHealth } from '../api.js'
import { t } from '../i18n.js'

const MESSAGES = [
  ['Connecting to Kavach AI…', 'कवच AI से कनेक्ट हो रहा है…'],
  ['Waking the AI engine…', 'AI इंजन जगाया जा रहा है…'],
  ['Loading risk models…', 'जोखिम मॉडल लोड हो रहे हैं…'],
  ['Building the fraud graph…', 'फ्रॉड ग्राफ़ बनाया जा रहा है…'],
  ['Loading the crime map…', 'क्राइम मैप लोड हो रहा है…'],
  ['Pulling the Economic Times feed…', 'इकोनॉमिक टाइम्स फ़ीड लाया जा रहा है…'],
  ['Almost ready…', 'लगभग तैयार…'],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Remember across mounts so re-entering the console doesn't re-show the screen.
let backendAwake = false

export default function BackendGate({ children }) {
  const [ready, setReady] = useState(backendAwake)
  const [idx, setIdx] = useState(0)

  // Poll backend health until it responds (handles Render cold start).
  useEffect(() => {
    if (ready) return
    let cancelled = false
    const start = Date.now()
    ;(async () => {
      while (!cancelled) {
        try {
          await getHealth()
          backendAwake = true
          if (!cancelled) setReady(true)
          return
        } catch {
          // give up after ~90s and let the app render (it shows its own errors)
          if (Date.now() - start > 90000) { if (!cancelled) setReady(true); return }
          await sleep(1500)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Cycle the status messages while waiting.
  useEffect(() => {
    if (ready) return
    const id = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 1800)
    return () => clearInterval(id)
  }, [ready])

  if (ready) return children

  const [en, hi] = MESSAGES[idx]
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-white text-center px-6">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border-[3px] border-brand/25 border-t-brand animate-spin" />
        <div className="mt-8 font-display text-2xl md:text-3xl font-700 text-brand uppercase tracking-wide min-h-[2.2rem] transition-all">
          {t(en, hi)}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          {t('Free-tier server is waking up — this can take up to a minute on first load.',
             'फ्री-टियर सर्वर जाग रहा है — पहली बार लोड में एक मिनट तक लग सकता है।')}
        </p>
        <div className="mt-6 flex items-center gap-1.5">
          {MESSAGES.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-brand' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
