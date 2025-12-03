/**
 * 🛡️ RESILIENT DATA SERVICE - CHRONOS SYSTEM
 * 
 * 🚨 MODO LOCAL FORZADO - Firebase deshabilitado
 * Servicio que usa SOLO localStorage
 * 
 * @version 2.0.0 - Solo localStorage
 */

import * as localService from '../storage/local-storage-service'
import { logger } from '../utils/logger'
import type { BancoId } from '@/app/types'

// ============================================================
// CONFIGURACIÓN - MODO LOCAL FORZADO
// ============================================================

// 🚨 Firebase SIEMPRE deshabilitado
const firebaseAvailable = false

// Variable para tracking (mantenida por compatibilidad)
let lastFirebaseCheck = 0

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Verifica si Firebase está disponible - SIEMPRE retorna false
 */
function checkFirebaseAvailable(): boolean {
  return false // 🚨 SIEMPRE localStorage
}

/**
 * Delay helper (no usado pero mantenido por compatibilidad)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Ejecuta operación - SOLO localStorage
 */
async function executeWithFallback<T>(
  operationName: string,
  _firebaseOperation: () => Promise<T>,
  localOperation: () => T | Promise<T>,
  _options: { saveToLocal?: boolean; localData?: unknown } = {},
): Promise<T> {
  // 🚨 SIEMPRE usar localStorage directamente
  logger.info(`[ResilientService] ${operationName}: Ejecutando en localStorage`, { context: 'ResilientService' })
  try {
    const result = await localOperation()
    return result
  } catch (error) {
    logger.error(`[ResilientService] Error en ${operationName}`, error, { context: 'ResilientService' })
    throw error
  }
}

// ============================================================
// OPERACIONES DE VENTA
// ============================================================

export interface CrearVentaInput {
  cliente: string
  clienteId?: string
  producto?: string
  cantidad: number
  precioVenta: number
  precioCompra?: number
  precioFlete?: number
  flete?: 'Aplica' | 'NoAplica'
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
  storage: 'firebase' | 'localStorage'
}

/**
 * Crea una venta completa con lógica GYA
 * - Crea/actualiza cliente con adeudo
 * - Registra salida de almacén
 * - Distribuye pago a 3 bancos (boveda_monte, flete_sur, utilidades)
 */
export async function crearVentaCompleta(input: CrearVentaInput): Promise<VentaResult> {
  const cantidad = input.cantidad
  const precioVenta = input.precioVenta
  const precioCompra = input.precioCompra ?? 0
  const precioFlete = input.precioFlete ?? 0
  
  // Cálculos de distribución GYA
  const totalVenta = precioVenta * cantidad
  const montoBovedaMonte = precioCompra * cantidad
  const montoFletes = precioFlete * cantidad
  const montoUtilidades = totalVenta - montoBovedaMonte - montoFletes
  
  // Determinar pago
  let montoPagado = 0
  if (input.estadoPago === 'completo') {
    montoPagado = totalVenta
  } else if (input.estadoPago === 'parcial') {
    montoPagado = input.montoPagado || 0
  }
  const deudaCliente = totalVenta - montoPagado

  return executeWithFallback<VentaResult>(
    'crearVentaCompleta',
    async () => {
      // Firebase operation
      const originalService = await import('./business-operations.service')
      const result = await originalService.crearVentaCompleta({
        ...input,
        precioFlete: precioFlete,
        precioCompra: precioCompra,
      })
      return { ...result, storage: 'firebase' as const }
    },
    () => {
      // localStorage operation
      const ventaId = localService.localCrearVenta({
        cliente: input.cliente,
        clienteId: input.clienteId,
        producto: input.producto || 'Producto',
        cantidad,
        precioVenta,
        precioTotalVenta: totalVenta,
        precioCompra,
        precioFlete,
        flete: precioFlete > 0 ? 'Aplica' : 'NoAplica',
        montoPagado,
        concepto: input.notas || '',
        notas: input.notas,
        fecha: input.fecha?.toString(),
      })
      
      return {
        ventaId,
        clienteId: input.clienteId || `cli_${Date.now()}`,
        salidaAlmacenId: `salida_${Date.now()}`,
        totalVenta,
        bovedaMonte: montoBovedaMonte,
        fletes: montoFletes,
        utilidades: montoUtilidades,
        deudaCliente,
        storage: 'localStorage' as const,
      }
    },
  )
}

