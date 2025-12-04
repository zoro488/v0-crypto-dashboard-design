'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { db } from '@/database'
import type { 
  Cliente, 
  Venta, 
  Distribuidor, 
  Banco, 
  Movimiento 
} from '@/database/schema'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type TableName = 'clientes' | 'ventas' | 'distribuidores' | 'bancos' | 'movimientos'

type TableData = {
  clientes: Cliente
  ventas: Venta
  distribuidores: Distribuidor
  bancos: Banco
  movimientos: Movimiento
}

interface UseDBOptions<T> {
  realtime?: boolean
  pollInterval?: number
  initialData?: T[]
  enabled?: boolean
}

interface UseDBResult<T> {
  data: T[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// ═══════════════════════════════════════════════════════════════
// HOOK: useDB - Datos con polling para simular realtime
// ═══════════════════════════════════════════════════════════════

export function useDB<K extends TableName>(
  tableName: K,
  options: UseDBOptions<TableData[K]> = {}
): UseDBResult<TableData[K]> {
  const { 
    realtime = false, 
    pollInterval = 5000, 
    initialData = [],
    enabled = true,
  } = options

  const [data, setData] = useState<TableData[K][]>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      // Dynamic table access - the schema defines these properly
      const tableQuery = (db.query as Record<string, { findMany: () => Promise<unknown[]> }>)[tableName]
      if (!tableQuery) {
        throw new Error(`Table ${tableName} not found in schema`)
      }
      const result = await tableQuery.findMany()
      
      if (mountedRef.current) {
        setData(result as TableData[K][])
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Error fetching data'))
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [tableName, enabled])

  useEffect(() => {
    mountedRef.current = true
    fetchData()

    // Polling para simular realtime
    let intervalId: NodeJS.Timeout | null = null
    if (realtime && enabled) {
      intervalId = setInterval(fetchData, pollInterval)
    }

    return () => {
      mountedRef.current = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [fetchData, realtime, pollInterval, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

// ═══════════════════════════════════════════════════════════════
// HOOK: useRealtime - WebSocket para updates en tiempo real
// ═══════════════════════════════════════════════════════════════

interface UseRealtimeOptions {
  onUpdate?: (data: unknown) => void
  onError?: (error: Error) => void
}

export function useRealtime(
  channel: string,
  options: UseRealtimeOptions = {}
) {
  const { onUpdate, onError } = options
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // En desarrollo, usar polling en lugar de WebSocket
    if (process.env.NODE_ENV === 'development') {
      setConnected(true)
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL
    if (!wsUrl) {
      console.warn('WebSocket URL not configured')
      return
    }

    try {
      const ws = new WebSocket(`${wsUrl}?channel=${channel}`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = (event) => {
        onError?.(new Error('WebSocket error'))
        console.error('WebSocket error:', event)
      }
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onUpdate?.(data)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      return () => {
        ws.close()
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('WebSocket connection failed'))
    }
  }, [channel, onUpdate, onError])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { connected, send }
}

// ═══════════════════════════════════════════════════════════════
// HOOK: useOptimistic - Estado optimista para UI responsiva
// ═══════════════════════════════════════════════════════════════

interface UseOptimisticOptions<T> {
  initialData: T[]
  onError?: (error: Error) => void
}

export function useOptimistic<T extends { id: string }>(
  options: UseOptimisticOptions<T>
) {
  const { initialData, onError } = options
  const [data, setData] = useState<T[]>(initialData)
  const [pendingChanges, setPendingChanges] = useState<Map<string, T>>(new Map())

  const addOptimistic = useCallback((item: T) => {
    setData((prev) => [item, ...prev])
    setPendingChanges((prev) => new Map(prev).set(item.id, item))
  }, [])

  const updateOptimistic = useCallback((id: string, updates: Partial<T>) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }, [])

  const removeOptimistic = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const commitChange = useCallback((id: string) => {
    setPendingChanges((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const rollbackChange = useCallback((id: string) => {
    const pending = pendingChanges.get(id)
    if (pending) {
      setData((prev) => prev.filter((item) => item.id !== id))
      setPendingChanges((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
      onError?.(new Error('Operation failed, changes rolled back'))
    }
  }, [pendingChanges, onError])

  return {
    data,
    setData,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    commitChange,
    rollbackChange,
    hasPendingChanges: pendingChanges.size > 0,
  }
}

export default useDB
