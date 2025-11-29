/**
 * Hooks - Exportaciones centralizadas
 * Sistema Chronos
 */

// Hook de IA unificado
export { useAI, type Message, type AIResponse, type UseAIResult } from './useAI'

// Hook de Spline 3D
export { useSpline } from './useSpline'

// Hook de Firestore CRUD (ubicado en app/hooks)
export { useFirestoreCRUD } from '@/app/hooks/useFirestoreCRUD'

// Hook de tiempo real
export {
  default as useRealtime,
  useRealtimeDocument,
  useRealtimeVentas,
  useRealtimeOrdenes,
  useRealtimeClientes,
  useRealtimeDistribuidores,
  useRealtimeBancos,
  useRealtimeSaldosBancos,
  useRealtimeAlmacen,
  useRealtimeNotificaciones,
  useRealtimeStats,
  useRealtimeDashboard,
} from './useRealtime'

// Hook de performance
export { useOptimizedPerformance } from './useOptimizedPerformance'
