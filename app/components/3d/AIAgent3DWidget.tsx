'use client'
/**
 * 🤖 AI AGENT 3D WIDGET - Entidad Neural Interactiva
 * 
 * Este componente crea un avatar 3D del asistente Chronos AI con:
 * - Seguimiento ocular del cursor (Look At)
 * - Efecto "Glitch" cuando procesa información
 * - Aura energética reactiva
 * - Partículas de pensamiento
 * - Estados visuales: idle, thinking, speaking
 */

import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float, Html, Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// SHADER DE HOLOGRAMA (reservados para uso futuro)
// ============================================================================
const _hologramVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Distorsión de onda
    float wave = sin(pos.y * 10.0 + uTime * 3.0) * 0.02;
    pos.x += wave;
    
    vElevation = pos.y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const _hologramFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uGlitch;
  
  varying vec2 vUv;
  varying float vElevation;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  void main() {
    // Líneas de escaneo
    float scanLine = sin(vUv.y * 100.0 + uTime * 5.0) * 0.1 + 0.9;
    
    // Efecto de glitch
    float glitchOffset = uGlitch * random(vec2(uTime * 10.0, vUv.y)) * 0.1;
    vec2 glitchUv = vec2(vUv.x + glitchOffset, vUv.y);
    
    // Fresnel effect (bordes brillantes)
    float fresnel = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0);
    
    // Color final
    vec3 color = uColor * scanLine;
    color += fresnel * uColor * 0.5;
    
    // Ruido de glitch
    if (uGlitch > 0.5) {
      float noise = random(vUv + uTime);
      if (noise > 0.95) {
        color = vec3(1.0);
      }
    }
    
    float alpha = uAlpha * scanLine * (0.6 + fresnel * 0.4);
    
    gl_FragColor = vec4(color, alpha);
  }
