import * as THREE from "three"
import type { ReactNode } from "react"

// ============================================
// TIPOS PARA SISTEMA 3D INMERSIVO
// ============================================

/**
 * Configuración base para componentes 3D
 */
export interface Base3DConfig {
  /** Habilitar antialiasing */
  antialias?: boolean
  /** Device Pixel Ratio [min, max] */
  dpr?: [number, number]
  /** Preferencia de rendimiento GPU */
  powerPreference?: "high-performance" | "low-power" | "default"
  /** Fondo transparente */
  alpha?: boolean
}

/**
 * Configuración de cámara
 */
export interface CameraConfig {
  position?: [number, number, number]
  fov?: number
  near?: number
  far?: number
  zoom?: number
}

/**
 * Configuración de iluminación
 */
export interface LightConfig {
  ambient?: {
    intensity: number
    color?: string
  }
  point?: Array<{
    position: [number, number, number]
    intensity: number
    color?: string
    distance?: number
    decay?: number
  }>
  spot?: Array<{
    position: [number, number, number]
    angle: number
    penumbra: number
    intensity: number
    color?: string
  }>
}

// ============================================
// TIPOS PARA PARTÍCULAS
// ============================================

/**
 * Configuración de partícula individual
 */
export interface ParticleData {
  position: THREE.Vector3
  targetPosition: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  size: number
  brightness: number
  random: number
}

/**
 * Configuración del sistema de partículas
 */
export interface ParticleSystemConfig {
  count: number
  size: number
  dispersionRadius: number
  elasticity: number
  mouseInfluence: number
  colorPalette?: string[]
}

/**
 * Props para el componente SingularityLogo
 */
export interface SingularityLogoProps {
  className?: string
  imageSrc?: string
  particleCount?: number
  interactive?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

// ============================================
// TIPOS PARA SPLINE
// ============================================

/**
 * Nodo de escena Spline
 */
export interface SplineNode {
  name: string
  uuid: string
  type: string
  visible: boolean
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

/**
 * Mapeo de secciones a nodos Spline
 */
export interface SplineNodeMap {
  [section: string]: string[]
}

/**
 * Props para iconos 3D de navegación
 */
export interface NavIcons3DProps {
  section: string
  isActive?: boolean
  isHovered?: boolean
  onClick?: () => void
  onHover?: (hovering: boolean) => void
  size?: number
  className?: string
}

/**
 * Props para la barra de navegación 3D
 */
export interface NavBar3DProps {
  items: NavItem3D[]
  activeSection: string
  onSectionChange: (section: string) => void
  orientation?: "horizontal" | "vertical"
  className?: string
}

export interface NavItem3D {
  id: string
  label: string
  section: string
  icon?: ReactNode
}

// ============================================
// TIPOS PARA AI AGENT
// ============================================

/**
 * Estado del bot IA
 */
export interface AIBotState {
  isThinking: boolean
  isGlitching: boolean
  isListening: boolean
  mood: "idle" | "happy" | "thinking" | "processing" | "error"
}

/**
 * Mensaje de chat
 */
export interface ChatMessage {
  id: string
  type: "user" | "bot" | "system"
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    sources?: string[]
    action?: string
  }
}

/**
 * Props para el componente AIAgentScene
 */
export interface AIAgentSceneProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showChat?: boolean
  onMessageSend?: (message: string) => void
  onMessageReceive?: (message: ChatMessage) => void
  isProcessing?: boolean
  enableGlitch?: boolean
  enableFloating?: boolean
}

// ============================================
// TIPOS PARA EFECTOS POST-PROCESAMIENTO
// ============================================

/**
 * Configuración de Bloom
 */
export interface BloomConfig {
  intensity?: number
  luminanceThreshold?: number
  luminanceSmoothing?: number
  enabled?: boolean
}

/**
 * Configuración de Glitch
 */
