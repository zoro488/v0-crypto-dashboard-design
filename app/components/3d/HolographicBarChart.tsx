'use client'
/**
 * 📊 HOLOGRAPHIC BAR CHART - Gráfico de Barras 3D Holográfico
 * 
 * Visualización de datos como hologramas proyectados con:
 * - InstancedMesh para rendimiento óptimo (1 draw call)
 * - Shader personalizado con efecto scanline
 * - Transparencia aditiva y Fresnel
 * - Animación fluida en GPU
 * - Base proyectora brillante
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Float, RoundedBox } from '@react-three/drei'
import {
  holographicBarVertexShader,
  holographicBarFragmentShader,
} from './shaders/NeuralCoreShaders'

// ============================================================================
// TIPOS
// ============================================================================
interface HolographicBarChartProps {
  /** Datos para las barras (valores 0-100) */
  data: number[]
  /** Etiquetas para cada barra */
  labels?: string[]
  /** Colores personalizados */
  colors?: string[]
  /** Posición en el espacio 3D */
  position?: [number, number, number]
  /** Escala general */
  scale?: number
  /** Animación de entrada */
  animate?: boolean
  /** Callback al hacer hover */
  onBarHover?: (index: number, value: number) => void
  /** Modo de visualización */
  variant?: 'bars' | 'pillars' | 'crystals'
  /** Altura máxima de las barras */
  maxHeight?: number
}

// ============================================================================
// PALETA DE COLORES HOLOGRÁFICOS
// ============================================================================
const HOLOGRAPHIC_COLORS = [
  '#00d4ff', // Cian
  '#7b2cbf', // Púrpura
  '#ff006e', // Magenta
  '#00ff88', // Verde neón
  '#ffbe0b', // Dorado
  '#3a86ff', // Azul
  '#ff5400', // Naranja
]

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function HolographicBarChart({
  data,
  labels = [],
  colors = HOLOGRAPHIC_COLORS,
  position = [0, 0, 0],
  scale = 1,
  animate = true,
  onBarHover,
  variant = 'bars',
  maxHeight = 2,
}: HolographicBarChartProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const barsRef = useRef<THREE.InstancedMesh>(null!)
  const progressRef = useRef(0)
  const hoveredIndexRef = useRef(-1)

  // Normalizar datos
  const maxValue = Math.max(...data, 1)
  const normalizedData = data.map(v => (v / maxValue) * maxHeight)
  const barCount = data.length

  // Dimensiones
  const barWidth = 0.3 * scale
  const barDepth = 0.3 * scale
  const gap = 0.15 * scale
  const totalWidth = barCount * (barWidth + gap) - gap

  // ══════════════════════════════════════════════════════════════════════════
  // GEOMETRÍA Y MATERIAL INSTANCIADO
  // ══════════════════════════════════════════════════════════════════════════
  const { geometry, material, matrices, colorArray } = useMemo(() => {
    // Geometría base (caja redondeada)
    const geo = new THREE.BoxGeometry(barWidth, 1, barDepth, 1, 8, 1)
    
    // Crear atributos personalizados
    const heights = new Float32Array(barCount)
    const indices = new Float32Array(barCount)
    const barColors = new Float32Array(barCount * 3)
    
    for (let i = 0; i < barCount; i++) {
      heights[i] = normalizedData[i]
      indices[i] = i
      
      const color = new THREE.Color(colors[i % colors.length])
      barColors[i * 3] = color.r
      barColors[i * 3 + 1] = color.g
      barColors[i * 3 + 2] = color.b
    }

    // Material shader personalizado
    const mat = new THREE.ShaderMaterial({
      vertexShader: holographicBarVertexShader,
      fragmentShader: holographicBarFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uHover: { value: 0 },
        uOpacity: { value: 0.85 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Matrices de transformación
    const mats: THREE.Matrix4[] = []
    for (let i = 0; i < barCount; i++) {
      const matrix = new THREE.Matrix4()
      const x = i * (barWidth + gap) - totalWidth / 2 + barWidth / 2
      matrix.setPosition(x, 0, 0)
      mats.push(matrix)
    }

    return { geometry: geo, material: mat, matrices: mats, colorArray: barColors }
  }, [barCount, normalizedData, colors, barWidth, barDepth, gap, totalWidth])

  // ══════════════════════════════════════════════════════════════════════════
  // ACTUALIZAR INSTANCIAS
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!barsRef.current) return

    const mesh = barsRef.current
    const dummy = new THREE.Object3D()

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap) - totalWidth / 2 + barWidth / 2
      const height = normalizedData[i] * progressRef.current
      
      dummy.position.set(x, height / 2, 0)
      dummy.scale.set(1, Math.max(height, 0.01), 1)
      dummy.updateMatrix()
      
      mesh.setMatrixAt(i, dummy.matrix)
      
      // Color
      const color = new THREE.Color(colors[i % colors.length])
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [barCount, normalizedData, colors, barWidth, gap, totalWidth])

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMACIÓN
  // ══════════════════════════════════════════════════════════════════════════
  useFrame((state) => {
    if (!barsRef.current || !groupRef.current) return

    const time = state.clock.getElapsedTime()
    
    // Animación de entrada
    if (animate && progressRef.current < 1) {
      progressRef.current = Math.min(progressRef.current + 0.02, 1)
    }

    // Actualizar uniforms del material
    const mat = material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = time
    mat.uniforms.uProgress.value = progressRef.current

    // Actualizar posiciones de las barras
    const mesh = barsRef.current
    const dummy = new THREE.Object3D()

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap) - totalWidth / 2 + barWidth / 2
      const baseHeight = normalizedData[i] * progressRef.current
      
      // Micro-animación de "respiración"
      const breathe = Math.sin(time * 2 + i * 0.5) * 0.02
      const height = baseHeight * (1 + breathe)
      
      dummy.position.set(x, height / 2, 0)
      dummy.scale.set(1, Math.max(height, 0.01), 1)
      dummy.updateMatrix()
      
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true

    // Rotación suave del grupo
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.05
  })

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={groupRef} position={position}>
        {/* Barras Instanciadas */}
        <instancedMesh
          ref={barsRef}
          args={[geometry, material, barCount]}
          frustumCulled={false}
        />

        {/* Base Proyectora */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[totalWidth + 0.5, barDepth + 0.5]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Anillo de luz de la base */}
        <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, totalWidth / 2 + 0.3, 64]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Líneas de grid */}
        <GridLines width={totalWidth} depth={barDepth} />

        {/* Etiquetas (opcional) */}
        {labels.length > 0 && (
          <BarLabels
            labels={labels}
            data={data}
            barWidth={barWidth}
            gap={gap}
            totalWidth={totalWidth}
          />
        )}
      </group>
    </Float>
  )
}

