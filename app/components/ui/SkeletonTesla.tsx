'use client'

/**
 * 💀 SKELETON TESLA - Loading states premium
 * 
 * Variantes para diferentes tipos de contenido:
 * - text: líneas de texto
 * - circle: avatares, iconos
 * - card: tarjetas completas
 * - kpi: números grandes
 * - table: filas de tabla
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rect' | 'kpi'
  width?: string | number
  height?: string | number
  animate?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE BASE
// ═══════════════════════════════════════════════════════════════════════════

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded-md',
    circle: 'rounded-full aspect-square',
    rect: 'rounded-xl',
    kpi: 'h-16 rounded-lg',
  }

  return (
    <motion.div
      className={cn(
        'bg-white/5',
        variantStyles[variant],
        animate && 'animate-pulse',
        className,
      )}
      style={{
        width: width,
        height: height,
      }}
      initial={{ opacity: 0.5 }}
      animate={animate ? { opacity: [0.5, 0.8, 0.5] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON CARD
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonCardProps {
  className?: string
  showHeader?: boolean
  showContent?: boolean
  showFooter?: boolean
  lines?: number
  children?: React.ReactNode
}

export function SkeletonCard({
  className,
  showHeader = true,
  showContent = true,
  showFooter = false,
  lines = 3,
  children,
}: SkeletonCardProps) {
  return (
    <div className={cn(
      'p-6 rounded-2xl',
      'bg-[#1C1C1E]/80 border border-white/8',
      className,
    )}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" />
            <Skeleton width="40%" className="h-3" />
          </div>
        </div>
      )}

      {/* Children or Content */}
      {children ? children : showContent && (
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              width={i === lines - 1 ? '75%' : '100%'}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/8">
          <Skeleton width={100} height={36} variant="rect" />
          <Skeleton width={100} height={36} variant="rect" />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON KPI
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonKPIProps {
  className?: string
}

export function SkeletonKPI({ className }: SkeletonKPIProps) {
  return (
    <div className={cn(
      'p-6 rounded-2xl',
      'bg-[#1C1C1E]/80 border border-white/8',
      className,
    )}>
      {/* Label */}
      <Skeleton width="40%" className="h-3 mb-4" />
      
      {/* Value */}
      <Skeleton variant="kpi" width="70%" className="mb-3" />
      
      {/* Trend */}
      <div className="flex items-center gap-2">
        <Skeleton width={60} className="h-4" />
        <Skeleton width={80} className="h-3" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON TABLE
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-white/10 bg-white/5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width={`${100 / columns}%`} className="h-4" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            'flex gap-4 p-4 border-b border-white/5',
            rowIndex % 2 === 1 && 'bg-white/[0.02]',
          )}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={`${100 / columns}%`}
              className="h-4"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON LIST
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonListProps {
  items?: number
  showAvatar?: boolean
  className?: string
}

export function SkeletonList({
  items = 3,
  showAvatar = true,
  className,
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          {showAvatar && (
            <Skeleton variant="circle" width={44} height={44} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" />
            <Skeleton width="50%" className="h-3" />
          </div>
          <Skeleton width={80} height={28} variant="rect" />
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} className="h-8" />
          <Skeleton width={300} className="h-4" />
        </div>
        <Skeleton width={120} height={40} variant="rect" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard lines={0} showHeader={false}>
            <Skeleton variant="rect" height={300} className="w-full" />
          </SkeletonCard>
        </div>
        <div>
          <SkeletonList items={5} />
        </div>
      </div>
    </div>
  )
}

export default Skeleton
