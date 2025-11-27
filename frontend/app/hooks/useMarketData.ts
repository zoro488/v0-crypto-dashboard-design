/**
 * useMarketData - Hook de Datos de Mercado en Tiempo Real
 * 
 * Suscripción a la colección 'market_live_feed' de Firestore
 * para obtener precios, spreads y oportunidades de arbitraje.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/frontend/app/lib/firebase/config';
import { profitLogger as logger } from '@/frontend/app/lib/profit-engine/utils/logger';
import type { 
  MarketLiveFeed, 
  ArbitrageOpportunity,
  PriceSource,
  StrategyMode 
} from '@/frontend/app/lib/profit-engine/types/profit-engine.types';

// ============================================
// TIPOS INTERNOS
// ============================================

interface UseMarketDataState {
  currentFeed: MarketLiveFeed | null;
  historicalFeeds: MarketLiveFeed[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

interface UseMarketDataReturn extends UseMarketDataState {
  // Precios actuales
  prices: {
    banxico: number;
    binanceUsdt: number;
    streetAverage: number;
    dxyIndex: number;
  } | null;
  
  // Análisis de arbitraje
  arbitrage: {
    cryptoPremium: number;
    physicalPremium: number;
    bestChannel: 'crypto' | 'physical' | 'hold';
    isProfitable: boolean;
    opportunity: ArbitrageOpportunity | null;
  } | null;
  
  // Estrategia recomendada
  strategyMode: StrategyMode;
  strategyReason: string;
  
  // Acciones
  refreshData: () => Promise<void>;
  getHistoricalData: (days: number) => Promise<MarketLiveFeed[]>;
}

// ============================================
// CONSTANTES
// ============================================

const MARKET_FEED_COLLECTION = 'market_live_feed';
const CURRENT_FEED_DOC = 'current';
const HISTORICAL_LIMIT = 30; // Últimos 30 registros para gráficas

// Umbrales de arbitraje
const ARBITRAGE_THRESHOLDS = {
  MIN_CRYPTO_PREMIUM_PERCENT: 0.5,  // 0.5% mínimo para considerar crypto
  MIN_PHYSICAL_PREMIUM_PERCENT: 0.3, // 0.3% mínimo para considerar físico
  SIGNIFICANT_OPPORTUNITY_PERCENT: 1.0, // 1% = oportunidad significativa
  EXCELLENT_OPPORTUNITY_PERCENT: 2.0,  // 2% = oportunidad excelente
} as const;

// Tasas de referencia para análisis macro
const MACRO_RATES = {
  // Diferencial de tasas TIIE vs Fed (en puntos base)
  BULLISH_USD_SPREAD_BPS: 450, // Si spread < 450, USD subirá
  BEARISH_USD_SPREAD_BPS: 550, // Si spread > 550, peso fuerte
} as const;

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Calcula la oportunidad de arbitraje entre canales
 */
