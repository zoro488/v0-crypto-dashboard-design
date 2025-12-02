/**
 * 🎨 HOOKS DE OPTIMIZACIÓN DE RENDERIZADO
 * 
 * Hooks para optimizar animaciones y renderizado 60fps.
 */

import { 
  useRef, 
  useEffect, 
  useCallback, 
  useState, 
  useMemo,
  useLayoutEffect 
} from 'react';

// ===== RAF LOOP OPTIMIZADO =====

interface UseAnimationFrameOptions {
  fps?: number; // Limitar FPS si es necesario
  pauseOnBlur?: boolean; // Pausar cuando la pestaña pierde foco
}

export function useAnimationFrame(
  callback: (deltaTime: number) => void,
  options: UseAnimationFrameOptions = {}
) {
  const { fps = 60, pauseOnBlur = true } = options;
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  const fpsInterval = 1000 / fps;
  const isPausedRef = useRef(false);

  // Mantener callback actualizado
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Manejar visibilidad
  useEffect(() => {
    if (!pauseOnBlur) return;

    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pauseOnBlur]);

  // Loop de animación
  useEffect(() => {
    const animate = (time: number) => {
      if (isPausedRef.current) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - previousTimeRef.current;

      if (deltaTime >= fpsInterval) {
        previousTimeRef.current = time - (deltaTime % fpsInterval);
        callbackRef.current(deltaTime);
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [fpsInterval]);
}

// ===== DEBOUNCE OPTIMIZADO =====

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ===== THROTTLE PARA EVENTOS =====

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - (Date.now() - lastRan.current));
      }
    }) as T,
    [callback, delay]
  );
}

// ===== INTERSECTION OBSERVER PARA LAZY LOADING =====

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin]);

  return { ref, isInView };
}

// ===== RESIZE OBSERVER OPTIMIZADO =====

export function useResizeObserver<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        requestAnimationFrame(() => {
          setSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

// ===== CANVAS CONTEXT OPTIMIZADO =====

export function useCanvasContext(options?: CanvasRenderingContext2DSettings) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // Para menor latencia
      ...options,
    });

    if (ctx) {
      ctxRef.current = ctx;
      // Optimizaciones de renderizado
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  return { canvasRef, ctx: ctxRef.current, clearCanvas };
}

// ===== SPRING ANIMATION =====

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function useSpring(
  targetValue: number,
  config: SpringConfig = {}
) {
  const { stiffness = 170, damping = 26, mass = 1 } = config;
  const [value, setValue] = useState(targetValue);
  const velocity = useRef(0);
  const prevTarget = useRef(targetValue);

  useAnimationFrame((deltaTime) => {
    const dt = Math.min(deltaTime, 64) / 1000; // Cap a 64ms
    
    const displacement = value - targetValue;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity.current;
    const acceleration = (springForce + dampingForce) / mass;
    
    velocity.current += acceleration * dt;
    const newValue = value + velocity.current * dt;
    
    // Parar si está lo suficientemente cerca
    if (Math.abs(displacement) < 0.01 && Math.abs(velocity.current) < 0.01) {
      setValue(targetValue);
      velocity.current = 0;
    } else {
      setValue(newValue);
    }
  });

  // Reset velocity cuando cambia el target
  useEffect(() => {
    if (targetValue !== prevTarget.current) {
      prevTarget.current = targetValue;
    }
  }, [targetValue]);

  return value;
}

// ===== GPU LAYER OPTIMIZATION =====

export function useGPULayer() {
  return useMemo(() => ({
    style: {
      transform: 'translateZ(0)',
      willChange: 'transform',
      backfaceVisibility: 'hidden' as const,
    }
  }), []);
}

// ===== PERFORMANCE MONITOR =====

export function usePerformanceMonitor() {
  const fpsRef = useRef<number[]>([]);
  const [metrics, setMetrics] = useState({
    fps: 60,
    frameTime: 16.67,
    jank: 0,
  });

  useAnimationFrame((deltaTime) => {
    const fps = 1000 / deltaTime;
    fpsRef.current.push(fps);
    
    // Mantener últimos 60 frames
    if (fpsRef.current.length > 60) {
      fpsRef.current.shift();
    }

    // Calcular métricas cada segundo
    if (fpsRef.current.length >= 60) {
      const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
      const jankFrames = fpsRef.current.filter(f => f < 30).length;
      
      setMetrics({
        fps: Math.round(avgFps),
        frameTime: 1000 / avgFps,
        jank: jankFrames,
      });
    }
  });

  return metrics;
}

// ===== PRELOAD IMAGES =====

export function usePreloadImages(urls: string[]) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (urls.length === 0) {
      setLoaded(true);
      return;
    }

    let loadedCount = 0;
    const total = urls.length;

    const preload = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          setProgress((loadedCount / total) * 100);
          resolve();
        };
        img.src = url;
      });
    };

    Promise.all(urls.map(preload)).then(() => setLoaded(true));
  }, [urls]);

  return { loaded, progress };
}
