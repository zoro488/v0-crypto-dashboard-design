/**
 * Chronos Algorithm - Motor de Decisión de Arbitraje
 * 
 * Implementa la lógica del "Triángulo de Arbitraje Chronos":
 * - Canal A (Físico/Retail): Venta en ventanilla
 * - Canal B (Digital/Crypto): Conversión a USDT y venta P2P
 * - Canal C (Macro/Hold): Retención en cuentas USD
 * 
 * Basado en análisis de:
 * - Diferencial de tasas TIIE/Fed
 * - Índice DXY (fuerza del dólar global)
 * - Precios de mercado en tiempo real
 */

import { profitLogger as logger } from './utils/logger';
import type {
  MarketLiveFeed,
  StrategyMode,
  ArbitrageOpportunity,
  ChronosDecision,
  MacroIndicators,
} from './types/profit-engine.types';

// ============================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================

/**
 * Umbrales para el algoritmo de decisión
 */
export const CHRONOS_THRESHOLDS = {
  // Diferencial de tasas (Banxico vs Fed) en puntos base
  SPREAD_BULLISH_USD: 450,  // Si spread < 450 bps, USD subirá
  SPREAD_BEARISH_USD: 550,  // Si spread > 550 bps, peso fuerte
  
  // Índice DXY
  DXY_STRONG: 105,  // DXY > 105 = dólar fuerte globalmente
  DXY_WEAK: 102,    // DXY < 102 = dólar débil
  
  // Primas de arbitraje (en MXN)
  MIN_CRYPTO_PREMIUM: 0.10,  // 10 centavos mínimo para crypto
  MIN_PHYSICAL_PREMIUM: 0.05, // 5 centavos mínimo para físico
  EXCELLENT_PREMIUM: 0.25,   // 25 centavos = oportunidad excelente
  
  // Margen mínimo para operar (%)
  MIN_MARGIN_PERCENT: 0.5,   // 0.5% mínimo
  TARGET_MARGIN_PERCENT: 2.0, // 2% objetivo
  
  // Velocidad de rotación de inventario
  HIGH_VELOCITY_DAYS: 3,     // Menos de 3 días = alta velocidad
  LOW_VELOCITY_DAYS: 10,     // Más de 10 días = baja velocidad
} as const;

/**
 * Tasas de referencia (actualizables)
 */
export const REFERENCE_RATES = {
  TIIE_MX: 10.50,    // Tasa de referencia Banxico
  FED_RATE: 5.25,    // Tasa de referencia Fed
  INFLATION_MX: 4.5, // Inflación anual México
  INFLATION_US: 3.2, // Inflación anual USA
} as const;

// ============================================
// MÓDULO DE DETECCIÓN DE TENDENCIA MACRO
// ============================================

/**
 * Detecta la tendencia macro basada en diferencial de tasas
 */
export function detectMacroTrend(
  tiieRate: number = REFERENCE_RATES.TIIE_MX,
  fedRate: number = REFERENCE_RATES.FED_RATE,
  dxyIndex: number = 104
): {
  trend: 'bullish_usd' | 'bearish_usd' | 'neutral';
  spreadBps: number;
  confidence: number;
  reason: string;
} {
  const spreadBps = (tiieRate - fedRate) * 100;
  
  // Análisis del spread de tasas
  if (spreadBps < CHRONOS_THRESHOLDS.SPREAD_BULLISH_USD) {
    // El atractivo del carry trade mexicano cae
    // Los capitales saldrán de México → Peso se deprecia → USD sube
    return {
      trend: 'bullish_usd',
      spreadBps,
      confidence: Math.min(90, 60 + (CHRONOS_THRESHOLDS.SPREAD_BULLISH_USD - spreadBps) / 5),
      reason: `Spread de tasas bajo (${spreadBps} bps). Carry trade menos atractivo. USD al alza.`,
    };
  }
  
  if (spreadBps > CHRONOS_THRESHOLDS.SPREAD_BEARISH_USD) {
    // El carry trade mexicano es muy atractivo
    // Capitales entran a México → Peso se aprecia → USD baja
    return {
      trend: 'bearish_usd',
      spreadBps,
      confidence: Math.min(90, 60 + (spreadBps - CHRONOS_THRESHOLDS.SPREAD_BEARISH_USD) / 5),
      reason: `Spread de tasas alto (${spreadBps} bps). Carry trade muy atractivo. Peso fuerte.`,
    };
  }
  
  // Factor adicional: DXY
  if (dxyIndex > CHRONOS_THRESHOLDS.DXY_STRONG) {
    return {
      trend: 'bullish_usd',
      spreadBps,
      confidence: 70,
      reason: `DXY fuerte (${dxyIndex}). Dólar global al alza.`,
    };
  }
  
  if (dxyIndex < CHRONOS_THRESHOLDS.DXY_WEAK) {
    return {
      trend: 'bearish_usd',
      spreadBps,
      confidence: 65,
      reason: `DXY débil (${dxyIndex}). Dólar global a la baja.`,
    };
  }
  
  return {
    trend: 'neutral',
    spreadBps,
    confidence: 50,
    reason: 'Condiciones de mercado equilibradas. Sin tendencia clara.',
  };
}

