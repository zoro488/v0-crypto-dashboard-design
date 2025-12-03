'use client'

import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Sphere, MeshDistortMaterial, Float, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { useAudioAnalyzer, type AudioData } from '@/app/hooks/useAudioAnalyzer'

// ==========================================
// TIPOS E INTERFACES
// ==========================================
interface ReactiveOrbProps {
  isListening: boolean
  state: 'idle' | 'listening' | 'processing'
  getAudioData: () => AudioData
}

interface ParticleFieldProps {
  isActive: boolean
  audioLevel: number
}

// ==========================================
// CAMPO DE PARTÍCULAS PERIFÉRICAS
// ==========================================
function ParticleField({ isActive, audioLevel }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const particleCount = 1500
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      // Distribuir en una esfera hueca (entre radio 1.8 y 2.5)
      const radius = 1.8 + Math.random() * 0.7
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    
    const time = state.clock.elapsedTime
    // Rotación base + aceleración por audio
    const rotationSpeed = isActive ? 0.3 + audioLevel * 1.5 : 0.1
    pointsRef.current.rotation.y = time * rotationSpeed
    pointsRef.current.rotation.x = time * rotationSpeed * 0.3
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color={isActive ? '#22d3ee' : '#4b5563'}
        transparent
        opacity={isActive ? 0.8 : 0.4}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// ==========================================
// EL ORBE REACTIVO PRINCIPAL
// ==========================================
function ReactiveOrb({ isListening, state, getAudioData }: ReactiveOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null!)
  const innerGlowRef = useRef<THREE.Mesh>(null!)
  
  // Colores según estado
  const colors = useMemo(() => ({
    idle: {
      base: new THREE.Color('#0c0a20'),      // Azul noche profundo
      glow: new THREE.Color('#3730a3'),       // Indigo suave
    },
    listening: {
      low: new THREE.Color('#1e1b4b'),        // Violeta oscuro
      mid: new THREE.Color('#22d3ee'),        // Cian neón
      high: new THREE.Color('#f472b6'),       // Rosa neón
      peak: new THREE.Color('#fbbf24'),       // Oro
    },
    processing: {
      base: new THREE.Color('#1f2937'),       // Gris acero
      glow: new THREE.Color('#f8fafc'),       // Blanco brillante
    },
  }), [])

  useFrame((frameState) => {
    if (!meshRef.current || !materialRef.current) return
    
    const time = frameState.clock.elapsedTime
    const audio = getAudioData()
    
    // Rotación base
    meshRef.current.rotation.y = time * 0.15
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
    
    // === COMPORTAMIENTO SEGÚN ESTADO ===
    
    if (state === 'idle' || !isListening) {
      // Estado inactivo: respiración suave
      const breathe = Math.sin(time * 0.8) * 0.03 + 1
      meshRef.current.scale.setScalar(breathe)
      
      if (materialRef.current.distort !== undefined) {
        materialRef.current.distort = 0.2 + Math.sin(time) * 0.05
      }
      if (materialRef.current.speed !== undefined) {
        materialRef.current.speed = 1.5
      }
      materialRef.current.color.lerp(colors.idle.base, 0.05)
      materialRef.current.emissive?.lerp(colors.idle.glow, 0.05)
      
    } else if (state === 'processing') {
      // Estado procesando: giro rápido y contracción
      meshRef.current.rotation.y = time * 2
      const contract = 0.85 + Math.sin(time * 10) * 0.05
      meshRef.current.scale.setScalar(contract)
      
      if (materialRef.current.distort !== undefined) {
        materialRef.current.distort = 0.6
      }
      if (materialRef.current.speed !== undefined) {
        materialRef.current.speed = 8
      }
      materialRef.current.color.lerp(colors.processing.base, 0.1)
      materialRef.current.emissive?.lerp(colors.processing.glow, 0.1)
      
    } else {
      // Estado escuchando: reacción total al audio
      const { bass, mid, treble, average, peak } = audio
      
      // Distorsión basada en frecuencias
      // Bajos = deformación lenta y líquida
      // Agudos = picos rápidos y eléctricos
      const targetDistort = 0.3 + (bass * 0.8) + (treble * 0.5)
      const targetSpeed = 2 + (mid * 5) + (treble * 8)
      
      if (materialRef.current.distort !== undefined) {
        materialRef.current.distort = THREE.MathUtils.lerp(
          materialRef.current.distort, 
          targetDistort, 
          0.15,
        )
      }
      if (materialRef.current.speed !== undefined) {
        materialRef.current.speed = THREE.MathUtils.lerp(
          materialRef.current.speed, 
          targetSpeed, 
          0.1,
        )
      }
      
      // Escala pulsante con el beat
      const scale = 1 + (average * 0.4) + (peak * 0.2)
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.2),
      )
      
      // Color dinámico según intensidad
      let targetColor = colors.listening.low
      if (average > 0.15) targetColor = colors.listening.mid
      if (average > 0.4) targetColor = colors.listening.high
      if (peak > 0.7) targetColor = colors.listening.peak
      
      materialRef.current.color.lerp(targetColor, 0.1)
      materialRef.current.emissive?.lerp(targetColor, 0.05)
    }
    
    // Actualizar brillo interno
    if (innerGlowRef.current) {
      innerGlowRef.current.scale.copy(meshRef.current.scale).multiplyScalar(0.85)
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <group>
        {/* Núcleo brillante interno */}
        <Sphere args={[0.85, 32, 32]} ref={innerGlowRef}>
          <meshBasicMaterial 
            color={isListening ? '#22d3ee' : '#3730a3'} 
            transparent 
            opacity={0.3}
          />
        </Sphere>
        
        {/* Orbe principal con distorsión */}
        <Sphere args={[1, 128, 128]} ref={meshRef}>
          <MeshDistortMaterial
            ref={materialRef}
            color="#0c0a20"
            envMapIntensity={1.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.9}
            roughness={0.15}
            distort={0.25}
            speed={1.5}
            transparent
            opacity={0.95}
          />
        </Sphere>
        
        {/* Campo de partículas */}
        <ParticleField 
          isActive={isListening} 
          audioLevel={isListening ? 0.5 : 0} 
        />
      </group>
    </Float>
  )
}

