/**
 * 🗄️ DATA STORE - ALMACENAMIENTO EN MEMORIA
 * 
 * Store Zustand que mantiene TODOS los datos en memoria local.
 * Funciona SIN Firebase - los datos persisten en localStorage.
 * 
 * CARACTERÍSTICAS:
 * - CRUD completo para todas las entidades
 * - Persistencia automática en localStorage
 * - Distribución automática de ventas a bancos
 * - Cálculos de capital en tiempo real
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { logger } from '../utils/logger'
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
}

interface DataState {
  // ========== DATOS ==========
  ventas: Venta[]
  clientes: Cliente[]
  distribuidores: Distribuidor[]
  ordenesCompra: OrdenCompra[]
  movimientos: Movimiento[]
  bancos: BancoData[]
  
  // ========== LOADING ==========
  loading: boolean
  
  // ========== VENTAS CRUD ==========
  addVenta: (venta: Omit<Venta, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateVenta: (id: string, data: Partial<Venta>) => boolean
  removeVenta: (id: string) => boolean
  
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
  
  // ========== MOVIMIENTOS CRUD ==========
  addMovimiento: (mov: Omit<Movimiento, 'id' | 'createdAt'>) => string
  
  // ========== BANCOS ==========
  updateBancoCapital: (bancoId: BancoId, monto: number, tipo: 'ingreso' | 'gasto') => void
  
  // ========== UTILS ==========
  getNextId: (prefix: string) => string
  reset: () => void
}

// ===================================================================
// DATOS INICIALES
// ===================================================================

const BANCOS_INICIAL: BancoData[] = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#3B82F6' },
  { id: 'boveda_usa', nombre: 'Bóveda USA', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#10B981' },
  { id: 'profit', nombre: 'Profit', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#8B5CF6' },
  { id: 'leftie', nombre: 'Leftie', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#F59E0B' },
  { id: 'azteca', nombre: 'Azteca', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#EF4444' },
  { id: 'flete_sur', nombre: 'Flete Sur', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#06B6D4' },
  { id: 'utilidades', nombre: 'Utilidades', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0, color: '#22C55E' },
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
          const id = get().getNextId('V')
          const now = new Date().toISOString()
          
          // Calcular distribución a bancos
          const cantidad = ventaData.cantidad || 1
          const precioVenta = ventaData.precioVenta || 0
          const precioCompra = ventaData.precioCompra || 0
          const precioFlete = ventaData.fleteUtilidad || 0
          
          const montoBovedaMonte = precioCompra * cantidad
          const montoFletes = precioFlete * cantidad
          const montoUtilidades = (precioVenta - precioCompra - precioFlete) * cantidad
          
          const venta: Venta = {
            ...ventaData,
            id,
            ingreso: precioVenta * cantidad,
            totalVenta: precioVenta * cantidad,
            precioTotalVenta: precioVenta * cantidad,
            utilidad: montoUtilidades,
            ganancia: montoUtilidades,
            bovedaMonte: montoBovedaMonte,
            distribucionBancos: {
              bovedaMonte: montoBovedaMonte,
              fletes: montoFletes,
              utilidades: montoUtilidades,
            },
            keywords: [ventaData.cliente?.toLowerCase() || '', id.toLowerCase()],
            createdAt: now,
            updatedAt: now,
          } as Venta
          
          set((state) => {
            // Actualizar bancos si está pagado
            let newBancos = [...state.bancos]
            if (ventaData.estadoPago === 'completo' || ventaData.estatus === 'Pagado') {
              newBancos = newBancos.map(banco => {
                if (banco.id === 'boveda_monte') {
                  return { 
                    ...banco, 
                    capitalActual: banco.capitalActual + montoBovedaMonte,
                    historicoIngresos: banco.historicoIngresos + montoBovedaMonte,
                  }
                }
                if (banco.id === 'flete_sur') {
                  return { 
                    ...banco, 
                    capitalActual: banco.capitalActual + montoFletes,
                    historicoIngresos: banco.historicoIngresos + montoFletes,
                  }
                }
                if (banco.id === 'utilidades') {
                  return { 
                    ...banco, 
                    capitalActual: banco.capitalActual + montoUtilidades,
                    historicoIngresos: banco.historicoIngresos + montoUtilidades,
                  }
                }
                return banco
              })
            }
            
            return {
              ventas: [...state.ventas, venta],
              bancos: newBancos,
            }
          })
          
          logger.info(`Venta creada: ${id}`, { context: 'DataStore', data: { id, cliente: ventaData.cliente } })
          return id
        },

        updateVenta: (id, data) => {
          set((state) => ({
            ventas: state.ventas.map(v => 
              v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v
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
              c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
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
              d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
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
              o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
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
  
  return {
    data: ventas,
    loading: false,
    error: null,
    add: async (item: Omit<Venta, 'id' | 'createdAt' | 'updatedAt'>) => addVenta(item),
    update: async (id: string, item: Partial<Venta>) => updateVenta(id, item),
    remove: async (id: string) => removeVenta(id),
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
  
  return {
    data: ordenesCompra,
    loading: false,
    error: null,
    add: async (item: Omit<OrdenCompra, 'id' | 'createdAt' | 'updatedAt'>) => addOrdenCompra(item),
    update: async (id: string, item: Partial<OrdenCompra>) => updateOrdenCompra(id, item),
    remove: async (id: string) => removeOrdenCompra(id),
    refresh: async () => {},
  }
}

export function useLocalBancos() {
  const bancos = useDataStore((state) => state.bancos)
  return {
    data: bancos,
    loading: false,
    error: null,
    totalCapital: bancos.reduce((acc, b) => acc + b.capitalActual, 0),
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
    add: async (item: Omit<Movimiento, 'id' | 'createdAt'>) => addMovimiento(item),
    refresh: async () => {},
  }
}
