// Thin client over /api. Every call resolves to { ok, data|error }.

async function call(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) return { ok: false, status: res.status, error: body?.error || 'HTTP_' + res.status, message: body?.message }
  return { ok: true, data: body }
}

export const cloud = {
  me: () => call('/api/auth?action=me'),
  signup: (username, password, doc) =>
    call('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'signup', username, password, doc }) }),
  login: (username, password) =>
    call('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'login', username, password }) }),
  logout: () => call('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }),
  changePassword: (password, newPassword) =>
    call('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'password', password, newPassword }) }),
  getDoc: () => call('/api/data'),
  putDoc: (doc) => call('/api/data', { method: 'PUT', body: JSON.stringify({ doc }) }),
}

/** Is a backend wired up at all? `npm run dev` without functions has none. */
export async function probe() {
  try {
    const res = await fetch('/api/auth?action=me', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
    if (res.status === 503) return false      // deployed, but no database bound
    // A static dev server answers /api/* with the SPA shell at 200 — that is
    // not a backend, so insist on an actual JSON reply.
    const type = res.headers.get('content-type') || ''
    if (!type.includes('application/json')) return false
    return res.ok
  } catch {
    return false
  }
}