function calculateArbitrageOpportunity(
  feed: MarketLiveFeed
): ArbitrageOpportunity | null {
  const { sources, computed_arbitrage } = feed;
  
  if (!computed_arbitrage.is_profitable_to_convert) {
    return null;
  }
  
  const cryptoVsPhysical = sources.binance_usdt_bid - sources.street_average_sell;
  const cryptoVsBanxico = sources.binance_usdt_bid - sources.banxico_fix;
  
  // Determinar el mejor canal
  let bestChannel: 'crypto' | 'physical' | 'hold' = 'hold';
  let profitPercent = 0;
  
  if (cryptoVsPhysical > 0) {
    bestChannel = 'crypto';
    profitPercent = (cryptoVsPhysical / sources.street_average_sell) * 100;
  } else if (sources.street_average_sell > sources.banxico_fix * 1.003) {
    bestChannel = 'physical';
    profitPercent = ((sources.street_average_sell - sources.banxico_fix) / sources.banxico_fix) * 100;
  }
  
  // Determinar nivel de oportunidad
  let opportunityLevel: 'low' | 'medium' | 'high' | 'excellent' = 'low';
  if (profitPercent >= ARBITRAGE_THRESHOLDS.EXCELLENT_OPPORTUNITY_PERCENT) {
    opportunityLevel = 'excellent';
  } else if (profitPercent >= ARBITRAGE_THRESHOLDS.SIGNIFICANT_OPPORTUNITY_PERCENT) {
    opportunityLevel = 'high';
  } else if (profitPercent >= ARBITRAGE_THRESHOLDS.MIN_CRYPTO_PREMIUM_PERCENT) {
    opportunityLevel = 'medium';
  }
  
  return {
    id: `arb-${Date.now()}`,
    detected_at: feed.timestamp,
    channel_from: 'physical',
    channel_to: bestChannel === 'crypto' ? 'digital' : 'physical',
    profit_percent: Math.round(profitPercent * 100) / 100,
    profit_per_1000_usd: Math.round(profitPercent * 10 * 100) / 100,
    opportunity_level: opportunityLevel,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
    is_actionable: profitPercent >= ARBITRAGE_THRESHOLDS.MIN_CRYPTO_PREMIUM_PERCENT,
  };
}

/**
 * Determina el modo de estrategia basado en condiciones macro
 */
