'use client'

/**
 * 🔮 AIVoiceOrbGLTF - Orbe de Asistente de Voz 3D con GLTF
 * Carga directamente el modelo ai_voice_assistance_orb.gltf
 * 
 * Características:
 * - Modelo GLTF real del Spline Component
 * - Animaciones reactivas al estado
 * - Partículas orbitales
 * - Efectos de audio visualizer
 * - Interactividad premium
 */

import { useRef, useState, useEffect, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float, Sparkles, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Tipos
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error'

interface AIVoiceOrbGLTFProps {
  state?: OrbState
  audioLevel?: number
  onClick?: () => void
  onHover?: (hovered: boolean) => void
  scale?: number
  enableParticles?: boolean
  enableGlow?: boolean
}

// Colores por estado con gradientes premium
const STATE_COLORS: Record<OrbState, { 
  primary: string
  secondary: string
  emissive: string
  glow: string 
}> = {
  idle: { 
    primary: '#3b82f6', 
    secondary: '#60a5fa', 
    emissive: '#1d4ed8',
    glow: 'rgba(59, 130, 246, 0.5)',
  },
  listening: { 
    primary: '#22c55e', 
    secondary: '#4ade80', 
    emissive: '#16a34a',
    glow: 'rgba(34, 197, 94, 0.5)',
  },
  thinking: { 
    primary: '#a855f7', 
    secondary: '#c084fc', 
    emissive: '#7c3aed',
    glow: 'rgba(168, 85, 247, 0.5)',
  },
  speaking: { 
    primary: '#06b6d4', 
    secondary: '#22d3ee', 
    emissive: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.5)',
  },
  success: { 
    primary: '#10b981', 
    secondary: '#34d399', 
    emissive: '#059669',
    glow: 'rgba(16, 185, 129, 0.5)',
  },
  error: { 
    primary: '#ef4444', 
    secondary: '#f87171', 
    emissive: '#dc2626',
    glow: 'rgba(239, 68, 68, 0.5)',
  },
}

// Componente del modelo GLTF
function GLTFModel({ 
  state, 
  audioLevel = 0,
  onHover,
}: { 
  state: OrbState
  audioLevel: number
  onHover?: (hovered: boolean) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const colors = STATE_COLORS[state]
  
  // Cargar el modelo GLTF
  const { scene, nodes, materials } = useGLTF('/models/ai_voice_assistance_orb.gltf')
  
  useFrame((frameState, delta) => {
    if (!groupRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    
    // Rotación base suave
    groupRef.current.rotation.y += delta * 0.3
    
    // Pulso basado en estado
    const pulseSpeed = state === 'thinking' ? 4 : state === 'speaking' ? 6 : 2
    const pulseAmount = state === 'speaking' ? 0.1 + audioLevel * 0.15 : 0.05
    const scale = 1 + Math.sin(time * pulseSpeed) * pulseAmount
    
    groupRef.current.scale.setScalar(scale)
    
    // Efecto de hover
    if (hovered) {
      groupRef.current.rotation.x = Math.sin(time * 2) * 0.1
    }
  })

  // Clonar la escena y aplicar materiales personalizados
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Aplicar color emissive basado en estado
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material = child.material.clone()
            child.material.emissive = new THREE.Color(colors.emissive)
            child.material.emissiveIntensity = state === 'speaking' ? 0.5 + audioLevel : 0.2
          }
        }
      })
    }
  }, [scene, state, audioLevel, colors])

  return (
    <group 
      ref={groupRef}
      onPointerOver={() => { setHovered(true); onHover?.(true) }}
      onPointerOut={() => { setHovered(false); onHover?.(false) }}
    >
      <primitive object={scene.clone()} />
    </group>
  )
}

