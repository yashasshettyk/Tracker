// ---- aggregation engine -------------------------------------------------
import { monthKey, monthName, fromISO, toISO } from './format.js'

export const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + (Number(f(b)) || 0), 0)

/** entryId -> amount repaid so far */
export function repaidByEntry(repayments) {
  const m = new Map()
  for (const r of repayments) {
    if (!r.entryId) continue
    m.set(r.entryId, (m.get(r.entryId) || 0) + (Number(r.amount) || 0))
  }
  return m
}

export function entryStatus(entry, repaidMap) {
  const paid = Math.min(repaidMap.get(entry.id) || 0, entry.amount)
  const due = Math.max(entry.amount - paid, 0)
  return {
    paid,
    due,
    pct: entry.amount > 0 ? Math.min(paid / entry.amount, 1) : 0,
    state: due <= 0.004 ? 'settled' : paid > 0 ? 'partial' : 'open',
  }
}

export function computeTotals(state) {
  const edu = state.entries.filter((e) => e.kind === 'education')
  const cas = state.entries.filter((e) => e.kind === 'casual')
  const eduTotal = sum(edu, (e) => e.amount)
  const casualTotal = sum(cas, (e) => e.amount)
  const repaid = Math.min(sum(state.repayments, (r) => r.amount), casualTotal)
  return {
    eduTotal,
    casualTotal,
    repaid,
    outstanding: Math.max(casualTotal - repaid, 0),
    given: eduTotal + casualTotal,
    eduCount: edu.length,
    casualCount: cas.length,
    repaidPct: casualTotal > 0 ? repaid / casualTotal : 0,
  }
}

/** last `n` months of activity, oldest first */
export function monthlySeries(state, n = 6) {
  const now = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({
      key,
      label: monthName(d.getMonth()),
      full: `${monthName(d.getMonth())} ${d.getFullYear()}`,
      year: d.getFullYear(),
      education: 0,
      casual: 0,
      repaid: 0,
      total: 0,
      count: 0,
    })
  }
  const idx = new Map(out.map((m) => [m.key, m]))
  for (const e of state.entries) {
    const m = idx.get(monthKey(e.date))
    if (!m) continue
    m[e.kind] += e.amount
    m.total += e.amount
    m.count += 1
  }
  for (const r of state.repayments) {
    const m = idx.get(monthKey(r.date))
    if (m) m.repaid += r.amount
  }
  return out
}

/** every year that has data, oldest first */
export function yearlySeries(state) {
  const map = new Map()
  const touch = (y) => {
    if (!map.has(y)) map.set(y, { key: y, label: y, education: 0, casual: 0, repaid: 0, total: 0, count: 0 })
    return map.get(y)
  }
  for (const e of state.entries) {
    const y = touch(e.date.slice(0, 4))
    y[e.kind] += e.amount
    y.total += e.amount
    y.count += 1
  }
  for (const r of state.repayments) touch(r.date.slice(0, 4)).repaid += r.amount
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

/** running cumulative outstanding (casual) over the last n months */
export function outstandingTrend(state, n = 8) {
  const now = new Date()
  const points = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0) // month end
    const cutoff = toISO(d)
    const given = sum(
      state.entries.filter((e) => e.kind === 'casual' && e.date <= cutoff),
      (e) => e.amount
    )
    const back = sum(state.repayments.filter((r) => r.date <= cutoff), (r) => r.amount)
    points.push({
      label: monthName(d.getMonth()),
      full: `${monthName(d.getMonth())} ${d.getFullYear()}`,
      value: Math.max(given - back, 0),
    })
  }
  return points
}

/** cumulative total given (both sections) over the last n months */
export function cumulativeGiven(state, n = 8) {
  const now = new Date()
  const points = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const cutoff = toISO(d)
    points.push({
      label: monthName(d.getMonth()),
      full: `${monthName(d.getMonth())} ${d.getFullYear()}`,
      value: sum(state.entries.filter((e) => e.date <= cutoff), (e) => e.amount),
    })
  }
  return points
}

