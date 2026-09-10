import { useEffect, useState } from 'react'
import { useApp } from './store.jsx'
import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'
import SectionView from './components/SectionView.jsx'
import StatsView from './components/StatsView.jsx'
import Settings from './components/Settings.jsx'
import EntrySheet from './components/EntrySheet.jsx'
import RepaySheet from './components/RepaySheet.jsx'
import Icon from './components/Icons.jsx'
import { useViewport } from './lib/useViewport.js'

const TABS = [
  { k: 'home', label: 'Home', icon: 'home' },
  { k: 'education', label: 'Education', icon: 'edu' },
  { k: 'casual', label: 'Casual', icon: 'casual' },
  { k: 'stats', label: 'Stats', icon: 'chart' },
]

const TITLES = {
  home: ['Overview', 'Everything at a glance'],
  education: ['Education', 'Money you do not expect back'],
  casual: ['Casual', 'Money he returns to you'],
  stats: ['Statistics', 'Trends, months and years'],
  settings: ['Settings', 'Profile, security and data'],
}

export default function App() {
  const { state, authed, toast } = useApp()
  const { keyboard } = useViewport()
  const [tab, setTab] = useState('home')
  const [entrySheet, setEntrySheet] = useState(null) // { entry } | { kind }
  const [repaySheet, setRepaySheet] = useState(null) // { entryId } | true

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [tab])

  if (!authed) return <Login />

  const [title, sub] = TITLES[tab]
  const navIdx = TABS.findIndex((t) => t.k === tab)
  const fabKind = tab === 'casual' ? 'casual' : 'education'

  return (
    <>
      <div className="app">
        <header className="hdr">
          <div className="hdr-mark">{state.settings.initial || 'B'}</div>
          <div>
            <div className="hdr-eyebrow">{sub}</div>
            <div className="hdr-title">{title}</div>
          </div>
          <div className="hdr-actions">
            {tab !== 'settings' ? (
              <button className="icon-btn" onClick={() => setTab('settings')} aria-label="Settings">
                <Icon name="gear" size={18} />
              </button>
            ) : (
              <button className="icon-btn" onClick={() => setTab('home')} aria-label="Close settings">
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        </header>

        <main key={tab}>
          {tab === 'home' && (
            <Dashboard
              go={setTab}
              onEdit={(e) => setEntrySheet({ entry: e })}
              onAdd={(k) => setEntrySheet({ kind: k })}
              onRepay={() => setRepaySheet(true)}
            />
          )}
          {(tab === 'education' || tab === 'casual') && (
            <SectionView
              key={tab}
              kind={tab}
              onEdit={(e) => setEntrySheet({ entry: e })}
              onAdd={(k) => setEntrySheet({ kind: k })}
              onRepay={() => setRepaySheet(true)}
            />
          )}
          {tab === 'stats' && <StatsView />}
          {tab === 'settings' && <Settings />}
        </main>
      </div>

      {tab !== 'settings' && !keyboard && (
        <button
          className={'fab' + (fabKind === 'casual' ? ' warm' : '')}
          onClick={() => setEntrySheet({ kind: fabKind })}
          aria-label="Add entry"
        >
          <Icon name="plus" size={24} weight="bold" />
        </button>
      )}

      <nav className={'nav-wrap' + (keyboard ? ' hidden-kb' : '')}>
        <div className="nav">
          <div className="nav-thumb" style={{
            width: 56,
            transform: `translateX(${Math.max(navIdx, 0) * 56}px)`,
            opacity: navIdx < 0 ? 0 : 1,
          }} />
          {TABS.map((t) => (
            <button
              key={t.k}
              className={'nav-btn' + (tab === t.k ? ' on' : '')}
              onClick={() => setTab(t.k)}
              aria-label={t.label}
              title={t.label}
            >
              <Icon name={t.icon} size={22} weight={tab === t.k ? 'duotone' : 'regular'} />
            </button>
          ))}
        </div>
      </nav>

      {entrySheet && (
        <EntrySheet
          entry={entrySheet.entry}
          initialKind={entrySheet.kind || 'education'}
          onClose={() => setEntrySheet(null)}
        />
      )}
      {repaySheet && (
        <RepaySheet
          presetEntryId={typeof repaySheet === 'object' ? repaySheet.entryId : null}
          onClose={() => setRepaySheet(null)}
        />
      )}

      {toast && (
        <div className="toast" key={toast.id}>
          <Icon name={toast.icon} size={17} weight="duotone" /> {toast.msg}
        </div>
      )}
    </>
  )
}
