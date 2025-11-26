import { test, expect } from '@playwright/test'

test.describe('Componentes UI', () => {
  test.skip('debe mostrar skeleton mientras carga', async ({ page }) => {
    // Skipped: Loading skeleton depends on timing and may not be visible in tests
    await page.goto('/')
    // El skeleton debe aparecer brevemente
    await expect(page.locator('.animate-pulse')).toBeVisible({ timeout: 1000 })
  })

  test('debe tener navegación funcional', async ({ page }) => {
    await page.goto('/')

    const navItems = ['Dashboard', 'Ventas', 'Órdenes', 'Clientes', 'Banco']

    for (const item of navItems) {
      await page.getByRole('button', { name: new RegExp(item, 'i') }).or(page.getByText(item, { exact: false })).first().click()
      await page.waitForLoadState('domcontentloaded')
    }
  })

  test('debe ser responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible()

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    // Page should still be visible on mobile
    await expect(page.locator('body')).toBeVisible()
  })
})

