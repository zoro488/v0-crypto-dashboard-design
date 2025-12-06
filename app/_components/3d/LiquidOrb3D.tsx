'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — LIQUID ORB 3D COMPONENT
// Orbe 3D premium con MeshDistortMaterial
// Reacciona al capital, mouse y mood en tiempo real
// Paleta: #000000 / #8B00FF / #FFD700 / #FF1493 (CYAN PROHIBIDO)
// ═══════════════════════════════════════════════════════════════

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Trail, Sparkles, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { ORB_PRESETS, type OrbPreset } from '../shaders'
import type { BancoId } from '@/app/_lib/constants/bancos'

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export interface LiquidOrb3DProps {
  // Identificación
  bancoId?: BancoId
  preset?: OrbPreset
  
  // Datos dinámicos
  capital?: number          // 0-1 normalizado
  mood?: number             // -1 (pérdida) a 1 (ganancia)
  
  // Colores (override preset)
  colorBase?: THREE.Color | string
  colorSecondary?: THREE.Color | string
  
  // Posición y escala
  position?: [number, number, number]
  scale?: number
  
  // Interacción
  isSelected?: boolean
  onClick?: () => void
  onHover?: (hovered: boolean) => void
  
  // Efectos visuales
  enableTrail?: boolean
  enableSparkles?: boolean
  enableFloat?: boolean
  enableGlow?: boolean
  
  // Personalización de animación
  rotationSpeed?: number
  floatSpeed?: number
  floatIntensity?: number
  
  // Trail config
  trailWidth?: number
  trailLength?: number
  trailColor?: string
  
  // Sparkles config
  sparkleCount?: number
  sparkleSize?: number
  sparkleColor?: string
}

export interface LiquidOrb3DRef {
  mesh: THREE.Mesh | null
  setMood: (mood: number) => void
  setCapital: (capital: number) => void
  pulse: () => void
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export const LiquidOrb3D = forwardRef<LiquidOrb3DRef, LiquidOrb3DProps>(
  function LiquidOrb3D(
    {
      bancoId,
      preset: customPreset,
      capital = 0.5,
      mood = 0,
      colorBase,
      colorSecondary,
      position = [0, 0, 0],
      scale = 1,
      isSelected = false,
      onClick,
      onHover,
      enableTrail = true,
      enableSparkles = true,
      enableFloat = true,
      enableGlow = true,
      rotationSpeed = 0.003,
      floatSpeed = 1.5,
      floatIntensity = 0.4,
      trailWidth = 0.5,
      trailLength = 6,
      trailColor,
      sparkleCount = 40,
      sparkleSize = 2,
      sparkleColor,
    },
    ref
  ) {
    // Refs
    const meshRef = useRef<THREE.Mesh>(null)
    const glowRef = useRef<THREE.Mesh>(null)
    const pulseRef = useRef(0)
    const moodRef = useRef(mood)
    const capitalRef = useRef(capital)
    
    // Obtener preset (prioridad: custom > banco > default)
    const preset = useMemo(() => {
      if (customPreset) return customPreset
      if (bancoId && ORB_PRESETS[bancoId]) return ORB_PRESETS[bancoId]
      return ORB_PRESETS.boveda_monte
    }, [customPreset, bancoId])
    
    // Colores finales
    const finalColorBase = useMemo(() => {
      if (colorBase) {
        return colorBase instanceof THREE.Color 
          ? colorBase 
          : new THREE.Color(colorBase)
      }
      return preset.colorBase
    }, [colorBase, preset.colorBase])
    
    const finalColorSecondary = useMemo(() => {
      if (colorSecondary) {
        return colorSecondary instanceof THREE.Color 
          ? colorSecondary 
          : new THREE.Color(colorSecondary)
      }
      return preset.colorSecondary
    }, [colorSecondary, preset.colorSecondary])
    
    // Color hex para efectos
    const colorHex = useMemo(() => {
      return `#${finalColorBase.getHexString()}`
    }, [finalColorBase])
    
    const colorSecondaryHex = useMemo(() => {
      return `#${finalColorSecondary.getHexString()}`
    }, [finalColorSecondary])
    
    // Exponer refs y métodos
    useImperativeHandle(ref, () => ({
      mesh: meshRef.current,
      setMood: (newMood: number) => {
        moodRef.current = newMood
      },
      setCapital: (newCapital: number) => {
        capitalRef.current = newCapital
      },
      pulse: () => {
        pulseRef.current = 1.0
      },
    }), [])
    
    // Animación por frame
    useFrame((state) => {
      if (!meshRef.current) return
      
      const time = state.clock.elapsedTime
      
      // Pulse decay
      if (pulseRef.current > 0) {
        pulseRef.current *= 0.95
        if (pulseRef.current < 0.01) pulseRef.current = 0
      }
      
      // Rotación
      meshRef.current.rotation.y += rotationSpeed * preset.breathingSpeed
      
      // Breathing
      const breathe = Math.sin(time * preset.breathingSpeed) * 0.03
      const pulseIntensity = 1 + pulseRef.current * 0.5
      const finalScale = scale * (1 + breathe) * (isSelected ? 1.1 : 1) * pulseIntensity
      meshRef.current.scale.setScalar(finalScale)
      
      // Glow animation
      if (glowRef.current && enableGlow) {
        const mat = glowRef.current.material as THREE.MeshBasicMaterial
        const pulse = Math.sin(time * 2) * 0.1 + 0.25
        mat.opacity = pulse * (isSelected ? 1.5 : 1)
        glowRef.current.scale.setScalar(finalScale * 1.3)
      }
    })
    
    // El orbe principal
    const OrbMesh = (
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => onHover?.(true)}
        onPointerOut={() => onHover?.(false)}
        castShadow
      >
        <icosahedronGeometry args={[1, 5]} />
        <MeshDistortMaterial
          color={colorHex}
          emissive={colorSecondaryHex}
          emissiveIntensity={0.3 + capital * 0.3}
          roughness={0.1}
          metalness={0.8}
          distort={preset.distortionScale}
          speed={preset.breathingSpeed}
          transparent
          opacity={0.95}
        />
      </mesh>
    )
    
    // Wrapper con efectos
    const content = (
      <group position={position}>
        {/* Trail wrapper */}
        {enableTrail ? (
          <Trail
            width={trailWidth}
            length={trailLength}
            color={trailColor || colorHex}
            attenuation={(t) => t * t}
          >
            {OrbMesh}
          </Trail>
        ) : (
          OrbMesh
        )}
        
        {/* Glow */}
        {enableGlow && (
          <mesh ref={glowRef}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial
              color={colorHex}
              transparent
              opacity={0.25}
              side={THREE.BackSide}
            />
          </mesh>
        )}
        
        {/* Anillos orbitales */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.015, 16, 64]} />
          <meshBasicMaterial 
            color={colorHex} 
            transparent 
            opacity={isSelected ? 0.7 : 0.3} 
          />
        </mesh>
        
        {/* Sparkles */}
        {enableSparkles && (
          <Sparkles
            count={sparkleCount}
            scale={2}
            size={sparkleSize}
            speed={0.5}
            color={sparkleColor || colorHex}
          />
        )}
        
        {/* Punto de luz */}
        <pointLight
          color={colorHex}
          intensity={isSelected ? 3 : 1.5}
          distance={5}
        />
      </group>
    )
    
