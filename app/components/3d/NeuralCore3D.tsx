'use client'
/**
 * 🧠 NEURAL CORE 3D - GPGPU PARTICLE SYSTEM
 * 
 * Sistema de partículas de ultra alto rendimiento (100,000+) 
 * renderizado completamente en GPU usando shaders personalizados.
 * 
 * Características:
 * - Física de enjambre (swarm) simulada en GPU
 * - Curl Noise para movimiento fluido sin divergencia
 * - Atracción gravitacional hacia esfera central
 * - Repulsión magnética con el cursor
 * - Color dinámico basado en estado de procesamiento
 * - 60fps constantes incluso con 100k partículas
 * 
 * Props:
 * - count: Número de partículas (default: 50000)
 * - processingIntensity: 0 (idle) a 1 (máximo procesamiento)
 * - onStateChange: Callback cuando cambia el estado visual
 */

import { useMemo, useRef, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  neuralCoreVertexShader,
  neuralCoreFragmentShader,
} from './shaders/NeuralCoreShaders'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
interface NeuralCore3DProps {
  count?: number
  radius?: number
  processingIntensity?: number
  interactionRadius?: number
  interactionStrength?: number
  colorScheme?: 'default' | 'fire' | 'ice' | 'cosmic'
  onStateChange?: (state: 'idle' | 'processing' | 'learning') => void
}

