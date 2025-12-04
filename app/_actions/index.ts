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

// Re-export types
export type { CreateVentaInput, UpdateVentaInput, AbonoVentaInput } from './ventas'
export type { CreateClienteInput, UpdateClienteInput } from './clientes'
