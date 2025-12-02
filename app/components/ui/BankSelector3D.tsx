'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, DollarSign, TrendingUp, TrendingDown, Lock } from 'lucide-react'
import type { BancoId } from '@/app/types'
import { logger } from '@/app/lib/utils/logger'

interface BankInfo {
  id: BancoId
  nombre: string
  capitalActual: number
  color: string
  icon: React.ReactNode
  descripcion: string
}

interface BankSelector3DProps {
  banks: BankInfo[]
  selectedBankId?: BancoId
  onBankSelect: (bankId: BancoId) => void
  requiredAmount?: number
  className?: string
  label?: string
}

export function BankSelector3D({
  banks,
  selectedBankId,
  onBankSelect,
  requiredAmount = 0,
  className = '',
  label = 'Seleccionar Banco',
}: BankSelector3DProps) {
  const [hoveredBankId, setHoveredBankId] = useState<BancoId | null>(null)

  const selectedBank = banks.find(b => b.id === selectedBankId)

  const handleBankSelect = (bankId: BancoId) => {
    logger.info('Bank selected', { context: 'BankSelector3D', data: { bankId } })
    onBankSelect(bankId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const canAfford = (bank: BankInfo) => bank.capitalActual >= requiredAmount

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-white/90">
          {label}
        </label>
      )}

      {/* Selected Bank Display */}
      {selectedBank && (
        <motion.div
          layout
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-cyan-500/50"
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${selectedBank.color}30` }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              {selectedBank.icon}
            </motion.div>
            
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{selectedBank.nombre}</p>
              <p className="text-white/60 text-sm">{selectedBank.descripcion}</p>
            </div>

            <div className="text-right">
              <p className="text-white/60 text-xs mb-1">Capital Disponible</p>
              <p className="text-white font-bold text-xl">
                {formatCurrency(selectedBank.capitalActual)}
              </p>
            </div>
          </div>

          {/* Indicator si puede cubrir el monto */}
          {requiredAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              {canAfford(selectedBank) ? (
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Fondos suficientes ({formatCurrency(requiredAmount)})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Fondos insuficientes (requiere {formatCurrency(requiredAmount)})
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {banks.map((bank, index) => {
            const isSelected = selectedBankId === bank.id
            const isHovered = hoveredBankId === bank.id
            const hasEnoughFunds = canAfford(bank)
            const isDisabled = requiredAmount > 0 && !hasEnoughFunds

            return (
              <motion.button
                key={bank.id}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: isDisabled ? 1 : 1.03, y: isDisabled ? 0 : -4 }}
                whileTap={{ scale: isDisabled ? 1 : 0.97 }}
                onClick={() => !isDisabled && handleBankSelect(bank.id)}
                onMouseEnter={() => setHoveredBankId(bank.id)}
                onMouseLeave={() => setHoveredBankId(null)}
                disabled={isDisabled}
                className={`
                  relative p-5 rounded-2xl backdrop-blur-xl
                  transition-all duration-300
                  ${isDisabled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'cursor-pointer'
                  }
                  ${isSelected
                    ? 'border-2 border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-purple-500/20'
                    : 'border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5 hover:border-cyan-500/50'
                  }
                `}
              >
                {/* Lock icon si no tiene fondos */}
                {isDisabled && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-red-400" />
                  </div>
                )}

                {/* Icon */}
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${bank.color}30` }}
                  animate={{
                    scale: isSelected || isHovered ? 1.1 : 1,
                    rotate: isSelected ? 360 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {bank.icon}
                </motion.div>

                {/* Bank Name */}
                <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                  {bank.nombre}
                </h3>

                {/* Description */}
                <p className="text-white/60 text-xs mb-3 line-clamp-2">
                  {bank.descripcion}
                </p>

                {/* Capital */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Capital</span>
                    <DollarSign className="w-3 h-3 text-white/40" />
                  </div>
                  <p className={`font-bold text-lg ${
                    bank.capitalActual > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(bank.capitalActual)}
                  </p>
                </div>

                {/* Progress bar si hay monto requerido */}
                {requiredAmount > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          backgroundColor: hasEnoughFunds ? '#10b981' : '#ef4444',
                        }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((bank.capitalActual / requiredAmount) * 100, 100)}%`,
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1 text-center">
                      {hasEnoughFunds ? 'Suficiente' : 'Insuficiente'}
                    </p>
                  </div>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="bank-selection"
                    className="absolute inset-0 rounded-2xl border-2 border-cyan-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                {/* Glow effect */}
                {(isHovered || isSelected) && !isDisabled && (
                  <motion.div
                    className="absolute inset-0 -z-10 rounded-2xl blur-xl"
                    style={{ backgroundColor: bank.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Summary footer */}
      <div className="p-4 rounded-xl backdrop-blur-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white/60 text-xs mb-1">Capital Total Disponible</p>
            <p className="text-white font-bold text-xl">
              {formatCurrency(banks.reduce((acc, b) => acc + b.capitalActual, 0))}
            </p>
          </div>
          
          {requiredAmount > 0 && (
            <div className="text-right">
              <p className="text-white/60 text-xs mb-1">Monto Requerido</p>
              <p className="text-cyan-400 font-bold text-xl">
                {formatCurrency(requiredAmount)}
              </p>
            </div>
          )}

          <div className="text-right">
            <p className="text-white/60 text-xs mb-1">Bancos Disponibles</p>
            <p className="text-white font-bold text-xl">
              {banks.filter(b => canAfford(b)).length} / {banks.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
