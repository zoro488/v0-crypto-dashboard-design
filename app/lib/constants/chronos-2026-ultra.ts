/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - CONSTANTES DEL SISTEMA DE DISEÑO MÁS AVANZADO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este archivo contiene TODAS las constantes de diseño para el sistema
 * más premium y avanzado del mundo 2025-2026.
 * 
 * Nivel: Superior a Apple Vision Pro + Linear + Vercel 2025
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// PALETA DE COLORES
// ═══════════════════════════════════════════════════════════════════════════

export const C26_COLORS = {
  // Core Void
  void: '#000000',
  voidDeep: '#030305',
  voidSoft: '#0a0a0f',
  
  // Primary - Cian Neón Futurista
  cyan: '#00F5FF',
  cyanSoft: '#00D4E0',
  cyanGlow: 'rgba(0, 245, 255, 0.5)',
  cyanMuted: 'rgba(0, 245, 255, 0.15)',
  
  // Accent - Magenta Profundo
  magenta: '#FF00AA',
  magentaSoft: '#E000A0',
  magentaGlow: 'rgba(255, 0, 170, 0.5)',
  magentaMuted: 'rgba(255, 0, 170, 0.15)',
  
  // Secondary - Violeta Eléctrico
  violet: '#7B61FF',
  violetSoft: '#6B50E0',
  violetGlow: 'rgba(123, 97, 255, 0.5)',
  violetMuted: 'rgba(123, 97, 255, 0.15)',
  
  // Status
  success: '#00FF9F',
  warning: '#FFB800',
  error: '#FF3366',
  info: '#00F5FF',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.3)',
  
  // Glass
  glassBg: 'rgba(255, 255, 255, 0.03)',
  glassBgHover: 'rgba(255, 255, 255, 0.06)',
  glassBgActive: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHover: 'rgba(255, 255, 255, 0.15)',
} as const

// ═══════════════════════════════════════════════════════════════════════════
// GRADIENTES
// ═══════════════════════════════════════════════════════════════════════════

export const C26_GRADIENTS = {
  primary: `linear-gradient(135deg, ${C26_COLORS.cyan} 0%, ${C26_COLORS.violet} 100%)`,
  accent: `linear-gradient(135deg, ${C26_COLORS.magenta} 0%, ${C26_COLORS.violet} 100%)`,
  success: `linear-gradient(135deg, ${C26_COLORS.success} 0%, ${C26_COLORS.cyan} 100%)`,
  mesh: `
    radial-gradient(ellipse 80% 50% at 20% 30%, ${C26_COLORS.cyanMuted} 0%, transparent 50%),
    radial-gradient(ellipse 60% 80% at 80% 70%, ${C26_COLORS.magentaMuted} 0%, transparent 50%),
    radial-gradient(ellipse 50% 60% at 50% 50%, ${C26_COLORS.violetMuted} 0%, transparent 40%)
  `,
  hero: `
    radial-gradient(ellipse at 20% 30%, ${C26_COLORS.cyanMuted} 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, ${C26_COLORS.magentaMuted} 0%, transparent 50%),
    linear-gradient(180deg, ${C26_COLORS.void} 0%, ${C26_COLORS.voidSoft} 50%, ${C26_COLORS.void} 100%)
  `,
} as const

// ═══════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ═══════════════════════════════════════════════════════════════════════════

export const C26_ANIMATIONS = {
  // Duraciones
  duration: {
    instant: 0,
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
    slowest: 1.2,
  },
  
  // Curvas de easing
  ease: {
    spring: [0.16, 1, 0.3, 1] as const,
    smooth: [0.4, 0, 0.2, 1] as const,
    bounce: [0.34, 1.56, 0.64, 1] as const,
    elastic: [0.68, -0.55, 0.265, 1.55] as const,
  },
  
  // Springs para Framer Motion
  spring: {
    snappy: { stiffness: 400, damping: 25 },
    gentle: { stiffness: 200, damping: 20 },
    bouncy: { stiffness: 300, damping: 10 },
    stiff: { stiffness: 600, damping: 30 },
  },
  
  // Variantes para stagger
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// ESPACIADO
// ═══════════════════════════════════════════════════════════════════════════

export const C26_SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const

// ═══════════════════════════════════════════════════════════════════════════
// BORDES Y RADIOS
// ═══════════════════════════════════════════════════════════════════════════

export const C26_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const

// ═══════════════════════════════════════════════════════════════════════════
// SOMBRAS
// ═══════════════════════════════════════════════════════════════════════════

export const C26_SHADOWS = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 4px 16px rgba(0, 0, 0, 0.5)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.7)',
  '2xl': '0 32px 64px rgba(0, 0, 0, 0.8)',
  
  // Glows
  glowCyan: `0 0 40px ${C26_COLORS.cyanGlow}, 0 0 80px rgba(0, 245, 255, 0.2)`,
  glowMagenta: `0 0 40px ${C26_COLORS.magentaGlow}, 0 0 80px rgba(255, 0, 170, 0.2)`,
  glowViolet: `0 0 40px ${C26_COLORS.violetGlow}, 0 0 80px rgba(123, 97, 255, 0.2)`,
} as const

