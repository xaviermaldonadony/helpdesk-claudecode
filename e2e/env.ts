// Shared settings for the Playwright e2e run. Everything here is test-only.
// The test database must never be the development database (`helpdesk`).
import { fileURLToPath } from 'node:url'

export const E2E_DIR = fileURLToPath(new URL('.', import.meta.url))
export const SERVER_DIR = fileURLToPath(new URL('../server', import.meta.url))
export const CLIENT_DIR = fileURLToPath(new URL('../client', import.meta.url))

// Separate ports so the e2e stack never collides with `bun run dev` (3000 / 5173).
export const API_PORT = 3100
export const CLIENT_PORT = 5174

export const API_URL = `http://localhost:${API_PORT}`
export const CLIENT_URL = `http://localhost:${CLIENT_PORT}`

// Override with E2E_DATABASE_URL. The default uses the current OS user, like server/.env.example.
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  `postgresql://${process.env.USER ?? 'postgres'}@localhost:5432/helpdesk_test`

// Fixed secret for the test server only. Not used anywhere else.
export const E2E_AUTH_SECRET = 'e2e-only-secret-do-not-use-in-any-environment-0123456789'

// Users created by e2e/scripts/seed-test-data.ts after every database reset.
export const TEST_USERS = {
  admin: {
    name: 'E2E Admin',
    email: 'admin@e2e.test',
    password: 'e2e-admin-password',
  },
  agent: {
    name: 'E2E Agent',
    email: 'agent@e2e.test',
    password: 'e2e-agent-password',
  },
} as const
