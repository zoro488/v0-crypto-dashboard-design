'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🏦 CHRONOS INFINITY - BANK ORBS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * 7 Orbs únicos para cada banco/bóveda con personalidad visual distinta:
 * 
 * 1. Bóveda Monte - Oro líquido sólido (primary gold)
 * 2. Bóveda USA - Dólares flotantes (green particles)
 * 3. Utilidades - Explosión dorada (particle burst)
 * 4. Fletes - Flujo violeta dinámico (flowing lines)
 * 5. Azteca - Pirámide energética (geometric)
 * 6. Leftie - Ondas magnéticas (wave distortion)
 * 7. Profit - Cristal de ganancias (crystal formation)
 * 
 * Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, memo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Sphere, Box, Icosahedron, Torus, TorusKnot, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { INFINITY_COLORS, INFINITY_GRADIENTS } from '@/app/lib/constants/infinity-design-system'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════

export type BankId = 
  | 'boveda_monte' 
  | 'boveda_usa' 
  | 'utilidades' 
  | 'fletes' 
  | 'azteca' 
  | 'leftie' 
  | 'profit'

interface BankOrbProps {
  bankId: BankId
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  capital?: number
  onClick?: () => void
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE BANCOS
// ════════════════════════════════════════════════════════════════════════════════════════

const BANK_CONFIG: Record<BankId, {
  name: string
  shortName: string
  primaryColor: string
  secondaryColor: string
  description: string
}> = {
  boveda_monte: {
    name: 'Bóveda Monte',
    shortName: 'Monte',
    primaryColor: '#FFD700',
    secondaryColor: '#B8860B',
    description: 'Capital principal - Oro líquido',
  },
  boveda_usa: {
    name: 'Bóveda USA',
    shortName: 'USA',
    primaryColor: '#228B22',
    secondaryColor: '#006400',
    description: 'Reserva dólares - Verde esmeralda',
  },
  utilidades: {
    name: 'Utilidades',
    shortName: 'Util',
    primaryColor: '#FFD700',
    secondaryColor: '#FF1493',
    description: 'Ganancias netas - Explosión dorada',
  },
  fletes: {
    name: 'Fletes',
    shortName: 'Flete',
    primaryColor: '#8B00FF',
    secondaryColor: '#4B0082',
    description: 'Logística - Flujo violeta',
  },
  azteca: {
    name: 'Azteca',
    shortName: 'Aztec',
    primaryColor: '#FF1493',
    secondaryColor: '#8B00FF',
    description: 'Operaciones - Energía pirámide',
  },
  leftie: {
    name: 'Leftie',
    shortName: 'Left',
    primaryColor: '#8B00FF',
    secondaryColor: '#FF1493',
    description: 'Alternativo - Ondas magnéticas',
  },
  profit: {
    name: 'Profit',
    shortName: 'Prof',
    primaryColor: '#FFD700',
    secondaryColor: '#8B00FF',
    description: 'Rendimiento - Cristal premium',
  },
}

// ════════════════════════════════════════════════════════════════════════════════════════
// 1. BÓVEDA MONTE - ORO LÍQUIDO
// ════════════════════════════════════════════════════════════════════════════════════════

const BovedaMonteOrb = memo(function BovedaMonteOrb() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    }
  })
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#FFD700"
          metalness={0.95}
          roughness={0.05}
          distort={0.3}
          speed={2}
          emissive="#B8860B"
          emissiveIntensity={0.3}
        />
      </Sphere>
      <Sparkles
        count={30}
        scale={2.5}
        size={3}
        speed={0.5}
        color="#FFD700"
        opacity={0.6}
      />
    </Float>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 2. BÓVEDA USA - DÓLARES FLOTANTES
// ════════════════════════════════════════════════════════════════════════════════════════

const BovedaUSAOrb = memo(function BovedaUSAOrb() {
  const groupRef = useRef<THREE.Group>(null)
  const sphereRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.4
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.x = clock.getElapsedTime() * 0.2
    }
  })
  
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <group ref={groupRef}>
        <Sphere ref={sphereRef} args={[1, 32, 32]}>
          <MeshWobbleMaterial
            color="#228B22"
            metalness={0.7}
            roughness={0.2}
            factor={0.3}
            speed={1.5}
            emissive="#006400"
            emissiveIntensity={0.2}
          />
        </Sphere>
        {/* Mini orbs orbitando */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 4) * Math.PI * 2) * 1.5,
              Math.sin((i / 4) * Math.PI * 2) * 0.3,
              Math.sin((i / 4) * Math.PI * 2) * 1.5,
            ]}
          >
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#7CFC00" emissive="#228B22" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
      <Sparkles count={20} scale={2} size={2} speed={0.3} color="#7CFC00" opacity={0.5} />
    </Float>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 3. UTILIDADES - EXPLOSIÓN DORADA
