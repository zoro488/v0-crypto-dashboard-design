'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  getDocs,
  getCountFromServer,
  QueryConstraint,
  DocumentSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  where,
  WhereFilterOp,
  FieldPath,
  getFirestore,
} from 'firebase/firestore'

// ===================================================================
// TIPOS
// ===================================================================

export interface PaginationState {
  /** Página actual (1-indexed) */
  currentPage: number
  /** Total de páginas */
  totalPages: number
  /** Total de documentos */
  totalCount: number
  /** Documentos por página */
  pageSize: number
  /** Si hay página anterior */
  hasPrevPage: boolean
  /** Si hay página siguiente */
  hasNextPage: boolean
  /** Si está cargando */
  isLoading: boolean
  /** Error si existe */
  error: Error | null
}

export interface PaginationActions {
  /** Ir a la primera página */
  goToFirstPage: () => Promise<void>
  /** Ir a la página anterior */
  goToPrevPage: () => Promise<void>
  /** Ir a la siguiente página */
  goToNextPage: () => Promise<void>
  /** Ir a la última página */
  goToLastPage: () => Promise<void>
  /** Ir a una página específica */
  // eslint-disable-next-line no-unused-vars
  goToPage: (page: number) => Promise<void>
  /** Cambiar tamaño de página */
  // eslint-disable-next-line no-unused-vars
  setPageSize: (size: number) => void
  /** Refrescar datos */
  refresh: () => Promise<void>
}

export interface FilterCondition {
  field: string | FieldPath
  operator: WhereFilterOp
  value: unknown
}

export interface UsePaginatedFirestoreOptions {
  /** Colección de Firestore */
  collectionName: string
  /** Campo para ordenar */
  orderByField?: string
  /** Dirección del orden */
  orderDirection?: 'asc' | 'desc'
  /** Tamaño de página inicial */
  initialPageSize?: number
  /** Condiciones de filtro */
  filters?: FilterCondition[]
  /** Habilitar paginación */
  enabled?: boolean
}

export interface UsePaginatedFirestoreResult<T> {
  /** Datos de la página actual */
  data: T[]
  /** Estado de paginación */
  pagination: PaginationState
  /** Acciones de paginación */
  actions: PaginationActions
}

// ===================================================================
// HOOK PRINCIPAL
// ===================================================================

/**
 * Hook para paginación de datos de Firestore
 * 
 * Implementa cursor-based pagination para mejor rendimiento
 * con colecciones grandes de Firestore.
 * 
 * @example
 * ```typescript
 * const { data, pagination, actions } = usePaginatedFirestore<Venta>({
 *   collectionName: 'ventas',
 *   orderByField: 'fecha',
 *   orderDirection: 'desc',
 *   initialPageSize: 10,
 *   filters: [
 *     { field: 'estadoPago', operator: '==', value: 'completo' }
 *   ]
 * })
 * 
 * // Navegar
 * await actions.goToNextPage()
 * await actions.goToPrevPage()
 * await actions.setPageSize(25)
 * ```
 */
