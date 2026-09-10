import { useEffect, useState } from 'react'

/**
 * Real devices don't behave like a resized desktop window: the software keyboard
 * and the browser's own chrome shrink the *visual* viewport while the layout
 * viewport stays put, so a `position: fixed` bar ends up behind them.
 * This tracks the real visible bottom and whether the keyboard is up.
 */
export function useViewport() {
  const [state, setState] = useState({ keyboard: false, inset: 0 })

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // how much of the layout viewport is hidden at the bottom
        const hidden = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        const keyboard = hidden > 140
        setState((s) =>
          s.keyboard === keyboard && Math.abs(s.inset - hidden) < 2 ? s : { keyboard, inset: keyboard ? 0 : hidden }
        )
        const root = document.documentElement
        // chrome-only inset: what a bottom-docked bar should clear
        root.style.setProperty('--vv-inset', `${keyboard ? 0 : Math.round(hidden)}px`)
        // everything hidden, keyboard included: what a sheet must sit above
        root.style.setProperty('--vv-bottom', `${Math.round(hidden)}px`)
        root.style.setProperty('--vv-height', `${Math.round(vv.height)}px`)
      })
    }

    measure()
    vv.addEventListener('resize', measure)
    vv.addEventListener('scroll', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      cancelAnimationFrame(raf)
      vv.removeEventListener('resize', measure)
      vv.removeEventListener('scroll', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  return state
}
