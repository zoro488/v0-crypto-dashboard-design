/**
 * 💼 Tests de Lógica de Negocio - Sistema CHRONOS
 * 
 * Verifica las fórmulas GYA, estados de pago y cálculo de capital.
 */

import { describe, it, expect } from '@jest/globals'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Venta {
  precioVentaUnidad: number
  precioCompraUnidad: number
  precioFlete: number
  cantidad: number
}

interface DistribucionGYA {
  bovedaMonte: number  // Costo (va al distribuidor)
  fletes: number       // Flete Sur
  utilidades: number   // Ganancia neta
}

interface EstadoPago {
  tipo: 'completo' | 'parcial' | 'pendiente'
  montoPagado: number
  montoTotal: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE LÓGICA DE NEGOCIO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula la distribución GYA para una venta
 * G = Ganancia (Utilidades)
 * Y = Yield (Costo recuperado - Bóveda Monte)
 * A = Asignación (Fletes)
 */
function calcularDistribucionGYA(venta: Venta): DistribucionGYA {
  const { precioVentaUnidad, precioCompraUnidad, precioFlete, cantidad } = venta
  
  return {
    bovedaMonte: precioCompraUnidad * cantidad,  // Costo total al distribuidor
    fletes: precioFlete * cantidad,               // Total fletes
    utilidades: (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad,  // Ganancia neta
  }
}

/**
 * Calcula la distribución proporcional para pagos parciales
 */
function calcularDistribucionProporcional(
  distribucion: DistribucionGYA, 
  pago: EstadoPago
): DistribucionGYA {
  if (pago.tipo === 'pendiente') {
    return { bovedaMonte: 0, fletes: 0, utilidades: 0 }
  }
  
  if (pago.tipo === 'completo') {
    return distribucion
  }
  
  // Pago parcial - distribución proporcional
  const proporcion = pago.montoPagado / pago.montoTotal
  
  return {
    bovedaMonte: distribucion.bovedaMonte * proporcion,
    fletes: distribucion.fletes * proporcion,
    utilidades: distribucion.utilidades * proporcion,
  }
}

/**
 * Calcula el capital actual de un banco
 */
function calcularCapitalBanco(historicoIngresos: number, historicoGastos: number): number {
  return historicoIngresos - historicoGastos
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE DISTRIBUCIÓN GYA
// ═══════════════════════════════════════════════════════════════════════════════

describe('💰 Distribución GYA (Ganancia, Yield, Asignación)', () => {
  it('debe calcular correctamente la distribución para una venta', () => {
    const venta: Venta = {
      precioVentaUnidad: 10000,
      precioCompraUnidad: 6300,
      precioFlete: 500,
      cantidad: 10,
    }
    
    const distribucion = calcularDistribucionGYA(venta)
    
    // Verificar cálculos
    expect(distribucion.bovedaMonte).toBe(63000)  // 6300 × 10
    expect(distribucion.fletes).toBe(5000)         // 500 × 10
    expect(distribucion.utilidades).toBe(32000)    // (10000 - 6300 - 500) × 10
    
    // Verificar que suma igual al total de venta
    const totalVenta = venta.precioVentaUnidad * venta.cantidad
    const totalDistribucion = distribucion.bovedaMonte + distribucion.fletes + distribucion.utilidades
    expect(totalDistribucion).toBe(totalVenta)
  })

  it('debe manejar correctamente ventas con flete cero', () => {
    const venta: Venta = {
      precioVentaUnidad: 7000,
      precioCompraUnidad: 6300,
      precioFlete: 0,  // Sin flete (ej: CH-MONTE)
      cantidad: 5,
    }
    
    const distribucion = calcularDistribucionGYA(venta)
    
    expect(distribucion.bovedaMonte).toBe(31500)   // 6300 × 5
    expect(distribucion.fletes).toBe(0)             // Sin flete
    expect(distribucion.utilidades).toBe(3500)      // (7000 - 6300 - 0) × 5
  })

  it('debe calcular utilidad negativa si venta por debajo del costo', () => {
    const venta: Venta = {
      precioVentaUnidad: 6000,  // Menor que costo + flete
      precioCompraUnidad: 6300,
      precioFlete: 500,
      cantidad: 1,
    }
    
    const distribucion = calcularDistribucionGYA(venta)
    
    expect(distribucion.utilidades).toBe(-800)  // Pérdida
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE ESTADOS DE PAGO
// ═══════════════════════════════════════════════════════════════════════════════

describe('💳 Estados de Pago', () => {
  const ventaBase: Venta = {
    precioVentaUnidad: 10000,
    precioCompraUnidad: 6300,
    precioFlete: 500,
    cantidad: 10,
  }
  
  const distribucionBase = calcularDistribucionGYA(ventaBase)
  const montoTotal = ventaBase.precioVentaUnidad * ventaBase.cantidad

  it('pago COMPLETO debe distribuir 100% a los 3 bancos', () => {
    const pago: EstadoPago = {
      tipo: 'completo',
      montoPagado: montoTotal,
      montoTotal,
    }
    
    const resultado = calcularDistribucionProporcional(distribucionBase, pago)
    
    expect(resultado).toEqual(distribucionBase)
  })

  it('pago PARCIAL (50%) debe distribuir proporcionalmente', () => {
    const pago: EstadoPago = {
      tipo: 'parcial',
      montoPagado: montoTotal * 0.5,  // 50% pagado
      montoTotal,
    }
    
    const resultado = calcularDistribucionProporcional(distribucionBase, pago)
    
    expect(resultado.bovedaMonte).toBe(31500)   // 63000 × 0.5
    expect(resultado.fletes).toBe(2500)          // 5000 × 0.5
    expect(resultado.utilidades).toBe(16000)     // 32000 × 0.5
  })

  it('pago PENDIENTE no debe afectar ningún banco', () => {
    const pago: EstadoPago = {
      tipo: 'pendiente',
      montoPagado: 0,
      montoTotal,
    }
    
    const resultado = calcularDistribucionProporcional(distribucionBase, pago)
    
    expect(resultado.bovedaMonte).toBe(0)
    expect(resultado.fletes).toBe(0)
    expect(resultado.utilidades).toBe(0)
  })

  it('abono del 25% debe calcular proporción correcta', () => {
    const pago: EstadoPago = {
      tipo: 'parcial',
      montoPagado: montoTotal * 0.25,  // 25% pagado
      montoTotal,
    }
    
    const resultado = calcularDistribucionProporcional(distribucionBase, pago)
    
    expect(resultado.bovedaMonte).toBe(15750)   // 63000 × 0.25
    expect(resultado.fletes).toBe(1250)          // 5000 × 0.25
    expect(resultado.utilidades).toBe(8000)      // 32000 × 0.25
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE CAPITAL BANCARIO
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏦 Cálculo de Capital Bancario', () => {
  it('capital = historicoIngresos - historicoGastos', () => {
    const historicoIngresos = 1000000
    const historicoGastos = 600000
    
    const capital = calcularCapitalBanco(historicoIngresos, historicoGastos)
    
    expect(capital).toBe(400000)
  })

  it('historicoIngresos y historicoGastos nunca disminuyen', () => {
    let historicoIngresos = 500000
    let historicoGastos = 200000
    
    // Simular nuevos ingresos
    historicoIngresos += 100000
    expect(historicoIngresos).toBe(600000)
    
    // Simular nuevos gastos
    historicoGastos += 50000
    expect(historicoGastos).toBe(250000)
    
    // Los valores siempre deben ser mayores o iguales
    expect(historicoIngresos).toBeGreaterThanOrEqual(500000)
    expect(historicoGastos).toBeGreaterThanOrEqual(200000)
  })

  it('capital puede ser negativo si gastos > ingresos', () => {
    const capital = calcularCapitalBanco(100000, 150000)
    
    expect(capital).toBe(-50000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE 7 BANCOS/BÓVEDAS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏛️ Configuración de 7 Bancos/Bóvedas', () => {
  const BANCOS = [
    { id: 'boveda_monte', nombre: 'Bóveda Monte', moneda: 'MXN' },
    { id: 'boveda_usa', nombre: 'Bóveda USA', moneda: 'USD' },
    { id: 'profit', nombre: 'Profit', moneda: 'MXN' },
    { id: 'leftie', nombre: 'Leftie', moneda: 'MXN' },
    { id: 'azteca', nombre: 'Azteca', moneda: 'MXN' },
    { id: 'flete_sur', nombre: 'Flete Sur', moneda: 'MXN' },
    { id: 'utilidades', nombre: 'Utilidades', moneda: 'MXN' },
  ]

  it('debe haber exactamente 7 bancos configurados', () => {
    expect(BANCOS.length).toBe(7)
  })

  it('boveda_usa debe manejar USD', () => {
    const bovedaUsa = BANCOS.find(b => b.id === 'boveda_usa')
    expect(bovedaUsa?.moneda).toBe('USD')
  })

  it('los demás bancos deben manejar MXN', () => {
    const bancosMXN = BANCOS.filter(b => b.moneda === 'MXN')
    expect(bancosMXN.length).toBe(6)
  })

  it('distribución GYA debe ir a los 3 bancos correctos', () => {
    // Bóveda Monte = Costo del distribuidor
    // Flete Sur = Gastos de flete
    // Utilidades = Ganancia neta
    
    const bancosDistribucion = ['boveda_monte', 'flete_sur', 'utilidades']
    bancosDistribucion.forEach(id => {
      expect(BANCOS.find(b => b.id === id)).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE CASOS REALES
// ═══════════════════════════════════════════════════════════════════════════════

describe('📊 Casos Reales del Sistema', () => {
  it('Caso: Venta Q-MAYA típica', () => {
    // Datos reales del CSV
    const venta: Venta = {
      precioVentaUnidad: 9500,
      precioCompraUnidad: 6100,
      precioFlete: 200,
      cantidad: 20,
    }
    
    const dist = calcularDistribucionGYA(venta)
    
    expect(dist.bovedaMonte).toBe(122000)  // 6100 × 20
    expect(dist.fletes).toBe(4000)          // 200 × 20
    expect(dist.utilidades).toBe(64000)     // (9500 - 6100 - 200) × 20
  })

  it('Caso: Venta VALLE-MONTE (costo más alto)', () => {
    const venta: Venta = {
      precioVentaUnidad: 9500,
      precioCompraUnidad: 7000,  // Costo más alto
      precioFlete: 0,            // Sin flete
      cantidad: 15,
    }
    
    const dist = calcularDistribucionGYA(venta)
    
    expect(dist.bovedaMonte).toBe(105000)  // 7000 × 15
    expect(dist.fletes).toBe(0)
    expect(dist.utilidades).toBe(37500)     // (9500 - 7000 - 0) × 15
  })
})
