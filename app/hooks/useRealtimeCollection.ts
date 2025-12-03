/**
 * 🔥 HOOK UNIVERSAL DE TIEMPO REAL - CHRONOS SYSTEM
 * 
 * Hook que GARANTIZA actualizaciones en tiempo real.
 * Usa onSnapshot de Firebase cuando está disponible,
 * o localStorage como fallback automático.
 * 
 * Características:
 * - 'use client' obligatorio
 * - Fallback automático a localStorage
 * - onSnapshot para actualizaciones instantáneas (Firebase)
 * - Cleanup automático de listeners
 * - Manejo de errores con fallback
 * - isMounted para evitar memory leaks
 * 
 * @version 2.0.0 - Con fallback a localStorage
 * @author CHRONOS Team
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  limit,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore'
import { db, isFirebaseConfigured, isFirestoreAvailable } from '@/app/lib/firebase/config'
import * as unifiedService from '@/app/lib/services/unified-data-service'
import { logger } from '@/app/lib/utils/logger'
import { useAppStore } from '@/app/lib/store/useAppStore'

// ============================================================
// TIPOS
// ============================================================

export interface RealtimeOptions {
  /** Campo por el cual ordenar (default: 'createdAt') */
  orderByField?: string
  /** Dirección del ordenamiento (default: 'desc') */
  orderDirection?: 'asc' | 'desc'
  /** Campo para filtrar con where */
  whereField?: string
  /** Operador de comparación */
  whereOperator?: '==' | '!=' | '<' | '>' | '<=' | '>='
  /** Valor para el filtro where */
  whereValue?: string | number | boolean
  /** Límite de documentos */
  limitCount?: number
  /** Deshabilitar la suscripción (para casos condicionales) */
  enabled?: boolean
}

export interface RealtimeResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  /** Forzar refresh manual (re-suscripción) */
  refresh: () => void
  /** Indica si está conectado y escuchando */
  isConnected: boolean
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

/**
 * Hook de colección en tiempo real
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { useRealtimeCollection } from '@/app/hooks/useRealtimeCollection'
 * 
 * function VentasPanel() {
 *   const { data: ventas, loading, error } = useRealtimeCollection<Venta>('ventas', {
 *     orderByField: 'fecha',
 *     orderDirection: 'desc',
 *   })
 * 
 *   if (loading) return <Skeleton />
 *   return <Table data={ventas} />
 * }
 * ```
 */
