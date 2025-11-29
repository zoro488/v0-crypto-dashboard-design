'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Check,
  AlertCircle,
  User,
  Building2,
  Package,
  DollarSign,
  FileText,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { cn } from '@/app/lib/utils'

// ============================================
// Types
// ============================================

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'status' | 'badge' | 'avatar' | 'actions' | 'custom'

export interface Column<T> {
  key: keyof T | string
  header: string
  type?: ColumnType
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T, index: number) => React.ReactNode
  statusConfig?: Record<string, { color: string; label: string; icon?: React.ElementType }>
  formatValue?: (value: unknown) => string
}

export interface TableAction<T> {
  icon: React.ElementType
  label: string
  onClick: (row: T) => void
  color?: 'default' | 'primary' | 'danger' | 'success' | 'warning'
  showCondition?: (row: T) => boolean
}

export interface PremiumDataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: Column<T>[]
  actions?: TableAction<T>[]
  title?: string
  subtitle?: string
  icon?: React.ElementType
  color?: 'cyan' | 'purple' | 'green' | 'orange' | 'pink' | 'blue'
  loading?: boolean
  searchPlaceholder?: string
  onAdd?: () => void
  addLabel?: string
  onRowClick?: (row: T) => void
  onDelete?: (row: T) => Promise<void> | void
  onEdit?: (row: T) => void
  onView?: (row: T) => void
  emptyMessage?: string
  emptyIcon?: React.ElementType
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  showFilters?: boolean
  showExport?: boolean
  className?: string
  rowClassName?: string | ((row: T, index: number) => string)
  expandable?: boolean
  renderExpanded?: (row: T) => React.ReactNode
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  stickyHeader?: boolean
}

// ============================================
// Color Config
// ============================================

const colorConfig = {
  cyan: {
    gradient: 'from-cyan-500/20 to-blue-500/20',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    button: 'from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600',
  },
  purple: {
    gradient: 'from-purple-500/20 to-pink-500/20',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    button: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
  },
  green: {
    gradient: 'from-green-500/20 to-emerald-500/20',
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    button: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
  },
  orange: {
    gradient: 'from-orange-500/20 to-amber-500/20',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    button: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
  },
  pink: {
    gradient: 'from-pink-500/20 to-rose-500/20',
    text: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    button: 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
  },
  blue: {
    gradient: 'from-blue-500/20 to-indigo-500/20',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    button: 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
  },
}

const actionColors = {
  default: 'text-zinc-400 hover:text-white hover:bg-zinc-700/50',
  primary: 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  success: 'text-green-400 hover:text-green-300 hover:bg-green-500/10',
  warning: 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10',
}

