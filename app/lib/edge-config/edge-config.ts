/**
 * 🌐 VERCEL EDGE CONFIG - CHRONOS SYSTEM
 * 
 * Configuración y utilidades para Edge Config de Vercel.
 * Proporciona almacenamiento key-value ultra-rápido en el edge.
 */

import { createClient, type EdgeConfigClient } from '@vercel/edge-config'

// ============================================
// EDGE CONFIG CLIENT
// ============================================

let edgeConfigClient: EdgeConfigClient | null = null

/**
 * Obtiene el cliente de Edge Config.
 * Usa singleton para reutilizar la conexión.
 */
export function getEdgeConfigClient(): EdgeConfigClient | null {
  if (!process.env.EDGE_CONFIG) {
    console.warn('[EdgeConfig] EDGE_CONFIG not configured')
    return null
  }

  if (!edgeConfigClient) {
    edgeConfigClient = createClient(process.env.EDGE_CONFIG)
  }

  return edgeConfigClient
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene un valor de Edge Config
 */
export async function getEdgeConfigValue<T>(key: string): Promise<T | undefined> {
  const client = getEdgeConfigClient()
  if (!client) return undefined

  try {
    return await client.get<T>(key)
  } catch (error) {
    console.error(`[EdgeConfig] Error getting ${key}:`, error)
    return undefined
  }
}

/**
 * Obtiene múltiples valores de Edge Config
 */
export async function getEdgeConfigValues<T extends object>(
  keys: string[],
): Promise<Partial<T>> {
  const client = getEdgeConfigClient()
  if (!client) return {}

  try {
    const results: Partial<T> = {}
    for (const key of keys) {
      const value = await client.get(key)
      if (value !== undefined) {
        (results as Record<string, unknown>)[key] = value
      }
    }
    return results
  } catch (error) {
    console.error('[EdgeConfig] Error getting values:', error)
    return {}
  }
}

/**
 * Verifica si Edge Config tiene una clave
 */
export async function hasEdgeConfigKey(key: string): Promise<boolean> {
  const client = getEdgeConfigClient()
  if (!client) return false

  try {
    return await client.has(key)
  } catch (error) {
    console.error(`[EdgeConfig] Error checking ${key}:`, error)
    return false
  }
}

/**
 * Obtiene todas las claves de Edge Config
 */
export async function getEdgeConfigDigest(): Promise<string | undefined> {
  const client = getEdgeConfigClient()
  if (!client) return undefined

  try {
    return await client.digest()
  } catch (error) {
    console.error('[EdgeConfig] Error getting digest:', error)
    return undefined
  }
}

// ============================================
// TYPED CONFIG GETTERS
// ============================================

/**
 * Configuración de feature flags desde Edge Config
 */
export interface EdgeConfigFeatureFlags extends Record<string, unknown> {
  enableMaintenance: boolean;
  enableBetaFeatures: boolean;
  maxRequestsPerMinute: number;
  allowedOrigins: string[];
  customBranding: {
    logoUrl: string;
    primaryColor: string;
  };
}

export async function getFeatureFlagsConfig(): Promise<Partial<EdgeConfigFeatureFlags>> {
  return getEdgeConfigValues<EdgeConfigFeatureFlags>([
    'enableMaintenance',
    'enableBetaFeatures',
    'maxRequestsPerMinute',
    'allowedOrigins',
    'customBranding',
  ])
}

/**
 * Configuración de rate limiting desde Edge Config
 */
export interface EdgeConfigRateLimits extends Record<string, unknown> {
  apiRateLimit: number;
  uploadRateLimit: number;
  searchRateLimit: number;
}

export async function getRateLimitsConfig(): Promise<Partial<EdgeConfigRateLimits>> {
  return getEdgeConfigValues<EdgeConfigRateLimits>([
    'apiRateLimit',
    'uploadRateLimit',
    'searchRateLimit',
  ])
}

/**
 * Configuración de AB tests desde Edge Config
 */
export interface EdgeConfigABTests extends Record<string, unknown> {
  activeTests: string[];
  testWeights: Record<string, number>;
  excludedUsers: string[];
}

export async function getABTestsConfig(): Promise<Partial<EdgeConfigABTests>> {
  return getEdgeConfigValues<EdgeConfigABTests>([
    'activeTests',
    'testWeights',
    'excludedUsers',
  ])
}

// ============================================
// MAINTENANCE MODE
// ============================================

/**
 * Verifica si el sistema está en modo mantenimiento
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const value = await getEdgeConfigValue<boolean>('enableMaintenance')
  return value === true
}

/**
 * Obtiene el mensaje de mantenimiento
 */
export async function getMaintenanceMessage(): Promise<string | undefined> {
  return getEdgeConfigValue<string>('maintenanceMessage')
}

export default {
  getEdgeConfigClient,
  getEdgeConfigValue,
  getEdgeConfigValues,
  hasEdgeConfigKey,
  getEdgeConfigDigest,
  getFeatureFlagsConfig,
  getRateLimitsConfig,
  getABTestsConfig,
  isMaintenanceMode,
  getMaintenanceMessage,
}
