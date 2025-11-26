/**
 * 🔄 SERVICIO DE MOVIMIENTOS - CHRONOS SYSTEM
 * 
 * Gestiona la colección UNIFICADA de movimientos financieros.
 * Reemplaza las 7 colecciones fragmentadas de *_ingresos.
 * 
 * Estructura del documento:
 * - bancoId: ID del banco (snake_case)
 * - tipoMovimiento: ingreso | gasto | transferencia_* | abono_* | pago_*
 * - monto: number
 * - concepto: string
 * - fecha: Timestamp
 * - referenciaId?: string (ID de venta, OC, etc.)
 * - referenciaTipo?: "venta" | "orden_compra" | "manual"
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  limit,
  startAfter,
  DocumentSnapshot,
  addDoc,
} from "firebase/firestore"
import { db } from "./config"
import type { Movimiento, BancoId, TipoMovimiento } from "@/app/types"
import { logger } from "../utils/logger"
import { COLLECTIONS, normalizeBancoId, TIPOS_MOVIMIENTO } from "@/app/lib/config/collections.config"

// ============================================================
// TIPOS
// ============================================================

export interface NuevoMovimientoInput {
  bancoId: BancoId
  tipoMovimiento: TipoMovimiento
  monto: number
  concepto: string
  fecha?: Date | string
  cliente?: string
  origen?: string
  destino?: string
  tc?: number
  referenciaId?: string
  referenciaTipo?: "venta" | "orden_compra" | "abono" | "transferencia" | "manual"
  observaciones?: string
}

export interface MovimientoFilter {
  bancoId?: BancoId
  tipoMovimiento?: TipoMovimiento | TipoMovimiento[]
  fechaInicio?: Date
  fechaFin?: Date
  cliente?: string
  minMonto?: number
  maxMonto?: number
}

// ============================================================
// CREAR MOVIMIENTO
// ============================================================

/**
 * Crea un nuevo movimiento en la colección unificada
 */
export async function crearMovimiento(input: NuevoMovimientoInput): Promise<string> {
  try {
    // Normalizar banco ID
    const bancoIdNormalizado = normalizeBancoId(input.bancoId)
    if (!bancoIdNormalizado) {
      throw new Error(`ID de banco inválido: ${input.bancoId}`)
    }

    const movimiento: Omit<Movimiento, "id"> = {
      bancoId: bancoIdNormalizado,
      tipoMovimiento: input.tipoMovimiento,
      monto: input.monto,
      concepto: input.concepto,
      fecha: input.fecha ? (typeof input.fecha === "string" ? input.fecha : input.fecha.toISOString()) : new Date().toISOString(),
      cliente: input.cliente,
      origen: input.origen,
      destino: input.destino,
      tc: input.tc,
      referenciaId: input.referenciaId,
      referenciaTipo: input.referenciaTipo,
      observaciones: input.observaciones,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.MOVIMIENTOS), movimiento)
    
    logger.info("Movimiento creado", { 
      data: { 
        id: docRef.id, 
        bancoId: bancoIdNormalizado, 
        tipo: input.tipoMovimiento,
        monto: input.monto 
      } 
    })
    
    return docRef.id
  } catch (error) {
    logger.error("Error creando movimiento", error, { context: "MovimientosService" })
    throw error
  }
}

// ============================================================
// SUSCRIPCIONES EN TIEMPO REAL
// ============================================================

/**
 * Suscribirse a todos los movimientos de un banco específico
 */
export function suscribirMovimientosBanco(
  bancoId: BancoId,
  callback: (movimientos: Movimiento[]) => void
) {
  const bancoIdNormalizado = normalizeBancoId(bancoId)
  if (!bancoIdNormalizado) {
    logger.warn(`Banco ID inválido: ${bancoId}`)
    callback([])
    return () => {}
  }

  const q = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    where("bancoId", "==", bancoIdNormalizado),
    orderBy("fecha", "desc")
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const movimientos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Movimiento[]
      callback(movimientos)
    },
    (error) => {
      logger.error("Error en suscripción de movimientos", error, { context: "MovimientosService" })
      callback([])
    }
  )
}

/**
 * Suscribirse a movimientos por tipo (ingresos, gastos, etc.)
 */
export function suscribirMovimientosPorTipo(
  bancoId: BancoId,
  tipo: TipoMovimiento,
  callback: (movimientos: Movimiento[]) => void
) {
  const bancoIdNormalizado = normalizeBancoId(bancoId)
  if (!bancoIdNormalizado) {
    callback([])
    return () => {}
  }

  const q = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    where("bancoId", "==", bancoIdNormalizado),
    where("tipoMovimiento", "==", tipo),
    orderBy("fecha", "desc")
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const movimientos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Movimiento[]
      callback(movimientos)
    },
    (error) => {
      logger.error("Error en suscripción de movimientos por tipo", error, { context: "MovimientosService" })
      callback([])
    }
  )
}

/**
 * Suscribirse a TODOS los movimientos del sistema
 */
export function suscribirTodosMovimientos(
  callback: (movimientos: Movimiento[]) => void,
  maxResults = 100
) {
  const q = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    orderBy("fecha", "desc"),
    limit(maxResults)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const movimientos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Movimiento[]
      callback(movimientos)
    },
    (error) => {
      logger.error("Error en suscripción de todos los movimientos", error, { context: "MovimientosService" })
      callback([])
    }
  )
}

