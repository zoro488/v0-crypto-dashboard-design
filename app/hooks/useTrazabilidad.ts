/**
 * ====================================================================
 * HOOKS DE TRAZABILIDAD COMPLETA - FLOWDISTRIBUTOR/CHRONOS
 * ====================================================================
 * 
 * Hooks personalizados para:
 * - Análisis de datos por cliente
 * - Análisis de datos por distribuidor
 * - Análisis de datos por OC
 * - Filtrado avanzado
 * - Métricas en tiempo real
 * 
 * @author Chronos System
 * @version 2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs,
  Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore'
import { db, isFirestoreAvailable } from '@/app/lib/firebase/config'
import { logger } from '@/app/lib/utils/logger'
import type { 
  Cliente, 
  Distribuidor, 
  Venta, 
  OrdenCompra, 
  Movimiento,
  GastoAbono,
  BancoId, 
} from '@/app/types'

// ====================================================================
// INTERFACES DE RESPUESTA
// ====================================================================

export interface TrazabilidadCliente {
  cliente: Cliente | null
  ventas: Venta[]
  abonos: GastoAbono[]
  movimientos: Movimiento[]
  metricas: {
    totalVentas: number
    totalPagado: number
    deudaActual: number
    promedioCompra: number
    ultimaCompra: Date | null
    frecuenciaCompra: number // días promedio entre compras
  }
  loading: boolean
  error: string | null
}

export interface TrazabilidadDistribuidor {
  distribuidor: Distribuidor | null
  ordenesCompra: OrdenCompra[]
  pagos: GastoAbono[]
  movimientos: Movimiento[]
  metricas: {
    totalCompras: number
    totalPagado: number
    deudaActual: number
    promedioOrden: number
    ultimaOrden: Date | null
    stockDisponible: number
  }
  loading: boolean
  error: string | null
}

export interface TrazabilidadOC {
  ordenCompra: OrdenCompra | null
  ventas: Venta[]
  cliente: string
  metricas: {
    cantidadVendida: number
    stockRestante: number
    ingresoGenerado: number
    gananciaGenerada: number
    porcentajeVendido: number
  }
  loading: boolean
  error: string | null
}

export interface FiltrosAnalisis {
  fechaInicio?: Date
  fechaFin?: Date
  clienteId?: string
  distribuidorId?: string
  ocId?: string
  bancoId?: BancoId
  estadoPago?: 'completo' | 'parcial' | 'pendiente'
  montoMinimo?: number
  montoMaximo?: number
}

// ====================================================================
// HOOK: TRAZABILIDAD DE CLIENTE
// ====================================================================

/**
 * Hook para obtener toda la trazabilidad de un cliente específico
 * Incluye ventas, abonos, movimientos y métricas calculadas
 */
