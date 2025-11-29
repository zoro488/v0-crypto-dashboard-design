'use client'

/**
 * 🎨 PREMIUM PANEL COMPONENTS - Componentes 3D Premium para Paneles
 * 
 * Incluye:
 * - StatOrb3D: Orbe 3D para estadísticas con R3F
 * - GlassCard3D: Tarjeta con efecto glassmorphism premium
 * - ParticleBackground: Fondo de partículas animadas
 * - PulseIndicator: Indicador de pulso 3D
 * - FloatingWidget: Widget flotante con física
 */

import { useRef, useState, useMemo, useCallback, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  MeshTransmissionMaterial, 
  Environment, 
  Float, 
  Sparkles,
  ContactShadows,
  PerspectiveCamera,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import * as THREE from 'three'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type OrbVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
export type CardSize = 'sm' | 'md' | 'lg' | 'xl'

export interface StatOrb3DProps {
  value: string | number
  label: string
  variant?: OrbVariant
  size?: number
  showParticles?: boolean
  animated?: boolean
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  onClick?: () => void
}

export interface GlassCard3DProps {
  children: React.ReactNode
  className?: string
  variant?: OrbVariant
  size?: CardSize
  interactive?: boolean
  glowIntensity?: number
  onClick?: () => void
}

export interface ParticleBackgroundProps {
  variant?: OrbVariant
  intensity?: 'low' | 'medium' | 'high'
  interactive?: boolean
}

// ============================================================================
// CONFIGURACIÓN DE COLORES POR VARIANTE
// ============================================================================

export const VARIANT_COLORS: Record<OrbVariant, { 
  primary: string
  secondary: string
  glow: string
  gradient: string
}> = {
  success: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
    gradient: 'from-emerald-600/20 to-emerald-900/20',
  },
  warning: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.5)',
    gradient: 'from-amber-600/20 to-amber-900/20',
  },
  danger: {
    primary: '#ef4444',
    secondary: '#f87171',
    glow: 'rgba(239, 68, 68, 0.5)',
    gradient: 'from-rose-600/20 to-rose-900/20',
  },
  info: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.5)',
    gradient: 'from-cyan-600/20 to-cyan-900/20',
  },
  primary: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-600/20 to-blue-900/20',
  },
  secondary: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)',
    gradient: 'from-purple-600/20 to-purple-900/20',
  },
}

// ============================================================================
// COMPONENTES 3D INTERNOS (R3F)
// ============================================================================

// Esfera interior con material de transmisión
function InnerSphere({ 
  color, 
  audioLevel = 0,
  scale = 1, 
}: { 
  color: typeof VARIANT_COLORS.success
  audioLevel?: number
  scale?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    const baseScale = scale * 0.6
    const pulseScale = 1 + Math.sin(time * 2) * 0.05
    
    meshRef.current.scale.setScalar(baseScale * pulseScale * (1 + audioLevel * 0.2))
    meshRef.current.rotation.y += 0.005
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshTransmissionMaterial
        backside
        samples={16}
        resolution={256}
        transmission={0.95}
        roughness={0.05}
        thickness={0.5}
        ior={1.5}
        chromaticAberration={0.06}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor={color.primary}
        color={color.secondary}
        emissive={color.primary}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

// Esfera exterior (capa de cristal)
function OuterSphere({ 
  color, 
  scale = 1,
  isHovered = false, 
}: { 
  color: typeof VARIANT_COLORS.success
  scale?: number
  isHovered?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (!meshRef.current) return
    
    const targetScale = scale * (isHovered ? 1.05 : 1)
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1,
    )
    meshRef.current.rotation.y -= 0.002
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 64, 64]} />
      <MeshTransmissionMaterial
        backside={false}
        samples={8}
        resolution={128}
        transmission={0.9}
        roughness={0.1}
        thickness={0.2}
        ior={1.2}
        chromaticAberration={0.02}
        clearcoat={1}
        attenuationDistance={1}
        attenuationColor={color.primary}
        color="white"
        transparent
        opacity={0.25}
      />
    </mesh>
  )
}