// ═══════════════════════════════════════════════════════════════════════════
// GLASSMORPHISM
// ═══════════════════════════════════════════════════════════════════════════

export const C26_GLASS = {
  blur: 60,
  blurStrong: 80,
  saturate: 180,
  
  // Estilos completos
  panel: {
    background: C26_COLORS.glassBg,
    backdropFilter: 'blur(60px) saturate(180%)',
    border: `1px solid ${C26_COLORS.glassBorder}`,
  },
  
  panelStrong: {
    background: 'rgba(10, 10, 15, 0.8)',
    backdropFilter: 'blur(80px) saturate(200%)',
    border: `1px solid ${C26_COLORS.glassBorder}`,
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// TIPOGRAFÍA
// ═══════════════════════════════════════════════════════════════════════════

export const C26_TYPOGRAPHY = {
  fontFamily: {
    display: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
  },
  
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
    '9xl': '8rem',      // 128px
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// Z-INDEX SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export const C26_LAYERS = {
  background: -10,
  base: 0,
  elevated: 10,
  sticky: 100,
  overlay: 200,
  modal: 300,
  notification: 400,
  tooltip: 500,
} as const

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

export const C26_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN 3D
// ═══════════════════════════════════════════════════════════════════════════

export const C26_3D = {
  camera: {
    fov: 45,
    position: [0, 0, 10] as [number, number, number],
    near: 0.1,
    far: 1000,
  },
  
  lights: {
    ambient: 0.4,
    point: 1,
    directional: 0.8,
  },
  
  particles: {
    count: 3000,
    speed: 0.5,
    size: 0.02,
  },
  
  orb: {
    segments: 64,
    metalness: 0.9,
    roughness: 0.1,
    emissiveIntensity: 0.8,
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// ESTADOS DE IA
// ═══════════════════════════════════════════════════════════════════════════

export const C26_AI_STATES = {
  idle: {
    color: C26_COLORS.cyan,
    animation: 'breathing',
    glow: C26_COLORS.cyanGlow,
  },
  thinking: {
    color: C26_COLORS.violet,
    animation: 'pulse',
    glow: C26_COLORS.violetGlow,
  },
  success: {
    color: C26_COLORS.success,
    animation: 'celebrate',
    glow: 'rgba(0, 255, 159, 0.5)',
  },
  error: {
    color: C26_COLORS.error,
    animation: 'shake',
    glow: 'rgba(255, 51, 102, 0.5)',
  },
  listening: {
    color: C26_COLORS.magenta,
    animation: 'wave',
    glow: C26_COLORS.magentaGlow,
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// MOTION VARIANTS (Framer Motion)
// ═══════════════════════════════════════════════════════════════════════════

export const C26_VARIANTS = {
  // Page transitions
  pageEnter: {
    initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -30, filter: 'blur(10px)' },
    transition: { duration: 0.5, ease: C26_ANIMATIONS.ease.spring },
  },
  
  // Stagger container
  staggerContainer: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },
  
  // Stagger item
  staggerItem: {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: C26_ANIMATIONS.ease.spring,
      },
    },
  },
  
  // Hover scale
  hoverScale: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  },
  
  // Float
  float: {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  
  // Glow pulse
  glowPulse: {
    initial: { opacity: 0.5, scale: 1 },
    animate: {
      opacity: [0.5, 0.8, 0.5],
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

export const C26_COMPONENT_CONFIG = {
  card: {
    padding: C26_SPACING[6],
    borderRadius: C26_RADIUS['2xl'],
    ...C26_GLASS.panel,
  },
  
  button: {
    paddingX: C26_SPACING[6],
    paddingY: C26_SPACING[3],
    borderRadius: C26_RADIUS.lg,
    fontSize: C26_TYPOGRAPHY.sizes.sm,
    fontWeight: C26_TYPOGRAPHY.weights.semibold,
  },
  
  input: {
    paddingX: C26_SPACING[5],
    paddingY: C26_SPACING[4],
    borderRadius: C26_RADIUS.lg,
    fontSize: C26_TYPOGRAPHY.sizes.base,
  },
  
  sidebar: {
    widthExpanded: 280,
    widthCollapsed: 72,
    itemPadding: C26_SPACING[4],
    itemGap: C26_SPACING[4],
  },
  
  fab: {
    size: 64,
    sizeMobile: 56,
  },
  
  modal: {
    maxWidth: 560,
    borderRadius: C26_RADIUS['2xl'],
    padding: C26_SPACING[8],
  },
} as const

// Export all as single object
export const CHRONOS_2026_ULTRA = {
  colors: C26_COLORS,
  gradients: C26_GRADIENTS,
  animations: C26_ANIMATIONS,
  spacing: C26_SPACING,
  radius: C26_RADIUS,
  shadows: C26_SHADOWS,
  glass: C26_GLASS,
  typography: C26_TYPOGRAPHY,
  layers: C26_LAYERS,
  breakpoints: C26_BREAKPOINTS,
  threeD: C26_3D,
  aiStates: C26_AI_STATES,
  variants: C26_VARIANTS,
  components: C26_COMPONENT_CONFIG,
} as const

export default CHRONOS_2026_ULTRA
