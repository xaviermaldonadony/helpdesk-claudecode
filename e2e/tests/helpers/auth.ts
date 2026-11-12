// Shared helpers for the auth specs. Not a spec file (Playwright only runs *.spec.ts).
import { expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'
import { API_URL, CLIENT_URL, TEST_USERS } from '../../env'

export type TestUser = (typeof TEST_USERS)[keyof typeof TEST_USERS]

// Better Auth's default session cookie name. Over plain http it has no __Secure- prefix.
export const SESSION_COOKIE = 'better-auth.session_token'

// The browser reaches the API through the Vite proxy, so requests carry this Origin.
// It is the only entry in TRUSTED_ORIGINS for the e2e server.
export const BROWSER_ORIGIN = CLIENT_URL

// Error text the server returns for both a wrong password and an unknown email.
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password'

// Signs in through the real login form and waits until the home page is shown.
export async function signInThroughUi(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
}

// Calls the Better Auth sign-in endpoint directly, the same way the browser does (with an Origin header).
export function signInViaApi(
  api: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<APIResponse> {
  return api.post(`${API_URL}/api/auth/sign-in/email`, {
    headers: { Origin: BROWSER_ORIGIN },
    data: credentials,
  })
}

// Returns the session cookie value that a response sets, or undefined if it sets none.
export function sessionCookieFrom(response: APIResponse): string | undefined {
  for (const header of response.headersArray()) {
    if (header.name.toLowerCase() !== 'set-cookie') continue
    const match = new RegExp(`^${SESSION_COOKIE}=([^;]+)`).exec(header.value)
    if (match?.[1]) return match[1]
  }
  return undefined
}

// Like sessionCookieFrom, but fails the test with a clear message when no cookie was set.
export function requireSessionCookie(response: APIResponse): string {
  const cookie = sessionCookieFrom(response)
  if (!cookie) throw new Error(`Expected a session cookie, got status ${response.status()}`)
  return cookie
}

// The session token is the part of the signed cookie value before the "." signature separator.
export function sessionTokenFromCookie(cookieValue: string): string {
  return decodeURIComponent(cookieValue).split('.')[0] ?? ''
}

export function cookieHeader(cookieValue: string): string {
  return `${SESSION_COOKIE}=${cookieValue}`
}
