'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📊 CHRONOS DATA COMPONENTS - Tablas, Charts y Visualización
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, useState, useCallback, useMemo, ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Search, SortAsc, SortDesc, ChevronLeft, ChevronRight,
  MoreHorizontal, Eye, Pencil, Trash2, Filter,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHRONOS, GlassCard, ChronosButton, ChronosBadge, ChronosInput } from './chronos-ui'

// ═══════════════════════════════════════════════════════════════════════════
// 📋 QUANTUM TABLE - Tabla Premium con Sorting, Filtros y Paginación
// ═══════════════════════════════════════════════════════════════════════════

export interface Column<T> {
  key: keyof T | string
  label: string
  width?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T, index: number) => ReactNode
}

interface QuantumTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T, index: number) => void
  actions?: {
    view?: (row: T) => void
    edit?: (row: T) => void
    delete?: (row: T) => void
    custom?: { icon: LucideIcon; label: string; onClick: (row: T) => void }[]
  }
  loading?: boolean
  emptyMessage?: string
  stickyHeader?: boolean
  striped?: boolean
}

export function QuantumTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  onRowClick,
  actions,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  stickyHeader = true,
  striped = true,
}: QuantumTableProps<T>) {
  const prefersReducedMotion = useReducedMotion()
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionsRow, setOpenActionsRow] = useState<number | null>(null)
  
  // Filter & Sort Data
  const processedData = useMemo(() => {
    let result = [...data]
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchLower),
        ),
      )
    }
    
    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof T]
        const bVal = b[sortConfig.key as keyof T]
        
        if (aVal == null) return 1
        if (bVal == null) return -1
        
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }
    
    return result
  }, [data, search, sortConfig])
  
  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize])
  
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }, [])
  
  const getValue = (row: T, key: string): unknown => {
    if (key.includes('.')) {
      return key.split('.').reduce((obj: unknown, k) => {
        if (obj && typeof obj === 'object' && k in obj) {
          return (obj as Record<string, unknown>)[k]
        }
        return undefined
      }, row)
    }
    return row[key as keyof T]
  }
  
  return (
    <GlassCard padding="none" className="overflow-hidden">
      {/* Header */}
      {searchable && (
        <div 
          className="p-4 border-b"
          style={{ borderColor: CHRONOS.colors.glassBorder }}
        >
          <div className="relative max-w-md">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: CHRONOS.colors.textMuted }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: CHRONOS.colors.glassBg,
                border: `1px solid ${CHRONOS.colors.glassBorder}`,
                color: CHRONOS.colors.textPrimary,
              }}
            />
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={cn(stickyHeader && 'sticky top-0 z-10')}
              style={{ 
                background: CHRONOS.colors.voidSoft,
                borderBottom: `1px solid ${CHRONOS.colors.glassBorder}`,
              }}
            >
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:bg-white/5',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                  )}
                  style={{ 
                    color: CHRONOS.colors.textMuted,
                    width: col.width,
                  }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' 
                        ? <SortAsc className="w-3 h-3" />
                        : <SortDesc className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th 
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right"
                  style={{ color: CHRONOS.colors.textMuted, width: '80px' }}
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              // Loading Skeleton
              [...Array(5)].map((_, i) => (
                <tr 
                  key={i}
                  style={{ borderBottom: `1px solid ${CHRONOS.colors.glassBorder}` }}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-4">
                      <div 
                        className="h-4 rounded animate-pulse"
                        style={{ background: CHRONOS.colors.glassBg, width: '60%' }}
                      />
                    </td>
                  ))}
                  {actions && <td className="px-4 py-4" />}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                  style={{ color: CHRONOS.colors.textMuted }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.03 }}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-white/5',
                    striped && rowIndex % 2 === 1 && 'bg-white/[0.02]',
                  )}
                  style={{ borderBottom: `1px solid ${CHRONOS.colors.glassBorder}` }}
                >
                  {columns.map((col) => {
                    const value = getValue(row, String(col.key))
                    return (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'px-4 py-3 text-sm',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                        )}
                        style={{ color: CHRONOS.colors.textPrimary }}
                      >
                        {col.render ? col.render(value, row, rowIndex) : String(value ?? '-')}
                      </td>
                    )
                  })}
                  
                  {actions && (
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenActionsRow(openActionsRow === rowIndex ? null : rowIndex)
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreHorizontal 
                          className="w-4 h-4"
                          style={{ color: CHRONOS.colors.textMuted }}
                        />
                      </button>
                      
                      <AnimatePresence>
                        {openActionsRow === rowIndex && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-4 top-full mt-1 z-20 min-w-[140px] py-1 rounded-xl shadow-xl"
                            style={{
                              background: CHRONOS.colors.voidMuted,
                              border: `1px solid ${CHRONOS.colors.glassBorder}`,
                            }}
                          >
                            {actions.view && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  actions.view!(row)
                                  setOpenActionsRow(null)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                                style={{ color: CHRONOS.colors.textSecondary }}
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </button>
                            )}
                            {actions.edit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  actions.edit!(row)
                                  setOpenActionsRow(null)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                                style={{ color: CHRONOS.colors.textSecondary }}
                              >
                                <Pencil className="w-4 h-4" />
                                Editar
                              </button>
                            )}
                            {actions.delete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  actions.delete!(row)
                                  setOpenActionsRow(null)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                                style={{ color: CHRONOS.colors.error }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div 
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: CHRONOS.colors.glassBorder }}
        >
          <span 
            className="text-sm"
            style={{ color: CHRONOS.colors.textMuted }}
          >
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, processedData.length)} de {processedData.length}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" style={{ color: CHRONOS.colors.textSecondary }} />
            </button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    currentPage === pageNum ? '' : 'hover:bg-white/5',
                  )}
                  style={{
                    background: currentPage === pageNum ? CHRONOS.colors.cyan : 'transparent',
                    color: currentPage === pageNum ? CHRONOS.colors.void : CHRONOS.colors.textSecondary,
                  }}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" style={{ color: CHRONOS.colors.textSecondary }} />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 STAT CARD - Tarjeta de Estadística Simple
