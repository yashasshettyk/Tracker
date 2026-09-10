import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import BarChart from './charts/BarChart.jsx'
import AreaChart from './charts/AreaChart.jsx'
import DonutChart from './charts/DonutChart.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'
import Icon from './Icons.jsx'
import Segmented from './Segmented.jsx'
import { money } from '../lib/format.js'
import { computeTotals, monthlySeries, yearlySeries, outstandingTrend, cumulativeGiven, categoryBreakdown, insights } from '../lib/stats.js'

const RANGES = [{ k: 6, label: '6M' }, { k: 12, label: '12M' }, { k: 'y', label: 'Yearly' }]
const MODES = [
  { k: 'both', label: 'All' },
  { k: 'education', label: 'Education' },
  { k: 'casual', label: 'Casual' },
]

export default function StatsView() {
  const { state } = useApp()
  const cur = state.settings.currency
  const [range, setRange] = useState(6)
  const [mode, setMode] = useState('both')
  const [trend, setTrend] = useState('outstanding')
  const [donutKind, setDonutKind] = useState('education')

  const totals = useMemo(() => computeTotals(state), [state])
  const bars = useMemo(() => {
    if (range === 'y') {
      return yearlySeries(state).map((y) => ({ ...y, full: y.label }))
    }
    return monthlySeries(state, range)
  }, [state, range])

  const trendPts = useMemo(
    () => (trend === 'outstanding' ? outstandingTrend(state, range === 'y' ? 12 : range) : cumulativeGiven(state, range === 'y' ? 12 : range)),
    [state, trend, range]
  )
  const donutData = useMemo(() => categoryBreakdown(state, donutKind, 6), [state, donutKind])
  const facts = useMemo(() => insights(state, totals), [state, totals])
  const years = useMemo(() => yearlySeries(state).slice().reverse(), [state])

  if (!state.entries.length) {
    return (
      <div className="page empty" style={{ paddingTop: 80 }}>
        <div className="empty-mark"><Icon name="chart" size={24} /></div>
        <h3>No stats yet</h3>
        <p>Add a few entries and this page fills up with charts and trends.</p>
      </div>
    )
  }

  return (
    <div className="page stack" style={{ gap: 14 }}>
      {/* headline numbers */}
      <div className="grid-2">
        <div className="card tile" style={{ paddingLeft: 18 }}>
          <div className="accent-bar acc-edu" />
          <div className="k">Total given</div>
          <div className="v num"><AnimatedNumber value={totals.given} format={(v) => money(v, cur)} /></div>
          <div className="d">{state.entries.length} entries</div>
        </div>
        <div className="card tile" style={{ paddingLeft: 18 }}>
          <div className="accent-bar acc-good" />
          <div className="k">Returned</div>
          <div className="v num" style={{ color: '#5ecfa8' }}><AnimatedNumber value={totals.repaid} format={(v) => money(v, cur)} /></div>
          <div className="d">{Math.round(totals.repaidPct * 100)}% of casual loans</div>
        </div>
      </div>

      {/* range + mode */}
      <Segmented value={range} onChange={setRange} items={RANGES.map((r) => ({ k: r.k, label: r.label }))} />

      <div className="card">
        <div className="spread" style={{ marginBottom: 12 }}>
          <div className="card-title">{range === 'y' ? 'Year by year' : 'Month by month'}</div>
        </div>
        <div className="quick-row" style={{ marginBottom: 14 }}>
          {MODES.map((m) => (
            <button key={m.k} className={'quick' + (mode === m.k ? ' on' : '')} onClick={() => setMode(m.k)}>
              {m.label}
            </button>
          ))}
        </div>
        <BarChart data={bars} currency={cur} mode={mode} />
      </div>

      {/* trend */}
      <div className="card">
        <div className="spread" style={{ marginBottom: 14 }}>
          <div className="card-title">{trend === 'outstanding' ? 'Outstanding over time' : 'Cumulative given'}</div>
          <button className="btn btn-sm" onClick={() => setTrend(trend === 'outstanding' ? 'cumulative' : 'outstanding')}>
            <Icon name="trendUp" size={14} /> Switch
          </button>
        </div>
        <AreaChart
          points={trendPts} currency={cur}
          id={trend}
          color={trend === 'outstanding' ? '#e3bd82' : '#9b8cff'}
          color2={trend === 'outstanding' ? '#c99f63' : '#7d8dff'}
        />
        <div className="tiny muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
          {trend === 'outstanding'
            ? 'What he still owed you at the end of each month.'
            : 'Everything you have given, adding up over time.'}
        </div>
      </div>

      {/* categories */}
      <div className="card">
        <div className="spread" style={{ marginBottom: 14 }}>
          <div className="card-title">By category</div>
          <div className="row" style={{ gap: 6 }}>
            {['education', 'casual'].map((k) => (
              <button key={k} className={'quick' + (donutKind === k ? ' on' : '')} onClick={() => setDonutKind(k)}>
                {k === 'education' ? 'Education' : 'Casual'}
              </button>
            ))}
          </div>
        </div>
        {donutData.length ? (
          <DonutChart data={donutData} currency={cur} label={donutKind === 'education' ? 'Education' : 'Casual'} />
        ) : (
          <div className="empty" style={{ padding: '26px 10px' }}>
            <p>No {donutKind} entries yet.</p>
          </div>
        )}
      </div>

      {/* insight tiles */}
      {facts.length > 0 && (
        <>
          <div className="section-title">Insights</div>
          <div className="grid-2">
            {facts.map((f, i) => (
              <div key={f.k} className="card tile" style={{ animation: `pageIn .5s var(--spring) both ${i * 70}ms` }}>
                <div className="k">{f.k}</div>
                <div className="v num">{f.money ? money(f.v, cur) : f.v}</div>
                <div className="d" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.d}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* yearly table */}
      {years.length > 0 && (
        <>
          <div className="section-title">Yearly summary</div>
          <div className="card" style={{ padding: '6px 14px' }}>
            {years.map((y, i) => (
              <div key={y.key}>
                {i > 0 && <div className="divider" />}
                <div style={{ padding: '13px 0' }}>
                  <div className="spread">
                    <span style={{ fontWeight: 750, fontSize: 15 }}>{y.label}</span>
                    <span className="num" style={{ fontWeight: 750 }}>{money(y.total, cur)}</span>
                  </div>
                  <div className="row" style={{ gap: 14, marginTop: 7 }}>
                    <span className="tiny" style={{ color: '#a99dff', fontWeight: 620 }}>{money(y.education, cur)}</span>
                    <span className="tiny" style={{ color: '#e3bd82', fontWeight: 650 }}>{money(y.casual, cur)}</span>
                    <span className="tiny" style={{ color: '#5ecfa8', fontWeight: 650 }}>{money(y.repaid, cur)} back</span>
                    <span className="tiny muted grow" style={{ textAlign: 'right' }}>{y.count} entries</span>
                  </div>
                  <div className="hbar-track" style={{ marginTop: 9 }}>
                    <div className="hbar-fill" style={{
                      width: `${Math.max((y.total / Math.max(...years.map((x) => x.total))) * 100, 3)}%`,
                      background: 'linear-gradient(90deg,#a294ff,#7d8dff)',
                      animationDelay: `${i * 80}ms`,
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
