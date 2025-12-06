/**
 * =====================================================================
 * 📊 FÓRMULAS CENTRALIZADAS - FLOWDISTRIBUTOR/CHRONOS SYSTEM
 * =====================================================================
 * 
 * Este archivo consolida TODAS las fórmulas de negocio del sistema.
 * Basado en: FORMULAS_CORRECTAS_VENTAS_Version2.md
 * 
 * IMPORTANTE: Usar SOLO estas funciones para cálculos financieros.
 * NO implementar fórmulas en componentes individuales.
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import type { BancoId, CalculoVentaResult } from '@/app/types'

// =====================================================================
// TIPOS
// =====================================================================

export interface DatosVentaCalculo {
  cantidad: number
  precioVenta: number       // Precio de VENTA al cliente (por unidad)
  precioCompra: number      // Precio de COMPRA/costo del distribuidor (por unidad)
  precioFlete?: number      // Flete por unidad (default: 500)
  montoPagado?: number      // Monto que pagó el cliente
}

export interface DistribucionGYA {
  bovedaMonte: number       // Monto que va a Bóveda Monte (COSTO)
  fletes: number            // Monto que va a Flete Sur (TRANSPORTE)
  utilidades: number        // Monto que va a Utilidades (GANANCIA NETA)
  total: number             // Suma de los 3
}

export interface ResultadoVenta extends DistribucionGYA {
  // Totales de venta
  totalVenta: number
  ingresoVenta: number
  
  // Estado de pago
  estadoPago: 'completo' | 'parcial' | 'pendiente'
  montoPagado: number
  montoRestante: number
  proporcionPagada: number
  
  // Distribución ajustada por pago
  distribucionReal: DistribucionGYA
  
  // Márgenes
  gananciaUnitaria: number
  margenPorcentaje: number
}

export interface DatosOrdenCompra {
  cantidad: number
  costoDistribuidor: number   // Costo por unidad del distribuidor
  costoTransporte?: number    // Costo de transporte por unidad (default: 0)
  pagoInicial?: number        // Pago inicial al crear la OC
}

export interface ResultadoOrdenCompra {
  costoPorUnidad: number
  costoTotal: number
  pagoInicial: number
  deuda: number
  estado: 'pendiente' | 'parcial' | 'completo'
  stockInicial: number
}

// =====================================================================
// CONSTANTES
// =====================================================================

/** Flete por defecto por unidad si no se especifica */
export const FLETE_DEFAULT = 500

/** Bancos que reciben distribución de ventas */
export const BANCOS_DISTRIBUCION: readonly BancoId[] = [
  'boveda_monte',  // Recibe: COSTO
  'flete_sur',     // Recibe: FLETE
  'utilidades',    // Recibe: GANANCIA
] as const

// =====================================================================
// FÓRMULAS DE VENTA - DISTRIBUCIÓN GYA
// =====================================================================

/**
 * Calcula la distribución GYA (Ganancia Y Asignación) de una venta
 * 
 * Fórmulas según FORMULAS_CORRECTAS_VENTAS_Version2.md:
 * - Bóveda Monte = precioCompra × cantidad (COSTO del distribuidor)
 * - Flete Sur = precioFlete × cantidad (TRANSPORTE)
 * - Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad (GANANCIA NETA)
 * 
 * @param datos - Datos de la venta
 * @returns Distribución a los 3 bancos
 */
export function calcularDistribucionGYA(datos: DatosVentaCalculo): DistribucionGYA {
  const { cantidad, precioVenta, precioCompra, precioFlete = FLETE_DEFAULT } = datos
  
  // Validaciones
  if (cantidad <= 0) {
    return { bovedaMonte: 0, fletes: 0, utilidades: 0, total: 0 }
  }
  
  // Cálculos según fórmulas del documento
  const bovedaMonte = precioCompra * cantidad
  const fletes = precioFlete * cantidad
  const utilidades = (precioVenta - precioCompra - precioFlete) * cantidad
  const total = bovedaMonte + fletes + utilidades
  
  return {
    bovedaMonte,
    fletes,
    utilidades,
    total,
  }
}

