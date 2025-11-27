/**
 * 🎯 TIPOS E INTERFACES DEL SISTEMA "PANEL PROFIT"
 * Arquitectura Estratégica: Triángulo de Arbitraje Chronos
 * 
 * Este archivo define todas las interfaces necesarias para el sistema
 * de arbitraje financiero USD/MXN/USDT
 */

import { Timestamp } from 'firebase/firestore';

// ===================================================================
// TIPOS BASE DE MERCADO
// ===================================================================

/**
 * Fuentes de precios del mercado en tiempo real
 */
export interface MarketSources {
  /** Tipo de cambio FIX de Banxico */
  banxico_fix: number;
  /** Precio de venta USDT en Binance P2P */
  binance_usdt_bid: number;
  /** Precio promedio de venta en casas de cambio locales */
  street_average_sell: number;
  /** Índice del dólar (DXY) */
  dxy_index: number;
}

/**
 * Cálculo de oportunidades de arbitraje
 */
export interface ArbitrageComputed {
  /** Prima de Crypto vs Físico */
  crypto_premium: number;
  /** Indica si es rentable convertir a crypto */
  is_profitable_to_convert: boolean;
  /** Canal recomendado: 'physical' | 'crypto' | 'hold' */
  recommended_channel: 'physical' | 'crypto' | 'hold';
  /** Porcentaje de ganancia estimada */
  estimated_profit_percent: number;
}

/**
 * Documento principal de market_live_feed
 * Se actualiza cada 15 minutos vía API/Scraping
 */
export interface MarketLiveFeed {
  /** Timestamp de última actualización */
  timestamp: string;
  /** Fuentes de precios */
  sources: MarketSources;
  /** Cálculos de arbitraje computados */
  computed_arbitrage: ArbitrageComputed;
  /** Modo de estrategia actual */
  strategy_mode: StrategyMode;
  /** Alertas activas del mercado */
  alerts: MarketAlert[];
}

// ===================================================================
// TIPOS DE TESORERÍA
// ===================================================================

/**
 * Posiciones de tesorería en tiempo real
 */
export interface TreasuryPositions {
  /** Dólares en banco USA */
  usa_bank_usd: number;
  /** Dólares en bóveda física */
  physical_vault_usd: number;
  /** Pesos en bóveda física */
  physical_vault_mxn: number;
  /** USDT en wallets digitales */
  digital_wallets_usdt: number;
  /** Score de salud del inventario (0-1) */
  inventory_health_score: number;
  /** Última actualización */
  last_updated: string;
}

/**
 * Métricas de inventario derivadas
 */
export interface InventoryMetrics {
  /** Porcentaje de capacidad USD utilizada */
  usd_capacity_percent: number;
  /** Porcentaje de capacidad MXN utilizada */
  mxn_capacity_percent: number;
  /** Indicador de liquidez general */
  liquidity_indicator: 'high' | 'medium' | 'low' | 'critical';
  /** Días estimados de operación con inventario actual */
  estimated_days_operation: number;
}

// ===================================================================
// TIPOS DE ESTRATEGIA MACRO
// ===================================================================

/**
 * Modos de estrategia basados en análisis macro
 * Según diferencial de tasas TIIE (Banxico) vs Fed Rate
 */
export type StrategyMode = 
  | 'LONG_USD_DURATION'      // Spread < 450 BPS: Dólar subirá, HOLD inventario
  | 'HIGH_VELOCITY_SALES'    // Spread > 550 BPS: Peso fuerte, vender rápido
  | 'NEUTRAL';               // Mercado equilibrado

/**
 * Configuración del algoritmo Chronos FX
 */
export interface ChronosFXConfig {
  /** Tasa TIIE de México (Banxico) */
  tiie_mx: number;
  /** Tasa de la Fed (USA) */
  fed_rate: number;
  /** Spread en puntos base */
  spread_bps: number;
  /** Modo de estrategia calculado */
  strategy_mode: StrategyMode;
  /** Margen mínimo requerido para vender en modo LONG_USD */
  min_margin_threshold: number;
}

// ===================================================================
// TIPOS DE PRECIOS DINÁMICOS
// ===================================================================

/**
 * Cálculo de precio óptimo de pizarra
 * P_opt = P_competencia - (Factor_inventario × 0.05)
 */
export interface OptimalPriceCalculation {
  /** Precio de la competencia */
  competition_price: number;
  /** Factor de inventario (0-1) */
  inventory_factor: number;
  /** Precio óptimo calculado */
  optimal_price: number;
  /** Ajuste aplicado */
  price_adjustment: number;
  /** Recomendación: 'lower_price' | 'raise_price' | 'maintain' */
  recommendation: 'lower_price' | 'raise_price' | 'maintain';
}

// ===================================================================
// TIPOS DE ALERTAS
// ===================================================================

export type AlertType = 'flash_crash' | 'arbitrage_opportunity' | 'volatility' | 'inventory' | 'macro';
export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success';

/**
 * Alerta del sistema
 */
export interface MarketAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  /** Acción sugerida */
  suggested_action?: string;
  /** Si la alerta ha sido leída */
  read: boolean;
  /** Datos adicionales de contexto */
  metadata?: Record<string, unknown>;
}

// ===================================================================
// TIPOS DE SIMULACIÓN
// ===================================================================

/**
 * Escenario de simulación de Hold vs Venta
 */
