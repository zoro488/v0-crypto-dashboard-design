/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧪 CHRONOS 2026 — TESTS DE LÓGICA SAGRADA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 20 casos críticos para verificar:
 * - Distribución de ventas a 3 bancos
 * - Pagos completos, parciales y pendientes
 * - Abonos posteriores
 * - Transferencias atómicas
 * - Stock exacto
 * - Capital bancario
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  calcularDistribucionVenta,
  calcularDistribucionParcial,
  calcularVentaCompleta,
  calcularAbono,
  calcularTransferencia,
  calcularStock,
  calcularCapitalBanco,
  recalcularCliente,
  recalcularDistribuidor,
  validarVenta,
  validarOrdenCompra,
  validarTransferencia,
} from '@/app/lib/services/logic'
import type { Venta, OrdenCompra, Banco, Cliente, Distribuidor } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE PRUEBA
// ═══════════════════════════════════════════════════════════════════════════

const crearVentaPrueba = (overrides: Partial<Venta> = {}): Venta => ({
  id: 'V2412-TEST',
  fecha: new Date().toISOString(),
  ocRelacionada: 'OC0001',
  clienteId: 'CLI001',
  cliente: 'Cliente Test',
  cantidad: 10,
  precioVenta: 10000,
  precioCompra: 6300,
  ingreso: 100000,
  totalVenta: 100000,
  precioTotalVenta: 100000,
  flete: 'Aplica',
  fleteUtilidad: 5000,
  precioFlete: 5000,
  utilidad: 32000,
  ganancia: 32000,
  bovedaMonte: 63000,
  distribucionBancos: {
    bovedaMonte: 63000,
    fletes: 5000,
    utilidades: 32000,
  },
  estadoPago: 'completo',
  estatus: 'Pagado',
  montoPagado: 100000,
  montoRestante: 0,
  adeudo: 0,
  keywords: ['cliente test'],
  createdAt: new Date().toISOString(),
  ...overrides,
})

const crearBancoPrueba = (id: string, capital: number): Banco => ({
  id: id as any,
  nombre: `Banco ${id}`,
  icon: '🏦',
  color: 'cyan',
  tipo: 'operativo',
  descripcion: 'Banco de prueba',
  moneda: 'MXN',
  capitalActual: capital,
  capitalInicial: 0,
  historicoIngresos: capital > 0 ? capital : 0,
  historicoGastos: capital < 0 ? Math.abs(capital) : 0,
  historicoTransferencias: 0,
  estado: capital < 0 ? 'negativo' : 'activo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const crearOCPrueba = (overrides: Partial<OrdenCompra> = {}): OrdenCompra => ({
  id: 'OC0001',
  fecha: new Date().toISOString(),
  distribuidorId: 'DIST001',
  distribuidor: 'Distribuidor Test',
  origen: 'Test',
  cantidad: 100,
  costoDistribuidor: 6000,
  costoTransporte: 300,
  costoPorUnidad: 6300,
  costoTotal: 630000,
  stockActual: 100,
  stockInicial: 100,
  pagoDistribuidor: 0,
  pagoInicial: 0,
  deuda: 630000,
  estado: 'pendiente',
  keywords: ['test'],
  createdAt: new Date().toISOString(),
  ...overrides,
})

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — DISTRIBUCIÓN DE VENTAS
// ═══════════════════════════════════════════════════════════════════════════

