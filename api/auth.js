import { query, hasDb } from './_db.js'
import {
  uid, hashPassword, verifyPassword, makeToken, setSessionCookie,
  clearSessionCookie, currentUser, json, readBody,
} from './_auth.js'

const USER_RE = /^[a-zA-Z0-9._-]{3,32}$/

export default async function handler(req, res) {
  if (!hasDb()) return json(res, 503, { error: 'NO_DATABASE', message: 'No database is configured for this deployment.' })

  const body = await readBody(req)
  const action = (req.query?.action || body.action || '').toString()

  try {
    // ---- who am I? --------------------------------------------------------
    if (action === 'me') {
      const id = currentUser(req)
      if (!id) return json(res, 200, { user: null })
      const { rows } = await query('SELECT id, username FROM ledger_users WHERE id = $1', [id])
      return json(res, 200, { user: rows[0] || null })
    }

    if (action === 'logout') {
      clearSessionCookie(res)
      return json(res, 200, { ok: true })
    }

    const username = String(body.username || '').trim()
    const password = String(body.password || '')

    // ---- create an account ------------------------------------------------
    if (action === 'signup') {
      if (!USER_RE.test(username)) {
        return json(res, 400, { error: 'BAD_USERNAME', message: '3–32 characters: letters, numbers, . _ -' })
      }
      if (password.length < 6) {
        return json(res, 400, { error: 'BAD_PASSWORD', message: 'Password must be at least 6 characters.' })
      }
      const taken = await query('SELECT 1 FROM ledger_users WHERE lower(username) = lower($1)', [username])
      if (taken.rowCount) return json(res, 409, { error: 'TAKEN', message: 'That username is already taken.' })

      const id = uid()
      await query('INSERT INTO ledger_users (id, username, pw_hash) VALUES ($1, $2, $3)', [
        id, username, await hashPassword(password),
      ])
      await query('INSERT INTO ledger_docs (user_id, doc) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        id, JSON.stringify(body.doc || {}),
      ])
      setSessionCookie(res, makeToken(id))
      return json(res, 200, { user: { id, username } })
    }

    // ---- sign in ----------------------------------------------------------
    if (action === 'login') {
      const { rows } = await query(
        'SELECT id, username, pw_hash FROM ledger_users WHERE lower(username) = lower($1)',
        [username]
      )
      const user = rows[0]
      // same response either way — never reveal which half was wrong
      const ok = user && (await verifyPassword(password, user.pw_hash))
      if (!ok) return json(res, 401, { error: 'BAD_CREDENTIALS', message: 'Wrong username or password.' })

      setSessionCookie(res, makeToken(user.id))
      return json(res, 200, { user: { id: user.id, username: user.username } })
    }

    // ---- change password --------------------------------------------------
    if (action === 'password') {
      const id = currentUser(req)
      if (!id) return json(res, 401, { error: 'UNAUTHENTICATED' })
      const next = String(body.newPassword || '')
      if (next.length < 6) return json(res, 400, { error: 'BAD_PASSWORD', message: 'Password must be at least 6 characters.' })

      const { rows } = await query('SELECT pw_hash FROM ledger_users WHERE id = $1', [id])
      if (!rows[0] || !(await verifyPassword(password, rows[0].pw_hash))) {
        return json(res, 401, { error: 'BAD_CREDENTIALS', message: 'Current password is wrong.' })
      }
      await query('UPDATE ledger_users SET pw_hash = $1 WHERE id = $2', [await hashPassword(next), id])
      return json(res, 200, { ok: true })
    }

    return json(res, 400, { error: 'UNKNOWN_ACTION' })
  } catch (e) {
    console.error('auth error', e)
    return json(res, 500, { error: 'SERVER_ERROR', message: 'Something went wrong. Try again.' })
  }
}
