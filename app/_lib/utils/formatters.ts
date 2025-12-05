// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FORMATTERS
// Re-export de utilidades de formateo
// ═══════════════════════════════════════════════════════════════

// Re-export desde el archivo principal de utils
export { 
  formatCurrency, 
  formatDate, 
  formatDateTime,
  formatPercent,
  formatNumber,
} from './index'

// Alias adicionales para compatibilidad
export { formatCurrency as formatMoney } from './index'
export { formatDate as formatFecha } from './index'
