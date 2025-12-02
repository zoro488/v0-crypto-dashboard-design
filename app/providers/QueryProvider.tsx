/**
 * 🚀 REACT QUERY PROVIDER
 * 
 * Provider de React Query para caché optimizado de datos de Firestore
 * 
 * Características:
 * - Caché automático de queries
 * - Revalidación inteligente
 * - Optimistic updates
 * - Devtools en desarrollo
 * - Retry automático con backoff
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'
import { logger } from '@/app/lib/utils/logger'

// Configuración optimizada del Query Client
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Tiempo que los datos se consideran frescos (30 segundos)
        staleTime: 30 * 1000,
        
        // Tiempo que los datos permanecen en caché (5 minutos)
        gcTime: 5 * 60 * 1000,
        
        // Revalidar cuando la ventana vuelve a tener foco
        refetchOnWindowFocus: true,
        
        // Revalidar cuando se reconecta
        refetchOnReconnect: true,
        
        // Retry automático (1 intento)
        retry: 1,
        
        // Delay exponencial entre retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Retry en mutations (0 por defecto para evitar duplicados)
        retry: 0,
        
        // Callbacks globales
        onError: (error) => {
          logger.error('Error en mutation', error as Error, {
            context: 'QueryClient',
          })
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: siempre crear un nuevo QueryClient
    return makeQueryClient()
  } else {
    // Browser: reutilizar el QueryClient existente
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // No usar useState en el servidor
  // Usar getQueryClient que maneja SSR correctamente
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}

// Export del QueryClient para uso manual si es necesario
export { getQueryClient }
