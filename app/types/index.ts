import { Timestamp } from 'firebase/firestore'

// Re-exportar tipos del sistema inmersivo 3D
export * from './immersive'

// ===================================================================
// 🏛️ TIPOS BASE - CHRONOS SYSTEM
// Versión: 2.0 - Arquitectura Híbrida Optimizada
// Fecha: 2025-11-26
// 
// Basado en análisis quirúrgico de:
// - 783 registros CSV existentes
// - Lógica de negocio real (OC → Ventas → Distribución)
// - Flujo de datos UI actual
// ===================================================================

// Tipo para timestamps de Firestore
export type FirestoreTimestamp = Timestamp | Date | string

// Monedas soportadas
export type Moneda = 'MXN' | 'USD' | 'USDT'

// Métodos de pago
export type MetodoPago = 'efectivo' | 'transferencia' | 'crypto' | 'cheque' | 'credito'

// IDs de bancos del sistema (7 entidades - snake_case estandarizado)
export type BancoId = 
  | 'boveda_monte'   // Bóveda principal (69 movimientos)
  | 'boveda_usa'     // Bóveda USD (17 movimientos)
  | 'profit'         // Banco operativo (55 movimientos)
  | 'leftie'         // Banco operativo (11 movimientos)
  | 'azteca'         // Banco operativo (6 movimientos)
  | 'flete_sur'      // Gastos de flete (101 movimientos)
  | 'utilidades'     // Ganancias (51 movimientos)

// ===================================================================
// BANCOS / BÓVEDAS
// ===================================================================
export interface Banco {
  id: BancoId
  nombre: string
  icon: string
  color: string
  tipo: 'boveda' | 'operativo' | 'gastos' | 'utilidades'
  descripcion: string
  moneda: Moneda
  capitalActual: number
  capitalInicial: number
  historicoIngresos: number
  historicoGastos: number
  historicoTransferencias: number
  estado: 'activo' | 'inactivo' | 'negativo'
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

// ===================================================================
// CLIENTES (31 registros)
// ===================================================================
export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  // Campos financieros (actualizados automáticamente)
  actual: number              // Saldo actual
  deuda: number               // Deuda total acumulada
  abonos: number              // Total de abonos realizados
  pendiente: number           // deuda - abonos
  totalVentas: number         // Suma histórica de ventas
  totalPagado: number         // Total que ha pagado
  deudaTotal: number          // Alias para compatibilidad
  // Métricas
  numeroCompras: number
  ultimaCompra?: FirestoreTimestamp
  // Referencias
  ventas?: string[]           // IDs de ventas
  historialPagos?: HistorialPago[]
  // Keywords para búsqueda
  keywords: string[]
  // Estado
  estado: 'activo' | 'inactivo'
  observaciones?: string
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// DISTRIBUIDORES (6 registros: PACMAN, Q-MAYA, A/X, etc.)
// ===================================================================
export interface Distribuidor {
  id: string
  nombre: string
  empresa?: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  // Campos financieros
  costoTotal: number           // Total de órdenes de compra
  abonos: number               // Pagos realizados
  pendiente: number            // costoTotal - abonos
  totalOrdenesCompra: number   // Suma histórica
  totalPagado: number
  deudaTotal: number
  // Métricas
  numeroOrdenes: number
  ultimaOrden?: FirestoreTimestamp
  // Referencias
  ordenesCompra?: string[]     // IDs de órdenes de compra
  ordenesActivas?: OrdenCompra[]  // Órdenes de compra activas (con stock)
  historialPagos?: HistorialPago[]
  // Keywords para búsqueda
  keywords: string[]
  // Estado
  estado: 'activo' | 'inactivo' | 'suspendido'
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// ÓRDENES DE COMPRA (9 registros - OC0001, OC0002, etc.)
// Esta es la "unidad de producto" en tu sistema
// ===================================================================
export interface OrdenCompra {
  id: string                   // Formato: "OC0001"
  fecha: string | FirestoreTimestamp
  // Distribuidor (snapshot para histórico)
  distribuidorId: string
  distribuidor: string         // Nombre snapshot
  origen: string               // Alias del distribuidor
  // Producto/Cantidad
  producto?: string            // Nombre del producto si aplica
  cantidad: number
  // Costos (CRÍTICO para cálculo de ganancia)
  costoDistribuidor: number    // Precio unitario del distribuidor
  costoTransporte: number      // Costo de transporte por unidad
  costoPorUnidad: number       // costoDistribuidor + costoTransporte
  costoTotal: number           // costoPorUnidad × cantidad
  // Stock tracking
  stockActual: number          // Stock restante de esta OC
  stockInicial: number         // = cantidad original
  // Pagos
  pagoDistribuidor: number     // Monto pagado al distribuidor
  pagoInicial: number          // Alias
  deuda: number                // costoTotal - pagoDistribuidor
  bancoOrigen?: BancoId        // De dónde salió el pago
  // Estado
  estado: 'pendiente' | 'parcial' | 'pagado' | 'cancelado'
  // Keywords para búsqueda
  keywords: string[]
  notas?: string
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// VENTAS (96 registros)
// Con snapshots inmutables para histórico
// ===================================================================

// Snapshot del cliente al momento de la venta (INMUTABLE)
export interface ClienteSnapshot {
  id: string
  nombre: string
  telefono?: string
  email?: string
}

// Distribución automática a bancos
export interface DistribucionBancos {
  bovedaMonte: number          // Monto base (costo)
  fletes: number               // Monto de flete
  utilidades: number           // Ganancia
}

export interface Venta {
  id: string
  fecha: string | FirestoreTimestamp
  // Referencia a OC (de dónde viene el producto)
  ocRelacionada: string        // Ej: "OC0001"
  // Cliente (snapshot inmutable)
  clienteId: string
  cliente: string              // Nombre snapshot
  clienteSnapshot?: ClienteSnapshot
  // Cantidad y precios
  cantidad: number
  precioVenta: number          // Precio por unidad al cliente
  precioCompra?: number        // Costo unitario (de la OC) - para calcular ganancia
  // Totales
  ingreso: number              // cantidad × precioVenta
  totalVenta: number           // Alias de ingreso
  precioTotalVenta: number     // Alias de ingreso
  // Flete
  flete: 'Aplica' | 'NoAplica'
  fleteUtilidad: number        // Monto del flete
  precioFlete: number          // Alias
  // Utilidad/Ganancia
  utilidad: number             // Ganancia calculada
  ganancia?: number            // Alias
  // Distribución a bancos
  bovedaMonte: number          // Monto que va a bóveda monte
  distribucionBancos: DistribucionBancos
  // Estado de pago
  estatus: 'Pagado' | 'Pendiente' | 'Parcial'
  estadoPago: 'completo' | 'parcial' | 'pendiente'
  montoPagado: number
  montoRestante: number
  adeudo: number               // Alias de montoRestante
  // Método de pago
  metodoPago?: MetodoPago
  bancoDestino?: BancoId
  // Auditoría
  concepto?: string
  notas?: string
  usuarioVendedor?: string
  // Keywords para búsqueda
  keywords: string[]
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// MOVIMIENTOS FINANCIEROS (Unificado)
// Reemplaza las 7 colecciones de *_ingresos
// ===================================================================
export type TipoMovimiento = 
  | 'ingreso' 
  | 'gasto' 
  | 'transferencia_entrada' 
  | 'transferencia_salida'
  | 'abono_cliente'
  | 'pago_distribuidor'

export interface Movimiento {
  id: string
  bancoId: BancoId
  tipoMovimiento: TipoMovimiento
  fecha: string | FirestoreTimestamp
  monto: number
  // Detalle
  concepto: string
  cliente?: string             // Si es ingreso de cliente
  origen?: string              // Origen del movimiento
  destino?: string             // Destino si es transferencia
  // Tipo de cambio (para USD)
  tc?: number
  pesos?: number
  dolares?: number
  // Referencias
  referenciaId?: string        // ID de venta, OC, etc.
  referenciaTipo?: 'venta' | 'orden_compra' | 'abono' | 'transferencia' | 'manual'
  // Balance
  saldoAnterior?: number
  saldoNuevo?: number
  // Auditoría
  observaciones?: string
  usuarioId?: string
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

// ===================================================================
// ALMACÉN / INVENTARIO
// ===================================================================
export interface Producto {
  id: string
  nombre: string
  sku?: string                 // Código único (opcional por ahora)
  descripcion?: string
  categoria?: string
  // Precios
  precioCompra: number         // Costo de adquisición
  precioVenta: number          // Precio al público
  valorUnitario: number        // Alias de precioCompra
  // Stock
  stockActual: number
  stockMinimo: number
  stockMaximo?: number
  // Historial
  totalEntradas: number
  totalSalidas: number
  // Origen
  origen?: string              // Distribuidor principal
  ordenCompraRef?: string      // OC relacionada
  // Keywords para búsqueda
  keywords: string[]
  // Estado
  activo: boolean
  imagenUrl?: string
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}

export interface MovimientoAlmacen {
  id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  fecha: FirestoreTimestamp
  productoId: string
  productoNombre: string       // Snapshot
  cantidad: number             // Positivo entrada, negativo salida
  // Auditoría de stock
  stockAnterior: number
  stockNuevo: number
  // Valorización
  costoUnitario?: number
  valorTotal?: number
  // Referencia
  referenciaId?: string        // ID de venta u OC
  referenciaTipo?: 'venta' | 'orden_compra' | 'ajuste_manual'
  origen?: string
  destino?: string
  motivo?: string
  // Auditoría
  usuarioId?: string
  createdAt: FirestoreTimestamp
}

// ===================================================================
// GASTOS Y ABONOS (302 registros desde gastos_abonos.csv)
// ===================================================================
export interface GastoAbono {
  id: string
  fecha: string | FirestoreTimestamp
  tipo: 'gasto' | 'abono'
  origen: string               // Cliente o fuente
  valor: number                // Monto
  monto: number                // Alias
  tc: number                   // Tipo de cambio
  pesos: number                // Valor en pesos
  destino: BancoId | string    // Banco destino
  bancoId: BancoId             // Alias
  concepto?: string
  observaciones?: string
  // Referencias
  entidadId?: string           // ID de cliente o distribuidor
  entidadTipo?: 'cliente' | 'distribuidor'
  createdAt: FirestoreTimestamp
}

// ===================================================================
// CORTES BANCARIOS
// ===================================================================
export interface CorteBancario {
  id: string
  bancoId: BancoId
  periodo: 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'anual'
  fechaInicio: string | FirestoreTimestamp
  fechaFin: string | FirestoreTimestamp
  capitalInicial: number
  totalIngresosPeriodo: number
  totalGastosPeriodo: number
  capitalFinal: number
  diferencia: number
  variacionPorcentaje: number
  numeroTransacciones: number
  estado: 'positivo' | 'negativo' | 'neutro'
  createdAt: FirestoreTimestamp
}

// ===================================================================
// DASHBOARD STATS (Agregadores)
// ===================================================================
export interface DashboardStats {
  id: 'dashboard_main'
  // Ventas
  ventasHoy: number
  ventasSemana: number
  ventasMes: number
  // Ganancias
  gananciaHoy: number
  gananciaMes: number
  margenPromedio: number
  // Inventario
  stockTotal: number
  stockValorizado: number
  productosBajoStock: number
  // Deudas
  deudaTotalClientes: number
  deudaTotalProveedores: number
  // Top
  topProductos: { id: string; nombre: string; vendidos: number }[]
  topClientes: { id: string; nombre: string; total: number }[]
  // Última actualización
  ultimaActualizacion: FirestoreTimestamp
}

// ===================================================================
// LOGS DE AUDITORÍA
// ===================================================================
export interface AuditLog {
  id: string
  fecha: FirestoreTimestamp
  accion: 'create' | 'update' | 'delete' | 'login' | 'error'
  entidad: string
  entidadId?: string
  descripcion: string
  datosAnteriores?: Record<string, unknown>
  datosNuevos?: Record<string, unknown>
  usuarioId?: string
  usuarioNombre?: string
  metadata?: Record<string, unknown>
}

// ===================================================================
// TIPOS PARA FORMULARIOS
// ===================================================================

export interface FormStep {
  id: number
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  fields: string[]
}

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  metadata?: Record<string, unknown>
}

export type FormMode = 'create' | 'edit' | 'view'

// Input types para crear registros
export interface NuevaVentaInput {
  clienteId: string
  ocRelacionada: string
  cantidad: number
  precioVenta: number
  flete: 'Aplica' | 'NoAplica'
  metodoPago: MetodoPago
  montoPagado: number
  bancoDestino?: BancoId
  notas?: string
}

export interface NuevaOrdenCompraInput {
  distribuidorId: string
  cantidad: number
  costoDistribuidor: number
  costoTransporte: number
  pagoInicial?: number
  bancoOrigen?: BancoId
  notas?: string
}

export interface NuevoAbonoInput {
  tipo: 'cliente' | 'distribuidor'
  entidadId: string
  monto: number
  bancoDestino: BancoId
  metodoPago: MetodoPago
  referencia?: string
  notas?: string
}

// ===================================================================
// TIPOS PARA CÁLCULOS (Basado en FORMULAS_CORRECTAS_VENTAS)
// ===================================================================

/**
 * Resultado del cálculo de una venta según las fórmulas del sistema
 * Ver: FORMULAS_CORRECTAS_VENTAS_Version2.md
 */
export interface CalculoVentaResult {
  // Costos de la OC
  costoPorUnidad: number       // costoDistribuidor + costoTransporte
  costoTotalLote: number       // costoPorUnidad × cantidad
  