export function categoryBreakdown(state, kind, limit = 0) {
  const byId = new Map()
  for (const e of state.entries) {
    if (kind && e.kind !== kind) continue
    const cur = byId.get(e.categoryId) || { id: e.categoryId, total: 0, count: 0 }
    cur.total += e.amount
    cur.count += 1
    byId.set(e.categoryId, cur)
  }
  const cats = new Map(state.categories.map((c) => [c.id, c]))
  const rows = [...byId.values()]
    .map((r) => {
      const c = cats.get(r.id)
      return { ...r, name: c?.name || 'Deleted category', icon: c?.icon, tone: c?.tone, emoji: c?.emoji }
    })
    .sort((a, b) => b.total - a.total)
  const total = sum(rows, (r) => r.total)
  const withPct = rows.map((r) => ({ ...r, pct: total ? r.total / total : 0 }))
  if (limit && withPct.length > limit) {
    const head = withPct.slice(0, limit)
    const rest = withPct.slice(limit)
    head.push({
      id: '__rest',
      name: `${rest.length} more`,
      icon: 'tag',
      tone: 'slate',
      total: sum(rest, (r) => r.total),
      count: sum(rest, (r) => r.count),
      pct: total ? sum(rest, (r) => r.total) / total : 0,
    })
    return head
  }
  return withPct
}

/** oldest-unpaid-first allocation of a repayment across open casual entries */
export function allocateFIFO(state, amount) {
  const repaid = repaidByEntry(state.repayments)
  const open = state.entries
    .filter((e) => e.kind === 'casual')
    .map((e) => ({ e, ...entryStatus(e, repaid) }))
    .filter((x) => x.due > 0.004)
    .sort((a, b) => a.e.date.localeCompare(b.e.date) || a.e.createdAt - b.e.createdAt)

  let left = Number(amount) || 0
  const parts = []
  for (const x of open) {
    if (left <= 0.004) break
    const take = Math.min(left, x.due)
    parts.push({ entryId: x.e.id, amount: Math.round(take * 100) / 100 })
    left -= take
  }
  return { parts, unallocated: Math.round(left * 100) / 100 }
}

export function monthDelta(state) {
  const s = monthlySeries(state, 2)
  const [prev, cur] = [s[0], s[1]]
  const change = prev.total > 0 ? (cur.total - prev.total) / prev.total : cur.total > 0 ? 1 : 0
  return { cur, prev, change }
}

export function insights(state, totals) {
  const out = []
  const months = monthlySeries(state, 6).filter((m) => m.total > 0)
  if (months.length) {
    out.push({
      k: 'Monthly average',
      v: Math.round(sum(months, (m) => m.total) / months.length),
      d: `across ${months.length} active month${months.length > 1 ? 's' : ''}`,
      money: true,
    })
    const top = [...months].sort((a, b) => b.total - a.total)[0]
    out.push({ k: 'Biggest month', v: top.total, d: top.full, money: true })
  }
  if (state.entries.length) {
    const big = [...state.entries].sort((a, b) => b.amount - a.amount)[0]
    const cat = state.categories.find((c) => c.id === big.categoryId)
    out.push({ k: 'Largest single', v: big.amount, d: cat ? `${cat.emoji} ${cat.name}` : '—', money: true })
    out.push({
      k: 'Average per entry',
      v: Math.round(totals.given / state.entries.length),
      d: `${state.entries.length} entries total`,
      money: true,
    })
  }
  return out
}

/** group a list by ISO date, newest day first */
export function groupByDay(items) {
  const map = new Map()
  for (const it of items) {
    if (!map.has(it.date)) map.set(it.date, [])
    map.get(it.date).push(it)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, rows]) => ({
      date,
      rows: rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      total: sum(rows, (r) => r.amount),
    }))
}

export { fromISO }
