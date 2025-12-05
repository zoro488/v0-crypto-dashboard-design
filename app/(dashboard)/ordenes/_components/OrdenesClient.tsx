'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — ÓRDENES CLIENT (REAL-TIME)
// Conexión directa a Zustand Store + Modales Premium
// Actualizaciones automáticas sin recargar
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Download,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { useChronosStore } from '@/app/lib/store'
import { Modal, Button, ModalFooter } from '@/app/_components/ui/Modal'
import { OrdenCompraModal, AbonoDistribuidorModal } from '@/app/_components/modals'
import type { OrdenCompra as OCType, BancoId } from '@/app/types'

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

interface OrdenesClientProps {
  initialOrdenes?: OCType[]
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

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
  pagado: {
    label: 'Pagado',
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

// ═══════════════════════════════════════════════════════════════════════════
// QUICK OC FORM (MODAL INTERNO)
// ═══════════════════════════════════════════════════════════════════════════

interface QuickOCFormProps {
  onSuccess: () => void
  onCancel: () => void
}

function QuickOCForm({ onSuccess, onCancel }: QuickOCFormProps) {
  const { crearOrdenCompra, distribuidores, bancos } = useChronosStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    distribuidor: '',
    distribuidorId: '',
    cantidad: 10,
    costoDistribuidor: 6000,
    costoTransporte: 300,
    bancoOrigen: 'boveda_monte' as BancoId,
    pagoInicial: 0,
    notas: '',
  })

  // Cálculos
  const calculos = useMemo(() => {
    const costoUnitario = form.costoDistribuidor + form.costoTransporte
    const costoTotal = costoUnitario * form.cantidad
    const deuda = costoTotal - form.pagoInicial
    
    return { costoUnitario, costoTotal, deuda }
  }, [form])
  
