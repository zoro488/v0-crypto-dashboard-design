'use client'

import { useEffect, useState, useCallback } from 'react'
import type { OrdenCompra, Distribuidor } from '@/database/schema'

export interface OrdenConDistribuidor extends OrdenCompra {
  distribuidor?: Distribuidor
}

interface UseOrdenesResult {
  ordenes: OrdenConDistribuidor[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useOrdenes(): UseOrdenesResult {
  const [ordenes, setOrdenes] = useState<OrdenConDistribuidor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrdenes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ordenes')
      if (!response.ok) throw new Error('Error fetching ordenes')
      const data = await response.json()
      setOrdenes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrdenes()
    const interval = setInterval(fetchOrdenes, 5000)
    return () => clearInterval(interval)
  }, [fetchOrdenes])

  return { ordenes, loading, error, refetch: fetchOrdenes }
}

export function useOrdenesCompra() {
  return useOrdenes()
}

export function useOrdenesCompraData() {
  const result = useOrdenes()
  return {
    ...result,
    data: result.ordenes,
  }
}