// ============================================
// MÓDULO DE ESTRATEGIA
// ============================================

/**
 * Calcula el modo de estrategia basado en condiciones macro
 */
export function calculateStrategyMode(
  macroTrend: ReturnType<typeof detectMacroTrend>,
  inventoryHealthScore: number,
  liquidityNeed: 'low' | 'medium' | 'high' = 'medium'
): { mode: StrategyMode; reason: string; actions: string[] } {
  const actions: string[] = [];
  
  // Caso 1: Tendencia alcista USD + bajo inventario
  if (macroTrend.trend === 'bullish_usd' && inventoryHealthScore > 0.6) {
    return {
      mode: 'LONG_USD_DURATION',
      reason: macroTrend.reason,
      actions: [
        'NO vender inventario a menos que el margen sea > 3.5%',
        'Acumular USD aprovechando precios actuales',
        'Considerar transferir a cuentas USA para protección',
        'Reducir exposición a MXN',
      ],
    };
  }
  
  // Caso 2: Tendencia bajista USD + necesidad de liquidez
  if (macroTrend.trend === 'bearish_usd' || liquidityNeed === 'high') {
    return {
      mode: 'HIGH_VELOCITY_SALES',
      reason: macroTrend.reason,
      actions: [
        'Vender inventario rápidamente',
        'No acumular USD que se devaluará',
        'Rotar inventario en menos de 3 días',
        'Bajar precios 5-10 centavos para acelerar ventas',
      ],
    };
  }
  
  // Caso 3: Inventario crítico
  if (inventoryHealthScore < 0.4) {
    return {
      mode: 'HIGH_VELOCITY_SALES',
      reason: 'Inventario desbalanceado. Necesita reequilibrar.',
      actions: [
        'Revisar distribución de activos',
        'Transferir fondos entre ubicaciones',
        'Ajustar precios de compra para atraer vendedores',
      ],
    };
  }
  
  // Caso default: Neutral
  return {
    mode: 'NEUTRAL',
    reason: 'Condiciones estables. Operar según demanda local.',
    actions: [
      'Mantener márgenes estándar',
      'Monitorear cambios en tasas',
      'Ajustar según flujo de clientes',
    ],
  };
}

// ============================================
// MÓDULO DE EVALUACIÓN DE CANALES
// ============================================

/**
 * Evalúa los tres canales de arbitraje y recomienda el mejor
 */
