// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 - HOOKS INDEX
// Todos los hooks de datos usando Turso/Drizzle
// ═══════════════════════════════════════════════════════════════

// Hook principal para queries genéricos
export { useDB, useRealtime } from './useDB'

// Hooks específicos por entidad
export { useBancos, useBancosData, useBancoData } from './useBancos'
export { useVentas, useVentasData, type VentaConCliente } from './useVentas'
export { useClientes, useClientesData } from './useClientes'
export { useDistribuidores, useDistribuidoresData } from './useDistribuidores'
export { 
  useMovimientos, 
  useMovimientosData,
  useIngresosBanco,
  useGastos,
  useTransferencias,
  useCorteBancario,
} from './useMovimientos'
export { 
  useOrdenes, 
  useOrdenesCompra, 
  useOrdenesCompraData,
  type OrdenConDistribuidor,
} from './useOrdenes'
export { 
  useAlmacen, 
  useAlmacenData, 
  useProductos,
  useEntradasAlmacen,
  useSalidasAlmacen,
} from './useAlmacen'

// Hook para datos combinados del sistema
export { useSystemData } from './useSystemData'
