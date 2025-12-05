'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Almacen } from '@/database/schema'

interface UseAlmacenResult {
  productos: Almacen[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAlmacen(): UseAlmacenResult {
  const [productos, setProductos] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/almacen')
      if (!response.ok) throw new Error('Error fetching almacen')
      const data = await response.json()
      setProductos(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
    const interval = setInterval(fetchProductos, 5000)
    return () => clearInterval(interval)
  }, [fetchProductos])

  return { productos, loading, error, refetch: fetchProductos }
}

export function useAlmacenData() {
  const result = useAlmacen()
  return {
    ...result,
    data: result.productos,
  }
}

export function useProductos() {
  return useAlmacen()
}

// Hooks para entradas y salidas (simplificados)
export function useEntradasAlmacen() {
  return { entradas: [], loading: false, error: null, data: [], refetch: async () => {} }
}

export function useSalidasAlmacen() {
  return { salidas: [], loading: false, error: null, data: [], refetch: async () => {} }
}
