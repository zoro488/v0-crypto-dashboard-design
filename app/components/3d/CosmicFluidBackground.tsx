'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌊 COSMIC FLUID BACKGROUND - FONDO INMERSIVO ULTRA-PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Fondo de fluido cósmico con shaders GLSL avanzados
 * Basado en física Navier-Stokes + Domain Warping + FBM
 * 
 * PALETA CHRONOS INFINITY (CYAN PROHIBIDO):
 * - Negro Profundo: #000000 / #020105
 * - Violeta Real: #8B00FF
 * - Oro Líquido: #FFD700
 * - Rosa Eléctrico: #FF1493
 * 
 * Características:
 * - Interactividad con mouse (ondas centrífugas)
 * - Reactividad a energía del sistema
 * - 60fps optimizado
 * - Fallback estático para reduced motion
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, useEffect, useState, memo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import {
  cosmicFluidVertexShader,
  cosmicFluidFragmentShader,
  CHRONOS_SHADER_COLORS,
} from './shaders/InfinityShaders'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════
interface CosmicFluidBackgroundProps {
  /** Nivel de energía del sistema (0-1) */
  energy?: number
  /** Velocidad de la animación (multiplicador) */
  speed?: number
  /** Opacidad del fondo (0-1) */
  opacity?: number
  /** Mostrar efecto de vignette */
  vignette?: boolean
  /** Clase CSS adicional */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SHADER MESH COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════════
const FluidMesh = memo(({ energy = 0, speed = 1 }: { energy: number; speed: number }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5))
  const { size, viewport, pointer } = useThree()
  
  // Uniforms del shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uEnergy: { value: energy },
  }), [size.width, size.height, energy])
  
  // Actualizar resolución cuando cambia el tamaño
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height)
    }
  }, [size])
  
  // Seguimiento del mouse con suavizado
  useEffect(() => {
    const updateMouse = () => {
      // Normalizar posición del mouse a 0-1
      const x = (pointer.x + 1) / 2
      const y = (pointer.y + 1) / 2
      mouseRef.current.lerp(new THREE.Vector2(x, y), 0.05)
    }
    updateMouse()
  }, [pointer])
  
  // Animación del frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * speed
      materialRef.current.uniforms.uMouse.value.copy(mouseRef.current)
      materialRef.current.uniforms.uEnergy.value = energy
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width * 1.2, viewport.height * 1.2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={cosmicFluidVertexShader}
        fragmentShader={cosmicFluidFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
})
FluidMesh.displayName = 'FluidMesh'

// ════════════════════════════════════════════════════════════════════════════════════════
// PARTICLE DUST LAYER
// ════════════════════════════════════════════════════════════════════════════════════════
const ParticleDust = memo(({ energy = 0 }: { energy: number }) => {
  const pointsRef = useRef<THREE.Points>(null)
  
  const { positions, sizes, colors } = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const col = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Distribución aleatoria en un cubo grande
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = Math.random() * -5 - 2
      
      siz[i] = Math.random() * 0.03 + 0.01
      
      // Colores: mezcla de violeta, oro y rosa
      const colorChoice = Math.random()
      let color: [number, number, number]
      if (colorChoice < 0.4) {
        color = CHRONOS_SHADER_COLORS.violetReal
      } else if (colorChoice < 0.7) {
        color = CHRONOS_SHADER_COLORS.goldLiquid
      } else {
        color = CHRONOS_SHADER_COLORS.pinkElectric
      }
      col[i * 3] = color[0]
      col[i * 3 + 1] = color[1]
      col[i * 3 + 2] = color[2]
    }
    
    return { positions: pos, sizes: siz, colors: col }
  }, [])
  
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
      
      // Escala reactiva a la energía
      pointsRef.current.scale.setScalar(1 + energy * 0.2)
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.4 + energy * 0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
})
ParticleDust.displayName = 'ParticleDust'

// ════════════════════════════════════════════════════════════════════════════════════════
// STATIC FALLBACK (para reduced motion / sin WebGL)
// ════════════════════════════════════════════════════════════════════════════════════════
const StaticCosmicBackground = memo(({ opacity = 1 }: { opacity?: number }) => (
  <div 
    className="fixed inset-0 pointer-events-none"
    style={{
      opacity,
      background: `
        radial-gradient(ellipse 100% 100% at 20% 30%, rgba(139, 0, 255, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse 80% 100% at 80% 70%, rgba(255, 215, 0, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse 60% 80% at 50% 50%, rgba(255, 20, 147, 0.1) 0%, transparent 40%),
        radial-gradient(circle at 30% 80%, rgba(139, 0, 255, 0.08) 0%, transparent 30%),
        linear-gradient(180deg, #000000 0%, #020105 50%, #000000 100%)
      `,
      zIndex: -20,
    }}
  />
))
StaticCosmicBackground.displayName = 'StaticCosmicBackground'

// ════════════════════════════════════════════════════════════════════════════════════════
// CANVAS SCENE
// ════════════════════════════════════════════════════════════════════════════════════════
const CosmicScene = memo(({ energy, speed }: { energy: number; speed: number }) => (
  <>
    <FluidMesh energy={energy} speed={speed} />
    <ParticleDust energy={energy} />
  </>
))
CosmicScene.displayName = 'CosmicScene'

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════
function CosmicFluidBackground({
  energy = 0,
  speed = 1,
  opacity = 0.8,
  vignette = true,
  className = '',
}: CosmicFluidBackgroundProps) {
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  
  useEffect(() => {
    setMounted(true)
    
    // Verificar soporte WebGL
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || 
                 canvas.getContext('webgl') || 
                 canvas.getContext('experimental-webgl')
      setHasWebGL(!!gl)
    } catch {
      setHasWebGL(false)
    }
  }, [])
  
  // SSR safety + reduced motion + WebGL check
  if (!mounted || prefersReducedMotion || !hasWebGL) {
    return <StaticCosmicBackground opacity={opacity} />
  }
  
  return (
    <>
      <Canvas
        gl={{ 
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: false,
        }}
        camera={{ 
          fov: 50, 
          position: [0, 0, 5], 
          near: 0.1, 
          far: 100,
        }}
        className={`fixed inset-0 pointer-events-none ${className}`}
        style={{ 
          zIndex: -20,
          opacity,
        }}
        dpr={[1, 1.5]}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <CosmicScene energy={energy} speed={speed} />
        </Suspense>
      </Canvas>
      
      {/* Vignette overlay */}
      {vignette && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: -15,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
          }}
        />
      )}
    </>
  )
}

export default memo(CosmicFluidBackground)

// ════════════════════════════════════════════════════════════════════════════════════════
// EXPORTACIONES ADICIONALES
// ════════════════════════════════════════════════════════════════════════════════════════
export { StaticCosmicBackground, FluidMesh, ParticleDust }
export type { CosmicFluidBackgroundProps }