export function usePaginatedFirestore<T extends DocumentData>(
  options: UsePaginatedFirestoreOptions,
): UsePaginatedFirestoreResult<T> {
  const {
    collectionName,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    initialPageSize = 10,
    filters = [],
    enabled = true,
  } = options

  // Estado
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Cursores para navegación
  const firstDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  const pageDocsRef = useRef<Map<number, {
    first: DocumentSnapshot<DocumentData>
    last: DocumentSnapshot<DocumentData>
  }>>(new Map())

  // Firestore instance
  const db = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      return getFirestore()
    } catch {
      return null
    }
  }, [])

  // Construir query base con filtros
  const buildBaseConstraints = useCallback((): QueryConstraint[] => {
    const constraints: QueryConstraint[] = []
    
    // Agregar filtros
    filters.forEach((filter) => {
      constraints.push(where(filter.field, filter.operator, filter.value))
    })
    
    // Agregar ordenamiento
    constraints.push(orderBy(orderByField, orderDirection))
    
    return constraints
  }, [filters, orderByField, orderDirection])

  // Obtener conteo total
  const fetchTotalCount = useCallback(async () => {
    if (!db || !enabled) return

    try {
      const collectionRef = collection(db, collectionName)
      const baseConstraints = buildBaseConstraints()
      const countQuery = query(collectionRef, ...baseConstraints.filter(c => 
        // Solo incluir where constraints para el conteo
        c.type === 'where',
      ))
      
      const snapshot = await getCountFromServer(countQuery)
      setTotalCount(snapshot.data().count)
    } catch (err) {
      console.error('Error al obtener conteo:', err)
    }
  }, [db, enabled, collectionName, buildBaseConstraints])

  // Fetch datos de una página
  const fetchPage = useCallback(async (
    pageNum: number,
    direction: 'first' | 'next' | 'prev' | 'last' | 'specific' = 'first',
  ) => {
    if (!db || !enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const collectionRef = collection(db, collectionName)
      const baseConstraints = buildBaseConstraints()
      const constraints: QueryConstraint[] = [...baseConstraints]

      // Determinar constraints de paginación según dirección
      switch (direction) {
        case 'first':
          constraints.push(limit(pageSize))
          break

        case 'next':
          if (lastDocRef.current) {
            constraints.push(startAfter(lastDocRef.current))
          }
          constraints.push(limit(pageSize))
          break

        case 'prev':
          if (firstDocRef.current) {
            constraints.push(endBefore(firstDocRef.current))
          }
          constraints.push(limitToLast(pageSize))
          break

        case 'last': {
          // Para ir a la última página, usamos limitToLast
          // Nota: Firestore no soporta offset directo, usamos limitToLast
          constraints.push(limitToLast(pageSize))
          break
        }

        case 'specific': {
          // Para páginas específicas, usamos cursores guardados si existen
          const cachedPage = pageDocsRef.current.get(pageNum)
          if (cachedPage && pageNum > 1) {
            const prevPage = pageDocsRef.current.get(pageNum - 1)
            if (prevPage) {
              constraints.push(startAfter(prevPage.last))
            }
          }
          constraints.push(limit(pageSize))
          break
        }
      }

      const q = query(collectionRef, ...constraints)
      const snapshot = await getDocs(q)

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as T[]

      // Guardar cursores
      if (snapshot.docs.length > 0) {
        firstDocRef.current = snapshot.docs[0]
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1]
        
        // Guardar en caché para navegación específica
        pageDocsRef.current.set(pageNum, {
          first: snapshot.docs[0],
          last: snapshot.docs[snapshot.docs.length - 1],
        })
      }

      setData(docs)
      setCurrentPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar datos'))
      console.error('Error al cargar página:', err)
    } finally {
      setIsLoading(false)
    }
  }, [db, enabled, collectionName, buildBaseConstraints, pageSize])

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [totalCount, pageSize])

  // Estado de paginación
  const pagination: PaginationState = useMemo(() => ({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    isLoading,
    error,
  }), [currentPage, totalPages, totalCount, pageSize, isLoading, error])

  // Acciones de paginación
  const actions: PaginationActions = useMemo(() => ({
    goToFirstPage: async () => {
      if (currentPage !== 1) {
        await fetchPage(1, 'first')
      }
    },
    goToPrevPage: async () => {
      if (currentPage > 1) {
        await fetchPage(currentPage - 1, 'prev')
      }
    },
    goToNextPage: async () => {
      if (currentPage < totalPages) {
        await fetchPage(currentPage + 1, 'next')
      }
    },
    goToLastPage: async () => {
      if (currentPage !== totalPages) {
        await fetchPage(totalPages, 'last')
      }
    },
    goToPage: async (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages))
      if (targetPage !== currentPage) {
        if (targetPage === 1) {
          await fetchPage(1, 'first')
        } else if (targetPage === totalPages) {
          await fetchPage(totalPages, 'last')
        } else {
          await fetchPage(targetPage, 'specific')
        }
      }
    },
    setPageSize: (size: number) => {
      setPageSize(size)
      pageDocsRef.current.clear()
      // Re-fetch desde la primera página con nuevo tamaño
      fetchPage(1, 'first')
    },
    refresh: async () => {
      pageDocsRef.current.clear()
      await fetchTotalCount()
      await fetchPage(currentPage, currentPage === 1 ? 'first' : 'specific')
    },
  }), [currentPage, totalPages, fetchPage, fetchTotalCount])

  // Serializar filtros para dependencias
  const filtersKey = JSON.stringify(filters)

  // Carga inicial
  useEffect(() => {
    if (enabled && db) {
      fetchTotalCount()
      fetchPage(1, 'first')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, db, collectionName, filtersKey])

  // Re-fetch cuando cambia el ordenamiento
  useEffect(() => {
    if (enabled && db) {
      pageDocsRef.current.clear()
      fetchPage(1, 'first')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderByField, orderDirection])

  return {
    data,
    pagination,
    actions,
  }
}

// ===================================================================
// HOOK SIMPLIFICADO PARA CASOS COMUNES
// ===================================================================

/**
 * Hook simplificado para paginación básica
 */
export function useSimplePagination<T extends DocumentData>(
  collectionName: string,
  pageSize: number = 10,
): UsePaginatedFirestoreResult<T> {
  return usePaginatedFirestore<T>({
    collectionName,
    initialPageSize: pageSize,
    orderByField: 'createdAt',
    orderDirection: 'desc',
  })
}

export default usePaginatedFirestore
