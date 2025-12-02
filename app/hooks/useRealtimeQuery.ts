/**
 * 🔥 HOOK REALTIME + TANSTACK QUERY - EL SANTO GRIAL
 * 
 * Combina lo mejor de ambos mundos:
 * - TanStack Query: Caching maestro + invalidación inteligente
 * - Firebase onSnapshot: Push updates en tiempo real
 * 
 * El resultado: UI se actualiza AL INSTANTE cuando cambian datos en Firebase,
 * con cache perfecto, offline support, y cero re-renders innecesarios.
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  limit,
  getDocs,
  QueryConstraint,
  Query,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config'
import { logger } from '@/app/lib/utils/logger'

// ============================================================
// TIPOS
// ============================================================

export interface RealtimeQueryOptions<T> {
  /** Campo para ordenar (default: 'createdAt') */
  orderByField?: string
  /** Dirección del orden (default: 'desc') */
  orderDirection?: 'asc' | 'desc'
  /** Filtros where opcionales */
  filters?: Array<{
    field: string
    operator: '==' | '!=' | '<' | '>' | '<=' | '>=' | 'array-contains' | 'in'
    value: unknown
  }>
  /** Límite de documentos */
  limitCount?: number
  /** Deshabilitar suscripción */
  enabled?: boolean
  /** Transformar datos después de fetch */
  transform?: (data: DocumentData[]) => T[]
  /** Opciones adicionales de useQuery */
  queryOptions?: Partial<UseQueryOptions<T[], Error>>
}

export interface RealtimeQueryResult<T> {
  /** Datos de la colección */
  data: T[]
  /** Cargando datos iniciales */
  isLoading: boolean
  /** Error si hay alguno */
  error: Error | null
  /** Datos stale (hay nuevos disponibles) */
  isStale: boolean
  /** Refetch manual (generalmente no necesario con realtime) */
  refetch: () => Promise<unknown>
  /** Indica si está conectado al listener realtime */
  isRealtime: boolean
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

/**
 * Hook que combina TanStack Query + Firebase onSnapshot
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { useRealtimeQuery } from '@/app/hooks/useRealtimeQuery'
 * import { queryKeys } from '@/app/lib/query/queryClient'
 * 
 * function VentasPanel() {
 *   const { data: ventas, isLoading } = useRealtimeQuery<Venta>(
 *     queryKeys.ventas.all,
 *     'ventas',
 *     { orderByField: 'fecha' }
 *   )
 * 
 *   if (isLoading) return <Skeleton />
 *   return <VentasTable data={ventas} />
 * }
 * ```
 */
export function useRealtimeQuery<T extends { id: string }>(
  queryKey: readonly string[],
  collectionPath: string,
  options: RealtimeQueryOptions<T> = {},
): RealtimeQueryResult<T> {
  const queryClient = useQueryClient()
  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const isRealtimeRef = useRef(false)
  
  const {
    orderByField = 'createdAt',
    orderDirection = 'desc',
    filters = [],
    limitCount,
    enabled = true,
    transform,
    queryOptions = {},
  } = options
  
  // Construir la query de Firestore
  const buildFirestoreQuery = useCallback((): Query<DocumentData> | null => {
    if (!isFirebaseConfigured || !db) {
      return null
    }
    
    const constraints: QueryConstraint[] = []
    
    // Aplicar filtros where
    for (const filter of filters) {
      constraints.push(where(filter.field, filter.operator, filter.value))
    }
    
    // Ordenamiento
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection))
    }
    
    // Límite
    if (limitCount && limitCount > 0) {
      constraints.push(limit(limitCount))
    }
    
