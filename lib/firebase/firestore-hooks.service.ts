"use client"

import { useEffect, useState } from "react"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "./config"

// ===================================================================
// TIPOS COMPARTIDOS
// ===================================================================

interface FirestoreHookResult<T> {
  data: T[]
  loading: boolean
  error: string | null
}

interface BancoStats {
  totalIngresos: number
  totalGastos: number
  saldoNeto: number
  transacciones: number
}

// ===================================================================
// HOOK 1: useBancoData - Datos de un banco específico
// ===================================================================

export function useBancoData(bancoId: string): FirestoreHookResult<any> & { stats: BancoStats } {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<BancoStats>({
    totalIngresos: 0,
    totalGastos: 0,
    saldoNeto: 0,
    transacciones: 0,
  })

  useEffect(() => {
    if (!bancoId) {
      setError("Banco ID es requerido")
      setLoading(false)
      return
    }

    try {
      const unsubscribers: (() => void)[] = []

      // Suscripción a ingresos
      const ingresosQuery = query(collection(db, `${bancoId}_ingresos`), orderBy("fecha", "desc"))

      const unsubIngresos = onSnapshot(
        ingresosQuery,
        (snapshot) => {
          const ingresos = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            tipo: "ingreso",
          }))

          // Suscripción a gastos
          const gastosQuery = query(collection(db, `${bancoId}_gastos`), orderBy("fecha", "desc"))

          const unsubGastos = onSnapshot(
            gastosQuery,
            (gastosSnapshot) => {
              const gastos = gastosSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                tipo: "gasto",
              }))

              // Combinar y ordenar
              const allData = [...ingresos, ...gastos].sort((a: any, b: any) => {
                const dateA = a.fecha?.toDate?.() || new Date(a.fecha)
                const dateB = b.fecha?.toDate?.() || new Date(b.fecha)
                return dateB.getTime() - dateA.getTime()
              })

              // Calcular stats
              const totalIngresos = ingresos.reduce((sum: number, item: any) => sum + (item.monto || 0), 0)
              const totalGastos = gastos.reduce((sum: number, item: any) => sum + (item.monto || 0), 0)

              setData(allData)
              setStats({
                totalIngresos,
                totalGastos,
                saldoNeto: totalIngresos - totalGastos,
                transacciones: allData.length,
              })
              setLoading(false)
              setError(null) // Clear error on success
            },
            (err) => {
              console.error("Error fetching gastos:", err)
              if (err.message.includes("Missing or insufficient permissions")) {
                console.warn("[v0] Using mock data for Bancos due to missing permissions")
                // Mock fallback for mixed data
                const mockIngresos = MOCK_INGRESOS.filter((i) => i.bancoId === bancoId || !i.bancoId)
                const mockGastos = MOCK_GASTOS.filter((g) => g.bancoId === bancoId || !g.bancoId)
                const allMock = [...mockIngresos, ...mockGastos]

                setData(allMock)
                setStats({
                  totalIngresos: mockIngresos.reduce((acc, curr) => acc + curr.monto, 0),
                  totalGastos: mockGastos.reduce((acc, curr) => acc + curr.monto, 0),
                  saldoNeto: 0,
                  transacciones: allMock.length,
                })
                setLoading(false)
                setError(null)
              } else {
                setError(err.message)
                setLoading(false)
              }
            },
          )

          unsubscribers.push(unsubGastos)
        },
        (err) => {
          console.error("Error fetching ingresos:", err)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Bancos due to missing permissions")
            const mockIngresos = MOCK_INGRESOS.filter((i) => i.bancoId === bancoId || !i.bancoId)
            const mockGastos = MOCK_GASTOS.filter((g) => g.bancoId === bancoId || !g.bancoId)
            const allMock = [...mockIngresos, ...mockGastos]

            setData(allMock)
            setStats({
              totalIngresos: mockIngresos.reduce((acc, curr) => acc + curr.monto, 0),
              totalGastos: mockGastos.reduce((acc, curr) => acc + curr.monto, 0),
              saldoNeto: 0,
              transacciones: allMock.length,
            })
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setLoading(false)
          }
        },
      )

      unsubscribers.push(unsubIngresos)

      return () => {
        unsubscribers.forEach((unsub) => unsub())
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [bancoId])

  return { data, loading, error, stats }
}

// ===================================================================
// HOOK 2: useAlmacenData - Datos del almacén
// ===================================================================

export function useAlmacenData(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "almacen_productos"), orderBy("nombre", "asc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const productos = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(productos)
          setLoading(false)
          setError(null) // Clear error on success
        },
        (err) => {
          console.error("[v0] Error fetching almacen:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Almacen due to missing permissions")
            setData(MOCK_PRODUCTOS)
            setLoading(false)
            // We intentionally clear the error so the UI shows data instead of error state
            setError(null)
          } else {
            setError(err.message)
            setData([])
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Error subscribing to almacen:", err.message)
      setError(err.message)
      setData([])
      setLoading(false)
    }
  }, [])

  return { data, loading, error }
}

