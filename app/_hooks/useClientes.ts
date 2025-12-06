'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Cliente } from '@/database/schema'

interface UseClientesResult {
  clientes: Cliente[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClientes(): UseClientesResult {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clientes')
      if (!response.ok) throw new Error('Error fetching clientes')
      const data = await response.json()
      setClientes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClientes()
    const interval = setInterval(fetchClientes, 5000)
    return () => clearInterval(interval)
  }, [fetchClientes])

  return { clientes, loading, error, refetch: fetchClientes }
}

export function useClientesData() {
  const result = useClientes()
  return {
    ...result,
    data: result.clientes,
  }
}
