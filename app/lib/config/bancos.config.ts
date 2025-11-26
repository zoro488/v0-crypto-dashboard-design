/**
 * 🏦 CONFIGURACIÓN DE BANCOS - CHRONOS SYSTEM
 * Sincronizado con CSVs: 2025-11-26
 * 
 * 7 Bancos/Bóvedas identificados:
 * - boveda_monte: Bóveda principal (69 movimientos)
 * - boveda_usa: Bóveda USD (17 movimientos)
 * - profit: Banco operativo (55 movimientos)
 * - leftie: Banco operativo (11 movimientos)
 * - azteca: Banco operativo (6 movimientos)
 * - flete_sur: Gastos de flete (101 movimientos)
 * - utilidades: Ganancias (51 movimientos)
 */

import type { BancoId, Moneda } from "@/app/types"

// Tipo simplificado para configuración de banco (no necesita todos los campos de Banco) 
export interface BancoConfig {
  nombre: string
  icon: string
  color: string
  tipo: "boveda" | "operativo" | "gastos" | "utilidades"
  descripcion: string
  moneda: Moneda
  capitalInicial: number
}

export const BANCOS_CONFIG: Record<BancoId, BancoConfig> = {
  boveda_monte: {
    nombre: "Bóveda Monte",
    icon: "🏔️",
    color: "#8B5CF6", // Violeta
    tipo: "boveda",
    descripcion: "Bóveda principal para operaciones de venta",
    moneda: "MXN",
    capitalInicial: 5722280
  },
  boveda_usa: {
    nombre: "Bóveda USA",
    icon: "🇺🇸",
    color: "#3B82F6", // Azul
    tipo: "boveda",
    descripcion: "Bóveda para operaciones en dólares",
    moneda: "USD",
    capitalInicial: 128005
  },
  profit: {
    nombre: "Profit",
    icon: "💰",
    color: "#10B981", // Verde
    tipo: "operativo",
    descripcion: "Banco operativo principal",
    moneda: "MXN",
    capitalInicial: 12577748
  },
  leftie: {
    nombre: "Leftie",
    icon: "🏦",
    color: "#F59E0B", // Ámbar
    tipo: "operativo",
    descripcion: "Banco operativo secundario",
    moneda: "USD",
    capitalInicial: 45844
  },
  azteca: {
    nombre: "Azteca",
    icon: "🦅",
    color: "#EF4444", // Rojo
    tipo: "operativo",
    descripcion: "Banco Azteca",
    moneda: "MXN",
    capitalInicial: -178714.88
  },
  flete_sur: {
    nombre: "Flete Sur",
    icon: "🚚",
    color: "#6366F1", // Índigo
    tipo: "gastos",
    descripcion: "Gastos de transporte y fletes",
    moneda: "MXN",
    capitalInicial: 185792
  },
  utilidades: {
    nombre: "Utilidades",
    icon: "📈",
    color: "#22C55E", // Verde claro
    tipo: "utilidades",
    descripcion: "Ganancias y utilidades del sistema",
    moneda: "MXN",
    capitalInicial: 102658
  }
}

// Lista de IDs de bancos
export const BANCO_IDS: BancoId[] = [
  "boveda_monte",
  "boveda_usa",
  "profit",
  "leftie",
  "azteca",
  "flete_sur",
  "utilidades"
]

// Mapeo de nombres CSV a IDs de banco
export const CSV_TO_BANCO_ID: Record<string, BancoId> = {
  "Boveda Monte": "boveda_monte",
  "Bóveda Monte": "boveda_monte",
  "boveda_monte": "boveda_monte",
  "Boveda USA": "boveda_usa",
  "Bóveda USA": "boveda_usa",
  "boveda_usa": "boveda_usa",
  "Profit": "profit",
  "profit": "profit",
  "Leftie": "leftie",
  "leftie": "leftie",
  "Azteca": "azteca",
  "azteca": "azteca",
  "Flete Sur": "flete_sur",
  "flete_sur": "flete_sur",
  "Utilidades": "utilidades",
  "utilidades": "utilidades"
}

// Función para obtener el ID de banco desde un nombre CSV
export function getBancoIdFromCSV(csvName: string): BancoId | null {
  return CSV_TO_BANCO_ID[csvName] || null
}

// Función para obtener configuración de banco
export function getBancoConfig(bancoId: BancoId) {
  return BANCOS_CONFIG[bancoId]
}

// Colores para gráficos
export const BANCO_COLORS = BANCO_IDS.map(id => BANCOS_CONFIG[id].color)
