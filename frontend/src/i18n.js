import { useEffect, useState } from 'react'

const KEY = 'kavach-lang'
const listeners = new Set()

let current = 'en'
try { current = localStorage.getItem(KEY) || 'en' } catch { /* ignore */ }

export function getLang() {
  return current
}

export function setLang(l) {
  current = l
  try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
  try { document.documentElement.setAttribute('lang', l) } catch { /* ignore */ }
  listeners.forEach((f) => f(l))
}

export function toggleLang() {
  setLang(current === 'en' ? 'hi' : 'en')
}

/** Subscribe a component to live language changes. */
export function useLang() {
  const [l, setL] = useState(current)
  useEffect(() => {
    const f = (x) => setL(x)
    listeners.add(f)
    return () => listeners.delete(f)
  }, [])
  return l
}

/** Inline translate: returns the Hindi string when the site is in Hindi, else English. */
export function t(en, hi) {
  return current === 'hi' && hi ? hi : en
}