export function useTrazabilidadCliente(clienteId: string | null): TrazabilidadCliente {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [abonos, setAbonos] = useState<GastoAbono[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clienteId) {
      setLoading(false)
      return
    }

    if (!db || !isFirestoreAvailable()) {
      setError('Firestore no está disponible')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Suscripción a ventas del cliente
    const ventasQuery = query(
      collection(db, 'ventas'),
      where('clienteId', '==', clienteId),
      orderBy('createdAt', 'desc'),
    )

    const unsubVentas = onSnapshot(ventasQuery, 
      (snapshot) => {
        const ventasData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Venta[]
        setVentas(ventasData)
      },
      (err) => setError(`Error cargando ventas: ${err.message}`),
    )

    // Suscripción a abonos del cliente
    const abonosQuery = query(
      collection(db, 'gastos_abonos'),
      where('entidadId', '==', clienteId),
      where('tipo', '==', 'abono'),
      orderBy('createdAt', 'desc'),
    )

    const unsubAbonos = onSnapshot(abonosQuery,
      (snapshot) => {
        const abonosData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as GastoAbono[]
        setAbonos(abonosData)
      },
      (err) => logger.warn('Abonos query error', { context: 'useTrazabilidadCliente', data: err }),
    )

    // Cargar datos del cliente
    const clienteQuery = query(
      collection(db, 'clientes'),
      where('id', '==', clienteId),
    )

    const unsubCliente = onSnapshot(clienteQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setCliente(snapshot.docs[0].data() as Cliente)
        }
        setLoading(false)
      },
      (err) => {
        setError(`Error cargando cliente: ${err.message}`)
        setLoading(false)
      },
    )

    return () => {
      unsubVentas()
      unsubAbonos()
      unsubCliente()
    }
  }, [clienteId])

  // Calcular métricas
  const metricas = useMemo(() => {
    const totalVentas = ventas.reduce((sum, v) => sum + (v.precioTotalVenta ?? v.ingreso ?? 0), 0)
    const totalPagado = ventas.reduce((sum, v) => sum + (v.montoPagado ?? 0), 0) + 
                        abonos.reduce((sum, a) => sum + (a.monto ?? 0), 0)
    const deudaActual = totalVentas - totalPagado
    const promedioCompra = ventas.length > 0 ? totalVentas / ventas.length : 0

    // Calcular última compra
    let ultimaCompra: Date | null = null
    if (ventas.length > 0) {
      const fechaVenta = ventas[0].fecha
      if (fechaVenta) {
        if (typeof fechaVenta === 'string') {
          ultimaCompra = new Date(fechaVenta)
        } else if ('toDate' in fechaVenta) {
          ultimaCompra = fechaVenta.toDate()
        }
      }
    }

    // Calcular frecuencia de compra (días promedio)
    let frecuenciaCompra = 0
    if (ventas.length > 1) {
      const fechas = ventas
        .map(v => {
          const f = v.fecha
          if (!f) return null
          return typeof f === 'string' ? new Date(f) : 'toDate' in f ? f.toDate() : null
        })
        .filter((f): f is Date => f !== null)
        .sort((a, b) => a.getTime() - b.getTime())

      if (fechas.length > 1) {
        const diasTotales = (fechas[fechas.length - 1].getTime() - fechas[0].getTime()) / (1000 * 60 * 60 * 24)
        frecuenciaCompra = Math.round(diasTotales / (fechas.length - 1))
      }
    }

    return {
      totalVentas,
      totalPagado,
      deudaActual,
      promedioCompra,
      ultimaCompra,
      frecuenciaCompra,
    }
  }, [ventas, abonos])

  return { cliente, ventas, abonos, movimientos, metricas, loading, error }
}

// ====================================================================
// HOOK: TRAZABILIDAD DE DISTRIBUIDOR
// ====================================================================

/**
 * Hook para obtener toda la trazabilidad de un distribuidor
 * Incluye órdenes de compra, pagos realizados y métricas
 */
