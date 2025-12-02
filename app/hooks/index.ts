/**
 * 🪝 HOOKS CENTRALIZADOS - CHRONOS SYSTEM
 * 
 * Punto de entrada único para todos los hooks personalizados.
 */

// ====================================================================
// HOOKS DE OPERACIONES DE NEGOCIO
// ====================================================================
export {
  useRegistrarVenta,
  useRegistrarAbonoCliente,
  usePagoDistribuidor,
  useCalculoVentaPreview,
  useEstadoPago,
  type DatosVenta,
  type DatosAbonoCliente,
  type DatosPagoDistribuidor,
  type DatosTransferencia,
  type OperationResult,
} from './useBusinessOperations'

// ====================================================================
// HOOKS DE TRAZABILIDAD Y ANÁLISIS
// ====================================================================
export {
  useTrazabilidadCliente,
  useTrazabilidadDistribuidor,
  useTrazabilidadOC,
  useAnalisisGastosAbonos,
  type TrazabilidadCliente,
  type TrazabilidadDistribuidor,
  type TrazabilidadOC,
  type FiltrosAnalisis,
} from './useTrazabilidad'

// ====================================================================
// HOOKS DE DATOS DEL SISTEMA
// ====================================================================
export { useSystemData } from './useSystemData'
export { default as useMovimientos } from './useMovimientos'
export { useTreasury } from './useTreasury'
export { useFirestoreCRUD } from './useFirestoreCRUD'

// ====================================================================
// 🔥 HOOKS DE TIEMPO REAL (onSnapshot)
// ====================================================================
export {
  useRealtimeCollection,
  useRealtimeVentas,
  useRealtimeClientes,
  useRealtimeDistribuidores,
  useRealtimeOrdenesCompra,
  useRealtimeAlmacen,
  useRealtimeBancos,
  useRealtimeMovimientos,
  type RealtimeOptions,
  type RealtimeResult,
} from './useRealtimeCollection'

// ====================================================================
// 🚀 HOOKS TANSTACK QUERY + FIREBASE REALTIME (El Santo Grial)
// ====================================================================
export {
  useRealtimeQuery,
  useRealtimeVentasQuery,
  useRealtimeClientesQuery,
  useRealtimeDistribuidoresQuery,
  useRealtimeOrdenesCompraQuery,
  useRealtimeBancosQuery,
  useRealtimeMovimientosQuery,
  useRealtimeAlmacenQuery,
  type RealtimeQueryOptions,
  type RealtimeQueryResult,
} from './useRealtimeQuery'

// ====================================================================
// ⚡ HOOKS OPTIMISTIC MUTATIONS (Velocidad Luz)
// ====================================================================
export {
  useOptimisticCreate,
  useOptimisticUpdate,
  useOptimisticDelete,
  useVentasMutations,
  useClientesMutations,
  useDistribuidoresMutations,
  useOrdenesCompraMutations,
  useBancosMutations,
  useMovimientosMutations,
  useAlmacenMutations,
  type MutationContext,
  type CreateMutationOptions,
} from './useOptimisticMutation'

// ====================================================================
// HOOKS DE UI Y EXPERIENCIA
// ====================================================================
export { useToast, toast } from './use-toast'
export { default as use3DInteraction } from './use3DInteraction'
export { useUISound } from './useUISound'

// ====================================================================
// HOOKS DE AI Y VOZ
// ====================================================================
export { useAI } from './useAI'
export { useVoiceAgent } from './useVoiceAgent'
export { useVoiceInput } from './useVoiceInput'

// ====================================================================
// HOOKS DE AUTENTICACIÓN Y MERCADO
// ====================================================================
export { useAuth, AuthProvider } from './useAuth'
export { useMarketData } from './useMarketData'
