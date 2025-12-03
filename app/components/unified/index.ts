/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎨 CHRONOS UNIFIED UI SYSTEM - INDEX
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de diseño unificado premium para CHRONOS.
 * Combina lo mejor de todos los sistemas de componentes.
 * 
 * USO:
 * import { ChronosButton, GlassCard, KPICard, QuantumTable } from '@/app/components/unified'
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 CORE UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  // Design Tokens
  CHRONOS,
  
  // Background
  AmbientBackground,
  
  // Core Components
  ChronosButton,
  ChronosInput,
  ChronosBadge,
  GlassCard,
  KPICard,
  HeroCard,
  BentoGrid,
  ChronosSkeleton,
} from './chronos-ui'

// ─────────────────────────────────────────────────────────────────────────────
// 🧭 NAVIGATION COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  ChronosSidebar,
  ChronosHeader,
  ChronosLayout,
  MAIN_NAV_ITEMS,
} from './chronos-navigation'

export type { NavItem } from './chronos-navigation'

// ─────────────────────────────────────────────────────────────────────────────
// 📊 DATA COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  QuantumTable,
  StatCard,
  BankCard,
  MiniChart,
  ActivityItem,
} from './chronos-data'

export type { Column, BankData } from './chronos-data'

// ─────────────────────────────────────────────────────────────────────────────
// 🪟 MODAL & FORM COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
export {
  ChronosModal,
  AlertDialog,
  ChronosSelect,
  ChronosTextarea,
  FormField,
  ChronosSlider,
  ChronosCheckbox,
} from './chronos-forms'

// ─────────────────────────────────────────────────────────────────────────────
// 🔄 LEGACY EXPORTS (compatibilidad con componentes existentes)
// ─────────────────────────────────────────────────────────────────────────────
export {
  ChronosPanel,
  AuroraBackground,
  UnifiedKPICard,
  UnifiedTable,
  SearchBar,
  PremiumButton,
  StatusBadge,
  ConnectionIndicator,
  CHRONOS_COLORS,
  SPRING_CONFIG,
  type KPIData,
  type TableColumn,
  type TableAction,
  type ChronosPanelProps,
} from './ChronosPanel'

// ─────────────────────────────────────────────────────────────────────────────
// 🎯 COMPONENT CATALOG (para referencia rápida)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * 
 * CORE UI:
 * ├── ChronosButton       - Botón premium con variantes y glow
 * ├── ChronosInput        - Input con label, error, iconos
 * ├── ChronosBadge        - Badge de estado con dot animado
 * ├── GlassCard           - Tarjeta glassmorphism
 * ├── KPICard             - Tarjeta de KPI con trend
 * ├── HeroCard            - Tarjeta hero grande con gradiente
 * ├── BentoGrid           - Layout grid responsivo
 * └── AmbientBackground   - Fondo con orbes animados
 * 
 * NAVIGATION:
 * ├── ChronosSidebar      - Barra lateral colapsable
 * ├── ChronosHeader       - Header con búsqueda y notificaciones
 * └── ChronosLayout       - Layout principal completo
 * 
 * DATA:
 * ├── QuantumTable        - Tabla con sorting, filtros, paginación
 * ├── StatCard            - Tarjeta de estadística simple
 * ├── BankCard            - Tarjeta de banco/bóveda temática
 * ├── MiniChart           - Sparkline chart
 * └── ActivityItem        - Item de actividad/transacción
 * 
 * FORMS:
 * ├── ChronosModal        - Modal con animaciones
 * ├── AlertDialog         - Diálogo de confirmación
 * ├── ChronosSelect       - Select dropdown
 * ├── ChronosTextarea     - Textarea
 * ├── FormField           - Wrapper para campos
 * ├── ChronosSlider       - Slider para valores
 * └── ChronosCheckbox     - Checkbox animado
 * 
 */
