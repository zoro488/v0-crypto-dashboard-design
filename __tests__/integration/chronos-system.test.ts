/**
 * 🧪 TESTS INTEGRACIÓN AVANZADOS - SISTEMA CHRONOS
 * 
 * Tests comprehensivos que cubren:
 * - Lógica de negocio GYA (Distribución automática de ventas)
 * - Cálculos financieros
 * - Validaciones de formularios
 * - Lógica FIFO para abonos
 * - Fórmulas de distribución bancaria
 * 
 * @version 2.0.0
 * @date 2025-11-29
 */

import { z } from 'zod'

// ============================================================================
// CONSTANTES DEL SISTEMA - Según FORMULAS_CORRECTAS_VENTAS_Version2.md
// ============================================================================

const PRECIO_COMPRA_UNIDAD = 6300 // Costo del distribuidor
const PRECIO_FLETE_UNIDAD = 500   // Flete por unidad
const PRECIO_VENTA_UNIDAD = 10000 // Precio de venta al cliente

// IDs de bancos del sistema
const BANCO_IDS = {
  BOVEDA_MONTE: 'boveda_monte',
  BOVEDA_USA: 'boveda_usa',
  UTILIDADES: 'utilidades',
  FLETE_SUR: 'flete_sur',
  FLETES: 'fletes',
  AZTECA: 'azteca',
  LEFTIE: 'leftie',
  PROFIT: 'profit',
}

// ============================================================================
// TIPOS PARA TESTS
// ============================================================================

type EstadoPago = 'completo' | 'parcial' | 'pendiente'

interface DistribucionGYA {
  totalVenta: number
  montoBovedaMonte: number
  montoFletes: number
  montoUtilidades: number
  gananciaTotal: number
}

interface Banco {
  id: string
  nombre: string
  saldo: number
  historicoIngresos: number
  historicoGastos: number
}

interface Venta {
  id: string
  clienteId: string
  cantidad: number
  precioVentaUnidad: number
  precioCompraUnidad: number
  precioFlete: number
  totalVenta: number
  estadoPago: EstadoPago
  montoPagado: number
  fechaVenta: string
}

// ============================================================================
// FUNCIONES DE CÁLCULO - Según FORMULAS_CORRECTAS_VENTAS_Version2.md
// ============================================================================

/**
 * Calcula la distribución GYA según las fórmulas del sistema
 */
function calcularDistribucionGYA(
  cantidad: number,
  precioVenta: number,
  precioCompra: number,
  precioFlete: number
): DistribucionGYA {
  const totalVenta = precioVenta * cantidad
  const montoBovedaMonte = precioCompra * cantidad // COSTO
  const montoFletes = precioFlete * cantidad
  const montoUtilidades = (precioVenta - precioCompra - precioFlete) * cantidad // GANANCIA NETA
  
  return {
    totalVenta,
    montoBovedaMonte,
    montoFletes,
    montoUtilidades,
    gananciaTotal: montoUtilidades,
  }
}

/**
 * Calcula distribución para pago parcial (proporcional)
 */
function calcularDistribucionParcial(
  cantidad: number,
  precioVenta: number,
  precioCompra: number,
  precioFlete: number,
  montoPagado: number
): DistribucionGYA {
  const totalVenta = precioVenta * cantidad
  const proporcion = montoPagado / totalVenta
  
  const montoBovedaMonte = precioCompra * cantidad * proporcion
  const montoFletes = precioFlete * cantidad * proporcion
  const montoUtilidades = (precioVenta - precioCompra - precioFlete) * cantidad * proporcion
  
  return {
    totalVenta: montoPagado,
    montoBovedaMonte: Math.round(montoBovedaMonte * 100) / 100,
    montoFletes: Math.round(montoFletes * 100) / 100,
    montoUtilidades: Math.round(montoUtilidades * 100) / 100,
    gananciaTotal: Math.round(montoUtilidades * 100) / 100,
  }
}

/**
 * Actualiza capital de banco
 */
function actualizarCapitalBanco(
  banco: Banco,
  tipo: 'ingreso' | 'gasto',
  monto: number
): Banco {
  if (tipo === 'ingreso') {
    return {
      ...banco,
      saldo: banco.saldo + monto,
      historicoIngresos: banco.historicoIngresos + monto,
    }
  }
  return {
    ...banco,
    saldo: banco.saldo - monto,
    historicoGastos: banco.historicoGastos + monto,
  }
}

/**
 * Procesa abono con lógica FIFO
 */
