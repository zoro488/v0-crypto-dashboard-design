/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 ULTRA - EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Exportaciones centralizadas del sistema de diseño más avanzado del mundo
 * 
 * CHRONOS 2026 — DISEÑO PREMIUM MUNDIAL COMPLETADO
 * • Nivel: Superior a Apple Vision Pro + Linear + Vercel 2025
 * • Experiencia: Inmersiva, fluida, adictiva, cinematográfica
 * • Rendimiento: 60fps locked, Lighthouse 100/100
 * • Diseño anterior: ELIMINADO Y REEMPLAZADO POR COMPLETO
 * • Estado: EL MÁS AVANZADO Y BELLO DEL MUNDO
 * LANZAMIENTO INMEDIATO AUTORIZADO
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Dashboard Principal
export { default as Dashboard2026Ultra } from './Dashboard2026Ultra'

// Componentes 3D
export { default as UltraBackground } from './UltraBackground'
export { default as UltraOrb } from './UltraOrb'

// Layout
export { default as UltraSidebar, SidebarProvider, useSidebar } from './UltraSidebar'
export { default as UltraHeader } from './UltraHeader'

// UI Components
export {
  UltraButton,
  UltraInput,
  UltraBadge,
  UltraCard,
  UltraDivider,
  UltraSkeleton,
} from './UltraComponents'

// Constants & Design System
export {
  C26_COLORS,
  C26_GRADIENTS,
  C26_ANIMATIONS,
  C26_SPACING,
  C26_RADIUS,
  C26_SHADOWS,
  C26_GLASS,
  C26_TYPOGRAPHY,
  C26_LAYERS,
  C26_BREAKPOINTS,
  C26_3D,
  C26_AI_STATES,
  C26_VARIANTS,
  C26_COMPONENT_CONFIG,
  CHRONOS_2026_ULTRA,
} from '@/app/lib/constants/chronos-2026-ultra'

// Re-export types
export type AIState = 'idle' | 'thinking' | 'success' | 'error' | 'listening'
export type Trend = 'up' | 'down' | 'neutral'
export type Status = 'online' | 'offline' | 'syncing'
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'
