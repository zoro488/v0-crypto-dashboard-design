'use client'

/**
 * 🔥 FirePortal3D - Portal de Fuego Estilo Dr. Strange
 * 
 * Efecto de portal mágico con:
 * - Partículas de fuego rotando
 * - Anillos de energía concéntricos
 * - Destellos y chispas
 * - Estados de carga progresivos
 * - Transiciones de entrada/salida
 */

import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Points, 
  PointMaterial, 
  shaderMaterial,
  Environment,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// ============================================================================
// TIPOS
// ============================================================================

type PortalState = 'opening' | 'active' | 'closing' | 'idle';

interface FirePortal3DProps {
  state?: PortalState;
  progress?: number;
  size?: number;
  color?: 'fire' | 'ice' | 'void' | 'gold' | 'emerald';
  onComplete?: () => void;
  message?: string;
}

// ============================================================================
// COLORES POR TEMA
// ============================================================================

const PORTAL_COLORS: Record<string, { inner: string; outer: string; particles: string; glow: string }> = {
  fire: { inner: '#ff6b00', outer: '#ff3d00', particles: '#ffab00', glow: '#ff9100' },
  ice: { inner: '#00bcd4', outer: '#00838f', particles: '#80deea', glow: '#00e5ff' },
  void: { inner: '#7c4dff', outer: '#651fff', particles: '#b388ff', glow: '#a855f7' },
  gold: { inner: '#ffd700', outer: '#ff8f00', particles: '#ffecb3', glow: '#ffc107' },
  emerald: { inner: '#00e676', outer: '#00c853', particles: '#69f0ae', glow: '#1de9b6' },
}

// ============================================================================
// PARTÍCULAS DE FUEGO
// ============================================================================

interface FireParticlesProps {
  count?: number;
  radius?: number;
  speed?: number;
  color: string;
  state: PortalState;
}

