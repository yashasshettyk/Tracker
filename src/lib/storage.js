// ---- persistence (localStorage) ----------------------------------------
// Front-end only. Everything lives on this device, in this browser.

const KEY = 'ledger.state.v1'
const SESSION = 'ledger.session.v1'

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

/** Not real security — a deterrent so the data isn't readable at a glance. */
export function hashPin(str, salt) {
  let h1 = 0x811c9dc5
  let h2 = 0x1000193
  const s = salt + '|' + str + '|ledger'
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0
    h2 = Math.imul(h2 + c, 2654435761) >>> 0
  }
  return (h1 >>> 0).toString(36) + '-' + (h2 >>> 0).toString(36)
}

export const DEFAULT_CATEGORIES = [
  // education
  { id: 'c_tuition', name: 'Tuition / College Fee', icon: 'institution', tone: 'lavender', kind: 'education', builtin: true },
  { id: 'c_books', name: 'Books & Stationery', icon: 'book', tone: 'periwinkle', kind: 'education', builtin: true },
  { id: 'c_exam', name: 'Exam Fees', icon: 'exam', tone: 'azure', kind: 'education', builtin: true },
  { id: 'c_hostel', name: 'Hostel & Rent', icon: 'home', tone: 'sky', kind: 'education', builtin: true },
  { id: 'c_travel', name: 'Travel', icon: 'bus', tone: 'aqua', kind: 'education', builtin: true },
  { id: 'c_laptop', name: 'Laptop & Devices', icon: 'laptop', tone: 'orchid', kind: 'education', builtin: true },
  { id: 'c_course', name: 'Online Course', icon: 'course', tone: 'lavender', kind: 'education', builtin: true },
  { id: 'c_coaching', name: 'Coaching / Tutor', icon: 'teach', tone: 'periwinkle', kind: 'education', builtin: true },
  { id: 'c_project', name: 'Project & Lab', icon: 'flask', tone: 'mint', kind: 'education', builtin: true },
  { id: 'c_uniform', name: 'Uniform & Kit', icon: 'shirt', tone: 'azure', kind: 'education', builtin: true },
  { id: 'c_mess', name: 'Mess / Food', icon: 'food', tone: 'sage', kind: 'education', builtin: true },
  { id: 'c_internet', name: 'Internet & Mobile', icon: 'wifi', tone: 'sky', kind: 'education', builtin: true },
  { id: 'c_edu_other', name: 'Other (Education)', icon: 'backpack', tone: 'pewter', kind: 'education', builtin: true },
  // casual / returnable
  { id: 'c_cash', name: 'Cash Loan', icon: 'cash', tone: 'champagne', kind: 'casual', builtin: true },
  { id: 'c_emergency', name: 'Emergency', icon: 'siren', tone: 'clay', kind: 'casual', builtin: true },
  { id: 'c_shopping', name: 'Shopping', icon: 'bag', tone: 'rose', kind: 'casual', builtin: true },
  { id: 'c_food', name: 'Food & Outing', icon: 'cup', tone: 'amber', kind: 'casual', builtin: true },
  { id: 'c_bike', name: 'Bike / Fuel', icon: 'fuel', tone: 'champagne', kind: 'casual', builtin: true },
  { id: 'c_phone', name: 'Phone / Gadget', icon: 'phone', tone: 'orchid', kind: 'casual', builtin: true },
  { id: 'c_medical', name: 'Medical', icon: 'medical', tone: 'clay', kind: 'casual', builtin: true },
  { id: 'c_bills', name: 'Bills & Recharge', icon: 'receipt', tone: 'pewter', kind: 'casual', builtin: true },
  { id: 'c_gift', name: 'Event / Gift', icon: 'gift', tone: 'rose', kind: 'casual', builtin: true },
  { id: 'c_friends', name: 'Friends / Party', icon: 'users', tone: 'amber', kind: 'casual', builtin: true },
  { id: 'c_cas_other', name: 'Other (Casual)', icon: 'sparkle', tone: 'pewter', kind: 'casual', builtin: true },
]

export const emptyState = () => ({
  version: 1,
  auth: null, // { user, salt, hash }
  settings: { currency: 'INR', personName: 'Brother', initial: 'B' },
  categories: DEFAULT_CATEGORIES,
  entries: [],
  repayments: [],
})

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    const base = emptyState()
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      categories: parsed.categories?.length ? parsed.categories : base.categories,
      entries: parsed.entries || [],
      repayments: parsed.repayments || [],
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Could not save', e)
  }
}

// ---- per-account offline cache (cloud mode) ----
const cacheKey = (userId) => `ledger.cache.${userId}`

export function loadCache(userId) {
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    if (!raw) return null
    const doc = JSON.parse(raw)
    const base = emptyState()
    return {
      ...base,
      ...doc,
      settings: { ...base.settings, ...(doc.settings || {}) },
      categories: doc.categories?.length ? doc.categories : base.categories,
      entries: doc.entries || [],
      repayments: doc.repayments || [],
    }
  } catch { return null }
}

export function saveCache(userId, doc) {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(doc)) } catch {}
}

export function clearCache(userId) {
  try { localStorage.removeItem(cacheKey(userId)) } catch {}
}

export const getSession = () => {
  try { return localStorage.getItem(SESSION) === '1' } catch { return false }
}
export const setSession = (on) => {
  try { on ? localStorage.setItem(SESSION, '1') : localStorage.removeItem(SESSION) } catch {}
}
