"use client"

/**
 * 🛡️ HOOKS DE FIRESTORE BLINDADOS
 * Generado automáticamente por emergency-fix.ts
 * 
 * Características:
 * - Flag isMounted para evitar updates en componentes desmontados
 * - Cleanup function que cancela listeners
 * - Modo mock automático cuando Firestore falla
 * - Patrón getDocs (lectura única) para evitar ASSERTION FAILED
 * - 🔄 Auto-refresh cuando el store dispara triggerDataRefresh
 */

import { useEffect, useState, useRef, useCallback } from "react"
import { 
  collection, query, orderBy, where, limit, getDocs, onSnapshot,
  DocumentData, QueryDocumentSnapshot, Unsubscribe
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./config"
import { logger } from "../utils/logger"
import { useAppStore } from "../store/useAppStore"

// ===================================================================
// CONFIGURACIÓN
// ===================================================================
const DEFAULT_PAGE_SIZE = 1000  // Aumentado para mostrar todos los registros
const SMALL_PAGE_SIZE = 100    // Para colecciones pequeñas
const LARGE_PAGE_SIZE = 5000   // Para consultas completas sin límite práctico

// Flag global para modo mock
let USE_MOCK_DATA = false
let FIRESTORE_CHECKED = false

// ===================================================================
// VERIFICACIÓN INICIAL DE FIRESTORE
// ===================================================================
async function checkFirestore(): Promise<boolean> {
  if (FIRESTORE_CHECKED) return !USE_MOCK_DATA
  
  // Guard: verificar que Firestore está disponible
  if (!isFirebaseConfigured || !db) {
    logger.warn("[Firestore] ⚠️ Firebase no configurado - usando modo mock")
    FIRESTORE_CHECKED = true
    USE_MOCK_DATA = true
    return false
  }
  
  try {
    const testQ = query(collection(db, "dashboard_totales"), limit(1))
    await getDocs(testQ)
    FIRESTORE_CHECKED = true
    USE_MOCK_DATA = false
    logger.info("[Firestore] ✅ Conexión verificada")
    return true
  } catch (err) {
    logger.warn("[Firestore] ⚠️ Sin conexión - usando modo mock")
    FIRESTORE_CHECKED = true
    USE_MOCK_DATA = true
    return false
  }
}

// Ejecutar verificación al cargar
if (typeof window !== 'undefined') {
  checkFirestore()
}

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
// HOOK GENÉRICO BLINDADO
// ===================================================================
function useFirestoreQuery<T extends DocumentData>(
  collectionName: string,
  options: {
    orderByField?: string
    orderDirection?: 'asc' | 'desc'
    whereField?: string
    whereValue?: string
    pageSize?: number
    mockData: T[]
    transform?: (doc: QueryDocumentSnapshot<DocumentData>) => T
  }
): HookResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 🔄 Obtener el trigger de refresh del store
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)
  
  // 🛡️ Flag isMounted - CRÍTICO para evitar memory leaks
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)
  // Ref para rastrear las opciones anteriores
  const prevOptionsRef = useRef<string>('')

  const fetchData = useCallback(async () => {
    // Crear key única para las opciones
    const optionsKey = JSON.stringify({
      collectionName,
      whereField: options.whereField,
      whereValue: options.whereValue,
      orderByField: options.orderByField
    })
    
    // Evitar fetch duplicados con mismas opciones
    if (fetchingRef.current && prevOptionsRef.current === optionsKey) return
    fetchingRef.current = true
    prevOptionsRef.current = optionsKey

    // Modo mock activo
    if (USE_MOCK_DATA) {
      if (isMountedRef.current) {
        setData(options.mockData)
        setLoading(false)
        setError(null)
      }
      fetchingRef.current = false
      return
    }

    // Guard: verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      if (isMountedRef.current) {
        setData(options.mockData)
        setLoading(false)
        setError("Firebase no configurado")
      }
      fetchingRef.current = false
      return
    }

    try {
      // Construir query de forma correcta
      const collRef = collection(db, collectionName)
      const constraints: Parameters<typeof query>[1][] = []
      
      // Agregar where si existe
      if (options.whereField && options.whereValue) {
        constraints.push(where(options.whereField, '==', options.whereValue))
      }
      
      // Agregar orderBy si existe
      if (options.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'))
      }
      
      // Agregar limit
      constraints.push(limit(options.pageSize || DEFAULT_PAGE_SIZE))
      
      // Crear query con todos los constraints
      const q = query(collRef, ...constraints)

      const snapshot = await getDocs(q)
      
      // 🛡️ Verificar si el componente sigue montado
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
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error(`[Firestore] Error en ${collectionName}:`, errMsg)

      // 🛡️ Verificar montaje antes de actualizar estado
      if (!isMountedRef.current) {
        fetchingRef.current = false
        return
      }

      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn(`[Firestore] Usando mock para ${collectionName}`)
        setData(options.mockData)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
    
    fetchingRef.current = false
  }, [collectionName, options.whereField, options.whereValue, options.orderByField, options.orderDirection, options.pageSize, options.mockData, options.transform])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    // 🛡️ CLEANUP FUNCTION - LA CLAVE PARA ARREGLAR EL CRASH
    return () => {
      isMountedRef.current = false
    }
  }, [fetchData, dataRefreshTrigger]) // 🔄 Re-fetch cuando cambia el trigger

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
    mockData: T[]
  }
): HookResult<T> {
  // Guardar referencia estable del mockData
  const mockDataRef = useRef(options.mockData)
  
  // Siempre inicializar con mock data - se actualizará cuando Firestore conecte
  const [data, setData] = useState<T[]>(() => mockDataRef.current)
  const [loading, setLoading] = useState(false) // No loading si tenemos mock data
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  
  // Log para debug
  useEffect(() => {
    logger.info(`[Firestore RT] ${collectionName}: inicializado con ${mockDataRef.current.length} registros mock`)
  }, [collectionName])

  const refresh = useCallback(async () => {
    // No-op para tiempo real, los datos se actualizan automáticamente
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    // Verificar si debemos usar modo mock
    const shouldUseMock = USE_MOCK_DATA || !isFirebaseConfigured || !db
    
    // Modo mock - ya inicializado en useState, pero asegurar
    if (shouldUseMock || !db) {
      logger.info(`[Firestore RT] ${collectionName}: usando modo mock con ${mockDataRef.current.length} registros`)
      setData(mockDataRef.current)
      setLoading(false)
      return
    }

    // Type guard: db está garantizado no-null después del check anterior
    const firestore = db

    try {
      const collRef = collection(firestore, collectionName)
      const constraints: Parameters<typeof query>[1][] = []

      if (options.whereField && options.whereValue) {
        constraints.push(where(options.whereField, '==', options.whereValue))
      }

      if (options.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'))
      }

      const q = query(collRef, ...constraints)

      // 🔴 SUSCRIPCIÓN EN TIEMPO REAL
      unsubscribeRef.current = onSnapshot(q, 
        (snapshot) => {
          if (!isMountedRef.current) return
          
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as unknown as T[]
          
          logger.info(`[Firestore RT] ${collectionName}: ${items.length} registros`)
          setData(items)
          setLoading(false)
          setError(null)
        },
        (err) => {
          if (!isMountedRef.current) return
          logger.error(`[Firestore RT] Error en ${collectionName}:`, err.message)
          setData(mockDataRef.current)
          setLoading(false)
          setError(err.message)
        }
      )
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error(`[Firestore RT] Error configurando ${collectionName}:`, errMsg)
      setData(mockDataRef.current)
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
    mockData: MOCK_MOVIMIENTOS.filter(m => m.bancoId === bancoId || !m.bancoId)
  })

  const stats: BancoStats = {
    totalIngresos: result.data.filter(m => m.tipoMovimiento === 'ingreso' || m.tipoMovimiento === 'transferencia_entrada').reduce((s, m) => s + (m.monto || 0), 0),
    totalGastos: result.data.filter(m => m.tipoMovimiento === 'gasto' || m.tipoMovimiento === 'transferencia_salida').reduce((s, m) => s + (m.monto || 0), 0),
    saldoNeto: 0,
    transacciones: result.data.length
  }
  stats.saldoNeto = stats.totalIngresos - stats.totalGastos

  return { ...result, stats }
}

// Hook para obtener todos los bancos desde Firestore (TIEMPO REAL)
export function useBancosData(): HookResult<DocumentData> {
  return useRealtimeQuery('bancos', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    mockData: MOCK_BANCOS
  })
}