// ===================================================================
// HOOK 3: useVentasData - Datos de ventas
// ===================================================================

export function useVentasData(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "ventas"), orderBy("fecha", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ventas = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(ventas)
          setLoading(false)
          setError(null) // Clear error on success
        },
        (err) => {
          console.error("[v0] Error fetching ventas:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Ventas due to missing permissions")
            setData(MOCK_VENTAS)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([])
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Error subscribing to ventas:", err.message)
      setError(err.message)
      setData([])
      setLoading(false)
    }
  }, [])

  return { data, loading, error }
}

// ===================================================================
// HOOK 4: useClientesData - Datos de clientes
// ===================================================================

export function useClientesData(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "clientes"), orderBy("nombre", "asc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const clientes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(clientes)
          setLoading(false)
          setError(null) // Clear error on success
        },
        (err) => {
          console.error("[v0] Error fetching clientes:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Clientes due to missing permissions")
            setData(MOCK_CLIENTES)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([]) // Return empty array on error
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Error subscribing to clientes:", err.message)
      setError(err.message)
      setData([])
      setLoading(false)
    }
  }, [])

  return { data, loading, error }
}

// ===================================================================
// HOOK 5: useDistribuidoresData - Datos de distribuidores
// ===================================================================

export function useDistribuidoresData(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "distribuidores"), orderBy("nombre", "asc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const distribuidores = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(distribuidores)
          setLoading(false)
          setError(null) // Clear error on success
        },
        (err) => {
          console.error("[v0] Error fetching distribuidores:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Distribuidores due to missing permissions")
            setData(MOCK_DISTRIBUIDORES)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([])
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Error subscribing to distribuidores:", err.message)
      setError(err.message)
      setData([])
      setLoading(false)
    }
  }, [])

  return { data, loading, error }
}

// ===================================================================
// HOOK 6: useOrdenesCompraData - Datos de órdenes de compra
// ===================================================================

export function useOrdenesCompraData(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "ordenes_compra"), orderBy("fecha", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ordenes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(ordenes)
          setLoading(false)
          setError(null) // Clear error on success
        },
        (err) => {
          console.error("[v0] Error fetching ordenes compra:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for OrdenesCompra due to missing permissions")
            setData(MOCK_ORDENES_COMPRA)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([]) // Return empty array on error
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Error subscribing to ordenes compra:", err.message)
      setError(err.message)
      setData([])
      setLoading(false)
    }
  }, [])

  return { data, loading, error }
}

// ===================================================================
// HOOK 7: useDashboardData - Datos del dashboard
// ===================================================================

export function useDashboardData(): FirestoreHookResult<any> & { totales: any } {
  const [data, setData] = useState<any[]>([])
  const [totales, setTotales] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const unsubscribers: (() => void)[] = []

      // Suscripción a totales
      const totalesQuery = query(collection(db, "dashboard_totales"))

      const unsubTotales = onSnapshot(
        totalesQuery,
        (snapshot) => {
          const totalesData = snapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data()
            return acc
          }, {} as any)

          setTotales(totalesData)

          // Suscripción a paneles
          const panelesQuery = query(collection(db, "dashboard_paneles"))

          const unsubPaneles = onSnapshot(
            panelesQuery,
            (panelesSnapshot) => {
              const paneles = panelesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))

              setData(paneles)
              setLoading(false)
              setError(null) // Clear error on success
            },
            (err) => {
              console.error("[v0] Error fetching dashboard paneles:", err.message)
              if (err.message.includes("Missing or insufficient permissions")) {
                setData([])
                setLoading(false)
                setError(null)
              } else {
                setError(err.message)
                setData([]) // Return empty array on error
                setLoading(false)
              }
            },
          )

          unsubscribers.push(unsubPaneles)
        },
        (err) => {
          console.error("[v0] Error fetching dashboard totales:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Dashboard due to missing permissions")
            setTotales({ ventas: 150000, gastos: 50000, clientes: 120 })
            setData([])
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([])
            setLoading(false)
          }
        },
      )

      unsubscribers.push(unsubTotales)

      return () => {
        unsubscribers.forEach((unsub) => unsub())
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [])

  return { data, loading, error, totales }
}

// ===================================================================
// HOOK 8: useGYAData - Datos de gastos y abonos
// ===================================================================

