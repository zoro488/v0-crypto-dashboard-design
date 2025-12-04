// ═══════════════════════════════════════════════════════════════
// CHRONOS - CONFIGURACIÓN DE BANCOS / BÓVEDAS
// Los 7 bancos del sistema con sus configuraciones
// ═══════════════════════════════════════════════════════════════

export type BancoId = 
  | 'boveda_monte'
  | 'boveda_usa'
  | 'profit'
  | 'leftie'
  | 'azteca'
  | 'flete_sur'
  | 'utilidades'

export interface BancoConfig {
  id: BancoId
  nombre: string
  descripcion: string
  tipo: 'operativo' | 'inversion' | 'ahorro'
  color: string
  colorGradient: string
  icono: string
  orden: number
}

export const BANCOS_CONFIG: Record<BancoId, BancoConfig> = {
  boveda_monte: {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    descripcion: 'Capital de compras y costos de inventario',
    tipo: 'operativo',
    color: '#3B82F6', // Blue
    colorGradient: 'from-blue-500 to-blue-600',
    icono: 'Vault',
    orden: 1,
  },
  boveda_usa: {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    descripcion: 'Capital en dólares para importaciones',
    tipo: 'operativo',
    color: '#10B981', // Emerald
    colorGradient: 'from-emerald-500 to-emerald-600',
    icono: 'DollarSign',
    orden: 2,
  },
  profit: {
    id: 'profit',
    nombre: 'Profit',
    descripcion: 'Ganancias acumuladas para reinversión',
    tipo: 'inversion',
    color: '#8B5CF6', // Violet
    colorGradient: 'from-violet-500 to-violet-600',
    icono: 'TrendingUp',
    orden: 3,
  },
  leftie: {
    id: 'leftie',
    nombre: 'Leftie',
    descripcion: 'Fondo de reserva y emergencias',
    tipo: 'ahorro',
    color: '#F59E0B', // Amber
    colorGradient: 'from-amber-500 to-amber-600',
    icono: 'Shield',
    orden: 4,
  },
  azteca: {
    id: 'azteca',
    nombre: 'Azteca',
    descripcion: 'Cuenta bancaria principal Azteca',
    tipo: 'operativo',
    color: '#EF4444', // Red
    colorGradient: 'from-red-500 to-red-600',
    icono: 'CreditCard',
    orden: 5,
  },
  flete_sur: {
    id: 'flete_sur',
    nombre: 'Flete Sur',
    descripcion: 'Fondos destinados a logística y transporte',
    tipo: 'operativo',
    color: '#06B6D4', // Cyan
    colorGradient: 'from-cyan-500 to-cyan-600',
    icono: 'Truck',
    orden: 6,
  },
  utilidades: {
    id: 'utilidades',
    nombre: 'Utilidades',
    descripcion: 'Ganancias netas después de costos',
    tipo: 'inversion',
    color: '#22C55E', // Green
    colorGradient: 'from-green-500 to-green-600',
    icono: 'Sparkles',
    orden: 7,
  },
}

// Array ordenado para iteración
export const BANCOS_ORDENADOS = Object.values(BANCOS_CONFIG).sort((a, b) => a.orden - b.orden)

// Helper para obtener config por ID
export function getBancoConfig(id: BancoId): BancoConfig {
  return BANCOS_CONFIG[id]
}

// Tipos de banco para filtros
export const TIPOS_BANCO = ['operativo', 'inversion', 'ahorro'] as const
export type TipoBanco = typeof TIPOS_BANCO[number]

// Colores por tipo
export const COLORES_TIPO_BANCO: Record<TipoBanco, string> = {
  operativo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  inversion: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  ahorro: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}
