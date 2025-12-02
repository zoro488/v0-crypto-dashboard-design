'use client'

/**
 * GlassButton3D - Botón 3D de cristal estilo Reijo Palmiste
 * Recreado con React Three Fiber para Chronos Dashboard
 * 
 * Características:
 * - Material de transmisión (vidrio real con refracción)
 * - Sistema de luces coloridas (Blue, Orange, Red)
 * - Animaciones hover/click
 * - Post-processing (bloom, chromatic aberration)
 */

import { useRef, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  MeshTransmissionMaterial,
  Environment,
  Float,
  RoundedBox,
  PerspectiveCamera,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// Tipos
export interface GlassButtonProps {
  icon: 'home' | 'chart' | 'wallet' | 'settings' | 'user' | 'bell' | 'search' | 'menu' | 'plus' | 'minus';
  label?: string;
  color?: 'blue' | 'orange' | 'red' | 'purple' | 'green' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

interface GlassButtonMeshProps {
  icon: string;
  color: string;
  isHovered: boolean;
  isPressed: boolean;
  isActive: boolean;
}

// Mapeo de colores
const COLOR_MAP = {
  blue: '#3b82f6',
  orange: '#f97316',
  red: '#ef4444',
  purple: '#8b5cf6',
  green: '#22c55e',
  cyan: '#06b6d4',
}

// Iconos SVG como paths (para uso futuro en 3D)
const _ICON_PATHS: Record<string, string> = {
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  chart: 'M3.5 18.5v-12h4v12zm6 0v-18h4v18zm6 0v-8h4v8z',
  wallet: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  settings: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  minus: 'M19 13H5v-2h14v2z',
}

// Componente de icono 3D
function Icon3D({ icon, color, scale = 1 }: { icon: string; color: string; scale?: number }) {
  const iconRef = useRef<THREE.Group>(null)

  // Crear geometría del icono basada en formas básicas
  const iconGeometry = useMemo(() => {
    switch (icon) {
      case 'home':
        return (
          <group scale={scale * 0.15}>
            {/* Techo triangular */}
            <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.7, 0.7, 0.1]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Base de la casa */}
            <mesh position={[0, -0.2, 0]}>
              <boxGeometry args={[0.5, 0.5, 0.1]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      case 'chart':
        return (
          <group scale={scale * 0.12}>
            {/* Barras del gráfico */}
            <mesh position={[-0.3, -0.1, 0]}>
              <boxGeometry args={[0.2, 0.4, 0.1]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.2, 0.8, 0.1]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.1]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      case 'wallet':
        return (
          <group scale={scale * 0.15}>
            <mesh>
              <boxGeometry args={[0.8, 0.5, 0.15]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.25, 0, 0.08]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#fff" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )
      case 'settings':
        return (
          <group scale={scale * 0.12}>
            {/* Engranaje */}
            <mesh>
              <torusGeometry args={[0.3, 0.1, 8, 6]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )
      case 'user':
        return (
          <group scale={scale * 0.12}>
            {/* Cabeza */}
            <mesh position={[0, 0.25, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Cuerpo */}
            <mesh position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.2, 0.2, 8, 16]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      case 'bell':
        return (
          <group scale={scale * 0.12}>
            <mesh position={[0, 0.1, 0]}>
              <coneGeometry args={[0.3, 0.5, 16]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )
      case 'search':
        return (
          <group scale={scale * 0.12}>
            <mesh>
              <torusGeometry args={[0.25, 0.06, 16, 32]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.25, -0.25, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <capsuleGeometry args={[0.04, 0.2, 8, 16]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      case 'menu':
        return (
          <group scale={scale * 0.12}>
            {[0.25, 0, -0.25].map((y, i) => (
              <mesh key={i} position={[0, y, 0]}>
                <boxGeometry args={[0.6, 0.08, 0.08]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
          </group>
        )
      case 'plus':
        return (
          <group scale={scale * 0.12}>
            <mesh>
              <boxGeometry args={[0.6, 0.12, 0.08]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.12, 0.6, 0.08]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      case 'minus':
        return (
          <mesh scale={scale * 0.12}>
            <boxGeometry args={[0.6, 0.12, 0.08]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
          </mesh>
        )
      default:
        return (
          <mesh scale={scale * 0.12}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
          </mesh>
        )
    }
  }, [icon, color, scale])

  return <group ref={iconRef}>{iconGeometry}</group>
}

// Componente del botón de cristal
function GlassButtonMesh({ icon, color, isHovered, isPressed, isActive }: GlassButtonMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const platformRef = useRef<THREE.Mesh>(null)
  const [hoverY, setHoverY] = useState(0)
  const [pressScale, setPressScale] = useState(1)
  const [rotationY, setRotationY] = useState(0)

  // Animación continua
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Animación de hover (subir/bajar)
      const targetY = isHovered ? 0.15 : 0
      setHoverY(THREE.MathUtils.lerp(hoverY, targetY, 0.1))
      meshRef.current.position.y = hoverY

      // Animación de press (escala)
      const targetScale = isPressed ? 0.9 : 1
      setPressScale(THREE.MathUtils.lerp(pressScale, targetScale, 0.15))
      meshRef.current.scale.setScalar(pressScale)

      // Rotación suave cuando está activo
      if (isActive || isHovered) {
        setRotationY(rotationY + delta * 0.5)
        meshRef.current.rotation.y = Math.sin(rotationY) * 0.1
      }
    }

    // Animación de la plataforma
    if (platformRef.current) {
      platformRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <group>
      {/* Plataforma base giratoria */}
      <mesh ref={platformRef} position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.05, 32]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.3}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Anillo de luz en la base */}
      <mesh position={[0, -0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.02, 16, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 2 : 0.5}
          metalness={1}
          roughness={0}
        />
      </mesh>

      {/* Botón de cristal principal */}
      <mesh ref={meshRef}>
        <RoundedBox args={[0.8, 0.8, 0.25]} radius={0.1} smoothness={4}>
          <MeshTransmissionMaterial
            backside
            samples={16}
            resolution={512}
            transmission={0.95}
            roughness={0.05}
            thickness={0.5}
            ior={1.5}
            chromaticAberration={0.06}
            anisotropy={0.3}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            clearcoat={1}
            attenuationDistance={0.5}
            attenuationColor={color}
            color={isActive ? color : '#ffffff'}
          />
        </RoundedBox>

        {/* Icono dentro del botón */}
        <group position={[0, 0, 0.15]}>
          <Icon3D icon={icon} color={isActive ? '#ffffff' : color} scale={1.2} />
        </group>
      </mesh>

      {/* Brillo superior */}
      <mesh position={[0, 0.35, 0.05]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// Luces del sistema (estilo Reijo Palmiste)
function SceneLights({ primaryColor }: { primaryColor: string }) {
  return (
    <>
      {/* Luz ambiente suave */}
      <ambientLight intensity={0.2} />

      {/* Key Light (luz principal) */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Blue Light */}
      <pointLight position={[-3, 2, 2]} intensity={2} color="#3b82f6" distance={8} />

      {/* Orange Light */}
      <pointLight position={[3, 2, -2]} intensity={2} color="#f97316" distance={8} />

      {/* Red Light (accent) */}
      <pointLight position={[0, -2, 3]} intensity={1} color="#ef4444" distance={6} />

      {/* Spot Light (highlight) */}
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        color={primaryColor}
        castShadow
      />
    </>
  )
}

// Post-processing effects
function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.002, 0.002)}
      />
      <Vignette darkness={0.4} offset={0.3} />
      <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  )
}

// Componente principal exportado
export function GlassButton3D({
  icon,
  label,
  color = 'blue',
  size = 'md',
  onClick,
  isActive = false,
  className = '',
}: GlassButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  // Tamaños
  const sizeMap = {
    sm: { width: 80, height: 80 },
    md: { width: 120, height: 120 },
    lg: { width: 160, height: 160 },
  }

  const dimensions = sizeMap[size]
  const colorHex = COLOR_MAP[color]

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0.5, 2.5]} fov={50} />
          
          <SceneLights primaryColor={colorHex} />
          
          <Float
            speed={2}
            rotationIntensity={0.2}
            floatIntensity={0.3}
            floatingRange={[-0.05, 0.05]}
          >
            <GlassButtonMesh
              icon={icon}
              color={colorHex}
              isHovered={isHovered}
              isPressed={isPressed}
              isActive={isActive}
            />
          </Float>

          <Environment preset="city" />
          <PostProcessing />
        </Suspense>
      </Canvas>

      {/* Label debajo del botón */}
      {label && (
        <motion.p
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-white/70 whitespace-nowrap"
          animate={{
            color: isHovered ? colorHex : 'rgba(255,255,255,0.7)',
          }}
        >
          {label}
        </motion.p>
      )}
    </motion.div>
  )
}

// Exportar componente de grupo de botones para el header
export function GlassButtonGroup({
  buttons,
  activeIndex,
  onSelect,
  className = '',
}: {
  buttons: Array<{ icon: GlassButtonProps['icon']; label: string; color?: GlassButtonProps['color'] }>;
  activeIndex?: number;
  onSelect?: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {buttons.map((button, idx) => (
        <GlassButton3D
          key={idx}
          icon={button.icon}
          label={button.label}
          color={button.color || 'blue'}
          size="sm"
          isActive={activeIndex === idx}
          onClick={() => onSelect?.(idx)}
        />
      ))}
    </div>
  )
}

export default GlassButton3D
