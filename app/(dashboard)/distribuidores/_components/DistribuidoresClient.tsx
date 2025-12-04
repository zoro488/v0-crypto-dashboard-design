'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  UserCheck,
  UserX,
  DollarSign,
  Phone,
  Mail,
  Package,
  Eye,
  Edit,
} from 'lucide-react'
import { formatCurrency, cn } from '@/app/_lib/utils'
import type { Distribuidor } from '@/database/schema'

interface DistribuidoresStats {
  totalDistribuidores: number
  activos: number
  inactivos: number
  saldoPendienteTotal: number
}

interface DistribuidoresClientProps {
  initialDistribuidores: Distribuidor[]
  initialStats: DistribuidoresStats
}

export function DistribuidoresClient({ 
  initialDistribuidores,
  initialStats,
}: DistribuidoresClientProps) {
  const [distribuidores] = useState(initialDistribuidores)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const stats = initialStats

  const filteredDistribuidores = distribuidores.filter(dist => {
    const matchesSearch = 
      dist.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dist.empresa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dist.tipoProductos?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEstado = !filterEstado || dist.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  const statsCards = [
    {
      title: 'Total Distribuidores',
      value: stats.totalDistribuidores.toString(),
      subtitle: 'En catálogo',
      icon: Truck,
      trend: '+2',
      trendUp: true,
    },
    {
      title: 'Activos',
      value: stats.activos.toString(),
      subtitle: 'Con pedidos recientes',
      icon: UserCheck,
      trend: '+1',
      trendUp: true,
    },
    {
      title: 'Por Pagar',
      value: formatCurrency(stats.saldoPendienteTotal),
      subtitle: 'Saldo pendiente',
      icon: DollarSign,
      trend: '-5%',
      trendUp: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </div>
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                stat.trendUp ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
              )}>
                {stat.trendUp ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.trend}
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <stat.icon className="h-24 w-24" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar distribuidores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          
          <select
            value={filterEstado || ''}
            onChange={(e) => setFilterEstado(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Distribuidor
          </button>
        </div>
      </div>

      {/* Distribuidores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredDistribuidores.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-16"
            >
              <Truck className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">
                No hay distribuidores registrados
              </p>
            </motion.div>
          ) : (
            filteredDistribuidores.map((dist, index) => (
              <motion.div
                key={dist.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 hover:border-white/10 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{dist.nombre}</h3>
                      {dist.empresa && (
                        <p className="text-xs text-muted-foreground">{dist.empresa}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Products */}
                {dist.tipoProductos && (
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {dist.tipoProductos}
                    </span>
                  </div>
                )}

                {/* Contact */}
                <div className="space-y-2 text-sm">
                  {dist.telefono && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{dist.telefono}</span>
                    </div>
                  )}
                  {dist.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{dist.email}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {dist.saldoPendiente && dist.saldoPendiente > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                    <p className="font-mono font-medium text-orange-400">
                      {formatCurrency(dist.saldoPendiente)}
                    </p>
                  </div>
                )}

                {/* Estado badge */}
                <div className="absolute top-4 right-4">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    dist.estado === 'activo' 
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  )}>
                    {dist.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
