import { useState } from 'react'
import { useApp } from '../store.jsx'
import Icon from './Icons.jsx'
import { CURRENCIES } from '../lib/format.js'

function PasswordField({ value, onChange, placeholder, autoFocus, autoComplete = 'off' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw-wrap">
      <input
        className="input" style={{ paddingRight: 52 }} type={show ? 'text' : 'password'}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        autoFocus={autoFocus} autoComplete={autoComplete}
      />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide' : 'Show'}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  )
}

export default function Login() {
  const { api, mode, state } = useApp()
  const cloud = mode === 'cloud'

  // an existing local install still knows its own username
  const [tab, setTab] = useState(cloud ? 'login' : state.auth ? 'login' : 'signup')
  const [user, setUser] = useState(cloud ? '' : state.auth?.user || '')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [name, setName] = useState('Brother')
  const [currency, setCurrency] = useState('INR')
  const [step, setStep] = useState(0)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (mode === 'booting') {
    return (
      <div className="auth">
        <div className="auth-card center">
          <div className="auth-mark"><Icon name="wallet" size={26} /></div>
          <div className="auth-sub">Opening your ledger…</div>
        </div>
      </div>
    )
  }

  const signingUp = tab === 'signup'

  const submit = async (e) => {
    e.preventDefault()
    setErr('')

    if (signingUp) {
      if (user.trim().length < 3) return setErr('Username needs at least 3 characters')
      if (pw.length < 6) return setErr('Password needs at least 6 characters')
      if (pw !== pw2) return setErr('Passwords do not match')
      if (step === 0) return setStep(1)

      setBusy(true)
      api.setSettings({ personName: name.trim() || 'Brother', initial: (name.trim()[0] || 'B').toUpperCase(), currency })
      const res = await api.signup(user, pw)
      setBusy(false)
      if (!res.ok) { setStep(0); setErr(res.message || 'Could not create that account') }
      return
    }

    setBusy(true)
    const res = await api.login(user, pw)
    setBusy(false)
    if (!res.ok) { setErr(res.message || 'Wrong username or password'); setPw('') }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-mark">
          <Icon name={signingUp && step === 1 ? 'user' : signingUp ? 'sparkle' : 'lock'} size={25} />
        </div>

        <div className="auth-title">
          {signingUp ? (step === 1 ? 'Who are you tracking?' : 'Create your account') : 'Welcome back'}
        </div>
        <div className="auth-sub">
          {signingUp
            ? step === 1
              ? 'This just personalises the app — change it any time'
              : cloud
                ? 'Your ledger syncs to every device you sign in on'
                : 'Stored on this device only'
            : cloud
              ? 'Sign in to load your ledger on this device'
              : 'Sign in to open your ledger'}
        </div>

        {signingUp && step === 1 ? (
          <div className="stack" style={{ gap: 12 }}>
            <div className="field">
              <label className="label">Their name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Brother" autoFocus />
            </div>
            <div className="field">
              <label className="label">Currency</label>
              <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c} style={{ background: '#151517' }}>{c} — {CURRENCIES[c].symbol.trim()}</option>
                ))}
              </select>
            </div>
            {err && <div className="auth-err" key={err}>{err}</div>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Creating…' : <><Icon name="sparkle" size={17} /> Open my ledger</>}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep(0)}>Back</button>
          </div>
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            <div className="field">
              <label className="label">Username</label>
              <input
                className="input" value={user} autoCapitalize="none" autoCorrect="off"
                autoComplete="username" placeholder="yashas"
                onChange={(e) => { setUser(e.target.value); setErr('') }}
              />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <PasswordField
                value={pw} onChange={(v) => { setPw(v); setErr('') }}
                placeholder={signingUp ? 'At least 6 characters' : '••••••••'}
                autoComplete={signingUp ? 'new-password' : 'current-password'}
              />
            </div>
            {signingUp && (
              <div className="field">
                <label className="label">Confirm password</label>
                <PasswordField value={pw2} onChange={(v) => { setPw2(v); setErr('') }} placeholder="Type it again" />
              </div>
            )}
            {err && <div className="auth-err" key={err}>{err}</div>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Just a moment…' : signingUp ? <>Continue <Icon name="right" size={16} /></> : <><Icon name="lock" size={17} /> Sign in</>}
            </button>
          </div>
        )}

        {!(signingUp && step === 1) && (
          <p className="tiny muted center" style={{ marginTop: 20 }}>
            {signingUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              style={{ color: 'var(--t-1)', fontWeight: 650 }}
              onClick={() => { setTab(signingUp ? 'login' : 'signup'); setErr(''); setStep(0); setPw(''); setPw2('') }}
            >
              {signingUp ? 'Sign in' : 'Create one'}
            </button>
          </p>
        )}

        <p className="tiny muted center" style={{ marginTop: 16, lineHeight: 1.55 }}>
          {cloud
            ? 'Your ledger is stored on the server and loads on any device you sign in from.'
            : 'No server is configured, so this ledger stays in this browser only.'}
        </p>
      </form>
    </div>
  )
}
