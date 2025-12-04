/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎨 CHRONOS INFINITY - UI COMPONENTS INDEX
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Exportaciones centralizadas de componentes UI premium
 * Sistema de diseño CHRONOS INFINITY 2026
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════════════════
// GLASS CARD 3D
// ════════════════════════════════════════════════════════════════════════════════════════
export {
  default as GlassCard3D,
  KPIGlassCard,
  MetricGlassCard,
  AlertGlassCard,
  HeroGlassCard,
} from './GlassCard3D'
export type { GlassCard3DProps } from './GlassCard3D'

// ════════════════════════════════════════════════════════════════════════════════════════
// MAGNETIC BUTTON
// ════════════════════════════════════════════════════════════════════════════════════════
export {
  default as MagneticButton,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  GoldButton,
  DangerButton,
} from './MagneticButton'
export type { MagneticButtonProps } from './MagneticButton'

// ════════════════════════════════════════════════════════════════════════════════════════
// SPLINE COMPONENTS
// ════════════════════════════════════════════════════════════════════════════════════════
export {
  default as SplineWrapper,
  AIVoiceOrbSpline,
  FirePortalSpline,
  GlassButtonsSpline,
  ParticleNebulaSpline,
  NexBotSpline,
  R4XBotSpline,
  Dropdown3DSpline,
  ParticleLogoSpline,
  SplineLoader,
  SplineErrorFallback,
} from './SplineComponents'
export type { SplineWrapperProps } from './SplineComponents'

// ════════════════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM TOKENS
// ════════════════════════════════════════════════════════════════════════════════════════
export {
  INFINITY_COLORS,
  INFINITY_GRADIENTS,
  INFINITY_ANIMATIONS,
  INFINITY_TYPOGRAPHY,
  INFINITY_SPACING,
  INFINITY_BORDERS,
  INFINITY_SHADOWS,
  INFINITY_BLUR,
  INFINITY_3D,
  INFINITY_Z_INDEX,
  INFINITY_BREAKPOINTS,
  InfinityDesignSystem,
} from '@/app/lib/constants/infinity-design-system'
export type {
  InfinityColor,
  InfinityGradient,
  InfinitySpacing,
  InfinityRadius,
  InfinityShadow,
} from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// AI WIDGET
// ════════════════════════════════════════════════════════════════════════════════════════
export { default as InfinityAIWidget } from './InfinityAIWidget'

// ════════════════════════════════════════════════════════════════════════════════════════
// MOTION VARIANTS
// ════════════════════════════════════════════════════════════════════════════════════════
export * from './motion-variants'
