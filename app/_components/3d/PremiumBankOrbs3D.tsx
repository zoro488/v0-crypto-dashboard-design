'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM BANK ORBS 3D
// 7 orbes con personalidades únicas y shaders WebGPU
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { 
  Float, 
  Environment, 
  Sparkles,
  Trail,
  MeshDistortMaterial,
  Sphere,
  Text3D,
  Center,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import {
  BovedaMonteShader,
  UtilidadesShader,
  FletesShader,
  AztecaShader,
  LeftieShader,
  ProfitShader,
  BovedaUSAShader,
} from '../shaders'

// Extender R3F con los shaders
extend({ 
  BovedaMonteShader, 
  UtilidadesShader, 
  FletesShader,
  AztecaShader,
  LeftieShader,
  ProfitShader,
  BovedaUSAShader,
})

// ═══════════════════════════════════════════════════════════════
// TIPOS Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

interface BankData {
  id: string
  name: string
  shortName: string
  capital: number
  historicoIngresos: number
  historicoGastos: number
  personality: string
  color: string
  position: [number, number, number]
  scale: number
}

interface PremiumBankOrbs3DProps {
  banks: BankData[]
  selectedBank?: string | null
  onSelectBank?: (id: string) => void
  className?: string
}

// Configuración de posiciones en formación hexagonal
const HEXAGONAL_POSITIONS: [number, number, number][] = [
  [0, 0, 0],        // Centro - PROFIT (el emperador)
  [2.5, 0, 0],      // Derecha
  [-2.5, 0, 0],     // Izquierda
  [1.25, 2.2, 0],   // Arriba derecha
  [-1.25, 2.2, 0],  // Arriba izquierda
  [1.25, -2.2, 0],  // Abajo derecha
  [-1.25, -2.2, 0], // Abajo izquierda
]

// Mapeo de banco a shader
const BANK_SHADER_MAP: Record<string, React.FC<BankOrbMeshProps>> = {
  boveda_monte: BovedaMonteOrb,
  utilidades: UtilidadesOrb,
  flete_sur: FletesOrb,
  azteca: AztecaOrb,
  leftie: LeftieOrb,
  profit: ProfitOrb,
  boveda_usa: BovedaUSAOrb,
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTES DE ORBES INDIVIDUALES
// ═══════════════════════════════════════════════════════════════

interface BankOrbMeshProps {
  bank: BankData
  isSelected: boolean
  onClick: () => void
}

// BÓVEDA MONTE — Oro líquido cayendo
function BovedaMonteOrb({ bank, isSelected, onClick }: BankOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCapital.value = Math.min(bank.capital / 1000000, 1)
      materialRef.current.uniforms.uIntensity.value = isSelected ? 1.5 : 1.0
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
  })
  
  return (
    <group position={bank.position} onClick={onClick}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <Trail
          width={0.5}
          length={8}
          color="#FFD700"
          attenuation={(t) => t * t}
        >
          <mesh ref={meshRef} scale={bank.scale * (isSelected ? 1.2 : 1)}>
            <sphereGeometry args={[1, 64, 64]} />
            {/* @ts-expect-error R3F extend */}
            <bovedaMonteShader ref={materialRef} transparent />
          </mesh>
        </Trail>
        <Sparkles
          count={50}
          scale={2}
          size={3}
          speed={0.5}
          color="#FFD700"
        />
      </Float>
    </group>
  )
}

// UTILIDADES — Explosión rosa-dorada
function UtilidadesOrb({ bank, isSelected, onClick }: BankOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCapital.value = Math.min(bank.capital / 1000000, 1)
      materialRef.current.uniforms.uIntensity.value = isSelected ? 1.5 : 1.0
    }
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.05 + 1
      meshRef.current.scale.setScalar(bank.scale * pulse * (isSelected ? 1.2 : 1))
    }
  })
  
  return (
    <group position={bank.position} onClick={onClick}>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.8}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1, 64, 64]} />
          {/* @ts-expect-error R3F extend */}
          <utilidadesShader ref={materialRef} transparent />
        </mesh>
        <Sparkles
          count={100}
          scale={3}
          size={4}
          speed={2}
          color="#FF1493"
        />
        <Sparkles
          count={50}
          scale={2.5}
          size={5}
          speed={1.5}
          color="#FFD700"
        />
      </Float>
    </group>
  )
}

