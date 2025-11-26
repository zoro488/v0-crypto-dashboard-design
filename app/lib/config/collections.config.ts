/**
 * 🗂️ CONFIGURACIÓN DE COLECCIONES FIRESTORE - CHRONOS SYSTEM
 * 
 * Arquitectura definitiva basada en análisis quirúrgico:
 * - 8 colecciones principales (consolidadas)
 * - Nombres estandarizados en snake_case
 * - Tipos de documentos definidos
 * 
 * Referencia: ARQUITECTURA_FIRESTORE_QUIRURGICA.md
 */

import type { BancoId } from "@/app/types"

// ============================================================
// NOMBRES DE COLECCIONES - FUENTE ÚNICA DE VERDAD
// ============================================================

export const COLLECTIONS = {
  // 📊 Entidades principales
  VENTAS: "ventas",                    // 193 docs - Todas las ventas
  CLIENTES: "clientes",                // 64 docs - Clientes únicos
  DISTRIBUIDORES: "distribuidores",    // 14 docs - Proveedores
  ORDENES_COMPRA: "ordenes_compra",    // 300 docs - Órdenes de compra (snake_case!)
  
  // 💰 Sistema financiero
  BANCOS: "bancos",                    // 8 docs - Configuración de bancos
  MOVIMIENTOS: "movimientos",          // Colección UNIFICADA de movimientos financieros
  CORTES_BANCARIOS: "cortes_bancarios",// Cierres periódicos
  
  // 📦 Almacén
  ALMACEN: "almacen_productos",        // Alias para compatibilidad
  ALMACEN_PRODUCTOS: "almacen_productos", // Inventario actual
  ALMACEN_ENTRADAS: "almacen_entradas",   // Histórico de entradas
  ALMACEN_SALIDAS: "almacen_salidas",     // Histórico de salidas
  
  // 🔄 Sistema
  TRANSFERENCIAS: "transferencias",    // Transferencias entre bancos
  ABONOS: "abonos",                    // Abonos de clientes/distribuidores
  GASTOS_ABONOS: "gastos_abonos",      // GYA del Excel (302 registros)
  
  // 📈 Reportes y auditoría
  REPORTES: "reportes",
  AUDIT_LOGS: "audit_logs",
  
  // ⚠️ LEGACY - NO USAR (para migración)
  /** @deprecated Usar ORDENES_COMPRA */
  ORDENES_COMPRA_LEGACY: "ordenesCompra",
  /** @deprecated Usar ALMACEN_PRODUCTOS */
  ALMACEN_LEGACY: "almacen",
} as const

// Tipo para nombres de colección
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]

// ============================================================
// IDS DE BANCO - ESTANDARIZADOS (snake_case)
// ============================================================

export const BANCO_IDS: Record<string, BancoId> = {
  BOVEDA_MONTE: "boveda_monte",
  BOVEDA_USA: "boveda_usa",
  PROFIT: "profit",
  LEFTIE: "leftie",
  AZTECA: "azteca",
  FLETE_SUR: "flete_sur",
  UTILIDADES: "utilidades",
} as const

// Array de todos los IDs de banco
export const ALL_BANCO_IDS: BancoId[] = [
  "boveda_monte",
  "boveda_usa",
  "profit",
  "leftie",
  "azteca",
  "flete_sur",
  "utilidades"
]

// ============================================================
// MAPEO DE NOMBRES LEGACY A IDS CORRECTOS
// ============================================================

/**
 * Mapea nombres de banco en diferentes formatos al ID correcto
 * Útil para migración y compatibilidad con datos legacy
 */
export const BANCO_NAME_TO_ID: Record<string, BancoId> = {
  // Snake case (correcto)
  "boveda_monte": "boveda_monte",
  "boveda_usa": "boveda_usa",
  "profit": "profit",
  "leftie": "leftie",
  "azteca": "azteca",
  "flete_sur": "flete_sur",
  "utilidades": "utilidades",
  
  // Kebab case (legacy)
  "boveda-monte": "boveda_monte",
  "boveda-usa": "boveda_usa",
  "flete-sur": "flete_sur",
  
  // Camel case (legacy)
  "bovedaMonte": "boveda_monte",
  "bovedaUsa": "boveda_usa",
  "bovedaUSA": "boveda_usa",
  "fleteSur": "flete_sur",
  "fletes": "flete_sur",
  
  // Nombres display
  "Bóveda Monte": "boveda_monte",
  "Boveda Monte": "boveda_monte",
  "Bóveda USA": "boveda_usa",
  "Boveda USA": "boveda_usa",
  "Profit": "profit",
  "Leftie": "leftie",
  "Azteca": "azteca",
  "Flete Sur": "flete_sur",
  "Fletes": "flete_sur",
  "Utilidades": "utilidades",
}

