import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHmac } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(_scrypt)
const COOKIE = 'ledger_session'
const MAX_AGE = 60 * 60 * 24 * 180 // 180 days

/** AUTH_SECRET is set at deploy time; the fallback only keeps local dev running. */
const SECRET = process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me'

export const uid = () => randomBytes(12).toString('hex')

// ---- passwords -----------------------------------------------------------

export async function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex')
  const key = await scrypt(pw, salt, 64)
  return `scrypt$${salt}$${key.toString('hex')}`
}

export async function verifyPassword(pw, stored) {
  try {
    const [scheme, salt, hex] = String(stored).split('$')
    if (scheme !== 'scrypt' || !salt || !hex) return false
    const key = await scrypt(pw, salt, 64)
    const expected = Buffer.from(hex, 'hex')
    return key.length === expected.length && timingSafeEqual(key, expected)
  } catch {
    return false
  }
}

// ---- sessions (signed cookie, no server-side session store needed) --------

const sign = (v) => createHmac('sha256', SECRET).update(v).digest('base64url')

export function makeToken(userId) {
  const body = `${userId}.${Date.now()}`
  return `${body}.${sign(body)}`
}

export function readToken(token) {
  if (!token) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const body = token.slice(0, i)
  const sig = token.slice(i + 1)
  const expect = sign(body)
  if (sig.length !== expect.length) return null
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null
  const [userId, issued] = body.split('.')
  if (!userId || !issued) return null
  if (Date.now() - Number(issued) > MAX_AGE * 1000) return null
  return userId
}

export function setSessionCookie(res, token) {
  const secure = process.env.VERCEL ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`
  )
}

export function clearSessionCookie(res) {
  const secure = process.env.VERCEL ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`)
}

export function currentUser(req) {
  const raw = req.headers.cookie || ''
  const hit = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`))
  return hit ? readToken(hit.slice(COOKIE.length + 1)) : null
}

// ---- shared helpers ------------------------------------------------------

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  if (!chunks.length) return {}
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return {} }
}
