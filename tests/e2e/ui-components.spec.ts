import { test, expect } from '@playwright/test'

test.describe('Componentes UI', () => {
  test('debe mostrar skeleton mientras carga', async ({ page }) => {
    await page.goto('/')
    // El skeleton debe aparecer brevemente
    await expect(page.locator('.animate-pulse')).toBeVisible({ timeout: 1000 })
  })

  test('debe tener navegación funcional', async ({ page }) => {
    await page.goto('/')

    const navItems = ['Dashboard', 'Ventas', 'Órdenes', 'Clientes', 'Banco']

    for (const item of navItems) {
      await page.click(`text=${item}`)
      await page.waitForLoadState('networkidle')
    }
  })

  test('debe ser responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    // Verificar menú hamburguesa o sidebar colapsado
  })
})