// ==========================================
// ESCENA 3D COMPLETA
// ==========================================
interface AudioReactiveOrbSceneProps {
  isListening: boolean
  state: 'idle' | 'listening' | 'processing'
}

function Scene({ isListening, state }: AudioReactiveOrbSceneProps) {
  const { getAudioData } = useAudioAnalyzer(isListening)
  
  return (
    <>
      {/* Luces */}
      <ambientLight intensity={0.4} />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.15} 
        penumbra={1} 
        intensity={2} 
        color="#22d3ee" 
      />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#a855f7" />
      <pointLight position={[0, 5, 5]} intensity={1} color="#f472b6" />
      
      {/* Entorno para reflejos */}
      <Environment preset="night" />
      
      {/* El orbe */}
      <ReactiveOrb 
        isListening={isListening} 
        state={state}
        getAudioData={getAudioData}
      />
      
      {/* Post-procesamiento premium */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={isListening ? 2 : 1} 
          radius={0.7} 
        />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </>
  )
}

// ==========================================
// COMPONENTE EXPORTABLE
// ==========================================
export interface AudioReactiveOrbProps {
  isListening?: boolean
  state?: 'idle' | 'listening' | 'processing'
  className?: string
}

export default function AudioReactiveOrb({ 
  isListening = false, 
  state = 'idle',
  className = '',
}: AudioReactiveOrbProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas 
        camera={{ position: [0, 0, 4], fov: 45 }} 
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <Scene isListening={isListening} state={state} />
        </Suspense>
      </Canvas>
    </div>
  )
}
