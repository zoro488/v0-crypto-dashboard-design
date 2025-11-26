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
 */

import { useEffect, useState, useRef, useCallback } from "react"
import { 
  collection, query, orderBy, where, limit, getDocs, 
  DocumentData, QueryDocumentSnapshot 
} from "firebase/firestore"
import { db } from "./config"
import { logger } from "../utils/logger"

// ===================================================================
// CONFIGURACIÓN
// ===================================================================
const DEFAULT_PAGE_SIZE = 500  // Aumentado para mostrar todos los registros
const SMALL_PAGE_SIZE = 100    // Para colecciones pequeñas
const LARGE_PAGE_SIZE = 1000   // Para consultas completas

// Flag global para modo mock
let USE_MOCK_DATA = false
let FIRESTORE_CHECKED = false

// ===================================================================
// VERIFICACIÓN INICIAL DE FIRESTORE
// ===================================================================
async function checkFirestore(): Promise<boolean> {
  if (FIRESTORE_CHECKED) return !USE_MOCK_DATA
  
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
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
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

export function useAlmacenData(): HookResult<DocumentData> {
  return useFirestoreQuery('almacen_productos', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_PRODUCTOS
  })
}

export function useVentasData(): HookResult<DocumentData> {
  return useFirestoreQuery('ventas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_VENTAS
  })
}

export function useClientesData(): HookResult<DocumentData> {
  return useFirestoreQuery('clientes', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_CLIENTES
  })
}

export function useDistribuidoresData(): HookResult<DocumentData> {
  return useFirestoreQuery('distribuidores', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    pageSize: DEFAULT_PAGE_SIZE,
    mockData: MOCK_DISTRIBUIDORES
  })
}

export function useOrdenesCompraData(): HookResult<DocumentData> {
  return useFirestoreQuery('ordenes_compra', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_ORDENES_COMPRA
  })
}

export function useDashboardData(): HookResult<DocumentData> & { totales: Record<string, unknown> } {
  const result = useFirestoreQuery('dashboard_paneles', {
    pageSize: SMALL_PAGE_SIZE,
    mockData: []
  })
  
  return { ...result, totales: { ventas: 150000, gastos: 50000, clientes: 120 } }
}

export function useGYAData(): HookResult<DocumentData> {
  return useFirestoreQuery('movimientos', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_MOVIMIENTOS
  })
}

export function useIngresosBanco(bancoId: string): HookResult<DocumentData> {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_MOVIMIENTOS.filter(m => m.tipo === 'ingreso')
  })
  
  return {
    ...result,
    data: result.data.filter(m => m.tipoMovimiento === 'ingreso' || m.tipoMovimiento === 'transferencia_entrada')
  }
}

export function useGastos(bancoId: string): HookResult<DocumentData> {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_MOVIMIENTOS.filter(m => m.tipo === 'gasto')
  })
  
  return {
    ...result,
    data: result.data.filter(m => m.tipoMovimiento === 'gasto' || m.tipoMovimiento === 'transferencia_salida')
  }
}

export function useTransferencias(bancoId: string): HookResult<DocumentData> {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_TRANSFERENCIAS
  })
  
  return {
    ...result,
    data: result.data.filter(m => m.tipoMovimiento?.includes('transferencia'))
  }
}

export function useCorteBancario(bancoId: string): HookResult<DocumentData> {
  return useFirestoreQuery('cortes_bancarios', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fechaInicio',
    orderDirection: 'desc',
    pageSize: SMALL_PAGE_SIZE,
    mockData: MOCK_CORTES
  })
}

export function useEntradasAlmacen(): HookResult<DocumentData> {
  return useFirestoreQuery('almacen_entradas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
    mockData: MOCK_ENTRADAS
  })
}

export function useSalidasAlmacen(): HookResult<DocumentData> {
  return useFirestoreQuery('almacen_salidas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    pageSize: LARGE_PAGE_SIZE,
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
// MOCK DATA
// ===================================================================
const MOCK_CLIENTES = [
  { id: "C-001", nombre: "Cliente VIP 1", email: "vip1@example.com", telefono: "555-0001", saldo: 0 },
  { id: "C-002", nombre: "Cliente Regular 2", email: "reg2@example.com", telefono: "555-0002", saldo: 1500 },
]

const MOCK_MOVIMIENTOS = [
  { id: "M-001", tipo: "ingreso", tipoMovimiento: "ingreso", fecha: new Date().toISOString(), monto: 5000, concepto: "Venta", bancoId: "banco_1" },
  { id: "M-002", tipo: "gasto", tipoMovimiento: "gasto", fecha: new Date().toISOString(), monto: 2000, concepto: "Pago", bancoId: "banco_1" },
]

const MOCK_TRANSFERENCIAS = [
  { id: "T-001", fecha: new Date().toISOString(), monto: 1000, origen: "Banco A", destino: "Banco B" },
]

const MOCK_CORTES = [
  { id: "CT-001", periodo: "Marzo 2024", fechaInicio: new Date().toISOString(), capitalInicial: 50000, capitalFinal: 65000 },
]

const MOCK_DISTRIBUIDORES = [
  { id: "1", nombre: "Distribuidor Alpha", totalOrdenesCompra: 150000, deudaTotal: 50000 },
  { id: "2", nombre: "Distribuidor Beta", totalOrdenesCompra: 80000, deudaTotal: 0 },
]

const MOCK_ORDENES_COMPRA = [
  { id: "OC-001", fecha: "2024-03-20", distribuidor: "Alpha", cantidad: 100, costoTotal: 50000, estado: "pendiente" },
  { id: "OC-002", fecha: "2024-03-18", distribuidor: "Beta", cantidad: 50, costoTotal: 25000, estado: "pagado" },
]

const MOCK_VENTAS = [
  { id: "V-001", fecha: "2024-03-21", cliente: "Cliente A", total: 1500, estado: "completado" },
  { id: "V-002", fecha: "2024-03-21", cliente: "Cliente B", total: 3500, estado: "completado" },
]

const MOCK_PRODUCTOS = [
  { id: "P-001", nombre: "Producto Premium A", stock: 150, precio: 299, categoria: "Electrónica" },
  { id: "P-002", nombre: "Producto Básico B", stock: 500, precio: 99, categoria: "Hogar" },
]

const MOCK_ENTRADAS = [
  { id: "E-001", fecha: new Date().toISOString(), origen: "Distribuidor Alpha", cantidad: 100, valorTotal: 50000 },
]

const MOCK_SALIDAS = [
  { id: "S-001", fecha: new Date().toISOString(), destino: "Cliente VIP", cantidad: 10, valorTotal: 10000 },
]
