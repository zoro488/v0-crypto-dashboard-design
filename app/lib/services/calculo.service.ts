/**
 * 🧮 SERVICIO DE CÁLCULOS DE NEGOCIO - CHRONOS SYSTEM
 * 
 * Servicio centralizado para TODOS los cálculos financieros del sistema.
 * Garantiza consistencia entre frontend, backend y Cloud Functions.
 * 
 * CÁLCULOS IMPLEMENTADOS:
 * 1. Distribución GYA (Ganancia y Asignación) para ventas
 * 2. Cálculo de deudas y saldos
 * 3. Proporciones para pagos parciales
 * 4. Totales de órdenes de compra
 * 5. Balance de bancos
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

import { logger } from '@/app/lib/utils/logger'
import type { 
  Venta, 
  OrdenCompra, 
  Cliente, 
  Distribuidor,
  Banco,
  BancoId,
  CalculoVentaResult,
} from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES DEL SISTEMA
// ═══════════════════════════════════════════════════════════════════════════

/** Precio de flete por defecto por unidad (USD) */
export const PRECIO_FLETE_DEFAULT = 500

/** Decimales para redondeo de montos */
export const DECIMALES_MONEDA = 2

/** IDs de los 7 bancos del sistema */
export const BANCOS_IDS: BancoId[] = [
  'boveda_monte',
  'boveda_usa',
  'utilidades',
  'flete_sur',
  'azteca',
  'leftie',
  'profit',
]

/** Bancos que reciben distribución GYA de ventas */
export const BANCOS_DISTRIBUCION_GYA: BancoId[] = [
  'boveda_monte',  // Recibe COSTO
  'flete_sur',     // Recibe FLETE
  'utilidades',    // Recibe GANANCIA
]

/** Bancos que pueden recibir ingresos directos */
export const BANCOS_OPERATIVOS: BancoId[] = [
  'azteca',
  'leftie',
  'profit',
]

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS DE ENTRADA PARA CÁLCULOS
// ═══════════════════════════════════════════════════════════════════════════

export interface CalculoVentaInput {
  /** Cantidad de unidades */
  cantidad: number
  /** Precio de venta por unidad al cliente */
  precioVenta: number
  /** Precio de compra por unidad (costo del distribuidor) */
  precioCompra: number
  /** Precio de flete por unidad */
  precioFlete?: number
  /** ¿Aplica flete? */
  aplicaFlete?: boolean
  /** Monto pagado (para calcular proporciones) */
  montoPagado?: number
}