function FireParticles({ count = 2000, radius = 2, speed = 1, color, state }: FireParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  
  // Generar posiciones y velocidades iniciales
  const { positions, velocities, lifetimes, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const life = new Float32Array(count)
    const siz = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Posición en anillo
      const angle = (i / count) * Math.PI * 2
      const r = radius * (0.8 + Math.random() * 0.4)
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      pos[i * 3 + 2] = Math.sin(angle) * r
      
      // Velocidad de rotación y caos
      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = Math.random() * 0.02
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
      
      life[i] = Math.random()
      siz[i] = 0.5 + Math.random() * 1.5
    }
    
    return { positions: pos, velocities: vel, lifetimes: life, sizes: siz }
  }, [count, radius])

  useFrame((frameState, delta) => {
    if (!pointsRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const speedMultiplier = state === 'active' ? speed : state === 'opening' ? speed * 2 : 0.2
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const angle = Math.atan2(positions[i3 + 2], positions[i3])
      const r = Math.sqrt(positions[i3] ** 2 + positions[i3 + 2] ** 2)
      
      // Rotación + movimiento caótico
      const newAngle = angle + delta * speedMultiplier * (1 + Math.sin(time + i) * 0.3)
      positions[i3] = Math.cos(newAngle) * r + velocities[i3] * Math.sin(time * 3 + i)
      positions[i3 + 1] += velocities[i3 + 1] * (1 + Math.sin(time * 5 + i) * 0.5)
      positions[i3 + 2] = Math.sin(newAngle) * r + velocities[i3 + 2] * Math.cos(time * 3 + i)
      
      // Reset cuando sale del rango
      if (positions[i3 + 1] > 0.5) {
        positions[i3 + 1] = -0.5
        lifetimes[i] = Math.random()
      }
      
      // Mantener en el anillo
      const currentR = Math.sqrt(positions[i3] ** 2 + positions[i3 + 2] ** 2)
      if (currentR > radius * 1.3 || currentR < radius * 0.7) {
        const targetR = radius * (0.9 + Math.random() * 0.2)
        positions[i3] *= targetR / currentR
        positions[i3 + 2] *= targetR / currentR
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.rotation.z = time * 0.1
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={state === 'idle' ? 0 : 0.8}
      />
    </Points>
  )
}

// ============================================================================
// ANILLO DE ENERGÍA
// ============================================================================

interface EnergyRingProps {
  radius: number;
  thickness?: number;
  color: string;
  rotationSpeed?: number;
  segments?: number;
  state: PortalState;
  delay?: number;
}

function EnergyRing({ 
  radius, 
  thickness = 0.02, 
  color, 
  rotationSpeed = 1, 
  segments = 128,
  state,
  delay = 0,
}: EnergyRingProps) {
  const ringRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const [scale, setScale] = useState(state === 'idle' ? 0 : 1)
  
  useEffect(() => {
    if (state === 'opening') {
      const timer = setTimeout(() => setScale(1), delay)
      return () => clearTimeout(timer)
    } else if (state === 'closing') {
      setScale(0)
    } else if (state === 'idle') {
      setScale(0)
    }
  }, [state, delay])

  useFrame((frameState, delta) => {
    if (!ringRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    ringRef.current.rotation.z += delta * rotationSpeed
    
    // Pulsación
    const pulse = 1 + Math.sin(time * 3 + delay) * 0.05
    const targetScale = state === 'idle' ? 0 : state === 'closing' ? 0 : pulse
    ringRef.current.scale.setScalar(THREE.MathUtils.lerp(ringRef.current.scale.x, targetScale, 0.1))
    
    // Opacidad
    if (materialRef.current) {
      const targetOpacity = state === 'active' || state === 'opening' ? 0.9 : 0
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.1)
    }
  })

  return (
    <mesh ref={ringRef} scale={0}>
      <torusGeometry args={[radius, thickness, 16, segments]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ============================================================================
// RUNAS FLOTANTES
// ============================================================================

function FloatingRunes({ radius, color, state }: { radius: number; color: string; state: PortalState }) {
  const groupRef = useRef<THREE.Group>(null)
  const runeCount = 12
  
  // Geometrías de runas simplificadas
  const runeGeometries = useMemo(() => {
    return Array.from({ length: runeCount }, () => {
      const shape = new THREE.Shape()
      const type = Math.floor(Math.random() * 3)
      
      if (type === 0) {
        // Triángulo
        shape.moveTo(0, 0.15)
        shape.lineTo(-0.1, -0.1)
        shape.lineTo(0.1, -0.1)
        shape.closePath()
      } else if (type === 1) {
        // Diamante
        shape.moveTo(0, 0.15)
        shape.lineTo(-0.08, 0)
        shape.lineTo(0, -0.15)
        shape.lineTo(0.08, 0)
        shape.closePath()
      } else {
        // Línea con cruz
        shape.moveTo(-0.05, 0.1)
        shape.lineTo(0.05, 0.1)
        shape.lineTo(0.05, -0.1)
        shape.lineTo(-0.05, -0.1)
        shape.closePath()
      }
      
      return new THREE.ShapeGeometry(shape)
    })
  }, [])

  useFrame((frameState) => {
    if (!groupRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    groupRef.current.rotation.z = -time * 0.3
    
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        // Flotar y pulsar
        const mesh = child as THREE.Mesh
        const angle = (i / runeCount) * Math.PI * 2 + time * 0.2
        mesh.position.x = Math.cos(angle) * radius
        mesh.position.y = Math.sin(time * 2 + i) * 0.1
        mesh.position.z = Math.sin(angle) * radius
        mesh.rotation.z = time + i
        
        // Escala según estado
        const targetScale = state === 'active' || state === 'opening' ? 1 : 0
        mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale, 0.1))
      }
    })
  })

  return (
    <group ref={groupRef}>
      {runeGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo} scale={0}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// CENTRO DEL PORTAL
// ============================================================================

function PortalCenter({ color, state, progress }: { color: string; state: PortalState; progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  useFrame((frameState) => {
    if (!meshRef.current || !materialRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    
    // Distorsión del centro
    const scale = state === 'active' ? 1.5 + Math.sin(time * 2) * 0.2 : state === 'opening' ? progress * 1.5 : 0
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1))
    
    // Rotación
    meshRef.current.rotation.z = time
    
    // Opacidad
    const targetOpacity = state === 'active' ? 0.3 + progress * 0.3 : 0
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.1)
  })

  return (
    <mesh ref={meshRef} scale={0}>
      <circleGeometry args={[1, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ============================================================================
// CHISPAS
// ============================================================================

function Sparks({ color, state }: { color: string; state: PortalState }) {
  const sparkCount = 50
  const pointsRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(sparkCount * 3)
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 1.8 + Math.random() * 0.5
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3
      pos[i * 3 + 2] = Math.sin(angle) * r
    }
    return pos
  }, [])

  useFrame((frameState) => {
    if (!pointsRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < sparkCount; i++) {
      const i3 = i * 3
      const angle = Math.atan2(pos[i3 + 2], pos[i3])
      const newAngle = angle + 0.05 + Math.sin(time + i) * 0.02
      const r = 1.8 + Math.sin(time * 3 + i * 0.5) * 0.3
      
      pos[i3] = Math.cos(newAngle) * r
      pos[i3 + 1] = Math.sin(time * 5 + i) * 0.2
      pos[i3 + 2] = Math.sin(newAngle) * r
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={state === 'active' || state === 'opening' ? 1 : 0}
      />
    </Points>
  )
}

// ============================================================================
// ESCENA DEL PORTAL
// ============================================================================

interface PortalSceneProps {
  state: PortalState;
  progress: number;
  colors: typeof PORTAL_COLORS.fire;
}

function PortalScene({ state, progress, colors }: PortalSceneProps) {
  return (
    <>
      {/* Cámara */}
      <perspectiveCamera position={[0, 0, 5]} fov={50} />
      
      {/* Iluminación */}
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 2]} color={colors.glow} intensity={state === 'active' ? 3 : 0} />
      
      {/* Anillos de energía */}
      <EnergyRing radius={2} thickness={0.04} color={colors.outer} rotationSpeed={1} state={state} delay={0} />
      <EnergyRing radius={1.85} thickness={0.03} color={colors.inner} rotationSpeed={-1.5} state={state} delay={100} />
      <EnergyRing radius={2.15} thickness={0.025} color={colors.particles} rotationSpeed={0.8} state={state} delay={200} />
      <EnergyRing radius={1.7} thickness={0.02} color={colors.glow} rotationSpeed={-2} state={state} delay={300} />
      
      {/* Partículas de fuego */}
      <FireParticles count={1500} radius={2} speed={1.5} color={colors.particles} state={state} />
      <FireParticles count={500} radius={1.9} speed={-1} color={colors.inner} state={state} />
      
      {/* Runas flotantes */}
      <FloatingRunes radius={1.6} color={colors.glow} state={state} />
      
      {/* Centro del portal */}
      <PortalCenter color={colors.inner} state={state} progress={progress} />
      
      {/* Chispas */}
      <Sparks color={colors.particles} state={state} />
      
      {/* Ambiente */}
      <Environment preset="night" />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.002, 0.002)}
        />
        <Vignette darkness={0.7} offset={0.2} />
      </EffectComposer>
    </>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function FirePortal3D({
  state = 'idle',
  progress = 0,
  size = 300,
  color = 'fire',
  onComplete,
  message = 'Cargando...',
}: FirePortal3DProps) {
  const colors = PORTAL_COLORS[color]
  const [internalState, setInternalState] = useState<PortalState>(state)
  
  useEffect(() => {
    setInternalState(state)
    
    if (state === 'closing' && onComplete) {
      const timer = setTimeout(onComplete, 1000)
      return () => clearTimeout(timer)
    }
  }, [state, onComplete])

  return (
    <AnimatePresence>
      {internalState !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative flex flex-col items-center justify-center"
          style={{ width: size, height: size }}
        >
          {/* Canvas 3D */}
          <Canvas
            gl={{ antialias: true, alpha: true }}
            style={{ width: size, height: size }}
          >
            <Suspense fallback={null}>
              <PortalScene state={internalState} progress={progress} colors={colors} />
            </Suspense>
          </Canvas>
          
          {/* Mensaje y progreso */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-sm font-medium text-white/80 mb-2">{message}</p>
            {progress > 0 && progress < 1 && (
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: colors.glow }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// OVERLAY DE CARGA CON PORTAL
// ============================================================================

interface PortalLoadingOverlayProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  color?: 'fire' | 'ice' | 'void' | 'gold' | 'emerald';
}

export function PortalLoadingOverlay({
  isLoading,
  progress = 0,
  message = 'Procesando...',
  color = 'fire',
}: PortalLoadingOverlayProps) {
  const [state, setState] = useState<PortalState>('idle')
  
  useEffect(() => {
    if (isLoading) {
      setState('opening')
      const timer = setTimeout(() => setState('active'), 500)
      return () => clearTimeout(timer)
    } else {
      setState('closing')
      const timer = setTimeout(() => setState('idle'), 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  return (
    <AnimatePresence>
      {state !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <FirePortal3D
            state={state}
            progress={progress}
            size={400}
            color={color}
            message={message}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FirePortal3D
