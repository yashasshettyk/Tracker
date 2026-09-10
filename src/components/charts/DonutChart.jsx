import { useState } from 'react'
import { money, compact } from '../../lib/format.js'
import CategoryIcon, { toneOf } from '../CategoryIcon.jsx'
import { useProgress } from '../../lib/useAnim.js'

const colorOf = (d) => toneOf(d.tone)

const S = 160, R = 58, SW = 20, C = 2 * Math.PI * R

export default function DonutChart({ data, currency = 'INR', label = 'Total' }) {
  const p = useProgress(1100, [data.map((d) => d.total).join(',')])
  const [sel, setSel] = useState(null)
  const total = data.reduce((a, b) => a + b.total, 0)
  const cur = sel != null ? data[sel] : null

  let cum = 0
  const segs = data.map((d, i) => {
    const start = cum
    cum += d.pct
    const gap = data.length > 1 ? 2.5 : 0
    const full = Math.max(d.pct * C - gap, 0.5)
    const shown = Math.max(Math.min(p * C - start * C, full), 0)
    return { d, i, offset: -start * C, len: shown, color: colorOf(d) }
  })

  return (
    <div className="row" style={{ gap: 18, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: S, height: S, flex: 'none' }}>
        <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={SW} />
          {segs.map((s) => (
            <circle
              key={s.i}
              cx={S / 2} cy={S / 2} r={R} fill="none"
              stroke={s.color}
              strokeWidth={sel === s.i ? SW + 5 : SW}
              strokeLinecap="round"
              strokeDasharray={`${s.len} ${C - s.len}`}
              strokeDashoffset={s.offset}
              opacity={sel == null || sel === s.i ? 1 : 0.32}
              onClick={() => setSel(sel === s.i ? null : s.i)}
              style={{ cursor: 'pointer', transition: 'opacity .25s, stroke-width .25s cubic-bezier(.22,1,.36,1)' }}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
          <div className="ring-label">
            <div className="tiny muted" style={{ fontWeight: 650, maxWidth: 92, margin: '0 auto', lineHeight: 1.25 }}>
              {cur ? cur.name : label}
            </div>
            <div className="num" style={{ fontSize: 21, fontWeight: 660, letterSpacing: '-.045em', marginTop: 4 }}>
              {compact(cur ? cur.total : total, currency)}
            </div>
            {cur && <div className="tiny" style={{ color: colorOf(cur), fontWeight: 700, marginTop: 1 }}>{Math.round(cur.pct * 100)}%</div>}
          </div>
        </div>
      </div>

      <div className="grow" style={{ minWidth: 150 }}>
        {data.map((d, i) => (
          <button
            key={d.id || i}
            onClick={() => setSel(sel === i ? null : i)}
            className="spread"
            style={{
              width: '100%', padding: '7px 8px', borderRadius: 10, textAlign: 'left',
              background: sel === i ? 'rgba(255,255,255,0.06)' : 'transparent',
              transition: 'background .2s',
            }}
          >
            <span className="row" style={{ gap: 9, minWidth: 0 }}>
              <CategoryIcon category={d} size={24} radius={8} />
              <span style={{ fontSize: 12.5, color: 'var(--t-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 112 }}>
                {d.name}
              </span>
            </span>
            <span className="num tiny" style={{ fontWeight: 660, flex: 'none' }}>{money(d.total, currency)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