// ============================================
// Skeleton Loader
// ============================================

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-6 bg-zinc-800/50 rounded animate-pulse"
              style={{ width: `${100 / columns}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function PremiumDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions = [],
  title,
  subtitle,
  icon: Icon,
  color = 'cyan',
  loading = false,
  searchPlaceholder = 'Buscar...',
  onAdd,
  addLabel = 'Agregar',
  onRowClick,
  onDelete,
  onEdit,
  onView,
  emptyMessage = 'No hay datos disponibles',
  emptyIcon: EmptyIcon = FileText,
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  showFilters = false,
  showExport = false,
  className,
  rowClassName,
  expandable = false,
  renderExpanded,
  selectable = false,
  onSelectionChange,
  stickyHeader = false,
}: PremiumDataTableProps<T>) {
  const colors = colorConfig[color]

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; row: T | null }>({ open: false, row: null })
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.key as keyof T]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(query)
      })
    })
  }, [data, searchQuery, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T]
      const bValue = b[sortColumn as keyof T]

      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handlers
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn])

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const handleToggleSelect = useCallback((index: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedData.map((_, i) => i)))
    }
  }, [paginatedData, selectedRows.size])

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.row || !onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(deleteConfirm.row)
      setDeleteConfirm({ open: false, row: null })
    } finally {
      setIsDeleting(false)
    }
  }

  // Cell renderer
  const renderCell = (row: T, column: Column<T>, rowIndex: number) => {
    if (column.render) {
      return column.render(row, rowIndex)
    }

    const value = row[column.key as keyof T]

    switch (column.type) {
      case 'currency':
        return (
          <span className="font-mono">
            ${typeof value === 'number' ? value.toLocaleString() : String(value ?? '-')}
          </span>
        )

      case 'date':
        if (!value) return <span className="text-zinc-500">-</span>
        const date = value instanceof Date ? value : new Date(value as string)
        return (
          <span className="text-zinc-300">
            {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )

      case 'status':
        const statusKey = value as string
        const config = column.statusConfig?.[statusKey]
        if (!config) return <span className="text-zinc-500">{String(value ?? '-')}</span>
        const StatusIcon = config.icon as React.ElementType | undefined
        return (
          <Badge
            variant="outline"
            className={cn('gap-1', config.color)}
          >
            {StatusIcon && React.createElement(StatusIcon, { className: 'w-3 h-3' })}
            {config.label}
          </Badge>
        )

      case 'avatar':
        const emailValue = 'email' in row ? String(row.email) : null
        return (
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', colors.bg)}>
              <User className={cn('w-5 h-5', colors.text)} />
            </div>
            <div>
              <div className="font-medium text-white">{String(value ?? '-')}</div>
              {emailValue && <div className="text-xs text-zinc-500">{emailValue}</div>}
            </div>
          </div>
        )

      case 'number':
        return (
          <span className="font-mono text-white">
            {typeof value === 'number' ? value.toLocaleString() : String(value ?? '-')}
          </span>
        )

      default:
        return <span className="text-white">{String(value ?? '-')}</span>
    }
  }

  // Default actions
  const defaultActions: TableAction<T>[] = [
    ...(onView ? [{ icon: Eye, label: 'Ver detalles', onClick: onView, color: 'default' as const }] : []),
    ...(onEdit ? [{ icon: Edit2, label: 'Editar', onClick: onEdit, color: 'primary' as const }] : []),
    ...(onDelete
      ? [
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: (row: T) => setDeleteConfirm({ open: true, row }),
            color: 'danger' as const,
          },
        ]
      : []),
    ...actions,
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative group', className)}
    >
      {/* Glow Effect */}
      <div className={cn('absolute inset-0 bg-gradient-to-r rounded-2xl blur-2xl transition-all', colors.gradient)} />

      {/* Main Container */}
      <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden">
        {/* Header */}
        {(title || onAdd || showSearch) && (
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title */}
              {title && (
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={cn('p-2 rounded-xl', colors.bg)}>
                      {React.createElement(Icon, { className: cn('w-5 h-5', colors.text) })}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Search */}
                {showSearch && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="pl-10 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 w-64"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Filter Button */}
                {showFilters && (
                  <Button variant="outline" size="sm" className="border-zinc-700/50 text-zinc-400 hover:text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                )}

                {/* Export Button */}
                {showExport && (
                  <Button variant="outline" size="sm" className="border-zinc-700/50 text-zinc-400 hover:text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                )}

                {/* Add Button */}
                {onAdd && (
                  <Button
                    onClick={onAdd}
                    className={cn('bg-gradient-to-r text-white', colors.button)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton columns={columns.length} />
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              {React.createElement(EmptyIcon, { className: 'w-16 h-16 mb-4 opacity-50' })}
              <p className="text-lg">{emptyMessage}</p>
              {onAdd && (
                <Button
                  onClick={onAdd}
                  className={cn('mt-4 bg-gradient-to-r text-white', colors.button)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addLabel}
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className={cn(stickyHeader && 'sticky top-0 z-10 bg-zinc-900/95')}>
                <tr className="border-b border-zinc-800/50">
                  {/* Selection Column */}
                  {selectable && (
                    <th className="w-12 py-4 px-4">
                      <button
                        onClick={handleSelectAll}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                          selectedRows.size === paginatedData.length
                            ? cn(colors.border, colors.bg)
                            : 'border-zinc-600 hover:border-zinc-500',
                        )}
                      >
                        {selectedRows.size === paginatedData.length && (
                          <Check className={cn('w-3 h-3', colors.text)} />
                        )}
                      </button>
                    </th>
                  )}

                  {/* Expand Column */}
                  {expandable && <th className="w-12 py-4 px-4" />}

                  {/* Data Columns */}
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className={cn(
                        'py-4 px-4 text-sm font-medium text-zinc-400',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        !column.align && 'text-left',
                        column.sortable && 'cursor-pointer select-none hover:text-white transition-colors',
                      )}
                      style={column.width ? { width: column.width } : undefined}
                      onClick={() => column.sortable && handleSort(String(column.key))}
                    >
                      <div className={cn(
                        'flex items-center gap-1',
                        column.align === 'center' && 'justify-center',
                        column.align === 'right' && 'justify-end',
                      )}>
                        {column.header}
                        {column.sortable && (
                          <span className="ml-1">
                            {sortColumn === column.key ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                  {/* Actions Column */}
                  {defaultActions.length > 0 && (
                    <th className="w-20 py-4 px-4 text-center text-sm font-medium text-zinc-400">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                <AnimatePresence mode="popLayout">
                  {paginatedData.map((row, rowIndex) => {
                    const globalIndex = (currentPage - 1) * pageSize + rowIndex
                    const isExpanded = expandedRows.has(rowIndex)
                    const isSelected = selectedRows.has(rowIndex)
                    const rowClasses = typeof rowClassName === 'function' ? rowClassName(row, rowIndex) : rowClassName

                    return (
                      <motion.tr
                        key={row.id ? String(row.id) : rowIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: rowIndex * 0.05 }}
                        className={cn(
                          'border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row',
                          onRowClick && 'cursor-pointer',
                          isSelected && colors.bg,
                          rowClasses,
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {/* Selection Cell */}
                        {selectable && (
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleSelect(rowIndex)}
                              className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                                isSelected
                                  ? cn(colors.border, colors.bg)
                                  : 'border-zinc-600 hover:border-zinc-500',
                              )}
                            >
                              {isSelected && <Check className={cn('w-3 h-3', colors.text)} />}
                            </button>
                          </td>
                        )}

                        {/* Expand Cell */}
                        {expandable && (
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleExpand(rowIndex)}
                              className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-all"
                            >
                              <ChevronDown
                                className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                              />
                            </button>
                          </td>
                        )}

                        {/* Data Cells */}
                        {columns.map((column) => (
                          <td
                            key={String(column.key)}
                            className={cn(
                              'py-4 px-4',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right',
                            )}
                          >
                            {renderCell(row, column, rowIndex)}
                          </td>
                        ))}

                        {/* Actions Cell */}
                        {defaultActions.length > 0 && (
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {defaultActions.length <= 3 ? (
                                defaultActions.map((action, actionIndex) => {
                                  if (action.showCondition && !action.showCondition(row)) return null
                                  return (
                                    <button
                                      key={actionIndex}
                                      onClick={() => action.onClick(row)}
                                      className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                                        actionColors[action.color || 'default'],
                                      )}
                                      title={action.label}
                                    >
                                      {React.createElement(action.icon, { className: 'w-4 h-4' })}
                                    </button>
                                  )
                                })
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-all">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-zinc-900 border-zinc-800"
                                  >
                                    <DropdownMenuLabel className="text-zinc-400">
                                      Acciones
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    {defaultActions.map((action, actionIndex) => {
                                      if (action.showCondition && !action.showCondition(row)) return null
                                      return (
                                        <DropdownMenuItem
                                          key={actionIndex}
                                          onClick={() => action.onClick(row)}
                                          className={cn(
                                            'cursor-pointer',
                                            actionColors[action.color || 'default'],
                                          )}
                                        >
                                          {React.createElement(action.icon, { className: 'w-4 h-4 mr-2' })}
                                          {action.label}
                                        </DropdownMenuItem>
                                      )
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800/50 flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Mostrando {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-zinc-700/50 text-zinc-400 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                        currentPage === pageNum
                          ? cn(colors.bg, colors.text)
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50',
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-zinc-700/50 text-zinc-400 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, row: null })}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ open: false, row: null })}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ============================================
// Pre-configured Table Components
// ============================================

// Status configs for common use cases
export const STATUS_CONFIGS = {
  payment: {
    completo: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Pagado', icon: Check },
    parcial: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Parcial', icon: AlertCircle },
    pendiente: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Pendiente', icon: X },
  },
  order: {
    pendiente: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Pendiente', icon: AlertCircle },
    enviado: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Enviado', icon: Package },
    entregado: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Entregado', icon: Check },
    cancelado: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cancelado', icon: X },
  },
  active: {
    true: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Activo', icon: Check },
    false: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', label: 'Inactivo', icon: X },
  },
}

export default PremiumDataTable
