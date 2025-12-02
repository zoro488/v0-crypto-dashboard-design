/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🏆 FLOWDISTRIBUTOR 2025 - TESTS CON CÓDIGO REAL DEL SISTEMA
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * IMPORTANTE: Este test usa las funciones REALES del sistema, no mocks.
 * Importa directamente desde:
 * - app/lib/services/business-logic.service.ts
 * - app/lib/formulas.ts
 * 
 * Fecha de verificación: 02 de Diciembre de 2025
 * ════════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTACIONES DEL SISTEMA REAL
// ═══════════════════════════════════════════════════════════════════════════════

import {
  calcularDistribucionVenta,
  calcularDistribucionParcial,
  PRECIO_FLETE_DEFAULT,
  BANCOS_IDS,
  BANCOS_VENTAS,
} from '@/app/lib/services/business-logic.service'

import {
  calcularDistribucionGYA,
  calcularVentaCompleta,
  calcularDistribucionAbono,
  calcularCapitalBanco,
  calcularDeudaCliente,
  FLETE_DEFAULT,
  BANCOS_DISTRIBUCION,
} from '@/app/lib/formulas'

// ═══════════════════════════════════════════════════════════════════════════════
// DATOS DE PRUEBA ESTÁNDAR (según documentación sagrada)
// ═══════════════════════════════════════════════════════════════════════════════

