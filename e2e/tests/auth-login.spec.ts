import { expect, test } from '@playwright/test'
import { TEST_USERS } from '../env'
import { INVALID_CREDENTIALS_MESSAGE } from './helpers/auth'

test.describe('Login form', () => {
  test('admin signs in, lands on /, and sees the Users link', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Password').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')
    const nav = page.getByRole('navigation')
    await expect(nav.getByText(TEST_USERS.admin.name, { exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Users' })).toBeVisible()
  })

  test('agent signs in, lands on /, and does not see the Users link', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USERS.agent.email)
    await page.getByLabel('Password').fill(TEST_USERS.agent.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')
    const nav = page.getByRole('navigation')
    await expect(nav.getByText(TEST_USERS.agent.name, { exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Users' })).toHaveCount(0)
  })

  test('wrong password shows the server error and stays on /login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Password').fill('definitely-the-wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(
      page.getByRole('alert').filter({ hasText: INVALID_CREDENTIALS_MESSAGE }),
    ).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('unknown email shows the same error as a wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody-here@e2e.test')
    await page.getByLabel('Password').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(
      page.getByRole('alert').filter({ hasText: INVALID_CREDENTIALS_MESSAGE }),
    ).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('empty fields show validation errors and do not submit', async ({ page }) => {
    const signInRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/sign-in')) signInRequests.push(request.url())
    })

    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Enter a valid email address')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL('/login')
    expect(signInRequests).toHaveLength(0)
  })

  test('malformed email shows a validation error and does not submit', async ({ page }) => {
    const signInRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/sign-in')) signInRequests.push(request.url())
    })

    await page.goto('/login')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Enter a valid email address')).toBeVisible()
    await expect(page.getByText('Password is required')).toHaveCount(0)
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL('/login')
    expect(signInRequests).toHaveLength(0)
  })

  test('password input masks the typed value', async ({ page }) => {
    await page.goto('/login')
    const password = page.getByLabel('Password')
    await expect(password).toHaveAttribute('type', 'password')
    await password.fill(TEST_USERS.admin.password)
    await expect(password).toHaveAttribute('type', 'password')
  })

  test('pressing Enter in the password field submits the form', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Password').fill(TEST_USERS.admin.password)
    await page.getByLabel('Password').press('Enter')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible()
  })

  test('submit button shows a disabled loading state while sign-in is in flight', async ({
    page,
  }) => {
    // Hold the sign-in response until the test has checked the loading state.
    let releaseResponse: () => void = () => {}
    const released = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    await page.route('**/api/auth/sign-in/email', async (route) => {
      await released
      await route.continue()
    })

    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Password').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    const loadingButton = page.getByRole('button', { name: 'Signing in…' })
    await expect(loadingButton).toBeDisabled()

    releaseResponse()
    await expect(page).toHaveURL('/')
  })
})
