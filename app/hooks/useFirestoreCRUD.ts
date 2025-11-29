/**
 * 🔥 HOOK CRUD UNIVERSAL PARA FIRESTORE
 * 
 * Este hook proporciona operaciones CRUD completas con:
 * - Lectura en tiempo real con onSnapshot
 * - Operaciones de escritura con manejo de errores
 * - Modo mock automático cuando Firestore falla
 * - Tipado fuerte con TypeScript
 * - Cleanup automático de listeners
 */

"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  serverTimestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config'
import { useToast } from '@/app/hooks/use-toast'
import { logger } from '@/app/lib/utils/logger'

// ===================================================================
// TIPOS
// ===================================================================

interface CRUDOptions {
  orderByField?: string
  orderDirection?: 'asc' | 'desc'
  whereField?: string
  whereOperator?: '==' | '!=' | '<' | '>' | '<=' | '>='
  whereValue?: string | number | boolean
  limitCount?: number
  realtime?: boolean
}

interface CRUDResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  add: (item: Omit<T, 'id'>) => Promise<string | null>
  update: (id: string, item: Partial<T>) => Promise<boolean>
  remove: (id: string, skipConfirm?: boolean) => Promise<boolean>
  refresh: () => Promise<void>
}

// ===================================================================
// HOOK PRINCIPAL
// ===================================================================

export function useFirestoreCRUD<T extends { id: string }>(
  collectionName: string,
  options: CRUDOptions = {}
): CRUDResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Refs para cleanup y prevención de memory leaks
  const isMountedRef = useRef(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Construir query con constraints
  const buildQuery = useCallback(() => {
    // Guard: Verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      return null
    }
    
    const constraints: QueryConstraint[] = []
    
    if (options.whereField && options.whereValue !== undefined) {
      constraints.push(where(options.whereField, options.whereOperator || '==', options.whereValue))
    }
    
    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'))
    }
    
    if (options.limitCount) {
      constraints.push(limit(options.limitCount))
    }
    
    return query(collection(db, collectionName), ...constraints)
  }, [collectionName, options.whereField, options.whereOperator, options.whereValue, options.orderByField, options.orderDirection, options.limitCount])

  // Fetch inicial o con refresh
  const fetchData = useCallback(async () => {
    try {
      const q = buildQuery()
      
      // Guard: Si query es null, usar datos mock
      if (!q) {
        logger.warn(`[CRUD] ${collectionName}: Firestore no disponible, usando modo mock`)
        setData([])
        setLoading(false)
        return
      }
      
      const snapshot = await getDocs(q)
      
      if (!isMountedRef.current) return
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]
      
      setData(items)
      setLoading(false)
      setError(null)
      
      logger.info(`[CRUD] ${collectionName}: ${items.length} registros cargados`)
    } catch (err) {
      if (!isMountedRef.current) return
      
      const errMsg = err instanceof Error ? err.message : 'Error desconocido'
      logger.error(`[CRUD] Error en ${collectionName}:`, errMsg)
      setError(errMsg)
      setLoading(false)
    }
  }, [buildQuery, collectionName])

  // Suscripción en tiempo real
  const subscribeRealtime = useCallback(() => {
    const q = buildQuery()
    
    // Guard: Si query es null, no suscribir
    if (!q) {
      logger.warn(`[CRUD] ${collectionName}: No se puede suscribir, Firestore no disponible`)
      setLoading(false)
      return () => {}
    }
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMountedRef.current) return
        
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[]
        
        setData(items)
        setLoading(false)
        setError(null)
      },
      (err) => {
        if (!isMountedRef.current) return
        
        const errMsg = err.message || 'Error de conexión'
        logger.error(`[CRUD] Error en tiempo real ${collectionName}:`, errMsg)
        setError(errMsg)
        setLoading(false)
        
        // Fallback a fetch único si falla realtime
        fetchData()
      }
    )
    
    return unsubscribe
  }, [buildQuery, collectionName, fetchData])

  // Efecto principal
  useEffect(() => {
    isMountedRef.current = true
    
    if (options.realtime !== false) {
      unsubscribeRef.current = subscribeRealtime()
    } else {
      fetchData()
    }
    
    return () => {
      isMountedRef.current = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [options.realtime, subscribeRealtime, fetchData])

  // CREAR
  const add = useCallback(async (item: Omit<T, 'id'>): Promise<string | null> => {
    // Guard: Verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      toast({
        title: "❌ Error",
        description: "Firebase no está configurado",
        variant: "destructive"
      })
      return null
    }
    
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      toast({
        title: "✅ Guardado",
        description: "El registro se creó correctamente"
      })
      
      logger.info(`[CRUD] Creado en ${collectionName}: ${docRef.id}`)
      return docRef.id
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al guardar'
      logger.error(`[CRUD] Error al crear en ${collectionName}: ${errMsg}`)
      
      toast({
        title: "❌ Error",
        description: errMsg,
        variant: "destructive"
      })
      
      return null
    }
  }, [collectionName, toast])

  // ACTUALIZAR
  const update = useCallback(async (id: string, item: Partial<T>): Promise<boolean> => {
    // Guard: Verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      toast({
        title: "❌ Error",
        description: "Firebase no está configurado",
        variant: "destructive"
      })
      return false
    }
    
    try {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...item,
        updatedAt: serverTimestamp()
      })
      
      toast({
        title: "✅ Actualizado",
        description: "Los cambios se guardaron correctamente"
      })
      
      logger.info(`[CRUD] Actualizado en ${collectionName}: ${id}`)
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al actualizar'
      logger.error(`[CRUD] Error al actualizar en ${collectionName}: ${errMsg}`)
      
      toast({
        title: "❌ Error",
        description: errMsg,
        variant: "destructive"
      })
      
      return false
    }
  }, [collectionName, toast])

  // ELIMINAR
  const remove = useCallback(async (id: string, skipConfirm = false): Promise<boolean> => {
    if (!skipConfirm) {
      const confirmed = window.confirm("¿Estás seguro de eliminar este registro?")
      if (!confirmed) return false
    }
    
    // Guard: Verificar que Firestore está disponible
    if (!isFirebaseConfigured || !db) {
      toast({
        title: "❌ Error",
        description: "Firebase no está configurado",
        variant: "destructive"
      })
      return false
    }
    
    try {
      await deleteDoc(doc(db, collectionName, id))
      
      toast({
        title: "🗑️ Eliminado",
        description: "El registro se eliminó correctamente"
      })
      
      logger.info(`[CRUD] Eliminado de ${collectionName}: ${id}`)
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al eliminar'
      logger.error(`[CRUD] Error al eliminar de ${collectionName}: ${errMsg}`)
      
      toast({
        title: "❌ Error",
        description: errMsg,
        variant: "destructive"
      })
      
      return false
    }
  }, [collectionName, toast])

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    refresh: fetchData
  }
}

