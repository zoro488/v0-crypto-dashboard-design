'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * ✨ CHRONOS INFINITY - QUANTUM DUST PARTICLES
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Partículas de fondo como polvo de estrellas
 * 800 partículas violeta/oro flotando suavemente
 * Reaccionan sutilmente al cursor
 * 
 * Performance: 120+ FPS garantizado
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, useEffect, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════════════════

const PARTICLE_COUNT = 800
const COLORS = {
  violet: new THREE.Color('#8B00FF'),
  gold: new THREE.Color('#FFD700'),
  pink: new THREE.Color('#FF1493'),
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SHADER
// ════════════════════════════════════════════════════════════════════════════════════════

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseInfluence;
  
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aColor;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vColor = aColor;
    
    vec3 pos = position;
    
    // Movimiento sinusoide muy lento
    float wave = sin(uTime * 0.1 + aPhase) * 0.5;
    pos.x += wave * 0.3;
    pos.y += cos(uTime * 0.08 + aPhase * 1.3) * 0.4;
    pos.z += sin(uTime * 0.06 + aPhase * 0.7) * 0.2;
    
    // Reacción sutil al mouse (15% fuerza)
    vec2 mouseOffset = uMouse * uMouseInfluence;
    float dist = length(vec2(pos.x, pos.y) - mouseOffset * 10.0);
    float influence = smoothstep(5.0, 0.0, dist) * 0.15;
    pos.x += (uMouse.x - 0.5) * influence;
    pos.y += (uMouse.y - 0.5) * influence;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Tamaño basado en distancia + escala individual
    gl_PointSize = aScale * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 6.0);
    
    // Alpha basado en profundidad
    vAlpha = smoothstep(20.0, 5.0, -mvPosition.z) * 0.8;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Círculo suave con glow
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    // Core brillante
    float core = 1.0 - smoothstep(0.0, 0.3, dist);
    
    // Glow suave
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    
    float alpha = (core * 0.8 + glow * 0.4) * vAlpha;
    
    if (alpha < 0.01) discard;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE PARTÍCULAS
// ════════════════════════════════════════════════════════════════════════════════════════

function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const { viewport } = useThree()
  
  // Generar geometría
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const scales = new Float32Array(PARTICLE_COUNT)
    const phases = new Float32Array(PARTICLE_COUNT)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Posición aleatoria en espacio 3D
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5
      
      // Escala individual 1-4px
      scales[i] = 1 + Math.random() * 3
      
      // Fase para animación
      phases[i] = Math.random() * Math.PI * 2
      
      // Color: 60% violeta, 30% oro, 10% rosa
      const colorChoice = Math.random()
      const color = colorChoice < 0.6 
        ? COLORS.violet 
        : colorChoice < 0.9 
          ? COLORS.gold 
          : COLORS.pink
      
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseInfluence: { value: 0.15 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    
    return { geometry: geo, material: mat }
  }, [])
  
  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth
      mouseRef.current.y = 1 - e.clientY / window.innerHeight
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // Animación
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const mat = pointsRef.current.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
  })
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  )
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════

interface QuantumDustProps {
  className?: string
}

function QuantumDust({ className = '' }: QuantumDustProps) {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return null
  }
  
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ 
          antialias: false, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
      >
        <DustParticles />
      </Canvas>
    </div>
  )
}

export default memo(QuantumDust)
