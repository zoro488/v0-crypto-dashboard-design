'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * ✨ PARTICLE SWARM 3D - SISTEMA DE PARTÍCULAS GPGPU ULTRA-PREMIUM
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de partículas de alto rendimiento (50,000+) renderizado completamente en GPU
 * Física de enjambre con Curl Noise para movimiento fluido sin divergencia
 * 
 * PALETA CHRONOS INFINITY (CYAN PROHIBIDO):
 * - Violeta Real: #8B00FF
 * - Oro Líquido: #FFD700
 * - Rosa Eléctrico: #FF1493
 * 
 * Características:
 * - 60fps con 50,000 partículas
 * - Atracción gravitacional hacia centro
 * - Repulsión magnética del mouse
 * - Curl Noise para movimiento orgánico
 * - Color dinámico basado en estado
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import {
  particleSwarmVertexShader,
  particleSwarmFragmentShader,
  CHRONOS_SHADER_COLORS,
} from './shaders/InfinityShaders'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════
export interface ParticleSwarmProps {
  /** Número de partículas (default: 30000) */
  count?: number
  /** Radio de la esfera de partículas */
  radius?: number
  /** Intensidad de procesamiento (0-1) - afecta velocidad y color */
  processingIntensity?: number
  /** Fuerza de atracción al centro (0-1) */
  attraction?: number
  /** Fuerza de repulsión del mouse (0-1) */
  repulsion?: number
  /** Esquema de color */
  colorScheme?: 'default' | 'fire' | 'ice' | 'matrix'
  /** Callback cuando cambia el estado visual */
  onStateChange?: (state: 'idle' | 'processing' | 'peak') => void
}

