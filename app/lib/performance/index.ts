/**
 * 🚀 Performance Module Index
 * Exporta todas las utilidades de optimización
 */

// Optimization utilities
export {
  useIntersectionObserver,
  useDebounce,
  useThrottle,
  useAnimationFrame,
  useCleanup,
  ObjectPool,
  generateResponsiveImageUrls,
  preloadCriticalAssets,
  dnsPrefetch,
  getDeviceCapabilities,
  getAdaptive3DConfig,
  calculateVisibleRange,
  CHRONOS_EXTERNAL_DOMAINS,
} from './optimizations';

// Lazy loading components
export {
  Skeleton,
  PanelSkeleton,
  ChartSkeleton,
  TableSkeleton,
  Scene3DSkeleton,
  LazyComponent,
  LazyOnViewport,
  PrefetchOnHover,
} from './LazyComponents';
