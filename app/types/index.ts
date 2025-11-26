import { Timestamp } from "firebase/firestore"

// Re-exportar tipos del sistema inmersivo 3D
export * from "./immersive"

// ===================================================================
// TIPOS BASE - CHRONOS SYSTEM
// Sincronizado con CSVs: 2025-11-26
// ===================================================================

// Tipo para timestamps de Firestore
export type FirestoreTimestamp = Timestamp | Date | string

// IDs de bancos del sistema
export type BancoId = 
  | "boveda_monte"   // Bóveda principal (69 movimientos)
  | "boveda_usa"     // Bóveda USD (17 movimientos)
  | "profit"         // Banco operativo (55 movimientos)
  | "leftie"         // Banco operativo (11 movimientos)
  | "azteca"         // Banco operativo (6 movimientos)
  | "flete_sur"      // Gastos de flete (101 movimientos)
  | "utilidades"     // Ganancias (51 movimientos)

// ===================================================================
// BANCOS (7 entidades)
// ===================================================================
export interface Banco {
  id: BancoId
  nombre: string
  icon: string
  color: string
  tipo: "boveda" | "operativo" | "gastos" | "utilidades"
  descripcion: string
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
  historicoTransferencias: number
  estado: "activo" | "negativo"
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

// ===================================================================
// MOVIMIENTOS (Unificado - reemplaza todos los CSVs de bancos)
// ===================================================================
export interface Movimiento {
  id: string
  bancoId: BancoId
  tipoMovimiento: "ingreso" | "gasto" | "transferencia_entrada" | "transferencia_salida"
  fecha: string
  monto: number
  cliente?: string
  origen?: string
  destino?: string
  concepto?: string
  observaciones?: string
  tc?: number        // Tipo de cambio (para USD)
  pesos?: number     // Monto en pesos (si aplica)
  dolares?: number   // Monto en dólares (si aplica)
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// VENTAS (96 registros desde ventas.csv)
// ===================================================================
export interface Venta {
  id: string
  fecha: string
  ocRelacionada: string        // Ej: "OC0001"
  cantidad: number
  cliente: string
  bovedaMonte: number          // Monto que va a bóveda monte
  precioVenta: number          // Precio por unidad
  ingreso: number              // Total de la venta
  flete: "Aplica" | "NoAplica"
  fleteUtilidad: number        // Monto del flete
  utilidad: number             // Ganancia
  estatus: "Pagado" | "Pendiente" | "Parcial"
  concepto?: string
  // Campos calculados
  totalVenta: number           // ingreso total
  estadoPago: "completo" | "parcial" | "pendiente"
  montoPagado: number
  adeudo: number
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// CLIENTES (31 registros desde clientes.csv)
// ===================================================================
export interface Cliente {
  id: string
  nombre: string
  actual: number               // Saldo actual
  deuda: number                // Deuda total
  abonos: number               // Total de abonos
  pendiente: number            // deuda - abonos
  observaciones?: string
  estado: "activo" | "inactivo"
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// DISTRIBUIDORES (6 registros desde distribuidores_clean.csv)
// PACMAN, Q-MAYA, A/X, CH-MONTE, VALLE-MONTE, Q-MAYA-MP
// ===================================================================
export interface Distribuidor {
  id: string
  nombre: string
  costoTotal: number           // Total de órdenes de compra
  abonos: number               // Pagos realizados
  pendiente: number            // costoTotal - abonos
  estado: "activo" | "inactivo"
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// ORDENES DE COMPRA (9 registros desde ordenes_compra.csv)
// ===================================================================
export interface OrdenCompra {
  id: string                   // Ej: "OC0001"
  fecha: string
  origen: string               // Distribuidor (Q-MAYA, PACMAN, etc.)
  cantidad: number
  costoDistribuidor: number    // Precio unitario del distribuidor
  costoTransporte: number      // Costo de transporte por unidad
  costoPorUnidad: number       // costoDistribuidor + costoTransporte
  stockActual: number          // Stock restante
  costoTotal: number           // costoPorUnidad × cantidad
  pagoDistribuidor: number     // Monto pagado
  deuda: number                // costoTotal - pagoDistribuidor
  estado: "pendiente" | "parcial" | "pagado"
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// GASTOS Y ABONOS (302 registros desde gastos_abonos.csv)
// ===================================================================
export interface GastoAbono {
  id: string
  fecha: string
  origen: string               // Cliente o fuente
  valor: number                // Monto
  tc: number                   // Tipo de cambio
  pesos: number                // Valor en pesos
  destino: BancoId | string    // Banco destino
  concepto?: string
  observaciones?: string
  tipo: "gasto" | "abono"
  createdAt: FirestoreTimestamp
}

// ===================================================================
// ALMACEN (9 registros desde almacen.csv)
// ===================================================================
export interface ItemAlmacen {
  id: string
  oc: string                   // Orden de compra relacionada
  cliente: string              // Fecha o cliente
  distribuidor: string         // Distribuidor origen
  cantidad: number
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

export interface Producto {
  id: string
  nombre: string
  origen: string
  stockActual: number
  totalEntradas: number
  totalSalidas: number
  valorUnitario: number
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

export interface MovimientoAlmacen {
  id: string
  tipo: "entrada" | "salida"
  fecha: FirestoreTimestamp
  cantidad: number
  origen?: string
  destino?: string
  productoId: string
}

// ===================================================================
// CORTES BANCARIOS
// ===================================================================
export interface CorteBanco {
  id: string
  bancoId: BancoId
  periodo: "diario" | "semanal" | "mensual" | "trimestral" | "anual"
  fechaInicio: string
  fechaFin: string
  capitalInicial: number
  totalIngresosPeriodo: number
  totalGastosPeriodo: number
  capitalFinal: number
  diferencia: number
  variacionPorcentaje: number
  estado: "positivo" | "negativo" | "neutro"
  createdAt: FirestoreTimestamp
}

// ===================================================================
// LOGS (Auditoría)
// ===================================================================
export interface LogEntry {
  id: string
  tipo: "info" | "warning" | "error" | "audit"
  mensaje: string
  entidad?: string
  entidadId?: string
  usuarioId?: string
  metadata?: Record<string, unknown>
  createdAt: FirestoreTimestamp
}

// ===================================================================
// TIPOS LEGACY (para compatibilidad)
// ===================================================================
export interface HistorialPago {
  fecha: FirestoreTimestamp
  monto: number
  bancoOrigen?: string
  ordenCompraId?: string
  ventaId?: string
}

export interface Operacion {
  id: string
  tipo: "ingreso" | "gasto" | "transferencia_entrada" | "transferencia_salida"
  fecha: FirestoreTimestamp
  monto: number
  concepto: string
  referencia?: string
  bancoRelacionado?: string
}

export interface Transferencia {
  id: string
  fecha: string
  tipo: "entrada" | "salida"
  monto: number
  bancoOrigen: BancoId
  bancoDestino: BancoId
  concepto: string
  referencia?: string
  estado: "completada" | "pendiente"
  createdAt: FirestoreTimestamp
}
