'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🌌 INFINITY ORB 3D - EL ORBE MÁS HERMOSO JAMÁS CREADO
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Orbe 3D con shaders de distorsión líquida magnética
 * Responde al mouse, audio y estado del sistema
 * 
 * PALETA CHRONOS INFINITY (CYAN PROHIBIDO):
 * - Violeta Real: #8B00FF
 * - Oro Líquido: #FFD700
 * - Rosa Eléctrico: #FF1493
 * 
 * Tecnologías: R3F + GLSL + Spring Physics
 * Nivel: Superior a Apple Vision Pro 2026
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import type { ThreeElement } from '@react-three/fiber'
import { shaderMaterial, Float, MeshDistortMaterial } from '@react-three/drei'
import { useSpring, animated, config } from '@react-spring/three'
import * as THREE from 'three'
import {
  liquidMagneticOrbVertexShader,
  liquidMagneticOrbFragmentShader,
  CHRONOS_SHADER_COLORS,
} from './shaders/InfinityShaders'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error' | 'success'

export interface InfinityOrbProps {
  /** Estado actual del orbe (afecta color e intensidad) */
  state?: OrbState
  /** Nivel de audio para reactividad (0-1) */
  audioLevel?: number
  /** Escala del orbe */
  scale?: number
  /** Posición [x, y, z] */
  position?: [number, number, number]
  /** Callback cuando se hace click */
  onClick?: () => void
  /** Mostrar anillos orbitales */
  showRings?: boolean
  /** Intensidad del glow */
  glowIntensity?: number
}

// ════════════════════════════════════════════════════════════════════════════════════════
// MATERIAL SHADER PERSONALIZADO
// ════════════════════════════════════════════════════════════════════════════════════════
const InfinityOrbMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1.0,
    uMouse: new THREE.Vector2(0, 0),
    uAudioLevel: 0,
    uColorPrimary: new THREE.Vector3(...CHRONOS_SHADER_COLORS.violetReal),
    uColorSecondary: new THREE.Vector3(...CHRONOS_SHADER_COLORS.goldLiquid),
    uColorAccent: new THREE.Vector3(...CHRONOS_SHADER_COLORS.pinkElectric),
  },
  liquidMagneticOrbVertexShader,
  liquidMagneticOrbFragmentShader
)

// Registrar el material con R3F - CRÍTICO para TypeScript
extend({ InfinityOrbMaterial })

// Tipo del material para refs - usar ShaderMaterial base para compatibilidad
type InfinityOrbMaterialImpl = THREE.ShaderMaterial & {
  uTime: number
  uIntensity: number
  uMouse: THREE.Vector2
  uAudioLevel: number
  uColorPrimary: THREE.Vector3
  uColorSecondary: THREE.Vector3
  uColorAccent: THREE.Vector3
}

// Constructor type para ThreeElement
type InfinityOrbMaterialConstructor = new () => InfinityOrbMaterialImpl

