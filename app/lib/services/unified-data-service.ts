/**
 * 🔄 UNIFIED DATA SERVICE - CHRONOS SYSTEM
 * Servicio unificado que automáticamente usa Firebase o localStorage
 * 
 * - Si Firebase está configurado: intenta Firestore primero
 * - Si Firestore falla o no está disponible: usa localStorage
 * - Fallback bidireccional con retry automático
 * 
 * @version 2.0.0 - Con fallback bidireccional
 */

import { isFirestoreAvailable } from '../firebase/config'
import * as firestoreService from '../firebase/firestore-service'
import * as localService from '../storage/local-storage-service'
import { logger } from '../utils/logger'

// Flag para modo de operación (con re-check dinámico)
let useLocalStorage = false
let lastCheck = 0
const CHECK_INTERVAL = 30000 // Re-verificar cada 30 segundos

// Función para verificar modo con cache
function checkStorageMode(): boolean {
  const now = Date.now()
  if (now - lastCheck > CHECK_INTERVAL) {
    useLocalStorage = !isFirestoreAvailable()
    lastCheck = now
  }
  return useLocalStorage
}

// Inicializar modo de operación
if (typeof window !== 'undefined') {
  useLocalStorage = !isFirestoreAvailable()
  lastCheck = Date.now()
  if (useLocalStorage) {
    logger.info('📦 Usando almacenamiento LOCAL (localStorage)', { context: 'UnifiedDataService' })
  } else {
    logger.info('🔥 Usando almacenamiento FIREBASE (Firestore)', { context: 'UnifiedDataService' })
  }
}

/**
 * Ejecuta operación con fallback a localStorage si falla Firebase
 */
async function withFallback<T>(
  operationName: string,
  firebaseOp: () => Promise<T>,
  localOp: () => T | Promise<T>,
): Promise<T> {
  if (checkStorageMode()) {
    // Ya estamos en modo localStorage
    return localOp()
  }
  
  try {
    return await firebaseOp()
  } catch (error) {
    logger.warn(`[UnifiedDataService] Firebase falló para ${operationName}, usando localStorage`, { 
      context: 'UnifiedDataService',
      data: { error: error instanceof Error ? error.message : 'Unknown' },
    })
    return localOp()
  }
}

/**
 * Wrapper para suscripciones con fallback
 */
function subscribeWithFallback<T>(
  operationName: string,
  firestoreSubscribe: (cb: (data: T[]) => void) => () => void,
  localSubscribe: (cb: (data: T[]) => void) => () => void,
  callback: (data: T[]) => void,
): () => void {
  if (checkStorageMode()) {
    return localSubscribe(callback)
  }
  
  try {
    return firestoreSubscribe(callback)
  } catch (error) {
    logger.warn(`[UnifiedDataService] Firebase suscripción falló para ${operationName}, usando localStorage`, { 
      context: 'UnifiedDataService',
    })
    return localSubscribe(callback)
  }
}