// ============================================================
// OPERACIONES DE ORDEN DE COMPRA
// ============================================================

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
  storage: 'firebase' | 'localStorage'
}

/**
 * Crea una orden de compra completa
 * - Crea/actualiza distribuidor con deuda
 * - Registra entrada en almacén
 * - Actualiza stock
 * - Descuenta del banco origen si hay pago inicial
 */
export async function crearOrdenCompraCompleta(input: CrearOrdenCompraInput): Promise<OrdenCompraResult> {
  const costoPorUnidad = input.costoDistribuidor + (input.costoTransporte || 0)
  const costoTotal = costoPorUnidad * input.cantidad
  const pagoInicial = input.pagoInicial || 0
  const deuda = costoTotal - pagoInicial

  return executeWithFallback<OrdenCompraResult>(
    'crearOrdenCompraCompleta',
    async () => {
      const originalService = await import('./business-operations.service')
      const result = await originalService.crearOrdenCompraCompleta(input)
      return { ...result, storage: 'firebase' as const }
    },
    () => {
      const ordenId = localService.localCrearOrdenCompra({
        distribuidor: input.distribuidor,
        distribuidorId: input.distribuidorId,
        producto: input.producto,
        cantidad: input.cantidad,
        costoTotal,
        costoPorUnidad,
        pagoDistribuidor: pagoInicial,
        bancoOrigen: input.bancoOrigen,
        fecha: input.fecha?.toString(),
        notas: input.notas,
      })
      
      return {
        ordenId,
        distribuidorId: input.distribuidorId || `dist_${Date.now()}`,
        entradaAlmacenId: `entrada_${Date.now()}`,
        costoTotal,
        deudaGenerada: deuda,
        storage: 'localStorage' as const,
      }
    },
  )
}

// ============================================================
// OPERACIONES DE CLIENTE
// ============================================================

export interface CrearClienteInput {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
}

/**
 * Crea un cliente
 */
export async function crearCliente(input: CrearClienteInput): Promise<string | null> {
  return executeWithFallback<string | null>(
    'crearCliente',
    async () => {
      const firestoreService = await import('../firebase/firestore-service')
      return firestoreService.crearCliente(input)
    },
    () => {
      return localService.localCrearCliente(input)
    },
  )
}

// ============================================================
// OPERACIONES DE DISTRIBUIDOR
// ============================================================

export interface CrearDistribuidorInput {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  origen?: string
}

/**
 * Crea un distribuidor
 */
export async function crearDistribuidor(input: CrearDistribuidorInput): Promise<string | null> {
  return executeWithFallback<string | null>(
    'crearDistribuidor',
    async () => {
      const firestoreService = await import('../firebase/firestore-service')
      return firestoreService.crearDistribuidor(input)
    },
    () => {
      return localService.localCrearDistribuidor(input)
    },
  )
}

// ============================================================
// OPERACIONES BANCARIAS
// ============================================================

export interface TransferenciaInput {
  bancoOrigen: BancoId
  bancoDestino: BancoId
  monto: number
  concepto: string
  descripcion?: string
}

/**
 * Realiza una transferencia entre bancos
 */
export async function realizarTransferencia(input: TransferenciaInput): Promise<string | null> {
  return executeWithFallback<string | null>(
    'realizarTransferencia',
    async () => {
      const originalService = await import('./business-operations.service')
      return originalService.realizarTransferencia(input)
    },
    () => {
      return localService.localCrearTransferencia({
        bancoOrigenId: input.bancoOrigen,
        bancoDestinoId: input.bancoDestino,
        monto: input.monto,
        concepto: input.concepto,
      })
    },
  )
}

export interface RegistrarGastoInput {
  bancoOrigen: BancoId
  monto: number
  concepto: string
  categoria?: string
  notas?: string
}

/**
 * Registra un gasto
 */
export async function registrarGasto(input: RegistrarGastoInput): Promise<string | null> {
  return executeWithFallback<string | null>(
    'registrarGasto',
    async () => {
      const originalService = await import('./business-operations.service')
      return originalService.registrarGasto(input)
    },
    () => {
      return localService.localCrearGasto({
        monto: input.monto,
        concepto: input.concepto,
        bancoOrigen: input.bancoOrigen,
        categoria: input.categoria,
        notas: input.notas,
      })
    },
  )
}

