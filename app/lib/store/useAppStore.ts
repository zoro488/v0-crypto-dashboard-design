import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { firestoreService } from '../firebase/firestore-service'
import { logger } from '../utils/logger'

// ============================================================
// TIPOS LOCALES DEL STORE
// Nota: Estos tipos son para el estado local, separados de Firestore
// ============================================================

interface Distribuidor {
  id: string
  nombre: string
  empresa: string
  telefono: string
  email: string
  deudaTotal: number
  totalPagado: number
  ordenesActivas: number
  ordenesCompra: string[]
  historialPagos: Array<{
    fecha: string
    monto: number
    bancoDestino: string
  }>
}

interface Cliente {
  id: string
  nombre: string
  telefono: string
  email: string
  deudaTotal: number
  pendiente: number           // deuda - abonos (campo calculado)
  deuda: number               // Deuda total acumulada
  abonos: number              // Total de abonos realizados
  actual: number              // Saldo actual
  totalVentas: number         // Suma histórica de ventas
  totalPagado: number         // Total que ha pagado
  ventas: string[]
  historialPagos: Array<{
    fecha: string
    monto: number
  }>
}

interface OrdenCompra {
  id: string
  fecha: string
  distribuidorId: string
  distribuidor: string
  origen: string
  producto: string
  cantidad: number
  costoDistribuidor: number
  costoTransporte: number
  costoPorUnidad: number
  costoTotal: number
  pagoInicial: number
  deuda: number
  estado: 'pendiente' | 'parcial' | 'pagada'
}

interface Venta {
  id: string
  fecha: string
  clienteId: string
  cliente: string
  producto: string
  cantidad: number
  precioVentaUnidad: number
  precioCompraUnidad: number  // COSTO, no precio de venta
  precioFlete: number
  precioTotalUnidad: number
  precioTotalVenta: number
  montoPagado: number
  montoRestante: number
  estadoPago: 'completo' | 'parcial' | 'pendiente'
}

interface Producto {
  id: string
  nombre: string
  stockActual: number
  valorUnitario: number
}

// IDs de bancos con snake_case (estandarizado)
type BancoIdStore = 
  | 'boveda_monte'
  | 'boveda_usa'
  | 'utilidades'
  | 'flete_sur'  // Nota: en el store usamos "fletes" por compatibilidad
  | 'fletes'     // Alias para compatibilidad
  | 'azteca'
  | 'leftie'
  | 'profit'

interface BancoStore {
  id: string
  nombre: string
  saldo: number
  color: string
}

interface AppState {
  // UI State
  currentPanel: string
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'cyber'
  
  // User State
  currentUserId: string | null

  // Voice Agent State
  voiceAgentActive: boolean
  voiceAgentStatus: 'idle' | 'listening' | 'thinking' | 'speaking'
  audioFrequencies: number[]

  // 3D State
  modelRotation: number
  activeScene: string | null

  // Financial Data
  totalCapital: number
  bancos: BancoStore[]

  // New Data Structures for complete system
  distribuidores: Distribuidor[]
  clientes: Cliente[]
  ordenesCompra: OrdenCompra[]
  ventas: Venta[]
  productos: Producto[]

  // 🔄 Flag para refrescar datos en los hooks
  dataRefreshTrigger: number
  triggerDataRefresh: () => void

