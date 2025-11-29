"use client"

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import useSpline from "@splinetool/r3f-spline"
import * as THREE from "three"
import { motion, AnimatePresence } from "framer-motion"

// URL de la escena de iconos de Spline
const SPLINE_ICONS_URL = "https://prod.spline.design/DUQQ1uM7jFjBMRzW/scene.splinecode"

// Mapeo de secciones del sidebar a nombres de nodos en Spline
// Nota: Estos nombres deben ajustarse según los nodos reales en tu escena de Spline
const SECTION_NODE_MAP: Record<string, string[]> = {
  dashboard: ["Dashboard", "Icon_Dashboard", "dashboard_icon", "Home"],
  analytics: ["Analytics", "Icon_Analytics", "analytics_icon", "Chart", "Graph"],
  wallets: ["Wallets", "Icon_Wallets", "wallets_icon", "Wallet", "Money"],
  settings: ["Settings", "Icon_Settings", "settings_icon", "Gear", "Config"],
  ordenes: ["Orders", "Icon_Orders", "ordenes_icon", "Cart", "Shopping"],
  ventas: ["Sales", "Icon_Sales", "ventas_icon", "TrendingUp", "Graph"],
  almacen: ["Warehouse", "Icon_Warehouse", "almacen_icon", "Box", "Storage"],
  distribuidores: ["Distributors", "Icon_Distributors", "distribuidores_icon", "Users", "People"],
  clientes: ["Clients", "Icon_Clients", "clientes_icon", "User", "Person"],
  reportes: ["Reports", "Icon_Reports", "reportes_icon", "BarChart", "Stats"],
}

// Interface para las props del componente
interface NavIcons3DProps {
  section: string
  isActive?: boolean
  isHovered?: boolean
  onClick?: () => void
  onHover?: (hovering: boolean) => void
  size?: number
  className?: string
}

// Interface para el estado del icono
interface IconState {
  scale: THREE.Vector3
  rotation: THREE.Euler
  position: THREE.Vector3
}

// Componente interno del icono 3D dentro del Canvas
function SplineIcon({
  section,
  isActive,
  isHovered,
  onClick,
}: {
  section: string
  isActive: boolean
  isHovered: boolean
  onClick?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const scaleRef = useRef(1)
  const rotationYRef = useRef(0)
  
  // Cargar la escena de Spline
  const splineResult = useSpline(SPLINE_ICONS_URL)
  const nodes = splineResult.nodes
  
  // Encontrar el nodo correcto para esta sección
  const targetNode = useMemo(() => {
    const possibleNames = SECTION_NODE_MAP[section] || [section]
    
    for (const name of possibleNames) {
      // Buscar en los nodos directamente
      if (nodes && nodes[name]) {
        return nodes[name] as THREE.Object3D
      }
    }
    
    return null
  }, [nodes, section])
  
  // Animación con useFrame
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    // Escala objetivo basada en hover/active
    const targetScale = isHovered ? 1.2 : isActive ? 1.1 : 1.0
    
    // Rotación suave en hover
    const targetRotationY = isHovered 
      ? rotationYRef.current + delta * 2 
      : isActive 
        ? Math.sin(state.clock.elapsedTime * 2) * 0.1 
        : 0
    
    // Interpolar escala con spring (usando damp de maath)
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * 8)
    rotationYRef.current = THREE.MathUtils.lerp(rotationYRef.current, targetRotationY, delta * 4)
    
    // Aplicar transformaciones
    groupRef.current.scale.setScalar(scaleRef.current)
    groupRef.current.rotation.y = rotationYRef.current
    
    // Efecto de flotación sutil cuando está activo
    if (isActive) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, delta * 5)
    }
  })
  
  // Si no encontramos el nodo, mostrar un placeholder
  if (!targetNode) {
    return (
      <group ref={groupRef} onClick={onClick}>
        <mesh>
          <icosahedronGeometry args={[0.4, 2]} />
          <meshStandardMaterial
            color={isActive ? "#4a90d9" : isHovered ? "#6366f1" : "#374151"}
            emissive={isActive ? "#4a90d9" : isHovered ? "#6366f1" : "#000000"}
            emissiveIntensity={isActive ? 0.5 : isHovered ? 0.3 : 0}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Glow ring para placeholder */}
        {(isActive || isHovered) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.02, 16, 32]} />
            <meshBasicMaterial
              color={isActive ? "#4a90d9" : "#6366f1"}
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
      </group>
    )
  }
  
  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive object={targetNode.clone()} />
      
      {/* Efecto de glow cuando está activo */}
      {(isActive || isHovered) && (
        <pointLight
          color={isActive ? "#4a90d9" : "#6366f1"}
          intensity={isActive ? 1 : 0.5}
          distance={2}
          decay={2}
        />
      )}
    </group>
  )
}

