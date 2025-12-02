/**
 * 🚀 QUERY CLIENT OPTIMIZADO - CHRONOS SYSTEM
 * 
 * Configuración óptima global de TanStack Query con:
 * - Persistencia offline en localStorage
 * - Caching inteligente (5 min fresh, 30 min cache)
 * - Retry automático con backoff exponencial
 * - Integración perfecta con Firebase onSnapshot
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

'use client'

import { QueryClient } from '@tanstack/react-query'
import { logger } from '@/app/lib/utils/logger'

/**
 * Crea un QueryClient con configuración óptima para FlowDistributor
 * 
 * Estrategia:
 * - staleTime: 5 minutos (datos se consideran frescos)
 * - gcTime: 30 minutos (tiempo en memoria antes de garbage collection)
 * - refetchOnWindowFocus: false (evita refetch innecesario, onSnapshot maneja updates)
 * - refetchOnReconnect: true (sincronizar al volver online)
 * - retry: 2 intentos con backoff exponencial
 */
export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 🕐 Tiempo que los datos se consideran frescos
        // Con onSnapshot activo, esto es backup - los datos se actualizan en tiempo real
        staleTime: 1000 * 60 * 5, // 5 minutos
        
        // 🗄️ Tiempo que los datos permanecen en caché (garbage collection)
        gcTime: 1000 * 60 * 30, // 30 minutos
        
        // 🔄 NO refetch al cambiar de pestaña (onSnapshot ya maneja updates)
        refetchOnWindowFocus: false,
        
        // 📶 SÍ refetch al reconectar (sincronizar datos offline)
        refetchOnReconnect: true,
        
        // 🔃 NO refetch al montar (evita llamadas duplicadas)
        refetchOnMount: false,
        
        // 🔁 Retry con backoff exponencial
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // 🌐 NO hacer fetch en background por defecto
        refetchInterval: false,
        
        // 📊 Placeholder data para UI instantánea
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // 🔁 Un solo retry en mutations
        retry: 1,
        
        // 📝 Logging global de errores
        onError: (error) => {
          logger.error('Error en mutation', error as Error, {
            context: 'QueryClient',
          })
        },
      },
    },
  })
}

// ============================================================
// SINGLETON PARA BROWSER
// ============================================================

let browserQueryClient: QueryClient | undefined

/**
 * Obtiene el QueryClient singleton
 * - Server: crea uno nuevo por request
 * - Browser: reutiliza el existente
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: siempre crear nuevo
    return createOptimizedQueryClient()
  }
  
  // Browser: singleton
  if (!browserQueryClient) {
    browserQueryClient = createOptimizedQueryClient()
    logger.info('QueryClient inicializado con configuración optimizada', {
      context: 'QueryClient',
      data: {
        staleTime: '5 minutos',
        gcTime: '30 minutos',
        refetchOnWindowFocus: false,
      },
    })
  }
  
  return browserQueryClient
}

// ============================================================
// QUERY KEYS FACTORY
// ============================================================

/**
 * Factory de query keys para consistencia
 * Usar SIEMPRE estas keys en lugar de arrays manuales
 */
export const queryKeys = {
  // Ventas
  ventas: {
    all: ['ventas'] as const,
    detail: (id: string) => ['ventas', 'detail', id] as const,
    byCliente: (clienteId: string) => ['ventas', 'cliente', clienteId] as const,
    byEstado: (estado: string) => ['ventas', 'estado', estado] as const,
    byFecha: (inicio: Date, fin: Date) => ['ventas', 'fecha', inicio.toISOString(), fin.toISOString()] as const,
  },
  
  // Clientes
  clientes: {
    all: ['clientes'] as const,
    detail: (id: string) => ['clientes', 'detail', id] as const,
    conDeuda: () => ['clientes', 'conDeuda'] as const,
  },
  
  // Distribuidores
  distribuidores: {
    all: ['distribuidores'] as const,
    detail: (id: string) => ['distribuidores', 'detail', id] as const,
    conDeuda: () => ['distribuidores', 'conDeuda'] as const,
  },
  
  // Órdenes de Compra
  ordenesCompra: {
    all: ['ordenesCompra'] as const,
    detail: (id: string) => ['ordenesCompra', 'detail', id] as const,
    byDistribuidor: (distribuidorId: string) => ['ordenesCompra', 'distribuidor', distribuidorId] as const,
    byEstado: (estado: string) => ['ordenesCompra', 'estado', estado] as const,
  },
  
  // Bancos
  bancos: {
    all: ['bancos'] as const,
    detail: (id: string) => ['bancos', 'detail', id] as const,
    resumen: () => ['bancos', 'resumen'] as const,
  },
  
  // Movimientos
  movimientos: {
    all: ['movimientos'] as const,
    byBanco: (bancoId: string) => ['movimientos', 'banco', bancoId] as const,
    byTipo: (tipo: string) => ['movimientos', 'tipo', tipo] as const,
    byFecha: (inicio: Date, fin: Date) => ['movimientos', 'fecha', inicio.toISOString(), fin.toISOString()] as const,
  },
  
  // Almacén
  almacen: {
    all: ['almacen'] as const,
    detail: (id: string) => ['almacen', 'detail', id] as const,
    bajoStock: () => ['almacen', 'bajoStock'] as const,
  },
  
  // Dashboard
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
    resumen: () => ['dashboard', 'resumen'] as const,
  },
} as const

export type QueryKeys = typeof queryKeys

// ============================================================
// INVALIDATION HELPERS
// ============================================================

/**
 * Invalida queries relacionadas después de una mutación
 * Útil para mantener consistencia entre colecciones
 */
export function getRelatedQueryKeys(collection: keyof typeof queryKeys): readonly (readonly string[])[] {
  const relations: Record<string, readonly (readonly string[])[]> = {
    ventas: [
      queryKeys.ventas.all,
      queryKeys.clientes.all,
      queryKeys.bancos.all,
      queryKeys.movimientos.all,
      queryKeys.dashboard.stats(),
    ],
    clientes: [
      queryKeys.clientes.all,
      queryKeys.ventas.all,
    ],
    distribuidores: [
      queryKeys.distribuidores.all,
      queryKeys.ordenesCompra.all,
    ],
    ordenesCompra: [
      queryKeys.ordenesCompra.all,
      queryKeys.distribuidores.all,
      queryKeys.almacen.all,
      queryKeys.bancos.all,
    ],
    bancos: [
      queryKeys.bancos.all,
      queryKeys.movimientos.all,
      queryKeys.dashboard.stats(),
    ],
    movimientos: [
      queryKeys.movimientos.all,
      queryKeys.bancos.all,
    ],
    almacen: [
      queryKeys.almacen.all,
      queryKeys.ordenesCompra.all,
    ],
  }
  
  return relations[collection] || []
}