// ============================================================
// CONSULTAS
// ============================================================

/**
 * Obtener ingresos de un banco
 */
export async function obtenerIngresosBanco(bancoId: BancoId): Promise<Movimiento[]> {
  const bancoIdNormalizado = normalizeBancoId(bancoId)
  if (!bancoIdNormalizado) return []

  const q = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    where("bancoId", "==", bancoIdNormalizado),
    where("tipoMovimiento", "==", TIPOS_MOVIMIENTO.INGRESO),
    orderBy("fecha", "desc")
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Movimiento[]
}

/**
 * Obtener gastos de un banco
 */
export async function obtenerGastosBanco(bancoId: BancoId): Promise<Movimiento[]> {
  const bancoIdNormalizado = normalizeBancoId(bancoId)
  if (!bancoIdNormalizado) return []

  const q = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    where("bancoId", "==", bancoIdNormalizado),
    where("tipoMovimiento", "==", TIPOS_MOVIMIENTO.GASTO),
    orderBy("fecha", "desc")
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Movimiento[]
}

/**
 * Obtener transferencias de un banco (entradas y salidas)
 */
export async function obtenerTransferenciasBanco(bancoId: BancoId): Promise<Movimiento[]> {
  const bancoIdNormalizado = normalizeBancoId(bancoId)
  if (!bancoIdNormalizado) return []

  // Transferencias de entrada
  const qEntradas = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    where("bancoId", "==", bancoIdNormalizado),
    where("tipoMovimiento", "==", TIPOS_MOVIMIENTO.TRANSFERENCIA_ENTRADA),
    orderBy("fecha", "desc")
  )

  // Transferencias de salida
  const qSalidas = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    where("bancoId", "==", bancoIdNormalizado),
    where("tipoMovimiento", "==", TIPOS_MOVIMIENTO.TRANSFERENCIA_SALIDA),
    orderBy("fecha", "desc")
  )

  const [snapshotEntradas, snapshotSalidas] = await Promise.all([
    getDocs(qEntradas),
    getDocs(qSalidas),
  ])

  const entradas = snapshotEntradas.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Movimiento[]

  const salidas = snapshotSalidas.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Movimiento[]

  // Combinar y ordenar por fecha
  return [...entradas, ...salidas].sort((a, b) => {
    const fechaA = typeof a.fecha === "string" ? new Date(a.fecha).getTime() : 0
    const fechaB = typeof b.fecha === "string" ? new Date(b.fecha).getTime() : 0
    return fechaB - fechaA
  })
}

// ============================================================
// TOTALES Y ESTADÍSTICAS
// ============================================================

/**
 * Calcular totales de movimientos por banco
 */
export async function calcularTotalesBanco(bancoId: BancoId): Promise<{
  totalIngresos: number
  totalGastos: number
  totalTransferenciasEntrada: number
  totalTransferenciasSalida: number
  balance: number
  numeroMovimientos: number
}> {
  const bancoIdNormalizado = normalizeBancoId(bancoId)
  if (!bancoIdNormalizado) {
    return {
      totalIngresos: 0,
      totalGastos: 0,
      totalTransferenciasEntrada: 0,
      totalTransferenciasSalida: 0,
      balance: 0,
      numeroMovimientos: 0,
    }
  }

  const q = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    where("bancoId", "==", bancoIdNormalizado)
  )

  const snapshot = await getDocs(q)
  
  let totalIngresos = 0
  let totalGastos = 0
  let totalTransferenciasEntrada = 0
  let totalTransferenciasSalida = 0

  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const monto = data.monto || 0

    switch (data.tipoMovimiento) {
      case TIPOS_MOVIMIENTO.INGRESO:
      case TIPOS_MOVIMIENTO.ABONO_CLIENTE:
        totalIngresos += monto
        break
      case TIPOS_MOVIMIENTO.GASTO:
      case TIPOS_MOVIMIENTO.PAGO_DISTRIBUIDOR:
        totalGastos += monto
        break
      case TIPOS_MOVIMIENTO.TRANSFERENCIA_ENTRADA:
        totalTransferenciasEntrada += monto
        break
      case TIPOS_MOVIMIENTO.TRANSFERENCIA_SALIDA:
        totalTransferenciasSalida += monto
        break
    }
  })

  const balance = totalIngresos + totalTransferenciasEntrada - totalGastos - totalTransferenciasSalida

  return {
    totalIngresos,
    totalGastos,
    totalTransferenciasEntrada,
    totalTransferenciasSalida,
    balance,
    numeroMovimientos: snapshot.size,
  }
}

/**
 * Obtener movimientos recientes del sistema
 */
export async function obtenerMovimientosRecientes(cantidad = 20): Promise<Movimiento[]> {
  const q = query(
    collection(db, COLLECTIONS.MOVIMIENTOS),
    orderBy("createdAt", "desc"),
    limit(cantidad)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Movimiento[]
}

// ============================================================
// EXPORTAR SERVICIO
// ============================================================

export const movimientosService = {
  crearMovimiento,
  suscribirMovimientosBanco,
  suscribirMovimientosPorTipo,
  suscribirTodosMovimientos,
  obtenerIngresosBanco,
  obtenerGastosBanco,
  obtenerTransferenciasBanco,
  calcularTotalesBanco,
  obtenerMovimientosRecientes,
}

export default movimientosService