    return query(collection(db, collectionPath), ...constraints)
  }, [collectionPath, orderByField, orderDirection, filters, limitCount])
  
  // Función fetch inicial (para TanStack Query)
  const fetchData = useCallback(async (): Promise<T[]> => {
    const firestoreQuery = buildFirestoreQuery()
    
    if (!firestoreQuery) {
      logger.warn(`[useRealtimeQuery] Firebase no configurado para ${collectionPath}`, {
        context: 'useRealtimeQuery',
      })
      return []
    }
    
    try {
      const snapshot = await getDocs(firestoreQuery)
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      const result = transform ? transform(docs) : (docs as T[])
      
      logger.info(`[useRealtimeQuery] ${collectionPath}: ${result.length} registros (fetch inicial)`, {
        context: 'useRealtimeQuery',
      })
      
      return result
    } catch (error) {
      logger.error(`[useRealtimeQuery] Error fetch ${collectionPath}`, error as Error, {
        context: 'useRealtimeQuery',
      })
      throw error
    }
  }, [buildFirestoreQuery, collectionPath, transform])
  
  // Query principal con TanStack Query
  const queryResult = useQuery<T[], Error>({
    queryKey: queryKey as string[],
    queryFn: fetchData,
    enabled: enabled && isFirebaseConfigured,
    staleTime: Infinity, // Nunca stale - onSnapshot mantiene datos frescos
    gcTime: Infinity, // Mantener en cache indefinidamente
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    ...queryOptions,
  })
  
  // Efecto para listener realtime
  useEffect(() => {
    if (!enabled || !isFirebaseConfigured || !db) {
      return
    }
    
    const firestoreQuery = buildFirestoreQuery()
    if (!firestoreQuery) {
      return
    }
    
    // Limpiar suscripción anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }
    
    logger.info(`[useRealtimeQuery] Iniciando listener realtime: ${collectionPath}`, {
      context: 'useRealtimeQuery',
      data: { queryKey, orderByField, filters: filters.length },
    })
    
    // Suscribirse a cambios en tiempo real
    unsubscribeRef.current = onSnapshot(
      firestoreQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        
        const result = transform ? transform(docs) : (docs as T[])
        
        // ✨ MAGIA: Actualizar cache de TanStack Query directamente
        queryClient.setQueryData(queryKey, result)
        isRealtimeRef.current = true
        
        logger.info(`[useRealtimeQuery] ${collectionPath}: ${result.length} registros (REALTIME UPDATE)`, {
          context: 'useRealtimeQuery',
        })
      },
      (error) => {
        logger.error(`[useRealtimeQuery] Error listener ${collectionPath}`, error, {
          context: 'useRealtimeQuery',
        })
        isRealtimeRef.current = false
      },
    )
    
    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        logger.info(`[useRealtimeQuery] Cerrando listener: ${collectionPath}`, {
          context: 'useRealtimeQuery',
        })
        unsubscribeRef.current()
        unsubscribeRef.current = null
        isRealtimeRef.current = false
      }
    }
  }, [
    enabled,
    buildFirestoreQuery,
    collectionPath,
    queryKey,
    queryClient,
    transform,
    orderByField,
    filters.length,
  ])
  
  return {
    data: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isStale: queryResult.isStale,
    refetch: queryResult.refetch,
    isRealtime: isRealtimeRef.current,
  }
}

// ============================================================
// HOOKS PRE-CONFIGURADOS PARA CADA COLECCIÓN
// ============================================================

import { queryKeys } from '@/app/lib/query/queryClient'

// Tipos base (simplificados, los completos están en types/index.ts)
interface BaseDocument {
  id: string
  [key: string]: unknown
}

/**
 * Hook para ventas en tiempo real con TanStack Query
 */
export function useRealtimeVentasQuery() {
  return useRealtimeQuery<BaseDocument>(
    [...queryKeys.ventas.all],
    'ventas',
    {
      orderByField: 'fecha',
      orderDirection: 'desc',
    },
  )
}

/**
 * Hook para clientes en tiempo real con TanStack Query
 */
export function useRealtimeClientesQuery() {
  return useRealtimeQuery<BaseDocument>(
    [...queryKeys.clientes.all],
    'clientes',
    {
      orderByField: 'nombre',
      orderDirection: 'asc',
    },
  )
}

/**
 * Hook para distribuidores en tiempo real con TanStack Query
 */
export function useRealtimeDistribuidoresQuery() {
  return useRealtimeQuery<BaseDocument>(
    [...queryKeys.distribuidores.all],
    'distribuidores',
    {
      orderByField: 'nombre',
      orderDirection: 'asc',
    },
  )
}

/**
 * Hook para órdenes de compra en tiempo real con TanStack Query
 */
export function useRealtimeOrdenesCompraQuery() {
  return useRealtimeQuery<BaseDocument>(
    [...queryKeys.ordenesCompra.all],
    'ordenes_compra',
    {
      orderByField: 'fecha',
      orderDirection: 'desc',
    },
  )
}

/**
 * Hook para bancos en tiempo real con TanStack Query
 */
export function useRealtimeBancosQuery() {
  return useRealtimeQuery<BaseDocument>(
    [...queryKeys.bancos.all],
    'bancos',
    {
      orderByField: 'nombre',
      orderDirection: 'asc',
    },
  )
}

/**
 * Hook para movimientos en tiempo real con TanStack Query
 */
export function useRealtimeMovimientosQuery(bancoId?: string) {
  return useRealtimeQuery<BaseDocument>(
    bancoId ? [...queryKeys.movimientos.byBanco(bancoId)] : [...queryKeys.movimientos.all],
    'movimientos',
    {
      orderByField: 'fecha',
      orderDirection: 'desc',
      filters: bancoId ? [{ field: 'bancoId', operator: '==', value: bancoId }] : [],
    },
  )
}

/**
 * Hook para almacén en tiempo real con TanStack Query
 */
export function useRealtimeAlmacenQuery() {
  return useRealtimeQuery<BaseDocument>(
    [...queryKeys.almacen.all],
    'almacen_productos',
    {
      orderByField: 'nombre',
      orderDirection: 'asc',
    },
  )
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default useRealtimeQuery