// Esfera de cristal envolvente premium
function CrystalShell({ 
  state, 
  audioLevel = 0,
  isHovered = false,
}: { 
  state: OrbState
  audioLevel: number
  isHovered: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const colors = STATE_COLORS[state]
  
  useFrame((frameState) => {
    if (!meshRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    const targetScale = isHovered ? 1.15 : 1.1
    const currentScale = meshRef.current.scale.x
    const newScale = currentScale + (targetScale - currentScale) * 0.1
    
    meshRef.current.scale.setScalar(newScale)
    meshRef.current.rotation.y -= 0.002
    meshRef.current.rotation.z = Math.sin(time * 0.3) * 0.05
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshTransmissionMaterial
        backside={false}
        samples={16}
        resolution={256}
        transmission={0.92}
        roughness={0.05}
        thickness={0.3}
        ior={1.5}
        chromaticAberration={0.03}
        clearcoat={1}
        attenuationDistance={0.8}
        attenuationColor={colors.primary}
        color="white"
        transparent
        opacity={0.4}
      />
    </mesh>
  )
}

// Anillos orbitales premium
function OrbitalRings({ 
  state, 
  audioLevel = 0, 
}: { 
  state: OrbState
  audioLevel: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const colors = STATE_COLORS[state]
  
  useFrame((frameState) => {
    if (!groupRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    const speed = state === 'thinking' ? 3 : state === 'speaking' ? 2 : 1
    
    groupRef.current.children.forEach((ring, i) => {
      ring.rotation.x = time * speed * 0.3 * (i % 2 === 0 ? 1 : -1)
      ring.rotation.y = time * speed * 0.2 * (i % 2 === 0 ? -1 : 1)
      
      const ringScale = 1 + audioLevel * 0.1 * (i + 1)
      ring.scale.setScalar(ringScale)
    })
  })

  return (
    <group ref={groupRef}>
      {[1.3, 1.5, 1.7].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}>
          <torusGeometry args={[radius, 0.015, 16, 100]} />
          <meshStandardMaterial
            color={colors.primary}
            emissive={colors.emissive}
            emissiveIntensity={0.5 + audioLevel * 0.5}
            transparent
            opacity={0.5 + audioLevel * 0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

// Ondas de pulso
function PulseWaves({ 
  state, 
  audioLevel = 0, 
}: { 
  state: OrbState
  audioLevel: number
}) {
  const wavesRef = useRef<THREE.Group>(null)
  const colors = STATE_COLORS[state]
  
  useFrame((frameState) => {
    if (!wavesRef.current) return
    if (state !== 'speaking' && state !== 'listening') return
    
    const time = frameState.clock.getElapsedTime()
    
    wavesRef.current.children.forEach((wave, i) => {
      if (wave instanceof THREE.Mesh) {
        const speed = state === 'speaking' ? 4 : 2
        const scale = 1.2 + i * 0.15 + Math.sin(time * speed + i) * audioLevel * 0.2
        wave.scale.setScalar(scale)
        
        if (wave.material instanceof THREE.MeshBasicMaterial) {
          wave.material.opacity = Math.max(0, 0.4 - i * 0.1) * (state === 'speaking' ? audioLevel : 0.5)
        }
      }
    })
  })

  if (state !== 'speaking' && state !== 'listening') return null

  return (
    <group ref={wavesRef}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2 + i * 0.15, 1.25 + i * 0.15, 64]} />
          <meshBasicMaterial
            color={colors.primary}
            transparent
            opacity={0.4 - i * 0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Partículas de energía
function EnergyParticles({ state }: { state: OrbState }) {
  const colors = STATE_COLORS[state]
  const speed = state === 'thinking' ? 2.5 : state === 'speaking' ? 1.5 : 0.5
  
  return (
    <Sparkles
      count={80}
      scale={4}
      size={3}
      speed={speed}
      color={colors.primary}
      opacity={0.7}
    />
  )
}

// Luz central dinámica
function CoreLight({ 
  state, 
  audioLevel = 0, 
}: { 
  state: OrbState
  audioLevel: number
}) {
  const lightRef = useRef<THREE.PointLight>(null)
  const colors = STATE_COLORS[state]
  
  useFrame(() => {
    if (!lightRef.current) return
    
    const baseIntensity = 3
    const audioBoost = audioLevel * 4
    const stateBoost = state === 'speaking' ? 2 : state === 'thinking' ? 1.5 : 1
    
    lightRef.current.intensity = baseIntensity + audioBoost * stateBoost
  })

  return (
    <pointLight
      ref={lightRef}
      color={colors.primary}
      intensity={3}
      distance={8}
      decay={2}
    />
  )
}

// Componente principal
export function AIVoiceOrbGLTF({
  state = 'idle',
  audioLevel = 0,
  onClick,
  onHover,
  scale = 1,
  enableParticles = true,
  enableGlow = true,
}: AIVoiceOrbGLTFProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const handleHover = (hovered: boolean) => {
    setIsHovered(hovered)
    onHover?.(hovered)
  }

  return (
    <Float
      speed={2}
      rotationIntensity={0.2}
      floatIntensity={0.4}
    >
      <group 
        ref={groupRef}
        onClick={onClick}
        scale={scale}
      >
        {/* Luz central */}
        <CoreLight state={state} audioLevel={audioLevel} />
        
        {/* Luz ambiental secundaria */}
        <ambientLight intensity={0.3} />
        
        {/* Modelo GLTF */}
        <Suspense fallback={<InnerSphereFallback state={state} audioLevel={audioLevel} />}>
          <GLTFModel 
            state={state} 
            audioLevel={audioLevel}
            onHover={handleHover}
          />
        </Suspense>
        
        {/* Shell de cristal */}
        <CrystalShell 
          state={state} 
          audioLevel={audioLevel} 
          isHovered={isHovered} 
        />
        
        {/* Anillos orbitales */}
        <OrbitalRings state={state} audioLevel={audioLevel} />
        
        {/* Ondas de pulso */}
        <PulseWaves state={state} audioLevel={audioLevel} />
        
        {/* Partículas */}
        {enableParticles && <EnergyParticles state={state} />}
      </group>
    </Float>
  )
}

// Fallback mientras carga el GLTF
function InnerSphereFallback({ 
  state, 
  audioLevel = 0, 
}: { 
  state: OrbState
  audioLevel: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const colors = STATE_COLORS[state]
  
  useFrame((frameState) => {
    if (!meshRef.current) return
    
    const time = frameState.clock.getElapsedTime()
    const scale = 0.8 + Math.sin(time * 3) * 0.05 + audioLevel * 0.1
    
    meshRef.current.scale.setScalar(scale)
    meshRef.current.rotation.y += 0.01
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial
        color={colors.primary}
        emissive={colors.emissive}
        emissiveIntensity={0.5}
        metalness={0.5}
        roughness={0.3}
      />
    </mesh>
  )
}

// Precargar el modelo GLTF
useGLTF.preload('/models/ai_voice_assistance_orb.gltf')

export default AIVoiceOrbGLTF
