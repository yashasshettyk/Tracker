import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import Sheet, { useSheetClose } from './Sheet.jsx'
import Icon from './Icons.jsx'
import CategoryIcon from './CategoryIcon.jsx'
import { symbolOf, todayISO, money, fmtDateShort } from '../lib/format.js'
import { repaidByEntry, entryStatus, computeTotals, allocateFIFO } from '../lib/stats.js'

export default function RepaySheet({ presetEntryId = null, onClose }) {
  return (
    <Sheet onClose={onClose} title="Money returned" sub="Record what he has paid back">
      <Form presetEntryId={presetEntryId} />
    </Sheet>
  )
}

function Form({ presetEntryId }) {
  const { state, api } = useApp()
  const close = useSheetClose()
  const cur = state.settings.currency
  const totals = computeTotals(state)

  const repaid = useMemo(() => repaidByEntry(state.repayments), [state.repayments])
  const open = useMemo(
    () =>
      state.entries
        .filter((e) => e.kind === 'casual')
        .map((e) => ({ e, ...entryStatus(e, repaid) }))
        .filter((x) => x.due > 0.004)
        .sort((a, b) => a.e.date.localeCompare(b.e.date)),
    [state.entries, repaid]
  )

  const [target, setTarget] = useState(presetEntryId || 'auto')
  const [amount, setAmount] = useState(() => {
    if (presetEntryId) {
      const hit = open.find((x) => x.e.id === presetEntryId)
      return hit ? String(hit.due) : ''
    }
    return ''
  })
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const amt = parseFloat(amount) || 0
  const targetDue = target === 'auto' ? totals.outstanding : open.find((x) => x.e.id === target)?.due || 0
  const preview = target === 'auto' && amt > 0 ? allocateFIFO(state, amt) : null

  const submit = (e) => {
    e.preventDefault()
    if (amt <= 0) return setErr('Enter an amount greater than zero')
    if (amt > targetDue + 0.004) return setErr(`That is more than the ${money(targetDue, cur)} outstanding`)
    api.addRepayment({ amount: amt, date, note: note.trim(), entryId: target === 'auto' ? null : target })
    close()
  }

  if (!totals.outstanding) {
    return (
      <div className="empty">
        <div className="empty-mark"><Icon name="check" size={24} /></div>
        <h3>Nothing outstanding</h3>
        <p>Every casual loan is fully settled. Nice.</p>
        <button className="btn btn-block" style={{ marginTop: 18 }} onClick={close}>Close</button>
      </div>
    )
  }

  return (
    <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
      <div className="card card-flat spread" style={{ padding: 14 }}>
        <div>
          <div className="tiny muted" style={{ fontWeight: 650, textTransform: 'uppercase', letterSpacing: '.08em' }}>Outstanding</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 780, letterSpacing: '-.035em', marginTop: 2 }}>{money(totals.outstanding, cur)}</div>
        </div>
        <button type="button" className="btn btn-sm" onClick={() => { setTarget('auto'); setAmount(String(totals.outstanding)) }}>Settle all</button>
      </div>

      <div className="field">
        <label className="label">Amount returned</label>
        <div className="amount-wrap">
          <span className="amount-cur">{symbolOf(cur)}</span>
          <input className="amount-input" inputMode="decimal" type="number" step="0.01" min="0" autoFocus
            value={amount} onChange={(e) => { setAmount(e.target.value); setErr('') }} placeholder="0" />
        </div>
        <div className="quick-row" style={{ marginTop: 4 }}>
          {[500, 1000, 5000].map((n) => (
            <button key={n} type="button" className="quick" onClick={() => setAmount(String(Math.min((parseFloat(amount) || 0) + n, targetDue)))}>
              +{n >= 1000 ? n / 1000 + 'k' : n}
            </button>
          ))}
          <button type="button" className="quick" onClick={() => setAmount(String(targetDue))}>Full {money(targetDue, cur)}</button>
        </div>
      </div>

      <div className="field">
        <label className="label">Apply to</label>
        <div className="list-card cat-list" style={{ maxHeight: '32vh' }}>
          <button type="button" className={'list-row' + (target === 'auto' ? ' sel' : '')} onClick={() => setTarget('auto')}>
            <span className="cat-avatar" style={{ width: 40, height: 40, borderRadius: 13, color: 'var(--pos)', background: 'rgba(47,211,165,.12)', boxShadow: 'inset 0 0 0 1px rgba(47,211,165,.22)' }}>
              <Icon name="bolt" size={18} />
            </span>
            <span className="grow" style={{ textAlign: 'left' }}>
              <span className="cat-name" style={{ display: 'block' }}>Oldest loans first</span>
              <span className="cat-meta">Splits the amount automatically</span>
            </span>
            {target === 'auto' && <Icon name="check" size={17} className="cat-check" />}
          </button>

          {open.map((x, i) => {
            const c = state.categories.find((k) => k.id === x.e.categoryId)
            return (
              <button key={x.e.id} type="button" className={'list-row' + (target === x.e.id ? ' sel' : '')}
                style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                onClick={() => { setTarget(x.e.id); setAmount(String(x.due)) }}>
                <CategoryIcon category={c} size={40} />
                <span className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                  <span className="cat-name" style={{ display: 'block' }}>{c?.name || 'Loan'}</span>
                  <span className="cat-meta">{fmtDateShort(x.e.date)} · {money(x.due, cur)} due{x.paid > 0 ? ` of ${money(x.e.amount, cur)}` : ''}</span>
                </span>
                {target === x.e.id && <Icon name="check" size={17} className="cat-check" />}
              </button>
            )
          })}
        </div>
      </div>

      {preview && preview.parts.length > 1 && (
        <div className="card card-flat" style={{ padding: 13 }}>
          <div className="tiny muted" style={{ fontWeight: 650, marginBottom: 8 }}>This will clear</div>
          {preview.parts.map((p) => {
            const e = state.entries.find((x) => x.id === p.entryId)
            const c = state.categories.find((k) => k.id === e?.categoryId)
            return (
              <div key={p.entryId} className="spread tiny" style={{ padding: '3px 0' }}>
                <span className="muted">{c?.name} · {fmtDateShort(e?.date)}</span>
                <span className="num" style={{ fontWeight: 700, color: 'var(--good-1)' }}>{money(p.amount, cur)}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="field">
        <label className="label">Date returned</label>
        <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Note <span className="muted">· optional</span></label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. UPI transfer" />
      </div>

      {err && <div className="auth-err" style={{ textAlign: 'left' }}>{err}</div>}

      <button type="submit" className="btn btn-good btn-block">
        <Icon name="check" size={18} /> Record {amt > 0 ? money(amt, cur) : 'repayment'}
      </button>
    </form>
  )
}