describe('Distribución de Ventas a 3 Bancos', () => {
  test('1. Venta completa debe distribuirse correctamente a 3 bancos', () => {
    // Datos del ejemplo real
    const precioVenta = 10000
    const precioCompra = 6300
    const precioFlete = 500
    const cantidad = 10
    
    const distribucion = calcularDistribucionVenta(precioVenta, precioCompra, precioFlete, cantidad)
    
    // Bóveda Monte = precioCompra × cantidad = 6300 × 10 = 63,000
    expect(distribucion.bovedaMonte).toBe(63000)
    
    // Fletes = precioFlete × cantidad = 500 × 10 = 5,000
    expect(distribucion.fletes).toBe(5000)
    
    // Utilidades = (10000 - 6300 - 500) × 10 = 32,000
    expect(distribucion.utilidades).toBe(32000)
    
    // Total = 63000 + 5000 + 32000 = 100,000 = precioVenta × cantidad
    expect(distribucion.total).toBe(100000)
    expect(distribucion.total).toBe(precioVenta * cantidad)
  })

  test('2. Venta sin flete debe distribuirse solo a 2 bancos', () => {
    const distribucion = calcularDistribucionVenta(10000, 6300, 0, 10)
    
    expect(distribucion.bovedaMonte).toBe(63000)
    expect(distribucion.fletes).toBe(0)
    expect(distribucion.utilidades).toBe(37000) // 10000 - 6300 = 3700 por unidad
    expect(distribucion.total).toBe(100000)
  })

  test('3. Venta con cantidad 1 debe calcular correctamente', () => {
    const distribucion = calcularDistribucionVenta(15000, 8000, 1000, 1)
    
    expect(distribucion.bovedaMonte).toBe(8000)
    expect(distribucion.fletes).toBe(1000)
    expect(distribucion.utilidades).toBe(6000)
    expect(distribucion.total).toBe(15000)
  })

  test('4. Debe rechazar cantidad cero o negativa', () => {
    expect(() => calcularDistribucionVenta(10000, 6000, 500, 0)).toThrow()
    expect(() => calcularDistribucionVenta(10000, 6000, 500, -5)).toThrow()
  })

  test('5. Debe rechazar precios negativos', () => {
    expect(() => calcularDistribucionVenta(-10000, 6000, 500, 10)).toThrow()
    expect(() => calcularDistribucionVenta(10000, -6000, 500, 10)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — PAGOS PARCIALES
// ═══════════════════════════════════════════════════════════════════════════

describe('Pagos Parciales y Proporcionales', () => {
  test('6. Pago 50% debe distribuir proporcionalmente al capital', () => {
    const distribucionTotal = calcularDistribucionVenta(10000, 6300, 500, 10)
    const totalVenta = 100000
    const montoPagado = 50000 // 50%
    
    const parcial = calcularDistribucionParcial(distribucionTotal, montoPagado, totalVenta)
    
    expect(parcial.proporcion).toBe(0.5)
    expect(parcial.capitalBovedaMonte).toBe(31500) // 63000 × 0.5
    expect(parcial.capitalFletes).toBe(2500)       // 5000 × 0.5
    expect(parcial.capitalUtilidades).toBe(16000)  // 32000 × 0.5
    
    // Histórico siempre es 100%
    expect(parcial.bovedaMonte).toBe(63000)
    expect(parcial.fletes).toBe(5000)
    expect(parcial.utilidades).toBe(32000)
  })

  test('7. Pago 25% debe aplicar proporción correcta', () => {
    const distribucionTotal = calcularDistribucionVenta(10000, 6300, 500, 10)
    const parcial = calcularDistribucionParcial(distribucionTotal, 25000, 100000)
    
    expect(parcial.proporcion).toBe(0.25)
    expect(parcial.capitalBovedaMonte).toBe(15750)
    expect(parcial.capitalFletes).toBe(1250)
    expect(parcial.capitalUtilidades).toBe(8000)
  })

  test('8. Pago pendiente (0%) no debe afectar capital', () => {
    const distribucionTotal = calcularDistribucionVenta(10000, 6300, 500, 10)
    const parcial = calcularDistribucionParcial(distribucionTotal, 0, 100000)
    
    expect(parcial.proporcion).toBe(0)
    expect(parcial.capitalBovedaMonte).toBe(0)
    expect(parcial.capitalFletes).toBe(0)
    expect(parcial.capitalUtilidades).toBe(0)
  })

  test('9. Pago mayor al total debe limitarse a 100%', () => {
    const distribucionTotal = calcularDistribucionVenta(10000, 6300, 500, 10)
    const parcial = calcularDistribucionParcial(distribucionTotal, 150000, 100000)
    
    expect(parcial.proporcion).toBe(1) // Máximo 100%
    expect(parcial.capitalBovedaMonte).toBe(63000)
  })

  test('10. calcularVentaCompleta debe incluir todos los campos', () => {
    const resultado = calcularVentaCompleta(10000, 6300, 500, 10, 50000)
    
    expect(resultado.totalVenta).toBe(100000)
    expect(resultado.montoBovedaMonte).toBe(63000)
    expect(resultado.montoFletes).toBe(5000)
    expect(resultado.montoUtilidades).toBe(32000)
    expect(resultado.proporcionPagada).toBe(0.5)
    expect(resultado.distribucionParcial?.bovedaMonte).toBe(31500)
    expect(resultado.margenPorcentaje).toBeCloseTo(32, 0) // 32%
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — ABONOS
// ═══════════════════════════════════════════════════════════════════════════

describe('Abonos Posteriores', () => {
  test('11. Abono a venta pendiente debe calcular distribución proporcional', () => {
    const venta = crearVentaPrueba({
      estadoPago: 'pendiente',
      montoPagado: 0,
      montoRestante: 100000,
    })
    
    const resultado = calcularAbono(venta, 25000)
    
    expect(resultado.nuevoMontoPagado).toBe(25000)
    expect(resultado.nuevoMontoRestante).toBe(75000)
    expect(resultado.nuevoEstado).toBe('parcial')
    expect(resultado.distribucionAdicional.total).toBe(25000)
    expect(resultado.movimientos.length).toBe(3) // 3 bancos
  })

  test('12. Abono que completa la venta debe cambiar estado a completo', () => {
    const venta = crearVentaPrueba({
      estadoPago: 'parcial',
      montoPagado: 75000,
      montoRestante: 25000,
    })
    
    const resultado = calcularAbono(venta, 25000)
    
    expect(resultado.nuevoMontoPagado).toBe(100000)
    expect(resultado.nuevoMontoRestante).toBe(0)
    expect(resultado.nuevoEstado).toBe('completo')
  })

  test('13. Abono que excede el restante debe limitarse', () => {
    const venta = crearVentaPrueba({
      estadoPago: 'parcial',
      montoPagado: 90000,
      montoRestante: 10000,
    })
    
    const resultado = calcularAbono(venta, 50000) // Intenta abonar más
    
    expect(resultado.nuevoMontoPagado).toBe(100000) // Limitado al total
    expect(resultado.nuevoMontoRestante).toBe(0)
    expect(resultado.nuevoEstado).toBe('completo')
  })

  test('14. Abono debe generar movimientos para cada banco afectado', () => {
    const venta = crearVentaPrueba({
      estadoPago: 'pendiente',
      montoPagado: 0,
    })
    
    const resultado = calcularAbono(venta, 50000)
    
    // Debe haber movimientos para los 3 bancos
    const bancoIds = resultado.movimientos.map(m => m.bancoId)
    expect(bancoIds).toContain('boveda_monte')
    expect(bancoIds).toContain('flete_sur')
    expect(bancoIds).toContain('utilidades')
  })

  test('15. Abono cero o negativo debe rechazarse', () => {
    const venta = crearVentaPrueba()
    
    expect(() => calcularAbono(venta, 0)).toThrow()
    expect(() => calcularAbono(venta, -1000)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — TRANSFERENCIAS
// ═══════════════════════════════════════════════════════════════════════════

describe('Transferencias Atómicas entre Bancos', () => {
  test('16. Transferencia debe ser atómica (origen -monto, destino +monto)', () => {
    const bancoOrigen = crearBancoPrueba('boveda_monte', 100000)
    const bancoDestino = crearBancoPrueba('profit', 50000)
    
    const resultado = calcularTransferencia(bancoOrigen, bancoDestino, 30000)
    
    expect(resultado.bancoOrigenNuevo.capitalActual).toBe(70000)
    expect(resultado.bancoDestinoNuevo.capitalActual).toBe(80000)
    
    // Históricos
    expect(resultado.bancoOrigenNuevo.historicoGastos).toBe(30000)
    expect(resultado.bancoDestinoNuevo.historicoIngresos).toBe(80000) // 50000 + 30000
  })

  test('17. Transferencia debe generar 2 movimientos (salida y entrada)', () => {
    const bancoOrigen = crearBancoPrueba('boveda_monte', 100000)
    const bancoDestino = crearBancoPrueba('profit', 50000)
    
    const resultado = calcularTransferencia(bancoOrigen, bancoDestino, 30000, 'Test transfer')
    
    expect(resultado.movimientoOrigen.tipoMovimiento).toBe('transferencia_salida')
    expect(resultado.movimientoOrigen.monto).toBe(-30000)
    
    expect(resultado.movimientoDestino.tipoMovimiento).toBe('transferencia_entrada')
    expect(resultado.movimientoDestino.monto).toBe(30000)
  })

  test('18. Transferencia sin fondos suficientes debe rechazarse', () => {
    const bancoOrigen = crearBancoPrueba('boveda_monte', 10000)
    const bancoDestino = crearBancoPrueba('profit', 50000)
    
    expect(() => calcularTransferencia(bancoOrigen, bancoDestino, 30000)).toThrow(/Fondos insuficientes/)
  })

  test('19. Transferencia al mismo banco debe rechazarse', () => {
    const banco = crearBancoPrueba('boveda_monte', 100000)
    
    expect(() => calcularTransferencia(banco, banco, 10000)).toThrow(/deben ser diferentes/)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — STOCK Y CAPITAL
// ═══════════════════════════════════════════════════════════════════════════

describe('Stock y Capital Bancario', () => {
  test('20. Stock debe ser stockInicial - unidadesVendidas', () => {
    const oc = crearOCPrueba({ stockInicial: 100, stockActual: 100 })
    const ventas: Venta[] = [
      crearVentaPrueba({ ocRelacionada: 'OC0001', cantidad: 30 }),
      crearVentaPrueba({ ocRelacionada: 'OC0001', cantidad: 20 }),
    ]
    
    const stockActual = calcularStock(oc, ventas)
    
    expect(stockActual).toBe(50) // 100 - 30 - 20
  })

  test('Stock nunca debe ser negativo', () => {
    const oc = crearOCPrueba({ stockInicial: 10, stockActual: 10 })
    const ventas: Venta[] = [
      crearVentaPrueba({ ocRelacionada: 'OC0001', cantidad: 50 }), // Más que el stock
    ]
    
    const stockActual = calcularStock(oc, ventas)
    
    expect(stockActual).toBe(0) // Mínimo 0
  })

  test('Capital bancario = historicoIngresos - historicoGastos', () => {
    const banco: Banco = {
      ...crearBancoPrueba('test', 0),
      historicoIngresos: 500000,
      historicoGastos: 150000,
      capitalActual: 0, // Será recalculado
    }
    
    const capital = calcularCapitalBanco(banco)
    
    expect(capital).toBe(350000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — VALIDACIONES
// ═══════════════════════════════════════════════════════════════════════════

describe('Validaciones', () => {
  test('Venta sin cliente debe ser inválida', () => {
    const resultado = validarVenta({ cantidad: 10, precioVenta: 1000 })
    
    expect(resultado.valido).toBe(false)
    expect(resultado.errores).toContain('Cliente es requerido')
  })

  test('Venta completa debe ser válida', () => {
    const resultado = validarVenta({
      clienteId: 'CLI001',
      ocRelacionada: 'OC0001',
      cantidad: 10,
      precioVenta: 10000,
    })
    
    expect(resultado.valido).toBe(true)
    expect(resultado.errores).toHaveLength(0)
  })

  test('Transferencia al mismo banco debe ser inválida', () => {
    const resultado = validarTransferencia('boveda_monte', 'boveda_monte', 1000)
    
    expect(resultado.valido).toBe(false)
    expect(resultado.errores).toContain('Los bancos deben ser diferentes')
  })

  test('Orden de compra sin distribuidor debe ser inválida', () => {
    const resultado = validarOrdenCompra({ cantidad: 100, costoDistribuidor: 6000 })
    
    expect(resultado.valido).toBe(false)
    expect(resultado.errores).toContain('Distribuidor es requerido')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TESTS — RECÁLCULOS DE ENTIDADES
// ═══════════════════════════════════════════════════════════════════════════

describe('Recálculos de Clientes y Distribuidores', () => {
  test('Recálculo de cliente debe sumar todas sus ventas', () => {
    const cliente: Cliente = {
      id: 'CLI001',
      nombre: 'Test',
      actual: 0,
      deuda: 0,
      abonos: 0,
      pendiente: 0,
      totalVentas: 0,
      totalPagado: 0,
      deudaTotal: 0,
      numeroCompras: 0,
      keywords: [],
      estado: 'activo',
      createdAt: new Date().toISOString(),
    }
    
    const ventas: Venta[] = [
      crearVentaPrueba({ clienteId: 'CLI001', precioTotalVenta: 50000, montoPagado: 30000 }),
      crearVentaPrueba({ clienteId: 'CLI001', precioTotalVenta: 30000, montoPagado: 30000 }),
    ]
    
    const actualizado = recalcularCliente(cliente, ventas)
    
    expect(actualizado.totalVentas).toBe(80000)
    expect(actualizado.totalPagado).toBe(60000)
    expect(actualizado.deudaTotal).toBe(20000)
    expect(actualizado.numeroCompras).toBe(2)
  })

  test('Recálculo de distribuidor debe sumar todas sus OC', () => {
    const distribuidor: Distribuidor = {
      id: 'DIST001',
      nombre: 'Test Dist',
      costoTotal: 0,
      abonos: 0,
      pendiente: 0,
      totalOrdenesCompra: 0,
      totalPagado: 0,
      deudaTotal: 0,
      numeroOrdenes: 0,
      keywords: [],
      estado: 'activo',
      createdAt: new Date().toISOString(),
    }
    
    const ordenes: OrdenCompra[] = [
      crearOCPrueba({ distribuidorId: 'DIST001', costoTotal: 100000, pagoDistribuidor: 50000 }),
      crearOCPrueba({ distribuidorId: 'DIST001', costoTotal: 80000, pagoDistribuidor: 80000 }),
    ]
    
    const actualizado = recalcularDistribuidor(distribuidor, ordenes)
    
    expect(actualizado.totalOrdenesCompra).toBe(180000)
    expect(actualizado.totalPagado).toBe(130000)
    expect(actualizado.deudaTotal).toBe(50000)
    expect(actualizado.numeroOrdenes).toBe(2)
  })
})
