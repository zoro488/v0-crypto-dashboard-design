'use client'

import { useState, useMemo, useCallback } from 'react'
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
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { useChronosStore } from '@/app/lib/store'
import { AbonoClienteModal } from '@/app/_components/modals/AbonoClienteModal'
import type { Cliente } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// FORM STATE
// ═══════════════════════════════════════════════════════════════════════════
interface ClienteFormState {
  nombre: string
  email: string
  telefono: string
  direccion: string
  estado: 'activo' | 'inactivo'
  notas: string
}

const initialFormState: ClienteFormState = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  estado: 'activo',
  notas: '',
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO CONFIG
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function ClientesClient() {
  // Store subscription - real-time updates
  const clientes = useChronosStore(state => state.clientes)
  const crearCliente = useChronosStore(state => state.crearCliente)
  const actualizarCliente = useChronosStore(state => state.actualizarCliente)
  const eliminarCliente = useChronosStore(state => state.eliminarCliente)
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<ClienteFormState>(initialFormState)
  
  // Estado para edición
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Estado para modal de abono
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | undefined>(undefined)

  // ═════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES (Auto-updates when store changes)
  // ═════════════════════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const totalClientes = clientes.length
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length
    const clientesInactivos = clientes.filter(c => c.estado === 'inactivo').length
    const saldoPendienteTotal = clientes.reduce((acc, c) => acc + (c.pendiente || c.deudaTotal || c.deuda || 0), 0)
    const totalVentas = clientes.reduce((acc, c) => acc + (c.totalVentas || 0), 0)
    const clientesConDeuda = clientes.filter(c => (c.pendiente || c.deudaTotal || c.deuda || 0) > 0).length
    
    return {
      totalClientes,
      clientesActivos,
      clientesInactivos,
      saldoPendienteTotal,
      totalVentas,
      clientesConDeuda,
    }
  }, [clientes])

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

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═════════════════════════════════════════════════════════════════════════
  const handleSubmit = useCallback(() => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode && editingCliente) {
        // MODO EDICIÓN
        actualizarCliente(editingCliente.id, {
          nombre: form.nombre.trim(),
          email: form.email.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          direccion: form.direccion.trim() || undefined,
          estado: form.estado,
          observaciones: form.notas.trim() || undefined,
        })
        toast.success('Cliente actualizado', {
          description: form.nombre,
        })
      } else {
        // MODO CREACIÓN
        const clienteId = crearCliente({
          nombre: form.nombre.trim(),
          email: form.email.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          direccion: form.direccion.trim() || undefined,
          estado: form.estado,
          actual: 0,
          deuda: 0,
          abonos: 0,
          pendiente: 0,
          totalVentas: 0,
          totalPagado: 0,
          deudaTotal: 0,
          numeroCompras: 0,
          keywords: [form.nombre.toLowerCase()],
          observaciones: form.notas.trim() || undefined,
        })
        toast.success(`Cliente ${clienteId} creado`, {
          description: form.nombre,
        })
      }

      setForm(initialFormState)
      setIsFormOpen(false)
      setIsEditMode(false)
      setEditingCliente(null)
    } catch (error) {
      toast.error(isEditMode ? 'Error al actualizar cliente' : 'Error al crear cliente', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, crearCliente, isEditMode, editingCliente, actualizarCliente])

  const handleEdit = useCallback((cliente: Cliente) => {
    setEditingCliente(cliente)
    setIsEditMode(true)
    setForm({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      estado: cliente.estado || 'activo',
      notas: cliente.observaciones || '',
    })
    setIsFormOpen(true)
  }, [])

  const handleDelete = useCallback((cliente: Cliente) => {
    if (confirm(`¿Eliminar cliente ${cliente.nombre}?`)) {
      eliminarCliente(cliente.id)
      toast.success('Cliente eliminado')
    }
  }, [eliminarCliente])

  const resetForm = useCallback(() => {
    setForm(initialFormState)
    setIsFormOpen(false)
    setIsEditMode(false)
    setEditingCliente(null)
  }, [])

  // ═════════════════════════════════════════════════════════════════════════
  // STATS CARDS CONFIG
  // ═════════════════════════════════════════════════════════════════════════
  const statsCards = [
    {
      title: 'Total Clientes',
      value: stats.totalClientes.toString(),
      subtitle: 'En cartera',
      icon: Users,
      trend: `${stats.clientesActivos} activos`,
      trendUp: true,
    },
    {
      title: 'Activos',
      value: stats.clientesActivos.toString(),
      subtitle: 'Con actividad reciente',
      icon: UserCheck,
      trend: `${Math.round((stats.clientesActivos / Math.max(stats.totalClientes, 1)) * 100)}%`,
      trendUp: true,
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(stats.saldoPendienteTotal),
      subtitle: `${stats.clientesConDeuda} clientes con deuda`,
      icon: DollarSign,
      trend: stats.saldoPendienteTotal > 0 ? 'Pendiente' : 'Al día',
      trendUp: stats.saldoPendienteTotal === 0,
    },
    {
      title: 'Ventas Totales',
      value: formatCurrency(stats.totalVentas),
      subtitle: 'Histórico acumulado',
      icon: CreditCard,
      trend: '+ventas',
      trendUp: true,
    },
  ]

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
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
                stat.trendUp ? 'text-green-400 bg-green-500/10' : 'text-orange-400 bg-orange-500/10'
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
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <select
            value={filterEstado || ''}
            onChange={(e) => setFilterEstado(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            onClick={() => {
              setIsEditMode(false)
              setEditingCliente(null)
              setForm(initialFormState)
              setIsFormOpen(true)
            }}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Inline Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "rounded-2xl border backdrop-blur-xl p-6",
              isEditMode 
                ? "border-amber-500/30 bg-amber-500/5" 
                : "border-blue-500/30 bg-blue-500/5"
            )}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {isEditMode ? `Editar: ${editingCliente?.nombre}` : 'Nuevo Cliente'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nombre */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre del cliente"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+52 555 123 4567"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setForm(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Calle, número, colonia..."
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Estado
                  </label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.value as 'activo' | 'inactivo' }))}
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Notas
                  </label>
                  <input
                    type="text"
                    value={form.notas}
                    onChange={(e) => setForm(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Observaciones..."
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={resetForm}
                  className="h-10 px-4 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "h-10 px-6 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50",
                    isEditMode 
                      ? "bg-gradient-to-r from-amber-500 to-orange-600" 
                      : "bg-gradient-to-r from-blue-500 to-cyan-600"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {isEditMode ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                onClick={() => setIsFormOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
              >
                Agregar primer cliente
              </button>
            </motion.div>
          ) : (
            filteredClientes.map((cliente, index) => {
              const estado = estadoConfig[cliente.estado as keyof typeof estadoConfig] || estadoConfig.activo
              const EstadoIcon = estado.icon
              const deuda = cliente.pendiente || cliente.deudaTotal || cliente.deuda || 0

              return (
                <motion.div
                  key={cliente.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  layout
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
                      <button 
                        onClick={() => handleEdit(cliente)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Editar cliente"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(cliente)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
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
                      <p className="text-xs text-muted-foreground">Total ventas</p>
                      <p className="font-mono font-medium">{formatCurrency(cliente.totalVentas || 0)}</p>
                    </div>
                    {deuda > 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                          <p className="font-mono font-medium text-orange-400">
                            {formatCurrency(deuda)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setClienteSeleccionado(cliente.id)
                            setIsAbonoModalOpen(true)
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Cobrar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                        Al día
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Actualización en tiempo real • {clientes.length} clientes</span>
      </div>
      
      {/* Modal de Abono */}
      <AbonoClienteModal
        isOpen={isAbonoModalOpen}
        onClose={() => {
          setIsAbonoModalOpen(false)
          setClienteSeleccionado(undefined)
        }}
        clientePreseleccionado={clienteSeleccionado}
      />
    </div>
  )
}
