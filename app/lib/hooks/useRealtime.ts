/**
 * useRealtime - Hook para suscripciones en tiempo real con Firestore
 * Manejo automático de listeners y limpieza de memoria
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  doc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config'

// Tipos para configuración de suscripción
interface RealtimeConfig<T> {
  collectionName: string;
  constraints?: QueryConstraint[];
  transform?: (data: DocumentData) => T;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface RealtimeState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// Cache para evitar re-suscripciones innecesarias
const subscriptionCache = new Map<string, { unsubscribe: Unsubscribe; listeners: number }>()

/**
 * Hook principal para suscripciones en tiempo real
 */
export function useRealtime<T extends { id: string }>({
  collectionName,
  constraints = [],
  transform,
  onError,
  enabled = true,
}: RealtimeConfig<T>): RealtimeState<T> & { refresh: () => void } {
  const [state, setState] = useState<RealtimeState<T>>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null,
  })

  const refreshRef = useRef(0)

  const refresh = useCallback(() => {
    refreshRef.current += 1
    setState(prev => ({ ...prev, loading: true }))
  }, [])

  useEffect(() => {
    if (!enabled || !collectionName) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    // Guard: verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: new Error('Firestore no configurado'),
      }))
      return
    }

    const collectionRef = collection(db!, collectionName)
    const q = constraints.length > 0 
      ? query(collectionRef, ...constraints)
      : query(collectionRef)

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const documents = snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() }
            return transform ? transform(data) : (data as T)
          })

          setState({
            data: documents,
            loading: false,
            error: null,
            lastUpdated: new Date(),
          })
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Error transformando datos')
          setState(prev => ({ ...prev, loading: false, error: err }))
          onError?.(err)
        }
      },
      (error) => {
        const err = error instanceof Error ? error : new Error('Error de suscripción')
        setState(prev => ({ ...prev, loading: false, error: err }))
        onError?.(err)
      },
    )

    // Limpieza al desmontar
    return () => unsubscribe()
  }, [collectionName, enabled, refreshRef.current])

  return { ...state, refresh }
}

/**
 * Hook para suscripción a un documento específico
 */
export function useRealtimeDocument<T extends { id: string }>({
  collectionName,
  documentId,
  transform,
  onError,
  enabled = true,
}: {
  collectionName: string;
  documentId: string;
  transform?: (data: DocumentData) => T;
  onError?: (error: Error) => void;
  enabled?: boolean;
}): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !collectionName || !documentId) {
      setLoading(false)
      return
    }

    const docRef = doc(db!, collectionName, documentId)

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = { id: snapshot.id, ...snapshot.data() }
          const transformed = transform ? transform(docData) : (docData as T)
          setData(transformed)
        } else {
          setData(null)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
        onError?.(err)
      },
    )

    return () => unsubscribe()
  }, [collectionName, documentId, enabled])

  return { data, loading, error }
}

// ============================================
// HOOKS ESPECIALIZADOS POR COLECCIÓN
// ============================================

/**
 * Hook para ventas en tiempo real
 */
export function useRealtimeVentas(options?: { 
  limit?: number; 
  startDate?: Date;
  endDate?: Date;
}) {
  const constraints: QueryConstraint[] = [
    orderBy('fecha', 'desc'),
  ]

  if (options?.limit) {
    constraints.push(limit(options.limit))
  }

  if (options?.startDate) {
    constraints.push(where('fecha', '>=', Timestamp.fromDate(options.startDate)))
  }

  if (options?.endDate) {
    constraints.push(where('fecha', '<=', Timestamp.fromDate(options.endDate)))
  }

  return useRealtime({
    collectionName: 'ventas',
    constraints,
    transform: (data) => ({
      id: data.id,
      cliente: data.cliente,
      monto: data.monto,
      productos: data.productos,
      fecha: data.fecha?.toDate?.() || new Date(data.fecha),
      estado: data.estado,
      formaPago: data.formaPago,
    }),
  })
}

/**
 * Hook para órdenes de compra en tiempo real
 */
export function useRealtimeOrdenes(options?: { 
  limit?: number;
  estado?: 'pendiente' | 'pagada' | 'cancelada';
}) {
  const constraints: QueryConstraint[] = [
    orderBy('fechaCreacion', 'desc'),
  ]

  if (options?.limit) {
    constraints.push(limit(options.limit))
  }

  if (options?.estado) {
    constraints.push(where('estado', '==', options.estado))
  }

  return useRealtime({
    collectionName: 'ordenesCompra',
    constraints,
    transform: (data) => ({
      id: data.id,
      distribuidor: data.distribuidor,
      monto: data.monto,
      abonado: data.abonado,
      deuda: data.deuda,
      fechaCreacion: data.fechaCreacion?.toDate?.() || new Date(data.fechaCreacion),
      estado: data.estado,
      productos: data.productos,
    }),
  })
}

/**
 * Hook para clientes en tiempo real
 */
export function useRealtimeClientes(options?: { 
  limit?: number;
  conDeuda?: boolean;
}) {
  const constraints: QueryConstraint[] = []

  if (options?.limit) {
    constraints.push(limit(options.limit))
  }

  if (options?.conDeuda) {
    constraints.push(where('deuda', '>', 0))
  }

  return useRealtime({
    collectionName: 'clientes',
    constraints,
    transform: (data) => ({
      id: data.id,
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email,
      deuda: data.deuda || 0,
      totalCompras: data.totalCompras || 0,
      ultimaCompra: data.ultimaCompra?.toDate?.() || null,
    }),
  })
}

