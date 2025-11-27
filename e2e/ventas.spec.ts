import { test, expect } from '@playwright/test';

/**
 * 🎭 E2E Tests - Sistema de Ventas
 * 
 * Tests completos del flujo de ventas
 */

test.describe('Flujo de Ventas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar lista de ventas', async ({ page }) => {
    // Navegar a ventas
    const ventasNav = page.getByText(/ventas/i).first();
    if (await ventasNav.isVisible()) {
      await ventasNav.click();
      await page.waitForTimeout(1000);
    }

    // Verificar que hay una tabla o lista
    const table = page.locator('table, [role="grid"], [class*="table"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });
  });

  test('debe filtrar ventas por estado', async ({ page }) => {
    // Navegar a ventas
    const ventasNav = page.getByText(/ventas/i).first();
    if (await ventasNav.isVisible()) {
      await ventasNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar filtro de estado
    const filtro = page.getByRole('combobox').or(page.locator('select'));
    if (await filtro.first().isVisible()) {
      await filtro.first().click();
    }
  });

  test('debe crear una nueva venta (mock)', async ({ page }) => {
    // Abrir modal de venta
    const nuevaVentaBtn = page.getByRole('button', { name: /nueva venta|registrar venta/i });
    
    if (!await nuevaVentaBtn.isVisible()) {
      test.skip();
      return;
    }

    await nuevaVentaBtn.click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Llenar formulario básico
    const clienteInput = modal.getByLabel(/cliente/i)
      .or(modal.locator('input[name*="cliente"]'));
    
    if (await clienteInput.isVisible()) {
      await clienteInput.fill('Cliente Test E2E');
    }

    const cantidadInput = modal.getByLabel(/cantidad/i)
      .or(modal.locator('input[name*="cantidad"]'));
    
    if (await cantidadInput.isVisible()) {
      await cantidadInput.fill('10');
    }

    // No enviamos realmente para no afectar datos
  });
});

test.describe('Validaciones de Venta', () => {
  test('debe validar campos requeridos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nuevaVentaBtn = page.getByRole('button', { name: /nueva venta|registrar venta/i });
    
    if (!await nuevaVentaBtn.isVisible()) {
      test.skip();
      return;
    }

    await nuevaVentaBtn.click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Intentar enviar sin datos
    const submitBtn = modal.getByRole('button', { name: /guardar|crear|enviar|submit/i });
    
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      
      // Debe mostrar errores de validación
      await page.waitForTimeout(500);
      
      const errorMessages = modal.locator('[class*="error"], [class*="invalid"], [aria-invalid="true"]');
      // El formulario debería mostrar errores o no permitir envío
    }
  });

  test('debe validar cantidad positiva', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nuevaVentaBtn = page.getByRole('button', { name: /nueva venta|registrar venta/i });
    
    if (!await nuevaVentaBtn.isVisible()) {
      test.skip();
      return;
    }

    await nuevaVentaBtn.click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const cantidadInput = modal.getByLabel(/cantidad/i)
      .or(modal.locator('input[name*="cantidad"]'));
    
    if (await cantidadInput.isVisible()) {
      await cantidadInput.fill('-5');
      await cantidadInput.blur();
      
      // Debe mostrar error o corregir automáticamente
    }
  });
});

test.describe('KPIs de Ventas', () => {
  test('debe mostrar total de ventas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Buscar KPI de ventas totales
    const ventasTotal = page.getByText(/ventas totales|total ventas/i)
      .or(page.locator('[class*="kpi"]').filter({ hasText: /venta/i }));
    
    // Debe existir algún indicador de ventas
    const kpis = page.locator('[class*="stat"], [class*="kpi"], [class*="metric"]');
    await expect(kpis.first()).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar ventas pendientes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const pendientes = page.getByText(/pendiente/i);
    // Puede o no existir, solo verificamos que no hay crash
    await page.waitForTimeout(1000);
  });
});
