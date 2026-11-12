import { expect, test } from '@playwright/test'
import { TEST_USERS } from '../env'
import { signInThroughUi } from './helpers/auth'

test.describe('Route protection', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('unauthenticated visit to /users redirects to /login', async ({ page }) => {
    await page.goto('/users')

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeHidden()
  })

  test('unknown path while signed out ends on /login', async ({ page }) => {
    // The catch-all route sends unknown paths to /, which then redirects to /login.
    await page.goto('/does-not-exist')

    await expect(page).toHaveURL('/login')
  })

  test('agent visiting /users is redirected to /', async ({ page }) => {
    await signInThroughUi(page, TEST_USERS.agent)

    await page.goto('/users')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Users' })).toBeHidden()
  })

  test('admin visiting /users sees the Users page', async ({ page }) => {
    await signInThroughUi(page, TEST_USERS.admin)

    await page.goto('/users')

    await expect(page).toHaveURL('/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  })

  test('signed-in user visiting /login is redirected to /', async ({ page }) => {
    // LoginPage renders <Navigate to="/" /> when a session exists.
    await signInThroughUi(page, TEST_USERS.agent)

    await page.goto('/login')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible()
  })

  test('deep link to /users while signed out lands on / after sign-in, not on /users', async ({
    page,
  }) => {
    // Documents current behavior: the login page has no return-to, so it always navigates to /.
    await page.goto('/users')
    await expect(page).toHaveURL('/login')

    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Password').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')
  })
})