// Componente de fallback durante la carga
function LoadingIcon() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshBasicMaterial color="#4a90d9" wireframe transparent opacity={0.5} />
    </mesh>
  )
}

// Componente principal exportado
export function NavIcons3D({
  section,
  isActive = false,
  isHovered = false,
  onClick,
  onHover,
  size = 40,
  className = "",
}: NavIcons3DProps) {
  const [internalHover, setInternalHover] = useState(false)
  const effectiveHover = isHovered || internalHover
  
  const handlePointerEnter = useCallback(() => {
    setInternalHover(true)
    onHover?.(true)
  }, [onHover])
  
  const handlePointerLeave = useCallback(() => {
    setInternalHover(false)
    onHover?.(false)
  }, [onHover])
  
  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={<LoadingIcon />}>
          <ambientLight intensity={0.5} />
          <pointLight position={[2, 2, 2]} intensity={0.5} />
          <SplineIcon
            section={section}
            isActive={isActive}
            isHovered={effectiveHover}
            onClick={onClick}
          />
        </Suspense>
      </Canvas>
      
      {/* Indicador de estado activo */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Componente de barra de navegación completa con iconos 3D
interface NavBar3DProps {
  items: Array<{
    id: string
    label: string
    section: string
  }>
  activeSection: string
  onSectionChange: (section: string) => void
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function NavBar3D({
  items,
  activeSection,
  onSectionChange,
  orientation = "vertical",
  className = "",
}: NavBar3DProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  
  return (
    <div
      className={`
        flex gap-2
        ${orientation === "vertical" ? "flex-col" : "flex-row"}
        ${className}
      `}
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="relative group"
          initial={{ opacity: 0, x: orientation === "vertical" ? -20 : 0, y: orientation === "horizontal" ? -20 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: items.indexOf(item) * 0.1 }}
        >
          <NavIcons3D
            section={item.section}
            isActive={activeSection === item.id}
            isHovered={hoveredItem === item.id}
            onClick={() => onSectionChange(item.id)}
            onHover={(hovering) => setHoveredItem(hovering ? item.id : null)}
            size={48}
          />
          
          {/* Tooltip con el nombre */}
          <AnimatePresence>
            {hoveredItem === item.id && (
              <motion.div
                initial={{ opacity: 0, x: orientation === "vertical" ? 10 : 0, y: orientation === "horizontal" ? 10 : 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: orientation === "vertical" ? 10 : 0, y: orientation === "horizontal" ? 10 : 0 }}
                className={`
                  absolute z-50 px-3 py-1.5 rounded-lg
                  bg-black/80 backdrop-blur-xl border border-white/10
                  text-white text-sm font-medium whitespace-nowrap
                  ${orientation === "vertical" ? "left-full ml-2 top-1/2 -translate-y-1/2" : "top-full mt-2 left-1/2 -translate-x-1/2"}
                `}
              >
                {item.label}
                {/* Flecha del tooltip */}
                <div
                  className={`
                    absolute w-2 h-2 bg-black/80 border-white/10 rotate-45
                    ${orientation === "vertical" ? "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b" : "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t"}
                  `}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

// Versión simplificada sin Canvas individual (para usar múltiples iconos en un solo Canvas)
interface SplineIconsSceneProps {
  items: Array<{
    id: string
    section: string
    position: [number, number, number]
  }>
  activeSection: string
  hoveredSection: string | null
  onSectionClick: (section: string) => void
}

export function SplineIconsScene({
  items,
  activeSection,
  hoveredSection,
  onSectionClick,
}: SplineIconsSceneProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      
      {items.map((item) => (
        <group key={item.id} position={item.position}>
          <Suspense fallback={<LoadingIcon />}>
            <SplineIcon
              section={item.section}
              isActive={activeSection === item.id}
              isHovered={hoveredSection === item.id}
              onClick={() => onSectionClick(item.id)}
            />
          </Suspense>
        </group>
      ))}
    </>
  )
}

export default NavIcons3D
