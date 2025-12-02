/**
 * 🎯 HYPERTUNE GENERATED TYPES - CHRONOS SYSTEM
 * 
 * Este archivo contiene los tipos generados para Hypertune.
 * Se regenerará automáticamente con `npx hypertune`.
 * 
 * @generated
 */

// ============================================
// CONTEXT TYPES
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Context {
  environment: string;
  user: User;
}

// ============================================
// FLAG DEFINITIONS
// ============================================

export interface RootFlagValues {
  // Feature Flags para CHRONOS
  exampleFlag: boolean;
  enableDesignV2: boolean;
  enablePremium3D: boolean;
  enableAIAssistant: boolean;
  enableAdvancedCharts: boolean;
  enableRealTimeSync: boolean;
  enableDarkModeV2: boolean;
  enableMobileOptimizations: boolean;
  enableExperimentalFeatures: boolean;
  // Bancos
  enableBancoTransferencias: boolean;
  enableMultiBancoView: boolean;
  // Ventas
  enableVentasV2: boolean;
  enableGYADistribution: boolean;
  // Dashboard
  dashboardLayout: 'classic' | 'modern' | 'minimal';
  animationSpeed: 'slow' | 'normal' | 'fast';
}

// ============================================
// FLAG FALLBACKS (valores por defecto)
// ============================================

export const flagFallbacks: RootFlagValues = {
  exampleFlag: false,
  enableDesignV2: true,
  enablePremium3D: true,
  enableAIAssistant: true,
  enableAdvancedCharts: true,
  enableRealTimeSync: true,
  enableDarkModeV2: true,
  enableMobileOptimizations: true,
  enableExperimentalFeatures: false,
  enableBancoTransferencias: true,
  enableMultiBancoView: true,
  enableVentasV2: true,
  enableGYADistribution: true,
  dashboardLayout: 'modern',
  animationSpeed: 'normal',
}

// ============================================
// VERCEL FLAG DEFINITIONS
// ============================================

export const vercelFlagDefinitions = {
  exampleFlag: {
    key: 'exampleFlag',
    description: 'Example feature flag for testing',
    defaultValue: false,
    options: [
      { value: true, label: 'Enabled' },
      { value: false, label: 'Disabled' },
    ],
  },
  enableDesignV2: {
    key: 'enableDesignV2',
    description: 'Enable new V2 design system with glassmorphism',
    defaultValue: true,
    options: [
      { value: true, label: 'V2 Design' },
      { value: false, label: 'V1 Design' },
    ],
  },
  enablePremium3D: {
    key: 'enablePremium3D',
    description: 'Enable 3D Spline components and animations',
    defaultValue: true,
    options: [
      { value: true, label: '3D Enabled' },
      { value: false, label: '3D Disabled' },
    ],
  },
  enableAIAssistant: {
    key: 'enableAIAssistant',
    description: 'Enable floating AI assistant widget',
    defaultValue: true,
    options: [
      { value: true, label: 'AI Enabled' },
      { value: false, label: 'AI Disabled' },
    ],
  },
  enableAdvancedCharts: {
    key: 'enableAdvancedCharts',
    description: 'Enable advanced Recharts visualizations',
    defaultValue: true,
    options: [
      { value: true, label: 'Advanced Charts' },
      { value: false, label: 'Basic Charts' },
    ],
  },
  enableRealTimeSync: {
    key: 'enableRealTimeSync',
    description: 'Enable real-time Firestore sync',
    defaultValue: true,
    options: [
      { value: true, label: 'Real-time' },
      { value: false, label: 'Manual refresh' },
    ],
  },
  enableDarkModeV2: {
    key: 'enableDarkModeV2',
    description: 'Enable enhanced dark mode with better contrasts',
    defaultValue: true,
    options: [
      { value: true, label: 'Dark V2' },
      { value: false, label: 'Dark V1' },
    ],
  },
  enableMobileOptimizations: {
    key: 'enableMobileOptimizations',
    description: 'Enable mobile-specific optimizations',
    defaultValue: true,
    options: [
      { value: true, label: 'Optimized' },
      { value: false, label: 'Standard' },
    ],
  },
  enableExperimentalFeatures: {
    key: 'enableExperimentalFeatures',
    description: 'Enable experimental beta features',
    defaultValue: false,
    options: [
      { value: true, label: 'Experimental' },
      { value: false, label: 'Stable' },
    ],
  },
  enableBancoTransferencias: {
    key: 'enableBancoTransferencias',
    description: 'Enable inter-bank transfers feature',
    defaultValue: true,
    options: [
      { value: true, label: 'Enabled' },
      { value: false, label: 'Disabled' },
    ],
  },
  enableMultiBancoView: {
    key: 'enableMultiBancoView',
    description: 'Enable multi-bank dashboard view',
    defaultValue: true,
    options: [
      { value: true, label: 'Multi View' },
      { value: false, label: 'Single View' },
    ],
  },
  enableVentasV2: {
    key: 'enableVentasV2',
    description: 'Enable new sales module V2',
    defaultValue: true,
    options: [
      { value: true, label: 'V2' },
      { value: false, label: 'V1' },
    ],
  },
  enableGYADistribution: {
    key: 'enableGYADistribution',
    description: 'Enable automatic GYA distribution to 3 banks',
    defaultValue: true,
    options: [
      { value: true, label: 'Auto GYA' },
      { value: false, label: 'Manual' },
    ],
  },
  dashboardLayout: {
    key: 'dashboardLayout',
    description: 'Dashboard layout style',
    defaultValue: 'modern',
    options: [
      { value: 'classic', label: 'Classic' },
      { value: 'modern', label: 'Modern' },
      { value: 'minimal', label: 'Minimal' },
    ],
  },
  animationSpeed: {
    key: 'animationSpeed',
    description: 'UI animation speed',
    defaultValue: 'normal',
    options: [
      { value: 'slow', label: 'Slow' },
      { value: 'normal', label: 'Normal' },
      { value: 'fast', label: 'Fast' },
    ],
  },
}

// ============================================
// HYPERTUNE INITIALIZATION
// ============================================

/**
 * Obtener los valores de flags por defecto
 * Usar con el SDK de Hypertune cuando esté configurado
 */
export function getDefaultFlags(): RootFlagValues {
  return { ...flagFallbacks }
}

// ============================================
// ROOT NODE TYPE
// ============================================

export interface RootNode {
  exampleFlag: () => boolean;
  enableDesignV2: () => boolean;
  enablePremium3D: () => boolean;
  enableAIAssistant: () => boolean;
  enableAdvancedCharts: () => boolean;
  enableRealTimeSync: () => boolean;
  enableDarkModeV2: () => boolean;
  enableMobileOptimizations: () => boolean;
  enableExperimentalFeatures: () => boolean;
  enableBancoTransferencias: () => boolean;
  enableMultiBancoView: () => boolean;
  enableVentasV2: () => boolean;
  enableGYADistribution: () => boolean;
  dashboardLayout: () => 'classic' | 'modern' | 'minimal';
  animationSpeed: () => 'slow' | 'normal' | 'fast';
}

export default { getDefaultFlags, flagFallbacks, vercelFlagDefinitions }
