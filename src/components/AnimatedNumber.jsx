import { useEffect, useRef, useState } from 'react'

const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const skip = () =>
  document.hidden || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Counts from the previous value to the new one. `format` renders each frame. */
export default function AnimatedNumber({ value = 0, format = (v) => Math.round(v), duration = 950, className = '' }) {
  const [display, setDisplay] = useState(value)
  const from = useRef(value)
  const raf = useRef(0)

  useEffect(() => {
    const settle = () => { from.current = value; setDisplay(value) }
    // a hidden tab never fires rAF — land on the real number instead of freezing
    if (skip()) { settle(); return }

    const start = performance.now()
    const a = from.current
    if (a === value) { settle(); return }

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setDisplay(a + (value - a) * easeOut(t))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else from.current = value
    }
    raf.current = requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', settle)
    return () => {
      cancelAnimationFrame(raf.current)
      document.removeEventListener('visibilitychange', settle)
    }
  }, [value, duration])

  return <span className={'num ' + className}>{format(display)}</span>
}
