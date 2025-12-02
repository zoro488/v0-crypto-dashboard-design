/**
 * 🔒 INDEX DE SCHEMAS DE VALIDACIÓN ZOD - CHRONOS SYSTEM
 * 
 * Centraliza TODOS los exports de schemas para fácil importación.
 * Incluye schemas legacy y nuevos schemas de operaciones de negocio.
 * 
 * @example
 * // Schemas de negocio (RECOMENDADO)
 * import { validarVentaCompleta, calcularDistribucionGYA } from '@/app/lib/schemas'
 * 
 * // Schemas legacy
 * import { validarVenta, validarCliente } from '@/app/lib/schemas'
 * 
 * @version 2.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE TIMESTAMPS (NUEVO - Para tipado correcto de fechas Firestore)
// ═══════════════════════════════════════════════════════════════════════════
export {
  FirestoreTimestampSchema,
  OptionalTimestampSchema,
  FlexibleDateSchema,
  HistorialPagoSchema,
  toDate,
  toISOString,
  type HistorialPago,
} from './timestamp.schema'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE OPERACIONES DE NEGOCIO (NUEVOS - RECOMENDADOS)
// ═══════════════════════════════════════════════════════════════════════════
export {
  // Constantes
  BANCOS_IDS,
  ESTADOS_PAGO,
  ESTADOS_ORDEN,
  METODOS_PAGO,
  BANCOS_OPERATIVOS,
  PRECIO_FLETE_DEFAULT,
  
  // Schemas primitivos
  MontoPositivoSchema,
  MontoNoNegativoSchema,
  CantidadSchema as CantidadSchemaV2,
  BancoIdSchema as BancoIdSchemaV2,
  EstadoPagoSchema as EstadoPagoSchemaV2,
  EstadoOrdenSchema as EstadoOrdenSchemaV2,
  MetodoPagoSchema,
  NombreRequeridoSchema,
  FechaSchema as FechaSchemaV2,
  
  // Schemas de distribución GYA
  DistribucionGYASchema,
  ItemVentaSchema,
  
  // Schemas de creación
  CrearVentaCompletaSchema,
  ItemOrdenCompraSchema,
  CrearOrdenCompraCompletaSchema,
  AbonoClienteSchema as AbonoClienteSchemaV2,
  PagoDistribuidorSchema as PagoDistribuidorSchemaV2,
  TransferenciaBancosSchema,
  RegistrarGastoSchema,
  RegistrarIngresoSchema,
  
  // Funciones de validación (NUEVAS)
  validarVentaCompleta,
  validarOrdenCompraCompleta,
  validarAbonoCliente,
  validarPagoDistribuidor as validarPagoDistribuidorV2,
  validarTransferencia as validarTransferenciaV2,
  validarGasto,
  validarIngreso,
  
  // Funciones de cálculo GYA
  calcularDistribucionGYA,
  calcularDistribucionGYATotal,
  
  // Tipos
  type BancoIdType,
  type EstadoPagoType,
  type EstadoOrdenType,
  type MetodoPagoType,
  type ItemVenta,
  type CrearVentaCompletaInput,
  type ItemOrdenCompra,
  type CrearOrdenCompraCompletaInput,
  type AbonoClienteInput,
  type PagoDistribuidorInput as PagoDistribuidorInputV2,
  type TransferenciaBancosInput,
  type RegistrarGastoInput,
  type RegistrarIngresoInput,
  type DistribucionGYA,
} from './business-operations.schema'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS LEGACY (Para compatibilidad con código existente)
// ═══════════════════════════════════════════════════════════════════════════

// Schemas de Ventas (legacy)
export {
  MontoSchema,
  CantidadSchema,
  FechaSchema,
  BancoIdSchema,
  EstadoPagoSchema,
  DistribucionBancosSchema,
  CrearVentaSchema,
  VentaSchema,
  AbonoClienteSchema,
  TransferenciaSchema,
  validarVenta,
  validarTransferencia,
  validarAbono,
  type CrearVentaInput,
  type Venta,
  type AbonoCliente,
  type Transferencia,
  type EstadoPago,
} from './ventas.schema'

// Re-export PagoDistribuidorSchema de ventas con alias para evitar conflicto
export { PagoDistribuidorSchema as PagoDistribuidorVentaSchema } from './ventas.schema'
export type { PagoDistribuidor as PagoDistribuidorVenta } from './ventas.schema'

// Schemas de Clientes
export * from './clientes.schema'

// Schemas de Distribuidores
export * from './distribuidores.schema'

// Schemas de Órdenes de Compra (legacy)
export {
  CrearOrdenCompraSchema,
  ActualizarOrdenCompraSchema,
  OrdenCompraSchema,
  PagoDistribuidorSchema,
  EstadoOrdenSchema,
  validarOrdenCompra,
  validarPagoDistribuidor,
  generarKeywordsOrdenCompra,
  type CrearOrdenCompraInput,
  type ActualizarOrdenCompraInput,
  type OrdenCompra,
  type PagoDistribuidorInput,
  type EstadoOrden,
} from './ordenes-compra.schema'
