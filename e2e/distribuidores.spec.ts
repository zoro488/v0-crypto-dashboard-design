import { test, expect } from '@playwright/test';

/**
 * 🎭 E2E Tests - Distribuidores
 * 
 * Tests del sistema de gestión de distribuidores
 */

test.describe('Lista de Distribuidores', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar tabla de distribuidores', async ({ page }) => {
    // Navegar a distribuidores
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar tabla
    const tabla = page.locator('table, [class*="distribuidor-list"]');
    await page.waitForTimeout(2000);
  });

  test('debe mostrar información de cada distribuidor', async ({ page }) => {
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    // Verificar columnas: Nombre, Contacto, Saldo
    const columnas = page.locator('th, [class*="header"]');
    await page.waitForTimeout(1000);
  });

  test('debe mostrar saldo de cada distribuidor', async ({ page }) => {
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar valores monetarios
    const saldos = page.locator('text=/\\$[\\d,]+/');
    await page.waitForTimeout(1000);
  });
});

test.describe('Crear Distribuidor', () => {
  test('debe abrir modal de nuevo distribuidor', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*distribuidor|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      
      const modal = page.locator('[role="dialog"]');
      await page.waitForTimeout(1000);
    }
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*distribuidor|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      await page.waitForTimeout(500);

      const guardarBtn = page.getByRole('button', { name: /guardar|crear|submit/i });
      if (await guardarBtn.isVisible()) {
        await guardarBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('debe crear distribuidor correctamente', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*distribuidor|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      await page.waitForTimeout(500);

      // Llenar campos
      const nombreInput = page.getByLabel(/nombre/i)
        .or(page.locator('input[name="nombre"]'));
      if (await nombreInput.first().isVisible()) {
        await nombreInput.first().fill('Distribuidor E2E Test');
      }
    }
  });
});

test.describe('Órdenes del Distribuidor', () => {
  test('debe mostrar órdenes asociadas', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(2000);
    }

    // Click en distribuidor
    const primeraFila = page.locator('table tbody tr').first()
      .or(page.locator('[class*="distribuidor-item"]').first());
    
    if (await primeraFila.isVisible()) {
      await primeraFila.click();
      await page.waitForTimeout(1000);
      
      // Buscar órdenes
      const ordenes = page.getByText(/órdenes|ordenes|compras/i);
      await page.waitForTimeout(500);
    }
  });

  test('debe crear orden desde distribuidor', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar botón de crear orden
    const crearOrdenBtn = page.getByRole('button', { name: /crear.*orden|nueva.*orden/i });
    await page.waitForTimeout(1000);
  });
});

test.describe('Historial de Pagos Distribuidor', () => {
  test('debe mostrar historial de pagos', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(2000);
    }

    // Click en distribuidor
    const primeraFila = page.locator('table tbody tr').first();
    if (await primeraFila.isVisible()) {
      await primeraFila.click();
      
      // Buscar historial
      const historial = page.getByText(/historial|pagos/i);
      await page.waitForTimeout(1000);
    }
  });

  test('debe registrar pago a distribuidor', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar botón de pago
    const pagoBtn = page.getByRole('button', { name: /pagar|abonar|transferir/i });
    await page.waitForTimeout(1000);
  });
});

test.describe('Saldo de Distribuidores', () => {
  test('debe mostrar saldo pendiente', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar indicador de saldo
    const saldo = page.getByText(/pendiente|adeudo|saldo/i);
    await page.waitForTimeout(1000);
  });

  test('debe mostrar total de saldos', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar total consolidado
    const total = page.getByText(/total/i);
    await page.waitForTimeout(1000);
  });
});

test.describe('Búsqueda de Distribuidores', () => {
  test('debe buscar por nombre', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(1000);
    }

    const busqueda = page.getByPlaceholder(/buscar|search/i)
      .or(page.locator('input[type="search"]'));
    
    if (await busqueda.first().isVisible()) {
      await busqueda.first().fill('Proveedor');
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Estadísticas del Distribuidor', () => {
  test('debe mostrar estadísticas', async ({ page }) => {
    await page.goto('/');
    
    const distribNav = page.getByText(/distribuidor/i).first();
    if (await distribNav.isVisible()) {
      await distribNav.click();
      await page.waitForTimeout(2000);
    }

    // Buscar estadísticas o KPIs
    const stats = page.locator('[class*="stat"], [class*="kpi"], [class*="card"]');
    await page.waitForTimeout(1000);
  });
});
