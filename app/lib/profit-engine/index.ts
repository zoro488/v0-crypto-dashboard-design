/**
 * Profit Engine - Exportaciones principales
 * 
 * Sistema completo de arbitraje financiero para el Panel Profit
 */

// Tipos
export * from './types/profit-engine.types'

// Market Feed
export {
  getCurrentMarketFeed,
  subscribeToMarketFeed,
  updateMarketFeed,
  initializeMarketFeed,
  recordMarketHistory,
  calculateArbitrageSignal,
  MARKET_FEED_CONFIG,
} from './market-feed'

// Treasury
export {
  getTreasuryPosition,
  subscribeTreasuryPosition,
  updateTreasuryPosition,
  initializeTreasuryPosition,
  recordTreasuryMovement,
  generateTreasuryAlerts,
  getTreasuryHealthMetrics,
  calculateOptimalBoardPrice,
  calculateInventoryHealthScore,
  TREASURY_THRESHOLDS,
  DEFAULT_VAULT_CAPACITIES,
} from './treasury'

// Chronos Algorithm (Detector de Tendencia Macro)
export {
  ChronosAlgorithm,
  detectMacroTrend,
  calculateStrategyMode,
  evaluateArbitrageChannels,
} from './chronos-algorithm'
