'use client'

/**
 * 🔄 UNIFIED DATA HOOKS - CHRONOS SYSTEM
 * Hooks que funcionan tanto con Firebase como con localStorage
 * 
 * Cuando Firebase no está disponible, usa localStorage automáticamente
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { isFirestoreAvailable } from '../firebase/config'
import * as unifiedService from '../services/unified-data-service'
import { logger } from '../utils/logger'
import type { BancoId } from '@/app/types'

// ============================================================
// TIPOS
// ============================================================

interface HookResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => void
}

// ============================================================
// HOOK GENÉRICO CON SUSCRIPCIÓN
// ============================================================

function useSubscription<T>(
  subscribeFn: (callback: (data: T[]) => void) => () => void,
  initialData: T[] = [],
): HookResult<T> {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const dataRefreshTrigger = useAppStore((state) => state.dataRefreshTrigger)

  const refresh = useCallback(() => {
    // Para hooks con suscripción, los datos se actualizan automáticamente
    // Pero podemos forzar un refresh
    setLoading(true)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    setLoading(true)

    try {
      const unsubscribe = subscribeFn((newData) => {
        if (!isMountedRef.current) return
        setData(newData)
        setLoading(false)
        setError(null)
      })

      return () => {
        isMountedRef.current = false
        unsubscribe()
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      }
    }
  }, [subscribeFn, dataRefreshTrigger])

  return { data, loading, error, refresh }
}

// ============================================================
// HOOKS ESPECÍFICOS
// ============================================================

export function useUnifiedBancos() {
  return useSubscription(unifiedService.suscribirBancos)
}

export function useUnifiedClientes() {
  return useSubscription(unifiedService.suscribirClientes)
}

export function useUnifiedVentas() {
  return useSubscription(unifiedService.suscribirVentas)
}

export function useUnifiedDistribuidores() {
  return useSubscription(unifiedService.suscribirDistribuidores)
}

export function useUnifiedOrdenesCompra() {
  return useSubscription(unifiedService.suscribirOrdenesCompra)
}

export function useUnifiedAlmacen() {
  return useSubscription(unifiedService.suscribirAlmacen)
}

// ============================================================
// HOOK PARA OBTENER MODO DE ALMACENAMIENTO
// ============================================================

export function useStorageMode(): 'localStorage' {
  // Siempre localStorage - Firebase deshabilitado
  return 'localStorage'
}

// ============================================================
// OPERACIONES CRUD
// ============================================================

export function useVentasCRUD() {
  const { data, loading, error, refresh } = useUnifiedVentas()
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const crear = useCallback(async (ventaData: Parameters<typeof unifiedService.crearVenta>[0]) => {
    try {
      const id = await unifiedService.crearVenta(ventaData)
      triggerDataRefresh()
      return id
    } catch (err) {
      logger.error('Error creando venta', err, { context: 'useVentasCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  return { data, loading, error, refresh, crear }
}

export function useClientesCRUD() {
  const { data, loading, error, refresh } = useUnifiedClientes()
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const crear = useCallback(async (clienteData: Parameters<typeof unifiedService.crearCliente>[0]) => {
    try {
      const id = await unifiedService.crearCliente(clienteData)
      triggerDataRefresh()
      return id
    } catch (err) {
      logger.error('Error creando cliente', err, { context: 'useClientesCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  const actualizar = useCallback(async (id: string, data: Parameters<typeof unifiedService.actualizarCliente>[1]) => {
    try {
      await unifiedService.actualizarCliente(id, data)
      triggerDataRefresh()
    } catch (err) {
      logger.error('Error actualizando cliente', err, { context: 'useClientesCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  const eliminar = useCallback(async (id: string) => {
    try {
      await unifiedService.eliminarCliente(id)
      triggerDataRefresh()
    } catch (err) {
      logger.error('Error eliminando cliente', err, { context: 'useClientesCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  return { data, loading, error, refresh, crear, actualizar, eliminar }
}

export function useOrdenesCompraCRUD() {
  const { data, loading, error, refresh } = useUnifiedOrdenesCompra()
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const crear = useCallback(async (ordenData: Parameters<typeof unifiedService.crearOrdenCompra>[0]) => {
    try {
      const id = await unifiedService.crearOrdenCompra(ordenData)
      triggerDataRefresh()
      return id
    } catch (err) {
      logger.error('Error creando orden de compra', err, { context: 'useOrdenesCompraCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  return { data, loading, error, refresh, crear }
}

export function useDistribuidoresCRUD() {
  const { data, loading, error, refresh } = useUnifiedDistribuidores()
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const crear = useCallback(async (data: Parameters<typeof unifiedService.crearDistribuidor>[0]) => {
    try {
      const id = await unifiedService.crearDistribuidor(data)
      triggerDataRefresh()
      return id
    } catch (err) {
      logger.error('Error creando distribuidor', err, { context: 'useDistribuidoresCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  return { data, loading, error, refresh, crear }
}

export function useBancosCRUD() {
  const { data, loading, error, refresh } = useUnifiedBancos()
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const transferir = useCallback(async (
    bancoOrigenId: string,
    bancoDestinoId: string,
    monto: number,
    concepto: string,
  ) => {
    try {
      const id = await unifiedService.crearTransferencia(
        bancoOrigenId as BancoId, 
        bancoDestinoId as BancoId, 
        monto, 
        concepto
      )
      triggerDataRefresh()
      return id
    } catch (err) {
      logger.error('Error creando transferencia', err, { context: 'useBancosCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  const registrarIngreso = useCallback(async (data: Parameters<typeof unifiedService.crearIngreso>[0]) => {
    try {
      const id = await unifiedService.crearIngreso(data)
      triggerDataRefresh()
      return id
    } catch (err) {
      logger.error('Error registrando ingreso', err, { context: 'useBancosCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  const registrarGasto = useCallback(async (data: Parameters<typeof unifiedService.crearGasto>[0]) => {
    try {
      const id = await unifiedService.crearGasto(data)
      triggerDataRefresh()
      return id
    } catch (err) {
      logger.error('Error registrando gasto', err, { context: 'useBancosCRUD' })
      throw err
    }
  }, [triggerDataRefresh])

  return { data, loading, error, refresh, transferir, registrarIngreso, registrarGasto }
}

// ============================================================
// UTILIDAD PARA LIMPIAR DATOS LOCALES
// ============================================================

export function useClearLocalData() {
  const triggerDataRefresh = useAppStore((state) => state.triggerDataRefresh)

  const clearAll = useCallback(() => {
    if (typeof window === 'undefined') return

    // Limpiar todas las claves de localStorage que empiezan con 'chronos_'
    const keysToRemove = [
      'chronos_bancos',
      'chronos_ordenes_compra',
      'chronos_ventas',
      'chronos_distribuidores',
      'chronos_clientes',
      'chronos_productos',
      'chronos_movimientos',
      'chronos_transferencias',
      'chronos_abonos',
      'chronos_ingresos',
      'chronos_gastos',
      'chronos-storage', // Zustand persist
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    logger.info('Datos locales limpiados', { context: 'useClearLocalData' })
    
    // Forzar refresh
    triggerDataRefresh()
    
    // Recargar la página para reinicializar
    window.location.reload()
  }, [triggerDataRefresh])

  return { clearAll }
}
