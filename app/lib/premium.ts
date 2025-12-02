/**
 * 🎨 PREMIUM COMPONENTS INDEX - Apple/Tesla/Grok 2025
 * 
 * Exportaciones centralizadas de todos los componentes premium.
 * Importar desde aquí para consistencia en toda la app.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  layout,
  glassmorphism,
  componentVariants,
  generateCSSVariables,
  type DesignTokens,
} from '@/app/lib/design-tokens'

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Tesla KPI Cards
export {
  TeslaKPICard,
  KPIGrid,
  MiniKPICard,
} from '@/app/components/ui/TeslaKPICard'

// Tesla Data Table
export {
  TeslaDataTable,
  defaultTableActions,
} from '@/app/components/ui/TeslaDataTable'

// Apple Modal System
export {
  AppleModal,
  AppleInput,
  AppleSelect,
  AppleButton,
  AppleFormFooter,
} from '@/app/components/ui/AppleModal'

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Panel Actions Sidebar
export {
  PanelActionsSidebar,
} from '@/app/components/layout/PanelActionsSidebar'

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

// Grok AI Orb
export {
  GrokAIOrb,
} from '@/app/components/widgets/GrokAIOrb'

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS FROM EXISTING PREMIUM DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export {
  GlassCard,
  PremiumButton,
  AnimatedCounter,
  GlowOrb,
  PremiumInput,
  MagneticButton,
  PremiumProgress,
  AnimatedBadge,
  Skeleton,
  Tooltip,
  fadeInUp,
  scaleIn,
  slideInFromRight,
  staggerContainer,
  staggerItem,
} from '@/app/components/ui/PremiumDesignSystem'

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ejemplo de uso en un panel:
 * 
 * ```tsx
 * import {
 *   TeslaKPICard,
 *   KPIGrid,
 *   TeslaDataTable,
 *   AppleModal,
 *   AppleInput,
 *   GrokAIOrb,
 *   PanelActionsSidebar,
 * } from '@/app/lib/premium'
 * 
 * export function MyPanel() {
 *   return (
 *     <div>
 *       <KPIGrid columns={4}>
 *         <TeslaKPICard
 *           title="Ventas Totales"
 *           value={125000}
 *           format="currency"
 *           trend={12.5}
 *           icon={DollarSign}
 *         />
 *       </KPIGrid>
 *       
 *       <TeslaDataTable
 *         data={ventas}
 *         columns={columns}
 *         actions={defaultTableActions({
 *           onView: handleView,
 *           onEdit: handleEdit,
 *           onDelete: handleDelete,
 *         })}
 *       />
 *       
 *       <GrokAIOrb />
 *     </div>
 *   )
 * }
 * ```
 */
