import { expect, test } from '@playwright/test'
import { API_URL, TEST_USERS } from '../env'
import {
  BROWSER_ORIGIN,
  INVALID_CREDENTIALS_MESSAGE,
  cookieHeader,
  requireSessionCookie,
  sessionCookieFrom,
  sessionTokenFromCookie,
  signInViaApi,
} from './helpers/auth'

// Anonymous calls use the `request` fixture. Signed-in calls send an explicit Cookie header.
// Sign-in uses its own API context, so its cookies never reach the anonymous calls.
test.describe('Auth API', () => {
  test('GET /api/health returns 200 without a session', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`)

    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ok' })
  })

  test('GET /api/me without a session returns 401', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/me`)

    expect(response.status()).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  test('GET /api/me with a forged session cookie returns 401', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/me`, {
      headers: { Cookie: cookieHeader('forged-token.forged-signature') },
    })

    expect(response.status()).toBe(401)
  })

  test('GET /api/me with a valid session cookie returns the user and no session token', async ({
    request,
    playwright,
  }) => {
    const signer = await playwright.request.newContext()
    try {
      const signIn = await signInViaApi(signer, {
        email: TEST_USERS.admin.email,
        password: TEST_USERS.admin.password,
      })
      expect(signIn.status()).toBe(200)
      const cookie = requireSessionCookie(signIn)
      const token = sessionTokenFromCookie(cookie)

      const response = await request.get(`${API_URL}/api/me`, {
        headers: { Cookie: cookieHeader(cookie) },
      })

      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.user).toMatchObject({
        email: TEST_USERS.admin.email,
        name: TEST_USERS.admin.name,
        role: 'admin',
      })
      expect(body).not.toHaveProperty('session')
      expect(JSON.stringify(body)).not.toContain(token)
    } finally {
      await signer.dispose()
    }
  })

  test('sign-in with valid credentials sets a session cookie and no token in the body', async ({
    playwright,
  }) => {
    const signer = await playwright.request.newContext()
    try {
      const response = await signInViaApi(signer, {
        email: TEST_USERS.agent.email,
        password: TEST_USERS.agent.password,
      })

      expect(response.status()).toBe(200)
      const cookie = requireSessionCookie(response)
      const body = await response.json()
      expect(body).not.toHaveProperty('token')
      expect(body).not.toHaveProperty('session')
      expect(JSON.stringify(body)).not.toContain(sessionTokenFromCookie(cookie))
    } finally {
      await signer.dispose()
    }
  })

  test('get-session returns the user and does not expose the session token', async ({
    playwright,
  }) => {
    const signer = await playwright.request.newContext()
    try {
      const signIn = await signInViaApi(signer, {
        email: TEST_USERS.agent.email,
        password: TEST_USERS.agent.password,
      })
      const cookie = requireSessionCookie(signIn)
      const token = sessionTokenFromCookie(cookie)

      const response = await signer.get(`${API_URL}/api/auth/get-session`, {
        headers: { Cookie: cookieHeader(cookie), Origin: BROWSER_ORIGIN },
      })

      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.user).toMatchObject({ email: TEST_USERS.agent.email, role: 'agent' })
      expect(body.session).toBeDefined()
      expect(body.session).not.toHaveProperty('token')
      expect(JSON.stringify(body)).not.toContain(token)
    } finally {
      await signer.dispose()
    }
  })

  test('sign-in with a wrong password returns an error and sets no session cookie', async ({
    playwright,
  }) => {
    const signer = await playwright.request.newContext()
    try {
      const response = await signInViaApi(signer, {
        email: TEST_USERS.admin.email,
        password: 'definitely-the-wrong-password',
      })

      expect(response.status()).toBe(401)
      expect(await response.json()).toMatchObject({ message: INVALID_CREDENTIALS_MESSAGE })
      expect(sessionCookieFrom(response)).toBeUndefined()
    } finally {
      await signer.dispose()
    }
  })

  test('sign-in with an unknown email returns the same error as a wrong password', async ({
    playwright,
  }) => {
    const signer = await playwright.request.newContext()
    try {
      const wrongPassword = await signInViaApi(signer, {
        email: TEST_USERS.admin.email,
        password: 'definitely-the-wrong-password',
      })
      const unknownEmail = await signInViaApi(signer, {
        email: 'nobody-here@e2e.test',
        password: 'definitely-the-wrong-password',
      })

      expect(unknownEmail.status()).toBe(wrongPassword.status())
      expect(await unknownEmail.json()).toEqual(await wrongPassword.json())
      expect(sessionCookieFrom(unknownEmail)).toBeUndefined()
    } finally {
      await signer.dispose()
    }
  })

  test('sign-up is rejected and creates no account', async ({ playwright }) => {
    const signer = await playwright.request.newContext()
    const email = 'signup-attempt@e2e.test'
    const password = 'a-long-enough-password-123'
    try {
      const response = await signer.post(`${API_URL}/api/auth/sign-up/email`, {
        headers: { Origin: BROWSER_ORIGIN },
        data: { name: 'Sign Up Attempt', email, password },
      })

      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      expect(sessionCookieFrom(response)).toBeUndefined()

      // The account must not exist: signing in with the same credentials fails.
      const signIn = await signInViaApi(signer, { email, password })
      expect(signIn.status()).toBe(401)
    } finally {
      await signer.dispose()
    }
  })

  test('a client cannot change its own role through update-user', async ({ playwright }) => {
    const signer = await playwright.request.newContext()
    try {
      const signIn = await signInViaApi(signer, {
        email: TEST_USERS.agent.email,
        password: TEST_USERS.agent.password,
      })
      const cookie = requireSessionCookie(signIn)

      // Keep the name unchanged so the seeded agent is left as it was.
      await signer.post(`${API_URL}/api/auth/update-user`, {
        headers: { Cookie: cookieHeader(cookie), Origin: BROWSER_ORIGIN },
        data: { name: TEST_USERS.agent.name, role: 'admin' },
      })

      const me = await signer.get(`${API_URL}/api/me`, {
        headers: { Cookie: cookieHeader(cookie) },
      })
      expect(me.status()).toBe(200)
      expect((await me.json()).user).toMatchObject({ email: TEST_USERS.agent.email, role: 'agent' })
    } finally {
      await signer.dispose()
    }
  })

  test('sign-in from an untrusted Origin is rejected and sets no session cookie', async ({
    playwright,
  }) => {
    // Better Auth turns off origin validation when NODE_ENV is "test" (create-context.mjs:
    // skipOriginCheck = isTest()). playwright.config.ts sets NODE_ENV=test for the API, so this
    // request is accepted here. Enable this test once the e2e API runs with another NODE_ENV.
    test.skip(true, 'Origin validation is disabled under NODE_ENV=test in the e2e API server')

    const signer = await playwright.request.newContext()
    try {
      const response = await signer.post(`${API_URL}/api/auth/sign-in/email`, {
        headers: { Origin: 'https://evil.example' },
        data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
      })

      expect(response.status()).toBe(403)
      expect(sessionCookieFrom(response)).toBeUndefined()
    } finally {
      await signer.dispose()
    }
  })

  test('sign-out revokes the session on the server, so the old cookie stops working', async ({
    playwright,
    request,
  }) => {
    const signer = await playwright.request.newContext()
    try {
      const signIn = await signInViaApi(signer, {
        email: TEST_USERS.admin.email,
        password: TEST_USERS.admin.password,
      })
      const cookie = requireSessionCookie(signIn)

      const signOut = await signer.post(`${API_URL}/api/auth/sign-out`, {
        headers: { Cookie: cookieHeader(cookie), Origin: BROWSER_ORIGIN },
        data: {},
      })
      expect(signOut.status()).toBe(200)

      const response = await request.get(`${API_URL}/api/me`, {
        headers: { Cookie: cookieHeader(cookie) },
      })
      expect(response.status()).toBe(401)
    } finally {
      await signer.dispose()
    }
  })
})
