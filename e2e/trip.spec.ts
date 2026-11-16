import { test, expect, type Page } from '@playwright/test'

// supabase-js keys the persisted session by the first label of the project host
// (127.0.0.1 in the e2e server), so a seeded session signs the browser in without
// contacting Supabase. API routes are replaced at the browser boundary below.
const storageKey = 'sb-127-auth-token'

async function signIn(
  page: Page,
  { lifetimeAccess }: { lifetimeAccess: boolean },
) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const session = {
    access_token: 'e2e-access-token',
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'traveller@example.test',
      app_metadata: { provider: 'google' },
      user_metadata: {
        full_name: 'Test Traveller',
        lifetime_access: lifetimeAccess,
      },
      created_at: '2026-01-01T00:00:00.000Z',
    },
  }
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [storageKey, JSON.stringify(session)] as const,
  )
}

async function stubApi(page: Page) {
  const trips: Array<Record<string, unknown>> = []
  const requests: Array<{
    method: string
    path: string
    body: unknown
    auth: string | null
  }> = []
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    const body = request.postDataJSON?.() ?? null
    requests.push({
      method: request.method(),
      path: pathname,
      body,
      auth: request.headers()['authorization'] ?? null,
    })
    if (pathname === '/api/trips' && request.method() === 'GET')
      return route.fulfill({ json: trips })
    if (pathname === '/api/trips' && request.method() === 'POST') {
      const trip = {
        id: 'trip-1',
        name: body.name,
        code: 'KYOTO1',
        start_date: body.startDate ?? body.start_date ?? null,
        end_date: body.endDate ?? body.end_date ?? null,
        created_at: '2026-11-16T00:00:00.000Z',
        stripe_session_id: null,
        stripe_payment_intent_id: null,
        user_role: 'owner',
      }
      trips.push(trip)
      return route.fulfill({ status: 201, json: trip })
    }
    if (/\/(itinerary-items|suggestions|place-cache)$/.test(pathname))
      return route.fulfill({ json: [] })
    return route.fulfill({
      status: 404,
      json: { error: `unstubbed ${pathname}` },
    })
  })
  return requests
}

test('a lifetime member with no trips creates one and lands on its itinerary', async ({
  page,
}) => {
  await signIn(page, { lifetimeAccess: true })
  const requests = await stubApi(page)

  await page.goto('/itinerary')
  await expect(
    page.getByText('Create or join a trip to start planning.'),
  ).toBeVisible()
  await expect(page.getByText('Test Traveller')).toBeVisible()
  await page
    .getByRole('link', { name: 'Go to trip setup' })
    .or(page.getByRole('button', { name: 'Go to trip setup' }))
    .click()
  await expect(page).toHaveURL(/\/trip$/)

  await page.getByRole('button', { name: 'Create trip' }).click()
  await expect(page.getByText('Please add a trip name.')).toBeVisible()

  await page.getByLabel('Trip name').fill('Kyoto in spring')
  await page.getByLabel('Start date').fill('2027-04-02')
  await page.getByLabel('End date').fill('2027-04-01')
  await page.getByRole('button', { name: 'Create trip' }).click()
  await expect(
    page.getByText('End date must be after the start date.'),
  ).toBeVisible()

  await page.getByLabel('End date').fill('2027-04-09')
  await page.getByRole('button', { name: 'Create trip' }).click()

  await expect(page).toHaveURL(/\/itinerary$/)
  await expect(page.getByText('Kyoto in spring').first()).toBeVisible()
  const create = requests.find(
    (r) => r.method === 'POST' && r.path === '/api/trips',
  )
  expect(create?.auth).toBe('Bearer e2e-access-token')
  expect(create?.body).toMatchObject({ name: 'Kyoto in spring' })
})

test('without lifetime access creating a trip goes to checkout and keeps the draft', async ({
  page,
}) => {
  await signIn(page, { lifetimeAccess: false })
  const requests = await stubApi(page)
  await page.route('**/billing/checkout', (route) =>
    route.fulfill({ body: '<h1>checkout</h1>', contentType: 'text/html' }),
  )

  await page.goto('/trip')
  await page.getByLabel('Trip name').fill('Lisbon long weekend')
  await page.getByRole('button', { name: 'Create trip' }).click()

  await expect(page).toHaveURL(/\/billing\/checkout$/)
  const draft = await page.evaluate(() =>
    Object.entries(window.localStorage).find(([, value]) =>
      value.includes('Lisbon long weekend'),
    ),
  )
  expect(draft?.[1] && JSON.parse(draft[1])).toMatchObject({
    name: 'Lisbon long weekend',
  })
  expect(
    requests.some((r) => r.method === 'POST' && r.path === '/api/trips'),
  ).toBe(false)
})
