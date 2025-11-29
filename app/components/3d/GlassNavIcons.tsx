'use client';

/**
 * GlassNavIcons - Sistema de iconos de navegación 3D glassmorphism
 * Inspirado en los Glass Buttons de Reijo Palmiste
 * Para uso en el Header de Chronos Dashboard
 */

import { useRef, useState, useCallback, Suspense, memo, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import {
  MeshTransmissionMaterial,
  Environment,
  Float,
  RoundedBox,
  Center,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== TIPOS ====================

type IconName = 
  | 'dashboard' 
  | 'analytics' 
  | 'inventory' 
  | 'orders' 
  | 'clients' 
  | 'distributors' 
  | 'banks' 
  | 'vault' 
  | 'expenses' 
  | 'profits'
  | 'settings'
  | 'notifications'
  | 'user'
  | 'search'
  | 'menu';

export interface NavIconProps {
  icon: IconName;
  label?: string;
  isActive?: boolean;
  hasNotification?: boolean;
  notificationCount?: number;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md';
  colorScheme?: 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';
}

interface IconMeshProps {
  icon: IconName;
  color: string;
  isHovered: boolean;
  isActive: boolean;
}

// ==================== CONFIGURACIÓN ====================

const COLOR_SCHEMES = {
  blue: { primary: '#3b82f6', glow: '#60a5fa', accent: '#1d4ed8' },
  purple: { primary: '#8b5cf6', glow: '#a78bfa', accent: '#6d28d9' },
  cyan: { primary: '#06b6d4', glow: '#22d3ee', accent: '#0891b2' },
  emerald: { primary: '#10b981', glow: '#34d399', accent: '#059669' },
  amber: { primary: '#f59e0b', glow: '#fbbf24', accent: '#d97706' },
  rose: { primary: '#f43f5e', glow: '#fb7185', accent: '#e11d48' },
};

const SIZE_MAP = {
  xs: { canvas: 40, scale: 0.6 },
  sm: { canvas: 52, scale: 0.8 },
  md: { canvas: 64, scale: 1 },
};

// ==================== GEOMETRÍAS DE ICONOS ====================

const IconGeometry = memo(function IconGeometry({ 
  icon, 
  color 
}: { 
  icon: IconName; 
  color: string;
}) {
  const materialProps = {
    color,
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 1,
  };

  switch (icon) {
    case 'dashboard':
      return (
        <group scale={0.35}>
          {/* Grid de 4 cuadrados */}
          <mesh position={[-0.3, 0.3, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.3, 0.3, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[-0.3, -0.3, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.3, -0.3, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'analytics':
      return (
        <group scale={0.35}>
          {/* Gráfico de barras ascendente */}
          <mesh position={[-0.4, -0.2, 0]}>
            <boxGeometry args={[0.18, 0.4, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[-0.13, 0, 0]}>
            <boxGeometry args={[0.18, 0.6, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.13, -0.1, 0]}>
            <boxGeometry args={[0.18, 0.5, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.4, 0.15, 0]}>
            <boxGeometry args={[0.18, 0.8, 0.08]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'inventory':
      return (
        <group scale={0.35}>
          {/* Caja/paquete */}
          <mesh>
            <boxGeometry args={[0.7, 0.5, 0.5]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.75, 0.15, 0.55]} />
            <meshStandardMaterial {...materialProps} color={color} />
          </mesh>
        </group>
      );

    case 'orders':
      return (
        <group scale={0.35}>
          {/* Documento/lista */}
          <mesh>
            <boxGeometry args={[0.6, 0.8, 0.06]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Líneas del documento */}
          {[-0.15, 0, 0.15].map((y, i) => (
            <mesh key={i} position={[0, y, 0.04]}>
              <boxGeometry args={[0.4, 0.06, 0.02]} />
              <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
        </group>
      );

    case 'clients':
      return (
        <group scale={0.35}>
          {/* Persona principal */}
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.2, 0.25, 8, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'distributors':
      return (
        <group scale={0.32}>
          {/* Camión de distribución */}
          <mesh position={[-0.15, -0.1, 0]}>
            <boxGeometry args={[0.6, 0.4, 0.3]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.35, -0.05, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.28]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Ruedas */}
          <mesh position={[-0.25, -0.35, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0.25, -0.35, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      );

    case 'banks':
      return (
        <group scale={0.35}>
          {/* Edificio de banco */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.7, 0.5, 0.3]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Columnas */}
          {[-0.2, 0, 0.2].map((x, i) => (
            <mesh key={i} position={[x, -0.1, 0.18]}>
              <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          ))}
          {/* Techo triangular */}
          <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.45, 0.2, 4]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'vault':
      return (
        <group scale={0.35}>
          {/* Bóveda/caja fuerte */}
          <mesh>
            <boxGeometry args={[0.65, 0.65, 0.4]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Rueda de combinación */}
          <mesh position={[0, 0, 0.22]}>
            <torusGeometry args={[0.15, 0.03, 16, 32]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.22]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'expenses':
      return (
        <group scale={0.35}>
          {/* Flecha hacia abajo con moneda */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 32]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.2, 0.35, 16]} />
            <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'profits':
      return (
        <group scale={0.35}>
          {/* Flecha hacia arriba con moneda */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 32]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <coneGeometry args={[0.2, 0.35, 16]} />
            <meshStandardMaterial color="#22c55e" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'settings':
      return (
        <group scale={0.35}>
          {/* Engranaje */}
          <mesh>
            <torusGeometry args={[0.3, 0.08, 8, 6]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'notifications':
      return (
        <group scale={0.35}>
          {/* Campana */}
          <mesh position={[0, 0.1, 0]}>
            <coneGeometry args={[0.3, 0.45, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'user':
      return (
        <group scale={0.35}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <capsuleGeometry args={[0.22, 0.2, 8, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'search':
      return (
        <group scale={0.35}>
          <mesh>
            <torusGeometry args={[0.22, 0.05, 16, 32]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.22, -0.22, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <capsuleGeometry args={[0.04, 0.18, 8, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      );

    case 'menu':
      return (
        <group scale={0.35}>
          {[0.22, 0, -0.22].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <boxGeometry args={[0.55, 0.1, 0.08]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          ))}
        </group>
      );

    default:
      return (
        <mesh scale={0.35}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      );
  }
});

// ==================== MESH DEL ICONO ====================

function NavIconMesh({ icon, color, isHovered, isActive }: IconMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glassRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotación suave en hover
      const targetRotY = isHovered ? Math.sin(state.clock.elapsedTime * 2) * 0.15 : 0;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        0.1
      );

      // Escala en hover
      const targetScale = isHovered ? 1.1 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }

    if (glassRef.current) {
      // Efecto de brillo pulsante cuando está activo
      if (isActive) {
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.9;
        glassRef.current.scale.setScalar(pulse);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Contenedor de cristal */}
      <mesh ref={glassRef}>
        <RoundedBox args={[1, 1, 0.3]} radius={0.15} smoothness={4}>
          <MeshTransmissionMaterial
            backside
            samples={8}
            resolution={256}
            transmission={isActive ? 0.7 : 0.92}
            roughness={0.05}
            thickness={0.3}
            ior={1.5}
            chromaticAberration={0.03}
            clearcoat={1}
            attenuationDistance={0.5}
            attenuationColor={color}
            color={isActive ? color : '#ffffff'}
          />
        </RoundedBox>
      </mesh>

      {/* Icono interior */}
      <group position={[0, 0, 0.2]}>
        <IconGeometry icon={icon} color={isActive ? '#ffffff' : color} />
      </group>

      {/* Borde brillante cuando está activo */}
      {isActive && (
        <mesh>
          <RoundedBox args={[1.05, 1.05, 0.32]} radius={0.16} smoothness={4}>
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              transparent
              opacity={0.3}
              side={THREE.BackSide}
            />
          </RoundedBox>
        </mesh>
      )}
    </group>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

export const GlassNavIcon = memo(function GlassNavIcon({
  icon,
  label,
  isActive = false,
  hasNotification = false,
  notificationCount,
  onClick,
  size = 'sm',
  colorScheme = 'blue',
}: NavIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = COLOR_SCHEMES[colorScheme];
  const dimensions = SIZE_MAP[size];

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ width: dimensions.canvas, height: dimensions.canvas }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Luces */}
          <ambientLight intensity={0.4} />
          <pointLight position={[2, 2, 2]} intensity={1} color={colors.glow} />
          <pointLight position={[-2, -2, 2]} intensity={0.5} color={colors.accent} />

          {/* Icono */}
          <Float speed={3} rotationIntensity={0.1} floatIntensity={0.2}>
            <Center scale={dimensions.scale}>
              <NavIconMesh
                icon={icon}
                color={colors.primary}
                isHovered={isHovered}
                isActive={isActive}
              />
            </Center>
          </Float>

          <Environment preset="city" />

          {/* Post-processing mínimo para performance */}
          <EffectComposer>
            <Bloom
              intensity={isActive ? 0.8 : 0.3}
              luminanceThreshold={0.5}
              luminanceSmoothing={0.9}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Badge de notificación */}
      <AnimatePresence>
        {hasNotification && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center"
          >
            {notificationCount !== undefined && notificationCount > 0 && (
              <span className="text-[10px] font-bold text-white px-1">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip con label */}
      <AnimatePresence>
        {isHovered && label && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs text-white whitespace-nowrap z-50"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador activo */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: colors.primary }}
        />
      )}
    </motion.div>
  );
});

// ==================== BARRA DE NAVEGACIÓN COMPLETA ====================

interface NavBarItem {
  icon: IconName;
  label: string;
  colorScheme?: NavIconProps['colorScheme'];
  hasNotification?: boolean;
  notificationCount?: number;
}

export interface GlassNavBarProps {
  items: NavBarItem[];
  activeIndex?: number;
  onSelect?: (index: number) => void;
  size?: NavIconProps['size'];
  className?: string;
}

export function GlassNavBar({
  items,
  activeIndex = 0,
  onSelect,
  size = 'sm',
  className = '',
}: GlassNavBarProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((item, index) => (
        <GlassNavIcon
          key={item.icon}
          icon={item.icon}
          label={item.label}
          colorScheme={item.colorScheme}
          size={size}
          isActive={activeIndex === index}
          hasNotification={item.hasNotification}
          notificationCount={item.notificationCount}
          onClick={() => onSelect?.(index)}
        />
      ))}
    </div>
  );
}

// ==================== PRESETS PARA CHRONOS ====================

export const CHRONOS_NAV_ITEMS: NavBarItem[] = [
  { icon: 'dashboard', label: 'Dashboard', colorScheme: 'blue' },
  { icon: 'analytics', label: 'Analíticas', colorScheme: 'purple' },
  { icon: 'inventory', label: 'Almacén', colorScheme: 'cyan' },
  { icon: 'orders', label: 'Órdenes', colorScheme: 'emerald', hasNotification: true, notificationCount: 5 },
  { icon: 'clients', label: 'Clientes', colorScheme: 'blue' },
  { icon: 'distributors', label: 'Distribuidores', colorScheme: 'amber' },
  { icon: 'banks', label: 'Bancos', colorScheme: 'emerald' },
  { icon: 'vault', label: 'Bóveda', colorScheme: 'purple' },
  { icon: 'expenses', label: 'Gastos', colorScheme: 'rose' },
  { icon: 'profits', label: 'Utilidades', colorScheme: 'emerald' },
];

export default GlassNavIcon;
