'use client'

/**
 * 🎯 USE FEATURE FLAGS HOOK - CHRONOS SYSTEM
 * 
 * Hook de React para consumir feature flags en componentes cliente.
 * Proporciona estado reactivo y actualizaciones automáticas.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { flagFallbacks, type RootFlagValues } from '@/generated/hypertune'

// ============================================
// TYPES
// ============================================

interface UseFeatureFlagsOptions {
  /**
   * Si debe refrescar automáticamente las flags
   */
  autoRefresh?: boolean;
  /**
   * Intervalo de refresco en ms (default: 30000)
   */
  refreshInterval?: number;
  /**
   * Callback cuando las flags cambian
   */
  onFlagsChange?: (flags: RootFlagValues) => void;
}

interface UseFeatureFlagsReturn {
  flags: RootFlagValues;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isEnabled: (flagKey: keyof RootFlagValues) => boolean;
  getValue: <K extends keyof RootFlagValues>(key: K) => RootFlagValues[K];
}

// ============================================
// CACHE
// ============================================

let cachedFlags: RootFlagValues | null = null
let lastFetchTime = 0
const CACHE_TTL = 10000 // 10 segundos

// ============================================
// HOOK
// ============================================

/**
 * Hook para usar feature flags en componentes cliente.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { flags, isEnabled } = useFeatureFlags();
 *   
 *   if (isEnabled('enablePremium3D')) {
 *     return <Premium3DComponent />;
 *   }
 *   
 *   return <StandardComponent />;
 * }
 * ```
 */
export function useFeatureFlags(
  options: UseFeatureFlagsOptions = {},
): UseFeatureFlagsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    onFlagsChange,
  } = options

  const [flags, setFlags] = useState<RootFlagValues>(
    cachedFlags || flagFallbacks,
  )
  const [loading, setLoading] = useState(!cachedFlags)
  const [error, setError] = useState<Error | null>(null)

  // Función para obtener flags del servidor
  const fetchFlags = useCallback(async () => {
    const now = Date.now()
    
    // Usar cache si está fresco
    if (cachedFlags && now - lastFetchTime < CACHE_TTL) {
      setFlags(cachedFlags)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Fetch flags desde API endpoint
      const response = await fetch('/api/flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.status}`)
      }

      const data = await response.json()
      const newFlags = { ...flagFallbacks, ...data.flags }
      
      // Actualizar cache
      cachedFlags = newFlags
      lastFetchTime = now
      
      setFlags(newFlags)
      setError(null)
      
      // Callback si las flags cambiaron
      if (onFlagsChange) {
        onFlagsChange(newFlags)
      }
    } catch (err) {
      console.error('[useFeatureFlags] Error fetching flags:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      // Mantener flags anteriores o fallbacks
      setFlags(cachedFlags || flagFallbacks)
    } finally {
      setLoading(false)
    }
  }, [onFlagsChange])

  // Efecto inicial
  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchFlags, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchFlags])

  // Helper para verificar si una flag está habilitada
  const isEnabled = useCallback(
    (flagKey: keyof RootFlagValues): boolean => {
      const value = flags[flagKey]
      return typeof value === 'boolean' ? value : false
    },
    [flags],
  )

  // Helper para obtener valor de flag
  const getValue = useCallback(
    <K extends keyof RootFlagValues>(key: K): RootFlagValues[K] => {
      return flags[key]
    },
    [flags],
  )

  return {
    flags,
    loading,
    error,
    refresh: fetchFlags,
    isEnabled,
    getValue,
  }
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook para flags de UI/UX
 */
export function useUIFlags() {
  const { flags, loading, isEnabled, getValue } = useFeatureFlags()

  return useMemo(() => ({
    loading,
    enableDesignV2: isEnabled('enableDesignV2'),
    enablePremium3D: isEnabled('enablePremium3D'),
    enableDarkModeV2: isEnabled('enableDarkModeV2'),
    enableMobileOptimizations: isEnabled('enableMobileOptimizations'),
    dashboardLayout: getValue('dashboardLayout'),
    animationSpeed: getValue('animationSpeed'),
  }), [flags, loading, isEnabled, getValue])
}

/**
 * Hook para flags de negocio
 */
export function useBusinessFlags() {
  const { flags, loading, isEnabled } = useFeatureFlags()

  return useMemo(() => ({
    loading,
    enableBancoTransferencias: isEnabled('enableBancoTransferencias'),
    enableMultiBancoView: isEnabled('enableMultiBancoView'),
    enableVentasV2: isEnabled('enableVentasV2'),
    enableGYADistribution: isEnabled('enableGYADistribution'),
    enableRealTimeSync: isEnabled('enableRealTimeSync'),
  }), [flags, loading, isEnabled])
}

/**
 * Hook para verificar una flag específica
 */
export function useFlag<K extends keyof RootFlagValues>(
  flagKey: K,
): { value: RootFlagValues[K]; loading: boolean } {
  const { flags, loading } = useFeatureFlags()

  return useMemo(() => ({
    value: flags[flagKey],
    loading,
  }), [flags, flagKey, loading])
}

/**
 * Hook para verificar si una flag booleana está habilitada
 */
export function useFlagEnabled(
  flagKey: keyof RootFlagValues,
): { enabled: boolean; loading: boolean } {
  const { isEnabled, loading } = useFeatureFlags()

  return useMemo(() => ({
    enabled: isEnabled(flagKey),
    loading,
  }), [isEnabled, flagKey, loading])
}

export default useFeatureFlags
