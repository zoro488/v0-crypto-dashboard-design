/**
 * 🚀 REACT QUERY PROVIDER - OPTIMIZADO CON PERSISTENCIA OFFLINE
 * 
 * Provider de React Query para caché optimizado de datos de Firestore
 * 
 * Características:
 * - Caché automático con persistencia en localStorage
 * - Offline support total (7 días de persistencia)
 * - Optimistic updates ultra-rápidos
 * - Devtools brutales para debuggear
 * - Integración perfecta con Firebase onSnapshot
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

'use client'

import { useEffect, useState, ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { getQueryClient } from '@/app/lib/query/queryClient'
import { logger } from '@/app/lib/utils/logger'

// ============================================================
// PERSISTENCIA OFFLINE
// ============================================================

/**
 * Persister para localStorage
 * Guarda el cache en localStorage para offline support
 */
function createPersister() {
  if (typeof window === 'undefined') {
    return undefined
  }
  
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'chronos-query-cache',
    // Serializar/deserializar con manejo de errores
    serialize: (data) => {
      try {
        return JSON.stringify(data)
      } catch (error) {
        logger.error('Error serializando cache', error as Error, {
          context: 'QueryPersister',
        })
        return '{}'
      }
    },
    deserialize: (data) => {
      try {
        return JSON.parse(data)
      } catch (error) {
        logger.error('Error deserializando cache', error as Error, {
          context: 'QueryPersister',
        })
        return {}
      }
    },
  })
}

// ============================================================
// PROVIDER
// ============================================================

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient())
  const [persister, setPersister] = useState<ReturnType<typeof createSyncStoragePersister> | undefined>()
  const [isClient, setIsClient] = useState(false)
  
  // Inicializar persister solo en cliente
  useEffect(() => {
    setIsClient(true)
    const p = createPersister()
    setPersister(p)
    
    if (p) {
      logger.info('QueryClient con persistencia offline inicializado', {
        context: 'QueryProvider',
        data: { maxAge: '7 días' },
      })
    }
  }, [])
  
  // SSR: usar provider básico
  if (!isClient) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
  
  // Cliente sin persister (fallback)
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    )
  }
  
  // Cliente con persistencia completa
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
        buster: 'v2', // Incrementar para invalidar cache antiguo
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Solo persistir queries exitosas
            return query.state.status === 'success'
          },
        },
      }}
    >
      {children}
      {/* Devtools brutales para debuggear */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </PersistQueryClientProvider>
  )
}

// Re-export del QueryClient para uso manual
export { getQueryClient }
