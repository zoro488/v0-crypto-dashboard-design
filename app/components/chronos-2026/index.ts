/**
 * CHRONOS 2026 - Component Library
 * Exportaciones centralizadas de todos los componentes premium
 */

// Animaciones
export * from './motion'

// Hooks
export * from './hooks'

// Componentes UI
export { default as KPICard } from './KPICard'
export { default as HeroCard } from './HeroCard'
export { default as GlassCard } from './GlassCard'
export { default as BentoGrid } from './BentoGrid'
export { default as ActivityFeed } from './ActivityFeed'
export { default as StatusIndicator } from './StatusIndicator'
export { default as FAB } from './FAB'
export { default as PremiumSheet } from './PremiumSheet'
export { default as PremiumButton } from './PremiumButton'
export { default as PremiumInput } from './PremiumInput'

// Layout
export { default as PremiumSidebar, SidebarProvider, useSidebar } from './PremiumSidebar'
export { default as ParallaxHero } from './ParallaxHero'

// 3D / Visual Effects
export { default as XRBackground } from './XRBackground'
export { default as MouseLiquidOrb } from './MouseLiquidOrb'
export { default as AIPredictiveOrb } from './AIPredictiveOrb'

// Dashboard Principal
export { default as Dashboard2026 } from './Dashboard2026'

// Constants
export { 
  CHRONOS_COLORS, 
  CHRONOS_ANIMATIONS, 
  CHRONOS_GLASS,
  CHRONOS_TYPOGRAPHY,
  CHRONOS_BREAKPOINTS,
  CHRONOS_LAYERS,
  CHRONOS_3D,
  AI_STATES,
} from '@/app/lib/constants/chronos-2026'