// ============================================================================
// COMPONENTE DE LÍNEAS DE GRID
// ============================================================================
function GridLines({ width, depth }: { width: number; depth: number }) {
  const linesRef = useRef<THREE.LineSegments>(null!)

  useFrame((state) => {
    if (!linesRef.current) return
    const mat = linesRef.current.material as THREE.LineBasicMaterial
    mat.opacity = 0.1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.05
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions: number[] = []
    
    // Líneas verticales
    const lineCount = 10
    for (let i = 0; i <= lineCount; i++) {
      const x = (i / lineCount - 0.5) * width
      positions.push(x, 0, -depth / 2, x, 2, -depth / 2)
    }
    
    // Líneas horizontales
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * 2
      positions.push(-width / 2, y, -depth / 2, width / 2, y, -depth / 2)
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [width, depth])

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial
        color="#00d4ff"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}

// ============================================================================
// COMPONENTE DE ETIQUETAS
// ============================================================================
function BarLabels({
  labels,
  data,
  barWidth,
  gap,
  totalWidth,
}: {
  labels: string[]
  data: number[]
  barWidth: number
  gap: number
  totalWidth: number
}) {
  // Las etiquetas se renderizan con Html de drei en el componente padre
  // Aquí solo retornamos un placeholder para futura implementación
  return null
}

// ============================================================================
// VERSIÓN SIMPLIFICADA PARA USO RÁPIDO
// ============================================================================
export function SimpleHolographicChart({
  data,
  position = [0, 0, 0],
}: {
  data: number[]
  position?: [number, number, number]
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const maxValue = Math.max(...data, 1)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1
  })

  return (
    <group ref={groupRef} position={position}>
      {data.map((value, i) => {
        const height = (value / maxValue) * 1.5
        const x = (i - data.length / 2) * 0.4
        const color = HOLOGRAPHIC_COLORS[i % HOLOGRAPHIC_COLORS.length]

        return (
          <group key={i} position={[x, height / 2, 0]}>
            <RoundedBox args={[0.25, height, 0.25]} radius={0.02}>
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
              />
            </RoundedBox>
            {/* Glow */}
            <pointLight
              position={[0, height / 2, 0]}
              color={color}
              intensity={0.3}
              distance={1}
            />
          </group>
        )
      })}

      {/* Base */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[data.length * 0.25, 32]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  )
}