    // Wrapper Float si está habilitado
    if (enableFloat) {
      return (
        <Float
          speed={floatSpeed * preset.breathingSpeed}
          rotationIntensity={0.2}
          floatIntensity={floatIntensity}
        >
          {content}
        </Float>
      )
    }
    
    return content
  }
)

// ═══════════════════════════════════════════════════════════════
// PRESETS LISTOS PARA USAR
// ═══════════════════════════════════════════════════════════════

export function BovedaMonteOrb(props: Omit<LiquidOrb3DProps, 'bancoId'>) {
  return <LiquidOrb3D bancoId="boveda_monte" {...props} />
}

export function UtilidadesOrb(props: Omit<LiquidOrb3DProps, 'bancoId'>) {
  return <LiquidOrb3D bancoId="utilidades" sparkleColor="#FF1493" {...props} />
}

export function FletesOrb(props: Omit<LiquidOrb3DProps, 'bancoId'>) {
  return <LiquidOrb3D bancoId="flete_sur" sparkleColor="#8B00FF" {...props} />
}

export function AztecaOrb(props: Omit<LiquidOrb3DProps, 'bancoId'>) {
  return <LiquidOrb3D bancoId="azteca" sparkleColor="#FFD700" {...props} />
}

export function LeftieOrb(props: Omit<LiquidOrb3DProps, 'bancoId'>) {
  return <LiquidOrb3D bancoId="leftie" {...props} />
}

export function ProfitOrb(props: Omit<LiquidOrb3DProps, 'bancoId'>) {
  return <LiquidOrb3D bancoId="profit" sparkleColor="#8B00FF" {...props} />
}

export function BovedaUSAOrb(props: Omit<LiquidOrb3DProps, 'bancoId'>) {
  return <LiquidOrb3D bancoId="boveda_usa" {...props} />
}

export default LiquidOrb3D