export interface CalculoOrdenCompraInput {
  /** Cantidad de unidades */
  cantidad: number
  /** Costo por unidad del distribuidor */
  costoDistribuidor: number
  /** Costo de transporte por unidad */
  costoTransporte?: number
  /** Pago inicial */
  pagoInicial?: number
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE REDONDEO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Redondea un número a 2 decimales (para montos monetarios)
 */
export function redondearMonto(valor: number): number {
  return Math.round(valor * Math.pow(10, DECIMALES_MONEDA)) / Math.pow(10, DECIMALES_MONEDA)
}

/**
 * Asegura que un valor no sea negativo
 */
export function noNegativo(valor: number): number {
  return Math.max(0, valor)
}

// ═══════════════════════════════════════════════════════════════════════════
// CÁLCULO DE DISTRIBUCIÓN GYA (Ganancia y Asignación)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la distribución GYA para una venta según las fórmulas correctas
 * 
 * FÓRMULAS (FORMULAS_CORRECTAS_VENTAS_Version2.md):
 * 
 * 1. BÓVEDA MONTE = precioCompra × cantidad
 *    → Es el COSTO que pagamos al distribuidor (recuperación de inversión)
 * 
 * 2. FLETES = precioFlete × cantidad
 *    → Costo de transporte (si aplica)
 * 
 * 3. UTILIDADES = (precioVenta - precioCompra - precioFlete) × cantidad
 *    → GANANCIA NETA después de restar costo y flete
 * 
 * VALIDACIÓN: totalIngreso = bovedaMonte + fletes + utilidades
 * 
 * @example
 * ```typescript
 * const resultado = calcularDistribucionGYA({
 *   cantidad: 10,
 *   precioVenta: 10000,  // 100,000 total
 *   precioCompra: 6300,  // 63,000 a Bóveda Monte
 *   precioFlete: 500,    // 5,000 a Fletes
 *   // Utilidad: 10,000 - 6,300 - 500 = 3,200 × 10 = 32,000 a Utilidades
 * })
 * ```
 */
export function calcularDistribucionGYA(input: CalculoVentaInput): CalculoVentaResult {
  const {
    cantidad,
    precioVenta,
    precioCompra,
    precioFlete = PRECIO_FLETE_DEFAULT,
    aplicaFlete = true,
    montoPagado,
  } = input

  // Validaciones de entrada
  if (cantidad <= 0) {
    logger.warn('[CalculoService] Cantidad debe ser mayor a 0')
    throw new Error('La cantidad debe ser mayor a 0')
  }
  if (precioVenta < 0 || precioCompra < 0 || precioFlete < 0) {
    logger.warn('[CalculoService] Los precios no pueden ser negativos')
    throw new Error('Los precios no pueden ser negativos')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CÁLCULOS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════

  // Total de ingresos por la venta
  const ingresoVenta = redondearMonto(precioVenta * cantidad)
  
  // Costo total del lote (de la OC)
  const costoTotalLote = redondearMonto(precioCompra * cantidad)

  // ✅ DISTRIBUCIÓN GYA CORRECTA:
  
  // 1. Bóveda Monte = COSTO (lo que pagamos al distribuidor)
  const montoBovedaMonte = redondearMonto(precioCompra * cantidad)
  
  // 2. Fletes = Transporte (si aplica)
  const montoFletes = aplicaFlete ? redondearMonto(precioFlete * cantidad) : 0
  
  // 3. Utilidades = GANANCIA NETA (después de restar costo y flete)
  // ⚠️ CRÍTICO: precioVenta - precioCompra - precioFlete (NO precioVenta - precioCompra × 2)
  const fleteUnitario = aplicaFlete ? precioFlete : 0
  const montoUtilidades = redondearMonto((precioVenta - precioCompra - fleteUnitario) * cantidad)

  // Ganancia bruta (sin considerar flete)
  const gananciaBruta = redondearMonto(ingresoVenta - costoTotalLote)

  // ═══════════════════════════════════════════════════════════════════════
  // VALIDACIONES DE INTEGRIDAD
  // ═══════════════════════════════════════════════════════════════════════

  // Verificar que la suma de distribución = total ingreso
  const sumaDistribucion = montoBovedaMonte + montoFletes + montoUtilidades
  const diferencia = Math.abs(ingresoVenta - sumaDistribucion)
  
  if (diferencia > 0.01) {
    logger.warn('[CalculoService] Discrepancia en distribución GYA', {
      data: {
        ingresoVenta,
        sumaDistribucion,
        diferencia,
        distribucion: { bovedaMonte: montoBovedaMonte, fletes: montoFletes, utilidades: montoUtilidades },
      },
    })
  }

  // Alerta si utilidad es negativa
  if (montoUtilidades < 0) {
    logger.warn('[CalculoService] ⚠️ ALERTA: Utilidad negativa detectada', {
      data: {
        precioVenta,
        precioCompra,
        precioFlete: fleteUnitario,
        cantidad,
        utilidad: montoUtilidades,
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CÁLCULOS DE PAGO PARCIAL
  // ═══════════════════════════════════════════════════════════════════════

  let proporcionPagada: number | undefined
  let distribucionParcial: CalculoVentaResult['distribucionParcial']

  if (montoPagado !== undefined && montoPagado >= 0) {
    proporcionPagada = ingresoVenta > 0 ? montoPagado / ingresoVenta : 0
    
    distribucionParcial = {
      bovedaMonte: redondearMonto(montoBovedaMonte * proporcionPagada),
      fletes: redondearMonto(montoFletes * proporcionPagada),
      utilidades: redondearMonto(montoUtilidades * proporcionPagada),
    }
  }

  // Margen de ganancia
  const margenPorcentaje = ingresoVenta > 0 ? (montoUtilidades / ingresoVenta) * 100 : 0

  // Resultado completo
  const resultado: CalculoVentaResult = {
    // Costos de la OC
    costoPorUnidad: precioCompra + (aplicaFlete ? precioFlete : 0),
    costoTotalLote,
    
    // Venta
    ingresoVenta,
    totalVenta: ingresoVenta, // Alias
    
    // Distribución a bancos
    montoBovedaMonte,
    montoFletes,
    montoUtilidades,
    
    // Ganancia
    gananciaBruta,
    gananciaDesdeCSV: montoUtilidades,
    
    // Pagos parciales
    proporcionPagada,
    distribucionParcial,
    
    // Margen
    margenPorcentaje: redondearMonto(margenPorcentaje),
    
    // Propiedades legacy para compatibilidad
    precioTotalVenta: ingresoVenta,
    bovedaMonte: montoBovedaMonte,
    fletes: montoFletes,
    utilidades: montoUtilidades,
    totalDistribuido: sumaDistribucion,
    ganancia: gananciaBruta,
  }

  logger.info('[CalculoService] Distribución GYA calculada', {
    data: {
      entrada: { cantidad, precioVenta, precioCompra, precioFlete: fleteUnitario },
      resultado: {
        totalVenta: ingresoVenta,
        distribucion: { bovedaMonte: montoBovedaMonte, fletes: montoFletes, utilidades: montoUtilidades },
        margen: `${margenPorcentaje.toFixed(1)}%`,
      },
    },
  })

  return resultado
}

// ═══════════════════════════════════════════════════════════════════════════
// CÁLCULOS DE ORDEN DE COMPRA
// ═══════════════════════════════════════════════════════════════════════════

export interface CalculoOrdenCompraResult {
  /** Costo por unidad (distribuidor + transporte) */
  costoPorUnidad: number
  /** Costo total del lote */
  costoTotal: number
  /** Deuda generada (costoTotal - pagoInicial) */
  deuda: number
  /** Estado de la orden */
  estado: 'pendiente' | 'parcial' | 'pagado'
}

/**
 * Calcula los totales de una orden de compra
 */
export function calcularOrdenCompra(input: CalculoOrdenCompraInput): CalculoOrdenCompraResult {
  const {
    cantidad,
    costoDistribuidor,
    costoTransporte = 0,
    pagoInicial = 0,
  } = input

  if (cantidad <= 0 || costoDistribuidor < 0) {
    throw new Error('Datos inválidos para orden de compra')
  }

  const costoPorUnidad = redondearMonto(costoDistribuidor + costoTransporte)
  const costoTotal = redondearMonto(costoPorUnidad * cantidad)
  const deuda = noNegativo(redondearMonto(costoTotal - pagoInicial))

  let estado: 'pendiente' | 'parcial' | 'pagado' = 'pendiente'
  if (deuda === 0) {
    estado = 'pagado'
  } else if (pagoInicial > 0) {
    estado = 'parcial'
  }

  return {
    costoPorUnidad,
    costoTotal,
    deuda,
    estado,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CÁLCULOS DE DEUDAS Y SALDOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula el saldo pendiente de un cliente
 */
export function calcularSaldoCliente(cliente: Partial<Cliente>): number {
  const deudaTotal = cliente.deudaTotal ?? cliente.deuda ?? 0
  const abonos = cliente.abonos ?? cliente.totalPagado ?? 0
  return noNegativo(redondearMonto(deudaTotal - abonos))
}

/**
 * Calcula el saldo pendiente de un distribuidor
 */
export function calcularSaldoDistribuidor(distribuidor: Partial<Distribuidor>): number {
  const deudaTotal = distribuidor.deudaTotal ?? distribuidor.costoTotal ?? 0
  const pagado = distribuidor.totalPagado ?? distribuidor.abonos ?? 0
  return noNegativo(redondearMonto(deudaTotal - pagado))
}

/**
 * Calcula el capital actual de un banco
 * capitalActual = historicoIngresos - historicoGastos
 */
export function calcularCapitalBanco(banco: Partial<Banco>): number {
  const ingresos = banco.historicoIngresos ?? 0
  const gastos = banco.historicoGastos ?? 0
  return redondearMonto(ingresos - gastos)
}

// ═══════════════════════════════════════════════════════════════════════════
// CÁLCULOS DE PROPORCIONES PARA ABONOS
// ═══════════════════════════════════════════════════════════════════════════

export interface DistribucionAbonoResult {
  /** Proporción del abono respecto al total de la venta */
  proporcion: number
  /** Monto que va a Bóveda Monte */
  aBovedaMonte: number
  /** Monto que va a Fletes */
  aFletes: number
  /** Monto que va a Utilidades */
  aUtilidades: number
}

/**
 * Calcula la distribución proporcional de un abono a los 3 bancos
 * 
 * Cuando un cliente abona, el dinero se distribuye proporcionalmente
 * según la distribución original de la venta.
 */
export function calcularDistribucionAbono(
  montoAbono: number,
  venta: Pick<Venta, 'precioTotalVenta' | 'distribucionBancos'>,
): DistribucionAbonoResult {
  const totalVenta = venta.precioTotalVenta || 0
  const distribucion = venta.distribucionBancos || { bovedaMonte: 0, fletes: 0, utilidades: 0 }

  if (totalVenta === 0) {
    return {
      proporcion: 0,
      aBovedaMonte: 0,
      aFletes: 0,
      aUtilidades: 0,
    }
  }

  const proporcion = montoAbono / totalVenta

  return {
    proporcion: redondearMonto(proporcion * 100) / 100, // Proporción decimal
    aBovedaMonte: redondearMonto(distribucion.bovedaMonte * proporcion),
    aFletes: redondearMonto(distribucion.fletes * proporcion),
    aUtilidades: redondearMonto(distribucion.utilidades * proporcion),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CÁLCULOS DE RESUMEN / DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export interface ResumenFinanciero {
  /** Capital total (suma de todos los bancos) */
  capitalTotal: number
  /** Capital en MXN (Bóveda Monte, etc) */
  capitalMXN: number
  /** Capital en USD (Bóveda USA) */
  capitalUSD: number
  /** Total de utilidades acumuladas */
  utilidadesAcumuladas: number
  /** Total de deudas de clientes */
  deudaClientes: number
  /** Total de deudas a distribuidores */
  deudaDistribuidores: number
  /** Flujo neto (ingresos - gastos de hoy) */
  flujoNetoHoy: number
}

/**
 * Calcula el resumen financiero del sistema
 */
export function calcularResumenFinanciero(
  bancos: Banco[],
  clientes: Cliente[],
  distribuidores: Distribuidor[],
): ResumenFinanciero {
  let capitalTotal = 0
  let capitalMXN = 0
  let capitalUSD = 0
  let utilidadesAcumuladas = 0

  for (const banco of bancos) {
    const capital = banco.capitalActual || 0
    capitalTotal += capital

    if (banco.id === 'boveda_usa') {
      capitalUSD = capital
    } else if (banco.id === 'utilidades') {
      utilidadesAcumuladas = capital
    } else {
      capitalMXN += capital
    }
  }

  const deudaClientes = clientes.reduce((acc, c) => acc + calcularSaldoCliente(c), 0)
  const deudaDistribuidores = distribuidores.reduce((acc, d) => acc + calcularSaldoDistribuidor(d), 0)

  return {
    capitalTotal: redondearMonto(capitalTotal),
    capitalMXN: redondearMonto(capitalMXN),
    capitalUSD: redondearMonto(capitalUSD),
    utilidadesAcumuladas: redondearMonto(utilidadesAcumuladas),
    deudaClientes: redondearMonto(deudaClientes),
    deudaDistribuidores: redondearMonto(deudaDistribuidores),
    flujoNetoHoy: 0, // TODO: Calcular con movimientos del día
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR SERVICIO COMPLETO
// ═══════════════════════════════════════════════════════════════════════════

export const calculoService = {
  // Constantes
  PRECIO_FLETE_DEFAULT,
  DECIMALES_MONEDA,
  BANCOS_IDS,
  BANCOS_DISTRIBUCION_GYA,
  BANCOS_OPERATIVOS,
  
  // Utilidades
  redondearMonto,
  noNegativo,
  
  // Cálculos principales
  calcularDistribucionGYA,
  calcularOrdenCompra,
  
  // Cálculos de saldos
  calcularSaldoCliente,
  calcularSaldoDistribuidor,
  calcularCapitalBanco,
  
  // Distribución de abonos
  calcularDistribucionAbono,
  
  // Resumen
  calcularResumenFinanciero,
}

export default calculoService
