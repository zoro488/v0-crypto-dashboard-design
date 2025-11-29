'use client'

/**
 * ZeroCombatScene - Escena 3D de combate táctica para Zero
 * 
 * Este componente crea el entorno completo 3D con:
 * - Iluminación dramática tipo cinematográfica
 * - Grid de combate holográfico
 * - Partículas flotantes de datos
 * - Efectos de niebla volumétrica simulada
 * - Targets flotantes de tracking
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Environment, 
  Float, 
  Stars, 
  Grid as DreiGrid,
  Sparkles,
  MeshDistortMaterial,
  GradientTexture,
} from '@react-three/drei'
import * as THREE from 'three'
import { ZeroAvatar, ZeroState } from './ZeroAvatar'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface ZeroCombatSceneProps {
  state: ZeroState
  speechAmplitude?: number
  onStateChange?: (state: ZeroState) => void
  showGrid?: boolean
  showParticles?: boolean
  showStars?: boolean
  cameraPosition?: [number, number, number]
  enableMouseTracking?: boolean
  className?: string
}

interface DataParticleProps {
  count: number
  radius: number
  color: string
}

interface HolographicGridProps {
  size: number
  divisions: number
  color: string
  opacity: number
}

interface FloatingTargetProps {
  position: [number, number, number]
  scale: number
  color: string
  pulseSpeed: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTÍCULAS DE DATOS FLOTANTES
// ═══════════════════════════════════════════════════════════════════════════════

function DataParticles({ count, radius, color }: DataParticleProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  // Inicializar posiciones y velocidades de partículas
  const initData = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Distribuir en esfera
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = radius * (0.5 + Math.random() * 0.5)
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      
      // Velocidades orbitales
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
      
      phases[i] = Math.random() * Math.PI * 2
    }
    
    return { positions, velocities, phases }
  }, [count, radius])
  
  useFrame((state) => {
    if (!meshRef.current || !initData) return
    
    const time = state.clock.elapsedTime
    const { positions, phases } = initData
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    
    for (let i = 0; i < count; i++) {
      // Actualizar posición con movimiento orbital
      const x = positions[i * 3] + Math.sin(time * 0.5 + phases[i]) * 0.1
      const y = positions[i * 3 + 1] + Math.cos(time * 0.3 + phases[i]) * 0.05
      const z = positions[i * 3 + 2] + Math.sin(time * 0.4 + phases[i] * 2) * 0.1
      
      position.set(x, y, z)
      
      // Escala pulsante
      const pulseScale = 0.03 + Math.sin(time * 2 + phases[i]) * 0.01
      scale.set(pulseScale, pulseScale, pulseScale)
      
      matrix.compose(position, quaternion, scale)
      meshRef.current.setMatrixAt(i, matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </instancedMesh>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRID HOLOGRÁFICO DE COMBATE
// ═══════════════════════════════════════════════════════════════════════════════

function HolographicGrid({ size, divisions, color, opacity }: HolographicGridProps) {
  const gridRef = useRef<THREE.GridHelper>(null)
  
  useFrame((state) => {
    if (!gridRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Efecto de pulso sutil
    const pulse = 0.9 + Math.sin(time * 0.5) * 0.1
    gridRef.current.material.opacity = opacity * pulse
  })
  
  return (
    <group position={[0, -2, 0]}>
      <gridHelper 
        ref={gridRef}
        args={[size, divisions, color, color]} 
        position={[0, 0, 0]}
      />
      
      {/* Líneas de grid adicionales con fade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={opacity * 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TARGETS FLOTANTES DE TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

function FloatingTarget({ position, scale, color, pulseSpeed }: FloatingTargetProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Rotación continua
    groupRef.current.rotation.z = time * 0.5
    
    // Escala pulsante
    const pulse = 1 + Math.sin(time * pulseSpeed) * 0.1
    groupRef.current.scale.setScalar(scale * pulse)
  })
  
  return (
    <Float 
      position={position}
      rotationIntensity={0.5}
      floatIntensity={0.5}
      speed={2}
    >
      <group ref={groupRef}>
        {/* Círculo exterior */}
        <mesh>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Círculo interior */}
        <mesh>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Cruz central */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.1, 1.6]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.1, 1.6]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILUMINACIÓN DRAMÁTICA
// ═══════════════════════════════════════════════════════════════════════════════

function DramaticLighting({ state }: { state: ZeroState }) {
  const spotRef = useRef<THREE.SpotLight>(null)
  
  // Colores de iluminación basados en estado
  const lightColors = useMemo(() => ({
    idle: '#1e40af',      // Azul profundo
    listening: '#0891b2', // Cyan
    speaking: '#059669',  // Verde
    processing: '#7c3aed', // Violeta
    combat: '#dc2626',    // Rojo intenso
    success: '#10b981',   // Verde esmeralda
    error: '#f97316',      // Naranja
  }), [])
  
  useFrame((stateThree) => {
    if (!spotRef.current) return
    
    const time = stateThree.clock.elapsedTime
    
    // Movimiento sutil de la luz principal
    spotRef.current.position.x = Math.sin(time * 0.3) * 2
    spotRef.current.position.z = Math.cos(time * 0.3) * 2
    
    // Intensidad pulsante en modo combate
    if (state === 'combat') {
      spotRef.current.intensity = 2 + Math.sin(time * 4) * 0.5
    } else {
      spotRef.current.intensity = 1.5
    }
  })
  
  return (
    <>
      {/* Luz ambiental base */}
      <ambientLight intensity={0.1} color="#1a1a2e" />
      
      {/* Luz principal (key light) */}
      <spotLight
        ref={spotRef}
        position={[5, 8, 5]}
        angle={0.4}
        penumbra={0.5}
        intensity={1.5}
        color={lightColors[state]}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Luz de relleno (fill light) */}
      <pointLight
        position={[-5, 3, -3]}
        intensity={0.3}
        color="#0ea5e9"
      />
      
      {/* Luz de contorno (rim light) */}
      <pointLight
        position={[0, 5, -8]}
        intensity={0.8}
        color="#dc2626"
      />
      
      {/* Luz inferior dramática */}
      <pointLight
        position={[0, -3, 0]}
        intensity={0.2}
        color={state === 'combat' ? '#dc2626' : '#1e40af'}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NIEBLA VOLUMÉTRICA SIMULADA
// ═══════════════════════════════════════════════════════════════════════════════

function VolumetricFog() {
  const fogRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!fogRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Movimiento lento de niebla
    fogRef.current.rotation.y = time * 0.05
    fogRef.current.position.y = -2 + Math.sin(time * 0.2) * 0.3
  })
  
  return (
    <mesh ref={fogRef} position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[15, 64]} />
      <meshBasicMaterial transparent opacity={0.15}>
        <GradientTexture
          stops={[0, 0.5, 1]}
          colors={['transparent', '#1e40af', 'transparent']}
        />
      </meshBasicMaterial>
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORBE DE ENERGÍA CENTRAL
// ═══════════════════════════════════════════════════════════════════════════════

