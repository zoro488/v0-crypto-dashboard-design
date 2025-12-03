/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗄️ CHRONOS 2026 — STORE CENTRAL 100% LOCAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de datos ultra-rápido con:
 * - Zustand + persist middleware
 * - IndexedDB para persistencia offline
 * - Actualizaciones instantáneas (<100ms)
 * - 7 bancos siempre sincronizados
 * - Lógica sagrada protegida
 * 
 * SIN FIREBASE — 100% LOCAL — OFFLINE-FIRST
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { 
  BancoId, 
  Banco, 
  Venta, 
  OrdenCompra, 
  Cliente, 
  Distribuidor, 
  Movimiento,
  Producto,
  PanelId,
} from '@/app/types'
import { BANCOS_CONFIG } from '../constants/bancos'
import {
  calcularDistribucionVenta,
  calcularDistribucionParcial,
  calcularAbono,
  calcularTransferencia,
  calcularStock,
  recalcularBanco,
  recalcularCliente,
  recalcularDistribuidor,
  generarIdVenta,
  generarIdOrdenCompra,
  generarIdMovimiento,
} from '../services/logic'

// ═══════════════════════════════════════════════════════════════════════════
// INDEXEDDB STORAGE ADAPTER
// ═══════════════════════════════════════════════════════════════════════════

const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    
    return new Promise((resolve) => {
      const request = indexedDB.open('chronos-db', 1)
      
      request.onerror = () => resolve(null)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store')
        }
      }
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction('store', 'readonly')
        const store = transaction.objectStore('store')
        const getRequest = store.get(name)
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null)
        }
        getRequest.onerror = () => resolve(null)
      }
    })
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('chronos-db', 1)
      
      request.onerror = () => reject(request.error)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store')
        }
      }
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction('store', 'readwrite')
        const store = transaction.objectStore('store')
        store.put(value, name)
        
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      }
    })
  },
  
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return
    
    return new Promise((resolve) => {
      const request = indexedDB.open('chronos-db', 1)
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction('store', 'readwrite')
        const store = transaction.objectStore('store')
        store.delete(name)
        transaction.oncomplete = () => resolve()
      }
      
      request.onerror = () => resolve()
    })
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS DEL STORE
// ═══════════════════════════════════════════════════════════════════════════

interface ChronosState {
  // ═══════════════════════════════════════════════════════════════════════
  // DATOS DE NEGOCIO
  // ═══════════════════════════════════════════════════════════════════════
  bancos: Record<BancoId, Banco>
  ventas: Venta[]
  ordenesCompra: OrdenCompra[]
  clientes: Cliente[]
  distribuidores: Distribuidor[]
  movimientos: Movimiento[]
  productos: Producto[]
  
  // ═══════════════════════════════════════════════════════════════════════
  // ESTADO UI
  // ═══════════════════════════════════════════════════════════════════════
  currentPanel: PanelId
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'cyber'
  isLoading: boolean
  lastSync: number
  
  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES (se recalculan automáticamente)
  // ═══════════════════════════════════════════════════════════════════════
  totalCapital: number
  totalDeudaClientes: number
  totalDeudaDistribuidores: number
  stockTotal: number
  
  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES — VENTAS
  // ═══════════════════════════════════════════════════════════════════════
  crearVenta: (venta: Omit<Venta, 'id' | 'createdAt' | 'updatedAt' | 'distribucionBancos'>) => string
  actualizarVenta: (id: string, cambios: Partial<Venta>) => void
  eliminarVenta: (id: string) => void
  abonarVenta: (ventaId: string, monto: number) => void
  
  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES — ÓRDENES DE COMPRA
  // ═══════════════════════════════════════════════════════════════════════
  crearOrdenCompra: (oc: Omit<OrdenCompra, 'id' | 'createdAt' | 'updatedAt'>) => string
  actualizarOrdenCompra: (id: string, cambios: Partial<OrdenCompra>) => void
  eliminarOrdenCompra: (id: string) => void
  abonarOrdenCompra: (ocId: string, monto: number, bancoOrigen: BancoId) => void
  
  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES — CLIENTES
  // ═══════════════════════════════════════════════════════════════════════
  crearCliente: (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => string
  actualizarCliente: (id: string, cambios: Partial<Cliente>) => void
  eliminarCliente: (id: string) => void
  
  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES — DISTRIBUIDORES
  // ═══════════════════════════════════════════════════════════════════════
  crearDistribuidor: (distribuidor: Omit<Distribuidor, 'id' | 'createdAt' | 'updatedAt'>) => string
  actualizarDistribuidor: (id: string, cambios: Partial<Distribuidor>) => void
  eliminarDistribuidor: (id: string) => void
  
  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES — BANCOS Y TRANSFERENCIAS
  // ═══════════════════════════════════════════════════════════════════════
  transferir: (bancoOrigenId: BancoId, bancoDestinoId: BancoId, monto: number, concepto?: string) => void
  registrarIngreso: (bancoId: BancoId, monto: number, concepto: string) => void
  registrarGasto: (bancoId: BancoId, monto: number, concepto: string) => void
  
  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES — UI
  // ═══════════════════════════════════════════════════════════════════════
  setCurrentPanel: (panel: PanelId) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'cyber') => void
  
