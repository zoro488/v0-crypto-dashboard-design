'use client'

/**
 * 📋 TESLA DATA TABLE - Premium 2025
 * 
 * Tabla de datos estilo Tesla/Apple:
 * - Fondo transparente
 * - Filas con hover #111111
 * - Zebra striping sutil
 * - Header sticky con frost
 * - Sortable con animación
 * - Acciones en fila (3 dots → menu radial)
 * - Paginación elegante
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useCallback } from 'react'
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode
}

interface RowAction<T> {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: (row: T) => void
  variant?: 'default' | 'danger'
}

interface TeslaDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: RowAction<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  className?: string
  onRowClick?: (row: T) => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Action Menu
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionMenuProps<T> {
  row: T
  actions: RowAction<T>[]
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

function ActionMenu<T>({ row, actions, isOpen, onToggle, onClose }: ActionMenuProps<T>) {
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-white/40" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={onClose}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 min-w-[160px]
                         bg-[#0A0A0A] border border-white/10 rounded-xl
                         shadow-2xl shadow-black/50 overflow-hidden"
            >
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      action.onClick(row)
                      onClose()
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      'transition-colors text-left',
                      action.variant === 'danger'
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-white/70 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Pagination
// ═══════════════════════════════════════════════════════════════════════════════

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
      <p className="text-sm text-white/40">
        Página {currentPage} de {totalPages}
      </p>
      
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </motion.button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number
            if (totalPages <= 5) {
              page = i + 1
            } else if (currentPage <= 3) {
              page = i + 1
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i
            } else {
              page = currentPage - 2 + i
            }

            return (
              <motion.button
                key={page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPageChange(page)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                  page === currentPage
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:bg-white/5',
                )}
              >
                {page}
              </motion.button>
            )
          })}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white/60" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="w-4 h-4 text-white/60" />
        </motion.button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <tr key={i} className="border-b border-white/5">
          {Array.from({ length: columns }, (_, j) => (
            <td key={j} className="px-4 py-4">
              <motion.div
                className="h-4 bg-white/5 rounded"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.1 }}
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function TeslaDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  onSearch,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  className,
  onRowClick,
}: TeslaDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null)

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(query),
        ),
      )
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof T]
        const bVal = b[sortConfig.key as keyof T]
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchQuery, sortConfig])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize])

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    onSearch?.(query)
  }, [onSearch])

  return (
    <div className={cn('rounded-2xl overflow-hidden', className)}>
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-white/5 bg-black/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl
                         text-sm text-white placeholder-white/30 outline-none
                         focus:border-white/10 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-black/40 backdrop-blur-xl border-b border-white/5">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider',
                    'text-left',
                    column.sortable && 'cursor-pointer hover:text-white/70 transition-colors select-none',
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className={cn(
                    'flex items-center gap-1',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end',
                  )}>
                    <span>{column.header}</span>
                    {column.sortable && sortConfig?.key === column.key && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </motion.span>
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 w-12" />
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <TableSkeleton columns={columns.length + (actions ? 1 : 0)} />
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-white/40"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-white/5',
                    'hover:bg-[#111111] transition-colors',
                    index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((column) => {
                    const value = row[column.key as keyof T]
                    return (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-4 py-4 text-sm text-white/80',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                        )}
                      >
                        {column.render
                          ? column.render(value, row, index)
                          : String(value ?? '-')}
                      </td>
                    )
                  })}
                  
                  {/* Actions */}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-4">
                      <ActionMenu
                        row={row}
                        actions={actions}
                        isOpen={openActionMenu === index}
                        onToggle={() => setOpenActionMenu(openActionMenu === index ? null : index)}
                        onClose={() => setOpenActionMenu(null)}
                      />
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const defaultTableActions = <T,>(handlers: {
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onCopy?: (row: T) => void
  onDelete?: (row: T) => void
}): RowAction<T>[] => {
  const actions: RowAction<T>[] = []

  if (handlers.onView) {
    actions.push({
      id: 'view',
      label: 'Ver detalles',
      icon: Eye,
      onClick: handlers.onView,
    })
  }

  if (handlers.onEdit) {
    actions.push({
      id: 'edit',
      label: 'Editar',
      icon: Edit,
      onClick: handlers.onEdit,
    })
  }

  if (handlers.onCopy) {
    actions.push({
      id: 'copy',
      label: 'Duplicar',
      icon: Copy,
      onClick: handlers.onCopy,
    })
  }

  if (handlers.onDelete) {
    actions.push({
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: handlers.onDelete,
      variant: 'danger',
    })
  }

  return actions
}

export default TeslaDataTable
