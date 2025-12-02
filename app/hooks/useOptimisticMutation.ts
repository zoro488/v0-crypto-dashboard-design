/**
 * 🚀 HOOK OPTIMISTIC MUTATIONS - VELOCIDAD LUZ
 * 
 * Mutations con optimistic updates para UI instantánea.
 * Los cambios aparecen AL INSTANTE mientras Firebase sincroniza en background.
 * 
 * Características:
 * - Optimistic updates (UI se actualiza antes de confirmar)
 * - Rollback automático en caso de error
 * - Invalidación inteligente de queries relacionadas
 * - Toast notifications integradas
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

'use client'

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config'
import { logger } from '@/app/lib/utils/logger'
import { queryKeys, getRelatedQueryKeys } from '@/app/lib/query/queryClient'

// ============================================================
// TIPOS
// ============================================================

export interface MutationContext<T> {
  previousData: T[] | undefined
}

export interface CreateMutationOptions<T> {
  /** Callback al éxito */
  onSuccess?: (data: T) => void
  /** Callback al error */
  onError?: (error: Error) => void
  /** Mostrar toast de éxito */
  showSuccessToast?: boolean
  /** Mensaje de toast personalizado */
  successMessage?: string
  /** Mensaje de error personalizado */
  errorMessage?: string
}

// ============================================================
// HOOK: CREATE OPTIMISTIC
// ============================================================

/**
 * Hook para crear documentos con optimistic update
 * 
 * @example
 * ```tsx
 * const { mutate: createVenta, isPending } = useOptimisticCreate<Venta>(
 *   'ventas',
 *   queryKeys.ventas.all,
 *   { showSuccessToast: true, successMessage: 'Venta registrada' }
 * )
 * 
 * // Uso
 * createVenta({ cliente: 'Juan', total: 1000 })
 * ```
 */
export function useOptimisticCreate<T extends { id?: string }>(
  collectionPath: string,
  queryKey: readonly string[],
  options: CreateMutationOptions<T> = {},
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, successMessage, errorMessage } = options
  
  return useMutation<T, Error, Omit<T, 'id'>, MutationContext<T>>({
    mutationFn: async (newData) => {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase no configurado')
      }
      
      const dataWithTimestamp = {
        ...newData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      const docRef = await addDoc(collection(db, collectionPath), dataWithTimestamp)
      
      logger.info(`[useOptimisticCreate] Documento creado: ${docRef.id}`, {
        context: 'OptimisticMutation',
        data: { collection: collectionPath },
      })
      
      return { id: docRef.id, ...newData } as T
    },
    
    // 🚀 OPTIMISTIC UPDATE - UI se actualiza ANTES de que Firebase confirme
    onMutate: async (newData) => {
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: queryKey as string[] })
      
      // Guardar estado anterior para rollback
      const previousData = queryClient.getQueryData<T[]>(queryKey as string[])
      
      // Actualizar cache optimisticamente
      const optimisticItem = {
        id: `temp-${Date.now()}`,
        ...newData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as unknown as T
      
      queryClient.setQueryData<T[]>(queryKey as string[], (old = []) => [
        optimisticItem,
        ...old,
      ])
      
      logger.info(`[useOptimisticCreate] Optimistic update aplicado`, {
        context: 'OptimisticMutation',
      })
      
      return { previousData }
    },
    
    // ❌ ROLLBACK en caso de error
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey as string[], context.previousData)
      }
      
      logger.error(`[useOptimisticCreate] Error, rollback aplicado`, error, {
        context: 'OptimisticMutation',
        data: { collection: collectionPath },
      })
      
      onError?.(error)
    },
    
    // ✅ ÉXITO - invalidar queries relacionadas
    onSuccess: (data) => {
      // Invalidar queries relacionadas para sincronizar
      const relatedKeys = getRelatedQueryKeys(collectionPath.split('/')[0] as keyof typeof queryKeys)
      for (const key of relatedKeys) {
        queryClient.invalidateQueries({ queryKey: key as string[] })
      }
      
      logger.info(`[useOptimisticCreate] Éxito, queries invalidadas`, {
        context: 'OptimisticMutation',
      })
      
      onSuccess?.(data)
    },
    
    // 🔄 SIEMPRE invalidar al terminar (éxito o error)
    onSettled: () => {
      // Firebase onSnapshot ya habrá actualizado el cache
      // pero invalidamos por si acaso
      queryClient.invalidateQueries({ queryKey: queryKey as string[] })
    },
  })
}

// ============================================================
// HOOK: UPDATE OPTIMISTIC
// ============================================================

/**
 * Hook para actualizar documentos con optimistic update
 */
