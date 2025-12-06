'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM ALMACEN PANEL
// Gestión de inventario con visualización 3D y analytics
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  Box,
  RoundedBox,
  Text,
  OrbitControls,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package,
  Plus,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Boxes,
  BarChart3,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/app/_lib/utils'
import type { almacen } from '@/database/schema'
import * as THREE from 'three'

// Usar el tipo inferido de la tabla almacen
type Producto = typeof almacen.$inferSelect
import { useRef } from 'react'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AlmacenStats {
  totalProductos: number
  stockTotal: number
  valorInventario: number
  productosAgotados: number
  productosBajoStock: number
}

interface AlmacenPanelProps {
  productos: Producto[]
  stats: AlmacenStats | null
}

// ═══════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ProductBox({ 
  position, 
  color, 
  height,
  label 
}: { 
  position: [number, number, number]
  color: string
  height: number
  label: string
}) {
  const meshRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1
    }
  })

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={meshRef} position={position}>
        <RoundedBox args={[0.8, height, 0.8]} radius={0.05}>
          <meshStandardMaterial 
            color={color}
            transparent
            opacity={0.8}
            metalness={0.3}
            roughness={0.4}
          />
        </RoundedBox>
        <pointLight color={color} intensity={0.5} distance={2} position={[0, height / 2 + 0.5, 0]} />
      </group>
    </Float>
  )
}