  // Actions
  setCurrentPanel: (panel: string) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'cyber') => void
  setVoiceAgentActive: (active: boolean) => void
  setVoiceAgentStatus: (status: 'idle' | 'listening' | 'thinking' | 'speaking') => void
  setAudioFrequencies: (frequencies: number[]) => void
  setModelRotation: (rotation: number) => void
  setActiveScene: (scene: string | null) => void
  updateBancoSaldo: (id: string, saldo: number) => void
  crearOrdenCompra: (data: Omit<OrdenCompra, 'id'>) => void
  crearVenta: (data: Omit<Venta, 'id' | 'clienteId'>) => void
  abonarDistribuidor: (distribuidorId: string, monto: number, bancoDestino: string) => void
  abonarCliente: (clienteId: string, monto: number) => void
  crearTransferencia: (origen: string, destino: string, monto: number) => void
  registrarGasto: (banco: string, monto: number, concepto: string) => void
  addEntradaAlmacen: (data: { productoNombre: string; cantidad: number; costoUnitario: number; tipo?: string; fecha?: string; origen?: string; valorTotal?: number; ordenCompraRef?: string }) => void
  addSalidaAlmacen: (data: { productoId: string; cantidad: number; tipo?: string; fecha?: string; destino?: string; valorTotal?: number; productoNombre?: string; ventaRef?: string }) => void
}

