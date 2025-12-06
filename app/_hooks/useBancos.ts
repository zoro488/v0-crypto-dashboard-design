'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Banco } from '@/database/schema'

// ═══════════════════════════════════════════════════════════════
// HOOK: useBancos - Obtener datos de bancos con Server Actions
// ═══════════════════════════════════════════════════════════════

interface UseBancosResult {
  bancos: Banco[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useBancos(): UseBancosResult {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBancos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bancos')
      if (!response.ok) throw new Error('Error fetching bancos')
      const data = await response.json()
      setBancos(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBancos()
    
    // Polling cada 5 segundos para simular realtime
    const interval = setInterval(fetchBancos, 5000)
    return () => clearInterval(interval)
  }, [fetchBancos])

  return { bancos, loading, error, refetch: fetchBancos }
}

// Alias para compatibilidad con código legacy
export function useBancosData() {
  const result = useBancos()
  return {
    ...result,
    data: result.bancos,
  }
}

export function useBancoData(bancoId?: string) {
  const { bancos, loading, error, refetch } = useBancos()
  const banco = bancoId ? bancos.find(b => b.id === bancoId) : null
  
  return {
    banco,
    loading,
    error,
    refetch,
  }
}
