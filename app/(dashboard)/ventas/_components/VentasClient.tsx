'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Package,
  User,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, cn } from '@/app/_lib/utils'
import type { Venta, Banco } from '@/database/schema'

interface VentasStats {
  totalVentas: number
  ventasCompletas: number
  ventasPendientes: number
  ventasParciales: number
  montoTotal: number
  montoPagado: number
  montoRestante: number
}

interface VentasClientProps {
  initialVentas: Venta[]
  initialStats: VentasStats | null
  bancos: Banco[]
}

const estadoConfig = {
  completo: { 
    label: 'Completado', 
    icon: CheckCircle2, 
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  pendiente: { 
    label: 'Pendiente', 
    icon: Clock, 
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  parcial: { 
    label: 'Parcial', 
    icon: AlertCircle, 
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
}

export function VentasClient({ 
  initialVentas, 
  initialStats,
  bancos,
}: VentasClientProps) {
  const [ventas] = useState(initialVentas)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const stats = initialStats || {
    totalVentas: 0,
    ventasCompletas: 0,
    ventasPendientes: 0,
    ventasParciales: 0,
    montoTotal: 0,
    montoPagado: 0,
    montoRestante: 0,
  }

  const filteredVentas = ventas.filter(venta => {
    const matchesSearch = 
      venta.observaciones?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venta.clienteId?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEstado = !filterEstado || venta.estadoPago === filterEstado
    return matchesSearch && matchesEstado
  })

  const statsCards = [
    {
      title: 'Total Ventas',
      value: formatCurrency(stats.montoTotal),
      subtitle: `${stats.totalVentas} ventas`,
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Cobrado',
      value: formatCurrency(stats.montoPagado),
      subtitle: `${stats.ventasCompletas} completadas`,
      icon: CheckCircle2,
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Pendiente',
      value: formatCurrency(stats.montoRestante),
      subtitle: `${stats.ventasPendientes} pendientes`,
      icon: Clock,
      trend: '-3.1%',
      trendUp: false,
    },
    {
      title: 'Parciales',
      value: stats.ventasParciales.toString(),
      subtitle: 'En proceso de cobro',
      icon: AlertCircle,
      trend: '0%',
      trendUp: true,
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
              placeholder="Buscar ventas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filterEstado || ''}
              onChange={(e) => setFilterEstado(e.target.value || null)}
              className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">Todos</option>
              <option value="completo">Completado</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
            </select>
          </div>
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
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Ventas Table */}
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
                  Concepto
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Cliente
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
                {filteredVentas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        {searchQuery || filterEstado 
                          ? 'No se encontraron ventas con esos filtros'
                          : 'No hay ventas registradas'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVentas.map((venta, index) => {
                    const estado = estadoConfig[venta.estadoPago as keyof typeof estadoConfig] || estadoConfig.pendiente
                    const EstadoIcon = estado.icon

                    return (
                      <motion.tr
                        key={venta.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium">{venta.observaciones || 'Sin descripción'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {venta.clienteId || 'Cliente general'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono">{venta.cantidad}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-medium">
                            {formatCurrency(venta.precioTotalVenta)}
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
                            {formatDate(venta.fecha)}
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
                            <button className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                              <Trash2 className="h-4 w-4" />
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
