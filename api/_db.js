import pg from 'pg'

const { Pool } = pg

// Vercel Postgres / Neon / Supabase all expose one of these.
const CONN =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING

let pool
let ready

export function hasDb() {
  return Boolean(CONN)
}

export function db() {
  if (!CONN) throw new Error('NO_DATABASE')
  if (!pool) {
    pool = new Pool({
      connectionString: CONN,
      ssl: CONN.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  return pool
}

/** create the schema on first touch — keeps deploys to a single step */
export async function migrate() {
  if (!ready) {
    ready = db()
      .query(`
        CREATE TABLE IF NOT EXISTS ledger_users (
          id          TEXT PRIMARY KEY,
          username    TEXT UNIQUE NOT NULL,
          pw_hash     TEXT NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS ledger_docs (
          user_id     TEXT PRIMARY KEY REFERENCES ledger_users(id) ON DELETE CASCADE,
          doc         JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS ledger_users_username_lower ON ledger_users (lower(username));
      `)
      .catch((e) => {
        ready = null
        throw e
      })
  }
  return ready
}

export async function query(text, params) {
  await migrate()
  return db().query(text, params)
}
