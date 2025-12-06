'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useChronosStore } from '@/app/lib/store'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type TableName = 'clientes' | 'ventas' | 'distribuidores' | 'bancos' | 'movimientos' | 'ordenesCompra'

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
// HOOK: useDB - Ahora usa Zustand store en lugar de acceso directo a DB
// Esto permite funcionar en el navegador sin problemas
// ═══════════════════════════════════════════════════════════════

export function useDB<T = unknown>(
  tableName: TableName,
  options: UseDBOptions<T> = {}
): UseDBResult<T> {
  const { 
    initialData = [],
    enabled = true,
  } = options

  // Obtener datos del store de Zustand - actualizaciones en tiempo real
  const storeData = useChronosStore((state) => {
    switch (tableName) {
      case 'clientes':
        return state.clientes
      case 'ventas':
        return state.ventas
      case 'distribuidores':
        return state.distribuidores
      case 'bancos':
        return Object.values(state.bancos)
      case 'movimientos':
        return state.movimientos
      case 'ordenesCompra':
        return state.ordenesCompra
      default:
        return []
    }
  })

  const [loading, setLoading] = useState(true)
  const [error] = useState<Error | null>(null)

  // El store ya tiene los datos - solo simulamos el loading inicial
  useEffect(() => {
    if (enabled) {
      // Pequeño delay para simular carga inicial
      const timeout = setTimeout(() => setLoading(false), 100)
      return () => clearTimeout(timeout)
    }
  }, [enabled])

  const refetch = useCallback(async () => {
    // Con Zustand, no hay necesidad de refetch - los datos son reactivos
    // Pero mantenemos la función por compatibilidad
    setLoading(true)
    setTimeout(() => setLoading(false), 50)
  }, [])

  return {
    data: enabled ? (storeData as T[]) : (initialData as T[]),
    loading,
    error,
    refetch,
  }
}

// ═══════════════════════════════════════════════════════════════
// HOOK: useRealtime - Ya no necesita WebSocket, Zustand es reactivo
// ═══════════════════════════════════════════════════════════════

interface UseRealtimeOptions {
  onUpdate?: (data: unknown) => void
  onError?: (error: Error) => void
}

export function useRealtime(
  _channel: string,
  options: UseRealtimeOptions = {}
) {
  // Con Zustand, los datos son reactivos automáticamente
  // Este hook se mantiene por compatibilidad pero ya no usa WebSocket
  const [connected] = useState(true)

  const send = useCallback((_data: unknown) => {
    // No-op: Zustand maneja las actualizaciones
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
