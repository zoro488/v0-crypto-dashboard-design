'use client'
/**
 * 🔮 AI INSIGHTS DASHBOARD - "The Oracle View"
 * 
 * Panel de visualización de insights y detección de anomalías:
 * - Radar Scanner con detección de anomalías
 * - Puntos pulsantes para transacciones sospechosas
 * - Generador de escenarios "¿Qué pasaría si...?"
 * - Sliders de predicción en tiempo real
 * - Comparación realidad vs simulación
 */

import { useState, useRef, useEffect, useCallback, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Float, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import {
  AlertTriangle,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  ShoppingCart,
  BarChart3,
  Sliders,
  RefreshCw,
  Info,
  ChevronRight,
  Play,
  Pause,
  X,
  Shield,
  Zap,
} from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { radarScannerFragmentShader, radarScannerVertexShader } from '@/app/components/3d/shaders/NeuralCoreShaders'

// ============================================================================
// TIPOS
// ============================================================================
interface Anomaly {
  id: string
  type: 'expense' | 'sale' | 'margin' | 'pattern'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  value: number
  position: { x: number; y: number }
  bank?: string
  timestamp: Date
}

interface ScenarioSlider {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  impact: 'positive' | 'negative' | 'neutral'
}

interface BankProjection {
  id: string
  name: string
  currentValue: number
  projectedValue: number
  change: number
}

// ============================================================================
// DATOS DE EJEMPLO
// ============================================================================
const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: '1',
    type: 'expense',
    severity: 'high',
    title: 'Gasto Inusual en Fletes',
    description: 'El gasto en fletes de esta semana es 340% mayor al promedio histórico',
    value: 45000,
    position: { x: 0.7, y: 0.3 },
    bank: 'flete_sur',
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'sale',
    severity: 'medium',
    title: 'Venta Sin Margen',
    description: 'Venta detectada con margen de ganancia del 2%, muy por debajo del objetivo',
    value: 12500,
    position: { x: 0.3, y: 0.6 },
    bank: 'utilidades',
    timestamp: new Date(),
  },
  {
    id: '3',
    type: 'pattern',
    severity: 'low',
    title: 'Patrón de Compra Inusual',
    description: 'Cliente ABC aumentó frecuencia de compras 200% esta semana',
    value: 0,
    position: { x: 0.5, y: 0.8 },
    timestamp: new Date(),
  },
  {
    id: '4',
    type: 'margin',
    severity: 'high',
    title: 'Erosión de Margen',
    description: 'El margen promedio cayó del 32% al 18% en productos electrónicos',
    value: -14,
    position: { x: 0.8, y: 0.7 },
    bank: 'profit',
    timestamp: new Date(),
  },
]

const INITIAL_SLIDERS: ScenarioSlider[] = [
  { id: 'dollar', label: 'Tipo de Cambio USD', value: 17.5, min: 15, max: 22, step: 0.1, unit: 'MXN', impact: 'neutral' },
  { id: 'sales', label: 'Ventas Mensuales', value: 100, min: 0, max: 200, step: 5, unit: '%', impact: 'positive' },
  { id: 'costs', label: 'Costos Operativos', value: 100, min: 50, max: 150, step: 5, unit: '%', impact: 'negative' },
  { id: 'margin', label: 'Margen Objetivo', value: 32, min: 10, max: 50, step: 1, unit: '%', impact: 'positive' },
]