// Declaración de tipo para el material extendido en R3F
declare module '@react-three/fiber' {
  interface ThreeElements {
    infinityOrbMaterial: ThreeElement<InfinityOrbMaterialConstructor>
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ESTADOS
// ════════════════════════════════════════════════════════════════════════════════════════
const STATE_CONFIG: Record<OrbState, {
  intensity: number
  primary: [number, number, number]
  secondary: [number, number, number]
  accent: [number, number, number]
  rotationSpeed: number
  pulseSpeed: number
}> = {
  idle: {
    intensity: 0.6,
    primary: CHRONOS_SHADER_COLORS.violetReal,
    secondary: CHRONOS_SHADER_COLORS.goldLiquid,
    accent: CHRONOS_SHADER_COLORS.pinkElectric,
    rotationSpeed: 0.3,
    pulseSpeed: 1.0,
  },
  listening: {
    intensity: 0.8,
    primary: CHRONOS_SHADER_COLORS.goldLiquid,
    secondary: CHRONOS_SHADER_COLORS.violetReal,
    accent: CHRONOS_SHADER_COLORS.pinkElectric,
    rotationSpeed: 0.5,
    pulseSpeed: 1.5,
  },
  thinking: {
    intensity: 1.0,
    primary: CHRONOS_SHADER_COLORS.violetReal,
    secondary: CHRONOS_SHADER_COLORS.pinkElectric,
    accent: CHRONOS_SHADER_COLORS.goldLiquid,
    rotationSpeed: 1.2,
    pulseSpeed: 2.5,
  },
  speaking: {
    intensity: 1.2,
    primary: CHRONOS_SHADER_COLORS.goldLiquid,
    secondary: CHRONOS_SHADER_COLORS.violetReal,
    accent: CHRONOS_SHADER_COLORS.pinkElectric,
    rotationSpeed: 0.8,
    pulseSpeed: 2.0,
  },
  error: {
    intensity: 1.5,
    primary: CHRONOS_SHADER_COLORS.pinkElectric,
    secondary: [0.8, 0.0, 0.2],
    accent: CHRONOS_SHADER_COLORS.violetReal,
    rotationSpeed: 0.2,
    pulseSpeed: 4.0,
  },
  success: {
    intensity: 1.3,
    primary: [0.2, 1.0, 0.5],
    secondary: CHRONOS_SHADER_COLORS.goldLiquid,
    accent: CHRONOS_SHADER_COLORS.violetReal,
    rotationSpeed: 0.6,
    pulseSpeed: 1.2,
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE ANILLOS ORBITALES
// ════════════════════════════════════════════════════════════════════════════════════════
function OrbitalRings({ state, audioLevel }: { state: OrbState; audioLevel: number }) {
  const ringRef1 = useRef<THREE.Mesh>(null)
  const ringRef2 = useRef<THREE.Mesh>(null)
  const ringRef3 = useRef<THREE.Mesh>(null)
  
  const config = STATE_CONFIG[state]
  
  useFrame((_, delta) => {
    if (ringRef1.current) {
      ringRef1.current.rotation.x += delta * config.rotationSpeed * 0.5
      ringRef1.current.rotation.y += delta * config.rotationSpeed * 0.3
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x -= delta * config.rotationSpeed * 0.4
      ringRef2.current.rotation.z += delta * config.rotationSpeed * 0.6
    }
    if (ringRef3.current) {
      ringRef3.current.rotation.y += delta * config.rotationSpeed * 0.7
      ringRef3.current.rotation.z -= delta * config.rotationSpeed * 0.2
    }
  })
  
  const ringMaterial = useMemo(() => (
    <meshBasicMaterial
      color={new THREE.Color(...config.secondary)}
      transparent
      opacity={0.15 + audioLevel * 0.2}
      side={THREE.DoubleSide}
      wireframe
    />
  ), [config.secondary, audioLevel])
  
  return (
    <group>
      {/* Anillo 1 - Horizontal */}
      <mesh ref={ringRef1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5 + audioLevel * 0.2, 0.02, 16, 64]} />
        {ringMaterial}
      </mesh>
      
      {/* Anillo 2 - Inclinado */}
      <mesh ref={ringRef2} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[1.7 + audioLevel * 0.15, 0.015, 16, 64]} />
        {ringMaterial}
      </mesh>
      
      {/* Anillo 3 - Vertical */}
      <mesh ref={ringRef3} rotation={[0, 0, Math.PI / 3]}>
        <torusGeometry args={[1.9 + audioLevel * 0.1, 0.01, 16, 64]} />
        {ringMaterial}
      </mesh>
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE PARTÍCULAS ORBITALES
// ════════════════════════════════════════════════════════════════════════════════════════
function OrbitalParticles({ state, audioLevel }: { state: OrbState; audioLevel: number }) {
  const particlesRef = useRef<THREE.Points>(null)
  const config = STATE_CONFIG[state]
  
  const { positions, colors, scales } = useMemo(() => {
    const count = 100
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const scl = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 1.8 + Math.random() * 0.5
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
      
      const colorChoice = Math.random()
      const color = colorChoice < 0.5 ? CHRONOS_SHADER_COLORS.goldLiquid : CHRONOS_SHADER_COLORS.violetReal
      col[i * 3] = color[0]
      col[i * 3 + 1] = color[1]
      col[i * 3 + 2] = color[2]
      
      scl[i] = 0.5 + Math.random() * 0.5
    }
    
    return { positions: pos, colors: col, scales: scl }
  }, [])
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * config.rotationSpeed * 0.3
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      
      // Pulso reactivo al audio
      particlesRef.current.scale.setScalar(1 + audioLevel * 0.2)
    }
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6 + audioLevel * 0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL - INFINITY ORB
// ════════════════════════════════════════════════════════════════════════════════════════
export default function InfinityOrb({
  state = 'idle',
  audioLevel = 0,
  scale = 1,
  position = [0, 0, 0],
  onClick,
  showRings = true,
  glowIntensity = 1,
}: InfinityOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const mouseRef = useRef(new THREE.Vector2(0, 0))
  const { viewport, pointer } = useThree()
  
  const stateConfig = STATE_CONFIG[state]
  
  // Spring animation para transiciones suaves
  const springProps = useSpring({
    scale: scale * (1 + audioLevel * 0.15),
    intensity: stateConfig.intensity * glowIntensity,
    config: config.gentle,
  })
  
  // Actualizar posición del mouse
  useEffect(() => {
    const handleMouseMove = () => {
      mouseRef.current.set(pointer.x, pointer.y)
    }
    handleMouseMove()
  }, [pointer])
  
  // Animación del frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uMouse.value = mouseRef.current
      materialRef.current.uniforms.uAudioLevel.value = audioLevel
      materialRef.current.uniforms.uIntensity.value = stateConfig.intensity
      
      // Actualizar colores con transición suave
      const primaryVec = materialRef.current.uniforms.uColorPrimary.value as THREE.Vector3
      const secondaryVec = materialRef.current.uniforms.uColorSecondary.value as THREE.Vector3
      const accentVec = materialRef.current.uniforms.uColorAccent.value as THREE.Vector3
      
      primaryVec.lerp(new THREE.Vector3(...stateConfig.primary), delta * 3)
      secondaryVec.lerp(new THREE.Vector3(...stateConfig.secondary), delta * 3)
      accentVec.lerp(new THREE.Vector3(...stateConfig.accent), delta * 3)
    }
    
    if (meshRef.current) {
      // Rotación suave
      meshRef.current.rotation.y += delta * stateConfig.rotationSpeed * 0.5
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * stateConfig.pulseSpeed * 0.3) * 0.1
    }
  })
  
  // Handler de click
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])
  
  return (
    <Float
      speed={1.5}
      rotationIntensity={0.3}
      floatIntensity={0.5}
    >
      <animated.group
        position={position}
        scale={springProps.scale}
      >
        {/* Orbe principal con shader */}
        <mesh
          ref={meshRef}
          onClick={handleClick}
        >
          <icosahedronGeometry args={[1, 64]} />
          <infinityOrbMaterial
            ref={materialRef}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Núcleo interno brillante */}
        <mesh scale={0.4}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={new THREE.Color(...stateConfig.secondary)}
            transparent
            opacity={0.8 + audioLevel * 0.2}
          />
        </mesh>
        
        {/* Glow exterior */}
        <mesh scale={1.3}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={new THREE.Color(...stateConfig.primary)}
            transparent
            opacity={0.1 * glowIntensity}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Anillos orbitales opcionales */}
        {showRings && (
          <OrbitalRings state={state} audioLevel={audioLevel} />
        )}
        
        {/* Partículas orbitales */}
        <OrbitalParticles state={state} audioLevel={audioLevel} />
      </animated.group>
    </Float>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// EXPORTACIONES ADICIONALES
// ════════════════════════════════════════════════════════════════════════════════════════
export { OrbitalRings, OrbitalParticles, STATE_CONFIG }