/**
 * Calcula el resultado completo de una venta incluyendo estado de pago
 * 
 * Estados de pago:
 * - COMPLETO: 100% pagado → distribuye 100% a los 3 bancos
 * - PARCIAL: X% pagado → distribuye X% proporcionalmente
 * - PENDIENTE: $0 pagado → registra en histórico pero capital actual = 0
 * 
 * @param datos - Datos de la venta
 * @returns Resultado completo con distribución y estado
 */
export function calcularVentaCompleta(datos: DatosVentaCalculo): ResultadoVenta {
  const { cantidad, precioVenta, precioCompra, precioFlete = FLETE_DEFAULT, montoPagado = 0 } = datos
  
  // Total de la venta
  const totalVenta = precioVenta * cantidad
  const ingresoVenta = totalVenta
  
  // Distribución base (100%)
  const distribucionBase = calcularDistribucionGYA(datos)
  
  // Estado de pago y proporción
  let estadoPago: 'completo' | 'parcial' | 'pendiente' = 'pendiente'
  const montoRestante = totalVenta - montoPagado
  let proporcionPagada = 0
  
  if (montoPagado >= totalVenta) {
    estadoPago = 'completo'
    proporcionPagada = 1
  } else if (montoPagado > 0) {
    estadoPago = 'parcial'
    proporcionPagada = montoPagado / totalVenta
  }
  
  // Distribución real según lo pagado
  const distribucionReal: DistribucionGYA = {
    bovedaMonte: distribucionBase.bovedaMonte * proporcionPagada,
    fletes: distribucionBase.fletes * proporcionPagada,
    utilidades: distribucionBase.utilidades * proporcionPagada,
    total: distribucionBase.total * proporcionPagada,
  }
  
  // Márgenes
  const gananciaUnitaria = precioVenta - precioCompra - precioFlete
  const margenPorcentaje = precioVenta > 0 
    ? (gananciaUnitaria / precioVenta) * 100 
    : 0
  
  return {
    // Distribución base
    ...distribucionBase,
    
    // Totales
    totalVenta,
    ingresoVenta,
    
    // Estado de pago
    estadoPago,
    montoPagado,
    montoRestante,
    proporcionPagada,
    
    // Distribución ajustada
    distribucionReal,
    
    // Márgenes
    gananciaUnitaria,
    margenPorcentaje,
  }
}

/**
 * Calcula la distribución para un abono de cliente (pago parcial posterior)
 * 
 * Cuando un cliente abona a una deuda existente, el monto se distribuye
 * proporcionalmente a los 3 bancos según la distribución original de la venta.
 * 
 * @param distribucionOriginal - Distribución original de la venta
 * @param totalVenta - Total original de la venta
 * @param montoAbono - Monto del abono
 * @returns Distribución del abono a los 3 bancos
 */
export function calcularDistribucionAbono(
  distribucionOriginal: DistribucionGYA,
  totalVenta: number,
  montoAbono: number,
): DistribucionGYA {
  if (totalVenta <= 0 || montoAbono <= 0) {
    return { bovedaMonte: 0, fletes: 0, utilidades: 0, total: 0 }
  }
  
  const proporcion = montoAbono / totalVenta
  
  return {
    bovedaMonte: distribucionOriginal.bovedaMonte * proporcion,
    fletes: distribucionOriginal.fletes * proporcion,
    utilidades: distribucionOriginal.utilidades * proporcion,
    total: distribucionOriginal.total * proporcion,
  }
}

// =====================================================================
// FÓRMULAS DE ÓRDENES DE COMPRA
// =====================================================================

/**
 * Calcula el resultado de una orden de compra
 * 
 * @param datos - Datos de la OC
 * @returns Resultado con costos, deuda y estado
 */
