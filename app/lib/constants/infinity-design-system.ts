/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎨 CHRONOS INFINITY 2026 - DESIGN SYSTEM TOKENS
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de diseño ultra-premium para CHRONOS
 * Inspirado en Apple Vision Pro + Linear + Vercel + Arc Browser
 * 
 * REGLA ABSOLUTA: CYAN/TURQUESA PROHIBIDO PARA SIEMPRE
 * 
 * Paleta oficial:
 * - Negro Absoluto: #000000
 * - Violeta Real: #8B00FF
 * - Oro Líquido: #FFD700
 * - Rosa Eléctrico: #FF1493
 * - Blanco Puro: #FFFFFF
 * - Plata Sutil: #E5E5E5 / #333333
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════════════════
// PALETA DE COLORES PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_COLORS = {
  // ═══════════════════════════════════════════════════════════════════════
  // COLORES CORE
  // ═══════════════════════════════════════════════════════════════════════
  
  // Negro Absoluto - Fondo principal
  void: '#000000',
  voidDeep: '#020105',
  voidSoft: '#0A0510',
  voidCard: 'rgba(10, 5, 16, 0.8)',
  
  // Violeta Real - Color primario
  violet: '#8B00FF',
  violetLight: '#A020FF',
  violetDark: '#6B00CC',
  violetMuted: 'rgba(139, 0, 255, 0.15)',
  violetGlow: 'rgba(139, 0, 255, 0.5)',
  violetHover: 'rgba(139, 0, 255, 0.25)',
  
  // Oro Líquido - Color secundario
  gold: '#FFD700',
  goldLight: '#FFE333',
  goldDark: '#CCA800',
  goldMuted: 'rgba(255, 215, 0, 0.15)',
  goldGlow: 'rgba(255, 215, 0, 0.5)',
  goldHover: 'rgba(255, 215, 0, 0.25)',
  
  // Rosa Eléctrico - Acento
  pink: '#FF1493',
  pinkLight: '#FF44AA',
  pinkDark: '#CC1076',
  pinkMuted: 'rgba(255, 20, 147, 0.15)',
  pinkGlow: 'rgba(255, 20, 147, 0.5)',
  pinkHover: 'rgba(255, 20, 147, 0.25)',
  
  // ═══════════════════════════════════════════════════════════════════════
  // TEXTO
  // ═══════════════════════════════════════════════════════════════════════
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.3)',
  textInverse: '#000000',
  
  // ═══════════════════════════════════════════════════════════════════════
  // ESTADOS SEMÁNTICOS
  // ═══════════════════════════════════════════════════════════════════════
  success: '#00FF87',
  successMuted: 'rgba(0, 255, 135, 0.15)',
  successGlow: 'rgba(0, 255, 135, 0.5)',
  
  warning: '#FF8C00',
  warningMuted: 'rgba(255, 140, 0, 0.15)',
  warningGlow: 'rgba(255, 140, 0, 0.5)',
  
  error: '#FF3366',
  errorMuted: 'rgba(255, 51, 102, 0.15)',
  errorGlow: 'rgba(255, 51, 102, 0.5)',
  
  info: '#8B00FF', // Usa violeta, NO cyan
  infoMuted: 'rgba(139, 0, 255, 0.15)',
  infoGlow: 'rgba(139, 0, 255, 0.5)',
  
  // ═══════════════════════════════════════════════════════════════════════
  // GLASSMORPHISM
  // ═══════════════════════════════════════════════════════════════════════
  glassBg: 'rgba(20, 10, 30, 0.6)',
  glassBgHover: 'rgba(30, 15, 45, 0.7)',
  glassBgActive: 'rgba(40, 20, 60, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHover: 'rgba(255, 255, 255, 0.15)',
  glassBorderActive: 'rgba(139, 0, 255, 0.3)',
  
  // ═══════════════════════════════════════════════════════════════════════
  // COLORES DE LOS 7 BANCOS (Sistema CHRONOS)
  // ═══════════════════════════════════════════════════════════════════════
  bankBovedaMonte: '#8B00FF',   // Violeta - Bóveda principal MXN
  bankBovedaUSA: '#6366F1',     // Índigo - Bóveda USD
  bankUtilidades: '#00FF87',     // Esmeralda - Ganancias
  bankFletes: '#FFD700',         // Oro - Transporte
  bankAzteca: '#FF1493',         // Rosa - Servicios
  bankLeftie: '#9333EA',         // Púrpura - Operaciones USD
  bankProfit: '#A855F7',         // Lavanda - Banco operativo
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// GRADIENTES
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_GRADIENTS = {
  // Gradientes principales
  primary: 'linear-gradient(135deg, #8B00FF 0%, #FFD700 100%)',
  primaryReverse: 'linear-gradient(135deg, #FFD700 0%, #8B00FF 100%)',
  
  violet: 'linear-gradient(135deg, #8B00FF 0%, #6B00CC 100%)',
  gold: 'linear-gradient(135deg, #FFD700 0%, #CCA800 100%)',
  pink: 'linear-gradient(135deg, #FF1493 0%, #CC1076 100%)',
  
  // Gradientes de fondo
  hero: `
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(139, 0, 255, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse 60% 80% at 80% 70%, rgba(255, 215, 0, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255, 20, 147, 0.1) 0%, transparent 40%),
    linear-gradient(180deg, #000000 0%, #020105 50%, #000000 100%)
  `,
  
  mesh: `
    radial-gradient(ellipse at 20% 30%, rgba(139, 0, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 215, 0, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 20, 147, 0.1) 0%, transparent 40%)
  `,
  
  // Gradientes de glass
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
  glassViolet: 'linear-gradient(135deg, rgba(139, 0, 255, 0.15) 0%, rgba(139, 0, 255, 0.02) 100%)',
  glassGold: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.02) 100%)',
  
  // Gradiente de texto
  textShine: 'linear-gradient(90deg, #8B00FF 0%, #FFD700 50%, #FF1493 100%)',
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_ANIMATIONS = {
  // Duraciones
  duration: {
    instant: 0,
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
    slowest: 1.2,
    cinematic: 2.0,
  },
  
  // Springs para Framer Motion
  spring: {
    gentle: { stiffness: 120, damping: 14 },
    smooth: { stiffness: 180, damping: 20 },
    snappy: { stiffness: 280, damping: 30 },
    bouncy: { stiffness: 400, damping: 10 },
    stiff: { stiffness: 500, damping: 35 },
  },
  
  // Curvas de easing
  ease: {
    spring: [0.16, 1, 0.3, 1] as const,
    smooth: [0.4, 0, 0.2, 1] as const,
    bounce: [0.34, 1.56, 0.64, 1] as const,
    anticipate: [0.175, 0.885, 0.32, 1.275] as const,
    linear: [0, 0, 1, 1] as const,
  },
  
  // CSS transitions
  transition: {
    fast: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
    normal: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    slow: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOGRAFÍA
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_TYPOGRAPHY = {
  // Familias
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
    display: '"SF Pro Display", "Inter", -apple-system, sans-serif',
  },
  
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
    extrabold: 800,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// ESPACIADO
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_SPACING = {
  // Base unit (8px grid)
  unit: 8,
  
  // Scale
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  
  // Semantic
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// BORDES Y ESQUINAS
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_BORDERS = {
  // Border radius
  radius: {
    none: '0',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },
  
  // Border width
  width: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '3px',
  },
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// SOMBRAS
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_SHADOWS = {
  // Sombras base
  sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
  md: '0 4px 16px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.6)',
  '2xl': '0 24px 64px rgba(0, 0, 0, 0.7)',
  
  // Glows de color
  glowViolet: '0 0 40px rgba(139, 0, 255, 0.4)',
  glowGold: '0 0 40px rgba(255, 215, 0, 0.4)',
  glowPink: '0 0 40px rgba(255, 20, 147, 0.4)',
  glowSuccess: '0 0 40px rgba(0, 255, 135, 0.4)',
  glowError: '0 0 40px rgba(255, 51, 102, 0.4)',
  
  // Sombras internas
  innerSm: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
  innerMd: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  innerGlow: 'inset 0 0 20px rgba(139, 0, 255, 0.1)',
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// EFECTOS DE BLUR
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_BLUR = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN 3D
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_3D = {
  // Cámara
  camera: {
    fov: 50,
    near: 0.1,
    far: 1000,
    position: [0, 0, 5] as [number, number, number],
  },
  
  // Luces
  lights: {
    ambient: 0.3,
    point: 0.8,
    directional: 0.6,
  },
  
  // Partículas
  particles: {
    count: 50000,
    speed: 0.5,
    size: 0.03,
  },
  
  // Post-processing
  effects: {
    bloom: {
      intensity: 1.5,
      luminanceThreshold: 0.2,
      luminanceSmoothing: 0.9,
    },
    vignette: {
      offset: 0.3,
      darkness: 0.5,
    },
    chromaticAberration: {
      offset: [0.002, 0.002] as [number, number],
    },
  },
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// Z-INDEX SCALE
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_Z_INDEX = {
  background: -20,
  backgroundOverlay: -10,
  base: 0,
  content: 10,
  elevated: 20,
  sticky: 30,
  dropdown: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
  tooltip: 80,
  maximum: 9999,
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// BREAKPOINTS
// ════════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const

// ════════════════════════════════════════════════════════════════════════════════════════
// EXPORTACIÓN DEL SISTEMA COMPLETO
// ════════════════════════════════════════════════════════════════════════════════════════

export const InfinityDesignSystem = {
  colors: INFINITY_COLORS,
  gradients: INFINITY_GRADIENTS,
  animations: INFINITY_ANIMATIONS,
  typography: INFINITY_TYPOGRAPHY,
  spacing: INFINITY_SPACING,
  borders: INFINITY_BORDERS,
  shadows: INFINITY_SHADOWS,
  blur: INFINITY_BLUR,
  threeD: INFINITY_3D,
  zIndex: INFINITY_Z_INDEX,
  breakpoints: INFINITY_BREAKPOINTS,
} as const

export type InfinityColor = keyof typeof INFINITY_COLORS
export type InfinityGradient = keyof typeof INFINITY_GRADIENTS
export type InfinitySpacing = keyof typeof INFINITY_SPACING
export type InfinityRadius = keyof typeof INFINITY_BORDERS['radius']
export type InfinityShadow = keyof typeof INFINITY_SHADOWS
