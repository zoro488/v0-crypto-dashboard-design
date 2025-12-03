'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  Landmark, 
  DollarSign, 
  Truck, 
  PiggyBank,
  Building2,
  Receipt,
  FileText,
  Calendar,
  Tag,
  ArrowDownCircle
} from 'lucide-react'
import { ObsidianModal } from '@/app/components/ui-premium/ObsidianModal'
import { MetalCardSelector } from '@/app/components/ui-premium/MetalCardSelector'
import { HeroInput } from '@/app/components/ui-premium/HeroInput'
import { ObsidianButton } from '@/app/components/ui-premium/ObsidianButton'
import type { BancoId } from '@/app/types'

interface RegistrarGastoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: GastoFormData) => void
  loading?: boolean
}

interface GastoFormData {
  bancoId: BancoId
  monto: number
  concepto: string
  categoria: string
  fecha: string
  notas?: string
}

const BANCOS_OPTIONS = [
  { 
    id: 'boveda_monte' as BancoId, 
    label: 'Bóveda Monte', 
    sublabel: 'Principal',
    icon: <Landmark className="w-5 h-5" />,
    color: 'sapphire' as const
  },
  { 
    id: 'boveda_usa' as BancoId, 
    label: 'Bóveda USA', 
    sublabel: 'Internacional',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'emerald' as const
  },
  { 
    id: 'profit' as BancoId, 
    label: 'Profit', 
    sublabel: 'Ganancias',
    icon: <PiggyBank className="w-5 h-5" />,
    color: 'gold' as const
  },
  { 
    id: 'leftie' as BancoId, 
    label: 'Leftie', 
    sublabel: 'Operaciones',
    icon: <Building2 className="w-5 h-5" />,
    color: 'amethyst' as const
  },
  { 
    id: 'azteca' as BancoId, 
    label: 'Azteca', 
    sublabel: 'Nacional',
    icon: <Wallet className="w-5 h-5" />,
    color: 'ruby' as const
  },
  { 
    id: 'flete_sur' as BancoId, 
    label: 'Flete Sur', 
    sublabel: 'Logística',
    icon: <Truck className="w-5 h-5" />,
    color: 'cyan' as const
  },
]

const CATEGORIAS = [
  { id: 'operativo', label: 'Operativo', color: 'sapphire' as const },
  { id: 'logistica', label: 'Logística', color: 'cyan' as const },
  { id: 'personal', label: 'Personal', color: 'amethyst' as const },
  { id: 'servicios', label: 'Servicios', color: 'emerald' as const },
  { id: 'impuestos', label: 'Impuestos', color: 'ruby' as const },
  { id: 'otros', label: 'Otros', color: 'gold' as const },
]

/**
 * RegistrarGastoModal - Modal Premium "Bóveda de Cristal"
 * 
 * Experiencia ultra-premium para registrar gastos:
 * - Entrada dramática con desenfoque masivo
 * - Selector de bancos como tarjetas metálicas
 * - Input de monto gigante monospaced
 * - Botón Magma para acción de gasto
 */