function EnergyOrb({ state }: { state: ZeroState }) {
  const orbRef = useRef<THREE.Mesh>(null)
  
  const orbColors = useMemo(() => ({
    idle: '#3b82f6',
    listening: '#06b6d4',
    speaking: '#10b981',
    processing: '#8b5cf6',
    combat: '#ef4444',
    success: '#22c55e',
    error: '#f97316',
  }), [])
  
  useFrame((stateThree) => {
    if (!orbRef.current) return
    
    const time = stateThree.clock.elapsedTime
    
    // Rotación constante
    orbRef.current.rotation.x = time * 0.2
    orbRef.current.rotation.y = time * 0.3
    
    // Distorsión basada en estado
    const material = orbRef.current.material as THREE.ShaderMaterial
    if (material.uniforms && material.uniforms.distort) {
      material.uniforms.distort.value = state === 'combat' ? 0.5 : 0.3
    }
  })
  
  return (
    <Float
      position={[0, -1.5, 0]}
      speed={1}
      rotationIntensity={0.5}
      floatIntensity={0.3}
    >
      <mesh ref={orbRef} scale={0.5}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color={orbColors[state]}
          emissive={orbColors[state]}
          emissiveIntensity={0.5}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESCENA PRINCIPAL DE COMBATE
// ═══════════════════════════════════════════════════════════════════════════════

function SceneContent({ 
  state, 
  speechAmplitude, 
  showGrid, 
  showParticles, 
  showStars,
  enableMouseTracking,
}: Omit<ZeroCombatSceneProps, 'className' | 'cameraPosition' | 'onStateChange'>) {
  
  const gridColor = useMemo(() => {
    switch (state) {
      case 'combat': return '#ef4444'
      case 'success': return '#22c55e'
      case 'error': return '#f97316'
      case 'processing': return '#8b5cf6'
      default: return '#3b82f6'
    }
  }, [state])
  
  return (
    <>
      {/* Iluminación dramática */}
      <DramaticLighting state={state} />
      
      {/* Estrellas de fondo */}
      {showStars && (
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
      )}
      
      {/* Grid holográfico */}
      {showGrid && (
        <HolographicGrid
          size={30}
          divisions={30}
          color={gridColor}
          opacity={0.3}
        />
      )}
      
      {/* Partículas de datos */}
      {showParticles && (
        <>
          <DataParticles count={150} radius={8} color={gridColor} />
          <Sparkles
            count={100}
            scale={15}
            size={2}
            speed={0.3}
            opacity={0.5}
            color={gridColor}
          />
        </>
      )}
      
      {/* Targets de tracking flotantes */}
      {state === 'combat' && (
        <>
          <FloatingTarget 
            position={[-4, 1, -3]} 
            scale={0.5} 
            color="#ef4444" 
            pulseSpeed={3}
          />
          <FloatingTarget 
            position={[3, 2, -4]} 
            scale={0.4} 
            color="#ef4444" 
            pulseSpeed={4}
          />
          <FloatingTarget 
            position={[5, 0, -2]} 
            scale={0.3} 
            color="#ef4444" 
            pulseSpeed={5}
          />
        </>
      )}
      
      {/* Niebla volumétrica */}
      <VolumetricFog />
      
      {/* Orbe de energía */}
      <EnergyOrb state={state} />
      
      {/* Avatar de Zero */}
      <ZeroAvatar
        state={state}
        speechAmplitude={speechAmplitude || 0}
        lookAtMouse={enableMouseTracking}
        scale={1.2}
      />
      
      {/* Environment HDR para reflejos */}
      <Environment preset="night" />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL EXPORTADO
// ═══════════════════════════════════════════════════════════════════════════════

export function ZeroCombatScene({
  state = 'idle',
  speechAmplitude = 0,
  onStateChange,
  showGrid = true,
  showParticles = true,
  showStars = true,
  cameraPosition = [0, 0, 6],
  enableMouseTracking = true,
  className = '',
}: ZeroCombatSceneProps) {
  
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        {/* Niebla de escena */}
        <fog attach="fog" args={['#0a0a0f', 10, 50]} />
        
        {/* Contenido de la escena */}
        <SceneContent
          state={state}
          speechAmplitude={speechAmplitude}
          showGrid={showGrid}
          showParticles={showParticles}
          showStars={showStars}
          enableMouseTracking={enableMouseTracking}
        />
      </Canvas>
    </div>
  )
}

export type { ZeroCombatSceneProps }
export default ZeroCombatScene
