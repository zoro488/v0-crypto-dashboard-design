/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS INFINITY - COMPONENTES 3D INDEX
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Exportaciones centralizadas de todos los componentes 3D y efectos visuales
 * del sistema CHRONOS INFINITY 2026
 * 
 * Incluye:
 * - Shaders GLSL avanzados
 * - Componentes R3F (React Three Fiber)
 * - Componentes Spline
 * - UI Components con efectos 3D
 * - Design System Tokens
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════════════════
// SHADERS
// ════════════════════════════════════════════════════════════════════════════════════════
export {
  liquidMagneticOrbVertexShader,
  liquidMagneticOrbFragmentShader,
  cosmicFluidVertexShader,
  cosmicFluidFragmentShader,
  particleSwarmVertexShader,
  particleSwarmFragmentShader,
  volumetricGlowFragmentShader,
  CHRONOS_SHADER_COLORS,
  INFINITY_COLORS as SHADER_INFINITY_COLORS,
} from './shaders/InfinityShaders'

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTES 3D CORE
// ════════════════════════════════════════════════════════════════════════════════════════

// Infinity Orb - Orbe con shaders de distorsión líquida
export { 
  default as InfinityOrb,
  OrbitalRings,
  OrbitalParticles,
  STATE_CONFIG as ORB_STATE_CONFIG,
} from './InfinityOrb'
export type { OrbState, InfinityOrbProps } from './InfinityOrb'

// Cosmic Fluid Background - Fondo con física Navier-Stokes
export {
  default as CosmicFluidBackground,
  StaticCosmicBackground,
  FluidMesh,
  ParticleDust,
} from './CosmicFluidBackground'
export type { CosmicFluidBackgroundProps } from './CosmicFluidBackground'

// Particle Swarm - Sistema de partículas GPGPU
export {
  default as ParticleSwarm,
  ParticleSwarmScene,
} from './ParticleSwarm'
export type { ParticleSwarmProps } from './ParticleSwarm'

// ════════════════════════════════════════════════════════════════════════════════════════
// RE-EXPORTAR COMPONENTES EXISTENTES
// ════════════════════════════════════════════════════════════════════════════════════════

// Panel 3D Wrapper
export { 
  Panel3DWrapper,
  Dashboard3DPreset,
  Analytics3DPreset,
  Workflow3DPreset,
  AI3DPreset,
} from './Panel3DWrapper'
export type { Component3DType } from './Panel3DWrapper'

// Zero Force Components
export { ZeroAvatar } from './ZeroAvatar'
export { ZeroCombatScene } from './ZeroCombatScene'
export { ZeroEnvironment } from './ZeroEnvironment'
export { ZeroChatWidget } from './ZeroChatWidget'
export { ZeroPanel } from './ZeroPanel'

// Chronos Singularity Components
export { SingularityLogo, SingularityLogoScene } from './SingularityLogo'
export { NavIcons3D, NavBar3D, SplineIconsScene } from './NavIcons3D'
export { AIAgentScene, AIBotWidget } from './AIAgentScene'

// Analytics & Visualization
export { AnalyticsGlobe3D } from './AnalyticsGlobe3D'
export { WorkflowVisualizer3D } from './WorkflowVisualizer3D'
export { 
  PremiumOrbBackground, 
  DashboardBackground, 
  LoginBackground, 
  CyberpunkBackground, 
} from './PremiumOrbBackground'
export { PremiumSplineOrb } from './PremiumSplineOrb'

// AI Voice Components
export { AIVoiceOrbGLTF } from './models/AIVoiceOrbGLTF'

// Neural Core (GPGPU existente)
export { default as NeuralCore3D } from './NeuralCore3D'
export { default as FluidBackground } from './FluidBackground'

// ════════════════════════════════════════════════════════════════════════════════════════
// NOTAS DE USO
// ════════════════════════════════════════════════════════════════════════════════════════
/**
 * EJEMPLOS DE USO:
 * 
 * 1. INFINITY ORB (Orbe del asistente IA):
 * ```tsx
 * import { InfinityOrb } from '@/app/components/3d'
 * 
 * <Canvas>
 *   <InfinityOrb 
 *     state="thinking" 
 *     audioLevel={0.5} 
 *     onClick={() => console.log('clicked')}
 *   />
 * </Canvas>
 * ```
 * 
 * 2. COSMIC FLUID BACKGROUND (Fondo inmersivo):
 * ```tsx
 * import { CosmicFluidBackground } from '@/app/components/3d'
 * 
 * <CosmicFluidBackground 
 *   energy={0.3} 
 *   speed={1.2} 
 *   vignette 
 * />
 * ```
 * 
 * 3. PARTICLE SWARM (Sistema de partículas):
 * ```tsx
 * import { ParticleSwarmScene } from '@/app/components/3d'
 * 
 * <Canvas>
 *   <ParticleSwarmScene 
 *     count={50000}
 *     processingIntensity={0.8}
 *   />
 * </Canvas>
 * ```
 * 
 * PALETA DE COLORES (CYAN PROHIBIDO):
 * - Violeta: #8B00FF
 * - Oro: #FFD700
 * - Rosa: #FF1493
 */