function WarehouseScene({ productos }: { productos: Producto[] }) {
  const maxStock = Math.max(...productos.slice(0, 6).map(p => p.cantidad || 0), 1)
  
  const colors = ['#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899']
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={45} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />
      <Environment preset="warehouse" />
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2.2}
      />
      
      {productos.slice(0, 6).map((producto, i) => {
        const x = (i % 3 - 1) * 1.5
        const z = Math.floor(i / 3) * 1.5 - 0.75
        const height = 0.5 + ((producto.cantidad || 0) / maxStock) * 2
        
        return (
          <ProductBox
            key={producto.id}
            position={[x, height / 2, z]}
            height={height}
            color={colors[i % colors.length]}
            label={producto.nombre}
          />
        )
      })}
      
      {/* Floor Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          transparent
          opacity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendUp,
  color = 'violet',
  alert = false
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'violet' | 'emerald' | 'red' | 'blue' | 'amber'
  alert?: boolean
}) {
  const colorClasses = {
    violet: 'from-violet-500/20 to-purple-500/10 border-violet-500/20',
    emerald: 'from-emerald-500/20 to-green-500/10 border-emerald-500/20',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/20',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    amber: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20',
  }
  
  const iconColors = {
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-6',
        colorClasses[color],
        alert && 'animate-pulse'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white font-mono">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl bg-white/5', iconColors[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {trendUp ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          )}
          <span className={cn('text-sm font-medium', trendUp ? 'text-emerald-400' : 'text-red-400')}>
            {trend}
          </span>
        </div>
      )}
      
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT ROW
// ═══════════════════════════════════════════════════════════════

function ProductRow({ producto, index }: { producto: Producto; index: number }) {
  const stockStatus = useMemo(() => {
    const stock = producto.cantidad || 0
    const min = producto.minimo || 10
    
    if (stock === 0) return { label: 'Agotado', color: 'red', icon: AlertTriangle }
    if (stock <= min) return { label: 'Bajo stock', color: 'amber', icon: AlertTriangle }
    return { label: 'Disponible', color: 'emerald', icon: CheckCircle2 }
  }, [producto])

  const StatusIcon = stockStatus.icon

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group hover:bg-white/[0.02] transition-colors"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 
                        flex items-center justify-center">
            <Package className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="font-medium text-white">{producto.nombre}</p>
            <p className="text-xs text-gray-500">{producto.descripcion || 'Sin descripción'}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-gray-300">{producto.ubicacion || 'General'}</span>
      </td>
      <td className="py-4 px-4">
        <span className="font-mono text-white">{producto.cantidad || 0}</span>
      </td>
      <td className="py-4 px-4">
        <span className="font-mono text-gray-400">{producto.minimo || 10}</span>
      </td>
      <td className="py-4 px-4">
        <span className="font-mono text-white">{formatCurrency(producto.precioCompra || 0)}</span>
      </td>
      <td className="py-4 px-4">
        <span className="font-mono text-emerald-400">{formatCurrency(producto.precioVenta || 0)}</span>
      </td>
      <td className="py-4 px-4">
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          stockStatus.color === 'red' && 'bg-red-500/10 text-red-400 border border-red-500/20',
          stockStatus.color === 'amber' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          stockStatus.color === 'emerald' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        )}>
          <StatusIcon className="h-3 w-3" />
          {stockStatus.label}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
            <Edit className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AlmacenPanelPremium({ productos, stats }: AlmacenPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUbicacion, setFilterUbicacion] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const defaultStats: AlmacenStats = {
    totalProductos: productos.length,
    stockTotal: productos.reduce((sum, p) => sum + (p.cantidad || 0), 0),
    valorInventario: productos.reduce((sum, p) => sum + ((p.cantidad || 0) * (p.precioCompra || 0)), 0),
    productosAgotados: productos.filter(p => (p.cantidad || 0) === 0).length,
    productosBajoStock: productos.filter(p => (p.cantidad || 0) <= (p.minimo || 10) && (p.cantidad || 0) > 0).length,
  }

  const currentStats = stats || defaultStats

  const filteredProductos = useMemo(() => {
    return productos.filter(producto => {
      const matchesSearch = 
        producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesUbicacion = !filterUbicacion || producto.ubicacion === filterUbicacion
      return matchesSearch && matchesUbicacion
    })
  }, [productos, searchQuery, filterUbicacion])

  const ubicaciones = useMemo(() => {
    const ubis = new Set(productos.map(p => p.ubicacion).filter(Boolean))
    return Array.from(ubis) as string[]
  }, [productos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 
                       bg-clip-text text-transparent">
            Almacén e Inventario
          </h1>
          <p className="text-gray-400 mt-1">Gestión de productos y stock</p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                     text-gray-300 hover:bg-white/10 transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Movimiento
          </motion.button>
          <motion.button
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r 
                     from-violet-500 to-purple-600 text-white font-medium"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </motion.button>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="relative h-[280px] rounded-3xl overflow-hidden border border-white/10 
                    bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-violet-500" />
          </div>
        }>
          <Canvas>
            <WarehouseScene productos={productos} />
          </Canvas>
        </Suspense>
        
        <div className="absolute top-4 left-4 p-3 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <Boxes className="h-4 w-4 text-violet-400" />
            <span className="text-white font-medium">{currentStats.stockTotal}</span>
            <span className="text-gray-400">unidades en stock</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Productos"
          value={currentStats.totalProductos}
          subtitle="SKUs registrados"
          icon={Package}
          color="violet"
        />
        <StatCard
          title="Stock Total"
          value={currentStats.stockTotal.toLocaleString()}
          subtitle="Unidades disponibles"
          icon={Boxes}
          color="blue"
        />
        <StatCard
          title="Valor Inventario"
          value={formatCurrency(currentStats.valorInventario)}
          subtitle="Costo de stock"
          icon={BarChart3}
          color="emerald"
        />
        <StatCard
          title="Bajo Stock"
          value={currentStats.productosBajoStock}
          subtitle="Requieren atención"
          icon={AlertTriangle}
          color="amber"
          alert={currentStats.productosBajoStock > 0}
        />
        <StatCard
          title="Agotados"
          value={currentStats.productosAgotados}
          subtitle="Sin stock"
          icon={AlertTriangle}
          color="red"
          alert={currentStats.productosAgotados > 0}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                     text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button className={cn(
            'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
            !filterUbicacion 
              ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          )}
            onClick={() => setFilterUbicacion(null)}
          >
            Todas
          </button>
          {ubicaciones.slice(0, 4).map((ubi) => (
            <button
              key={ubi}
              onClick={() => setFilterUbicacion(ubi)}
              className={cn(
                'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                filterUbicacion === ubi
                  ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              )}
            >
              {ubi}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                         text-gray-400 hover:text-white transition-colors">
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Producto</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Categoría</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Stock</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Mínimo</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">P. Compra</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">P. Venta</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Estado</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProductos.length > 0 ? (
                filteredProductos.map((producto, index) => (
                  <ProductRow key={producto.id} producto={producto} index={index} />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No se encontraron productos</p>
                    <p className="text-sm text-gray-500 mt-1">Intenta con otro término de búsqueda</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AlmacenPanelPremium
