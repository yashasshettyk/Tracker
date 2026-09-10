import { useEffect, useRef, useState } from 'react'
import { compact, money } from '../../lib/format.js'

const W = 340, H = 168, PL = 34, PR = 10, PT = 16, PB = 26

/** smooth path through points (Catmull-Rom -> cubic bezier) */
function smooth(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const t = 0.19
    d += ` C${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`
  }
  return d
}

export default function AreaChart({ points, currency = 'INR', color = '#2fd3a5', color2 = '#16a97f', id = 'a1' }) {
  const lineRef = useRef(null)
  const [sel, setSel] = useState(null)
  const [len, setLen] = useState(0)

  const max = Math.max(...points.map((p) => p.value), 1) * 1.15
  const plotW = W - PL - PR
  const plotH = H - PT - PB
  const step = points.length > 1 ? plotW / (points.length - 1) : 0
  const pts = points.map((p, i) => ({
    x: PL + step * i,
    y: PT + plotH - (p.value / max) * plotH,
    ...p,
  }))
  const line = smooth(pts)
  const area = `${line} L${pts[pts.length - 1]?.x ?? PL} ${PT + plotH} L${pts[0]?.x ?? PL} ${PT + plotH} Z`

  useEffect(() => {
    if (lineRef.current) setLen(Math.ceil(lineRef.current.getTotalLength()))
  }, [line])

  const pick = (e) => {
    const box = e.currentTarget.getBoundingClientRect()
    const cx = ((e.touches ? e.touches[0].clientX : e.clientX) - box.left) / box.width * W
    let best = 0, bd = Infinity
    pts.forEach((p, i) => { const d = Math.abs(p.x - cx); if (d < bd) { bd = d; best = i } })
    setSel(best)
  }

  const active = sel != null ? pts[sel] : pts[pts.length - 1]

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'pan-y' }}
        onMouseMove={pick} onMouseLeave={() => setSel(null)} onTouchStart={pick} onTouchMove={pick}
      >
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.36" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color2} /><stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((f) => {
          const gy = PT + plotH - f * plotH
          return (
            <g key={f}>
              <line x1={PL} y1={gy} x2={W - PR} y2={gy} stroke="rgba(255,255,255,0.06)" strokeDasharray={f ? '3 5' : ''} />
              <text x={PL - 7} y={gy + 3.5} textAnchor="end" fontSize="9" fill="#55555f" fontWeight="600">
                {f === 0 ? '0' : compact(max * f, currency)}
              </text>
            </g>
          )
        })}

        <path d={area} fill={`url(#fill-${id})`} className="area-in" />
        <path
          ref={lineRef} d={line} fill="none" stroke={`url(#stroke-${id})`} strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
          className={len ? 'draw-line' : ''} style={len ? { '--len': len } : { opacity: 0 }}
        />

        {active && (
          <g>
            <line x1={active.x} y1={PT - 4} x2={active.x} y2={PT + plotH} stroke="rgba(255,255,255,0.22)" strokeDasharray="3 4" />
            <circle cx={active.x} cy={active.y} r="5.5" fill={color} opacity="0.25" />
            <circle cx={active.x} cy={active.y} r="3.4" fill="#0a0a0c" stroke={color} strokeWidth="2.4" />
          </g>
        )}

        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="9.5"
            fontWeight={active?.label === p.label ? 700 : 600}
            fill={active?.label === p.label ? '#f4f4f6' : '#55555f'}>
            {p.label}
          </text>
        ))}
      </svg>

      <div className="chart-foot">
        <span className="tiny muted" style={{ fontWeight: 600 }}>{active?.full}</span>
        <span className="num" style={{ fontWeight: 660, fontSize: 16, letterSpacing: '-.04em' }}>{money(active?.value || 0, currency)}</span>
      </div>
    </div>
  )
}
