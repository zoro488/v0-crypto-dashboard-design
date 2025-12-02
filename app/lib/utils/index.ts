/**
 * Utils - Exportaciones centralizadas
 * Sistema Chronos v2.1
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGER (USAR SIEMPRE en lugar de console.log)
// ═══════════════════════════════════════════════════════════════════════════════
export { logger, type LogLevel, type LogOptions, type LogEntry } from './logger'

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT PATTERN (Manejo de errores consistente)
// ═══════════════════════════════════════════════════════════════════════════════
export {
  Result,
  AppError,
  ValidationError,
  DatabaseError,
  NotFoundError,
  InsufficientStockError,
  InsufficientFundsError,
  BusinessRuleError,
  DuplicateEntryError,
  tryCatch,
  tryCatchSync,
  combineResults,
  executeAll,
  fromZodErrors,
  fromFirebaseError,
  fromUnknownError,
  type ErrorCode,
} from './result'

// Cálculos de negocio
export {
  calcularDistribucionVenta,
  calcularCostoTotalOrden,
  calcularMargenBruto,
  calcularMargenNeto,
  calcularPorcentajeMargen,
  calcularRentabilidad,
  calcularAnalisisMargen,
  calcularDeudaOrden,
  calcularValorInventario,
  calcularCapitalTotal,
  calcularCrecimiento,
  proyectarVentas,
  calcularDeudaTotalClientes,
  calcularDiasMora,
  formatearMoneda,
  formatearPorcentaje,
  formatearNumero,
  redondear,
  type VentaData,
  type OrdenCompraData,
  type DistribucionVenta,
  type MargenCalculo,
  type ProyeccionData,
} from './calculations'

// Default export de calculations
export { default as business } from './calculations'

// Validadores Zod
export {
  ordenCompraSchema,
  ventaSchema,
  transferenciaSchema,
  clienteSchema,
  distribuidorSchema,
  productoSchema,
  movimientoAlmacenSchema,
  bancoSchema,
  gastoSchema,
  abonoClienteSchema,
  abonoDistribuidorSchema,
  loginSchema,
  registroSchema,
  filtroReporteSchema,
  reporteProgramadoSchema,
  validarDatos,
  validarCampo,
  sanitizarString,
  normalizarNombre,
  formatearTelefono,
  schemas,
  type OrdenCompraInput,
  type VentaInput,
  type TransferenciaInput,
  type ClienteInput,
  type DistribuidorInput,
  type ProductoInput,
  type MovimientoAlmacenInput,
  type BancoInput,
  type GastoInput,
  type AbonoClienteInput,
  type AbonoDistribuidorInput,
  type LoginInput,
  type RegistroInput,
  type FiltroReporteInput,
  type ReporteProgramadoInput,
} from './validators'

// Formateadores
export {
  formatCurrency,
  formatMXN,
  formatUSD,
  formatCompact,
  parseCurrency,
  formatNumber,
  formatPercent,
  formatChange,
  formatQuantity,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatDuration,
  formatDateRange,
  capitalize,
  titleCase,
  truncate,
  formatName,
  formatPhone,
  formatStatus,
  formatFileSize,
  formatList,
  currency,
  number,
  date,
  text,
  file,
} from './formatters'

// ═══════════════════════════════════════════════════════════════════════════════
// GESTIÓN DE INVENTARIO / STOCK
// ═══════════════════════════════════════════════════════════════════════════════
export {
  calcularNuevoStock,
  determinarNivelStock,
  calcularRotacion,
  proyectarAgotamiento,
  valorizarInventario,
  recomendarReabastecimiento,
  calcularCostoPromedioPonderado,
  generarTimelineMovimientos,
  type MovimientoStock,
  type Producto,
  type NivelStock,
  type ProyeccionAgotamiento,
  type RotacionInventario,
  type ValorizacionInventario,
} from './stock'

// ═══════════════════════════════════════════════════════════════════════════════
// GESTIÓN DE CRÉDITO
// ═══════════════════════════════════════════════════════════════════════════════
export {
  calcularCreditoDisponible,
  validarCreditoParaVenta,
  procesarPago,
  calcularFacturasVencidas,
  analizarCredito,
  calcularCalificacionCrediticia,
  calcularLimiteCreditoRecomendado,
  generarEstadoCuenta,
  type Distribuidor,
  type Pago,
  type Factura,
  type AnalisisCredito,
  type ResultadoValidacion,
} from './credit'

// ═══════════════════════════════════════════════════════════════════════════════
// CORTES DE CAJA
// ═══════════════════════════════════════════════════════════════════════════════
export {
  calcularCorte,
  generarCorteDiario,
  cerrarCorte,
  detectarDiscrepancias,
  generarResumenDiario,
  conciliarTransferencias,
  obtenerSaldoAnterior,
  generarHistorialCortes,
  generarCierreMensual,
  type MovimientoCaja,
  type CorteCaja,
  type ResumenDiario,
  type Discrepancia,
} from './cortes'
