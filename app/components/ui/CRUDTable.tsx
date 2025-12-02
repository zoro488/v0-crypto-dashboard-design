'use client'

/**
 * 🔄 COMPONENTE DE TABLA CON ACCIONES CRUD
 * 
 * Tabla reutilizable con botones de editar y eliminar en cada fila.
 * Compatible con cualquier entidad del sistema CHRONOS.
 */

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/app/lib/utils'

// ============================================
// TIPOS
// ============================================

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (_value: unknown, _row: T) => React.ReactNode
  className?: string
  sortable?: boolean
}

export interface CRUDTableProps<T extends { id?: string }> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  onView?: (_item: T) => void
  onEdit?: (_item: T) => void
  onDelete?: (_item: T) => Promise<boolean>
  deleteConfirmTitle?: string
  deleteConfirmMessage?: string
  className?: string
  maxHeight?: string
  showRowNumbers?: boolean
  highlightOnHover?: boolean
  stickyHeader?: boolean
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function CRUDTableInner<T extends { id?: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  emptyIcon,
  onView,
  onEdit,
  onDelete,
  deleteConfirmTitle = '¿Eliminar este registro?',
  deleteConfirmMessage = 'Esta acción no se puede deshacer. El registro será eliminado permanentemente.',
  className,
  maxHeight = '600px',
  showRowNumbers = false,
  highlightOnHover = true,
  stickyHeader = true,
}: CRUDTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [deleteItem, setDeleteItem] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Ordenar datos
  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = (a as Record<string, unknown>)[sortKey]
    const bVal = (b as Record<string, unknown>)[sortKey]
    
    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    const comparison = aVal < bVal ? -1 : 1
    return sortDir === 'asc' ? comparison : -comparison
  })

  // Handler de ordenamiento
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Handler de eliminación
  const handleDelete = async () => {
    if (!deleteItem || !onDelete) return
    
    setDeleting(true)
    try {
      await onDelete(deleteItem)
    } finally {
      setDeleting(false)
      setDeleteItem(null)
    }
  }

  // Obtener valor de celda
  const getCellValue = (row: T, key: string): unknown => {
    const keys = key.split('.')
    let value: unknown = row
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k]
      } else {
        return undefined
      }
    }
    return value
  }

  // Renderizar valor por defecto
  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-zinc-500">-</span>
    if (typeof value === 'boolean') return value ? '✓' : '✗'
    if (typeof value === 'number') {
      if (value >= 1000) {
        return `$${value.toLocaleString('es-MX')}`
      }
      return value.toLocaleString('es-MX')
    }
    if (value instanceof Date) return value.toLocaleDateString('es-MX')
    if (typeof value === 'object' && 'seconds' in (value as Record<string, unknown>)) {
      return new Date((value as { seconds: number }).seconds * 1000).toLocaleDateString('es-MX')
    }
    return String(value)
  }

  const hasActions = onView || onEdit || onDelete

  return (
    <>
      <div 
        className={cn(
          'relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm',
          className,
        )}
      >
        <div 
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <table className="w-full">
            {/* Header */}
            <thead className={cn(
              'bg-black/40',
              stickyHeader && 'sticky top-0 z-10',
            )}>
              <tr className="border-b border-zinc-800">
                {showRowNumbers && (
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-12">
                    #
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'py-3 px-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider',
                      col.sortable && 'cursor-pointer hover:text-white transition-colors',
                      col.className,
                    )}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' 
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
                {hasActions && (
                  <th className="py-3 px-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider w-32">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td 
                    colSpan={columns.length + (showRowNumbers ? 1 : 0) + (hasActions ? 1 : 0)}
                    className="py-12 text-center"
                  >
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-zinc-500" />
                    <p className="mt-2 text-zinc-500 text-sm">Cargando datos...</p>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (showRowNumbers ? 1 : 0) + (hasActions ? 1 : 0)}
                    className="py-12 text-center"
                  >
                    {emptyIcon || <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-zinc-600" />}
                    <p className="text-zinc-500">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedData.map((row, index) => (
                    <motion.tr
                      key={row.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'group',
                        highlightOnHover && 'hover:bg-white/[0.02] transition-colors',
                      )}
                    >
                      {showRowNumbers && (
                        <td className="py-3 px-4 text-sm text-zinc-500">
                          {index + 1}
                        </td>
                      )}
                      {columns.map((col) => {
                        const value = getCellValue(row, String(col.key))
                        return (
                          <td
                            key={String(col.key)}
                            className={cn('py-3 px-4 text-sm text-white', col.className)}
                          >
                            {col.render ? col.render(value, row) : renderValue(value)}
                          </td>
                        )
                      })}
                      {hasActions && (
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* Botones siempre visibles */}
                            {onView && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onView(row)}
                                className="w-8 h-8 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(row)}
                                className="w-8 h-8 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteItem(row)}
                                className="w-8 h-8 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con conteo */}
        {sortedData.length > 0 && (
          <div className="px-4 py-2 border-t border-zinc-800/50 bg-black/20 text-xs text-zinc-500">
            Mostrando {sortedData.length} registro{sortedData.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {deleteConfirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {deleteConfirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
              disabled={deleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const CRUDTable = memo(CRUDTableInner) as typeof CRUDTableInner

// ============================================
// COMPONENTES DE AYUDA PARA RENDERIZADO
// ============================================

export function MoneyCell({ value, className }: { value: number; className?: string }) {
  const isNegative = value < 0
  return (
    <span className={cn(
      'font-mono font-medium',
      isNegative ? 'text-red-400' : 'text-green-400',
      className,
    )}>
      {isNegative ? '-' : ''}${Math.abs(value).toLocaleString('es-MX')}
    </span>
  )
}

export function StatusBadge({ 
  status, 
  variant = 'default',
}: { 
  status: string
  variant?: 'success' | 'warning' | 'error' | 'default' 
}) {
  const variants = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  
  return (
    <Badge variant="outline" className={variants[variant]}>
      {status}
    </Badge>
  )
}

export function DateCell({ value }: { value: unknown }) {
  if (!value) return <span className="text-zinc-500">-</span>
  
  let date: Date
  if (typeof value === 'object' && 'seconds' in (value as Record<string, unknown>)) {
    date = new Date((value as { seconds: number }).seconds * 1000)
  } else if (value instanceof Date) {
    date = value
  } else {
    date = new Date(String(value))
  }
  
  return (
    <span className="text-zinc-300">
      {date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}
    </span>
  )
}