// ════════════════════════════════════════════════════════════════════════════════════════

const UtilidadesOrb = memo(function UtilidadesOrb() {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2) * 0.05)
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z = clock.getElapsedTime() * 0.5
      ringsRef.current.rotation.x = clock.getElapsedTime() * 0.3
    }
  })
  
  return (
    <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <group ref={ringsRef}>
        <Torus args={[1.3, 0.02, 16, 100]}>
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
        </Torus>
        <Torus args={[1.1, 0.015, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#FF1493" emissive="#FF1493" emissiveIntensity={0.4} />
        </Torus>
      </group>
      <Sphere ref={meshRef} args={[0.8, 48, 48]}>
        <MeshDistortMaterial
          color="#FFD700"
          metalness={0.9}
          roughness={0.1}
          distort={0.5}
          speed={4}
          emissive="#FF8C00"
          emissiveIntensity={0.4}
        />
      </Sphere>
      <Sparkles count={50} scale={3} size={4} speed={1} color="#FFD700" opacity={0.8} />
    </Float>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 4. FLETES - FLUJO VIOLETA
// ════════════════════════════════════════════════════════════════════════════════════════

const FletesOrb = memo(function FletesOrb() {
  const knotRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (knotRef.current) {
      knotRef.current.rotation.x = clock.getElapsedTime() * 0.3
      knotRef.current.rotation.y = clock.getElapsedTime() * 0.4
    }
  })
  
  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.4}>
      <TorusKnot ref={knotRef} args={[0.6, 0.2, 128, 32]}>
        <MeshDistortMaterial
          color="#8B00FF"
          metalness={0.8}
          roughness={0.15}
          distort={0.2}
          speed={2}
          emissive="#4B0082"
          emissiveIntensity={0.4}
        />
      </TorusKnot>
      <Sparkles count={25} scale={2.5} size={2.5} speed={0.6} color="#8B00FF" opacity={0.6} />
    </Float>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 5. AZTECA - PIRÁMIDE ENERGÉTICA
// ════════════════════════════════════════════════════════════════════════════════════════

const AztecaOrb = memo(function AztecaOrb() {
  const pyramidRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (pyramidRef.current) {
      pyramidRef.current.rotation.y = clock.getElapsedTime() * 0.5
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = -clock.getElapsedTime() * 0.3
      outerRef.current.rotation.z = Math.sin(clock.getElapsedTime()) * 0.1
    }
  })
  
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group>
        {/* Pirámide exterior wireframe */}
        <Icosahedron ref={outerRef} args={[1.2, 0]}>
          <meshStandardMaterial
            color="#FF1493"
            wireframe
            emissive="#FF1493"
            emissiveIntensity={0.3}
          />
        </Icosahedron>
        {/* Núcleo sólido */}
        <Icosahedron ref={pyramidRef} args={[0.6, 1]}>
          <MeshDistortMaterial
            color="#FF1493"
            metalness={0.9}
            roughness={0.1}
            distort={0.15}
            speed={3}
            emissive="#8B00FF"
            emissiveIntensity={0.5}
          />
        </Icosahedron>
      </group>
      <Sparkles count={30} scale={2.5} size={3} speed={0.4} color="#FF1493" opacity={0.7} />
    </Float>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 6. LEFTIE - ONDAS MAGNÉTICAS
// ════════════════════════════════════════════════════════════════════════════════════════

const LeftieOrb = memo(function LeftieOrb() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime()) * 0.3
      meshRef.current.rotation.z = Math.cos(clock.getElapsedTime() * 0.7) * 0.2
    }
  })
  
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshWobbleMaterial
          color="#8B00FF"
          metalness={0.6}
          roughness={0.3}
          factor={0.6}
          speed={2.5}
          emissive="#FF1493"
          emissiveIntensity={0.3}
        />
      </Sphere>
      {/* Anillos ondulantes */}
      {[0.3, 0.6, 0.9].map((delay, i) => (
        <Torus
          key={i}
          args={[1.2 + i * 0.2, 0.01, 16, 100]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color="#8B00FF"
            transparent
            opacity={0.3 - i * 0.08}
            emissive="#8B00FF"
            emissiveIntensity={0.5}
          />
        </Torus>
      ))}
      <Sparkles count={20} scale={2.5} size={2} speed={0.7} color="#FF1493" opacity={0.5} />
    </Float>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// 7. PROFIT - CRISTAL DE GANANCIAS
// ════════════════════════════════════════════════════════════════════════════════════════

const ProfitOrb = memo(function ProfitOrb() {
  const crystalRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y = clock.getElapsedTime() * 0.4
      crystalRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.1
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -clock.getElapsedTime() * 0.6
    }
  })
  
  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.4}>
      <group>
        {/* Cristal exterior */}
        <Box ref={crystalRef} args={[1, 1.4, 1]} rotation={[0.3, 0, 0.2]}>
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.95}
            roughness={0.05}
            transparent
            opacity={0.7}
            emissive="#FFD700"
            emissiveIntensity={0.2}
          />
        </Box>
        {/* Núcleo interno */}
        <Icosahedron ref={innerRef} args={[0.4, 0]}>
          <MeshDistortMaterial
            color="#8B00FF"
            metalness={0.9}
            roughness={0.1}
            distort={0.2}
            speed={3}
            emissive="#8B00FF"
            emissiveIntensity={0.6}
          />
        </Icosahedron>
      </group>
      <Sparkles count={35} scale={2.5} size={3} speed={0.5} color="#FFD700" opacity={0.7} />
    </Float>
  )
})

