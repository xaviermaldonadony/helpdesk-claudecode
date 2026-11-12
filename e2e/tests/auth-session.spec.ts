import { expect, test } from '@playwright/test'
import { TEST_USERS } from '../env'
import { SESSION_COOKIE, signInThroughUi } from './helpers/auth'

test.describe('Session lifecycle', () => {
  test('session persists across a page reload', async ({ page }) => {
    await signInThroughUi(page, TEST_USERS.admin)

    await page.reload()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('navigation').getByText(TEST_USERS.admin.name, { exact: true })).toBeVisible()
  })

  test('session cookie is HttpOnly and set after sign-in', async ({ page, context }) => {
    await signInThroughUi(page, TEST_USERS.agent)

    const cookies = await context.cookies()
    const sessionCookie = cookies.find((cookie) => cookie.name === SESSION_COOKIE)
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.httpOnly).toBe(true)
    expect(sessionCookie?.value).not.toBe('')
  })

  test('sign-out returns to /login and clears the session cookie', async ({ page, context }) => {
    await signInThroughUi(page, TEST_USERS.admin)
    expect((await context.cookies()).some((cookie) => cookie.name === SESSION_COOKIE)).toBe(true)

    await page.getByRole('navigation').getByRole('button', { name: 'Sign out' }).click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    const cookies = await context.cookies()
    expect(cookies.some((cookie) => cookie.name === SESSION_COOKIE)).toBe(false)
  })

  test('after sign-out, a visit to / redirects to /login', async ({ page }) => {
    await signInThroughUi(page, TEST_USERS.agent)
    await page.getByRole('navigation').getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL('/login')

    await page.goto('/')

    await expect(page).toHaveURL('/login')
  })

  test('after sign-out, a reload of /users redirects to /login', async ({ page }) => {
    await signInThroughUi(page, TEST_USERS.admin)
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL('/login')

    await page.goto('/users')

    await expect(page).toHaveURL('/login')
  })

  test('two browser contexts hold independent sessions', async ({ browser }) => {
    const adminContext = await browser.newContext()
    const agentContext = await browser.newContext()
    try {
      const adminPage = await adminContext.newPage()
      const agentPage = await agentContext.newPage()
      await signInThroughUi(adminPage, TEST_USERS.admin)
      await signInThroughUi(agentPage, TEST_USERS.agent)

      const adminNav = adminPage.getByRole('navigation')
      await expect(adminNav.getByText(TEST_USERS.admin.name, { exact: true })).toBeVisible()
      await expect(adminNav.getByRole('link', { name: 'Users' })).toBeVisible()

      const agentNav = agentPage.getByRole('navigation')
      await expect(agentNav.getByText(TEST_USERS.agent.name, { exact: true })).toBeVisible()
      await expect(agentNav.getByRole('link', { name: 'Users' })).toHaveCount(0)

      // Signing out in one context does not end the other context's session.
      await adminPage.getByRole('navigation').getByRole('button', { name: 'Sign out' }).click()
      await expect(adminPage).toHaveURL('/login')
      await agentPage.reload()
      await expect(agentPage).toHaveURL('/')
      await expect(agentNav.getByText(TEST_USERS.agent.name, { exact: true })).toBeVisible()
    } finally {
      await adminContext.close()
      await agentContext.close()
    }
  })
})
