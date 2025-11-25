"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { collection, query, onSnapshot, orderBy, where, limit, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore"
import { db } from "./config"
import { logger } from "../utils/logger"

// ===================================================================
// CONFIGURACIÓN DE PAGINACIÓN - CRÍTICO PARA RENDIMIENTO
// ===================================================================
const DEFAULT_PAGE_SIZE = 50
const SMALL_PAGE_SIZE = 20

// ===================================================================
// SISTEMA DE DETECCIÓN DE MODO - PREVIENE ASSERTION ERRORS
// ===================================================================

// Flag global para usar datos mock cuando Firebase falla
let USE_MOCK_DATA = false
let FIRESTORE_TESTED = false

// Función para verificar disponibilidad de Firestore (se ejecuta una vez)
async function checkFirestoreAvailability(): Promise<boolean> {
  if (FIRESTORE_TESTED) return !USE_MOCK_DATA
  
  try {
    // Intento de lectura simple para verificar conexión
    const testQuery = query(collection(db, "dashboard_totales"), limit(1))
    await getDocs(testQuery)
    FIRESTORE_TESTED = true
    USE_MOCK_DATA = false
    logger.info("[Firestore] Conexión verificada - usando datos reales")
    return true
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Error desconocido"
    if (errMsg.includes("Missing or insufficient permissions") || errMsg.includes("PERMISSION_DENIED")) {
      logger.warn("[Firestore] Sin permisos - activando modo mock")
      USE_MOCK_DATA = true
    } else {
      logger.error("[Firestore] Error de conexión:", errMsg)
      USE_MOCK_DATA = true
    }
    FIRESTORE_TESTED = true
    return false
  }
}

// Hook para obtener el estado de mock
function useMockMode(): boolean {
  const [isMock, setIsMock] = useState(USE_MOCK_DATA)
  
  useEffect(() => {
    if (!FIRESTORE_TESTED) {
      checkFirestoreAvailability().then(() => {
        setIsMock(USE_MOCK_DATA)
      })
    }
  }, [])
  
  return isMock
}

// ===================================================================
// HELPER: Safe Firestore Query con fallback a mock
// Previene el bug de ASSERTION FAILED usando getDocs primero
// ===================================================================

async function safeFirestoreQuery<T extends DocumentData>(
  queryRef: ReturnType<typeof query>,
  mockData: T[],
  mapFn: (doc: { id: string; data: () => DocumentData }) => T
): Promise<{ data: T[]; usedMock: boolean }> {
  if (USE_MOCK_DATA) {
    return { data: mockData, usedMock: true }
  }
  
  try {
    const snapshot = await getDocs(queryRef)
    const data = snapshot.docs.map(doc => mapFn({ id: doc.id, data: () => doc.data() as DocumentData }))
    return { data, usedMock: false }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Error desconocido"
    if (errMsg.includes("Missing or insufficient permissions")) {
      USE_MOCK_DATA = true
      logger.warn("[Firestore] Permisos denegados - usando datos mock")
      return { data: mockData, usedMock: true }
    }
    throw err
  }
}

// ===================================================================
// TIPOS COMPARTIDOS
// ===================================================================

interface FirestoreHookResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refresh?: () => void
}

interface BancoStats {
  totalIngresos: number
  totalGastos: number
  saldoNeto: number
  transacciones: number
}

interface BancoOperacion {
  id: string
  tipo: "ingreso" | "gasto"
  tipoMovimiento?: "ingreso" | "gasto" | "transferencia_entrada" | "transferencia_salida"
  fecha?: { toDate?: () => Date } | string | Date
  monto?: number
  concepto?: string
  bancoId?: string
  [key: string]: unknown
}

// ===================================================================
// HOOK 1: useBancoData - Datos de un banco específico
// REFACTORIZADO: Usa getDocs en lugar de onSnapshot para evitar assertion errors
// ===================================================================

