/**
 * 🎨 CHRONOS DESIGN SYSTEM - Tesla 2025 Edition
 * 
 * Componentes premium con estándares Apple Vision Pro + Tesla Cybertruck
 * 
 * COLORES PRINCIPALES:
 * - Background: #000000 (pure black)
 * - Surface: #1C1C1E (elevated)
 * - Tesla Red: #E31911 (accent único)
 * - Text Primary: #FFFFFF
 * - Text Secondary: #98989D
 * - Border: rgba(255,255,255,0.08)
 * 
 * TIPOGRAFÍA:
 * - Font: SF Pro Display / Inter
 * - KPIs: 64px bold
 * - Headers: 24px semibold
 * - Body: 15-17px regular
 * 
 * ESPACIADO:
 * - Border Radius: 20px (cards), 12px (buttons)
 * - Padding: 24px (cards), 16px (items)
 * - Gap: 24px (sections), 12px (items)
 * 
 * EFECTOS:
 * - Glassmorphism: blur(24px) + border 1px white/8
 * - Shadows: 0 25px 50px rgba(0,0,0,0.5)
 * - Transitions: spring(300, 30) via Framer Motion
 */

// ═══════════════════════════════════════════════════════════════════════════
// BOTONES
// ═══════════════════════════════════════════════════════════════════════════

export { ButtonTesla } from './ButtonTesla'
export type { ButtonTeslaProps } from './ButtonTesla'

export { ButtonUltra } from './ButtonUltra'

// ═══════════════════════════════════════════════════════════════════════════
// INPUTS
// ═══════════════════════════════════════════════════════════════════════════

export { InputTesla, TextareaTesla } from './InputTesla'
export type { InputTeslaProps, TextareaTeslaProps } from './InputTesla'

export { SelectTesla } from './SelectTesla'
export type { SelectTeslaProps, SelectOption } from './SelectTesla'

// ═══════════════════════════════════════════════════════════════════════════
// CARDS
// ═══════════════════════════════════════════════════════════════════════════

export { 
  CardTesla, 
  CardHeader, 
  CardContent, 
  CardFooter,
  StatCard,
  BankCard, 
} from './CardTesla'
export type { CardTeslaProps } from './CardTesla'

// ═══════════════════════════════════════════════════════════════════════════
// MODALES
// ═══════════════════════════════════════════════════════════════════════════

export { ModalTesla, ModalFooter, ConfirmModal } from './ModalTesla'
export type { ModalTeslaProps } from './ModalTesla'

// ═══════════════════════════════════════════════════════════════════════════
// TABLAS
// ═══════════════════════════════════════════════════════════════════════════

export { TableTesla, Badge } from './TableTesla'
export type { TableTeslaProps, Column } from './TableTesla'

// ═══════════════════════════════════════════════════════════════════════════
// TOASTS/NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════════════════

export { ToastProvider, useToast, useToastActions } from './ToastTesla'
export type { Toast, ToastVariant } from './ToastTesla'

// ═══════════════════════════════════════════════════════════════════════════
// LOADING/SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonKPI, 
  SkeletonTable, 
  SkeletonList,
  SkeletonDashboard, 
} from './SkeletonTesla'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES DE DISEÑO
// ═══════════════════════════════════════════════════════════════════════════

export const DESIGN_TOKENS = {
  colors: {
    // Backgrounds
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    
    // Brand
    accent: '#E31911',
    accentHover: '#FF453A',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#98989D',
    textMuted: '#636366',
    
    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    error: '#E31911',
    info: '#3B82F6',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    borderMedium: 'rgba(255, 255, 255, 0.12)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },
  
  typography: {
    kpi: {
      fontSize: '64px',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '-0.02em',
    },
    h1: {
      fontSize: '32px',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body: {
      fontSize: '15px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '13px',
      fontWeight: 500,
      lineHeight: 1.4,
    },
  },
  
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.15)',
    md: '0 4px 16px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.3)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.5)',
    glow: '0 0 60px rgba(227, 25, 17, 0.15)',
  },
  
  blur: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '50px',
  },
  
  transitions: {
    fast: '150ms ease',
    default: '200ms ease',
    slow: '300ms ease',
    spring: {
      stiffness: 300,
      damping: 30,
    },
  },
  
  layout: {
    sidebar: {
      expanded: '280px',
      collapsed: '72px',
    },
    header: {
      height: '72px',
    },
    bottomBar: {
      height: '64px',
    },
    content: {
      maxWidth: '1440px',
      padding: '24px',
    },
  },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const formatCurrency = (
  value: number, 
  locale = 'es-MX', 
  currency = 'MXN',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatNumber = (
  value: number, 
  locale = 'es-MX',
): string => {
  return new Intl.NumberFormat(locale).format(value)
}

export const formatPercentage = (
  value: number,
  decimals = 1,
): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export const formatDate = (
  date: Date | string,
  locale = 'es-MX',
): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
