'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, User, Truck, DollarSign, CreditCard, 
  CheckCircle2, Printer, Receipt, Sparkles, ArrowRight,
  Package, X
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import ObsidianDistributionSlider, { DistributionState } from './ObsidianDistributionSlider'
import HolographicProductSearch, { ProductOption, SelectedProduct } from './HolographicProductSearch'
import type { BancoId, MetodoPago, Cliente } from '@/app/types'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 SALES COCKPIT - The Transaction Cockpit
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Panel inmersivo para registrar ventas con:
 * - Layout 65/35 Formulario/Resumen
 * - Buscador holográfico de productos
 * - Barras de energía para distribución bancaria
 * - Ticket live preview estilo papel térmico
 * - Animación de sellado al confirmar
 */

interface SalesCockpitProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (saleData: SaleData) => Promise<void>
  products: ProductOption[]
  clients: Cliente[]
  defaultDistribution?: DistributionState
}

export interface SaleData {
  cliente: Cliente
  productos: SelectedProduct[]
  subtotal: number
  flete: number
  total: number
  distribucion: DistributionState
  metodoPago: MetodoPago
  montoPagado: number
  bancoDestino?: BancoId
  notas?: string
}

type Step = 'productos' | 'cliente' | 'pago' | 'confirmar'

const METODOS_PAGO: { id: MetodoPago; label: string; icon: typeof DollarSign }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
  { id: 'transferencia', label: 'Transferencia', icon: CreditCard },
  { id: 'credito', label: 'Crédito', icon: Receipt },
]

