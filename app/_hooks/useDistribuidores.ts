'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Distribuidor } from '@/database/schema'

interface UseDistribuidoresResult {
  distribuidores: Distribuidor[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDistribuidores(): UseDistribuidoresResult {
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDistribuidores = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/distribuidores')
      if (!response.ok) throw new Error('Error fetching distribuidores')
      const data = await response.json()
      setDistribuidores(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDistribuidores()
    const interval = setInterval(fetchDistribuidores, 5000)
    return () => clearInterval(interval)
  }, [fetchDistribuidores])

  return { distribuidores, loading, error, refetch: fetchDistribuidores }
}

export function useDistribuidoresData() {
  const result = useDistribuidores()
  return {
    ...result,
    data: result.distribuidores,
  }
}
