/**
 * CHRONOS 2026 - Constantes de Diseño Ultra-Premium
 * Nivel Apple Vision Pro + Linear + Arc Browser + Vercel
 */

// Paleta de colores oficial Chronos 2026
export const CHRONOS_COLORS = {
  // Fondos
  bg: '#000000',
  bgCard: 'rgba(20, 20, 30, 0.6)',
  bgGlass: 'rgba(255, 255, 255, 0.03)',
  
  // Bordes
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.15)',
  borderActive: 'rgba(255, 255, 255, 0.25)',
  
  // Texto
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  
  // Colores principales (reducidos a 2 para elegancia)
  primary: '#0067FF',      // Azul cobalto
  accent: '#C81EFF',       // Magenta
  
  // Estados
  success: '#00FF57',
  danger: '#FF0033',
  warning: '#FF6B00',
  info: '#00D4FF',
  
  // Gradientes
  gradientPrimary: 'linear-gradient(135deg, #0067FF 0%, #C81EFF 100%)',
  gradientHero: 'linear-gradient(135deg, #0067FF 0%, #4B0082 50%, #C81EFF 100%)',
  gradientGlass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
} as const

// Configuración de animaciones con física real
export const CHRONOS_ANIMATIONS = {
  // Spring configurations
  spring: {
    gentle: { stiffness: 120, damping: 14 },
    smooth: { stiffness: 180, damping: 20 },
    snappy: { stiffness: 280, damping: 30 },
    bouncy: { stiffness: 400, damping: 10 },
  },
  
  // Durations
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.4,
    slow: 0.6,
    cinematic: 1.2,
  },
  
  // Easing curves (cubic-bezier)
  ease: {
    smooth: [0.22, 1, 0.36, 1],
    sharp: [0.16, 1, 0.3, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    anticipate: [0.175, 0.885, 0.32, 1.275],
  },
} as const

// Configuración de glassmorphism
export const CHRONOS_GLASS = {
  blur: {
    subtle: 'blur(8px)',
    medium: 'blur(16px)',
    strong: 'blur(24px)',
    ultra: 'blur(40px)',
  },
  
  backdrop: {
    light: 'saturate(180%) blur(20px)',
    dark: 'saturate(120%) blur(16px) brightness(0.8)',
  },
  
  border: {
    subtle: '1px solid rgba(255, 255, 255, 0.06)',
    medium: '1px solid rgba(255, 255, 255, 0.1)',
    strong: '1px solid rgba(255, 255, 255, 0.15)',
  },
} as const

// Tipografía premium
export const CHRONOS_TYPOGRAPHY = {
  // Tamaños para KPIs
  kpi: {
    hero: 'clamp(4rem, 10vw, 8rem)',      // $8.9M
    large: 'clamp(2.5rem, 6vw, 4rem)',    // $124K
    medium: 'clamp(1.5rem, 4vw, 2.5rem)', // 1,247
    small: 'clamp(1rem, 2vw, 1.25rem)',   // Labels
  },
  
  // Pesos
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
} as const

// Breakpoints responsive
export const CHRONOS_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Z-index layers
export const CHRONOS_LAYERS = {
  background: -10,
  base: 0,
  card: 10,
  overlay: 20,
  modal: 30,
  tooltip: 40,
  orb: 50,
  fab: 60,
  notification: 70,
} as const

// Configuración 3D
export const CHRONOS_3D = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 0, 5] as [number, number, number],
  },
  
  lights: {
    ambient: 0.4,
    point: 2,
  },
  
  particles: {
    count: 3000, // Reducido para performance
    size: 0.02,
    speed: 0.5,
  },
} as const

// Estados de IA
export const AI_STATES = {
  idle: { color: '#0067FF', scale: 1, label: 'AI READY' },
  thinking: { color: '#C81EFF', scale: 1.2, label: 'PROCESSING...' },
  success: { color: '#00FF57', scale: 1.1, label: 'COMPLETE' },
  warning: { color: '#FF6B00', scale: 1.15, label: 'ATTENTION' },
  error: { color: '#FF0033', scale: 1.3, label: 'ERROR' },
} as const

export type ChronosColor = keyof typeof CHRONOS_COLORS
export type AIState = keyof typeof AI_STATES
