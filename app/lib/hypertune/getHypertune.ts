import 'server-only'
import { unstable_noStore as noStore } from 'next/cache'
import { flagFallbacks, type Context, type RootFlagValues, type RootNode } from '@/generated/hypertune'

/**
 * 🎯 HYPERTUNE SOURCE - CHRONOS SYSTEM
 * 
 * Configuración del source de Hypertune para feature flags.
 * Cuando Hypertune esté completamente configurado, este archivo
 * se conectará con el SDK real.
 */

// Cache de flags
let cachedFlags: RootFlagValues | null = null

/**
 * Crea un objeto RootNode a partir de los valores de flags
 */
function createRootNode(values: RootFlagValues): RootNode {
  return {
    exampleFlag: () => values.exampleFlag,
    enableDesignV2: () => values.enableDesignV2,
    enablePremium3D: () => values.enablePremium3D,
    enableAIAssistant: () => values.enableAIAssistant,
    enableAdvancedCharts: () => values.enableAdvancedCharts,
    enableRealTimeSync: () => values.enableRealTimeSync,
    enableDarkModeV2: () => values.enableDarkModeV2,
    enableMobileOptimizations: () => values.enableMobileOptimizations,
    enableExperimentalFeatures: () => values.enableExperimentalFeatures,
    enableBancoTransferencias: () => values.enableBancoTransferencias,
    enableMultiBancoView: () => values.enableMultiBancoView,
    enableVentasV2: () => values.enableVentasV2,
    enableGYADistribution: () => values.enableGYADistribution,
    dashboardLayout: () => values.dashboardLayout as 'classic' | 'modern' | 'minimal',
    animationSpeed: () => values.animationSpeed as 'slow' | 'normal' | 'fast',
  }
}

/**
 * Obtiene la instancia de Hypertune configurada con el contexto actual.
 * Usa noStore() para asegurar evaluación dinámica en cada request.
 * 
 * @param context - Contexto opcional para sobrescribir valores por defecto
 * @returns Root node de Hypertune para evaluar flags
 * 
 * @example
 * ```tsx
 * const hypertune = await getHypertune();
 * const isEnabled = hypertune.enablePremium3D();
 * ```
 */
export default async function getHypertune(_context?: Partial<Context>): Promise<RootNode> {
  noStore() // Asegurar evaluación dinámica
  
  // Por ahora, usar los valores por defecto
  // Cuando Hypertune esté configurado, esto se conectará con el SDK real
  if (!cachedFlags) {
    cachedFlags = { ...flagFallbacks }
  }

  return createRootNode(cachedFlags)
}

/**
 * Versión con contexto de usuario específico
 */
export async function getHypertuneForUser(_user: {
  id: string;
  name: string;
  email: string;
}): Promise<RootNode> {
  noStore()
  
  // Por ahora, usar los valores por defecto
  if (!cachedFlags) {
    cachedFlags = { ...flagFallbacks }
  }

  return createRootNode(cachedFlags)
}

/**
 * Obtiene los flags cacheados
 */
export function getHypertuneSource(): RootFlagValues {
  return cachedFlags || flagFallbacks
}

/**
 * Fuerza la reinicialización del source (útil para testing)
 */
export async function reinitializeHypertune(): Promise<void> {
  cachedFlags = { ...flagFallbacks }
}
