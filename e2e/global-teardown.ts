// Runs after the test run. Empties the e2e tables but keeps the database and schema.
// The servers are still running at this point (Playwright stops top-level webServers after teardown).
import { E2E_DATABASE_URL } from './env'
import { truncateAllTables } from './scripts/db'

export default async function globalTeardown(): Promise<void> {
  await truncateAllTables(E2E_DATABASE_URL)
}