// ============================================================================
// COMPONENTE RADAR 3D
// ============================================================================
function RadarScanner3D({ anomalies, onAnomalyClick }: { anomalies: Anomaly[]; onAnomalyClick: (a: Anomaly) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const scanLineRef = useRef(0)

  // Uniforms del shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(512, 512) },
    uScanAngle: { value: 0 },
  }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
      scanLineRef.current = (scanLineRef.current + 0.01) % (Math.PI * 2)
      materialRef.current.uniforms.uScanAngle.value = scanLineRef.current
    }
  })

  return (
    <group>
      {/* Radar base */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={radarScannerVertexShader}
          fragmentShader={radarScannerFragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>

      {/* Puntos de anomalías */}
      {anomalies.map((anomaly) => (
        <AnomalyPoint
          key={anomaly.id}
          anomaly={anomaly}
          onClick={() => onAnomalyClick(anomaly)}
        />
      ))}

      {/* Anillos concéntricos */}
      {[1, 2, 3].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[i - 0.02, i, 64]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.1} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// PUNTO DE ANOMALÍA
// ============================================================================
function AnomalyPoint({ anomaly, onClick }: { anomaly: Anomaly; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  // Convertir posición 2D a 3D en el radar
  const x = (anomaly.position.x - 0.5) * 5
  const z = (anomaly.position.y - 0.5) * 5
  const distance = Math.sqrt(x * x + z * z)

  // Color basado en severidad
  const color = anomaly.severity === 'high'
    ? '#ff3333'
    : anomaly.severity === 'medium'
    ? '#ffaa00'
    : '#00aaff'

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Pulso
    const pulse = Math.sin(t * 3 + distance) * 0.1 + 1
    meshRef.current.scale.setScalar(pulse * (hovered ? 1.3 : 1))

    // Glow
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 1.5)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + Math.sin(t * 5) * 0.1
    }
  })

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
      <group
        position={[x, 0.2, z]}
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {/* Punto principal */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1}
          />
        </mesh>

        {/* Glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Tooltip al hover */}
        {hovered && (
          <Html center distanceFactor={1.5} style={{ pointerEvents: 'none' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-3 w-48"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-semibold text-white">{anomaly.title}</span>
              </div>
              <p className="text-xs text-white/60">{anomaly.description}</p>
            </motion.div>
          </Html>
        )}
      </group>
    </Float>
  )
}

// ============================================================================
// ESCENA 3D
// ============================================================================
function OracleScene({ anomalies, onAnomalyClick }: { anomalies: Anomaly[]; onAnomalyClick: (a: Anomaly) => void }) {
  return (
    <>
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        autoRotate
        autoRotateSpeed={0.5}
      />

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 5, 0]} color="#00ff88" intensity={1} />
      <pointLight position={[5, 2, 5]} color="#0088ff" intensity={0.5} />

      <RadarScanner3D anomalies={anomalies} onAnomalyClick={onAnomalyClick} />

      <Sparkles
        count={100}
        scale={8}
        size={1}
        speed={0.5}
        color="#00ff88"
        opacity={0.3}
      />

      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.3} mipmapBlur />
        <Vignette darkness={0.5} offset={0.3} />
      </EffectComposer>
    </>
  )
}

