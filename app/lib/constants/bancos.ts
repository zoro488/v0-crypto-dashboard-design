/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║              CONSTANTES DE BANCOS - FUENTE ÚNICA DE VERDAD                ║
 * ║                         CHRONOS SYSTEM v2.1                                ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este archivo centraliza TODAS las constantes relacionadas con bancos.
 * NO definir bancos en otros archivos - importar desde aquí.
 * 
 * @module constants/bancos
 * @version 2.1.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPO PRINCIPAL - ID de Banco
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IDs de los 7 bancos/bóvedas del sistema CHRONOS
 * Usar snake_case para consistencia con Firestore
 */
export type BancoId = 
  | 'boveda_monte'   // Bóveda principal MXN - recibe COSTO de ventas
  | 'boveda_usa'     // Bóveda USD
  | 'profit'         // Banco operativo
  | 'leftie'         // Banco operativo
  | 'azteca'         // Banco operativo
  | 'flete_sur'      // Gastos de flete - recibe FLETE de ventas
  | 'utilidades'     // Ganancias - recibe UTILIDAD de ventas

/**
 * Monedas soportadas por el sistema
 */
export type Moneda = 'MXN' | 'USD' | 'USDT'

/**
 * Tipo de banco según su función
 */
export type TipoBanco = 'boveda' | 'operativo' | 'gastos' | 'utilidades'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN COMPLETA DE BANCOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface BancoConfig {
  id: BancoId
  nombre: string
  nombreCorto: string
  icon: string
  color: string
  colorHex: string
  gradientFrom: string
  gradientTo: string
  tipo: TipoBanco
  moneda: Moneda
  descripcion: string
  /** ¿Recibe pagos de ventas (distribución GYA)? */
  recibePagosVentas: boolean
  /** ¿Se usa para pagar a proveedores? */
  pagoProveedores: boolean
  /** ¿Está activo en el sistema? */
  activo: boolean
  /** Orden de visualización en el dashboard */
  orden: number
}

/**
 * Configuración completa de los 7 bancos del sistema
 * Esta es la ÚNICA fuente de verdad para la configuración de bancos
 */
