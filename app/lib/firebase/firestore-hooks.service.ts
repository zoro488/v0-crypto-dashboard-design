'use client'

/**
 * 🛡️ HOOKS DE FIRESTORE - SISTEMA CHRONOS
 * 
 * Características:
 * - Sin datos mock - Solo datos reales de Firestore
 * - Flag isMounted para evitar updates en componentes desmontados
 * - Cleanup function que cancela listeners
 * - 🔄 Auto-refresh cuando el store dispara triggerDataRefresh
 * - 📦 Estados vacíos cuando no hay datos
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { 
  collection, query, orderBy, where, limit, getDocs, onSnapshot,
  DocumentData, QueryDocumentSnapshot, Unsubscribe,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './config'
import { logger } from '../utils/logger'
import { useAppStore } from '../store/useAppStore'
import * as unifiedService from '../services/unified-data-service'

// ===================================================================
// CONFIGURACIÓN
// ===================================================================
const DEFAULT_PAGE_SIZE = 1000
const LARGE_PAGE_SIZE = 5000

// ===================================================================
// TIPOS
// ===================================================================
interface HookResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface BancoStats {
  totalIngresos: number
  totalGastos: number
  saldoNeto: number
  transacciones: number
}

// ===================================================================
// HOOK GENÉRICO
// ===================================================================
function useFirestoreQuery<T extends DocumentData>(
  collectionName: string,
  options: {
    orderByField?: string
    orderDirection?: 'asc' | 'desc'
    whereField?: string
    whereValue?: string
    pageSize?: number
    transform?: (doc: QueryDocumentSnapshot<DocumentData>) => T
  },
): HookResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)
  const prevOptionsRef = useRef<string>('')

  const fetchData = useCallback(async () => {
    const optionsKey = JSON.stringify({
      collectionName,
      whereField: options.whereField,
      whereValue: options.whereValue,
      orderByField: options.orderByField,
    })
    
    if (fetchingRef.current && prevOptionsRef.current === optionsKey) return
    fetchingRef.current = true
    prevOptionsRef.current = optionsKey

    // Guard: verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      if (isMountedRef.current) {
        setData([])
        setLoading(false)
        setError('Firebase no configurado')
      }
      fetchingRef.current = false
      return
    }

    try {
      const collRef = collection(db, collectionName)
      const constraints: Parameters<typeof query>[1][] = []
      
      if (options.whereField && options.whereValue) {
        constraints.push(where(options.whereField, '==', options.whereValue))
      }
      
      if (options.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'))
      }
      
      constraints.push(limit(options.pageSize || DEFAULT_PAGE_SIZE))
      
      const q = query(collRef, ...constraints)
      const snapshot = await getDocs(q)
      
      if (!isMountedRef.current) {
        fetchingRef.current = false
        return
      }

      const items = snapshot.docs.map(doc => {
        if (options.transform) {
          return options.transform(doc)
        }
        return { id: doc.id, ...doc.data() } as unknown as T
      })

      logger.info(`[Firestore] ${collectionName}: ${items.length} registros cargados`)
      setData(items)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error desconocido'
      logger.error(`[Firestore] Error en ${collectionName}:`, errMsg)

      if (!isMountedRef.current) {
        fetchingRef.current = false
        return
      }

      setError(errMsg)
      setData([])
      setLoading(false)
    }
    
    fetchingRef.current = false
  }, [collectionName, options.whereField, options.whereValue, options.orderByField, options.orderDirection, options.pageSize, options.transform])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchData, dataRefreshTrigger])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOK CON SUSCRIPCIÓN EN TIEMPO REAL
// ===================================================================
function useRealtimeQuery<T extends DocumentData>(
  collectionName: string,
  options: {
    orderByField?: string
    orderDirection?: 'asc' | 'desc'
    whereField?: string
    whereValue?: string
  },
): HookResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  const refresh = useCallback(async () => {
    // No-op para tiempo real
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    if (!isFirebaseConfigured || !db) {
      setData([])
      setLoading(false)
      setError('Firebase no configurado')
      return
    }

    try {
      const collRef = collection(db, collectionName)
      const constraints: Parameters<typeof query>[1][] = []

      if (options.whereField && options.whereValue) {
        constraints.push(where(options.whereField, '==', options.whereValue))
      }

      if (options.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'))
      }

      const q = query(collRef, ...constraints)

      unsubscribeRef.current = onSnapshot(q, 
        (snapshot) => {
          if (!isMountedRef.current) return
          
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as T[]
          
          logger.info(`[Firestore RT] ${collectionName}: ${items.length} registros`)
          setData(items)
          setLoading(false)
          setError(null)
        },
        (err) => {
          if (!isMountedRef.current) return
          logger.error(`[Firestore RT] Error en ${collectionName}:`, err.message)
          setData([])
          setLoading(false)
          setError(err.message)
        },
      )
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error desconocido'
      logger.error(`[Firestore RT] Error configurando ${collectionName}:`, errMsg)
      setData([])
      setLoading(false)
      setError(errMsg)
    }

    return () => {
      isMountedRef.current = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [collectionName, options.whereField, options.whereValue, options.orderByField, options.orderDirection])

  return { data, loading, error, refresh }
}

// ===================================================================
// HOOKS ESPECÍFICOS
// ===================================================================

export function useBancoData(bancoId: string): HookResult<DocumentData> & { stats: BancoStats } {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
  })

  const stats: BancoStats = {
    totalIngresos: result.data.filter(m => m.tipoMovimiento === 'ingreso' || m.tipoMovimiento === 'transferencia_entrada').reduce((s, m) => s + (m.monto || 0), 0),
    totalGastos: result.data.filter(m => m.tipoMovimiento === 'gasto' || m.tipoMovimiento === 'transferencia_salida').reduce((s, m) => s + (m.monto || 0), 0),
    saldoNeto: 0,
    transacciones: result.data.length,
  }
  stats.saldoNeto = stats.totalIngresos - stats.totalGastos

  return { ...result, stats }
}

// Hook para obtener todos los bancos desde Firestore (TIEMPO REAL)
export function useBancosData(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirBancos((bancos) => {
      setData(bancos as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useAlmacenData(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirAlmacen((productos) => {
      setData(productos as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useVentasData(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirVentas((ventas) => {
      setData(ventas as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useClientesData(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirClientes((clientes) => {
      setData(clientes as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useDistribuidoresData(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirDistribuidores((distribuidores) => {
      setData(distribuidores as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useOrdenesCompraData(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirOrdenesCompra((ordenes) => {
      setData(ordenes as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useDashboardData(): HookResult<DocumentData> & { totales: Record<string, unknown> } {
  const result = useRealtimeQuery('dashboard_paneles', {})
  
  // Totales vacíos - se calculan desde los datos reales
  const totales = {
    totalVentas: 0,
    totalCobrado: 0,
    totalPendiente: 0,
    ventasCount: 0,
    clientesCount: 0,
    ordenesCount: 0,
    distribuidoresCount: 0,
    totalBovedaMonte: 0,
    totalFletes: 0,
    totalUtilidades: 0,
    ventas: 0,
    gastos: 0,
    clientes: 0,
  }
  
  return { ...result, totales }
}

export function useGYAData(): HookResult<DocumentData> {
  return useRealtimeQuery('movimientos', {
    orderByField: 'fecha',
    orderDirection: 'desc',
  })
}

/**
 * Hook para ingresos de banco - combina colección legacy + movimientos
 */