// Anillos orbitales
function OrbitalRings({ color, isActive }: { color: typeof VARIANT_COLORS.success; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    const speed = isActive ? 2 : 1
    
    groupRef.current.children.forEach((ring, i) => {
      ring.rotation.x = time * speed * 0.3 * (i % 2 === 0 ? 1 : -1)
      ring.rotation.y = time * speed * 0.2 * (i % 2 === 0 ? -1 : 1)
    })
  })

  return (
    <group ref={groupRef}>
      {[1.4, 1.6, 1.8].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}>
          <torusGeometry args={[radius, 0.008, 16, 100]} />
          <meshStandardMaterial
            color={color.primary}
            emissive={color.primary}
            emissiveIntensity={0.5}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

// Escena completa del orbe
function OrbScene({ 
  color, 
  isHovered,
  showParticles, 
}: { 
  color: typeof VARIANT_COLORS.success
  isHovered: boolean
  showParticles: boolean
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color={color.primary} />
      <pointLight position={[-5, -5, 5]} intensity={0.5} color={color.secondary} />
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <group>
          <pointLight color={color.primary} intensity={2} distance={5} />
          <InnerSphere color={color} scale={1} />
          <OuterSphere color={color} scale={1} isHovered={isHovered} />
          <OrbitalRings color={color} isActive={isHovered} />
          
          {showParticles && (
            <Sparkles
              count={30}
              scale={3}
              size={2}
              speed={0.5}
              color={color.primary}
              opacity={0.6}
            />
          )}
        </group>
      </Float>
      
      <Environment preset="city" />
      
      <EffectComposer>
        <Bloom intensity={0.4} luminanceThreshold={0.5} mipmapBlur />
        <ChromaticAberration 
          blendFunction={BlendFunction.NORMAL} 
          offset={new THREE.Vector2(0.001, 0.001)} 
        />
        <Vignette darkness={0.2} offset={0.3} />
      </EffectComposer>
    </>
  )
}

// ============================================================================
// COMPONENTES EXPORTADOS
// ============================================================================

/**
 * StatOrb3D - Orbe 3D premium para mostrar estadísticas
 */
export function StatOrb3D({
  value,
  label,
  variant = 'primary',
  size = 120,
  showParticles = true,
  animated = true,
  trend,
  trendValue,
  onClick,
}: StatOrb3DProps) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = VARIANT_COLORS[variant]
  
  return (
    <motion.div
      className="relative flex flex-col items-center"
      style={{ width: size * 1.5, height: size * 1.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Canvas 3D */}
      <div className="relative" style={{ width: size * 1.5, height: size * 1.2 }}>
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 4], fov: 45 }}
          style={{ pointerEvents: 'none' }}
        >
          <Suspense fallback={null}>
            <OrbScene 
              color={colors} 
              isHovered={isHovered} 
              showParticles={showParticles} 
            />
          </Suspense>
        </Canvas>
        
        {/* Glow de fondo */}
        <motion.div 
          className="absolute inset-0 rounded-full blur-3xl -z-10"
          style={{ backgroundColor: colors.glow }}
          animate={{ 
            scale: isHovered ? [1, 1.2, 1] : [1, 1.1, 1], 
            opacity: [0.3, 0.5, 0.3], 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      
      {/* Etiquetas */}
      <motion.div 
        className="text-center mt-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/60 uppercase tracking-wider">{label}</p>
        
        {trend && trendValue && (
          <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/50'
          }`}>
            <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/**
 * GlassCard3D - Tarjeta con efecto glassmorphism premium y efectos 3D
 */
export function GlassCard3D({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  interactive = true,
  glowIntensity = 0.5,
  onClick,
}: GlassCard3DProps) {
  const colors = VARIANT_COLORS[variant]
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Motion values para efectos interactivos
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5])
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }, [interactive, mouseX, mouseY])
  
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }

  return (
    <motion.div
      ref={containerRef}
      className={`
        relative overflow-hidden rounded-2xl 
        border border-white/10 
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-xl
        ${sizeClasses[size]}
        ${interactive ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        rotateX: interactive ? springRotateX : 0,
        rotateY: interactive ? springRotateY : 0,
        transformStyle: 'preserve-3d',
        boxShadow: `
          0 0 ${20 * glowIntensity}px ${colors.glow},
          inset 0 1px 0 rgba(255,255,255,0.1),
          0 20px 40px -10px rgba(0,0,0,0.3)
        `,
      }}
      whileHover={interactive ? { scale: 1.02, y: -5 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Borde brillante superior */}
      <div 
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.secondary}50, transparent)`,
        }}
      />
      
      {/* Glow de fondo */}
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${colors.glow}, transparent 40%)`,
        }}
        whileHover={{ opacity: glowIntensity }}
      />
      
      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Reflejo de luz */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)',
        }}
      />
    </motion.div>
  )
}