  // Venta
  ingresoVenta: number         // precioVenta × cantidad
  totalVenta: number           // Alias de ingresoVenta
  
  // Distribución a bancos
  montoBovedaMonte: number     // precioCompra × cantidad (COSTO, no venta)
  montoFletes: number          // fleteUtilidad (si aplica)
  montoUtilidades: number      // (precioVenta - precioCompra) × cantidad - fleteUtilidad
  
  // Ganancia
  gananciaBruta: number        // ingresoVenta - costoTotalLote
  gananciaDesdeCSV: number     // Ganancia directa del CSV si existe
  
  // Para pagos parciales
  proporcionPagada: number     // montoPagado / ingresoVenta
  distribucionParcial: {
    bovedaMonte: number
    fletes: number
    utilidades: number
  }
}

/**
 * Configuración de los 7 bancos del sistema
 * Ver: PLAN_MAESTRO_COMPLETO_Version2.md
 */
export interface BancoConfig {
  id: BancoId
  nombre: string
  icon: string
  color: string
  colorHex: string
  gradientFrom: string
  gradientTo: string
  tipo: 'boveda' | 'operativo' | 'gastos' | 'utilidades'
  moneda: Moneda
  descripcion: string
  recibePagosVentas: boolean
  pagoProveedores: boolean
}

/**
 * Estado de los totales calculados del dashboard
 */
export interface TotalesDashboard {
  capitalTotal: number
  capitalMXN: number
  capitalUSD: number
  ingresosHoy: number
  gastosHoy: number
  flujoNeto: number
  variacionDiaria: number
  variacionSemanal: number
  alertas: AlertaDashboard[]
}

export interface AlertaDashboard {
  id: string
  tipo: 'warning' | 'error' | 'info' | 'success'
  titulo: string
  mensaje: string
  bancoId?: BancoId
  fechaCreacion: FirestoreTimestamp
  leida: boolean
}

// ===================================================================
// TIPOS PARA REPORTES
// ===================================================================

export type PeriodoReporte = 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'anual' | 'personalizado'

export interface FiltrosReporte {
  periodo: PeriodoReporte
  fechaInicio?: string | Date
  fechaFin?: string | Date
  bancoId?: BancoId
  clienteId?: string
  distribuidorId?: string
  tipoMovimiento?: TipoMovimiento[]
}

export interface ReporteFinanciero {
  id: string
  titulo: string
  periodo: PeriodoReporte
  fechaGeneracion: FirestoreTimestamp
  filtros: FiltrosReporte
  // Resumen
  totalIngresos: number
  totalGastos: number
  balance: number
  // Detalle por banco
  resumenPorBanco: {
    bancoId: BancoId
    nombre: string
    ingresos: number
    gastos: number
    balance: number
  }[]
  // Movimientos
  movimientos: Movimiento[]
  // Gráficos
  datosGraficoTemporal: {
    fecha: string
    ingresos: number
    gastos: number
  }[]
}

// ===================================================================
// TIPOS PARA UI/UX
// ===================================================================

export type PanelId = 
  | 'dashboard'
  | 'bancos'
  | 'banco'  // Alias para bancos
  | 'boveda_monte'
  | 'boveda_usa'
  | 'utilidades'
  | 'flete_sur'
  | 'azteca'
  | 'leftie'
  | 'profit'
  | 'ventas'
  | 'ordenes'
  | 'ordenes_compra'  // Panel de Órdenes de Compra
  | 'clientes'
  | 'distribuidores'
  | 'almacen'
  | 'reportes'
  | 'ia'
  | 'configuracion'
  | 'gya'  // Panel Gastos y Abonos
  | 'gastos'
  | 'abonos'

export interface PanelConfig {
  id: PanelId
  titulo: string
  descripcion: string
  icon: string
  rutaNavegacion: string
  requiereAuth: boolean
  permisos: string[]
}

export interface NotificacionUI {
  id: string
  tipo: 'success' | 'error' | 'warning' | 'info'
  titulo: string
  mensaje: string
  duracion?: number
  accion?: {
    label: string
    onClick: () => void
  }
}

// ===================================================================
// TIPOS PARA BÚSQUEDA Y FILTRADO
// ===================================================================

export interface FiltrosBusqueda {
  query?: string
  fechaInicio?: string | Date
  fechaFin?: string | Date
  estado?: string
  ordenarPor?: string
  ordenDireccion?: 'asc' | 'desc'
  limite?: number
  offset?: number
}

export interface ResultadoBusqueda<T> {
  items: T[]
  total: number
  pagina: number
  totalPaginas: number
  limite: number
}

// ===================================================================
// TIPOS PARA EXPORTACIÓN
// ===================================================================

export type FormatoExportacion = 'csv' | 'xlsx' | 'pdf' | 'json'

export interface ConfigExportacion {
  formato: FormatoExportacion
  incluirHeaders: boolean
  columnas?: string[]
  nombreArchivo?: string
  filtros?: FiltrosBusqueda
}

// ===================================================================
// TIPOS LEGACY (Para compatibilidad con código existente)
// ===================================================================

/** @deprecated Usar Movimiento */
export interface Operacion {
  id: string
  tipo: 'ingreso' | 'gasto' | 'transferencia_entrada' | 'transferencia_salida'
  fecha: FirestoreTimestamp
  monto: number
  concepto: string
  referencia?: string
  bancoRelacionado?: string
}

/** @deprecated Usar Movimiento con tipo transferencia */
export interface Transferencia {
  id: string
  fecha: string
  tipo: 'entrada' | 'salida'
  monto: number
  bancoOrigen: BancoId
  bancoDestino: BancoId
  concepto: string
  referencia?: string
  estado: 'completada' | 'pendiente'
  createdAt: FirestoreTimestamp
}

export interface HistorialPago {
  fecha: FirestoreTimestamp
  monto: number
  bancoOrigen?: string
  ordenCompraId?: string
  ventaId?: string
}

/** @deprecated Usar Producto */
export interface ItemAlmacen {
  id: string
  oc: string
  cliente: string
  distribuidor: string
  cantidad: number
  createdAt: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}
