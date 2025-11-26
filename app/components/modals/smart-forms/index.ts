/**
 * 🚀 SMART FORMS - Índice de Exportaciones
 * 
 * Sistema de formularios inteligentes con:
 * - Progressive Disclosure
 * - HybridCombobox (buscar o crear inline)
 * - AI Voice Fill
 * - Glassmorphism futurista
 * - Animaciones Framer Motion
 */

// ============================================
// COMPONENTES UI REUTILIZABLES
// ============================================

export { HybridCombobox } from "@/components/ui/HybridCombobox"
export { SmartStepFormWrapper, StepContent, StepGrid, StepSection } from "@/components/ui/SmartStepFormWrapper"

// ============================================
// MODALES SMART
// ============================================

// Los modales Smart se exportan desde sus ubicaciones originales
// Import paths corregidos para usar la ruta correcta
export { default as CreateVentaModalSmart } from "../CreateVentaModalSmart"
export { default as CreateOrdenCompraModalSmart } from "../CreateOrdenCompraModalSmart"
export { default as CreateProductoModalSmart } from "../CreateProductoModalSmart"

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

// Nota: El archivo de schemas necesita ser creado
// export { ... } from "@/app/lib/validations/smart-forms-schemas"

// ============================================
// TIPOS
// ============================================

export type { FormStep } from "@/components/ui/SmartStepFormWrapper"
