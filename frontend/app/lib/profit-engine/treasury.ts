/**
 * Treasury Positions - Sistema de Gestión de Posiciones del Tesoro
 * 
 * Gestiona el estado financiero real en tiempo real:
 * - Cuentas bancarias USA (USD)
 * - Bóvedas físicas (USD/MXN)
 * - Wallets digitales (USDT)
 * - Score de salud del inventario
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/frontend/app/lib/firebase/config';
import { profitLogger as logger } from './utils/logger';
import type { 
  TreasuryPosition, 
  TreasuryMovement, 
  TreasuryAlert,
  TreasuryHealthMetrics 
} from './types/profit-engine.types';

// ============================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================

/**
 * Umbrales de alerta para el inventario
 */
export const TREASURY_THRESHOLDS = {
  // Alerta cuando el inventario USD supera este porcentaje de capacidad
  HIGH_INVENTORY_PERCENT: 0.80,
  // Alerta cuando el inventario USD baja de este porcentaje
  LOW_INVENTORY_PERCENT: 0.20,
  // Porcentaje crítico - requiere acción inmediata
  CRITICAL_LOW_PERCENT: 0.10,
  CRITICAL_HIGH_PERCENT: 0.95,
  // Límites de efectivo (Ley Antilavado México)
  MAX_CASH_TRANSACTION_MXN: 200000,
  MAX_DAILY_CASH_MXN: 500000,
  // Límites operativos
  MIN_OPERATING_CASH_MXN: 50000,
  MIN_OPERATING_CASH_USD: 5000,
} as const;

/**
 * Capacidades máximas por ubicación (configurables)
 */
export const DEFAULT_VAULT_CAPACITIES = {
  physical_vault_usd: 100000,
  physical_vault_mxn: 5000000,
  usa_bank_usd: 500000,
  digital_wallets_usdt: 100000,
} as const;

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcula el score de salud del inventario (0 a 1)
 * Un score de 1 significa un inventario perfectamente balanceado
 */
export function calculateInventoryHealthScore(
  position: Omit<TreasuryPosition, 'inventory_health_score' | 'last_updated'>
): number {
  const capacities = DEFAULT_VAULT_CAPACITIES;
  
  // Calcular porcentaje de utilización por cada activo
  const usdVaultUtilization = position.physical_vault_usd / capacities.physical_vault_usd;
  const mxnVaultUtilization = position.physical_vault_mxn / capacities.physical_vault_mxn;
  const usaBankUtilization = position.usa_bank_usd / capacities.usa_bank_usd;
  const usdtUtilization = position.digital_wallets_usdt / capacities.digital_wallets_usdt;
  
  // El score óptimo es cuando cada activo está entre 30% y 70%
  const calculateBalanceScore = (utilization: number): number => {
    if (utilization >= 0.30 && utilization <= 0.70) {
      return 1; // Perfecto
    } else if (utilization < 0.10 || utilization > 0.90) {
      return 0.3; // Crítico
    } else if (utilization < 0.20 || utilization > 0.80) {
      return 0.6; // Advertencia
    }
    return 0.85; // Aceptable
  };
  
  // Promedio ponderado (USD físico tiene más peso por riesgo de seguridad)
  const weights = {
    usdVault: 0.35,
    mxnVault: 0.20,
    usaBank: 0.25,
    usdt: 0.20,
  };
  
  const score = 
    calculateBalanceScore(usdVaultUtilization) * weights.usdVault +
    calculateBalanceScore(mxnVaultUtilization) * weights.mxnVault +
    calculateBalanceScore(usaBankUtilization) * weights.usaBank +
    calculateBalanceScore(usdtUtilization) * weights.usdt;
  
  return Math.round(score * 100) / 100;
}

/**
 * Calcula el precio óptimo de pizarra basado en inventario y competencia
 * Fórmula: P_opt = P_competencia - (Factor_inventario × 0.05)
 */