// FLETES — Plasma violeta electrizante
function FletesOrb({ bank, isSelected, onClick }: BankOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCapital.value = Math.min(bank.capital / 1000000, 1)
      materialRef.current.uniforms.uIntensity.value = isSelected ? 1.5 : 1.0
    }
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003
      meshRef.current.rotation.z += 0.002
    }
  })
  
  return (
    <group position={bank.position} onClick={onClick}>
      <Float speed={4} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh ref={meshRef} scale={bank.scale * (isSelected ? 1.2 : 1)}>
          <icosahedronGeometry args={[1, 4]} />
          {/* @ts-expect-error R3F extend */}
          <fletesShader ref={materialRef} transparent />
        </mesh>
        {/* Rayos eléctricos simulados con líneas */}
        <Sparkles
          count={80}
          scale={2.5}
          size={2}
          speed={3}
          color="#8B00FF"
        />
      </Float>
    </group>
  )
}

// AZTECA — Grietas de lava
function AztecaOrb({ bank, isSelected, onClick }: BankOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCapital.value = Math.min(bank.capital / 1000000, 1)
      materialRef.current.uniforms.uIntensity.value = isSelected ? 1.5 : 1.0
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })
  
  return (
    <group position={bank.position} onClick={onClick}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={meshRef} scale={bank.scale * (isSelected ? 1.2 : 1)}>
          <dodecahedronGeometry args={[1, 2]} />
          {/* @ts-expect-error R3F extend */}
          <aztecaShader ref={materialRef} transparent />
        </mesh>
        {/* Partículas de ceniza/fuego */}
        <Sparkles
          count={30}
          scale={2}
          size={3}
          speed={0.8}
          color="#FF6B00"
        />
      </Float>
    </group>
  )
}

// LEFTIE — Corona dorada orbital
function LeftieOrb({ bank, isSelected, onClick }: BankOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCapital.value = Math.min(bank.capital / 1000000, 1)
      materialRef.current.uniforms.uIntensity.value = isSelected ? 1.5 : 1.0
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })
  
  return (
    <group position={bank.position} onClick={onClick}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={meshRef} scale={bank.scale * (isSelected ? 1.2 : 1)}>
          <sphereGeometry args={[1, 64, 64]} />
          {/* @ts-expect-error R3F extend */}
          <leftieShader ref={materialRef} transparent />
        </mesh>
        {/* Corona orbital */}
        <mesh ref={ringRef} scale={1.5}>
          <torusGeometry args={[1, 0.05, 16, 64]} />
          <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FFD700" 
            emissiveIntensity={0.5}
            metalness={1}
            roughness={0.2}
          />
        </mesh>
        <Sparkles
          count={60}
          scale={2.5}
          size={2}
          speed={1}
          color="#FFD700"
        />
      </Float>
    </group>
  )
}

