'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Vault,
  Truck,
  DollarSign,
  PiggyBank,
  Landmark,
  History,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { BANCOS_CONFIG } from '@/app/_lib/constants/bancos'
import type { Banco } from '@/database/schema'

interface BancosClientProps {
  initialBancos: Banco[]
  capitalTotal: number
  historicoIngresos: number
  historicoGastos: number
}

const iconMap: Record<string, any> = {
  vault: Vault,
  building: Building2,
  wallet: Wallet,
  truck: Truck,
  dollar: DollarSign,
  piggy: PiggyBank,
  landmark: Landmark,
}

export function BancosClient({ 
  initialBancos,
  capitalTotal,
  historicoIngresos,
  historicoGastos,
}: BancosClientProps) {
  const [bancos] = useState(initialBancos)
  const [showAmounts, setShowAmounts] = useState(true)
  const [selectedBanco, setSelectedBanco] = useState<string | null>(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const summaryCards = [
    {
      title: 'Capital Total',
      value: formatCurrency(capitalTotal),
      icon: Wallet,
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Ingresos Históricos',
      value: formatCurrency(historicoIngresos),
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Gastos Históricos',
      value: formatCurrency(historicoGastos),
      icon: TrendingDown,
      gradient: 'from-red-500 to-rose-600',
    },
  ]

  // Ordenar bancos según config
  const bancosOrdenados = [...bancos].sort((a, b) => {
    const configA = BANCOS_CONFIG[a.id as keyof typeof BANCOS_CONFIG]
    const configB = BANCOS_CONFIG[b.id as keyof typeof BANCOS_CONFIG]
    return (configA?.orden || 999) - (configB?.orden || 999)
  })

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'relative overflow-hidden rounded-2xl p-6',
              'bg-gradient-to-br',
              card.gradient
            )}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80">
                <card.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{card.title}</span>
              </div>
              <p className="text-3xl font-bold text-white mt-2">
                {showAmounts ? card.value : '••••••'}
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <card.icon className="h-32 w-32" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAmounts(!showAmounts)}
            className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            {showAmounts ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar montos
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Mostrar montos
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transferir
          </button>
          <button 
            onClick={() => setIsGastoModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Minus className="h-4 w-4" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Bancos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {bancosOrdenados.map((banco, index) => {
            const config = BANCOS_CONFIG[banco.id as keyof typeof BANCOS_CONFIG]
            const Icon = iconMap[config?.icono || 'vault'] || Vault
            const isSelected = selectedBanco === banco.id
            const porcentajeCapital = capitalTotal > 0 
              ? ((banco.capitalActual || 0) / capitalTotal * 100).toFixed(1)
              : '0'

            return (
              <motion.div
                key={banco.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedBanco(isSelected ? null : banco.id)}
                className={cn(
                  'group relative rounded-2xl border p-6 cursor-pointer transition-all',
                  isSelected 
                    ? 'border-purple-500/50 bg-purple-500/10' 
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${config?.color || '#8B5CF6'}20`,
                    }}
                  >
                    <Icon 
                      className="h-6 w-6"
                      style={{ color: config?.color || '#8B5CF6' }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {porcentajeCapital}%
                    </span>
                  </div>
                </div>

                {/* Name & Type */}
                <div className="mb-4">
                  <h3 className="font-semibold">{banco.nombre}</h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {banco.tipo}
                  </p>
                </div>

                {/* Balance */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Capital Actual</p>
                    <p className="text-2xl font-bold font-mono">
                      {showAmounts 
                        ? formatCurrency(banco.capitalActual || 0)
                        : '••••••'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                    <div>
                      <p className="text-xs text-muted-foreground">Ingresos</p>
                      <p className="text-sm font-mono text-green-400">
                        {showAmounts 
                          ? formatCurrency(banco.historicoIngresos || 0)
                          : '••••'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gastos</p>
                      <p className="text-sm font-mono text-red-400">
                        {showAmounts 
                          ? formatCurrency(banco.historicoGastos || 0)
                          : '••••'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${porcentajeCapital}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: config?.color || '#8B5CF6' }}
                  />
                </div>

                {/* Quick Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      toast.info('Ver historial de ' + banco.nombre)
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"
      >
        <p className="text-sm text-blue-400">
          <strong>Distribución automática:</strong> Las ventas se distribuyen automáticamente 
          entre Bóveda Monte (costo), Fletes (logística) y Utilidades (ganancia neta).
        </p>
      </motion.div>
    </div>
  )
}
