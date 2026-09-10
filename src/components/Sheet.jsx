import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SheetCtx = createContext(() => {})
export const useSheetClose = () => useContext(SheetCtx)

/** Bottom sheet: tap-scrim / Esc / drag-down to dismiss. */
export default function Sheet({ onClose, title, sub, children }) {
  const [closing, setClosing] = useState(false)
  const el = useRef(null)
  const drag = useRef({ y: 0, active: false })

  const close = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 240)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [close])

  // drag-to-dismiss from the handle area
  const onDown = (e) => {
    drag.current = { y: e.touches ? e.touches[0].clientY : e.clientY, active: true }
  }
  const onMove = (e) => {
    if (!drag.current.active || !el.current) return
    const y = e.touches ? e.touches[0].clientY : e.clientY
    const dy = Math.max(0, y - drag.current.y)
    el.current.style.transition = 'none'
    el.current.style.transform = `translate(-50%, ${dy}px)`
  }
  const onUp = (e) => {
    if (!drag.current.active || !el.current) return
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
    const dy = y - drag.current.y
    drag.current.active = false
    el.current.style.transition = 'transform .34s cubic-bezier(.22,1,.36,1)'
    el.current.style.transform = 'translate(-50%, 0)'
    if (dy > 110) close()
  }

  return createPortal(
    <>
      <div className={'scrim' + (closing ? ' closing' : '')} onClick={close} />
      <div ref={el} className={'sheet' + (closing ? ' closing' : '')} role="dialog" aria-modal="true">
        <div
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          style={{ cursor: 'grab', padding: '2px 0' }}
        >
          <div className="grabber" />
        </div>
        {title && <div className="sheet-title">{title}</div>}
        {sub && <div className="sheet-sub">{sub}</div>}
        <SheetCtx.Provider value={close}>{children}</SheetCtx.Provider>
      </div>
    </>,
    document.body
  )
}
