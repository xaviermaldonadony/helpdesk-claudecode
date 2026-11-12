// Database helpers shared by the e2e start (prepare-db.ts) and teardown (global-teardown.ts).
// Every helper goes through assertSafeTestDatabaseUrl, so nothing can touch the dev database.
import { Client } from 'pg'

const DEV_DATABASE_NAME = 'helpdesk'
const SAFE_NAME = /^[a-z0-9_]+$/i

export function assertSafeTestDatabaseUrl(url: string): string {
  const name = new URL(url).pathname.replace(/^\//, '')
  if (!SAFE_NAME.test(name)) {
    throw new Error(`Invalid database name "${name}" in E2E_DATABASE_URL.`)
  }
  if (name === DEV_DATABASE_NAME || !name.endsWith('_test')) {
    throw new Error(
      `Refusing to run e2e against database "${name}". The name must end in "_test" and must not be "${DEV_DATABASE_NAME}".`,
    )
  }
  return name
}

function withDatabase(url: string, database: string): string {
  const next = new URL(url)
  next.pathname = `/${database}`
  return next.toString()
}

export async function createDatabaseIfMissing(url: string): Promise<void> {
  const name = assertSafeTestDatabaseUrl(url)
  const client = new Client({ connectionString: withDatabase(url, 'postgres') })
  await client.connect()
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (existing.rowCount === 0) {
      // Identifiers can't be parameterized. The name was validated above.
      await client.query(`CREATE DATABASE "${name}"`)
      console.log(`[e2e] Created database ${name}.`)
    }
  } finally {
    await client.end()
  }
}

// Empties every application table and keeps the schema. _prisma_migrations is left alone.
export async function truncateAllTables(url: string): Promise<void> {
  assertSafeTestDatabaseUrl(url)
  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    const result = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
    )
    if (result.rows.length === 0) return
    const tables = result.rows.map((row) => `"${row.tablename}"`).join(', ')
    await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`)
  } finally {
    await client.end()
  }
}
