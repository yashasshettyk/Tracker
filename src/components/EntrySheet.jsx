import { useState } from 'react'
import { useApp } from '../store.jsx'
import Sheet, { useSheetClose } from './Sheet.jsx'
import CategoryPicker from './CategoryPicker.jsx'
import Segmented from './Segmented.jsx'
import Icon from './Icons.jsx'
import { symbolOf, todayISO, toISO, money } from '../lib/format.js'

export default function EntrySheet({ entry, initialKind = 'education', onClose }) {
  return (
    <Sheet
      onClose={onClose}
      title={entry ? 'Edit entry' : 'Add money given'}
      sub={entry ? 'Update the details below' : 'Record what you handed over'}
    >
      <Form entry={entry} initialKind={initialKind} />
    </Sheet>
  )
}

function Form({ entry, initialKind }) {
  const { state, api } = useApp()
  const close = useSheetClose()
  const cur = state.settings.currency

  const [kind, setKind] = useState(entry?.kind || initialKind)
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '')
  const [categoryId, setCategoryId] = useState(entry?.categoryId || '')
  const [date, setDate] = useState(entry?.date || todayISO())
  const [note, setNote] = useState(entry?.note || '')
  const [dueDate, setDueDate] = useState(entry?.dueDate || '')
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  const edu = kind === 'education'
  const amt = parseFloat(amount) || 0

  const bump = (n) => setAmount(String(Math.round(((parseFloat(amount) || 0) + n) * 100) / 100))

  const submit = (e) => {
    e.preventDefault()
    if (amt <= 0) return setErr('Enter an amount greater than zero')
    if (!categoryId) return setErr('Pick a category (or create one)')
    const payload = { kind, amount: amt, categoryId, date, note: note.trim(), dueDate: edu ? '' : dueDate }
    entry ? api.updateEntry(entry.id, payload) : api.addEntry(payload)
    close()
  }

  const yest = () => { const d = new Date(); d.setDate(d.getDate() - 1); setDate(toISO(d)) }

  return (
    <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
      {!entry && (
        <Segmented
          tone={edu ? 'edu' : 'casual'}
          value={kind}
          onChange={(k) => { setKind(k); setCategoryId('') }}
          items={[
            { k: 'education', label: <><Icon name="edu" size={16} weight="duotone" /> Education</> },
            { k: 'casual', label: <><Icon name="casual" size={16} weight="duotone" /> Casual</> },
          ]}
        />
      )}

      <div className="field">
        <label className="label">Amount {!edu && <span className="muted">· he returns this</span>}</label>
        <div className="amount-wrap">
          <span className="amount-cur">{symbolOf(cur)}</span>
          <input
            className="amount-input" inputMode="decimal" type="number" step="0.01" min="0"
            value={amount} onChange={(e) => { setAmount(e.target.value); setErr('') }}
            placeholder="0" autoFocus={!entry}
          />
        </div>
        <div className="quick-row" style={{ marginTop: 4 }}>
          {[100, 500, 1000, 5000, 10000].map((n) => (
            <button key={n} type="button" className="quick" onClick={() => bump(n)}>+{n >= 1000 ? n / 1000 + 'k' : n}</button>
          ))}
          {amt > 0 && <button type="button" className="quick" onClick={() => setAmount('')}>Clear</button>}
        </div>
      </div>

      <div className="field">
        <label className="label">Category</label>
        <CategoryPicker kind={kind} value={categoryId} onChange={(id) => { setCategoryId(id); setErr('') }} />
      </div>

      <div className="field">
        <label className="label">Date given</label>
        <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        <div className="quick-row">
          <button type="button" className="quick" onClick={() => setDate(todayISO())}>Today</button>
          <button type="button" className="quick" onClick={yest}>Yesterday</button>
        </div>
      </div>

      {!edu && (
        <div className="field">
          <label className="label">Expected return <span className="muted">· optional</span></label>
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      )}

      <div className="field">
        <label className="label">Note <span className="muted">· optional</span></label>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={edu ? 'e.g. 3rd sem college fee' : 'e.g. said he will return after salary'} />
      </div>

      {err && <div className="auth-err" style={{ textAlign: 'left' }}>{err}</div>}

      <button type="submit" className={'btn btn-block ' + (edu ? 'btn-primary' : 'btn-warm')}>
        <Icon name="check" size={18} />
        {entry ? 'Save changes' : `Add ${amt > 0 ? money(amt, cur) : 'entry'}`}
      </button>

      {entry && (
        confirmDel ? (
          <div className="row" style={{ gap: 9 }}>
            <button type="button" className="btn grow" onClick={() => setConfirmDel(false)}>Cancel</button>
            <button type="button" className="btn btn-danger grow" onClick={() => { api.deleteEntry(entry.id); close() }}>
              <Icon name="trash" size={16} /> Delete for good
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost btn-block" style={{ color: 'var(--neg)' }} onClick={() => setConfirmDel(true)}>
            <Icon name="trash" size={16} /> Delete entry
          </button>
        )
      )}
    </form>
  )
}
