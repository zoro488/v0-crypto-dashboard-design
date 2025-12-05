'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Venta, Cliente } from '@/database/schema'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface VentaConCliente extends Venta {
  cliente?: Cliente
}

interface UseVentasResult {
  ventas: VentaConCliente[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// ═══════════════════════════════════════════════════════════════
// HOOK: useVentas
// ═══════════════════════════════════════════════════════════════

export function useVentas(): UseVentasResult {
  const [ventas, setVentas] = useState<VentaConCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ventas')
      if (!response.ok) throw new Error('Error fetching ventas')
      const data = await response.json()
      setVentas(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVentas()
    const interval = setInterval(fetchVentas, 5000)
    return () => clearInterval(interval)
  }, [fetchVentas])

  return { ventas, loading, error, refetch: fetchVentas }
}

// Alias para compatibilidad
export function useVentasData() {
  const result = useVentas()
  return {
    ...result,
    data: result.ventas,
  }
}