export function useTrazabilidadDistribuidor(distribuidorId: string | null): TrazabilidadDistribuidor {
  const [distribuidor, setDistribuidor] = useState<Distribuidor | null>(null)
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([])
  const [pagos, setPagos] = useState<GastoAbono[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!distribuidorId) {
      setLoading(false)
      return
    }

    if (!db || !isFirestoreAvailable()) {
      setError('Firestore no está disponible')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Suscripción a órdenes de compra
    const ocQuery = query(
      collection(db, 'ordenes_compra'),
      where('distribuidorId', '==', distribuidorId),
      orderBy('createdAt', 'desc'),
    )

    const unsubOC = onSnapshot(ocQuery,
      (snapshot) => {
        const ocData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as OrdenCompra[]
        setOrdenesCompra(ocData)
      },
      (err) => setError(`Error cargando órdenes: ${err.message}`),
    )

    // Suscripción a pagos (gastos tipo pago_distribuidor)
    const pagosQuery = query(
      collection(db, 'gastos_abonos'),
      where('entidadId', '==', distribuidorId),
      where('tipo', '==', 'gasto'),
      orderBy('createdAt', 'desc'),
    )

    const unsubPagos = onSnapshot(pagosQuery,
      (snapshot) => {
        const pagosData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as GastoAbono[]
        setPagos(pagosData)
      },
      (err) => logger.warn('Pagos query error', { context: 'useTrazabilidadDistribuidor', data: err }),
    )

    // Cargar distribuidor
    const distQuery = query(
      collection(db, 'distribuidores'),
      where('id', '==', distribuidorId),
    )

    const unsubDist = onSnapshot(distQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setDistribuidor(snapshot.docs[0].data() as Distribuidor)
        }
        setLoading(false)
      },
      (err) => {
        setError(`Error cargando distribuidor: ${err.message}`)
        setLoading(false)
      },
    )

    return () => {
      unsubOC()
      unsubPagos()
      unsubDist()
    }
  }, [distribuidorId])

  // Calcular métricas
  const metricas = useMemo(() => {
    const totalCompras = ordenesCompra.reduce((sum, oc) => sum + (oc.costoTotal ?? 0), 0)
    const totalPagado = ordenesCompra.reduce((sum, oc) => sum + (oc.pagoDistribuidor ?? 0), 0)
    const deudaActual = ordenesCompra.reduce((sum, oc) => sum + (oc.deuda ?? 0), 0)
    const promedioOrden = ordenesCompra.length > 0 ? totalCompras / ordenesCompra.length : 0
    const stockDisponible = ordenesCompra.reduce((sum, oc) => sum + (oc.stockActual ?? 0), 0)

    let ultimaOrden: Date | null = null
    if (ordenesCompra.length > 0) {
      const fechaOC = ordenesCompra[0].fecha
      if (fechaOC) {
        if (typeof fechaOC === 'string') {
          ultimaOrden = new Date(fechaOC)
        } else if (typeof fechaOC === 'object' && 'toDate' in fechaOC) {
          ultimaOrden = (fechaOC as Timestamp).toDate()
        }
      }
    }

    return {
      totalCompras,
      totalPagado,
      deudaActual,
      promedioOrden,
      ultimaOrden,
      stockDisponible,
    }
  }, [ordenesCompra])

  return { distribuidor, ordenesCompra, pagos, movimientos, metricas, loading, error }
}

// ====================================================================
// HOOK: TRAZABILIDAD DE ORDEN DE COMPRA
// ====================================================================

/**
 * Hook para ver trazabilidad de una OC específica
 * Muestra qué se ha vendido de esa OC
 */
export function useTrazabilidadOC(ocId: string | null): TrazabilidadOC {
  const [ordenCompra, setOrdenCompra] = useState<OrdenCompra | null>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ocId) {
      setLoading(false)
      return
    }

    if (!db || !isFirestoreAvailable()) {
      setError('Firestore no está disponible')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Suscripción a la OC
    const ocQuery = query(
      collection(db, 'ordenes_compra'),
      where('id', '==', ocId),
    )

    const unsubOC = onSnapshot(ocQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setOrdenCompra(snapshot.docs[0].data() as OrdenCompra)
        }
      },
      (err) => setError(`Error cargando OC: ${err.message}`),
    )

    // Suscripción a ventas de esta OC
    const ventasQuery = query(
      collection(db, 'ventas'),
      where('ocRelacionada', '==', ocId),
      orderBy('createdAt', 'desc'),
    )

    const unsubVentas = onSnapshot(ventasQuery,
      (snapshot) => {
        const ventasData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Venta[]
        setVentas(ventasData)
        setLoading(false)
      },
      (err) => {
        setError(`Error cargando ventas: ${err.message}`)
        setLoading(false)
      },
    )

    return () => {
      unsubOC()
      unsubVentas()
    }
  }, [ocId])

  // Calcular métricas
  const metricas = useMemo(() => {
    const cantidadVendida = ventas.reduce((sum, v) => sum + (v.cantidad ?? 0), 0)
    const stockRestante = ordenCompra?.stockActual ?? (ordenCompra?.cantidad ?? 0) - cantidadVendida
    const ingresoGenerado = ventas.reduce((sum, v) => sum + (v.precioTotalVenta ?? v.ingreso ?? 0), 0)
    const gananciaGenerada = ventas.reduce((sum, v) => sum + (v.utilidad ?? 0), 0)
    const porcentajeVendido = ordenCompra?.cantidad 
      ? (cantidadVendida / ordenCompra.cantidad) * 100 
      : 0

    return {
      cantidadVendida,
      stockRestante,
      ingresoGenerado,
      gananciaGenerada,
      porcentajeVendido,
    }
  }, [ventas, ordenCompra])

  const cliente = ventas.length > 0 ? ventas.map(v => v.cliente).join(', ') : 'Sin ventas'

  return { ordenCompra, ventas, cliente, metricas, loading, error }
}

