'use client'

/**
 * 🔄 CONVEX PROVIDER - Client Component
 * 
 * Provider para Convex con React Query integration.
 */

import { ReactNode } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

// Crear cliente Convex
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

let convex: ConvexReactClient | null = null

if (convexUrl) {
  convex = new ConvexReactClient(convexUrl)
}

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  // Si no hay URL de Convex, renderizar sin el provider
  if (!convex) {
    console.warn('⚠️ CONVEX_URL no configurada. Usando modo sin Convex.')
    return <>{children}</>
  }

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}

export default ConvexClientProvider
