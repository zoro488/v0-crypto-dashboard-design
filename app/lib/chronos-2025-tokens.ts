/**
 * 🎨 CHRONOS 2025 DESIGN TOKENS
 * 
 * Sistema de diseño nivel mundial 2025
 * Reducción de saturación 30-40% + solo 2 colores principales
 * 
 * PALETA OFICIAL:
 * - Background: #000000 (pure black)
 * - Primary: #0066FF (Azul cobalto - reducido saturación)
 * - Accent: #C81EFF (Magenta premium)
 * - Success: #00FF57 (Verde brillante - solo positivo)
 * - Danger: #FF0033 (Rojo intenso - solo negativo)
 * - Warning: #FF6B00 (Naranja - alertas)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CHRONOS 2025 COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

export const CHRONOS_2025 = {
  // Core Colors
  colors: {
    // Backgrounds - Pure Black
    bg: '#000000',
    bgElevated: '#0A0A0A',
    bgCard: 'rgba(20, 20, 30, 0.6)',
    bgHover: 'rgba(255, 255, 255, 0.03)',
    
    // Primary - Azul Cobalto (saturación reducida 40%)
    primary: '#0066FF',
    primaryMuted: 'rgba(0, 102, 255, 0.15)',
    primaryGlow: 'rgba(0, 102, 255, 0.3)',
    primaryHover: '#0052CC',
    
    // Accent - Magenta Premium
    accent: '#C81EFF',
    accentMuted: 'rgba(200, 30, 255, 0.15)',
    accentGlow: 'rgba(200, 30, 255, 0.3)',
    accentHover: '#A318CC',
    
    // Text Hierarchy
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#6B6B6B',
    textDisabled: '#404040',
    
    // Semantic Status Colors (claridad instantánea)
    success: '#00FF57',    // Solo para positivo
    successMuted: 'rgba(0, 255, 87, 0.15)',
    danger: '#FF0033',     // Solo para negativo
    dangerMuted: 'rgba(255, 0, 51, 0.15)',
    warning: '#FF6B00',    // Solo para warning
    warningMuted: 'rgba(255, 107, 0, 0.15)',
    
    // Glass Effects - Ultra sutil
    glassBg: 'rgba(0, 0, 0, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassBorderHover: 'rgba(255, 255, 255, 0.12)',
    glassStrong: 'rgba(20, 20, 30, 0.95)',
    
    // Gradient Stops (solo 2 colores)
    gradientStart: '#0066FF',
    gradientEnd: '#C81EFF',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TYPOGRAPHY - Inter Bold para legibilidad brutal
  // ═══════════════════════════════════════════════════════════════════════════
  
  typography: {
    // Font Family
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", "JetBrains Mono", monospace',
    },
    
    // KPI Numbers - 48-64px Bold (legibilidad brutal)
    kpiLarge: {
      fontSize: '64px',
      fontWeight: '700',
      lineHeight: '1',
      letterSpacing: '-0.02em',
    },
    kpiMedium: {
      fontSize: '48px',
      fontWeight: '700',
      lineHeight: '1',
      letterSpacing: '-0.02em',
    },
    
    // Labels - 20px
    label: {
      fontSize: '20px',
      fontWeight: '500',
      lineHeight: '1.4',
      letterSpacing: '0',
    },
    
    // Body Text
    body: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    
    // Caption
    caption: {
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: '1.4',
    },
    
    // Small
    small: {
      fontSize: '12px',
      fontWeight: '500',
      lineHeight: '1.4',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPACING & BORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',    // Máximo para cards (no más de 16px)
    xl: '20px',
    pill: '9999px',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GLASSMORPHISM - Ultra sutil
  // ═══════════════════════════════════════════════════════════════════════════
  
  glass: {
    card: {
      background: 'rgba(20, 20, 30, 0.6)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
    },
    cardHover: {
      border: '1px solid rgba(255, 255, 255, 0.12)',
      transform: 'translateY(-2px)',
    },
    modal: {
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
    },
    sidebar: {
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SHADOWS - Minimal, elegant
  // ═══════════════════════════════════════════════════════════════════════════
  
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 4px 16px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.6)',
    glow: {
      primary: '0 0 40px rgba(0, 102, 255, 0.3)',
      accent: '0 0 40px rgba(200, 30, 255, 0.3)',
      success: '0 0 40px rgba(0, 255, 87, 0.3)',
      danger: '0 0 40px rgba(255, 0, 51, 0.3)',
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS - Framer Motion spring (stiffness 280, damping 30)
  // ═══════════════════════════════════════════════════════════════════════════
  
  animations: {
    spring: {
      type: 'spring',
      stiffness: 280,
      damping: 30,
    },
    springGentle: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
    },
    springBouncy: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
    
    // Hover scale - sutil 1.02
    hoverScale: 1.02,
    
    // Duration presets
    duration: {
      fast: 0.15,
      normal: 0.3,
      slow: 0.5,
    },
    
    // Page transitions
    pageTransition: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: {
        type: 'spring',
        stiffness: 280,
        damping: 30,
      },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  
  layout: {
    sidebar: {
      expanded: '280px',
      collapsed: '72px',
    },
    header: {
      height: '72px',
    },
    maxWidth: {
      content: '1600px',
      modal: '640px',
    },
    grid: {
      gap: '16px',
      columns: 12,
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ICON STYLES - Blanco puro, stroke 1.8, glow sutil solo en activo
  // ═══════════════════════════════════════════════════════════════════════════
  
  icons: {
    color: '#FFFFFF',
    colorMuted: 'rgba(255, 255, 255, 0.6)',
    strokeWidth: 1.8,
    size: {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },
    activeGlow: '0 0 12px rgba(255, 255, 255, 0.3)',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRAST RATIOS (WCAG AAA - mínimo 7:1)
  // ═══════════════════════════════════════════════════════════════════════════
  
  accessibility: {
    minContrastRatio: 7,
    focusRingColor: '#0066FF',
    focusRingWidth: '2px',
    focusRingOffset: '2px',
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const getGradient = (direction: 'to-r' | 'to-br' | 'to-b' = 'to-r') => {
  const dirs = {
    'to-r': '90deg',
    'to-br': '135deg',
    'to-b': '180deg',
  }
  return `linear-gradient(${dirs[direction]}, ${CHRONOS_2025.colors.primary}, ${CHRONOS_2025.colors.accent})`
}

export const getGlassCard = () => ({
  ...CHRONOS_2025.glass.card,
})

export const getSpringAnimation = () => CHRONOS_2025.animations.spring

// Status color helper
export const getStatusColor = (status: 'success' | 'danger' | 'warning' | 'neutral') => {
  const statusColors = {
    success: {
      text: CHRONOS_2025.colors.success,
      bg: CHRONOS_2025.colors.successMuted,
    },
    danger: {
      text: CHRONOS_2025.colors.danger,
      bg: CHRONOS_2025.colors.dangerMuted,
    },
    warning: {
      text: CHRONOS_2025.colors.warning,
      bg: CHRONOS_2025.colors.warningMuted,
    },
    neutral: {
      text: CHRONOS_2025.colors.textSecondary,
      bg: 'rgba(255, 255, 255, 0.05)',
    },
  }
  return statusColors[status]
}

export type Chronos2025Theme = typeof CHRONOS_2025