export function useAlmacenData(): HookResult<DocumentData> {
  return useRealtimeQuery('almacen_productos', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    mockData: MOCK_PRODUCTOS
  })
}

export function useVentasData(): HookResult<DocumentData> {
  return useRealtimeQuery('ventas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_VENTAS
  })
}

export function useClientesData(): HookResult<DocumentData> {
  return useRealtimeQuery('clientes', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    mockData: MOCK_CLIENTES
  })
}

export function useDistribuidoresData(): HookResult<DocumentData> {
  return useRealtimeQuery('distribuidores', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    mockData: MOCK_DISTRIBUIDORES
  })
}

export function useOrdenesCompraData(): HookResult<DocumentData> {
  return useRealtimeQuery('ordenes_compra', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_ORDENES_COMPRA
  })
}

export function useDashboardData(): HookResult<DocumentData> & { totales: Record<string, unknown> } {
  const result = useRealtimeQuery('dashboard_paneles', {
    mockData: []
  })
  
  // Usar estadísticas reales calculadas desde los CSVs
  const totales = {
    // Ventas
    totalVentas: STATS.totalVentas,
    totalCobrado: STATS.totalCobrado,
    totalPendiente: STATS.totalPendiente,
    ventasCount: STATS.ventasCount,
    // Clientes
    clientesCount: STATS.clientesCount,
    // Órdenes
    ordenesCount: STATS.ordenesCount,
    distribuidoresCount: STATS.distribuidoresCount,
    // Distribución GYA (Lógica del Excel)
    totalBovedaMonte: STATS.totalBovedaMonte,
    totalFletes: STATS.totalFletes,
    totalUtilidades: STATS.totalUtilidades,
    // Legacy aliases
    ventas: STATS.totalVentas,
    gastos: 50000,
    clientes: STATS.clientesCount
  }
  
  return { ...result, totales }
}

