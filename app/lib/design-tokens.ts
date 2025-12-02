/**
 * 🎨 DESIGN TOKENS - APPLE / TESLA / GROK 2025
 * 
 * Sistema de tokens de diseño ultra-premium
 * Estándares: Apple Vision Pro + Tesla Cybertruck App + Grok.com
 * 
 * Reglas inquebrantables:
 * - Cero cyan, cero neon, cero colores básicos
 * - Rojo Tesla (#E31911) solo para acciones destructivas/importantes
 * - Blanco puro para elementos activos
 * - Gris plata sutil para hover states
 * - Glassmorphism ultra-refinado
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

export const colors = {
  // Backgrounds
  dark: {
    primary: '#000000',
    secondary: '#050505',
    tertiary: '#0A0A0A',
    elevated: '#111111',
    card: '#161616',
    hover: '#1A1A1A',
  },
  light: {
    primary: '#FBFBFD',
    secondary: '#F5F5F7',
    tertiary: '#EBEBED',
    card: '#FFFFFF',
    hover: '#F0F0F2',
  },
  
  // Text
  text: {
    dark: {
      primary: '#FFFFFF',
      secondary: '#E5E5E5',
      tertiary: '#98989D',
      muted: '#6E6E73',
      disabled: '#48484A',
    },
    light: {
      primary: '#000000',
      secondary: '#1D1D1F',
      tertiary: '#87878C',
      muted: '#A1A1A6',
      disabled: '#C7C7CC',
    },
  },
  
  // Accent - Tesla Red (solo para acciones importantes)
  tesla: {
    red: '#E31911',
    redHover: '#CC1510',
    redActive: '#B5120E',
    redGlow: 'rgba(227, 25, 17, 0.3)',
  },
  
  // Neutral Grays (Silver)
  silver: {
    50: '#F5F5F7',
    100: '#E8E8ED',
    200: '#D1D1D6',
    300: '#AEAEB2',
    400: '#8E8E93',
    500: '#636366',
    600: '#48484A',
    700: '#3A3A3C',
    800: '#2C2C2E',
    900: '#1C1C1E',
  },
  
  // Status Colors (muted, elegant)
  status: {
    success: '#30D158',
    successMuted: 'rgba(48, 209, 88, 0.15)',
    warning: '#FFD60A',
    warningMuted: 'rgba(255, 214, 10, 0.15)',
    error: '#FF453A',
    errorMuted: 'rgba(255, 69, 58, 0.15)',
    info: '#64D2FF',
    infoMuted: 'rgba(100, 210, 255, 0.15)',
  },
  
  // Glass Effects
  glass: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    heavy: 'rgba(255, 255, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════════

export const typography = {
  // Font Stack (Apple System)
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  
  // Font Sizes (Harmonious Scale)
  fontSize: {
    '2xs': '0.625rem',     // 10px
    xs: '0.75rem',         // 12px
    sm: '0.875rem',        // 14px
    base: '1rem',          // 16px
    lg: '1.125rem',        // 18px
    xl: '1.25rem',         // 20px
    '2xl': '1.5rem',       // 24px
    '3xl': '1.875rem',     // 30px
    '4xl': '2.25rem',      // 36px
    '5xl': '3rem',         // 48px
    '6xl': '3.75rem',      // 60px
    '7xl': '4.5rem',       // 72px
    kpi: '4rem',           // 64px - Para números grandes en KPIs
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.2',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// SPACING (Apple 8px Grid System)
// ═══════════════════════════════════════════════════════════════════════════════

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',        // Base unit
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',       // Card padding standard
  7: '28px',
  8: '32px',       // Card padding large
  9: '36px',
  10: '40px',
  12: '48px',      // Section spacing
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════════

export const borderRadius = {
  none: '0',
  sm: '8px',
  md: '12px',      // Buttons
  lg: '16px',      // Cards
  xl: '20px',      // Large cards
  '2xl': '24px',   // Modals
  '3xl': '32px',   // Extra large
  full: '9999px',  // Pills/Circles
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════════════════════

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
  
  // Glow shadows (for hover states)
  glow: {
    white: '0 0 20px rgba(255, 255, 255, 0.1)',
    tesla: '0 0 30px rgba(227, 25, 17, 0.3)',
    success: '0 0 20px rgba(48, 209, 88, 0.2)',
  },
  
  // Elevated card shadow
  card: {
    default: '0 0 0 1px rgba(255, 255, 255, 0.05)',
    hover: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATIONS (Framer Motion Config)
// ═══════════════════════════════════════════════════════════════════════════════

export const animations = {
  // Spring physics (Apple-like)
  spring: {
    default: { stiffness: 300, damping: 30 },
    gentle: { stiffness: 200, damping: 25 },
    snappy: { stiffness: 400, damping: 35 },
    bouncy: { stiffness: 500, damping: 20 },
  },
  
  // Durations
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
  },
  
  // Easing curves
  ease: {
    default: [0.22, 1, 0.36, 1],        // Apple ease
    in: [0.4, 0, 1, 1],
    out: [0, 0, 0.2, 1],
    inOut: [0.4, 0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },
  
  // Hover transformations
  hover: {
    scale: 1.02,
    brightness: 1.1,
    y: -4,
  },
  
  // Tap transformations
  tap: {
    scale: 0.98,
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

export const layout = {
  // Sidebar
  sidebar: {
    expanded: 280,
    collapsed: 72,
    mobileHeight: 72,
  },
  
  // Header
  header: {
    height: 64,
    mobileHeight: 56,
  },
  
  // Max widths
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    modal: '640px',
    content: '1400px',
  },
  
  // Z-indices
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
    toast: 70,
    overlay: 100,
  },
  
  // Grid columns
  grid: {
    kpi: {
      mobile: 1,
      tablet: 2,
      desktop: 4,
    },
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// GLASSMORPHISM PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const glassmorphism = {
  card: {
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
  },
  
  sidebar: {
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(32px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  
  modal: {
    background: 'rgba(10, 10, 10, 0.95)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
  },
  
  header: {
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  
  tooltip: {
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const componentVariants = {
  button: {
    primary: {
      background: colors.tesla.red,
      color: '#FFFFFF',
      hoverBackground: colors.tesla.redHover,
    },
    secondary: {
      background: 'transparent',
      color: colors.text.dark.primary,
      border: `1px solid ${colors.silver[700]}`,
      hoverBackground: colors.silver[800],
    },
    ghost: {
      background: 'transparent',
      color: colors.text.dark.secondary,
      hoverBackground: 'rgba(255, 255, 255, 0.05)',
    },
  },
  
  input: {
    default: {
      background: 'transparent',
      borderBottom: `1px solid ${colors.silver[700]}`,
      focusBorder: colors.text.dark.primary,
    },
  },
  
  badge: {
    success: {
      background: colors.status.successMuted,
      color: colors.status.success,
    },
    warning: {
      background: colors.status.warningMuted,
      color: colors.status.warning,
    },
    error: {
      background: colors.status.errorMuted,
      color: colors.status.error,
    },
    neutral: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: colors.text.dark.tertiary,
    },
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// CSS VARIABLES GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const generateCSSVariables = (mode: 'dark' | 'light' = 'dark') => {
  const bg = mode === 'dark' ? colors.dark : colors.light
  const text = mode === 'dark' ? colors.text.dark : colors.text.light

  return {
    '--bg-primary': bg.primary,
    '--bg-secondary': bg.secondary,
    '--bg-tertiary': bg.tertiary,
    '--bg-card': bg.card,
    '--bg-hover': bg.hover,
    '--text-primary': text.primary,
    '--text-secondary': text.secondary,
    '--text-tertiary': text.tertiary,
    '--text-muted': text.muted,
    '--accent': colors.tesla.red,
    '--accent-hover': colors.tesla.redHover,
    '--border': colors.glass.border,
    '--border-hover': colors.glass.borderHover,
  } as const
}

export type DesignTokens = typeof colors & typeof typography & typeof spacing
