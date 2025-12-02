/**
 * 🧪 GROWTHBOOK CONFIGURATION - CHRONOS SYSTEM
 * 
 * Configuración de GrowthBook para A/B testing y feature flags.
 * Integrado con Vercel Flags SDK.
 */

import { createGrowthbookAdapter } from '@flags-sdk/growthbook'
import { flag } from 'flags/next'

// ============================================
// GROWTHBOOK ADAPTER
// ============================================

/**
 * Adapter de GrowthBook para Vercel Flags SDK.
 * Permite usar feature flags y experimentos de GrowthBook.
 */
export const growthBookAdapter = createGrowthbookAdapter({
  clientKey: process.env.GROWTHBOOK_CLIENT_KEY || '',
})

// ============================================
// GROWTHBOOK FLAGS
// ============================================

/**
 * Ejemplo de flag con GrowthBook
 */
export const gbExampleFlag = flag<boolean>({
  key: 'gb-example-flag',
  defaultValue: false,
  description: 'GrowthBook example feature flag',
  decide: async () => false,
})

/**
 * Flag para nuevo diseño de dashboard
 */
export const gbNewDashboardFlag = flag<boolean>({
  key: 'gb-new-dashboard',
  defaultValue: false,
  description: 'Enable new dashboard design from GrowthBook',
  decide: async () => false,
})

/**
 * Flag para experimento de pricing
 */
export const gbPricingExperiment = flag<string>({
  key: 'gb-pricing-experiment',
  defaultValue: 'control',
  description: 'Pricing page A/B test',
  options: [
    { value: 'control', label: 'Control' },
    { value: 'variant-a', label: 'Variant A' },
    { value: 'variant-b', label: 'Variant B' },
  ],
  decide: async () => 'control',
})

/**
 * Flag para número de items por página
 */
export const gbItemsPerPage = flag<number>({
  key: 'gb-items-per-page',
  defaultValue: 10,
  description: 'Number of items to show per page',
  options: [
    { value: 10, label: '10 items' },
    { value: 25, label: '25 items' },
    { value: 50, label: '50 items' },
  ],
  decide: async () => 10,
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene todas las flags de GrowthBook
 */
export async function getAllGrowthBookFlags() {
  const [
    exampleFlag,
    newDashboard,
    pricingExperiment,
    itemsPerPage,
  ] = await Promise.all([
    gbExampleFlag(),
    gbNewDashboardFlag(),
    gbPricingExperiment(),
    gbItemsPerPage(),
  ])

  return {
    exampleFlag,
    newDashboard,
    pricingExperiment,
    itemsPerPage,
  }
}

export default growthBookAdapter
