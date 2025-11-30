/**
 * useTreasury - Hook de Gestión del Tesoro en Tiempo Real
 * 
 * Suscripción a 'treasury_positions' para monitorear
 * el estado financiero y generar alertas.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { profitLogger as logger } from '@/app/lib/profit-engine/utils/logger'
import {
  subscribeTreasuryPosition,
  getTreasuryPosition,
  updateTreasuryPosition,
  recordTreasuryMovement,
  initializeTreasuryPosition,
  generateTreasuryAlerts,
  getTreasuryHealthMetrics,
  calculateOptimalBoardPrice,
  TREASURY_THRESHOLDS,
  DEFAULT_VAULT_CAPACITIES,
} from '@/app/lib/profit-engine/treasury'
import type {
  TreasuryPosition,
  TreasuryMovement,
  TreasuryAlert,
  TreasuryHealthMetrics,
} from '@/app/lib/profit-engine/types/profit-engine.types'

// ============================================
// TIPOS
// ============================================

interface UseTreasuryState {
  position: TreasuryPosition | null;
  alerts: TreasuryAlert[];
  healthMetrics: TreasuryHealthMetrics | null;
  loading: boolean;
  error: Error | null;
}

interface UseTreasuryReturn extends UseTreasuryState {
  // Capacidades y umbrales
  capacities: typeof DEFAULT_VAULT_CAPACITIES;
  thresholds: typeof TREASURY_THRESHOLDS;
  
  // Acciones
  updatePosition: (updates: Partial<TreasuryPosition>) => Promise<void>;
  recordMovement: (movement: Omit<TreasuryMovement, 'id' | 'timestamp' | 'balance_after'>) => Promise<string>;
  initializeIfNeeded: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  
  // Calculadoras
  getOptimalPrice: (
    competitorPrice: number,
    mode: 'buy' | 'sell'
  ) => { price: number; adjustment: number; reason: string };
  
  // Utilidades
  getUtilizationPercent: (field: keyof typeof DEFAULT_VAULT_CAPACITIES) => number;
  isLowInventory: (field: keyof typeof DEFAULT_VAULT_CAPACITIES) => boolean;
  isHighInventory: (field: keyof typeof DEFAULT_VAULT_CAPACITIES) => boolean;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useTreasury(currentExchangeRate: number = 18.50): UseTreasuryReturn {
  const [state, setState] = useState<UseTreasuryState>({
    position: null,
    alerts: [],
    healthMetrics: null,
    loading: true,
    error: null,
  })

  // Suscripción en tiempo real a la posición del tesoro
  useEffect(() => {
    const unsubscribe = subscribeTreasuryPosition((position) => {
      if (position) {
        const alerts = generateTreasuryAlerts(position, currentExchangeRate)
        const healthMetrics = getTreasuryHealthMetrics(position, currentExchangeRate)
        
        setState(prev => ({
          ...prev,
          position,
          alerts,
          healthMetrics,
          loading: false,
          error: null,
        }))
        
        logger.info('treasury-hook', 'Posición actualizada', {
          healthScore: position.inventory_health_score,
          alertCount: alerts.length,
        })
      } else {
        setState(prev => ({
          ...prev,
          position: null,
          loading: false,
        }))
      }
    })

    // Cleanup
    return () => unsubscribe()
  }, [currentExchangeRate])

  // Actualizar métricas cuando cambie el tipo de cambio
  useEffect(() => {
    if (state.position) {
      const healthMetrics = getTreasuryHealthMetrics(state.position, currentExchangeRate)
      const alerts = generateTreasuryAlerts(state.position, currentExchangeRate)
      
      setState(prev => ({
        ...prev,
        healthMetrics,
        alerts,
      }))
    }
  }, [currentExchangeRate, state.position])

  // Actualizar posición
  const updatePosition = useCallback(async (
    updates: Partial<TreasuryPosition>,
  ): Promise<void> => {
    try {
      await updateTreasuryPosition(updates)
    } catch (error) {
      logger.error('treasury-hook', 'Error actualizando posición', error)
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [])

  // Registrar movimiento
  const recordMovement = useCallback(async (
    movement: Omit<TreasuryMovement, 'id' | 'timestamp' | 'balance_after'>,
  ): Promise<string> => {
    try {
      return await recordTreasuryMovement(movement)
    } catch (error) {
      logger.error('treasury-hook', 'Error registrando movimiento', error)
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [])

  // Inicializar si es necesario
  const initializeIfNeeded = useCallback(async (): Promise<void> => {
    try {
      const existing = await getTreasuryPosition()
      if (!existing) {
        await initializeTreasuryPosition()
        logger.info('treasury-hook', 'Tesoro inicializado')
      }
    } catch (error) {
      logger.error('treasury-hook', 'Error inicializando tesoro', error)
      throw error
    }
  }, [])

  // Marcar alerta como reconocida
  const acknowledgeAlert = useCallback((alertId: string): void => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    }))
  }, [])

  // Calculadora de precio óptimo
  const getOptimalPrice = useCallback((
    competitorPrice: number,
    mode: 'buy' | 'sell',
  ) => {
    if (!state.position) {
      return { price: competitorPrice, adjustment: 0, reason: 'Sin datos de inventario' }
    }
    
    const inventoryPercent = state.position.physical_vault_usd / DEFAULT_VAULT_CAPACITIES.physical_vault_usd
    return calculateOptimalBoardPrice(competitorPrice, inventoryPercent, mode)
  }, [state.position])

  // Utilidades de inventario
  const getUtilizationPercent = useCallback((
    field: keyof typeof DEFAULT_VAULT_CAPACITIES,
  ): number => {
    if (!state.position) return 0
    
    const fieldMap: Record<keyof typeof DEFAULT_VAULT_CAPACITIES, keyof TreasuryPosition> = {
      physical_vault_usd: 'physical_vault_usd',
      physical_vault_mxn: 'physical_vault_mxn',
      usa_bank_usd: 'usa_bank_usd',
      digital_wallets_usdt: 'digital_wallets_usdt',
    }
    
    const value = state.position[fieldMap[field]] as number
    const capacity = DEFAULT_VAULT_CAPACITIES[field]
    
    return Math.round((value / capacity) * 100)
  }, [state.position])

  const isLowInventory = useCallback((
    field: keyof typeof DEFAULT_VAULT_CAPACITIES,
  ): boolean => {
    const percent = getUtilizationPercent(field) / 100
    return percent < TREASURY_THRESHOLDS.LOW_INVENTORY_PERCENT
  }, [getUtilizationPercent])

  const isHighInventory = useCallback((
    field: keyof typeof DEFAULT_VAULT_CAPACITIES,
  ): boolean => {
    const percent = getUtilizationPercent(field) / 100
    return percent > TREASURY_THRESHOLDS.HIGH_INVENTORY_PERCENT
  }, [getUtilizationPercent])

  return {
    ...state,
    capacities: DEFAULT_VAULT_CAPACITIES,
    thresholds: TREASURY_THRESHOLDS,
    updatePosition,
    recordMovement,
    initializeIfNeeded,
    acknowledgeAlert,
    getOptimalPrice,
    getUtilizationPercent,
    isLowInventory,
    isHighInventory,
  }
}

export default useTreasury
