'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ParticleGalaxy } from '@/app/components/visualizations/3d/ParticleGalaxy'
import { CryptoHologram } from '@/app/components/visualizations/3d/CryptoHologram'
import { DataCube } from '@/app/components/visualizations/3d/DataCube'
import { AIBrainVisualizer } from '@/app/components/visualizations/AIBrainVisualizer'
import { InteractiveMetricsOrb } from '@/app/components/visualizations/InteractiveMetricsOrb'
import { FinancialRiverFlow } from '@/app/components/visualizations/FinancialRiverFlow'
import { PremiumCard } from '@/app/components/ui/PremiumCard'
import { Sparkles, Box, Brain, Orbit, Zap, Waves } from 'lucide-react'

interface Visualization3DShowcaseProps {
  className?: string
}

export function Visualization3DShowcase({ className = '' }: Visualization3DShowcaseProps) {
  const [activeTab, setActiveTab] = useState('3d')

  return (
    <div className={`space-y-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-cyan-400" />
          Visualizaciones Premium 3D
        </h2>
        <p className="text-white/60">
          Componentes avanzados con Three.js, React Three Fiber y Canvas API optimizados a 60fps
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 gap-2 bg-transparent p-0">
          <TabsTrigger 
            value="3d"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-purple-500/30 data-[state=active]:border-cyan-500/50"
          >
            <Box className="w-4 h-4 mr-2" />
            R3F & Three.js
          </TabsTrigger>
          <TabsTrigger 
            value="canvas"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-purple-500/30 data-[state=active]:border-cyan-500/50"
          >
            <Zap className="w-4 h-4 mr-2" />
            Canvas 2D
          </TabsTrigger>
          <TabsTrigger 
            value="hybrid"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-purple-500/30 data-[state=active]:border-cyan-500/50"
          >
            <Orbit className="w-4 h-4 mr-2" />
            Híbrido
          </TabsTrigger>
        </TabsList>

        {/* Tab: R3F & Three.js */}
        <TabsContent value="3d" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Particle Galaxy */}
            <PremiumCard
              variant="glass"
              title="Particle Galaxy"
              subtitle="50,000 partículas animadas"
              icon={Sparkles}
              badge="R3F"
              badgeColor="#06b6d4"
              className="h-[500px]"
            >
              <div className="h-[380px] rounded-xl overflow-hidden">
                <ParticleGalaxy
                  count={50000}
                  branches={4}
                  insideColor="#06b6d4"
                  outsideColor="#8b5cf6"
                />
              </div>
            </PremiumCard>

            {/* Crypto Hologram */}
            <PremiumCard
              variant="neon"
              title="Crypto Hologram"
              subtitle="Holograma 3D interactivo"
              icon={Box}
              badge="Three.js"
              badgeColor="#8b5cf6"
              className="h-[500px]"
            >
              <div className="h-[380px] rounded-xl overflow-hidden">
                <CryptoHologram
                  text="CHRONOS"
                  color="#06b6d4"
                  animated
                />
              </div>
            </PremiumCard>

            {/* Data Cube */}
            <PremiumCard
              variant="gradient"
              title="Data Cube 3D"
              subtitle="Visualización de datos interactiva"
              icon={Box}
              badge="R3F"
              badgeColor="#10b981"
              className="h-[500px]"
            >
              <div className="h-[380px] rounded-xl overflow-hidden">
                <DataCube
                  onDataPointClick={(point) => {
                    console.log('Data point clicked:', point)
                  }}
                />
              </div>
            </PremiumCard>
          </div>
        </TabsContent>

        {/* Tab: Canvas 2D */}
        <TabsContent value="canvas" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Brain Visualizer */}
            <PremiumCard
              variant="glass"
              title="AI Brain Visualizer"
              subtitle="Red neuronal con 56 nodos"
              icon={Brain}
              badge="Canvas"
              badgeColor="#8b5cf6"
              className="h-[600px]"
            >
              <div className="h-[500px] rounded-xl overflow-hidden">
                <AIBrainVisualizer
                  isThinking={true}
                  activityLevel={0.75}
                  width={800}
                  height={600}
                />
              </div>
            </PremiumCard>

            {/* Interactive Metrics Orb */}
            <PremiumCard
              variant="neon"
              title="Interactive Metrics Orb"
              subtitle="Orbe de métricas orbital"
              icon={Orbit}
              badge="Canvas"
              badgeColor="#06b6d4"
              className="h-[600px]"
            >
              <div className="h-[500px] rounded-xl overflow-hidden flex items-center justify-center">
                <InteractiveMetricsOrb 
                  size={450} 
                  metrics={[]}
                />
              </div>
            </PremiumCard>
          </div>
        </TabsContent>

        {/* Tab: Híbrido */}
        <TabsContent value="hybrid" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Financial River Flow */}
            <PremiumCard
              variant="glass"
              title="Financial River Flow"
              subtitle="Flujo financiero animado entre cuentas"
              icon={Waves}
              badge="Canvas + Physics"
              badgeColor="#10b981"
              className="h-[700px]"
              glow
            >
              <div className="h-[580px] rounded-xl overflow-hidden">
                <FinancialRiverFlow
                  width={1200}
                  height={600}
                />
              </div>
            </PremiumCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            icon: <Zap className="w-6 h-6" />,
            title: '60 FPS',
            description: 'Animaciones fluidas optimizadas',
            color: '#f59e0b',
          },
          {
            icon: <Box className="w-6 h-6" />,
            title: '3D Interactivo',
            description: 'Controles orbit y zoom',
            color: '#06b6d4',
          },
          {
            icon: <Sparkles className="w-6 h-6" />,
            title: 'Partículas GPU',
            description: 'Renderizado acelerado',
            color: '#8b5cf6',
          },
          {
            icon: <Brain className="w-6 h-6" />,
            title: 'IA Visual',
            description: 'Red neuronal animada',
            color: '#10b981',
          },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${feature.color}30` }}
            >
              <div style={{ color: feature.color }}>{feature.icon}</div>
            </div>
            <h3 className="text-white font-bold mb-1">{feature.title}</h3>
            <p className="text-white/60 text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
