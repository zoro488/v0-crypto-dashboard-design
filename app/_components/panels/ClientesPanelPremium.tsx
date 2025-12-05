'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — PREMIUM CLIENTES PANEL
// Panel de clientes con cards 3D y visualizaciones premium
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Float,
  MeshTransmissionMaterial,
  OrbitControls,
} from '@react-three/drei'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Package,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  UserPlus,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/app/_lib/utils'
import { formatCurrency, formatDate } from '@/app/_lib/utils/formatters'
import type { Cliente } from '@/database/schema'
import * as THREE from 'three'
import { useRef } from 'react'

// ═══════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ClienteOrb({ position, color, scale }: { 
  position: [number, number, number]
  color: string
  scale: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseColor = new THREE.Color(color)
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.3
      const breathe = 1 + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.05
      meshRef.current.scale.setScalar(scale * breathe)
    }
  })
  
  return (
    <Float position={position} speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <MeshTransmissionMaterial
          color={baseColor}
          transmission={0.9}
          thickness={0.3}
          roughness={0.1}
          chromaticAberration={0.5}
        />
      </mesh>
      <pointLight color={color} intensity={1} distance={2} />
    </Float>
  )
}

function ClientesScene({ clientesActivos, clientesInactivos, totalCompras }: { 
  clientesActivos: number
  clientesInactivos: number
  totalCompras: number
}) {
  const orbsData = useMemo(() => {
    const total = clientesActivos + clientesInactivos
    const orbs = []
    
    // Create orbs based on client distribution
    const activeRatio = total > 0 ? clientesActivos / total : 0.5
    const activeCount = Math.min(Math.ceil(activeRatio * 8), 8)
    const inactiveCount = 8 - activeCount
    
    for (let i = 0; i < activeCount; i++) {
      const angle = (i / activeCount) * Math.PI * 2
      const radius = 2 + Math.random() * 0.5
      orbs.push({
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        color: '#22C55E',
        scale: 0.8 + Math.random() * 0.4,
      })
    }
    
    for (let i = 0; i < inactiveCount; i++) {
      const angle = (i / inactiveCount) * Math.PI * 2 + Math.PI / inactiveCount
      const radius = 3 + Math.random() * 0.5
      orbs.push({
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 1.5,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        color: '#6B7280',
        scale: 0.5 + Math.random() * 0.3,
      })
    }
    
    return orbs
  }, [clientesActivos, clientesInactivos])
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={45} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#8B00FF" />
      
      <Environment preset="city" />
      <fog attach="fog" args={['#000000', 8, 20]} />
      
      {orbsData.map((orb, index) => (
        <ClienteOrb key={index} {...orb} />
      ))}
      
      {/* Central orb representing total value */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh>
          <icosahedronGeometry args={[1, 2]} />
          <MeshTransmissionMaterial
            color="#8B00FF"
            transmission={0.95}
            thickness={0.5}
            roughness={0.05}
            chromaticAberration={0.8}
          />
        </mesh>
        <pointLight color="#8B00FF" intensity={2} distance={4} />
      </Float>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// STATS CARD
// ═══════════════════════════════════════════════════════════════

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: typeof Users
  trend?: number
  gradient: string
  delay?: number
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, gradient, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 500, damping: 30 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative group overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br backdrop-blur-xl",
        "border border-white/10 hover:border-white/20",
        "transition-all duration-300",
        gradient
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
          
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}>
              <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-white/60 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
        
        {subtitle && (
          <p className="text-xs text-white/40 mt-2">{subtitle}</p>
        )}
      </div>
      
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CLIENT CARD
// ═══════════════════════════════════════════════════════════════

interface ClienteCardProps {
  cliente: Cliente
  index: number
  onView: (id: string) => void
  onEdit: (id: string) => void
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 500, damping: 30 },
  }),
}