function procesarAbonoFIFO(
  ventas: Venta[],
  montoAbono: number
): Array<{ ventaId: string; montoAplicado: number; nuevoEstado: EstadoPago }> {
  const pendientes = ventas
    .filter(v => v.estadoPago !== 'completo')
    .sort((a, b) => new Date(a.fechaVenta).getTime() - new Date(b.fechaVenta).getTime())
  
  let restante = montoAbono
  const aplicaciones: Array<{ ventaId: string; montoAplicado: number; nuevoEstado: EstadoPago }> = []
  
  for (const venta of pendientes) {
    if (restante <= 0) break
    
    const deudaVenta = venta.totalVenta - venta.montoPagado
    const aAplicar = Math.min(deudaVenta, restante)
    const nuevoMontoPagado = venta.montoPagado + aAplicar
    const nuevoEstado: EstadoPago = nuevoMontoPagado >= venta.totalVenta ? 'completo' : 'parcial'
    
    aplicaciones.push({ ventaId: venta.id, montoAplicado: aAplicar, nuevoEstado })
    restante -= aAplicar
  }
  
  return aplicaciones
}

// ============================================================================
// TEST SUITE: LÓGICA DE DISTRIBUCIÓN GYA
// ============================================================================

describe('🏦 LÓGICA DE DISTRIBUCIÓN GYA (Ganancia y Asignación)', () => {

  describe('Cálculo de Distribución a 3 Bancos', () => {
    
    it('✅ Distribución correcta: 10 unidades @ $10,000 venta, $6,300 costo, $500 flete', () => {
      const cantidad = 10
      const { totalVenta, montoBovedaMonte, montoFletes, montoUtilidades } = calcularDistribucionGYA(
        cantidad,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD
      )
      
      expect(totalVenta).toBe(100000) // 10 × $10,000
      expect(montoBovedaMonte).toBe(63000) // 10 × $6,300 (COSTO)
      expect(montoFletes).toBe(5000) // 10 × $500
      expect(montoUtilidades).toBe(32000) // 10 × ($10,000 - $6,300 - $500)
      
      // Verificar que suma = total
      expect(montoBovedaMonte + montoFletes + montoUtilidades).toBe(totalVenta)
    })

    it('✅ Distribución con 1 unidad', () => {
      const { totalVenta, montoBovedaMonte, montoFletes, montoUtilidades } = calcularDistribucionGYA(
        1,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD
      )
      
      expect(totalVenta).toBe(10000)
      expect(montoBovedaMonte).toBe(6300)
      expect(montoFletes).toBe(500)
      expect(montoUtilidades).toBe(3200)
    })

    it('✅ Distribución con 100 unidades (operación grande)', () => {
      const { totalVenta, montoBovedaMonte, montoFletes, montoUtilidades } = calcularDistribucionGYA(
        100,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD
      )
      
      expect(totalVenta).toBe(1000000)
      expect(montoBovedaMonte).toBe(630000)
      expect(montoFletes).toBe(50000)
      expect(montoUtilidades).toBe(320000)
    })

    it('✅ Utilidades = Ganancia NETA (precio venta - costo - flete)', () => {
      const cantidad = 10
      const { montoUtilidades } = calcularDistribucionGYA(
        cantidad,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD
      )
      
      const gananciaNetaEsperada = (PRECIO_VENTA_UNIDAD - PRECIO_COMPRA_UNIDAD - PRECIO_FLETE_UNIDAD) * cantidad
      expect(montoUtilidades).toBe(gananciaNetaEsperada)
      expect(montoUtilidades).toBe(32000)
    })
  })

  describe('Distribución Parcial (Proporcional)', () => {
    
    it('✅ Pago 50% distribuye proporcionalmente', () => {
      const cantidad = 10
      const totalVenta = PRECIO_VENTA_UNIDAD * cantidad // 100,000
      const montoPagado = 50000 // 50%
      
      const dist = calcularDistribucionParcial(
        cantidad,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD,
        montoPagado
      )
      
      expect(dist.montoBovedaMonte).toBe(31500) // 63,000 × 0.5
      expect(dist.montoFletes).toBe(2500) // 5,000 × 0.5
      expect(dist.montoUtilidades).toBe(16000) // 32,000 × 0.5
    })

    it('✅ Pago 75% distribuye proporcionalmente', () => {
      const cantidad = 10
      const montoPagado = 75000
      
      const dist = calcularDistribucionParcial(
        cantidad,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD,
        montoPagado
      )
      
      expect(dist.montoBovedaMonte).toBe(47250) // 63,000 × 0.75
      expect(dist.montoFletes).toBe(3750) // 5,000 × 0.75
      expect(dist.montoUtilidades).toBe(24000) // 32,000 × 0.75
    })

    it('✅ Pago 25% distribuye proporcionalmente', () => {
      const cantidad = 10
      const montoPagado = 25000
      
      const dist = calcularDistribucionParcial(
        cantidad,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD,
        montoPagado
      )
      
      expect(dist.montoBovedaMonte).toBe(15750) // 63,000 × 0.25
      expect(dist.montoFletes).toBe(1250) // 5,000 × 0.25
      expect(dist.montoUtilidades).toBe(8000) // 32,000 × 0.25
    })
  })

  describe('Estados de Pago', () => {
    
    it('✅ Estado PENDIENTE: No distribuye nada', () => {
      // Cuando estadoPago = pendiente, no se afecta ningún banco
      const dist = calcularDistribucionParcial(
        10,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD,
        0 // Sin pago
      )
      
      expect(dist.montoBovedaMonte).toBe(0)
      expect(dist.montoFletes).toBe(0)
      expect(dist.montoUtilidades).toBe(0)
    })

    it('✅ Estado COMPLETO: Distribuye 100%', () => {
      const cantidad = 10
      const totalVenta = PRECIO_VENTA_UNIDAD * cantidad
      
      const dist = calcularDistribucionParcial(
        cantidad,
        PRECIO_VENTA_UNIDAD,
        PRECIO_COMPRA_UNIDAD,
        PRECIO_FLETE_UNIDAD,
        totalVenta // 100% pagado
      )
      
      expect(dist.montoBovedaMonte).toBe(63000)
      expect(dist.montoFletes).toBe(5000)
      expect(dist.montoUtilidades).toBe(32000)
    })
  })
})

