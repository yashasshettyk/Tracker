import { useRef, useState } from 'react'
import { useApp } from '../store.jsx'
import Icon from './Icons.jsx'
import { CURRENCIES } from '../lib/format.js'
import { computeTotals } from '../lib/stats.js'

function Block({ title, children }) {
  return (
    <>
      <div className="section-title">{title}</div>
      <div className="card stack" style={{ gap: 14 }}>{children}</div>
    </>
  )
}

export default function Settings() {
  const { state, api, mode, user, sync } = useApp()
  const [name, setName] = useState(state.settings.personName)
  const [old, setOld] = useState('')
  const [np, setNp] = useState('')
  const [msg, setMsg] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const fileRef = useRef(null)
  const totals = computeTotals(state)

  const changePw = async (e) => {
    e.preventDefault()
    if (np.length < 6) return setMsg('New password needs 6+ characters')
    const res = await api.changePassword(old, np)
    if (!res.ok) return setMsg(res.message || 'Current password is wrong')
    setOld(''); setNp(''); setMsg('')
    api.notify('Password changed', 'lock')
  }

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => api.importData(String(r.result))
    r.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className="page stack" style={{ gap: 6 }}>
      <Block title="Account">
        <div className="spread">
          <div className="row" style={{ gap: 11 }}>
            <span className="cat-avatar" style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--edu-grad)', color: '#fff' }}>
              <Icon name="user" size={20} weight="duotone" />
            </span>
            <div>
              <div style={{ fontWeight: 640, fontSize: 14.5 }}>{user?.username || state.auth?.user || 'This device'}</div>
              <div className="tiny muted" style={{ marginTop: 2 }}>
                {mode === 'cloud'
                  ? sync === 'offline' ? 'Offline — changes will sync when you reconnect'
                  : sync === 'saving' ? 'Saving…' : 'Synced to your account'
                  : 'Local to this browser'}
              </div>
            </div>
          </div>
          <span
            className="dot-sq"
            style={{
              width: 9, height: 9, borderRadius: 99,
              background: mode !== 'cloud' ? 'var(--t-3)' : sync === 'offline' ? 'var(--neg)' : 'var(--pos)',
            }}
          />
        </div>
      </Block>

      <Block title="Profile">
        <div className="field">
          <label className="label">Who you are tracking</label>
          <input className="input" value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => api.setSettings({ personName: name.trim() || 'Brother', initial: (name.trim()[0] || 'B').toUpperCase() })} />
        </div>
        <div className="field">
          <label className="label">Currency</label>
          <select className="input" value={state.settings.currency} onChange={(e) => api.setSettings({ currency: e.target.value })}>
            {Object.keys(CURRENCIES).map((c) => (
              <option key={c} value={c} style={{ background: '#151924' }}>{c} — {CURRENCIES[c].symbol.trim()}</option>
            ))}
          </select>
        </div>
      </Block>

      <Block title="Security">
        <form className="stack" style={{ gap: 12 }} onSubmit={changePw}>
          <div className="field">
            <label className="label">Current password</label>
            <input className="input" type="password" value={old} onChange={(e) => { setOld(e.target.value); setMsg('') }} autoComplete="off" />
          </div>
          <div className="field">
            <label className="label">New password</label>
            <input className="input" type="password" value={np} onChange={(e) => { setNp(e.target.value); setMsg('') }} autoComplete="new-password" />
          </div>
          {msg && <div className="auth-err" style={{ textAlign: 'left' }} key={msg}>{msg}</div>}
          <button className="btn btn-block" type="submit" disabled={!old || !np}>
            <Icon name="lock" size={16} /> Update password
          </button>
        </form>
        <div className="divider" />
        <button className="btn btn-block btn-ghost" onClick={() => api.logout()}>
          <Icon name="logout" size={17} /> Sign out
        </button>
      </Block>

      <Block title="Your data">
        <div className="spread">
          <div>
            <div style={{ fontWeight: 650, fontSize: 14.5 }}>{state.entries.length} entries · {state.repayments.length} repayments</div>
            <div className="tiny muted" style={{ marginTop: 3 }}>{state.categories.length} categories · stored in this browser</div>
          </div>
        </div>
        <div className="row" style={{ gap: 9 }}>
          <button className="btn grow" onClick={api.exportData}><Icon name="download" size={16} /> Backup</button>
          <button className="btn grow" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} /> Restore</button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} style={{ display: 'none' }} />
        </div>
        <div className="divider" />
        {confirmClear ? (
          <div className="stack" style={{ gap: 9 }}>
            <div className="tiny" style={{ color: 'var(--neg)', fontWeight: 650 }}>
              This deletes all {state.entries.length} entries and {state.repayments.length} repayments ({CURRENCIES[state.settings.currency].symbol}{Math.round(totals.given).toLocaleString()} of records). Categories and your login stay.
            </div>
            <div className="row" style={{ gap: 9 }}>
              <button className="btn grow" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="btn btn-danger grow" onClick={() => { api.clearRecords(); setConfirmClear(false) }}>
                <Icon name="trash" size={16} /> Yes, clear
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-block btn-ghost" style={{ color: 'var(--neg)' }} onClick={() => setConfirmClear(true)}>
            <Icon name="trash" size={16} /> Clear all records
          </button>
        )}
      </Block>

      <p className="tiny muted center" style={{ margin: '22px 10px 4px', lineHeight: 1.6 }}>
        {mode === 'cloud'
          ? 'Your ledger lives in your account on the server, with a copy cached on this device so it opens instantly and keeps working offline.'
          : 'No server is configured, so this ledger stays in this browser only. Take a backup now and then.'}
      </p>
    </div>
  )
}
