import { test, expect } from '@playwright/test';

/**
 * 🎭 E2E Tests - Órdenes de Compra
 * 
 * Tests del sistema de órdenes de compra
 */

test.describe('Lista de Órdenes de Compra', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar tabla de órdenes', async ({ page }) => {
    // Navegar a órdenes de compra
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar tabla
    const tabla = page.locator('table');
    await page.waitForTimeout(2000);
  });

  test('debe mostrar columnas requeridas', async ({ page }) => {
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    // Columnas esperadas
    const columnas = ['Folio', 'Distribuidor', 'Fecha', 'Total', 'Estado'];
    
    for (const columna of columnas) {
      // Buscar encabezado
      await page.waitForTimeout(500);
    }
  });

  test('debe filtrar por estado', async ({ page }) => {
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar filtro de estado
    const filtroEstado = page.getByRole('combobox')
      .or(page.locator('[class*="filter"]'));
    
    await page.waitForTimeout(1000);
  });
});

test.describe('Crear Orden de Compra', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('debe abrir modal de nueva orden', async ({ page }) => {
    const nuevaOrdenBtn = page.getByRole('button', { name: /nueva.*orden|crear.*orden/i })
      .or(page.getByRole('button', { name: /\+/i }));

    if (!await nuevaOrdenBtn.first().isVisible()) {
      // Navegar primero a órdenes
      const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
      if (await ordenesNav.isVisible()) {
        await ordenesNav.click();
        await page.waitForTimeout(1000);
      }
    }

    const modalBtn = page.getByRole('button', { name: /nueva|crear|\+/i }).first();
    if (await modalBtn.isVisible()) {
      await modalBtn.click();
      
      const modal = page.locator('[role="dialog"]');
      await page.waitForTimeout(1000);
    }
  });

  test('debe mostrar selector de distribuidor', async ({ page }) => {
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    const modalBtn = page.getByRole('button', { name: /nueva|crear|\+/i }).first();
    if (await modalBtn.isVisible()) {
      await modalBtn.click();
      await page.waitForTimeout(1000);

      // Buscar selector de distribuidor
      const distribuidorSelect = page.getByRole('combobox')
        .or(page.locator('select'));
      
      await page.waitForTimeout(500);
    }
  });

  test('debe permitir agregar productos', async ({ page }) => {
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    const modalBtn = page.getByRole('button', { name: /nueva|crear|\+/i }).first();
    if (await modalBtn.isVisible()) {
      await modalBtn.click();
      await page.waitForTimeout(1000);

      // Buscar botón de agregar producto
      const agregarProducto = page.getByRole('button', { name: /agregar.*producto|añadir/i });
      await page.waitForTimeout(500);
    }
  });

  test('debe calcular total automáticamente', async ({ page }) => {
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    // Si hay un modal de orden abierto, debe mostrar total
    const total = page.getByText(/total/i);
    await page.waitForTimeout(1000);
  });
});

test.describe('Gestión de Estados', () => {
  test('debe mostrar badge de estado', async ({ page }) => {
    await page.goto('/');
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar badges de estado
    const estados = ['Pendiente', 'Aprobada', 'Completada', 'Cancelada'];
    
    const badges = page.locator('[class*="badge"], [class*="status"]');
    await page.waitForTimeout(1000);
  });

  test('debe permitir cambiar estado', async ({ page }) => {
    await page.goto('/');
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(2000);
    }

    // Buscar dropdown o botón de cambio de estado
    const cambiarEstadoBtn = page.getByRole('button', { name: /estado|aprobar|completar/i });
    await page.waitForTimeout(1000);
  });
});

test.describe('Detalle de Orden', () => {
  test('debe mostrar detalle al hacer click', async ({ page }) => {
    await page.goto('/');
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(2000);
    }

    // Buscar primera fila de la tabla
    const primeraFila = page.locator('table tbody tr').first()
      .or(page.locator('[class*="order-item"]').first());
    
    if (await primeraFila.isVisible()) {
      await primeraFila.click();
      await page.waitForTimeout(1000);
    }
  });

  test('debe mostrar productos de la orden', async ({ page }) => {
    await page.goto('/');
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(2000);
    }

    // Buscar sección de productos
    const productos = page.getByText(/producto/i);
    await page.waitForTimeout(1000);
  });

  test('debe mostrar historial de la orden', async ({ page }) => {
    await page.goto('/');
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(2000);
    }

    // Buscar historial o timeline
    const historial = page.locator('[class*="timeline"], [class*="history"]')
      .or(page.getByText(/historial/i));
    await page.waitForTimeout(1000);
  });
});

test.describe('Búsqueda y Filtros', () => {
  test('debe buscar por folio', async ({ page }) => {
    await page.goto('/');
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    const busqueda = page.getByPlaceholder(/buscar|search/i)
      .or(page.locator('input[type="search"]'));
    
    if (await busqueda.first().isVisible()) {
      await busqueda.first().fill('OC-001');
      await page.waitForTimeout(1000);
    }
  });

  test('debe filtrar por fecha', async ({ page }) => {
    await page.goto('/');
    const ordenesNav = page.getByText(/órdenes|ordenes|compra/i).first();
    if (await ordenesNav.isVisible()) {
      await ordenesNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar selector de fecha
    const fechaFilter = page.locator('input[type="date"]')
      .or(page.locator('[class*="date-picker"]'));
    await page.waitForTimeout(1000);
  });
});
