'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🏦 CHRONOS INFINITY - BANK ORBS GALLERY
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Galería horizontal de los 7 orbs bancarios con:
 * - Scroll horizontal suave
 * - Hover effects premium
 * - Información de capital en tiempo real
 * - Animación de entrada staggered
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { memo, useRef, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import BankOrb, { BankId, BANK_CONFIG } from '@/app/components/3d/BankOrbs'
import { staggerContainerVariants, fadeVariants, slideUpVariants } from '@/app/lib/motion/easings'
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════

interface BankData {
  id: BankId
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
}

interface BankOrbsGalleryProps {
  banks?: BankData[]
  onBankClick?: (bankId: BankId) => void
  title?: string
  subtitle?: string
}

// ════════════════════════════════════════════════════════════════════════════════════════
// DATOS DE EJEMPLO (Se reemplazarán con datos reales de Firestore/Turso)
// ════════════════════════════════════════════════════════════════════════════════════════

const EXAMPLE_BANKS: BankData[] = [
  { id: 'boveda_monte', capitalActual: 1250000, historicoIngresos: 3500000, historicoGastos: 2250000 },
  { id: 'boveda_usa', capitalActual: 85000, historicoIngresos: 150000, historicoGastos: 65000 },
  { id: 'utilidades', capitalActual: 420000, historicoIngresos: 980000, historicoGastos: 560000 },
  { id: 'fletes', capitalActual: 75000, historicoIngresos: 200000, historicoGastos: 125000 },
  { id: 'azteca', capitalActual: 180000, historicoIngresos: 450000, historicoGastos: 270000 },
  { id: 'leftie', capitalActual: 95000, historicoIngresos: 280000, historicoGastos: 185000 },
  { id: 'profit', capitalActual: 550000, historicoIngresos: 1200000, historicoGastos: 650000 },
]

// ════════════════════════════════════════════════════════════════════════════════════════
// BANK CARD
// ════════════════════════════════════════════════════════════════════════════════════════

const BankCard = memo(function BankCard({
  bank,
  index,
  onClick,
}: {
  bank: BankData
  index: number
  onClick?: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const config = BANK_CONFIG[bank.id]
  
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }, [])
  
  // Calcular porcentaje de rendimiento
  const rendimiento = bank.historicoIngresos > 0 
    ? ((bank.capitalActual / bank.historicoIngresos) * 100).toFixed(1)
    : '0'
  
  return (
    <motion.div
      className="relative flex-shrink-0 w-64 p-6 rounded-3xl cursor-pointer overflow-hidden"
      style={{
        background: INFINITY_COLORS.glassBg,
        border: `1px solid ${isHovered ? config.primaryColor + '50' : INFINITY_COLORS.glassBorder}`,
        boxShadow: isHovered 
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 40px ${config.primaryColor}30`
          : `0 10px 30px rgba(0,0,0,0.3)`,
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Orb centrado */}
      <div className="flex justify-center mb-4">
        <BankOrb bankId={bank.id} size="lg" />
      </div>
      
      {/* Info */}
      <div className="text-center">
        <h3 
          className="text-lg font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
        >
          {config.name}
        </h3>
        <p className="text-xs text-white/40 mt-1">{config.description}</p>
      </div>
      
      {/* Capital */}
      <div className="mt-4 p-3 rounded-xl bg-white/5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Capital Actual</span>
          <span className="text-sm font-semibold text-white">{formatCurrency(bank.capitalActual)}</span>
        </div>
      </div>
      
      {/* Stats mini */}
      <motion.div 
        className="mt-3 grid grid-cols-2 gap-2"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <p className="text-[10px] text-white/30">Ingresos</p>
          <p className="text-xs text-green-400">{formatCurrency(bank.historicoIngresos)}</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <p className="text-[10px] text-white/30">Gastos</p>
          <p className="text-xs text-red-400">{formatCurrency(bank.historicoGastos)}</p>
        </div>
      </motion.div>
      
      {/* Glow de fondo */}
      <div 
        className="absolute inset-0 -z-10 opacity-20 blur-3xl transition-opacity duration-500"
        style={{ 
          background: `radial-gradient(circle at center, ${config.primaryColor}, transparent)`,
          opacity: isHovered ? 0.3 : 0.1,
        }}
      />
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════

function BankOrbsGallery({
  banks = EXAMPLE_BANKS,
  onBankClick,
  title = 'Bóvedas & Bancos',
  subtitle = 'Sistema financiero CHRONOS',
}: BankOrbsGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  
  // Calcular totales
  const totals = banks.reduce(
    (acc, bank) => ({
      capital: acc.capital + bank.capitalActual,
      ingresos: acc.ingresos + bank.historicoIngresos,
      gastos: acc.gastos + bank.historicoGastos,
    }),
    { capital: 0, ingresos: 0, gastos: 0 }
  )
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  return (
    <section ref={containerRef} className="py-12">
      {/* Header */}
      <motion.div
        className="mb-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: INFINITY_GRADIENTS.textShine }}
            >
              {title}
            </h2>
            <p className="text-white/40 mt-1">{subtitle}</p>
          </div>
          
          {/* Totales */}
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-white/30">Capital Total</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totals.capital)}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-white/30">Ingresos Históricos</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(totals.ingresos)}</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Galería horizontal */}
      <div className="relative">
        {/* Fade izquierdo */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        
        {/* Scroll container */}
        <div className="overflow-x-auto scrollbar-hide px-4 pb-4">
          <motion.div 
            className="flex gap-6"
            variants={staggerContainerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {banks.map((bank, index) => (
              <BankCard
                key={bank.id}
                bank={bank}
                index={index}
                onClick={() => onBankClick?.(bank.id)}
              />
            ))}
          </motion.div>
        </div>
        
        {/* Fade derecho */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  )
}

export default memo(BankOrbsGallery)
