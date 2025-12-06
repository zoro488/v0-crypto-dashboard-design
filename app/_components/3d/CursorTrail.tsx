'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — CURSOR TRAIL PARTICLES
// Estela magnética de partículas que siguen al cursor
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const TRAIL_COUNT = 50
const COLORS = ['#8B00FF', '#FFD700', '#FF1493']

interface CursorTrailProps {
  intensity?: number
}

export function CursorTrail({ intensity = 1 }: CursorTrailProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { viewport } = useThree()
  
  // Trail history
  const trail = useMemo(() => {
    return Array(TRAIL_COUNT).fill(null).map(() => ({
      x: 0,
      y: 0,
      z: 0,
      scale: 0,
      opacity: 0
    }))
  }, [])
  
  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      setMousePos({ x, y })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Update trail
    for (let i = TRAIL_COUNT - 1; i > 0; i--) {
      trail[i].x = trail[i - 1].x
      trail[i].y = trail[i - 1].y
      trail[i].z = trail[i - 1].z
      trail[i].scale = trail[i - 1].scale * 0.95
      trail[i].opacity = trail[i - 1].opacity * 0.9
    }
    
    // Head of trail follows mouse
    trail[0].x = mousePos.x * viewport.width * 0.5
    trail[0].y = mousePos.y * viewport.height * 0.5
    trail[0].z = 0
    trail[0].scale = 0.15 * intensity
    trail[0].opacity = 1
    
    // Update instances
    for (let i = 0; i < TRAIL_COUNT; i++) {
      dummy.position.set(trail[i].x, trail[i].y, trail[i].z)
      dummy.scale.setScalar(trail[i].scale * (1 + Math.sin(time * 3 + i * 0.3) * 0.2))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TRAIL_COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#8B00FF"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default CursorTrail
