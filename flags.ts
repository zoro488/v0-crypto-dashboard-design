/**
 * 🎯 FLAGS.TS - CHRONOS SYSTEM
 * 
 * Configuración simplificada de Feature Flags.
 * Compatible con Vercel Flags sin dependencia de Hypertune SDK.
 */

import { flag } from 'flags/next'
import {
  flagFallbacks,
  vercelFlagDefinitions as flagDefinitions,
  type RootFlagValues,
} from './generated/hypertune'

// ============================================
// FLAG DECLARATIONS - CHRONOS SYSTEM
// ============================================

// Helper para crear flags simples
function createSimpleFlag<K extends keyof RootFlagValues>(key: K) {
  return flag<RootFlagValues[K]>({
    key,
    defaultValue: flagFallbacks[key],
    description: flagDefinitions[key]?.description ?? `Flag: ${key}`,
    decide: async () => flagFallbacks[key],
  })
}

// === Core Feature Flags ===
export const exampleFlagFlag = createSimpleFlag('exampleFlag')
export const enableDesignV2Flag = createSimpleFlag('enableDesignV2')
export const enablePremium3DFlag = createSimpleFlag('enablePremium3D')
export const enableAIAssistantFlag = createSimpleFlag('enableAIAssistant')
export const enableAdvancedChartsFlag = createSimpleFlag('enableAdvancedCharts')
export const enableRealTimeSyncFlag = createSimpleFlag('enableRealTimeSync')

// === UI/UX Flags ===
export const enableDarkModeV2Flag = createSimpleFlag('enableDarkModeV2')
export const enableMobileOptimizationsFlag = createSimpleFlag('enableMobileOptimizations')
export const enableExperimentalFeaturesFlag = createSimpleFlag('enableExperimentalFeatures')

// === Business Logic Flags ===
export const enableBancoTransferenciasFlag = createSimpleFlag('enableBancoTransferencias')
export const enableMultiBancoViewFlag = createSimpleFlag('enableMultiBancoView')
export const enableVentasV2Flag = createSimpleFlag('enableVentasV2')
export const enableGYADistributionFlag = createSimpleFlag('enableGYADistribution')

// === Layout/Config Flags ===
export const dashboardLayoutFlag = createSimpleFlag('dashboardLayout')
export const animationSpeedFlag = createSimpleFlag('animationSpeed')

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene todas las flags de una vez para uso en componentes.
 */
export async function getAllFlags(): Promise<RootFlagValues> {
  return { ...flagFallbacks }
}

/**
 * Obtiene flags relacionadas con UI/UX
 */
export async function getUIFlags() {
  return {
    enableDesignV2: flagFallbacks.enableDesignV2,
    enablePremium3D: flagFallbacks.enablePremium3D,
    enableDarkModeV2: flagFallbacks.enableDarkModeV2,
    enableMobileOptimizations: flagFallbacks.enableMobileOptimizations,
    dashboardLayout: flagFallbacks.dashboardLayout,
    animationSpeed: flagFallbacks.animationSpeed,
  }
}

/**
 * Obtiene flags relacionadas con lógica de negocio
 */
export async function getBusinessFlags() {
  return {
    enableBancoTransferencias: flagFallbacks.enableBancoTransferencias,
    enableMultiBancoView: flagFallbacks.enableMultiBancoView,
    enableVentasV2: flagFallbacks.enableVentasV2,
    enableGYADistribution: flagFallbacks.enableGYADistribution,
    enableRealTimeSync: flagFallbacks.enableRealTimeSync,
  }
}
