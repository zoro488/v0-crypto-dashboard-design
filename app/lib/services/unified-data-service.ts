/**
 * 🔄 UNIFIED DATA SERVICE - CHRONOS SYSTEM
 * Servicio unificado que usa SOLO localStorage
 * 
 * 🚨 MODO LOCAL FORZADO - Firebase deshabilitado completamente
 * Este archivo es un stub que redirige todo a localStorage
 * 
 * @version 3.0.0 - Solo localStorage, sin Firebase
 */

import * as localService from '../storage/local-storage-service'
import { logger } from '../utils/logger'
import type { BancoId } from '@/app/types'

// 🚨 SIEMPRE usar localStorage - Firebase deshabilitado
const useLocalStorage = true

// Inicializar modo de operación
if (typeof window !== 'undefined') {
  logger.info('📦 MODO LOCAL FORZADO - Usando solo localStorage', { context: 'UnifiedDataService' })
}

/**
 * Ejecuta operación - SOLO localStorage
 */
async function withFallback<T>(
  operationName: string,
  localOp: () => T | Promise<T>,
): Promise<T> {
  logger.info(`[UnifiedDataService] ${operationName}: Ejecutando en localStorage`, { context: 'UnifiedDataService' })
  return localOp()
}

/**
 * Wrapper para suscripciones - SOLO localStorage
 */
function subscribeWithFallback<T>(
  operationName: string,
  localSubscribe: (cb: (data: T[]) => void) => () => void,
  callback: (data: T[]) => void,
): () => void {
  logger.info(`[UnifiedDataService] ${operationName}: Suscripción localStorage`, { context: 'UnifiedDataService' })
  return localSubscribe(callback)
}

// ============================================================
// BANCOS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirBancos = (callback: (bancos: any[]) => void) => {
  return subscribeWithFallback('suscribirBancos', localService.localSuscribirBancos, callback)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const obtenerBanco = async (bancoId: string): Promise<any | null> => {
  return withFallback('obtenerBanco', () => localService.localObtenerBanco(bancoId))
}

export const actualizarCapitalBanco = async (
  bancoId: string,
  monto: number,
  tipo: 'ingreso' | 'gasto' | 'transferencia',
) => {
  return withFallback('actualizarCapitalBanco', () => 
    localService.localActualizarCapitalBanco(bancoId, monto, tipo),
  )
}