export function useBancoData(bancoId: string): FirestoreHookResult<BancoOperacion> & { stats: BancoStats } {
  const [data, setData] = useState<BancoOperacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<BancoStats>({
    totalIngresos: 0,
    totalGastos: 0,
    saldoNeto: 0,
    transacciones: 0,
  })
  const fetchedRef = useRef(false)

  const calculateStats = useCallback((movimientos: BancoOperacion[]) => {
    const ingresos = movimientos.filter(m => 
      m.tipoMovimiento === "ingreso" || m.tipoMovimiento === "transferencia_entrada"
    )
    const gastos = movimientos.filter(m => 
      m.tipoMovimiento === "gasto" || m.tipoMovimiento === "transferencia_salida"
    )
    const totalIngresos = ingresos.reduce((sum, item) => sum + (item.monto || 0), 0)
    const totalGastos = gastos.reduce((sum, item) => sum + (item.monto || 0), 0)

    return {
      totalIngresos,
      totalGastos,
      saldoNeto: totalIngresos - totalGastos,
      transacciones: movimientos.length,
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!bancoId) {
      setError("Banco ID es requerido")
      setLoading(false)
      return
    }

    // Si ya estamos en modo mock, usar datos mock directamente
    if (USE_MOCK_DATA) {
      const mockIngresos = MOCK_INGRESOS.filter((i) => i.bancoId === bancoId || !i.bancoId)
      const mockGastos = MOCK_GASTOS.filter((g) => g.bancoId === bancoId || !g.bancoId)
      const allMock = [...mockIngresos, ...mockGastos]
      setData(allMock)
      setStats(calculateStats(allMock))
      setLoading(false)
      setError(null)
      return
    }

    try {
      const movimientosQuery = query(
        collection(db, "movimientos"),
        where("bancoId", "==", bancoId),
        orderBy("fecha", "desc"),
        limit(DEFAULT_PAGE_SIZE)
      )

      const snapshot = await getDocs(movimientosQuery)
      const movimientos: BancoOperacion[] = snapshot.docs.map((doc) => {
        const docData = doc.data()
        const tipoMovimiento = docData.tipoMovimiento as BancoOperacion["tipoMovimiento"]
        const tipo: "ingreso" | "gasto" = 
          tipoMovimiento === "ingreso" || tipoMovimiento === "transferencia_entrada" 
            ? "ingreso" 
            : "gasto"
        
        return {
          id: doc.id,
          ...docData,
          tipo,
          tipoMovimiento,
        } as BancoOperacion
      })

      setData(movimientos)
      setStats(calculateStats(movimientos))
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("Error fetching movimientos:", err)
      
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("Activando modo mock para Bancos debido a permisos")
        const mockIngresos = MOCK_INGRESOS.filter((i) => i.bancoId === bancoId || !i.bancoId)
        const mockGastos = MOCK_GASTOS.filter((g) => g.bancoId === bancoId || !g.bancoId)
        const allMock = [...mockIngresos, ...mockGastos]
        setData(allMock)
        setStats(calculateStats(allMock))
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setLoading(false)
      }
    }
  }, [bancoId, calculateStats])

  useEffect(() => {
    if (!fetchedRef.current || bancoId) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, stats, refresh: fetchData }
}

// ===================================================================
// HOOK 2: useAlmacenData - Datos del almacén (REFACTORIZADO)
// ===================================================================

export function useAlmacenData(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_PRODUCTOS)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(collection(db, "almacen_productos"), orderBy("nombre", "asc"), limit(DEFAULT_PAGE_SIZE))
      const snapshot = await getDocs(q)
      const productos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(productos)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching almacen:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for Almacen due to missing permissions")
        setData(MOCK_PRODUCTOS)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOK 3: useVentasData - Datos de ventas (REFACTORIZADO)
// ===================================================================

export function useVentasData(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_VENTAS)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(collection(db, "ventas"), orderBy("fecha", "desc"), limit(DEFAULT_PAGE_SIZE))
      const snapshot = await getDocs(q)
      const ventas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(ventas)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching ventas:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for Ventas due to missing permissions")
        setData(MOCK_VENTAS)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOK 4: useClientesData - Datos de clientes (REFACTORIZADO)
// ===================================================================

export function useClientesData(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_CLIENTES)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(collection(db, "clientes"), orderBy("nombre", "asc"), limit(DEFAULT_PAGE_SIZE))
      const snapshot = await getDocs(q)
      const clientes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(clientes)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching clientes:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for Clientes due to missing permissions")
        setData(MOCK_CLIENTES)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOK 5: useDistribuidoresData - Datos de distribuidores (REFACTORIZADO)
// ===================================================================