export function calcularOrdenCompra(datos: DatosOrdenCompra): ResultadoOrdenCompra {
  const { cantidad, costoDistribuidor, costoTransporte = 0, pagoInicial = 0 } = datos
  
  const costoPorUnidad = costoDistribuidor + costoTransporte
  const costoTotal = costoPorUnidad * cantidad
  const deuda = costoTotal - pagoInicial
  
  let estado: 'pendiente' | 'parcial' | 'completo' = 'pendiente'
  if (deuda <= 0) {
    estado = 'completo'
  } else if (pagoInicial > 0) {
    estado = 'parcial'
  }
  
  return {
    costoPorUnidad,
    costoTotal,
    pagoInicial,
    deuda: Math.max(0, deuda),
    estado,
    stockInicial: cantidad,
  }
}

// =====================================================================
// FÓRMULAS DE CAPITAL BANCARIO
// =====================================================================

/**
 * Calcula el capital actual de un banco
 * 
 * Fórmula: capitalActual = historicoIngresos - historicoGastos
 * 
 * IMPORTANTE: historicoIngresos y historicoGastos son ACUMULATIVOS FIJOS
 * y NUNCA disminuyen (principio de inmutabilidad del sistema)
 * 
 * @param historicoIngresos - Total de ingresos acumulados
 * @param historicoGastos - Total de gastos acumulados
 * @returns Capital actual
 */
export function calcularCapitalBanco(
  historicoIngresos: number,
  historicoGastos: number,
): number {
  return historicoIngresos - historicoGastos
}

/**
 * Calcula el balance de un banco incluyendo transferencias
 * 
 * @param historicoIngresos - Total ingresos
 * @param historicoGastos - Total gastos
 * @param transferenciasEntrada - Transferencias recibidas
 * @param transferenciasSalida - Transferencias enviadas
 * @returns Balance actual
 */
export function calcularBalanceBanco(
  historicoIngresos: number,
  historicoGastos: number,
  transferenciasEntrada: number = 0,
  transferenciasSalida: number = 0,
): number {
  return (historicoIngresos + transferenciasEntrada) - (historicoGastos + transferenciasSalida)
}

// =====================================================================
// FÓRMULAS DE DEUDA
// =====================================================================

/**
 * Calcula la deuda pendiente de un cliente
 * 
 * @param totalVentas - Suma de todas las ventas al cliente
 * @param totalPagado - Suma de todos los pagos del cliente
 * @returns Deuda pendiente
 */
export function calcularDeudaCliente(
  totalVentas: number,
  totalPagado: number,
): number {
  return Math.max(0, totalVentas - totalPagado)
}

/**
 * Calcula la deuda pendiente con un distribuidor
 * 
 * @param totalOrdenes - Suma de todas las órdenes de compra
 * @param totalPagado - Suma de todos los pagos al distribuidor
 * @returns Deuda pendiente
 */
export function calcularDeudaDistribuidor(
  totalOrdenes: number,
  totalPagado: number,
): number {
  return Math.max(0, totalOrdenes - totalPagado)
}

// =====================================================================
// FÓRMULAS DE STOCK/INVENTARIO
// =====================================================================

/**
 * Calcula el stock actual de un producto
 * 
 * @param stockInicial - Stock inicial del producto
 * @param entradas - Total de entradas (compras)
 * @param salidas - Total de salidas (ventas)
 * @returns Stock actual
 */
export function calcularStockActual(
  stockInicial: number,
  entradas: number,
  salidas: number,
): number {
  return Math.max(0, stockInicial + entradas - salidas)
}

/**
 * Verifica si hay stock suficiente para una venta
 * 
 * @param stockActual - Stock disponible
 * @param cantidadSolicitada - Cantidad a vender
 * @returns true si hay stock suficiente
 */
export function validarStock(
  stockActual: number,
  cantidadSolicitada: number,
): boolean {
  return stockActual >= cantidadSolicitada
}

/**
 * Calcula el valor del inventario
 * 
 * @param items - Array de { cantidad, valorUnitario }
 * @returns Valor total del inventario
 */
export function calcularValorInventario(
  items: Array<{ cantidad: number; valorUnitario: number }>,
): number {
  return items.reduce((sum, item) => sum + (item.cantidad * item.valorUnitario), 0)
}

// =====================================================================
// FÓRMULAS DE UTILIDAD/MARGEN
// =====================================================================