function determineStrategyMode(
  feed: MarketLiveFeed,
  tiieRate: number = 10.50,
  fedRate: number = 5.25
): { mode: StrategyMode; reason: string } {
  const spreadBps = (tiieRate - fedRate) * 100;
  const { dxy_index } = feed.sources;
  
  // Análisis del DXY (índice del dólar)
  const isDxyStrong = dxy_index > 105;
  const isDxyWeak = dxy_index < 102;
  
  // Análisis del spread de tasas
  if (spreadBps < MACRO_RATES.BULLISH_USD_SPREAD_BPS) {
    return {
      mode: 'LONG_USD_DURATION',
      reason: `Spread de tasas bajo (${spreadBps} bps). El atractivo del peso cae. Mantener USD.`,
    };
  }
  
  if (spreadBps > MACRO_RATES.BEARISH_USD_SPREAD_BPS && !isDxyStrong) {
    return {
      mode: 'HIGH_VELOCITY_SALES',
      reason: `Carry trade fuerte (${spreadBps} bps). Peso sólido. Vender rápido.`,
    };
  }
  
  if (isDxyStrong) {
    return {
      mode: 'LONG_USD_DURATION',
      reason: `DXY fuerte (${dxy_index}). Dólar global al alza. Mantener posiciones USD.`,
    };
  }
  
  return {
    mode: 'NEUTRAL',
    reason: 'Condiciones de mercado neutrales. Operar según demanda local.',
  };
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useMarketData(): UseMarketDataReturn {
  const [state, setState] = useState<UseMarketDataState>({
    currentFeed: null,
    historicalFeeds: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Suscripción al feed actual en tiempo real
  useEffect(() => {
    const docRef = doc(db, MARKET_FEED_COLLECTION, CURRENT_FEED_DOC);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const feedData = docSnap.data() as MarketLiveFeed;
          setState(prev => ({
            ...prev,
            currentFeed: feedData,
            loading: false,
            error: null,
            lastUpdated: new Date(),
          }));
          
          logger.info('market-data', 'Feed de mercado actualizado', {
            banxico: feedData.sources.banxico_fix,
            binance: feedData.sources.binance_usdt_bid,
          });
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: new Error('No hay datos de mercado disponibles'),
          }));
        }
      },
      (error) => {
        logger.error('market-data', 'Error en suscripción de mercado', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    );

    // Cleanup: Cancelar suscripción
    return () => unsubscribe();
  }, []);

  // Cargar datos históricos iniciales
  useEffect(() => {
    const loadHistorical = async () => {
      try {
        const historyRef = collection(db, MARKET_FEED_COLLECTION, CURRENT_FEED_DOC, 'history');
        const q = query(
          historyRef,
          orderBy('timestamp', 'desc'),
          limit(HISTORICAL_LIMIT)
        );
        
        const snapshot = await getDocs(q);
        const feeds = snapshot.docs.map(doc => doc.data() as MarketLiveFeed);
        
        setState(prev => ({
          ...prev,
          historicalFeeds: feeds.reverse(), // Ordenar cronológicamente
        }));
      } catch (error) {
        logger.warn('market-data', 'Error cargando histórico', error);
        // No es crítico, continuar sin histórico
      }
    };

    loadHistorical();
  }, []);

  // Función para refrescar datos manualmente
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const docRef = doc(db, MARKET_FEED_COLLECTION, CURRENT_FEED_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setState(prev => ({
          ...prev,
          currentFeed: docSnap.data() as MarketLiveFeed,
          loading: false,
          lastUpdated: new Date(),
        }));
      }
    } catch (error) {
      logger.error('market-data', 'Error al refrescar datos', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, []);

  // Función para obtener datos históricos específicos
  const getHistoricalData = useCallback(async (days: number): Promise<MarketLiveFeed[]> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const historyRef = collection(db, MARKET_FEED_COLLECTION, CURRENT_FEED_DOC, 'history');
      const q = query(
        historyRef,
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as MarketLiveFeed);
    } catch (error) {
      logger.error('market-data', 'Error obteniendo histórico', error);
      return [];
    }
  }, []);

  // Calcular precios formateados
  const prices = useMemo(() => {
    if (!state.currentFeed) return null;
    
    return {
      banxico: state.currentFeed.sources.banxico_fix,
      binanceUsdt: state.currentFeed.sources.binance_usdt_bid,
      streetAverage: state.currentFeed.sources.street_average_sell,
      dxyIndex: state.currentFeed.sources.dxy_index,
    };
  }, [state.currentFeed]);

  // Calcular análisis de arbitraje
  const arbitrage = useMemo(() => {
    if (!state.currentFeed || !prices) return null;
    
    const opportunity = calculateArbitrageOpportunity(state.currentFeed);
    const cryptoPremium = prices.binanceUsdt - prices.streetAverage;
    const physicalPremium = prices.streetAverage - prices.banxico;
    
    let bestChannel: 'crypto' | 'physical' | 'hold' = 'hold';
    if (cryptoPremium > physicalPremium && cryptoPremium > 0) {
      bestChannel = 'crypto';
    } else if (physicalPremium > 0) {
      bestChannel = 'physical';
    }
    
    return {
      cryptoPremium: Math.round(cryptoPremium * 100) / 100,
      physicalPremium: Math.round(physicalPremium * 100) / 100,
      bestChannel,
      isProfitable: state.currentFeed.computed_arbitrage.is_profitable_to_convert,
      opportunity,
    };
  }, [state.currentFeed, prices]);

  // Determinar estrategia
  const { strategyMode, strategyReason } = useMemo(() => {
    if (!state.currentFeed) {
      return { strategyMode: 'NEUTRAL' as StrategyMode, strategyReason: 'Cargando datos...' };
    }
    
    const result = determineStrategyMode(state.currentFeed);
    return { strategyMode: result.mode, strategyReason: result.reason };
  }, [state.currentFeed]);

  return {
    ...state,
    prices,
    arbitrage,
    strategyMode,
    strategyReason,
    refreshData,
    getHistoricalData,
  };
}

// ============================================
// HOOKS ADICIONALES
// ============================================

/**
 * Hook simplificado solo para precios
 */
export function useCurrentPrices() {
  const { prices, loading, error } = useMarketData();
  return { prices, loading, error };
}

/**
 * Hook solo para oportunidades de arbitraje
 */
export function useArbitrageOpportunities() {
  const { arbitrage, strategyMode, strategyReason, loading } = useMarketData();
  return { arbitrage, strategyMode, strategyReason, loading };
}

export default useMarketData;