// ============================================================
// CLIENTES
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearCliente = async (data: any): Promise<string> => {
  return withFallback('crearCliente', () => localService.localCrearCliente(data))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actualizarCliente = async (clienteId: string, data: any): Promise<void> => {
  await withFallback('actualizarCliente', () => localService.localActualizarCliente(clienteId, data))
}

export const eliminarCliente = async (clienteId: string): Promise<void> => {
  await withFallback('eliminarCliente', () => localService.localEliminarCliente(clienteId))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirClientes = (callback: (clientes: any[]) => void) => {
  return subscribeWithFallback('suscribirClientes', localService.localSuscribirClientes, callback)
}

export const cobrarCliente = async (
  clienteId: string,
  ventaId: string,
  monto: number,
): Promise<void> => {
  return withFallback('cobrarCliente', () => 
    localService.localCobrarCliente(clienteId, ventaId, monto),
  )
}

// ============================================================
// VENTAS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearVenta = async (data: any): Promise<string> => {
  return withFallback('crearVenta', () => localService.localCrearVenta(data))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirVentas = (callback: (ventas: any[]) => void) => {
  return subscribeWithFallback('suscribirVentas', localService.localSuscribirVentas, callback)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actualizarVenta = async (ventaId: string, data: any): Promise<void> => {
  await withFallback('actualizarVenta', () => localService.localActualizarVenta(ventaId, data))
}

export const eliminarVenta = async (ventaId: string): Promise<void> => {
  await withFallback('eliminarVenta', () => localService.localEliminarVenta(ventaId))
}

// ============================================================
// DISTRIBUIDORES
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearDistribuidor = async (data: any): Promise<string> => {
  return withFallback('crearDistribuidor', () => localService.localCrearDistribuidor(data))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirDistribuidores = (callback: (distribuidores: any[]) => void) => {
  return subscribeWithFallback('suscribirDistribuidores', localService.localSuscribirDistribuidores, callback)
}

export const pagarDistribuidor = async (
  distribuidorId: string,
  ordenCompraId: string,
  monto: number,
  bancoOrigenId: BancoId,
): Promise<void> => {
  await withFallback('pagarDistribuidor', () => 
    localService.localPagarDistribuidor(distribuidorId, ordenCompraId, monto, bancoOrigenId),
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actualizarDistribuidor = async (distribuidorId: string, data: any): Promise<void> => {
  await withFallback('actualizarDistribuidor', () => 
    localService.localActualizarDistribuidor(distribuidorId, data),
  )
}

export const eliminarDistribuidor = async (distribuidorId: string): Promise<void> => {
  await withFallback('eliminarDistribuidor', () => localService.localEliminarDistribuidor(distribuidorId))
}

// ============================================================
// ÓRDENES DE COMPRA
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearOrdenCompra = async (data: any): Promise<string> => {
  return withFallback('crearOrdenCompra', () => localService.localCrearOrdenCompra(data))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirOrdenesCompra = (callback: (ordenes: any[]) => void) => {
  return subscribeWithFallback('suscribirOrdenesCompra', localService.localSuscribirOrdenesCompra, callback)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actualizarOrdenCompra = async (ordenId: string, data: any): Promise<void> => {
  await withFallback('actualizarOrdenCompra', () => localService.localActualizarOrdenCompra(ordenId, data))
}

export const eliminarOrdenCompra = async (ordenId: string): Promise<void> => {
  await withFallback('eliminarOrdenCompra', () => localService.localEliminarOrdenCompra(ordenId))
}

// ============================================================
// PRODUCTOS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearProducto = async (data: any): Promise<string> => {
  return withFallback('crearProducto', () => localService.localCrearProducto(data))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirProductos = (callback: (productos: any[]) => void) => {
  return subscribeWithFallback('suscribirProductos', localService.localSuscribirAlmacen, callback)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actualizarProducto = async (productoId: string, data: any): Promise<void> => {
  await withFallback('actualizarProducto', () => localService.localActualizarProducto(productoId, data))
}

export const eliminarProducto = async (productoId: string): Promise<void> => {
  await withFallback('eliminarProducto', () => localService.localEliminarProducto(productoId))
}

// ============================================================
// MOVIMIENTOS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirMovimientos = (callback: (movimientos: any[]) => void) => {
  return subscribeWithFallback('suscribirMovimientos', localService.localSuscribirMovimientos, callback)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearMovimiento = async (data: any): Promise<string> => {
  return withFallback('crearMovimiento', () => localService.localCrearMovimiento(data))
}

// ============================================================
// ALMACÉN - ENTRADAS Y SALIDAS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirEntradasAlmacen = (callback: (entradas: any[]) => void) => {
  return subscribeWithFallback('suscribirEntradasAlmacen', 
    localService.localSuscribirEntradasAlmacen || (() => () => {}), 
    callback,
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirSalidasAlmacen = (callback: (salidas: any[]) => void) => {
  return subscribeWithFallback('suscribirSalidasAlmacen', 
    localService.localSuscribirSalidasAlmacen || (() => () => {}), 
    callback,
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearEntradaAlmacen = async (data: any): Promise<string> => {
  return withFallback('crearEntradaAlmacen', () => 
    localService.localCrearEntradaAlmacen ? localService.localCrearEntradaAlmacen(data) : 'local-' + Date.now(),
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearSalidaAlmacen = async (data: any): Promise<string> => {
  return withFallback('crearSalidaAlmacen', () => 
    localService.localCrearSalidaAlmacen ? localService.localCrearSalidaAlmacen(data) : 'local-' + Date.now(),
  )
}

export const obtenerEntradasAlmacen = async () => 
  localService.localObtenerEntradasAlmacen ? localService.localObtenerEntradasAlmacen() : []

export const obtenerSalidasAlmacen = async () => 
  localService.localObtenerSalidasAlmacen ? localService.localObtenerSalidasAlmacen() : []

// ============================================================
// UTILIDADES DE ESTADO
// ============================================================

export const getStorageMode = (): 'localStorage' => 'localStorage'
export const isUsingLocalStorage = (): boolean => true

export const checkStorageStatus = (): { firebase: boolean; localStorage: boolean } => ({
  firebase: false, // Firebase deshabilitado
  localStorage: typeof window !== 'undefined' && typeof localStorage !== 'undefined',
})

// ============================================================
// ALMACÉN GENERAL
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirAlmacen = (callback: (productos: any[]) => void) => {
  return subscribeWithFallback('suscribirAlmacen', localService.localSuscribirAlmacen, callback)
}

// ============================================================
// TRANSFERENCIAS
// ============================================================

export interface TransferenciaData {
  bancoOrigenId: string
  bancoDestinoId: string
  monto: number
  concepto?: string
  fecha?: string
}

 
export const addTransferencia = async (data: TransferenciaData): Promise<string | null> => {
  return withFallback('addTransferencia', () => 
    localService.localCrearTransferencia ? localService.localCrearTransferencia({
      ...data,
      concepto: data.concepto || `Transferencia de ${data.bancoOrigenId} a ${data.bancoDestinoId}`,
    }) : 'local-' + Date.now(),
  )
}

export const crearTransferencia = async (
  bancoOrigenId: BancoId,
  bancoDestinoId: BancoId,
  monto: number,
  concepto?: string,
): Promise<string | null> => {
  return addTransferencia({ bancoOrigenId, bancoDestinoId, monto, concepto })
}

// ============================================================
// ABONOS
// ============================================================

export interface AbonoData {
  clienteId?: string
  distribuidorId?: string
  monto: number
  bancoDestinoId?: string
  concepto?: string
  fecha?: string
}

 
export const addAbono = async (data: AbonoData): Promise<string | null> => {
  return withFallback('addAbono', () => 
    localService.localCrearAbono ? localService.localCrearAbono({
      tipo: data.clienteId ? 'cliente' : 'distribuidor',
      entidadId: data.clienteId || data.distribuidorId || '',
      monto: data.monto,
      bancoDestino: data.bancoDestinoId || 'utilidades',
      metodo: (data.concepto || 'efectivo') as 'efectivo' | 'transferencia' | 'cheque',
    }) : 'local-' + Date.now(),
  )
}

// ============================================================
// INGRESOS Y GASTOS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearIngreso = async (data: any): Promise<string | null> => {
  return withFallback('crearIngreso', () => 
    localService.localCrearIngreso ? localService.localCrearIngreso(data) : 'local-' + Date.now(),
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const crearGasto = async (data: any): Promise<string | null> => {
  return withFallback('crearGasto', () => 
    localService.localCrearGasto ? localService.localCrearGasto(data) : 'local-' + Date.now(),
  )
}

// ============================================================
// ÓRDENES DE COMPRA - UTILIDADES
// ============================================================

export const obtenerSiguienteIdOrdenCompra = async (): Promise<string> => {
  return withFallback('obtenerSiguienteIdOrdenCompra', () => {
    if (localService.localObtenerSiguienteIdOrdenCompra) {
      return localService.localObtenerSiguienteIdOrdenCompra()
    }
    return `OC${String(Date.now()).slice(-4).padStart(4, '0')}`
  })
}

// ============================================================
// ALIAS PARA COMPATIBILIDAD
// ============================================================

export const obtenerVentas = async () => localService.localObtenerVentas()
export const obtenerClientes = async () => localService.localObtenerClientes()
export const obtenerDistribuidores = async () => localService.localObtenerDistribuidores()
export const obtenerOrdenesCompra = async () => localService.localObtenerOrdenesCompra()
export const obtenerProductos = async () => localService.localObtenerProductos()
export const obtenerMovimientos = async () => localService.localObtenerMovimientos()
export const obtenerBancos = async () => localService.localObtenerBancos()

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
  // Bancos
  suscribirBancos,
  obtenerBanco,
  obtenerBancos,
  actualizarCapitalBanco,
  // Clientes
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  suscribirClientes,
  obtenerClientes,
  cobrarCliente,
  // Ventas
  crearVenta,
  actualizarVenta,
  eliminarVenta,
  suscribirVentas,
  obtenerVentas,
  // Distribuidores
  crearDistribuidor,
  actualizarDistribuidor,
  eliminarDistribuidor,
  suscribirDistribuidores,
  obtenerDistribuidores,
  pagarDistribuidor,
  // Órdenes
  crearOrdenCompra,
  actualizarOrdenCompra,
  eliminarOrdenCompra,
  suscribirOrdenesCompra,
  obtenerOrdenesCompra,
  // Productos
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  suscribirProductos,
  obtenerProductos,
  // Movimientos
  crearMovimiento,
  suscribirMovimientos,
  obtenerMovimientos,
  // Almacén
  suscribirEntradasAlmacen,
  suscribirSalidasAlmacen,
  crearEntradaAlmacen,
  crearSalidaAlmacen,
  obtenerEntradasAlmacen,
  obtenerSalidasAlmacen,
  // Estado
  getStorageMode,
  isUsingLocalStorage,
  checkStorageStatus,
  // Transferencias/Abonos
  addTransferencia,
  crearTransferencia,
  addAbono,
  crearIngreso,
  crearGasto,
  // Almacén general
  suscribirAlmacen,
  obtenerSiguienteIdOrdenCompra,
}

// Alias para compatibilidad con imports antiguos
export const unifiedDataService = {
  // Bancos
  suscribirBancos,
  obtenerBanco,
  obtenerBancos,
  actualizarCapitalBanco,
  // Clientes
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  suscribirClientes,
  obtenerClientes,
  cobrarCliente,
  // Ventas
  crearVenta,
  actualizarVenta,
  eliminarVenta,
  suscribirVentas,
  obtenerVentas,
  // Distribuidores
  crearDistribuidor,
  actualizarDistribuidor,
  eliminarDistribuidor,
  suscribirDistribuidores,
  obtenerDistribuidores,
  pagarDistribuidor,
  // Órdenes
  crearOrdenCompra,
  actualizarOrdenCompra,
  eliminarOrdenCompra,
  suscribirOrdenesCompra,
  obtenerOrdenesCompra,
  // Productos
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  suscribirProductos,
  obtenerProductos,
  // Movimientos
  crearMovimiento,
  suscribirMovimientos,
  obtenerMovimientos,
  // Almacén
  suscribirEntradasAlmacen,
  suscribirSalidasAlmacen,
  crearEntradaAlmacen,
  crearSalidaAlmacen,
  obtenerEntradasAlmacen,
  obtenerSalidasAlmacen,
  suscribirAlmacen,
  // Estado
  getStorageMode,
  isUsingLocalStorage,
  checkStorageStatus,
  // Transferencias/Abonos
  addTransferencia,
  crearTransferencia,
  addAbono,
  crearIngreso,
  crearGasto,
  obtenerSiguienteIdOrdenCompra,
}