// PROFIT — Corona + Cetro (el emperador)
function ProfitOrb({ bank, isSelected, onClick }: BankOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const crownRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCapital.value = Math.min(bank.capital / 1000000, 1)
      materialRef.current.uniforms.uIntensity.value = isSelected ? 1.5 : 1.0
    }
    if (crownRef.current) {
      crownRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.03 + 1
      meshRef.current.scale.setScalar(bank.scale * pulse * (isSelected ? 1.3 : 1))
    }
  })
  
  return (
    <group position={bank.position} onClick={onClick}>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.2, 64, 64]} />
          {/* @ts-expect-error R3F extend */}
          <profitShader ref={materialRef} transparent />
        </mesh>
        {/* Corona imperial */}
        <group ref={crownRef} position={[0, 1.5, 0]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh 
              key={i} 
              position={[
                Math.cos((i / 5) * Math.PI * 2) * 0.3,
                0.2,
                Math.sin((i / 5) * Math.PI * 2) * 0.3
              ]}
            >
              <coneGeometry args={[0.08, 0.3, 4]} />
              <meshStandardMaterial 
                color="#FFD700" 
                emissive="#FFD700" 
                emissiveIntensity={0.5}
                metalness={1}
                roughness={0.2}
              />
            </mesh>
          ))}
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.3, 0.05, 16, 32]} />
            <meshStandardMaterial 
              color="#8B00FF" 
              emissive="#8B00FF" 
              emissiveIntensity={0.3}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
        <Sparkles
          count={100}
          scale={3}
          size={4}
          speed={0.5}
          color="#FFD700"
        />
        <Sparkles
          count={50}
          scale={2.5}
          size={3}
          speed={0.3}
          color="#8B00FF"
        />
      </Float>
    </group>
  )
}

// BÓVEDA USA — Bandera dorada ondeando
function BovedaUSAOrb({ bank, isSelected, onClick }: BankOrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCapital.value = Math.min(bank.capital / 1000000, 1)
      materialRef.current.uniforms.uIntensity.value = isSelected ? 1.5 : 1.0
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
  })
  
  return (
    <group position={bank.position} onClick={onClick}>
      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh ref={meshRef} scale={bank.scale * (isSelected ? 1.2 : 1)}>
          <sphereGeometry args={[1, 64, 64]} />
          {/* @ts-expect-error R3F extend */}
          <bovedaUSAShader ref={materialRef} transparent />
        </mesh>
        {/* Estrellas orbitando */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Sparkles
            key={i}
            count={10}
            scale={2 + i * 0.3}
            size={3}
            speed={1 + i * 0.2}
            color="#FFD700"
          />
        ))}
      </Float>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE DE ESCENA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

function BankOrbsScene({ 
  banks, 
  selectedBank, 
  onSelectBank 
}: Omit<PremiumBankOrbs3DProps, 'className'>) {
  
  // Ordenar bancos: profit al centro, resto en hexágono
  const orderedBanks = useMemo(() => {
    const profitBank = banks.find(b => b.id === 'profit')
    const otherBanks = banks.filter(b => b.id !== 'profit')
    
    const result: BankData[] = []
    
    if (profitBank) {
      result.push({ ...profitBank, position: HEXAGONAL_POSITIONS[0] })
    }
    
    otherBanks.forEach((bank, i) => {
      const posIndex = (i % 6) + 1
      result.push({ ...bank, position: HEXAGONAL_POSITIONS[posIndex] })
    })
    
    return result
  }, [banks])
  
  return (
    <>
      {/* Iluminación */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#FFD700" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B00FF" />
      <pointLight position={[0, 10, 0]} intensity={0.8} color="#FF1493" />
      
      {/* Environment para reflejos */}
      <Environment preset="night" />
      
      {/* Orbes de bancos */}
      {orderedBanks.map((bank) => {
        const OrbComponent = BANK_SHADER_MAP[bank.id]
        if (!OrbComponent) return null
        
        return (
          <OrbComponent
            key={bank.id}
            bank={bank}
            isSelected={selectedBank === bank.id}
            onClick={() => onSelectBank?.(bank.id)}
          />
        )
      })}
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom 
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0005, 0.0005)}
        />
      </EffectComposer>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE EXPORTADO
// ═══════════════════════════════════════════════════════════════

export default function PremiumBankOrbs3D({
  banks,
  selectedBank,
  onSelectBank,
  className = '',
}: PremiumBankOrbs3DProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full h-full ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 30]} />
        
        <BankOrbsScene
          banks={banks}
          selectedBank={selectedBank}
          onSelectBank={onSelectBank}
        />
      </Canvas>
    </motion.div>
  )
}