export function useRealtimeCollection<T extends { id: string }>(
  collectionPath: string,
  options: RealtimeOptions = {},
): RealtimeResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Refs para cleanup y prevención de memory leaks
  const isMountedRef = useRef(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const refreshTriggerRef = useRef(0)
  
  // Defaults
  const {
    orderByField = 'createdAt',
    orderDirection = 'desc',
    whereField,
    whereOperator = '==',
    whereValue,
    limitCount,
    enabled = true,
  } = options
  
  // Función para construir la query
  const buildQuery = useCallback(() => {
    if (!isFirebaseConfigured || !db) {
      return null
    }
    
    const constraints: QueryConstraint[] = []
    
    // Filtro where (si aplica)
    if (whereField && whereValue !== undefined) {
      constraints.push(where(whereField, whereOperator, whereValue))
    }
    
    // Ordenamiento
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection))
    }
    
    // Límite (si aplica)
    if (limitCount && limitCount > 0) {
      constraints.push(limit(limitCount))
    }
    
    return query(collection(db, collectionPath), ...constraints)
  }, [collectionPath, orderByField, orderDirection, whereField, whereOperator, whereValue, limitCount])
  
  // Función de suscripción
  const subscribe = useCallback(() => {
    // Limpiar suscripción anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    
    // Si está deshabilitado, no suscribir
    if (!enabled) {
      setLoading(false)
      return
    }
    
    // Verificar que Firestore esté disponible
    if (!isFirebaseConfigured || !db) {
      logger.warn(`[useRealtimeCollection] ${collectionPath}: Firebase no configurado`, {
        context: 'useRealtimeCollection',
      })
      if (isMountedRef.current) {
        setData([])
        setLoading(false)
        setError('Firebase no configurado')
        setIsConnected(false)
      }
      return
    }
    
    const q = buildQuery()
    if (!q) {
      setData([])
      setLoading(false)
      setError('No se pudo construir la query')
      return
    }
    
    logger.info(`[useRealtimeCollection] Suscribiendo a: ${collectionPath}`, {
      context: 'useRealtimeCollection',
      data: { orderByField, orderDirection, whereField, whereValue },
    })
    
    // Suscripción en tiempo real
    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        if (!isMountedRef.current) return
        
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]
        
        setData(items)
        setLoading(false)
        setError(null)
        setIsConnected(true)
        
        logger.info(`[useRealtimeCollection] ${collectionPath}: ${items.length} registros (REALTIME)`, {
          context: 'useRealtimeCollection',
        })
      },
      (err) => {
        if (!isMountedRef.current) return
        
        const errMsg = err.message || 'Error de conexión'
        logger.error(`[useRealtimeCollection] Error en ${collectionPath}:`, errMsg, {
          context: 'useRealtimeCollection',
        })
        
        setError(errMsg)
        setLoading(false)
        setIsConnected(false)
      },
    )
  }, [buildQuery, collectionPath, enabled, orderByField, orderDirection, whereField, whereValue])
  
  // Función de refresh manual
  const refresh = useCallback(() => {
    refreshTriggerRef.current += 1
    setLoading(true)
    subscribe()
  }, [subscribe])
  
  // Efecto principal - suscripción
  useEffect(() => {
    isMountedRef.current = true
    subscribe()
    
    return () => {
      isMountedRef.current = false
      if (unsubscribeRef.current) {
        logger.info(`[useRealtimeCollection] Desuscribiendo de: ${collectionPath}`, {
          context: 'useRealtimeCollection',
        })
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [subscribe, collectionPath])
  
  return {
    data,
    loading,
    error,
    refresh,
    isConnected,
  }
}

// ============================================================
// HOOKS PRE-CONFIGURADOS PARA CADA COLECCIÓN
// (Con fallback automático a localStorage)
// ============================================================

/**
 * Hook para ventas en tiempo real (con fallback a localStorage)
 */
export function useRealtimeVentas() {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  useEffect(() => {
    const unsubscribe = unifiedService.suscribirVentas((ventas) => {
      setData(ventas as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])
  
  return { data, loading, error, refresh: () => setLoading(true), isConnected: !loading }
}

/**
 * Hook para clientes en tiempo real (con fallback a localStorage)
 */
export function useRealtimeClientes() {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  useEffect(() => {
    const unsubscribe = unifiedService.suscribirClientes((clientes) => {
      setData(clientes as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])
  
  return { data, loading, error, refresh: () => setLoading(true), isConnected: !loading }
}

/**
 * Hook para distribuidores en tiempo real (con fallback a localStorage)
 */
export function useRealtimeDistribuidores() {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  useEffect(() => {
    const unsubscribe = unifiedService.suscribirDistribuidores((distribuidores) => {
      setData(distribuidores as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])
  
  return { data, loading, error, refresh: () => setLoading(true), isConnected: !loading }
}

/**
 * Hook para órdenes de compra en tiempo real (con fallback a localStorage)
 */
export function useRealtimeOrdenesCompra() {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  useEffect(() => {
    const unsubscribe = unifiedService.suscribirOrdenesCompra((ordenes) => {
      setData(ordenes as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])
  
  return { data, loading, error, refresh: () => setLoading(true), isConnected: !loading }
}

/**
 * Hook para productos de almacén en tiempo real (con fallback a localStorage)
 */
export function useRealtimeAlmacen() {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  useEffect(() => {
    const unsubscribe = unifiedService.suscribirAlmacen((productos) => {
      setData(productos as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])
  
  return { data, loading, error, refresh: () => setLoading(true), isConnected: !loading }
}

/**
 * Hook para bancos en tiempo real (con fallback a localStorage)
 */
export function useRealtimeBancos() {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  useEffect(() => {
    const unsubscribe = unifiedService.suscribirBancos((bancos) => {
      setData(bancos as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])
  
  return { data, loading, error, refresh: () => setLoading(true), isConnected: !loading }
}

/**
 * Hook para movimientos bancarios en tiempo real
 */
export function useRealtimeMovimientos(bancoId?: string) {
  return useRealtimeCollection<{
    id: string
    bancoId: string
    tipoMovimiento: 'ingreso' | 'gasto' | 'transferencia'
    monto: number
    concepto: string
    fecha: string | Date
    [key: string]: unknown
  }>('movimientos', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    whereField: bancoId ? 'bancoId' : undefined,
    whereValue: bancoId,
  })
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default useRealtimeCollection
