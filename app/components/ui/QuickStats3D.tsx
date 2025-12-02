'use client'

import { motion } from 'framer-motion'
import { 
  LayoutDashboard, ShoppingCart, Users, Package, Building2, 
  FileText, Brain, DollarSign, TrendingUp, Wallet,
} from 'lucide-react'
import type { PanelId } from '@/app/types'

interface QuickStatsProps {
  stats: Array<{
    id: string
    label: string
    value: string | number
    icon: React.ReactNode
    color: string
    trend?: number
    onClick?: () => void
  }>
  className?: string
}

export function QuickStats3D({ stats, className = '' }: QuickStatsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <motion.button
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={stat.onClick}
          className="relative p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 hover:border-cyan-500/50 transition-all group cursor-pointer"
        >
          {/* Icon */}
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto"
            style={{ backgroundColor: `${stat.color}30` }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {stat.icon}
          </motion.div>

          {/* Label */}
          <p className="text-white/60 text-xs mb-1 text-center">{stat.label}</p>

          {/* Value */}
          <p className="text-white font-bold text-xl text-center">{stat.value}</p>

          {/* Trend */}
          {stat.trend !== undefined && (
            <div className={`flex items-center justify-center gap-1 mt-2 text-xs font-semibold ${
              stat.trend >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <TrendingUp className={`w-3 h-3 ${stat.trend < 0 ? 'rotate-180' : ''}`} />
              <span>{stat.trend >= 0 ? '+' : ''}{stat.trend}%</span>
            </div>
          )}

          {/* Hover glow */}
          <motion.div
            className="absolute inset-0 -z-10 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity"
            style={{ backgroundColor: stat.color }}
          />
        </motion.button>
      ))}
    </div>
  )
}

interface PanelNavigatorProps {
  currentPanel: PanelId
  onPanelChange: (panel: PanelId) => void
  className?: string
}

export function PanelNavigator3D({ currentPanel, onPanelChange, className = '' }: PanelNavigatorProps) {
  const panels = [
    { id: 'dashboard' as PanelId, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, color: '#06b6d4' },
    { id: 'ventas' as PanelId, label: 'Ventas', icon: <ShoppingCart className="w-5 h-5" />, color: '#10b981' },
    { id: 'clientes' as PanelId, label: 'Clientes', icon: <Users className="w-5 h-5" />, color: '#3b82f6' },
    { id: 'distribuidores' as PanelId, label: 'Distribuidores', icon: <Package className="w-5 h-5" />, color: '#f59e0b' },
    { id: 'ordenes' as PanelId, label: 'Órdenes', icon: <FileText className="w-5 h-5" />, color: '#8b5cf6' },
    { id: 'almacen' as PanelId, label: 'Almacén', icon: <Package className="w-5 h-5" />, color: '#ec4899' },
    { id: 'banco' as PanelId, label: 'Bancos', icon: <Building2 className="w-5 h-5" />, color: '#14b8a6' },
    { id: 'gya' as PanelId, label: 'G&A', icon: <DollarSign className="w-5 h-5" />, color: '#f97316' },
    { id: 'reportes' as PanelId, label: 'Reportes', icon: <FileText className="w-5 h-5" />, color: '#6366f1' },
    { id: 'ia' as PanelId, label: 'IA', icon: <Brain className="w-5 h-5" />, color: '#a855f7' },
  ]

  return (
    <div className={`flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 ${className}`}>
      {panels.map((panel) => {
        const isActive = currentPanel === panel.id

        return (
          <motion.button
            key={panel.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPanelChange(panel.id)}
            className={`
              relative px-4 py-3 rounded-xl whitespace-nowrap
              flex items-center gap-2 transition-all font-semibold text-sm
              ${isActive
                ? 'backdrop-blur-xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-2 border-cyan-500/50 text-white'
                : 'backdrop-blur-xl bg-white/10 border-2 border-white/20 text-white/70 hover:border-cyan-500/30 hover:text-white'
              }
            `}
          >
            <div style={{ color: panel.color }}>{panel.icon}</div>
            <span>{panel.label}</span>

            {isActive && (
              <motion.div
                layoutId="active-panel"
                className="absolute inset-0 rounded-xl border-2 border-cyan-500"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            {isActive && (
              <motion.div
                className="absolute inset-0 -z-10 rounded-xl blur-xl"
                style={{ backgroundColor: panel.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
              />
            )}
          </motion.button>
        )
      })}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  )
}
