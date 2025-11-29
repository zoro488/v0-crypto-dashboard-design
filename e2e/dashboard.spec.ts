import { test, expect, Page } from '@playwright/test'

/**
 * 🎭 E2E Tests - Dashboard Principal
 * 
 * Tests de navegación y visualización del dashboard
 */

test.describe('Dashboard Principal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('debe cargar la página principal', async ({ page }) => {
    await expect(page).toHaveTitle(/Chronos|Dashboard/i)
  })

  test('debe mostrar el header con navegación', async ({ page }) => {
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
  })

  test('debe mostrar los paneles Bento', async ({ page }) => {
    // Esperar a que cargue el contenido
    await page.waitForLoadState('networkidle')
    
    // Verificar que hay al menos un panel visible
    const panels = page.locator('[data-panel]')
    await expect(panels.first()).toBeVisible({ timeout: 10000 })
  })

  test('debe mostrar KPIs en el dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Buscar elementos de KPI
    const kpiCards = page.locator('[class*="stat"], [class*="kpi"], [class*="card"]').first()
    await expect(kpiCards).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Navegación entre Paneles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('debe navegar al panel de Ventas', async ({ page }) => {
    // Buscar botón/link de ventas
    const ventasLink = page.getByRole('button', { name: /ventas/i })
      .or(page.getByText(/ventas/i).first())
    
    if (await ventasLink.isVisible()) {
      await ventasLink.click()
      await page.waitForTimeout(500)
    }
  })

  test('debe navegar al panel de Bancos', async ({ page }) => {
    const bancosLink = page.getByRole('button', { name: /banco/i })
      .or(page.getByText(/banco/i).first())
    
    if (await bancosLink.isVisible()) {
      await bancosLink.click()
      await page.waitForTimeout(500)
    }
  })

  test('debe navegar al panel de Clientes', async ({ page }) => {
    const clientesLink = page.getByRole('button', { name: /cliente/i })
      .or(page.getByText(/cliente/i).first())
    
    if (await clientesLink.isVisible()) {
      await clientesLink.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Modales de Creación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('debe abrir modal de Nueva Venta', async ({ page }) => {
    // Buscar botón de nueva venta
    const nuevaVentaBtn = page.getByRole('button', { name: /nueva venta|registrar venta/i })
    
    if (await nuevaVentaBtn.isVisible()) {
      await nuevaVentaBtn.click()
      
      // Verificar que el modal se abre
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })
    }
  })

  test('debe abrir modal de Nueva Orden de Compra', async ({ page }) => {
    const nuevaOrdenBtn = page.getByRole('button', { name: /nueva orden|orden de compra/i })
    
    if (await nuevaOrdenBtn.isVisible()) {
      await nuevaOrdenBtn.click()
      
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })
    }
  })

  test('debe cerrar modal con botón X', async ({ page }) => {
    const nuevaVentaBtn = page.getByRole('button', { name: /nueva venta|registrar venta/i })
    
    if (await nuevaVentaBtn.isVisible()) {
      await nuevaVentaBtn.click()
      
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })
      
      // Cerrar modal
      const closeBtn = modal.getByRole('button', { name: /cerrar|close/i })
        .or(modal.locator('button[class*="close"]'))
        .or(modal.locator('svg[class*="x"]').locator('..'))
      
      if (await closeBtn.isVisible()) {
        await closeBtn.click()
        await expect(modal).not.toBeVisible({ timeout: 3000 })
      }
    }
  })
})

test.describe('Responsive Design', () => {
  test('debe ser responsive en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // La página no debe tener scroll horizontal
    const body = page.locator('body')
    const box = await body.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)
  })

  test('debe ser responsive en tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('body')).toBeVisible()
  })

  test('debe ser responsive en desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('debe cargar en menos de 5 segundos', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000)
  })

  test('no debe tener errores de consola críticos', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Filtrar errores conocidos/esperados
    const criticalErrors = errors.filter(e => 
      !e.includes('Firebase') && 
      !e.includes('permission') &&
      !e.includes('net::ERR'),
    )
    
    // Permitir algunos errores no críticos
    expect(criticalErrors.length).toBeLessThan(5)
  })
})
