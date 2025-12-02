/**
 * 🔄 UNIFIED DATA SERVICE - CHRONOS SYSTEM
 * Servicio unificado que automáticamente usa Firebase o localStorage
 * 
 * - Si Firebase está configurado: usa Firestore
 * - Si no hay Firebase: usa localStorage (persistencia local)
 * 
 * @version 1.0.0
 */

import { isFirestoreAvailable } from '../firebase/config'
import * as firestoreService from '../firebase/firestore-service'
import * as localService from '../storage/local-storage-service'
import { logger } from '../utils/logger'

// Flag para modo de operación
let useLocalStorage = false

// Inicializar modo de operación
if (typeof window !== 'undefined') {
  useLocalStorage = !isFirestoreAvailable()
  if (useLocalStorage) {
    logger.info('📦 Usando almacenamiento LOCAL (localStorage)', { context: 'UnifiedDataService' })
  } else {
    logger.info('🔥 Usando almacenamiento FIREBASE (Firestore)', { context: 'UnifiedDataService' })
  }
}

// ============================================================
// BANCOS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirBancos = (callback: (bancos: any[]) => void) => {
  if (useLocalStorage) {
    return localService.localSuscribirBancos(callback)
  }
  return firestoreService.suscribirBancos(callback)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const obtenerBanco = async (bancoId: string): Promise<any | null> => {
  if (useLocalStorage) {
    return localService.localObtenerBanco(bancoId)
  }
  return firestoreService.obtenerBanco(bancoId)
}

export const actualizarCapitalBanco = async (
  bancoId: string,
  monto: number,
  tipo: 'ingreso' | 'gasto' | 'transferencia',
) => {
  if (useLocalStorage) {
    return localService.localActualizarCapitalBanco(bancoId, monto, tipo)
  }
  return firestoreService.actualizarCapitalBanco(bancoId, monto, tipo)
}

// ============================================================
// CLIENTES
// ============================================================