export function useOptimisticUpdate<T extends { id: string }>(
  collectionPath: string,
  queryKey: readonly string[],
  options: CreateMutationOptions<T> = {},
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError } = options
  
  return useMutation<T, Error, Partial<T> & { id: string }, MutationContext<T>>({
    mutationFn: async (updateData) => {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase no configurado')
      }
      
      const { id, ...data } = updateData
      const docRef = doc(db, collectionPath, id)
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
      
      logger.info(`[useOptimisticUpdate] Documento actualizado: ${id}`, {
        context: 'OptimisticMutation',
        data: { collection: collectionPath },
      })
      
      return updateData as T
    },
    
    onMutate: async (updateData) => {
      await queryClient.cancelQueries({ queryKey: queryKey as string[] })
      
      const previousData = queryClient.getQueryData<T[]>(queryKey as string[])
      
      queryClient.setQueryData<T[]>(queryKey as string[], (old = []) =>
        old.map((item) =>
          item.id === updateData.id
            ? { ...item, ...updateData, updatedAt: Timestamp.now() }
            : item,
        ),
      )
      
      return { previousData }
    },
    
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey as string[], context.previousData)
      }
      onError?.(error)
    },
    
    onSuccess: (data) => {
      const relatedKeys = getRelatedQueryKeys(collectionPath.split('/')[0] as keyof typeof queryKeys)
      for (const key of relatedKeys) {
        queryClient.invalidateQueries({ queryKey: key as string[] })
      }
      onSuccess?.(data)
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey as string[] })
    },
  })
}

// ============================================================
// HOOK: DELETE OPTIMISTIC
// ============================================================

/**
 * Hook para eliminar documentos con optimistic update
 */
export function useOptimisticDelete<T extends { id: string }>(
  collectionPath: string,
  queryKey: readonly string[],
  options: CreateMutationOptions<T> = {},
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError } = options
  
  return useMutation<void, Error, string, MutationContext<T>>({
    mutationFn: async (id) => {
      if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase no configurado')
      }
      
      const docRef = doc(db, collectionPath, id)
      await deleteDoc(docRef)
      
      logger.info(`[useOptimisticDelete] Documento eliminado: ${id}`, {
        context: 'OptimisticMutation',
        data: { collection: collectionPath },
      })
    },
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKey as string[] })
      
      const previousData = queryClient.getQueryData<T[]>(queryKey as string[])
      
      queryClient.setQueryData<T[]>(queryKey as string[], (old = []) =>
        old.filter((item) => item.id !== id),
      )
      
      return { previousData }
    },
    
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey as string[], context.previousData)
      }
      onError?.(error)
    },
    
    onSuccess: () => {
      const relatedKeys = getRelatedQueryKeys(collectionPath.split('/')[0] as keyof typeof queryKeys)
      for (const key of relatedKeys) {
        queryClient.invalidateQueries({ queryKey: key as string[] })
      }
      onSuccess?.(undefined as unknown as T)
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey as string[] })
    },
  })
}

// ============================================================
// HOOKS PRE-CONFIGURADOS POR COLECCIÓN
// ============================================================

/**
 * Hooks CRUD optimistic para Ventas
 */
export function useVentasMutations() {
  return {
    create: useOptimisticCreate('ventas', queryKeys.ventas.all),
    update: useOptimisticUpdate('ventas', queryKeys.ventas.all),
    remove: useOptimisticDelete('ventas', queryKeys.ventas.all),
  }
}

/**
 * Hooks CRUD optimistic para Clientes
 */
export function useClientesMutations() {
  return {
    create: useOptimisticCreate('clientes', queryKeys.clientes.all),
    update: useOptimisticUpdate('clientes', queryKeys.clientes.all),
    remove: useOptimisticDelete('clientes', queryKeys.clientes.all),
  }
}

/**
 * Hooks CRUD optimistic para Distribuidores
 */
export function useDistribuidoresMutations() {
  return {
    create: useOptimisticCreate('distribuidores', queryKeys.distribuidores.all),
    update: useOptimisticUpdate('distribuidores', queryKeys.distribuidores.all),
    remove: useOptimisticDelete('distribuidores', queryKeys.distribuidores.all),
  }
}

/**
 * Hooks CRUD optimistic para Órdenes de Compra
 */
export function useOrdenesCompraMutations() {
  return {
    create: useOptimisticCreate('ordenes_compra', queryKeys.ordenesCompra.all),
    update: useOptimisticUpdate('ordenes_compra', queryKeys.ordenesCompra.all),
    remove: useOptimisticDelete('ordenes_compra', queryKeys.ordenesCompra.all),
  }
}

/**
 * Hooks CRUD optimistic para Bancos
 */
export function useBancosMutations() {
  return {
    create: useOptimisticCreate('bancos', queryKeys.bancos.all),
    update: useOptimisticUpdate('bancos', queryKeys.bancos.all),
    remove: useOptimisticDelete('bancos', queryKeys.bancos.all),
  }
}

/**
 * Hooks CRUD optimistic para Movimientos
 */
export function useMovimientosMutations() {
  return {
    create: useOptimisticCreate('movimientos', queryKeys.movimientos.all),
    update: useOptimisticUpdate('movimientos', queryKeys.movimientos.all),
    remove: useOptimisticDelete('movimientos', queryKeys.movimientos.all),
  }
}

/**
 * Hooks CRUD optimistic para Almacén
 */
export function useAlmacenMutations() {
  return {
    create: useOptimisticCreate('almacen_productos', queryKeys.almacen.all),
    update: useOptimisticUpdate('almacen_productos', queryKeys.almacen.all),
    remove: useOptimisticDelete('almacen_productos', queryKeys.almacen.all),
  }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default useOptimisticCreate