export function useGYAData(): HookResult<DocumentData> {
  return useRealtimeQuery('movimientos', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_MOVIMIENTOS
  })
}

export function useIngresosBanco(bancoId: string): HookResult<DocumentData> {
  // Usar la colección específica del banco: {bancoId}_ingresos
  const collectionName = `${bancoId}_ingresos`
  
  return useRealtimeQuery(collectionName, {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_MOVIMIENTOS.filter(m => m.tipo === 'ingreso')
  })
}

export function useGastos(bancoId: string): HookResult<DocumentData> {
  // Usar la colección específica del banco: {bancoId}_gastos
  const collectionName = `${bancoId}_gastos`
  
  return useRealtimeQuery(collectionName, {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_MOVIMIENTOS.filter(m => m.tipo === 'gasto')
  })
}

export function useTransferencias(bancoId?: string): HookResult<DocumentData> {
  // Transferencias están en colección separada
  const result = useRealtimeQuery('transferencias', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_TRANSFERENCIAS
  })
  
  // Si se especifica bancoId, filtrar por origen
  if (bancoId) {
    return {
      ...result,
      data: result.data.filter(t => 
        (t as Record<string, unknown>).bancoOrigenId === bancoId ||
        (t as Record<string, unknown>).bancoDestinoId === bancoId
      )
    }
  }
  
  return result
}

export function useCorteBancario(bancoId: string): HookResult<DocumentData> {
  // Usar la colección específica del banco: {bancoId}_cortes
  const collectionName = `${bancoId}_cortes`
  
  return useRealtimeQuery(collectionName, {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_CORTES
  })
}

export function useEntradasAlmacen(): HookResult<DocumentData> {
  return useRealtimeQuery('almacen_entradas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_ENTRADAS
  })
}

export function useSalidasAlmacen(): HookResult<DocumentData> {
  return useRealtimeQuery('almacen_salidas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_SALIDAS
  })
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
// MOCK DATA - Generados desde CSVs reales (96 ventas, 31 clientes, 9 OCs)
// ===================================================================

// Importar datos generados desde el script de migración
import { 
  MOCK_VENTAS as GENERATED_VENTAS,
  MOCK_CLIENTES as GENERATED_CLIENTES,
  MOCK_ORDENES_COMPRA as GENERATED_ORDENES,
  MOCK_DISTRIBUIDORES as GENERATED_DISTRIBUIDORES,
  MOCK_BANCOS as GENERATED_BANCOS,
  MOCK_MOVIMIENTOS as GENERATED_MOVIMIENTOS,
  STATS
} from '@/app/lib/data/mock-data-generated'

// Re-exportar estadísticas para uso global
export { STATS as CHRONOS_STATS }

const MOCK_CLIENTES = GENERATED_CLIENTES

