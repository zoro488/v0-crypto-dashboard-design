'use client'

import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { memo, useState, useCallback, useRef, useMemo, ReactNode } from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUANTUM TABLE - The Quantum Data Stream
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tabla futurista estilo terminal de Bloomberg con:
 * - Filas levitantes con gradiente de luz que sigue al cursor
 * - Headers sticky con frosted glass
 * - Acciones flotantes magnéticas
 * - Tipografía monoespaciada para datos financieros
 */

export interface ColumnDef<T> {
  id: string
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  width?: number
  align?: 'left' | 'center' | 'right'
  format?: 'currency' | 'number' | 'date' | 'text' | 'status'
}

interface QuantumTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  onRowClick?: (row: T, index: number) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  maxHeight?: number
  variant?: 'cyan' | 'emerald' | 'amethyst' | 'sapphire'
  emptyMessage?: string
}

// Shimmer skeleton loader
const ShimmerRow = memo(function ShimmerRow({ columnCount }: { columnCount: number }) {
  return (
    <div className="flex items-center gap-4 p-4 mb-1">
      {Array.from({ length: columnCount }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-md flex-1 overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          <motion.div
            className="h-full w-1/2"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            }}
            animate={{
              x: ['-100%', '300%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.1,
            }}
          />
        </div>
      ))}
    </div>
  )
})

// Fila individual con efectos hover
function QuantumRow<T extends Record<string, unknown>>({
  row,
  columns,
  index,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  variant,
}: {
  row: T
  columns: ColumnDef<T>[]
  index: number
  onRowClick?: (row: T, index: number) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  variant: string
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
  // Motion values para el gradiente que sigue al cursor
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const gradientX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const gradientY = useSpring(mouseY, { stiffness: 300, damping: 30 })
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!rowRef.current) return
    const rect = rowRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])
  
  const colorMap: Record<string, { accent: string; glow: string }> = {
    cyan: { accent: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
    emerald: { accent: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
    amethyst: { accent: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
    sapphire: { accent: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
  }
  
  const colors = colorMap[variant] || colorMap.cyan
  
  // Formatear valor según tipo
  const formatValue = useCallback((column: ColumnDef<T>, rowData: T): ReactNode => {
    const value = typeof column.accessor === 'function'
      ? column.accessor(rowData)
      : rowData[column.accessor as keyof T]
    
    if (value === null || value === undefined) return '-'
    
    switch (column.format) {
      case 'currency':
        const numVal = typeof value === 'number' ? value : parseFloat(String(value))
        return (
          <span 
            className="font-mono"
            style={{ 
              fontVariantNumeric: 'tabular-nums',
              color: numVal >= 0 ? '#10b981' : '#ef4444',
            }}
          >
            ${Math.abs(numVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      case 'number':
        return (
          <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {Number(value).toLocaleString()}
          </span>
        )
      case 'date':
        const date = value instanceof Date ? value : new Date(String(value))
        return (
          <span className="text-white/60 text-sm">
            {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )
      case 'status':
        const status = String(value).toLowerCase()
        const statusColors: Record<string, { bg: string; text: string }> = {
          completado: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
          completo: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
          pendiente: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
          cancelado: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
          procesando: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
        }
        const statusStyle = statusColors[status] || { bg: 'rgba(255,255,255,0.1)', text: '#ffffff' }
        return (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
          >
            {value as string}
          </span>
        )
      default:
        return <span className="text-white/80">{String(value)}</span>
    }
  }, [])
  
  const actions = useMemo(() => {
    const items: Array<{ icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }> = []
    if (onView) items.push({ icon: Eye, label: 'Ver', onClick: () => onView(row) })
    if (onEdit) items.push({ icon: Edit, label: 'Editar', onClick: () => onEdit(row) })
    if (onDelete) items.push({ icon: Trash2, label: 'Eliminar', onClick: () => onDelete(row), danger: true })
    return items
  }, [onView, onEdit, onDelete, row])
  
  return (
    <motion.div
      ref={rowRef}
      className="mx-2 mb-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      onMouseEnter={() => { setIsHovered(true); setShowActions(true) }}
      onMouseLeave={() => { setIsHovered(false); setShowActions(false) }}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="relative flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer overflow-hidden"
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
        }}
        animate={{
          scale: isHovered ? 1.005 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => onRowClick?.(row, index)}
      >
        {/* Gradiente de luz que sigue al cursor */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(300px circle at ${gradientX.get()}px ${gradientY.get()}px, ${colors.glow}, transparent 50%)`,
            }}
          />
        )}
        
        {/* Borde lateral neón */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
          style={{ background: colors.accent }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ 
            scaleY: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Celdas */}
        {columns.map((column) => (
          <div
            key={column.id}
            className="relative z-10"
            style={{
              flex: column.width ? `0 0 ${column.width}px` : 1,
              textAlign: column.align || 'left',
            }}
          >
            {formatValue(column, row)}
          </div>
        ))}
        
        {/* Acciones flotantes */}
        <AnimatePresence>
          {showActions && actions.length > 0 && (
            <motion.div
              className="absolute right-4 flex items-center gap-1"
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {actions.map((action, i) => (
                <motion.button
                  key={action.label}
                  onClick={(e) => { e.stopPropagation(); action.onClick() }}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: action.danger ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
                  }}
                  whileHover={{ 
                    scale: 1.15, 
                    background: action.danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: action.danger ? '#ef4444' : '#ffffff',
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <action.icon className="w-4 h-4" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// Componente principal
export function QuantumTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  maxHeight = 600,
  variant = 'cyan',
  emptyMessage = 'No hay datos disponibles',
}: QuantumTableProps<T>) {
  
  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(40px)' }}>
        {/* Header skeleton */}
        <div className="flex gap-4 p-4 border-b border-white/5">
          {columns.map((col) => (
            <div
              key={col.id}
              className="h-4 rounded bg-white/5"
              style={{ flex: col.width ? `0 0 ${col.width}px` : 1 }}
            />
          ))}
        </div>
        {/* Rows skeleton */}
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerRow key={i} columnCount={columns.length} />
        ))}
      </div>
    )
  }
  
  if (!data || data.length === 0) {
    return (
      <motion.div
        className="rounded-2xl p-12 text-center"
        style={{ 
          background: 'rgba(0, 0, 0, 0.4)', 
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-white/40 text-lg">{emptyMessage}</p>
      </motion.div>
    )
  }
  
  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{ 
        background: 'rgba(0, 0, 0, 0.4)', 
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Headers - Sticky Frosted Glass */}
      <div 
        className="sticky top-0 z-20 flex items-center gap-4 px-6 py-4"
        style={{
          background: 'rgba(10, 10, 15, 0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{
              flex: column.width ? `0 0 ${column.width}px` : 1,
              textAlign: column.align || 'left',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {column.header}
          </div>
        ))}
        {/* Espacio para acciones */}
        <div className="w-24" />
      </div>
      
      {/* Rows con scroll */}
      <div 
        className="overflow-y-auto scrollbar-obsidian py-2"
        style={{ maxHeight: maxHeight - 56 }}
      >
        {data.map((row, index) => (
          <QuantumRow
            key={index}
            row={row}
            columns={columns}
            index={index}
            onRowClick={onRowClick}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}

export default QuantumTable
