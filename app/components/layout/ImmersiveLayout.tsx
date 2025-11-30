'use client'

import { Suspense, useRef, ReactNode, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  Noise, 
  ChromaticAberration,
  Vignette, 
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Spline from '@splinetool/react-spline'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import * as THREE from 'three'

// Constantes de configuración
const SPLINE_BACKGROUND_URL = 'https://prod.spline.design/t22KlukwndaHbHKF/scene.splinecode'

// Interface para las props del componente
interface ImmersiveLayoutProps {
  children: ReactNode
  showBackground?: boolean
  enablePostProcessing?: boolean
  className?: string
}

// Componente de estrellas de fondo (fallback mientras carga Spline)
function StarField({ count = 500 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null)
  
  // Crear geometría con THREE directamente
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 100
      positions[i3 + 1] = (Math.random() - 0.5) * 100
      positions[i3 + 2] = (Math.random() - 0.5) * 100
      
      const isBlue = Math.random() > 0.5
      colors[i3] = isBlue ? 0.3 : 0.8     // R
      colors[i3 + 1] = isBlue ? 0.5 : 0.4 // G
      colors[i3 + 2] = isBlue ? 1.0 : 0.9 // B
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    return geo
  }, [count])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
    }
  })
  
  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Componente de nebulosa ambiental
function AmbientNebula() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.01
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, -20]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color="#1a0a2e"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Componente de efectos de post-procesamiento
function PostProcessingEffects({ enabled = true }: { enabled?: boolean }) {
  if (!enabled) return null
  
  return (
    <EffectComposer>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.ADD}
      />
      <Noise
        opacity={0.05}
        blendFunction={BlendFunction.OVERLAY}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.001, 0.001)}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette
        offset={0.3}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}

// Escena 3D principal
function Scene3D({ enablePostProcessing }: { enablePostProcessing: boolean }) {
  return (
    <>
      {/* Iluminación ambiental */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#4a90d9" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#9333ea" />
      
      {/* Campo de estrellas de fondo */}
      <StarField count={800} />
      
      {/* Nebulosa ambiental */}
      <AmbientNebula />
      
      {/* Efectos de post-procesamiento */}
      <PostProcessingEffects enabled={enablePostProcessing} />
    </>
  )
}

// Componente de carga
function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        >
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full" />
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/60 text-sm font-medium"
            >
              Cargando experiencia inmersiva...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Wrapper para el fondo de Spline
function SplineBackgroundWrapper({ 
  onLoad, 
}: { 
  onLoad: () => void 
}) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Spline
        scene={SPLINE_BACKGROUND_URL}
        onLoad={onLoad}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  )
}

// Componente principal del Layout Inmersivo
export function ImmersiveLayout({
  children,
  showBackground = true,
  enablePostProcessing = true,
  className = '',
}: ImmersiveLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  
  // Efecto para gestionar la carga
  useEffect(() => {
    // Timeout de seguridad para no bloquear la UI
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 5000)
    
    if (splineLoaded || canvasReady) {
      clearTimeout(timeout)
      // Pequeño delay para animación suave
      setTimeout(() => setIsLoading(false), 500)
    }
    
    return () => clearTimeout(timeout)
  }, [splineLoaded, canvasReady])
  
  const handleSplineLoad = () => {
    setSplineLoaded(true)
  }
  
  const handleCanvasCreated = () => {
    setCanvasReady(true)
  }
  
  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${className}`}>
      {/* Pantalla de carga */}
      <LoadingOverlay isLoading={isLoading} />
      
      {/* Fondo 3D con Canvas de Three.js */}
      {showBackground && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: -2 }}
        >
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 10], fov: 60 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            onCreated={handleCanvasCreated}
            style={{ 
              background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0a0f 100%)',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <Suspense fallback={null}>
              <Scene3D enablePostProcessing={enablePostProcessing} />
            </Suspense>
          </Canvas>
        </div>
      )}
      
      {/* Fondo Spline (capa superior al Canvas) */}
      {showBackground && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: -1 }}
        >
          <Suspense fallback={null}>
            <SplineBackgroundWrapper onLoad={handleSplineLoad} />
          </Suspense>
        </div>
      )}
      
      {/* Overlay de gradiente para mejor legibilidad */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          zIndex: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />
      
      {/* Contenido principal con efecto cristal */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 20 : 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        className="relative z-10"
      >
        {children}
      </motion.main>
    </div>
  )
}

// Componente de tarjeta con efecto cristal para usar en el layout
interface GlassCardProps {
  children: ReactNode
  className?: string
  intensity?: 'light' | 'medium' | 'strong'
  glow?: boolean
  glowColor?: string
}

export function GlassCard({
  children,
  className = '',
  intensity = 'medium',
  glow = false,
  glowColor = 'blue',
}: GlassCardProps) {
  const intensityClasses = {
    light: 'bg-black/10 backdrop-blur-sm border-white/5',
    medium: 'bg-black/20 backdrop-blur-md border-white/10',
    strong: 'bg-black/30 backdrop-blur-xl border-white/15',
  }
  
  const glowColors: Record<string, string> = {
    blue: 'shadow-blue-500/20',
    purple: 'shadow-purple-500/20',
    cyan: 'shadow-cyan-500/20',
    pink: 'shadow-pink-500/20',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        rounded-2xl border 
        ${intensityClasses[intensity]}
        ${glow ? `shadow-lg ${glowColors[glowColor] || glowColors.blue}` : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}

// Componente de sidebar con efecto cristal
interface GlassSidebarProps {
  children: ReactNode
  className?: string
  width?: number
  collapsed?: boolean
}

export function GlassSidebar({
  children,
  className = '',
  width = 288,
  collapsed = false,
}: GlassSidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : width }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={`
        fixed left-0 top-0 h-screen
        bg-black/30 backdrop-blur-xl
        border-r border-white/10
        shadow-[0_0_30px_rgba(0,0,0,0.5)]
        z-40
        ${className}
      `}
    >
      {children}
    </motion.aside>
  )
}

// Componente de header con efecto cristal
interface GlassHeaderProps {
  children: ReactNode
  className?: string
  height?: number
}

export function GlassHeader({
  children,
  className = '',
  height = 72,
}: GlassHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        fixed top-0 left-0 right-0
        bg-black/20 backdrop-blur-xl
        border-b border-white/10
        shadow-[0_4px_30px_rgba(0,0,0,0.3)]
        z-50
        ${className}
      `}
      style={{ height }}
    >
      {children}
    </motion.header>
  )
}

// Hook personalizado para detectar si el layout está cargado
export function useImmersiveLayoutReady() {
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Simular tiempo de carga del layout
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  return isReady
}

export default ImmersiveLayout