// ============================================================================
// PANEL DE DETALLES DE ANOMALÍA
// ============================================================================
function AnomalyDetailPanel({ anomaly, onClose }: { anomaly: Anomaly; onClose: () => void }) {
  const severityColor = anomaly.severity === 'high'
    ? '#ef4444'
    : anomaly.severity === 'medium'
    ? '#f59e0b'
    : '#3b82f6'

  const severityLabel = anomaly.severity === 'high'
    ? 'Alta'
    : anomaly.severity === 'medium'
    ? 'Media'
    : 'Baja'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 border-b border-white/10"
        style={{ background: `linear-gradient(135deg, ${severityColor}20, transparent)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${severityColor}30` }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: severityColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{anomaly.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: `${severityColor}30`, color: severityColor }}
                >
                  Severidad {severityLabel}
                </span>
                {anomaly.bank && (
                  <span className="text-xs text-white/50">{anomaly.bank}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-sm text-white/70">{anomaly.description}</p>

        {anomaly.value !== 0 && (
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
            <DollarSign className="w-5 h-5 text-white/50" />
            <div>
              <div className="text-2xl font-bold text-white">
                {anomaly.value > 0 ? `$${anomaly.value.toLocaleString()}` : `${anomaly.value}%`}
              </div>
              <div className="text-xs text-white/50">Valor detectado</div>
            </div>
          </div>
        )}

        {/* Acciones sugeridas */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white/70">Acciones Sugeridas</h4>
          <div className="space-y-2">
            {[
              'Revisar transacciones relacionadas',
              'Notificar al responsable',
              'Marcar como investigado',
            ].map((action, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <span className="text-sm text-white/70">{action}</span>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// PANEL DE SIMULACIÓN
// ============================================================================
interface SimulationPanelProps {
  sliders: ScenarioSlider[]
  onSliderChange: (id: string, value: number) => void
  projections: BankProjection[]
  onReset: () => void
}

function SimulationPanel({ sliders, onSliderChange, projections, onReset }: SimulationPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sliders className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Simulador de Escenarios</h3>
            <p className="text-xs text-white/50">¿Qué pasaría si...?</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {sliders.map((slider) => (
          <div key={slider.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">{slider.label}</span>
              <span className="text-sm font-mono text-white">
                {slider.value}{slider.unit}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={slider.value}
                onChange={(e) => onSliderChange(slider.id, parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-purple-500
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-purple-500/30"
              />
              {/* Marcador de valor base (100%) */}
              {slider.id !== 'dollar' && slider.id !== 'margin' && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/30"
                  style={{ left: `${((100 - slider.min) / (slider.max - slider.min)) * 100}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Proyecciones */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white/70">Proyecciones de Capital</h4>
        {projections.map((proj) => {
          const isPositive = proj.change >= 0
          return (
            <div
              key={proj.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
            >
              <div>
                <div className="text-sm text-white">{proj.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/50">
                    ${proj.currentValue.toLocaleString()}
                  </span>
                  <ChevronRight className="w-3 h-3 text-white/30" />
                  <span className="text-xs font-medium text-white">
                    ${proj.projectedValue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-mono">
                  {isPositive ? '+' : ''}{proj.change.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráfico de comparación */}
      <div className="p-4 bg-white/5 rounded-xl">
        <h4 className="text-sm font-semibold text-white/70 mb-4">Realidad vs Simulación</h4>
        <div className="h-32 flex items-end gap-4">
          {projections.slice(0, 4).map((proj, i) => (
            <div key={proj.id} className="flex-1 space-y-1">
              <div className="flex gap-1 h-24 items-end">
                {/* Barra actual */}
                <div
                  className="flex-1 bg-gradient-to-t from-blue-600/50 to-blue-400/30 rounded-t"
                  style={{ height: `${(proj.currentValue / 500000) * 100}%` }}
                />
                {/* Barra proyectada (fantasma) */}
                <motion.div
                  className="flex-1 border-2 border-dashed border-purple-400 rounded-t"
                  style={{ height: `${(proj.projectedValue / 500000) * 100}%` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="text-[10px] text-white/40 text-center truncate">
                {proj.name.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
            <span className="text-xs text-white/50">Actual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-dashed border-purple-400 rounded-sm" />
            <span className="text-xs text-white/50">Proyección</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function AIInsightsDashboard() {
  const [anomalies] = useState<Anomaly[]>(MOCK_ANOMALIES)
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)
  const [sliders, setSliders] = useState<ScenarioSlider[]>(INITIAL_SLIDERS)
  const [isScanning, setIsScanning] = useState(true)

  // Calcular proyecciones basadas en sliders
  const projections = useMemo<BankProjection[]>(() => {
    const salesFactor = sliders.find(s => s.id === 'sales')?.value || 100
    const costsFactor = sliders.find(s => s.id === 'costs')?.value || 100
    const dollarRate = sliders.find(s => s.id === 'dollar')?.value || 17.5
    const marginTarget = sliders.find(s => s.id === 'margin')?.value || 32

    const baseBanks = [
      { id: 'monte', name: 'Bóveda Monte', base: 245000 },
      { id: 'usa', name: 'Bóveda USA', base: 180000 },
      { id: 'profit', name: 'Profit', base: 320000 },
      { id: 'utilidades', name: 'Utilidades', base: 150000 },
    ]

    return baseBanks.map(bank => {
      // Fórmula simplificada de proyección
      let factor = (salesFactor / 100) * (marginTarget / 32)
      factor = factor * (1 - (costsFactor - 100) / 200)
      factor = factor * (17.5 / dollarRate)

      const projected = bank.base * factor
      const change = ((projected - bank.base) / bank.base) * 100

      return {
        id: bank.id,
        name: bank.name,
        currentValue: bank.base,
        projectedValue: Math.round(projected),
        change,
      }
    })
  }, [sliders])

  const handleSliderChange = useCallback((id: string, value: number) => {
    setSliders(prev => prev.map(s => s.id === id ? { ...s, value } : s))
  }, [])

  const handleReset = useCallback(() => {
    setSliders(INITIAL_SLIDERS)
  }, [])

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <Eye className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">The Oracle View</h1>
            <p className="text-xs text-white/50">Detección de Anomalías e Insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <motion.div
              animate={{ scale: isScanning ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1, repeat: isScanning ? Infinity : 0 }}
              className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400' : 'bg-white/50'}`}
            />
            <span className="text-sm text-white/70">
              {isScanning ? 'Escaneando...' : 'Pausado'}
            </span>
          </div>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {isScanning ? (
              <Pause className="w-5 h-5 text-white/70" />
            ) : (
              <Play className="w-5 h-5 text-white/70" />
            )}
          </button>
        </div>
      </motion.header>

      {/* Canvas 3D con Radar */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 6, 6], fov: 45 }}>
          <Suspense fallback={null}>
            <OracleScene
              anomalies={anomalies}
              onAnomalyClick={setSelectedAnomaly}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Panel lateral izquierdo - Anomalías */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-4 top-20 bottom-4 w-80 overflow-hidden"
      >
        <div className="h-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Anomalías Detectadas</h3>
                <p className="text-xs text-white/50">{anomalies.length} alertas activas</p>
              </div>
            </div>
          </div>

          {/* Lista de anomalías */}
          <div className="p-4 space-y-3 max-h-[calc(100%-80px)] overflow-y-auto">
            {anomalies.map((anomaly) => {
              const severityColor = anomaly.severity === 'high'
                ? '#ef4444'
                : anomaly.severity === 'medium'
                ? '#f59e0b'
                : '#3b82f6'

              return (
                <motion.button
                  key={anomaly.id}
                  onClick={() => setSelectedAnomaly(anomaly)}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-3 rounded-xl bg-white/5 border transition-all ${
                    selectedAnomaly?.id === anomaly.id
                      ? 'border-white/30'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 animate-pulse"
                      style={{ backgroundColor: severityColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {anomaly.title}
                      </h4>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                        {anomaly.description}
                      </p>
                      {anomaly.bank && (
                        <span className="text-[10px] text-white/30 mt-1 block">
                          {anomaly.bank}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Panel lateral derecho - Simulación */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute right-4 top-20 bottom-4 w-96 overflow-hidden"
      >
        <div className="h-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-auto p-4">
          <SimulationPanel
            sliders={sliders}
            onSliderChange={handleSliderChange}
            projections={projections}
            onReset={handleReset}
          />
        </div>
      </motion.div>

      {/* Modal de detalle de anomalía */}
      <AnimatePresence>
        {selectedAnomaly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedAnomaly(null)}
          >
            <div
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <AnomalyDetailPanel
                anomaly={selectedAnomaly}
                onClose={() => setSelectedAnomaly(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leyenda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-xs text-white/50">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-xs text-white/50">Atención</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-white/50">Crítico</span>
        </div>
      </motion.div>
    </div>
  )
}