  // ═══════════════════════════════════════════════════════════════════════
  // ACCIONES — SISTEMA
  // ═══════════════════════════════════════════════════════════════════════
  recalcularTodo: () => void
  resetearDatos: () => void
  importarDatos: (datos: Partial<ChronosState>) => void
  exportarDatos: () => Partial<ChronosState>
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO INICIAL DE BANCOS
// ═══════════════════════════════════════════════════════════════════════════

const crearBancosIniciales = (): Record<BancoId, Banco> => {
  const bancos: Record<BancoId, Banco> = {} as Record<BancoId, Banco>
  const now = new Date().toISOString()
  
  const bancosIds: BancoId[] = ['boveda_monte', 'boveda_usa', 'profit', 'leftie', 'azteca', 'flete_sur', 'utilidades']
  
  for (const id of bancosIds) {
    const config = BANCOS_CONFIG[id]
    bancos[id] = {
      id,
      nombre: config?.nombre || id,
      icon: config?.icon || '🏦',
      color: config?.color || 'gray',
      tipo: config?.tipo || 'operativo',
      descripcion: config?.descripcion || '',
      moneda: config?.moneda || 'MXN',
      capitalActual: 0,
      capitalInicial: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
    }
  }
  
  return bancos
}

// ═══════════════════════════════════════════════════════════════════════════
// STORE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const useChronosStore = create<ChronosState>()(
  devtools(
    persist(
      (set, get) => ({
        // ═══════════════════════════════════════════════════════════════════
        // ESTADO INICIAL
        // ═══════════════════════════════════════════════════════════════════
        bancos: crearBancosIniciales(),
        ventas: [],
        ordenesCompra: [],
        clientes: [],
        distribuidores: [],
        movimientos: [],
        productos: [],
        
        currentPanel: 'dashboard',
        sidebarCollapsed: false,
        theme: 'dark',
        isLoading: false,
        lastSync: Date.now(),
        
        totalCapital: 0,
        totalDeudaClientes: 0,
        totalDeudaDistribuidores: 0,
        stockTotal: 0,

        // ═══════════════════════════════════════════════════════════════════
        // ACCIONES — VENTAS
        // ═══════════════════════════════════════════════════════════════════
        crearVenta: (ventaData) => {
          const id = generarIdVenta()
          const now = new Date().toISOString()
          const state = get()
          
          // Obtener datos de la OC para el cálculo
          const oc = state.ordenesCompra.find(o => o.id === ventaData.ocRelacionada)
          const precioCompra = oc?.costoPorUnidad || 0
          const precioFlete = ventaData.flete === 'Aplica' ? (ventaData.fleteUtilidad || 0) / ventaData.cantidad : 0
          
          // Calcular distribución
          const distribucion = calcularDistribucionVenta(
            ventaData.precioVenta,
            precioCompra,
            precioFlete,
            ventaData.cantidad,
          )
          
          const totalVenta = ventaData.precioVenta * ventaData.cantidad
          const montoPagado = ventaData.montoPagado || 0
          const montoRestante = totalVenta - montoPagado
          
          // Determinar estado de pago
          let estadoPago: 'completo' | 'parcial' | 'pendiente' = 'pendiente'
          if (montoPagado >= totalVenta) estadoPago = 'completo'
          else if (montoPagado > 0) estadoPago = 'parcial'
          
          const nuevaVenta: Venta = {
            ...ventaData,
            id,
            precioCompra,
            ingreso: totalVenta,
            totalVenta,
            precioTotalVenta: totalVenta,
            bovedaMonte: distribucion.bovedaMonte,
            utilidad: distribucion.utilidades,
            ganancia: distribucion.utilidades,
            distribucionBancos: {
              bovedaMonte: distribucion.bovedaMonte,
              fletes: distribucion.fletes,
              utilidades: distribucion.utilidades,
            },
            estadoPago,
            estatus: estadoPago === 'completo' ? 'Pagado' : estadoPago === 'parcial' ? 'Parcial' : 'Pendiente',
            montoPagado,
            montoRestante,
            adeudo: montoRestante,
            keywords: [ventaData.cliente.toLowerCase(), id.toLowerCase()],
            createdAt: now,
            updatedAt: now,
          }
          
          set((state) => {
            // Calcular distribución a aplicar al capital
            let distribucionCapital = distribucion
            if (estadoPago === 'parcial') {
              const parcial = calcularDistribucionParcial(distribucion, montoPagado, totalVenta)
              distribucionCapital = {
                bovedaMonte: parcial.capitalBovedaMonte,
                fletes: parcial.capitalFletes,
                utilidades: parcial.capitalUtilidades,
                total: montoPagado,
              }
            } else if (estadoPago === 'pendiente') {
              distribucionCapital = { bovedaMonte: 0, fletes: 0, utilidades: 0, total: 0 }
            }
            
            // Actualizar bancos
            const nuevosBancos = { ...state.bancos }
            
            if (distribucionCapital.bovedaMonte > 0) {
              nuevosBancos.boveda_monte = {
                ...nuevosBancos.boveda_monte,
                capitalActual: nuevosBancos.boveda_monte.capitalActual + distribucionCapital.bovedaMonte,
                historicoIngresos: nuevosBancos.boveda_monte.historicoIngresos + distribucion.bovedaMonte,
                updatedAt: now,
              }
            }
            
            if (distribucionCapital.fletes > 0) {
              nuevosBancos.flete_sur = {
                ...nuevosBancos.flete_sur,
                capitalActual: nuevosBancos.flete_sur.capitalActual + distribucionCapital.fletes,
                historicoIngresos: nuevosBancos.flete_sur.historicoIngresos + distribucion.fletes,
                updatedAt: now,
              }
            }
            
            if (distribucionCapital.utilidades > 0) {
              nuevosBancos.utilidades = {
                ...nuevosBancos.utilidades,
                capitalActual: nuevosBancos.utilidades.capitalActual + distribucionCapital.utilidades,
                historicoIngresos: nuevosBancos.utilidades.historicoIngresos + distribucion.utilidades,
                updatedAt: now,
              }
            }
            
            // Actualizar stock de la OC
            const nuevasOC = state.ordenesCompra.map(o => {
              if (o.id === ventaData.ocRelacionada) {
                return {
                  ...o,
                  stockActual: Math.max(0, o.stockActual - ventaData.cantidad),
                  updatedAt: now,
                }
              }
              return o
            })
            
            // Actualizar cliente
            const nuevosClientes = state.clientes.map(c => {
              if (c.id === ventaData.clienteId) {
                const ventasCliente = [...state.ventas.filter(v => v.clienteId === c.id), nuevaVenta]
                const updates = recalcularCliente(c, ventasCliente)
                return { ...c, ...updates }
              }
              return c
            })
            
            // Crear movimientos
            const nuevosMovimientos = [...state.movimientos]
            
            if (distribucion.bovedaMonte > 0) {
              nuevosMovimientos.push({
                id: generarIdMovimiento(),
                bancoId: 'boveda_monte',
                tipoMovimiento: 'ingreso',
                fecha: now,
                monto: distribucion.bovedaMonte,
                concepto: `Venta ${id} - ${ventaData.cliente}`,
                cliente: ventaData.cliente,
                referenciaId: id,
                referenciaTipo: 'venta',
                createdAt: now,
              })
            }
            
            if (distribucion.fletes > 0) {
              nuevosMovimientos.push({
                id: generarIdMovimiento(),
                bancoId: 'flete_sur',
                tipoMovimiento: 'ingreso',
                fecha: now,
                monto: distribucion.fletes,
                concepto: `Flete venta ${id}`,
                cliente: ventaData.cliente,
                referenciaId: id,
                referenciaTipo: 'venta',
                createdAt: now,
              })
            }
            
            if (distribucion.utilidades > 0) {
              nuevosMovimientos.push({
                id: generarIdMovimiento(),
                bancoId: 'utilidades',
                tipoMovimiento: 'ingreso',
                fecha: now,
                monto: distribucion.utilidades,
                concepto: `Utilidad venta ${id}`,
                cliente: ventaData.cliente,
                referenciaId: id,
                referenciaTipo: 'venta',
                createdAt: now,
              })
            }
            
            // Calcular totales
            const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
            const totalDeudaClientes = nuevosClientes.reduce((acc, c) => acc + (c.deudaTotal || 0), 0)
            
            return {
              ventas: [...state.ventas, nuevaVenta],
              bancos: nuevosBancos,
              ordenesCompra: nuevasOC,
              clientes: nuevosClientes,
              movimientos: nuevosMovimientos,
              totalCapital,
              totalDeudaClientes,
              lastSync: Date.now(),
            }
          })
          
          return id
        },
        
        actualizarVenta: (id, cambios) => {
          set((state) => ({
            ventas: state.ventas.map(v => 
              v.id === id ? { ...v, ...cambios, updatedAt: new Date().toISOString() } : v
            ),
            lastSync: Date.now(),
          }))
        },
        
        eliminarVenta: (id) => {
          set((state) => ({
            ventas: state.ventas.filter(v => v.id !== id),
            movimientos: state.movimientos.filter(m => m.referenciaId !== id),
            lastSync: Date.now(),
          }))
          get().recalcularTodo()
        },
        
        abonarVenta: (ventaId, monto) => {
          const state = get()
          const venta = state.ventas.find(v => v.id === ventaId)
          if (!venta) return
          
          const resultado = calcularAbono(venta, monto)
          const now = new Date().toISOString()
          
          set((state) => {
            // Actualizar venta
            const nuevasVentas = state.ventas.map(v => {
              if (v.id === ventaId) {
                return {
                  ...v,
                  montoPagado: resultado.nuevoMontoPagado,
                  montoRestante: resultado.nuevoMontoRestante,
                  adeudo: resultado.nuevoMontoRestante,
                  estadoPago: resultado.nuevoEstado,
                  estatus: resultado.nuevoEstado === 'completo' ? 'Pagado' as const : 
                           resultado.nuevoEstado === 'parcial' ? 'Parcial' as const : 'Pendiente' as const,
                  updatedAt: now,
                }
              }
              return v
            })
            
            // Actualizar bancos
            const nuevosBancos = { ...state.bancos }
            const dist = resultado.distribucionAdicional
            
            nuevosBancos.boveda_monte = {
              ...nuevosBancos.boveda_monte,
              capitalActual: nuevosBancos.boveda_monte.capitalActual + dist.bovedaMonte,
              historicoIngresos: nuevosBancos.boveda_monte.historicoIngresos + dist.bovedaMonte,
              updatedAt: now,
            }
            
            nuevosBancos.flete_sur = {
              ...nuevosBancos.flete_sur,
              capitalActual: nuevosBancos.flete_sur.capitalActual + dist.fletes,
              historicoIngresos: nuevosBancos.flete_sur.historicoIngresos + dist.fletes,
              updatedAt: now,
            }
            
            nuevosBancos.utilidades = {
              ...nuevosBancos.utilidades,
              capitalActual: nuevosBancos.utilidades.capitalActual + dist.utilidades,
              historicoIngresos: nuevosBancos.utilidades.historicoIngresos + dist.utilidades,
              updatedAt: now,
            }
            
            // Agregar movimientos
            const nuevosMovimientos = [
              ...state.movimientos,
              ...resultado.movimientos.map(m => ({
                ...m,
                id: generarIdMovimiento(),
                createdAt: now,
              })),
            ]
            
            // Actualizar cliente
            const nuevosClientes = state.clientes.map(c => {
              if (c.id === venta.clienteId) {
                const ventasCliente = nuevasVentas.filter(v => v.clienteId === c.id)
                const updates = recalcularCliente(c, ventasCliente)
                return { ...c, ...updates }
              }
              return c
            })
            
            const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
            const totalDeudaClientes = nuevosClientes.reduce((acc, c) => acc + (c.deudaTotal || 0), 0)
            
            return {
              ventas: nuevasVentas,
              bancos: nuevosBancos,
              movimientos: nuevosMovimientos,
              clientes: nuevosClientes,
              totalCapital,
              totalDeudaClientes,
              lastSync: Date.now(),
            }
          })
        },

        // ═══════════════════════════════════════════════════════════════════
        // ACCIONES — ÓRDENES DE COMPRA
        // ═══════════════════════════════════════════════════════════════════
        crearOrdenCompra: (ocData) => {
          const numeroActual = get().ordenesCompra.length + 1
          const id = generarIdOrdenCompra(numeroActual)
          const now = new Date().toISOString()
          
          const costoPorUnidad = (ocData.costoDistribuidor || 0) + (ocData.costoTransporte || 0)
          const costoTotal = costoPorUnidad * ocData.cantidad
          const pagoInicial = ocData.pagoInicial || ocData.pagoDistribuidor || 0
          const deuda = costoTotal - pagoInicial
          
          const nuevaOC: OrdenCompra = {
            ...ocData,
            id,
            costoPorUnidad,
            costoTotal,
            stockActual: ocData.cantidad,
            stockInicial: ocData.cantidad,
            pagoDistribuidor: pagoInicial,
            pagoInicial,
            deuda,
            estado: deuda <= 0 ? 'pagado' : pagoInicial > 0 ? 'parcial' : 'pendiente',
            keywords: [ocData.distribuidor.toLowerCase(), id.toLowerCase()],
            createdAt: now,
            updatedAt: now,
          }
          
          set((state) => {
            // Si hay pago inicial, descontar del banco origen
            const nuevosBancos = { ...state.bancos }
            const nuevosMovimientos = [...state.movimientos]
            
            if (pagoInicial > 0 && ocData.bancoOrigen) {
              const bancoOrigen = nuevosBancos[ocData.bancoOrigen]
              nuevosBancos[ocData.bancoOrigen] = {
                ...bancoOrigen,
                capitalActual: bancoOrigen.capitalActual - pagoInicial,
                historicoGastos: bancoOrigen.historicoGastos + pagoInicial,
                updatedAt: now,
              }
              
              nuevosMovimientos.push({
                id: generarIdMovimiento(),
                bancoId: ocData.bancoOrigen,
                tipoMovimiento: 'pago_distribuidor',
                fecha: now,
                monto: -pagoInicial,
                concepto: `Pago OC ${id} - ${ocData.distribuidor}`,
                referenciaId: id,
                referenciaTipo: 'orden_compra',
                createdAt: now,
              })
            }
            
            // Actualizar distribuidor
            const nuevosDistribuidores = state.distribuidores.map(d => {
              if (d.id === ocData.distribuidorId) {
                const ordenesDistribuidor = [...state.ordenesCompra.filter(o => o.distribuidorId === d.id), nuevaOC]
                const updates = recalcularDistribuidor(d, ordenesDistribuidor)
                return { ...d, ...updates }
              }
              return d
            })
            
            const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
            const totalDeudaDistribuidores = nuevosDistribuidores.reduce((acc, d) => acc + (d.deudaTotal || 0), 0)
            const stockTotal = [...state.ordenesCompra, nuevaOC].reduce((acc, oc) => acc + oc.stockActual, 0)
            
            return {
              ordenesCompra: [...state.ordenesCompra, nuevaOC],
              bancos: nuevosBancos,
              movimientos: nuevosMovimientos,
              distribuidores: nuevosDistribuidores,
              totalCapital,
              totalDeudaDistribuidores,
              stockTotal,
              lastSync: Date.now(),
            }
          })
          
          return id
        },
        
        actualizarOrdenCompra: (id, cambios) => {
          set((state) => ({
            ordenesCompra: state.ordenesCompra.map(oc => 
              oc.id === id ? { ...oc, ...cambios, updatedAt: new Date().toISOString() } : oc
            ),
            lastSync: Date.now(),
          }))
        },
        
        eliminarOrdenCompra: (id) => {
          set((state) => ({
            ordenesCompra: state.ordenesCompra.filter(oc => oc.id !== id),
            movimientos: state.movimientos.filter(m => m.referenciaId !== id),
            lastSync: Date.now(),
          }))
          get().recalcularTodo()
        },
        
        abonarOrdenCompra: (ocId, monto, bancoOrigen) => {
          const state = get()
          const oc = state.ordenesCompra.find(o => o.id === ocId)
          if (!oc) return
          
          const now = new Date().toISOString()
          const nuevoPago = (oc.pagoDistribuidor || 0) + monto
          const nuevaDeuda = oc.costoTotal - nuevoPago
          
          set((state) => {
            // Actualizar OC
            const nuevasOC = state.ordenesCompra.map(o => {
              if (o.id === ocId) {
                return {
                  ...o,
                  pagoDistribuidor: nuevoPago,
                  pagoInicial: nuevoPago,
                  deuda: nuevaDeuda,
                  estado: nuevaDeuda <= 0 ? 'pagado' as const : 'parcial' as const,
                  updatedAt: now,
                }
              }
              return o
            })
            
            // Descontar del banco
            const nuevosBancos = { ...state.bancos }
            const banco = nuevosBancos[bancoOrigen]
            nuevosBancos[bancoOrigen] = {
              ...banco,
              capitalActual: banco.capitalActual - monto,
              historicoGastos: banco.historicoGastos + monto,
              updatedAt: now,
            }
            
            // Agregar movimiento
            const nuevosMovimientos = [
              ...state.movimientos,
              {
                id: generarIdMovimiento(),
                bancoId: bancoOrigen,
                tipoMovimiento: 'pago_distribuidor' as const,
                fecha: now,
                monto: -monto,
                concepto: `Abono OC ${ocId} - ${oc.distribuidor}`,
                referenciaId: ocId,
                referenciaTipo: 'orden_compra' as const,
                createdAt: now,
              },
            ]
            
            // Actualizar distribuidor
            const nuevosDistribuidores = state.distribuidores.map(d => {
              if (d.id === oc.distribuidorId) {
                const ordenesDistribuidor = nuevasOC.filter(o => o.distribuidorId === d.id)
                const updates = recalcularDistribuidor(d, ordenesDistribuidor)
                return { ...d, ...updates }
              }
              return d
            })
            
            const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
            const totalDeudaDistribuidores = nuevosDistribuidores.reduce((acc, d) => acc + (d.deudaTotal || 0), 0)
            
            return {
              ordenesCompra: nuevasOC,
              bancos: nuevosBancos,
              movimientos: nuevosMovimientos,
              distribuidores: nuevosDistribuidores,
              totalCapital,
              totalDeudaDistribuidores,
              lastSync: Date.now(),
            }
          })
        },

        // ═══════════════════════════════════════════════════════════════════
        // ACCIONES — CLIENTES
        // ═══════════════════════════════════════════════════════════════════
        crearCliente: (clienteData) => {
          const id = uuidv4()
          const now = new Date().toISOString()
          
          const nuevoCliente: Cliente = {
            ...clienteData,
            id,
            actual: 0,
            deuda: 0,
            abonos: 0,
            pendiente: 0,
            totalVentas: 0,
            totalPagado: 0,
            deudaTotal: 0,
            numeroCompras: 0,
            keywords: [clienteData.nombre.toLowerCase()],
            estado: 'activo',
            createdAt: now,
            updatedAt: now,
          }
          
          set((state) => ({
            clientes: [...state.clientes, nuevoCliente],
            lastSync: Date.now(),
          }))
          
          return id
        },
        
        actualizarCliente: (id, cambios) => {
          set((state) => ({
            clientes: state.clientes.map(c => 
              c.id === id ? { ...c, ...cambios, updatedAt: new Date().toISOString() } : c
            ),
            lastSync: Date.now(),
          }))
        },
        
        eliminarCliente: (id) => {
          set((state) => ({
            clientes: state.clientes.filter(c => c.id !== id),
            lastSync: Date.now(),
          }))
        },

        // ═══════════════════════════════════════════════════════════════════
        // ACCIONES — DISTRIBUIDORES
        // ═══════════════════════════════════════════════════════════════════
        crearDistribuidor: (distribuidorData) => {
          const id = uuidv4()
          const now = new Date().toISOString()
          
          const nuevoDistribuidor: Distribuidor = {
            ...distribuidorData,
            id,
            costoTotal: 0,
            abonos: 0,
            pendiente: 0,
            totalOrdenesCompra: 0,
            totalPagado: 0,
            deudaTotal: 0,
            numeroOrdenes: 0,
            keywords: [distribuidorData.nombre.toLowerCase()],
            estado: 'activo',
            createdAt: now,
            updatedAt: now,
          }
          
          set((state) => ({
            distribuidores: [...state.distribuidores, nuevoDistribuidor],
            lastSync: Date.now(),
          }))
          
          return id
        },
        
        actualizarDistribuidor: (id, cambios) => {
          set((state) => ({
            distribuidores: state.distribuidores.map(d => 
              d.id === id ? { ...d, ...cambios, updatedAt: new Date().toISOString() } : d
            ),
            lastSync: Date.now(),
          }))
        },
        
        eliminarDistribuidor: (id) => {
          set((state) => ({
            distribuidores: state.distribuidores.filter(d => d.id !== id),
            lastSync: Date.now(),
          }))
        },

        // ═══════════════════════════════════════════════════════════════════
        // ACCIONES — BANCOS Y TRANSFERENCIAS
        // ═══════════════════════════════════════════════════════════════════
        transferir: (bancoOrigenId, bancoDestinoId, monto, concepto = 'Transferencia entre bancos') => {
          const state = get()
          const bancoOrigen = state.bancos[bancoOrigenId]
          const bancoDestino = state.bancos[bancoDestinoId]
          
          if (!bancoOrigen || !bancoDestino) return
          
          const resultado = calcularTransferencia(bancoOrigen, bancoDestino, monto, concepto)
          const now = new Date().toISOString()
          
          set((state) => {
            const nuevosBancos = { ...state.bancos }
            
            nuevosBancos[bancoOrigenId] = {
              ...nuevosBancos[bancoOrigenId],
              ...resultado.bancoOrigenNuevo,
              updatedAt: now,
            }
            
            nuevosBancos[bancoDestinoId] = {
              ...nuevosBancos[bancoDestinoId],
              ...resultado.bancoDestinoNuevo,
              updatedAt: now,
            }
            
            const nuevosMovimientos = [
              ...state.movimientos,
              { ...resultado.movimientoOrigen, id: generarIdMovimiento(), createdAt: now },
              { ...resultado.movimientoDestino, id: generarIdMovimiento(), createdAt: now },
            ]
            
            const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
            
            return {
              bancos: nuevosBancos,
              movimientos: nuevosMovimientos,
              totalCapital,
              lastSync: Date.now(),
            }
          })
        },
        
        registrarIngreso: (bancoId, monto, concepto) => {
          const now = new Date().toISOString()
          
          set((state) => {
            const banco = state.bancos[bancoId]
            const nuevosBancos = {
              ...state.bancos,
              [bancoId]: {
                ...banco,
                capitalActual: banco.capitalActual + monto,
                historicoIngresos: banco.historicoIngresos + monto,
                updatedAt: now,
              },
            }
            
            const nuevosMovimientos = [
              ...state.movimientos,
              {
                id: generarIdMovimiento(),
                bancoId,
                tipoMovimiento: 'ingreso' as const,
                fecha: now,
                monto,
                concepto,
                referenciaTipo: 'manual' as const,
                createdAt: now,
              },
            ]
            
            const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
            
            return {
              bancos: nuevosBancos,
              movimientos: nuevosMovimientos,
              totalCapital,
              lastSync: Date.now(),
            }
          })
        },
        
        registrarGasto: (bancoId, monto, concepto) => {
          const now = new Date().toISOString()
          
          set((state) => {
            const banco = state.bancos[bancoId]
            const nuevosBancos = {
              ...state.bancos,
              [bancoId]: {
                ...banco,
                capitalActual: banco.capitalActual - monto,
                historicoGastos: banco.historicoGastos + monto,
                updatedAt: now,
              },
            }
            
            const nuevosMovimientos = [
              ...state.movimientos,
              {
                id: generarIdMovimiento(),
                bancoId,
                tipoMovimiento: 'gasto' as const,
                fecha: now,
                monto: -monto,
                concepto,
                referenciaTipo: 'manual' as const,
                createdAt: now,
              },
            ]
            
            const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
            
            return {
              bancos: nuevosBancos,
              movimientos: nuevosMovimientos,
              totalCapital,
              lastSync: Date.now(),
            }
          })
        },

        // ═══════════════════════════════════════════════════════════════════
        // ACCIONES — UI
        // ═══════════════════════════════════════════════════════════════════
        setCurrentPanel: (panel) => set({ currentPanel: panel }),
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setTheme: (theme) => set({ theme }),

        // ═══════════════════════════════════════════════════════════════════
        // ACCIONES — SISTEMA
        // ═══════════════════════════════════════════════════════════════════
        recalcularTodo: () => {
          const state = get()
          const now = new Date().toISOString()
          
          // Recalcular bancos
          const nuevosBancos = { ...state.bancos }
          for (const bancoId of Object.keys(nuevosBancos) as BancoId[]) {
            nuevosBancos[bancoId] = recalcularBanco(nuevosBancos[bancoId], state.movimientos)
          }
          
          // Recalcular clientes
          const nuevosClientes = state.clientes.map(c => {
            const ventasCliente = state.ventas.filter(v => v.clienteId === c.id)
            const updates = recalcularCliente(c, ventasCliente)
            return { ...c, ...updates }
          })
          
          // Recalcular distribuidores
          const nuevosDistribuidores = state.distribuidores.map(d => {
            const ordenesDistribuidor = state.ordenesCompra.filter(oc => oc.distribuidorId === d.id)
            const updates = recalcularDistribuidor(d, ordenesDistribuidor)
            return { ...d, ...updates }
          })
          
          // Recalcular stock
          const nuevasOC = state.ordenesCompra.map(oc => {
            const stockActual = calcularStock(oc, state.ventas)
            return { ...oc, stockActual, updatedAt: now }
          })
          
          const totalCapital = Object.values(nuevosBancos).reduce((acc, b) => acc + b.capitalActual, 0)
          const totalDeudaClientes = nuevosClientes.reduce((acc, c) => acc + (c.deudaTotal || 0), 0)
          const totalDeudaDistribuidores = nuevosDistribuidores.reduce((acc, d) => acc + (d.deudaTotal || 0), 0)
          const stockTotal = nuevasOC.reduce((acc, oc) => acc + oc.stockActual, 0)
          
          set({
            bancos: nuevosBancos,
            clientes: nuevosClientes,
            distribuidores: nuevosDistribuidores,
            ordenesCompra: nuevasOC,
            totalCapital,
            totalDeudaClientes,
            totalDeudaDistribuidores,
            stockTotal,
            lastSync: Date.now(),
          })
        },
        
        resetearDatos: () => {
          set({
            bancos: crearBancosIniciales(),
            ventas: [],
            ordenesCompra: [],
            clientes: [],
            distribuidores: [],
            movimientos: [],
            productos: [],
            totalCapital: 0,
            totalDeudaClientes: 0,
            totalDeudaDistribuidores: 0,
            stockTotal: 0,
            lastSync: Date.now(),
          })
        },
        
        importarDatos: (datos) => {
          set((state) => ({
            ...state,
            ...datos,
            lastSync: Date.now(),
          }))
          get().recalcularTodo()
        },
        
        exportarDatos: () => {
          const state = get()
          return {
            bancos: state.bancos,
            ventas: state.ventas,
            ordenesCompra: state.ordenesCompra,
            clientes: state.clientes,
            distribuidores: state.distribuidores,
            movimientos: state.movimientos,
            productos: state.productos,
          }
        },
      }),
      {
        name: 'chronos-store',
        storage: createJSONStorage(() => indexedDBStorage),
        partialize: (state) => ({
          bancos: state.bancos,
          ventas: state.ventas,
          ordenesCompra: state.ordenesCompra,
          clientes: state.clientes,
          distribuidores: state.distribuidores,
          movimientos: state.movimientos,
          productos: state.productos,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      },
    ),
    { name: 'ChronosStore' },
  ),
)

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORES OPTIMIZADOS
// ═══════════════════════════════════════════════════════════════════════════

export const selectBanco = (bancoId: BancoId) => (state: ChronosState) => state.bancos[bancoId]
export const selectVentas = (state: ChronosState) => state.ventas
export const selectOrdenesCompra = (state: ChronosState) => state.ordenesCompra
export const selectClientes = (state: ChronosState) => state.clientes
export const selectDistribuidores = (state: ChronosState) => state.distribuidores
export const selectMovimientos = (state: ChronosState) => state.movimientos
export const selectTotalCapital = (state: ChronosState) => state.totalCapital
export const selectVentasPendientes = (state: ChronosState) => state.ventas.filter(v => v.estadoPago !== 'completo')
export const selectVentasHoy = (state: ChronosState) => {
  const hoy = new Date().toISOString().split('T')[0]
  return state.ventas.filter(v => (v.fecha as string).startsWith(hoy))
}

// Export type
export type { ChronosState }
