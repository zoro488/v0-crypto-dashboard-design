/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS INFINITY - DESIGN TOKENS TYPESCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de tokens de diseño ultra-premium para uso en componentes React.
 * Paleta sofisticada: Oro Líquido, Violeta Real, Esmeralda Láser, Rosa Plasma
 * 
 * @version 2.0.0
 * @author CHRONOS Design System
 */

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎨 COLOR PALETTE - CHROMATIC INFINITY
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_COLORS = {
  // Void Spectrum (Backgrounds)
  void: {
    pure: '#000000',
    deep: '#030305',
    soft: '#0a0a0f',
    elevated: '#111118',
    float: '#18181f',
  },
  
  // Oro Líquido (Primary Luxury)
  gold: {
    DEFAULT: '#FFD700',
    light: '#FFDF4D',
    dark: '#CC9900',
    deep: '#B8860B',
    glow: 'rgba(255, 215, 0, 0.6)',
    muted: 'rgba(255, 215, 0, 0.15)',
    subtle: 'rgba(255, 215, 0, 0.08)',
  },
  
  // Violeta Real (Secondary Sophistication)
  violet: {
    DEFAULT: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    deep: '#6D28D9',
    glow: 'rgba(139, 92, 246, 0.6)',
    muted: 'rgba(139, 92, 246, 0.15)',
    subtle: 'rgba(139, 92, 246, 0.08)',
  },
  
  // Esmeralda Láser (Success/Growth)
  emerald: {
    DEFAULT: '#10B981',
    light: '#34D399',
    dark: '#059669',
    deep: '#047857',
    glow: 'rgba(16, 185, 129, 0.6)',
    muted: 'rgba(16, 185, 129, 0.15)',
    subtle: 'rgba(16, 185, 129, 0.08)',
  },
  
  // Rosa Plasma (Accent Energy)
  plasma: {
    DEFAULT: '#EC4899',
    light: '#F472B6',
    dark: '#DB2777',
    deep: '#BE185D',
    glow: 'rgba(236, 72, 153, 0.6)',
    muted: 'rgba(236, 72, 153, 0.15)',
    subtle: 'rgba(236, 72, 153, 0.08)',
  },
  
  // Sapphire Royal (Info/Data)
  sapphire: {
    DEFAULT: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    glow: 'rgba(59, 130, 246, 0.6)',
    muted: 'rgba(59, 130, 246, 0.15)',
  },
  
  // Ruby Alert (Error)
  ruby: {
    DEFAULT: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.6)',
    muted: 'rgba(239, 68, 68, 0.15)',
  },
  
  // Amber Flame (Warning)
  amber: {
    DEFAULT: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    glow: 'rgba(245, 158, 11, 0.6)',
    muted: 'rgba(245, 158, 11, 0.15)',
  },
  
  // Text Hierarchy
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.75)',
    tertiary: 'rgba(255, 255, 255, 0.55)',
    muted: 'rgba(255, 255, 255, 0.35)',
    ghost: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Glass Effects
  glass: {
    bg: 'rgba(255, 255, 255, 0.03)',
    bgHover: 'rgba(255, 255, 255, 0.06)',
    bgActive: 'rgba(255, 255, 255, 0.09)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
    borderActive: 'rgba(255, 255, 255, 0.22)',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🌈 GRADIENTS
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_GRADIENTS = {
  gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
  violet: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
  emerald: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)',
  plasma: 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #F9A8D4 100%)',
  sapphire: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)',
  holographic: 'linear-gradient(90deg, #FFD700 0%, #EC4899 25%, #8B5CF6 50%, #10B981 75%, #FFD700 100%)',
  
  // Mesh Backgrounds
  meshPremium: `
    radial-gradient(ellipse 100% 60% at 0% 0%, rgba(255, 215, 0, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 80% 80% at 100% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 45%),
    radial-gradient(ellipse 60% 100% at 100% 100%, rgba(236, 72, 153, 0.15) 0%, transparent 40%),
    radial-gradient(ellipse 80% 60% at 0% 100%, rgba(16, 185, 129, 0.15) 0%, transparent 35%)
  `,
  
  meshAurora: `
    radial-gradient(ellipse 120% 80% at 20% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 40%),
    radial-gradient(ellipse 100% 100% at 80% 30%, rgba(255, 215, 0, 0.08) 0%, transparent 35%),
    radial-gradient(ellipse 80% 120% at 60% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 40%),
    radial-gradient(ellipse 100% 80% at 10% 90%, rgba(16, 185, 129, 0.08) 0%, transparent 30%)
  `,
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🌑 SHADOWS
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_SHADOWS = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.3), 0 8px 15px rgba(0, 0, 0, 0.25), 0 15px 30px rgba(0, 0, 0, 0.15), 0 30px 60px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 10px rgba(0, 0, 0, 0.35), 0 15px 25px rgba(0, 0, 0, 0.3), 0 25px 50px rgba(0, 0, 0, 0.2), 0 50px 80px rgba(0, 0, 0, 0.15), 0 80px 120px rgba(0, 0, 0, 0.1)',
  xl: '0 10px 15px rgba(0, 0, 0, 0.4), 0 20px 40px rgba(0, 0, 0, 0.35), 0 40px 80px rgba(0, 0, 0, 0.25), 0 80px 120px rgba(0, 0, 0, 0.2), 0 120px 180px rgba(0, 0, 0, 0.15)',
  
  // Hero Card - Extra dramatic
  heroCard: '0 25px 50px rgba(0, 0, 0, 0.5), 0 50px 100px rgba(0, 0, 0, 0.4), 0 100px 200px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
  
  // Colored Glows
  glowGold: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.15)',
  glowViolet: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.15)',
  glowEmerald: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3), 0 0 80px rgba(16, 185, 129, 0.15)',
  glowPlasma: '0 0 20px rgba(236, 72, 153, 0.6), 0 0 40px rgba(236, 72, 153, 0.3), 0 0 80px rgba(236, 72, 153, 0.15)',
  glowSapphire: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3), 0 0 80px rgba(59, 130, 246, 0.15)',
  glowRuby: '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3), 0 0 80px rgba(239, 68, 68, 0.15)',
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📐 SPACING & SIZING
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_SPACING = {
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
} as const