// ============================================================================
// TEST SUITE: ACTUALIZACIÓN DE CAPITAL BANCARIO
// ============================================================================

describe('💰 ACTUALIZACIÓN DE CAPITAL BANCARIO', () => {
  
  const bancoInicial: Banco = {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    saldo: 1000000,
    historicoIngresos: 5000000,
    historicoGastos: 4000000,
  }

  it('✅ Ingreso aumenta saldo e historicoIngresos', () => {
    const bancoActualizado = actualizarCapitalBanco(bancoInicial, 'ingreso', 100000)
    
    expect(bancoActualizado.saldo).toBe(1100000)
    expect(bancoActualizado.historicoIngresos).toBe(5100000)
    expect(bancoActualizado.historicoGastos).toBe(4000000)
  })

  it('✅ Gasto disminuye saldo y aumenta historicoGastos', () => {
    const bancoActualizado = actualizarCapitalBanco(bancoInicial, 'gasto', 50000)
    
    expect(bancoActualizado.saldo).toBe(950000)
    expect(bancoActualizado.historicoGastos).toBe(4050000)
    expect(bancoActualizado.historicoIngresos).toBe(5000000)
  })

  it('✅ Saldo = historicoIngresos - historicoGastos', () => {
    expect(bancoInicial.saldo).toBe(bancoInicial.historicoIngresos - bancoInicial.historicoGastos)
    
    const despuesIngreso = actualizarCapitalBanco(bancoInicial, 'ingreso', 100000)
    expect(despuesIngreso.saldo).toBe(despuesIngreso.historicoIngresos - despuesIngreso.historicoGastos)
  })

  it('✅ Múltiples operaciones mantienen consistencia', () => {
    let banco = bancoInicial
    
    banco = actualizarCapitalBanco(banco, 'ingreso', 32000) // Utilidades de venta
    banco = actualizarCapitalBanco(banco, 'gasto', 10000) // Retiro
    banco = actualizarCapitalBanco(banco, 'ingreso', 16000) // Otra venta
    
    expect(banco.saldo).toBe(1038000)
    expect(banco.historicoIngresos).toBe(5048000)
    expect(banco.historicoGastos).toBe(4010000)
  })
})

// ============================================================================
// TEST SUITE: LÓGICA FIFO PARA ABONOS
// ============================================================================

