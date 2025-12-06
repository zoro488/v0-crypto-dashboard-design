'use client'

import { useState, useMemo, useCallback } from 'react'
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
  Trash2,
  X,
  Check,
  Loader2,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { useChronosStore } from '@/app/lib/store'
import { AbonoDistribuidorModal } from '@/app/_components/modals/AbonoDistribuidorModal'
import type { Distribuidor } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// FORM STATE
// ═══════════════════════════════════════════════════════════════════════════
interface DistribuidorFormState {
  nombre: string
  empresa: string
  contacto: string
  telefono: string
  email: string
  direccion: string
  estado: 'activo' | 'inactivo'
  notas: string
}

const initialFormState: DistribuidorFormState = {
  nombre: '',
  empresa: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  estado: 'activo',
  notas: '',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function DistribuidoresClient() {
  // Store subscription - real-time updates
  const distribuidores = useChronosStore(state => state.distribuidores)
  const crearDistribuidor = useChronosStore(state => state.crearDistribuidor)
  const actualizarDistribuidor = useChronosStore(state => state.actualizarDistribuidor)
  const eliminarDistribuidor = useChronosStore(state => state.eliminarDistribuidor)
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<DistribuidorFormState>(initialFormState)
  
  // Estado para edición
  const [editingDistribuidor, setEditingDistribuidor] = useState<Distribuidor | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Estado para modal de abono
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false)
  const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState<string | undefined>(undefined)

  // ═════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES (Auto-updates when store changes)
  // ═════════════════════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const totalDistribuidores = distribuidores.length
    const activos = distribuidores.filter(d => d.estado === 'activo').length
    const inactivos = distribuidores.filter(d => d.estado === 'inactivo').length
    const saldoPendienteTotal = distribuidores.reduce((acc, d) => acc + (d.pendiente || d.deudaTotal || 0), 0)
    const conDeuda = distribuidores.filter(d => (d.pendiente || d.deudaTotal || 0) > 0).length
    
    return {
      totalDistribuidores,
      activos,
      inactivos,
      saldoPendienteTotal,
      conDeuda,
    }
  }, [distribuidores])

  const filteredDistribuidores = useMemo(() => {
    return distribuidores.filter(dist => {
      const matchesSearch = 
        dist.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dist.empresa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dist.contacto?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesEstado = !filterEstado || dist.estado === filterEstado
      return matchesSearch && matchesEstado
    })
  }, [distribuidores, searchQuery, filterEstado])

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
      if (isEditMode && editingDistribuidor) {
        // MODO EDICIÓN
        actualizarDistribuidor(editingDistribuidor.id, {
          nombre: form.nombre.trim(),
          empresa: form.empresa.trim() || undefined,
          contacto: form.contacto.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          email: form.email.trim() || undefined,
          direccion: form.direccion.trim() || undefined,
          estado: form.estado,
        })
        toast.success('Distribuidor actualizado', {
          description: form.nombre,
        })
      } else {
        // MODO CREACIÓN
        const distId = crearDistribuidor({
          nombre: form.nombre.trim(),
          empresa: form.empresa.trim() || undefined,
          contacto: form.contacto.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          email: form.email.trim() || undefined,
          direccion: form.direccion.trim() || undefined,
          estado: form.estado,
          costoTotal: 0,
          abonos: 0,
          pendiente: 0,
          totalOrdenesCompra: 0,
          totalPagado: 0,
          deudaTotal: 0,
          numeroOrdenes: 0,
          keywords: [form.nombre.toLowerCase()],
        })
        toast.success(`Distribuidor ${distId} creado`, {
          description: form.nombre,
        })
      }

      setForm(initialFormState)
      setIsFormOpen(false)
      setIsEditMode(false)
      setEditingDistribuidor(null)
    } catch (error) {
      toast.error(isEditMode ? 'Error al actualizar distribuidor' : 'Error al crear distribuidor', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, crearDistribuidor, isEditMode, editingDistribuidor, actualizarDistribuidor])

  const handleEdit = useCallback((dist: Distribuidor) => {
    setEditingDistribuidor(dist)
    setIsEditMode(true)
    // El estado puede ser 'activo', 'inactivo' o 'suspendido' - convertir suspendido a inactivo
    const estadoNormalizado = dist.estado === 'suspendido' ? 'inactivo' : (dist.estado || 'activo') as 'activo' | 'inactivo'
    setForm({
      nombre: dist.nombre || '',
      empresa: dist.empresa || '',
      contacto: dist.contacto || '',
      telefono: dist.telefono || '',
      email: dist.email || '',
      direccion: dist.direccion || '',
      estado: estadoNormalizado,
      notas: '',
    })
    setIsFormOpen(true)
  }, [])

  const handleDelete = useCallback((dist: Distribuidor) => {
    if (confirm(`¿Eliminar distribuidor ${dist.nombre}?`)) {
      eliminarDistribuidor(dist.id)
      toast.success('Distribuidor eliminado')
    }
  }, [eliminarDistribuidor])

  const resetForm = useCallback(() => {
    setForm(initialFormState)
    setIsFormOpen(false)
    setIsEditMode(false)
    setEditingDistribuidor(null)
  }, [])

  // ═════════════════════════════════════════════════════════════════════════
  // STATS CARDS
  // ═════════════════════════════════════════════════════════════════════════
  const statsCards = [
    {
      title: 'Total Distribuidores',
      value: stats.totalDistribuidores.toString(),
      subtitle: 'En catálogo',
      icon: Truck,
      trend: `${stats.activos} activos`,
      trendUp: true,
    },
    {
      title: 'Activos',
      value: stats.activos.toString(),
      subtitle: 'Con pedidos recientes',
      icon: UserCheck,
      trend: `${Math.round((stats.activos / Math.max(stats.totalDistribuidores, 1)) * 100)}%`,
      trendUp: true,
    },
    {
      title: 'Por Pagar',
      value: formatCurrency(stats.saldoPendienteTotal),
      subtitle: `${stats.conDeuda} con saldo`,
      icon: DollarSign,
      trend: stats.saldoPendienteTotal > 0 ? 'Pendiente' : 'Al día',
      trendUp: stats.saldoPendienteTotal === 0,
    },
  ]

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
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
              placeholder="Buscar distribuidores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          
          <select
            value={filterEstado || ''}
            onChange={(e) => setFilterEstado(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
              setEditingDistribuidor(null)
              setForm(initialFormState)
              setIsFormOpen(true)
            }}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Distribuidor
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
                : "border-orange-500/30 bg-orange-500/5"
            )}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {isEditMode ? `Editar: ${editingDistribuidor?.nombre}` : 'Nuevo Distribuidor'}
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
                    placeholder="Nombre del distribuidor"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => setForm(prev => ({ ...prev, empresa: e.target.value }))}
                    placeholder="Nombre de la empresa"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                {/* Contacto */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={form.contacto}
                    onChange={(e) => setForm(prev => ({ ...prev, contacto: e.target.value }))}
                    placeholder="Persona de contacto"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Notas
                  </label>
                  <input
                    type="text"
                    value={form.notas}
                    onChange={(e) => setForm(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Observaciones..."
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                      ? "bg-gradient-to-r from-amber-500 to-yellow-600" 
                      : "bg-gradient-to-r from-orange-500 to-amber-600"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {isEditMode ? 'Guardar Cambios' : 'Crear Distribuidor'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {searchQuery || filterEstado 
                  ? 'No se encontraron distribuidores'
                  : 'No hay distribuidores registrados'}
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition-colors"
              >
                Agregar primer distribuidor
              </button>
            </motion.div>
          ) : (
            filteredDistribuidores.map((dist, index) => {
              const deuda = dist.pendiente || dist.deudaTotal || 0

              return (
                <motion.div
                  key={dist.id}
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
                      <button 
                        onClick={() => handleEdit(dist)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Editar distribuidor"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(dist)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {dist.contacto && (
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {dist.contacto}
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
                  {deuda > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                          <p className="font-mono font-medium text-orange-400">
                            {formatCurrency(deuda)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setDistribuidorSeleccionado(dist.id)
                            setIsAbonoModalOpen(true)
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Pagar
                        </button>
                      </div>
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
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Actualización en tiempo real • {distribuidores.length} distribuidores</span>
      </div>
      
      {/* Modal de Abono */}
      <AbonoDistribuidorModal
        isOpen={isAbonoModalOpen}
        onClose={() => {
          setIsAbonoModalOpen(false)
          setDistribuidorSeleccionado(undefined)
        }}
        distribuidorPreseleccionado={distribuidorSeleccionado}
      />
    </div>
  )
}
