/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                   CONSTANTES CENTRALIZADAS - CHRONOS SYSTEM               ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este archivo exporta TODAS las constantes del sistema.
 * Importar desde aquí para garantizar consistencia.
 * 
 * @module constants
 */

// ═══════════════════════════════════════════════════════════════════════════════
// BANCOS Y CONFIGURACIÓN FINANCIERA
// ═══════════════════════════════════════════════════════════════════════════════

export * from './bancos'

// ═══════════════════════════════════════════════════════════════════════════════
// COLECCIONES DE FIRESTORE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Nombres de colecciones en Firestore
 * Usar snake_case para consistencia
 */
export const COLLECTIONS = {
  // Entidades principales
  BANCOS: 'bancos',
  VENTAS: 'ventas',
  CLIENTES: 'clientes',
  DISTRIBUIDORES: 'distribuidores',
  ORDENES_COMPRA: 'ordenes_compra',
  
  // Almacén
  ALMACEN: 'almacen',
  ALMACEN_PRODUCTOS: 'almacen_productos',
  ALMACEN_ENTRADAS: 'almacen_entradas',
  ALMACEN_SALIDAS: 'almacen_salidas',
  
  // Movimientos financieros
  MOVIMIENTOS: 'movimientos',
  TRANSFERENCIAS: 'transferencias',
  ABONOS: 'abonos',
  INGRESOS: 'ingresos',
  GASTOS: 'gastos',
  GASTOS_ABONOS: 'gastos_abonos',
  PAGOS_DISTRIBUIDORES: 'pagos_distribuidores',
  
  // Reportes y cortes
  CORTES_BANCARIOS: 'cortes_bancarios',
  DASHBOARD_STATS: 'dashboard_stats',
  DASHBOARD_TOTALES: 'dashboard_totales',
  DASHBOARD_PANELES: 'dashboard_paneles',
  
  // Sistema y auditoría
  LOGS: 'logs',
  AUDIT_LOGS: 'audit_logs',
  USUARIOS: 'usuarios',
  CONFIGURACION: 'configuracion',
  PRODUCTOS: 'productos',
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADOS DE ENTIDADES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estados posibles de pago
 */
export const ESTADOS_PAGO = {
  COMPLETO: 'completo',
  PARCIAL: 'parcial',
  PENDIENTE: 'pendiente',
} as const

export type EstadoPago = typeof ESTADOS_PAGO[keyof typeof ESTADOS_PAGO]

/**
 * Estados de orden de compra
 */
export const ESTADOS_ORDEN_COMPRA = {
  PENDIENTE: 'pendiente',
  PARCIAL: 'parcial',
  PAGADO: 'pagado',
  CANCELADO: 'cancelado',
} as const

export type EstadoOrdenCompra = typeof ESTADOS_ORDEN_COMPRA[keyof typeof ESTADOS_ORDEN_COMPRA]

/**
 * Estados de entidad (cliente, distribuidor, etc.)
 */
export const ESTADOS_ENTIDAD = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  SUSPENDIDO: 'suspendido',
} as const

export type EstadoEntidad = typeof ESTADOS_ENTIDAD[keyof typeof ESTADOS_ENTIDAD]

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTODOS DE PAGO
// ═══════════════════════════════════════════════════════════════════════════════

export const METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  CRYPTO: 'crypto',
  CHEQUE: 'cheque',
  CREDITO: 'credito',
} as const

export type MetodoPago = typeof METODOS_PAGO[keyof typeof METODOS_PAGO]

export const METODOS_PAGO_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'crypto', label: 'Crypto', icon: '₿' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'credito', label: 'Crédito', icon: '💳' },
] as const

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE MOVIMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

export const TIPOS_MOVIMIENTO = {
  INGRESO: 'ingreso',
  GASTO: 'gasto',
  TRANSFERENCIA_ENTRADA: 'transferencia_entrada',
  TRANSFERENCIA_SALIDA: 'transferencia_salida',
  ABONO_CLIENTE: 'abono_cliente',
  PAGO_DISTRIBUIDOR: 'pago_distribuidor',
} as const

