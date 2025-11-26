/**
 * Utils - Exportaciones centralizadas
 * Sistema Chronos
 */

// Cálculos de negocio
export {
  calcularDistribucionVenta,
  calcularCostoTotal,
  calcularMargenGanancia,
  calcularDeudaOrden,
  calcularTotalPendiente,
  calcularStockDisponible,
  calcularValorInventario,
  calcularAlertaStock,
  calcularCreditoDisponible,
  calcularInteresCredito,
  calcularPagoMinimo,
  calcularTipoCambio,
  convertirMXNaUSD,
  convertirUSDaMXN,
  calcularVentasPeriodo,
  calcularCrecimientoVentas,
  calcularPromedioVentas,
  calcularTopClientes,
  calcularRendimientoPorPeriodo,
  calcularROI,
  business,
} from './calculations';

// Validadores Zod
export {
  ordenCompraSchema,
  ventaSchema,
  transferenciaSchema,
  movimientoBancoSchema,
  clienteSchema,
  distribuidorSchema,
  productoAlmacenSchema,
  abonoSchema,
  gastoSchema,
  type OrdenCompraInput,
  type VentaInput,
  type TransferenciaInput,
  type MovimientoBancoInput,
  type ClienteInput,
  type DistribuidorInput,
  type ProductoAlmacenInput,
  type AbonoInput,
  type GastoInput,
  validators,
} from './validators';

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
} from './formatters';
