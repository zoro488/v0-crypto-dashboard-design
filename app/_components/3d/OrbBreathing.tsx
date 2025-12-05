'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — ORB BREATHING PARTICLES
// Partículas internas que respiran dentro de los orbes bancarios
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 200

interface OrbBreathingProps {
  color?: string
  intensity?: number
  breatheSpeed?: number
}

export function OrbBreathing({ 
  color = '#FFD700',
  intensity = 1,
  breatheSpeed = 1
}: OrbBreathingProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const particles = useMemo(() => {
    const data = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Posición esférica inicial
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const baseRadius = 0.3 + Math.random() * 0.5
      
      data.push({
        theta,
        phi,
        baseRadius,
        phase: Math.random() * Math.PI * 2,
        size: 0.01 + Math.random() * 0.02,
        orbitSpeed: 0.2 + Math.random() * 0.3
      })
    }
    return data
  }, [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime * breatheSpeed
    
    // Respiración global
    const breathe = 1 + Math.sin(time * 0.8) * 0.15 * intensity
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]
      
      // Órbita lenta
      const theta = p.theta + time * p.orbitSpeed
      const phi = p.phi + Math.sin(time * 0.5 + p.phase) * 0.1
      
      // Radio que respira
      const radius = p.baseRadius * breathe * (1 + Math.sin(time + p.phase) * 0.1)
      
      // Posición esférica
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      
      // Escala con pulso
      const scale = p.size * (1 + Math.sin(time * 2 + p.phase) * 0.3) * intensity
      
      dummy.position.set(x, y, z)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default OrbBreathing