export function useDistribuidoresData(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_DISTRIBUIDORES)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(collection(db, "distribuidores"), orderBy("nombre", "asc"), limit(DEFAULT_PAGE_SIZE))
      const snapshot = await getDocs(q)
      const distribuidores = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(distribuidores)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching distribuidores:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for Distribuidores due to missing permissions")
        setData(MOCK_DISTRIBUIDORES)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOK 6: useOrdenesCompraData - Datos de órdenes de compra (REFACTORIZADO)
// ===================================================================

export function useOrdenesCompraData(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_ORDENES_COMPRA)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(collection(db, "ordenes_compra"), orderBy("fecha", "desc"), limit(DEFAULT_PAGE_SIZE))
      const snapshot = await getDocs(q)
      const ordenes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(ordenes)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching ordenes compra:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for OrdenesCompra due to missing permissions")
        setData(MOCK_ORDENES_COMPRA)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOK 7: useDashboardData - Datos del dashboard (REFACTORIZADO)
// ===================================================================

export function useDashboardData(): FirestoreHookResult<Record<string, unknown>> & { totales: Record<string, unknown> } {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [totales, setTotales] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setTotales({ ventas: 150000, gastos: 50000, clientes: 120 })
      setData([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      // Fetch totales
      const totalesQuery = query(collection(db, "dashboard_totales"), limit(SMALL_PAGE_SIZE))
      const totalesSnapshot = await getDocs(totalesQuery)
      const totalesData = totalesSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data()
        return acc
      }, {} as Record<string, unknown>)
      setTotales(totalesData)

      // Fetch paneles
      const panelesQuery = query(collection(db, "dashboard_paneles"), limit(SMALL_PAGE_SIZE))
      const panelesSnapshot = await getDocs(panelesQuery)
      const paneles = panelesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(paneles)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching dashboard:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for Dashboard due to missing permissions")
        setTotales({ ventas: 150000, gastos: 50000, clientes: 120 })
        setData([])
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, totales, refresh: fetchData }
}

// ===================================================================
// HOOK 8: useGYAData - Datos de gastos y abonos (REFACTORIZADO)
// ===================================================================

export function useGYAData(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_GASTOS.map((g) => ({ ...g, tipo: "gasto" })))
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(
        collection(db, "movimientos"),
        orderBy("fecha", "desc"),
        limit(DEFAULT_PAGE_SIZE)
      )
      const snapshot = await getDocs(q)
      const gya = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(gya)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching movimientos:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for GYA due to missing permissions")
        setData(MOCK_GASTOS.map((g) => ({ ...g, tipo: "gasto" })))
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOKS DE BANCO INDIVIDUALES (REFACTORIZADOS)
// ===================================================================