export const INFINITY_RADIUS = {
  xs: '6px',
  sm: '10px',
  md: '14px',
  lg: '20px',
  xl: '28px',
  '2xl': '36px',
  '3xl': '48px',
  full: '9999px',
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// ⚡ ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_ANIMATIONS = {
  easing: {
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    expo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    back: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  duration: {
    instant: '100ms',
    fast: '200ms',
    normal: '350ms',
    slow: '500ms',
    slower: '700ms',
    dramatic: '1000ms',
  },
  
  // Framer Motion variants
  springConfig: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
  
  bounceConfig: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 15,
    mass: 0.8,
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔤 TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_TYPOGRAPHY = {
  fontFamily: {
    display: "'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    text: "'Inter', 'SF Pro Text', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  },
  
  // KPI/Data display sizes
  dataHero: 'clamp(4rem, 15vw, 9rem)',
  dataLarge: 'clamp(3rem, 10vw, 6rem)',
  dataMedium: 'clamp(2rem, 6vw, 4rem)',
  dataSmall: 'clamp(1.5rem, 4vw, 2.5rem)',
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎯 Z-INDEX LAYERS
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_Z_INDEX = {
  deep: -100,
  base: 0,
  elevated: 10,
  floating: 100,
  overlay: 200,
  modal: 500,
  notification: 700,
  tooltip: 800,
  maximum: 999,
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🎨 BANK COLORS (Para el sistema Chronos)
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY_BANK_COLORS = {
  boveda_monte: { color: INFINITY_COLORS.violet.DEFAULT, glow: INFINITY_COLORS.violet.glow },
  boveda_usa: { color: INFINITY_COLORS.sapphire.DEFAULT, glow: INFINITY_COLORS.sapphire.glow },
  profit: { color: INFINITY_COLORS.emerald.DEFAULT, glow: INFINITY_COLORS.emerald.glow },
  leftie: { color: INFINITY_COLORS.plasma.DEFAULT, glow: INFINITY_COLORS.plasma.glow },
  azteca: { color: INFINITY_COLORS.gold.DEFAULT, glow: INFINITY_COLORS.gold.glow },
  flete_sur: { color: INFINITY_COLORS.amber.DEFAULT, glow: INFINITY_COLORS.amber.glow },
  utilidades: { color: INFINITY_COLORS.emerald.light, glow: INFINITY_COLORS.emerald.glow },
} as const

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene un color con alfa personalizado
 */
export function getColorWithAlpha(color: string, alpha: number): string {
  // Si ya es rgba, reemplazar el alfa
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`)
  }
  // Si es hex, convertir a rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}

/**
 * Genera un estilo de glassmorphism
 */
export function getGlassStyle(variant: 'light' | 'medium' | 'strong' = 'medium') {
  const blur = variant === 'light' ? '20px' : variant === 'medium' ? '40px' : '80px'
  return {
    background: INFINITY_COLORS.glass.bg,
    backdropFilter: `blur(${blur}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur}) saturate(180%)`,
    border: `1px solid ${INFINITY_COLORS.glass.border}`,
  }
}

/**
 * Genera un estilo de glow para un color
 */
export function getGlowStyle(colorKey: keyof typeof INFINITY_COLORS) {
  const colorGroup = INFINITY_COLORS[colorKey]
  if (typeof colorGroup === 'object' && 'glow' in colorGroup) {
    return {
      boxShadow: `0 0 20px ${colorGroup.glow}, 0 0 40px ${getColorWithAlpha(colorGroup.DEFAULT, 0.3)}`,
    }
  }
  return {}
}

/**
 * Genera el gradiente mesh premium
 */
export function getMeshBackground(intensity: 'subtle' | 'medium' | 'strong' = 'medium') {
  const alpha = intensity === 'subtle' ? 0.08 : intensity === 'medium' ? 0.15 : 0.25
  return `
    radial-gradient(ellipse 100% 60% at 0% 0%, ${getColorWithAlpha(INFINITY_COLORS.gold.DEFAULT, alpha)} 0%, transparent 50%),
    radial-gradient(ellipse 80% 80% at 100% 0%, ${getColorWithAlpha(INFINITY_COLORS.violet.DEFAULT, alpha)} 0%, transparent 45%),
    radial-gradient(ellipse 60% 100% at 100% 100%, ${getColorWithAlpha(INFINITY_COLORS.plasma.DEFAULT, alpha)} 0%, transparent 40%),
    radial-gradient(ellipse 80% 60% at 0% 100%, ${getColorWithAlpha(INFINITY_COLORS.emerald.DEFAULT, alpha)} 0%, transparent 35%)
  `
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📦 EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════════════

export const INFINITY = {
  colors: INFINITY_COLORS,
  gradients: INFINITY_GRADIENTS,
  shadows: INFINITY_SHADOWS,
  spacing: INFINITY_SPACING,
  radius: INFINITY_RADIUS,
  animations: INFINITY_ANIMATIONS,
  typography: INFINITY_TYPOGRAPHY,
  zIndex: INFINITY_Z_INDEX,
  bankColors: INFINITY_BANK_COLORS,
  utils: {
    getColorWithAlpha,
    getGlassStyle,
    getGlowStyle,
    getMeshBackground,
  },
} as const

export default INFINITY