/**
 * Calcula la utilidad bruta de una venta
 * 
 * @param precioVenta - Precio de venta por unidad
 * @param precioCompra - Precio de compra por unidad
 * @param cantidad - Cantidad vendida
 * @returns Utilidad bruta
 */
export function calcularUtilidadBruta(
  precioVenta: number,
  precioCompra: number,
  cantidad: number,
): number {
  return (precioVenta - precioCompra) * cantidad
}

/**
 * Calcula la utilidad neta (descontando flete)
 * 
 * @param precioVenta - Precio de venta por unidad
 * @param precioCompra - Precio de compra por unidad
 * @param precioFlete - Flete por unidad
 * @param cantidad - Cantidad vendida
 * @returns Utilidad neta
 */
export function calcularUtilidadNeta(
  precioVenta: number,
  precioCompra: number,
  precioFlete: number,
  cantidad: number,
): number {
  return (precioVenta - precioCompra - precioFlete) * cantidad
}

/**
 * Calcula el margen de ganancia en porcentaje
 * 
 * @param precioVenta - Precio de venta
 * @param costo - Costo total (compra + flete)
 * @returns Margen en porcentaje
 */
export function calcularMargenPorcentaje(
  precioVenta: number,
  costo: number,
): number {
  if (precioVenta <= 0) return 0
  return ((precioVenta - costo) / precioVenta) * 100
}

// =====================================================================
// CONVERSIÓN A CalculoVentaResult (compatibilidad con tipos existentes)
// =====================================================================

/**
 * Convierte el resultado de una venta al tipo CalculoVentaResult
 * para compatibilidad con componentes existentes
 * 
 * @param datos - Datos de la venta
 * @returns CalculoVentaResult compatible con el sistema
 */
export function calcularVentaResultLegacy(datos: DatosVentaCalculo): CalculoVentaResult {
  const resultado = calcularVentaCompleta(datos)
  const { cantidad, precioCompra, precioFlete = FLETE_DEFAULT } = datos
  
  const costoPorUnidad = precioCompra + precioFlete
  const costoTotalLote = costoPorUnidad * cantidad
  
  return {
    // Costos
    costoPorUnidad,
    costoTotalLote,
    
    // Venta
    ingresoVenta: resultado.ingresoVenta,
    totalVenta: resultado.totalVenta,
    
    // Distribución a bancos
    montoBovedaMonte: resultado.bovedaMonte,
    montoFletes: resultado.fletes,
    montoUtilidades: resultado.utilidades,
    
    // Ganancias
    gananciaBruta: resultado.utilidades,
    gananciaDesdeCSV: resultado.utilidades,
    
    // Para pagos parciales
    proporcionPagada: resultado.proporcionPagada,
    distribucionParcial: {
      bovedaMonte: resultado.distribucionReal.bovedaMonte,
      fletes: resultado.distribucionReal.fletes,
      utilidades: resultado.distribucionReal.utilidades,
    },
    
    // Margen
    margenPorcentaje: resultado.margenPorcentaje,
    
    // Propiedades legacy
    precioTotalVenta: resultado.totalVenta,
    bovedaMonte: resultado.bovedaMonte,
    fletes: resultado.fletes,
    utilidades: resultado.utilidades,
    totalDistribuido: resultado.total,
    ganancia: resultado.utilidades,
  }
}

// =====================================================================
// EXPORTACIONES
// =====================================================================

export const formulas = {
  // Ventas
  calcularDistribucionGYA,
  calcularVentaCompleta,
  calcularDistribucionAbono,
  calcularVentaResultLegacy,
  
  // Órdenes de compra
  calcularOrdenCompra,
  
  // Capital bancario
  calcularCapitalBanco,
  calcularBalanceBanco,
  
  // Deudas
  calcularDeudaCliente,
  calcularDeudaDistribuidor,
  
  // Stock
  calcularStockActual,
  validarStock,
  calcularValorInventario,
  
  // Utilidad
  calcularUtilidadBruta,
  calcularUtilidadNeta,
  calcularMargenPorcentaje,
  
  // Constantes
  FLETE_DEFAULT,
  BANCOS_DISTRIBUCION,
}

export default formulas
