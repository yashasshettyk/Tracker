import { useEffect, useRef } from 'react'

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Gives a card depth: art layers drift against the content as you scroll
 * (parallax), and the whole card tilts toward the pointer on desktop.
 */
export function useCardMotion({ depth = 16, tilt = 7 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced()) return

    const art = () => el.querySelectorAll('[data-parallax]')
    // the document no longer scrolls — find the pane that does
    const scroller = el.closest('.scroll') || window
    let raf = 0
    let tx = 0, ty = 0

    // ---- scroll parallax -------------------------------------------------
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const b = el.getBoundingClientRect()
        const view = scroller === window
          ? { top: 0, height: window.innerHeight }
          : scroller.getBoundingClientRect()
        if (b.bottom < view.top - 80 || b.top > view.top + view.height + 80) return
        // -1 above the fold .. +1 below it
        const mid = view.top + view.height / 2
        const p = (b.top + b.height / 2 - mid) / (view.height / 2)
        art().forEach((layer, i) => {
          const k = depth * (i === 0 ? 1 : 0.55)
          layer.style.transform = `translate3d(0, ${(-p * k).toFixed(2)}px, 0) scale(1.12)`
        })
      })
    }

    // ---- pointer tilt (desktop) -----------------------------------------
    const onMove = (e) => {
      const b = el.getBoundingClientRect()
      const nx = (e.clientX - b.left) / b.width - 0.5
      const ny = (e.clientY - b.top) / b.height - 0.5
      tx = -ny * tilt
      ty = nx * tilt
      el.style.transform = `perspective(900px) rotateX(${tx.toFixed(2)}deg) rotateY(${ty.toFixed(2)}deg)`
      el.style.transition = 'transform .08s linear'
    }
    const onLeave = () => {
      el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)'
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
    }

    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (fine) {
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
    }
    return () => {
      cancelAnimationFrame(raf)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [depth, tilt])

  return ref
}
