import { query, hasDb } from './_db.js'
import { currentUser, json, readBody } from './_auth.js'

/** The whole ledger travels as one JSON document — it is small and always read together. */
export default async function handler(req, res) {
  if (!hasDb()) return json(res, 503, { error: 'NO_DATABASE' })

  const userId = currentUser(req)
  if (!userId) return json(res, 401, { error: 'UNAUTHENTICATED' })

  try {
    if (req.method === 'GET') {
      const { rows } = await query('SELECT doc, updated_at FROM ledger_docs WHERE user_id = $1', [userId])
      return json(res, 200, { doc: rows[0]?.doc || null, updatedAt: rows[0]?.updated_at || null })
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req)
      if (!body || typeof body.doc !== 'object' || body.doc === null) {
        return json(res, 400, { error: 'BAD_DOC' })
      }
      const { rows } = await query(
        `INSERT INTO ledger_docs (user_id, doc, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (user_id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()
         RETURNING updated_at`,
        [userId, JSON.stringify(body.doc)]
      )
      return json(res, 200, { ok: true, updatedAt: rows[0].updated_at })
    }

    res.setHeader('Allow', 'GET, PUT')
    return json(res, 405, { error: 'METHOD_NOT_ALLOWED' })
  } catch (e) {
    console.error('data error', e)
    return json(res, 500, { error: 'SERVER_ERROR' })
  }
}
