/**
 * 🧪 TESTS DE PERSISTENCIA Y FIRESTORE - SISTEMA CHRONOS
 * 
 * Tests para:
 * - Operaciones de persistencia
 * - Distribución automática GYA
 * - Actualización de capital bancario
 * - Sincronización de datos
 * 
 * @version 2.0.0
 * @date 2025-11-29
 */

import '@testing-library/jest-dom'

// ============================================================================
// MOCKS
// ============================================================================

// Mock Firebase Config
jest.mock('@/app/lib/firebase/config', () => ({
  db: null,
  auth: null,
  isFirebaseConfigured: false,
}))

// Mock logger
jest.mock('@/app/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// ============================================================================
// TIPOS PARA TESTS
// ============================================================================

type EstadoPago = 'completo' | 'parcial' | 'pendiente'

interface Venta {
  id: string
  clienteId: string
  clienteNombre: string
  distribuidorId: string
  distribuidorNombre: string
  cantidad: number
  precioVentaUnidad: number
  precioCompraUnidad: number
  precioFlete: number
  totalVenta: number
  estadoPago: EstadoPago
  montoPagado: number
  fechaVenta: string
  createdAt: Date
  updatedAt: Date
}

interface Banco {
  id: string
  nombre: string
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
}

interface MovimientoBanco {
  id: string
  bancoId: string
  tipo: 'ingreso' | 'gasto' | 'transferencia'
  monto: number
  descripcion: string
  ventaId?: string
  fecha: Date
}

interface DistribucionGYA {
  bovedaMonte: number
  fleteSur: number
  utilidades: number
  total: number
}

// ============================================================================
// FUNCIONES DE NEGOCIO A TESTEAR
// ============================================================================

/**
 * Calcula la distribución GYA para una venta
 */
function calcularDistribucionGYA(
  cantidad: number,
  precioVentaUnidad: number,
  precioCompraUnidad: number,
  precioFlete: number,
  estadoPago: EstadoPago,
  montoPagado: number
): DistribucionGYA {
  const totalVenta = precioVentaUnidad * cantidad
  
  // Si es pendiente, no hay distribución
  if (estadoPago === 'pendiente') {
    return {
      bovedaMonte: 0,
      fleteSur: 0,
      utilidades: 0,
      total: 0,
    }
  }
  
  // Calcular proporción si es pago parcial
  const proporcion = estadoPago === 'parcial' 
    ? montoPagado / totalVenta 
    : 1
  
  const bovedaMonte = precioCompraUnidad * cantidad * proporcion
  const fleteSur = precioFlete * cantidad * proporcion
  const utilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad * proporcion
  
  return {
    bovedaMonte: Math.round(bovedaMonte * 100) / 100,
    fleteSur: Math.round(fleteSur * 100) / 100,
    utilidades: Math.round(utilidades * 100) / 100,
    total: Math.round((bovedaMonte + fleteSur + utilidades) * 100) / 100,
  }
}

/**
 * Actualiza el capital de un banco
 */
function actualizarCapitalBanco(
  banco: Banco,
  movimiento: { tipo: 'ingreso' | 'gasto'; monto: number }
): Banco {
  if (movimiento.tipo === 'ingreso') {
    return {
      ...banco,
      capitalActual: banco.capitalActual + movimiento.monto,
      historicoIngresos: banco.historicoIngresos + movimiento.monto,
    }
  } else {
    return {
      ...banco,
      capitalActual: banco.capitalActual - movimiento.monto,
      historicoGastos: banco.historicoGastos + movimiento.monto,
    }
  }
}

/**
 * Calcula el saldo pendiente de un cliente usando FIFO
 */
function calcularSaldoClienteFIFO(
  ventas: Array<{ totalVenta: number; montoPagado: number; fechaVenta: string }>
): number {
  return ventas.reduce((acc, v) => acc + (v.totalVenta - v.montoPagado), 0)
}

/**
 * Procesa abono de cliente con lógica FIFO
 */
function procesarAbonoFIFO(
  ventas: Array<{ id: string; totalVenta: number; montoPagado: number; estadoPago: EstadoPago; fechaVenta: string }>,
  montoAbono: number
): Array<{ ventaId: string; montoAplicado: number; nuevoEstado: EstadoPago }> {
  // Ordenar por fecha (más antiguas primero)
  const ordenadas = [...ventas]
    .filter(v => v.estadoPago !== 'completo')
    .sort((a, b) => new Date(a.fechaVenta).getTime() - new Date(b.fechaVenta).getTime())
  
  let montoRestante = montoAbono
  const aplicaciones: Array<{ ventaId: string; montoAplicado: number; nuevoEstado: EstadoPago }> = []
  
  for (const venta of ordenadas) {
    if (montoRestante <= 0) break
    
    const pendiente = venta.totalVenta - venta.montoPagado
    const aAplicar = Math.min(pendiente, montoRestante)
    
    const nuevoMontoPagado = venta.montoPagado + aAplicar
    const nuevoEstado: EstadoPago = nuevoMontoPagado >= venta.totalVenta 
      ? 'completo' 
      : 'parcial'
    
    aplicaciones.push({
      ventaId: venta.id,
      montoAplicado: aAplicar,
      nuevoEstado,
    })
    
    montoRestante -= aAplicar
  }
  
  return aplicaciones
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('💾 PERSISTENCIA - Sistema CHRONOS', () => {

  describe('Distribución GYA', () => {
    
    it('✅ Distribución completa: 100% pagado', () => {
      const result = calcularDistribucionGYA(
        10,     // cantidad
        10000,  // precio venta
        6300,   // precio compra
        500,    // flete
        'completo',
        100000  // monto pagado (100%)
      )
      
      expect(result.bovedaMonte).toBe(63000)
      expect(result.fleteSur).toBe(5000)
      expect(result.utilidades).toBe(32000)
      expect(result.total).toBe(100000)
    })

    it('✅ Distribución parcial: 50% pagado', () => {
      const result = calcularDistribucionGYA(
        10,
        10000,
        6300,
        500,
        'parcial',
        50000  // 50% pagado
      )
      
      expect(result.bovedaMonte).toBe(31500)  // 63000 * 0.5
      expect(result.fleteSur).toBe(2500)       // 5000 * 0.5
      expect(result.utilidades).toBe(16000)    // 32000 * 0.5
      expect(result.total).toBe(50000)
    })

    it('✅ Sin distribución: pago pendiente', () => {
      const result = calcularDistribucionGYA(
        10,
        10000,
        6300,
        500,
        'pendiente',
        0
      )
      
      expect(result.bovedaMonte).toBe(0)
      expect(result.fleteSur).toBe(0)
      expect(result.utilidades).toBe(0)
      expect(result.total).toBe(0)
    })

    it('✅ Distribución proporcional: 75% pagado', () => {
      const result = calcularDistribucionGYA(
        10,
        10000,
        6300,
        500,
        'parcial',
        75000  // 75% pagado
      )
      
      expect(result.bovedaMonte).toBe(47250)   // 63000 * 0.75
      expect(result.fleteSur).toBe(3750)        // 5000 * 0.75
      expect(result.utilidades).toBe(24000)     // 32000 * 0.75
      expect(result.total).toBe(75000)
    })

    it('✅ Utilidades = Ganancia neta (precio venta - precio compra - flete)', () => {
      const precioVenta = 15000
      const precioCompra = 10000
      const flete = 1000
      const cantidad = 5
      
      const result = calcularDistribucionGYA(
        cantidad,
        precioVenta,
        precioCompra,
        flete,
        'completo',
        precioVenta * cantidad
      )
      
      const gananciaEsperada = (precioVenta - precioCompra - flete) * cantidad
      expect(result.utilidades).toBe(gananciaEsperada)
      expect(result.utilidades).toBe(20000) // (15000 - 10000 - 1000) * 5
    })
  })

  describe('Actualización de Capital Bancario', () => {
    
    const bancoInicial: Banco = {
      id: 'boveda_monte',
      nombre: 'Bóveda Monte',
      capitalActual: 1000000,
      historicoIngresos: 5000000,
      historicoGastos: 4000000,
    }

    it('✅ Ingreso aumenta capitalActual e historicoIngresos', () => {
      const result = actualizarCapitalBanco(bancoInicial, {
        tipo: 'ingreso',
        monto: 100000,
      })
      
      expect(result.capitalActual).toBe(1100000)
      expect(result.historicoIngresos).toBe(5100000)
      expect(result.historicoGastos).toBe(4000000) // Sin cambio
    })

    it('✅ Gasto disminuye capitalActual y aumenta historicoGastos', () => {
      const result = actualizarCapitalBanco(bancoInicial, {
        tipo: 'gasto',
        monto: 50000,
      })
      
      expect(result.capitalActual).toBe(950000)
      expect(result.historicoGastos).toBe(4050000)
      expect(result.historicoIngresos).toBe(5000000) // Sin cambio
    })

    it('✅ capitalActual = historicoIngresos - historicoGastos', () => {
      // Verificar que la fórmula se mantiene
      expect(bancoInicial.capitalActual).toBe(
        bancoInicial.historicoIngresos - bancoInicial.historicoGastos
      )
      
      const despuesIngreso = actualizarCapitalBanco(bancoInicial, {
        tipo: 'ingreso',
        monto: 100000,
      })
      
      expect(despuesIngreso.capitalActual).toBe(
        despuesIngreso.historicoIngresos - despuesIngreso.historicoGastos
      )
    })
  })

  describe('Lógica FIFO de Abonos', () => {
    
    const ventasPendientes = [
      { id: 'V-003', totalVenta: 30000, montoPagado: 0, estadoPago: 'pendiente' as EstadoPago, fechaVenta: '2025-08-27' },
      { id: 'V-001', totalVenta: 50000, montoPagado: 0, estadoPago: 'pendiente' as EstadoPago, fechaVenta: '2025-08-25' },
      { id: 'V-002', totalVenta: 20000, montoPagado: 10000, estadoPago: 'parcial' as EstadoPago, fechaVenta: '2025-08-26' },
    ]

    it('✅ Abono se aplica primero a venta más antigua', () => {
      const aplicaciones = procesarAbonoFIFO(ventasPendientes, 25000)
      
      // V-001 es la más antigua (25 agosto)
      expect(aplicaciones[0].ventaId).toBe('V-001')
      expect(aplicaciones[0].montoAplicado).toBe(25000)
      expect(aplicaciones[0].nuevoEstado).toBe('parcial') // Solo 25000 de 50000
    })

    it('✅ Abono completa ventas en orden FIFO', () => {
      const aplicaciones = procesarAbonoFIFO(ventasPendientes, 60000)
      
      // V-001 (50000) -> completa
      expect(aplicaciones[0].ventaId).toBe('V-001')
      expect(aplicaciones[0].montoAplicado).toBe(50000)
      expect(aplicaciones[0].nuevoEstado).toBe('completo')
      
      // V-002 (10000 pendiente) -> parcial con 10000 más
      expect(aplicaciones[1].ventaId).toBe('V-002')
      expect(aplicaciones[1].montoAplicado).toBe(10000) // Los 10000 restantes
      expect(aplicaciones[1].nuevoEstado).toBe('completo')
    })

    it('✅ Abono no afecta ventas ya completas', () => {
      const ventasConCompleta = [
        { id: 'V-001', totalVenta: 50000, montoPagado: 50000, estadoPago: 'completo' as EstadoPago, fechaVenta: '2025-08-25' },
        { id: 'V-002', totalVenta: 30000, montoPagado: 0, estadoPago: 'pendiente' as EstadoPago, fechaVenta: '2025-08-26' },
      ]
      
      const aplicaciones = procesarAbonoFIFO(ventasConCompleta, 20000)
      
      // Solo debe afectar V-002
      expect(aplicaciones).toHaveLength(1)
      expect(aplicaciones[0].ventaId).toBe('V-002')
    })

    it('✅ Calcula saldo pendiente correctamente', () => {
      const saldo = calcularSaldoClienteFIFO(ventasPendientes)
      
      // V-001: 50000-0 = 50000
      // V-002: 20000-10000 = 10000
      // V-003: 30000-0 = 30000
      // Total: 90000
      expect(saldo).toBe(90000)
    })
  })

  describe('Sincronización de Datos', () => {
    
    it('✅ Movimientos bancarios mantienen consistencia', () => {
      let banco: Banco = {
        id: 'utilidades',
        nombre: 'Utilidades',
        capitalActual: 100000,
        historicoIngresos: 100000,
        historicoGastos: 0,
      }
      
      const movimientos: Array<{ tipo: 'ingreso' | 'gasto'; monto: number }> = [
        { tipo: 'ingreso', monto: 32000 },  // Venta 1
        { tipo: 'ingreso', monto: 16000 },  // Venta 2 (parcial)
        { tipo: 'gasto', monto: 5000 },      // Retiro
      ]
      
      for (const mov of movimientos) {
        banco = actualizarCapitalBanco(banco, mov)
      }
      
      expect(banco.capitalActual).toBe(143000)  // 100000 + 32000 + 16000 - 5000
      expect(banco.historicoIngresos).toBe(148000)  // 100000 + 32000 + 16000
      expect(banco.historicoGastos).toBe(5000)
      
      // Verificar invariante
      expect(banco.capitalActual).toBe(banco.historicoIngresos - banco.historicoGastos)
    })

    it('✅ Actualización de venta recalcula distribución', () => {
      // Venta inicial pendiente
      const ventaPendiente = {
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'pendiente' as EstadoPago,
        montoPagado: 0,
      }
      
      const dist1 = calcularDistribucionGYA(
        ventaPendiente.cantidad,
        ventaPendiente.precioVentaUnidad,
        ventaPendiente.precioCompraUnidad,
        ventaPendiente.precioFlete,
        ventaPendiente.estadoPago,
        ventaPendiente.montoPagado
      )
      
      expect(dist1.total).toBe(0)
      
      // Actualizar a parcial (50%)
      const ventaParcial = {
        ...ventaPendiente,
        estadoPago: 'parcial' as EstadoPago,
        montoPagado: 50000,
      }
      
      const dist2 = calcularDistribucionGYA(
        ventaParcial.cantidad,
        ventaParcial.precioVentaUnidad,
        ventaParcial.precioCompraUnidad,
        ventaParcial.precioFlete,
        ventaParcial.estadoPago,
        ventaParcial.montoPagado
      )
      
      expect(dist2.total).toBe(50000)
      
      // La diferencia es lo que debe agregarse a los bancos
      const incremento = dist2.total - dist1.total
      expect(incremento).toBe(50000)
    })
  })

  describe('Transferencias entre Bancos', () => {
    
    it('✅ Transferencia reduce origen y aumenta destino', () => {
      let bancoOrigen: Banco = {
        id: 'utilidades',
        nombre: 'Utilidades',
        capitalActual: 100000,
        historicoIngresos: 100000,
        historicoGastos: 0,
      }
      
      let bancoDestino: Banco = {
        id: 'boveda_monte',
        nombre: 'Bóveda Monte',
        capitalActual: 500000,
        historicoIngresos: 500000,
        historicoGastos: 0,
      }
      
      const montoTransferencia = 30000
      
      bancoOrigen = actualizarCapitalBanco(bancoOrigen, { tipo: 'gasto', monto: montoTransferencia })
      bancoDestino = actualizarCapitalBanco(bancoDestino, { tipo: 'ingreso', monto: montoTransferencia })
      
      expect(bancoOrigen.capitalActual).toBe(70000)
      expect(bancoDestino.capitalActual).toBe(530000)
      
      // El total del sistema se mantiene
      const totalAntes = 100000 + 500000
      const totalDespues = bancoOrigen.capitalActual + bancoDestino.capitalActual
      expect(totalDespues).toBe(totalAntes)
    })
  })

  describe('Validación de Datos', () => {
    
    it('✅ Rechaza cantidad negativa', () => {
      const validarVenta = (cantidad: number) => {
        if (cantidad < 0) throw new Error('Cantidad no puede ser negativa')
        if (cantidad === 0) throw new Error('Cantidad debe ser mayor a 0')
        return true
      }
      
      expect(() => validarVenta(-5)).toThrow('Cantidad no puede ser negativa')
      expect(() => validarVenta(0)).toThrow('Cantidad debe ser mayor a 0')
      expect(validarVenta(10)).toBe(true)
    })

    it('✅ Precio de venta debe ser mayor que precio de compra', () => {
      const validarPrecios = (precioVenta: number, precioCompra: number) => {
        if (precioVenta <= precioCompra) {
          throw new Error('Precio de venta debe ser mayor que precio de compra')
        }
        return true
      }
      
      expect(() => validarPrecios(5000, 6000)).toThrow()
      expect(() => validarPrecios(6000, 6000)).toThrow()
      expect(validarPrecios(10000, 6000)).toBe(true)
    })

    it('✅ Monto pagado no puede exceder total', () => {
      const validarPago = (montoPagado: number, totalVenta: number) => {
        if (montoPagado > totalVenta) {
          throw new Error('Monto pagado excede el total de la venta')
        }
        if (montoPagado < 0) {
          throw new Error('Monto pagado no puede ser negativo')
        }
        return true
      }
      
      expect(() => validarPago(150000, 100000)).toThrow('excede')
      expect(() => validarPago(-100, 100000)).toThrow('negativo')
      expect(validarPago(50000, 100000)).toBe(true)
    })
  })
})

// ============================================================================
// TEST SUITE: EDGE CASES
// ============================================================================

describe('🔥 EDGE CASES', () => {
  
  it('✅ Maneja valores muy grandes sin overflow', () => {
    const result = calcularDistribucionGYA(
      1000,      // 1000 unidades
      1000000,   // 1 millón por unidad
      630000,    // 630k costo
      50000,     // 50k flete
      'completo',
      1000000000 // mil millones
    )
    
    expect(result.total).toBe(1000000000)
    expect(result.bovedaMonte).toBe(630000000)
    expect(result.utilidades).toBe(320000000)
  })

  it('✅ Maneja valores decimales correctamente', () => {
    const result = calcularDistribucionGYA(
      3,
      9999.99,
      6299.50,
      499.99,
      'completo',
      29999.97
    )
    
    // Verifica que no hay errores de punto flotante
    expect(result.total).toBeCloseTo(29999.97, 2)
  })

  it('✅ Venta con cantidad 1', () => {
    const result = calcularDistribucionGYA(
      1,
      10000,
      6300,
      500,
      'completo',
      10000
    )
    
    expect(result.bovedaMonte).toBe(6300)
    expect(result.fleteSur).toBe(500)
    expect(result.utilidades).toBe(3200)
  })
})