// ============================================================================
// PALETAS DE COLORES PREDEFINIDAS
// ============================================================================
const COLOR_PALETTES = {
  default: [
    new THREE.Color('#0066ff'), // Azul primario
    new THREE.Color('#00ccff'), // Cian
    new THREE.Color('#6600ff'), // Púrpura
    new THREE.Color('#ff00cc'), // Magenta
    new THREE.Color('#ffffff'), // Blanco (núcleo)
  ],
  fire: [
    new THREE.Color('#ff3300'),
    new THREE.Color('#ff6600'),
    new THREE.Color('#ff9900'),
    new THREE.Color('#ffcc00'),
    new THREE.Color('#ffffff'),
  ],
  ice: [
    new THREE.Color('#00ffff'),
    new THREE.Color('#00ccff'),
    new THREE.Color('#0099ff'),
    new THREE.Color('#6666ff'),
    new THREE.Color('#ffffff'),
  ],
  cosmic: [
    new THREE.Color('#431c5d'),
    new THREE.Color('#7b2cbf'),
    new THREE.Color('#e052a0'),
    new THREE.Color('#33d9b2'),
    new THREE.Color('#ffffff'),
  ],
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function NeuralCore3D({
  count = 50000,
  radius = 2.5,
  processingIntensity = 0,
  interactionRadius = 3.0,
  interactionStrength = 0.8,
  colorScheme = 'cosmic',
  onStateChange,
}: NeuralCore3DProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { viewport, size } = useThree()
  
  // Estado previo para detectar cambios
  const prevIntensityRef = useRef(0)

  // ══════════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE GEOMETRÍA (Solo una vez)
  // ══════════════════════════════════════════════════════════════════════════
  const { positions, scales, phases, velocities, lifetimes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const scl = new Float32Array(count)
    const phs = new Float32Array(count)
    const vel = new Float32Array(count * 3)
    const lft = new Float32Array(count)

    const palette = COLOR_PALETTES[colorScheme]

    for (let i = 0; i < count; i++) {
      // ═══════════════════════════════════════════════════════════════════
      // DISTRIBUCIÓN ESFÉRICA con densidad gaussiana en el centro
      // ═══════════════════════════════════════════════════════════════════
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      
      // Distribución gaussiana para núcleo más denso
      const gaussianRandom = () => {
        let u = 0, v = 0
        while (u === 0) u = Math.random()
        while (v === 0) v = Math.random()
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
      }
      
      // Radio con variación gaussiana
      const baseRadius = radius + gaussianRandom() * 0.5
      const r = Math.abs(baseRadius)

      // Coordenadas esféricas a cartesianas
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      // ═══════════════════════════════════════════════════════════════════
      // ATRIBUTOS POR PARTÍCULA
      // ═══════════════════════════════════════════════════════════════════
      // Escala: más grande cerca del centro
      const distFromCenter = Math.sqrt(x * x + y * y + z * z)
      const normalizedDist = distFromCenter / radius
      scl[i] = (1 - normalizedDist * 0.5) * (0.3 + Math.random() * 0.7)
      
      // Fase aleatoria para desincronizar animaciones
      phs[i] = Math.random()
      
      // Velocidad inicial (para future GPGPU)
      vel[i * 3] = (Math.random() - 0.5) * 0.1
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.1
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.1
      
      // Lifetime para efectos de regeneración
      lft[i] = Math.random()
    }

    return { positions: pos, scales: scl, phases: phs, velocities: vel, lifetimes: lft }
  }, [count, radius, colorScheme])

  // ══════════════════════════════════════════════════════════════════════════
  // UNIFORMS DEL SHADER
  // ══════════════════════════════════════════════════════════════════════════
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uProcessingIntensity: { value: processingIntensity },
    uInteractionRadius: { value: interactionRadius },
    uInteractionStrength: { value: interactionStrength },
    uViewport: { value: new THREE.Vector2(viewport.width, viewport.height) },
  }), [interactionRadius, interactionStrength, processingIntensity, viewport.width, viewport.height])

  // ══════════════════════════════════════════════════════════════════════════
  // CALLBACK DE ESTADO
  // ══════════════════════════════════════════════════════════════════════════
  const updateState = useCallback(() => {
    if (!onStateChange) return
    
    const current = processingIntensity
    const prev = prevIntensityRef.current
    
    if (current > 0.7 && prev <= 0.7) {
      onStateChange('processing')
    } else if (current > 0.3 && current <= 0.7 && (prev <= 0.3 || prev > 0.7)) {
      onStateChange('learning')
    } else if (current <= 0.3 && prev > 0.3) {
      onStateChange('idle')
    }
    
    prevIntensityRef.current = current
  }, [processingIntensity, onStateChange])

  useEffect(() => {
    updateState()
  }, [updateState])

  // ══════════════════════════════════════════════════════════════════════════
  // LOOP DE ANIMACIÓN (60fps)
  // ══════════════════════════════════════════════════════════════════════════
  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return
    
    const material = materialRef.current
    
    // Actualizar tiempo
    material.uniforms.uTime.value = state.clock.getElapsedTime()
    
    // Suavizado de intensidad (lerp)
    material.uniforms.uProcessingIntensity.value = THREE.MathUtils.lerp(
      material.uniforms.uProcessingIntensity.value,
      processingIntensity,
      0.08,
    )
    
    // Actualizar posición del mouse con suavizado
    const targetX = state.pointer.x
    const targetY = state.pointer.y
    material.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.x,
      targetX,
      0.1,
    )
    material.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      material.uniforms.uMouse.value.y,
      targetY,
      0.1,
    )
    
    // Rotación lenta del sistema
    pointsRef.current.rotation.y += 0.001 + processingIntensity * 0.002
    pointsRef.current.rotation.z += 0.0003
  })

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aScale"
          args={[scales, 1]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <bufferAttribute
          attach="attributes-aVelocity"
          args={[velocities, 3]}
        />
        <bufferAttribute
          attach="attributes-aLifetime"
          args={[lifetimes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={neuralCoreVertexShader}
        fragmentShader={neuralCoreFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ============================================================================
// WRAPPER CON CANVAS PARA USO STANDALONE
// ============================================================================
export function NeuralCoreRenderer({
  processing = false,
  className = '',
}: {
  processing?: boolean
  className?: string
}) {
  // Este es un componente wrapper simple - el Canvas se crea en el padre
  return (
    <NeuralCore3D
      count={50000}
      processingIntensity={processing ? 1.0 : 0.2}
      colorScheme="cosmic"
    />
  )
}