export function calculateOptimalBoardPrice(
  competitorPrice: number,
  inventoryPercent: number,
  mode: 'buy' | 'sell'
): { price: number; adjustment: number; reason: string } {
  const thresholds = TREASURY_THRESHOLDS;
  
  let adjustment = 0;
  let reason = 'Precio estándar';
  
  if (mode === 'sell') {
    // Vendiendo USD: Si tenemos mucho, bajamos precio para liquidar
    if (inventoryPercent > thresholds.HIGH_INVENTORY_PERCENT) {
      adjustment = -0.10; // 10 centavos abajo
      reason = 'Inventario alto - liquidar';
    } else if (inventoryPercent > thresholds.CRITICAL_HIGH_PERCENT) {
      adjustment = -0.15; // 15 centavos abajo - urgente
      reason = 'Inventario crítico - liquidar urgente';
    } else if (inventoryPercent < thresholds.LOW_INVENTORY_PERCENT) {
      adjustment = 0.05; // 5 centavos arriba - retener
      reason = 'Inventario bajo - retener';
    }
  } else {
    // Comprando USD: Si tenemos poco, subimos precio para atraer
    if (inventoryPercent < thresholds.LOW_INVENTORY_PERCENT) {
      adjustment = 0.10; // 10 centavos arriba para atraer
      reason = 'Escasez - atraer vendedores';
    } else if (inventoryPercent < thresholds.CRITICAL_LOW_PERCENT) {
      adjustment = 0.15; // 15 centavos - urgente
      reason = 'Escasez crítica - atraer urgente';
    } else if (inventoryPercent > thresholds.HIGH_INVENTORY_PERCENT) {
      adjustment = -0.05; // 5 centavos abajo - no necesitamos más
      reason = 'Inventario suficiente';
    }
  }
  
  const price = Math.round((competitorPrice + adjustment) * 100) / 100;
  
  return { price, adjustment, reason };
}

/**
 * Genera alertas basadas en el estado del tesoro
 */