  const handleSubmit = async () => {
    if (!form.distribuidor.trim()) {
      toast.error('Ingresa el nombre del distribuidor')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const ocId = crearOrdenCompra({
        distribuidor: form.distribuidor,
        distribuidorId: form.distribuidorId,
        cantidad: form.cantidad,
        costoDistribuidor: form.costoDistribuidor,
        costoTransporte: form.costoTransporte,
        bancoOrigen: form.bancoOrigen,
        pagoInicial: form.pagoInicial,
        fecha: new Date().toISOString(),
        notas: form.notas,
      })
      
      toast.success(`Orden ${ocId} creada exitosamente`, {
        description: `${form.cantidad} unidades × ${formatCurrency(calculos.costoUnitario)} = ${formatCurrency(calculos.costoTotal)}`,
      })
      
      onSuccess()
    } catch (error) {
      toast.error('Error al crear orden', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Bancos disponibles con capital
  const bancosDisponibles = Object.entries(bancos).filter(([, b]) => b.capitalActual > 0)
  
  return (
    <div className="space-y-6">
      {/* Distribuidor */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Distribuidor *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.distribuidor}
            onChange={e => setForm({ ...form, distribuidor: e.target.value })}
            placeholder="Nombre del distribuidor..."
            className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          {distribuidores.length > 0 && (
            <select
              value={form.distribuidorId}
              onChange={e => {
                const d = distribuidores.find(d => d.id === e.target.value)
                setForm({ 
                  ...form, 
                  distribuidorId: e.target.value,
                  distribuidor: d?.nombre || form.distribuidor 
                })
              }}
              className="w-1/3 h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Existente...</option>
              {distribuidores.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Cantidad y Costos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Cantidad</label>
          <input
            type="number"
            min={1}
            value={form.cantidad}
            onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-lg focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Costo Distribuidor</label>
          <input
            type="number"
            min={0}
            step={100}
            value={form.costoDistribuidor}
            onChange={e => setForm({ ...form, costoDistribuidor: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Transporte</label>
          <input
            type="number"
            min={0}
            step={50}
            value={form.costoTransporte}
            onChange={e => setForm({ ...form, costoTransporte: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>
      
      {/* Banco Origen y Pago Inicial */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Banco para Pago</label>
          <select
            value={form.bancoOrigen}
            onChange={e => setForm({ ...form, bancoOrigen: e.target.value as BancoId })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            {bancosDisponibles.map(([id, b]) => (
              <option key={id} value={id}>
                {b.nombre} ({formatCurrency(b.capitalActual)})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Pago Inicial</label>
          <input
            type="number"
            min={0}
            max={calculos.costoTotal}
            step={1000}
            value={form.pagoInicial}
            onChange={e => setForm({ ...form, pagoInicial: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>
      
      {/* Notas */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Notas</label>
        <textarea
          value={form.notas}
          onChange={e => setForm({ ...form, notas: e.target.value })}
          placeholder="Observaciones adicionales..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>
      
      {/* Resumen */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-gray-300">Resumen de Orden</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Costo unitario:</span>
            <span className="text-orange-400 font-mono">{formatCurrency(calculos.costoUnitario)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Costo total:</span>
            <span className="text-white font-mono font-bold">{formatCurrency(calculos.costoTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pago inicial:</span>
            <span className="text-green-400 font-mono">{formatCurrency(form.pagoInicial)}</span>
          </div>
          <div className="pt-3 mt-3 border-t border-white/10 flex justify-between">
            <span className="text-white font-medium">Deuda restante:</span>
            <span className={cn("text-xl font-bold font-mono", calculos.deuda > 0 ? 'text-red-400' : 'text-green-400')}>
              {formatCurrency(calculos.deuda)}
            </span>
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
          Crear Orden
        </Button>
      </ModalFooter>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABONO OC MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface AbonoOCModalProps {
  orden: OCType
  onClose: () => void
}

function AbonoOCModal({ orden, onClose }: AbonoOCModalProps) {
  const { abonarOrdenCompra, bancos } = useChronosStore()
  const [monto, setMonto] = useState(orden.deuda || 0)
  const [bancoOrigen, setBancoOrigen] = useState<BancoId>('boveda_monte')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const bancosDisponibles = Object.entries(bancos).filter(([, b]) => b.capitalActual > 0)
  
  const handleAbonar = () => {
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    
    const banco = bancos[bancoOrigen]
    if (banco.capitalActual < monto) {
      toast.error(`El banco ${banco.nombre} no tiene suficiente capital`)
      return
    }
    
    setIsSubmitting(true)
    try {
      abonarOrdenCompra(orden.id, monto, bancoOrigen)
      toast.success('Pago registrado', {
        description: `Se pagaron ${formatCurrency(monto)} de la orden ${orden.id}`
      })
      onClose()
    } catch (error) {
      toast.error('Error al procesar pago')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Pagar Orden de Compra"
      subtitle={`Orden ${orden.id} - ${orden.distribuidor}`}
      size="sm"
    >
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Costo total:</span>
            <span className="font-mono">{formatCurrency(orden.costoTotal || 0)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Ya pagado:</span>
            <span className="font-mono text-green-400">{formatCurrency(orden.pagoDistribuidor || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Deuda:</span>
            <span className="font-mono text-red-400">{formatCurrency(orden.deuda || 0)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Banco origen</label>
          <select
            value={bancoOrigen}
            onChange={e => setBancoOrigen(e.target.value as BancoId)}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            {bancosDisponibles.map(([id, b]) => (
              <option key={id} value={id}>
                {b.nombre} ({formatCurrency(b.capitalActual)})
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Monto a pagar</label>
          <input
            type="number"
            min={0}
            max={orden.deuda || 0}
            step={100}
            value={monto}
            onChange={e => setMonto(Number(e.target.value))}
            className="w-full h-14 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-right font-mono text-xl focus:ring-2 focus:ring-purple-500 transition-all"
          />
          
          <div className="flex gap-2 mt-3">
            {[0.25, 0.5, 0.75, 1].map(factor => (
              <button
                key={factor}
                onClick={() => setMonto(Math.round((orden.deuda || 0) * factor))}
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
            Pagar {formatCurrency(monto)}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OrdenesClient({ 
  initialOrdenes = [],
}: OrdenesClientProps) {
  // ZUSTAND STORE (Real-time updates)
  const storeOrdenes = useChronosStore(state => state.ordenesCompra)
  const eliminarOrdenCompra = useChronosStore(state => state.eliminarOrdenCompra)
  
  // Usar órdenes del store si hay, si no las iniciales
  const ordenes = storeOrdenes.length > 0 ? storeOrdenes : initialOrdenes
  
  // STATE
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState<OCType | null>(null)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [selectedOC, setSelectedOC] = useState<OCType | null>(null)
  const [showAbonoModal, setShowAbonoModal] = useState(false)

  // COMPUTED STATS (tiempo real desde el store)
  const stats = useMemo(() => {
    const pendientes = ordenes.filter(o => o.estado === 'pendiente')
    const parciales = ordenes.filter(o => o.estado === 'parcial')
    const pagadas = ordenes.filter(o => o.estado === 'completo')
    
    return {
      totalOrdenes: ordenes.length,
      pendientes: pendientes.length,
      parciales: parciales.length,
      completadas: pagadas.length,
      montoTotal: ordenes.reduce((acc, o) => acc + (o.costoTotal || 0), 0),
      deudaTotal: ordenes.reduce((acc, o) => acc + (o.deuda || 0), 0),
      stockTotal: ordenes.reduce((acc, o) => acc + (o.stockActual || 0), 0),
    }
  }, [ordenes])

  // FILTERED ORDENES
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter(orden => {
      const matchesSearch = 
        orden.notas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.distribuidor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orden.id?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesEstado = !filterEstado || orden.estado === filterEstado
      return matchesSearch && matchesEstado
    })
  }, [ordenes, searchQuery, filterEstado])

  // HANDLERS
  const handleDelete = useCallback((id: string) => {
    if (confirm('¿Eliminar esta orden? Esta acción no se puede deshacer.')) {
      eliminarOrdenCompra(id)
      toast.success('Orden eliminada')
    }
  }, [eliminarOrdenCompra])
  
  const handleAbonar = useCallback((orden: OCType) => {
    setSelectedOC(orden)
    setShowAbonoModal(true)
  }, [])

  // STATS CARDS CONFIG
  const statsCards = [
    {
      title: 'Total Órdenes',
      value: stats.totalOrdenes.toString(),
      subtitle: formatCurrency(stats.montoTotal),
      icon: Package,
      color: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Stock Disponible',
      value: stats.stockTotal.toString(),
      subtitle: 'Unidades en inventario',
      icon: Package,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Deuda Proveedores',
      value: formatCurrency(stats.deudaTotal),
      subtitle: `${stats.pendientes + stats.parciales} por pagar`,
      icon: DollarSign,
      color: 'from-red-500 to-orange-600',
    },
    {
      title: 'Completadas',
      value: stats.completadas.toString(),
      subtitle: 'Pagadas 100%',
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-600',
    },
  ]

  return (
    <>
      {/* Modal Nueva Orden - Wizard Premium */}
      <OrdenCompraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* Modal Pago a Distribuidor */}
      {selectedOrden && (
        <AbonoDistribuidorModal
          isOpen={showPagoModal}
          onClose={() => {
            setShowPagoModal(false)
            setSelectedOrden(null)
          }}
          distribuidorPreseleccionado={selectedOrden.distribuidorId}
        />
      )}
      
      {/* Legacy Modal Abono (DEPRECATED) */}
      {showAbonoModal && selectedOC && (
        <AbonoOCModal 
          orden={selectedOC} 
          onClose={() => {
            setShowAbonoModal(false)
            setSelectedOC(null)
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
              <option value="parcial">Parciales</option>
              <option value="pagado">Pagadas</option>
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
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-4">
                    OC / Distribuidor
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Cant.
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4 text-amber-400/70">
                    C.Dist.
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4 text-blue-400/70">
                    C.Transp.
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    C/Unidad
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Stock
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Total
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4 text-green-400/70">
                    Pagado
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4 text-red-400/70">
                    Deuda
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Fecha
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-4">
                    Acc.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredOrdenes.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                          {searchQuery || filterEstado 
                            ? 'No se encontraron órdenes con esos filtros'
                            : 'No hay órdenes registradas'}
                        </p>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                        >
                          + Crear primera orden
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredOrdenes.map((orden, index) => {
                      const estado = estadoConfig[orden.estado as keyof typeof estadoConfig] || estadoConfig.pendiente
                      const EstadoIcon = estado.icon
                      
                      // Extraer costos individuales
                      const costoDistribuidor = orden.costoDistribuidor || 6000
                      const costoTransporte = orden.costoTransporte || 300
                      const costoPorUnidad = orden.costoPorUnidad || (costoDistribuidor + costoTransporte)
                      const montoPagado = orden.pagoDistribuidor || orden.pagoInicial || 0

                      return (
                        <motion.tr
                          key={orden.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="group hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                                <Truck className="h-4 w-4 text-orange-400" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{orden.id}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[120px]">{orden.distribuidor || 'Sin dist.'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm">{orden.cantidad}</span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-amber-400">
                              {formatCurrency(costoDistribuidor)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-blue-400">
                              {formatCurrency(costoTransporte)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-gray-300">
                              {formatCurrency(costoPorUnidad)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className={cn(
                              "font-mono text-sm font-medium",
                              orden.stockActual === 0 ? 'text-red-400' : 
                              orden.stockActual < orden.cantidad * 0.3 ? 'text-yellow-400' : 'text-green-400'
                            )}>
                              {orden.stockActual}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono font-medium">
                              {formatCurrency(orden.costoTotal || 0)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-mono text-sm text-green-400">
                              {formatCurrency(montoPagado)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className={cn(
                              "font-mono text-sm font-medium",
                              (orden.deuda || 0) > 0 ? 'text-red-400' : 'text-green-400'
                            )}>
                              {formatCurrency(orden.deuda || 0)}
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
                              {formatDate(orden.fecha)}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {orden.estado !== 'completo' && (
                                <button 
                                  onClick={() => handleAbonar(orden)}
                                  className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                                  title="Registrar pago"
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
                                onClick={() => handleDelete(orden.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              >
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
        
        {/* Total Footer */}
        <div className="flex justify-end">
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center gap-6">
            <div className="text-sm text-gray-400">
              {filteredOrdenes.length} órdenes mostradas
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-500">Stock Total</div>
                <div className="font-mono font-bold text-blue-400">
                  {filteredOrdenes.reduce((acc, o) => acc + (o.stockActual || 0), 0)} uds
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Deuda Total</div>
                <div className="font-mono font-bold text-red-400">
                  {formatCurrency(filteredOrdenes.reduce((acc, o) => acc + (o.deuda || 0), 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