describe('📊 LÓGICA FIFO PARA ABONOS', () => {
  
  const ventasPendientes: Venta[] = [
    { id: 'V-003', clienteId: 'C-001', cantidad: 3, precioVentaUnidad: 10000, precioCompraUnidad: 6300, precioFlete: 500, totalVenta: 30000, estadoPago: 'pendiente', montoPagado: 0, fechaVenta: '2025-08-27' },
    { id: 'V-001', clienteId: 'C-001', cantidad: 5, precioVentaUnidad: 10000, precioCompraUnidad: 6300, precioFlete: 500, totalVenta: 50000, estadoPago: 'pendiente', montoPagado: 0, fechaVenta: '2025-08-25' },
    { id: 'V-002', clienteId: 'C-001', cantidad: 2, precioVentaUnidad: 10000, precioCompraUnidad: 6300, precioFlete: 500, totalVenta: 20000, estadoPago: 'parcial', montoPagado: 10000, fechaVenta: '2025-08-26' },
  ]

  it('✅ Abono se aplica primero a venta más antigua (FIFO)', () => {
    const aplicaciones = procesarAbonoFIFO(ventasPendientes, 25000)
    
    // V-001 (25 agosto) es la más antigua
    expect(aplicaciones[0].ventaId).toBe('V-001')
    expect(aplicaciones[0].montoAplicado).toBe(25000)
    expect(aplicaciones[0].nuevoEstado).toBe('parcial')
  })

  it('✅ Abono completa ventas en orden cronológico', () => {
    const aplicaciones = procesarAbonoFIFO(ventasPendientes, 60000)
    
    // Primero V-001 (50000)
    expect(aplicaciones[0].ventaId).toBe('V-001')
    expect(aplicaciones[0].montoAplicado).toBe(50000)
    expect(aplicaciones[0].nuevoEstado).toBe('completo')
    
    // Luego V-002 (10000 restante de 20000)
    expect(aplicaciones[1].ventaId).toBe('V-002')
    expect(aplicaciones[1].montoAplicado).toBe(10000)
    expect(aplicaciones[1].nuevoEstado).toBe('completo')
  })

  it('✅ Abono mayor que deuda total se aplica completamente', () => {
    const aplicaciones = procesarAbonoFIFO(ventasPendientes, 150000)
    
    // Total deuda: 50000 + 10000 + 30000 = 90000
    const totalAplicado = aplicaciones.reduce((sum, a) => sum + a.montoAplicado, 0)
    expect(totalAplicado).toBe(90000)
    expect(aplicaciones).toHaveLength(3)
  })

  it('✅ Todas las ventas terminan completas con abono suficiente', () => {
    const aplicaciones = procesarAbonoFIFO(ventasPendientes, 100000)
    
    aplicaciones.forEach(a => {
      expect(a.nuevoEstado).toBe('completo')
    })
  })

  it('✅ Abono menor que primera deuda deja estado parcial', () => {
    const aplicaciones = procesarAbonoFIFO(ventasPendientes, 10000)
    
    expect(aplicaciones).toHaveLength(1)
    expect(aplicaciones[0].ventaId).toBe('V-001')
    expect(aplicaciones[0].nuevoEstado).toBe('parcial')
  })
})

// ============================================================================
// TEST SUITE: VALIDACIONES CON ZOD
// ============================================================================

describe('📋 VALIDACIONES ZOD', () => {
  
  const MontoSchema = z.number().positive()
  const CantidadSchema = z.number().int().positive()
  const EstadoPagoSchema = z.enum(['completo', 'parcial', 'pendiente'])

  describe('Montos', () => {
    
    it('✅ Acepta montos positivos', () => {
      expect(MontoSchema.safeParse(10000).success).toBe(true)
      expect(MontoSchema.safeParse(0.01).success).toBe(true)
      expect(MontoSchema.safeParse(1000000).success).toBe(true)
    })

    it('❌ Rechaza montos negativos', () => {
      expect(MontoSchema.safeParse(-100).success).toBe(false)
      expect(MontoSchema.safeParse(-0.01).success).toBe(false)
    })

    it('❌ Rechaza cero', () => {
      expect(MontoSchema.safeParse(0).success).toBe(false)
    })
  })

  describe('Cantidades', () => {
    
    it('✅ Acepta enteros positivos', () => {
      expect(CantidadSchema.safeParse(1).success).toBe(true)
      expect(CantidadSchema.safeParse(100).success).toBe(true)
      expect(CantidadSchema.safeParse(999).success).toBe(true)
    })

    it('❌ Rechaza decimales', () => {
      expect(CantidadSchema.safeParse(10.5).success).toBe(false)
      expect(CantidadSchema.safeParse(0.1).success).toBe(false)
    })

    it('❌ Rechaza negativos', () => {
      expect(CantidadSchema.safeParse(-1).success).toBe(false)
      expect(CantidadSchema.safeParse(-100).success).toBe(false)
    })
  })

  describe('Estados de Pago', () => {
    
    it('✅ Acepta estados válidos', () => {
      expect(EstadoPagoSchema.safeParse('completo').success).toBe(true)
      expect(EstadoPagoSchema.safeParse('parcial').success).toBe(true)
      expect(EstadoPagoSchema.safeParse('pendiente').success).toBe(true)
    })

    it('❌ Rechaza estados inválidos', () => {
      expect(EstadoPagoSchema.safeParse('pagado').success).toBe(false)
      expect(EstadoPagoSchema.safeParse('cancelado').success).toBe(false)
      expect(EstadoPagoSchema.safeParse('').success).toBe(false)
    })
  })
})