export type TipoMovimiento = typeof TIPOS_MOVIMIENTO[keyof typeof TIPOS_MOVIMIENTO]

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE PAGINACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE UI
// ═══════════════════════════════════════════════════════════════════════════════

export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  LOADING_DELAY: 150,
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE PANELES
// ═══════════════════════════════════════════════════════════════════════════════

export type PanelId = 
  | 'dashboard'
  | 'bancos'
  | 'banco'
  | 'boveda_monte'
  | 'boveda_usa'
  | 'utilidades'
  | 'flete_sur'
  | 'azteca'
  | 'leftie'
  | 'profit'
  | 'ventas'
  | 'ordenes'
  | 'ordenes_compra'
  | 'clientes'
  | 'distribuidores'
  | 'almacen'
  | 'reportes'
  | 'ia'
  | 'configuracion'
  | 'gya'
  | 'gastos'
  | 'abonos'

export const PANEL_CONFIG: Record<PanelId, { titulo: string; icon: string; descripcion: string }> = {
  dashboard: { titulo: 'Dashboard', icon: '📊', descripcion: 'Vista general del sistema' },
  bancos: { titulo: 'Bancos', icon: '🏦', descripcion: 'Gestión de bancos y bóvedas' },
  banco: { titulo: 'Banco', icon: '🏦', descripcion: 'Detalle de banco' },
  boveda_monte: { titulo: 'Bóveda Monte', icon: '🏛️', descripcion: 'Bóveda principal MXN' },
  boveda_usa: { titulo: 'Bóveda USA', icon: '🇺🇸', descripcion: 'Bóveda USD' },
  utilidades: { titulo: 'Utilidades', icon: '💰', descripcion: 'Ganancias del negocio' },
  flete_sur: { titulo: 'Flete Sur', icon: '🚚', descripcion: 'Gastos de flete' },
  azteca: { titulo: 'Azteca', icon: '🏦', descripcion: 'Banco Azteca' },
  leftie: { titulo: 'Leftie', icon: '👈', descripcion: 'Banco Leftie' },
  profit: { titulo: 'Profit', icon: '📈', descripcion: 'Banco Profit' },
  ventas: { titulo: 'Ventas', icon: '🛒', descripcion: 'Gestión de ventas' },
  ordenes: { titulo: 'Órdenes', icon: '📦', descripcion: 'Órdenes de compra' },
  ordenes_compra: { titulo: 'Órdenes de Compra', icon: '📦', descripcion: 'Gestión de OC' },
  clientes: { titulo: 'Clientes', icon: '👥', descripcion: 'Gestión de clientes' },
  distribuidores: { titulo: 'Distribuidores', icon: '🚚', descripcion: 'Gestión de proveedores' },
  almacen: { titulo: 'Almacén', icon: '📋', descripcion: 'Control de inventario' },
  reportes: { titulo: 'Reportes', icon: '📈', descripcion: 'Reportes y estadísticas' },
  ia: { titulo: 'IA', icon: '🤖', descripcion: 'Asistente de IA' },
  configuracion: { titulo: 'Configuración', icon: '⚙️', descripcion: 'Ajustes del sistema' },
  gya: { titulo: 'Gastos y Abonos', icon: '💳', descripcion: 'Panel GYA' },
  gastos: { titulo: 'Gastos', icon: '💸', descripcion: 'Registro de gastos' },
  abonos: { titulo: 'Abonos', icon: '💵', descripcion: 'Registro de abonos' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERIODOS DE REPORTE
// ═══════════════════════════════════════════════════════════════════════════════

export const PERIODOS_REPORTE = {
  DIARIO: 'diario',
  SEMANAL: 'semanal',
  MENSUAL: 'mensual',
  TRIMESTRAL: 'trimestral',
  ANUAL: 'anual',
  PERSONALIZADO: 'personalizado',
} as const

export type PeriodoReporte = typeof PERIODOS_REPORTE[keyof typeof PERIODOS_REPORTE]

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATOS DE EXPORTACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

export const FORMATOS_EXPORTACION = {
  CSV: 'csv',
  XLSX: 'xlsx',
  PDF: 'pdf',
  JSON: 'json',
} as const

export type FormatoExportacion = typeof FORMATOS_EXPORTACION[keyof typeof FORMATOS_EXPORTACION]
