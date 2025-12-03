'use client'

import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Float, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN - "ARENA DE CROMO MAGNETIZADA"
// ═══════════════════════════════════════════════════════════════════════════════
const PARTICLE_COUNT = 3500 // Micro-lingotes de cromo
const LOGO_WIDTH = 14
const LOGO_HEIGHT = 3.5
const LOGO_DEPTH = 0.6

// ═══════════════════════════════════════════════════════════════════════════════
// GENERADOR DE FORMA DE TEXTO "CHRONOS"
// ═══════════════════════════════════════════════════════════════════════════════
function generateChronosShape(): Array<{ x: number; y: number; z: number; rotationOffset: number }> {
  const particles: Array<{ x: number; y: number; z: number; rotationOffset: number }> = []
  
  // Definición de letras CHRONOS como regiones densas
  // Cada letra es un rectángulo con variación para dar forma orgánica
  const letterSpacing = 1.8
  const letters = [
    { char: 'C', xStart: -6.5, width: 1.4 },
    { char: 'H', xStart: -4.5, width: 1.6 },
    { char: 'R', xStart: -2.5, width: 1.4 },
    { char: 'O', xStart: -0.5, width: 1.5 },
    { char: 'N', xStart: 1.5, width: 1.6 },
    { char: 'O', xStart: 3.8, width: 1.5 },
    { char: 'S', xStart: 5.8, width: 1.4 },
  ]
  
  const particlesPerLetter = Math.floor(PARTICLE_COUNT / letters.length)
  
  letters.forEach((letter) => {
    for (let i = 0; i < particlesPerLetter; i++) {
      // Distribución densa dentro de cada letra
      const x = letter.xStart + (Math.random() * letter.width)
      
      // Altura con variación para dar forma de letra
      let y = (Math.random() - 0.5) * LOGO_HEIGHT
      
      // Forma específica por letra (simplificado)
      if (letter.char === 'C') {
        // C: hueco en el medio derecho
        const angle = Math.random() * Math.PI * 1.5 - Math.PI * 0.75
        const radius = 0.6 + Math.random() * 0.5
        y = Math.sin(angle) * radius
        const localX = Math.cos(angle) * radius
        if (localX > 0.2) continue // Hueco del C
      } else if (letter.char === 'O') {
        // O: forma circular con hueco
        const angle = Math.random() * Math.PI * 2
        const outerRadius = 0.7 + Math.random() * 0.3
        const innerRadius = 0.3
        if (Math.random() > 0.3) {
          y = Math.sin(angle) * outerRadius
        }
      }
      
      // Profundidad (grosor del logo)
      const z = (Math.random() - 0.5) * LOGO_DEPTH
      
      // Rotación inicial aleatoria para cada partícula
      const rotationOffset = Math.random() * Math.PI * 2
      
      particles.push({ x, y, z, rotationOffset })
    }
  })
  
  return particles
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTÍCULAS DE DIAMANTE/CROMO - EL NÚCLEO
// ═══════════════════════════════════════════════════════════════════════════════
interface ParticleLogoProps {
  mouse: React.MutableRefObject<THREE.Vector2>
  isHovered: boolean
}

function DiamondParticles({ mouse, isHovered }: ParticleLogoProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // Generar partículas en forma de CHRONOS
  const particles = useMemo(() => generateChronosShape(), [])
  
  // Colores para variación sutil
  const colorArray = useMemo(() => {
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Variación de plata a blanco brillante
      const brightness = 0.85 + Math.random() * 0.15
      colors[i * 3] = brightness
      colors[i * 3 + 1] = brightness
      colors[i * 3 + 2] = brightness + Math.random() * 0.05 // Toque azulado
    }
    return colors
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    
    particles.forEach((p, i) => {
      if (i >= PARTICLE_COUNT) return
      
      const { x, y, z, rotationOffset } = p
      
      // Calcular distancia al mouse
      const mouseX = mouse.current.x * 8
      const mouseY = mouse.current.y * 2.5
      const dx = mouseX - x
      const dy = mouseY - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      // Efecto magnético: partículas cercanas al mouse reaccionan
      const influence = Math.max(0, 1 - dist / 3) // Radio de influencia
      
      // Escala: se agrandan cuando el mouse está cerca (brillo intensificado)
      const baseScale = 0.08 + Math.random() * 0.02
      const scale = baseScale * (1 + influence * 2)
      
      // Posición con micro-vibración cuando hay hover
      const vibration = isHovered ? Math.sin(time * 10 + i) * 0.02 * influence : 0
      dummy.position.set(
        x + vibration,
        y + vibration * 0.5,
        z + influence * 0.3, // Se elevan hacia el mouse
      )
      
      // Rotación: base lenta + aceleración por interacción
      // Esto crea el efecto "ola de brillo" - specular wave
      const rotationSpeed = isHovered ? 0.5 + influence * 3 : 0.2
      dummy.rotation.x = rotationOffset + time * rotationSpeed
      dummy.rotation.y = rotationOffset * 0.7 + time * rotationSpeed * 0.8
      dummy.rotation.z = rotationOffset * 0.5 + time * rotationSpeed * 0.3
      
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
    
    // Rotación sutil del conjunto
    meshRef.current.rotation.y = Math.sin(time * 0.1) * 0.03
  })

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.15}>
      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, PARTICLE_COUNT]}
        frustumCulled={false}
      >
        {/* GEOMETRÍA: Octaedro (Diamante) - caras planas para máximos reflejos */}
        <octahedronGeometry args={[1, 0]} />
        
        {/* MATERIAL: Cromo Espejo Perfecto - Estilo Apple/Rolex */}
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={1.0}           // Metal puro
          roughness={0.0}           // Espejo perfecto (cero imperfecciones)
          clearcoat={1.0}           // Capa de barniz brillante
          clearcoatRoughness={0.0}
          reflectivity={1.0}
          envMapIntensity={3.0}     // Reflejos del entorno exagerados
          // Iridiscencia sutil para efecto premium
          iridescence={0.15}
          iridescenceIOR={1.3}
        />
      </instancedMesh>
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SISTEMA DE ILUMINACIÓN STUDIO - LIGHTFORMERS ROTATIVOS
// ═══════════════════════════════════════════════════════════════════════════════
function StudioLighting() {
  const groupRef = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    if (!groupRef.current) return
    // Rotar las luces para que los reflejos "corran" por el metal
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
  })

  return (
    <group ref={groupRef}>
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {/* Tira de luz principal - arriba */}
          <Lightformer 
            intensity={5} 
            rotation-x={Math.PI / 2} 
            position={[0, 5, -5]} 
            scale={[15, 8, 1]} 
            color="#ffffff"
          />
          
          {/* Tiras laterales - crean definición */}
          <Lightformer 
            intensity={3} 
            rotation-y={Math.PI / 2} 
            position={[-8, 1, 0]} 
            scale={[12, 3, 1]} 
            color="#f0f0ff"
          />
          <Lightformer 
            intensity={3} 
            rotation-y={-Math.PI / 2} 
            position={[8, 1, 0]} 
            scale={[12, 3, 1]} 
            color="#fff0f0"
          />
          
          {/* Luz inferior suave - relleno */}
          <Lightformer 
            intensity={1.5} 
            rotation-x={-Math.PI / 2} 
            position={[0, -4, 0]} 
            scale={[20, 10, 1]} 
            color="#e0e8ff"
          />
          
          {/* Acentos de color sutiles */}
          <Lightformer 
            intensity={2} 
            position={[5, 3, -5]} 
            scale={[3, 3, 1]} 
            color="#4080ff" // Toque azul
          />
          <Lightformer 
            intensity={1.5} 
            position={[-5, 3, -5]} 
            scale={[3, 3, 1]} 
            color="#a040ff" // Toque violeta
          />
        </group>
      </Environment>
      
      {/* Luz direccional para sombras duras */}
      <spotLight 
        position={[10, 15, 10]} 
        angle={0.2} 
        penumbra={0.8} 
        intensity={4} 
        castShadow
        shadow-mapSize={[1024, 1024]}
        color="#ffffff"
      />
      
      {/* Punto de luz para destellos específicos */}
      <pointLight position={[0, 5, 5]} intensity={2} color="#ffffff" />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESCENA COMPLETA
// ═══════════════════════════════════════════════════════════════════════════════
function LogoScene({ onHoverChange }: { onHoverChange?: (hovered: boolean) => void }) {
  const mouse = useRef(new THREE.Vector2(100, 100)) // Fuera de pantalla inicialmente
  const [isHovered, setIsHovered] = React.useState(false)
  const { gl } = useThree()
  
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    
    const handleMouseEnter = () => {
      setIsHovered(true)
      onHoverChange?.(true)
    }
    
    const handleMouseLeave = () => {
      setIsHovered(false)
      onHoverChange?.(false)
      mouse.current.set(100, 100) // Mover fuera
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
      <DiamondParticles mouse={mouse} isHovered={isHovered} />
      <StudioLighting />
      
      {/* Sombra de contacto premium */}
      <ContactShadows 
        resolution={512} 
        scale={25} 
        blur={2.5} 
        opacity={0.4} 
        far={12}
        position={[0, -2, 0]}
        color="#000020"
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE EXPORTABLE
// ═══════════════════════════════════════════════════════════════════════════════
export interface DiamondChromeLogoProps {
  className?: string
  height?: string
  onHover?: (isHovered: boolean) => void
}

export default function DiamondChromeLogo({ 
  className = '',
  height = 'h-64',
  onHover,
}: DiamondChromeLogoProps) {
  return (
    <div className={`w-full ${height} relative ${className}`}>
      {/* Gradiente de fondo sutil para contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-transparent pointer-events-none" />
      
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
        <Suspense fallback={null}>
          <LogoScene onHoverChange={onHover} />
        </Suspense>
      </Canvas>
      
      {/* Overlay del texto 2D para legibilidad (opcional, como fallback) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-0">
        <h1 className="text-6xl font-bold tracking-[0.3em] text-transparent">
          CHRONOS
        </h1>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSIÓN COMPACTA PARA HEADER
// ═══════════════════════════════════════════════════════════════════════════════
export function DiamondChromeLogoCompact({ className = '' }: { className?: string }) {
  return (
    <DiamondChromeLogo 
      className={className}
      height="h-16"
    />
  )
}
