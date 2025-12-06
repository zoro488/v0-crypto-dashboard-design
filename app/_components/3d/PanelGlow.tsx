'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PANEL GLOW PARTICLES  
// Partículas que suben al hacer hover en paneles
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 100

interface PanelGlowProps {
  active?: boolean
  position?: [number, number, number]
  color?: string
  intensity?: number
}

export function PanelGlow({ 
  active = false, 
  position = [0, 0, 0],
  color = '#8B00FF',
  intensity = 1 
}: PanelGlowProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const particles = useMemo(() => {
    const data = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * 4,
        y: 0,
        z: (Math.random() - 0.5) * 4,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        size: 0.02 + Math.random() * 0.04
      })
    }
    return data
  }, [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    const targetOpacity = active ? 1 : 0
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]
      
      // Solo animar si está activo
      if (active) {
        p.y += p.speed * 0.02
        if (p.y > 3) {
          p.y = 0
          p.x = (Math.random() - 0.5) * 4
          p.z = (Math.random() - 0.5) * 4
        }
      }
      
      const wobble = Math.sin(time * 2 + p.phase) * 0.1
      const scale = active ? p.size * intensity * (1 - p.y / 3) : 0
      
      dummy.position.set(
        position[0] + p.x + wobble,
        position[1] + p.y,
        position[2] + p.z
      )
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default PanelGlow
