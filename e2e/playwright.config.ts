import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import {
  API_PORT,
  API_URL,
  CLIENT_DIR,
  CLIENT_PORT,
  CLIENT_URL,
  E2E_AUTH_SECRET,
  E2E_DATABASE_URL,
  SERVER_DIR,
} from './env'

const e2eDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  testDir: './tests',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }]],
  globalTeardown: fileURLToPath(new URL('./global-teardown.ts', import.meta.url)),
  use: {
    baseURL: CLIENT_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Both servers start from scratch on the test database. reuseExistingServer is off,
  // so a dev server already on 3000/5173 is never used by mistake.
  webServer: [
    {
      name: 'API',
      cwd: SERVER_DIR,
      command: `bun ${e2eDir}scripts/prepare-db.ts && bun src/index.ts`,
      url: `${API_URL}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        DATABASE_URL: E2E_DATABASE_URL,
        PORT: String(API_PORT),
        BETTER_AUTH_SECRET: E2E_AUTH_SECRET,
        BETTER_AUTH_URL: API_URL,
        TRUSTED_ORIGINS: CLIENT_URL,
        // Auth rate limiting is on only in production, so tests run without it.
        NODE_ENV: 'test',
      },
    },
    {
      name: 'Client',
      cwd: CLIENT_DIR,
      command: 'bun run dev',
      url: CLIENT_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_DEV_PORT: String(CLIENT_PORT),
        API_PROXY_TARGET: API_URL,
      },
    },
  ],
})
