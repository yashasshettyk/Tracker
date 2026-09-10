// ---- money + date formatting -------------------------------------------

export const CURRENCIES = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  AED: { symbol: 'AED ', locale: 'en-AE' },
  CAD: { symbol: 'C$', locale: 'en-CA' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
}

export function symbolOf(code) {
  return (CURRENCIES[code] || CURRENCIES.INR).symbol
}

/** 12500 -> "₹12,500"  (decimals only when they exist) */
export function money(n, code = 'INR', opts = {}) {
  const c = CURRENCIES[code] || CURRENCIES.INR
  const v = Number(n) || 0
  const hasCents = Math.abs(v % 1) > 0.004
  const body = new Intl.NumberFormat(c.locale, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(opts.abs ? Math.abs(v) : v)
  return c.symbol + body
}

/** 1250000 -> "12.5L" (Indian) or "1.25M" — for tight chart axes */
export function compact(n, code = 'INR') {
  const v = Math.abs(Number(n) || 0)
  const sign = v < 0 ? '-' : ''
  if (code === 'INR') {
    if (v >= 1e7) return sign + trim(v / 1e7) + 'Cr'
    if (v >= 1e5) return sign + trim(v / 1e5) + 'L'
    if (v >= 1000) return sign + trim(v / 1000) + 'k'
  } else {
    if (v >= 1e9) return sign + trim(v / 1e9) + 'B'
    if (v >= 1e6) return sign + trim(v / 1e6) + 'M'
    if (v >= 1000) return sign + trim(v / 1000) + 'k'
  }
  return sign + Math.round(v)
}
const trim = (x) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10)

// ---- dates --------------------------------------------------------------

export const todayISO = () => toISO(new Date())

export function toISO(d) {
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** parse 'YYYY-MM-DD' as a *local* date (never UTC-shifted) */
export function fromISO(s) {
  if (!s) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const monthName = (i) => MON[i]

export function fmtDate(iso) {
  const d = fromISO(iso)
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtDateShort(iso) {
  const d = fromISO(iso)
  const now = new Date()
  const same = d.getFullYear() === now.getFullYear()
  return `${d.getDate()} ${MON[d.getMonth()]}${same ? '' : " '" + String(d.getFullYear()).slice(2)}`
}

/** "Today" / "Yesterday" / "12 Sep 2026" — for day group headers */
export function dayLabel(iso) {
  const d = fromISO(iso)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const diff = Math.round((t - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff > 1 && diff < 7) return `${diff} days ago`
  return fmtDate(iso)
}

export const monthKey = (iso) => iso.slice(0, 7)
export const yearKey = (iso) => iso.slice(0, 4)

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return `${MON[m - 1]} ${y}`
}