export const crearCliente = async (data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearCliente(data)
    } catch (error) {
      logger.error('Error creando cliente local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.crearCliente(data)
}

export const actualizarCliente = async (clienteId: string, data: Partial<unknown>): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localActualizarCliente(clienteId, data)
    } catch (error) {
      logger.error('Error actualizando cliente local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.actualizarCliente(clienteId, data)
}

export const eliminarCliente = async (clienteId: string): Promise<boolean> => {
  if (useLocalStorage) {
    return localService.localEliminarCliente(clienteId)
  }
  return firestoreService.eliminarCliente(clienteId)
}

export const suscribirClientes = (callback: (clientes: unknown[]) => void) => {
  if (useLocalStorage) {
    return localService.localSuscribirClientes(callback)
  }
  return firestoreService.suscribirClientes(callback)
}

export const cobrarCliente = async (clienteId: string, ventaId: string, monto: number) => {
  if (useLocalStorage) {
    // Para cobrar cliente en local, usamos el sistema de abonos
    return localService.localCrearAbono({
      tipo: 'cliente',
      entidadId: clienteId,
      monto,
      bancoDestino: 'boveda_monte', // Default
      metodo: 'efectivo',
    })
  }
  return firestoreService.cobrarCliente(clienteId, ventaId, monto)
}

// ============================================================
// VENTAS
// ============================================================

export const crearVenta = async (data: {
  cliente: string
  clienteId?: string
  producto?: string
  cantidad: number
  precioVenta?: number
  precioTotalVenta?: number
  precioCompra?: number
  precioFlete?: number
  flete?: 'Aplica' | 'NoAplica'
  montoPagado?: number
  concepto?: string
  notas?: string
  fecha?: string | Date
}): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearVenta({
        ...data,
        fecha: data.fecha instanceof Date ? data.fecha.toISOString() : data.fecha,
      })
    } catch (error) {
      logger.error('Error creando venta local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.crearVenta(data)
}

export const suscribirVentas = (callback: (ventas: unknown[]) => void) => {
  if (useLocalStorage) {
    return localService.localSuscribirVentas(callback)
  }
  return firestoreService.suscribirVentas(callback)
}

export const actualizarVenta = async (ventaId: string, data: Partial<unknown>): Promise<string | null> => {
  if (useLocalStorage) {
    logger.warn('actualizarVenta no implementada en modo local', { context: 'UnifiedDataService' })
    return null
  }
  return firestoreService.actualizarVenta(ventaId, data)
}

export const eliminarVenta = async (ventaId: string): Promise<boolean> => {
  if (useLocalStorage) {
    logger.warn('eliminarVenta no implementada en modo local', { context: 'UnifiedDataService' })
    return false
  }
  return firestoreService.eliminarVenta(ventaId)
}

// ============================================================
// DISTRIBUIDORES
// ============================================================

export const crearDistribuidor = async (data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  origen?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearDistribuidor(data)
    } catch (error) {
      logger.error('Error creando distribuidor local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.crearDistribuidor(data)
}

export const suscribirDistribuidores = (callback: (distribuidores: unknown[]) => void) => {
  if (useLocalStorage) {
    return localService.localSuscribirDistribuidores(callback)
  }
  return firestoreService.suscribirDistribuidores(callback)
}

export const pagarDistribuidor = async (
  distribuidorId: string,
  ordenCompraId: string,
  monto: number,
  bancoOrigenId: string,
) => {
  if (useLocalStorage) {
    return localService.localPagarDistribuidor(distribuidorId, ordenCompraId, monto, bancoOrigenId)
  }
  return firestoreService.pagarDistribuidor(distribuidorId, ordenCompraId, monto, bancoOrigenId)
}

export const actualizarDistribuidor = async (distribuidorId: string, data: Partial<unknown>): Promise<string | null> => {
  if (useLocalStorage) {
    logger.warn('actualizarDistribuidor no implementada en modo local', { context: 'UnifiedDataService' })
    return null
  }
  return firestoreService.actualizarDistribuidor(distribuidorId, data)
}

export const eliminarDistribuidor = async (distribuidorId: string): Promise<boolean> => {
  if (useLocalStorage) {
    logger.warn('eliminarDistribuidor no implementada en modo local', { context: 'UnifiedDataService' })
    return false
  }
  return firestoreService.eliminarDistribuidor(distribuidorId)
}

// ============================================================
// ÓRDENES DE COMPRA
// ============================================================

export const crearOrdenCompra = async (data: {
  distribuidor: string
  distribuidorId?: string
  producto?: string
  cantidad: number
  costoTotal?: number
  costoPorUnidad?: number
  pagoDistribuidor?: number
  bancoOrigen?: string
  fecha?: string | Date
  origen?: string
  notas?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearOrdenCompra({
        ...data,
        fecha: data.fecha instanceof Date ? data.fecha.toISOString() : data.fecha,
      })
    } catch (error) {
      logger.error('Error creando orden de compra local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  // Cast para compatibilidad con tipos de Firestore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return firestoreService.crearOrdenCompra(data as any)
}

export const suscribirOrdenesCompra = (callback: (ordenes: unknown[]) => void) => {
  if (useLocalStorage) {
    return localService.localSuscribirOrdenesCompra(callback)
  }
  return firestoreService.suscribirOrdenesCompra(callback)
}

export const actualizarOrdenCompra = async (ordenId: string, data: Partial<unknown>): Promise<string | null> => {
  if (useLocalStorage) {
    logger.warn('actualizarOrdenCompra no implementada en modo local', { context: 'UnifiedDataService' })
    return null
  }
  return firestoreService.actualizarOrdenCompra(ordenId, data)
}

export const eliminarOrdenCompra = async (ordenId: string): Promise<boolean> => {
  if (useLocalStorage) {
    logger.warn('eliminarOrdenCompra no implementada en modo local', { context: 'UnifiedDataService' })
    return false
  }
  return firestoreService.eliminarOrdenCompra(ordenId)
}

// ============================================================
// ALMACÉN / PRODUCTOS
// ============================================================

export const crearProducto = async (data: {
  nombre: string
  categoria?: string
  origen?: string
  unidad?: string
  stockInicial?: number
  valorUnitario?: number
  stockMinimo?: number
  descripcion?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearProducto(data)
    } catch (error) {
      logger.error('Error creando producto local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.crearProducto(data)
}

export const suscribirAlmacen = (callback: (productos: unknown[]) => void) => {
  if (useLocalStorage) {
    return localService.localSuscribirAlmacen(callback)
  }
  return firestoreService.suscribirAlmacen(callback)
}

export const crearEntradaAlmacen = async (data: {
  productoId: string
  cantidad: number
  origen: string
  costoUnitario?: number
  ordenCompraId?: string
  notas?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    logger.warn('crearEntradaAlmacen no implementada en modo local', { context: 'UnifiedDataService' })
    return null
  }
  return firestoreService.crearEntradaAlmacen(data)
}

export const crearSalidaAlmacen = async (data: {
  productoId: string
  cantidad: number
  destino: string
  ventaId?: string
  motivo?: string
  notas?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    logger.warn('crearSalidaAlmacen no implementada en modo local', { context: 'UnifiedDataService' })
    return null
  }
  return firestoreService.crearSalidaAlmacen(data)
}

export const actualizarProducto = async (productoId: string, data: Partial<unknown>): Promise<string | null> => {
  if (useLocalStorage) {
    logger.warn('actualizarProducto no implementada en modo local', { context: 'UnifiedDataService' })
    return null
  }
  return firestoreService.actualizarProducto(productoId, data)
}

export const eliminarProducto = async (productoId: string): Promise<boolean> => {
  if (useLocalStorage) {
    logger.warn('eliminarProducto no implementada en modo local', { context: 'UnifiedDataService' })
    return false
  }
  return firestoreService.eliminarProducto(productoId)
}

// ============================================================
// TRANSFERENCIAS
// ============================================================

export interface TransferenciaData {
  bancoOrigenId: string
  bancoDestinoId: string
  monto: number
  concepto: string
  referencia?: string
  notas?: string
}

export const addTransferencia = async (data: TransferenciaData): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearTransferencia(data)
    } catch (error) {
      logger.error('Error creando transferencia local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.addTransferencia(data)
}

export const crearTransferencia = async (
  bancoOrigenId: string,
  bancoDestinoId: string,
  monto: number,
  concepto: string,
) => {
  return addTransferencia({ bancoOrigenId, bancoDestinoId, monto, concepto })
}

// ============================================================
// ABONOS
// ============================================================

export interface AbonoData {
  tipo: 'distribuidor' | 'cliente'
  entidadId: string
  monto: number
  bancoDestino: string
  metodo: 'efectivo' | 'transferencia' | 'cheque'
  referencia?: string
  notas?: string
}

export const addAbono = async (data: AbonoData): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearAbono(data)
    } catch (error) {
      logger.error('Error creando abono local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.addAbono(data)
}

// ============================================================
// INGRESOS Y GASTOS
// ============================================================

export const crearIngreso = async (data: {
  monto: number
  concepto: string
  bancoDestino: string
  categoria?: string
  referencia?: string
  notas?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearIngreso(data)
    } catch (error) {
      logger.error('Error creando ingreso local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.crearIngreso(data)
}

export const crearGasto = async (data: {
  monto: number
  concepto: string
  bancoOrigen: string
  categoria?: string
  referencia?: string
  notas?: string
}): Promise<string | null> => {
  if (useLocalStorage) {
    try {
      return localService.localCrearGasto(data)
    } catch (error) {
      logger.error('Error creando gasto local', error, { context: 'UnifiedDataService' })
      throw error
    }
  }
  return firestoreService.crearGasto(data)
}

// ============================================================
// UTILIDADES
// ============================================================

export const isUsingLocalStorage = (): boolean => useLocalStorage

export const getStorageMode = (): 'firebase' | 'local' => useLocalStorage ? 'local' : 'firebase'

// ============================================================
// SERVICIO UNIFICADO EXPORTADO
// ============================================================

export const unifiedDataService = {
  // Bancos
  suscribirBancos,
  obtenerBanco,
  actualizarCapitalBanco,
  // Clientes
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  suscribirClientes,
  cobrarCliente,
  // Ventas
  crearVenta,
  suscribirVentas,
  actualizarVenta,
  eliminarVenta,
  // Distribuidores
  crearDistribuidor,
  suscribirDistribuidores,
  pagarDistribuidor,
  actualizarDistribuidor,
  eliminarDistribuidor,
  // Órdenes de Compra
  crearOrdenCompra,
  suscribirOrdenesCompra,
  actualizarOrdenCompra,
  eliminarOrdenCompra,
  // Almacén
  crearProducto,
  suscribirAlmacen,
  crearEntradaAlmacen,
  crearSalidaAlmacen,
  actualizarProducto,
  eliminarProducto,
  // Transferencias
  addTransferencia,
  crearTransferencia,
  // Abonos
  addAbono,
  // Ingresos y Gastos
  crearIngreso,
  crearGasto,
  // Utilidades
  isUsingLocalStorage,
  getStorageMode,
}
