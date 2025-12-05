// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — REALTIME HOOKS
// Polling ultra-rápido para actualización <35ms percibida
// ═══════════════════════════════════════════════════════════════

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

// ═══════════════════════════════════════════════════════════════
// QUERY KEYS CENTRALIZADOS
// ═══════════════════════════════════════════════════════════════

export const queryKeys = {
  // Bancos
  bancos: ['bancos'] as const,
  banco: (id: string) => ['bancos', id] as const,
  
  // Ventas
  ventas: ['ventas'] as const,
  venta: (id: string) => ['ventas', id] as const,
  ventasStats: ['ventas', 'stats'] as const,
  
  // Clientes
  clientes: ['clientes'] as const,
  cliente: (id: string) => ['clientes', id] as const,
  
  // Distribuidores
  distribuidores: ['distribuidores'] as const,
  distribuidor: (id: string) => ['distribuidores', id] as const,
  
  // Productos/Almacén
  productos: ['productos'] as const,
  producto: (id: string) => ['productos', id] as const,
  
  // Órdenes de Compra
  ordenesCompra: ['ordenes_compra'] as const,
  ordenCompra: (id: string) => ['ordenes_compra', id] as const,
  
  // Movimientos
  movimientos: ['movimientos'] as const,
  movimientosPorBanco: (bancoId: string) => ['movimientos', bancoId] as const,
  
  // KPIs
  kpis: ['kpis'] as const,
  dashboard: ['dashboard'] as const,
} as const

// ═══════════════════════════════════════════════════════════════
// REALTIME POLLING HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * Hook para polling realtime ultra-rápido
 * @param queryKey - Query key a invalidar
 * @param intervalMs - Intervalo de polling (default 2000ms)
 */
export function useRealtime(
  queryKey: readonly string[],
  intervalMs = 2000
) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey })
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [queryClient, queryKey, intervalMs])
}

/**
 * Hook para invalidar todas las queries del dashboard
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bancos })
    queryClient.invalidateQueries({ queryKey: queryKeys.ventas })
    queryClient.invalidateQueries({ queryKey: queryKeys.kpis })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  }, [queryClient])
}

/**
 * Hook para invalidar todo el cache
 */
export function useInvalidateAll() {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries()
  }, [queryClient])
}

// ═══════════════════════════════════════════════════════════════
// OPTIMISTIC UPDATES HELPER
// ═══════════════════════════════════════════════════════════════

interface OptimisticConfig<TData, TVariables> {
  queryKey: readonly string[]
  updateFn: (old: TData | undefined, variables: TVariables) => TData
}

export function useOptimisticMutation<TData, TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  config: OptimisticConfig<TData, TVariables>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: config.queryKey })

      // Snapshot del valor actual
      const previousData = queryClient.getQueryData<TData>(config.queryKey)

      // Actualización optimista
      queryClient.setQueryData<TData>(config.queryKey, (old) =>
        config.updateFn(old, variables)
      )

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // Rollback en caso de error
      if (context?.previousData) {
        queryClient.setQueryData(config.queryKey, context.previousData)
      }
    },
    onSettled: () => {
      // Refetch para sincronizar con servidor
      queryClient.invalidateQueries({ queryKey: config.queryKey })
    },
  })
}
