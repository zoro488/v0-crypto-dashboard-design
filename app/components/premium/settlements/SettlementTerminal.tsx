'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  Wallet,
  CreditCard,
  Banknote,
  Receipt,
  QrCode,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Search,
  Filter,
  SortAsc,
  ChevronRight,
  ChevronDown,
  X,
  Zap,
  Target,
  DollarSign,
  Percent,
  History,
  FileText,
  Send,
  Download,
  Share2,
  Printer,
  Sparkles,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  MoreVertical,
  Star,
  Gift,
  Award,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { Cliente, Distribuidor, Movimiento, BancoId } from '@/app/types'

// ============================================================================
// TIPOS
// ============================================================================

interface DebtRecord {
  id: string
  entityId: string
  entityType: 'cliente' | 'distribuidor'
  entityName: string
  totalDebt: number
  originalAmount: number
  paidAmount: number
  dueDate: Date
  status: 'current' | 'overdue' | 'critical' | 'paid'
  daysPastDue: number
  payments: PaymentRecord[]
  concept: string
  reference?: string
}

interface PaymentRecord {
  id: string
  amount: number
  date: Date
  method: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta'
  reference?: string
  receivedBy?: string
}

interface PaymentNote {
  denomination: number
  quantity: number
}

interface SettlementTerminalProps {
  debts: DebtRecord[]
  clients: Cliente[]
  distributors: Distribuidor[]
  onPayment: (debtId: string, amount: number, method: string, notes?: PaymentNote[]) => Promise<void>
  onGenerateReceipt: (paymentId: string) => Promise<string>
  className?: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

const STATUS_CONFIG = {
  current: {
    label: 'Al Corriente',
    color: 'emerald',
    icon: CheckCircle2,
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    ring: 'ring-emerald-500/50',
    text: 'text-emerald-400',
  },
  overdue: {
    label: 'Vencido',
    color: 'amber',
    icon: Clock,
    gradient: 'from-amber-500/20 to-amber-600/10',
    ring: 'ring-amber-500/50',
    text: 'text-amber-400',
  },
  critical: {
    label: 'Crítico',
    color: 'red',
    icon: AlertTriangle,
    gradient: 'from-red-500/20 to-red-600/10',
    ring: 'ring-red-500/50',
    text: 'text-red-400',
  },
  paid: {
    label: 'Pagado',
    color: 'blue',
    icon: CheckCircle2,
    gradient: 'from-blue-500/20 to-blue-600/10',
    ring: 'ring-blue-500/50',
    text: 'text-blue-400',
  },
}

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'emerald' },
  { id: 'transferencia', label: 'Transferencia', icon: Send, color: 'blue' },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'purple' },
  { id: 'cheque', label: 'Cheque', icon: FileText, color: 'amber' },
]

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20]

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// Anillo de Vida - visualiza el % de deuda pagado
function LifeRing({ 
  percentage, 
  status,
  size = 80,
  strokeWidth = 6,
}: { 
  percentage: number
  status: DebtRecord['status']
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  const statusColors = {
    current: { stroke: '#10b981', glow: '0 0 20px rgba(16, 185, 129, 0.5)' },
    overdue: { stroke: '#f59e0b', glow: '0 0 20px rgba(245, 158, 11, 0.5)' },
    critical: { stroke: '#ef4444', glow: '0 0 20px rgba(239, 68, 68, 0.5)' },
    paid: { stroke: '#3b82f6', glow: '0 0 20px rgba(59, 130, 246, 0.5)' },
  }
  
  const colors = statusColors[status]
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Fondo del anillo */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
      </svg>
      
      {/* Anillo de progreso */}
      <motion.svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(${colors.glow})` }}
        />
      </motion.svg>
      
      {/* Porcentaje central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-sm font-bold font-mono text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>
    </div>
  )
}

// Tarjeta de Deuda Individual
function DebtCard({
  debt,
  isSelected,
  onSelect,
  onQuickPay,
}: {
  debt: DebtRecord
  isSelected: boolean
  onSelect: () => void
  onQuickPay: () => void
}) {
  const config = STATUS_CONFIG[debt.status]
  const StatusIcon = config.icon
  const percentage = (debt.paidAmount / debt.originalAmount) * 100
  const remaining = debt.totalDebt
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer',
        'bg-gradient-to-br from-white/5 to-white/[0.02]',
        'border backdrop-blur-xl',
        'transition-all duration-300',
        isSelected 
          ? `border-${config.color}-500/50 shadow-lg shadow-${config.color}-500/20`
          : 'border-white/10 hover:border-white/20',
      )}
    >
      {/* Gradiente de fondo basado en status */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50',
        config.gradient,
      )} />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Anillo de Vida */}
            <LifeRing 
              percentage={percentage} 
              status={debt.status}
              size={56}
              strokeWidth={4}
            />
            
            <div>
              <h3 className="font-semibold text-white truncate max-w-[140px]">
                {debt.entityName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
                  `bg-${config.color}-500/20 ${config.text}`,
                )}>
                  {config.label}
                </span>
                {debt.daysPastDue > 0 && (
                  <span className="text-[10px] text-red-400 font-mono">
                    +{debt.daysPastDue}d
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <StatusIcon className={cn('w-5 h-5', config.text)} />
        </div>
        
        {/* Montos */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-white/50">Pendiente</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              ${remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', `bg-${config.color}-500`)}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-white/40 font-mono">
            <span>Pagado: ${debt.paidAmount.toLocaleString()}</span>
            <span>Original: ${debt.originalAmount.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Footer con concepto y botón */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="text-xs text-white/50 truncate max-w-[150px]">
            {debt.concept}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onQuickPay()
            }}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg',
              'bg-white/10 hover:bg-white/20',
              'text-xs font-medium text-white',
              'transition-colors',
            )}
          >
            <Zap className="w-3 h-3" />
            Abonar
          </motion.button>
        </div>
      </div>
      
      {/* Indicador de selección */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1',
              `bg-${config.color}-500`,
            )}
            style={{ originY: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Modal de Inyección de Pago
function PaymentInjectionModal({
  debt,
  isOpen,
  onClose,
  onConfirm,
}: {
  debt: DebtRecord | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number, method: string, notes: PaymentNote[]) => Promise<void>
}) {
  const [amount, setAmount] = useState<number>(0)
  const [method, setMethod] = useState<string>('efectivo')
  const [notes, setNotes] = useState<PaymentNote[]>(
    DENOMINATIONS.map(d => ({ denomination: d, quantity: 0 })),
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  
  // Calcular total de billetes
  const notesTotal = useMemo(() => 
    notes.reduce((sum, note) => sum + (note.denomination * note.quantity), 0),
    [notes],
  )
  
  // Actualizar cantidad de billete
  const updateNoteQuantity = useCallback((denomination: number, delta: number) => {
    setNotes(prev => prev.map(note => 
      note.denomination === denomination
        ? { ...note, quantity: Math.max(0, note.quantity + delta) }
        : note,
    ))
  }, [])
  
  // Sincronizar total de billetes con monto
  React.useEffect(() => {
    if (method === 'efectivo') {
      setAmount(notesTotal)
    }
  }, [notesTotal, method])
  
  // Manejar confirmación
  const handleConfirm = async () => {
    if (!debt || amount <= 0) return
    
    setIsProcessing(true)
    try {
      await onConfirm(amount, method, notes)
      setShowReceipt(true)
    } catch (error) {
      console.error('Error processing payment:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Reset al cerrar
  const handleClose = () => {
    setAmount(0)
    setMethod('efectivo')
    setNotes(DENOMINATIONS.map(d => ({ denomination: d, quantity: 0 })))
    setShowReceipt(false)
    onClose()
  }
  
  if (!debt) return null
  
  const newDebt = debt.totalDebt - amount
  const newPercentage = ((debt.paidAmount + amount) / debt.originalAmount) * 100
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full max-w-2xl max-h-[90vh] overflow-hidden',
              'bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f]',
              'border border-white/10 rounded-3xl',
              'shadow-2xl',
            )}
          >
            {showReceipt ? (
              // Recibo Digital
              <DigitalReceipt 
                debt={debt}
                amount={amount}
                method={method}
                onClose={handleClose}
              />
            ) : (
              <>
                {/* Header */}
                <div className="relative p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10',
                        'border border-emerald-500/30',
                      )}>
                        <Wallet className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Registrar Abono</h2>
                        <p className="text-sm text-white/50">{debt.entityName}</p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClose}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-white/50" />
                    </motion.button>
                  </div>
                  
                  {/* Visualización de deuda en tiempo real */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
                        Deuda Actual
                      </div>
                      <div className="text-2xl font-bold font-mono text-red-400 tabular-nums">
                        ${debt.totalDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="px-4"
                    >
                      <ArrowRight className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    
                    <div className="flex-1 text-right">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
                        Nueva Deuda
                      </div>
                      <motion.div
                        key={newDebt}
                        initial={{ scale: 1.2, color: '#10b981' }}
                        animate={{ scale: 1, color: newDebt > 0 ? '#f59e0b' : '#10b981' }}
                        className="text-2xl font-bold font-mono tabular-nums"
                      >
                        ${Math.max(0, newDebt).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Barra de progreso animada */}
                  <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      initial={{ width: `${(debt.paidAmount / debt.originalAmount) * 100}%` }}
                      animate={{ width: `${Math.min(100, newPercentage)}%` }}
                      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    />
                  </div>
                </div>
                
                {/* Body */}
                <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {/* Método de pago */}
                  <div className="mb-6">
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                      Método de Pago
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon
                        const isActive = method === pm.id
                        return (
                          <motion.button
                            key={pm.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMethod(pm.id)}
                            className={cn(
                              'flex flex-col items-center gap-2 p-3 rounded-xl',
                              'border transition-all duration-200',
                              isActive
                                ? `bg-${pm.color}-500/20 border-${pm.color}-500/50`
                                : 'bg-white/5 border-white/10 hover:border-white/20',
                            )}
                          >
                            <Icon className={cn(
                              'w-5 h-5',
                              isActive ? `text-${pm.color}-400` : 'text-white/50',
                            )} />
                            <span className={cn(
                              'text-xs font-medium',
                              isActive ? 'text-white' : 'text-white/50',
                            )}>
                              {pm.label}
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Selector de billetes (solo para efectivo) */}
                  <AnimatePresence mode="wait">
                    {method === 'efectivo' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                      >
                        <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                          Conteo de Billetes
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {notes.map((note, index) => (
                            <motion.div
                              key={note.denomination}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                'relative p-3 rounded-xl',
                                'bg-gradient-to-br from-white/5 to-white/[0.02]',
                                'border border-white/10',
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-mono text-emerald-400">
                                  ${note.denomination}
                                </span>
                                <motion.span
                                  key={note.quantity}
                                  initial={{ scale: 1.3 }}
                                  animate={{ scale: 1 }}
                                  className="text-lg font-bold font-mono text-white tabular-nums"
                                >
                                  {note.quantity}
                                </motion.span>
                              </div>
                              
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateNoteQuantity(note.denomination, -1)}
                                  className={cn(
                                    'flex-1 py-1 rounded-lg',
                                    'bg-red-500/20 hover:bg-red-500/30',
                                    'text-red-400 transition-colors',
                                  )}
                                >
                                  <Minus className="w-4 h-4 mx-auto" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateNoteQuantity(note.denomination, 1)}
                                  className={cn(
                                    'flex-1 py-1 rounded-lg',
                                    'bg-emerald-500/20 hover:bg-emerald-500/30',
                                    'text-emerald-400 transition-colors',
                                  )}
                                >
                                  <Plus className="w-4 h-4 mx-auto" />
                                </motion.button>
                              </div>
                              
                              {/* Animación de cascada al agregar billetes */}
                              <AnimatePresence>
                                {note.quantity > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white"
                                  >
                                    ${(note.denomination * note.quantity).toLocaleString()}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Total de billetes */}
                        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-400">Total en Efectivo</span>
                            <motion.span
                              key={notesTotal}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              className="text-xl font-bold font-mono text-emerald-400 tabular-nums"
                            >
                              ${notesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </motion.span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Input de monto (para otros métodos) */}
                  {method !== 'efectivo' && (
                    <div className="mb-6">
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                        Monto a Abonar
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                          type="number"
                          value={amount || ''}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          placeholder="0.00"
                          className={cn(
                            'w-full pl-12 pr-4 py-4 rounded-xl',
                            'bg-white/5 border border-white/10',
                            'text-2xl font-mono text-white placeholder:text-white/30',
                            'focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50',
                            'transition-all',
                          )}
                        />
                      </div>
                      
                      {/* Quick amounts */}
                      <div className="flex gap-2 mt-3">
                        {[debt.totalDebt * 0.25, debt.totalDebt * 0.5, debt.totalDebt * 0.75, debt.totalDebt].map((quickAmount, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAmount(quickAmount)}
                            className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 font-mono transition-colors"
                          >
                            {i < 3 ? `${(i + 1) * 25}%` : '100%'}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-white/50">
                      {amount > debt.totalDebt && (
                        <span className="text-amber-400">
                          ⚠️ El monto excede la deuda
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/40 uppercase tracking-wider">
                        Total a Pagar
                      </div>
                      <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                        ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={amount <= 0 || isProcessing}
                    className={cn(
                      'w-full py-4 rounded-xl font-semibold text-lg',
                      'bg-gradient-to-r from-emerald-600 to-emerald-500',
                      'hover:from-emerald-500 hover:to-emerald-400',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'text-white transition-all duration-300',
                      'shadow-lg shadow-emerald-500/25',
                    )}
                  >
                    {isProcessing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-6 h-6 mx-auto border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        Procesar Abono
                      </span>
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Recibo Digital con QR
function DigitalReceipt({
  debt,
  amount,
  method,
  onClose,
}: {
  debt: DebtRecord
  amount: number
  method: string
  onClose: () => void
}) {
  const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}`
  const newBalance = Math.max(0, debt.totalDebt - amount)
  const isPaidInFull = newBalance === 0
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative p-8"
    >
      {/* Confetti para pago total */}
      <AnimatePresence>
        {isPaidInFull && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  y: -20, 
                  x: Math.random() * 400 - 200,
                  rotate: 0,
                }}
                animate={{ 
                  opacity: 0, 
                  y: 300, 
                  rotate: Math.random() * 360,
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                }}
                className={cn(
                  'absolute w-3 h-3 rounded-full',
                  ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'][i % 4],
                )}
                style={{
                  left: '50%',
                  top: 0,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      
      {/* Icono de éxito */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
        className="flex justify-center mb-6"
      >
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10',
          'border-2 border-emerald-500/50',
        )}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {isPaidInFull ? '¡Deuda Liquidada!' : 'Abono Registrado'}
        </h2>
        <p className="text-sm text-white/50">{receiptNumber}</p>
      </motion.div>
      
      {/* Detalles del recibo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          'p-6 rounded-2xl mb-6',
          'bg-gradient-to-br from-white/5 to-white/[0.02]',
          'border border-white/10',
        )}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <span className="text-white/50">Cliente</span>
            <span className="font-semibold text-white">{debt.entityName}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white/50">Concepto</span>
            <span className="text-white">{debt.concept}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white/50">Método</span>
            <span className="text-white capitalize">{method}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white/50">Fecha</span>
            <span className="font-mono text-white">
              {new Date().toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <span className="text-white/50">Monto Abonado</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white/50">Saldo Pendiente</span>
            <span className={cn(
              'text-xl font-bold font-mono tabular-nums',
              isPaidInFull ? 'text-emerald-400' : 'text-amber-400',
            )}>
              ${newBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* QR Code placeholder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center mb-6"
      >
        <div className={cn(
          'w-32 h-32 rounded-xl flex items-center justify-center',
          'bg-white/5 border border-white/10',
        )}>
          <QrCode className="w-20 h-20 text-white/30" />
        </div>
      </motion.div>
      
      {/* Acciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded-xl',
            'bg-white/5 hover:bg-white/10 border border-white/10',
            'transition-colors',
          )}
        >
          <Download className="w-5 h-5 text-white/50" />
          <span className="text-xs text-white/70">Descargar</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded-xl',
            'bg-white/5 hover:bg-white/10 border border-white/10',
            'transition-colors',
          )}
        >
          <Share2 className="w-5 h-5 text-white/50" />
          <span className="text-xs text-white/70">Compartir</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded-xl',
            'bg-white/5 hover:bg-white/10 border border-white/10',
            'transition-colors',
          )}
        >
          <Printer className="w-5 h-5 text-white/50" />
          <span className="text-xs text-white/70">Imprimir</span>
        </motion.button>
      </motion.div>
      
      {/* Botón cerrar */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        className={cn(
          'w-full py-4 rounded-xl font-semibold',
          'bg-white/10 hover:bg-white/20',
          'text-white transition-all',
        )}
      >
        Cerrar
      </motion.button>
    </motion.div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function SettlementTerminal({
  debts,
  clients,
  distributors,
  onPayment,
  onGenerateReceipt,
  className,
}: SettlementTerminalProps) {
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DebtRecord['status'] | 'all'>('all')
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'name'>('amount')
  
  // Filtrar y ordenar deudas
  const filteredDebts = useMemo(() => {
    let result = debts
    
    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(d => 
        d.entityName.toLowerCase().includes(query) ||
        d.concept.toLowerCase().includes(query),
      )
    }
    
    // Filtro por status
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter)
    }
    
    // Ordenar
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.totalDebt - a.totalDebt
        case 'date':
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        case 'name':
          return a.entityName.localeCompare(b.entityName)
        default:
          return 0
      }
    })
    
    return result
  }, [debts, searchQuery, statusFilter, sortBy])
  
  // Estadísticas
  const stats = useMemo(() => {
    const total = debts.reduce((sum, d) => sum + d.totalDebt, 0)
    const overdue = debts.filter(d => d.status === 'overdue' || d.status === 'critical').length
    const critical = debts.filter(d => d.status === 'critical').length
    const avgDays = debts.length > 0 
      ? debts.reduce((sum, d) => sum + d.daysPastDue, 0) / debts.length
      : 0
    
    return { total, overdue, critical, avgDays }
  }, [debts])
  
  // Manejar pago
  const handlePayment = async (amount: number, method: string, notes: PaymentNote[]) => {
    if (!selectedDebt) return
    await onPayment(selectedDebt.id, amount, method, notes)
  }
  
  return (
    <div className={cn(
      'relative min-h-screen',
      'bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f]',
      className,
    )}>
      {/* Header con estadísticas */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-purple-500/20 to-purple-600/10',
                'border border-purple-500/30',
              )}>
                <Receipt className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Terminal de Abonos</h1>
                <p className="text-sm text-white/50">Gestión de cobranza y pagos</p>
              </div>
            </div>
            
            {/* Stats rápidas */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Total Pendiente
                </div>
                <div className="text-xl font-bold font-mono text-red-400 tabular-nums">
                  ${stats.total.toLocaleString('es-MX')}
                </div>
              </div>
              
              <div className="w-px h-10 bg-white/10" />
              
              <div className="text-center">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Vencidos
                </div>
                <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                  {stats.overdue}
                </div>
              </div>
              
              <div className="w-px h-10 bg-white/10" />
              
              <div className="text-center">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Críticos
                </div>
                <div className="text-xl font-bold font-mono text-red-400 tabular-nums">
                  {stats.critical}
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de búsqueda y filtros */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente o concepto..."
                className={cn(
                  'w-full pl-12 pr-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white placeholder:text-white/30',
                  'focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50',
                  'transition-all',
                )}
              />
            </div>
            
            {/* Filtros de status */}
            <div className="flex items-center gap-2">
              {(['all', 'current', 'overdue', 'critical', 'paid'] as const).map((status) => (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium',
                    'border transition-all',
                    statusFilter === status
                      ? status === 'all'
                        ? 'bg-white/20 border-white/30 text-white'
                        : `bg-${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 'white'}-500/20 border-${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 'white'}-500/30 text-${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 'white'}-400`
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
                  )}
                >
                  {status === 'all' ? 'Todos' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                </motion.button>
              ))}
            </div>
            
            {/* Ordenar */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <SortAsc className="w-4 h-4 text-white/50" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-sm text-white/70 outline-none"
              >
                <option value="amount" className="bg-[#1a1a2e]">Por Monto</option>
                <option value="date" className="bg-[#1a1a2e]">Por Fecha</option>
                <option value="name" className="bg-[#1a1a2e]">Por Nombre</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Grid de deudas */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                isSelected={selectedDebt?.id === debt.id}
                onSelect={() => setSelectedDebt(debt)}
                onQuickPay={() => {
                  setSelectedDebt(debt)
                  setIsPaymentModalOpen(true)
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
        
        {/* Empty state */}
        {filteredDebts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mb-4',
              'bg-white/5 border border-white/10',
            )}>
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Sin deudas pendientes
            </h3>
            <p className="text-sm text-white/50">
              {searchQuery || statusFilter !== 'all' 
                ? 'No se encontraron resultados con los filtros actuales'
                : 'Todas las cuentas están al corriente'
              }
            </p>
          </motion.div>
        )}
      </div>
      
      {/* Modal de pago */}
      <PaymentInjectionModal
        debt={selectedDebt}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setSelectedDebt(null)
        }}
        onConfirm={handlePayment}
      />
      
      {/* FAB para nuevo cobro */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'fixed bottom-8 right-8 w-16 h-16 rounded-full',
          'bg-gradient-to-br from-purple-600 to-purple-500',
          'shadow-lg shadow-purple-500/30',
          'flex items-center justify-center',
          'text-white',
        )}
      >
        <Plus className="w-7 h-7" />
      </motion.button>
    </div>
  )
}
