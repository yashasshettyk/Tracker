# Ledger — Brother Tracker

A mobile-first ledger for money you give your brother, split into **Education**
(a gift — nothing comes back) and **Casual** (a loan he returns). Accounts sync
across devices, so signing in on a new phone loads the same ledger.

**Live:** https://bhailedger.vercel.app

## Run locally

```bash
npm install
npm run dev
```

With no backend reachable, the app falls back to **local mode**: one account in
this browser, data in `localStorage`. To run the API and database locally:

```bash
npx vercel dev      # serves /api and injects POSTGRES_URL + AUTH_SECRET
```

## How sync works

- `POST /api/auth` — `signup` / `login` / `logout` / `password`
- `GET|PUT /api/data` — read and write the signed-in user's ledger

Passwords are hashed with **scrypt** (random per-user salt, timing-safe compare).
Sessions are an HMAC-signed, `HttpOnly`, `SameSite=Lax` cookie — no session table.
`/api/data` refuses anything without a valid session, so the ledger is not
readable just by knowing the URL.

The whole ledger travels as one JSON document — it is small and always read
together. Writes are optimistic: local state updates immediately, then a
debounced `PUT` follows, with a per-account `localStorage` cache so the app opens
instantly and keeps working offline.

Tables are namespaced (`ledger_users`, `ledger_docs`) because the Neon instance
is shared with another project.

## Environment

| Variable | Set by |
|---|---|
| `POSTGRES_URL` | added automatically when the Postgres/Neon store is attached |
| `AUTH_SECRET` | random string; signs session cookies |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

The schema is created on first request, so a fresh database needs no migration step.

## What it does

**Education** — fees, books, hostel, laptop, travel. Counted as given, never owed.

**Casual** — money he returns. Each loan tracks part payments and shows
*Due / Part paid / Settled*. Record a repayment against one loan, or let
*Oldest loans first* split an amount across open loans (it previews the split
before saving).

**Categories** — 24 built-ins with a searchable picker. Type a name that does not
exist, pick an icon and colour, and it is created and selected in one step.
Categories in use cannot be deleted, so entries are never orphaned.

**Stats** — animated bar chart (6M / 12M / yearly, filterable by section),
outstanding-balance and cumulative-given trend lines, a category donut, insight
tiles and a year-by-year summary.

## Design

Near-black ground, brushed-metal cards carrying guilloché engraving, an EMV chip
and a holographic sheen, with scroll parallax and pointer tilt. Icons are
Phosphor throughout — no emoji, so One UI and iOS render identically. Charts are
hand-rolled SVG. Tuned for 390px (iPhone 13) and 412px (Galaxy A17); the bottom
dock tracks the *visual* viewport so the software keyboard never covers it.

## Layout

```
api/
  _db.js         pool, schema migration
  _auth.js       scrypt hashing, signed session cookies
  auth.js        signup / login / logout / password
  data.js        read + write the ledger document
src/
  store.jsx      state, actions, cloud sync, offline cache
  lib/           formatting, stats, cloud client, motion + viewport hooks
  components/    views, sheets, card art, charts
  styles/        design tokens
```

No UI or chart libraries beyond the icon set.
