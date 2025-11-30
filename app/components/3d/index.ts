/**
 * Chronos Singularity - Sistema 3D Completo
 * 
 * Este archivo centraliza todas las exportaciones del sistema 3D
 * incluyendo Zero Force y los componentes de Chronos Singularity.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ZERO FORCE - COMPONENTES 3D
// ═══════════════════════════════════════════════════════════════════════════════

export { ZeroAvatar } from './ZeroAvatar'
export type { ZeroAvatarProps, ZeroState } from './ZeroAvatar'

export { ZeroCombatScene } from './ZeroCombatScene'
export type { ZeroCombatSceneProps } from './ZeroCombatScene'

export { ZeroEnvironment } from './ZeroEnvironment'
export type { ZeroEnvironmentProps, EffectSettings } from './ZeroEnvironment'

// ═══════════════════════════════════════════════════════════════════════════════
// ZERO FORCE - WIDGETS UI
// ═══════════════════════════════════════════════════════════════════════════════

export { ZeroChatWidget } from './ZeroChatWidget'
export type { ZeroChatWidgetProps, ChatMessage } from './ZeroChatWidget'

// ═══════════════════════════════════════════════════════════════════════════════
// ZERO FORCE - PANEL COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════

export { ZeroPanel } from './ZeroPanel'
export type { ZeroPanelProps, LogEntry, ExportData, HUDStats } from './ZeroPanel'

// ═══════════════════════════════════════════════════════════════════════════════
// CHRONOS SINGULARITY - COMPONENTES PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

// Logo con partículas GPGPU que se forman desde imagen
export { SingularityLogo, SingularityLogoScene } from './SingularityLogo'

// Iconos de navegación 3D usando Spline
export { NavIcons3D, NavBar3D, SplineIconsScene } from './NavIcons3D'

// Agente IA 3D con Spline + fallback procedural
export { AIAgentScene, AIBotWidget } from './AIAgentScene'

// ═══════════════════════════════════════════════════════════════════════════════
// CHRONOS ULTRA PREMIUM - COMPONENTES VISUALES AVANZADOS
// ═══════════════════════════════════════════════════════════════════════════════

// Globo 3D para visualización de distribución global
export { AnalyticsGlobe3D } from './AnalyticsGlobe3D'
export type { DataPoint as GlobeDataPoint, AnalyticsGlobe3DProps } from './AnalyticsGlobe3D'

// Visualizador de workflows 3D interactivo
export { WorkflowVisualizer3D } from './WorkflowVisualizer3D'
export type { 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowVisualizer3DProps, 
} from './WorkflowVisualizer3D'

// Fondos premium con orbes animados
export { 
  PremiumOrbBackground, 
  DashboardBackground, 
  LoginBackground, 
  CyberpunkBackground, 
} from './PremiumOrbBackground'
export type { 
  PremiumOrbBackgroundProps, 
  ColorScheme as OrbColorScheme, 
} from './PremiumOrbBackground'

// Orbe Spline Premium con AI integrado
export { PremiumSplineOrb } from './PremiumSplineOrb'

// ═══════════════════════════════════════════════════════════════════════════════
// SHADERS
// ═══════════════════════════════════════════════════════════════════════════════

// Los shaders se importan como side-effect en ZeroAvatar
// export { ZeroEyeMaterial } from './shaders/ZeroEyeShader'