/**
 * ParticleBackground - Fondo de partículas animadas para paneles
 */
export function ParticleBackground({
  variant = 'primary',
  intensity = 'medium',
  interactive = true,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colors = VARIANT_COLORS[variant]
  
  const config = useMemo(() => ({
    low: { count: 20, speed: 0.3, size: 2 },
    medium: { count: 40, speed: 0.5, size: 3 },
    high: { count: 60, speed: 0.8, size: 4 },
  })[intensity], [intensity])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradiente de fondo */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, ${colors.glow} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, ${colors.secondary}20 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Partículas CSS (fallback sin canvas para mejor rendimiento) */}
      <div className="absolute inset-0">
        {Array.from({ length: config.count }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * config.size + 1,
              height: Math.random() * config.size + 1,
              backgroundColor: colors.primary,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      
      {/* Overlay de ruido */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}

/**
 * PulseIndicator - Indicador de pulso animado estilo premium
 */
export function PulseIndicator({ 
  variant = 'success',
  size = 12,
  label,
}: { 
  variant?: OrbVariant
  size?: number
  label?: string
}) {
  const colors = VARIANT_COLORS[variant]
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Núcleo */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: colors.primary }}
        />
        
        {/* Pulso */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: colors.primary }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        
        {/* Segundo pulso */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: colors.primary }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.5,
          }}
        />
      </div>
      
      {label && (
        <span className="text-xs text-white/70">{label}</span>
      )}
    </div>
  )
}

/**
 * MiniChart3D - Mini gráfico con efecto 3D
 */
export function MiniChart3D({
  data,
  variant = 'primary',
  height = 60,
}: {
  data: number[]
  variant?: OrbVariant
  height?: number
}) {
  const colors = VARIANT_COLORS[variant]
  const max = Math.max(...data, 1)
  
  return (
    <div 
      className="flex items-end gap-1 w-full"
      style={{ height }}
    >
      {data.map((value, i) => {
        const barHeight = (value / max) * 100
        return (
          <motion.div
            key={i}
            className="flex-1 rounded-t"
            style={{
              background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 0 10px ${colors.glow}`,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${barHeight}%` }}
            transition={{ 
              delay: i * 0.05, 
              duration: 0.5, 
              ease: 'easeOut', 
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: `0 0 20px ${colors.glow}`,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * GradientText - Texto con gradiente premium
 */
export function GradientText({
  children,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode
  variant?: OrbVariant
  className?: string
}) {
  const colors = VARIANT_COLORS[variant]
  
  return (
    <span 
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
      }}
    >
      {children}
    </span>
  )
}

export default {
  StatOrb3D,
  GlassCard3D,
  ParticleBackground,
  PulseIndicator,
  MiniChart3D,
  GradientText,
  VARIANT_COLORS,
}
