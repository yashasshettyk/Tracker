import { useMemo, useRef, useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import Sheet, { useSheetClose } from './Sheet.jsx'
import Icon from './Icons.jsx'
import CategoryIcon, { Glyph, GLYPH_KEYS, TONE_KEYS, TONES, toneOf } from './CategoryIcon.jsx'
import { money } from '../lib/format.js'

/** Trigger + searchable sheet. Creating a new category never leaves the flow. */
export default function CategoryPicker({ kind, value, onChange }) {
  const { state } = useApp()
  const [open, setOpen] = useState(false)
  const cat = state.categories.find((c) => c.id === value)

  return (
    <>
      <button type="button" className="picker-trigger" onClick={() => setOpen(true)}>
        {cat ? (
          <>
            <CategoryIcon category={cat} size={36} />
            <span className="picker-name grow">{cat.name}</span>
          </>
        ) : (
          <>
            <span
              className="cat-avatar"
              style={{ width: 36, height: 36, borderRadius: 12, color: 'var(--t-3)', background: 'rgba(255,255,255,.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.07)' }}
            >
              <Icon name="search" size={16} />
            </span>
            <span className="grow" style={{ fontSize: 14.5, color: 'var(--t-3)' }}>Search or add a category…</span>
          </>
        )}
        <Icon name="chevron" size={16} style={{ color: 'var(--t-3)', flex: 'none' }} />
      </button>

      {open && (
        <Sheet
          onClose={() => setOpen(false)}
          title="Category"
          sub={kind === 'education' ? 'What is this education spend for?' : 'What was this money for?'}
        >
          <PickerBody kind={kind} value={value} onChange={onChange} />
        </Sheet>
      )}
    </>
  )
}

function PickerBody({ kind, value, onChange }) {
  const { state, api } = useApp()
  const close = useSheetClose()
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [icon, setIcon] = useState('tag')
  const [tone, setTone] = useState(kind === 'education' ? 'lavender' : 'champagne')
  const [manage, setManage] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 340); return () => clearTimeout(t) }, [])

  const usage = useMemo(() => {
    const m = new Map()
    for (const e of state.entries) {
      const cur = m.get(e.categoryId) || { n: 0, total: 0 }
      cur.n++; cur.total += e.amount
      m.set(e.categoryId, cur)
    }
    return m
  }, [state.entries])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return state.categories
      .filter((c) => c.kind === kind || c.kind === 'both')
      .filter((c) => !needle || c.name.toLowerCase().includes(needle))
      .sort((a, b) => (usage.get(b.id)?.n || 0) - (usage.get(a.id)?.n || 0) || a.name.localeCompare(b.name))
  }, [state.categories, kind, q, usage])

  const exact = list.some((c) => c.name.toLowerCase() === q.trim().toLowerCase())
  const canCreate = q.trim().length > 0 && !exact

  const pick = (id) => { onChange(id); close() }
  const create = () => {
    const c = api.addCategory({ name: q.trim(), icon, tone, kind })
    onChange(c.id)
    close()
  }

  const createRow = (
    <button type="button" className="list-row create-row" onClick={() => setCreating(true)}>
      <span
        className="cat-avatar"
        style={{ width: 40, height: 40, borderRadius: 13, color: 'var(--pos)', background: 'rgba(47,211,165,.12)', boxShadow: 'inset 0 0 0 1px rgba(47,211,165,.24)' }}
      >
        <Icon name="plus" size={18} />
      </span>
      <span className="grow" style={{ textAlign: 'left' }}>
        <span className="cat-name" style={{ display: 'block' }}>Create “{q.trim()}”</span>
        <span className="cat-meta">Add it to your {kind} list</span>
      </span>
      <Icon name="right" size={15} style={{ color: 'var(--t-3)', flex: 'none' }} />
    </button>
  )

  if (creating) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <div className="card card-flat row" style={{ gap: 12 }}>
          <CategoryIcon category={{ icon, tone }} size={46} />
          <div className="grow">
            <div style={{ fontWeight: 640, fontSize: 15, letterSpacing: '-.025em' }}>{q.trim()}</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>New {kind} category</div>
          </div>
        </div>

        <div className="field">
          <span className="label">Icon</span>
          <div className="glyph-grid">
            {GLYPH_KEYS.map((g) => (
              <button
                key={g} type="button" className="glyph-cell"
                onClick={() => setIcon(g)}
                aria-label={g}
                style={icon === g ? { color: toneOf(tone), background: `${toneOf(tone)}22`, boxShadow: `inset 0 0 0 1px ${toneOf(tone)}55` } : undefined}
              >
                <Glyph name={g} size={19} />
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">Colour</span>
          <div className="tone-row">
            {TONE_KEYS.map((t) => (
              <button
                key={t} type="button" className="tone-cell" onClick={() => setTone(t)} aria-label={t}
                style={{
                  background: `linear-gradient(150deg, ${TONES[t]}, ${TONES[t]}bb)`,
                  boxShadow: tone === t ? `0 0 0 2px var(--bg), 0 0 0 4px ${TONES[t]}` : 'inset 0 0 0 1px rgba(255,255,255,.14)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="row" style={{ gap: 9 }}>
          <button type="button" className="btn grow" onClick={() => setCreating(false)}>Back</button>
          <button type="button" className="btn btn-primary grow" onClick={create}>
            <Icon name="check" size={17} /> Create & use
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-3)', pointerEvents: 'none' }}>
          <Icon name="search" size={16} />
        </span>
        <input
          ref={inputRef} className="input" style={{ paddingLeft: 41 }} value={q}
          onChange={(e) => setQ(e.target.value)} placeholder="Search categories…" autoComplete="off"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (list.length) pick(list[0].id)
            else if (canCreate) setCreating(true)
          }}
        />
        {q && (
          <button type="button" onClick={() => setQ('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-3)', padding: 9 }}>
            <Icon name="x" size={15} />
          </button>
        )}
      </div>

      <div className="spread" style={{ padding: '0 3px' }}>
        <span className="tiny muted" style={{ fontWeight: 620 }}>
          {list.length} categor{list.length === 1 ? 'y' : 'ies'}
        </span>
        <button type="button" className="tiny" style={{ color: manage ? 'var(--edu)' : 'var(--t-3)', fontWeight: 700, padding: '4px 2px' }} onClick={() => setManage((m) => !m)}>
          {manage ? 'Done' : 'Manage'}
        </button>
      </div>

      <div className="list-card cat-list">
        {canCreate && !list.length && createRow}

        {list.map((c, i) => {
          const u = usage.get(c.id)
          return (
            <div key={c.id} className={'list-row' + (value === c.id ? ' sel' : '')} style={{ animationDelay: `${Math.min(i, 10) * 24}ms`, padding: 0 }}>
              <button
                type="button"
                onClick={() => pick(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textAlign: 'left', padding: '12px 14px' }}
              >
                <CategoryIcon category={c} size={40} />
                <span className="grow">
                  <span className="cat-name" style={{ display: 'block' }}>{c.name}</span>
                  <span className="cat-meta">
                    {u ? `${u.n} entr${u.n === 1 ? 'y' : 'ies'} · ${money(u.total, state.settings.currency)}` : 'Not used yet'}
                  </span>
                </span>
                {value === c.id && !manage && <Icon name="check" size={17} className="cat-check" />}
              </button>
              {manage && (
                c.builtin ? (
                  <span className="tiny muted" style={{ padding: '0 14px 0 0' }}>default</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // never orphan entries — a used category has to be emptied first
                      if (u?.n) return api.notify(`Used by ${u.n} entr${u.n === 1 ? 'y' : 'ies'} — move them first`, 'sparkle')
                      api.deleteCategory(c.id)
                    }}
                    style={{ color: u?.n ? 'var(--t-3)' : 'var(--neg)', padding: '12px 14px' }}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )
              )}
            </div>
          )
        })}

        {canCreate && list.length > 0 && createRow}
      </div>

      {!list.length && !canCreate && (
        <div className="empty" style={{ padding: '26px 10px' }}>
          <p>No categories here yet — type a name to create one.</p>
        </div>
      )}
    </div>
  )
}
