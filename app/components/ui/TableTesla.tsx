'use client'

/**
 * 📊 TABLE TESLA - Tabla premium estilo Apple 2025
 * 
 * Características premium:
 * - Fondo por fila alternante sutil
 * - Hover row effect
 * - Cabecera sticky con blur
 * - Ordenamiento animado
 * - Selección de filas
 * - Paginación integrada
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/app/lib/utils'
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal, 
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: unknown, row: T, index: number) => React.ReactNode
}

export interface TableTeslaProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  selectable?: boolean
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
  onRowClick?: (row: T) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function TableTesla<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  pagination,
  className,
}: TableTeslaProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey]
      const bValue = (b as Record<string, unknown>)[sortKey]

      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  const toggleSelection = (key: string) => {
    const newSelection = new Set(selectedKeys)
    if (newSelection.has(key)) {
      newSelection.delete(key)
    } else {
      newSelection.add(key)
    }
    onSelectionChange?.(newSelection)
  }

  const toggleAll = () => {
    if (selectedKeys.size === data.length) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(data.map(keyExtractor)))
    }
  }

  return (
    <div className={cn('rounded-2xl overflow-hidden', className)}>
      {/* Table container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/10">
              {selectable && (
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedKeys.size === data.length && data.length > 0}
                    onChange={toggleAll}
                    className={cn(
                      'w-5 h-5 rounded-md',
                      'bg-transparent border-2 border-white/30',
                      'checked:bg-[#E31911] checked:border-[#E31911]',
                      'focus:ring-0 focus:ring-offset-0',
                      'cursor-pointer transition-colors',
                    )}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-4 text-left',
                    'text-sm font-semibold text-[#98989D] uppercase tracking-wider',
                    'bg-[#1C1C1E]/50 backdrop-blur-sm',
                    'sticky top-0 z-10',
                    column.sortable && 'cursor-pointer select-none hover:text-white',
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className={cn(
                    'flex items-center gap-2',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end',
                  )}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={cn(
                            'w-3 h-3 -mb-1',
                            sortKey === column.key && sortDirection === 'asc' 
                              ? 'text-[#E31911]' 
                              : 'text-white/30',
                          )} 
                        />
                        <ChevronDown 
                          className={cn(
                            'w-3 h-3',
                            sortKey === column.key && sortDirection === 'desc' 
                              ? 'text-[#E31911]' 
                              : 'text-white/30',
                          )} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {selectable && <td className="px-4 py-4" />}
                  {columns.map((column, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-white/10 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              // Empty state
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-[#98989D]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              <AnimatePresence mode="popLayout">
                {sortedData.map((row, index) => {
                  const key = keyExtractor(row)
                  const isSelected = selectedKeys.has(key)

                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'border-b border-white/5',
                        'transition-colors duration-150',
                        index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]',
                        'hover:bg-white/5',
                        isSelected && 'bg-[#E31911]/5 hover:bg-[#E31911]/10',
                        onRowClick && 'cursor-pointer',
                      )}
                    >
                      {selectable && (
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(key)}
                            className={cn(
                              'w-5 h-5 rounded-md',
                              'bg-transparent border-2 border-white/30',
                              'checked:bg-[#E31911] checked:border-[#E31911]',
                              'focus:ring-0 focus:ring-offset-0',
                              'cursor-pointer transition-colors',
                            )}
                          />
                        </td>
                      )}
                      {columns.map((column) => {
                        const value = (row as Record<string, unknown>)[String(column.key)]
                        return (
                          <td
                            key={String(column.key)}
                            className={cn(
                              'px-4 py-4 text-sm text-white',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right',
                            )}
                          >
                            {column.render 
                              ? column.render(value, row, index)
                              : String(value ?? '-')
                            }
                          </td>
                        )
                      })}
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
          <span className="text-sm text-[#98989D]">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={cn(
                'w-8 h-8 rounded-lg',
                'flex items-center justify-center',
                'bg-white/5 hover:bg-white/10',
                'text-[#98989D] hover:text-white',
                'transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) })
              .slice(0, 5)
              .map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg',
                      'flex items-center justify-center',
                      'text-sm font-medium',
                      'transition-colors duration-150',
                      pageNum === pagination.page
                        ? 'bg-[#E31911] text-white'
                        : 'bg-white/5 text-[#98989D] hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
            
            {Math.ceil(pagination.total / pagination.pageSize) > 5 && (
              <>
                <span className="text-[#98989D]">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
                <button
                  onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.pageSize))}
                  className={cn(
                    'w-8 h-8 rounded-lg',
                    'flex items-center justify-center',
                    'text-sm font-medium',
                    'bg-white/5 text-[#98989D] hover:bg-white/10 hover:text-white',
                    'transition-colors duration-150',
                  )}
                >
                  {Math.ceil(pagination.total / pagination.pageSize)}
                </button>
              </>
            )}
            
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className={cn(
                'w-8 h-8 rounded-lg',
                'flex items-center justify-center',
                'bg-white/5 hover:bg-white/10',
                'text-[#98989D] hover:text-white',
                'transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE PARA USAR EN TABLAS
// ═══════════════════════════════════════════════════════════════════════════

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'default'
}

export function Badge({
  children,
  variant = 'default',
  size = 'default',
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-white/10 text-white',
    success: 'bg-[#10B981]/10 text-[#10B981]',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    error: 'bg-[#E31911]/10 text-[#E31911]',
    info: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  }

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      variantStyles[variant],
    )}>
      {children}
    </span>
  )
}

export default TableTesla
