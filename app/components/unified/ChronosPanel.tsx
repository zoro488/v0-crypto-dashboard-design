'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 CHRONOS PANEL - SISTEMA UI UNIFICADO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Componente base que todos los paneles utilizarán para mantener
 * consistencia visual en todo el sistema CHRONOS.
 * 
 * Características:
 * - Aurora background animado
 * - Header con título, icono y acciones
 * - Grid de KPIs unificado
 * - Tabla premium con acciones
 * - Modales integrados
 * - Animaciones Framer Motion
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

import React, { memo, ReactNode, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, Download, RefreshCw, 
  ChevronRight, MoreHorizontal, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Minus, X, Check,
  type LucideIcon, 
} from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES Y COLORES CHRONOS
// ═══════════════════════════════════════════════════════════════════════════

export const CHRONOS_COLORS = {
  cyan: '#00F5FF',
  magenta: '#FF00AA',
  violet: '#8B5CF6',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  blue: '#3B82F6',
  gold: '#FBBF24',
} as const

export const SPRING_CONFIG = {
  stiffness: 300,
  damping: 30,
  mass: 0.8,
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface KPIData {
  id: string
  title: string
  value: string | number
  numericValue?: number
  prefix?: string
  suffix?: string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  color: keyof typeof CHRONOS_COLORS
  sparklineData?: number[]
  onClick?: () => void
}

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T, index: number) => ReactNode
  sortable?: boolean
}

export interface TableAction<T> {
  id: string
  label: string
  icon: LucideIcon
  onClick: (row: T) => void
  variant?: 'default' | 'danger' | 'success'
  show?: (row: T) => boolean
}

export interface ChronosPanelProps {
  /** Título del panel */
  title: string
  /** Subtítulo opcional */
  subtitle?: string
  /** Icono del panel */
  icon: LucideIcon
  /** Color principal del panel */
  color?: keyof typeof CHRONOS_COLORS
  /** Datos KPI para mostrar */
  kpis?: KPIData[]
  /** Contenido principal */
  children?: ReactNode
  /** Mostrar estado de carga */
  loading?: boolean
  /** Acción principal (botón +) */
  onAdd?: () => void
  /** Texto del botón agregar */
  addLabel?: string
  /** Acciones adicionales del header */
  headerActions?: ReactNode
  /** Mostrar barra de búsqueda */
  showSearch?: boolean
  /** Callback de búsqueda */
  onSearch?: (query: string) => void
  /** Placeholder de búsqueda */
  searchPlaceholder?: string
  /** Estado de conexión tiempo real */
  isConnected?: boolean
  /** Callback de refresh */
  onRefresh?: () => void
  /** Clase adicional */
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Aurora Background
// ═══════════════════════════════════════════════════════════════════════════

export const AuroraBackground = memo(function AuroraBackground({ 
  color = 'cyan', 
}: { 
  color?: keyof typeof CHRONOS_COLORS 
}) {
  const baseColor = CHRONOS_COLORS[color]
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <motion.div
        className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full blur-[180px]"
        style={{
          background: `radial-gradient(circle, ${baseColor}15 0%, transparent 70%)`,
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full blur-[180px]"
        style={{
          background: `radial-gradient(circle, ${CHRONOS_COLORS.magenta}12 0%, transparent 70%)`,
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full blur-[150px]"
        style={{
          background: `radial-gradient(circle, ${CHRONOS_COLORS.violet}08 0%, transparent 70%)`,
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: KPI Card Unificado
// ═══════════════════════════════════════════════════════════════════════════

export const UnifiedKPICard = memo(function UnifiedKPICard({
  data,
  index = 0,
}: {
  data: KPIData
  index?: number
}) {
  const { title, value, prefix, suffix, change, trend, icon: Icon, color, onClick } = data
  const baseColor = CHRONOS_COLORS[color]
  
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/40'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        type: 'spring',
        ...SPRING_CONFIG, 
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer',
        onClick && 'cursor-pointer',
      )}
    >
      {/* Glow effect */}
      <div 
        className="absolute -inset-1 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${baseColor}, ${CHRONOS_COLORS.magenta})` }}
      />
      
      {/* Card */}
      <div className="relative bg-black/60 backdrop-blur-[24px] border border-white/[0.08] rounded-2xl p-5 overflow-hidden group-hover:border-white/[0.15] transition-all">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} 
          />
        </div>
        
        {/* Gradient orb */}
        <motion.div
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ background: baseColor }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              {prefix && <span className="text-white/60 text-lg">{prefix}</span>}
              <span className="text-2xl md:text-3xl font-bold text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {suffix && <span className="text-white/60 text-sm ml-1">{suffix}</span>}
            </div>
            
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
                {React.createElement(trendIcon, { className: 'w-3 h-3' })}
                <span className="text-xs font-medium">
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>
          
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ 
              background: `${baseColor}20`,
              border: `1px solid ${baseColor}30`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: baseColor }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Tabla Premium Unificada
// ═══════════════════════════════════════════════════════════════════════════

export function UnifiedTable<T extends { id: string }>({
  data,
  columns,
  actions,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  selectedId,
}: {
  data: T[]
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  selectedId?: string
}) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }
  
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data
    
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortColumn]
      const bVal = (b as Record<string, unknown>)[sortColumn]
      
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])
  
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-16 bg-white/[0.02] rounded-xl animate-pulse" 
          />
        ))}
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-white/20" />
        </div>
        <p className="text-white/40 text-sm">{emptyMessage}</p>
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.sortable && 'cursor-pointer hover:text-white/60 transition-colors',
                )}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortColumn === col.key && (
                    <ChevronRight 
                      className={cn(
                        'w-3 h-3 transition-transform',
                        sortDirection === 'desc' ? 'rotate-90' : '-rotate-90',
                      )} 
                    />
                  )}
                </div>
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider w-24">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {sortedData.map((row, rowIndex) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.03 }}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'group transition-colors',
                onRowClick && 'cursor-pointer hover:bg-white/[0.03]',
                selectedId === row.id && 'bg-white/[0.05]',
              )}
            >
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[String(col.key)]
                return (
                  <td
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-4 text-sm text-white/80',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.render ? col.render(value, row, rowIndex) : String(value ?? '-')}
                  </td>
                )
              })}
              {actions && actions.length > 0 && (
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {actions.map((action) => {
                      if (action.show && !action.show(row)) return null
                      return (
                        <button
                          key={action.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick(row)
                          }}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            action.variant === 'danger' && 'hover:bg-rose-500/20 text-rose-400',
                            action.variant === 'success' && 'hover:bg-emerald-500/20 text-emerald-400',
                            !action.variant && 'hover:bg-white/10 text-white/60 hover:text-white',
                          )}
                          title={action.label}
                        >
                          <action.icon className="w-4 h-4" />
                        </button>
                      )
                    })}
                  </div>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Barra de Búsqueda
