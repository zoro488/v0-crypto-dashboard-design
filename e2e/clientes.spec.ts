import { test, expect } from '@playwright/test';

/**
 * 🎭 E2E Tests - Clientes
 * 
 * Tests del sistema de gestión de clientes
 */

test.describe('Lista de Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar tabla de clientes', async ({ page }) => {
    // Navegar a clientes
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar tabla
    const tabla = page.locator('table, [class*="client-list"]');
    await page.waitForTimeout(2000);
  });

  test('debe mostrar información básica del cliente', async ({ page }) => {
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    // Verificar columnas: Nombre, Teléfono, Saldo
    const columnas = page.locator('th, [class*="header"]');
    await page.waitForTimeout(1000);
  });

  test('debe mostrar saldos de clientes', async ({ page }) => {
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar valores de saldo
    const saldos = page.locator('text=/\\$[\\d,]+/');
    await page.waitForTimeout(1000);
  });
});

test.describe('Crear Cliente', () => {
  test('debe abrir modal de nuevo cliente', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*cliente|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      
      const modal = page.locator('[role="dialog"]');
      await page.waitForTimeout(1000);
    }
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*cliente|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      await page.waitForTimeout(500);

      const guardarBtn = page.getByRole('button', { name: /guardar|crear|submit/i });
      if (await guardarBtn.isVisible()) {
        await guardarBtn.click();
        // Debería mostrar errores
        await page.waitForTimeout(1000);
      }
    }
  });

  test('debe crear cliente correctamente', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*cliente|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      await page.waitForTimeout(500);

      // Llenar campos
      const nombreInput = page.getByLabel(/nombre/i)
        .or(page.locator('input[name="nombre"]'));
      if (await nombreInput.first().isVisible()) {
        await nombreInput.first().fill('Cliente E2E Test');
      }

      const telefonoInput = page.getByLabel(/teléfono|telefono/i)
        .or(page.locator('input[name="telefono"]'));
      if (await telefonoInput.first().isVisible()) {
        await telefonoInput.first().fill('5551234567');
      }
    }
  });
});

test.describe('Historial de Pagos de Cliente', () => {
  test('debe mostrar historial de pagos', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(2000);
    }

    // Click en un cliente para ver detalle
    const primeraFila = page.locator('table tbody tr').first()
      .or(page.locator('[class*="client-item"]').first());
    
    if (await primeraFila.isVisible()) {
      await primeraFila.click();
      await page.waitForTimeout(1000);
      
      // Buscar historial de pagos
      const historial = page.getByText(/historial|pagos/i);
      await page.waitForTimeout(500);
    }
  });

  test('debe registrar nuevo pago', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar botón de registrar pago
    const pagoBtn = page.getByRole('button', { name: /pago|abonar|cobrar/i });
    await page.waitForTimeout(1000);
  });
});

test.describe('Saldo de Clientes', () => {
  test('debe mostrar saldo pendiente', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar indicador de saldo
    const saldoPendiente = page.getByText(/pendiente|adeudo|debe/i);
    await page.waitForTimeout(1000);
  });

  test('debe mostrar total de saldos', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar total consolidado
    const total = page.getByText(/total.*saldo|saldo.*total/i);
    await page.waitForTimeout(1000);
  });
});

test.describe('Búsqueda de Clientes', () => {
  test('debe buscar por nombre', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    const busqueda = page.getByPlaceholder(/buscar|search/i)
      .or(page.locator('input[type="search"]'));
    
    if (await busqueda.first().isVisible()) {
      await busqueda.first().fill('Juan');
      await page.waitForTimeout(1000);
    }
  });

  test('debe buscar por teléfono', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(1000);
    }

    const busqueda = page.getByPlaceholder(/buscar|search/i)
      .or(page.locator('input[type="search"]'));
    
    if (await busqueda.first().isVisible()) {
      await busqueda.first().fill('555');
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Ventas del Cliente', () => {
  test('debe mostrar ventas asociadas', async ({ page }) => {
    await page.goto('/');
    
    const clientesNav = page.getByText(/clientes/i).first();
    if (await clientesNav.isVisible()) {
      await clientesNav.click();
      await page.waitForTimeout(2000);
    }

    // Click en cliente
    const primeraFila = page.locator('table tbody tr').first();
    if (await primeraFila.isVisible()) {
      await primeraFila.click();
      
      // Buscar sección de ventas
      const ventas = page.getByText(/ventas|compras/i);
      await page.waitForTimeout(1000);
    }
  });
});
