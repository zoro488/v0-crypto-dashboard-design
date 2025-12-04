// ═══════════════════════════════════════════════════════════════
// CHRONOS - SERVER ACTIONS INDEX
// Barrel export para todas las Server Actions
// ═══════════════════════════════════════════════════════════════

// Ventas
export {
  createVenta,
  abonarVenta,
  getVentas,
  getVentaById,
  getVentasStats,
} from './ventas'

// Clientes
export {
  createCliente,
  updateCliente,
  getClientes,
  getClienteById,
  getClientesActivos,
} from './clientes'

// Bancos
export {
  getBancos,
  getBancoById,
  transferirEntreBancos,
  registrarGasto,
  getCapitalTotal,
} from './bancos'

// Distribuidores
export {
  createDistribuidor,
  updateDistribuidor,
  deleteDistribuidor,
  getDistribuidores,
  getDistribuidor,
  getDistribuidoresStats,
  pagarDistribuidor,
  getHistorialPagosDistribuidor,
} from './distribuidores'

// Órdenes de Compra
export {
  createOrden,
  pagarOrden,
  getOrdenes,
  getOrden,
  getOrdenesStats,
  cancelarOrden,
} from './ordenes'

// Movimientos
export {
  createMovimiento,
  getMovimientos,
  getMovimientoById,
  getMovimientosByBanco,
  getMovimientosResumen,
  getMovimientosRecientes,
  cancelarMovimiento,
  getMovimientosStats,
} from './movimientos'

// Almacén
export {
  createProducto,
  updateProducto,
  getProductos,
  getProductoById,
  buscarProductos,
  ajustarInventario,
  getProductosBajoStock,
  getAlmacenStats,
  deleteProducto,
} from './almacen'

// Usuarios
export {
  login,
  logout,
  register,
  getCurrentUser,
  getUsuarios,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  cambiarPassword,
} from './usuarios'

// Reportes
export {
  getDashboardResumen,
  getReporteVentas,
  getReporteBancos,
  getReporteClientes,
  getReporteDistribuidores,
  getReporteAlmacen,
  getResumenFinanciero,
} from './reportes'

// ═══════════════════════════════════════════════════════════════
// RE-EXPORT TYPES & SCHEMAS (desde archivo separado sin 'use server')
// ═══════════════════════════════════════════════════════════════

export type {
  CreateVentaInput,
  UpdateVentaInput,
  AbonoVentaInput,
  CreateClienteInput,
  UpdateClienteInput,
  CreateDistribuidorInput,
  UpdateDistribuidorInput,
  CreateOrdenInput,
  PagoOrdenInput,
  CambiarEstadoOrdenInput,
  CreateMovimientoInput,
  FiltrosMovimiento,
  CreateProductoInput,
  UpdateProductoInput,
  AjustarInventarioInput,
  LoginInput,
  RegisterInput,
  UpdateUsuarioInput,
  FiltrosReporte,
} from './types'

// Re-export schemas para validación en cliente
export {
  CreateVentaSchema,
  UpdateVentaSchema,
  AbonoVentaSchema,
  CreateClienteSchema,
  UpdateClienteSchema,
  CreateDistribuidorSchema,
  UpdateDistribuidorSchema,
  CreateOrdenSchema,
  PagoOrdenSchema,
  CreateMovimientoSchema,
  FiltrosMovimientoSchema,
  CreateProductoSchema,
  UpdateProductoSchema,
  AjustarInventarioSchema,
  LoginSchema,
  RegisterSchema,
  UpdateUsuarioSchema,
  FiltrosReporteSchema,
} from './types'