// ============================================================
// BANCOS
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const suscribirBancos = (callback: (bancos: any[]) => void) => {
  return subscribeWithFallback(
    'suscribirBancos',
    firestoreService.suscribirBancos,
    localService.localSuscribirBancos,
    callback,
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const obtenerBanco = async (bancoId: string): Promise<any | null> => {
  return withFallback(
    'obtenerBanco',
    () => firestoreService.obtenerBanco(bancoId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => localService.localObtenerBanco(bancoId) as any,
  )
}

export const actualizarCapitalBanco = async (
  bancoId: string,
  monto: number,
  tipo: 'ingreso' | 'gasto' | 'transferencia',
) => {
  return withFallback(
    'actualizarCapitalBanco',
    () => firestoreService.actualizarCapitalBanco(bancoId, monto, tipo),
    () => localService.localActualizarCapitalBanco(bancoId, monto, tipo),
  )
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
  deudaTotal?: number
  totalPagado?: number
}): Promise<string | null> => {
  return withFallback(
    'crearCliente',
    () => firestoreService.crearCliente(data),
    () => localService.localCrearCliente(data),
  )
}

export const actualizarCliente = async (clienteId: string, data: Partial<{
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  deudaTotal?: number
  totalPagado?: number
}>): Promise<string | null> => {
  return withFallback(
    'actualizarCliente',
    () => firestoreService.actualizarCliente(clienteId, data),
    () => localService.localActualizarCliente(clienteId, data),
  )
}

export const eliminarCliente = async (clienteId: string): Promise<boolean> => {
  return withFallback(
    'eliminarCliente',
    () => firestoreService.eliminarCliente(clienteId),
    () => localService.localEliminarCliente(clienteId),
  )
}

export const suscribirClientes = (callback: (clientes: unknown[]) => void) => {
  return subscribeWithFallback(
    'suscribirClientes',
    firestoreService.suscribirClientes,
    localService.localSuscribirClientes,
    callback,
  )
}

export const cobrarCliente = async (clienteId: string, ventaId: string, monto: number): Promise<void> => {
  await withFallback(
    'cobrarCliente',
    async () => {
      await firestoreService.cobrarCliente(clienteId, ventaId, monto)
    },
    async () => {
      localService.localCrearAbono({
        tipo: 'cliente',
        entidadId: clienteId,
        monto,
        bancoDestino: 'boveda_monte',
        metodo: 'efectivo',
      })
    },
  )
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
  return withFallback(
    'crearVenta',
    () => firestoreService.crearVenta(data),
    () => localService.localCrearVenta({
      ...data,
      fecha: data.fecha instanceof Date ? data.fecha.toISOString() : data.fecha,
    }),
  )
}

export const suscribirVentas = (callback: (ventas: unknown[]) => void) => {
  return subscribeWithFallback(
    'suscribirVentas',
    firestoreService.suscribirVentas,
    localService.localSuscribirVentas,
    callback,
  )
}

export const actualizarVenta = async (ventaId: string, data: Partial<unknown>): Promise<string | null> => {
  return withFallback(
    'actualizarVenta',
    () => firestoreService.actualizarVenta(ventaId, data),
    async () => {
      logger.warn('actualizarVenta no implementada en modo local', { context: 'UnifiedDataService' })
      return null
    },
  )
}

export const eliminarVenta = async (ventaId: string): Promise<boolean> => {
  return withFallback(
    'eliminarVenta',
    () => firestoreService.eliminarVenta(ventaId),
    async () => {
      logger.warn('eliminarVenta no implementada en modo local', { context: 'UnifiedDataService' })
      return false
    },
  )
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
  return withFallback(
    'crearDistribuidor',
    () => firestoreService.crearDistribuidor(data),
    () => localService.localCrearDistribuidor(data),
  )
}

export const suscribirDistribuidores = (callback: (distribuidores: unknown[]) => void) => {
  return subscribeWithFallback(
    'suscribirDistribuidores',
    firestoreService.suscribirDistribuidores,
    localService.localSuscribirDistribuidores,
    callback,
  )
}

export const pagarDistribuidor = async (
  distribuidorId: string,
  ordenCompraId: string,
  monto: number,
  bancoOrigenId: string,
) => {
  return withFallback(
    'pagarDistribuidor',
    () => firestoreService.pagarDistribuidor(distribuidorId, ordenCompraId, monto, bancoOrigenId),
    () => localService.localPagarDistribuidor(distribuidorId, ordenCompraId, monto, bancoOrigenId),
  )
}

export const actualizarDistribuidor = async (distribuidorId: string, data: Partial<unknown>): Promise<string | null> => {
  return withFallback(
    'actualizarDistribuidor',
    () => firestoreService.actualizarDistribuidor(distribuidorId, data),
    async () => {
      logger.warn('actualizarDistribuidor no implementada en modo local', { context: 'UnifiedDataService' })
      return null
    },
  )
}

export const eliminarDistribuidor = async (distribuidorId: string): Promise<boolean> => {
  return withFallback(
    'eliminarDistribuidor',
    () => firestoreService.eliminarDistribuidor(distribuidorId),
    async () => {
      logger.warn('eliminarDistribuidor no implementada en modo local', { context: 'UnifiedDataService' })
      return false
    },
  )
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
  return withFallback(
    'crearOrdenCompra',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => firestoreService.crearOrdenCompra(data as any),
    () => localService.localCrearOrdenCompra({
      ...data,
      fecha: data.fecha instanceof Date ? data.fecha.toISOString() : data.fecha,
    }),
  )
}

export const suscribirOrdenesCompra = (callback: (ordenes: unknown[]) => void) => {
  return subscribeWithFallback(
    'suscribirOrdenesCompra',
    firestoreService.suscribirOrdenesCompra,
    localService.localSuscribirOrdenesCompra,
    callback,
  )
}

/**
 * Obtiene el siguiente ID para una nueva orden de compra
 * Formato: OC0001, OC0002, etc.
 */
export const obtenerSiguienteIdOrdenCompra = async (): Promise<string> => {
  try {
    // Obtener órdenes existentes
    const ordenes: Array<{ id: string }> = []
    
    await new Promise<void>((resolve) => {
      const unsubscribe = suscribirOrdenesCompra((data) => {
        ordenes.push(...(data as Array<{ id: string }>))
        unsubscribe()
        resolve()
      })
      // Timeout de seguridad
      setTimeout(() => {
        unsubscribe()
        resolve()
      }, 2000)
    })
    
    if (ordenes.length === 0) {
      return 'OC0001'
    }
    
    // Encontrar el mayor número
    const numeros = ordenes
      .map(o => {
        const match = o.id?.match(/OC(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter(n => !isNaN(n))
    
    const maxNum = numeros.length > 0 ? Math.max(...numeros) : 0
    const siguiente = maxNum + 1
    
    return `OC${siguiente.toString().padStart(4, '0')}`
  } catch (error) {
    logger.error('Error obteniendo siguiente ID de orden', error, { context: 'UnifiedDataService' })
    // Fallback: usar timestamp
    return `OC${Date.now().toString().slice(-4)}`
  }
}

export const actualizarOrdenCompra = async (ordenId: string, data: Partial<unknown>): Promise<string | null> => {
  return withFallback(
    'actualizarOrdenCompra',
    () => firestoreService.actualizarOrdenCompra(ordenId, data),
    async () => {
      logger.warn('actualizarOrdenCompra no implementada en modo local', { context: 'UnifiedDataService' })
      return null
    },
  )
}

export const eliminarOrdenCompra = async (ordenId: string): Promise<boolean> => {
  return withFallback(
    'eliminarOrdenCompra',
    () => firestoreService.eliminarOrdenCompra(ordenId),
    async () => {
      logger.warn('eliminarOrdenCompra no implementada en modo local', { context: 'UnifiedDataService' })
      return false
    },
  )
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
  return withFallback(
    'crearProducto',
    () => firestoreService.crearProducto(data),
    () => localService.localCrearProducto(data),
  )
}

export const suscribirAlmacen = (callback: (productos: unknown[]) => void) => {
  return subscribeWithFallback(
    'suscribirAlmacen',
    firestoreService.suscribirAlmacen,
    localService.localSuscribirAlmacen,
    callback,
  )
}

// Suscribir a entradas de almacén
export const suscribirEntradasAlmacen = (callback: (entradas: unknown[]) => void) => {
  return subscribeWithFallback(
    'suscribirEntradasAlmacen',
    firestoreService.suscribirEntradasAlmacen,
    localService.localSuscribirEntradasAlmacen,
    callback,
  )
}

// Suscribir a salidas de almacén
export const suscribirSalidasAlmacen = (callback: (salidas: unknown[]) => void) => {
  return subscribeWithFallback(
    'suscribirSalidasAlmacen',
    firestoreService.suscribirSalidasAlmacen,
    localService.localSuscribirSalidasAlmacen,
    callback,
  )
}

export const crearEntradaAlmacen = async (data: {
  productoId: string
  cantidad: number
  origen: string
  costoUnitario?: number
  ordenCompraId?: string
  notas?: string
}): Promise<string | null> => {
  return withFallback(
    'crearEntradaAlmacen',
    () => firestoreService.crearEntradaAlmacen(data),
    async () => {
      logger.warn('crearEntradaAlmacen no implementada en modo local', { context: 'UnifiedDataService' })
      return null
    },
  )
}

export const crearSalidaAlmacen = async (data: {
  productoId: string
  cantidad: number
  destino: string
  ventaId?: string
  motivo?: string
  notas?: string
}): Promise<string | null> => {
  return withFallback(
    'crearSalidaAlmacen',
    () => firestoreService.crearSalidaAlmacen(data),
    async () => {
      logger.warn('crearSalidaAlmacen no implementada en modo local', { context: 'UnifiedDataService' })
      return null
    },
  )
}

export const actualizarProducto = async (productoId: string, data: Partial<unknown>): Promise<string | null> => {
  return withFallback(
    'actualizarProducto',
    () => firestoreService.actualizarProducto(productoId, data),
    async () => {
      logger.warn('actualizarProducto no implementada en modo local', { context: 'UnifiedDataService' })
      return null
    },
  )
}

export const eliminarProducto = async (productoId: string): Promise<boolean> => {
  return withFallback(
    'eliminarProducto',
    () => firestoreService.eliminarProducto(productoId),
    async () => {
      logger.warn('eliminarProducto no implementada en modo local', { context: 'UnifiedDataService' })
      return false
    },
  )
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
  obtenerSiguienteIdOrdenCompra,
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
