/**
 * 🏦 BUSINESS OPERATIONS UNIFIED SERVICE - CHRONOS SYSTEM
 * 
 * Servicio de operaciones de negocio con fallback bidireccional:
 * - Intenta Firebase primero (si está disponible)
 * - Si Firebase falla → usa localStorage automáticamente
 * - Retry automático en caso de errores transitorios
 * - Siempre garantiza persistencia de datos
 * 
 * @version 3.0.0 - Versión con fallback bidireccional resiliente
 */

import * as resilientService from './resilient-data-service'
import { logger } from '../utils/logger'
import type { BancoId } from '@/app/types'

// Re-export tipos del servicio resiliente
export type {
  CrearVentaInput as ResilientCrearVentaInput,
  VentaResult as ResilientVentaResult,
  CrearOrdenCompraInput as ResilientCrearOrdenCompraInput,
  OrdenCompraResult as ResilientOrdenCompraResult,
  CrearClienteInput,
  CrearDistribuidorInput,
  TransferenciaInput,
  RegistrarGastoInput,
  RegistrarIngresoInput,
  PagarDistribuidorInput,
  AbonarClienteInput,
} from './resilient-data-service'

// Tipos para las operaciones (compatibilidad con modales existentes)
export interface CrearVentaInput {
  cliente: string
  clienteId?: string
  producto?: string
  ocRelacionada?: string
  cantidad: number
  precioVenta: number
  precioCompra?: number
  precioFlete?: number
  estadoPago: 'completo' | 'parcial' | 'pendiente'
  montoPagado?: number
  metodoPago?: string
  notas?: string
  fecha?: string | Date
}

export interface VentaResult {
  ventaId: string
  clienteId: string
  salidaAlmacenId: string
  totalVenta: number
  bovedaMonte: number
  fletes: number
  utilidades: number
  deudaCliente: number
  storage?: 'firebase' | 'localStorage'
}

export interface CrearOrdenCompraInput {
  distribuidor: string
  distribuidorId?: string
  producto?: string
  cantidad: number
  costoDistribuidor: number
  costoTransporte?: number
  pagoInicial?: number
  bancoOrigen?: BancoId
  notas?: string
  fecha?: string | Date
}

export interface OrdenCompraResult {
  ordenId: string
  distribuidorId: string
  entradaAlmacenId: string
  costoTotal: number
  deudaGenerada: number
  storage?: 'firebase' | 'localStorage'
}

// ============================================================
// OPERACIONES DE VENTA
// ============================================================

/**
 * Crea una venta completa con fallback bidireccional
 * 
 * Lógica GYA:
 * - bovedaMonte = precioCompra × cantidad
 * - fletes = precioFlete × cantidad
 * - utilidades = totalVenta - bovedaMonte - fletes
 * 
 * También:
 * - Crea/actualiza cliente con adeudo
 * - Registra salida de almacén
 * - Actualiza los 3 bancos proporcionalmente
 */
