// Prepares the e2e database before the API server starts:
// create it if missing, generate the Prisma client, apply migrations, empty the tables, seed test users.
// Run by the API webServer command in playwright.config.ts, or manually:
//   bun e2e/scripts/prepare-db.ts
import { execFileSync } from 'node:child_process'
import { E2E_DATABASE_URL, SERVER_DIR } from '../env'
import { createDatabaseIfMissing, truncateAllTables, assertSafeTestDatabaseUrl } from './db'

// Must be set before server/src/db.ts is imported (the seed does that dynamically below).
process.env.DATABASE_URL = E2E_DATABASE_URL

function runInServer(args: string[]): void {
  execFileSync('bun', ['x', 'prisma', ...args], {
    cwd: SERVER_DIR,
    stdio: 'inherit',
    env: process.env,
  })
}

try {
  assertSafeTestDatabaseUrl(E2E_DATABASE_URL)
  await createDatabaseIfMissing(E2E_DATABASE_URL)
  runInServer(['generate'])
  runInServer(['migrate', 'deploy'])
  await truncateAllTables(E2E_DATABASE_URL)
  const { seedTestData } = await import('./seed-test-data')
  await seedTestData()
  console.log('[e2e] Test database is ready.')
} catch (error) {
  console.error('[e2e] Failed to prepare the test database:', error)
  process.exitCode = 1
}
