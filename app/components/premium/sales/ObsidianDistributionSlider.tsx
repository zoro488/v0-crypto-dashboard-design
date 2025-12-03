'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react'
import { cn } from '@/app/lib/utils'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💎 OBSIDIAN DISTRIBUTION SLIDER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Control de distribución bancaria con física de fluidos y validación visual.
 * Sistema de "vasos comunicantes" donde al ajustar una barra, las demás 
 * se redistribuyen automáticamente manteniendo el 100%.
 * 
 * Bancos: Bóveda Monte (Azul), Fletes (Naranja), Utilidades (Verde)
 */

export interface DistributionState {
  bovedaMonte: number
  fletes: number
  utilidades: number
}

interface ObsidianDistributionSliderProps {
  totalAmount: number
  initialValues?: DistributionState
  onChange: (dist: DistributionState) => void
  disabled?: boolean
}

const DEFAULT_VALUES: DistributionState = {
  bovedaMonte: 63, // Basado en precioCompra típico
  fletes: 5,
  utilidades: 32,
}

export default function ObsidianDistributionSlider({ 
  totalAmount, 
  initialValues = DEFAULT_VALUES,
  onChange,
  disabled = false
}: ObsidianDistributionSliderProps) {
  const [values, setValues] = useState<DistributionState>(initialValues)
  const [locked, setLocked] = useState<Record<keyof DistributionState, boolean>>({
    bovedaMonte: false,
    fletes: false,
    utilidades: false
  })
  const [activeSlider, setActiveSlider] = useState<keyof DistributionState | null>(null)

  // Recalcular montos monetarios
  const amounts = {
    bovedaMonte: totalAmount * (values.bovedaMonte / 100),
    fletes: totalAmount * (values.fletes / 100),
    utilidades: totalAmount * (values.utilidades / 100)
  }

  const totalPercent = Object.values(values).reduce((a, b) => a + b, 0)
  const isValid = Math.abs(totalPercent - 100) < 0.5

  // Sistema de vasos comunicantes - redistribuir automáticamente
  const handleSliderChange = useCallback((key: keyof DistributionState, newValue: number) => {
    if (locked[key] || disabled) return

    setActiveSlider(key)

    setValues(prev => {
      const unlockedKeys = (Object.keys(prev) as Array<keyof DistributionState>)
        .filter(k => k !== key && !locked[k])
      
      if (unlockedKeys.length === 0) {
        // Si todo está bloqueado excepto el actual, solo cambiar este
        return { ...prev, [key]: Math.max(0, Math.min(100, newValue)) }
      }

      const diff = newValue - prev[key]
      const adjustmentPerSlider = diff / unlockedKeys.length

      const newState = { ...prev, [key]: newValue }
      
      unlockedKeys.forEach(k => {
        newState[k] = Math.max(0, Math.min(100, prev[k] - adjustmentPerSlider))
      })

      // Normalizar para que sume exactamente 100
      const currentTotal = Object.values(newState).reduce((a, b) => a + b, 0)
      if (Math.abs(currentTotal - 100) > 0.1) {
        const scale = 100 / currentTotal
        Object.keys(newState).forEach(k => {
          newState[k as keyof DistributionState] *= scale
        })
      }

      return newState
    })
  }, [locked, disabled])

  const handleSliderEnd = useCallback(() => {
    setActiveSlider(null)
  }, [])

  // Reset a valores por defecto
  const handleReset = useCallback(() => {
    setValues(DEFAULT_VALUES)
    setLocked({ bovedaMonte: false, fletes: false, utilidades: false })
  }, [])

  useEffect(() => {
    onChange(values)
  }, [values, onChange])

  return (
    <div className="w-full p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Fondo ambiental que cambia según validez */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isValid 
            ? 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.05) 0%, transparent 70%)'
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-white font-medium tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Distribución Bancaria
        </h3>
        
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <RefreshCcw size={14} />
          </motion.button>
          
          <motion.div 
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-mono border transition-all flex items-center gap-2",
              isValid 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                : "border-red-500/30 bg-red-500/10 text-red-400"
            )}
            animate={{ scale: isValid ? 1 : [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            {isValid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {totalPercent.toFixed(1)}%
          </motion.div>
        </div>
      </div>

      {/* Sliders de Bancos */}
      <div className="space-y-6 relative z-10">
        <BankSlider 
          label="Bóveda Monte" 
          sublabel="Capital Base"
          color="blue" 
          percent={values.bovedaMonte} 
          amount={amounts.bovedaMonte}
          isLocked={locked.bovedaMonte}
          isActive={activeSlider === 'bovedaMonte'}
          disabled={disabled}
          onToggleLock={() => setLocked(p => ({...p, bovedaMonte: !p.bovedaMonte}))}
          onChange={(v) => handleSliderChange('bovedaMonte', v)}
          onEnd={handleSliderEnd}
        />
        <BankSlider 
          label="Fletes" 
          sublabel="Transporte"
          color="orange" 
          percent={values.fletes} 
          amount={amounts.fletes}
          isLocked={locked.fletes}
          isActive={activeSlider === 'fletes'}
          disabled={disabled}
          onToggleLock={() => setLocked(p => ({...p, fletes: !p.fletes}))}
          onChange={(v) => handleSliderChange('fletes', v)}
          onEnd={handleSliderEnd}
        />
        <BankSlider 
          label="Utilidades" 
          sublabel="Ganancia Neta"
          color="green" 
          percent={values.utilidades} 
          amount={amounts.utilidades}
          isLocked={locked.utilidades}
          isActive={activeSlider === 'utilidades'}
          disabled={disabled}
          onToggleLock={() => setLocked(p => ({...p, utilidades: !p.utilidades}))}
          onChange={(v) => handleSliderChange('utilidades', v)}
          onEnd={handleSliderEnd}
        />
      </div>

      {/* Gráfico Donut Mini */}
      <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
        <DonutPreview values={values} amounts={amounts} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BANK SLIDER - Barra de Energía Individual
// ═══════════════════════════════════════════════════════════════════════════

interface BankSliderProps {
  label: string
  sublabel: string
  color: 'blue' | 'orange' | 'green'
  percent: number
  amount: number
  isLocked: boolean
  isActive: boolean
  disabled: boolean
  onToggleLock: () => void
  onChange: (value: number) => void
  onEnd: () => void
}

function BankSlider({ 
  label, 
  sublabel,
  color, 
  percent, 
  amount, 
  isLocked, 
  isActive,
  disabled,
  onToggleLock, 
  onChange,
  onEnd
}: BankSliderProps) {
  const gradients: Record<string, string> = {
    blue: "from-blue-600 via-indigo-600 to-blue-500",
    orange: "from-orange-500 via-amber-500 to-orange-400",
    green: "from-emerald-500 via-teal-500 to-emerald-400"
  }

  const glowColors: Record<string, string> = {
    blue: "rgba(59, 130, 246, 0.5)",
    orange: "rgba(249, 115, 22, 0.5)",
    green: "rgba(16, 185, 129, 0.5)"
  }

  const textColors: Record<string, string> = {
    blue: "text-blue-400",
    orange: "text-orange-400",
    green: "text-emerald-400"
  }

  const dotColors: Record<string, string> = {
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    green: "bg-emerald-500"
  }

  return (
    <motion.div 
      className={cn(
        "space-y-3 group transition-opacity",
        disabled && "opacity-50 pointer-events-none"
      )}
      animate={{ scale: isActive ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {/* Header del slider */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <motion.button 
            onClick={onToggleLock} 
            className={cn(
              "p-1.5 rounded-lg transition-all",
              isLocked 
                ? "bg-white/10 text-white/60" 
                : "text-white/20 hover:text-white/50 hover:bg-white/5"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </motion.button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[color])} />
              <span className={cn("text-sm font-medium", textColors[color])}>{label}</span>
            </div>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">{sublabel}</span>
          </div>
        </div>
        
        <div className="text-right">
          <motion.span 
            className="text-xs text-white/40 block font-mono"
            key={percent}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {percent.toFixed(1)}%
          </motion.span>
          <motion.span 
            className="text-lg font-bold text-white font-mono tracking-tight"
            key={amount}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
        </div>
      </div>

      {/* Barra de Energía */}
      <div 
        className={cn(
          "relative h-5 bg-white/5 rounded-full overflow-hidden",
          isLocked && "opacity-60"
        )}
        style={{
          boxShadow: isActive ? `0 0 20px ${glowColors[color]}` : 'none'
        }}
      >
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="0.5"
          value={percent}
          disabled={isLocked || disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseUp={onEnd}
          onTouchEnd={onEnd}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {/* Barra animada */}
        <motion.div 
          className={cn("h-full absolute left-0 top-0 bg-gradient-to-r z-10 rounded-full", gradients[color])}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Brillo interno */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
          
          {/* Partículas de energía cuando está activo */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ boxShadow: `0 0 10px white, 0 0 20px ${glowColors[color]}` }}
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Grid lines sutiles */}
        <div className="absolute inset-0 w-full h-full z-0 flex justify-between px-2 items-center">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-[1px] h-2 bg-white/10 rounded-full" />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DONUT PREVIEW - Gráfico de Anillo en Tiempo Real
// ═══════════════════════════════════════════════════════════════════════════

interface DonutPreviewProps {
  values: DistributionState
  amounts: DistributionState
}

function DonutPreview({ values, amounts }: DonutPreviewProps) {
  const size = 80
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const segments = [
    { key: 'bovedaMonte', color: '#3b82f6', label: 'Monte', value: values.bovedaMonte, amount: amounts.bovedaMonte },
    { key: 'fletes', color: '#f97316', label: 'Fletes', value: values.fletes, amount: amounts.fletes },
    { key: 'utilidades', color: '#10b981', label: 'Util.', value: values.utilidades, amount: amounts.utilidades },
  ]

  let offset = 0

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Donut Chart */}
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((seg, i) => {
            const segmentLength = (seg.value / 100) * circumference
            const dashArray = `${segmentLength} ${circumference - segmentLength}`
            const currentOffset = offset
            offset += segmentLength

            return (
              <motion.circle
                key={seg.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
                initial={false}
                animate={{
                  strokeDasharray: dashArray,
                  strokeDashoffset: -currentOffset,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 3px ${seg.color})` }}
              />
            )
          })}
        </svg>
        
        {/* Centro con total */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono text-white/60">100%</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex-1 grid grid-cols-3 gap-2">
        {segments.map((seg) => (
          <div key={seg.key} className="text-center">
            <div 
              className="w-2 h-2 rounded-full mx-auto mb-1"
              style={{ backgroundColor: seg.color }}
            />
            <div className="text-[10px] text-white/40">{seg.label}</div>
            <div className="text-xs font-mono text-white/80">{seg.value.toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
