'use client'

import * as React from 'react'
import { motion, type Variants } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'
import { cn, formatCurrency, formatPercent } from '@/app/_lib/utils'
import { BANCOS_CONFIG, type BancoId } from '@/app/_lib/constants/bancos'
import type { Banco } from '@/database/schema'

interface DashboardClientProps {
  initialData: {
    capital: {
      capitalTotal: number
      ingresosHistoricos: number
      gastosHistoricos: number
    }
    bancos: Banco[]
    stats: {
      totalVentas: number
      montoTotal: number
      montoPagado: number
      montoRestante: number
      ventasCompletas: number
      ventasParciales: number
      ventasPendientes: number
    } | null
  }
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const { capital, bancos, stats } = initialData

  // Calculate growth (mock - in production this would compare periods)
  const capitalGrowth = 12.5
  const ventasGrowth = 8.3

  return (
    <motion.div
      className="p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">
            Bienvenido al sistema CHRONOS
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm text-violet-300">Sistema Activo</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Capital Total */}
        <motion.div
          variants={itemVariants}
          className={cn(
            "relative overflow-hidden rounded-2xl p-6",
            "bg-gradient-to-br from-violet-500/10 to-purple-500/5",
            "border border-violet-500/20",
            "group hover:border-violet-500/40 transition-colors"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Capital Total</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(capital.capitalTotal)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              "bg-violet-500/20"
            )}>
              <DollarSign className="h-6 w-6 text-violet-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {capitalGrowth >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            )}
            <span className={cn(
              "text-sm font-medium",
              capitalGrowth >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {formatPercent(Math.abs(capitalGrowth), { showSign: true })}
            </span>
            <span className="text-sm text-zinc-500">vs mes anterior</span>
          </div>
          
          {/* Decorative gradient */}
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>

        {/* Ventas */}
        <motion.div
          variants={itemVariants}
          className={cn(
            "relative overflow-hidden rounded-2xl p-6",
            "bg-gradient-to-br from-emerald-500/10 to-green-500/5",
            "border border-emerald-500/20",
            "group hover:border-emerald-500/40 transition-colors"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Ventas Totales</p>
              <p className="text-3xl font-bold text-white mt-2">
                {stats?.totalVentas ?? 0}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              "bg-emerald-500/20"
            )}>
              <ShoppingCart className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {ventasGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm text-zinc-400">
              {formatCurrency(stats?.montoTotal ?? 0)} total
            </span>
          </div>
          
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>

        {/* Por Cobrar */}
        <motion.div
          variants={itemVariants}
          className={cn(
            "relative overflow-hidden rounded-2xl p-6",
            "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
            "border border-amber-500/20",
            "group hover:border-amber-500/40 transition-colors"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Por Cobrar</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(stats?.montoRestante ?? 0)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              "bg-amber-500/20"
            )}>
              <Users className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-zinc-400">
              {stats?.ventasPendientes ?? 0} ventas pendientes
            </span>
          </div>
          
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>

        {/* Cobrado */}
        <motion.div
          variants={itemVariants}
          className={cn(
            "relative overflow-hidden rounded-2xl p-6",
            "bg-gradient-to-br from-cyan-500/10 to-blue-500/5",
            "border border-cyan-500/20",
            "group hover:border-cyan-500/40 transition-colors"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Cobrado</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(stats?.montoPagado ?? 0)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              "bg-cyan-500/20"
            )}>
              <Package className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-zinc-400">
              {stats?.ventasCompletas ?? 0} ventas completas
            </span>
          </div>
          
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </motion.div>

      {/* Bancos Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold text-white mb-4">Bóvedas y Bancos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bancos.map((banco) => {
            const config = BANCOS_CONFIG[banco.id as BancoId]
            return (
              <motion.div
                key={banco.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                className={cn(
                  "relative overflow-hidden rounded-xl p-4",
                  "bg-zinc-900/50 border border-white/5",
                  "hover:border-white/10 transition-all cursor-pointer"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config?.color}20` }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: config?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {banco.nombre}
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">
                      {banco.tipo}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(banco.capitalActual)}
                </p>
                
                {/* Progress indicator */}
                <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((banco.capitalActual / (capital.capitalTotal || 1)) * 100, 100)}%`,
                      backgroundColor: config?.color 
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent Activity Placeholder */}
        <div className={cn(
          "rounded-2xl p-6",
          "bg-zinc-900/50 border border-white/5"
        )}>
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-800 rounded mt-1 animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className={cn(
          "rounded-2xl p-6",
          "bg-zinc-900/50 border border-white/5"
        )}>
          <h3 className="text-lg font-semibold text-white mb-4">Resumen Financiero</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Ingresos Históricos</span>
              <span className="text-emerald-400 font-medium">
                {formatCurrency(capital.ingresosHistoricos)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Gastos Históricos</span>
              <span className="text-red-400 font-medium">
                {formatCurrency(capital.gastosHistoricos)}
              </span>
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Capital Neto</span>
              <span className={cn(
                "font-bold text-lg",
                capital.capitalTotal >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {formatCurrency(capital.capitalTotal)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DashboardClient
