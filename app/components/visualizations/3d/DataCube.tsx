'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Text, Float, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { logger } from '@/app/lib/utils/logger'

interface DataPoint {
  label: string
  value: number
  color: string
  position: [number, number, number]
}

interface AnimatedDataCubeProps {
  data: DataPoint[]
  onDataPointClick?: (point: DataPoint) => void
}

function AnimatedDataCube({ data, onDataPointClick }: AnimatedDataCubeProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const cubesRef = useRef<THREE.Mesh[]>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Rotación global suave
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.2
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.1
    }

    // Animación individual de cubos
    cubesRef.current.forEach((cube, i) => {
      if (cube) {
        const isHovered = hoveredIndex === i
        const targetScale = isHovered ? 1.3 : 1
        cube.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        
        // Levitación individual
        const floatOffset = Math.sin(time * 2 + i * 0.5) * 0.1
        cube.position.y = data[i].position[1] + floatOffset
      }
    })
  })

  return (
    <group ref={groupRef}>
      {/* Estructura principal del cubo grande */}
      <Box args={[4, 4, 4]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.1}
          wireframe={false}
        />
        <Edges color="#06b6d4" />
      </Box>

      {/* Grid interno */}
      {[-1, 0, 1].map((x) =>
        [-1, 0, 1].map((y) =>
          [-1, 0, 1].map((z) => (
            <mesh key={`grid-${x}-${y}-${z}`} position={[x * 1.5, y * 1.5, z * 1.5]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
            </mesh>
          )),
        ),
      )}

      {/* Data points como cubos 3D */}
      {data.map((point, index) => (
        <Float
          key={point.label}
          speed={1 + index * 0.1}
          rotationIntensity={0.3}
          floatIntensity={0.2}
        >
          <group position={point.position}>
            {/* Cubo de datos */}
            <Box
              ref={(el) => {
                if (el) cubesRef.current[index] = el
              }}
              args={[0.4, 0.4, 0.4]}
              onPointerOver={() => setHoveredIndex(index)}
              onPointerOut={() => setHoveredIndex(null)}
              onClick={() => {
                logger.info('Data point clicked', { context: 'DataCube', data: { point } })
                onDataPointClick?.(point)
              }}
            >
              <meshStandardMaterial
                color={point.color}
                emissive={point.color}
                emissiveIntensity={hoveredIndex === index ? 1 : 0.3}
                metalness={0.8}
                roughness={0.2}
              />
              <Edges color="#ffffff" />
            </Box>

            {/* Texto flotante */}
            {hoveredIndex === index && (
              <Text
                position={[0, 0.5, 0]}
                fontSize={0.15}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {point.label}
                {'\n'}
                {point.value.toLocaleString()}
              </Text>
            )}

            {/* Líneas de conexión al centro */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...point.position,
                    0, 0, 0,
                  ])}
                  itemSize={3}
                  args={[new Float32Array([...point.position, 0, 0, 0]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={point.color}
                transparent
                opacity={hoveredIndex === index ? 0.6 : 0.2}
                linewidth={2}
              />
            </line>

            {/* Anillo orbital alrededor del cubo */}
            {hoveredIndex === index && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.6, 0.02, 16, 50]} />
                <meshBasicMaterial color={point.color} transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        </Float>
      ))}

      {/* Núcleo central brillante */}
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#06b6d4"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Partículas flotantes */}
      {Array.from({ length: 50 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2
        const radius = 2 + Math.random() * 1
        const height = (Math.random() - 0.5) * 4
        
        return (
          <mesh
            key={`particle-${i}`}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius,
            ]}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial
              color="#06b6d4"
              transparent
              opacity={0.6}
            />
          </mesh>
        )
      })}
    </group>
  )
}

interface DataCubeProps {
  data?: DataPoint[]
  className?: string
  onDataPointClick?: (point: DataPoint) => void
}

export function DataCube({
  data = [
    { label: 'Ventas', value: 1250000, color: '#10b981', position: [1.5, 1.5, 1.5] },
    { label: 'Ganancias', value: 380000, color: '#3b82f6', position: [-1.5, 1.5, 1.5] },
    { label: 'Clientes', value: 245, color: '#f59e0b', position: [1.5, -1.5, 1.5] },
    { label: 'Productos', value: 89, color: '#8b5cf6', position: [-1.5, -1.5, 1.5] },
    { label: 'Distribuidores', value: 34, color: '#ec4899', position: [1.5, 1.5, -1.5] },
    { label: 'Órdenes', value: 167, color: '#06b6d4', position: [-1.5, 1.5, -1.5] },
    { label: 'Reportes', value: 523, color: '#14b8a6', position: [1.5, -1.5, -1.5] },
    { label: 'Almacén', value: 1823, color: '#f97316', position: [-1.5, -1.5, -1.5] },
  ],
  className = '',
  onDataPointClick,
}: DataCubeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -20 }}
      animate={{ opacity: 1, rotateX: 0 }}
      transition={{ duration: 0.8, type: 'spring' }}
      className={`w-full h-full ${className}`}
    >
      <Canvas
        camera={{ position: [6, 6, 6], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Iluminación */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#8b5cf6" intensity={0.5} />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          color="#06b6d4"
        />

        {/* Cubo de datos */}
        <AnimatedDataCube data={data} onDataPointClick={onDataPointClick} />

        {/* Controles */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxDistance={12}
          minDistance={4}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Leyenda inferior */}
      <div className="absolute bottom-4 left-4 backdrop-blur-xl bg-black/60 rounded-xl p-4 border border-white/20">
        <p className="text-white text-xs font-bold mb-3">Cubo de Datos 3D</p>
        <div className="grid grid-cols-2 gap-2">
          {data.slice(0, 4).map((point) => (
            <div key={point.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: point.color }}
              />
              <p className="text-white/80 text-xs">{point.label}</p>
            </div>
          ))}
        </div>
        <p className="text-white/60 text-xs mt-3">
          🖱️ Haz clic en los cubos para más detalles
        </p>
      </div>
    </motion.div>
  )
}