/**
 * Hook para distribuidores en tiempo real
 */
export function useRealtimeDistribuidores() {
  return useRealtime({
    collectionName: 'distribuidores',
    constraints: [orderBy('nombre', 'asc')],
    transform: (data) => ({
      id: data.id,
      nombre: data.nombre,
      contacto: data.contacto,
      telefono: data.telefono,
      deudaTotal: data.deudaTotal || 0,
      ordenesActivas: data.ordenesActivas || 0,
    }),
  })
}

/**
 * Hook para movimientos de banco en tiempo real
 */
export function useRealtimeBancos(bancoId?: string) {
  const constraints: QueryConstraint[] = [
    orderBy('fecha', 'desc'),
    limit(50),
  ]

  if (bancoId) {
    constraints.push(where('bancoId', '==', bancoId))
  }

  return useRealtime({
    collectionName: 'movimientosBanco',
    constraints,
    transform: (data) => ({
      id: data.id,
      tipo: data.tipo,
      monto: data.monto,
      concepto: data.concepto,
      bancoId: data.bancoId,
      fecha: data.fecha?.toDate?.() || new Date(data.fecha),
      referencia: data.referencia,
    }),
  })
}

/**
 * Hook para saldos de bancos en tiempo real
 */
export function useRealtimeSaldosBancos() {
  return useRealtime({
    collectionName: 'bancos',
    transform: (data) => ({
      id: data.id,
      nombre: data.nombre,
      saldo: data.saldo || 0,
      tipo: data.tipo,
      color: data.color,
    }),
  })
}

/**
 * Hook para almacén/stock en tiempo real
 */
export function useRealtimeAlmacen() {
  return useRealtime({
    collectionName: 'almacen',
    constraints: [orderBy('nombre', 'asc')],
    transform: (data) => ({
      id: data.id,
      nombre: data.nombre,
      cantidad: data.cantidad || 0,
      minimo: data.minimo || 0,
      costo: data.costo || 0,
      ubicacion: data.ubicacion,
    }),
  })
}

/**
 * Hook para notificaciones en tiempo real
 */
export function useRealtimeNotificaciones(userId?: string) {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
    limit(20),
    where('leida', '==', false),
  ]

  if (userId) {
    constraints.push(where('userId', '==', userId))
  }

  return useRealtime({
    collectionName: 'notificaciones',
    constraints,
    enabled: !!userId,
    transform: (data) => ({
      id: data.id,
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo,
      leida: data.leida,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      accion: data.accion,
    }),
  })
}

/**
 * Hook para estadísticas en tiempo real (KPIs)
 */
export function useRealtimeStats() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    clientesActivos: 0,
    ordenesPendientes: 0,
    stockBajo: 0,
    deudaClientes: 0,
    deudaProveedores: 0,
    utilidadesMes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribers: Unsubscribe[] = []

    // Ventas de hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const ventasHoyQuery = query(
      collection(db!, 'ventas'),
      where('fecha', '>=', Timestamp.fromDate(hoy)),
    )

    unsubscribers.push(
      onSnapshot(ventasHoyQuery, (snapshot) => {
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().monto || 0), 0)
        setStats(prev => ({ ...prev, ventasHoy: total }))
      }),
    )

    // Clientes activos
    const clientesQuery = query(collection(db!, 'clientes'))
    unsubscribers.push(
      onSnapshot(clientesQuery, (snapshot) => {
        setStats(prev => ({ ...prev, clientesActivos: snapshot.size }))
        const deuda = snapshot.docs.reduce((sum, doc) => sum + (doc.data().deuda || 0), 0)
        setStats(prev => ({ ...prev, deudaClientes: deuda }))
      }),
    )

    // Órdenes pendientes
    const ordenesPendientesQuery = query(
      collection(db!, 'ordenesCompra'),
      where('estado', '==', 'pendiente'),
    )
    unsubscribers.push(
      onSnapshot(ordenesPendientesQuery, (snapshot) => {
        setStats(prev => ({ ...prev, ordenesPendientes: snapshot.size }))
        const deuda = snapshot.docs.reduce((sum, doc) => sum + (doc.data().deuda || 0), 0)
        setStats(prev => ({ ...prev, deudaProveedores: deuda }))
      }),
    )

    // Stock bajo
    const stockBajoQuery = query(
      collection(db!, 'almacen'),
      where('cantidad', '<', 10),
    )
    unsubscribers.push(
      onSnapshot(stockBajoQuery, (snapshot) => {
        setStats(prev => ({ ...prev, stockBajo: snapshot.size }))
      }),
    )

    setLoading(false)

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [])

  return { stats, loading }
}

/**
 * Hook combinado para dashboard principal
 */
export function useRealtimeDashboard() {
  const ventas = useRealtimeVentas({ limit: 10 })
  const ordenes = useRealtimeOrdenes({ limit: 10 })
  const clientes = useRealtimeClientes({ limit: 10 })
  const saldos = useRealtimeSaldosBancos()
  const { stats, loading: statsLoading } = useRealtimeStats()

  return {
    ventas: ventas.data,
    ordenes: ordenes.data,
    clientes: clientes.data,
    saldos: saldos.data,
    stats,
    loading: ventas.loading || ordenes.loading || clientes.loading || saldos.loading || statsLoading,
    lastUpdated: ventas.lastUpdated,
  }
}

export default useRealtime