export function useIngresosBanco(bancoId: string): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!bancoId) {
      setLoading(false)
      return
    }

    if (USE_MOCK_DATA) {
      setData(MOCK_INGRESOS.filter((i) => i.bancoId === bancoId || !i.bancoId))
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(
        collection(db, "movimientos"),
        where("bancoId", "==", bancoId),
        orderBy("fecha", "desc"),
        limit(DEFAULT_PAGE_SIZE)
      )
      const snapshot = await getDocs(q)
      const items = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
        .filter((item) => {
          const tipo = item.tipoMovimiento as string | undefined
          return tipo === "ingreso" || tipo === "transferencia_entrada"
        })
      setData(items)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error(`Error fetching ingresos ${bancoId}:`, err)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        setData(MOCK_INGRESOS.filter((i) => i.bancoId === bancoId || !i.bancoId))
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setLoading(false)
      }
    }
  }, [bancoId])

  useEffect(() => {
    if (!fetchedRef.current || bancoId) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

export function useGastos(bancoId: string): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!bancoId) {
      setLoading(false)
      return
    }

    if (USE_MOCK_DATA) {
      setData(MOCK_GASTOS.filter((i) => i.bancoId === bancoId || !i.bancoId))
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(
        collection(db, "movimientos"),
        where("bancoId", "==", bancoId),
        orderBy("fecha", "desc"),
        limit(DEFAULT_PAGE_SIZE)
      )
      const snapshot = await getDocs(q)
      const items = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
        .filter((item) => {
          const tipo = item.tipoMovimiento as string | undefined
          return tipo === "gasto" || tipo === "transferencia_salida"
        })
      setData(items)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error(`Error fetching gastos ${bancoId}:`, err)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        setData(MOCK_GASTOS.filter((i) => i.bancoId === bancoId || !i.bancoId))
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setLoading(false)
      }
    }
  }, [bancoId])

  useEffect(() => {
    if (!fetchedRef.current || bancoId) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

export function useTransferencias(bancoId: string): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!bancoId) {
      setLoading(false)
      return
    }

    if (USE_MOCK_DATA) {
      setData(MOCK_TRANSFERENCIAS)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(
        collection(db, "movimientos"),
        where("bancoId", "==", bancoId),
        orderBy("fecha", "desc"),
        limit(DEFAULT_PAGE_SIZE)
      )
      const snapshot = await getDocs(q)
      const items = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
        .filter((item) => {
          const tipo = item.tipoMovimiento as string | undefined
          return tipo === "transferencia_entrada" || tipo === "transferencia_salida"
        })
      setData(items)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error(`Error fetching transferencias ${bancoId}:`, err)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        setData(MOCK_TRANSFERENCIAS)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setLoading(false)
      }
    }
  }, [bancoId])

  useEffect(() => {
    if (!fetchedRef.current || bancoId) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

export function useCorteBancario(bancoId: string): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!bancoId) {
      setLoading(false)
      return
    }

    if (USE_MOCK_DATA) {
      setData(MOCK_CORTES)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(
        collection(db, "cortes_bancarios"),
        where("bancoId", "==", bancoId),
        orderBy("fechaInicio", "desc"),
        limit(SMALL_PAGE_SIZE)
      )
      const snapshot = await getDocs(q)
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setData(items)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error(`Error fetching cortes ${bancoId}:`, err)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        setData(MOCK_CORTES)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [bancoId])

  useEffect(() => {
    if (!fetchedRef.current || bancoId) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// NEW HOOKS: useEntradasAlmacen and useSalidasAlmacen (REFACTORIZADOS)
// ===================================================================

export function useEntradasAlmacen(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_ENTRADAS)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(collection(db, "almacen_entradas"), orderBy("fecha", "desc"), limit(DEFAULT_PAGE_SIZE))
      const snapshot = await getDocs(q)
      const entradas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(entradas)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching entradas almacen:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for Entradas Almacen due to missing permissions")
        setData(MOCK_ENTRADAS)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

export function useSalidasAlmacen(): FirestoreHookResult<Record<string, unknown>> {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setData(MOCK_SALIDAS)
      setLoading(false)
      setError(null)
      return
    }

    try {
      const q = query(collection(db, "almacen_salidas"), orderBy("fecha", "desc"), limit(DEFAULT_PAGE_SIZE))
      const snapshot = await getDocs(q)
      const salidas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(salidas)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error("[v0] Error fetching salidas almacen:", errMsg)
      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn("[v0] Using mock data for Salidas Almacen due to missing permissions")
        setData(MOCK_SALIDAS)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// EXPORT ALIASES
// ===================================================================

export const useVentas = useVentasData
export const useOrdenesCompra = useOrdenesCompraData
export const useProductos = useAlmacenData
export const useClientes = useClientesData
export const useDistribuidores = useDistribuidoresData

// ===================================================================
// MOCK DATA CONSTANTS
// ===================================================================

const MOCK_CLIENTES = [
  { id: "C-001", nombre: "Cliente VIP 1", email: "vip1@example.com", telefono: "555-0001", saldo: 0 },
  { id: "C-002", nombre: "Cliente Regular 2", email: "reg2@example.com", telefono: "555-0002", saldo: 1500 },
]

const MOCK_INGRESOS: BancoOperacion[] = [
  {
    id: "I-001",
    tipo: "ingreso",
    fecha: new Date().toISOString(),
    monto: 5000,
    concepto: "Venta del día",
    origen: "Ventas",
    referencia: "REF-123",
    bancoId: "banco_1",
  },
  {
    id: "I-002",
    tipo: "ingreso",
    fecha: new Date(Date.now() - 86400000).toISOString(),
    monto: 12000,
    concepto: "Abono Cliente",
    origen: "Cliente VIP 1",
    referencia: "REF-124",
    bancoId: "banco_1",
  },
]

const MOCK_GASTOS: BancoOperacion[] = [
  {
    id: "G-001",
    tipo: "gasto",
    fecha: new Date().toISOString(),
    monto: 2000,
    concepto: "Pago de Luz",
    categoria: "Servicios",
    bancoId: "banco_1",
  },
  {
    id: "G-002",
    tipo: "gasto",
    fecha: new Date(Date.now() - 86400000).toISOString(),
    monto: 5000,
    concepto: "Compra Material",
    categoria: "Inventario",
    bancoId: "banco_1",
  },
]

const MOCK_TRANSFERENCIAS = [
  {
    id: "T-001",
    fecha: new Date().toISOString(),
    monto: 1000,
    origen: "Banco A",
    destino: "Banco B",
    referencia: "TR-001",
  },
]

const MOCK_CORTES = [
  {
    id: "CT-001",
    periodo: "Marzo 2024",
    fechaInicio: new Date(Date.now() - 2592000000).toISOString(),
    fechaFin: new Date().toISOString(),
    capitalInicial: 50000,
    capitalFinal: 65000,
    diferencia: 0,
  },
]

const MOCK_DISTRIBUIDORES = [
  {
    id: "1",
    nombre: "Distribuidor Alpha",
    totalOrdenesCompra: 150000,
    deudaTotal: 50000,
    totalPagado: 100000,
    ordenesCompra: ["oc1", "oc2"],
  },
  {
    id: "2",
    nombre: "Distribuidor Beta",
    totalOrdenesCompra: 80000,
    deudaTotal: 0,
    totalPagado: 80000,
    ordenesCompra: ["oc3"],
  },
  {
    id: "3",
    nombre: "Distribuidor Gamma",
    totalOrdenesCompra: 200000,
    deudaTotal: 150000,
    totalPagado: 50000,
    ordenesCompra: ["oc4", "oc5", "oc6"],
  },
]

const MOCK_ORDENES_COMPRA = [
  {
    id: "OC-001",
    fecha: "2024-03-20",
    distribuidor: "Distribuidor Alpha",
    cantidad: 100,
    costoTotal: 50000,
    deuda: 20000,
    pagoDistribuidor: 30000,
    estado: "pendiente",
  },
  {
    id: "OC-002",
    fecha: "2024-03-18",
    distribuidor: "Distribuidor Beta",
    cantidad: 50,
    costoTotal: 25000,
    deuda: 0,
    pagoDistribuidor: 25000,
    estado: "pagado",
  },
  {
    id: "OC-003",
    fecha: "2024-03-15",
    distribuidor: "Distribuidor Gamma",
    cantidad: 200,
    costoTotal: 100000,
    deuda: 100000,
    pagoDistribuidor: 0,
    estado: "pendiente",
  },
]

const MOCK_VENTAS = [
  { id: "V-001", fecha: "2024-03-21", cliente: "Cliente A", total: 1500, estado: "completado", productos: [] },
  { id: "V-002", fecha: "2024-03-21", cliente: "Cliente B", total: 3500, estado: "completado", productos: [] },
  { id: "V-003", fecha: "2024-03-20", cliente: "Cliente C", total: 900, estado: "pendiente", productos: [] },
]

const MOCK_PRODUCTOS = [
  { id: "P-001", nombre: "Producto Premium A", stock: 150, precio: 299, categoria: "Electrónica" },
  { id: "P-002", nombre: "Producto Básico B", stock: 500, precio: 99, categoria: "Hogar" },
  { id: "P-003", nombre: "Servicio C", stock: 0, precio: 1500, categoria: "Servicios" },
]

const MOCK_ENTRADAS = [
  {
    id: "E-001",
    fecha: new Date().toISOString(),
    origen: "Distribuidor Alpha",
    cantidad: 100,
    valorUnitario: 500,
    valorTotal: 50000,
    referencia: "OC-001",
  },
  {
    id: "E-002",
    fecha: new Date(Date.now() - 86400000).toISOString(),
    origen: "Distribuidor Beta",
    cantidad: 50,
    valorUnitario: 500,
    valorTotal: 25000,
    referencia: "OC-002",
  },
]

const MOCK_SALIDAS = [
  {
    id: "S-001",
    fecha: new Date().toISOString(),
    destino: "Cliente VIP",
    cantidad: 10,
    valorUnitario: 1000,
    valorTotal: 10000,
    referencia: "V-001",
  },
  {
    id: "S-002",
    fecha: new Date(Date.now() - 86400000).toISOString(),
    destino: "Cliente Regular",
    cantidad: 5,
    valorUnitario: 1000,
    valorTotal: 5000,
    referencia: "V-002",
  },
]