export function evaluateArbitrageChannels(
  marketFeed: MarketLiveFeed,
  inventoryUsdPercent: number,
  operatingCosts: number = 0.02 // 2 centavos por default
): {
  bestChannel: 'physical' | 'crypto' | 'hold';
  channels: {
    physical: { netPrice: number; margin: number; recommendation: string };
    crypto: { netPrice: number; margin: number; recommendation: string };
    hold: { projectedGain: number; recommendation: string };
  };
  arbitrageOpportunity: ArbitrageOpportunity | null;
} {
  const { sources, computed_arbitrage } = marketFeed;
  
  // Calcular precios netos (después de costos)
  const physicalNetPrice = sources.street_average_sell - operatingCosts;
  const cryptoNetPrice = sources.binance_usdt_bid - operatingCosts - 0.005; // 0.5% fee Binance aprox
  const banxicoPrice = sources.banxico_fix;
  
  // Calcular márgenes
  const physicalMargin = ((physicalNetPrice - banxicoPrice) / banxicoPrice) * 100;
  const cryptoMargin = ((cryptoNetPrice - banxicoPrice) / banxicoPrice) * 100;
  
  // Evaluar cada canal
  const channels = {
    physical: {
      netPrice: Math.round(physicalNetPrice * 100) / 100,
      margin: Math.round(physicalMargin * 100) / 100,
      recommendation: physicalMargin >= CHRONOS_THRESHOLDS.MIN_MARGIN_PERCENT
        ? 'Rentable para venta en ventanilla'
        : 'Margen bajo - considerar otras opciones',
    },
    crypto: {
      netPrice: Math.round(cryptoNetPrice * 100) / 100,
      margin: Math.round(cryptoMargin * 100) / 100,
      recommendation: cryptoMargin >= CHRONOS_THRESHOLDS.MIN_MARGIN_PERCENT
        ? computed_arbitrage.crypto_premium >= CHRONOS_THRESHOLDS.MIN_CRYPTO_PREMIUM
          ? '¡Oportunidad de arbitraje! Premium crypto disponible'
          : 'Rentable vía P2P crypto'
        : 'Fee crypto reduce margen - preferir físico',
    },
    hold: {
      projectedGain: 0, // Se calcula con proyección
      recommendation: inventoryUsdPercent < 0.3
        ? 'Inventario bajo - no recomendado mantener más'
        : 'Posible si tendencia es alcista',
    },
  };
  
  // Determinar mejor canal
  let bestChannel: 'physical' | 'crypto' | 'hold' = 'hold';
  
  if (cryptoMargin > physicalMargin + 0.2 && cryptoMargin >= CHRONOS_THRESHOLDS.MIN_MARGIN_PERCENT) {
    bestChannel = 'crypto';
  } else if (physicalMargin >= CHRONOS_THRESHOLDS.MIN_MARGIN_PERCENT) {
    bestChannel = 'physical';
  }
  
  // Ajustar por inventario
  if (inventoryUsdPercent > 0.8) {
    // Inventario alto - forzar venta
    bestChannel = cryptoMargin > physicalMargin ? 'crypto' : 'physical';
  }
  
  // Generar oportunidad de arbitraje si aplica
  let arbitrageOpportunity: ArbitrageOpportunity | null = null;
  
  if (computed_arbitrage.is_profitable_to_convert) {
    const profitPercent = Math.max(cryptoMargin, physicalMargin);
    let level: 'low' | 'medium' | 'high' | 'excellent' = 'low';
    
    if (profitPercent >= 2.0) level = 'excellent';
    else if (profitPercent >= 1.0) level = 'high';
    else if (profitPercent >= 0.5) level = 'medium';
    
    arbitrageOpportunity = {
      id: `arb-${Date.now()}`,
      detected_at: marketFeed.timestamp,
      channel_from: 'physical',
      channel_to: bestChannel === 'crypto' ? 'digital' : 'physical',
      profit_percent: profitPercent,
      profit_per_1000_usd: profitPercent * 10,
      opportunity_level: level,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      is_actionable: profitPercent >= CHRONOS_THRESHOLDS.MIN_MARGIN_PERCENT,
    };
  }
  
  return {
    bestChannel,
    channels,
    arbitrageOpportunity,
  };
}

// ============================================
// CLASE PRINCIPAL DEL ALGORITMO
// ============================================

/**
 * Clase principal que orquesta el algoritmo Chronos
 */
export class ChronosAlgorithm {
  private macroIndicators: MacroIndicators;
  
