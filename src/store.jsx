import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  loadState, saveState, uid, hashPin, getSession, setSession, emptyState,
  loadCache, saveCache, clearCache,
} from './lib/storage.js'
import { allocateFIFO } from './lib/stats.js'
import { cloud, probe } from './lib/cloud.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

/** fields that live on the server; auth never does */
const docOf = (s) => ({
  version: s.version,
  settings: s.settings,
  categories: s.categories,
  entries: s.entries,
  repayments: s.repayments,
})

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState)
  const [mode, setMode] = useState('booting')      // booting | cloud | local
  const [user, setUser] = useState(null)           // cloud account
  const [authed, setAuthed] = useState(false)
  const [sync, setSync] = useState('idle')         // idle | saving | offline
  const [toast, setToast] = useState(null)

  const toastTimer = useRef(null)
  const saveTimer = useRef(null)
  const dirty = useRef(false)
  const hydrated = useRef(false)

  const notify = useCallback((msg, icon = 'check') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, icon, id: uid() })
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }, [])

  // ---------- boot: is there a backend, and are we already signed in? ------
  useEffect(() => {
    let alive = true
    ;(async () => {
      const online = await probe()
      if (!alive) return
      if (!online) {
        // no API (local dev, or offline first load) — fall back to this device only
        setMode('local')
        setAuthed(getSession() && !!loadState().auth)
        return
      }
      setMode('cloud')
      const me = await cloud.me()
      if (!alive) return
      if (me.ok && me.data.user) {
        setUser(me.data.user)
        const cached = loadCache(me.data.user.id)
        if (cached) setState((s) => ({ ...s, ...cached }))
        setAuthed(true)
        const remote = await cloud.getDoc()
        if (!alive) return
        if (remote.ok && remote.data.doc && Object.keys(remote.data.doc).length) {
          setState((s) => ({ ...s, ...remote.data.doc }))
          saveCache(me.data.user.id, remote.data.doc)
        }
        hydrated.current = true
      }
    })()
    return () => { alive = false }
  }, [])

  // ---------- persistence -------------------------------------------------
  useEffect(() => {
    if (mode === 'local') saveState(state)
  }, [state, mode])

  // push to the server, debounced, after the first hydration
  useEffect(() => {
    if (mode !== 'cloud' || !authed || !user || !hydrated.current) return
    saveCache(user.id, docOf(state))
    dirty.current = true
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSync('saving')
      const res = await cloud.putDoc(docOf(state))
      if (res.ok) { dirty.current = false; setSync('idle') }
      else setSync('offline')
    }, 700)
    return () => clearTimeout(saveTimer.current)
  }, [state, mode, authed, user])

  // last-ditch flush when the tab goes away
  useEffect(() => {
    const flush = () => {
      if (mode === 'cloud' && dirty.current && user) {
        const blob = new Blob([JSON.stringify({ doc: docOf(state) })], { type: 'application/json' })
        navigator.sendBeacon?.('/api/data', blob)
      }
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [state, mode, user])

  const patch = useCallback((fn) => setState((s) => fn(s)), [])

  const api = useMemo(() => ({
    mode, user, sync,

    // ---------- accounts ----------
    async signup(username, password) {
      if (mode !== 'cloud') { // this device only
        const salt = uid()
        patch((s) => ({ ...s, auth: { user: username.trim(), salt, hash: hashPin(password, salt) } }))
        setSession(true); setAuthed(true)
        return { ok: true }
      }
      const res = await cloud.signup(username, password, docOf(state))
      if (!res.ok) return res
      setUser(res.data.user)
      setAuthed(true)
      hydrated.current = true
      saveCache(res.data.user.id, docOf(state))
      notify(`Welcome, ${res.data.user.username}`, 'sparkle')
      return { ok: true }
    },

    async login(username, password) {
      if (mode !== 'cloud') {
        const a = state.auth
        const ok = a && a.user.toLowerCase() === username.trim().toLowerCase() && a.hash === hashPin(password, a.salt)
        if (ok) { setSession(true); setAuthed(true) }
        return ok ? { ok: true } : { ok: false, message: 'Wrong username or password.' }
      }
      const res = await cloud.login(username, password)
      if (!res.ok) return res
      setUser(res.data.user)
      setAuthed(true)
      // pull this account's ledger — this is what makes a new device "just work"
      const remote = await cloud.getDoc()
      if (remote.ok && remote.data.doc && Object.keys(remote.data.doc).length) {
        setState((s) => ({ ...s, ...remote.data.doc }))
        saveCache(res.data.user.id, remote.data.doc)
      } else {
        setState(() => ({ ...emptyState(), auth: null }))
      }
      hydrated.current = true
      return { ok: true }
    },

    async logout() {
      clearTimeout(saveTimer.current)
      if (mode === 'cloud') {
        if (dirty.current && user) await cloud.putDoc(docOf(state))
        await cloud.logout()
        if (user) clearCache(user.id)
        setUser(null)
        hydrated.current = false
        setState(() => ({ ...emptyState(), auth: null }))
      } else {
        setSession(false)
      }
      setAuthed(false)
    },

    async changePassword(oldPw, newPw) {
      if (mode !== 'cloud') {
        const a = state.auth
        if (!a || a.hash !== hashPin(oldPw, a.salt)) return { ok: false, message: 'Current password is wrong.' }
        const salt = uid()
        patch((s) => ({ ...s, auth: { ...s.auth, salt, hash: hashPin(newPw, salt) } }))
        return { ok: true }
      }
      return cloud.changePassword(oldPw, newPw)
    },

    // ---------- entries ----------
    addEntry(e) {
      const entry = { ...e, id: uid(), amount: Number(e.amount), createdAt: Date.now() }
      patch((s) => ({ ...s, entries: [entry, ...s.entries] }))
      notify(e.kind === 'education' ? 'Education entry added' : 'Loan recorded', e.kind === 'education' ? 'edu' : 'casual')
      return entry
    },
    updateEntry(id, changes) {
      patch((s) => ({
        ...s,
        entries: s.entries.map((e) => (e.id === id ? { ...e, ...changes, amount: Number(changes.amount ?? e.amount) } : e)),
      }))
      notify('Entry updated', 'edit')
    },
    deleteEntry(id) {
      patch((s) => ({
        ...s,
        entries: s.entries.filter((e) => e.id !== id),
        repayments: s.repayments.filter((r) => r.entryId !== id),
      }))
      notify('Entry deleted', 'trash')
    },

    // ---------- repayments ----------
    addRepayment({ amount, date, note, entryId = null }) {
      const amt = Number(amount)
      setState((s) => {
        let created
        if (entryId) {
          created = [{ id: uid(), entryId, amount: amt, date, note, createdAt: Date.now() }]
        } else {
          const { parts } = allocateFIFO(s, amt)
          const batch = uid()
          created = parts.map((p) => ({ id: uid(), entryId: p.entryId, amount: p.amount, date, note, batch, createdAt: Date.now() }))
          if (!created.length) created = [{ id: uid(), entryId: null, amount: amt, date, note, createdAt: Date.now() }]
        }
        return { ...s, repayments: [...created, ...s.repayments] }
      })
      notify('Repayment recorded', 'arrowDown')
    },
    deleteRepayment(id) {
      patch((s) => ({ ...s, repayments: s.repayments.filter((r) => r.id !== id) }))
      notify('Repayment removed', 'arrowDown')
    },

    // ---------- categories ----------
    addCategory({ name, icon, tone, kind }) {
      const cat = { id: uid(), name: name.trim(), icon: icon || 'tag', tone: tone || 'pewter', kind, builtin: false }
      patch((s) => ({ ...s, categories: [...s.categories, cat] }))
      notify(`"${cat.name}" added`, 'check')
      return cat
    },
    updateCategory(id, changes) {
      patch((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...changes } : c)) }))
      notify('Category updated', 'edit')
    },
    deleteCategory(id) {
      patch((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }))
      notify('Category removed', 'trash')
    },

    // ---------- settings / data ----------
    setSettings(changes) { patch((s) => ({ ...s, settings: { ...s.settings, ...changes } })) },
    exportData() {
      const blob = new Blob([JSON.stringify(docOf(state), null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ledger-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      notify('Backup downloaded', 'download')
    },
    importData(json) {
      try {
        const parsed = JSON.parse(json)
        if (!parsed || !Array.isArray(parsed.entries)) throw new Error('bad file')
        patch((s) => ({
          ...emptyState(),
          ...parsed,
          auth: s.auth,
          settings: { ...s.settings, ...(parsed.settings || {}) },
        }))
        notify('Data restored', 'upload')
        return true
      } catch {
        notify('That file could not be read', 'sparkle')
        return false
      }
    },
    clearRecords() {
      patch((s) => ({ ...s, entries: [], repayments: [] }))
      notify('All records cleared', 'trash')
    },
    notify,
  }), [state, patch, notify, mode, user, sync])

  return <Ctx.Provider value={{ state, authed, api, toast, mode, user, sync }}>{children}</Ctx.Provider>
}
