'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM DISTRIBUIDORES PANEL
// Gestión de distribuidores con visualización 3D y analytics
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  Sphere,
  MeshDistortMaterial,
  OrbitControls,
  Text,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  TrendingUp,
  Star,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatCurrency } from '@/app/_lib/utils'
import type { Distribuidor } from '@/database/schema'
import * as THREE from 'three'
import { useRef } from 'react'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DistribuidoresStats {
  totalDistribuidores: number
  activos: number
  inactivos: number
  saldoTotalPendiente: number
}

interface DistribuidoresPanelProps {
  distribuidores: Distribuidor[]
  stats: DistribuidoresStats | null
}

// ═══════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════

function DistributorNode({ 
  position, 
  color, 
  size,
  active
}: { 
  position: [number, number, number]
  color: string
  size: number
  active: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <Float speed={active ? 2 : 0.5} rotationIntensity={0.3} floatIntensity={active ? 0.5 : 0.2}>
      <mesh ref={meshRef} position={position} scale={size}>
        <dodecahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color={color}
          speed={active ? 2 : 0.5}
          distort={0.2}
          radius={1}
          transparent
          opacity={active ? 0.9 : 0.5}
        />
      </mesh>
      <pointLight 
        color={color} 
        intensity={active ? 1.5 : 0.5} 
        distance={3} 
        position={position} 
      />
    </Float>
  )
}

function DistribuidoresScene({ distribuidores }: { distribuidores: Distribuidor[] }) {
  const colors = ['#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4']
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={45} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Environment preset="city" />
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
      
      {/* Central hub */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Distributor nodes */}
      {distribuidores.slice(0, 6).map((dist, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 3
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const isActive = dist.estado === 'activo'
        
        return (
          <group key={dist.id}>
            <DistributorNode
              position={[x, 0, z]}
              color={colors[i % colors.length]}
              size={0.4}
              active={isActive}
            />
            {/* Connection line */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([0, 0, 0, x, 0, z]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={colors[i % colors.length]} transparent opacity={0.3} />
            </line>
          </group>
        )
      })}
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
  color = 'violet'
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: string
  color?: 'violet' | 'emerald' | 'red' | 'blue' | 'amber'
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
        colorClasses[color]
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
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">{trend}</span>
        </div>
      )}
      
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTOR CARD
// ═══════════════════════════════════════════════════════════════

function DistribuidorCard({ 
  distribuidor, 
  index 
}: { 
  distribuidor: Distribuidor
  index: number 
}) {
  const isActive = distribuidor.estado === 'activo'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] 
               hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
    >
      {/* Status indicator */}
      <div className={cn(
        'absolute top-4 right-4 h-3 w-3 rounded-full',
        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'
      )} />
      
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 
                      flex items-center justify-center">
          <Building2 className="h-7 w-7 text-violet-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{distribuidor.nombre}</h3>
          <p className="text-sm text-gray-400 truncate">{distribuidor.empresa || 'Sin empresa'}</p>
          
          <div className="mt-3 space-y-2">
            {distribuidor.telefono && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{distribuidor.telefono}</span>
              </div>
            )}
            {distribuidor.email && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="truncate">{distribuidor.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Productos</p>
          <p className="text-sm font-medium text-white">{distribuidor.tipoProductos || 'Varios'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Saldo Pendiente</p>
          <p className={cn(
            'text-sm font-mono font-medium',
            (distribuidor.saldoPendiente || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
          )}>
            {formatCurrency(distribuidor.saldoPendiente || 0)}
          </p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg 
                         bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-300 
                         transition-colors text-sm">
          <Eye className="h-4 w-4" />
          Ver
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg 
                         bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white 
                         transition-colors text-sm">
          <Edit className="h-4 w-4" />
          Editar
        </button>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DistribuidoresPanelPremium({ distribuidores, stats }: DistribuidoresPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<'activo' | 'inactivo' | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const defaultStats: DistribuidoresStats = {
    totalDistribuidores: distribuidores.length,
    activos: distribuidores.filter(d => d.estado === 'activo').length,
    inactivos: distribuidores.filter(d => d.estado === 'inactivo').length,
    saldoTotalPendiente: distribuidores.reduce((sum, d) => sum + (d.saldoPendiente || 0), 0),
  }

  const currentStats = stats || defaultStats

  const filteredDistribuidores = useMemo(() => {
    return distribuidores.filter(dist => {
      const matchesSearch = 
        dist.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dist.empresa && dist.empresa.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesEstado = !filterEstado || dist.estado === filterEstado
      return matchesSearch && matchesEstado
    })
  }, [distribuidores, searchQuery, filterEstado])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 
                       bg-clip-text text-transparent">
            Distribuidores
          </h1>
          <p className="text-gray-400 mt-1">Red de proveedores y socios comerciales</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r 
                   from-violet-500 to-purple-600 text-white font-medium"
        >
          <Plus className="h-4 w-4" />
          Nuevo Distribuidor
        </motion.button>
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
            <DistribuidoresScene distribuidores={distribuidores} />
          </Canvas>
        </Suspense>
        
        <div className="absolute top-4 left-4 p-3 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-violet-400" />
            <span className="text-white font-medium">{currentStats.activos}</span>
            <span className="text-gray-400">distribuidores activos</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Distribuidores"
          value={currentStats.totalDistribuidores}
          subtitle="Registrados en el sistema"
          icon={Users}
          color="violet"
        />
        <StatCard
          title="Activos"
          value={currentStats.activos}
          subtitle="Operando actualmente"
          icon={CheckCircle2}
          trend="+2 este mes"
          color="emerald"
        />
        <StatCard
          title="Inactivos"
          value={currentStats.inactivos}
          subtitle="Pausados o dados de baja"
          icon={XCircle}
          color="amber"
        />
        <StatCard
          title="Saldo Pendiente"
          value={formatCurrency(currentStats.saldoTotalPendiente)}
          subtitle="Total a pagar"
          icon={DollarSign}
          color="blue"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                     text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {[
            { id: null, label: 'Todos' },
            { id: 'activo', label: 'Activos' },
            { id: 'inactivo', label: 'Inactivos' },
          ].map((filter) => (
            <button
              key={filter.id || 'all'}
              onClick={() => setFilterEstado(filter.id as typeof filterEstado)}
              className={cn(
                'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                filterEstado === filter.id
                  ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                         text-gray-400 hover:text-white transition-colors">
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Distributors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDistribuidores.length > 0 ? (
          filteredDistribuidores.map((dist, index) => (
            <DistribuidorCard key={dist.id} distribuidor={dist} index={index} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron distribuidores</p>
            <p className="text-sm text-gray-500 mt-1">Intenta con otro término de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DistribuidoresPanelPremium
