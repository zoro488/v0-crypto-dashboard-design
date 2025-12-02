/**
 * 🚀 PREMIUM TABLE VIRTUALIZED - CHRONOS SYSTEM
 * 
 * Tabla premium con virtualización para manejar grandes datasets
 * 
 * Características:
 * - Virtualización con @tanstack/react-virtual
 * - Renderiza solo filas visibles (optimizado para 10,000+ registros)
 * - Soporte para scroll infinito
 * - Animaciones Framer Motion preservadas
 * - Búsqueda, ordenamiento y selección
 * - Exportación CSV
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import { 
  ChevronUp, ChevronDown, Search, Download, 
  X, Check,
} from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

// ============================================================================
// TIPOS
// ============================================================================

export interface VirtualizedTableColumn<T = unknown> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  minWidth?: string
  render?: (value: unknown, row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface VirtualizedTableAction<T = unknown> {
  label: string
  icon: React.ReactNode
  onClick: (row: T) => void
  color?: string
  show?: (row: T) => boolean
}

interface PremiumTableVirtualizedProps<T = unknown> {
  columns: VirtualizedTableColumn<T>[]
  data: T[]
  actions?: VirtualizedTableAction<T>[]
  searchable?: boolean
  exportable?: boolean
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  emptyMessage?: string
  className?: string
  height?: number            // Altura del contenedor en px
  rowHeight?: number         // Altura de cada fila en px
  overscan?: number          // Filas extra para pre-renderizar
  getRowId?: (row: T) => string  // Función para obtener ID único de fila
}

// Altura por defecto de fila
const DEFAULT_ROW_HEIGHT = 56
const DEFAULT_HEIGHT = 600
const DEFAULT_OVERSCAN = 5

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PremiumTableVirtualized<T extends Record<string, unknown>>({
  columns,
  data,
  actions = [],
  searchable = true,
  exportable = true,
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  height = DEFAULT_HEIGHT,
  rowHeight = DEFAULT_ROW_HEIGHT,
  overscan = DEFAULT_OVERSCAN,
  getRowId,
}: PremiumTableVirtualizedProps<T>) {
  // Estados
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Refs
  const parentRef = useRef<HTMLDivElement>(null)

  // Función para obtener ID de fila
  const getRowIdFn = useCallback((row: T, index: number): string => {
    if (getRowId) return getRowId(row)
    // Fallback: usar 'id' si existe, o índice
    return (row as unknown as { id?: string }).id?.toString() ?? `row-${index}`
  }, [getRowId])

  // Filtrar datos
  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    const lowerQuery = searchQuery.toLowerCase()
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value ?? '').toLowerCase().includes(lowerQuery),
      ),
    )
  }, [data, searchQuery])

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === bValue) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortConfig])

  // Configurar virtualizador
  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Manejar ordenamiento
  const handleSort = useCallback((key: string) => {
    logger.info('Table sort', { context: 'PremiumTableVirtualized', data: { key } })
    
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
  }, [])

  // Manejar selección de fila
  const handleRowSelection = useCallback((row: T, index: number) => {
    const rowId = getRowIdFn(row, index)
    
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      
      // Notificar cambio de selección
      if (onSelectionChange) {
        const selectedRows = sortedData.filter((r, i) => 
          newSet.has(getRowIdFn(r, i)),
        )
        onSelectionChange(selectedRows)
      }
      
      return newSet
    })
  }, [sortedData, getRowIdFn, onSelectionChange])

  // Seleccionar/deseleccionar todos
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedData.length) {
      setSelectedIds(new Set())
      onSelectionChange?.([])
    } else {
      const allIds = new Set(sortedData.map((row, i) => getRowIdFn(row, i)))
      setSelectedIds(allIds)
      onSelectionChange?.(sortedData)
    }
  }, [sortedData, selectedIds.size, getRowIdFn, onSelectionChange])

  // Exportar a CSV
  const handleExport = useCallback(() => {
    logger.info('Exporting virtualized table data', { 
      context: 'PremiumTableVirtualized',
      data: { totalRows: sortedData.length },
    })
    
    const csv = [
      columns.map(col => col.label).join(','),
      ...sortedData.map(row =>
        columns.map(col => {
          const value = row[col.key]
          const strValue = String(value ?? '')
          return strValue.includes(',') ? `"${strValue}"` : strValue
        }).join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [columns, sortedData])

  // Calcular ancho total de columnas
  const hasActions = actions.length > 0
  const totalColumns = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      {(searchable || exportable || selectedIds.size > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20"
        >
          {/* Search */}
          {searchable && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en tabla..."
                className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Selection info */}
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50"
            >
              <span className="text-cyan-400 font-semibold text-sm">
                {selectedIds.size} seleccionados
              </span>
            </motion.div>
          )}

          {/* Export button */}
          {exportable && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-cyan-400 font-semibold flex items-center gap-2 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Table Container */}
      <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 overflow-hidden">
        {/* Header - sticky fuera del scroll */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-gradient-to-r from-slate-900/95 to-black/95 border-b border-white/20">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                {selectable && (
                  <th className="w-12 px-4 py-4 text-left">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSelectAll}
                      className="w-5 h-5 rounded border-2 border-white/40 flex items-center justify-center hover:border-cyan-500 transition-colors"
                    >
                      {selectedIds.size === sortedData.length && sortedData.length > 0 && (
                        <Check className="w-3 h-3 text-cyan-400" />
                      )}
                    </motion.button>
                  </th>
                )}
                
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-4 text-${column.align || 'left'}`}
                    style={{ 
                      width: column.width, 
                      minWidth: column.minWidth || '100px',
                    }}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-2 text-white/90 font-semibold hover:text-cyan-400 transition-colors group"
                      >
                        {column.label}
                        <div className="flex flex-col">
                          <ChevronUp
                            className={`w-3 h-3 -mb-1 transition-colors ${
                              sortConfig?.key === column.key && sortConfig.direction === 'asc'
                                ? 'text-cyan-400'
                                : 'text-white/30 group-hover:text-white/60'
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 transition-colors ${
                              sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                ? 'text-cyan-400'
                                : 'text-white/30 group-hover:text-white/60'
                            }`}
                          />
                        </div>
                      </button>
                    ) : (
                      <span className="text-white/90 font-semibold">{column.label}</span>
                    )}
                  </th>
                ))}
                
                {hasActions && (
                  <th className="w-32 px-4 py-4 text-center">
                    <span className="text-white/90 font-semibold">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
          </table>
        </div>

        {/* Virtualized Body */}
        <div
          ref={parentRef}
          className="overflow-auto custom-scrollbar"
          style={{ height: `${height}px` }}
        >
          {sortedData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-white/60">{emptyMessage}</p>
            </div>
          ) : (
            <div
              style={{
                height: `${totalSize}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <table className="w-full table-fixed">
                <tbody>
                  {virtualRows.map((virtualRow) => {
                    const row = sortedData[virtualRow.index]
                    const rowId = getRowIdFn(row, virtualRow.index)
                    const isSelected = selectedIds.has(rowId)
                    
                    return (
                      <tr
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={`border-b border-white/10 transition-colors ${
                          isSelected ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        {selectable && (
                          <td className="w-12 px-4 py-4">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRowSelection(row, virtualRow.index)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-cyan-500 bg-cyan-500/20'
                                  : 'border-white/40 hover:border-cyan-500'
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-cyan-400" />
                              )}
                            </motion.button>
                          </td>
                        )}
                        
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-4 py-4 text-${column.align || 'left'} text-white/80 truncate`}
                            style={{ 
                              width: column.width,
                              minWidth: column.minWidth || '100px',
                            }}
                          >
                            {column.render 
                              ? column.render(row[column.key], row) 
                              : String(row[column.key] ?? '')}
                          </td>
                        ))}
                        
                        {hasActions && (
                          <td className="w-32 px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {actions.map((action, actionIndex) => {
                                if (action.show && !action.show(row)) return null
                                
                                return (
                                  <motion.button
                                    key={actionIndex}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => action.onClick(row)}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                    style={{ color: action.color || '#06b6d4' }}
                                    title={action.label}
                                  >
                                    {action.icon}
                                  </motion.button>
                                )
                              })}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      {sortedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10"
        >
          <p className="text-white/60 text-sm">
            Mostrando {sortedData.length} de {data.length} registros
            <span className="text-cyan-400 ml-2">
              (virtualizado)
            </span>
          </p>
          {searchQuery && (
            <p className="text-cyan-400 text-sm font-semibold">
              Filtrado por: "{searchQuery}"
            </p>
          )}
        </motion.div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  )
}

export default PremiumTableVirtualized
