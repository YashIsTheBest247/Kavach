import { useEffect, useState } from 'react'

const KEY = 'kavach-theme'
const listeners = new Set()

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark'
}

export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem(KEY, t) } catch { /* ignore */ }
  listeners.forEach((l) => l(t))
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark')
}

/** Subscribe a component to live theme changes. */
export function useTheme() {
  const [theme, setT] = useState(getTheme())
  useEffect(() => {
    const l = (t) => setT(t)
    listeners.add(l)
    return () => listeners.delete(l)
  }, [])
  return theme
}