export function RegistrarGastoModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: RegistrarGastoModalProps) {
  const [bancoId, setBancoId] = useState<string | null>(null)
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')
  const [step, setStep] = useState(1)
  
  const isValid = useMemo(() => {
    return bancoId && parseFloat(monto) > 0 && concepto.trim() && categoria
  }, [bancoId, monto, concepto, categoria])
  
  const handleSubmit = useCallback(() => {
    if (!isValid || !bancoId || !categoria) return
    
    onSubmit({
      bancoId: bancoId as BancoId,
      monto: parseFloat(monto),
      concepto: concepto.trim(),
      categoria,
      fecha,
      notas: notas.trim() || undefined
    })
  }, [isValid, bancoId, monto, concepto, categoria, fecha, notas, onSubmit])
  
  const handleClose = useCallback(() => {
    setBancoId(null)
    setMonto('')
    setConcepto('')
    setCategoria(null)
    setNotas('')
    setStep(1)
    onClose()
  }, [onClose])
  
  const nextStep = useCallback(() => {
    if (step === 1 && bancoId) setStep(2)
    else if (step === 2 && parseFloat(monto) > 0) setStep(3)
  }, [step, bancoId, monto])
  
  const prevStep = useCallback(() => {
    if (step > 1) setStep(step - 1)
  }, [step])
  
  return (
    <ObsidianModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Gasto"
      subtitle="Salida de capital desde banco de origen"
      size="lg"
    >
      <div className="space-y-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: s * 0.1 }}
            >
              <motion.div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  text-sm font-semibold transition-colors duration-300
                `}
                animate={{
                  background: s === step 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : s < step 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: s === step 
                    ? '#ef4444' 
                    : s < step 
                    ? '#10b981' 
                    : 'rgba(255, 255, 255, 0.4)',
                  boxShadow: s === step 
                    ? '0 0 20px rgba(239, 68, 68, 0.3)' 
                    : 'none'
                }}
              >
                {s < step ? '✓' : s}
              </motion.div>
              {s < 3 && (
                <motion.div
                  className="w-12 h-0.5 rounded-full"
                  animate={{
                    background: s < step 
                      ? 'rgba(16, 185, 129, 0.5)' 
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-white mb-1">
                  Selecciona el Banco de Origen
                </h3>
                <p className="text-sm text-white/40">
                  El gasto se deducirá de esta cuenta
                </p>
              </div>
              
              <MetalCardSelector
                options={BANCOS_OPTIONS}
                value={bancoId}
                onChange={setBancoId}
                columns={2}
              />
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-white mb-1">
                  Ingresa el Monto
                </h3>
                <p className="text-sm text-white/40">
                  ¿Cuánto dinero sale?
                </p>
              </div>
              
              {/* Icono de salida animado */}
              <motion.div
                className="flex justify-center"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)'
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 40px rgba(239, 68, 68, 0.2)',
                      '0 0 60px rgba(239, 68, 68, 0.3)',
                      '0 0 40px rgba(239, 68, 68, 0.2)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowDownCircle className="w-10 h-10 text-red-400" />
                </motion.div>
              </motion.div>
              
              {/* Input Gigante */}
              <HeroInput
                value={monto}
                onChange={setMonto}
                placeholder="0"
                prefix="$"
                variant="ruby"
                type="currency"
                autoFocus
              />
              
              {/* Banco seleccionado */}
              <div className="flex justify-center">
                <motion.div
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  Desde: <span className="text-white font-medium">
                    {BANCOS_OPTIONS.find(b => b.id === bancoId)?.label}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-white mb-1">
                  Detalles del Gasto
                </h3>
                <p className="text-sm text-white/40">
                  Categoriza y describe el gasto
                </p>
              </div>
              
              {/* Resumen visual */}
              <motion.div
                className="p-4 rounded-2xl flex items-center justify-between"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    <ArrowDownCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs">Gasto de</p>
                    <p className="text-white font-medium">
                      {BANCOS_OPTIONS.find(b => b.id === bancoId)?.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p 
                    className="text-2xl font-bold"
                    style={{ 
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#ef4444',
                      textShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    -${parseFloat(monto || '0').toLocaleString()}
                  </p>
                </div>
              </motion.div>
              
              {/* Categoría */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <Tag className="w-4 h-4" />
                  Categoría
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIAS.map((cat) => (
                    <motion.button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoria(cat.id)}
                      className={`
                        px-4 py-3 rounded-xl text-sm font-medium
                        transition-all duration-200
                      `}
                      style={{
                        background: categoria === cat.id 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(255, 255, 255, 0.03)',
                        color: categoria === cat.id 
                          ? '#ffffff' 
                          : 'rgba(255, 255, 255, 0.5)',
                        border: categoria === cat.id 
                          ? '1px solid rgba(255, 255, 255, 0.2)' 
                          : '1px solid transparent'
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {cat.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Concepto */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <Receipt className="w-4 h-4" />
                  Concepto
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Pago a proveedor, Gasolina, Servicios..."
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-white/5 border border-white/10
                    text-white placeholder-white/30
                    outline-none focus:border-white/20
                    transition-colors duration-200
                  "
                />
              </div>
              
              {/* Fecha */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <Calendar className="w-4 h-4" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-white/5 border border-white/10
                    text-white
                    outline-none focus:border-white/20
                    transition-colors duration-200
                  "
                />
              </div>
              
              {/* Notas */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <FileText className="w-4 h-4" />
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Información adicional..."
                  rows={2}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-white/5 border border-white/10
                    text-white placeholder-white/30
                    outline-none focus:border-white/20
                    transition-colors duration-200 resize-none
                  "
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Divider */}
        <div 
          className="h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
          }}
        />
        
        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          {step > 1 ? (
            <ObsidianButton
              variant="ghost"
              onClick={prevStep}
            >
              Atrás
            </ObsidianButton>
          ) : (
            <ObsidianButton
              variant="ghost"
              onClick={handleClose}
            >
              Cancelar
            </ObsidianButton>
          )}
          
          {step < 3 ? (
            <ObsidianButton
              variant="sapphire"
              onClick={nextStep}
              disabled={
                (step === 1 && !bancoId) ||
                (step === 2 && !parseFloat(monto))
              }
            >
              Continuar
            </ObsidianButton>
          ) : (
            <ObsidianButton
              variant="magma"
              onClick={handleSubmit}
              loading={loading}
              disabled={!isValid}
              icon={<ArrowDownCircle className="w-5 h-5" />}
            >
              Registrar Gasto
            </ObsidianButton>
          )}
        </div>
      </div>
    </ObsidianModal>
  )
}

export default RegistrarGastoModal