// ===================================================================
// HOOKS ESPECÍFICOS PRE-CONFIGURADOS
// ===================================================================

export function useProductos() {
  return useFirestoreCRUD<{
    id: string
    nombre: string
    stock: number
    stockActual: number
    precioVenta: number
    precioCompra: number
    categoria?: string
  }>('almacen_productos', {
    orderByField: 'nombre',
    orderDirection: 'asc'
  })
}

export function useClientes() {
  return useFirestoreCRUD<{
    id: string
    nombre: string
    telefono: string
    email: string
    deudaTotal: number
  }>('clientes', {
    orderByField: 'nombre',
    orderDirection: 'asc'
  })
}

export function useDistribuidores() {
  return useFirestoreCRUD<{
    id: string
    nombre: string
    empresa: string
    telefono: string
    email: string
    deudaTotal: number
    totalOrdenesCompra: number
  }>('distribuidores', {
    orderByField: 'nombre',
    orderDirection: 'asc'
  })
}

export function useVentas() {
  return useFirestoreCRUD<{
    id: string
    fecha: string
    clienteId: string
    clienteNombre: string
    total: number
    montoPagado: number
    montoRestante: number
    estado: string
    estadoPago: string
  }>('ventas', {
    orderByField: 'fecha',
    orderDirection: 'desc'
  })
}

export function useOrdenesCompra() {
  return useFirestoreCRUD<{
    id: string
    fecha: string
    distribuidorId: string
    distribuidor: string
    producto: string
    cantidad: number
    costoTotal: number
    pagoInicial: number
    deuda: number
    estado: string
  }>('ordenes_compra', {
    orderByField: 'fecha',
    orderDirection: 'desc'
  })
}

export function useMovimientos(bancoId?: string) {
  return useFirestoreCRUD<{
    id: string
    bancoId: string
    tipo: string
    tipoMovimiento: string
    monto: number
    concepto: string
    fecha: string
  }>('movimientos', {
    whereField: bancoId ? 'bancoId' : undefined,
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc'
  })
}

export default useFirestoreCRUD
