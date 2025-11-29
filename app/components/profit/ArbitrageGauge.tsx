'use client'

/**
 * ArbitrageGauge - Semáforo Visual de Arbitraje
 * 
 * Indicador visual que muestra la dirección óptima de venta:
 * - FÍSICO: Vender en ventanilla
 * - CRYPTO: Convertir a USDT y vender P2P
 * - HOLD: Mantener posición
 */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Bitcoin, 
  Pause,
  ArrowRight,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ============================================
// TIPOS
// ============================================

interface ArbitrageGaugeProps {
  cryptoPremium: number;
  physicalPremium: number;
  bestChannel: 'crypto' | 'physical' | 'hold';
  showDetails?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ArbitrageGauge: React.FC<ArbitrageGaugeProps> = ({
  cryptoPremium,
  physicalPremium,
  bestChannel,
  showDetails = true,
}) => {
  // Calcular el ángulo de la aguja (-45° a 45°)
  // Negativo = físico, Positivo = crypto, 0 = neutral
  const needleAngle = useMemo(() => {
    const maxPremium = 0.50 // 50 centavos máximo para escala
    const normalizedCrypto = Math.min(cryptoPremium / maxPremium, 1)
    const normalizedPhysical = Math.min(physicalPremium / maxPremium, 1)
    
    // Si crypto es mejor, inclinar a la derecha (positivo)
    // Si físico es mejor, inclinar a la izquierda (negativo)
    const angle = (normalizedCrypto - normalizedPhysical) * 45
    
    return Math.max(-45, Math.min(45, angle))
  }, [cryptoPremium, physicalPremium])

  // Determinar intensidad del color basado en la oportunidad
  const opportunityIntensity = useMemo(() => {
    const maxPremium = Math.max(Math.abs(cryptoPremium), Math.abs(physicalPremium))
    if (maxPremium >= 0.20) return 'high'
    if (maxPremium >= 0.10) return 'medium'
    return 'low'
  }, [cryptoPremium, physicalPremium])

  // Configuración del canal seleccionado
  const channelConfig = {
    crypto: {
      label: 'CRYPTO',
      sublabel: 'Vender como USDT',
      icon: <Bitcoin className="h-5 w-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/20',
    },
    physical: {
      label: 'FÍSICO',
      sublabel: 'Vender en ventanilla',
      icon: <Building2 className="h-5 w-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/20',
    },
    hold: {
      label: 'MANTENER',
      sublabel: 'Sin oportunidad clara',
      icon: <Pause className="h-5 w-5" />,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/30',
      glowColor: 'shadow-zinc-500/20',
    },
  }

  const activeChannel = channelConfig[bestChannel]

  return (
    <div className="space-y-4">
      {/* Gauge visual */}
      <div className="relative h-32 flex items-center justify-center">
        {/* Fondo del arco */}
        <svg
          viewBox="0 0 200 100"
          className="w-full h-full max-w-[250px]"
        >
          {/* Arco de fondo */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className="text-zinc-800"
          />
          
          {/* Sección FÍSICO (izquierda - azul) */}
          <path
            d="M 20 90 A 80 80 0 0 1 60 35"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={cn(
              'transition-all duration-300',
              bestChannel === 'physical' ? 'text-blue-500' : 'text-blue-500/30',
            )}
          />
          
          {/* Sección NEUTRAL (centro - gris) */}
          <path
            d="M 70 28 A 80 80 0 0 1 130 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={cn(
              'transition-all duration-300',
              bestChannel === 'hold' ? 'text-zinc-500' : 'text-zinc-500/30',
            )}
          />
          
          {/* Sección CRYPTO (derecha - amber) */}
          <path
            d="M 140 35 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={cn(
              'transition-all duration-300',
              bestChannel === 'crypto' ? 'text-amber-500' : 'text-amber-500/30',
            )}
          />
          
          {/* Aguja del indicador */}
          <motion.g
            initial={{ rotate: 0 }}
            animate={{ rotate: needleAngle }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            style={{ transformOrigin: '100px 90px' }}
          >
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="25"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="90"
              r="8"
              fill="white"
            />
            <circle
              cx="100"
              cy="90"
              r="4"
              fill="#18181b"
            />
          </motion.g>
          
          {/* Etiquetas */}
          <text x="15" y="98" className="text-[10px] fill-blue-400 font-medium">
            FÍSICO
          </text>
          <text x="88" y="18" className="text-[10px] fill-zinc-400 font-medium">
            HOLD
          </text>
          <text x="155" y="98" className="text-[10px] fill-amber-400 font-medium">
            CRYPTO
          </text>
        </svg>
      </div>

      {/* Indicador del canal activo */}
      <motion.div
        key={bestChannel}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          activeChannel.bgColor,
          activeChannel.borderColor,
          opportunityIntensity === 'high' && `shadow-lg ${activeChannel.glowColor}`,
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', activeChannel.bgColor)}>
            {activeChannel.icon}
          </div>
          <div>
            <div className={cn('font-semibold', activeChannel.color)}>
              {activeChannel.label}
            </div>
            <div className="text-xs text-zinc-500">
              {activeChannel.sublabel}
            </div>
          </div>
        </div>

        {/* Indicador de intensidad */}
        {bestChannel !== 'hold' && (
          <div className="flex items-center gap-2">
            {opportunityIntensity === 'high' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Zap className="h-5 w-5 text-emerald-400" />
              </motion.div>
            )}
            <div className={cn(
              'text-sm font-medium',
              opportunityIntensity === 'high' && 'text-emerald-400',
              opportunityIntensity === 'medium' && 'text-amber-400',
              opportunityIntensity === 'low' && 'text-zinc-400',
            )}>
              {opportunityIntensity === 'high' && '¡Oportunidad Alta!'}
              {opportunityIntensity === 'medium' && 'Oportunidad Media'}
              {opportunityIntensity === 'low' && 'Baja diferencia'}
            </div>
          </div>
        )}
      </motion.div>

      {/* Detalles de premiums */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
            <span className="text-zinc-400">Premium Crypto</span>
            <span className={cn(
              'font-mono',
              cryptoPremium > 0 ? 'text-emerald-400' : 'text-red-400',
            )}>
              {cryptoPremium > 0 ? '+' : ''}{cryptoPremium.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
            <span className="text-zinc-400">Premium Físico</span>
            <span className={cn(
              'font-mono',
              physicalPremium > 0 ? 'text-emerald-400' : 'text-red-400',
            )}>
              {physicalPremium > 0 ? '+' : ''}{physicalPremium.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArbitrageGauge
