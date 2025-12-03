'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { 
  Users, Building2, Phone, Mail, MapPin, TrendingUp, TrendingDown,
  DollarSign, CreditCard, ShoppingBag, MessageCircle, Search,
  Filter, ChevronRight, X, Award, Clock, AlertCircle
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { Cliente, Distribuidor, Venta, OrdenCompra } from '@/app/types'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 👥 ENTITY RELATIONSHIP MANAGER - CRM Nebula
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestión de relaciones (Clientes/Distribuidores) con:
 * - Grid de tarjetas con estado de deuda visual
 * - Anillos de estado (Verde/Naranja/Rojo pulsante)
 * - Badges de nivel (Bronce, Plata, Oro, Diamante)
 * - Perfil expandido con historial de compras
 * - Acciones rápidas: Contactar, Cobrar, Nuevo Pedido
 */

type EntityType = 'clientes' | 'distribuidores'
type DebtLevel = 'none' | 'current' | 'overdue'
type CustomerLevel = 'bronce' | 'plata' | 'oro' | 'diamante'

interface EntityRelationshipManagerProps {
  clientes: Cliente[]
  distribuidores: Distribuidor[]
  ventas?: Venta[]
  ordenesCompra?: OrdenCompra[]
  onContactar?: (entity: Cliente | Distribuidor, via: 'whatsapp' | 'email' | 'phone') => void
  onCobrar?: (entity: Cliente | Distribuidor) => void
  onNuevoPedido?: (entity: Cliente | Distribuidor) => void
  onEdit?: (entity: Cliente | Distribuidor, type: EntityType) => void
}

// Configuración de niveles
const LEVEL_CONFIG: Record<CustomerLevel, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  minPurchases: number
}> = {
  bronce: {
    label: 'Bronce',
    color: 'text-amber-700',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-600/50',
    icon: '🥉',
    minPurchases: 0
  },
  plata: {
    label: 'Plata',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-400/50',
    icon: '🥈',
    minPurchases: 10000
  },
  oro: {
    label: 'Oro',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    icon: '🥇',
    minPurchases: 50000
  },
  diamante: {
    label: 'Diamante',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-400/50',
    icon: '💎',
    minPurchases: 100000
  }
}

export default function EntityRelationshipManager({
  clientes,
  distribuidores,
  ventas = [],
  ordenesCompra = [],
  onContactar,
  onCobrar,
  onNuevoPedido,
  onEdit
}: EntityRelationshipManagerProps) {
  const [entityType, setEntityType] = useState<EntityType>('clientes')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'deuda' | 'saldo'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<Cliente | Distribuidor | null>(null)

  // Datos según tipo de entidad
  const entities = entityType === 'clientes' ? clientes : distribuidores

  // Calcular nivel de cliente
  const getCustomerLevel = useCallback((totalCompras: number): CustomerLevel => {
    if (totalCompras >= 100000) return 'diamante'
    if (totalCompras >= 50000) return 'oro'
    if (totalCompras >= 10000) return 'plata'
    return 'bronce'
  }, [])

  // Calcular estado de deuda
  const getDebtLevel = useCallback((entity: Cliente | Distribuidor): DebtLevel => {
    const deuda = entity.deudaTotal || entity.pendiente || 0
    if (deuda <= 0) return 'none'
    
    // Verificar si hay pagos vencidos (simplificado)
    const ultimoPago = entity.historialPagos?.[0]
    if (ultimoPago) {
      const fechaPago = ultimoPago.fecha instanceof Date 
        ? ultimoPago.fecha 
        : new Date(ultimoPago.fecha as unknown as string)
      const diasSinPago = Math.floor((Date.now() - fechaPago.getTime()) / (1000 * 60 * 60 * 24))
      if (diasSinPago > 30) return 'overdue'
    }
    
    return deuda > 0 ? 'current' : 'none'
  }, [])

  // Filtrar y buscar
  const filteredEntities = useMemo(() => {
    let result = [...entities]
    
    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(e => 
        e.nombre.toLowerCase().includes(lower) ||
        (e.telefono && e.telefono.includes(searchQuery)) ||
        (e.email && e.email.toLowerCase().includes(lower))
      )
    }
    
    if (filter === 'deuda') {
      result = result.filter(e => (e.deudaTotal || e.pendiente || 0) > 0)
    } else if (filter === 'saldo') {
      result = result.filter(e => (e.deudaTotal || e.pendiente || 0) <= 0)
    }
    
    return result
  }, [entities, searchQuery, filter])

  // Estadísticas globales
  const stats = useMemo(() => {
    const total = entities.length
    const conDeuda = entities.filter(e => (e.deudaTotal || e.pendiente || 0) > 0).length
    const deudaTotal = entities.reduce((acc, e) => acc + (e.deudaTotal || e.pendiente || 0), 0)
    const volumenTotal = entities.reduce((acc, e) => {
      const cliente = e as Cliente
      const distribuidor = e as Distribuidor
      if (entityType === 'clientes' && cliente.totalVentas !== undefined) {
        return acc + (cliente.totalVentas || 0)
      }
      if (entityType === 'distribuidores' && distribuidor.totalOrdenesCompra !== undefined) {
        return acc + (distribuidor.totalOrdenesCompra || 0)
      }
      return acc
    }, 0)
    
    return { total, conDeuda, deudaTotal, volumenTotal }
  }, [entities, entityType])

  // Obtener historial de transacciones
  const getEntityHistory = useCallback((entity: Cliente | Distribuidor) => {
    if (entityType === 'clientes') {
      return ventas
        .filter(v => v.clienteId === entity.id)
        .slice(0, 10)
        .map(v => ({
          id: v.id,
          fecha: v.fecha,
          tipo: 'venta' as const,
          monto: v.totalVenta || v.ingreso || 0,
          concepto: `${v.cantidad} unidades`
        }))
    }
    return ordenesCompra
      .filter(oc => oc.distribuidorId === entity.id)
      .slice(0, 10)
      .map(oc => ({
        id: oc.id,
        fecha: oc.fecha,
        tipo: 'compra' as const,
        monto: oc.costoTotal || 0,
        concepto: `${oc.cantidad} unidades`
      }))
  }, [entityType, ventas, ordenesCompra])

  return (
    <div className="space-y-6">
      {/* Header con Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Toggle Clientes/Distribuidores */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/10">
          <button
            onClick={() => setEntityType('clientes')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all",
              entityType === 'clientes' 
                ? "bg-white/10 text-white" 
                : "text-white/40 hover:text-white/60"
            )}
          >
            <Users className="w-4 h-4" />
            <span className="font-medium">Clientes</span>
            <span className="ml-1 text-xs bg-white/10 px-2 py-0.5 rounded-full">
              {clientes.length}
            </span>
          </button>
          <button
            onClick={() => setEntityType('distribuidores')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all",
              entityType === 'distribuidores' 
                ? "bg-white/10 text-white" 
                : "text-white/40 hover:text-white/60"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span className="font-medium">Distribuidores</span>
            <span className="ml-1 text-xs bg-white/10 px-2 py-0.5 rounded-full">
              {distribuidores.length}
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/40">Volumen Total</div>
            <div className="text-white font-mono font-bold">
              ${stats.volumenTotal.toLocaleString('es-MX')}
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="text-xs text-red-400">Deuda Total</div>
            <div className="text-red-400 font-mono font-bold">
              ${stats.deudaTotal.toLocaleString('es-MX')}
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar ${entityType}...`}
            className={cn(
              "w-full h-11 pl-11 pr-4 rounded-xl",
              "bg-black/40 border border-white/10",
              "text-white text-sm placeholder:text-white/30",
              "focus:outline-none focus:border-white/20"
            )}
          />
        </div>
        
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
          {(['all', 'deuda', 'saldo'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === f 
                  ? "bg-white/10 text-white" 
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {f === 'all' ? 'Todos' : f === 'deuda' ? 'Con Deuda' : 'Al Día'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tarjetas */}
      <LayoutGroup>
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredEntities.map((entity, index) => {
              const debtLevel = getDebtLevel(entity)
              const cliente = entity as Cliente
              const distribuidor = entity as Distribuidor
              const entityVolume = entityType === 'clientes' 
                ? (cliente.totalVentas || 0) 
                : (distribuidor.totalOrdenesCompra || 0)
              const level = getCustomerLevel(entityVolume)
              const isExpanded = expandedId === entity.id

              return (
                <motion.div
                  key={entity.id}
                  layout
                  layoutId={entity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    gridColumn: isExpanded ? 'span 2' : 'span 1',
                    gridRow: isExpanded ? 'span 2' : 'span 1'
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    layout: { type: 'spring', stiffness: 300, damping: 30 },
                    delay: Math.min(index * 0.02, 0.2)
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : entity.id)}
                  className="cursor-pointer"
                >
                  <EntityCard
                    entity={entity}
                    entityType={entityType}
                    debtLevel={debtLevel}
                    level={level}
                    isExpanded={isExpanded}
                    history={isExpanded ? getEntityHistory(entity) : []}
                    onContactar={onContactar}
                    onCobrar={onCobrar}
                    onNuevoPedido={onNuevoPedido}
                    onClose={() => setExpandedId(null)}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {/* Empty State */}
      {filteredEntities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No se encontraron {entityType}</p>
          <p className="text-white/20 text-sm mt-1">Intenta con otros términos de búsqueda</p>
        </motion.div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY CARD - Tarjeta con Estado Visual
// ═══════════════════════════════════════════════════════════════════════════

interface EntityCardProps {
  entity: Cliente | Distribuidor
  entityType: EntityType
  debtLevel: DebtLevel
  level: CustomerLevel
  isExpanded: boolean
  history: { id: string; fecha: string | Date | any; tipo: 'venta' | 'compra'; monto: number; concepto: string }[]
  onContactar?: (entity: Cliente | Distribuidor, via: 'whatsapp' | 'email' | 'phone') => void
  onCobrar?: (entity: Cliente | Distribuidor) => void
  onNuevoPedido?: (entity: Cliente | Distribuidor) => void
  onClose: () => void
}

function EntityCard({
  entity,
  entityType,
  debtLevel,
  level,
  isExpanded,
  history,
  onContactar,
  onCobrar,
  onNuevoPedido,
  onClose
}: EntityCardProps) {
  const levelConfig = LEVEL_CONFIG[level]
  const deuda = entity.deudaTotal || entity.pendiente || 0
  const cliente = entity as Cliente
  const distribuidor = entity as Distribuidor
  const totalVolumen = entityType === 'clientes' 
    ? (cliente.totalVentas || 0) 
    : (distribuidor.totalOrdenesCompra || 0)

  // Colores del borde según deuda
  const borderColors = {
    none: 'border-emerald-500/50 hover:border-emerald-400',
    current: 'border-orange-500/50 hover:border-orange-400',
    overdue: 'border-red-500/50 hover:border-red-400'
  }

  return (
    <motion.div
      className={cn(
        "relative h-full rounded-2xl overflow-hidden",
        "bg-black/40 backdrop-blur-xl",
        "border-2 transition-colors",
        borderColors[debtLevel],
        isExpanded && "bg-black/60"
      )}
      whileHover={!isExpanded ? { scale: 1.02 } : undefined}
    >
      {/* Anillo de Estado alrededor del avatar */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar con Anillo */}
          <div className="relative">
            <motion.div
              className={cn(
                "absolute -inset-1 rounded-full",
                debtLevel === 'none' && "bg-emerald-500/30",
                debtLevel === 'current' && "bg-orange-500/30",
                debtLevel === 'overdue' && "bg-red-500/30"
              )}
              animate={debtLevel === 'overdue' ? { 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              } : undefined}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            {/* Avatar */}
            <div className={cn(
              "relative w-14 h-14 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-white/10 to-white/5",
              "border-2",
              debtLevel === 'none' && "border-emerald-500",
              debtLevel === 'current' && "border-orange-500",
              debtLevel === 'overdue' && "border-red-500"
            )}>
              <span className="text-xl font-bold text-white">
                {entity.nombre.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Partículas para deuda crítica */}
            {debtLevel === 'overdue' && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-red-500"
                    initial={{ 
                      x: 28, 
                      y: 56, 
                      opacity: 0 
                    }}
                    animate={{
                      y: [56, 80],
                      opacity: [0, 1, 0],
                      x: [28 + Math.random() * 10 - 5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold truncate">{entity.nombre}</h3>
              
              {/* Badge de Nivel */}
              <motion.span 
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  "border",
                  levelConfig.bgColor,
                  levelConfig.color,
                  levelConfig.borderColor
                )}
                whileHover={{ scale: 1.1 }}
              >
                {levelConfig.icon} {levelConfig.label}
              </motion.span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-white/40">
              {entity.telefono && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {entity.telefono}
                </span>
              )}
              {'empresa' in entity && entity.empresa && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {entity.empresa}
                </span>
              )}
            </div>
          </div>

          {/* Close button en modo expandido */}
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-xs text-white/40">Volumen Total</div>
            <div className="text-white font-mono font-bold mt-0.5">
              ${totalVolumen.toLocaleString('es-MX')}
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            deuda > 0 ? "bg-red-500/10" : "bg-emerald-500/10"
          )}>
            <div className={cn(
              "text-xs",
              deuda > 0 ? "text-red-400" : "text-emerald-400"
            )}>
              {deuda > 0 ? 'Deuda' : 'Al día'}
            </div>
            <div className={cn(
              "font-mono font-bold mt-0.5",
              deuda > 0 ? "text-red-400" : "text-emerald-400"
            )}>
              ${Math.abs(deuda).toLocaleString('es-MX')}
            </div>
          </div>
        </div>

        {/* Contenido Expandido */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4 overflow-hidden"
            >
              {/* Gráfico de Historial (simplificado) */}
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/60">Últimos 6 meses</span>
                </div>
                
                {/* Mini Chart de barras */}
                <div className="flex items-end gap-1 h-20">
                  {[...Array(6)].map((_, i) => {
                    const height = 20 + Math.random() * 60
                    return (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-600 to-indigo-400"
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Historial de Transacciones */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/60">Últimas transacciones</span>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-obsidian">
                  {history.length === 0 ? (
                    <div className="text-center py-4 text-white/30 text-sm">
                      Sin transacciones registradas
                    </div>
                  ) : (
                    history.map((item, i) => {
                      const fecha = typeof item.fecha === 'string' 
                        ? new Date(item.fecha)
                        : item.fecha instanceof Date 
                          ? item.fecha 
                          : new Date()
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 + 0.5 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                        >
                          <div className="flex items-center gap-2">
                            {item.tipo === 'venta' ? (
                              <ShoppingBag className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Building2 className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="text-white/80 text-sm">{item.concepto}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-mono text-sm">
                              ${item.monto.toLocaleString('es-MX')}
                            </div>
                            <div className="text-[10px] text-white/30">
                              {fecha.toLocaleDateString('es-MX')}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onContactar?.(entity, 'whatsapp') }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl",
                    "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400",
                    "border border-emerald-500/30 transition-colors"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Contactar</span>
                </motion.button>
                
                {deuda > 0 && (
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); onCobrar?.(entity) }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl",
                      "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400",
                      "border border-amber-500/30 transition-colors"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Cobrar</span>
                  </motion.button>
                )}
                
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNuevoPedido?.(entity) }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl",
                    "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400",
                    "border border-indigo-500/30 transition-colors"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-sm font-medium">Nuevo</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
