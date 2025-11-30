/**
 * Index de todos los schemas de validación Zod
 * Centraliza exports para fácil importación
 * 
 * @example
 * import { validarVenta, validarCliente } from '@/app/lib/schemas'
 */

// Schemas de Ventas (excepto PagoDistribuidorSchema que conflictúa)
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

// Schemas de Órdenes de Compra
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
