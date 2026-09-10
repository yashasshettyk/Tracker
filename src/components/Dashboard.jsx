import { useMemo } from 'react'
import { useApp } from '../store.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'
import BarChart from './charts/BarChart.jsx'
import Icon from './Icons.jsx'
import CategoryIcon from './CategoryIcon.jsx'
import CardArt, { Chip, Contactless } from './CardArt.jsx'
import { useCardMotion } from '../lib/useCardMotion.js'
import { toneOf } from './CategoryIcon.jsx'
import { TxnRow } from './TxnRow.jsx'
import { money, monthName } from '../lib/format.js'
import { computeTotals, monthlySeries, monthDelta, repaidByEntry, entryStatus, categoryBreakdown } from '../lib/stats.js'

export default function Dashboard({ onEdit, onRepay, onAdd, go }) {
  const { state } = useApp()
  const heroRef = useCardMotion({ depth: 18, tilt: 6 })
  const owedRef = useCardMotion({ depth: 12, tilt: 4 })
  const cur = state.settings.currency
  const totals = useMemo(() => computeTotals(state), [state])
  const series = useMemo(() => monthlySeries(state, 6), [state])
  const { cur: thisMonth, change } = useMemo(() => monthDelta(state), [state])
  const repaid = useMemo(() => repaidByEntry(state.repayments), [state.repayments])
  const topCats = useMemo(() => categoryBreakdown(state, null, 3), [state])

  const recent = useMemo(
    () => [...state.entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 4),
    [state.entries]
  )
  const hasData = state.entries.length > 0

  if (!hasData) {
    return (
      <div className="page">
        <div className="hero hero-platinum">
          <CardArt variant="platinum" id="ov0" holo={0.45} />
          <div className="card-top"><Chip tone="#dcdce4" /><span className="card-brand">Ledger</span></div>
          <div className="hero-label">Total given</div>
          <div className="hero-amount num">{money(0, cur)}</div>
          <div className="hero-sub">Nothing recorded yet</div>
        </div>
        <div className="empty" style={{ paddingTop: 34 }}>
          <div className="empty-mark"><Icon name="wallet" size={24} /></div>
          <h3>Start your ledger</h3>
          <p>Add the first entry — education spend, or casual money he owes you back.</p>
          <div className="stack" style={{ marginTop: 22, maxWidth: 300, marginInline: 'auto' }}>
            <button className="btn btn-primary btn-block" onClick={() => onAdd('education')}>
              <Icon name="edu" size={18} /> Add education spend
            </button>
            <button className="btn btn-warm btn-block" onClick={() => onAdd('casual')}>
              <Icon name="handshake" size={18} /> Add casual loan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page stack" style={{ gap: 14 }}>
      {/* ---------- hero: the member card ---------- */}
      <div className="hero hero-platinum" ref={heroRef}>
        <CardArt variant="platinum" id="ov" holo={0.45} />
        <div className="card-top">
          <Chip tone="#dcdce4" />
          <span className="card-brand">Ledger</span>
        </div>
        <div className="hero-label">Total given</div>
        <div className="hero-amount">
          <AnimatedNumber value={totals.given} format={(v) => money(v, cur)} />
        </div>
        <div className="hero-sub">{state.entries.length} entries recorded</div>
        <div className="card-holder">
          <span className="emboss">{state.settings.personName}</span>
          <span className="emboss-sm">Since {series.find((s) => s.total > 0)?.full || 'today'}</span>
        </div>

        <div className="hero-split">
          <button className="hero-chip" style={{ textAlign: 'left' }} onClick={() => go('education')}>
            <div className="k" style={{ color: '#a897ff' }}><i className="dot-sq" style={{ background: 'var(--edu-grad)' }} /> Education</div>
            <div className="v num">{money(totals.eduTotal, cur)}</div>
          </button>
          <button className="hero-chip" style={{ textAlign: 'left' }} onClick={() => go('casual')}>
            <div className="k" style={{ color: '#f9c163' }}><i className="dot-sq" style={{ background: 'var(--cas-grad)' }} /> Casual</div>
            <div className="v num">{money(totals.casualTotal, cur)}</div>
          </button>
        </div>
      </div>

      {/* ---------- owed back ---------- */}
      <div className="hero hero-mint" ref={owedRef} style={{ padding: '18px 19px 17px' }}>
        <CardArt variant="mint" id="ow" holo={0.3} />
        <div className="spread">
          <div>
            <div className="hero-label">He owes you back</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 660, letterSpacing: '-.045em', marginTop: 7, color: totals.outstanding > 0 ? '#fff' : '#5ecfa8' }}>
              <AnimatedNumber value={totals.outstanding} format={(v) => money(v, cur)} />
            </div>
          </div>
          <button className="btn btn-good btn-sm" onClick={onRepay} disabled={totals.outstanding <= 0}>
            <Icon name="arrowDown" size={15} /> Returned
          </button>
        </div>
        <div className="prog" style={{ marginTop: 15, height: 5 }}>
          <i style={{ width: `${Math.round(totals.repaidPct * 100)}%` }} />
        </div>
        <div className="spread tiny muted" style={{ marginTop: 7 }}>
          <span>{money(totals.repaid, cur)} returned of {money(totals.casualTotal, cur)}</span>
          <span style={{ fontWeight: 700, color: '#5ecfa8' }}>{Math.round(totals.repaidPct * 100)}%</span>
        </div>
      </div>

      {/* ---------- this month ---------- */}
      <div className="grid-2">
        <div className="card tile">
          <div className="k"><Icon name="calendar" size={11} /> {monthName(new Date().getMonth())}</div>
          <div className="v num"><AnimatedNumber value={thisMonth.total} format={(v) => money(v, cur)} /></div>
          <div className="d row" style={{ gap: 4, color: change > 0 ? '#e3a06e' : change < 0 ? '#5ecfa8' : 'var(--t-3)' }}>
            {change !== 0 && <Icon name={change > 0 ? 'trendUp' : 'trendDown'} size={12} />}
            {change === 0 ? 'same as last month' : `${Math.abs(Math.round(change * 100))}% vs last month`}
          </div>
        </div>
        <div className="card tile">
          <div className="k"><Icon name="clock" size={11} /> Open loans</div>
          <div className="v num">
            {state.entries.filter((e) => e.kind === 'casual' && entryStatus(e, repaid).due > 0).length}
          </div>
          <div className="d">{totals.casualCount} casual entries total</div>
        </div>
      </div>

      {/* ---------- 6 month chart ---------- */}
      <div className="card">
        <div className="spread" style={{ marginBottom: 6 }}>
          <div className="card-title">Last 6 months</div>
          <button className="tiny" style={{ color: 'var(--t-3)', fontWeight: 700 }} onClick={() => go('stats')}>
            All stats <Icon name="right" size={11} />
          </button>
        </div>
        <BarChart data={series} currency={cur} />
        <div className="chart-legend">
          <span className="leg"><i style={{ background: 'linear-gradient(135deg,#7c5cff,#4b8bff)' }} /> Education</span>
          <span className="leg"><i style={{ background: 'linear-gradient(135deg,#ffb020,#ff7a45)' }} /> Casual</span>
        </div>
      </div>

      {/* ---------- top categories ---------- */}
      {topCats.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 15 }}>Where it goes</div>
          <div className="hbar">
            {topCats.map((c, i) => (
              <div key={c.id} className="hbar-item" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="hbar-top">
                  <CategoryIcon category={c} size={26} radius={9} />
                  <span className="grow" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--t-2)' }}>{c.name}</span>
                  <span className="num tiny" style={{ fontWeight: 680 }}>{money(c.total, cur)}</span>
                </div>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{
                    width: `${Math.max(c.pct * 100, 2)}%`,
                    animationDelay: `${i * 70 + 120}ms`,
                    background: `linear-gradient(90deg, ${toneOf(c.tone)}, ${toneOf(c.tone)}aa)`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- recent ---------- */}
      <div className="section-title">
        Recent activity
        <button className="tiny" style={{ color: 'var(--t-3)', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }} onClick={() => go('education')}>
          View all <Icon name="right" size={11} />
        </button>
      </div>
      <div className="list-card">
        {recent.map((e, i) => (
          <TxnRow key={e.id} entry={e} index={i} showDate status={e.kind === 'casual' ? entryStatus(e, repaid) : null} onClick={() => onEdit(e)} />
        ))}
      </div>
    </div>
  )
}
