'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, ShoppingBag, Zap, Coffee, Wrench, Layers, Receipt,
  Plus, Upload, Camera, X, Calendar, DollarSign, CheckCircle2,
  ChevronLeft, ChevronRight, Trash2, AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { BancoId, GastoAbono } from '@/app/types'

// Helper para generar clases de color Tailwind estáticas
const getColorClass = (color: string, type: 'text' | 'bg', shade: number = 500) => {
  const colorMap: Record<string, Record<string, string>> = {
    blue: { text400: 'text-blue-400', text500: 'text-blue-500', bg500: 'bg-blue-500', bg20: 'bg-blue-500/20', bg30: 'bg-blue-500/30', bg50: 'bg-blue-500/50' },
    orange: { text400: 'text-orange-400', text500: 'text-orange-500', bg500: 'bg-orange-500', bg20: 'bg-orange-500/20', bg30: 'bg-orange-500/30', bg50: 'bg-orange-500/50' },
    purple: { text400: 'text-purple-400', text500: 'text-purple-500', bg500: 'bg-purple-500', bg20: 'bg-purple-500/20', bg30: 'bg-purple-500/30', bg50: 'bg-purple-500/50' },
    cyan: { text400: 'text-cyan-400', text500: 'text-cyan-500', bg500: 'bg-cyan-500', bg20: 'bg-cyan-500/20', bg30: 'bg-cyan-500/30', bg50: 'bg-cyan-500/50' },
    pink: { text400: 'text-pink-400', text500: 'text-pink-500', bg500: 'bg-pink-500', bg20: 'bg-pink-500/20', bg30: 'bg-pink-500/30', bg50: 'bg-pink-500/50' },
    gray: { text400: 'text-gray-400', text500: 'text-gray-500', bg500: 'bg-gray-500', bg20: 'bg-gray-500/20', bg30: 'bg-gray-500/30', bg50: 'bg-gray-500/50' },
  }
  const key = `${type}${shade}`
  return colorMap[color]?.[key] || ''
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💸 EXPENSE COMMAND CENTER - The Expense Command
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Central de gastos con:
 * - Modal "The Obelisk" con entrada dramática
 * - Grid de categorías 3D con presupuesto en vivo
 * - Input de monto gigante con barra de presupuesto
 * - Zona de escaneo de recibos estilo láser
 * - Lista de gastos con swipe gestures
 */

// Tipos de categorías
type CategoryId = 'operativo' | 'transporte' | 'mercancia' | 'servicios' | 'viaticos' | 'otros'
type CategoryColor = 'blue' | 'orange' | 'purple' | 'cyan' | 'pink' | 'gray'

interface CategoryConfig {
  id: CategoryId
  label: string
  icon: LucideIcon
  color: CategoryColor
  budget: number
  spent: number
}

// Configuración de Categorías
const CATEGORIES: CategoryConfig[] = [
  { id: 'operativo', label: 'Operativo', icon: Zap, color: 'blue', budget: 50000, spent: 32000 },
  { id: 'transporte', label: 'Transporte', icon: Truck, color: 'orange', budget: 20000, spent: 15000 },
  { id: 'mercancia', label: 'Mercancía', icon: ShoppingBag, color: 'purple', budget: 100000, spent: 45000 },
  { id: 'servicios', label: 'Servicios', icon: Wrench, color: 'cyan', budget: 15000, spent: 12000 },
  { id: 'viaticos', label: 'Viáticos', icon: Coffee, color: 'pink', budget: 8000, spent: 2000 },
  { id: 'otros', label: 'Otros', icon: Layers, color: 'gray', budget: 5000, spent: 1000 },
]

interface ExpenseCommandCenterProps {
  gastos: GastoAbono[]
  onCreateGasto: (gasto: Omit<GastoAbono, 'id' | 'createdAt'>) => Promise<void>
  onDeleteGasto?: (id: string) => Promise<void>
  onApproveGasto?: (id: string) => Promise<void>
  categoriasBudget?: Record<CategoryId, { budget: number; spent: number }>
}

export default function ExpenseCommandCenter({
  gastos,
  onCreateGasto,
  onDeleteGasto,
  onApproveGasto,
  categoriasBudget,
}: ExpenseCommandCenterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [bancoDestino, setBancoDestino] = useState<BancoId>('profit')
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Merge categorías con datos reales si existen
  const categories: CategoryData[] = useMemo(() => {
    return CATEGORIES.map(cat => ({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
      color: cat.color,
      budget: categoriasBudget?.[cat.id]?.budget ?? cat.budget,
      spent: categoriasBudget?.[cat.id]?.spent ?? cat.spent,
    }))
  }, [categoriasBudget])

  // Gastos recientes
  const gastosRecientes = useMemo(() => {
    return gastos
      .filter(g => g.tipo === 'gasto')
      .sort((a, b) => {
        const dateA = typeof a.fecha === 'string' ? new Date(a.fecha) : new Date()
        const dateB = typeof b.fecha === 'string' ? new Date(b.fecha) : new Date()
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 20)
  }, [gastos])

  // Estadísticas
  const stats = useMemo(() => {
    const hoy = new Date().toDateString()
    const gastosHoy = gastos.filter(g => {
      const fecha = typeof g.fecha === 'string' ? new Date(g.fecha) : new Date()
      return fecha.toDateString() === hoy && g.tipo === 'gasto'
    })
    
    const totalHoy = gastosHoy.reduce((acc, g) => acc + g.valor, 0)
    const totalMes = gastos
      .filter(g => {
        const fecha = typeof g.fecha === 'string' ? new Date(g.fecha) : new Date()
        return fecha.getMonth() === new Date().getMonth() && g.tipo === 'gasto'
      })
      .reduce((acc, g) => acc + g.valor, 0)
    
    return { totalHoy, totalMes, countHoy: gastosHoy.length }
  }, [gastos])

  // Handler para crear gasto
  const handleSubmit = async () => {
    if (!selectedCategory || !monto || !concepto) return

    setIsSubmitting(true)
    try {
      await onCreateGasto({
        fecha,
        tipo: 'gasto',
        origen: concepto,
        valor: Number(monto),
        monto: Number(monto),
        tc: 1,
        pesos: Number(monto),
        destino: bancoDestino,
        bancoId: bancoDestino,
        concepto: `[${selectedCategory.toUpperCase()}] ${concepto}`,
      })
      
      // Reset form
      setIsModalOpen(false)
      setSelectedCategory(null)
      setMonto('')
      setConcepto('')
    } catch (error) {
      console.error('Error al crear gasto:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simular escaneo de recibo
  const handleScanReceipt = async () => {
    setIsScanning(true)
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simular datos extraídos
    setMonto(String(Math.floor(Math.random() * 5000) + 500))
    setConcepto('Recibo escaneado #' + Date.now().toString(36).slice(-4).toUpperCase())
    
    setIsScanning(false)
  }

  return (
    <div className="space-y-6">
      {/* Header con Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            Central de Gastos
          </h2>
          <p className="text-white/40 text-sm mt-1">Registra y gestiona los egresos del sistema</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/40">Hoy</div>
            <div className="text-red-400 font-mono font-bold text-lg">
              -${stats.totalHoy.toLocaleString('es-MX')}
            </div>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/40">Este Mes</div>
            <div className="text-white font-mono font-bold text-lg">
              -${stats.totalMes.toLocaleString('es-MX')}
            </div>
          </div>
          
          <motion.button
            onClick={() => setIsModalOpen(true)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl',
              'bg-gradient-to-r from-red-500 to-rose-600',
              'text-white font-semibold shadow-lg shadow-red-500/25',
              'hover:from-red-400 hover:to-rose-500 transition-all',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Nuevo Gasto
          </motion.button>
        </div>
      </div>

      {/* Resumen por Categoría */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat, index) => {
          const percent = (cat.spent / cat.budget) * 100
          const isCritical = percent > 85
          
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'p-4 rounded-2xl',
                'bg-black/40 border border-white/10',
                'hover:bg-white/5 transition-colors',
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <cat.icon className={cn('w-5 h-5', getColorClass(cat.color, 'text', 400))} />
                <span className="text-sm text-white/80">{cat.label}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Gastado</span>
                  <span className={cn(
                    'font-mono',
                    isCritical ? 'text-red-400' : 'text-white/60',
                  )}>
                    {percent.toFixed(0)}%
                  </span>
                </div>
                
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      isCritical ? 'bg-red-500' : getColorClass(cat.color, 'bg', 500),
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percent, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                
                <div className="flex justify-between text-xs font-mono text-white/40">
                  <span>${(cat.spent / 1000).toFixed(1)}k</span>
                  <span>${(cat.budget / 1000).toFixed(1)}k</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Lista de Gastos Recientes */}
      <div>
        <h3 className="text-white/60 text-sm font-medium mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Gastos Recientes
        </h3>
        
        <div className="space-y-2">
          {gastosRecientes.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              No hay gastos registrados
            </div>
          ) : (
            gastosRecientes.map((gasto, index) => (
              <ExpenseRow
                key={gasto.id}
                gasto={gasto}
                index={index}
                onDelete={() => onDeleteGasto?.(gasto.id)}
                onApprove={() => onApproveGasto?.(gasto.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal de Nuevo Gasto - "The Obelisk" */}
      <AnimatePresence>
        {isModalOpen && (
          <ExpenseModal
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            monto={monto}
            onMontoChange={setMonto}
            concepto={concepto}
            onConceptoChange={setConcepto}
            fecha={fecha}
            onFechaChange={setFecha}
            bancoDestino={bancoDestino}
            onBancoDestinoChange={setBancoDestino}
            isScanning={isScanning}
            onScan={handleScanReceipt}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE ROW - Fila con swipe gestures
// ═══════════════════════════════════════════════════════════════════════════

function ExpenseRow({
  gasto,
  index,
  onDelete,
  onApprove,
}: {
  gasto: GastoAbono
  index: number
  onDelete?: () => void
  onApprove?: () => void
}) {
  const [swipeX, setSwipeX] = useState(0)
  
  const fecha = typeof gasto.fecha === 'string' ? new Date(gasto.fecha) : new Date()
  
  // Extraer categoría del concepto
  const categoryMatch = gasto.concepto?.match(/\[([A-Z]+)\]/)
  const category = categoryMatch ? categoryMatch[1].toLowerCase() : 'otros'
  const categoryConfig = CATEGORIES.find(c => c.id === category) || CATEGORIES[5]
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="relative"
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.1}
      onDrag={(_, info) => setSwipeX(info.offset.x)}
      onDragEnd={(_, info) => {
        if (info.offset.x < -80) {
          onDelete?.()
        } else if (info.offset.x > 80) {
          onApprove?.()
        }
        setSwipeX(0)
      }}
    >
      {/* Acciones de swipe */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center bg-emerald-500/20 rounded-l-xl -z-10">
        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
      </div>
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-red-500/20 rounded-r-xl -z-10">
        <Trash2 className="w-6 h-6 text-red-400" />
      </div>

      <motion.div
        style={{ x: swipeX }}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl',
          'bg-black/40 border border-white/10',
          'hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing',
        )}
      >
        {/* Icono */}
        <div className={cn(
          'p-2.5 rounded-xl',
          getColorClass(categoryConfig.color, 'bg', 20),
        )}>
          <categoryConfig.icon className={cn(
            'w-5 h-5',
            getColorClass(categoryConfig.color, 'text', 400),
          )} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">
            {gasto.concepto?.replace(/\[[A-Z]+\]\s*/, '') || gasto.origen}
          </div>
          <div className="flex items-center gap-3 text-sm text-white/40 mt-0.5">
            <span>{fecha.toLocaleDateString('es-MX')}</span>
            <span className="capitalize">{categoryConfig.label}</span>
          </div>
        </div>

        {/* Monto */}
        <div className="text-right">
          <div className="text-red-400 font-mono font-bold text-lg">
            -${gasto.valor.toLocaleString('es-MX')}
          </div>
          <div className="text-xs text-white/30">{gasto.destino}</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE MODAL - "The Obelisk"
// ═══════════════════════════════════════════════════════════════════════════

interface CategoryData {
  id: CategoryId
  label: string
  icon: LucideIcon
  color: CategoryColor
  budget: number
  spent: number
}

interface ExpenseModalProps {
  categories: CategoryData[]
  selectedCategory: CategoryId | null
  onSelectCategory: (id: CategoryId) => void
  monto: string
  onMontoChange: (value: string) => void
  concepto: string
  onConceptoChange: (value: string) => void
  fecha: string
  onFechaChange: (value: string) => void
  bancoDestino: BancoId
  onBancoDestinoChange: (value: BancoId) => void
  isScanning: boolean
  onScan: () => void
  isSubmitting: boolean
  onSubmit: () => void
  onClose: () => void
}

function ExpenseModal({
  categories,
  selectedCategory,
  onSelectCategory,
  monto,
  onMontoChange,
  concepto,
  onConceptoChange,
  fecha,
  onFechaChange,
  bancoDestino,
  onBancoDestinoChange,
  isScanning,
  onScan,
  isSubmitting,
  onSubmit,
  onClose,
}: ExpenseModalProps) {
  const selectedCategoryData = categories.find(c => c.id === selectedCategory)
  const budgetRemaining = selectedCategoryData 
    ? selectedCategoryData.budget - selectedCategoryData.spent
    : 0

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 100, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: 50, rotateX: 5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'max-h-[90vh] overflow-y-auto',
          'bg-[rgba(8,8,12,0.98)] backdrop-blur-2xl',
          'rounded-t-[2rem] border-t border-white/10',
          'shadow-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Tinte de color según categoría seleccionada */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            className={cn(
              'absolute inset-0 pointer-events-none',
              `bg-${selectedCategoryData?.color || 'white'}-500`,
            )}
          />
        )}

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Nuevo Gasto</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Categoría - Grid 3D */}
          <div>
            <label className="block text-sm text-white/40 mb-3">Categoría</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat: CategoryData) => {
                const percent = (cat.spent / cat.budget) * 100
                const isSelected = selectedCategory === cat.id
                const isCritical = percent > 85
                const IconComponent = cat.icon
                
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={cn(
                      'relative p-4 rounded-2xl text-left transition-all',
                      'border h-28 flex flex-col justify-between',
                      isSelected 
                        ? cn(getColorClass(cat.color, 'bg', 20), 'border-white/30 ring-1 ring-white/20')
                        : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20',
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'p-2 rounded-xl',
                        isSelected ? getColorClass(cat.color, 'bg', 30) : 'bg-white/5',
                      )}>
                        {IconComponent && (
                          <IconComponent 
                            className={cn('w-5 h-5', isSelected ? getColorClass(cat.color, 'text', 400) : 'text-white/40')}
                          />
                        )}
                      </div>
                      <span className={cn(
                        'font-medium',
                        isSelected ? 'text-white' : 'text-white/60',
                      )}>
                        {cat.label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            'h-full rounded-full transition-all',
                            isCritical ? 'bg-red-500' : getColorClass(cat.color, 'bg', 500),
                          )}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-white/40">
                        <span>Quedan</span>
                        <span className={isCritical ? 'text-red-400' : ''}>
                          ${((cat.budget - cat.spent) / 1000).toFixed(1)}k
                        </span>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Input de Monto - Gigante */}
          <div>
            <label className="block text-sm text-white/40 mb-3">Monto</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl text-white/40">$</span>
              <input
                type="number"
                value={monto}
                onChange={(e) => onMontoChange(e.target.value)}
                placeholder="0.00"
                className={cn(
                  'w-full h-20 pl-14 pr-6 rounded-2xl text-4xl font-mono font-bold text-center',
                  'bg-black/40 border border-white/10',
                  'text-white placeholder:text-white/20',
                  'focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20',
                )}
              />
            </div>
            
            {/* Barra de presupuesto */}
            {selectedCategoryData && monto && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 rounded-xl bg-white/5"
              >
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/40">Presupuesto restante</span>
                  <span className={cn(
                    'font-mono',
                    budgetRemaining - Number(monto) < 0 ? 'text-red-400' : 'text-white/60',
                  )}>
                    ${(budgetRemaining - Number(monto)).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      (Number(monto) / budgetRemaining) > 0.8 ? 'bg-red-500' : 'bg-emerald-500',
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((Number(monto) / budgetRemaining) * 100, 100)}%` }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm text-white/40 mb-2">Concepto</label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => onConceptoChange(e.target.value)}
              placeholder="Describe el gasto..."
              className={cn(
                'w-full h-12 px-4 rounded-xl',
                'bg-black/40 border border-white/10',
                'text-white placeholder:text-white/30',
                'focus:outline-none focus:border-white/20',
              )}
            />
          </div>

          {/* Zona de Escaneo de Recibos */}
          <motion.button
            onClick={onScan}
            disabled={isScanning}
            className={cn(
              'relative w-full p-6 rounded-2xl border-2 border-dashed',
              'bg-gradient-to-b from-white/5 to-transparent',
              'hover:from-white/10 transition-all',
              isScanning ? 'border-emerald-500/50' : 'border-white/20 hover:border-white/40',
            )}
            whileHover={{ scale: 1.01 }}
          >
            {isScanning ? (
              <>
                {/* Línea de escaneo láser */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Camera className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <span className="text-emerald-400 font-medium">Escaneando...</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-white/40" />
                <span className="text-white/60">Arrastra un recibo o haz clic para escanear</span>
                <span className="text-xs text-white/30">JPG, PNG, PDF</span>
              </div>
            )}
          </motion.button>

          {/* Fecha y Banco */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/40 mb-2">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => onFechaChange(e.target.value)}
                className={cn(
                  'w-full h-12 px-4 rounded-xl',
                  'bg-black/40 border border-white/10',
                  'text-white',
                  'focus:outline-none focus:border-white/20',
                )}
              />
            </div>
            <div>
              <label className="block text-sm text-white/40 mb-2">Banco Origen</label>
              <select
                value={bancoDestino}
                onChange={(e) => onBancoDestinoChange(e.target.value as BancoId)}
                className={cn(
                  'w-full h-12 px-4 rounded-xl appearance-none',
                  'bg-black/40 border border-white/10',
                  'text-white',
                  'focus:outline-none focus:border-white/20',
                )}
              >
                <option value="profit">Profit</option>
                <option value="boveda_monte">Bóveda Monte</option>
                <option value="boveda_usa">Bóveda USA</option>
                <option value="leftie">Leftie</option>
                <option value="azteca">Azteca</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            onClick={onSubmit}
            disabled={!selectedCategory || !monto || !concepto || isSubmitting}
            className={cn(
              'w-full py-4 rounded-2xl font-semibold text-lg',
              'bg-gradient-to-r from-red-500 to-rose-600',
              'hover:from-red-400 hover:to-rose-500',
              'text-white shadow-lg shadow-red-500/25',
              'transition-all',
              (!selectedCategory || !monto || !concepto || isSubmitting) && 'opacity-50 cursor-not-allowed',
            )}
            whileHover={selectedCategory && monto && concepto ? { scale: 1.02 } : undefined}
            whileTap={selectedCategory && monto && concepto ? { scale: 0.98 } : undefined}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Registrando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <DollarSign className="w-5 h-5" />
                Registrar Gasto
              </span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
