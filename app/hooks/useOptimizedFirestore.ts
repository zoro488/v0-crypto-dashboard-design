/**
 * 🔥 HOOKS OPTIMIZADOS CON REACT QUERY
 * 
 * Hooks que combinan useFirestoreCRUD con React Query para caché optimizado
 * 
 * Ventajas:
 * - Caché automático (30s stale time, 5min gc time)
 * - Revalidación inteligente
 * - Optimistic updates
 * - Menor carga en Firestore
 * - Mejor UX (datos instantáneos del caché)
 */

'use client'

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useFirestoreCRUD } from './useFirestoreCRUD'
import { logger } from '@/app/lib/utils/logger'
import type { Venta, Cliente, Distribuidor, OrdenCompra, Producto } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS - Centralizadas para fácil invalidación
// ═══════════════════════════════════════════════════════════════════════════

export const queryKeys = {
  ventas: ['ventas'] as const,
  ventaById: (id: string) => ['ventas', id] as const,
  ventasPendientes: () => ['ventas', 'pendientes'] as const,
  
  clientes: ['clientes'] as const,
  clienteById: (id: string) => ['clientes', id] as const,
  clientesActivos: () => ['clientes', 'activos'] as const,
  
  distribuidores: ['distribuidores'] as const,
  distribuidorById: (id: string) => ['distribuidores', id] as const,
  
  ordenesCompra: ['ordenes_compra'] as const,
  ordenCompraById: (id: string) => ['ordenes_compra', id] as const,
  ordenesPendientes: () => ['ordenes_compra', 'pendientes'] as const,
  
  productos: ['productos'] as const,
  productoById: (id: string) => ['productos', id] as const,
  productosBajoStock: () => ['productos', 'bajo-stock'] as const,
  
  movimientos: (bancoId?: string) => 
    bancoId ? ['movimientos', bancoId] : ['movimientos'] as const,
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useVentasQuery
// ═══════════════════════════════════════════════════════════════════════════

interface UseVentasQueryOptions {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

export function useVentasQuery(options?: UseVentasQueryOptions) {
  const { data: ventasRaw, loading, error } = useFirestoreCRUD<Venta>('ventas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    realtime: true,
  })

  return useQuery({
    queryKey: queryKeys.ventas,
    queryFn: async () => {
      if (error) throw error
      return ventasRaw || []
    },
    enabled: !loading && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 30000,
    gcTime: options?.gcTime ?? 300000,
    placeholderData: (previousData) => previousData,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useCreateVentaMutation
// ═══════════════════════════════════════════════════════════════════════════

export function useCreateVentaMutation() {
  const queryClient = useQueryClient()
  const { add } = useFirestoreCRUD<Venta>('ventas')

  return useMutation({
    mutationFn: async (venta: Omit<Venta, 'id'>) => {
      logger.info('Creando venta', { context: 'useCreateVentaMutation', data: venta })
      const id = await add(venta)
      if (!id) throw new Error('Error al crear venta')
      return { ...venta, id }
    },
    onSuccess: (newVenta) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.ventas })
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes })
      
      logger.info('Venta creada exitosamente', {
        context: 'useCreateVentaMutation',
        data: { id: newVenta.id },
      })
    },
    onError: (error) => {
      logger.error('Error al crear venta', error as Error, {
        context: 'useCreateVentaMutation',
      })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useClientesQuery
// ═══════════════════════════════════════════════════════════════════════════

export function useClientesQuery(options?: UseVentasQueryOptions) {
  const { data: clientesRaw, loading, error } = useFirestoreCRUD<Cliente>('clientes', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    realtime: true,
  })

  return useQuery({
    queryKey: queryKeys.clientes,
    queryFn: async () => {
      if (error) throw error
      return clientesRaw || []
    },
    enabled: !loading && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 60000, // 1 minuto (cambia menos frecuentemente)
    gcTime: options?.gcTime ?? 600000, // 10 minutos
    placeholderData: (previousData) => previousData,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useCreateClienteMutation
// ═══════════════════════════════════════════════════════════════════════════

export function useCreateClienteMutation() {
  const queryClient = useQueryClient()
  const { add } = useFirestoreCRUD<Cliente>('clientes')

  return useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id'>) => {
      logger.info('Creando cliente', { context: 'useCreateClienteMutation', data: cliente })
      const id = await add(cliente)
      if (!id) throw new Error('Error al crear cliente')
      return { ...cliente, id }
    },
    onMutate: async (newCliente) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: queryKeys.clientes })

      // Snapshot del valor anterior
      const previousClientes = queryClient.getQueryData<Cliente[]>(queryKeys.clientes)

      // Optimistic update
      queryClient.setQueryData<Cliente[]>(queryKeys.clientes, (old = []) => [
        ...old,
        { ...newCliente, id: 'temp-' + Date.now() } as Cliente,
      ])

      return { previousClientes }
    },
    onError: (_error, _newCliente, context) => {
      // Rollback en caso de error
      if (context?.previousClientes) {
        queryClient.setQueryData(queryKeys.clientes, context.previousClientes)
      }
      
      logger.error('Error al crear cliente', _error as Error, {
        context: 'useCreateClienteMutation',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes })
      logger.info('Cliente creado exitosamente', { context: 'useCreateClienteMutation' })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useDistribuidoresQuery
// ═══════════════════════════════════════════════════════════════════════════

export function useDistribuidoresQuery(options?: UseVentasQueryOptions) {
  const { data: distribuidoresRaw, loading, error } = useFirestoreCRUD<Distribuidor>('distribuidores', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    realtime: true,
  })

  return useQuery({
    queryKey: queryKeys.distribuidores,
    queryFn: async () => {
      if (error) throw error
      return distribuidoresRaw || []
    },
    enabled: !loading && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 60000,
    gcTime: options?.gcTime ?? 600000,
    placeholderData: (previousData) => previousData,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useOrdenesCompraQuery
// ═══════════════════════════════════════════════════════════════════════════

export function useOrdenesCompraQuery(options?: UseVentasQueryOptions) {
  const { data: ordenesRaw, loading, error } = useFirestoreCRUD<OrdenCompra>('ordenes_compra', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    realtime: true,
  })

  return useQuery({
    queryKey: queryKeys.ordenesCompra,
    queryFn: async () => {
      if (error) throw error
      return ordenesRaw || []
    },
    enabled: !loading && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 30000,
    gcTime: options?.gcTime ?? 300000,
    placeholderData: (previousData) => previousData,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useCreateOrdenCompraMutation
// ═══════════════════════════════════════════════════════════════════════════

export function useCreateOrdenCompraMutation() {
  const queryClient = useQueryClient()
  const { add } = useFirestoreCRUD<OrdenCompra>('ordenes_compra')

  return useMutation({
    mutationFn: async (orden: Omit<OrdenCompra, 'id'>) => {
      logger.info('Creando orden de compra', { context: 'useCreateOrdenCompraMutation' })
      const id = await add(orden)
      if (!id) throw new Error('Error al crear orden de compra')
      return { ...orden, id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ordenesCompra })
      queryClient.invalidateQueries({ queryKey: queryKeys.distribuidores })
      queryClient.invalidateQueries({ queryKey: queryKeys.productos })
      
      logger.info('Orden de compra creada exitosamente', {
        context: 'useCreateOrdenCompraMutation',
      })
    },
    onError: (error) => {
      logger.error('Error al crear orden de compra', error as Error, {
        context: 'useCreateOrdenCompraMutation',
      })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useProductosQuery
// ═══════════════════════════════════════════════════════════════════════════

export function useProductosQuery(options?: UseVentasQueryOptions) {
  const { data: productosRaw, loading, error } = useFirestoreCRUD<Producto>('almacen_productos', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    realtime: true,
  })

  return useQuery({
    queryKey: queryKeys.productos,
    queryFn: async () => {
      if (error) throw error
      return productosRaw || []
    },
    enabled: !loading && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 30000,
    gcTime: options?.gcTime ?? 300000,
    placeholderData: (previousData) => previousData,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useInvalidateAll - Útil para refrescar todo después de cambios masivos
// ═══════════════════════════════════════════════════════════════════════════

export function useInvalidateAll() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ventas })
    queryClient.invalidateQueries({ queryKey: queryKeys.clientes })
    queryClient.invalidateQueries({ queryKey: queryKeys.distribuidores })
    queryClient.invalidateQueries({ queryKey: queryKeys.ordenesCompra })
    queryClient.invalidateQueries({ queryKey: queryKeys.productos })
    
    logger.info('Todas las queries invalidadas', { context: 'useInvalidateAll' })
  }
}
