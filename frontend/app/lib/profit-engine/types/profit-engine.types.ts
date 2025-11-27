/**
 * Profit Engine Types - Definiciones de tipos para el sistema Panel Profit
 * 
 * Tipos para:
 * - Market Live Feed (datos de mercado en tiempo real)
 * - Treasury Positions (posiciones del tesoro)
 * - Arbitrage Opportunities (oportunidades de arbitraje)
 * - Chronos Algorithm (algoritmo de decisión)
 */

// ============================================
// TIPOS DE MERCADO
// ============================================

/**
 * Fuentes de precio de mercado
 */
export interface PriceSource {
  banxico_fix: number;           // Tipo de cambio oficial Banxico
  binance_usdt_bid: number;      // Precio de venta USDT en Binance P2P
  street_average_sell: number;   // Precio promedio de competencia local
  dxy_index: number;             // Índice del dólar global (DXY)
}

/**
 * Datos computados de arbitraje
 */
export interface ComputedArbitrage {
  crypto_premium: number;        // Prima crypto vs físico
  physical_premium: number;      // Prima físico vs Banxico
  is_profitable_to_convert: boolean;
}

/**
 * Feed de mercado en tiempo real
 * Colección: market_live_feed
 */
export interface MarketLiveFeed {
  timestamp: string;             // ISO 8601
  sources: PriceSource;
  computed_arbitrage: ComputedArbitrage;
  metadata?: {
    source: 'manual' | 'api' | 'scraper';
    confidence: number;          // 0-1
    last_api_call?: string;
  };
}

// ============================================
// TIPOS DEL TESORO
// ============================================

/**
 * Posición actual del tesoro
 * Documento: treasury_positions/current
 */
export interface TreasuryPosition {
  usa_bank_usd: number;          // Dólares en banco USA
  physical_vault_usd: number;    // Dólares en bóveda física
  physical_vault_mxn: number;    // Pesos en bóveda física
  digital_wallets_usdt: number;  // USDT en wallets digitales
  inventory_health_score: number; // Score de salud 0-1
  last_updated?: Date | { seconds: number; nanoseconds: number };
}

/**
 * Movimiento en el tesoro
 */
export interface TreasuryMovement {
  id: string;
  type: 'in' | 'out' | 'transfer';
  currency: 'USD' | 'MXN' | 'USDT';
  amount: number;
  location: 'usa_bank' | 'physical_vault' | 'digital_wallets';
  description: string;
  reference?: string;
  timestamp: string;
  balance_after: number;
  user_id?: string;
}

/**
 * Alerta del tesoro
 */
export interface TreasuryAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'inventory' | 'liquidity' | 'opportunity' | 'security';
  title: string;
  message: string;
  action?: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

/**
 * Métricas de salud detalladas del tesoro
 */
export interface TreasuryHealthMetrics {
  total_value_usd: number;
  total_value_mxn: number;
  distribution: {
    physical_usd_percent: number;
    usa_bank_percent: number;
    usdt_percent: number;
    mxn_vs_total_percent: number;
  };
  utilization: {
    physical_vault_usd: number;
    physical_vault_mxn: number;
    usa_bank_usd: number;
    digital_wallets_usdt: number;
  };
  health_score: number;
  overall_status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

// ============================================
// TIPOS DE ARBITRAJE
// ============================================

/**
 * Modos de estrategia del algoritmo Chronos
 */
export type StrategyMode = 
  | 'LONG_USD_DURATION'     // Mantener USD - tendencia alcista
  | 'HIGH_VELOCITY_SALES'   // Vender rápido - tendencia bajista
  | 'NEUTRAL';              // Sin tendencia clara

/**
 * Oportunidad de arbitraje detectada
 */
export interface ArbitrageOpportunity {
  id: string;
  detected_at: string;
  channel_from: 'physical' | 'digital' | 'usa_bank';
  channel_to: 'physical' | 'digital' | 'usa_bank';
  profit_percent: number;
  profit_per_1000_usd: number;
  opportunity_level: 'low' | 'medium' | 'high' | 'excellent';
  expires_at: string;
  is_actionable: boolean;
}

/**
 * Señal de arbitraje
 */
export interface ArbitrageSignal {
  type: 'buy' | 'sell' | 'hold' | 'convert';
  channel: 'physical' | 'crypto' | 'bank';
  strength: 'weak' | 'moderate' | 'strong';
  price_target: number;
  stop_loss?: number;
  take_profit?: number;
  reason: string;
  expires_at: string;
}

// ============================================
// TIPOS DEL ALGORITMO CHRONOS
// ============================================

/**
 * Indicadores macroeconómicos para el algoritmo
 */
export interface MacroIndicators {
  tiie_rate: number;      // Tasa de referencia Banxico
  fed_rate: number;       // Tasa de referencia Fed
  dxy_index: number;      // Índice del dólar global
  inflation_mx: number;   // Inflación México
  inflation_us: number;   // Inflación USA
}

/**
 * Decisión completa del algoritmo Chronos
 */
export interface ChronosDecision {
  timestamp: string;
  macro_trend: 'bullish_usd' | 'bearish_usd' | 'neutral';
  macro_confidence: number;
  strategy_mode: StrategyMode;
  strategy_reason: string;
  recommended_actions: string[];
  best_channel: 'physical' | 'crypto' | 'hold';
  channel_details: {
    physical: { netPrice: number; margin: number; recommendation: string };
    crypto: { netPrice: number; margin: number; recommendation: string };
    hold: { projectedGain: number; recommendation: string };
  };
  arbitrage_opportunity: ArbitrageOpportunity | null;
  market_snapshot: {
    banxico_fix: number;
    binance_usdt: number;
    street_price: number;
    spread_bps: number;
  };
}

/**
 * Configuración de alertas push
 */
export interface PushAlertConfig {
  type: 'flash_crash' | 'opportunity' | 'inventory' | 'macro_change';
  threshold: number;
  enabled: boolean;
  channels: ('push' | 'email' | 'sms')[];
}

/**
 * Historial de decisiones para análisis
 */
export interface DecisionHistory {
  id: string;
  decision: ChronosDecision;
  outcome?: {
    action_taken: string;
    actual_result: number;
    projected_result: number;
    deviation_percent: number;
  };
  created_at: string;
}

// ============================================
// TIPOS DE CONFIGURACIÓN
// ============================================

/**
 * Configuración del feed de mercado
 */
export interface MarketFeedConfig {
  update_interval_ms: number;
  sources: {
    banxico: { enabled: boolean; api_url?: string };
    binance: { enabled: boolean; pairs: string[] };
    scraper: { enabled: boolean; urls: string[] };
  };
  fallback_prices: PriceSource;
}

/**
 * Umbrales de operación
 */
export interface OperationalThresholds {
  high_inventory_percent: number;
  low_inventory_percent: number;
  critical_low_percent: number;
  critical_high_percent: number;
  max_cash_transaction_mxn: number;
  max_daily_cash_mxn: number;
  min_operating_cash_mxn: number;
  min_operating_cash_usd: number;
}

/**
 * Capacidades de bóveda
 */
export interface VaultCapacities {
  physical_vault_usd: number;
  physical_vault_mxn: number;
  usa_bank_usd: number;
  digital_wallets_usdt: number;
}
