'use client'

import React, { useRef, useMemo, Suspense, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Environment, PerspectiveCamera, Text3D, Center } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// ==========================================
// CONFIGURACIÓN
// ==========================================
const PARTICLE_COUNT = 6000 // Alta densidad para efecto sólido
const LOGO_TEXT = 'CHRONOS'

// ==========================================
// SISTEMA DE PARTÍCULAS CROMADAS
// ==========================================
interface ChromeParticlesProps {
  mousePosition: React.MutableRefObject<THREE.Vector2>
  isHovered: boolean
}

function ChromeParticles({ mousePosition, isHovered }: ChromeParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // Generar posiciones de partículas formando "CHRONOS"
  const particles = useMemo(() => {
    const positions: Array<{
      x: number
      y: number
      z: number
      baseX: number
      baseY: number
      baseZ: number
      scale: number
      rotationSpeed: number
    }> = []
    
    // Aproximación de la forma del texto CHRONOS
    // En producción real, usaríamos TextGeometry y sampleamos la superficie
    const letterWidths = [0.8, 1, 0.8, 1, 0.8, 0.8, 0.8] // C H R O N O S
    const totalWidth = letterWidths.reduce((a, b) => a + b, 0)
    const currentX = -totalWidth / 2
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribuir partículas a lo largo del texto
      const progress = i / PARTICLE_COUNT
      const letterIndex = Math.floor(progress * 7)
      const letterProgress = (progress * 7) % 1
      
      // Posición base siguiendo la forma general del texto
      const x = currentX + progress * totalWidth
      
      // Añadir variación para crear "volumen" del texto
      const heightVariation = Math.sin(letterProgress * Math.PI) * 0.8
      const y = (Math.random() - 0.5) * 0.6 + heightVariation * 0.3
      
      // Profundidad para efecto 3D
      const z = (Math.random() - 0.5) * 0.15
      
      positions.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        scale: 0.025 + Math.random() * 0.015, // Tamaño variable pero pequeño
        rotationSpeed: 0.5 + Math.random() * 2,
      })
    }
    
    return positions
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    const mouse = mousePosition.current
    
    particles.forEach((particle, i) => {
      // Posición base con ligera animación de respiración
      const breathe = Math.sin(time * 0.5 + i * 0.01) * 0.02
      
      // Distancia al mouse para interacción
      const dx = (mouse.x * 6) - particle.baseX
      const dy = (mouse.y * 2) - particle.baseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const influence = Math.max(0, 1 - dist * 0.5)
      
      // Efecto de "onda" cuando el mouse pasa cerca
      const waveOffset = isHovered ? Math.sin(time * 3 + dist * 2) * 0.05 * influence : 0
      
      dummy.position.set(
        particle.baseX + waveOffset * dx * 0.1,
        particle.baseY + breathe + waveOffset,
        particle.baseZ + influence * 0.3, // Se elevan hacia el mouse
      )
      
      // Rotación para brillar
      dummy.rotation.x = time * particle.rotationSpeed * 0.3
      dummy.rotation.y = time * particle.rotationSpeed * 0.5
      
      // Escala con efecto de brillo al hover
      const hoverScale = isHovered ? 1 + influence * 0.5 : 1
      const scale = particle.scale * hoverScale
      dummy.scale.set(scale, scale, scale)
      
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
    
    // Rotación sutil del conjunto completo
    meshRef.current.rotation.y = Math.sin(time * 0.2) * 0.05
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      {/* Geometría facetada para reflejos duros tipo diamante */}
      <icosahedronGeometry args={[1, 0]} />
      
      {/* Material de espejo cromado PREMIUM */}
      <meshPhysicalMaterial
        color="#ffffff"
        metalness={1.0}
        roughness={0.02}
        clearcoat={1.0}
        clearcoatRoughness={0.0}
        reflectivity={1.0}
        envMapIntensity={2.5}
        // Iridiscencia sutil
        iridescence={0.3}
        iridescenceIOR={1.5}
      />
    </instancedMesh>
  )
}

