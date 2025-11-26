import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('debe mostrar la página principal', async ({ page }) => {
    await expect(page).toHaveTitle(/Chronos/)
  })

  test('debe mostrar el dashboard cuando no hay auth', async ({ page }) => {
    // El sistema actual usa mock data sin auth
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('debe navegar entre paneles', async ({ page }) => {
    // Navegar a Ventas
    await page.click('text=Ventas')
    await expect(page.locator('h1:has-text("Ventas"), h2:has-text("Ventas")')).toBeVisible()

    // Navegar a Órdenes de Compra
    await page.click('text=Órdenes')
    await expect(page.locator('h1:has-text("Órdenes"), h2:has-text("Órdenes")')).toBeVisible()
  })

  test('debe mostrar datos mock en dashboard', async ({ page }) => {
    // Verificar que los KPIs se muestran
    await expect(page.locator('text=Capital Total')).toBeVisible()
  })
})

test.describe('Navegación Protegida (Futuro)', () => {
  test.skip('debe redirigir a login si no está autenticado', async ({ page }) => {
    // Este test se activará cuando se implemente Firebase Auth
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test.skip('debe permitir acceso después de login', async ({ page }) => {
    // Placeholder para cuando se implemente auth
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })
})