// ════════════════════════════════════════════════════════════════════════════════════════
// SELECTOR DE ORB
// ════════════════════════════════════════════════════════════════════════════════════════

const OrbSelector: Record<BankId, React.ComponentType> = {
  boveda_monte: BovedaMonteOrb,
  boveda_usa: BovedaUSAOrb,
  utilidades: UtilidadesOrb,
  fletes: FletesOrb,
  azteca: AztecaOrb,
  leftie: LeftieOrb,
  profit: ProfitOrb,
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════

const SIZE_CONFIG = {
  sm: { container: 'w-16 h-16', scale: 0.6 },
  md: { container: 'w-24 h-24', scale: 0.8 },
  lg: { container: 'w-32 h-32', scale: 1 },
}

function BankOrb({ 
  bankId, 
  size = 'md', 
  showLabel = false,
  capital,
  onClick,
}: BankOrbProps) {
  const config = BANK_CONFIG[bankId]
  const sizeConfig = SIZE_CONFIG[size]
  const OrbComponent = OrbSelector[bankId]
  
  const formattedCapital = useMemo(() => {
    if (capital === undefined) return null
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(capital)
  }, [capital])
  
  return (
    <motion.div
      className={`relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.05 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
    >
      {/* Canvas 3D */}
      <div className={`${sizeConfig.container} rounded-2xl overflow-hidden`}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <pointLight position={[3, 3, 3]} intensity={0.6} color={config.primaryColor} />
            <pointLight position={[-3, -3, 2]} intensity={0.3} color={config.secondaryColor} />
            <group scale={sizeConfig.scale}>
              <OrbComponent />
            </group>
          </Suspense>
        </Canvas>
      </div>
      
      {/* Label */}
      {showLabel && (
        <div className="mt-2 text-center">
          <p 
            className="text-sm font-semibold bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
          >
            {config.shortName}
          </p>
          {formattedCapital && (
            <p className="text-xs text-white/60 mt-0.5">{formattedCapital}</p>
          )}
        </div>
      )}
      
      {/* Glow effect */}
      <div 
        className="absolute inset-0 -z-10 rounded-2xl opacity-30 blur-xl"
        style={{ background: `radial-gradient(circle, ${config.primaryColor}40, transparent)` }}
      />
    </motion.div>
  )
}

export default memo(BankOrb)

// Exportar también los componentes individuales
export {
  BovedaMonteOrb,
  BovedaUSAOrb,
  UtilidadesOrb,
  FletesOrb,
  AztecaOrb,
  LeftieOrb,
  ProfitOrb,
  BANK_CONFIG,
}
