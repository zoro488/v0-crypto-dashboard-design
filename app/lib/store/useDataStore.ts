/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏛️ CHRONOS 2026 — DATA STORE CON PERSISTENCIA LOCAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Store Zustand que mantiene TODOS los datos en memoria local.
 * Funciona SIN Firebase - los datos persisten en localStorage.
 * 
 * CARACTERÍSTICAS:
 * - CRUD completo para todas las entidades
 * - Persistencia automática en localStorage
 * - Distribución automática GYA de ventas a 3 bancos
 * - Cálculos de capital en tiempo real
 * - Fórmulas exactas según LOGICA_NEGOCIO_EXACTA_CHRONOS_2026.md
 * 
 * DISTRIBUCIÓN GYA (3 BANCOS):
 * - Bóveda Monte = precioCompra × cantidad (COSTO)
 * - Flete Sur = precioFlete × cantidad (TRANSPORTE)  
 * - Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad (GANANCIA)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { logger } from '../utils/logger'
import { calcularVentaCompleta, calcularOrdenCompra, FLETE_DEFAULT } from '../formulas'
import type { 
  Venta, 
  Cliente, 
  Distribuidor, 
  OrdenCompra, 
  Movimiento,
  BancoId,
  TipoMovimiento,
} from '@/app/types'

// ===================================================================
// TIPOS
// ===================================================================

interface BancoData {
  id: BancoId
  nombre: string
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
  color: string
  tipo: 'boveda' | 'operativo' | 'gastos' | 'utilidades'
  moneda: 'MXN' | 'USD'
  ultimaActualizacion: string
}

// KPIs calculados del sistema
interface KPIsData {
  totalCapital: number
  totalVentas: number
  totalCobrado: number
  totalPendiente: number
  totalClientes: number
  totalDistribuidores: number
  ventasHoy: number
  gananciaMes: number
  margenPromedio: number
}

interface DataState {
  // ========== DATOS ==========
  ventas: Venta[]
  clientes: Cliente[]
  distribuidores: Distribuidor[]
  ordenesCompra: OrdenCompra[]
  movimientos: Movimiento[]
  bancos: BancoData[]
  
  // ========== METADATA ==========
  loading: boolean
  initialized: boolean
  lastSync: string | null
  version: string
  
  // ========== SELECTORES ==========
  getKPIs: () => KPIsData
  getBanco: (id: BancoId) => BancoData | undefined
  getVentasByCliente: (clienteId: string) => Venta[]
  getVentasByEstado: (estado: 'completo' | 'parcial' | 'pendiente') => Venta[]
  getOrdenesConStock: () => OrdenCompra[]
  