export function generateTreasuryAlerts(
  position: TreasuryPosition,
  exchangeRate: number
): TreasuryAlert[] {
  const alerts: TreasuryAlert[] = [];
  const capacities = DEFAULT_VAULT_CAPACITIES;
  const thresholds = TREASURY_THRESHOLDS;
  
  // Verificar bóveda USD
  const usdVaultPercent = position.physical_vault_usd / capacities.physical_vault_usd;
  if (usdVaultPercent >= thresholds.CRITICAL_HIGH_PERCENT) {
    alerts.push({
      id: `alert-usd-vault-critical-${Date.now()}`,
      type: 'critical',
      category: 'inventory',
      title: '🚨 Bóveda USD al límite',
      message: `Tienes ${position.physical_vault_usd.toLocaleString()} USD en bóveda (${Math.round(usdVaultPercent * 100)}%). Considera transferir a banco USA o convertir a USDT.`,
      action: 'transfer_to_usa',
      created_at: new Date().toISOString(),
      acknowledged: false,
    });
  } else if (usdVaultPercent <= thresholds.CRITICAL_LOW_PERCENT) {
    alerts.push({
      id: `alert-usd-vault-low-${Date.now()}`,
      type: 'warning',
      category: 'inventory',
      title: '⚠️ Escasez de USD en bóveda',
      message: `Solo ${position.physical_vault_usd.toLocaleString()} USD disponibles (${Math.round(usdVaultPercent * 100)}%). Sube el precio de compra para atraer clientes.`,
      action: 'increase_buy_price',
      created_at: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  // Verificar MXN para operaciones
  if (position.physical_vault_mxn < thresholds.MIN_OPERATING_CASH_MXN) {
    alerts.push({
      id: `alert-mxn-low-${Date.now()}`,
      type: 'warning',
      category: 'liquidity',
      title: '⚠️ Efectivo MXN bajo',
      message: `Solo ${position.physical_vault_mxn.toLocaleString()} MXN en caja. Mínimo operativo: ${thresholds.MIN_OPERATING_CASH_MXN.toLocaleString()} MXN.`,
      action: 'replenish_mxn',
      created_at: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  // Oportunidad de arbitraje USDT
  const totalUsdValue = 
    position.physical_vault_usd + 
    position.usa_bank_usd + 
    position.digital_wallets_usdt;
  
  const usdtPercent = position.digital_wallets_usdt / totalUsdValue;
  if (usdtPercent < 0.15 && totalUsdValue > 50000) {
    alerts.push({
      id: `alert-usdt-opportunity-${Date.now()}`,
      type: 'info',
      category: 'opportunity',
      title: '💡 Oportunidad de diversificación',
      message: 'Solo el 15% de tu capital está en USDT. Considera convertir para aprovechar primas del mercado P2P.',
      action: 'convert_to_usdt',
      created_at: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  return alerts;
}

// ============================================
// FUNCIONES DE FIRESTORE
// ============================================

const TREASURY_DOC_PATH = 'treasury_positions/current';

/**
 * Obtiene la posición actual del tesoro
 */
export async function getTreasuryPosition(): Promise<TreasuryPosition | null> {
  try {
    const docRef = doc(db, TREASURY_DOC_PATH);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as TreasuryPosition;
    }
    
    logger.warn('treasury', 'No se encontró posición del tesoro');
    return null;
  } catch (error) {
    logger.error('treasury', 'Error al obtener posición del tesoro', error);
    throw error;
  }
}

/**
 * Suscripción en tiempo real a la posición del tesoro
 */
export function subscribeTreasuryPosition(
  callback: (position: TreasuryPosition | null) => void
): () => void {
  const docRef = doc(db, TREASURY_DOC_PATH);
  
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as TreasuryPosition);
      } else {
        callback(null);
      }
    },
    (error) => {
      logger.error('treasury', 'Error en suscripción del tesoro', error);
      callback(null);
    }
  );
  
  return unsubscribe;
}

/**
 * Actualiza la posición del tesoro
 */
export async function updateTreasuryPosition(
  updates: Partial<Omit<TreasuryPosition, 'last_updated' | 'inventory_health_score'>>
): Promise<void> {
  try {
    const docRef = doc(db, TREASURY_DOC_PATH);
    const currentPos = await getTreasuryPosition();
    
    if (!currentPos) {
      throw new Error('No existe posición del tesoro para actualizar');
    }
    
    // Calcular nuevo health score
    const newPosition = { ...currentPos, ...updates };
    const healthScore = calculateInventoryHealthScore({
      physical_vault_usd: newPosition.physical_vault_usd,
      physical_vault_mxn: newPosition.physical_vault_mxn,
      usa_bank_usd: newPosition.usa_bank_usd,
      digital_wallets_usdt: newPosition.digital_wallets_usdt,
    });
    
    await updateDoc(docRef, {
      ...updates,
      inventory_health_score: healthScore,
      last_updated: serverTimestamp(),
    });
    
    logger.info('treasury', 'Posición del tesoro actualizada', { 
      updates, 
      newHealthScore: healthScore 
    });
  } catch (error) {
    logger.error('treasury', 'Error al actualizar posición del tesoro', error);
    throw error;
  }
}

/**
 * Inicializa la posición del tesoro con valores por defecto
 */
export async function initializeTreasuryPosition(
  initialValues?: Partial<TreasuryPosition>
): Promise<void> {
  try {
    const defaultPosition: Omit<TreasuryPosition, 'last_updated'> = {
      physical_vault_usd: initialValues?.physical_vault_usd ?? 15000,
      physical_vault_mxn: initialValues?.physical_vault_mxn ?? 800000,
      usa_bank_usd: initialValues?.usa_bank_usd ?? 50000,
      digital_wallets_usdt: initialValues?.digital_wallets_usdt ?? 20000,
      inventory_health_score: 0,
    };
    
    defaultPosition.inventory_health_score = calculateInventoryHealthScore(defaultPosition);
    
    const docRef = doc(db, TREASURY_DOC_PATH);
    await setDoc(docRef, {
      ...defaultPosition,
      last_updated: serverTimestamp(),
    });
    
    logger.info('treasury', 'Posición del tesoro inicializada', defaultPosition);
  } catch (error) {
    logger.error('treasury', 'Error al inicializar posición del tesoro', error);
    throw error;
  }
}

/**
 * Registra un movimiento en el tesoro
 */
export async function recordTreasuryMovement(
  movement: Omit<TreasuryMovement, 'id' | 'timestamp' | 'balance_after'>
): Promise<string> {
  try {
    const docRef = doc(db, TREASURY_DOC_PATH);
    const currentPos = await getTreasuryPosition();
    
    if (!currentPos) {
      throw new Error('No existe posición del tesoro');
    }
    
    // Calcular nuevo balance
    const field = `${movement.location}_${movement.currency.toLowerCase()}` as keyof TreasuryPosition;
    const currentBalance = (currentPos[field] as number) || 0;
    const newBalance = movement.type === 'in' 
      ? currentBalance + movement.amount 
      : currentBalance - movement.amount;
    
    if (newBalance < 0) {
      throw new Error(`Balance insuficiente en ${movement.location} para ${movement.currency}`);
    }
    
    // Actualizar posición
    await updateDoc(docRef, {
      [field]: newBalance,
      last_updated: serverTimestamp(),
    });
    
    // Recalcular health score
    const updatedPos = await getTreasuryPosition();
    if (updatedPos) {
      const newHealthScore = calculateInventoryHealthScore(updatedPos);
      await updateDoc(docRef, {
        inventory_health_score: newHealthScore,
      });
    }
    
    const movementId = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('treasury', 'Movimiento registrado', {
      movementId,
      ...movement,
      balance_after: newBalance,
    });
    
    return movementId;
  } catch (error) {
    logger.error('treasury', 'Error al registrar movimiento', error);
    throw error;
  }
}

// ============================================
// MÉTRICAS Y ANÁLISIS
// ============================================

/**
 * Obtiene métricas de salud detalladas del tesoro
 */
export function getTreasuryHealthMetrics(
  position: TreasuryPosition,
  currentExchangeRate: number
): TreasuryHealthMetrics {
  const capacities = DEFAULT_VAULT_CAPACITIES;
  
  // Calcular totales en cada moneda
  const totalUsd = position.physical_vault_usd + position.usa_bank_usd + position.digital_wallets_usdt;
  const totalMxn = position.physical_vault_mxn;
  const totalValueMxn = (totalUsd * currentExchangeRate) + totalMxn;
  const totalValueUsd = totalUsd + (totalMxn / currentExchangeRate);
  
  // Calcular distribución
  const distribution = {
    physical_usd_percent: (position.physical_vault_usd / totalUsd) * 100,
    usa_bank_percent: (position.usa_bank_usd / totalUsd) * 100,
    usdt_percent: (position.digital_wallets_usdt / totalUsd) * 100,
    mxn_vs_total_percent: (totalMxn / totalValueMxn) * 100,
  };
  
  // Calcular utilización de capacidad
  const utilization = {
    physical_vault_usd: (position.physical_vault_usd / capacities.physical_vault_usd) * 100,
    physical_vault_mxn: (position.physical_vault_mxn / capacities.physical_vault_mxn) * 100,
    usa_bank_usd: (position.usa_bank_usd / capacities.usa_bank_usd) * 100,
    digital_wallets_usdt: (position.digital_wallets_usdt / capacities.digital_wallets_usdt) * 100,
  };
  
  // Determinar estado general
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (position.inventory_health_score < 0.5) {
    overallStatus = 'critical';
  } else if (position.inventory_health_score < 0.7) {
    overallStatus = 'warning';
  }
  
  return {
    total_value_usd: Math.round(totalValueUsd * 100) / 100,
    total_value_mxn: Math.round(totalValueMxn * 100) / 100,
    distribution,
    utilization,
    health_score: position.inventory_health_score,
    overall_status: overallStatus,
    recommendations: generateRecommendations(position, utilization),
  };
}

/**
 * Genera recomendaciones basadas en el estado del tesoro
 */
function generateRecommendations(
  position: TreasuryPosition,
  utilization: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  
  if (utilization.physical_vault_usd > 80) {
    recommendations.push('Considera transferir USD a banco USA para reducir riesgo de seguridad');
  }
  
  if (utilization.physical_vault_usd < 20) {
    recommendations.push('Aumenta el precio de compra de USD para atraer más vendedores');
  }
  
  if (utilization.digital_wallets_usdt < 15) {
    recommendations.push('Diversifica a USDT para aprovechar oportunidades de arbitraje crypto');
  }
  
  if (utilization.physical_vault_mxn < 30) {
    recommendations.push('Repón efectivo MXN para mantener operaciones fluidas');
  }
  
  if (position.inventory_health_score < 0.6) {
    recommendations.push('El inventario está desbalanceado - considera redistribuir activos');
  }
  
  return recommendations;
}

// ============================================
// EXPORTACIONES
// ============================================

export type { TreasuryPosition, TreasuryMovement, TreasuryAlert, TreasuryHealthMetrics };
