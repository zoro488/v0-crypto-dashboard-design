/**
 * Market Live Feed - Sistema de Datos de Mercado en Tiempo Real
 * 
 * Gestiona la colección 'market_live_feed' de Firestore:
 * - Precios de Banxico, Binance, competencia local
 * - Cálculos de arbitraje
 * - Histórico para gráficas
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config'
import { profitLogger as logger } from './utils/logger'
import type { 
  MarketLiveFeed, 
  PriceSource, 
  ComputedArbitrage,
  ArbitrageSignal,
} from './types/profit-engine.types'

// ============================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================

export const MARKET_FEED_CONFIG = {
  // Intervalo de actualización recomendado (15 minutos)
  UPDATE_INTERVAL_MS: 15 * 60 * 1000,
  
  // Precios de fallback si no hay datos
  FALLBACK_PRICES: {
    banxico_fix: 18.50,
    binance_usdt_bid: 18.65,
    street_average_sell: 18.55,
    dxy_index: 104.0,
  } as PriceSource,
  
  // Umbrales de arbitraje
  ARBITRAGE_THRESHOLDS: {
    MIN_CRYPTO_PREMIUM: 0.05,  // 5 centavos mínimo
    MIN_PROFITABLE_SPREAD: 0.10, // 10 centavos para ser rentable
    EXCELLENT_SPREAD: 0.25, // 25 centavos = excelente
  },
} as const

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcula los valores de arbitraje computados
 */
export function calculateComputedArbitrage(sources: PriceSource): ComputedArbitrage {
  const cryptoPremium = sources.binance_usdt_bid - sources.street_average_sell
  const physicalPremium = sources.street_average_sell - sources.banxico_fix
  
  // Es rentable si hay al menos 10 centavos de spread
  const isProfitable = 
    cryptoPremium >= MARKET_FEED_CONFIG.ARBITRAGE_THRESHOLDS.MIN_PROFITABLE_SPREAD ||
    physicalPremium >= MARKET_FEED_CONFIG.ARBITRAGE_THRESHOLDS.MIN_PROFITABLE_SPREAD
  
  return {
    crypto_premium: Math.round(cryptoPremium * 100) / 100,
    physical_premium: Math.round(physicalPremium * 100) / 100,
    is_profitable_to_convert: isProfitable,
  }
}

/**
 * Genera una señal de arbitraje basada en el feed actual
 */
export function calculateArbitrageSignal(feed: MarketLiveFeed): ArbitrageSignal {
  const { sources, computed_arbitrage } = feed
  const { crypto_premium } = computed_arbitrage
  
  // Determinar la señal basada en premiums
  if (crypto_premium >= MARKET_FEED_CONFIG.ARBITRAGE_THRESHOLDS.EXCELLENT_SPREAD) {
    return {
      type: 'convert',
      channel: 'crypto',
      strength: 'strong',
      price_target: sources.binance_usdt_bid,
      reason: `Prima crypto excelente: +$${crypto_premium.toFixed(2)} MXN`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  }
  
  if (crypto_premium >= MARKET_FEED_CONFIG.ARBITRAGE_THRESHOLDS.MIN_PROFITABLE_SPREAD) {
    return {
      type: 'convert',
      channel: 'crypto',
      strength: 'moderate',
      price_target: sources.binance_usdt_bid,
      reason: `Prima crypto rentable: +$${crypto_premium.toFixed(2)} MXN`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  }
  
  if (crypto_premium >= MARKET_FEED_CONFIG.ARBITRAGE_THRESHOLDS.MIN_CRYPTO_PREMIUM) {
    return {
      type: 'sell',
      channel: 'physical',
      strength: 'weak',
      price_target: sources.street_average_sell,
      reason: 'Prima crypto mínima. Vender físico es más eficiente.',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
  }
  
  return {
    type: 'hold',
    channel: 'bank',
    strength: 'weak',
    price_target: sources.banxico_fix,
    reason: 'Sin oportunidad clara de arbitraje. Mantener posición.',
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }
}

// ============================================
// FUNCIONES DE FIRESTORE
// ============================================

const MARKET_FEED_DOC_PATH = 'market_live_feed/current'
const HISTORY_COLLECTION_PATH = 'market_live_feed/current/history'

/**
 * Obtiene el feed de mercado actual
 */
export async function getCurrentMarketFeed(): Promise<MarketLiveFeed | null> {
  try {
    const docRef = doc(db!, MARKET_FEED_DOC_PATH)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as MarketLiveFeed
    }
    
    logger.warn('market-feed', 'No hay feed de mercado actual')
    return null
  } catch (error) {
    logger.error('market-feed', 'Error obteniendo feed de mercado', error)
    throw error
  }
}

/**
 * Suscripción en tiempo real al feed de mercado
 */
export function subscribeToMarketFeed(
  callback: (feed: MarketLiveFeed | null) => void,
): () => void {
  const docRef = doc(db!, MARKET_FEED_DOC_PATH)
  
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as MarketLiveFeed)
      } else {
        callback(null)
      }
    },
    (error) => {
      logger.error('market-feed', 'Error en suscripción', error)
      callback(null)
    },
  )
  
  return unsubscribe
}

/**
 * Actualiza el feed de mercado con nuevos precios
 */