// ═══════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: LucideIcon
  color?: 'cyan' | 'magenta' | 'violet' | 'success' | 'warning' | 'error'
}

const colorMap = {
  cyan: { accent: CHRONOS.colors.cyan, bg: CHRONOS.colors.cyanMuted },
  magenta: { accent: CHRONOS.colors.magenta, bg: CHRONOS.colors.magentaMuted },
  violet: { accent: CHRONOS.colors.violet, bg: CHRONOS.colors.violetMuted },
  success: { accent: CHRONOS.colors.success, bg: 'rgba(16, 185, 129, 0.1)' },
  warning: { accent: CHRONOS.colors.warning, bg: 'rgba(245, 158, 11, 0.1)' },
  error: { accent: CHRONOS.colors.error, bg: 'rgba(239, 68, 68, 0.1)' },
}

export const StatCard = memo(({ label, value, sublabel, icon: Icon, color = 'cyan' }: StatCardProps) => {
  const c = colorMap[color]
  
  return (
    <GlassCard className="flex items-center gap-4">
      {Icon && (
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.bg }}
        >
          <Icon className="w-6 h-6" style={{ color: c.accent }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium truncate"
          style={{ color: CHRONOS.colors.textMuted }}
        >
          {label}
        </p>
        <p 
          className="text-2xl font-bold truncate"
          style={{ color: CHRONOS.colors.textPrimary }}
        >
          {value}
        </p>
        {sublabel && (
          <p 
            className="text-xs truncate"
            style={{ color: CHRONOS.colors.textMuted }}
          >
            {sublabel}
          </p>
        )}
      </div>
    </GlassCard>
  )
})
StatCard.displayName = 'StatCard'

// ═══════════════════════════════════════════════════════════════════════════
// 🏦 BANK CARD - Tarjeta de Banco/Bóveda
// ═══════════════════════════════════════════════════════════════════════════

export interface BankData {
  id: string
  name: string
  balance: number
  ingresos: number
  gastos: number
  trend?: number
}

interface BankCardProps {
  bank: BankData
  color?: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'cyan' | 'orange'
  onClick?: () => void
}

const bankColors = {
  emerald: { primary: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
  sky: { primary: '#0EA5E9', gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)' },
  violet: { primary: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
  amber: { primary: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  rose: { primary: '#F43F5E', gradient: 'linear-gradient(135deg, #F43F5E, #E11D48)' },
  cyan: { primary: '#00D9FF', gradient: 'linear-gradient(135deg, #00D9FF, #00B4D8)' },
  orange: { primary: '#FB923C', gradient: 'linear-gradient(135deg, #FB923C, #F97316)' },
}

export const BankCard = memo(({ bank, color = 'cyan', onClick }: BankCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const c = bankColors[color]
  
  const formatCurrency = (n: number) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n)
  
  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 cursor-pointer',
        'transition-shadow duration-300 hover:shadow-lg',
      )}
      style={{
        background: CHRONOS.colors.glassBg,
        border: `1px solid ${CHRONOS.colors.glassBorder}`,
      }}
    >
      {/* Accent Line */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: c.gradient }}
      />
      
      {/* Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 
            className="text-sm font-medium uppercase tracking-wide"
            style={{ color: c.primary }}
          >
            {bank.name}
          </h3>
          {bank.trend !== undefined && (
            <ChronosBadge 
              variant={bank.trend >= 0 ? 'success' : 'error'} 
              size="sm"
            >
              {bank.trend >= 0 ? '+' : ''}{bank.trend.toFixed(1)}%
            </ChronosBadge>
          )}
        </div>
        
        <p 
          className="text-3xl font-bold"
          style={{ color: CHRONOS.colors.textPrimary }}
        >
          {formatCurrency(bank.balance)}
        </p>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p 
              className="text-xs font-medium mb-1"
              style={{ color: CHRONOS.colors.textMuted }}
            >
              Ingresos
            </p>
            <p 
              className="text-sm font-semibold"
              style={{ color: CHRONOS.colors.success }}
            >
              +{formatCurrency(bank.ingresos)}
            </p>
          </div>
          <div>
            <p 
              className="text-xs font-medium mb-1"
              style={{ color: CHRONOS.colors.textMuted }}
            >
              Gastos
            </p>
            <p 
              className="text-sm font-semibold"
              style={{ color: CHRONOS.colors.error }}
            >
              -{formatCurrency(bank.gastos)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
BankCard.displayName = 'BankCard'

// ═══════════════════════════════════════════════════════════════════════════
// 📈 MINI CHART - Gráfico Sparkline
// ═══════════════════════════════════════════════════════════════════════════

interface MiniChartProps {
  data: number[]
  color?: string
  height?: number
  showArea?: boolean
}

export const MiniChart = memo(({ 
  data, 
  color = CHRONOS.colors.cyan, 
  height = 40,
  showArea = true,
}: MiniChartProps) => {
  if (data.length < 2) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const width = 100
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4),
  }))
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#gradient-${color.replace('#', '')})`}
          opacity={0.3}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  )
})
MiniChart.displayName = 'MiniChart'

// ═══════════════════════════════════════════════════════════════════════════
// 🔔 ACTIVITY ITEM - Item de Actividad/Transacción
// ═══════════════════════════════════════════════════════════════════════════

interface ActivityItemProps {
  icon: LucideIcon
  title: string
  description?: string
  timestamp?: string
  amount?: number
  type?: 'income' | 'expense' | 'neutral'
  onClick?: () => void
}

export const ActivityItem = memo(({ 
  icon: Icon, 
  title, 
  description, 
  timestamp,
  amount,
  type = 'neutral',
  onClick,
}: ActivityItemProps) => {
  const prefersReducedMotion = useReducedMotion()
  
  const typeColors = {
    income: CHRONOS.colors.success,
    expense: CHRONOS.colors.error,
    neutral: CHRONOS.colors.textSecondary,
  }
  
  const formatCurrency = (n: number) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(Math.abs(n))
  
  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { x: 4 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors',
        onClick && 'cursor-pointer hover:bg-white/5',
      )}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: CHRONOS.colors.glassBg }}
      >
        <Icon className="w-5 h-5" style={{ color: typeColors[type] }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium truncate"
          style={{ color: CHRONOS.colors.textPrimary }}
        >
          {title}
        </p>
        {description && (
          <p 
            className="text-xs truncate"
            style={{ color: CHRONOS.colors.textMuted }}
          >
            {description}
          </p>
        )}
      </div>
      
      <div className="text-right flex-shrink-0">
        {amount !== undefined && (
          <p 
            className="text-sm font-semibold"
            style={{ color: typeColors[type] }}
          >
            {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
            {formatCurrency(amount)}
          </p>
        )}
        {timestamp && (
          <p 
            className="text-xs"
            style={{ color: CHRONOS.colors.textMuted }}
          >
            {timestamp}
          </p>
        )}
      </div>
    </motion.div>
  )
})
ActivityItem.displayName = 'ActivityItem'

// ═══════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  QuantumTable,
  StatCard,
  BankCard,
  MiniChart,
  ActivityItem,
}