export interface GlitchConfig {
  delay?: [number, number]
  duration?: [number, number]
  strength?: [number, number]
  mode?: "constant" | "sporadic"
  active?: boolean
  ratio?: number
}

/**
 * Configuración de efectos combinados
 */
export interface PostProcessingConfig {
  bloom?: BloomConfig
  glitch?: GlitchConfig
  noise?: {
    opacity?: number
    enabled?: boolean
  }
  chromaticAberration?: {
    offset?: [number, number]
    enabled?: boolean
  }
  vignette?: {
    offset?: number
    darkness?: number
    enabled?: boolean
  }
}

// ============================================
// TIPOS PARA SPLASH SCREEN
// ============================================

/**
 * Props para SplashTransition
 */
export interface SplashTransitionProps {
  onComplete?: () => void
  duration?: number
  skipOnClick?: boolean
  showProgress?: boolean
  brandText?: string
  tagline?: string
}

/**
 * Estado del splash screen
 */
export interface SplashState {
  progress: number
  speed: number
  isWarping: boolean
  isComplete: boolean
  flashOpacity: number
}

// ============================================
// TIPOS PARA LAYOUT INMERSIVO
// ============================================

/**
 * Props para ImmersiveLayout
 */
export interface ImmersiveLayoutProps {
  children: ReactNode
  showBackground?: boolean
  enablePostProcessing?: boolean
  className?: string
  onReady?: () => void
}

/**
 * Props para GlassCard
 */
export interface GlassCardProps {
  children: ReactNode
  className?: string
  intensity?: "light" | "medium" | "strong"
  glow?: boolean
  glowColor?: "blue" | "purple" | "cyan" | "pink"
}

/**
 * Props para GlassSidebar
 */
export interface GlassSidebarProps {
  children: ReactNode
  className?: string
  width?: number
  collapsed?: boolean
}

/**
 * Props para GlassHeader
 */
export interface GlassHeaderProps {
  children: ReactNode
  className?: string
  height?: number
}

// ============================================
// TIPOS PARA CURSOR MAGNÉTICO
// ============================================

/**
 * Props para MagneticCursor
 */
export interface MagneticCursorProps {
  color?: string
  glowColor?: string
  size?: number
  magneticStrength?: number
  magneticSelector?: string
  enabled?: boolean
}

/**
 * Estado del cursor
 */
export interface CursorState {
  position: { x: number; y: number }
  isMoving: boolean
  isClicking: boolean
  hoveredElement: HTMLElement | null
  isOverInteractive: boolean
}

// ============================================
// TIPOS PARA SONIDOS UI
// ============================================

/**
 * Tipos de sonidos disponibles
 */
export type SoundType =
  | "click"
  | "hover"
  | "success"
  | "error"
  | "notification"
  | "transition"
  | "warp"
  | "glitch"

/**
 * Opciones de sonido
 */
export interface SoundOptions {
  volume?: number
  playbackRate?: number
  interrupt?: boolean
  soundEnabled?: boolean
}

/**
 * Sonido de UI
 */
export interface UISound {
  play: () => void
  stop: () => void
}

// ============================================
// TIPOS PARA ANIMACIONES
// ============================================

/**
 * Configuración de transición de página
 */
export interface PageTransitionConfig {
  type: "fade" | "slide" | "warp" | "morph"
  duration: number
  easing: string
  cameraAnimation?: {
    from: [number, number, number]
    to: [number, number, number]
  }
}

/**
 * Configuración de hover
 */
export interface HoverAnimationConfig {
  scale: number
  rotation?: number
  glow?: boolean
  spring?: {
    stiffness: number
    damping: number
  }
}

// ============================================
// UTILIDADES DE TIPOS
// ============================================

/**
 * Hacer todas las propiedades opcionales recursivamente
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Extraer props de un componente
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never

/**
 * Vector 3D como tupla
 */
export type Vector3Tuple = [number, number, number]

/**
 * Vector 2D como tupla
 */
export type Vector2Tuple = [number, number]