export const BANCOS_CONFIG: Record<BancoId, BancoConfig> = {
  boveda_monte: {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    nombreCorto: 'B. Monte',
    icon: '🏛️',
    color: 'from-blue-500 to-cyan-500',
    colorHex: '#3B82F6',
    gradientFrom: 'rgb(59, 130, 246)',
    gradientTo: 'rgb(6, 182, 212)',
    tipo: 'boveda',
    moneda: 'MXN',
    descripcion: 'Bóveda principal - Recuperación de costos',
    recibePagosVentas: true,
    pagoProveedores: true,
    activo: true,
    orden: 1,
  },
  boveda_usa: {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    nombreCorto: 'B. USA',
    icon: '🇺🇸',
    color: 'from-red-500 to-blue-500',
    colorHex: '#EF4444',
    gradientFrom: 'rgb(239, 68, 68)',
    gradientTo: 'rgb(59, 130, 246)',
    tipo: 'boveda',
    moneda: 'USD',
    descripcion: 'Bóveda para operaciones en dólares',
    recibePagosVentas: false,
    pagoProveedores: false,
    activo: true,
    orden: 2,
  },
  profit: {
    id: 'profit',
    nombre: 'Profit',
    nombreCorto: 'Profit',
    icon: '📈',
    color: 'from-indigo-500 to-purple-500',
    colorHex: '#6366F1',
    gradientFrom: 'rgb(99, 102, 241)',
    gradientTo: 'rgb(168, 85, 247)',
    tipo: 'operativo',
    moneda: 'MXN',
    descripcion: 'Banco operativo principal',
    recibePagosVentas: false,
    pagoProveedores: true,
    activo: true,
    orden: 3,
  },
  leftie: {
    id: 'leftie',
    nombre: 'Leftie',
    nombreCorto: 'Leftie',
    icon: '👈',
    color: 'from-yellow-500 to-orange-500',
    colorHex: '#EAB308',
    gradientFrom: 'rgb(234, 179, 8)',
    gradientTo: 'rgb(249, 115, 22)',
    tipo: 'operativo',
    moneda: 'MXN',
    descripcion: 'Banco operativo secundario',
    recibePagosVentas: false,
    pagoProveedores: true,
    activo: true,
    orden: 4,
  },
  azteca: {
    id: 'azteca',
    nombre: 'Azteca',
    nombreCorto: 'Azteca',
    icon: '🏦',
    color: 'from-purple-500 to-pink-500',
    colorHex: '#A855F7',
    gradientFrom: 'rgb(168, 85, 247)',
    gradientTo: 'rgb(236, 72, 153)',
    tipo: 'operativo',
    moneda: 'MXN',
    descripcion: 'Banco Azteca',
    recibePagosVentas: false,
    pagoProveedores: true,
    activo: true,
    orden: 5,
  },
  flete_sur: {
    id: 'flete_sur',
    nombre: 'Flete Sur',
    nombreCorto: 'Fletes',
    icon: '🚚',
    color: 'from-orange-500 to-amber-500',
    colorHex: '#F97316',
    gradientFrom: 'rgb(249, 115, 22)',
    gradientTo: 'rgb(245, 158, 11)',
    tipo: 'gastos',
    moneda: 'MXN',
    descripcion: 'Acumulado de gastos de flete',
    recibePagosVentas: true,
    pagoProveedores: false,
    activo: true,
    orden: 6,
  },
  utilidades: {
    id: 'utilidades',
    nombre: 'Utilidades',
    nombreCorto: 'Utilidades',
    icon: '💰',
    color: 'from-green-500 to-emerald-500',
    colorHex: '#22C55E',
    gradientFrom: 'rgb(34, 197, 94)',
    gradientTo: 'rgb(16, 185, 129)',
    tipo: 'utilidades',
    moneda: 'MXN',
    descripcion: 'Ganancias netas del negocio',
    recibePagosVentas: true,
    pagoProveedores: false,
    activo: true,
    orden: 7,
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARRAYS Y LISTAS DERIVADAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lista de todos los IDs de bancos
 */
export const BANCOS_IDS: BancoId[] = Object.keys(BANCOS_CONFIG) as BancoId[]

/**
 * Lista de bancos ordenados por su campo 'orden'
 */
export const BANCOS_ORDENADOS: BancoConfig[] = Object.values(BANCOS_CONFIG)
  .sort((a, b) => a.orden - b.orden)

/**
 * Bancos que reciben distribución GYA de ventas
 * Solo estos 3 bancos reciben dinero cuando se registra una venta
 */
export const BANCOS_DISTRIBUCION_GYA: BancoId[] = ['boveda_monte', 'flete_sur', 'utilidades']

/**
 * Bancos operativos (pueden recibir transferencias y pagar proveedores)
 */
export const BANCOS_OPERATIVOS: BancoId[] = ['profit', 'leftie', 'azteca']

/**
 * Bancos que pueden usarse para pagar a distribuidores
 */
export const BANCOS_PAGO_PROVEEDORES: BancoId[] = BANCOS_IDS.filter(
  id => BANCOS_CONFIG[id].pagoProveedores
)

/**
 * Bancos activos en el sistema
 */
export const BANCOS_ACTIVOS: BancoId[] = BANCOS_IDS.filter(
  id => BANCOS_CONFIG[id].activo
)

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene la configuración de un banco por su ID
 */
export function getBancoConfig(bancoId: BancoId): BancoConfig {
  return BANCOS_CONFIG[bancoId]
}

/**
 * Obtiene el nombre legible de un banco
 */
export function getBancoNombre(bancoId: BancoId): string {
  return BANCOS_CONFIG[bancoId]?.nombre || bancoId
}

/**
 * Obtiene el color de un banco (formato Tailwind)
 */
export function getBancoColor(bancoId: BancoId): string {
  return BANCOS_CONFIG[bancoId]?.color || 'from-gray-500 to-gray-600'
}

/**
 * Obtiene el ícono emoji de un banco
 */
export function getBancoIcon(bancoId: BancoId): string {
  return BANCOS_CONFIG[bancoId]?.icon || '🏦'
}

/**
 * Verifica si un banco recibe pagos de ventas (distribución GYA)
 */
export function bancoRecibePagosVentas(bancoId: BancoId): boolean {
  return BANCOS_CONFIG[bancoId]?.recibePagosVentas || false
}

/**
 * Verifica si un banco puede usarse para pagar proveedores
 */
export function bancoPuedepagarProveedores(bancoId: BancoId): boolean {
  return BANCOS_CONFIG[bancoId]?.pagoProveedores || false
}

/**
 * Verifica si un string es un BancoId válido
 */
export function isBancoId(value: string): value is BancoId {
  return BANCOS_IDS.includes(value as BancoId)
}

/**
 * Parsea un string a BancoId, lanzando error si es inválido
 */
export function parseBancoId(value: string): BancoId {
  if (!isBancoId(value)) {
    throw new Error(`ID de banco inválido: ${value}. Válidos: ${BANCOS_IDS.join(', ')}`)
  }
  return value
}

/**
 * Parsea un string a BancoId, retornando undefined si es inválido
 */
export function safeParseBancoId(value: string | null | undefined): BancoId | undefined {
  if (!value) return undefined
  return isBancoId(value) ? value : undefined
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALORES POR DEFECTO PARA CREACIÓN DE BANCOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estructura inicial de un banco en Firestore
 */
export interface BancoFirestoreDefaults {
  capitalActual: number
  capitalInicial: number
  historicoIngresos: number
  historicoGastos: number
  historicoTransferencias: number
  estado: 'activo' | 'inactivo' | 'negativo'
}

/**
 * Valores por defecto para crear un nuevo banco en Firestore
 */
export const BANCO_DEFAULTS: BancoFirestoreDefaults = {
  capitalActual: 0,
  capitalInicial: 0,
  historicoIngresos: 0,
  historicoGastos: 0,
  historicoTransferencias: 0,
  estado: 'activo',
}

/**
 * Obtiene los datos completos para crear un banco en Firestore
 */
export function getBancoInitialData(bancoId: BancoId): BancoConfig & BancoFirestoreDefaults {
  return {
    ...BANCOS_CONFIG[bancoId],
    ...BANCO_DEFAULTS,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRECIO DE FLETE POR DEFECTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Precio de flete por defecto por unidad (MXN)
 * Usado cuando no se especifica un flete personalizado
 */
export const PRECIO_FLETE_DEFAULT = 500

/**
 * Decimales para redondeo de montos monetarios
 */
export const DECIMALES_MONEDA = 2

// ═══════════════════════════════════════════════════════════════════════════════
// OPCIONES PARA SELECT/COMBOBOX
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Opciones formateadas para usar en componentes Select/Combobox
 */
export const BANCOS_OPTIONS = BANCOS_ORDENADOS.map(banco => ({
  value: banco.id,
  label: banco.nombre,
  description: banco.descripcion,
  icon: banco.icon,
}))

/**
 * Opciones de bancos que pueden recibir pagos de ventas
 */
export const BANCOS_OPTIONS_VENTAS = BANCOS_OPTIONS.filter(
  opt => BANCOS_DISTRIBUCION_GYA.includes(opt.value as BancoId)
)

/**
 * Opciones de bancos para pagar a proveedores
 */
export const BANCOS_OPTIONS_PROVEEDORES = BANCOS_OPTIONS.filter(
  opt => BANCOS_PAGO_PROVEEDORES.includes(opt.value as BancoId)
)

export default BANCOS_CONFIG
