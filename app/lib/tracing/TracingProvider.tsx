"use client"

/**
 * 🔍 TRACING PROVIDER
 * 
 * Componente React que inicializa el sistema de tracing
 * al montar la aplicación.
 */

import { useEffect, ReactNode } from 'react'
import { initTracing, shutdownTracing } from './index'
import { logger } from '../utils/logger'

interface TracingProviderProps {
  children: ReactNode
  enabled?: boolean
}

export function TracingProvider({ 
  children, 
  enabled = process.env.NODE_ENV === 'development' 
}: TracingProviderProps) {
  useEffect(() => {
    if (!enabled) {
      logger.info('[TracingProvider] Tracing disabled')
      return
    }

    // Inicializar tracing
    initTracing()

    // Cleanup al desmontar
    return () => {
      shutdownTracing().catch((err) => {
        logger.error('[TracingProvider] Shutdown error', err as Error)
      })
    }
  }, [enabled])

  return <>{children}</>
}

export default TracingProvider
