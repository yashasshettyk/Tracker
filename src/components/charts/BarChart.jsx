import { useMemo, useState } from 'react'
import { compact, money } from '../../lib/format.js'
import { useProgress } from '../../lib/useAnim.js'

const W = 340, H = 196, PL = 36, PR = 8, PT = 26, PB = 28

/** rounded-top bar path */
function topRounded(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, Math.max(h, 0.01))
  if (h <= 0.5) return ''
  return `M${x} ${y + h} L${x} ${y + rr} Q${x} ${y} ${x + rr} ${y} L${x + w - rr} ${y} Q${x + w} ${y} ${x + w} ${y + rr} L${x + w} ${y + h} Z`
}

function niceMax(v) {
  if (v <= 0) return 100
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * mag
}

export default function BarChart({ data, currency = 'INR', mode = 'both' }) {
  const p = useProgress(950, [data.map((d) => d.total).join(','), mode])
  const [sel, setSel] = useState(null)

  const { max, plotW, plotH, bw, gap } = useMemo(() => {
    const vals = data.map((d) => (mode === 'both' ? d.total : d[mode]))
    const max = niceMax(Math.max(...vals, 1) * 1.12)
    const plotW = W - PL - PR
    const plotH = H - PT - PB
    const slot = plotW / Math.max(data.length, 1)
    return { max, plotW, plotH, bw: Math.min(slot * 0.52, 30), gap: slot }
  }, [data, mode])

  const y = (v) => PT + plotH - (v / max) * plotH
  const active = sel ?? data.length - 1
  const showEdu = mode === 'both' || mode === 'education'
  const showCas = mode === 'both' || mode === 'casual'

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="gEdu" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#6f7dff" /><stop offset="100%" stopColor="#a99dff" />
          </linearGradient>
          <linearGradient id="gCas" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c99f63" /><stop offset="100%" stopColor="#efd0a1" />
          </linearGradient>
        </defs>

        {/* grid */}
        {[0, 0.5, 1].map((f) => {
          const gy = PT + plotH - f * plotH
          return (
            <g key={f}>
              <line x1={PL} y1={gy} x2={W - PR} y2={gy} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray={f ? '3 5' : ''} />
              <text x={PL - 8} y={gy + 3.5} textAnchor="end" fontSize="9" fill="#55555f" fontWeight="600">
                {f === 0 ? '0' : compact(max * f, currency)}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const cx = PL + gap * i + gap / 2
          const x = cx - bw / 2
          const eduH = showEdu ? ((d.education || 0) / max) * plotH * p : 0
          const casH = showCas ? ((d.casual || 0) / max) * plotH * p : 0
          const isOn = i === active
          const total = mode === 'both' ? d.total : d[mode]
          return (
            <g key={d.key || i} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
              <rect x={PL + gap * i} y={PT - 8} width={gap} height={plotH + 14} fill="transparent" />
              {/* empty-slot ghost */}
              {total === 0 && (
                <rect x={x} y={PT + plotH - 3} width={bw} height="3" rx="1.5" fill="rgba(255,255,255,0.07)" />
              )}
              {casH > 0.5 && (
                <path d={topRounded(x, PT + plotH - eduH - casH, bw, casH, 6)} fill="url(#gCas)" opacity={isOn ? 1 : 0.72} />
              )}
              {eduH > 0.5 && (
                <path
                  d={casH > 0.5
                    ? `M${x} ${PT + plotH} L${x} ${PT + plotH - eduH} L${x + bw} ${PT + plotH - eduH} L${x + bw} ${PT + plotH} Z`
                    : topRounded(x, PT + plotH - eduH, bw, eduH, 6)}
                  fill="url(#gEdu)" opacity={isOn ? 1 : 0.72}
                />
              )}
              {/* value bubble on the selected column */}
              {isOn && total > 0 && (
                <text x={cx} y={PT + plotH - eduH - casH - 8} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#f4f4f6" className="ring-label">
                  {compact(total, currency)}
                </text>
              )}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="9.5" fontWeight={isOn ? 700 : 600} fill={isOn ? '#f4f4f6' : '#55555f'}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* readout for the selected month */}
      <div className="chart-foot">
        <div>
          <div className="tiny muted" style={{ fontWeight: 600 }}>{data[active]?.full || data[active]?.label}</div>
          <div className="num" style={{ fontSize: 19, fontWeight: 660, letterSpacing: '-.04em', marginTop: 3 }}>
            {money((mode === 'both' ? data[active]?.total : data[active]?.[mode]) || 0, currency)}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
          {showEdu && (
            <div className="tiny row" style={{ gap: 6, color: '#a99dff', fontWeight: 620 }}>
              <i className="dot-sq" style={{ background: 'var(--edu-grad)' }} />
              {money(data[active]?.education || 0, currency)}
            </div>
          )}
          {showCas && (
            <div className="tiny row" style={{ gap: 6, color: '#e3bd82', fontWeight: 620 }}>
              <i className="dot-sq" style={{ background: 'var(--cas-grad)' }} />
              {money(data[active]?.casual || 0, currency)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
