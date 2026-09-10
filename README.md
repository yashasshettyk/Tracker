# Ledger — Brother Tracker

A mobile-first, offline personal ledger for tracking money you give your brother, split into
two sections: **Education** (a gift — nothing comes back) and **Casual** (a loan — he returns it).

## Run it

```bash
npm install
npm run dev
```

Open the printed **Network** URL on your phone (same Wi-Fi) to use it as a phone app.
On iOS/Android use *Add to Home Screen* — it opens full-screen with safe-area padding.

```bash
npm run build && npm run preview   # production build
```

## First run

You set your own **username + password**, then who you are tracking and your currency.
The lock is a plain front-end gate (a hashed check in `localStorage`) — it keeps the app
closed to a casual glance, it is not encryption. Everything is stored in this browser only.

## What it does

**Two sections**
- **Education** — fees, books, hostel, laptop, travel… counted as given, never owed.
- **Casual** — money he has to return. Each loan tracks part payments and shows
  *Due / Part paid / Settled*.

**Categories** — 24 built-ins across both sections, with a searchable picker. Type a name
that does not exist (e.g. *"Engineering Workshop Fee"*), pick an icon, and it is created and
selected in one step. Categories in use cannot be deleted, so entries are never orphaned.

**Repayments** — record what he pays back against one specific loan, or let
*Oldest loans first* split the amount automatically across open loans (it previews the split
before you save). "Settle all" clears everything at once.

**Stats** — animated bar chart (6M / 12M / yearly, filterable by section), outstanding-balance
and cumulative-given trend lines, a category donut, insight tiles (monthly average, biggest
month, largest single entry, average per entry) and a year-by-year summary.

**Data** — Settings → *Backup* downloads a JSON file, *Restore* reads one back.

## Layout

```
src/
  main.jsx, App.jsx          shell, tab nav, sheets, toasts
  store.jsx                  state + every action, persisted to localStorage
  lib/
    format.js                money/date formatting (₹ and 6 other currencies)
    storage.js               persistence, seed categories, password hash
    stats.js                 totals, monthly/yearly series, trends, FIFO allocation
    useAnim.js               rAF progress driver for charts
  components/
    Login.jsx                first-run setup + sign in
    Dashboard.jsx            overview
    SectionView.jsx          education / casual lists, search + filters
    StatsView.jsx            charts and insights
    Settings.jsx             profile, password, backup/restore
    EntrySheet.jsx           add / edit an entry
    RepaySheet.jsx           record money returned
    CategoryPicker.jsx       searchable dropdown + create-new
    charts/                  BarChart, AreaChart, DonutChart (hand-rolled SVG)
  styles/global.css          design tokens and every component style
```

No UI or chart libraries — React only, ~68 kB gzipped.
