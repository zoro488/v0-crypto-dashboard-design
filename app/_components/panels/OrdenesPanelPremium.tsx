'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM ÓRDENES DE COMPRA PANEL
// Gestión de órdenes con visualización 3D y seguimiento
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  MeshTransmissionMaterial,
  OrbitControls,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  DollarSign,
  Calendar,
  User,
  Eye,
  Edit,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/app/_lib/utils'
import type { OrdenCompra, Distribuidor } from '@/database/schema'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface OrdenesStats {
  totalOrdenes: number
  ordenesPendientes: number
  ordenesCompletadas: number
  ordenesCanceladas: number
  montoTotal: number
  montoPendiente: number
}

interface OrdenesPanelProps {
  ordenes: OrdenCompra[]
  distribuidores: Distribuidor[]
  stats: OrdenesStats | null
}

// ═══════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════

function OrderCube({ 
  position, 
  status, 
  size 
}: { 
  position: [number, number, number]
  status: 'pendiente' | 'parcial' | 'completo' | 'cancelado'
  size: number 
}) {
  const colors = {
    pendiente: '#F59E0B',
    parcial: '#3B82F6',
    completo: '#22C55E',
    cancelado: '#EF4444',
  }
  
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh position={position} scale={size}>
        <boxGeometry args={[1, 1, 1]} />
        <MeshTransmissionMaterial
          color={colors[status]}
          transmission={0.8}
          thickness={0.3}
          roughness={0.1}
          chromaticAberration={0.2}
        />
      </mesh>
      <pointLight color={colors[status]} intensity={1} distance={2} position={position} />
    </Float>
  )
}

function OrdenesScene({ ordenes }: { ordenes: OrdenCompra[] }) {
  const ordenesRecientes = ordenes.slice(0, 9)
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={45} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Environment preset="city" />
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
      />
      
      {ordenesRecientes.map((orden, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const x = (col - 1) * 1.5
        const z = (row - 1) * 1.5
        const status = (orden.estado || 'pendiente') as 'pendiente' | 'parcial' | 'completo' | 'cancelado'
        
        return (
          <OrderCube
            key={orden.id}
            position={[x, 0.5, z]}
            status={status || 'pendiente'}
            size={0.6}
          />
        )
      })}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          transparent
          opacity={0.3}
          metalness={0.9}
          roughness={0.1}
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
  color = 'violet'
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
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
// ORDER ROW
// ═══════════════════════════════════════════════════════════════

const estadoConfig = {
  pendiente: { 
    label: 'Pendiente', 
    icon: Clock, 
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  parcial: { 
    label: 'Parcial', 
    icon: Truck, 
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  completo: { 
    label: 'Completo', 
    icon: CheckCircle2, 
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  cancelado: { 
    label: 'Cancelado', 
    icon: XCircle, 
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
}

function OrdenRow({ 
  orden, 
  distribuidor,
  index 
}: { 
  orden: OrdenCompra
  distribuidor?: Distribuidor
  index: number 
}) {
  const estado = orden.estado as keyof typeof estadoConfig
  const config = estadoConfig[estado] || estadoConfig.pendiente
  const StatusIcon = config.icon

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
            <ShoppingCart className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="font-medium text-white font-mono">#{orden.id.slice(0, 8)}</p>
            <p className="text-xs text-gray-500">
              {formatDate(orden.fecha)}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-gray-300">{distribuidor?.nombre || 'Sin asignar'}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-gray-300">{orden.cantidad} unidades</span>
      </td>
      <td className="py-4 px-4">
        <span className="font-mono text-white">{formatCurrency(orden.total || 0)}</span>
      </td>
      <td className="py-4 px-4">
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
          config.bg, config.color
        )}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
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
          <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function OrdenesPanelPremium({ ordenes, distribuidores, stats }: OrdenesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)

  const defaultStats: OrdenesStats = {
    totalOrdenes: ordenes.length,
    ordenesPendientes: ordenes.filter(o => o.estado === 'pendiente').length,
    ordenesCompletadas: ordenes.filter(o => o.estado === 'completo').length,
    ordenesCanceladas: ordenes.filter(o => o.estado === 'cancelado').length,
    montoTotal: ordenes.reduce((sum, o) => sum + (o.total || 0), 0),
    montoPendiente: ordenes.filter(o => o.estado === 'pendiente').reduce((sum, o) => sum + (o.total || 0), 0),
  }

  const currentStats = stats || defaultStats

  const distribuidoresMap = useMemo(() => {
    return new Map(distribuidores.map(d => [d.id, d]))
  }, [distribuidores])

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter(orden => {
      const dist = distribuidoresMap.get(orden.distribuidorId)
      const matchesSearch = 
        orden.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dist?.nombre && dist.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesEstado = !filterEstado || orden.estado === filterEstado
      return matchesSearch && matchesEstado
    })
  }, [ordenes, searchQuery, filterEstado, distribuidoresMap])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 
                       bg-clip-text text-transparent">
            Órdenes de Compra
          </h1>
          <p className="text-gray-400 mt-1">Gestión de pedidos a distribuidores</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r 
                   from-violet-500 to-purple-600 text-white font-medium"
        >
          <Plus className="h-4 w-4" />
          Nueva Orden
        </motion.button>
      </div>

      {/* 3D Visualization */}
      <div className="relative h-[250px] rounded-3xl overflow-hidden border border-white/10 
                    bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-violet-500" />
          </div>
        }>
          <Canvas>
            <OrdenesScene ordenes={ordenes} />
          </Canvas>
        </Suspense>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-4">
          {Object.entries(estadoConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className={cn('h-3 w-3 rounded-full', 
                key === 'pendiente' && 'bg-amber-500',
                key === 'parcial' && 'bg-blue-500',
                key === 'completo' && 'bg-emerald-500',
                key === 'cancelado' && 'bg-red-500',
              )} />
              <span className="text-gray-400">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Órdenes"
          value={currentStats.totalOrdenes}
          subtitle="Histórico completo"
          icon={ShoppingCart}
          color="violet"
        />
        <StatCard
          title="Pendientes"
          value={currentStats.ordenesPendientes}
          subtitle="Por procesar"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Monto Total"
          value={formatCurrency(currentStats.montoTotal)}
          subtitle="Todas las órdenes"
          icon={DollarSign}
          trend="+12%"
          trendUp={true}
          color="emerald"
        />
        <StatCard
          title="Por Pagar"
          value={formatCurrency(currentStats.montoPendiente)}
          subtitle="Órdenes pendientes"
          icon={Package}
          color="blue"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por ID o distribuidor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                     text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {[
            { id: null, label: 'Todos' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'parcial', label: 'Parciales' },
            { id: 'completo', label: 'Completos' },
            { id: 'cancelado', label: 'Cancelados' },
          ].map((filter) => (
            <button
              key={filter.id || 'all'}
              onClick={() => setFilterEstado(filter.id)}
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

      {/* Orders Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Orden</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Distribuidor</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Cantidad</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Total</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Estado</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrdenes.length > 0 ? (
                filteredOrdenes.map((orden, index) => (
                  <OrdenRow 
                    key={orden.id} 
                    orden={orden} 
                    distribuidor={distribuidoresMap.get(orden.distribuidorId)}
                    index={index} 
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No se encontraron órdenes</p>
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

export default OrdenesPanelPremium
