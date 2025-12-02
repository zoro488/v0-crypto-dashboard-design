/**
 * 🎯 FEATURE FLAGS EXPORTS - CHRONOS SYSTEM
 * 
 * Re-exports de todas las funcionalidades de feature flags.
 */

// Hypertune
export { 
  default as getHypertune, 
  getHypertuneForUser, 
  getHypertuneSource, 
  reinitializeHypertune, 
} from '@/app/lib/hypertune/getHypertune'

// GrowthBook
export { 
  growthBookAdapter,
  gbExampleFlag,
  gbNewDashboardFlag,
  gbPricingExperiment,
  gbItemsPerPage,
  getAllGrowthBookFlags,
} from '@/app/lib/growthbook/growthbook'

// Edge Config
export {
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
} from '@/app/lib/edge-config/edge-config'

// Types
export type { Context, RootFlagValues, User } from '@/generated/hypertune'
