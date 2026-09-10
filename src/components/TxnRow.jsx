import { useApp } from '../store.jsx'
import CategoryIcon from './CategoryIcon.jsx'
import { money, fmtDateShort } from '../lib/format.js'
import Icon from './Icons.jsx'

const PILL = {
  open: { cls: 'pill-open', text: 'Due' },
  partial: { cls: 'pill-part', text: 'Part paid' },
  settled: { cls: 'pill-done', text: 'Settled' },
}

export function TxnRow({ entry, status, onClick, index = 0, showDate = false }) {
  const { state } = useApp()
  const cur = state.settings.currency
  const c = state.categories.find((k) => k.id === entry.categoryId)
  const edu = entry.kind === 'education'
  const pill = status && !edu ? PILL[status.state] : null
  const showBar = status && !edu && status.state !== 'open'

  const sub = [
    showDate ? fmtDateShort(entry.date) : null,
    entry.note || (showDate ? null : fmtDateShort(entry.date)),
    !edu && entry.dueDate ? `expects ${fmtDateShort(entry.dueDate)}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <button className="list-row" onClick={onClick} style={{ animationDelay: `${Math.min(index, 9) * 32}ms` }}>
      <CategoryIcon category={c} size={40} />

      <span className="grow">
        <span className="txn-title" style={{ display: 'block' }}>{c?.name || 'Uncategorised'}</span>
        <span className="txn-sub" style={{ display: 'block' }}>{sub || '—'}</span>
        {showBar && (
          <>
            <span className="prog" style={{ display: 'block', marginTop: 8, maxWidth: 190 }}>
              <i style={{ width: `${status.pct * 100}%` }} />
            </span>
            <span className="tiny muted" style={{ display: 'block', marginTop: 5 }}>
              {status.due > 0 ? `${money(status.due, cur)} still due` : 'fully cleared'}
            </span>
          </>
        )}
      </span>

      <span style={{ textAlign: 'right', flex: 'none' }}>
        <span className="txn-amt num" style={{ display: 'block', color: edu ? '#c0b2ff' : '#f9cd7f' }}>
          {money(entry.amount, cur)}
        </span>
        {pill && <span className={'pill ' + pill.cls} style={{ marginTop: 5 }}>{pill.text}</span>}
      </span>
    </button>
  )
}

export function RepayRow({ rep, index = 0, onDelete }) {
  const { state } = useApp()
  const cur = state.settings.currency
  const entry = state.entries.find((e) => e.id === rep.entryId)
  const c = state.categories.find((k) => k.id === entry?.categoryId)

  return (
    <div className="list-row" style={{ animationDelay: `${Math.min(index, 9) * 32}ms` }}>
      <span
        className="cat-avatar"
        style={{
          width: 40, height: 40, borderRadius: 13, color: '#5ecfa8',
          background: 'linear-gradient(155deg, rgba(47,211,165,.2), rgba(47,211,165,.07))',
          boxShadow: 'inset 0 0 0 1px rgba(47,211,165,.22)',
        }}
      >
        <Icon name="arrowDown" size={19} />
      </span>
      <div className="grow">
        <div className="txn-title">Returned{c ? ` · ${c.name}` : ''}</div>
        <div className="txn-sub">{fmtDateShort(rep.date)}{rep.note ? ` · ${rep.note}` : ''}</div>
      </div>
      <div className="row" style={{ gap: 6, flex: 'none' }}>
        <span className="txn-amt num" style={{ color: '#5ecfa8' }}>+{money(rep.amount, cur)}</span>
        {onDelete && (
          <button onClick={() => onDelete(rep.id)} style={{ color: 'var(--t-3)', padding: 7, margin: -7 }} aria-label="Remove repayment">
            <Icon name="x" size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