  constructor(indicators?: Partial<MacroIndicators>) {
    this.macroIndicators = {
      tiie_rate: indicators?.tiie_rate ?? REFERENCE_RATES.TIIE_MX,
      fed_rate: indicators?.fed_rate ?? REFERENCE_RATES.FED_RATE,
      dxy_index: indicators?.dxy_index ?? 104,
      inflation_mx: indicators?.inflation_mx ?? REFERENCE_RATES.INFLATION_MX,
      inflation_us: indicators?.inflation_us ?? REFERENCE_RATES.INFLATION_US,
    };
  }
  
  /**
   * Actualiza los indicadores macro
   */
  updateIndicators(indicators: Partial<MacroIndicators>): void {
    this.macroIndicators = { ...this.macroIndicators, ...indicators };
    logger.info('chronos', 'Indicadores macro actualizados', this.macroIndicators);
  }
  
  /**
   * Genera una decisión completa de trading
   */
  generateDecision(
    marketFeed: MarketLiveFeed,
    inventoryHealthScore: number,
    inventoryUsdPercent: number,
    liquidityNeed: 'low' | 'medium' | 'high' = 'medium'
  ): ChronosDecision {
    // 1. Detectar tendencia macro
    const macroTrend = detectMacroTrend(
      this.macroIndicators.tiie_rate,
      this.macroIndicators.fed_rate,
      this.macroIndicators.dxy_index
    );
    
    // 2. Calcular estrategia
    const strategy = calculateStrategyMode(
      macroTrend,
      inventoryHealthScore,
      liquidityNeed
    );
    
    // 3. Evaluar canales de arbitraje
    const channelEvaluation = evaluateArbitrageChannels(
      marketFeed,
      inventoryUsdPercent
    );
    
    // 4. Generar decisión final
    const decision: ChronosDecision = {
      timestamp: new Date().toISOString(),
      macro_trend: macroTrend.trend,
      macro_confidence: macroTrend.confidence,
      strategy_mode: strategy.mode,
      strategy_reason: strategy.reason,
      recommended_actions: strategy.actions,
      best_channel: channelEvaluation.bestChannel,
      channel_details: channelEvaluation.channels,
      arbitrage_opportunity: channelEvaluation.arbitrageOpportunity,
      market_snapshot: {
        banxico_fix: marketFeed.sources.banxico_fix,
        binance_usdt: marketFeed.sources.binance_usdt_bid,
        street_price: marketFeed.sources.street_average_sell,
        spread_bps: macroTrend.spreadBps,
      },
    };
    
    logger.info('chronos', 'Decisión generada', {
      mode: decision.strategy_mode,
      channel: decision.best_channel,
      confidence: decision.macro_confidence,
    });
    
    return decision;
  }
  
  /**
   * Calcula el precio óptimo de pizarra
   */
  calculateOptimalPrice(
    competitorPrice: number,
    inventoryPercent: number,
    mode: 'buy' | 'sell'
  ): { price: number; adjustment: number; reason: string } {
    let adjustment = 0;
    let reason = 'Precio estándar';
    
    if (mode === 'sell') {
      if (inventoryPercent > 0.80) {
        adjustment = -0.10;
        reason = 'Inventario alto - liquidar';
      } else if (inventoryPercent > 0.95) {
        adjustment = -0.15;
        reason = 'Inventario crítico - liquidar urgente';
      } else if (inventoryPercent < 0.20) {
        adjustment = 0.05;
        reason = 'Inventario bajo - retener';
      }
    } else {
      if (inventoryPercent < 0.20) {
        adjustment = 0.10;
        reason = 'Escasez - atraer vendedores';
      } else if (inventoryPercent < 0.10) {
        adjustment = 0.15;
        reason = 'Escasez crítica - atraer urgente';
      } else if (inventoryPercent > 0.80) {
        adjustment = -0.05;
        reason = 'Inventario suficiente';
      }
    }
    
    return {
      price: Math.round((competitorPrice + adjustment) * 100) / 100,
      adjustment,
      reason,
    };
  }
}

// Exportar instancia singleton para uso global
export const chronosAlgorithm = new ChronosAlgorithm();

export default ChronosAlgorithm;
