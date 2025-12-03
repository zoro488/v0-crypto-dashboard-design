/**
 * Chronos Singularity - Sistema 3D Completo
 * 
 * Este archivo centraliza todas las exportaciones del sistema 3D
 * incluyendo Zero Force y los componentes de Chronos Singularity.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL 3D WRAPPER - INTEGRACIÓN UNIVERSAL
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  Panel3DWrapper,
  Dashboard3DPreset,
  Analytics3DPreset,
  Workflow3DPreset,
  AI3DPreset,
} from './Panel3DWrapper'
export type { Component3DType } from './Panel3DWrapper'

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
// AI VOICE ORB - WIDGET FLOTANTE 3D
// ═══════════════════════════════════════════════════════════════════════════════

// Orbe AI con modelo GLTF real
export { AIVoiceOrbGLTF } from './models/AIVoiceOrbGLTF'
export type { OrbState as AIVoiceOrbState } from './models/AIVoiceOrbGLTF'

// Orbe AI procedural (fallback)
export { AIVoiceOrb } from './models/AIVoiceOrb'
export type { OrbState } from './models/AIVoiceOrb'

// Widget flotante completo
export { FloatingAIOrb } from './FloatingAIOrb'

// ═══════════════════════════════════════════════════════════════════════════════
// SHADERS
// ═══════════════════════════════════════════════════════════════════════════════

// Los shaders se importan como side-effect en ZeroAvatar
// export { ZeroEyeMaterial } from './shaders/ZeroEyeShader'

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL CORE GPU - SISTEMA DE PARTÍCULAS ULTRA AVANZADO
// ═══════════════════════════════════════════════════════════════════════════════

// Núcleo neural con 100k+ partículas GPU
export { default as NeuralCore3D, NeuralCoreRenderer } from './NeuralCore3D'

// Fondo de fluido cuántico con shaders GLSL
export { default as FluidBackground, FluidBackgroundAdvanced } from './FluidBackground'

// Gráfico de barras holográfico 3D
export { default as HolographicBarChart, SimpleHolographicChart } from './HolographicBarChart'

// Partículas de singularidad
export { default as SingularityParticles } from './SingularityParticles'

// Shaders GLSL avanzados
export * from './shaders/NeuralCoreShaders'