export interface RegistrarIngresoInput {
  bancoDestino: BancoId
  monto: number
  concepto: string
  categoria?: string
  cliente?: string
  notas?: string
}

/**
 * Registra un ingreso
 */
export async function registrarIngreso(input: RegistrarIngresoInput): Promise<string | null> {
  return executeWithFallback<string | null>(
    'registrarIngreso',
    async () => {
      const originalService = await import('./business-operations.service')
      return originalService.registrarIngreso(input)
    },
    () => {
      return localService.localCrearIngreso({
        monto: input.monto,
        concepto: input.concepto,
        bancoDestino: input.bancoDestino,
        categoria: input.categoria,
        notas: input.notas,
      })
    },
  )
}

// ============================================================
// OPERACIONES DE PAGO
// ============================================================

export interface PagarDistribuidorInput {
  distribuidorId: string
  ordenCompraId?: string
  monto: number
  bancoOrigen: BancoId
  notas?: string
}

/**
 * Pagar a un distribuidor (reduce su deuda)
 */
export async function pagarDistribuidor(input: PagarDistribuidorInput): Promise<boolean> {
  return executeWithFallback<boolean>(
    'pagarDistribuidor',
    async () => {
      const originalService = await import('./business-operations.service')
      return originalService.pagarDistribuidor(input)
    },
    () => {
      localService.localPagarDistribuidor(
        input.distribuidorId,
        input.ordenCompraId || '',
        input.monto,
        input.bancoOrigen,
      )
      return true
    },
  )
}

export interface AbonarClienteInput {
  clienteId: string
  ventaId?: string
  monto: number
  metodoPago?: string
  notas?: string
}

/**
 * Registra un abono de cliente (reduce su adeudo)
 * - Actualiza deuda del cliente
 * - Distribuye a bancos según proporción de la venta original
 */
export async function abonarCliente(input: AbonarClienteInput): Promise<boolean> {
  return executeWithFallback<boolean>(
    'abonarCliente',
    async () => {
      const originalService = await import('./business-operations.service')
      return originalService.abonarCliente(input)
    },
    () => {
      // Usar el sistema de abonos local
      localService.localCrearAbono({
        tipo: 'cliente',
        entidadId: input.clienteId,
        monto: input.monto,
        bancoDestino: 'boveda_monte', // Default
        metodo: (input.metodoPago as 'efectivo' | 'transferencia' | 'cheque') || 'efectivo',
      })
      return true
    },
  )
}

// ============================================================
// SUSCRIPCIONES (con fallback automático)
// ============================================================

/**
 * Suscribirse a cambios en ventas
 */
export function suscribirVentas(callback: (ventas: unknown[]) => void): () => void {
  if (checkFirebaseAvailable()) {
    try {
      // Intentar Firebase
      const { suscribirVentas: firestoreSuscribir } = require('../firebase/firestore-service')
      return firestoreSuscribir(callback)
    } catch {
      logger.warn('[ResilientService] Fallback a localStorage para suscribirVentas', { context: 'ResilientService' })
    }
  }
  return localService.localSuscribirVentas(callback)
}

/**
 * Suscribirse a cambios en clientes
 */
export function suscribirClientes(callback: (clientes: unknown[]) => void): () => void {
  if (checkFirebaseAvailable()) {
    try {
      const { suscribirClientes: firestoreSuscribir } = require('../firebase/firestore-service')
      return firestoreSuscribir(callback)
    } catch {
      logger.warn('[ResilientService] Fallback a localStorage para suscribirClientes', { context: 'ResilientService' })
    }
  }
  return localService.localSuscribirClientes(callback)
}

/**
 * Suscribirse a cambios en distribuidores
 */
export function suscribirDistribuidores(callback: (distribuidores: unknown[]) => void): () => void {
  if (checkFirebaseAvailable()) {
    try {
      const { suscribirDistribuidores: firestoreSuscribir } = require('../firebase/firestore-service')
      return firestoreSuscribir(callback)
    } catch {
      logger.warn('[ResilientService] Fallback a localStorage para suscribirDistribuidores', { context: 'ResilientService' })
    }
  }
  return localService.localSuscribirDistribuidores(callback)
}

/**
 * Suscribirse a cambios en órdenes de compra
 */
