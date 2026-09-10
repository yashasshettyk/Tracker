import { useMemo } from 'react'

/* ------------------------------------------------------------------
   Payment-card furniture: guilloché engraving, an EMV chip, the
   contactless mark and a holographic sheen. All vector, no images.
   ------------------------------------------------------------------ */

/** hypotrochoid — the interwoven line-work engraved on banknotes and share certificates */
function rosette(R, r, d, turns = 1, steps = 720, cx = 0, cy = 0) {
  const pts = []
  const k = (R - r) / r
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns * r
    pts.push(
      `${(cx + (R - r) * Math.cos(t) + d * Math.cos(k * t)).toFixed(2)} ${(cy + (R - r) * Math.sin(t) - d * Math.sin(k * t)).toFixed(2)}`
    )
  }
  return 'M' + pts.join(' L')
}

const VARIANTS = {
  platinum: { line: '#ffffff', lineOp: 0.042 },
  violet: { line: '#c9bcff', lineOp: 0.07 },
  gold: { line: '#f0d5a8', lineOp: 0.07 },
  mint: { line: '#9ee7cd', lineOp: 0.06 },
}

/** the engraved plate that sits behind a hero card's content */
export function Guilloche({ variant = 'platinum', id = 'g' }) {
  const v = VARIANTS[variant] || VARIANTS.platinum
  const paths = useMemo(
    () => [
      // one rosette medallion on the right, the way a note is engraved
      rosette(92, 11, 58, 11, 820, 292, 95),
      rosette(66, 8, 40, 8, 700, 292, 95),
      rosette(116, 13, 72, 13, 900, 292, 95),
    ],
    []
  )

  return (
    <svg
      viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-parallax
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', transform: 'scale(1.12)' }}
    >
      <defs>
        {/* engraving fades out behind the numbers so the type stays legible */}
        <linearGradient id={`fade-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="46%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`m-${id}`}>
          <rect width="340" height="190" fill={`url(#fade-${id})`} />
        </mask>
      </defs>
      <g mask={`url(#m-${id})`} fill="none" stroke={v.line} strokeOpacity={v.lineOp} strokeWidth="0.45">
        {paths.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  )
}

/** holographic foil — a slow iridescent wash across the surface */
export function Holo({ opacity = 0.5 }) {
  return (
    <span
      aria-hidden="true" data-parallax
      style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', opacity,
        background:
          'conic-gradient(from 210deg at 82% 12%, rgba(255,140,190,.16), rgba(150,190,255,.14) 22%, rgba(140,255,220,.12) 40%, rgba(255,225,150,.14) 60%, rgba(190,150,255,.16) 78%, rgba(255,140,190,.16))',
        mixBlendMode: 'soft-light',
        borderRadius: 'inherit',
      }}
    />
  )
}

/** EMV contact plate */
export function Chip({ tone = '#e3bd82', width = 34 }) {
  return (
    <svg width={width} height={width * 0.77} viewBox="0 0 34 26" aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
      <defs>
        <linearGradient id="chipG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.95" />
          <stop offset="46%" stopColor={tone} stopOpacity="0.62" />
          <stop offset="100%" stopColor={tone} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="0.6" y="0.6" width="32.8" height="24.8" rx="4.4" fill="url(#chipG)" />
      <g stroke="rgba(0,0,0,0.42)" strokeWidth="0.9" fill="none">
        <rect x="10.4" y="6.6" width="13.2" height="12.8" rx="2.4" />
        <path d="M10.4 10.6H0.8M10.4 15.4H0.8M23.6 10.6h9.6M23.6 15.4h9.6M17 6.6V0.8M17 19.4v5.8" />
      </g>
    </svg>
  )
}

/** contactless payment mark */
export function Contactless({ size = 17, color = 'rgba(255,255,255,0.42)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
      <path d="M7.5 8.4a5.2 5.2 0 0 1 0 7.2" />
      <path d="M11.4 5.4a9.6 9.6 0 0 1 0 13.2" />
      <path d="M15.3 2.6a13.8 13.8 0 0 1 0 18.8" />
    </svg>
  )
}

/** the whole treatment in one wrapper — art layers first, children on top */
export default function CardArt({ variant = 'platinum', holo = 0.5, id = 'g' }) {
  return (
    <>
      <Guilloche variant={variant} id={id} />
      <Holo opacity={holo} />
    </>
  )
}
