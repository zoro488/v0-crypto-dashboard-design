/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 CHRONOS COMPONENT SYSTEM - Central Export Index
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Índice centralizado de todos los componentes del sistema CHRONOS.
 * Importa desde aquí para acceso simplificado a cualquier componente.
 * 
 * Ejemplo de uso:
 * import { 
 *   PremiumStatCard, 
 *   GlobalCommandMenu, 
 *   NotificationDrawer,
 *   MobileNavBar,
 *   AIVoiceAssistant 
 * } from '@/app/components'
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 UI-PREMIUM - Sistema de Diseño Apple/Tesla
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Core Components
  ButtonPremium,
  CardPremium,
  CardHeaderPremium,
  CardTitlePremium,
  CardDescriptionPremium,
  CardContentPremium,
  CardFooterPremium,
  InputPremium,
  TextareaPremium,
  
  // Status & Labels
  BadgePremium,
  DotBadgePremium,
  
  // Form Controls
  SelectPremium,
  CheckboxPremium,
  RadioGroupPremium,
  SwitchPremium,
  SliderPremium,
  
  // Overlays
  ModalPremium,
  ModalHeaderPremium,
  ModalFooterPremium,
  DialogPremium,
  useDialog,
  ToastProvider,
  useToast,
  useToastHelpers,
  DropdownPremium,
  TooltipPremium,
  SimpleTooltip,
  
  // Navigation
  TabsPremium,
  TabsContentPremium,
  
  // Obsidian Glass Design System
  AtmosphericBackground,
  ObsidianCard,
  ObsidianCardHeader,
  ObsidianCardContent,
  ObsidianCardFooter,
  KPICard,
  KPIGrid,
  LuminousIcon,
  BadgeLuminous,
  
  // Chronos Obsidian OS
  NoiseTexture,
  SparklineBackground,
  ObsidianModal,
  MetalCardSelector,
  HeroInput,
  ObsidianButton,
  HeroMetricCard,
  BentoMetricCard,
  
  // Mega Components - Ultra Premium
  PremiumStatCard,
  QuantumTable,
  HolographicAreaChart,
} from './ui-premium'

export type {
  ButtonPremiumProps,
  CardPremiumProps,
  InputPremiumProps,
  TextareaPremiumProps,
  BadgePremiumProps,
  DotBadgePremiumProps,
  SelectPremiumProps,
  SelectPremiumOption,
  CheckboxPremiumProps,
  RadioGroupPremiumProps,
  RadioOption,
  SwitchPremiumProps,
  SliderPremiumProps,
  ModalPremiumProps,
  DialogPremiumProps,
  DialogVariant,
  Toast,
  ToastType,
  ToastPosition,
  DropdownPremiumProps,
  DropdownItem,
  TooltipPremiumProps,
  SimpleTooltipProps,
  TabsPremiumProps,
  ColumnDef,
} from './ui-premium'

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 AI COMPONENTS - Inteligencia Artificial
// ═══════════════════════════════════════════════════════════════════════════

export { AIVoiceAssistant } from './ai'

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 COMMAND PALETTE - Neural Nexus
// ═══════════════════════════════════════════════════════════════════════════

export { GlobalCommandMenu, useCommandMenu } from './command'

// ═══════════════════════════════════════════════════════════════════════════
// 🔔 NOTIFICATIONS - Pulse Feed
// ═══════════════════════════════════════════════════════════════════════════

export { NotificationDrawer, useNotifications } from './notifications'
export type { Notification, NotificationType } from './notifications'

// ═══════════════════════════════════════════════════════════════════════════
// 📱 NAVIGATION - Mobile Components
// ═══════════════════════════════════════════════════════════════════════════

export { MobileNavBar } from './navigation'