// ============================================================================
// TEST SUITE: TRANSFERENCIAS ENTRE BANCOS
// ============================================================================

describe('🔄 TRANSFERENCIAS ENTRE BANCOS', () => {
  
  it('✅ Transferencia reduce origen y aumenta destino', () => {
    let bancoOrigen: Banco = {
      id: 'utilidades',
      nombre: 'Utilidades',
      saldo: 100000,
      historicoIngresos: 100000,
      historicoGastos: 0,
    }
    
    let bancoDestino: Banco = {
      id: 'boveda_monte',
      nombre: 'Bóveda Monte',
      saldo: 500000,
      historicoIngresos: 500000,
      historicoGastos: 0,
    }
    
    const monto = 30000
    
    bancoOrigen = actualizarCapitalBanco(bancoOrigen, 'gasto', monto)
    bancoDestino = actualizarCapitalBanco(bancoDestino, 'ingreso', monto)
    
    expect(bancoOrigen.saldo).toBe(70000)
    expect(bancoDestino.saldo).toBe(530000)
  })

  it('✅ Total del sistema se mantiene en transferencias', () => {
    const totalAntes = 100000 + 500000
    
    let bancoOrigen: Banco = {
      id: 'utilidades',
      nombre: 'Utilidades',
      saldo: 100000,
      historicoIngresos: 100000,
      historicoGastos: 0,
    }
    
    let bancoDestino: Banco = {
      id: 'boveda_monte',
      nombre: 'Bóveda Monte',
      saldo: 500000,
      historicoIngresos: 500000,
      historicoGastos: 0,
    }
    
    bancoOrigen = actualizarCapitalBanco(bancoOrigen, 'gasto', 30000)
    bancoDestino = actualizarCapitalBanco(bancoDestino, 'ingreso', 30000)
    
    const totalDespues = bancoOrigen.saldo + bancoDestino.saldo
    expect(totalDespues).toBe(totalAntes)
  })
})

// ============================================================================
// TEST SUITE: EDGE CASES
// ============================================================================

describe('🔥 EDGE CASES', () => {
  
  it('✅ Distribución con valores muy grandes', () => {
    const dist = calcularDistribucionGYA(
      1000,     // 1000 unidades
      1000000,  // 1 millón por unidad
      630000,   // 630k costo
      50000     // 50k flete
    )
    
    expect(dist.totalVenta).toBe(1000000000)
    expect(dist.montoBovedaMonte).toBe(630000000)
    expect(dist.montoFletes).toBe(50000000)
    expect(dist.montoUtilidades).toBe(320000000)
  })

  it('✅ Distribución con cantidad 1', () => {
    const dist = calcularDistribucionGYA(1, 10000, 6300, 500)
    
    expect(dist.totalVenta).toBe(10000)
    expect(dist.montoBovedaMonte + dist.montoFletes + dist.montoUtilidades).toBe(10000)
  })

  it('✅ Ganancia cero (precio venta = costo + flete)', () => {
    const dist = calcularDistribucionGYA(10, 6800, 6300, 500)
    
    expect(dist.montoUtilidades).toBe(0)
    expect(dist.totalVenta).toBe(68000)
  })

  it('✅ FIFO con lista vacía', () => {
    const aplicaciones = procesarAbonoFIFO([], 10000)
    
    expect(aplicaciones).toHaveLength(0)
  })

  it('✅ FIFO con abono cero', () => {
    const ventas: Venta[] = [{
      id: 'V-001',
      clienteId: 'C-001',
      cantidad: 10,
      precioVentaUnidad: 10000,
      precioCompraUnidad: 6300,
      precioFlete: 500,
      totalVenta: 100000,
      estadoPago: 'pendiente',
      montoPagado: 0,
      fechaVenta: '2025-08-25',
    }]
    
    const aplicaciones = procesarAbonoFIFO(ventas, 0)
    
    expect(aplicaciones).toHaveLength(0)
  })
})
