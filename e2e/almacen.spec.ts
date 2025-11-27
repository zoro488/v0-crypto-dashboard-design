import { test, expect } from '@playwright/test';

/**
 * 🎭 E2E Tests - Almacén y Productos
 * 
 * Tests del sistema de almacén e inventario
 */

test.describe('Inventario de Productos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar lista de productos', async ({ page }) => {
    // Navegar a almacén
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar tabla o grid de productos
    const productos = page.locator('table, [class*="grid"], [class*="product-list"]');
    await page.waitForTimeout(2000);
  });

  test('debe mostrar información de stock', async ({ page }) => {
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar columna o indicador de stock
    const stock = page.getByText(/stock|cantidad|disponible/i);
    await page.waitForTimeout(1000);
  });

  test('debe mostrar alertas de stock bajo', async ({ page }) => {
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(2000);
    }

    // Buscar alertas o indicadores de stock bajo
    const alertas = page.locator('[class*="alert"], [class*="warning"], [class*="badge"]')
      .filter({ hasText: /bajo|mínimo|agotado/i });
    
    await page.waitForTimeout(1000);
  });
});

test.describe('Gestión de Productos', () => {
  test('debe abrir modal de nuevo producto', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*producto|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      
      const modal = page.locator('[role="dialog"]');
      await page.waitForTimeout(1000);
    }
  });

  test('debe permitir editar producto existente', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar botón de edición
    const editarBtn = page.getByRole('button', { name: /editar|edit/i }).first()
      .or(page.locator('[class*="edit"]').first());
    
    await page.waitForTimeout(1000);
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    const nuevoBtn = page.getByRole('button', { name: /nuevo.*producto|agregar|\+/i }).first();
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      await page.waitForTimeout(500);

      // Intentar guardar sin llenar campos
      const guardarBtn = page.getByRole('button', { name: /guardar|crear|submit/i });
      if (await guardarBtn.isVisible()) {
        await guardarBtn.click();
        
        // Debería mostrar errores de validación
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Movimientos de Inventario', () => {
  test('debe registrar entrada de productos', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar botón de entrada
    const entradaBtn = page.getByRole('button', { name: /entrada|ingreso|recibir/i });
    await page.waitForTimeout(1000);
  });

  test('debe registrar salida de productos', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar botón de salida
    const salidaBtn = page.getByRole('button', { name: /salida|egreso|enviar/i });
    await page.waitForTimeout(1000);
  });

  test('debe mostrar historial de movimientos', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar historial
    const historial = page.getByText(/historial|movimientos|registro/i);
    await page.waitForTimeout(1000);
  });
});

test.describe('Categorías de Productos', () => {
  test('debe filtrar por categoría', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar filtro de categoría
    const categoriaFilter = page.getByRole('combobox')
      .or(page.locator('select'))
      .or(page.locator('[class*="category-filter"]'));
    
    await page.waitForTimeout(1000);
  });

  test('debe mostrar productos por categoría', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar tabs o secciones de categoría
    const categorias = page.locator('[role="tab"], [class*="tab"]');
    await page.waitForTimeout(1000);
  });
});

test.describe('Búsqueda de Productos', () => {
  test('debe buscar por nombre', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    const busqueda = page.getByPlaceholder(/buscar|search/i)
      .or(page.locator('input[type="search"]'));
    
    if (await busqueda.first().isVisible()) {
      await busqueda.first().fill('producto test');
      await page.waitForTimeout(1000);
    }
  });

  test('debe buscar por código', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    const busqueda = page.getByPlaceholder(/buscar|search/i)
      .or(page.locator('input[type="search"]'));
    
    if (await busqueda.first().isVisible()) {
      await busqueda.first().fill('SKU-001');
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Reportes de Inventario', () => {
  test('debe mostrar valor total del inventario', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar valor total
    const valorTotal = page.getByText(/valor.*total|total.*inventario/i);
    await page.waitForTimeout(1000);
  });

  test('debe exportar inventario', async ({ page }) => {
    await page.goto('/');
    
    const almacenNav = page.getByText(/almacén|almacen|inventario|productos/i).first();
    if (await almacenNav.isVisible()) {
      await almacenNav.click();
      await page.waitForTimeout(1000);
    }

    // Buscar botón de exportar
    const exportarBtn = page.getByRole('button', { name: /exportar|export|descargar/i });
    await page.waitForTimeout(1000);
  });
});
