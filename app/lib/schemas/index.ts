/**
 * Index de todos los schemas de validación Zod
 * Centraliza exports para fácil importación
 * 
 * @example
 * import { validarVenta, validarCliente } from '@/app/lib/schemas'
 */

// Schemas de Ventas
export * from './ventas.schema'

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

// Funciones de validación principales
export {
  validarVenta,
  validarTransferencia,
  validarAbono,
} from './ventas.schema'

export {
  validarCliente,
  validarActualizacionCliente,
  generarKeywordsCliente,
} from './clientes.schema'

export {
  validarDistribuidor,
  validarActualizacionDistribuidor,
  generarKeywordsDistribuidor,
} from './distribuidores.schema'
