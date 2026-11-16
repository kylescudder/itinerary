import { test, expect } from '@playwright/test'
test('signed-out visitors can reach Google sign-in and protected data stays private', async ({
  page,
  request,
}) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
  const response = await request.get('/api/trips')
  expect(response.status()).toBe(401)
  await page.reload()
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
})
test('missing authentication cannot create trips', async ({ request }) => {
  const response = await request.post('/api/trips', {
    data: { name: 'Unauthorized trip' },
  })
  expect(response.status()).toBe(401)
})