// ════════════════════════════════════════════════════════════════════════════════════════
// PALETAS DE COLORES
// ════════════════════════════════════════════════════════════════════════════════════════
const COLOR_PALETTES = {
  default: {
    primary: CHRONOS_SHADER_COLORS.violetReal,
    secondary: CHRONOS_SHADER_COLORS.goldLiquid,
    accent: CHRONOS_SHADER_COLORS.pinkElectric,
  },
  fire: {
    primary: [1.0, 0.3, 0.0] as [number, number, number],
    secondary: [1.0, 0.6, 0.0] as [number, number, number],
    accent: [1.0, 0.1, 0.0] as [number, number, number],
  },
  ice: {
    primary: [0.2, 0.6, 1.0] as [number, number, number],
    secondary: [0.4, 0.8, 1.0] as [number, number, number],
    accent: [0.6, 0.3, 1.0] as [number, number, number],
  },
  matrix: {
    primary: [0.0, 1.0, 0.3] as [number, number, number],
    secondary: [0.2, 0.8, 0.2] as [number, number, number],
    accent: [0.0, 1.0, 0.5] as [number, number, number],
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// MATERIAL SHADER PERSONALIZADO
// ════════════════════════════════════════════════════════════════════════════════════════
const ParticleSwarmMaterial = shaderMaterial(
  {
    uTime: 0,
    uPixelRatio: 1,
    uMouse: new THREE.Vector2(0, 0),
    uProcessing: 0,
    uAttraction: 0.5,
    uRepulsion: 0.8,
  },
  particleSwarmVertexShader,
  particleSwarmFragmentShader
)

extend({ ParticleSwarmMaterial })

// Tipo del material para refs
type ParticleSwarmMaterialImpl = THREE.ShaderMaterial & {
  uTime: number
  uPixelRatio: number
  uMouse: THREE.Vector2
  uProcessing: number
  uAttraction: number
  uRepulsion: number
}

// Constructor type para ThreeElement
type ParticleSwarmMaterialConstructor = new () => ParticleSwarmMaterialImpl

// Declaración de tipo para el material extendido en R3F
declare module '@react-three/fiber' {
  interface ThreeElements {
    particleSwarmMaterial: import('@react-three/fiber').ThreeElement<ParticleSwarmMaterialConstructor>
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════
export default function ParticleSwarm({
  count = 30000,
  radius = 2.5,
  processingIntensity = 0,
  attraction = 0.5,
  repulsion = 0.8,
  colorScheme = 'default',
  onStateChange,
}: ParticleSwarmProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const mouseRef = useRef(new THREE.Vector2(0, 0))
  const { viewport, pointer, gl } = useThree()
  
  // Estado previo para detectar cambios
  const prevIntensityRef = useRef(0)
  
  // ══════════════════════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE GEOMETRÍA (Solo una vez)
  // ══════════════════════════════════════════════════════════════════════════════════════
  const { positions, scales, phases, velocities, colorMixes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const scl = new Float32Array(count)
    const phs = new Float32Array(count)
    const vel = new Float32Array(count * 3)
    const clr = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Distribución esférica con densidad gaussiana en el centro
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      
      // Distribución gaussiana para núcleo más denso
      const gaussianRandom = () => {
        let u = 0, v = 0
        while (u === 0) u = Math.random()
        while (v === 0) v = Math.random()
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
      }
      
      const r = radius * (0.3 + Math.abs(gaussianRandom()) * 0.7)
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      
      // Escala aleatoria con tendencia a pequeño
      scl[i] = 0.5 + Math.random() * 0.5 * Math.pow(Math.random(), 2)
      
      // Fase de animación única
      phs[i] = Math.random()
      
      // Velocidad inicial aleatoria
      vel[i * 3] = (Math.random() - 0.5) * 0.1
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.1
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.1
      
      // Mezcla de color para variación
      clr[i] = Math.random()
    }
    
    return { 
      positions: pos, 
      scales: scl, 
      phases: phs, 
      velocities: vel,
      colorMixes: clr,
    }
  }, [count, radius])
  
  // ══════════════════════════════════════════════════════════════════════════════════════
  // GEOMETRÍA
  // ══════════════════════════════════════════════════════════════════════════════════════
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3))
    geo.setAttribute('aColorMix', new THREE.BufferAttribute(colorMixes, 1))
    return geo
  }, [positions, scales, phases, velocities, colorMixes])
  
  // ══════════════════════════════════════════════════════════════════════════════════════
  // DETECCIÓN DE CAMBIO DE ESTADO
  // ══════════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!onStateChange) return
    
    const prev = prevIntensityRef.current
    const curr = processingIntensity
    
    if (curr > 0.7 && prev <= 0.7) {
      onStateChange('peak')
    } else if (curr > 0.1 && prev <= 0.1) {
      onStateChange('processing')
    } else if (curr <= 0.1 && prev > 0.1) {
      onStateChange('idle')
    }
    
    prevIntensityRef.current = curr
  }, [processingIntensity, onStateChange])
  
  // ══════════════════════════════════════════════════════════════════════════════════════
  // ANIMACIÓN DEL FRAME
  // ══════════════════════════════════════════════════════════════════════════════════════
  useFrame((state, delta) => {
    if (!materialRef.current) return
    
    // Actualizar uniforms
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    materialRef.current.uniforms.uPixelRatio.value = gl.getPixelRatio()
    materialRef.current.uniforms.uProcessing.value = processingIntensity
    materialRef.current.uniforms.uAttraction.value = attraction
    materialRef.current.uniforms.uRepulsion.value = repulsion
    
    // Suavizar movimiento del mouse
    const targetX = (pointer.x * viewport.width) / 2
    const targetY = (pointer.y * viewport.height) / 2
    mouseRef.current.lerp(new THREE.Vector2(targetX, targetY), 0.08)
    materialRef.current.uniforms.uMouse.value = mouseRef.current
    
    // Rotación suave del sistema
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05 * (1 + processingIntensity * 0.5)
    }
  })
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <particleSwarmMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE WRAPPER CON ESCENA COMPLETA
// ════════════════════════════════════════════════════════════════════════════════════════
export function ParticleSwarmScene({
  processingIntensity = 0,
  ...props
}: ParticleSwarmProps) {
  return (
    <group>
      {/* Partículas principales */}
      <ParticleSwarm 
        processingIntensity={processingIntensity}
        {...props}
      />
      
      {/* Partículas de fondo (menos densas, más grandes) */}
      <ParticleSwarm
        count={5000}
        radius={5}
        processingIntensity={processingIntensity * 0.5}
        attraction={0.3}
        repulsion={0.4}
      />
      
      {/* Núcleo central brillante */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(...CHRONOS_SHADER_COLORS.goldLiquid)}
          transparent
          opacity={0.6 + processingIntensity * 0.3}
        />
      </mesh>
      
      {/* Glow del núcleo */}
      <mesh scale={1.5}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(...CHRONOS_SHADER_COLORS.violetReal)}
          transparent
          opacity={0.2 + processingIntensity * 0.15}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}