// ====================================================================
// HOOK: ANÁLISIS DE GASTOS Y ABONOS
// ====================================================================

export interface AnalisisGastosAbonos {
  gastos: GastoAbono[]
  abonos: GastoAbono[]
  resumen: {
    totalGastos: number
    totalAbonos: number
    balance: number
    gastosPorBanco: Record<BancoId, number>
    abonosPorCliente: { clienteId: string; nombre: string; total: number }[]
    gastosPorDistribuidor: { distribuidorId: string; nombre: string; total: number }[]
  }
  loading: boolean
  error: string | null
}

/**
 * Hook para analizar gastos y abonos con filtros
 */
export function useAnalisisGastosAbonos(filtros?: FiltrosAnalisis): AnalisisGastosAbonos {
  const [gastos, setGastos] = useState<GastoAbono[]>([])
  const [abonos, setAbonos] = useState<GastoAbono[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db || !isFirestoreAvailable()) {
      setError('Firestore no está disponible')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Query de gastos
    const gastosQuery = query(
      collection(db, 'gastos_abonos'),
      where('tipo', '==', 'gasto'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(500),
    )

    const unsubGastos = onSnapshot(gastosQuery,
      (snapshot) => {
        let gastosData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as GastoAbono[]

        // Aplicar filtros en cliente
        if (filtros?.fechaInicio) {
          gastosData = gastosData.filter(g => {
            const fecha = g.fecha
            if (!fecha) return false
            const fechaDate = typeof fecha === 'string' 
              ? new Date(fecha) 
              : 'toDate' in fecha 
                ? (fecha as Timestamp).toDate() 
                : fecha as Date
            return fechaDate >= filtros.fechaInicio!
          })
        }

        if (filtros?.bancoId) {
          gastosData = gastosData.filter(g => g.bancoId === filtros.bancoId)
        }

        setGastos(gastosData)
      },
      (err) => setError(`Error cargando gastos: ${err.message}`),
    )

    // Query de abonos
    const abonosQuery = query(
      collection(db, 'gastos_abonos'),
      where('tipo', '==', 'abono'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(500),
    )

    const unsubAbonos = onSnapshot(abonosQuery,
      (snapshot) => {
        let abonosData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as GastoAbono[]

        // Aplicar filtros
        if (filtros?.clienteId) {
          abonosData = abonosData.filter(a => a.entidadId === filtros.clienteId)
        }

        setAbonos(abonosData)
        setLoading(false)
      },
      (err) => {
        setError(`Error cargando abonos: ${err.message}`)
        setLoading(false)
      },
    )

    return () => {
      unsubGastos()
      unsubAbonos()
    }
  }, [filtros?.fechaInicio, filtros?.bancoId, filtros?.clienteId])

  // Calcular resumen
  const resumen = useMemo(() => {
    const totalGastos = gastos.reduce((sum, g) => sum + (g.monto ?? g.valor ?? 0), 0)
    const totalAbonos = abonos.reduce((sum, a) => sum + (a.monto ?? a.valor ?? 0), 0)
    const balance = totalAbonos - totalGastos

    // Gastos por banco
    const gastosPorBanco = gastos.reduce((acc, g) => {
      const banco = g.bancoId
      if (banco) {
        acc[banco] = (acc[banco] ?? 0) + (g.monto ?? g.valor ?? 0)
      }
      return acc
    }, {} as Record<BancoId, number>)

    // Abonos por cliente
    const abonosPorClienteMap = new Map<string, { nombre: string; total: number }>()
    abonos.forEach(a => {
      if (a.entidadId && a.entidadTipo === 'cliente') {
        const existing = abonosPorClienteMap.get(a.entidadId)
        if (existing) {
          existing.total += a.monto ?? a.valor ?? 0
        } else {
          abonosPorClienteMap.set(a.entidadId, {
            nombre: a.origen ?? 'Desconocido',
            total: a.monto ?? a.valor ?? 0,
          })
        }
      }
    })
    const abonosPorCliente = Array.from(abonosPorClienteMap.entries())
      .map(([clienteId, data]) => ({ clienteId, ...data }))
      .sort((a, b) => b.total - a.total)

    // Gastos por distribuidor
    const gastosPorDistMap = new Map<string, { nombre: string; total: number }>()
    gastos.forEach(g => {
      if (g.entidadId && g.entidadTipo === 'distribuidor') {
        const existing = gastosPorDistMap.get(g.entidadId)
        if (existing) {
          existing.total += g.monto ?? g.valor ?? 0
        } else {
          gastosPorDistMap.set(g.entidadId, {
            nombre: g.concepto ?? 'Desconocido',
            total: g.monto ?? g.valor ?? 0,
          })
        }
      }
    })
    const gastosPorDistribuidor = Array.from(gastosPorDistMap.entries())
      .map(([distribuidorId, data]) => ({ distribuidorId, ...data }))
      .sort((a, b) => b.total - a.total)

    return {
      totalGastos,
      totalAbonos,
      balance,
      gastosPorBanco,
      abonosPorCliente,
      gastosPorDistribuidor,
    }
  }, [gastos, abonos])

  return { gastos, abonos, resumen, loading, error }
}

// ====================================================================
// HOOK: DASHBOARD MÉTRICAS EN TIEMPO REAL
// ====================================================================

export interface DashboardMetricas {
  ventasHoy: number
  ventasSemana: number
  ventasMes: number
  gananciaHoy: number
  gananciaSemana: number
  gananciaMes: number
  deudaClientes: number
  deudaDistribuidores: number
  stockTotal: number
  capitalTotal: number
  loading: boolean
}

/**
 * Hook para métricas del dashboard en tiempo real
 */
export function useDashboardMetricas(): DashboardMetricas {
  const [metricas, setMetricas] = useState<DashboardMetricas>({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    gananciaHoy: 0,
    gananciaSemana: 0,
    gananciaMes: 0,
    deudaClientes: 0,
    deudaDistribuidores: 0,
    stockTotal: 0,
    capitalTotal: 0,
    loading: true,
  })

  useEffect(() => {
    if (!db || !isFirestoreAvailable()) {
      setMetricas(prev => ({ ...prev, loading: false }))
      return
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay())
    
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    // Suscripción a ventas
    const ventasQuery = query(
      collection(db, 'ventas'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(1000),
    )

    const unsubVentas = onSnapshot(ventasQuery, (snapshot) => {
      const ventas = snapshot.docs.map(doc => doc.data() as Venta)
      
      let ventasHoy = 0, ventasSemana = 0, ventasMes = 0
      let gananciaHoy = 0, gananciaSemana = 0, gananciaMes = 0

      ventas.forEach(v => {
        const fecha = v.fecha
        let fechaDate: Date | null = null
        
        if (fecha) {
          if (typeof fecha === 'string') {
            fechaDate = new Date(fecha)
          } else if ('toDate' in fecha) {
            fechaDate = (fecha as Timestamp).toDate()
          }
        }

        if (fechaDate) {
          const monto = v.precioTotalVenta ?? v.ingreso ?? 0
          const ganancia = v.utilidad ?? 0

          if (fechaDate >= hoy) {
            ventasHoy += monto
            gananciaHoy += ganancia
          }
          if (fechaDate >= inicioSemana) {
            ventasSemana += monto
            gananciaSemana += ganancia
          }
          if (fechaDate >= inicioMes) {
            ventasMes += monto
            gananciaMes += ganancia
          }
        }
      })

      setMetricas(prev => ({
        ...prev,
        ventasHoy,
        ventasSemana,
        ventasMes,
        gananciaHoy,
        gananciaSemana,
        gananciaMes,
      }))
    })

    // Suscripción a clientes (deuda)
    const clientesQuery = query(collection(db, 'clientes'))
    const unsubClientes = onSnapshot(clientesQuery, (snapshot) => {
      const deudaClientes = snapshot.docs.reduce((sum, doc) => {
        const cliente = doc.data() as Cliente
        return sum + (cliente.deudaTotal ?? cliente.pendiente ?? 0)
      }, 0)
      
      setMetricas(prev => ({ ...prev, deudaClientes }))
    })

    // Suscripción a distribuidores (deuda)
    const distQuery = query(collection(db, 'distribuidores'))
    const unsubDist = onSnapshot(distQuery, (snapshot) => {
      const deudaDistribuidores = snapshot.docs.reduce((sum, doc) => {
        const dist = doc.data() as Distribuidor
        return sum + (dist.deudaTotal ?? 0)
      }, 0)
      
      setMetricas(prev => ({ ...prev, deudaDistribuidores }))
    })

    // Suscripción a OCs (stock)
    const ocQuery = query(collection(db, 'ordenes_compra'))
    const unsubOC = onSnapshot(ocQuery, (snapshot) => {
      const stockTotal = snapshot.docs.reduce((sum, doc) => {
        const oc = doc.data() as OrdenCompra
        return sum + (oc.stockActual ?? 0)
      }, 0)
      
      setMetricas(prev => ({ ...prev, stockTotal }))
    })

    // Suscripción a bancos (capital)
    const bancosQuery = query(collection(db, 'bancos'))
    const unsubBancos = onSnapshot(bancosQuery, (snapshot) => {
      const capitalTotal = snapshot.docs.reduce((sum, doc) => {
        const banco = doc.data()
        return sum + (banco.capitalActual ?? 0)
      }, 0)
      
      setMetricas(prev => ({ ...prev, capitalTotal, loading: false }))
    })

    return () => {
      unsubVentas()
      unsubClientes()
      unsubDist()
      unsubOC()
      unsubBancos()
    }
  }, [])

  return metricas
}

// ====================================================================
// HOOK: FILTROS AVANZADOS
// ====================================================================

export interface UseFilteredDataResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  applyFilters: (filtros: FiltrosAnalisis) => void
  clearFilters: () => void
  currentFilters: FiltrosAnalisis
}

/**
 * Hook genérico para filtrar datos
 */
export function useFilteredData<T extends { fecha?: unknown; monto?: number }>(
  collectionName: string,
): UseFilteredDataResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<FiltrosAnalisis>({})

  const applyFilters = useCallback((filtros: FiltrosAnalisis) => {
    setCurrentFilters(filtros)
  }, [])

  const clearFilters = useCallback(() => {
    setCurrentFilters({})
  }, [])

  useEffect(() => {
    if (!db || !isFirestoreAvailable()) {
      setError('Firestore no está disponible')
      setLoading(false)
      return
    }

    setLoading(true)
    
    const q = query(
      collection(db, collectionName),
      orderBy('createdAt', 'desc'),
      firestoreLimit(1000),
    )

    const unsub = onSnapshot(q,
      (snapshot) => {
        let items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as T[]

        // Aplicar filtros
        if (currentFilters.fechaInicio) {
          items = items.filter(item => {
            const fecha = item.fecha
            if (!fecha) return false
            const fechaDate = typeof fecha === 'string' 
              ? new Date(fecha) 
              : 'toDate' in (fecha as object)
                ? (fecha as Timestamp).toDate() 
                : fecha as Date
            return fechaDate >= currentFilters.fechaInicio!
          })
        }

        if (currentFilters.fechaFin) {
          items = items.filter(item => {
            const fecha = item.fecha
            if (!fecha) return false
            const fechaDate = typeof fecha === 'string' 
              ? new Date(fecha) 
              : 'toDate' in (fecha as object)
                ? (fecha as Timestamp).toDate() 
                : fecha as Date
            return fechaDate <= currentFilters.fechaFin!
          })
        }

        if (currentFilters.montoMinimo !== undefined) {
          items = items.filter(item => (item.monto ?? 0) >= currentFilters.montoMinimo!)
        }

        if (currentFilters.montoMaximo !== undefined) {
          items = items.filter(item => (item.monto ?? 0) <= currentFilters.montoMaximo!)
        }

        setData(items)
        setLoading(false)
      },
      (err) => {
        setError(`Error: ${err.message}`)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [collectionName, currentFilters])

  return { data, loading, error, applyFilters, clearFilters, currentFilters }
}