function ClienteCard({ cliente, index, onView, onEdit }: ClienteCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  
  const isActive = cliente.estado === 'activo'
  
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "group relative p-5 rounded-2xl cursor-pointer",
        "bg-white/5 hover:bg-white/10",
        "border border-white/5 hover:border-violet-500/30",
        "transition-all duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
            isActive 
              ? "bg-gradient-to-br from-violet-500 to-purple-600" 
              : "bg-gray-700"
          )}>
            {cliente.nombre?.[0]?.toUpperCase() || 'C'}
          </div>
          
          <div>
            <h3 className="font-medium text-white">{cliente.nombre}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "flex items-center gap-1 text-xs",
                isActive ? "text-green-400" : "text-gray-500"
              )}>
                {isActive ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
              
              {(cliente.limiteCredito ?? 0) > 50000 && (
                <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                  <Star className="h-3 w-3 fill-current" />
                  Premium
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal className="h-4 w-4" />
          </motion.button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 w-36 py-1 rounded-xl bg-zinc-900 border border-white/10 shadow-xl z-10"
              >
                <button 
                  onClick={() => onView(cliente.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Eye className="h-4 w-4" />
                  Ver detalles
                </button>
                <button 
                  onClick={() => onEdit(cliente.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {cliente.telefono && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Phone className="h-4 w-4" />
            <span>{cliente.telefono}</span>
          </div>
        )}
        {cliente.email && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="h-4 w-4" />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}
        {cliente.direccion && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{cliente.direccion}</span>
          </div>
        )}
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div>
          <p className="text-xs text-gray-500">Límite Crédito</p>
          <p className="text-lg font-bold text-white">
            {formatCurrency(cliente.limiteCredito ?? 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Saldo</p>
          <p className="text-sm text-gray-300">
            {formatCurrency(cliente.saldoPendiente ?? 0)}
          </p>
        </div>
      </div>
      
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ClientesPanelPremiumProps {
  clientes: Cliente[]
  onNewCliente?: () => void
  onViewCliente?: (id: string) => void
  onEditCliente?: (id: string) => void
}

export function ClientesPanelPremium({ 
  clientes, 
  onNewCliente,
  onViewCliente,
  onEditCliente,
}: ClientesPanelPremiumProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = clientes.length
    const activos = clientes.filter(c => c.estado === 'activo').length
    const inactivos = total - activos
    const totalCredito = clientes.reduce((sum, c) => sum + (c.limiteCredito ?? 0), 0)
    const saldoTotal = clientes.reduce((sum, c) => sum + (c.saldoPendiente ?? 0), 0)
    
    return { total, activos, inactivos, totalCredito, saldoTotal }
  }, [clientes])
  
  // Filter
  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const matchesSearch = 
        cliente.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.telefono?.includes(searchQuery)
      const matchesEstado = !filterEstado || cliente.estado === filterEstado
      return matchesSearch && matchesEstado
    })
  }, [clientes, searchQuery, filterEstado])

  const handleView = useCallback((id: string) => onViewCliente?.(id), [onViewCliente])
  const handleEdit = useCallback((id: string) => onEditCliente?.(id), [onEditCliente])

  return (
    <div className="min-h-screen bg-black p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Clientes
            </h1>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
              <Sparkles className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-300">Premium</span>
            </div>
          </div>
          <p className="text-gray-400">
            Gestiona tu cartera de clientes
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewCliente}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl",
            "bg-gradient-to-r from-blue-600 to-cyan-600",
            "hover:from-blue-500 hover:to-cyan-500",
            "text-white font-medium",
            "shadow-lg shadow-blue-500/25",
            "transition-all duration-200"
          )}
        >
          <UserPlus className="h-5 w-5" />
          Nuevo Cliente
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clientes"
          value={stats.total}
          subtitle={`${stats.activos} activos`}
          icon={Users}
          trend={8.5}
          gradient="from-blue-500/20 to-cyan-500/10"
          delay={0}
        />
        <StatsCard
          title="Clientes Activos"
          value={stats.activos}
          subtitle={`${((stats.activos / stats.total) * 100).toFixed(0)}% del total`}
          icon={CheckCircle2}
          trend={5.2}
          gradient="from-green-500/20 to-emerald-500/10"
          delay={0.1}
        />
        <StatsCard
          title="Crédito Total"
          value={formatCurrency(stats.totalCredito)}
          subtitle="Límite acumulado"
          icon={Package}
          trend={12.3}
          gradient="from-violet-500/20 to-purple-500/10"
          delay={0.2}
        />
        <StatsCard
          title="Saldo Pendiente"
          value={formatCurrency(stats.saldoTotal)}
          subtitle="Por cobrar"
          icon={Star}
          trend={2.1}
          gradient="from-yellow-500/20 to-amber-500/10"
          delay={0.3}
        />
      </div>

      {/* 3D Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20"
      >
        <Canvas>
          <Suspense fallback={null}>
            <ClientesScene 
              clientesActivos={stats.activos}
              clientesInactivos={stats.inactivos}
              totalCompras={stats.totalCredito}
            />
          </Suspense>
        </Canvas>
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Activos: {stats.activos}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" /> Inactivos: {stats.inactivos}
          </span>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar clientes..."
            className={cn(
              "w-full pl-12 pr-4 py-3 rounded-xl",
              "bg-white/5 border border-white/10",
              "text-white placeholder-gray-400",
              "focus:outline-none focus:border-blue-500/50",
              "transition-colors"
            )}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilterEstado(filterEstado === 'activo' ? null : 'activo')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              filterEstado === 'activo'
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-white/5 border-white/10 text-gray-400"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Activos
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilterEstado(filterEstado === 'inactivo' ? null : 'inactivo')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              filterEstado === 'inactivo'
                ? "bg-gray-500/20 border-gray-500/30 text-gray-300"
                : "bg-white/5 border-white/10 text-gray-400"
            )}
          >
            <XCircle className="h-4 w-4" />
            Inactivos
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-400"
          >
            <Filter className="h-5 w-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-400"
          >
            <Download className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Clientes Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredClientes.length > 0 ? (
            filteredClientes.map((cliente, index) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                index={index}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-16"
            >
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No se encontraron clientes
              </h3>
              <p className="text-gray-500">
                {searchQuery || filterEstado 
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Comienza agregando tu primer cliente'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default ClientesPanelPremium
