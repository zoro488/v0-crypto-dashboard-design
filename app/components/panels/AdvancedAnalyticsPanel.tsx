'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Brain, Workflow, Target, TrendingUp, Settings,
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
} from 'lucide-react'
import { AdvancedAnalyticsDashboard } from '@/app/components/analytics/AdvancedAnalyticsDashboard'
import { AutomatedInsightsEngine } from '@/app/components/analytics/AutomatedInsightsEngine'
import { AutomatedOperationFlow } from '@/app/components/analytics/AutomatedOperationFlow'
import { PremiumCard } from '@/app/components/ui/PremiumCard'

interface AdvancedAnalyticsPanelProps {
  ventas: any[]
  clientes: any[]
  ordenes: any[]
  bancos: any[]
  className?: string
}

type ViewMode = 'dashboard' | 'insights' | 'flow' | 'all'

export function AdvancedAnalyticsPanel({
  ventas = [],
  clientes = [],
  ordenes = [],
  bancos = [],
  className = '',
}: AdvancedAnalyticsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const views = [
    {
      id: 'dashboard' as ViewMode,
      name: 'Analytics Dashboard',
      icon: BarChart3,
      description: 'KPIs y métricas avanzadas',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50',
    },
    {
      id: 'insights' as ViewMode,
      name: 'Insights Engine',
      icon: Brain,
      description: 'Análisis automático con IA',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/50',
    },
    {
      id: 'flow' as ViewMode,
      name: 'Operation Flow',
      icon: Workflow,
      description: 'Flujo operacional automatizado',
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/50',
    },
    {
      id: 'all' as ViewMode,
      name: 'Vista Completa',
      icon: Target,
      description: 'Todos los módulos',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/50',
    },
  ]

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Header de Navegación */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panel de Analytics Avanzado</h1>
              <p className="text-sm text-white/60">Sistema de análisis inteligente en tiempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle fullscreen */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Selector de Vista */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {views.map((view) => (
            <motion.button
              key={view.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewMode(view.id)}
              className={`p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br border transition-all ${
                viewMode === view.id
                  ? view.color
                  : 'bg-white/5 border-white/20 hover:border-white/40'
              }`}
            >
              <view.icon className={`w-6 h-6 mx-auto mb-2 ${
                viewMode === view.id ? 'text-white' : 'text-white/60'
              }`} />
              <p className={`text-sm font-semibold ${
                viewMode === view.id ? 'text-white' : 'text-white/60'
              }`}>
                {view.name}
              </p>
              <p className="text-xs text-white/40 mt-1">{view.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Contenedor de Contenido */}
      <div className={`p-6 ${isFullscreen ? 'max-w-full' : 'max-w-[1920px] mx-auto'}`}>
        <AnimatePresence mode="wait">
          {/* Vista: Dashboard */}
          {(viewMode === 'dashboard' || viewMode === 'all') && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={viewMode === 'all' ? 'mb-8' : ''}
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              </div>
              <AdvancedAnalyticsDashboard
                ventas={ventas}
                clientes={clientes}
                ordenes={ordenes}
              />
            </motion.div>
          )}

          {/* Vista: Insights Engine */}
          {(viewMode === 'insights' || viewMode === 'all') && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: viewMode === 'all' ? 0.1 : 0 }}
              className={viewMode === 'all' ? 'mb-8' : ''}
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Insights Engine</h2>
              </div>
              <AutomatedInsightsEngine
                ventas={ventas}
                clientes={clientes}
                ordenes={ordenes}
                bancos={bancos}
              />
            </motion.div>
          )}

          {/* Vista: Operation Flow */}
          {(viewMode === 'flow' || viewMode === 'all') && (
            <motion.div
              key="flow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: viewMode === 'all' ? 0.2 : 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Workflow className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Operation Flow</h2>
              </div>
              <AutomatedOperationFlow
                ventas={ventas}
                clientes={clientes}
                ordenes={ordenes}
                bancos={bancos}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer con Estadísticas Rápidas */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-0 z-50 backdrop-blur-xl bg-black/40 border-t border-white/10 p-4"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-white/60">Ventas Analizadas</span>
            <span className="text-lg font-bold text-white">{ventas.length}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-white/60">Clientes Activos</span>
            <span className="text-lg font-bold text-white">{clientes.length}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-white/60">Órdenes Registradas</span>
            <span className="text-lg font-bold text-white">{ordenes.length}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-white/60">Bóvedas Monitoreadas</span>
            <span className="text-lg font-bold text-white">{bancos.length}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