export interface HoldScenario {
  /** Cantidad de USD a analizar */
  usd_amount: number;
  /** Escenario A: Vender hoy */
  sell_today: {
    mxn_received: number;
    exchange_rate: number;
  };
  /** Escenario B: Hold X días */
  hold_scenario: {
    projected_mxn: number;
    projected_rate: number;
    hold_days: number;
    confidence_level: number; // 0-100%
  };
  /** Diferencia potencial */
  potential_gain: number;
  /** Recomendación del sistema */
  recommendation: 'sell' | 'hold';
  /** Razón de la recomendación */
  reasoning: string;
}

// ===================================================================
// TIPOS DE INDICADORES TÉCNICOS
// ===================================================================

/**
 * Indicadores técnicos completos
 */
export interface TechnicalIndicators {
  rsi: RSIIndicator;
  macd: MACDIndicator;
  bollinger: BollingerBands;
  sma: SMAIndicator;
  trend: TrendAnalysis;
}

export interface RSIIndicator {
  value: number;
  period: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

export interface MACDIndicator {
  value: number;
  signal: number;
  histogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface SMAIndicator {
  sma20: number;
  sma50: number;
  sma200: number;
  /** Proyección basada en SMA */
  projection_30d: number;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'sideways';
  strength: number; // 0-100
  support_level: number;
  resistance_level: number;
}

// ===================================================================
// TIPOS DE TRANSACCIONES
// ===================================================================

export type TransactionChannel = 'physical' | 'crypto' | 'bank_transfer';
export type TransactionType = 'buy' | 'sell' | 'convert';

/**
 * Registro de transacción de arbitraje
 */
export interface ArbitrageTransaction {
  id: string;
  timestamp: string;
  channel: TransactionChannel;
  type: TransactionType;
  usd_amount: number;
  mxn_amount: number;
  exchange_rate: number;
  fee: number;
  net_profit: number;
  profit_percent: number;
  notes?: string;
}

// ===================================================================
// TIPOS DE CONFIGURACIÓN
// ===================================================================

/**
 * Configuración del Panel Profit
 */
export interface PanelProfitConfig {
  /** Intervalo de actualización de precios (ms) */
  refresh_interval: number;
  /** Umbral de alerta de arbitraje (%) */
  arbitrage_alert_threshold: number;
  /** Capacidad máxima de USD en bóveda */
  max_usd_vault_capacity: number;
  /** Capacidad máxima de MXN en bóveda */
  max_mxn_vault_capacity: number;
  /** Costo operativo por transacción */
  operational_cost_per_tx: number;
  /** Token de API de Banxico */
  banxico_token?: string;
  /** Notificaciones push habilitadas */
  push_notifications_enabled: boolean;
}

// ===================================================================
// TIPOS DE RESPUESTA DE HOOKS
// ===================================================================

export interface UseMarketDataResult {
  /** Datos de mercado en vivo */
  marketData: MarketLiveFeed | null;
  /** Posiciones de tesorería */
  treasury: TreasuryPositions | null;
  /** Estado de carga */
  loading: boolean;
  /** Error si existe */
  error: string | null;
  /** Forzar actualización */
  refresh: () => Promise<void>;
  /** Último timestamp de actualización */
  lastUpdate: Date | null;
}

export interface UseArbitrageCalculatorResult {
  /** Calcular escenario de hold */
  calculateHoldScenario: (amount: number, days: number) => HoldScenario;
  /** Calcular precio óptimo */
  calculateOptimalPrice: (competitionPrice: number, inventoryLevel: number) => OptimalPriceCalculation;
  /** Detectar oportunidades de arbitraje */
  detectArbitrageOpportunities: () => ArbitrageComputed;
}

// ===================================================================
// TIPOS DE PROPS DE COMPONENTES
// ===================================================================

export interface ProfitCommandCenterProps {
  /** Configuración personalizada */
  config?: Partial<PanelProfitConfig>;
  /** Callback cuando se detecta oportunidad de arbitraje */
  onArbitrageOpportunity?: (opportunity: ArbitrageComputed) => void;
  /** Callback cuando se genera alerta */
  onAlert?: (alert: MarketAlert) => void;
}

export interface ArbitrageGaugeProps {
  /** Datos de arbitraje computados */
  arbitrageData: ArbitrageComputed;
  /** Si mostrar animación de oportunidad */
  showOpportunityGlow?: boolean;
}

export interface HoldCalculatorProps {
  /** Tasa de cambio actual */
  currentRate: number;
  /** Proyección a 30 días */
  projection30d: number;
  /** Modo de estrategia actual */
  strategyMode: StrategyMode;
  /** Callback cuando se completa simulación */
  onSimulate?: (scenario: HoldScenario) => void;
}

export interface TrendForecastChartProps {
  /** Datos históricos */
  historicalData: Array<{ date: string; value: number }>;
  /** Línea de proyección SMA */
  smaProjection?: number;
  /** Altura del gráfico */
  height?: number;
  /** Mostrar bandas de Bollinger */
  showBollingerBands?: boolean;
}

export interface TickerCardProps {
  /** Título del ticker */
  title: string;
  /** Valor actual */
  value: number;
  /** Cambio porcentual */
  change?: number;
  /** Variante de color */
  variant: 'physical' | 'crypto' | 'banxico';
  /** Si está destacado como oportunidad */
  highlighted?: boolean;
  /** Mensaje de oportunidad */
  opportunityMessage?: string;
}
