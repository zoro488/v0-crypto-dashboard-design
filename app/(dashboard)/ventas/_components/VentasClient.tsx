'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — VENTAS CLIENT (REAL-TIME)
// Conexión directa a Zustand Store + Modales Premium
// Actualizaciones automáticas sin recargar
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useEffect } from 'react'
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
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Package,
  User,
  Calendar,
  X,
  CreditCard,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { useChronosStore } from '@/app/lib/store'
import { Modal, Button, ModalFooter } from '@/app/_components/ui/Modal'
import { VentaModal, AbonoClienteModal } from '@/app/_components/modals'
import type { Venta as VentaType, BancoId } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(dateInput: string | Date | { toDate?: () => Date } | undefined | null): string {
  if (!dateInput) return 'Sin fecha'
  try {
    let date: Date
    if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      // Firestore Timestamp
      date = dateInput.toDate()
    } else {
      return 'Fecha inválida'
    }
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  } catch {
    return 'Fecha inválida'
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface VentasClientProps {
  initialVentas?: VentaType[]
  initialStats?: VentasStats | null
}

interface VentasStats {
  totalVentas: number
  ventasCompletas: number
  ventasPendientes: number
  ventasParciales: number
  montoTotal: number
  montoPagado: number
  montoRestante: number
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// QUICK VENTA FORM (MODAL INTERNO)
// ═══════════════════════════════════════════════════════════════════════════

interface QuickVentaFormProps {
  onSuccess: () => void
  onCancel: () => void
}

function QuickVentaForm({ onSuccess, onCancel }: QuickVentaFormProps) {
  const { crearVenta, clientes, ordenesCompra } = useChronosStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    cliente: '',
    clienteId: '',
    cantidad: 1,
    precioVenta: 10000,
    precioFlete: 500,
    estadoPago: 'pendiente' as 'completo' | 'parcial' | 'pendiente',
    montoPagado: 0,
    ocRelacionada: '',
    observaciones: '',
  })

  // OCs disponibles con stock
  const ocsDisponibles = ordenesCompra.filter(oc => oc.stockActual > 0)
  const ocSeleccionada = ordenesCompra.find(oc => oc.id === form.ocRelacionada)
  const precioCompra = ocSeleccionada?.costoPorUnidad || 6300
  
  // Cálculos GYA
  const calculos = useMemo(() => {
    const total = form.precioVenta * form.cantidad
    const bovedaMonte = precioCompra * form.cantidad
    const fletes = form.precioFlete * form.cantidad
    const utilidades = (form.precioVenta - precioCompra - form.precioFlete) * form.cantidad
    
    const pagado = form.estadoPago === 'completo' ? total :
                   form.estadoPago === 'parcial' ? form.montoPagado : 0
    
    return { total, bovedaMonte, fletes, utilidades, pagado, restante: total - pagado }
  }, [form, precioCompra])
  
  const handleSubmit = async () => {
    if (!form.cliente.trim()) {
      toast.error('Ingresa el nombre del cliente')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const ventaId = crearVenta({
        cliente: form.cliente,
        clienteId: form.clienteId || '',
        cantidad: form.cantidad,
        precioVenta: form.precioVenta,
        precioCompra: precioCompra,
        flete: form.precioFlete > 0 ? 'Aplica' : 'NoAplica',
        fleteUtilidad: form.precioFlete * form.cantidad,
        ocRelacionada: form.ocRelacionada || '',
        estadoPago: form.estadoPago,
        estatus: form.estadoPago === 'completo' ? 'Pagado' : 
                 form.estadoPago === 'parcial' ? 'Parcial' : 'Pendiente',
        montoPagado: calculos.pagado,
        montoRestante: calculos.restante,
        fecha: new Date().toISOString(),
        notas: form.observaciones,
      })
      
      toast.success(`Venta ${ventaId} creada exitosamente`, {
        description: `${form.cantidad} unidades × ${formatCurrency(form.precioVenta)} = ${formatCurrency(calculos.total)}`,
      })
      
      onSuccess()
    } catch (error) {
      toast.error('Error al crear venta', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Cliente */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Cliente *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.cliente}
            onChange={e => setForm({ ...form, cliente: e.target.value })}
            placeholder="Nombre del cliente..."
            className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          {clientes.length > 0 && (
            <select
              value={form.clienteId}
              onChange={e => {
                const c = clientes.find(c => c.id === e.target.value)
                setForm({ 
                  ...form, 
                  clienteId: e.target.value,
                  cliente: c?.nombre || form.cliente 
                })
              }}
              className="w-1/3 h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Existente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* OC Relacionada */}
      {ocsDisponibles.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Orden de Compra</label>
          <select
            value={form.ocRelacionada}
            onChange={e => setForm({ ...form, ocRelacionada: e.target.value })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">Sin OC vinculada</option>
            {ocsDisponibles.map(oc => (
              <option key={oc.id} value={oc.id}>
                {oc.id} - {oc.distribuidor} ({oc.stockActual} disponibles)
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Cantidad y Precios */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Cantidad</label>
          <input
            type="number"
            min={1}
            max={ocSeleccionada?.stockActual || 9999}
            value={form.cantidad}
            onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-lg focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Precio Venta</label>
          <input
            type="number"
            min={0}
            step={100}
            value={form.precioVenta}
            onChange={e => setForm({ ...form, precioVenta: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Flete/Unidad</label>
          <input
            type="number"
            min={0}
            step={50}
            value={form.precioFlete}
            onChange={e => setForm({ ...form, precioFlete: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>
      
      {/* Estado de Pago */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Estado de Pago</label>
        <div className="grid grid-cols-3 gap-2">
          {(['completo', 'parcial', 'pendiente'] as const).map(estado => (
            <button
              key={estado}
              type="button"
              onClick={() => setForm({ 
                ...form, 
                estadoPago: estado,
                montoPagado: estado === 'completo' ? calculos.total : 
                             estado === 'parcial' ? form.montoPagado : 0
              })}
              className={cn(
                'h-12 rounded-xl font-medium transition-all capitalize',
                form.estadoPago === estado
                  ? estado === 'completo' ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50' :
                    estado === 'parcial' ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/50' :
                    'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              )}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>
      
      {/* Monto Pagado (solo si es parcial) */}
      {form.estadoPago === 'parcial' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Monto Pagado</label>
          <input
            type="number"
            min={0}
            max={calculos.total}
            step={100}
            value={form.montoPagado}
            onChange={e => setForm({ ...form, montoPagado: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      )}
      
      {/* Observaciones */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Observaciones</label>
        <textarea
          value={form.observaciones}
          onChange={e => setForm({ ...form, observaciones: e.target.value })}
          placeholder="Notas adicionales..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>
      
      {/* Distribución GYA Preview */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-gray-300">Distribución GYA</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Bóveda Monte (Costo):</span>
            <span className="text-blue-400 font-mono">{formatCurrency(calculos.bovedaMonte)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Fletes:</span>
            <span className="text-cyan-400 font-mono">{formatCurrency(calculos.fletes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Utilidades (Ganancia):</span>
            <span className="text-green-400 font-mono">{formatCurrency(calculos.utilidades)}</span>
          </div>
          <div className="pt-3 mt-3 border-t border-white/10 flex justify-between">
            <span className="text-white font-medium">Total Venta:</span>
            <span className="text-xl font-bold text-violet-400">{formatCurrency(calculos.total)}</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          isLoading={isSubmitting}
          icon={<Plus className="w-4 h-4" />}
        >
          Crear Venta
        </Button>
      </ModalFooter>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABONO MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface AbonoModalProps {
  venta: VentaType
  onClose: () => void
}

function AbonoModal({ venta, onClose }: AbonoModalProps) {
  const { abonarVenta } = useChronosStore()
  const [monto, setMonto] = useState(venta.montoRestante || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleAbonar = () => {
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    
    setIsSubmitting(true)
    try {
      abonarVenta(venta.id, monto)
      toast.success('Abono registrado', {
        description: `Se abonaron ${formatCurrency(monto)} a la venta ${venta.id}`
      })
      onClose()
    } catch (error) {
      toast.error('Error al abonar')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Registrar Abono"
      subtitle={`Venta ${venta.id} - ${venta.cliente}`}
      size="sm"
    >
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Total venta:</span>
            <span className="font-mono">{formatCurrency(venta.precioTotalVenta || 0)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Ya pagado:</span>
            <span className="font-mono text-green-400">{formatCurrency(venta.montoPagado || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Restante:</span>
            <span className="font-mono text-yellow-400">{formatCurrency(venta.montoRestante || 0)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Monto a abonar</label>
          <input
            type="number"
            min={0}
            max={venta.montoRestante || 0}
            step={100}
            value={monto}
            onChange={e => setMonto(Number(e.target.value))}
            className="w-full h-14 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono text-xl focus:ring-2 focus:ring-purple-500 transition-all"
          />
          
          <div className="flex gap-2 mt-3">
            {[0.25, 0.5, 0.75, 1].map(factor => (
              <button
                key={factor}
                onClick={() => setMonto(Math.round((venta.montoRestante || 0) * factor))}
                className="flex-1 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                {factor * 100}%
              </button>
            ))}
          </div>
        </div>
        
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="primary" 
            onClick={handleAbonar}
            isLoading={isSubmitting}
            icon={<CreditCard className="w-4 h-4" />}
          >
            Abonar {formatCurrency(monto)}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function VentasClient({ 
  initialVentas = [],
  initialStats,
}: VentasClientProps) {
  // ═══════════════════════════════════════════════════════════════════════
  // ZUSTAND STORE (Real-time updates)
  // ═══════════════════════════════════════════════════════════════════════
  const storeVentas = useChronosStore(state => state.ventas)
  const storeBancos = useChronosStore(state => state.bancos)
  const eliminarVenta = useChronosStore(state => state.eliminarVenta)
  
  // Usar ventas del store si hay, si no las iniciales
  const ventas = storeVentas.length > 0 ? storeVentas : initialVentas
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<VentaType | null>(null)
  const [showAbonoModal, setShowAbonoModal] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED STATS (tiempo real desde el store)
  // ═══════════════════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const ventasCompletas = ventas.filter(v => v.estadoPago === 'completo')
    const ventasPendientes = ventas.filter(v => v.estadoPago === 'pendiente')
    const ventasParciales = ventas.filter(v => v.estadoPago === 'parcial')
    
    return {
      totalVentas: ventas.length,
      ventasCompletas: ventasCompletas.length,
      ventasPendientes: ventasPendientes.length,
      ventasParciales: ventasParciales.length,
      montoTotal: ventas.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0),
      montoPagado: ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0),
      montoRestante: ventas.reduce((acc, v) => acc + (v.montoRestante || 0), 0),
    }
  }, [ventas])

  // ═══════════════════════════════════════════════════════════════════════
  // FILTERED VENTAS
  // ═══════════════════════════════════════════════════════════════════════
  const filteredVentas = useMemo(() => {
    return ventas.filter(venta => {
      const matchesSearch = 
        venta.notas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venta.cliente?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venta.id?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesEstado = !filterEstado || venta.estadoPago === filterEstado
      return matchesSearch && matchesEstado
    })
  }, [ventas, searchQuery, filterEstado])

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  const handleDelete = useCallback((id: string) => {
    if (confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) {
      eliminarVenta(id)
      toast.success('Venta eliminada')
    }
  }, [eliminarVenta])
  
  const handleAbonar = useCallback((venta: VentaType) => {
    setSelectedVenta(venta)
    setShowAbonoModal(true)
  }, [])

  // ═══════════════════════════════════════════════════════════════════════
  // STATS CARDS CONFIG
  // ═══════════════════════════════════════════════════════════════════════
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
    <>
      {/* Modal Nueva Venta - Wizard Premium */}
      <VentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* Modal Abono Cliente */}
      {selectedVenta && (
        <AbonoClienteModal
          isOpen={showAbonoModal}
          onClose={() => {
            setShowAbonoModal(false)
            setSelectedVenta(null)
          }}
          clientePreseleccionado={selectedVenta.clienteId}
        />
      )}
      
      {/* Legacy Modal (DEPRECATED) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Venta"
        subtitle="Registra una nueva venta con distribución GYA automática"
        size="lg"
      >
        <QuickVentaForm 
          onSuccess={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      
      {/* Modal Abono */}
      {showAbonoModal && selectedVenta && (
        <AbonoModal 
          venta={selectedVenta} 
          onClose={() => {
            setShowAbonoModal(false)
            setSelectedVenta(null)
          }} 
        />
      )}
    
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
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-4">
                    ID / Cliente
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    OC
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Cant.
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    P.Venta
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Total
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4 text-amber-400/80">
                    Bóveda
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4 text-blue-400/80">
                    Fletes
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4 text-green-400/80">
                    Utilidad
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Pagado
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Fecha
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredVentas.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                          {searchQuery || filterEstado 
                            ? 'No se encontraron ventas con esos filtros'
                            : 'No hay ventas registradas'}
                        </p>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                        >
                          + Crear primera venta
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredVentas.map((venta, index) => {
                      const estado = estadoConfig[venta.estadoPago as keyof typeof estadoConfig] || estadoConfig.pendiente
                      const EstadoIcon = estado.icon
                      
                      // Calcular distribución GYA si no está en el objeto
                      const precioVenta = venta.precioVenta || 0
                      const precioCompra = venta.precioCompra || 6300
                      const flete = venta.precioFlete || 500
                      const cantidad = venta.cantidad || 0
                      
                      const bovedaMonte = venta.bovedaMonte || (precioCompra * cantidad)
                      const fletes = venta.fleteUtilidad || (flete * cantidad)
                      const utilidad = venta.utilidad || ((precioVenta - precioCompra - flete) * cantidad)

                      return (
                        <motion.tr
                          key={venta.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="group hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-400" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{venta.id}</div>
                                <div className="text-xs text-muted-foreground">{venta.cliente || 'Sin cliente'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="text-xs font-mono text-gray-400">
                              {venta.ocRelacionada || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm">{cantidad}</span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-gray-300">
                              {formatCurrency(precioVenta)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono font-medium">
                              {formatCurrency(venta.precioTotalVenta || 0)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-amber-400">
                              {formatCurrency(bovedaMonte)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-blue-400">
                              {formatCurrency(fletes)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-green-400 font-medium">
                              {formatCurrency(utilidad)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-emerald-400">
                              {formatCurrency(venta.montoPagado || 0)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-center">
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                                estado.bg
                              )}>
                                <EstadoIcon className={cn('h-3 w-3', estado.color)} />
                                {estado.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(venta.fecha)}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {venta.estadoPago !== 'completo' && (
                                <button 
                                  onClick={() => handleAbonar(venta)}
                                  className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                                  title="Registrar abono"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(venta.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
        
        {/* Total Footer con Distribución GYA */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Resumen GYA */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 via-blue-500/5 to-green-500/5 border border-white/10 flex items-center gap-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Distribución GYA:</div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-amber-400/70">Bóveda Monte</div>
                <div className="font-mono font-bold text-amber-400">
                  {formatCurrency(filteredVentas.reduce((acc, v) => {
                    const pc = v.precioCompra || 6300
                    return acc + (pc * (v.cantidad || 0))
                  }, 0))}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-xs text-blue-400/70">Flete Sur</div>
                <div className="font-mono font-bold text-blue-400">
                  {formatCurrency(filteredVentas.reduce((acc, v) => {
                    const flete = v.precioFlete || 500
                    return acc + (flete * (v.cantidad || 0))
                  }, 0))}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-xs text-green-400/70">Utilidades</div>
                <div className="font-mono font-bold text-green-400">
                  {formatCurrency(filteredVentas.reduce((acc, v) => {
                    const pv = v.precioVenta || 0
                    const pc = v.precioCompra || 6300
                    const fl = v.precioFlete || 500
                    return acc + ((pv - pc - fl) * (v.cantidad || 0))
                  }, 0))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Resumen de totales */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 flex items-center gap-6">
            <div className="text-sm text-gray-400">
              {filteredVentas.length} ventas mostradas
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-500">Total en tabla</div>
                <div className="font-mono font-bold text-purple-400">
                  {formatCurrency(filteredVentas.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Cobrado</div>
                <div className="font-mono font-bold text-green-400">
                  {formatCurrency(filteredVentas.reduce((acc, v) => acc + (v.montoPagado || 0), 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