export async function updateMarketFeed(
  sources: Partial<PriceSource>,
  source: 'manual' | 'api' | 'scraper' = 'manual',
): Promise<void> {
  try {
    const currentFeed = await getCurrentMarketFeed()
    const currentSources = currentFeed?.sources ?? MARKET_FEED_CONFIG.FALLBACK_PRICES
    
    // Merge con precios existentes
    const newSources: PriceSource = {
      ...currentSources,
      ...sources,
    }
    
    // Calcular arbitraje
    const computedArbitrage = calculateComputedArbitrage(newSources)
    
    // Crear nuevo feed
    const newFeed: MarketLiveFeed = {
      timestamp: new Date().toISOString(),
      sources: newSources,
      computed_arbitrage: computedArbitrage,
      metadata: {
        source,
        confidence: source === 'api' ? 0.95 : source === 'scraper' ? 0.85 : 0.70,
        last_api_call: source === 'api' ? new Date().toISOString() : currentFeed?.metadata?.last_api_call,
      },
    }
    
    // Guardar en Firestore
    const docRef = doc(db!, MARKET_FEED_DOC_PATH)
    await setDoc(docRef, newFeed)
    
    logger.info('market-feed', 'Feed actualizado', {
      banxico: newSources.banxico_fix,
      binance: newSources.binance_usdt_bid,
      cryptoPremium: computedArbitrage.crypto_premium,
    })
  } catch (error) {
    logger.error('market-feed', 'Error actualizando feed', error)
    throw error
  }
}

/**
 * Inicializa el feed de mercado con valores por defecto
 */
export async function initializeMarketFeed(): Promise<void> {
  try {
    const existingFeed = await getCurrentMarketFeed()
    if (existingFeed) {
      logger.info('market-feed', 'Feed ya existe, no se reinicializa')
      return
    }
    
    const initialFeed: MarketLiveFeed = {
      timestamp: new Date().toISOString(),
      sources: MARKET_FEED_CONFIG.FALLBACK_PRICES,
      computed_arbitrage: calculateComputedArbitrage(MARKET_FEED_CONFIG.FALLBACK_PRICES),
      metadata: {
        source: 'manual',
        confidence: 0.5,
      },
    }
    
    const docRef = doc(db!, MARKET_FEED_DOC_PATH)
    await setDoc(docRef, initialFeed)
    
    logger.info('market-feed', 'Feed inicializado con valores por defecto')
  } catch (error) {
    logger.error('market-feed', 'Error inicializando feed', error)
    throw error
  }
}

/**
 * Registra el feed actual en el histórico
 */
export async function recordMarketHistory(feed: MarketLiveFeed): Promise<string> {
  try {
    const historyRef = collection(db!, HISTORY_COLLECTION_PATH)
    const docRef = await addDoc(historyRef, {
      ...feed,
      recorded_at: serverTimestamp(),
    })
    
    logger.info('market-feed', 'Histórico registrado', { id: docRef.id })
    return docRef.id
  } catch (error) {
    logger.error('market-feed', 'Error registrando histórico', error)
    throw error
  }
}

/**
 * Obtiene el histórico de feeds (para gráficas)
 */
export async function getMarketHistory(
  limitCount: number = 30,
): Promise<MarketLiveFeed[]> {
  try {
    const historyRef = collection(db!, HISTORY_COLLECTION_PATH)
    const q = query(
      historyRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount),
    )
    
    const snapshot = await getDocs(q)
    const feeds = snapshot.docs.map(doc => doc.data() as MarketLiveFeed)
    
    // Ordenar cronológicamente (más antiguo primero)
    return feeds.reverse()
  } catch (error) {
    logger.error('market-feed', 'Error obteniendo histórico', error)
    return []
  }
}

// ============================================
// FUNCIONES DE INTEGRACIÓN CON APIS
// ============================================

/**
 * Estructura para respuesta de API de Banxico
 * (Implementar cuando se integre la API real)
 */
export interface BanxicoApiResponse {
  fecha: string;
  valor: string;
}

/**
 * Estructura para respuesta de Binance P2P
 * (Implementar cuando se integre la API real)
 */
export interface BinanceP2PResponse {
  data: Array<{
    adv: {
      price: string;
      tradeMethods: Array<{ identifier: string }>;
    };
    advertiser: {
      nickName: string;
      monthOrderCount: number;
    };
  }>;
}

/**
 * Placeholder para fetch de Banxico
 * TODO: Implementar con API real
 */
export async function fetchBanxicoRate(): Promise<number> {
  // En producción, esto llamaría a la API de Banxico o Fixer
  logger.warn('market-feed', 'fetchBanxicoRate: Usando valor mock')
  return MARKET_FEED_CONFIG.FALLBACK_PRICES.banxico_fix
}

/**
 * Placeholder para fetch de Binance P2P
 * TODO: Implementar con API real
 */
export async function fetchBinanceP2PRate(): Promise<number> {
  // En producción, esto llamaría a la API pública de Binance P2P
  // GET https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search
  logger.warn('market-feed', 'fetchBinanceP2PRate: Usando valor mock')
  return MARKET_FEED_CONFIG.FALLBACK_PRICES.binance_usdt_bid
}

/**
 * Actualiza automáticamente desde APIs
 * TODO: Conectar con Cloud Functions para ejecución programada
 */
export async function autoUpdateFromApis(): Promise<void> {
  try {
    const [banxicoRate, binanceRate] = await Promise.all([
      fetchBanxicoRate(),
      fetchBinanceP2PRate(),
    ])
    
    await updateMarketFeed({
      banxico_fix: banxicoRate,
      binance_usdt_bid: binanceRate,
    }, 'api')
    
    // Registrar en histórico
    const currentFeed = await getCurrentMarketFeed()
    if (currentFeed) {
      await recordMarketHistory(currentFeed)
    }
  } catch (error) {
    logger.error('market-feed', 'Error en auto-update', error)
    throw error
  }
}
