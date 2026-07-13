import { useEffect, useRef } from 'react'

/**
 * Scroll-reveal hook. Attach the returned ref to an element that already has
 * the `reveal` (or `reveal-stagger`) class; it adds `is-visible` the first time
 * the element scrolls into view, then stops observing.
 *
 *   const ref = useReveal()
 *   <section ref={ref} className="reveal"> … </section>
 */
export function useReveal({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // No IO (very old browsers) or reduced motion → just show it.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            if (once) io.unobserve(e.target)
          } else if (!once) {
            e.target.classList.remove('is-visible')
          }
        })
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])
  return ref
}
