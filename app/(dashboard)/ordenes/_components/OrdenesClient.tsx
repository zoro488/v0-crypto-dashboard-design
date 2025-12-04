'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Download,
  ArrowUpRight,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  DollarSign,
  Calendar,
  Eye,
  Edit,
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/app/_lib/utils'
import type { OrdenCompra, Distribuidor } from '@/database/schema'

interface OrdenesStats {
  totalOrdenes: number
  pendientes: number
  parciales: number
  completadas: number
  montoTotal: number
}

interface OrdenesClientProps {
  initialOrdenes: (OrdenCompra & { distribuidor?: Distribuidor | null })[]
  distribuidores: Distribuidor[]
  initialStats: OrdenesStats
}

const estadoConfig = {
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  parcial: {
    label: 'Parcial',
    icon: Truck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  completo: {
    label: 'Completada',
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  cancelado: {
    label: 'Cancelada',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
}

export function OrdenesClient({ 
  initialOrdenes,
  distribuidores,
  initialStats,
}: OrdenesClientProps) {
  const [ordenes] = useState(initialOrdenes)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const stats = initialStats

  const filteredOrdenes = ordenes.filter(orden => {
    const matchesSearch = 
      orden.observaciones?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orden.distribuidor?.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEstado = !filterEstado || orden.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  const statsCards = [
    {
      title: 'Total Órdenes',
      value: stats.totalOrdenes.toString(),
      subtitle: formatCurrency(stats.montoTotal),
      icon: Package,
      color: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Pendientes',
      value: stats.pendientes.toString(),
      subtitle: 'Por procesar',
      icon: Clock,
      color: 'from-yellow-500 to-amber-600',
    },
    {
      title: 'Parciales',
      value: stats.parciales.toString(),
      subtitle: 'En proceso',
      icon: Truck,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Completadas',
      value: stats.completadas.toString(),
      subtitle: 'Entregadas',
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'relative overflow-hidden rounded-2xl p-6',
              'bg-gradient-to-br',
              stat.color
            )}
          >
            <div className="relative z-10">
              <p className="text-sm text-white/80">{stat.title}</p>
              <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              <p className="text-xs text-white/60 mt-1">{stat.subtitle}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20">
              <stat.icon className="h-24 w-24 text-white" />
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
              placeholder="Buscar órdenes..."
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
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_transito">En Tránsito</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Ordenes Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Orden
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Distribuidor
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Cantidad
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Total
                </th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Estado
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Fecha
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredOrdenes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        No hay órdenes registradas
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrdenes.map((orden, index) => {
                    const estado = estadoConfig[orden.estado as keyof typeof estadoConfig] || estadoConfig.pendiente
                    const EstadoIcon = estado.icon

                    return (
                      <motion.tr
                        key={orden.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium">{orden.numeroOrden || orden.observaciones || 'Sin descripción'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                              <Truck className="h-4 w-4 text-orange-400" />
                            </div>
                            <span className="text-sm">
                              {orden.distribuidor?.nombre || 'Sin asignar'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono">{orden.cantidad}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-medium">
                            {formatCurrency(orden.total || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                              estado.bg
                            )}>
                              <EstadoIcon className={cn('h-3.5 w-3.5', estado.color)} />
                              {estado.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(orden.fecha)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
