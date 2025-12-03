/**
 * �� CHRONOS PREMIUM COMPONENTS - ÍNDICE CENTRALIZADO
 * 
 * Sistema de componentes premium unificado.
 * Importar desde aquí para consistencia en todo el proyecto.
 * 
 * @version 2.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🃏 CARDS - Componentes de tarjeta
// ═══════════════════════════════════════════════════════════════════════════════

// GlassCard - Tarjeta glassmorphism principal
export { GlassCard, GlowingGlassCard } from '../ui/premium/GlassCard'
export type { GlassCardProps } from '../ui/premium/GlassCard'

// PremiumStatCard - Tarjeta de estadísticas con sparkline
export { PremiumStatCard } from '../ui/premium/PremiumStatCard'

// CardPremium - Tarjeta con variantes Apple/Tesla
export { 
  CardPremium,
  CardHeaderPremium,
  CardTitlePremium,
  CardDescriptionPremium,
  CardContentPremium,
  CardFooterPremium,
} from '../ui-premium/CardPremium'
export type { CardPremiumProps } from '../ui-premium/CardPremium'

// Card3D - Tarjeta con perspectiva 3D
export { Card3D } from '../ui/PremiumVisualizations'

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 BUTTONS - Botones premium
// ═══════════════════════════════════════════════════════════════════════════════

export { ButtonPremium } from '../ui-premium/ButtonPremium'
export type { ButtonPremiumProps } from '../ui-premium/ButtonPremium'

export { PremiumButton, MagneticButton } from '../ui/PremiumDesignSystem'
export { RippleButton } from '../ui/PremiumComponents'

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 INPUTS & FORMS - Campos de formulario
// ═══════════════════════════════════════════════════════════════════════════════

export { InputPremium, TextareaPremium } from '../ui-premium/InputPremium'
export { SelectPremium } from '../ui-premium/SelectPremium'
export { CheckboxPremium } from '../ui-premium/CheckboxPremium'
export { SwitchPremium } from '../ui-premium/SwitchPremium'
export { SliderPremium } from '../ui-premium/SliderPremium'
export { RadioGroupPremium } from '../ui-premium/RadioPremium'

export { PremiumInput } from '../ui/PremiumDesignSystem'

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ BADGES & STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export { BadgePremium, DotBadgePremium } from '../ui-premium/BadgePremium'
export { AnimatedBadge } from '../ui/PremiumDesignSystem'

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 DATA DISPLAY - Visualización de datos
// ═══════════════════════════════════════════════════════════════════════════════

export { AnimatedCounter, PremiumProgress, Skeleton } from '../ui/PremiumDesignSystem'
export { 
  AnimatedBarChart, 
  AnimatedRingChart, 
  AnimatedStatCard,
  ParticleBackground,
  WaveAnimation,
  GradientOrb,
  MorphingBlob,
} from '../ui/PremiumVisualizations'

// ═══════════════════════════════════════════════════════════════════════════════
// 💬 MODALS & DIALOGS
// ═══════════════════════════════════════════════════════════════════════════════

export { ModalPremium, ModalHeaderPremium, ModalFooterPremium } from '../ui-premium/ModalPremium'
export { DialogPremium, useDialog } from '../ui-premium/DialogPremium'

// Modales de CRUD
export { 
  CreateClienteModalPremium,
  CreateVentaModalPremium,
  CreateOrdenCompraModalPremium,
  CreateAbonoModalPremium,
  CreateGastoModalPremium,
  CreatePagoDistribuidorModalPremium,
  CreateTransferenciaModalPremium,
  CreateDistribuidorModalPremium,
  CreateIngresoModalPremium,
} from '../modals/premium-index'

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 OVERLAYS - Tooltips, Dropdowns, Toasts
// ═══════════════════════════════════════════════════════════════════════════════

export { TooltipPremium, SimpleTooltip } from '../ui-premium/TooltipPremium'
export { DropdownPremium } from '../ui-premium/DropdownPremium'
export { ToastProvider, useToast, useToastHelpers } from '../ui-premium/ToastPremium'
export { Tooltip } from '../ui/PremiumDesignSystem'

// ═══════════════════════════════════════════════════════════════════════════════
// 🧭 NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

export { TabsPremium, TabsContentPremium } from '../ui-premium/TabsPremium'

// ═══════════════════════════════════════════════════════════════════════════════
// 🌟 EFFECTS & BACKGROUNDS
// ═══════════════════════════════════════════════════════════════════════════════

export { GlowOrb, GradientText, PageTransition, ShimmerLoader } from '../ui/PremiumDesignSystem'
export { FluidGradientBackground, AuroraBackground } from '../ui/premium/FluidGradientBackground'
export { 
  PremiumOrbBackground,
  DashboardBackground,
  CyberpunkBackground,
} from '../3d/PremiumOrbBackground'

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

// Chat AI Principal (Grok-style)
export { GrokAIOrb } from '../widgets/GrokAIOrb'

// Orbe 3D con Three.js
export { FloatingAIOrb } from '../3d/FloatingAIOrb'

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  Panel3DWrapper,
  Dashboard3DPreset,
  Analytics3DPreset,
  Workflow3DPreset,
  AI3DPreset,
  ZeroPanel,
  ZeroAvatar,
  ZeroChatWidget,
  AnalyticsGlobe3D,
  WorkflowVisualizer3D,
} from '../3d'

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 VISUALIZATIONS (Canvas)
// ═══════════════════════════════════════════════════════════════════════════════

export { ClientNetworkGraph } from '../visualizations/ClientNetworkGraph'
export { SalesFlowDiagram } from '../visualizations/SalesFlowDiagram'
export { FinancialRiverFlow } from '../visualizations/FinancialRiverFlow'
export { InventoryHeatGrid } from '../visualizations/InventoryHeatGrid'
export { ProfitWaterfallChart } from '../visualizations/ProfitWaterfallChart'

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  fadeInUp,
  scaleIn,
  slideInFromRight,
  staggerContainer,
  staggerItem,
} from '../ui/PremiumDesignSystem'

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

export { default as QuickStatWidget } from '../widgets/QuickStatWidget'
export { default as MiniChartWidget } from '../widgets/MiniChartWidget'
export { default as ActivityFeedWidget } from '../widgets/ActivityFeedWidget'
export { default as CurrencyExchangeWidget } from '../widgets/CurrencyExchangeWidget'

// ═══════════════════════════════════════════════════════════════════════════════
// 🌑 OBSIDIAN GLASS PANELS - Sistema de paneles premium
// ═══════════════════════════════════════════════════════════════════════════════

// Sales - Panel de Ventas con flujo de 4 pasos
export { default as SalesCockpit } from './sales/SalesCockpit'
export { default as ObsidianDistributionSlider } from './sales/ObsidianDistributionSlider'
export { default as HolographicProductSearch } from './sales/HolographicProductSearch'

// Warehouse - Panel de Almacén con heatmap
export { default as WarehouseGrid } from './warehouse/WarehouseGrid'

// Banks - Template reutilizable para bóvedas
export { default as BankVaultPanel } from './banks/BankVaultPanel'

// CRM - Gestión de Clientes y Distribuidores
export { default as EntityRelationshipManager } from './crm/EntityRelationshipManager'

// Expenses - Central de Gastos
export { default as ExpenseCommandCenter } from './expenses/ExpenseCommandCenter'

// Settlements - Terminal de Abonos y Cobranza
export { default as SettlementTerminal } from './settlements/SettlementTerminal'