  // ========== VENTAS CRUD ==========
  addVenta: (venta: Omit<Venta, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateVenta: (id: string, data: Partial<Venta>) => boolean
  removeVenta: (id: string) => boolean
  registrarPagoVenta: (ventaId: string, monto: number) => boolean
  
  // ========== CLIENTES CRUD ==========
  addCliente: (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateCliente: (id: string, data: Partial<Cliente>) => boolean
  removeCliente: (id: string) => boolean
  
  // ========== DISTRIBUIDORES CRUD ==========
  addDistribuidor: (distribuidor: Omit<Distribuidor, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateDistribuidor: (id: string, data: Partial<Distribuidor>) => boolean
  removeDistribuidor: (id: string) => boolean
  
  // ========== ORDENES COMPRA CRUD ==========
  addOrdenCompra: (orden: Omit<OrdenCompra, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateOrdenCompra: (id: string, data: Partial<OrdenCompra>) => boolean
  removeOrdenCompra: (id: string) => boolean
  pagarOrdenCompra: (ocId: string, monto: number, bancoId: BancoId) => boolean
  
  // ========== MOVIMIENTOS CRUD ==========
  addMovimiento: (mov: Omit<Movimiento, 'id' | 'createdAt'>) => string
  
  // ========== BANCOS ==========
  agregarIngreso: (bancoId: BancoId, monto: number, concepto: string, referencia?: string) => void
  agregarGasto: (bancoId: BancoId, monto: number, concepto: string, referencia?: string) => void
  transferir: (origen: BancoId, destino: BancoId, monto: number, concepto: string) => boolean
  updateBancoCapital: (bancoId: BancoId, monto: number, tipo: 'ingreso' | 'gasto') => void
  
  // ========== UTILS ==========
  getNextId: (prefix: string) => string
  inicializarDatosPrueba: () => void
  reset: () => void
  exportarDatos: () => string
  importarDatos: (json: string) => boolean
}

// ===================================================================
// DATOS INICIALES - 7 BANCOS DEL SISTEMA
// ===================================================================

const BANCOS_INICIAL: BancoData[] = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#3B82F6', tipo: 'boveda', moneda: 'MXN', ultimaActualizacion: new Date().toISOString() },
  { id: 'boveda_usa', nombre: 'Bóveda USA', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#10B981', tipo: 'boveda', moneda: 'USD', ultimaActualizacion: new Date().toISOString() },
  { id: 'utilidades', nombre: 'Utilidades', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#22C55E', tipo: 'utilidades', moneda: 'MXN', ultimaActualizacion: new Date().toISOString() },
  { id: 'flete_sur', nombre: 'Flete Sur', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#F97316', tipo: 'gastos', moneda: 'MXN', ultimaActualizacion: new Date().toISOString() },
  { id: 'profit', nombre: 'Profit', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#8B5CF6', tipo: 'operativo', moneda: 'MXN', ultimaActualizacion: new Date().toISOString() },
  { id: 'leftie', nombre: 'Leftie', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#F59E0B', tipo: 'operativo', moneda: 'MXN', ultimaActualizacion: new Date().toISOString() },
  { id: 'azteca', nombre: 'Azteca', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#EF4444', tipo: 'operativo', moneda: 'MXN', ultimaActualizacion: new Date().toISOString() },
]

// Contador para IDs únicos
let idCounter = Date.now()

// ===================================================================
// STORE
// ===================================================================

export const useDataStore = create<DataState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== DATOS INICIALES ==========
        ventas: [],
        clientes: [],
        distribuidores: [],
        ordenesCompra: [],
        movimientos: [],
        bancos: BANCOS_INICIAL,
        loading: false,
        initialized: false,
        lastSync: null,
        version: '3.0.0',

        // ========== SELECTORES ==========
        getKPIs: () => {
          const state = get()
          const hoy = new Date().toISOString().split('T')[0]
          
          const totalCapital = state.bancos.reduce((sum, b) => sum + b.capitalActual, 0)
          const totalVentas = state.ventas.reduce((sum, v) => sum + (v.precioTotalVenta || 0), 0)
          const totalCobrado = state.ventas.reduce((sum, v) => sum + (v.montoPagado || 0), 0)
          const totalPendiente = state.ventas.reduce((sum, v) => sum + (v.montoRestante || 0), 0)
          
          const ventasHoy = state.ventas.filter(v => {
            const fechaVenta = typeof v.fecha === 'string' ? v.fecha : new Date().toISOString()
            return fechaVenta.startsWith(hoy)
          }).reduce((sum, v) => sum + (v.precioTotalVenta || 0), 0)
          
          const gananciaMes = state.ventas.reduce((sum, v) => sum + (v.utilidad || 0), 0)
          const margenPromedio = totalVentas > 0 ? (gananciaMes / totalVentas) * 100 : 0
          
          return {
            totalCapital,
            totalVentas,
            totalCobrado,
            totalPendiente,
            totalClientes: state.clientes.length,
            totalDistribuidores: state.distribuidores.length,
            ventasHoy,
            gananciaMes,
            margenPromedio,
          }
        },
        
        getBanco: (id: BancoId) => {
          return get().bancos.find(b => b.id === id)
        },
        
        getVentasByCliente: (clienteId: string) => {
          return get().ventas.filter(v => v.clienteId === clienteId)
        },
        
        getVentasByEstado: (estado) => {
          return get().ventas.filter(v => v.estadoPago === estado)
        },
        
        getOrdenesConStock: () => {
          return get().ordenesCompra.filter(oc => oc.stockActual > 0)
        },

        // ========== UTILS ==========
        getNextId: (prefix: string) => {
          idCounter++
          return `${prefix}-${idCounter}`
        },

        reset: () => {
          set({
            ventas: [],
            clientes: [],
            distribuidores: [],
            ordenesCompra: [],
            movimientos: [],
            bancos: BANCOS_INICIAL,
          })
          logger.info('DataStore reseteado', { context: 'DataStore' })
        },

        // ========== VENTAS CRUD ==========
        addVenta: (ventaData) => {
          const state = get()
          const numVentas = state.ventas.length + 1
          const id = `V${numVentas.toString().padStart(4, '0')}`
          const now = new Date().toISOString()
          
          // Obtener datos para cálculo
          const cantidad = ventaData.cantidad || 1
          const precioVenta = ventaData.precioVenta || 0
          const precioCompra = ventaData.precioCompra || 0
          const precioFlete = ventaData.flete === 'Aplica' ? (ventaData.fleteUtilidad || FLETE_DEFAULT) : 0
          const montoPagado = ventaData.montoPagado || 0
          
          // ═══════════════════════════════════════════════════════════════════
          // USAR FÓRMULAS CENTRALIZADAS
          // ═══════════════════════════════════════════════════════════════════
          const resultado = calcularVentaCompleta({
            cantidad,
            precioVenta,
            precioCompra,
            precioFlete,
            montoPagado,
          })
          
          // Construir venta con distribución GYA
          const venta: Venta = {
            ...ventaData,
            id,
            ingreso: resultado.totalVenta,
            totalVenta: resultado.totalVenta,
            precioTotalVenta: resultado.totalVenta,
            precioFlete,
            fleteUtilidad: resultado.fletes,
            utilidad: resultado.utilidades,
            ganancia: resultado.utilidades,
            bovedaMonte: resultado.bovedaMonte,
            distribucionBancos: {
              bovedaMonte: resultado.bovedaMonte,
              fletes: resultado.fletes,
              utilidades: resultado.utilidades,
            },
            estadoPago: resultado.estadoPago,
            estatus: resultado.estadoPago === 'completo' ? 'Pagado' : resultado.estadoPago === 'parcial' ? 'Parcial' : 'Pendiente',
            montoPagado: resultado.montoPagado,
            montoRestante: resultado.montoRestante,
            adeudo: resultado.montoRestante,
            keywords: [ventaData.cliente?.toLowerCase() || '', id.toLowerCase()],
            createdAt: now,
            updatedAt: now,
          } as Venta
          
          set((state) => {
            // ═══════════════════════════════════════════════════════════════
            // DISTRIBUCIÓN PROPORCIONAL A 3 BANCOS SEGÚN PAGO
            // ═══════════════════════════════════════════════════════════════
            let newBancos = [...state.bancos]
            const nuevosMovimientos = [...state.movimientos]
            
            if (montoPagado > 0) {
              // Distribución real según lo pagado
              const distBovedaMonte = resultado.distribucionReal.bovedaMonte
              const distFletes = resultado.distribucionReal.fletes
              const distUtilidades = resultado.distribucionReal.utilidades
              
              newBancos = newBancos.map(banco => {
                if (banco.id === 'boveda_monte') {
                  return { 
                    ...banco, 
                    capitalActual: banco.capitalActual + distBovedaMonte,
                    historicoIngresos: banco.historicoIngresos + distBovedaMonte,
                    ultimaActualizacion: now,
                  }
                }
                if (banco.id === 'flete_sur' && distFletes > 0) {
                  return { 
                    ...banco, 
                    capitalActual: banco.capitalActual + distFletes,
                    historicoIngresos: banco.historicoIngresos + distFletes,
                    ultimaActualizacion: now,
                  }
                }
                if (banco.id === 'utilidades') {
                  return { 
                    ...banco, 
                    capitalActual: banco.capitalActual + distUtilidades,
                    historicoIngresos: banco.historicoIngresos + distUtilidades,
                    ultimaActualizacion: now,
                  }
                }
                return banco
              })
              
              // Registrar movimientos
              const movIdBase = state.movimientos.length
              
              nuevosMovimientos.push({
                id: `M${(movIdBase + 1).toString().padStart(6, '0')}`,
                bancoId: 'boveda_monte',
                tipoMovimiento: 'ingreso',
                fecha: now,
                monto: distBovedaMonte,
                concepto: `Venta ${id} - Costo`,
                cliente: ventaData.cliente,
                referenciaId: id,
                referenciaTipo: 'venta',
                createdAt: now,
              } as Movimiento)
              
              if (distFletes > 0) {
                nuevosMovimientos.push({
                  id: `M${(movIdBase + 2).toString().padStart(6, '0')}`,
                  bancoId: 'flete_sur',
                  tipoMovimiento: 'ingreso',
                  fecha: now,
                  monto: distFletes,
                  concepto: `Venta ${id} - Flete`,
                  cliente: ventaData.cliente,
                  referenciaId: id,
                  referenciaTipo: 'venta',
                  createdAt: now,
                } as Movimiento)
              }
              
              nuevosMovimientos.push({
                id: `M${(movIdBase + 3).toString().padStart(6, '0')}`,
                bancoId: 'utilidades',
                tipoMovimiento: 'ingreso',
                fecha: now,
                monto: distUtilidades,
                concepto: `Venta ${id} - Utilidad`,
                cliente: ventaData.cliente,
                referenciaId: id,
                referenciaTipo: 'venta',
                createdAt: now,
              } as Movimiento)
            }
            
            // Actualizar stock de OC si existe
            let nuevasOC = [...state.ordenesCompra]
            if (ventaData.ocRelacionada) {
              nuevasOC = nuevasOC.map(oc => 
                oc.id === ventaData.ocRelacionada
                  ? { ...oc, stockActual: Math.max(0, oc.stockActual - cantidad), updatedAt: now }
                  : oc
              )
            }
            
            // Actualizar cliente
            let nuevosClientes = [...state.clientes]
            if (ventaData.clienteId) {
              nuevosClientes = nuevosClientes.map(c =>
                c.id === ventaData.clienteId
                  ? {
                      ...c,
                      totalVentas: (c.totalVentas || 0) + resultado.totalVenta,
                      totalPagado: (c.totalPagado || 0) + montoPagado,
                      deuda: (c.deuda || 0) + resultado.montoRestante,
                      pendiente: (c.pendiente || 0) + resultado.montoRestante,
                      numeroCompras: (c.numeroCompras || 0) + 1,
                      ultimaCompra: now,
                      updatedAt: now,
                    }
                  : c
              )
            }
            
            logger.info(`Venta creada con distribución GYA`, { 
              context: 'DataStore', 
              data: { 
                id, 
                total: resultado.totalVenta,
                bovedaMonte: resultado.bovedaMonte,
                fletes: resultado.fletes,
                utilidades: resultado.utilidades,
                estadoPago: resultado.estadoPago,
              } 
            })
            
            return {
              ventas: [...state.ventas, venta],
              bancos: newBancos,
              movimientos: nuevosMovimientos,
              ordenesCompra: nuevasOC,
              clientes: nuevosClientes,
              lastSync: now,
            }
          })
          
          return id
        },

        updateVenta: (id, data) => {
          set((state) => ({
            ventas: state.ventas.map(v => 
              v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v,
            ),
          }))
          logger.info(`Venta actualizada: ${id}`, { context: 'DataStore' })
          return true
        },

        removeVenta: (id) => {
          set((state) => ({
            ventas: state.ventas.filter(v => v.id !== id),
          }))
          logger.info(`Venta eliminada: ${id}`, { context: 'DataStore' })
          return true
        },
        
        registrarPagoVenta: (ventaId, monto) => {
          const state = get()
          const venta = state.ventas.find(v => v.id === ventaId)
          if (!venta || monto <= 0) return false
          
          const now = new Date().toISOString()
          const nuevoMontoPagado = (venta.montoPagado || 0) + monto
          const nuevoMontoRestante = Math.max(0, (venta.montoRestante || 0) - monto)
          const nuevoEstado = nuevoMontoRestante === 0 ? 'completo' : 'parcial'
          
          // Calcular distribución proporcional del abono
          const totalVenta = venta.precioTotalVenta || 0
          const proporcion = totalVenta > 0 ? monto / totalVenta : 0
          const distBovedaMonte = (venta.bovedaMonte || 0) * proporcion
          const distFletes = (venta.fleteUtilidad || 0) * proporcion
          const distUtilidades = (venta.utilidad || 0) * proporcion
          
          set((state) => {
            // Actualizar venta
            const nuevasVentas = state.ventas.map(v =>
              v.id === ventaId
                ? {
                    ...v,
                    montoPagado: nuevoMontoPagado,
                    montoRestante: nuevoMontoRestante,
                    adeudo: nuevoMontoRestante,
                    estadoPago: nuevoEstado as 'completo' | 'parcial' | 'pendiente',
                    estatus: (nuevoEstado === 'completo' ? 'Pagado' : 'Parcial') as 'Pagado' | 'Parcial' | 'Pendiente',
                    updatedAt: now,
                  }
                : v
            )
            
            // Distribuir a 3 bancos
            const nuevosBancos = state.bancos.map(b => {
              if (b.id === 'boveda_monte') {
                return {
                  ...b,
                  capitalActual: b.capitalActual + distBovedaMonte,
                  historicoIngresos: b.historicoIngresos + distBovedaMonte,
                  ultimaActualizacion: now,
                }
              }
              if (b.id === 'flete_sur' && distFletes > 0) {
                return {
                  ...b,
                  capitalActual: b.capitalActual + distFletes,
                  historicoIngresos: b.historicoIngresos + distFletes,
                  ultimaActualizacion: now,
                }
              }
              if (b.id === 'utilidades') {
                return {
                  ...b,
                  capitalActual: b.capitalActual + distUtilidades,
                  historicoIngresos: b.historicoIngresos + distUtilidades,
                  ultimaActualizacion: now,
                }
              }
              return b
            })
            
            // Registrar movimiento de abono
            const movId = `M${(state.movimientos.length + 1).toString().padStart(6, '0')}`
            const nuevoMovimiento: Movimiento = {
              id: movId,
              bancoId: 'boveda_monte',
              tipoMovimiento: 'abono_cliente',
              fecha: now,
              monto,
              concepto: `Abono a venta ${ventaId}`,
              cliente: venta.cliente,
              referenciaId: ventaId,
              referenciaTipo: 'abono',
              createdAt: now,
            } as Movimiento
            
            logger.info(`Pago registrado en venta`, { 
              context: 'DataStore', 
              data: { ventaId, monto, nuevoEstado } 
            })
            
            return {
              ventas: nuevasVentas,
              bancos: nuevosBancos,
              movimientos: [...state.movimientos, nuevoMovimiento],
              lastSync: now,
            }
          })
          
          return true
        },

        // ========== CLIENTES CRUD ==========
        addCliente: (clienteData) => {
          const id = get().getNextId('C')
          const now = new Date().toISOString()
          
          const cliente: Cliente = {
            ...clienteData,
            id,
            actual: clienteData.actual || 0,
            deuda: clienteData.deuda || 0,
            abonos: clienteData.abonos || 0,
            pendiente: clienteData.pendiente || 0,
            totalVentas: clienteData.totalVentas || 0,
            totalPagado: clienteData.totalPagado || 0,
            deudaTotal: clienteData.deudaTotal || 0,
            numeroCompras: clienteData.numeroCompras || 0,
            keywords: [clienteData.nombre?.toLowerCase() || '', id.toLowerCase()],
            estado: clienteData.estado || 'activo',
            createdAt: now,
            updatedAt: now,
          } as Cliente
          
          set((state) => ({
            clientes: [...state.clientes, cliente],
          }))
          
          logger.info(`Cliente creado: ${id}`, { context: 'DataStore', data: { id, nombre: clienteData.nombre } })
          return id
        },

        updateCliente: (id, data) => {
          set((state) => ({
            clientes: state.clientes.map(c => 
              c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c,
            ),
          }))
          logger.info(`Cliente actualizado: ${id}`, { context: 'DataStore' })
          return true
        },

        removeCliente: (id) => {
          set((state) => ({
            clientes: state.clientes.filter(c => c.id !== id),
          }))
          logger.info(`Cliente eliminado: ${id}`, { context: 'DataStore' })
          return true
        },

        // ========== DISTRIBUIDORES CRUD ==========
        addDistribuidor: (distribuidorData) => {
          const id = get().getNextId('D')
          const now = new Date().toISOString()
          
          const distribuidor: Distribuidor = {
            ...distribuidorData,
            id,
            costoTotal: distribuidorData.costoTotal || 0,
            abonos: distribuidorData.abonos || 0,
            pendiente: distribuidorData.pendiente || 0,
            totalOrdenesCompra: distribuidorData.totalOrdenesCompra || 0,
            totalPagado: distribuidorData.totalPagado || 0,
            deudaTotal: distribuidorData.deudaTotal || 0,
            numeroOrdenes: distribuidorData.numeroOrdenes || 0,
            keywords: [distribuidorData.nombre?.toLowerCase() || '', id.toLowerCase()],
            estado: distribuidorData.estado || 'activo',
            createdAt: now,
            updatedAt: now,
          } as Distribuidor
          
          set((state) => ({
            distribuidores: [...state.distribuidores, distribuidor],
          }))
          
          logger.info(`Distribuidor creado: ${id}`, { context: 'DataStore', data: { id, nombre: distribuidorData.nombre } })
          return id
        },

        updateDistribuidor: (id, data) => {
          set((state) => ({
            distribuidores: state.distribuidores.map(d => 
              d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d,
            ),
          }))
          logger.info(`Distribuidor actualizado: ${id}`, { context: 'DataStore' })
          return true
        },

        removeDistribuidor: (id) => {
          set((state) => ({
            distribuidores: state.distribuidores.filter(d => d.id !== id),
          }))
          logger.info(`Distribuidor eliminado: ${id}`, { context: 'DataStore' })
          return true
        },

        // ========== ORDENES COMPRA CRUD ==========
        addOrdenCompra: (ordenData) => {
          const state = get()
          const numOrdenes = state.ordenesCompra.length + 1
          const id = `OC${numOrdenes.toString().padStart(4, '0')}`
          const now = new Date().toISOString()
          
          const costoTotal = (ordenData.costoPorUnidad || 0) * (ordenData.cantidad || 0)
          
          const orden: OrdenCompra = {
            ...ordenData,
            id,
            costoTotal,
            stockInicial: ordenData.cantidad || 0,
            stockActual: ordenData.stockActual ?? ordenData.cantidad ?? 0,
            deuda: costoTotal - (ordenData.pagoDistribuidor || 0),
            keywords: [ordenData.distribuidor?.toLowerCase() || '', id.toLowerCase()],
            estado: ordenData.estado || 'pendiente',
            createdAt: now,
            updatedAt: now,
          } as OrdenCompra
          
          set((state) => ({
            ordenesCompra: [...state.ordenesCompra, orden],
          }))
          
          logger.info(`Orden de compra creada: ${id}`, { context: 'DataStore', data: { id, distribuidor: ordenData.distribuidor } })
          return id
        },

        updateOrdenCompra: (id, data) => {
          set((state) => ({
            ordenesCompra: state.ordenesCompra.map(o => 
              o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o,
            ),
          }))
          logger.info(`Orden de compra actualizada: ${id}`, { context: 'DataStore' })
          return true
        },

        removeOrdenCompra: (id) => {
          set((state) => ({
            ordenesCompra: state.ordenesCompra.filter(o => o.id !== id),
          }))
          logger.info(`Orden de compra eliminada: ${id}`, { context: 'DataStore' })
          return true
        },
        
        pagarOrdenCompra: (ocId, monto, bancoId) => {
          const state = get()
          const oc = state.ordenesCompra.find(o => o.id === ocId)
          if (!oc || monto <= 0) return false
          
          const now = new Date().toISOString()
          const nuevoPago = (oc.pagoDistribuidor || 0) + monto
          const nuevaDeuda = Math.max(0, (oc.deuda || 0) - monto)
          const nuevoEstado = nuevaDeuda === 0 ? 'pagado' : 'parcial'
          
          set((state) => {
            const nuevasOC = state.ordenesCompra.map(o =>
              o.id === ocId
                ? {
                    ...o,
                    pagoDistribuidor: nuevoPago,
                    pagoInicial: nuevoPago,
                    deuda: nuevaDeuda,
                    estado: nuevoEstado as 'pendiente' | 'parcial' | 'pagado' | 'cancelado',
                    updatedAt: now,
                  }
                : o
            )
            
            const nuevosBancos = state.bancos.map(b =>
              b.id === bancoId
                ? {
                    ...b,
                    capitalActual: b.capitalActual - monto,
                    historicoGastos: b.historicoGastos + monto,
                    ultimaActualizacion: now,
                  }
                : b
            )
            
            const movId = `M${(state.movimientos.length + 1).toString().padStart(6, '0')}`
            const nuevoMovimiento: Movimiento = {
              id: movId,
              bancoId,
              tipoMovimiento: 'pago_distribuidor',
              fecha: now,
              monto,
              concepto: `Pago OC ${ocId}`,
              destino: oc.distribuidor,
              referenciaId: ocId,
              referenciaTipo: 'orden_compra',
              createdAt: now,
            } as Movimiento
            
            return {
              ordenesCompra: nuevasOC,
              bancos: nuevosBancos,
              movimientos: [...state.movimientos, nuevoMovimiento],
              lastSync: now,
            }
          })
          
          logger.info(`Pago a OC registrado`, { context: 'DataStore', data: { ocId, monto, nuevoEstado } })
          return true
        },

        // ========== MOVIMIENTOS CRUD ==========
        addMovimiento: (movData) => {
          const id = get().getNextId('M')
          const now = new Date().toISOString()
          
          const movimiento: Movimiento = {
            ...movData,
            id,
            createdAt: now,
          } as Movimiento
          
          // Actualizar capital del banco
          const bancoId = movData.bancoId
          const monto = movData.monto || 0
          const tipo = movData.tipoMovimiento
          
          set((state) => {
            const newBancos = state.bancos.map(banco => {
              if (banco.id === bancoId) {
                if (tipo === 'ingreso' || tipo === 'transferencia_entrada' || tipo === 'abono_cliente') {
                  return {
                    ...banco,
                    capitalActual: banco.capitalActual + monto,
                    historicoIngresos: banco.historicoIngresos + monto,
                  }
                } else if (tipo === 'gasto' || tipo === 'transferencia_salida' || tipo === 'pago_distribuidor') {
                  return {
                    ...banco,
                    capitalActual: banco.capitalActual - monto,
                    historicoGastos: banco.historicoGastos + monto,
                  }
                }
              }
              return banco
            })
            
            return {
              movimientos: [...state.movimientos, movimiento],
              bancos: newBancos,
            }
          })
          
          logger.info(`Movimiento creado: ${id}`, { context: 'DataStore', data: { id, bancoId, monto } })
          return id
        },

        // ========== BANCOS ==========
        agregarIngreso: (bancoId, monto, concepto, referencia) => {
          const now = new Date().toISOString()
          
          set((state) => {
            const nuevosBancos = state.bancos.map(b =>
              b.id === bancoId
                ? {
                    ...b,
                    capitalActual: b.capitalActual + monto,
                    historicoIngresos: b.historicoIngresos + monto,
                    ultimaActualizacion: now,
                  }
                : b
            )
            
            const movId = `M${(state.movimientos.length + 1).toString().padStart(6, '0')}`
            const nuevoMovimiento: Movimiento = {
              id: movId,
              bancoId,
              tipoMovimiento: 'ingreso',
              fecha: now,
              monto,
              concepto,
              referenciaId: referencia,
              createdAt: now,
            } as Movimiento
            
            return {
              bancos: nuevosBancos,
              movimientos: [...state.movimientos, nuevoMovimiento],
              lastSync: now,
            }
          })
        },
        
        agregarGasto: (bancoId, monto, concepto, referencia) => {
          const now = new Date().toISOString()
          
          set((state) => {
            const nuevosBancos = state.bancos.map(b =>
              b.id === bancoId
                ? {
                    ...b,
                    capitalActual: b.capitalActual - monto,
                    historicoGastos: b.historicoGastos + monto,
                    ultimaActualizacion: now,
                  }
                : b
            )
            
            const movId = `M${(state.movimientos.length + 1).toString().padStart(6, '0')}`
            const nuevoMovimiento: Movimiento = {
              id: movId,
              bancoId,
              tipoMovimiento: 'gasto',
              fecha: now,
              monto,
              concepto,
              referenciaId: referencia,
              createdAt: now,
            } as Movimiento
            
            return {
              bancos: nuevosBancos,
              movimientos: [...state.movimientos, nuevoMovimiento],
              lastSync: now,
            }
          })
        },
        
        transferir: (origen, destino, monto, concepto) => {
          const state = get()
          const bancoOrigen = state.bancos.find(b => b.id === origen)
          if (!bancoOrigen || bancoOrigen.capitalActual < monto) return false
          
          const now = new Date().toISOString()
          
          set((state) => {
            const nuevosBancos = state.bancos.map(b => {
              if (b.id === origen) {
                return { ...b, capitalActual: b.capitalActual - monto, ultimaActualizacion: now }
              }
              if (b.id === destino) {
                return { ...b, capitalActual: b.capitalActual + monto, ultimaActualizacion: now }
              }
              return b
            })
            
            const movIdBase = state.movimientos.length
            const movSalida: Movimiento = {
              id: `M${(movIdBase + 1).toString().padStart(6, '0')}`,
              bancoId: origen,
              tipoMovimiento: 'transferencia_salida',
              fecha: now,
              monto,
              concepto,
              destino,
              createdAt: now,
            } as Movimiento
            
            const movEntrada: Movimiento = {
              id: `M${(movIdBase + 2).toString().padStart(6, '0')}`,
              bancoId: destino,
              tipoMovimiento: 'transferencia_entrada',
              fecha: now,
              monto,
              concepto,
              origen,
              createdAt: now,
            } as Movimiento
            
            return {
              bancos: nuevosBancos,
              movimientos: [...state.movimientos, movSalida, movEntrada],
              lastSync: now,
            }
          })
          
          logger.info(`Transferencia realizada`, { context: 'DataStore', data: { origen, destino, monto } })
          return true
        },
        
        updateBancoCapital: (bancoId, monto, tipo) => {
          set((state) => ({
            bancos: state.bancos.map(banco => {
              if (banco.id === bancoId) {
                if (tipo === 'ingreso') {
                  return {
                    ...banco,
                    capitalActual: banco.capitalActual + monto,
                    historicoIngresos: banco.historicoIngresos + monto,
                  }
                } else {
                  return {
                    ...banco,
                    capitalActual: banco.capitalActual - monto,
                    historicoGastos: banco.historicoGastos + monto,
                  }
                }
              }
              return banco
            }),
          }))
        },
        
        inicializarDatosPrueba: () => {
          const now = new Date().toISOString()
          
          // Clientes de prueba
          const clientesPrueba: Cliente[] = [
            {
              id: 'CLI0001',
              nombre: 'Juan Pérez',
              telefono: '555-1234',
              email: 'juan@ejemplo.com',
              actual: 0, deuda: 0, abonos: 0, pendiente: 0,
              totalVentas: 0, totalPagado: 0, deudaTotal: 0, numeroCompras: 0,
              keywords: ['juan pérez'], estado: 'activo',
              createdAt: now, updatedAt: now,
            } as Cliente,
            {
              id: 'CLI0002',
              nombre: 'María García',
              telefono: '555-5678',
              email: 'maria@ejemplo.com',
              actual: 0, deuda: 0, abonos: 0, pendiente: 0,
              totalVentas: 0, totalPagado: 0, deudaTotal: 0, numeroCompras: 0,
              keywords: ['maría garcía'], estado: 'activo',
              createdAt: now, updatedAt: now,
            } as Cliente,
            {
              id: 'CLI0003',
              nombre: 'Carlos López',
              telefono: '555-9012',
              actual: 0, deuda: 0, abonos: 0, pendiente: 0,
              totalVentas: 0, totalPagado: 0, deudaTotal: 0, numeroCompras: 0,
              keywords: ['carlos lópez'], estado: 'activo',
              createdAt: now, updatedAt: now,
            } as Cliente,
          ]
          
          // Distribuidores de prueba
          const distribuidoresPrueba: Distribuidor[] = [
            {
              id: 'DIST0001',
              nombre: 'PACMAN',
              empresa: 'Distribuidora PACMAN SA',
              telefono: '555-0001',
              costoTotal: 0, abonos: 0, pendiente: 0,
              totalOrdenesCompra: 0, totalPagado: 0, deudaTotal: 0, numeroOrdenes: 0,
              keywords: ['pacman'], estado: 'activo',
              createdAt: now, updatedAt: now,
            } as Distribuidor,
            {
              id: 'DIST0002',
              nombre: 'Q-MAYA',
              empresa: 'Q-MAYA Distribución',
              telefono: '555-0002',
              costoTotal: 0, abonos: 0, pendiente: 0,
              totalOrdenesCompra: 0, totalPagado: 0, deudaTotal: 0, numeroOrdenes: 0,
              keywords: ['q-maya'], estado: 'activo',
              createdAt: now, updatedAt: now,
            } as Distribuidor,
          ]
          
          // Bancos con capital inicial
          const bancosConCapital: BancoData[] = BANCOS_INICIAL.map(b => ({
            ...b,
            capitalActual: b.id === 'boveda_monte' ? 500000 : 
                           b.id === 'utilidades' ? 150000 : 
                           b.id === 'flete_sur' ? 50000 : 0,
            historicoIngresos: b.id === 'boveda_monte' ? 500000 : 
                               b.id === 'utilidades' ? 150000 : 
                               b.id === 'flete_sur' ? 50000 : 0,
            ultimaActualizacion: now,
          }))
          
          // Órdenes de compra de prueba con stock
          const ocPrueba: OrdenCompra[] = [
            {
              id: 'OC0001',
              fecha: now,
              distribuidorId: 'DIST0001',
              distribuidor: 'PACMAN',
              origen: 'PACMAN',
              cantidad: 100,
              costoDistribuidor: 6300,
              costoTransporte: 0,
              costoPorUnidad: 6300,
              costoTotal: 630000,
              stockActual: 100,
              stockInicial: 100,
              pagoDistribuidor: 630000,
              pagoInicial: 630000,
              deuda: 0,
              bancoOrigen: 'boveda_monte',
              estado: 'pagado',
              keywords: ['pacman', 'oc0001'],
              createdAt: now,
              updatedAt: now,
            } as OrdenCompra,
            {
              id: 'OC0002',
              fecha: now,
              distribuidorId: 'DIST0002',
              distribuidor: 'Q-MAYA',
              origen: 'Q-MAYA',
              cantidad: 50,
              costoDistribuidor: 6500,
              costoTransporte: 200,
              costoPorUnidad: 6700,
              costoTotal: 335000,
              stockActual: 50,
              stockInicial: 50,
              pagoDistribuidor: 200000,
              pagoInicial: 200000,
              deuda: 135000,
              bancoOrigen: 'boveda_monte',
              estado: 'parcial',
              keywords: ['q-maya', 'oc0002'],
              createdAt: now,
              updatedAt: now,
            } as OrdenCompra,
          ]
          
          set({
            clientes: clientesPrueba,
            distribuidores: distribuidoresPrueba,
            bancos: bancosConCapital,
            ordenesCompra: ocPrueba,
            ventas: [],
            movimientos: [],
            initialized: true,
            lastSync: now,
          })
          
          logger.info('Datos de prueba inicializados', { context: 'DataStore' })
        },
        
        exportarDatos: () => {
          const state = get()
          return JSON.stringify({
            bancos: state.bancos,
            ventas: state.ventas,
            ordenesCompra: state.ordenesCompra,
            clientes: state.clientes,
            distribuidores: state.distribuidores,
            movimientos: state.movimientos,
            exportedAt: new Date().toISOString(),
            version: state.version,
          }, null, 2)
        },
        
        importarDatos: (json) => {
          try {
            const data = JSON.parse(json)
            set({
              bancos: data.bancos || BANCOS_INICIAL,
              ventas: data.ventas || [],
              ordenesCompra: data.ordenesCompra || [],
              clientes: data.clientes || [],
              distribuidores: data.distribuidores || [],
              movimientos: data.movimientos || [],
              initialized: true,
              lastSync: new Date().toISOString(),
            })
            logger.info('Datos importados exitosamente', { context: 'DataStore' })
            return true
          } catch (error) {
            logger.error('Error al importar datos', error, { context: 'DataStore' })
            return false
          }
        },
      }),
      {
        name: 'chronos-data-storage',
        version: 1,
      },
    ),
    { name: 'ChronosDataStore' },
  ),
)

// ===================================================================
// HOOKS DE CONVENIENCIA (compatibles con useFirestoreCRUD)
// ===================================================================

export function useLocalVentas() {
  const ventas = useDataStore((state) => state.ventas)
  const addVenta = useDataStore((state) => state.addVenta)
  const updateVenta = useDataStore((state) => state.updateVenta)
  const removeVenta = useDataStore((state) => state.removeVenta)
  const registrarPago = useDataStore((state) => state.registrarPagoVenta)
  
  return {
    data: ventas,
    loading: false,
    error: null,
    isConnected: true,
    add: async (item: Omit<Venta, 'id' | 'createdAt' | 'updatedAt'>) => addVenta(item),
    update: async (id: string, item: Partial<Venta>) => updateVenta(id, item),
    remove: async (id: string) => removeVenta(id),
    registrarPago: (ventaId: string, monto: number) => registrarPago(ventaId, monto),
    refresh: async () => {},
  }
}

export function useLocalClientes() {
  const clientes = useDataStore((state) => state.clientes)
  const addCliente = useDataStore((state) => state.addCliente)
  const updateCliente = useDataStore((state) => state.updateCliente)
  const removeCliente = useDataStore((state) => state.removeCliente)
  
  return {
    data: clientes,
    loading: false,
    error: null,
    isConnected: true,
    add: async (item: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => addCliente(item),
    update: async (id: string, item: Partial<Cliente>) => updateCliente(id, item),
    remove: async (id: string) => removeCliente(id),
    refresh: async () => {},
  }
}

export function useLocalDistribuidores() {
  const distribuidores = useDataStore((state) => state.distribuidores)
  const addDistribuidor = useDataStore((state) => state.addDistribuidor)
  const updateDistribuidor = useDataStore((state) => state.updateDistribuidor)
  const removeDistribuidor = useDataStore((state) => state.removeDistribuidor)
  
  return {
    data: distribuidores,
    loading: false,
    error: null,
    isConnected: true,
    add: async (item: Omit<Distribuidor, 'id' | 'createdAt' | 'updatedAt'>) => addDistribuidor(item),
    update: async (id: string, item: Partial<Distribuidor>) => updateDistribuidor(id, item),
    remove: async (id: string) => removeDistribuidor(id),
    refresh: async () => {},
  }
}

export function useLocalOrdenesCompra() {
  const ordenesCompra = useDataStore((state) => state.ordenesCompra)
  const addOrdenCompra = useDataStore((state) => state.addOrdenCompra)
  const updateOrdenCompra = useDataStore((state) => state.updateOrdenCompra)
  const removeOrdenCompra = useDataStore((state) => state.removeOrdenCompra)
  const pagarOC = useDataStore((state) => state.pagarOrdenCompra)
  const getOrdenesConStock = useDataStore((state) => state.getOrdenesConStock)
  
  return {
    data: ordenesCompra,
    loading: false,
    error: null,
    isConnected: true,
    ordenesConStock: getOrdenesConStock(),
    add: async (item: Omit<OrdenCompra, 'id' | 'createdAt' | 'updatedAt'>) => addOrdenCompra(item),
    update: async (id: string, item: Partial<OrdenCompra>) => updateOrdenCompra(id, item),
    remove: async (id: string) => removeOrdenCompra(id),
    pagar: (ocId: string, monto: number, bancoId: BancoId) => pagarOC(ocId, monto, bancoId),
    refresh: async () => {},
  }
}

export function useLocalBancos() {
  const bancos = useDataStore((state) => state.bancos)
  const agregarIngreso = useDataStore((state) => state.agregarIngreso)
  const agregarGasto = useDataStore((state) => state.agregarGasto)
  const transferir = useDataStore((state) => state.transferir)
  
  return {
    data: bancos,
    loading: false,
    error: null,
    isConnected: true,
    totalCapital: bancos.reduce((acc, b) => acc + b.capitalActual, 0),
    agregarIngreso,
    agregarGasto,
    transferir,
  }
}

export function useLocalMovimientos(bancoId?: BancoId) {
  const movimientos = useDataStore((state) => state.movimientos)
  const addMovimiento = useDataStore((state) => state.addMovimiento)
  
  const filtered = bancoId 
    ? movimientos.filter(m => m.bancoId === bancoId)
    : movimientos
  
  return {
    data: filtered,
    loading: false,
    error: null,
    isConnected: true,
    add: async (item: Omit<Movimiento, 'id' | 'createdAt'>) => addMovimiento(item),
    refresh: async () => {},
  }
}

// Hook para KPIs
export function useLocalKPIs() {
  const getKPIs = useDataStore((state) => state.getKPIs)
  return getKPIs()
}

// Hook para inicializar datos de prueba
export function useInitializeData() {
  const initialized = useDataStore((state) => state.initialized)
  const inicializarDatosPrueba = useDataStore((state) => state.inicializarDatosPrueba)
  const reset = useDataStore((state) => state.reset)
  
  return {
    initialized,
    inicializarDatosPrueba,
    reset,
  }
}
