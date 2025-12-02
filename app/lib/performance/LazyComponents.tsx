/**
 * 🎨 Lazy Loading Components
 * Componentes de carga diferida para optimización de rendimiento
 */

'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { useIntersectionObserver } from './optimizations';

// ===================================================================
// SKELETON LOADERS
// ===================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-muted';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted',
    none: '',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// ===================================================================
// PANEL SKELETON
// ===================================================================

export function PanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <Skeleton variant="rounded" width="100%" height={60} />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={80} />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-2 pt-2">
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={80} height={32} />
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// CHART SKELETON
// ===================================================================

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card/50">
      <Skeleton variant="text" width="30%" height={20} className="mb-4" />
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width="100%"
            height={`${Math.random() * 70 + 30}%`}
          />
        ))}
      </div>
    </div>
  );
}

// ===================================================================
// TABLE SKELETON
// ===================================================================

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-muted/30 border-b border-border/50">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / 5}%`} height={16} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-border/30 last:border-0">
          {Array.from({ length: 5 }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width={`${100 / 5}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ===================================================================
// 3D SCENE SKELETON
// ===================================================================

export function Scene3DSkeleton() {
  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/5 to-transparent animate-shimmer" />
      
      {/* Center loader */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando escena 3D...</span>
        </div>
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-4 left-4">
        <Skeleton variant="rounded" width={100} height={24} />
      </div>
      <div className="absolute bottom-4 right-4">
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </div>
  );
}

// ===================================================================
// LAZY COMPONENT WRAPPER
// ===================================================================

interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
  fallback?: React.ReactNode;
  props?: Record<string, unknown>;
}

export function LazyComponent({
  loader,
  fallback = <PanelSkeleton />,
  props = {},
}: LazyComponentProps) {
  const Component = lazy(loader);

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

// ===================================================================
// LAZY ON VIEWPORT
// ===================================================================

interface LazyOnViewportProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyOnViewport({
  children,
  fallback = <PanelSkeleton />,
  rootMargin = '100px',
  threshold = 0,
}: LazyOnViewportProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin,
    threshold,
    triggerOnce: true,
  });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {isIntersecting ? children : fallback}
    </div>
  );
}

// ===================================================================
// PREFETCH ON HOVER
// ===================================================================

interface PrefetchOnHoverProps {
  children: React.ReactNode;
  prefetch: () => void;
  delay?: number;
}

export function PrefetchOnHover({
  children,
  prefetch,
  delay = 100,
}: PrefetchOnHoverProps) {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPrefetched = React.useRef(false);

  const handleMouseEnter = React.useCallback(() => {
    if (hasPrefetched.current) return;
    
    timeoutRef.current = setTimeout(() => {
      prefetch();
      hasPrefetched.current = true;
    }, delay);
  }, [delay, prefetch]);

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
}

export default {
  Skeleton,
  PanelSkeleton,
  ChartSkeleton,
  TableSkeleton,
  Scene3DSkeleton,
  LazyComponent,
  LazyOnViewport,
  PrefetchOnHover,
};
