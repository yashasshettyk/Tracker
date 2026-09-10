import { useEffect, useRef, useState } from 'react'

const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const skip = () =>
  document.hidden || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** shared 0 -> 1 progress driver for chart entrance animations */
export function useProgress(duration = 1000, deps = []) {
  const [p, setP] = useState(skip() ? 1 : 0)
  const raf = useRef(0)

  useEffect(() => {
    // hidden tabs never fire rAF — draw the finished chart rather than an empty one
    if (skip()) { setP(1); return }
    setP(0)
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setP(easeOut(t))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    const settle = () => document.hidden && setP(1)
    document.addEventListener('visibilitychange', settle)
    return () => {
      cancelAnimationFrame(raf.current)
      document.removeEventListener('visibilitychange', settle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return p
}