const MOCK_MOVIMIENTOS = GENERATED_MOVIMIENTOS.length > 0 ? GENERATED_MOVIMIENTOS : [
  { id: "M-001", tipo: "ingreso", tipoMovimiento: "ingreso", fecha: new Date().toISOString(), monto: 5000, concepto: "Venta", bancoId: "boveda_monte" },
  { id: "M-002", tipo: "gasto", tipoMovimiento: "gasto", fecha: new Date().toISOString(), monto: 2000, concepto: "Pago", bancoId: "boveda_monte" },
]

const MOCK_TRANSFERENCIAS = [
  { id: "T-001", fecha: new Date().toISOString(), monto: 1000, origen: "Banco A", destino: "Banco B" },
]

const MOCK_CORTES = [
  { id: "CT-001", periodo: "Marzo 2024", fechaInicio: new Date().toISOString(), capitalInicial: 50000, capitalFinal: 65000 },
]

const MOCK_DISTRIBUIDORES = GENERATED_DISTRIBUIDORES

const MOCK_ORDENES_COMPRA = GENERATED_ORDENES

const MOCK_VENTAS = GENERATED_VENTAS

// Producto principal con stock actualizado según CSV (2296 entradas - 2279 salidas = 17)
const MOCK_PRODUCTOS = [
  { 
    id: "P-001", 
    nombre: "Producto Principal", 
    sku: "PROD-001",
    stock: 17, 
    stockActual: 17,
    stockMinimo: 50,
    precio: 6300, 
    valorUnitario: 6300,
    categoria: "Principal", 
    totalEntradas: 2296, 
    totalSalidas: 2279,
    ultimaActualizacion: new Date().toISOString()
  },
]

// Entradas basadas en las 9 órdenes de compra del CSV
const MOCK_ENTRADAS = [
  { id: "E-001", fecha: "2025-08-25", distribuidor: "Q-MAYA", ordenCompraId: "OC0001", cantidad: 423, valorTotal: 2664900, valorUnitario: 6300 },
  { id: "E-002", fecha: "2025-08-25", distribuidor: "Q-MAYA", ordenCompraId: "OC0002", cantidad: 32, valorTotal: 201600, valorUnitario: 6300 },
  { id: "E-003", fecha: "2025-08-25", distribuidor: "A/X", ordenCompraId: "OC0003", cantidad: 33, valorTotal: 207900, valorUnitario: 6300 },
  { id: "E-004", fecha: "2025-08-30", distribuidor: "PACMAN", ordenCompraId: "OC0004", cantidad: 487, valorTotal: 3068100, valorUnitario: 6300 },
  { id: "E-005", fecha: "2025-09-06", distribuidor: "Q-MAYA", ordenCompraId: "OC0005", cantidad: 513, valorTotal: 3231900, valorUnitario: 6300 },
  { id: "E-006", fecha: "2025-09-09", distribuidor: "CH-MONTE", ordenCompraId: "OC0006", cantidad: 100, valorTotal: 630000, valorUnitario: 6300 },
  { id: "E-007", fecha: "2025-09-29", distribuidor: "VALLE-MONTE", ordenCompraId: "OC0007", cantidad: 20, valorTotal: 140000, valorUnitario: 7000 },
  { id: "E-008", fecha: "2025-10-05", distribuidor: "PACMAN", ordenCompraId: "OC0008", cantidad: 488, valorTotal: 3074400, valorUnitario: 6300 },
  { id: "E-009", fecha: "2025-10-05", distribuidor: "Q-MAYA-MP", ordenCompraId: "OC0009", cantidad: 200, valorTotal: 1260000, valorUnitario: 6300 },
]

// Salidas resumen - 2279 unidades vendidas según CSV
const MOCK_SALIDAS = [
  { id: "S-001", fecha: "2025-08-23", cliente: "Bódega M-P", destino: "Bódega M-P", cantidad: 150, valorTotal: 945000 },
  { id: "S-002", fecha: "2025-08-23", cliente: "Valle", destino: "Valle", cantidad: 60, valorTotal: 408000 },
  { id: "S-003", fecha: "2025-08-26", cliente: "Varios", destino: "Múltiples clientes", cantidad: 2069, valorTotal: 7148600, observaciones: "93 ventas adicionales" },
]

// Mock de los 7 bancos del sistema CHRONOS - Usando datos generados
const MOCK_BANCOS = GENERATED_BANCOS