// ==========================================
// HALO DE LUZ DETRÁS DEL LOGO
// ==========================================
function GlowRing({ isHovered }: { isHovered: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (!ringRef.current) return
    const time = state.clock.elapsedTime
    
    // Pulsación del halo
    const pulse = 1 + Math.sin(time * 2) * 0.1
    ringRef.current.scale.setScalar(isHovered ? pulse * 1.2 : pulse)
    
    // Rotación lenta
    ringRef.current.rotation.z = time * 0.1
  })
  
  return (
    <mesh ref={ringRef} position={[0, 0, -0.5]}>
      <ringGeometry args={[3, 4, 64]} />
      <meshBasicMaterial
        color={isHovered ? '#22d3ee' : '#4f46e5'}
        transparent
        opacity={isHovered ? 0.15 : 0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ==========================================
// ESCENA COMPLETA
// ==========================================
function LogoScene({ onHoverChange }: { onHoverChange: (hovered: boolean) => void }) {
  const mousePosition = useRef(new THREE.Vector2(0, 0))
  const [isHovered, setIsHovered] = useState(false)
  const { gl } = useThree()
  
  // Manejar movimiento del mouse
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      mousePosition.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mousePosition.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    
    const handleMouseEnter = () => {
      setIsHovered(true)
      onHoverChange(true)
    }
    
    const handleMouseLeave = () => {
      setIsHovered(false)
      onHoverChange(false)
    }
    
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mouseenter', handleMouseEnter)
    gl.domElement.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('mouseenter', handleMouseEnter)
      gl.domElement.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [gl, onHoverChange])

  return (
    <>
      {/* Iluminación premium */}
      <ambientLight intensity={0.3} />
      <spotLight 
        position={[5, 5, 5]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#ffffff"
        castShadow
      />
      <pointLight position={[-5, 3, 3]} intensity={1} color="#22d3ee" />
      <pointLight position={[5, -3, 3]} intensity={0.8} color="#a855f7" />
      
      {/* CRÍTICO: Entorno HDRI para reflejos cromados reales */}
      <Environment preset="warehouse" />
      
      {/* Halo de fondo */}
      <GlowRing isHovered={isHovered} />
      
      {/* Las partículas cromadas formando el logo */}
      <ChromeParticles mousePosition={mousePosition} isHovered={isHovered} />
      
      {/* Post-procesamiento */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.4} 
          mipmapBlur 
          intensity={isHovered ? 1.5 : 0.8} 
          radius={0.5} 
        />
      </EffectComposer>
    </>
  )
}

// ==========================================
// COMPONENTE EXPORTABLE
// ==========================================
export interface ChromeParticleLogoProps {
  className?: string
  onHover?: (isHovered: boolean) => void
}

export default function ChromeParticleLogo({ 
  className = '',
  onHover,
}: ChromeParticleLogoProps) {
  const handleHoverChange = React.useCallback((hovered: boolean) => {
    onHover?.(hovered)
  }, [onHover])

  return (
    <div className={`relative ${className}`}>
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
        <Suspense fallback={null}>
          <LogoScene onHoverChange={handleHoverChange} />
        </Suspense>
      </Canvas>
      
      {/* Texto 2D superpuesto con efecto chrome (fallback/enhancement) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-mirror-chrome text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.2em] select-none">
          CHRONOS
        </h1>
      </div>
    </div>
  )
}

// ==========================================
// VERSIÓN SIMPLIFICADA SOLO CSS (sin 3D)
// ==========================================
export function ChromeLogoCSS({ className = '' }: { className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      {/* Halo de luz */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl 
                        group-hover:from-cyan-500/30 group-hover:to-purple-500/30 
                        transition-all duration-500 group-hover:scale-125" />
      </div>
      
      {/* Logo con efecto chrome */}
      <h1 className="relative text-mirror-chrome-animated text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.2em] 
                     cursor-default select-none
                     transition-all duration-300 group-hover:tracking-[0.25em]">
        CHRONOS
      </h1>
      
      {/* Partículas simuladas con CSS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/60 animate-pulse"
            style={{
              left: `${10 + (i * 4)}%`,
              top: `${30 + Math.sin(i) * 20}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${1.5 + Math.random()}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
