'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — BANCOS SCENE 3D
// Escena 3D con 7 orbes premium en círculo sagrado
// Integración Spline + React Three Fiber + MeshDistortMaterial
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { Suspense, useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Float,
  Environment,
  Sparkles,
  Trail,
  MeshDistortMaterial,
  OrbitControls,
  Html,
  Stars,
  PerspectiveCamera,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BANCOS_CONFIG, 
  BANCOS_ORDENADOS,
  type BancoId,
  type BancoConfig,
} from '@/app/_lib/constants/bancos'
import { ORB_PRESETS } from '../shaders'
import { formatCurrency } from '@/app/_lib/utils/formatters'
import { cn } from '@/app/_lib/utils'
import type { Banco } from '@/database/schema'

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface BancoWithData extends BancoConfig {
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
  variacion24h?: number // -1 a 1
}

interface BancosSceneProps {
  bancos: Banco[]
  selectedBanco?: BancoId | null
  onSelectBanco?: (id: BancoId) => void
  className?: string
  showLabels?: boolean
  showSparkles?: boolean
  enableAudio?: boolean
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE POSICIONES — CÍRCULO SAGRADO
// ═══════════════════════════════════════════════════════════════

const CIRCLE_RADIUS = 3.5
const CENTER_SCALE = 1.3

// Profit (El Visionario) siempre en el centro
// Los demás en círculo sagrado alrededor
function calculateOrbPositions(): Map<BancoId, [number, number, number]> {
  const positions = new Map<BancoId, [number, number, number]>()
  
  // Profit en el centro
  positions.set('profit', [0, 0, 0])
  
  // Los otros 6 en círculo
  const otherBancos: BancoId[] = [
    'boveda_monte',
    'boveda_usa', 
    'leftie',
    'utilidades',
    'azteca',
    'flete_sur',
  ]
  
  otherBancos.forEach((id, index) => {
    const angle = (index / otherBancos.length) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * CIRCLE_RADIUS
    const z = Math.sin(angle) * CIRCLE_RADIUS
    positions.set(id, [x, 0, z])
  })
  
  return positions
}

const ORB_POSITIONS = calculateOrbPositions()

// ═══════════════════════════════════════════════════════════════
// ORBE INDIVIDUAL — Con shader LiquidOrb y personalidad
// ═══════════════════════════════════════════════════════════════

interface SingleOrbProps {
  banco: BancoWithData
  position: [number, number, number]
  isSelected: boolean
  isCenter: boolean
  onClick: () => void
  maxCapital: number
  showLabel: boolean
  enableSparkles: boolean
}

function SingleOrb({ 
  banco, 
  position, 
  isSelected, 
  isCenter,
  onClick, 
  maxCapital,
  showLabel,
  enableSparkles,
}: SingleOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  // Colores del orbe
  const colorPrimary = useMemo(() => new THREE.Color(banco.color), [banco.color])
  const colorSecondary = useMemo(() => new THREE.Color(banco.colorSecondary), [banco.colorSecondary])
  
  // Escala basada en capital
  const baseScale = isCenter ? CENTER_SCALE : 0.8
  const capitalRatio = Math.min(banco.capitalActual / Math.max(maxCapital, 1), 1)
  const dynamicScale = baseScale + capitalRatio * 0.3
  
  // Mood basado en variación 24h
  const mood = banco.variacion24h ?? 0
  
  // Preset de personalidad
  const preset = ORB_PRESETS[banco.id] || ORB_PRESETS.boveda_monte
  
  // Animación por frame
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Rotación suave
    meshRef.current.rotation.y += 0.003 * preset.breathingSpeed
    
    // Breathing effect
    const breathe = Math.sin(time * preset.breathingSpeed) * 0.02
    const scale = dynamicScale * (1 + breathe) * (isSelected ? 1.1 : 1)
    meshRef.current.scale.setScalar(scale)
    
    // Glow pulsation
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      const pulse = Math.sin(time * 2) * 0.1 + 0.3
      mat.opacity = pulse * (isSelected ? 1.5 : 1)
    }
  })
  
  // Color de sparkles basado en banco
  const sparkleColor = useMemo(() => {
    if (banco.id === 'utilidades') return '#FF1493' // Rosa
    if (banco.id === 'profit' || banco.id === 'flete_sur') return '#8B00FF' // Violeta
    return '#FFD700' // Oro por defecto
  }, [banco.id])
  
  return (
    <Float
      position={position}
      speed={1.5 * preset.breathingSpeed}
      rotationIntensity={0.2}
      floatIntensity={0.4}
    >
      <group onClick={onClick}>
        {/* Trail para movimiento */}
        <Trail
          width={isCenter ? 0.8 : 0.5}
          length={6}
          color={banco.color}
          attenuation={(t) => t * t}
        >
          {/* Orbe principal con MeshDistortMaterial premium */}
          <mesh ref={meshRef} castShadow>
            <icosahedronGeometry args={[1, 5]} />
            <MeshDistortMaterial
              color={banco.color}
              emissive={banco.colorSecondary}
              emissiveIntensity={0.3 + capitalRatio * 0.3}
              roughness={0.1}
              metalness={0.8}
              distort={preset.distortionScale}
              speed={preset.breathingSpeed}
              transparent
              opacity={0.95}
            />
          </mesh>
        </Trail>
        
        {/* Glow exterior */}
        <mesh ref={glowRef} scale={1.4}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial
            color={banco.color}
            transparent
            opacity={0.25}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Anillo orbital */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.015, 16, 64]} />
          <meshBasicMaterial 
            color={banco.color} 
            transparent 
            opacity={isSelected ? 0.8 : 0.4} 
          />
        </mesh>
        
        {/* Segundo anillo (inclinado) */}
        <mesh rotation={[Math.PI / 3, 0, Math.PI / 4]}>
          <torusGeometry args={[1.8, 0.01, 16, 64]} />
          <meshBasicMaterial 
            color={banco.colorSecondary} 
            transparent 
            opacity={0.2} 
          />
        </mesh>
        
        {/* Punto de luz */}
        <pointLight 
          color={banco.color} 
          intensity={isSelected ? 4 : 2} 
          distance={6} 
        />
        
        {/* Sparkles si están habilitados */}
        {enableSparkles && (
          <Sparkles
            count={isCenter ? 80 : 40}
            scale={2.5}
            size={isCenter ? 4 : 2}
            speed={0.5}
            color={sparkleColor}
          />
        )}
        
        {/* Label con información */}
        {showLabel && (
          <Html
            position={[0, -2, 0]}
            center
            className="pointer-events-none select-none"
            distanceFactor={5}
          >
            <div className={cn(
              "text-center transition-all duration-300",
              isSelected ? "scale-110" : "scale-100"
            )}>
              <p className="text-xs font-bold text-white whitespace-nowrap drop-shadow-lg">
                {banco.personality.apodo}
              </p>
              <p className="text-[10px] text-gray-300 whitespace-nowrap">
                {banco.nombre}
              </p>
              <p className={cn(
                "text-sm font-bold mt-1 whitespace-nowrap",
                banco.capitalActual > 0 ? "text-amber-400" : "text-gray-500"
              )}>
                {formatCurrency(banco.capitalActual)}
              </p>
              {banco.variacion24h !== undefined && (
                <p className={cn(
                  "text-[10px]",
                  banco.variacion24h > 0 ? "text-emerald-400" : 
                  banco.variacion24h < 0 ? "text-rose-400" : "text-gray-400"
                )}>
                  {banco.variacion24h > 0 ? '+' : ''}{(banco.variacion24h * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </Html>
        )}
      </group>
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════
// ESCENA 3D PRINCIPAL
// ═══════════════════════════════════════════════════════════════

function Scene({ 
  bancosData, 
  selectedBanco, 
  onSelectBanco,
  showLabels,
  showSparkles,
}: {
  bancosData: BancoWithData[]
  selectedBanco: BancoId | null
  onSelectBanco: (id: BancoId) => void
  showLabels: boolean
  showSparkles: boolean
}) {
  // Calcular capital máximo para escala relativa
  const maxCapital = useMemo(() => 
    Math.max(...bancosData.map(b => b.capitalActual), 1),
    [bancosData]
  )
  
  return (
    <>
      {/* Cámara */}
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
      
      {/* Controles */}
      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.3}
      />
      
      {/* Iluminación */}
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.5} 
        color="#FFD700"
        castShadow 
      />
      <directionalLight 
        position={[-10, 5, -5]} 
        intensity={0.3} 
        color="#8B00FF" 
      />
      <pointLight position={[0, -5, 0]} intensity={0.5} color="#FF1493" />
      
      {/* Estrellas de fondo */}
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      {/* Los 7 orbes */}
      {bancosData.map((banco) => {
        const position = ORB_POSITIONS.get(banco.id) || [0, 0, 0]
        const isCenter = banco.id === 'profit'
        
        return (
          <SingleOrb
            key={banco.id}
            banco={banco}
            position={position}
            isSelected={selectedBanco === banco.id}
            isCenter={isCenter}
            onClick={() => onSelectBanco(banco.id)}
            maxCapital={maxCapital}
            showLabel={showLabels}
            enableSparkles={showSparkles}
          />
        )
      })}
      
      {/* Círculo de conexión en el suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[CIRCLE_RADIUS - 0.1, CIRCLE_RADIUS + 0.1, 64]} />
        <meshBasicMaterial color="#8B00FF" transparent opacity={0.15} />
      </mesh>
      
      {/* Environment */}
      <Environment preset="night" />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom 
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.SCREEN}
        />
        <ChromaticAberration 
          offset={new THREE.Vector2(0.002, 0.002)}
          blendFunction={BlendFunction.NORMAL}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function BancosScene({
  bancos,
  selectedBanco = null,
  onSelectBanco,
  className = '',
  showLabels = true,
  showSparkles = true,
  enableAudio = false,
}: BancosSceneProps) {
  const [selected, setSelected] = useState<BancoId | null>(selectedBanco)
  
  // Sincronizar estado externo
  useEffect(() => {
    setSelected(selectedBanco)
  }, [selectedBanco])
  
  // Combinar datos de bancos con config
  const bancosData = useMemo(() => {
    return BANCOS_ORDENADOS.map(config => {
      const data = bancos.find(b => b.id === config.id)
      return {
        ...config,
        capitalActual: data?.capitalActual ?? 0,
        historicoIngresos: data?.historicoIngresos ?? 0,
        historicoGastos: data?.historicoGastos ?? 0,
        variacion24h: 0, // TODO: Calcular de movimientos
      }
    })
  }, [bancos])
  
  // Handler de selección
  const handleSelect = useCallback((id: BancoId) => {
    setSelected(id)
    onSelectBanco?.(id)
    
    // Audio feedback si está habilitado
    if (enableAudio && typeof window !== 'undefined') {
      // TODO: Reproducir sonido de personalidad del orbe
    }
  }, [onSelectBanco, enableAudio])
  
  // Capital total
  const capitalTotal = useMemo(() => 
    bancosData.reduce((sum, b) => sum + b.capitalActual, 0),
    [bancosData]
  )
  
  return (
    <div className={cn("relative w-full h-full min-h-[400px]", className)}>
      {/* Canvas 3D */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene
            bancosData={bancosData}
            selectedBanco={selected}
            onSelectBanco={handleSelect}
            showLabels={showLabels}
            showSparkles={showSparkles}
          />
        </Suspense>
      </Canvas>
      
      {/* Overlay con capital total */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-black/40 backdrop-blur-sm 
                     rounded-xl px-4 py-3 border border-violet-500/30"
        >
          <div>
            <p className="text-xs text-gray-400">Capital Total Sistema</p>
            <p className="text-xl font-bold text-amber-400">
              {formatCurrency(capitalTotal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Bancos Activos</p>
            <p className="text-xl font-bold text-violet-400">
              {bancosData.filter(b => b.capitalActual > 0).length} / 7
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Panel de banco seleccionado */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 w-64 bg-black/60 backdrop-blur-md 
                       rounded-xl p-4 border border-violet-500/30"
          >
            {(() => {
              const banco = bancosData.find(b => b.id === selected)
              if (!banco) return null
              
              return (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: banco.color }}
                    />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {banco.personality.apodo}
                      </p>
                      <p className="text-xs text-gray-400">{banco.nombre}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-300 mb-3 italic">
                    "{banco.personality.descripcion}"
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Capital</span>
                      <span className="text-sm font-bold text-amber-400">
                        {formatCurrency(banco.capitalActual)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Ingresos</span>
                      <span className="text-sm text-emerald-400">
                        {formatCurrency(banco.historicoIngresos)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Gastos</span>
                      <span className="text-sm text-rose-400">
                        {formatCurrency(banco.historicoGastos)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-[10px] text-gray-500">
                      🎵 {banco.personality.sonido}
                    </p>
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BancosScene
