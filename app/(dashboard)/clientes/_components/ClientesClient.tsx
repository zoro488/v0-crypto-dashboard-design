'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import type { Cliente } from '@/database/schema'

interface ClientesStats {
  totalClientes: number
  clientesActivos: number
  clientesInactivos: number
  clientesSuspendidos?: number
  saldoPendienteTotal: number
  limiteCreditoTotal: number
  clientesConDeuda?: number
}

interface ClientesClientProps {
  initialClientes: Cliente[]
  initialStats: ClientesStats | null
}

const estadoConfig = {
  activo: { 
    label: 'Activo', 
    icon: UserCheck, 
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  inactivo: { 
    label: 'Inactivo', 
    icon: UserX, 
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
}

export function ClientesClient({ 
  initialClientes, 
  initialStats,
}: ClientesClientProps) {
  const [clientes] = useState(initialClientes)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const stats = initialStats || {
    totalClientes: 0,
    clientesActivos: 0,
    clientesInactivos: 0,
    saldoPendienteTotal: 0,
    limiteCreditoTotal: 0,
  }

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = 
      cliente.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.telefono?.includes(searchQuery)
    const matchesEstado = !filterEstado || cliente.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  const statsCards = [
    {
      title: 'Total Clientes',
      value: stats.totalClientes.toString(),
      subtitle: 'En cartera',
      icon: Users,
      trend: '+5',
      trendUp: true,
    },
    {
      title: 'Activos',
      value: stats.clientesActivos.toString(),
      subtitle: 'Con actividad reciente',
      icon: UserCheck,
      trend: '+3',
      trendUp: true,
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(stats.saldoPendienteTotal),
      subtitle: 'Saldo pendiente total',
      icon: DollarSign,
      trend: '-12%',
      trendUp: false,
    },
    {
      title: 'Límite Crédito',
      value: formatCurrency(stats.limiteCreditoTotal),
      subtitle: 'Crédito disponible',
      icon: CreditCard,
      trend: '+$50K',
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
              placeholder="Buscar clientes..."
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
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Clientes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredClientes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-16"
            >
              <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">
                {searchQuery || filterEstado 
                  ? 'No se encontraron clientes'
                  : 'No hay clientes registrados'}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
              >
                Agregar primer cliente
              </button>
            </motion.div>
          ) : (
            filteredClientes.map((cliente, index) => {
              const estado = estadoConfig[cliente.estado as keyof typeof estadoConfig] || estadoConfig.activo
              const EstadoIcon = estado.icon

              return (
                <motion.div
                  key={cliente.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 hover:border-white/10 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-lg font-bold">
                        {cliente.nombre?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold">{cliente.nombre}</h3>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1',
                          estado.bg
                        )}>
                          <EstadoIcon className={cn('h-3 w-3', estado.color)} />
                          {estado.label}
                        </span>
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

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.telefono && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{cliente.telefono}</span>
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{cliente.direccion}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Límite crédito</p>
                      <p className="font-mono font-medium">{formatCurrency(cliente.limiteCredito || 0)}</p>
                    </div>
                    {cliente.saldoPendiente && cliente.saldoPendiente > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                        <p className="font-mono font-medium text-orange-400">
                          {formatCurrency(cliente.saldoPendiente)}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