export async function crearVentaCompleta(input: CrearVentaInput): Promise<VentaResult> {
  logger.info('[BusinessOpsUnified] Creando venta con fallback bidireccional', { 
    context: 'BusinessOpsUnified',
    data: { cliente: input.cliente, cantidad: input.cantidad },
  })

  try {
    const result = await resilientService.crearVentaCompleta({
      cliente: input.cliente,
      clienteId: input.clienteId,
      producto: input.producto,
      cantidad: input.cantidad,
      precioVenta: input.precioVenta,
      precioCompra: input.precioCompra,
      precioFlete: input.precioFlete,
      estadoPago: input.estadoPago,
      montoPagado: input.montoPagado,
      metodoPago: input.metodoPago,
      notas: input.notas,
      fecha: input.fecha,
    })

    logger.info('[BusinessOpsUnified] Venta creada exitosamente', {
      context: 'BusinessOpsUnified',
      data: { 
        ventaId: result.ventaId, 
        storage: result.storage,
        totalVenta: result.totalVenta,
      },
    })

    return result
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error creando venta', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

// ============================================================
// OPERACIONES DE ORDEN DE COMPRA
// ============================================================

/**
 * Crea una orden de compra completa con fallback bidireccional
 * 
 * Lógica:
 * - Crea/actualiza distribuidor con deuda
 * - Registra entrada en almacén
 * - Actualiza stock del producto
 * - Descuenta del banco origen (si hay pago inicial)
 */
export async function crearOrdenCompraCompleta(input: CrearOrdenCompraInput): Promise<OrdenCompraResult> {
  logger.info('[BusinessOpsUnified] Creando orden de compra con fallback bidireccional', { 
    context: 'BusinessOpsUnified',
    data: { distribuidor: input.distribuidor, cantidad: input.cantidad },
  })

  try {
    const result = await resilientService.crearOrdenCompraCompleta({
      distribuidor: input.distribuidor,
      distribuidorId: input.distribuidorId,
      producto: input.producto,
      cantidad: input.cantidad,
      costoDistribuidor: input.costoDistribuidor,
      costoTransporte: input.costoTransporte,
      pagoInicial: input.pagoInicial,
      bancoOrigen: input.bancoOrigen,
      notas: input.notas,
      fecha: input.fecha,
    })

    logger.info('[BusinessOpsUnified] Orden de compra creada exitosamente', {
      context: 'BusinessOpsUnified',
      data: { 
        ordenId: result.ordenId, 
        storage: result.storage,
        costoTotal: result.costoTotal,
      },
    })

    return result
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error creando orden de compra', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

// ============================================================
// OPERACIONES DE CLIENTE
// ============================================================

/**
 * Crea un cliente con fallback bidireccional
 */
export async function crearCliente(data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
}): Promise<string | null> {
  try {
    return await resilientService.crearCliente(data)
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error creando cliente', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

// ============================================================
// OPERACIONES DE DISTRIBUIDOR
// ============================================================

/**
 * Crea un distribuidor con fallback bidireccional
 */
export async function crearDistribuidor(data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  origen?: string
}): Promise<string | null> {
  try {
    return await resilientService.crearDistribuidor(data)
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error creando distribuidor', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

// ============================================================
// OPERACIONES BANCARIAS
// ============================================================

/**
 * Realiza una transferencia entre bancos con fallback bidireccional
 */
export async function realizarTransferencia(data: {
  bancoOrigen: string | BancoId
  bancoDestino: string | BancoId
  monto: number
  concepto: string
  descripcion?: string
}): Promise<string | null> {
  try {
    return await resilientService.realizarTransferencia({
      bancoOrigen: data.bancoOrigen as BancoId,
      bancoDestino: data.bancoDestino as BancoId,
      monto: data.monto,
      concepto: data.concepto,
      descripcion: data.descripcion,
    })
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error en transferencia', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

/**
 * Registra un gasto con fallback bidireccional
 */
export async function registrarGasto(data: {
  bancoOrigen: string | BancoId
  monto: number
  concepto: string
  categoria?: string
  notas?: string
}): Promise<string | null> {
  try {
    return await resilientService.registrarGasto({
      bancoOrigen: data.bancoOrigen as BancoId,
      monto: data.monto,
      concepto: data.concepto,
      categoria: data.categoria,
      notas: data.notas,
    })
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error registrando gasto', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

/**
 * Registra un ingreso con fallback bidireccional
 */
export async function registrarIngreso(data: {
  bancoDestino: string | BancoId
  monto: number
  concepto: string
  categoria?: string
  cliente?: string
  notas?: string
}): Promise<string | null> {
  try {
    return await resilientService.registrarIngreso({
      bancoDestino: data.bancoDestino as BancoId,
      monto: data.monto,
      concepto: data.concepto,
      categoria: data.categoria,
      cliente: data.cliente,
      notas: data.notas,
    })
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error registrando ingreso', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

// ============================================================
// OPERACIONES DE PAGO
// ============================================================

/**
 * Pagar a un distribuidor (reduce su deuda) con fallback bidireccional
 */
export async function pagarDistribuidor(input: {
  distribuidorId: string
  ordenCompraId?: string
  monto: number
  bancoOrigen: string | BancoId
  notas?: string
}): Promise<boolean> {
  try {
    return await resilientService.pagarDistribuidor({
      distribuidorId: input.distribuidorId,
      ordenCompraId: input.ordenCompraId,
      monto: input.monto,
      bancoOrigen: input.bancoOrigen as BancoId,
      notas: input.notas,
    })
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error pagando distribuidor', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

/**
 * Abonar a cliente (reduce su adeudo) con fallback bidireccional
 */
export async function abonarCliente(input: {
  clienteId: string
  ventaId?: string
  monto: number
  metodoPago?: string
  notas?: string
}): Promise<boolean> {
  try {
    return await resilientService.abonarCliente({
      clienteId: input.clienteId,
      ventaId: input.ventaId,
      monto: input.monto,
      metodoPago: input.metodoPago,
      notas: input.notas,
    })
  } catch (error) {
    logger.error('[BusinessOpsUnified] Error abonando cliente', error, { context: 'BusinessOpsUnified' })
    throw error
  }
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Obtiene el modo de almacenamiento actual
 */
export function getStorageMode(): 'firebase' | 'localStorage' | 'hybrid' {
  return resilientService.getStorageMode()
}

/**
 * Verifica estado de almacenamiento
 */
export function checkStorageStatus(): { firebase: boolean; localStorage: boolean } {
  return resilientService.checkStorageStatus()
}

// ============================================================
// EXPORT
// ============================================================

export const businessOperationsUnified = {
  // Operaciones principales
  crearVentaCompleta,
  crearOrdenCompraCompleta,
  crearCliente,
  crearDistribuidor,
  
  // Operaciones bancarias
  realizarTransferencia,
  registrarGasto,
  registrarIngreso,
  
  // Pagos
  pagarDistribuidor,
  abonarCliente,
  
  // Utilidades
  getStorageMode,
  checkStorageStatus,
}

export default businessOperationsUnified