/**
 * Normaliza un ID/nombre de banco al formato correcto (snake_case)
 */
export function normalizeBancoId(input: string): BancoId | null {
  // Si ya es un ID válido, retornarlo
  if (ALL_BANCO_IDS.includes(input as BancoId)) {
    return input as BancoId
  }
  
  // Buscar en el mapeo
  const normalized = BANCO_NAME_TO_ID[input]
  if (normalized) {
    return normalized
  }
  
  // Intentar normalizar manualmente
  const lowered = input.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')
  if (ALL_BANCO_IDS.includes(lowered as BancoId)) {
    return lowered as BancoId
  }
  
  return null
}

// ============================================================
// DISTRIBUCIÓN DE VENTAS POR BANCO
// ============================================================

/**
 * Configuración de distribución automática de ventas
 * Basado en análisis del Excel: Control_Maestro
 */
export const DISTRIBUCION_VENTA = {
  // Monto base (costo) va a Bóveda Monte
  BOVEDA_MONTE: "boveda_monte" as BancoId,
  
  // Flete va a Flete Sur
  FLETE: "flete_sur" as BancoId,
  
  // Utilidad/Ganancia va a Utilidades
  UTILIDADES: "utilidades" as BancoId,
} as const

// ============================================================
// TIPOS DE MOVIMIENTO
// ============================================================

export const TIPOS_MOVIMIENTO = {
  INGRESO: "ingreso",
  GASTO: "gasto",
  TRANSFERENCIA_ENTRADA: "transferencia_entrada",
  TRANSFERENCIA_SALIDA: "transferencia_salida",
  ABONO_CLIENTE: "abono_cliente",
  PAGO_DISTRIBUIDOR: "pago_distribuidor",
} as const

export type TipoMovimientoValue = typeof TIPOS_MOVIMIENTO[keyof typeof TIPOS_MOVIMIENTO]

// ============================================================
// ESTADOS
// ============================================================

export const ESTADOS_PAGO = {
  COMPLETO: "completo",
  PARCIAL: "parcial",
  PENDIENTE: "pendiente",
} as const

export const ESTADOS_ORDEN = {
  PENDIENTE: "pendiente",
  PARCIAL: "parcial",
  PAGADO: "pagado",
  CANCELADO: "cancelado",
} as const

export const ESTADOS_VENTA = {
  PAGADO: "Pagado",
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
} as const

// ============================================================
// COLECCIONES LEGACY A MIGRAR
// ============================================================

/**
 * Colecciones fragmentadas que deben migrarse a 'movimientos'
 */
export const COLECCIONES_INGRESOS_LEGACY = [
  "boveda_monte_ingresos",
  "boveda_usa_ingresos",
  "profit_ingresos",
  "leftie_ingresos",
  "azteca_ingresos",
  "flete_sur_ingresos",
  "utilidades_ingresos",
] as const

/**
 * Colecciones que deben eliminarse después de migración
 */
export const COLECCIONES_OBSOLETAS = [
  "ordenesCompra",           // Legacy camelCase
  "gya",                     // Duplica movimientos
  "transaccionesBoveda",     // Obsoleta
  "transaccionesBanco",      // Obsoleta
  "almacen",                 // Migrar a almacen_productos
  ...COLECCIONES_INGRESOS_LEGACY,
] as const

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Verifica si una colección es válida
 */
export function isValidCollection(name: string): name is CollectionName {
  return Object.values(COLLECTIONS).includes(name as CollectionName)
}

/**
 * Obtiene el nombre de colección correcto (evita typos)
 */
export function getCollectionName(key: keyof typeof COLLECTIONS): CollectionName {
  return COLLECTIONS[key]
}
