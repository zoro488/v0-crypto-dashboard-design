/**
 * 🎨 Exportaciones de componentes 3D Chronos
 * Sistema completo de componentes 3D para el Dashboard
 */

// ============================================================================
// BOTONES Y NAVEGACIÓN GLASS
// ============================================================================

// Botones 3D estilo Reijo Palmiste
export { GlassButton3D, GlassButtonGroup } from './GlassButton3D';

// Iconos de navegación 3D
export { 
  GlassNavIcon, 
  GlassNavBar, 
  CHRONOS_NAV_ITEMS,
  type NavIconProps,
  type GlassNavBarProps,
} from './GlassNavIcons';

// Re-exportar tipos de botones
export type { GlassButtonProps } from './GlassButton3D';

// ============================================================================
// IA Y ASISTENTE VIRTUAL
// ============================================================================

// Orbe de voz IA (modelo 3D para widget flotante)
export { AIVoiceOrb, type OrbState } from './models/AIVoiceOrb';

// Widget flotante completo con IA
export { FloatingAIOrb } from './FloatingAIOrb';

// Panel IA Inmersivo con robot interactivo
export { ImmersiveAIPanel } from './ImmersiveAIPanel';

// ============================================================================
// EFECTOS Y LOADERS
// ============================================================================

// Portal de fuego estilo Dr. Strange
export { FirePortal3D, PortalLoadingOverlay } from './FirePortal3D';

// ============================================================================
// DEMOS
// ============================================================================

// Demo para visualización de glass components
export { Glass3DDemo } from './Glass3DDemo';
