'use client'

/**
 * 🤖 BENTO IA ELEVATED - Panel de Inteligencia Artificial
 * 
 * Panel dedicado para configuración y estadísticas de IA.
 * El widget flotante está en GrokAIOrb y es visible en todos los paneles.
 */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Mic,
  Zap,
  Activity,
  Target,
  Clock,
  BarChart3,
} from 'lucide-react'
import { QuickStatWidget } from '@/app/components/widgets/QuickStatWidget'

// ============================================================================
// AI CAPABILITY CARD
// ============================================================================
interface AICapabilityCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  status: 'active' | 'learning' | 'ready'
  accuracy: number
  delay?: number
}

function AICapabilityCard({ icon: Icon, title, description, status, accuracy, delay = 0 }: AICapabilityCardProps) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    learning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ready: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  const statusLabels = {
    active: 'Activo',
    learning: 'Aprendiendo',
    ready: 'Listo',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-colors">
          <Icon className="w-6 h-6 text-purple-400" />
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
      
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-white/50 text-sm mb-4">{description}</p>
      
      {/* Accuracy bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Precisión</span>
          <span className="text-purple-400 font-medium">{accuracy}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ delay: delay + 0.3, duration: 0.8 }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function BentoIAElevated() {
  const capabilities = useMemo(() => [
    {
      icon: TrendingUp,
      title: 'Predicción de Ventas',
      description: 'Análisis predictivo basado en datos históricos',
      status: 'active' as const,
      accuracy: 94,
    },
    {
      icon: MessageCircle,
      title: 'Chat Inteligente',
      description: 'Respuestas contextuales y acciones automatizadas',
      status: 'active' as const,
      accuracy: 92,
    },
    {
      icon: Mic,
      title: 'Agente de Voz',
      description: 'Interacción por voz con comandos naturales',
      status: 'ready' as const,
      accuracy: 88,
    },
    {
      icon: BarChart3,
      title: 'Análisis de Datos',
      description: 'Insights automáticos y reportes inteligentes',
      status: 'active' as const,
      accuracy: 96,
    },
    {
      icon: Target,
      title: 'Optimización de Stock',
      description: 'Recomendaciones de inventario en tiempo real',
      status: 'learning' as const,
      accuracy: 78,
    },
    {
      icon: Zap,
      title: 'Automatización',
      description: 'Flujos de trabajo inteligentes',
      status: 'learning' as const,
      accuracy: 72,
    },
  ], [])

  return (
    <div className="bento-container space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(139,92,246,0.4)',
                '0 0 40px rgba(59,130,246,0.4)',
                '0 0 20px rgba(139,92,246,0.4)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center"
          >
            <Brain className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">Chronos AI</h1>
            <p className="text-white/50">Centro de Inteligencia Artificial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-3 h-3 rounded-full bg-green-500"
          />
          <span className="text-green-400 text-sm font-medium">Sistema Activo</span>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatWidget
          title="Precisión Global"
          value={94.7}
          suffix="%"
          change={2.3}
          icon={Brain}
          color="purple"
          sparklineData={[88, 90, 91, 93, 92, 94, 94.7]}
          delay={0.1}
        />
        <QuickStatWidget
          title="Consultas Hoy"
          value={156}
          change={15.8}
          icon={MessageCircle}
          color="cyan"
          sparklineData={[80, 95, 110, 125, 140, 150, 156]}
          delay={0.2}
        />
        <QuickStatWidget
          title="Tiempo Respuesta"
          value={0.8}
          suffix="s"
          change={-12.5}
          icon={Clock}
          color="green"
          sparklineData={[1.2, 1.1, 1.0, 0.9, 0.85, 0.82, 0.8]}
          delay={0.3}
        />
        <QuickStatWidget
          title="Acciones Ejecutadas"
          value={47}
          change={31.5}
          icon={Zap}
          color="orange"
          sparklineData={[20, 25, 30, 35, 40, 44, 47]}
          delay={0.4}
        />
      </div>

      {/* Capabilities Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Capacidades IA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap, index) => (
            <AICapabilityCard
              key={cap.title}
              {...cap}
              delay={0.4 + index * 0.1}
            />
          ))}
        </div>
      </motion.div>

      {/* Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Actividad Reciente
        </h2>
        <div className="space-y-3">
          {[
            { action: 'Predicción de ventas Q1 generada', time: 'Hace 5 min', type: 'success' },
            { action: 'Análisis de inventario completado', time: 'Hace 12 min', type: 'success' },
            { action: 'Recomendación de stock bajo enviada', time: 'Hace 25 min', type: 'warning' },
            { action: 'Modelo de predicción actualizado', time: 'Hace 1 hora', type: 'info' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'success' ? 'bg-green-500' :
                  item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <span className="text-white/80 text-sm">{item.action}</span>
              </div>
              <span className="text-white/40 text-xs">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white/80 text-sm">
              <span className="text-purple-400 font-semibold">Tip:</span> El widget de IA está disponible en todas las pantallas. 
              Haz click en el orbe flotante para acceder al chat o iniciar una llamada de voz.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