const DATOS_PRUEBA = {
  precioVentaUnidad: 10000,
  precioCompraUnidad: 6300,
  precioFlete: 500,
  cantidad: 10,
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: Verificar constantes del sistema real
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔧 CONSTANTES DEL SISTEMA REAL', () => {
  test('PRECIO_FLETE_DEFAULT = 500', () => {
    expect(PRECIO_FLETE_DEFAULT).toBe(500)
  })

  test('FLETE_DEFAULT (formulas.ts) = 500', () => {
    expect(FLETE_DEFAULT).toBe(500)
  })

  test('BANCOS_IDS contiene exactamente 7 bancos', () => {
    expect(BANCOS_IDS).toHaveLength(7)
    expect(BANCOS_IDS).toContain('boveda_monte')
    expect(BANCOS_IDS).toContain('boveda_usa')
    expect(BANCOS_IDS).toContain('profit')
    expect(BANCOS_IDS).toContain('leftie')
    expect(BANCOS_IDS).toContain('azteca')
    expect(BANCOS_IDS).toContain('flete_sur')
    expect(BANCOS_IDS).toContain('utilidades')
  })

  test('BANCOS_VENTAS contiene los 3 bancos GYA', () => {
    expect(BANCOS_VENTAS).toHaveLength(3)
    expect(BANCOS_VENTAS).toContain('boveda_monte')
    expect(BANCOS_VENTAS).toContain('flete_sur')
    expect(BANCOS_VENTAS).toContain('utilidades')
  })

  test('BANCOS_DISTRIBUCION (formulas.ts) = 3 bancos GYA', () => {
    expect(BANCOS_DISTRIBUCION).toHaveLength(3)
    expect(BANCOS_DISTRIBUCION).toContain('boveda_monte')
    expect(BANCOS_DISTRIBUCION).toContain('flete_sur')
    expect(BANCOS_DISTRIBUCION).toContain('utilidades')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: calcularDistribucionVenta (business-logic.service.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏦 calcularDistribucionVenta (business-logic.service.ts) - CÓDIGO REAL', () => {
  test('CASO 1: Venta completa CON flete', () => {
    const resultado = calcularDistribucionVenta(
      DATOS_PRUEBA.cantidad,        // 10
      DATOS_PRUEBA.precioVentaUnidad, // 10000
      DATOS_PRUEBA.precioCompraUnidad, // 6300
      true,                          // aplica flete
      DATOS_PRUEBA.precioFlete,      // 500
    )

    // Verificar distribución a 3 bancos
    expect(resultado.montoBovedaMonte).toBe(63000)  // 6300 × 10
    expect(resultado.montoFletes).toBe(5000)        // 500 × 10
    expect(resultado.montoUtilidades).toBe(32000)   // (10000 - 6300 - 500) × 10

    // Verificar totales
    expect(resultado.ingresoVenta).toBe(100000)     // 10000 × 10
    expect(resultado.totalVenta).toBe(100000)

    // Verificar que suma = total
    const sumaDistribucion = resultado.montoBovedaMonte + 
                             resultado.montoFletes + 
                             resultado.montoUtilidades
    expect(sumaDistribucion).toBe(resultado.ingresoVenta)
  })

  test('CASO 2: Venta SIN flete', () => {
    const resultado = calcularDistribucionVenta(
      10,     // cantidad
      10000,  // precioVenta
      6300,   // precioCompra
      false,  // NO aplica flete
    )

    expect(resultado.montoBovedaMonte).toBe(63000)
    expect(resultado.montoFletes).toBe(0)            // Sin flete
    expect(resultado.montoUtilidades).toBe(37000)    // (10000 - 6300 - 0) × 10 = 3700 × 10
  })

  test('CASO 3: Cantidad = 1 unidad', () => {
    const resultado = calcularDistribucionVenta(
      1,      // 1 unidad
      10000,
      6300,
      true,
      500,
    )

    expect(resultado.montoBovedaMonte).toBe(6300)
    expect(resultado.montoFletes).toBe(500)
    expect(resultado.montoUtilidades).toBe(3200)
    expect(resultado.ingresoVenta).toBe(10000)
  })

  test('CASO 4: Verificar proporcionPagada inicial = 1', () => {
    const resultado = calcularDistribucionVenta(10, 10000, 6300, true, 500)
    expect(resultado.proporcionPagada).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: calcularDistribucionParcial (business-logic.service.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('📊 calcularDistribucionParcial (business-logic.service.ts) - CÓDIGO REAL', () => {
  const totalVenta = 100000
  const montoBovedaMonte = 63000
  const montoFletes = 5000
  const montoUtilidades = 32000

  test('Pago 50% distribuye proporcionalmente', () => {
    const resultado = calcularDistribucionParcial(
      50000,         // montoPagado (50%)
      totalVenta,
      montoBovedaMonte,
      montoFletes,
      montoUtilidades,
    )

    expect(resultado.bovedaMonte).toBe(31500)  // 63000 × 0.5
    expect(resultado.fletes).toBe(2500)         // 5000 × 0.5
    expect(resultado.utilidades).toBe(16000)    // 32000 × 0.5
  })

  test('Pago 25% distribuye proporcionalmente', () => {
    const resultado = calcularDistribucionParcial(
      25000,         // montoPagado (25%)
      totalVenta,
      montoBovedaMonte,
      montoFletes,
      montoUtilidades,
    )

    expect(resultado.bovedaMonte).toBe(15750)  // 63000 × 0.25
    expect(resultado.fletes).toBe(1250)         // 5000 × 0.25
    expect(resultado.utilidades).toBe(8000)     // 32000 × 0.25
  })

  test('Pago 100% distribuye completo', () => {
    const resultado = calcularDistribucionParcial(
      100000,        // montoPagado (100%)
      totalVenta,
      montoBovedaMonte,
      montoFletes,
      montoUtilidades,
    )

    expect(resultado.bovedaMonte).toBe(63000)
    expect(resultado.fletes).toBe(5000)
    expect(resultado.utilidades).toBe(32000)
  })

  test('Pago 0% = 0 en todo', () => {
    const resultado = calcularDistribucionParcial(
      0,             // Sin pago
      totalVenta,
      montoBovedaMonte,
      montoFletes,
      montoUtilidades,
    )

    expect(resultado.bovedaMonte).toBe(0)
    expect(resultado.fletes).toBe(0)
    expect(resultado.utilidades).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 4: calcularDistribucionGYA (formulas.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('📐 calcularDistribucionGYA (formulas.ts) - CÓDIGO REAL', () => {
  test('Distribución correcta con datos estándar', () => {
    const resultado = calcularDistribucionGYA({
      cantidad: 10,
      precioVenta: 10000,
      precioCompra: 6300,
      precioFlete: 500,
    })

    expect(resultado.bovedaMonte).toBe(63000)
    expect(resultado.fletes).toBe(5000)
    expect(resultado.utilidades).toBe(32000)
    expect(resultado.total).toBe(100000)
  })

  test('Distribución con cantidad 0 retorna todo 0', () => {
    const resultado = calcularDistribucionGYA({
      cantidad: 0,
      precioVenta: 10000,
      precioCompra: 6300,
      precioFlete: 500,
    })

    expect(resultado.bovedaMonte).toBe(0)
    expect(resultado.fletes).toBe(0)
    expect(resultado.utilidades).toBe(0)
    expect(resultado.total).toBe(0)
  })

  test('Usa FLETE_DEFAULT cuando no se especifica', () => {
    const resultado = calcularDistribucionGYA({
      cantidad: 10,
      precioVenta: 10000,
      precioCompra: 6300,
      // precioFlete no especificado, usa 500 por defecto
    })

    expect(resultado.fletes).toBe(5000) // 500 × 10
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 5: calcularVentaCompleta (formulas.ts) - Estados de pago
// ═══════════════════════════════════════════════════════════════════════════════

describe('💳 calcularVentaCompleta (formulas.ts) - Estados de Pago - CÓDIGO REAL', () => {
  test('Estado COMPLETO cuando montoPagado >= totalVenta', () => {
    const resultado = calcularVentaCompleta({
      cantidad: 10,
      precioVenta: 10000,
      precioCompra: 6300,
      precioFlete: 500,
      montoPagado: 100000, // 100% pagado
    })

    expect(resultado.estadoPago).toBe('completo')
    expect(resultado.proporcionPagada).toBe(1)
    expect(resultado.montoRestante).toBe(0)
  })

  test('Estado PARCIAL cuando hay pago incompleto', () => {
    const resultado = calcularVentaCompleta({
      cantidad: 10,
      precioVenta: 10000,
      precioCompra: 6300,
      precioFlete: 500,
      montoPagado: 50000, // 50% pagado
    })

    expect(resultado.estadoPago).toBe('parcial')
    expect(resultado.proporcionPagada).toBe(0.5)
    expect(resultado.montoRestante).toBe(50000)
  })

  test('Estado PENDIENTE cuando montoPagado = 0', () => {
    const resultado = calcularVentaCompleta({
      cantidad: 10,
      precioVenta: 10000,
      precioCompra: 6300,
      precioFlete: 500,
      montoPagado: 0, // Sin pago
    })

    expect(resultado.estadoPago).toBe('pendiente')
    expect(resultado.proporcionPagada).toBe(0)
    expect(resultado.montoRestante).toBe(100000)
  })

  test('distribucionReal proporcional al pago', () => {
    const resultado = calcularVentaCompleta({
      cantidad: 10,
      precioVenta: 10000,
      precioCompra: 6300,
      precioFlete: 500,
      montoPagado: 50000, // 50%
    })

    expect(resultado.distribucionReal.bovedaMonte).toBe(31500)
    expect(resultado.distribucionReal.fletes).toBe(2500)
    expect(resultado.distribucionReal.utilidades).toBe(16000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 6: calcularDistribucionAbono (formulas.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('💰 calcularDistribucionAbono (formulas.ts) - CÓDIGO REAL', () => {
  const distribucionOriginal = {
    bovedaMonte: 63000,
    fletes: 5000,
    utilidades: 32000,
    total: 100000,
  }
  const totalVenta = 100000

  test('Abono 25% distribuye proporcionalmente', () => {
    const resultado = calcularDistribucionAbono(
      distribucionOriginal,
      totalVenta,
      25000, // 25%
    )

    expect(resultado.bovedaMonte).toBe(15750)
    expect(resultado.fletes).toBe(1250)
    expect(resultado.utilidades).toBe(8000)
  })

  test('Abono 50% distribuye proporcionalmente', () => {
    const resultado = calcularDistribucionAbono(
      distribucionOriginal,
      totalVenta,
      50000, // 50%
    )

    expect(resultado.bovedaMonte).toBe(31500)
    expect(resultado.fletes).toBe(2500)
    expect(resultado.utilidades).toBe(16000)
  })

  test('Abono 0 retorna 0', () => {
    const resultado = calcularDistribucionAbono(
      distribucionOriginal,
      totalVenta,
      0,
    )

    expect(resultado.bovedaMonte).toBe(0)
    expect(resultado.fletes).toBe(0)
    expect(resultado.utilidades).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 7: calcularCapitalBanco (formulas.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏛️ calcularCapitalBanco (formulas.ts) - CÓDIGO REAL', () => {
  test('capitalActual = historicoIngresos - historicoGastos', () => {
    const capital = calcularCapitalBanco(500000, 200000)
    expect(capital).toBe(300000)
  })

  test('Capital puede ser negativo (sobregiro)', () => {
    const capital = calcularCapitalBanco(100000, 150000)
    expect(capital).toBe(-50000)
  })

  test('Capital cero cuando ingresos = gastos', () => {
    const capital = calcularCapitalBanco(100000, 100000)
    expect(capital).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 8: calcularDeudaCliente (formulas.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('📋 calcularDeudaCliente (formulas.ts) - CÓDIGO REAL', () => {
  test('Deuda = totalVentas - totalPagado', () => {
    const deuda = calcularDeudaCliente(100000, 60000)
    expect(deuda).toBe(40000)
  })

  test('Deuda mínima es 0 (no negativa)', () => {
    const deuda = calcularDeudaCliente(100000, 150000)
    expect(deuda).toBe(0) // No puede ser -50000
  })

  test('Sin deuda cuando pagó todo', () => {
    const deuda = calcularDeudaCliente(100000, 100000)
    expect(deuda).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 9: Flujo completo de venta con los valores exactos del usuario
// ═══════════════════════════════════════════════════════════════════════════════

describe('🎯 FLUJO COMPLETO - Valores exactos de verificación del usuario', () => {
  
  describe('CASO 1: Venta completa (105,000 pagados)', () => {
    test('Distribución exacta con código real', () => {
      const dist = calcularDistribucionVenta(10, 10000, 6300, true, 500)
      const parcial = calcularDistribucionParcial(
        100000, // montoPagado (solo venta, sin flete en cálculo)
        dist.ingresoVenta,
        dist.montoBovedaMonte,
        dist.montoFletes,
        dist.montoUtilidades,
      )

      expect(parcial.bovedaMonte).toBe(63000)
      expect(parcial.fletes).toBe(5000)
      expect(parcial.utilidades).toBe(32000)
    })
  })

  describe('CASO 2: Venta parcial 50%', () => {
    test('Capital proporcional, histórico 100%', () => {
      const dist = calcularDistribucionVenta(10, 10000, 6300, true, 500)
      
      // Simular pago 50%
      const parcial = calcularDistribucionParcial(
        50000, // 50% de 100000
        dist.ingresoVenta,
        dist.montoBovedaMonte,
        dist.montoFletes,
        dist.montoUtilidades,
      )

      // Capital = 50%
      expect(parcial.bovedaMonte).toBe(31500)
      expect(parcial.fletes).toBe(2500)
      expect(parcial.utilidades).toBe(16000)

      // Histórico = 100% (siempre la distribución completa)
      expect(dist.montoBovedaMonte).toBe(63000)
      expect(dist.montoFletes).toBe(5000)
      expect(dist.montoUtilidades).toBe(32000)
    })
  })

  describe('CASO 3: Venta pendiente + Abono posterior 25%', () => {
    test('Capital inicial = 0, después abono = 25%', () => {
      const dist = calcularDistribucionVenta(10, 10000, 6300, true, 500)
      
      // Estado inicial: pendiente (0 pagado)
      const inicial = calcularDistribucionParcial(
        0,
        dist.ingresoVenta,
        dist.montoBovedaMonte,
        dist.montoFletes,
        dist.montoUtilidades,
      )

      expect(inicial.bovedaMonte).toBe(0)
      expect(inicial.fletes).toBe(0)
      expect(inicial.utilidades).toBe(0)

      // Abono posterior 25% = 25000
      const abono = calcularDistribucionAbono(
        {
          bovedaMonte: dist.montoBovedaMonte,
          fletes: dist.montoFletes,
          utilidades: dist.montoUtilidades,
          total: dist.ingresoVenta,
        },
        dist.ingresoVenta,
        25000, // 25%
      )

      expect(abono.bovedaMonte).toBe(15750)
      expect(abono.fletes).toBe(1250)
      expect(abono.utilidades).toBe(8000)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 10: Resumen final - Verificación con código real
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏆 RESUMEN FINAL - CÓDIGO REAL DEL SISTEMA VERIFICADO', () => {
  test('✅ Fórmulas sagradas: business-logic.service.ts funciona correctamente', () => {
    const resultado = calcularDistribucionVenta(10, 10000, 6300, true, 500)
    expect(resultado.montoBovedaMonte).toBe(63000)
    expect(resultado.montoFletes).toBe(5000)
    expect(resultado.montoUtilidades).toBe(32000)
  })

  test('✅ Fórmulas sagradas: formulas.ts funciona correctamente', () => {
    const resultado = calcularDistribucionGYA({
      cantidad: 10,
      precioVenta: 10000,
      precioCompra: 6300,
      precioFlete: 500,
    })
    expect(resultado.bovedaMonte).toBe(63000)
    expect(resultado.fletes).toBe(5000)
    expect(resultado.utilidades).toBe(32000)
  })

  test('✅ Distribución parcial funciona correctamente', () => {
    const resultado = calcularDistribucionParcial(50000, 100000, 63000, 5000, 32000)
    expect(resultado.bovedaMonte).toBe(31500)
    expect(resultado.fletes).toBe(2500)
    expect(resultado.utilidades).toBe(16000)
  })

  test('✅ Estados de pago funcionan correctamente', () => {
    const completo = calcularVentaCompleta({ cantidad: 10, precioVenta: 10000, precioCompra: 6300, montoPagado: 100000 })
    const parcial = calcularVentaCompleta({ cantidad: 10, precioVenta: 10000, precioCompra: 6300, montoPagado: 50000 })
    const pendiente = calcularVentaCompleta({ cantidad: 10, precioVenta: 10000, precioCompra: 6300, montoPagado: 0 })

    expect(completo.estadoPago).toBe('completo')
    expect(parcial.estadoPago).toBe('parcial')
    expect(pendiente.estadoPago).toBe('pendiente')
  })

  test('✅ Capital bancario se calcula correctamente', () => {
    expect(calcularCapitalBanco(500000, 200000)).toBe(300000)
    expect(calcularCapitalBanco(100000, 150000)).toBe(-50000) // Sobregiro
  })

  test('✅ Abonos se distribuyen proporcionalmente', () => {
    const abono = calcularDistribucionAbono(
      { bovedaMonte: 63000, fletes: 5000, utilidades: 32000, total: 100000 },
      100000,
      25000,
    )
    expect(abono.bovedaMonte).toBe(15750)
    expect(abono.fletes).toBe(1250)
    expect(abono.utilidades).toBe(8000)
  })

  test('🎉 SISTEMA VERIFICADO CON CÓDIGO REAL', () => {
    // Este test confirma que estamos usando las funciones REALES del sistema
    expect(typeof calcularDistribucionVenta).toBe('function')
    expect(typeof calcularDistribucionParcial).toBe('function')
    expect(typeof calcularDistribucionGYA).toBe('function')
    expect(typeof calcularVentaCompleta).toBe('function')
    expect(typeof calcularDistribucionAbono).toBe('function')
    expect(typeof calcularCapitalBanco).toBe('function')
    expect(typeof calcularDeudaCliente).toBe('function')
  })
})