export function useIngresosBanco(bancoId: string): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setData([])
      setLoading(false)
      setError('Firebase no configurado')
      return
    }

    // Suscribirse a ambas colecciones en paralelo
    const unsubscribes: (() => void)[] = []
    let legacyData: DocumentData[] = []
    let movimientosData: DocumentData[] = []
    
    const updateCombinedData = () => {
      // Combinar y ordenar por fecha
      const combined = [...legacyData, ...movimientosData].sort((a, b) => {
        const fechaA = a.fecha?.seconds ? a.fecha.seconds : new Date(a.fecha || 0).getTime() / 1000
        const fechaB = b.fecha?.seconds ? b.fecha.seconds : new Date(b.fecha || 0).getTime() / 1000
        return fechaB - fechaA
      })
      setData(combined)
      setLoading(false)
      setError(null)
    }
    
    // 1. Colección legacy (boveda_monte_ingresos, etc.)
    try {
      const legacyQuery = query(
        collection(db, `${bancoId}_ingresos`),
        orderBy('fecha', 'desc'),
      )
      unsubscribes.push(
        onSnapshot(legacyQuery, (snapshot) => {
          legacyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          updateCombinedData()
        }, (err) => {
          logger.warn(`No hay colección legacy ${bancoId}_ingresos`, { context: 'firestore-hooks' })
          legacyData = []
          updateCombinedData()
        }),
      )
    } catch (err) {
      legacyData = []
    }
    
    // 2. Colección movimientos filtrada
    try {
      const movQuery = query(
        collection(db, 'movimientos'),
        where('bancoId', '==', bancoId),
        where('tipoMovimiento', '==', 'ingreso'),
        orderBy('fecha', 'desc'),
      )
      unsubscribes.push(
        onSnapshot(movQuery, (snapshot) => {
          movimientosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Mapear campos para compatibilidad
            ingreso: doc.data().monto,
            cliente: doc.data().cliente || doc.data().concepto,
          }))
          updateCombinedData()
        }, (err) => {
          logger.warn('Error en movimientos para ingresos', { context: 'firestore-hooks' })
          movimientosData = []
          updateCombinedData()
        }),
      )
    } catch (err) {
      movimientosData = []
    }

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [bancoId, dataRefreshTrigger])

  return { data, loading, error, refresh }
}

