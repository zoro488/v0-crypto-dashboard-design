import { test, expect } from '@playwright/test'

test.describe('Formularios', () => {
  test('debe abrir modal de crear venta', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Ventas')
    await page.click('button:has-text("Nueva Venta")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('debe validar campos requeridos en modal de venta', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Ventas')
    await page.click('button:has-text("Nueva Venta")')

    // Intentar enviar sin llenar campos
    await page.click('button:has-text("Crear")')

    // Debe mostrar errores de validación
    await expect(page.locator('text=requerido')).toBeVisible()
  })

  test('debe crear una venta correctamente', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Ventas')
    await page.click('button:has-text("Nueva Venta")')

    // Llenar formulario
    await page.fill('input[name="cliente"]', 'Cliente Test')
    await page.fill('input[name="cantidad"]', '10')
    // ... más campos

    await page.click('button:has-text("Crear")')

    // Verificar toast de éxito
    await expect(page.locator('text=Venta creada')).toBeVisible()
  })
})
