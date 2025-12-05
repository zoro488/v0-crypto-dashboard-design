'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — SCROLL MIST
// Niebla violeta que reacciona al scroll
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MIST_COUNT = 300

interface ScrollMistProps {
  scrollProgress?: number
  intensity?: number
}

export function ScrollMist({ scrollProgress = 0, intensity = 1 }: ScrollMistProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const particles = useMemo(() => {
    const positions = new Float32Array(MIST_COUNT * 3)
    const phases = new Float32Array(MIST_COUNT)
    const sizes = new Float32Array(MIST_COUNT)
    
    for (let i = 0; i < MIST_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      
      phases[i] = Math.random() * Math.PI * 2
      sizes[i] = 0.5 + Math.random() * 1.5
    }
    
    return { positions, phases, sizes }
  }, [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    const scrollOffset = scrollProgress * 10
    
    for (let i = 0; i < MIST_COUNT; i++) {
      const phase = particles.phases[i]
      
      // Movimiento ondulante basado en scroll
      const x = particles.positions[i * 3] + Math.sin(time * 0.5 + phase) * 2
      const y = particles.positions[i * 3 + 1] + scrollOffset + Math.cos(time * 0.3 + phase) * 1
      const z = particles.positions[i * 3 + 2] + Math.sin(time * 0.4 + phase) * 1.5
      
      // Escala que pulsa con el scroll
      const scale = particles.sizes[i] * (1 + scrollProgress * 0.5) * intensity
      
      dummy.position.set(x, y % 20 - 10, z)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MIST_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color="#8B00FF"
        transparent
        opacity={0.08 * intensity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default ScrollMist
