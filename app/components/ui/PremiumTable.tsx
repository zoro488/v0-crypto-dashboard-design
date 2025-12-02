'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronUp, ChevronDown, Search, Filter, Download, 
  Eye, Edit, Trash2, MoreHorizontal, X, Check,
} from 'lucide-react'
import { logger } from '@/app/lib/utils/logger'

export interface TableColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface TableAction<T = any> {
  label: string
  icon: React.ReactNode
  onClick: (row: T) => void
  color?: string
  show?: (row: T) => boolean
}

interface PremiumTableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  actions?: TableAction<T>[]
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  emptyMessage?: string
  className?: string
  maxHeight?: string
}

export function PremiumTable<T extends Record<string, any>>({
  columns,
  data,
  actions = [],
  searchable = true,
  filterable = true,
  exportable = true,
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  maxHeight = '600px',
}: PremiumTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  // Filtrar datos
  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase()),
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

      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortConfig])

  // Handle sort
  const handleSort = (key: string) => {
    logger.info('Table sort', { context: 'PremiumTable', data: { key } })
    
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
  }

  // Handle selection
  const handleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      
      if (onSelectionChange) {
        const selected = Array.from(newSet).map(i => sortedData[i])
        onSelectionChange(selected)
      }
      
      return newSet
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    } else {
      const allIndexes = new Set(sortedData.map((_, i) => i))
      setSelectedRows(allIndexes)
      onSelectionChange?.(sortedData)
    }
  }

  // Export to CSV
  const handleExport = () => {
    logger.info('Exporting table data', { context: 'PremiumTable' })
    
    const csv = [
      columns.map(col => col.label).join(','),
      ...sortedData.map(row =>
        columns.map(col => {
          const value = row[col.key]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export_${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      {(searchable || filterable || exportable || selectedRows.size > 0) && (
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
          {selectedRows.size > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50"
            >
              <span className="text-cyan-400 font-semibold text-sm">
                {selectedRows.size} seleccionados
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
        <div className="overflow-x-auto custom-scrollbar" style={{ maxHeight }}>
          <table className="w-full">
            {/* Header */}
            <thead className="sticky top-0 z-10 backdrop-blur-xl bg-gradient-to-r from-slate-900/95 to-black/95 border-b border-white/20">
              <tr>
                {selectable && (
                  <th className="px-4 py-4 text-left">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSelectAll}
                      className="w-5 h-5 rounded border-2 border-white/40 flex items-center justify-center hover:border-cyan-500 transition-colors"
                    >
                      {selectedRows.size === sortedData.length && sortedData.length > 0 && (
                        <Check className="w-3 h-3 text-cyan-400" />
                      )}
                    </motion.button>
                  </th>
                )}
                
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-4 text-${column.align || 'left'} ${column.width || ''}`}
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
                
                {actions.length > 0 && (
                  <th className="px-4 py-4 text-center">
                    <span className="text-white/90 font-semibold">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              <AnimatePresence mode="popLayout">
                {sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                      className="px-4 py-12 text-center"
                    >
                      <p className="text-white/60">{emptyMessage}</p>
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, index) => (
                    <motion.tr
                      key={index}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      {selectable && (
                        <td className="px-4 py-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRowSelection(index)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedRows.has(index)
                                ? 'border-cyan-500 bg-cyan-500/20'
                                : 'border-white/40 hover:border-cyan-500'
                            }`}
                          >
                            {selectedRows.has(index) && (
                              <Check className="w-3 h-3 text-cyan-400" />
                            )}
                          </motion.button>
                        </td>
                      )}
                      
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-4 text-${column.align || 'left'} text-white/80`}
                        >
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </td>
                      ))}
                      
                      {actions.length > 0 && (
                        <td className="px-4 py-4">
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
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
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
