/**
 * 🔄 HOOK DE MOVIMIENTOS - CHRONOS SYSTEM
 * 
 * Hook para consumir movimientos de la colección unificada.
 * Proporciona suscripciones en tiempo real y utilidades para:
 * - Movimientos por banco
 * - Movimientos por tipo (ingresos, gastos, transferencias)
 * - Totales calculados
 * - Movimientos recientes
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Movimiento, BancoId, TipoMovimiento } from "@/app/types"
import { 
  suscribirMovimientosBanco, 
  suscribirMovimientosPorTipo,
  suscribirTodosMovimientos,
  calcularTotalesBanco,
  obtenerMovimientosRecientes,
  crearMovimiento,
  type NuevoMovimientoInput 
} from "@/app/lib/firebase/movimientos.service"
import { ALL_BANCO_IDS } from "@/app/lib/config/collections.config"
import { logger } from "@/app/lib/utils/logger"

// ============================================================
// TIPOS
// ============================================================

interface UseMovimientosResult {
  movimientos: Movimiento[]
  loading: boolean
  error: string | null
  refresh: () => void
}

interface UseMovimientosBancoResult extends UseMovimientosResult {
  totales: {
    totalIngresos: number
    totalGastos: number
    totalTransferenciasEntrada: number
    totalTransferenciasSalida: number
    balance: number
    numeroMovimientos: number
  }
  ingresos: Movimiento[]
  gastos: Movimiento[]
  transferencias: Movimiento[]
}

interface UseTodosMovimientosResult extends UseMovimientosResult {
  movimientosPorBanco: Record<BancoId, Movimiento[]>
  crear: (input: NuevoMovimientoInput) => Promise<string | null>
}

// ============================================================
// HOOK: MOVIMIENTOS POR BANCO
// ============================================================

/**
 * Hook para obtener y suscribirse a movimientos de un banco específico
 */
export function useMovimientosBanco(bancoId: BancoId): UseMovimientosBancoResult {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totales, setTotales] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    totalTransferenciasEntrada: 0,
    totalTransferenciasSalida: 0,
    balance: 0,
    numeroMovimientos: 0,
  })
  
  const isMountedRef = useRef(true)

  // Cargar totales
  const cargarTotales = useCallback(async () => {
    try {
      const result = await calcularTotalesBanco(bancoId)
      if (isMountedRef.current) {
        setTotales(result)
      }
    } catch (err) {
      logger.error(`Error calculando totales para ${bancoId}`, err)
    }
  }, [bancoId])

  // Efecto principal
  useEffect(() => {
    isMountedRef.current = true
    setLoading(true)
    setError(null)

    const unsubscribe = suscribirMovimientosBanco(bancoId, (movs) => {
      if (isMountedRef.current) {
        setMovimientos(movs)
        setLoading(false)
      }
    })

    // Cargar totales
    cargarTotales()

    return () => {
      isMountedRef.current = false
      unsubscribe()
    }
  }, [bancoId, cargarTotales])

  // Filtrar por tipo
  const ingresos = movimientos.filter(m => m.tipoMovimiento === "ingreso" || m.tipoMovimiento === "abono_cliente")
  const gastos = movimientos.filter(m => m.tipoMovimiento === "gasto" || m.tipoMovimiento === "pago_distribuidor")
  const transferencias = movimientos.filter(m => 
    m.tipoMovimiento === "transferencia_entrada" || m.tipoMovimiento === "transferencia_salida"
  )

  return {
    movimientos,
    loading,
    error,
    totales,
    ingresos,
    gastos,
    transferencias,
    refresh: cargarTotales,
  }
}

// ============================================================
// HOOK: MOVIMIENTOS POR TIPO
// ============================================================

/**
 * Hook para obtener movimientos filtrados por tipo
 */
export function useMovimientosPorTipo(
  bancoId: BancoId, 
  tipo: TipoMovimiento
): UseMovimientosResult {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    setLoading(true)

    const unsubscribe = suscribirMovimientosPorTipo(bancoId, tipo, (movs) => {
      if (isMountedRef.current) {
        setMovimientos(movs)
        setLoading(false)
      }
    })

    return () => {
      isMountedRef.current = false
      unsubscribe()
    }
  }, [bancoId, tipo])

  return {
    movimientos,
    loading,
    error,
    refresh: () => {},
  }
}

// ============================================================
// HOOK: TODOS LOS MOVIMIENTOS
// ============================================================

/**
 * Hook para obtener todos los movimientos del sistema
 */
export function useTodosMovimientos(maxResults = 100): UseTodosMovimientosResult {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    setLoading(true)

    const unsubscribe = suscribirTodosMovimientos((movs) => {
      if (isMountedRef.current) {
        setMovimientos(movs)
        setLoading(false)
      }
    }, maxResults)

    return () => {
      isMountedRef.current = false
      unsubscribe()
    }
  }, [maxResults])

  // Agrupar por banco
  const movimientosPorBanco = ALL_BANCO_IDS.reduce((acc, bancoId) => {
    acc[bancoId] = movimientos.filter(m => m.bancoId === bancoId)
    return acc
  }, {} as Record<BancoId, Movimiento[]>)

  // Función para crear movimiento
  const crear = useCallback(async (input: NuevoMovimientoInput): Promise<string | null> => {
    try {
      const id = await crearMovimiento(input)
      return id
    } catch (err) {
      logger.error("Error creando movimiento", err)
      return null
    }
  }, [])

  return {
    movimientos,
    loading,
    error,
    movimientosPorBanco,
    crear,
    refresh: () => {},
  }
}

// ============================================================
// HOOK: MOVIMIENTOS RECIENTES
// ============================================================

/**
 * Hook para obtener los movimientos más recientes
 */
export function useMovimientosRecientes(cantidad = 20): UseMovimientosResult {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const result = await obtenerMovimientosRecientes(cantidad)
      setMovimientos(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando movimientos")
      logger.error("Error cargando movimientos recientes", err)
    } finally {
      setLoading(false)
    }
  }, [cantidad])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    movimientos,
    loading,
    error,
    refresh: cargar,
  }
}

// ============================================================
// HOOK: INGRESOS DE BANCO (Alias conveniente)
// ============================================================

export function useIngresosBanco(bancoId: BancoId) {
  return useMovimientosPorTipo(bancoId, "ingreso")
}

// ============================================================
// HOOK: GASTOS DE BANCO (Alias conveniente)
// ============================================================

export function useGastosBanco(bancoId: BancoId) {
  return useMovimientosPorTipo(bancoId, "gasto")
}

// ============================================================
// EXPORTAR
// ============================================================

export default useMovimientosBanco