export function suscribirOrdenesCompra(callback: (ordenes: unknown[]) => void): () => void {
  if (checkFirebaseAvailable()) {
    try {
      const { suscribirOrdenesCompra: firestoreSuscribir } = require('../firebase/firestore-service')
      return firestoreSuscribir(callback)
    } catch {
      logger.warn('[ResilientService] Fallback a localStorage para suscribirOrdenesCompra', { context: 'ResilientService' })
    }
  }
  return localService.localSuscribirOrdenesCompra(callback)
}

/**
 * Suscribirse a cambios en bancos
 */
export function suscribirBancos(callback: (bancos: unknown[]) => void): () => void {
  if (checkFirebaseAvailable()) {
    try {
      const { suscribirBancos: firestoreSuscribir } = require('../firebase/firestore-service')
      return firestoreSuscribir(callback)
    } catch {
      logger.warn('[ResilientService] Fallback a localStorage para suscribirBancos', { context: 'ResilientService' })
    }
  }
  return localService.localSuscribirBancos(callback)
}

/**
 * Suscribirse a cambios en productos/almacén
 */
export function suscribirProductos(callback: (productos: unknown[]) => void): () => void {
  if (checkFirebaseAvailable()) {
    try {
      const { suscribirProductos: firestoreSuscribir } = require('../firebase/firestore-service')
      return firestoreSuscribir(callback)
    } catch {
      logger.warn('[ResilientService] Fallback a localStorage para suscribirProductos', { context: 'ResilientService' })
    }
  }
  // En local, usamos localSuscribirAlmacen que es la misma colección
  return localService.localSuscribirAlmacen(callback)
}

/**
 * Suscribirse a entradas de almacén
 */
export function suscribirEntradasAlmacen(callback: (entradas: unknown[]) => void): () => void {
  // Las entradas siempre van a localStorage por ahora
  return localService.localSuscribirEntradasAlmacen(callback)
}

/**
 * Suscribirse a salidas de almacén
 */
export function suscribirSalidasAlmacen(callback: (salidas: unknown[]) => void): () => void {
  // Las salidas siempre van a localStorage por ahora
  return localService.localSuscribirSalidasAlmacen(callback)
}

// ============================================================
// UTILIDADES DE ESTADO
// ============================================================

/**
 * Obtiene el modo de almacenamiento actual
 */
export function getStorageMode(): 'firebase' | 'localStorage' | 'hybrid' {
  if (checkFirebaseAvailable()) {
    return 'firebase'
  }
  return 'localStorage'
}

/**
 * Fuerza una verificación de disponibilidad de Firebase
 */
export function checkStorageStatus(): { firebase: boolean; localStorage: boolean } {
  lastFirebaseCheck = 0 // Forzar re-check
  return {
    firebase: checkFirebaseAvailable(),
    localStorage: typeof window !== 'undefined' && typeof localStorage !== 'undefined',
  }
}

/**
 * Sincroniza datos de localStorage a Firebase (cuando Firebase vuelve a estar disponible)
 */
export async function syncLocalToFirebase(): Promise<{ synced: number; errors: number }> {
  if (!checkFirebaseAvailable()) {
    logger.warn('[ResilientService] Firebase no disponible para sincronización', { context: 'ResilientService' })
    return { synced: 0, errors: 0 }
  }
  
  // TODO: Implementar sincronización completa
  // Por ahora solo registra que se intentó
  logger.info('[ResilientService] Sincronización pendiente de implementar', { context: 'ResilientService' })
  return { synced: 0, errors: 0 }
}

// ============================================================
// EXPORT
// ============================================================

export const resilientService = {
  // Operaciones de negocio
  crearVentaCompleta,
  crearOrdenCompraCompleta,
  crearCliente,
  crearDistribuidor,
  realizarTransferencia,
  registrarGasto,
  registrarIngreso,
  pagarDistribuidor,
  abonarCliente,
  
  // Suscripciones
  suscribirVentas,
  suscribirClientes,
  suscribirDistribuidores,
  suscribirOrdenesCompra,
  suscribirBancos,
  suscribirProductos,
  suscribirEntradasAlmacen,
  suscribirSalidasAlmacen,
  
  // Utilidades
  getStorageMode,
  checkStorageStatus,
  syncLocalToFirebase,
}

export default resilientService