/**
 * Hook para gastos de banco - combina colección legacy + movimientos
 */
export function useGastos(bancoId: string): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setData([])
      setLoading(false)
      setError('Firebase no configurado')
      return
    }

    const unsubscribes: (() => void)[] = []
    let legacyData: DocumentData[] = []
    let movimientosData: DocumentData[] = []
    
    const updateCombinedData = () => {
      const combined = [...legacyData, ...movimientosData].sort((a, b) => {
        const fechaA = a.fecha?.seconds ? a.fecha.seconds : new Date(a.fecha || 0).getTime() / 1000
        const fechaB = b.fecha?.seconds ? b.fecha.seconds : new Date(b.fecha || 0).getTime() / 1000
        return fechaB - fechaA
      })
      setData(combined)
      setLoading(false)
      setError(null)
    }
    
    // 1. Colección legacy
    try {
      const legacyQuery = query(
        collection(db, `${bancoId}_gastos`),
        orderBy('fecha', 'desc'),
      )
      unsubscribes.push(
        onSnapshot(legacyQuery, (snapshot) => {
          legacyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          updateCombinedData()
        }, () => {
          legacyData = []
          updateCombinedData()
        }),
      )
    } catch (err) {
      legacyData = []
    }
    
    // 2. Colección movimientos (gastos)
    try {
      const movQuery = query(
        collection(db, 'movimientos'),
        where('bancoId', '==', bancoId),
        where('tipoMovimiento', '==', 'gasto'),
        orderBy('fecha', 'desc'),
      )
      unsubscribes.push(
        onSnapshot(movQuery, (snapshot) => {
          movimientosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            gasto: doc.data().monto,
            origen: doc.data().concepto,
          }))
          updateCombinedData()
        }, () => {
          movimientosData = []
          updateCombinedData()
        }),
      )
    } catch (err) {
      movimientosData = []
    }

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [bancoId, dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useTransferencias(bancoId?: string): HookResult<DocumentData> {
  const result = useRealtimeQuery('transferencias', {
    orderByField: 'fecha',
    orderDirection: 'desc',
  })
  
  if (bancoId) {
    return {
      ...result,
      data: result.data.filter(t => 
        (t as Record<string, unknown>).bancoOrigenId === bancoId ||
        (t as Record<string, unknown>).bancoDestinoId === bancoId,
      ),
    }
  }
  
  return result
}

export function useCorteBancario(bancoId: string): HookResult<DocumentData> {
  const collectionName = `${bancoId}_cortes`
  
  return useRealtimeQuery(collectionName, {
    orderByField: 'fecha',
    orderDirection: 'desc',
  })
}

export function useEntradasAlmacen(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirEntradasAlmacen((entradas) => {
      setData(entradas as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

export function useSalidasAlmacen(): HookResult<DocumentData> {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(async () => {
    setLoading(true)
  }, [])

  useEffect(() => {
    const unsubscribe = unifiedService.suscribirSalidasAlmacen((salidas) => {
      setData(salidas as DocumentData[])
      setLoading(false)
      setError(null)
    })
    return () => unsubscribe()
  }, [dataRefreshTrigger])

  return { data, loading, error, refresh }
}

// ===================================================================
// ALIASES
// ===================================================================
export const useVentas = useVentasData
export const useOrdenesCompra = useOrdenesCompraData
export const useProductos = useAlmacenData
export const useClientes = useClientesData
export const useDistribuidores = useDistribuidoresData

// ===================================================================
// ESTADÍSTICAS VACÍAS (se calculan desde datos reales)
// ===================================================================
export const CHRONOS_STATS = {
  totalVentas: 0,
  totalCobrado: 0,
  totalPendiente: 0,
  ventasCount: 0,
  clientesCount: 0,
  ordenesCount: 0,
  distribuidoresCount: 0,
  totalBovedaMonte: 0,
  totalFletes: 0,
  totalUtilidades: 0,
}