`

// ============================================================================
// PARTÍCULAS DE PENSAMIENTO
// ============================================================================
function ThinkingParticles({ active }: { active: boolean }) {
  const particlesRef = useRef<THREE.Points>(null!)
  const count = 50
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Posición inicial en esfera
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 0.5 + Math.random() * 0.3
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 0.5
      pos[i * 3 + 2] = r * Math.cos(phi)
      
      // Velocidad ascendente
      vel[i * 3] = (Math.random() - 0.5) * 0.01
      vel[i * 3 + 1] = Math.random() * 0.02 + 0.01
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }
    
    return { positions: pos, velocities: vel }
  }, [count])
  
  useFrame(() => {
    if (!particlesRef.current || !active) return
    
    const posAttr = particlesRef.current.geometry.attributes.position
    const posArray = posAttr.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3]
      posArray[i * 3 + 1] += velocities[i * 3 + 1]
      posArray[i * 3 + 2] += velocities[i * 3 + 2]
      
      // Reset cuando sube demasiado
      if (posArray[i * 3 + 1] > 1.5) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        const r = 0.3
        
        posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        posArray[i * 3 + 1] = 0.3
        posArray[i * 3 + 2] = r * Math.cos(phi)
      }
    }
    
    posAttr.needsUpdate = true
  })
  
  if (!active) return null
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#60a5fa"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ============================================================================
// AURA ENERGÉTICA
// ============================================================================
function EnergyAura({ intensity = 1, color = '#3b82f6' }: { intensity?: number; color?: string }) {
  const auraRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (auraRef.current) {
      const material = auraRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05 * intensity
      auraRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1 * intensity)
    }
  })
  
  return (
    <Sphere ref={auraRef} args={[0.8, 32, 32]} scale={1.2}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  )
}

// ============================================================================
// NÚCLEO DEL AGENTE (Esfera central)
// ============================================================================
function AgentCore({ isProcessing, mood }: { isProcessing: boolean; mood: 'idle' | 'thinking' | 'speaking' }) {
  const coreRef = useRef<THREE.Mesh>(null!)
  
  const moodColors = {
    idle: '#3b82f6',      // Azul
    thinking: '#f59e0b',  // Amarillo
    speaking: '#10b981',   // Verde
  }
  
  useFrame((state) => {
    if (coreRef.current) {
      // Rotación suave
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.5
      
      // Distorsión según estado
      const material = coreRef.current.material as THREE.MeshStandardMaterial & { distort?: number }
      if (material.distort !== undefined) {
        material.distort = isProcessing ? 0.4 : 0.2
      }
    }
  })
  
  return (
    <Sphere ref={coreRef} args={[0.5, 64, 64]}>
      <MeshDistortMaterial
        color={moodColors[mood]}
        emissive={moodColors[mood]}
        emissiveIntensity={isProcessing ? 0.8 : 0.4}
        roughness={0.2}
        metalness={0.8}
        distort={isProcessing ? 0.4 : 0.2}
        speed={isProcessing ? 5 : 2}
      />
    </Sphere>
  )
}

// ============================================================================
// ANILLOS ORBITALES
// ============================================================================
function OrbitalRings({ isProcessing }: { isProcessing: boolean }) {
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const ring3Ref = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const speed = isProcessing ? 3 : 1
    const t = state.clock.elapsedTime * speed
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5
      ring1Ref.current.rotation.z = t * 0.3
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.4
      ring2Ref.current.rotation.x = Math.PI / 4 + t * 0.2
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 0.6
      ring3Ref.current.rotation.y = -Math.PI / 3 + t * 0.25
    }
  })
  
  const ringMaterial = (color: string, opacity: number) => (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      side={THREE.DoubleSide}
      blending={THREE.AdditiveBlending}
    />
  )
  
  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.7, 0.02, 16, 100]} />
        {ringMaterial('#60a5fa', 0.6)}
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.85, 0.015, 16, 100]} />
        {ringMaterial('#a78bfa', 0.5)}
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.0, 0.01, 16, 100]} />
        {ringMaterial('#f472b6', 0.4)}
      </mesh>
    </group>
  )
}

// ============================================================================
// PROPS INTERFACE
// ============================================================================
interface AIAgent3DWidgetProps {
  isProcessing?: boolean
  mood?: 'idle' | 'thinking' | 'speaking'
  onClick?: () => void
  showLabel?: boolean
  labelText?: string
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function AIAgent3DWidget({
  isProcessing = false,
  mood = 'idle',
  onClick,
  showLabel = true,
  labelText = 'CHRONOS AI',
}: AIAgent3DWidgetProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const { pointer } = useThree()
  
  // Efecto de seguimiento de mirada
  useFrame(() => {
    if (!groupRef.current) return
    
    // Mirar hacia el cursor suavemente
    const targetX = pointer.y * 0.3
    const targetY = pointer.x * 0.3
    
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.05,
    )
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.05,
    )
    
    // Efecto de glitch cuando procesa
    if (isProcessing) {
      groupRef.current.position.x = (Math.random() - 0.5) * 0.05
      groupRef.current.position.y = (Math.random() - 0.5) * 0.05
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1)
    }
  })
  
  const currentMood = isProcessing ? 'thinking' : mood
  
  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
        setHovered(true)
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        setHovered(false)
      }}
      scale={hovered ? 1.1 : 1}
    >
      <Float
        speed={isProcessing ? 8 : 2}
        rotationIntensity={isProcessing ? 0.5 : 0.2}
        floatIntensity={isProcessing ? 0.8 : 0.3}
      >
        {/* Aura energética */}
        <EnergyAura 
          intensity={isProcessing ? 2 : 1} 
          color={isProcessing ? '#f59e0b' : '#3b82f6'} 
        />
        
        {/* Núcleo central */}
        <AgentCore isProcessing={isProcessing} mood={currentMood} />
        
        {/* Anillos orbitales */}
        <OrbitalRings isProcessing={isProcessing} />
        
        {/* Partículas de pensamiento */}
        <ThinkingParticles active={isProcessing} />
        
        {/* Luz puntual */}
        <pointLight
          distance={5}
          intensity={isProcessing ? 3 : 1.5}
          color={isProcessing ? '#f59e0b' : '#3b82f6'}
        />
      </Float>
      
      {/* Etiqueta HTML */}
      {showLabel && (
        <Html position={[0, 1.3, 0]} center transform sprite>
          <div
            className={`
              px-3 py-1.5 rounded-full text-xs font-mono font-bold 
              border backdrop-blur-md transition-all duration-300
              ${isProcessing
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse'
                : hovered
                  ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                  : 'bg-black/40 border-white/20 text-white/80'
              }
            `}
          >
            {isProcessing ? '⚡ ANALYZING...' : labelText}
          </div>
        </Html>
      )}
    </group>
  )
}
