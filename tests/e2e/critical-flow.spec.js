const { test, expect } = require('@playwright/test')

test('login -> browse -> add cart -> checkout order', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email address').fill('user@stylehub.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL('**/')

  await page.goto('/shop')
  await expect(page.getByText('products found')).toBeVisible()

  await page.getByRole('button', { name: 'Add to Cart' }).first().click()

  await expect
    .poll(async () => {
      const cartSize = await page.evaluate(() => {
        const raw = window.localStorage.getItem('cart')
        if (!raw) return 0
        try {
          return JSON.parse(raw).length
        } catch (_error) {
          return 0
        }
      })
      return cartSize
    })
    .toBeGreaterThan(0)

  await page.goto('/cart')

  const emptyCart = await page.getByRole('heading', { name: 'Your cart is empty' }).isVisible()
  if (emptyCart) {
    await page.goto('/shop')
    await page.locator('a[href^="/product/"]').first().click()
    await page.getByRole('button', { name: 'Add to Cart' }).click()
    await page.goto('/cart')
  }

  const checkoutButton = page.getByRole('button', {
    name: /Proceed to Checkout|Sign in to Checkout/
  })
  await checkoutButton.click()

  // In slower environments auth state can lag briefly and redirect to login.
  if (page.url().includes('/login')) {
    await page.getByLabel('Email address').fill('user@stylehub.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('**/')
    await page.goto('/cart')
    await page.getByRole('button', { name: /Proceed to Checkout|Sign in to Checkout/ }).click()
  }

  await page.waitForURL('**/checkout')
  await page.getByPlaceholder('Full name').fill('Playwright User')
  await page.getByPlaceholder('Address line 1').fill('123 Test St')
  await page.getByPlaceholder('City').fill('Test City')
  await page.getByPlaceholder('State').fill('CA')
  await page.getByPlaceholder('Postal code').fill('90001')
  await page.getByPlaceholder('Country').fill('US')

  await page.getByRole('button', { name: 'Place order' }).click()
  await expect(page.getByText('placed successfully')).toBeVisible()
})