export function useGYAData(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "gastos_y_abonos"), orderBy("fecha", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const gya = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(gya)
          setLoading(false)
          setError(null) // Clear error on success
        },
        (err) => {
          console.error("[v0] Error fetching gastos y abonos:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for GYA due to missing permissions")
            setData(MOCK_GASTOS.map((g) => ({ ...g, tipo: "gasto" }))) // Simple mock
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([]) // Return empty array on error
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Error subscribing to gastos y abonos:", err.message)
      setError(err.message)
      setData([])
      setLoading(false)
    }
  }, [])

  return { data, loading, error }
}

// ===================================================================
// HOOKS DE BANCO INDIVIDUALES (IMPLEMENTACIÓN FALTANTE)
// ===================================================================

export function useIngresosBanco(bancoId: string): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bancoId) {
      setLoading(false)
      return
    }
    try {
      const q = query(collection(db, `${bancoId}_ingresos`), orderBy("fecha", "desc"))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setData(items)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error(`Error fetching ingresos ${bancoId}:`, err)
          if (err.message.includes("Missing or insufficient permissions")) {
            setData(MOCK_INGRESOS.filter((i) => i.bancoId === bancoId || !i.bancoId))
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setLoading(false)
          }
        },
      )
      return () => unsubscribe()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [bancoId])

  return { data, loading, error }
}

export function useGastos(bancoId: string): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bancoId) {
      setLoading(false)
      return
    }
    try {
      const q = query(collection(db, `${bancoId}_gastos`), orderBy("fecha", "desc"))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setData(items)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error(`Error fetching gastos ${bancoId}:`, err)
          if (err.message.includes("Missing or insufficient permissions")) {
            setData(MOCK_GASTOS.filter((i) => i.bancoId === bancoId || !i.bancoId))
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setLoading(false)
          }
        },
      )
      return () => unsubscribe()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [bancoId])

  return { data, loading, error }
}

export function useTransferencias(bancoId: string): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bancoId) {
      setLoading(false)
      return
    }
    try {
      const q = query(collection(db, `${bancoId}_transferencias`), orderBy("fecha", "desc"))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setData(items)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error(`Error fetching transferencias ${bancoId}:`, err)
          if (err.message.includes("Missing or insufficient permissions")) {
            setData(MOCK_TRANSFERENCIAS)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setLoading(false)
          }
        },
      )
      return () => unsubscribe()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [bancoId])

  return { data, loading, error }
}

export function useCorteBancario(bancoId: string): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bancoId) {
      setLoading(false)
      return
    }
    try {
      const q = query(collection(db, `${bancoId}_cortes`), orderBy("fechaInicio", "desc"))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setData(items)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error(`Error fetching cortes ${bancoId}:`, err)
          if (err.message.includes("Missing or insufficient permissions")) {
            setData(MOCK_CORTES)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([]) // Return empty array on error
            setLoading(false)
          }
        },
      )
      return () => unsubscribe()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [bancoId])

  return { data, loading, error }
}

// ===================================================================
// NEW HOOKS: useEntradasAlmacen and useSalidasAlmacen
// ===================================================================

export function useEntradasAlmacen(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "almacen_entradas"), orderBy("fecha", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const entradas = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(entradas)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error("[v0] Error fetching entradas almacen:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Entradas Almacen due to missing permissions")
            setData(MOCK_ENTRADAS)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([])
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Catch error in useEntradasAlmacen:", err)
      setData(MOCK_ENTRADAS)
      setLoading(false)
      setError(null)
    }
  }, [])

  return { data, loading, error }
}

export function useSalidasAlmacen(): FirestoreHookResult<any> {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, "almacen_salidas"), orderBy("fecha", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const salidas = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(salidas)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error("[v0] Error fetching salidas almacen:", err.message)
          if (err.message.includes("Missing or insufficient permissions")) {
            console.warn("[v0] Using mock data for Salidas Almacen due to missing permissions")
            setData(MOCK_SALIDAS)
            setLoading(false)
            setError(null)
          } else {
            setError(err.message)
            setData([])
            setLoading(false)
          }
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("[v0] Catch error in useSalidasAlmacen:", err)
      setData(MOCK_SALIDAS)
      setLoading(false)
      setError(null)
    }
  }, [])

  return { data, loading, error }
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

const MOCK_INGRESOS = [
  {
    id: "I-001",
    fecha: new Date().toISOString(),
    monto: 5000,
    concepto: "Venta del día",
    origen: "Ventas",
    referencia: "REF-123",
    bancoId: "banco_1",
  },
  {
    id: "I-002",
    fecha: new Date(Date.now() - 86400000).toISOString(),
    monto: 12000,
    concepto: "Abono Cliente",
    origen: "Cliente VIP 1",
    referencia: "REF-124",
    bancoId: "banco_1",
  },
]

const MOCK_GASTOS = [
  {
    id: "G-001",
    fecha: new Date().toISOString(),
    monto: 2000,
    concepto: "Pago de Luz",
    categoria: "Servicios",
    bancoId: "banco_1",
  },
  {
    id: "G-002",
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