// ============================================================
// CONSTANTES - 7 Bancos del Sistema CHRONOS
// ============================================================
const BANCOS_INICIALES: BancoStore[] = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', saldo: 0, color: 'from-blue-500 to-cyan-500' },
  { id: 'boveda_usa', nombre: 'Bóveda USA', saldo: 0, color: 'from-red-500 to-blue-500' },
  { id: 'utilidades', nombre: 'Utilidades', saldo: 0, color: 'from-green-500 to-emerald-500' },
  { id: 'fletes', nombre: 'Fletes', saldo: 0, color: 'from-orange-500 to-amber-500' },      // Alias de flete_sur
  { id: 'flete_sur', nombre: 'Flete Sur', saldo: 0, color: 'from-orange-500 to-amber-500' },
  { id: 'azteca', nombre: 'Azteca', saldo: 0, color: 'from-purple-500 to-pink-500' },
  { id: 'leftie', nombre: 'Leftie', saldo: 0, color: 'from-yellow-500 to-orange-500' },
  { id: 'profit', nombre: 'Profit', saldo: 0, color: 'from-indigo-500 to-purple-500' },
]

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentPanel: 'dashboard',
        sidebarCollapsed: false,
        theme: 'dark',
        currentUserId: 'anonymous',
        voiceAgentActive: false,
        voiceAgentStatus: 'idle',
        audioFrequencies: Array(32).fill(0),
        modelRotation: 0,
        activeScene: null,
        totalCapital: 0,
        bancos: BANCOS_INICIALES,
        distribuidores: [],
        clientes: [],
        ordenesCompra: [],
        ventas: [],
        productos: [],

        // 🔄 Flag para refrescar datos
        dataRefreshTrigger: 0,
        triggerDataRefresh: () => set((state) => ({ dataRefreshTrigger: state.dataRefreshTrigger + 1 })),

        // Actions
        setCurrentPanel: (panel) => set({ currentPanel: panel }),
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setTheme: (theme) => set({ theme }),
        setVoiceAgentActive: (active) => set({ voiceAgentActive: active }),
        setVoiceAgentStatus: (status) => set({ voiceAgentStatus: status }),
        setAudioFrequencies: (frequencies) => set({ audioFrequencies: frequencies }),
        setModelRotation: (rotation) => set({ modelRotation: rotation }),
        setActiveScene: (scene) => set({ activeScene: scene }),
        updateBancoSaldo: (id, saldo) =>
          set((state) => ({
            bancos: state.bancos.map((banco) => (banco.id === id ? { ...banco, saldo } : banco)),
            totalCapital: state.bancos.reduce((acc, banco) => (banco.id === id ? acc + saldo : acc + banco.saldo), 0),
          })),
        crearOrdenCompra: (data) => {
          const id = `oc-${Date.now()}`
          const state = get()

          // Buscar o crear distribuidor
          let distribuidor = state.distribuidores.find(
            (d) => d.nombre.toLowerCase() === data.distribuidor.toLowerCase(),
          )

          if (!distribuidor) {
            // Crear nuevo distribuidor automáticamente
            distribuidor = {
              id: `dist-${Date.now()}`,
              nombre: data.distribuidor,
              empresa: data.distribuidor,
              telefono: '',
              email: '',
              deudaTotal: data.deuda,
              totalPagado: data.pagoInicial || 0,
              ordenesActivas: 1,
              ordenesCompra: [id],
              historialPagos: [],
            }
            set({ distribuidores: [...state.distribuidores, distribuidor] })
          } else {
            // Actualizar distribuidor existente
            set({
              distribuidores: state.distribuidores.map((d) =>
                d.id === distribuidor!.id
                  ? { ...d, deudaTotal: d.deudaTotal + data.deuda, ordenesCompra: [...d.ordenesCompra, id] }
                  : d,
              ),
            })
          }

          // Crear la orden
          set({ ordenesCompra: [...state.ordenesCompra, { ...data, id }] })

          // Registrar entrada al almacén
          const productoExistente = state.productos.find((p) => p.nombre.toLowerCase() === data.producto.toLowerCase())

          if (productoExistente) {
            set({
              productos: state.productos.map((p) =>
                p.id === productoExistente.id ? { ...p, stockActual: p.stockActual + data.cantidad } : p,
              ),
            })
          } else {
            set({
              productos: [
                ...state.productos,
                {
                  id: `prod-${Date.now()}`,
                  nombre: data.producto,
                  stockActual: data.cantidad,
                  valorUnitario: data.costoPorUnidad,
                },
              ],
            })
          }

          // Si hubo pago inicial, registrar en banco
          if (data.pagoInicial > 0) {
            const bancoBovedaMonte = state.bancos.find((b) => b.id === 'boveda-monte')
            if (bancoBovedaMonte) {
              get().updateBancoSaldo('boveda-monte', bancoBovedaMonte.saldo - data.pagoInicial)
            }
          }
        },
        crearVenta: (data) => {
          const id = `venta-${Date.now()}`
          const state = get()

          // Buscar o crear cliente
          let cliente = state.clientes.find((c) => c.nombre.toLowerCase() === data.cliente.toLowerCase())

          if (!cliente) {
            cliente = {
              id: `cli-${Date.now()}`,
              nombre: data.cliente,
              telefono: '',
              email: '',
              deudaTotal: data.montoRestante,
              pendiente: data.montoRestante,
              deuda: data.precioTotalVenta,
              abonos: data.montoPagado || 0,
              actual: data.montoRestante,
              totalVentas: data.precioTotalVenta,
              totalPagado: data.montoPagado || 0,
              ventas: [id],
              historialPagos: [],
            }
            set({ clientes: [...state.clientes, cliente] })
          } else {
            set({
              clientes: state.clientes.map((c) =>
                c.id === cliente!.id
                  ? { ...c, deudaTotal: c.deudaTotal + data.montoRestante, ventas: [...c.ventas, id] }
                  : c,
              ),
            })
          }

          // Crear la venta
          set({ ventas: [...state.ventas, { ...data, id, clienteId: cliente.id }] })

          // Descontar del almacén
          set({
            productos: state.productos.map((p) =>
              p.nombre.toLowerCase() === data.producto.toLowerCase()
                ? { ...p, stockActual: p.stockActual - data.cantidad }
                : p,
            ),
          })

          const montoBovedaMonte = data.precioCompraUnidad * data.cantidad
          const montoFletes = data.precioFlete * data.cantidad
          const montoUtilidades = (data.precioVentaUnidad - data.precioCompraUnidad - data.precioFlete) * data.cantidad

          // Si hay pago (completo o parcial), distribuir proporcionalmente
          if (data.montoPagado > 0) {
            const proporcionPagada = data.montoPagado / data.precioTotalVenta

            const bancoBovedaMonte = state.bancos.find((b) => b.id === 'boveda-monte')
            if (bancoBovedaMonte) {
              get().updateBancoSaldo('boveda-monte', bancoBovedaMonte.saldo + montoBovedaMonte * proporcionPagada)
            }

            const bancoFletes = state.bancos.find((b) => b.id === 'fletes')
            if (bancoFletes) {
              get().updateBancoSaldo('fletes', bancoFletes.saldo + montoFletes * proporcionPagada)
            }

            const bancoUtilidades = state.bancos.find((b) => b.id === 'utilidades')
            if (bancoUtilidades) {
              get().updateBancoSaldo('utilidades', bancoUtilidades.saldo + montoUtilidades * proporcionPagada)
            }
          }
          // Si es pago pendiente (montoPagado = 0), los históricos se registran pero capital actual = 0
        },
        abonarDistribuidor: (distribuidorId, monto, bancoDestino) => {
          const state = get()

          set({
            distribuidores: state.distribuidores.map((d) =>
              d.id === distribuidorId
                ? {
                    ...d,
                    deudaTotal: Math.max(0, d.deudaTotal - monto),
                    historialPagos: [...d.historialPagos, { fecha: new Date().toISOString(), monto, bancoDestino }],
                  }
                : d,
            ),
          })

          // Restar del banco de origen
          const banco = state.bancos.find((b) => b.id === bancoDestino)
          if (banco) {
            get().updateBancoSaldo(bancoDestino, banco.saldo - monto)
          }
        },
        abonarCliente: (clienteId, monto) => {
          const state = get()
          const cliente = state.clientes.find((c) => c.id === clienteId)

          if (!cliente) return
          if (monto <= 0) return

          // Actualizar deuda del cliente
          set({
            clientes: state.clientes.map((c) =>
              c.id === clienteId
                ? {
                    ...c,
                    deudaTotal: Math.max(0, c.deudaTotal - monto),
                    historialPagos: [...c.historialPagos, { fecha: new Date().toISOString(), monto }],
                  }
                : c,
            ),
          })

          // FIFO: Obtener ventas pendientes ordenadas por fecha (más antigua primero)
          const ventasPendientes = state.ventas
            .filter((v) => v.clienteId === clienteId && v.montoRestante > 0)
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

          if (ventasPendientes.length === 0) return

          let montoRestanteAbono = monto
          const ventasActualizadas = [...state.ventas]

          // Procesar cada venta en orden FIFO hasta agotar el abono
          for (const venta of ventasPendientes) {
            if (montoRestanteAbono <= 0) break

            const montoAAplicar = Math.min(montoRestanteAbono, venta.montoRestante)
            
            // Calcular montos de distribución por unidad
            const montoBovedaMonte = venta.precioCompraUnidad * venta.cantidad
            const montoFletes = venta.precioFlete * venta.cantidad
            const montoUtilidades =
              (venta.precioVentaUnidad - venta.precioCompraUnidad - venta.precioFlete) * venta.cantidad

            // Calcular proporción del abono aplicado a esta venta
            const proporcionAbono = montoAAplicar / venta.precioTotalVenta

            // Distribuir proporcionalmente a los bancos
            const bancoBovedaMonte = state.bancos.find((b) => b.id === 'boveda-monte')
            const bancoFletes = state.bancos.find((b) => b.id === 'fletes')
            const bancoUtilidades = state.bancos.find((b) => b.id === 'utilidades')

            if (bancoBovedaMonte) {
              get().updateBancoSaldo('boveda-monte', bancoBovedaMonte.saldo + montoBovedaMonte * proporcionAbono)
            }
            if (bancoFletes) {
              get().updateBancoSaldo('fletes', bancoFletes.saldo + montoFletes * proporcionAbono)
            }
            if (bancoUtilidades) {
              get().updateBancoSaldo('utilidades', bancoUtilidades.saldo + montoUtilidades * proporcionAbono)
            }

            // Actualizar la venta en el array
            const ventaIndex = ventasActualizadas.findIndex((v) => v.id === venta.id)
            if (ventaIndex !== -1) {
              const nuevoRestante = venta.montoRestante - montoAAplicar
              ventasActualizadas[ventaIndex] = {
                ...venta,
                montoPagado: venta.montoPagado + montoAAplicar,
                montoRestante: Math.max(0, nuevoRestante),
                estadoPago: nuevoRestante <= 0 ? 'completo' : 'parcial',
              }
            }

            montoRestanteAbono -= montoAAplicar
          }

          // Aplicar todas las actualizaciones de ventas
          set({ ventas: ventasActualizadas })
        },
        crearTransferencia: (origen, destino, monto) => {
          const state = get()
          const bancoOrigen = state.bancos.find((b) => b.id === origen)
          const bancoDestino = state.bancos.find((b) => b.id === destino)

          // Validaciones
          if (!bancoOrigen || !bancoDestino) {
            logger.warn('crearTransferencia: Banco no encontrado', { 
              context: 'AppStore',
              data: { origen, destino },
            })
            return
          }

          if (bancoOrigen.saldo < monto) {
            logger.warn('crearTransferencia: Saldo insuficiente', {
              context: 'AppStore',
              data: { saldo: bancoOrigen.saldo, monto },
            })
            return
          }

          if (monto <= 0) {
            logger.warn('crearTransferencia: Monto inválido', {
              context: 'AppStore',
              data: { monto },
            })
            return
          }

          // Guardar saldos originales para posible rollback
          const saldoOrigenOriginal = bancoOrigen.saldo
          const saldoDestinoOriginal = bancoDestino.saldo

          // Actualizar estado local optimistamente
          get().updateBancoSaldo(origen, bancoOrigen.saldo - monto)
          get().updateBancoSaldo(destino, bancoDestino.saldo + monto)

          // Persistir en Firestore
          firestoreService.crearTransferencia(
            origen,
            destino,
            monto,
            `Transferencia de ${bancoOrigen.nombre} a ${bancoDestino.nombre}`,
          ).then(() => {
            logger.info('Transferencia completada', {
              context: 'AppStore',
              data: { origen, destino, monto },
            })
          }).catch((error) => {
            // Rollback si falla Firestore
            logger.error('Error en transferencia, revirtiendo cambios', error, {
              context: 'AppStore',
            })
            get().updateBancoSaldo(origen, saldoOrigenOriginal)
            get().updateBancoSaldo(destino, saldoDestinoOriginal)
          })
        },
        registrarGasto: (banco, monto, concepto) => {
          const state = get()
          const bancoObj = state.bancos.find((b) => b.id === banco)

          if (bancoObj && bancoObj.saldo >= monto) {
            get().updateBancoSaldo(banco, bancoObj.saldo - monto)
          }
        },
        addEntradaAlmacen: (data) => {
          const state = get()
          const producto = state.productos.find((p) => p.nombre.toLowerCase() === data.productoNombre.toLowerCase())

          if (producto) {
            set({
              productos: state.productos.map((p) =>
                p.nombre.toLowerCase() === data.productoNombre.toLowerCase()
                  ? { ...p, stockActual: p.stockActual + data.cantidad }
                  : p,
              ),
            })
          } else {
            set({
              productos: [
                ...state.productos,
                {
                  id: `prod-${Date.now()}`,
                  nombre: data.productoNombre,
                  stockActual: data.cantidad,
                  valorUnitario: data.costoUnitario,
                },
              ],
            })
          }
        },

        addSalidaAlmacen: (data) => {
          const state = get()
          set({
            productos: state.productos.map((p) =>
              p.id === data.productoId ? { ...p, stockActual: p.stockActual - data.cantidad } : p,
            ),
          })
        },
      }),
      {
        name: 'chronos-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          distribuidores: state.distribuidores,
          clientes: state.clientes,
          ordenesCompra: state.ordenesCompra,
          ventas: state.ventas,
          productos: state.productos,
          bancos: state.bancos,
        }),
      },
    ),
  ),
)