// ═══════════════════════════════════════════════════════════════════════════

export const SearchBar = memo(function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3 text-white/40" />
        </button>
      )}
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Botón Premium
// ═══════════════════════════════════════════════════════════════════════════

export const PremiumButton = memo(function PremiumButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className,
}: {
  children: ReactNode
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25',
    secondary: 'bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] hover:border-white/[0.15]',
    ghost: 'hover:bg-white/[0.05] text-white/60 hover:text-white',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Status Badge
// ═══════════════════════════════════════════════════════════════════════════

export const StatusBadge = memo(function StatusBadge({
  status,
  label,
}: {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  label: string
}) {
  const colors = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    neutral: 'bg-white/10 text-white/60 border-white/20',
  }
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
      colors[status],
    )}>
      {label}
    </span>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Indicador de Conexión
// ═══════════════════════════════════════════════════════════════════════════

export const ConnectionIndicator = memo(function ConnectionIndicator({
  isConnected,
  onRefresh,
}: {
  isConnected: boolean
  onRefresh?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500',
        )} />
        <span className="text-xs text-white/40">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
        </button>
      )}
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: ChronosPanel
// ═══════════════════════════════════════════════════════════════════════════

export const ChronosPanel = memo(function ChronosPanel({
  title,
  subtitle,
  icon: Icon,
  color = 'cyan',
  kpis,
  children,
  loading = false,
  onAdd,
  addLabel = 'Agregar',
  headerActions,
  showSearch = false,
  onSearch,
  searchPlaceholder = 'Buscar...',
  isConnected = true,
  onRefresh,
  className,
}: ChronosPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const baseColor = CHRONOS_COLORS[color]
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }, [onSearch])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-6">
        <AuroraBackground color={color} />
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-4 w-32 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* KPIs skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/[0.02] rounded-2xl animate-pulse" />
            ))}
          </div>
          
          {/* Table skeleton */}
          <div className="bg-white/[0.02] rounded-2xl p-4 animate-pulse h-96" />
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn('min-h-screen bg-black p-4 md:p-6', className)}>
      <AuroraBackground color={color} />
      
      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={SPRING_CONFIG}
            >
              <div 
                className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                style={{ background: baseColor }}
              />
              <div 
                className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: `${baseColor}20`,
                  border: `1px solid ${baseColor}40`,
                }}
              >
                <Icon className="w-6 h-6 md:w-7 md:h-7" style={{ color: baseColor }} />
              </div>
            </motion.div>
            
            <div>
              <h1 
                className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, ${baseColor}, ${CHRONOS_COLORS.magenta})`, 
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ConnectionIndicator isConnected={isConnected} onRefresh={onRefresh} />
            
            {headerActions}
            
            {onAdd && (
              <PremiumButton
                icon={Plus}
                variant="primary"
                onClick={onAdd}
              >
                {addLabel}
              </PremiumButton>
            )}
          </div>
        </motion.div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            SEARCH BAR
        ═══════════════════════════════════════════════════════════════════ */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="max-w-md"
            />
          </motion.div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════
            KPIs GRID
        ═══════════════════════════════════════════════════════════════════ */}
        {kpis && kpis.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <UnifiedKPICard key={kpi.id} data={kpi} index={index} />
            ))}
          </div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════
            CONTENIDO PRINCIPAL
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default ChronosPanel