export default function SalesCockpit({
  isOpen,
  onClose,
  onConfirm,
  products,
  clients,
  defaultDistribution
}: SalesCockpitProps) {
  // Estado principal
  const [step, setStep] = useState<Step>('productos')
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [montoPagado, setMontoPagado] = useState(0)
  const [fleteEnabled, setFleteEnabled] = useState(false)
  const [fleteAmount, setFleteAmount] = useState(500)
  const [distribucion, setDistribucion] = useState<DistributionState>(
    defaultDistribution || { bovedaMonte: 63, fletes: 5, utilidades: 32 }
  )
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSealed, setIsSealed] = useState(false)
  const [generatedFolio, setGeneratedFolio] = useState<string | null>(null)

  // Cálculos
  const subtotal = useMemo(() => 
    selectedProducts.reduce((acc, p) => acc + p.subtotal, 0), 
    [selectedProducts]
  )
  
  const fleteTotal = fleteEnabled ? fleteAmount * selectedProducts.reduce((acc, p) => acc + p.cantidad, 0) : 0
  const total = subtotal + fleteTotal
  const montoRestante = total - montoPagado

  // Handlers
  const handleProductSelect = useCallback((product: ProductOption, cantidad: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === product.id)
      if (existing) {
        return prev.map(p => 
          p.id === product.id 
            ? { ...p, cantidad: p.cantidad + cantidad, subtotal: (p.cantidad + cantidad) * p.precioVenta }
            : p
        )
      }
      return [...prev, { ...product, cantidad, subtotal: cantidad * product.precioVenta }]
    })
  }, [])

  const handleProductRemove = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId))
  }, [])

  const handleConfirm = async () => {
    if (!selectedClient || selectedProducts.length === 0) return

    setIsSubmitting(true)
    
    try {
      const saleData: SaleData = {
        cliente: selectedClient,
        productos: selectedProducts,
        subtotal,
        flete: fleteTotal,
        total,
        distribucion,
        metodoPago,
        montoPagado,
        notas
      }

      await onConfirm(saleData)
      
      // Animación de sellado
      setIsSealed(true)
      setGeneratedFolio(`VTA-${Date.now().toString(36).toUpperCase()}`)
      
      setTimeout(() => {
        onClose()
        // Reset state
        setStep('productos')
        setSelectedProducts([])
        setSelectedClient(null)
        setMontoPagado(0)
        setIsSealed(false)
        setGeneratedFolio(null)
      }, 2500)
      
    } catch (error) {
      console.error('Error al confirmar venta:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 8)
    const lower = clientSearch.toLowerCase()
    return clients.filter(c => 
      c.nombre.toLowerCase().includes(lower) ||
      c.telefono?.includes(clientSearch)
    ).slice(0, 8)
  }, [clients, clientSearch])

  // Steps config
  const steps: { id: Step; label: string; icon: typeof Package }[] = [
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'cliente', label: 'Cliente', icon: User },
    { id: 'pago', label: 'Pago', icon: DollarSign },
    { id: 'confirmar', label: 'Confirmar', icon: CheckCircle2 },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  // Validación de paso
  const canProceed = useMemo(() => {
    switch (step) {
      case 'productos': return selectedProducts.length > 0
      case 'cliente': return selectedClient !== null
      case 'pago': return montoPagado >= 0
      case 'confirmar': return true
      default: return false
    }
  }, [step, selectedProducts, selectedClient, montoPagado])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal Principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed inset-4 md:inset-10 z-50",
              "bg-[rgba(8,8,12,0.95)] backdrop-blur-2xl",
              "rounded-3xl border border-white/10",
              "shadow-2xl shadow-black/50",
              "overflow-hidden flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Nueva Venta</h2>
                  <p className="text-sm text-white/40">Transaction Cockpit</p>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="hidden md:flex items-center gap-2">
                {steps.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <motion.button
                      onClick={() => i <= currentStepIndex && setStep(s.id)}
                      disabled={i > currentStepIndex}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                        step === s.id 
                          ? "bg-white/10 text-white" 
                          : i < currentStepIndex
                            ? "text-white/60 hover:bg-white/5"
                            : "text-white/20 cursor-not-allowed"
                      )}
                      whileHover={i <= currentStepIndex ? { scale: 1.02 } : undefined}
                    >
                      <s.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{s.label}</span>
                    </motion.button>
                    {i < steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-white/20" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Content Area - 65/35 Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column - Form (65%) */}
              <div className="flex-1 lg:w-[65%] p-6 overflow-y-auto scrollbar-obsidian">
                <AnimatePresence mode="wait">
                  {/* Step: Productos */}
                  {step === 'productos' && (
                    <motion.div
                      key="productos"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <HolographicProductSearch
                        products={products}
                        selectedProducts={selectedProducts}
                        onProductSelect={handleProductSelect}
                        onProductRemove={handleProductRemove}
                      />
                      
                      {/* Flete Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-orange-400" />
                          <div>
                            <span className="text-white font-medium">Incluir Flete</span>
                            <p className="text-xs text-white/40">$500 por unidad</p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => setFleteEnabled(!fleteEnabled)}
                          className={cn(
                            "relative w-14 h-8 rounded-full transition-colors",
                            fleteEnabled ? "bg-orange-500" : "bg-white/10"
                          )}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                            animate={{ left: fleteEnabled ? '1.75rem' : '0.25rem' }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step: Cliente */}
                  {step === 'cliente' && (
                    <motion.div
                      key="cliente"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar cliente..."
                        className={cn(
                          "w-full h-14 px-5 rounded-2xl",
                          "bg-black/40 backdrop-blur-xl border border-white/10",
                          "text-white placeholder:text-white/30",
                          "focus:outline-none focus:border-indigo-500/50"
                        )}
                      />
                      
                      <div className="grid gap-2">
                        {filteredClients.map(client => (
                          <motion.button
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={cn(
                              "w-full p-4 rounded-xl text-left transition-all",
                              "border",
                              selectedClient?.id === client.id
                                ? "bg-indigo-500/20 border-indigo-500/50"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-medium">{client.nombre}</div>
                                <div className="text-sm text-white/40">{client.telefono || 'Sin teléfono'}</div>
                              </div>
                              {(client.deuda ?? 0) > 0 && (
                                <div className="text-right">
                                  <div className="text-xs text-red-400">Deuda</div>
                                  <div className="text-sm font-mono text-red-400">
                                    ${(client.deuda ?? 0).toLocaleString('es-MX')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step: Pago */}
                  {step === 'pago' && (
                    <motion.div
                      key="pago"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      {/* Método de Pago */}
                      <div>
                        <label className="block text-sm text-white/40 mb-3">Método de Pago</label>
                        <div className="grid grid-cols-3 gap-3">
                          {METODOS_PAGO.map(mp => (
                            <motion.button
                              key={mp.id}
                              onClick={() => setMetodoPago(mp.id)}
                              className={cn(
                                "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                                metodoPago === mp.id
                                  ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <mp.icon className="w-6 h-6" />
                              <span className="text-sm font-medium">{mp.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Monto Pagado */}
                      <div>
                        <label className="block text-sm text-white/40 mb-3">Monto Pagado</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">$</span>
                          <input
                            type="number"
                            value={montoPagado || ''}
                            onChange={(e) => setMontoPagado(Number(e.target.value))}
                            placeholder="0.00"
                            className={cn(
                              "w-full h-16 pl-10 pr-4 rounded-2xl text-2xl font-mono",
                              "bg-black/40 backdrop-blur-xl border border-white/10",
                              "text-white placeholder:text-white/20",
                              "focus:outline-none focus:border-indigo-500/50"
                            )}
                          />
                        </div>
                        
                        {/* Quick amounts */}
                        <div className="flex gap-2 mt-3">
                          {[total, total * 0.5, 0].map(amount => (
                            <motion.button
                              key={amount}
                              onClick={() => setMontoPagado(amount)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm font-mono"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              ${amount.toLocaleString('es-MX')}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Distribución Bancaria */}
                      <ObsidianDistributionSlider
                        totalAmount={total}
                        initialValues={distribucion}
                        onChange={setDistribucion}
                      />

                      {/* Notas */}
                      <div>
                        <label className="block text-sm text-white/40 mb-3">Notas (opcional)</label>
                        <textarea
                          value={notas}
                          onChange={(e) => setNotas(e.target.value)}
                          placeholder="Agregar notas a la venta..."
                          rows={3}
                          className={cn(
                            "w-full p-4 rounded-2xl resize-none",
                            "bg-black/40 backdrop-blur-xl border border-white/10",
                            "text-white placeholder:text-white/30",
                            "focus:outline-none focus:border-indigo-500/50"
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step: Confirmar */}
                  {step === 'confirmar' && (
                    <motion.div
                      key="confirmar"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <h3 className="text-lg font-semibold text-white">Resumen de Venta</h3>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/60">Cliente</span>
                            <span className="text-white font-medium">{selectedClient?.nombre}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Productos</span>
                            <span className="text-white font-medium">{selectedProducts.length} items</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Subtotal</span>
                            <span className="text-white font-mono">${subtotal.toLocaleString('es-MX')}</span>
                          </div>
                          {fleteTotal > 0 && (
                            <div className="flex justify-between">
                              <span className="text-white/60">Flete</span>
                              <span className="text-orange-400 font-mono">${fleteTotal.toLocaleString('es-MX')}</span>
                            </div>
                          )}
                          <div className="pt-3 border-t border-white/10 flex justify-between">
                            <span className="text-white font-semibold">Total</span>
                            <span className="text-white text-xl font-mono font-bold">${total.toLocaleString('es-MX')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column - Live Ticket Preview (35%) */}
              <div className="hidden lg:block w-[35%] p-6 border-l border-white/5 bg-black/20">
                <TicketPreview
                  client={selectedClient}
                  products={selectedProducts}
                  subtotal={subtotal}
                  flete={fleteTotal}
                  total={total}
                  montoPagado={montoPagado}
                  metodoPago={metodoPago}
                  isSealed={isSealed}
                  folio={generatedFolio}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 flex items-center justify-between">
              <motion.button
                onClick={() => {
                  const prevStep = steps[currentStepIndex - 1]
                  if (prevStep) setStep(prevStep.id)
                }}
                disabled={currentStepIndex === 0}
                className={cn(
                  "px-6 py-3 rounded-xl font-medium transition-all",
                  currentStepIndex === 0
                    ? "text-white/20 cursor-not-allowed"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                Anterior
              </motion.button>

              <motion.button
                onClick={() => {
                  if (step === 'confirmar') {
                    handleConfirm()
                  } else {
                    const nextStep = steps[currentStepIndex + 1]
                    if (nextStep && canProceed) setStep(nextStep.id)
                  }
                }}
                disabled={!canProceed || isSubmitting}
                className={cn(
                  "px-8 py-3 rounded-xl font-semibold transition-all",
                  "bg-gradient-to-r from-indigo-500 to-purple-600",
                  "hover:from-indigo-400 hover:to-purple-500",
                  "text-white shadow-lg shadow-indigo-500/25",
                  (!canProceed || isSubmitting) && "opacity-50 cursor-not-allowed"
                )}
                whileHover={canProceed ? { scale: 1.02 } : undefined}
                whileTap={canProceed ? { scale: 0.98 } : undefined}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.div 
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Procesando...
                  </span>
                ) : step === 'confirmar' ? (
                  <span className="flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    Confirmar Venta
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TICKET PREVIEW - Live Preview estilo papel térmico
// ═══════════════════════════════════════════════════════════════════════════

interface TicketPreviewProps {
  client: Cliente | null
  products: SelectedProduct[]
  subtotal: number
  flete: number
  total: number
  montoPagado: number
  metodoPago: MetodoPago
  isSealed: boolean
  folio: string | null
}

function TicketPreview({
  client,
  products,
  subtotal,
  flete,
  total,
  montoPagado,
  metodoPago,
  isSealed,
  folio
}: TicketPreviewProps) {
  const cambio = montoPagado - total
  const now = new Date()

  return (
    <motion.div
      className={cn(
        "relative bg-[#fafafa] rounded-lg overflow-hidden",
        "shadow-xl font-mono text-[11px] text-gray-800"
      )}
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 1px,
          rgba(0,0,0,0.02) 1px,
          rgba(0,0,0,0.02) 2px
        )`
      }}
      animate={{
        scale: isSealed ? [1, 1.02, 1] : 1,
      }}
    >
      {/* Efecto de papel perforado arriba */}
      <div className="h-3 bg-gradient-to-b from-gray-300/50 to-transparent" 
        style={{
          backgroundImage: `radial-gradient(circle at 8px -4px, #1a1a1a 8px, transparent 8px)`,
          backgroundSize: '16px 16px'
        }}
      />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-300 pb-3">
          <div className="text-lg font-bold tracking-wider">CHRONOS</div>
          <div className="text-[9px] text-gray-500">Sistema de Gestión Financiera</div>
          <div className="text-[9px] text-gray-400 mt-1">
            {now.toLocaleDateString('es-MX')} {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Cliente */}
        {client && (
          <div className="border-b border-dashed border-gray-300 pb-3">
            <div className="text-[9px] text-gray-500">CLIENTE</div>
            <div className="font-semibold">{client.nombre}</div>
          </div>
        )}

        {/* Productos */}
        <div className="space-y-1">
          <div className="text-[9px] text-gray-500">PRODUCTOS</div>
          {products.length === 0 ? (
            <div className="text-gray-400 italic">Sin productos</div>
          ) : (
            products.map(p => (
              <div key={p.id} className="flex justify-between">
                <span className="truncate flex-1">{p.cantidad}x {p.nombre}</span>
                <span className="ml-2">${p.subtotal.toLocaleString('es-MX')}</span>
              </div>
            ))
          )}
        </div>

        {/* Totales */}
        <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString('es-MX')}</span>
          </div>
          {flete > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Flete</span>
              <span>${flete.toLocaleString('es-MX')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-300">
            <span>TOTAL</span>
            <span>${total.toLocaleString('es-MX')}</span>
          </div>
          {montoPagado > 0 && (
            <>
              <div className="flex justify-between">
                <span>Pagado ({metodoPago})</span>
                <span>${montoPagado.toLocaleString('es-MX')}</span>
              </div>
              {cambio >= 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <span>Cambio</span>
                  <span>${cambio.toLocaleString('es-MX')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-red-600">
                  <span>Pendiente</span>
                  <span>${Math.abs(cambio).toLocaleString('es-MX')}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-gray-400 pt-3 border-t border-dashed border-gray-300">
          <div>¡Gracias por su compra!</div>
          {folio && <div className="font-semibold text-gray-600 mt-1">Folio: {folio}</div>}
        </div>
      </div>

      {/* Efecto de papel perforado abajo */}
      <div className="h-3 bg-gradient-to-t from-gray-300/50 to-transparent"
        style={{
          backgroundImage: `radial-gradient(circle at 8px 12px, #1a1a1a 8px, transparent 8px)`,
          backgroundSize: '16px 16px'
        }}
      />

      {/* Animación de Sellado */}
      <AnimatePresence>
        {isSealed && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
