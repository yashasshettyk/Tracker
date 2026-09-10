import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import { TxnRow, RepayRow } from './TxnRow.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'
import Icon from './Icons.jsx'
import Segmented from './Segmented.jsx'
import CardArt, { Chip, Contactless } from './CardArt.jsx'
import { useCardMotion } from '../lib/useCardMotion.js'
import { money, dayLabel, monthKey, todayISO } from '../lib/format.js'
import { computeTotals, repaidByEntry, entryStatus, groupByDay, sum, categoryBreakdown } from '../lib/stats.js'

const PERIODS = [
  { k: 'all', label: 'All time' },
  { k: 'month', label: 'This month' },
  { k: 'year', label: 'This year' },
]

export default function SectionView({ kind, onEdit, onAdd, onRepay }) {
  const { state, api } = useApp()
  const cardRef = useCardMotion({ depth: 18, tilt: 6 })
  const cur = state.settings.currency
  const edu = kind === 'education'

  const [q, setQ] = useState('')
  const [period, setPeriod] = useState('all')
  const [status, setStatus] = useState('all')
  const [tab, setTab] = useState('given')

  const totals = useMemo(() => computeTotals(state), [state])
  const repaid = useMemo(() => repaidByEntry(state.repayments), [state.repayments])
  const catName = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories])

  const nowMonth = monthKey(todayISO())
  const nowYear = todayISO().slice(0, 4)

  const inPeriod = (iso) =>
    period === 'all' || (period === 'month' ? monthKey(iso) === nowMonth : iso.slice(0, 4) === nowYear)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return state.entries
      .filter((e) => e.kind === kind)
      .filter((e) => inPeriod(e.date))
      .filter((e) => {
        if (!needle) return true
        const c = catName.get(e.categoryId)
        return (c?.name || '').toLowerCase().includes(needle) || (e.note || '').toLowerCase().includes(needle) || String(e.amount).includes(needle)
      })
      .filter((e) => {
        if (edu || status === 'all') return true
        const st = entryStatus(e, repaid).state
        return status === 'open' ? st !== 'settled' : st === 'settled'
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.entries, kind, q, period, status, repaid, catName])

  const reps = useMemo(
    () => state.repayments.filter((r) => inPeriod(r.date)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.repayments, period]
  )

  const groups = useMemo(() => groupByDay(rows), [rows])
  const filteredTotal = sum(rows, (e) => e.amount)
  const periodLabel = PERIODS.find((p) => p.k === period).label.toLowerCase()
  const topCat = useMemo(() => categoryBreakdown(state, kind)[0], [state, kind])

  return (
    <div className="page stack" style={{ gap: 14 }}>
      {/* ---------------- summary ---------------- */}
      {edu ? (
        <div className="hero hero-violet" ref={cardRef}>
          <CardArt variant="violet" id="edu" holo={0.34} />
          <div className="card-top">
            <Chip tone="#c9bcff" />
            <Contactless color="rgba(201,188,255,0.42)" />
          </div>
          <div className="hero-label">Education total</div>
          <div className="hero-amount"><AnimatedNumber value={totals.eduTotal} format={(v) => money(v, cur)} /></div>
          <div className="hero-sub">{totals.eduCount} entries · a gift, not a loan</div>
          <div className="hero-split">
            <div className="hero-chip">
              <div className="k">This month</div>
              <div className="v num">
                {money(sum(state.entries.filter((e) => e.kind === 'education' && monthKey(e.date) === nowMonth), (e) => e.amount), cur)}
              </div>
            </div>
            <div className="hero-chip">
              <div className="k">Top category</div>
              <div className="v" style={{ fontSize: 13.5, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {topCat ? topCat.name : '—'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hero hero-gold" ref={cardRef}>
          <CardArt variant="gold" id="cas" holo={0.34} />
          <div className="card-top">
            <Chip tone="#e3bd82" />
            <Contactless color="rgba(227,189,130,0.45)" />
          </div>
          <div className="hero-label">Owed back to you</div>
          <div className="hero-amount"><AnimatedNumber value={totals.outstanding} format={(v) => money(v, cur)} /></div>
          <div className="hero-sub">of {money(totals.casualTotal, cur)} lent · {money(totals.repaid, cur)} returned</div>
          <div className="prog" style={{ marginTop: 15, height: 5 }}><i style={{ width: `${Math.round(totals.repaidPct * 100)}%` }} /></div>
          <button className="btn btn-good btn-block" style={{ marginTop: 16 }} onClick={onRepay} disabled={totals.outstanding <= 0}>
            <Icon name="arrowDown" size={17} /> Record money returned
          </button>
        </div>
      )}

      {/* ---------------- casual tabs ---------------- */}
      {!edu && (
        <Segmented
          value={tab} onChange={setTab}
          items={[
            { k: 'given', label: 'Lent out' },
            { k: 'repaid', label: `Returned${state.repayments.length ? ` (${state.repayments.length})` : ''}` },
          ]}
        />
      )}

      {/* ---------------- filters ---------------- */}
      <div className="stack" style={{ gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-3)' }}>
            <Icon name="search" size={17} />
          </span>
          <input className="input" style={{ paddingLeft: 42, height: 46 }} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={edu ? 'Search fees, books, notes…' : 'Search loans and notes…'} />
          {q && (
            <button onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-3)', padding: 8 }}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <div className="quick-row">
          {PERIODS.map((p) => (
            <button key={p.k} className={'quick' + (period === p.k ? ' on' : '')} onClick={() => setPeriod(p.k)}>
              {p.label}
            </button>
          ))}
          {!edu && tab === 'given' && ['all', 'open', 'settled'].map((k) => (
            <button key={k} className={'quick' + (status === k ? ' on-warm' : '')} onClick={() => setStatus(k)}>
              {k === 'all' ? 'Any status' : k === 'open' ? 'Open' : 'Settled'}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- list ---------------- */}
      {!edu && tab === 'repaid' ? (
        reps.length ? (
          <>
            <div className="section-title">{reps.length} repayments · {money(sum(reps, (r) => r.amount), cur)}</div>
            <div className="list-card">
              {reps.map((r, i) => <RepayRow key={r.id} rep={r} index={i} onDelete={api.deleteRepayment} />)}
            </div>
          </>
        ) : (
          <div className="empty">
            <div className="empty-mark"><Icon name="arrowDown" size={24} /></div>
            <h3>No repayments yet</h3>
            <p>When he pays you back, record it here and the balance updates itself.</p>
          </div>
        )
      ) : rows.length ? (
        <>
          <div className="section-title">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'} · {periodLabel}
            <span className="num" style={{ color: 'var(--t-2)', textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>{money(filteredTotal, cur)}</span>
          </div>
          {groups.map((g) => (
            <div key={g.date}>
              <div className="day-head">
                <span>{dayLabel(g.date)}</span>
                <span className="num">{money(g.total, cur)}</span>
              </div>
              <div className="list-card">
                {g.rows.map((e, i) => (
                  <TxnRow key={e.id} entry={e} index={i} status={edu ? null : entryStatus(e, repaid)} onClick={() => onEdit(e)} />
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="empty">
          <div className="empty-mark"><Icon name={q || period !== 'all' || status !== 'all' ? 'search' : edu ? 'edu' : 'handshake'} size={24} /></div>
          <h3>{q || period !== 'all' || status !== 'all' ? 'Nothing matches' : edu ? 'No education entries' : 'No casual loans'}</h3>
          <p>
            {q || period !== 'all' || status !== 'all'
              ? 'Try a different search or period.'
              : edu ? 'Add fees, books, hostel — anything you spend on his studies.' : 'Money he borrows and has to return goes here.'}
          </p>
          {!(q || period !== 'all' || status !== 'all') && (
            <button className={'btn btn-block ' + (edu ? 'btn-primary' : 'btn-warm')} style={{ marginTop: 20, maxWidth: 260, marginInline: 'auto' }} onClick={() => onAdd(kind)}>
              <Icon name="plus" size={18} /> Add {edu ? 'education spend' : 'a loan'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
