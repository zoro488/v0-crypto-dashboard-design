/**
 * 🗄️ LOCAL STORAGE SERVICE - CHRONOS SYSTEM
 * Servicio de almacenamiento local para cuando Firebase no está disponible
 * 
 * Características:
 * - Persistencia en localStorage
 * - API compatible con Firestore
 * - Listeners para actualizaciones en tiempo real
 * - Tipado estricto TypeScript
 * 
 * @version 1.0.0
 */

import { logger } from '../utils/logger'
import type { BancoId } from '@/app/types'

// ============================================================
// TIPOS LOCALES (flexibles para localStorage)
// ============================================================

interface LocalBanco {
  id: string
  nombre: string
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
  historicoTransferencias?: number
  createdAt: string
  updatedAt: string
}

interface LocalCliente {
  id: string
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  deudaTotal: number
  pendiente: number
  totalVentas: number
  totalPagado: number
  ventas: string[]
  historialPagos: Array<{ fecha: string; monto: number }>
  estado: string
  createdAt: string
  updatedAt: string
}

interface LocalDistribuidor {
  id: string
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  origen?: string
  deudaTotal: number
  totalOrdenesCompra: number
  totalPagado: number
  ordenesCompra: string[]
  historialPagos: Array<{ fecha: string; monto: number; bancoOrigen?: string; ordenCompraId?: string }>
  createdAt: string
  updatedAt: string
}

interface LocalVenta {
  id: string
  clienteId: string
  cliente: string
  producto?: string
  cantidad: number
  precioVenta: number
  precioCompra: number
  ingreso: number
  totalVenta: number
  precioTotalVenta: number
  flete: 'Aplica' | 'NoAplica'
  fleteUtilidad: number
  precioFlete: number
  utilidad: number
  ganancia?: number
  bovedaMonte: number
  distribucion: { bovedaMonte: number; fletes: number; utilidades: number }
  distribucionBancos: { bovedaMonte: number; fletes: number; utilidades: number }
  estatus: 'Pagado' | 'Parcial' | 'Pendiente'
  estadoPago: 'completo' | 'parcial' | 'pendiente'
  montoPagado: number
  montoRestante: number
  adeudo: number
  fecha: string
  concepto?: string
  notas?: string
  createdAt: string
  updatedAt: string
}

interface LocalOrdenCompra {
  id: string
  distribuidorId: string
  distribuidor: string
  producto?: string
  cantidad: number
  costoPorUnidad: number
  costoTotal: number
  costoDistribuidor: number
  costoTransporte: number
  pagoDistribuidor: number
  pagoInicial: number
  deuda: number
  estado: 'pendiente' | 'parcial' | 'pagado' | 'cancelado'
  stockActual: number
  stockInicial: number
  origen?: string
  bancoOrigen?: string
  fecha: string
  notas?: string
  keywords: string[]
  createdAt: string
  updatedAt: string
}

interface LocalProducto {
  id: string
  nombre: string
  categoria?: string
  origen?: string
  unidad?: string
  stockActual: number
  stockMinimo: number
  valorUnitario: number
  totalEntradas: number
  totalSalidas: number
  descripcion?: string
  createdAt: string
  updatedAt: string
}

interface LocalMovimiento {
  id: string
  tipo: 'ingreso' | 'gasto' | 'transferencia' | 'abono'
  monto: number
  bancoId: string
  bancoOrigenId?: string
  bancoDestinoId?: string
  concepto?: string
  ventaId?: string
  ordenCompraId?: string
  createdAt: string
  updatedAt: string
}

// ============================================================
// TIPOS Y CONSTANTES
// ============================================================

const STORAGE_KEYS = {
  BANCOS: 'chronos_bancos',
  ORDENES_COMPRA: 'chronos_ordenes_compra',
  VENTAS: 'chronos_ventas',
  DISTRIBUIDORES: 'chronos_distribuidores',
  CLIENTES: 'chronos_clientes',
  PRODUCTOS: 'chronos_productos',
  ALMACEN: 'chronos_productos', // Alias para productos
  MOVIMIENTOS: 'chronos_movimientos',
  TRANSFERENCIAS: 'chronos_transferencias',
  ABONOS: 'chronos_abonos',
  INGRESOS: 'chronos_ingresos',
  GASTOS: 'chronos_gastos',
  ENTRADAS_ALMACEN: 'chronos_almacen_entradas',
  SALIDAS_ALMACEN: 'chronos_almacen_salidas',
  ALMACEN_ENTRADAS: 'chronos_almacen_entradas', // Alias legacy
  ALMACEN_SALIDAS: 'chronos_almacen_salidas', // Alias legacy
} as const

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

// Listeners para notificar cambios
type Listener<T> = (data: T[]) => void
const listeners: Map<StorageKey, Set<Listener<unknown>>> = new Map()

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getFromStorage<T>(key: StorageKey): T[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    logger.error(`Error reading from localStorage: ${key}`, error, { context: 'LocalStorageService' })
    return []
  }
}

function saveToStorage<T>(key: StorageKey, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
    // Notificar a los listeners
    notifyListeners(key, data)
  } catch (error) {
    logger.error(`Error saving to localStorage: ${key}`, error, { context: 'LocalStorageService' })
  }
}

function notifyListeners<T>(key: StorageKey, data: T[]): void {
  const keyListeners = listeners.get(key)
  if (keyListeners) {
    keyListeners.forEach(listener => {
      try {
        listener(data as unknown[])
      } catch (error) {
        logger.error('Error in listener callback', error, { context: 'LocalStorageService' })
      }
    })
  }
}

function subscribe<T>(key: StorageKey, callback: Listener<T>): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set())
  }
  listeners.get(key)!.add(callback as Listener<unknown>)
  
  // Llamar inmediatamente con datos actuales
  const currentData = getFromStorage<T>(key)
  callback(currentData)
  
  // Retornar función de desuscripción
  return () => {
    listeners.get(key)?.delete(callback as Listener<unknown>)
  }
}

// ============================================================
// DATOS INICIALES - 7 BANCOS DEL SISTEMA (VALORES EN 0)
// ============================================================

const BANCOS_INICIALES: LocalBanco[] = [
  { 
    id: 'boveda_monte', 
    nombre: 'Bóveda Monte', 
    capitalActual: 0, 
    historicoIngresos: 0, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'boveda_usa', 
    nombre: 'Bóveda USA', 
    capitalActual: 0, 
    historicoIngresos: 0, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'utilidades', 
    nombre: 'Utilidades', 
    capitalActual: 0, 
    historicoIngresos: 0, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'flete_sur', 
    nombre: 'Flete Sur', 
    capitalActual: 0, 
    historicoIngresos: 0, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'azteca', 
    nombre: 'Azteca', 
    capitalActual: 0, 
    historicoIngresos: 0, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'leftie', 
    nombre: 'Leftie', 
    capitalActual: 0, 
    historicoIngresos: 0, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'profit', 
    nombre: 'Profit', 
    capitalActual: 0, 
    historicoIngresos: 0, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function initializeBancos(): LocalBanco[] {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  if (bancos.length === 0) {
    saveToStorage(STORAGE_KEYS.BANCOS, BANCOS_INICIALES)
    return BANCOS_INICIALES
  }
  return bancos
}

// ============================================================
// BANCOS
// ============================================================

export const localSuscribirBancos = (callback: (bancos: LocalBanco[]) => void): (() => void) => {
  // Inicializar bancos si no existen
  initializeBancos()
  return subscribe<LocalBanco>(STORAGE_KEYS.BANCOS, callback)
}

export const localObtenerBanco = (bancoId: string): LocalBanco | null => {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  return bancos.find(b => b.id === bancoId) || null
}

export const localActualizarCapitalBanco = (
  bancoId: string,
  monto: number,
  tipo: 'ingreso' | 'gasto' | 'transferencia',
): void => {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  const index = bancos.findIndex(b => b.id === bancoId)
  
  if (index === -1) {
    logger.warn(`Banco ${bancoId} no encontrado`, { context: 'LocalStorageService' })
    return
  }
  
  if (tipo === 'ingreso') {
    bancos[index].capitalActual += monto
    bancos[index].historicoIngresos += monto
  } else if (tipo === 'gasto') {
    bancos[index].capitalActual -= monto
    bancos[index].historicoGastos += monto
  } else if (tipo === 'transferencia') {
    bancos[index].historicoTransferencias = (bancos[index].historicoTransferencias || 0) + monto
  }
  
  bancos[index].updatedAt = new Date().toISOString()
  saveToStorage(STORAGE_KEYS.BANCOS, bancos)
}

// ============================================================
// CLIENTES
// ============================================================

export const localCrearCliente = (data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  deudaTotal?: number
  totalPagado?: number
}): string => {
  const clientes = getFromStorage<LocalCliente>(STORAGE_KEYS.CLIENTES)
  
  // Verificar si ya existe
  const existente = clientes.find(c => c.nombre.toLowerCase() === data.nombre.toLowerCase())
  if (existente) {
    throw new Error(`El cliente "${data.nombre}" ya existe`)
  }
  
  const id = generateId('cli')
  const nuevoCliente: LocalCliente = {
    id,
    nombre: data.nombre,
    empresa: data.empresa || '',
    telefono: data.telefono || '',
    email: data.email || '',
    direccion: data.direccion || '',
    deudaTotal: data.deudaTotal || 0,
    pendiente: data.deudaTotal || 0,
    totalVentas: 0,
    totalPagado: data.totalPagado || 0,
    ventas: [],
    historialPagos: [],
    estado: 'activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  clientes.push(nuevoCliente)
  saveToStorage(STORAGE_KEYS.CLIENTES, clientes)
  
  logger.info('Cliente creado localmente', { data: { id, nombre: data.nombre }, context: 'LocalStorageService' })
  return id
}

export const localActualizarCliente = (clienteId: string, data: Partial<LocalCliente>): string => {
  const clientes = getFromStorage<LocalCliente>(STORAGE_KEYS.CLIENTES)
  const index = clientes.findIndex(c => c.id === clienteId)
  
  if (index === -1) {
    throw new Error('Cliente no encontrado')
  }
  
  clientes[index] = { 
    ...clientes[index], 
    ...data, 
    updatedAt: new Date().toISOString(), 
  }
  saveToStorage(STORAGE_KEYS.CLIENTES, clientes)
  
  logger.info('Cliente actualizado localmente', { data: { id: clienteId }, context: 'LocalStorageService' })
  return clienteId
}

export const localEliminarCliente = (clienteId: string): boolean => {
  const clientes = getFromStorage<LocalCliente>(STORAGE_KEYS.CLIENTES)
  const index = clientes.findIndex(c => c.id === clienteId)
  
  if (index === -1) {
    return false
  }
  
  // Verificar ventas pendientes
  const ventas = getFromStorage<LocalVenta>(STORAGE_KEYS.VENTAS)
  const ventasPendientes = ventas.filter(v => v.clienteId === clienteId && v.estadoPago !== 'completo')
  if (ventasPendientes.length > 0) {
    throw new Error('No se puede eliminar un cliente con ventas pendientes')
  }
  
  clientes.splice(index, 1)
  saveToStorage(STORAGE_KEYS.CLIENTES, clientes)
  
  logger.info('Cliente eliminado localmente', { data: { id: clienteId }, context: 'LocalStorageService' })
  return true
}

export const localSuscribirClientes = (callback: (clientes: LocalCliente[]) => void): (() => void) => {
  return subscribe<LocalCliente>(STORAGE_KEYS.CLIENTES, callback)
}

// ============================================================
// VENTAS - CON LÓGICA GYA
// ============================================================

export const localCrearVenta = (data: {
  cliente: string
  clienteId?: string
  producto?: string
  cantidad: number
  precioVenta?: number
  precioTotalVenta?: number
  precioCompra?: number
  precioFlete?: number
  flete?: 'Aplica' | 'NoAplica'
  montoPagado?: number
  concepto?: string
  notas?: string
  fecha?: string
}): string => {
  const ventas = getFromStorage<LocalVenta>(STORAGE_KEYS.VENTAS)
  const clientes = getFromStorage<LocalCliente>(STORAGE_KEYS.CLIENTES)
  const productos = getFromStorage<LocalProducto>(STORAGE_KEYS.PRODUCTOS)
  
  // Calcular valores
  const cantidad = data.cantidad
  const precioVentaUnitario = data.precioVenta || (data.precioTotalVenta ? data.precioTotalVenta / cantidad : 0)
  const totalVenta = data.precioTotalVenta || (precioVentaUnitario * cantidad)
  const costoUnitario = data.precioCompra || 0
  const montoPagado = data.montoPagado || 0
  const montoRestante = totalVenta - montoPagado
  
  // Distribución GYA
  const montoBovedaMonte = costoUnitario * cantidad
  const fleteAplica = data.flete === 'Aplica' || (data.precioFlete && data.precioFlete > 0)
  const montoFlete = (data.precioFlete || 0) * cantidad
  const montoUtilidad = totalVenta - montoBovedaMonte - montoFlete
  
  // Estado de pago
  let estadoPago: 'completo' | 'parcial' | 'pendiente' = 'pendiente'
  let estatus: 'Pagado' | 'Parcial' | 'Pendiente' = 'Pendiente'
  
  if (montoPagado >= totalVenta) {
    estadoPago = 'completo'
    estatus = 'Pagado'
  } else if (montoPagado > 0) {
    estadoPago = 'parcial'
    estatus = 'Parcial'
  }
  
  // Buscar o crear cliente
  let clienteId = data.clienteId
  let clienteIndex = clientes.findIndex(c => c.id === clienteId || c.nombre.toLowerCase() === data.cliente.toLowerCase())
  
  if (clienteIndex === -1) {
    // Crear cliente automáticamente
    clienteId = generateId('cli')
    const nuevoCliente: LocalCliente = {
      id: clienteId,
      nombre: data.cliente,
      empresa: '',
      telefono: '',
      email: '',
      direccion: '',
      deudaTotal: montoRestante,
      pendiente: montoRestante,
      totalVentas: totalVenta,
      totalPagado: montoPagado,
      ventas: [],
      historialPagos: [],
      estado: 'activo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    clientes.push(nuevoCliente)
    clienteIndex = clientes.length - 1
  } else {
    clienteId = clientes[clienteIndex].id
    clientes[clienteIndex].deudaTotal += montoRestante
    clientes[clienteIndex].pendiente = (clientes[clienteIndex].pendiente || 0) + montoRestante
    clientes[clienteIndex].totalVentas += totalVenta
    clientes[clienteIndex].totalPagado += montoPagado
    clientes[clienteIndex].updatedAt = new Date().toISOString()
  }
  
  // Crear venta
  const ventaId = generateId('venta')
  const nuevaVenta: LocalVenta = {
    id: ventaId,
    clienteId: clienteId!,
    cliente: data.cliente,
    producto: data.producto || '',
    cantidad,
    precioVenta: precioVentaUnitario,
    precioCompra: costoUnitario,
    ingreso: totalVenta,
    totalVenta,
    precioTotalVenta: totalVenta,
    flete: fleteAplica ? 'Aplica' : 'NoAplica',
    fleteUtilidad: montoFlete,
    precioFlete: data.precioFlete || 0,
    utilidad: montoUtilidad,
    ganancia: montoUtilidad,
    bovedaMonte: montoBovedaMonte,
    distribucion: {
      bovedaMonte: montoBovedaMonte,
      fletes: montoFlete,
      utilidades: montoUtilidad,
    },
    distribucionBancos: {
      bovedaMonte: montoBovedaMonte,
      fletes: montoFlete,
      utilidades: montoUtilidad,
    },
    estatus,
    estadoPago,
    montoPagado,
    montoRestante,
    adeudo: montoRestante,
    fecha: data.fecha || new Date().toISOString(),
    concepto: data.concepto || '',
    notas: data.notas || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  // Agregar venta al cliente
  clientes[clienteIndex].ventas.push(ventaId)
  
  ventas.push(nuevaVenta)
  saveToStorage(STORAGE_KEYS.VENTAS, ventas)
  saveToStorage(STORAGE_KEYS.CLIENTES, clientes)
  
  // Actualizar almacén si hay producto Y REGISTRAR SALIDA
  if (data.producto) {
    const prodIndex = productos.findIndex(p => p.nombre.toLowerCase() === data.producto!.toLowerCase())
    if (prodIndex !== -1) {
      const productoId = productos[prodIndex].id
      productos[prodIndex].stockActual -= cantidad
      productos[prodIndex].totalSalidas = (productos[prodIndex].totalSalidas || 0) + cantidad
      productos[prodIndex].updatedAt = new Date().toISOString()
      saveToStorage(STORAGE_KEYS.PRODUCTOS, productos)
      
      // ✅ REGISTRAR SALIDA EN ALMACÉN
      const salidas = getFromStorage<{
        id: string
        productoId: string
        producto: string
        cantidad: number
        destino: string
        ventaId: string
        precioVenta: number
        valorTotal: number
        fecha: string
        tipo: string
        createdAt: string
      }>(STORAGE_KEYS.ALMACEN_SALIDAS)
      
      salidas.push({
        id: generateId('salida'),
        productoId,
        producto: data.producto,
        cantidad,
        destino: data.cliente,
        ventaId,
        precioVenta: precioVentaUnitario,
        valorTotal: totalVenta,
        fecha: data.fecha || new Date().toISOString(),
        tipo: 'salida',
        createdAt: new Date().toISOString(),
      })
      saveToStorage(STORAGE_KEYS.ALMACEN_SALIDAS, salidas)
    }
  }
  
  // Actualizar bancos si hay pago
  if (montoPagado > 0) {
    const proporcion = montoPagado / totalVenta
    const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
    
    // Bóveda Monte
    const monteIndex = bancos.findIndex(b => b.id === 'boveda_monte')
    if (monteIndex !== -1) {
      bancos[monteIndex].capitalActual += montoBovedaMonte * proporcion
      bancos[monteIndex].historicoIngresos += montoBovedaMonte * proporcion
      bancos[monteIndex].updatedAt = new Date().toISOString()
    }
    
    // Flete Sur
    if (montoFlete > 0) {
      const fleteIndex = bancos.findIndex(b => b.id === 'flete_sur')
      if (fleteIndex !== -1) {
        bancos[fleteIndex].capitalActual += montoFlete * proporcion
        bancos[fleteIndex].historicoIngresos += montoFlete * proporcion
        bancos[fleteIndex].updatedAt = new Date().toISOString()
      }
    }
    
    // Utilidades
    const utilIndex = bancos.findIndex(b => b.id === 'utilidades')
    if (utilIndex !== -1) {
      bancos[utilIndex].capitalActual += montoUtilidad * proporcion
      bancos[utilIndex].historicoIngresos += montoUtilidad * proporcion
      bancos[utilIndex].updatedAt = new Date().toISOString()
    }
    
    saveToStorage(STORAGE_KEYS.BANCOS, bancos)
  }
  
  logger.info('Venta creada localmente con distribución GYA', {
    context: 'LocalStorageService',
    data: {
      ventaId,
      totalVenta,
      distribucion: { bovedaMonte: montoBovedaMonte, fletes: montoFlete, utilidades: montoUtilidad },
      estadoPago,
    },
  })
  
  return ventaId
}

export const localSuscribirVentas = (callback: (ventas: LocalVenta[]) => void): (() => void) => {
  return subscribe<LocalVenta>(STORAGE_KEYS.VENTAS, callback)
}

// ============================================================
// DISTRIBUIDORES
// ============================================================

export const localCrearDistribuidor = (data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  origen?: string
}): string => {
  const distribuidores = getFromStorage<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES)
  
  const existente = distribuidores.find(d => d.nombre.toLowerCase() === data.nombre.toLowerCase())
  if (existente) {
    throw new Error(`El distribuidor "${data.nombre}" ya existe`)
  }
  
  const id = generateId('dist')
  const nuevoDistribuidor: LocalDistribuidor = {
    id,
    nombre: data.nombre,
    empresa: data.empresa || '',
    telefono: data.telefono || '',
    email: data.email || '',
    direccion: data.direccion || '',
    origen: data.origen || '',
    deudaTotal: 0,
    totalOrdenesCompra: 0,
    totalPagado: 0,
    ordenesCompra: [],
    historialPagos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  distribuidores.push(nuevoDistribuidor)
  saveToStorage(STORAGE_KEYS.DISTRIBUIDORES, distribuidores)
  
  logger.info('Distribuidor creado localmente', { data: { id, nombre: data.nombre }, context: 'LocalStorageService' })
  return id
}

export const localSuscribirDistribuidores = (callback: (distribuidores: LocalDistribuidor[]) => void): (() => void) => {
  return subscribe<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES, callback)
}

// ============================================================
// ÓRDENES DE COMPRA
// ============================================================

export const localCrearOrdenCompra = (data: {
  distribuidor: string
  distribuidorId?: string
  producto?: string
  cantidad: number
  costoTotal?: number
  costoPorUnidad?: number
  pagoDistribuidor?: number
  bancoOrigen?: string
  fecha?: string
  origen?: string
  notas?: string
}): string => {
  const ordenes = getFromStorage<LocalOrdenCompra>(STORAGE_KEYS.ORDENES_COMPRA)
  const distribuidores = getFromStorage<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES)
  const productos = getFromStorage<LocalProducto>(STORAGE_KEYS.PRODUCTOS)
  
  const costoPorUnidad = data.costoPorUnidad || (data.costoTotal ? data.costoTotal / data.cantidad : 0)
  const costoTotal = data.costoTotal || (costoPorUnidad * data.cantidad)
  const pagoInicial = data.pagoDistribuidor || 0
  const deuda = costoTotal - pagoInicial
  
  // Buscar o crear distribuidor
  let distIndex = distribuidores.findIndex(d => 
    d.id === data.distribuidorId || d.nombre.toLowerCase() === data.distribuidor.toLowerCase(),
  )
  
  if (distIndex === -1) {
    // Crear distribuidor automáticamente
    const distId = generateId('dist')
    const nuevoDistribuidor: LocalDistribuidor = {
      id: distId,
      nombre: data.distribuidor,
      empresa: '',
      telefono: '',
      email: '',
      direccion: '',
      origen: data.origen || '',
      deudaTotal: deuda,
      totalOrdenesCompra: costoTotal,
      totalPagado: pagoInicial,
      ordenesCompra: [],
      historialPagos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    distribuidores.push(nuevoDistribuidor)
    distIndex = distribuidores.length - 1
  } else {
    distribuidores[distIndex].deudaTotal += deuda
    distribuidores[distIndex].totalOrdenesCompra += costoTotal
    distribuidores[distIndex].totalPagado += pagoInicial
    distribuidores[distIndex].updatedAt = new Date().toISOString()
  }
  
  // Crear orden
  const ordenId = generateId('oc')
  const nuevaOrden: LocalOrdenCompra = {
    id: ordenId,
    distribuidorId: distribuidores[distIndex].id,
    distribuidor: data.distribuidor,
    producto: data.producto || '',
    cantidad: data.cantidad,
    costoPorUnidad,
    costoTotal,
    costoDistribuidor: costoPorUnidad,
    costoTransporte: 0, // Por defecto 0
    pagoDistribuidor: pagoInicial,
    pagoInicial,
    deuda,
    estado: deuda === 0 ? 'pagado' : pagoInicial > 0 ? 'parcial' : 'pendiente',
    stockActual: data.cantidad,
    stockInicial: data.cantidad,
    origen: data.origen || '',
    fecha: data.fecha || new Date().toISOString(),
    notas: data.notas || '',
    keywords: [data.distribuidor.toLowerCase(), data.producto?.toLowerCase()].filter(Boolean) as string[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  // Agregar orden al distribuidor
  distribuidores[distIndex].ordenesCompra.push(ordenId)
  
  ordenes.push(nuevaOrden)
  saveToStorage(STORAGE_KEYS.ORDENES_COMPRA, ordenes)
  saveToStorage(STORAGE_KEYS.DISTRIBUIDORES, distribuidores)
  
  // Actualizar almacén y REGISTRAR ENTRADA
  if (data.producto) {
    const prodIndex = productos.findIndex(p => p.nombre.toLowerCase() === data.producto!.toLowerCase())
    let productoId = ''
    
    if (prodIndex !== -1) {
      productoId = productos[prodIndex].id
      productos[prodIndex].stockActual += data.cantidad
      productos[prodIndex].totalEntradas = (productos[prodIndex].totalEntradas || 0) + data.cantidad
      productos[prodIndex].updatedAt = new Date().toISOString()
    } else {
      // Crear producto
      productoId = generateId('prod')
      const nuevoProducto: LocalProducto = {
        id: productoId,
        nombre: data.producto,
        stockActual: data.cantidad,
        stockMinimo: 0,
        valorUnitario: costoPorUnidad,
        totalEntradas: data.cantidad,
        totalSalidas: 0,
        origen: data.origen || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      productos.push(nuevoProducto)
    }
    saveToStorage(STORAGE_KEYS.PRODUCTOS, productos)
    
    // ✅ REGISTRAR ENTRADA EN ALMACÉN
    const entradas = getFromStorage<{
      id: string
      productoId: string
      producto: string
      cantidad: number
      origen: string
      ordenCompraId: string
      costoUnitario: number
      valorTotal: number
      fecha: string
      tipo: string
      createdAt: string
    }>(STORAGE_KEYS.ALMACEN_ENTRADAS)
    
    entradas.push({
      id: generateId('entrada'),
      productoId,
      producto: data.producto,
      cantidad: data.cantidad,
      origen: data.distribuidor,
      ordenCompraId: ordenId,
      costoUnitario: costoPorUnidad,
      valorTotal: costoTotal,
      fecha: data.fecha || new Date().toISOString(),
      tipo: 'entrada',
      createdAt: new Date().toISOString(),
    })
    saveToStorage(STORAGE_KEYS.ALMACEN_ENTRADAS, entradas)
  }
  
  // Actualizar banco si hubo pago
  if (pagoInicial > 0 && data.bancoOrigen) {
    const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
    const bancoIndex = bancos.findIndex(b => b.id === data.bancoOrigen)
    if (bancoIndex !== -1) {
      bancos[bancoIndex].capitalActual -= pagoInicial
      bancos[bancoIndex].historicoGastos += pagoInicial
      bancos[bancoIndex].updatedAt = new Date().toISOString()
      saveToStorage(STORAGE_KEYS.BANCOS, bancos)
    }
  }
  
  logger.info('Orden de compra creada localmente con entrada en almacén', {
    context: 'LocalStorageService',
    data: { ordenId, costoTotal, deuda, producto: data.producto },
  })
  
  return ordenId
}

export const localSuscribirOrdenesCompra = (callback: (ordenes: LocalOrdenCompra[]) => void): (() => void) => {
  return subscribe<LocalOrdenCompra>(STORAGE_KEYS.ORDENES_COMPRA, callback)
}

// ============================================================
// PRODUCTOS / ALMACÉN
// ============================================================

export const localCrearProducto = (data: {
  nombre: string
  categoria?: string
  origen?: string
  unidad?: string
  stockInicial?: number
  valorUnitario?: number
  stockMinimo?: number
  descripcion?: string
}): string => {
  const productos = getFromStorage<LocalProducto>(STORAGE_KEYS.PRODUCTOS)
  
  const existente = productos.find(p => p.nombre.toLowerCase() === data.nombre.toLowerCase())
  if (existente) {
    throw new Error(`El producto "${data.nombre}" ya existe`)
  }
  
  const id = generateId('prod')
  const nuevoProducto: LocalProducto = {
    id,
    nombre: data.nombre,
    categoria: data.categoria || 'General',
    origen: data.origen || '',
    unidad: data.unidad || 'unidades',
    stockActual: data.stockInicial || 0,
    stockMinimo: data.stockMinimo || 0,
    valorUnitario: data.valorUnitario || 0,
    totalEntradas: data.stockInicial || 0,
    totalSalidas: 0,
    descripcion: data.descripcion || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  productos.push(nuevoProducto)
  saveToStorage(STORAGE_KEYS.PRODUCTOS, productos)
  
  logger.info('Producto creado localmente', { data: { id, nombre: data.nombre }, context: 'LocalStorageService' })
  return id
}

export const localSuscribirAlmacen = (callback: (productos: LocalProducto[]) => void): (() => void) => {
  return subscribe<LocalProducto>(STORAGE_KEYS.PRODUCTOS, callback)
}

// ============================================================
// ENTRADAS Y SALIDAS DE ALMACÉN
// ============================================================

interface LocalEntradaAlmacen {
  id: string
  productoId: string
  producto?: string
  cantidad: number
  origen: string
  ordenCompraId?: string
  costoUnitario: number
  valorTotal?: number
  fecha: string
  tipo?: string
  notas?: string
  createdAt: string
  updatedAt?: string
}

interface LocalSalidaAlmacen {
  id: string
  productoId: string
  producto?: string
  cantidad: number
  destino: string
  ventaId?: string
  precioVenta?: number
  valorTotal?: number
  fecha: string
  tipo?: string
  motivo?: string
  notas?: string
  createdAt: string
  updatedAt?: string
}

export const localSuscribirEntradasAlmacen = (callback: (entradas: LocalEntradaAlmacen[]) => void): (() => void) => {
  return subscribe<LocalEntradaAlmacen>(STORAGE_KEYS.ALMACEN_ENTRADAS, callback)
}

export const localSuscribirSalidasAlmacen = (callback: (salidas: LocalSalidaAlmacen[]) => void): (() => void) => {
  return subscribe<LocalSalidaAlmacen>(STORAGE_KEYS.ALMACEN_SALIDAS, callback)
}

// ============================================================
// TRANSFERENCIAS
// ============================================================

export const localCrearTransferencia = (data: {
  bancoOrigenId: string
  bancoDestinoId: string
  monto: number
  concepto: string
  referencia?: string
  notas?: string
}): string => {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  
  const origenIndex = bancos.findIndex(b => b.id === data.bancoOrigenId)
  const destinoIndex = bancos.findIndex(b => b.id === data.bancoDestinoId)
  
  if (origenIndex === -1 || destinoIndex === -1) {
    throw new Error('Banco no encontrado')
  }
  
  if (bancos[origenIndex].capitalActual < data.monto) {
    throw new Error('Saldo insuficiente')
  }
  
  // Actualizar bancos
  bancos[origenIndex].capitalActual -= data.monto
  bancos[origenIndex].historicoTransferencias = (bancos[origenIndex].historicoTransferencias || 0) + data.monto
  bancos[origenIndex].updatedAt = new Date().toISOString()
  
  bancos[destinoIndex].capitalActual += data.monto
  bancos[destinoIndex].historicoIngresos += data.monto
  bancos[destinoIndex].updatedAt = new Date().toISOString()
  
  saveToStorage(STORAGE_KEYS.BANCOS, bancos)
  
  // Guardar transferencia
  const transferencias = getFromStorage<unknown>(STORAGE_KEYS.TRANSFERENCIAS) as Array<{
    id: string
    bancoOrigenId: string
    bancoDestinoId: string
    monto: number
    concepto: string
    referencia: string
    notas: string
    fecha: string
    createdAt: string
  }>
  
  const id = generateId('trans')
  transferencias.push({
    id,
    ...data,
    referencia: data.referencia || '',
    notas: data.notas || '',
    fecha: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
  saveToStorage(STORAGE_KEYS.TRANSFERENCIAS, transferencias)
  
  logger.info('Transferencia creada localmente', {
    context: 'LocalStorageService',
    data: { id, monto: data.monto, origen: data.bancoOrigenId, destino: data.bancoDestinoId },
  })
  
  return id
}

// ============================================================
// ABONOS
// ============================================================

export const localCrearAbono = (data: {
  tipo: 'distribuidor' | 'cliente'
  entidadId: string
  monto: number
  bancoDestino: string
  metodo: 'efectivo' | 'transferencia' | 'cheque'
  referencia?: string
  notas?: string
}): string => {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  
  // Actualizar entidad
  if (data.tipo === 'cliente') {
    const clientes = getFromStorage<LocalCliente>(STORAGE_KEYS.CLIENTES)
    const index = clientes.findIndex(c => c.id === data.entidadId)
    if (index !== -1) {
      clientes[index].deudaTotal = Math.max(0, clientes[index].deudaTotal - data.monto)
      clientes[index].pendiente = Math.max(0, (clientes[index].pendiente || 0) - data.monto)
      clientes[index].totalPagado += data.monto
      clientes[index].historialPagos.push({
        fecha: new Date().toISOString(),
        monto: data.monto,
      })
      clientes[index].updatedAt = new Date().toISOString()
      saveToStorage(STORAGE_KEYS.CLIENTES, clientes)
    }
  } else {
    const distribuidores = getFromStorage<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES)
    const index = distribuidores.findIndex(d => d.id === data.entidadId)
    if (index !== -1) {
      distribuidores[index].deudaTotal = Math.max(0, distribuidores[index].deudaTotal - data.monto)
      distribuidores[index].totalPagado += data.monto
      distribuidores[index].historialPagos.push({
        fecha: new Date().toISOString(),
        monto: data.monto,
        bancoOrigen: data.bancoDestino,
      })
      distribuidores[index].updatedAt = new Date().toISOString()
      saveToStorage(STORAGE_KEYS.DISTRIBUIDORES, distribuidores)
    }
  }
  
  // Actualizar banco destino (ingreso)
  const bancoIndex = bancos.findIndex(b => b.id === data.bancoDestino)
  if (bancoIndex !== -1) {
    bancos[bancoIndex].capitalActual += data.monto
    bancos[bancoIndex].historicoIngresos += data.monto
    bancos[bancoIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.BANCOS, bancos)
  }
  
  // Guardar abono
  const abonos = getFromStorage<unknown>(STORAGE_KEYS.ABONOS) as Array<{
    id: string
    tipo: string
    entidadId: string
    monto: number
    bancoDestino: string
    metodo: string
    referencia: string
    notas: string
    fecha: string
    createdAt: string
  }>
  
  const id = generateId('abono')
  abonos.push({
    id,
    ...data,
    referencia: data.referencia || '',
    notas: data.notas || '',
    fecha: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
  saveToStorage(STORAGE_KEYS.ABONOS, abonos)
  
  logger.info('Abono creado localmente', {
    context: 'LocalStorageService',
    data: { id, monto: data.monto, tipo: data.tipo },
  })
  
  return id
}

// ============================================================
// INGRESOS Y GASTOS
// ============================================================

export const localCrearIngreso = (data: {
  monto: number
  concepto: string
  bancoDestino: string
  categoria?: string
  referencia?: string
  notas?: string
}): string => {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  const bancoIndex = bancos.findIndex(b => b.id === data.bancoDestino)
  
  if (bancoIndex !== -1) {
    bancos[bancoIndex].capitalActual += data.monto
    bancos[bancoIndex].historicoIngresos += data.monto
    bancos[bancoIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.BANCOS, bancos)
  }
  
  const ingresos = getFromStorage<unknown>(STORAGE_KEYS.INGRESOS) as Array<{
    id: string
    monto: number
    concepto: string
    bancoDestino: string
    categoria: string
    referencia: string
    notas: string
    fecha: string
    createdAt: string
  }>
  
  const id = generateId('ingreso')
  ingresos.push({
    id,
    ...data,
    categoria: data.categoria || 'General',
    referencia: data.referencia || '',
    notas: data.notas || '',
    fecha: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
  saveToStorage(STORAGE_KEYS.INGRESOS, ingresos)
  
  logger.info('Ingreso creado localmente', {
    context: 'LocalStorageService',
    data: { id, monto: data.monto },
  })
  
  return id
}

export const localCrearGasto = (data: {
  monto: number
  concepto: string
  bancoOrigen: string
  categoria?: string
  referencia?: string
  notas?: string
}): string => {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  const bancoIndex = bancos.findIndex(b => b.id === data.bancoOrigen)
  
  if (bancoIndex !== -1) {
    if (bancos[bancoIndex].capitalActual < data.monto) {
      throw new Error('Saldo insuficiente')
    }
    bancos[bancoIndex].capitalActual -= data.monto
    bancos[bancoIndex].historicoGastos += data.monto
    bancos[bancoIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.BANCOS, bancos)
  }
  
  const gastos = getFromStorage<unknown>(STORAGE_KEYS.GASTOS) as Array<{
    id: string
    monto: number
    concepto: string
    bancoOrigen: string
    categoria: string
    referencia: string
    notas: string
    fecha: string
    createdAt: string
  }>
  
  const id = generateId('gasto')
  gastos.push({
    id,
    ...data,
    categoria: data.categoria || 'General',
    referencia: data.referencia || '',
    notas: data.notas || '',
    fecha: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
  saveToStorage(STORAGE_KEYS.GASTOS, gastos)
  
  logger.info('Gasto creado localmente', {
    context: 'LocalStorageService',
    data: { id, monto: data.monto },
  })
  
  return id
}

// ============================================================
// PAGAR DISTRIBUIDOR
// ============================================================

export const localPagarDistribuidor = (
  distribuidorId: string,
  ordenCompraId: string,
  monto: number,
  bancoOrigenId: string,
): void => {
  const distribuidores = getFromStorage<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES)
  const ordenes = getFromStorage<LocalOrdenCompra>(STORAGE_KEYS.ORDENES_COMPRA)
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  
  // Actualizar orden de compra
  const ocIndex = ordenes.findIndex(o => o.id === ordenCompraId)
  if (ocIndex !== -1) {
    ordenes[ocIndex].deuda = Math.max(0, ordenes[ocIndex].deuda - monto)
    ordenes[ocIndex].pagoDistribuidor += monto
    ordenes[ocIndex].estado = ordenes[ocIndex].deuda === 0 ? 'pagado' : 'parcial'
    ordenes[ocIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.ORDENES_COMPRA, ordenes)
  }
  
  // Actualizar distribuidor
  const distIndex = distribuidores.findIndex(d => d.id === distribuidorId)
  if (distIndex !== -1) {
    distribuidores[distIndex].deudaTotal = Math.max(0, distribuidores[distIndex].deudaTotal - monto)
    distribuidores[distIndex].totalPagado += monto
    distribuidores[distIndex].historialPagos.push({
      fecha: new Date().toISOString(),
      monto,
      bancoOrigen: bancoOrigenId,
      ordenCompraId,
    })
    distribuidores[distIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.DISTRIBUIDORES, distribuidores)
  }
  
  // Actualizar banco
  const bancoIndex = bancos.findIndex(b => b.id === bancoOrigenId)
  if (bancoIndex !== -1) {
    bancos[bancoIndex].capitalActual -= monto
    bancos[bancoIndex].historicoGastos += monto
    bancos[bancoIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.BANCOS, bancos)
  }
  
  logger.info('Pago a distribuidor registrado localmente', {
    context: 'LocalStorageService',
    data: { distribuidorId, monto },
  })
}

// ============================================================
// FUNCIONES ADICIONALES DE ACTUALIZAR/ELIMINAR
// ============================================================

export const localActualizarVenta = (ventaId: string, data: Partial<LocalVenta>): string => {
  const ventas = getFromStorage<LocalVenta>(STORAGE_KEYS.VENTAS)
  const index = ventas.findIndex(v => v.id === ventaId)
  if (index === -1) {
    throw new Error(`Venta ${ventaId} no encontrada`)
  }
  ventas[index] = {
    ...ventas[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  saveToStorage(STORAGE_KEYS.VENTAS, ventas)
  logger.info('Venta actualizada localmente', { context: 'LocalStorageService', data: { ventaId } })
  return ventaId
}

export const localEliminarVenta = (ventaId: string): boolean => {
  const ventas = getFromStorage<LocalVenta>(STORAGE_KEYS.VENTAS)
  const index = ventas.findIndex(v => v.id === ventaId)
  if (index === -1) return false
  ventas.splice(index, 1)
  saveToStorage(STORAGE_KEYS.VENTAS, ventas)
  logger.info('Venta eliminada localmente', { context: 'LocalStorageService', data: { ventaId } })
  return true
}

export const localActualizarDistribuidor = (distribuidorId: string, data: Partial<LocalDistribuidor>): string => {
  const distribuidores = getFromStorage<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES)
  const index = distribuidores.findIndex(d => d.id === distribuidorId)
  if (index === -1) {
    throw new Error(`Distribuidor ${distribuidorId} no encontrado`)
  }
  distribuidores[index] = {
    ...distribuidores[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  saveToStorage(STORAGE_KEYS.DISTRIBUIDORES, distribuidores)
  logger.info('Distribuidor actualizado localmente', { context: 'LocalStorageService', data: { distribuidorId } })
  return distribuidorId
}

export const localEliminarDistribuidor = (distribuidorId: string): boolean => {
  const distribuidores = getFromStorage<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES)
  const index = distribuidores.findIndex(d => d.id === distribuidorId)
  if (index === -1) return false
  distribuidores.splice(index, 1)
  saveToStorage(STORAGE_KEYS.DISTRIBUIDORES, distribuidores)
  logger.info('Distribuidor eliminado localmente', { context: 'LocalStorageService', data: { distribuidorId } })
  return true
}

export const localActualizarOrdenCompra = (ordenId: string, data: Partial<LocalOrdenCompra>): string => {
  const ordenes = getFromStorage<LocalOrdenCompra>(STORAGE_KEYS.ORDENES_COMPRA)
  const index = ordenes.findIndex(o => o.id === ordenId)
  if (index === -1) {
    throw new Error(`Orden de compra ${ordenId} no encontrada`)
  }
  ordenes[index] = {
    ...ordenes[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  saveToStorage(STORAGE_KEYS.ORDENES_COMPRA, ordenes)
  logger.info('Orden de compra actualizada localmente', { context: 'LocalStorageService', data: { ordenId } })
  return ordenId
}

export const localEliminarOrdenCompra = (ordenId: string): boolean => {
  const ordenes = getFromStorage<LocalOrdenCompra>(STORAGE_KEYS.ORDENES_COMPRA)
  const index = ordenes.findIndex(o => o.id === ordenId)
  if (index === -1) return false
  ordenes.splice(index, 1)
  saveToStorage(STORAGE_KEYS.ORDENES_COMPRA, ordenes)
  logger.info('Orden de compra eliminada localmente', { context: 'LocalStorageService', data: { ordenId } })
  return true
}

export const localActualizarProducto = (productoId: string, data: Partial<LocalProducto>): string => {
  const productos = getFromStorage<LocalProducto>(STORAGE_KEYS.ALMACEN)
  const index = productos.findIndex(p => p.id === productoId)
  if (index === -1) {
    throw new Error(`Producto ${productoId} no encontrado`)
  }
  productos[index] = {
    ...productos[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  saveToStorage(STORAGE_KEYS.ALMACEN, productos)
  logger.info('Producto actualizado localmente', { context: 'LocalStorageService', data: { productoId } })
  return productoId
}

export const localEliminarProducto = (productoId: string): boolean => {
  const productos = getFromStorage<LocalProducto>(STORAGE_KEYS.ALMACEN)
  const index = productos.findIndex(p => p.id === productoId)
  if (index === -1) return false
  productos.splice(index, 1)
  saveToStorage(STORAGE_KEYS.ALMACEN, productos)
  logger.info('Producto eliminado localmente', { context: 'LocalStorageService', data: { productoId } })
  return true
}

export const localCobrarCliente = (clienteId: string, ventaId: string, monto: number): void => {
  localCrearAbono({
    tipo: 'cliente',
    entidadId: clienteId,
    monto,
    bancoDestino: 'boveda_monte',
    metodo: 'efectivo',
  })
  logger.info('Cobro a cliente registrado localmente', {
    context: 'LocalStorageService',
    data: { clienteId, ventaId, monto },
  })
}

export const localCrearEntradaAlmacen = (data: {
  productoId: string
  cantidad: number
  origen: string
  costoUnitario?: number
  ordenCompraId?: string
  notas?: string
}): string => {
  const entradas = getFromStorage<LocalEntradaAlmacen>(STORAGE_KEYS.ENTRADAS_ALMACEN)
  const id = generateId('ent')
  const nuevaEntrada: LocalEntradaAlmacen = {
    id,
    productoId: data.productoId,
    cantidad: data.cantidad,
    origen: data.origen,
    costoUnitario: data.costoUnitario ?? 0,
    ordenCompraId: data.ordenCompraId,
    notas: data.notas ?? '',
    fecha: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  entradas.push(nuevaEntrada)
  saveToStorage(STORAGE_KEYS.ENTRADAS_ALMACEN, entradas)
  
  // Actualizar stock del producto
  const productos = getFromStorage<LocalProducto>(STORAGE_KEYS.ALMACEN)
  const prodIndex = productos.findIndex(p => p.id === data.productoId)
  if (prodIndex !== -1) {
    productos[prodIndex].stockActual += data.cantidad
    productos[prodIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.ALMACEN, productos)
  }
  
  logger.info('Entrada de almacén creada localmente', { context: 'LocalStorageService', data: { id } })
  return id
}

export const localCrearSalidaAlmacen = (data: {
  productoId: string
  cantidad: number
  destino: string
  ventaId?: string
  motivo?: string
  notas?: string
}): string => {
  const salidas = getFromStorage<LocalSalidaAlmacen>(STORAGE_KEYS.SALIDAS_ALMACEN)
  const id = generateId('sal')
  const nuevaSalida: LocalSalidaAlmacen = {
    id,
    productoId: data.productoId,
    cantidad: data.cantidad,
    destino: data.destino,
    ventaId: data.ventaId,
    motivo: data.motivo ?? 'venta',
    notas: data.notas ?? '',
    fecha: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  salidas.push(nuevaSalida)
  saveToStorage(STORAGE_KEYS.SALIDAS_ALMACEN, salidas)
  
  // Actualizar stock del producto
  const productos = getFromStorage<LocalProducto>(STORAGE_KEYS.ALMACEN)
  const prodIndex = productos.findIndex(p => p.id === data.productoId)
  if (prodIndex !== -1) {
    productos[prodIndex].stockActual = Math.max(0, productos[prodIndex].stockActual - data.cantidad)
    productos[prodIndex].updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.ALMACEN, productos)
  }
  
  logger.info('Salida de almacén creada localmente', { context: 'LocalStorageService', data: { id } })
  return id
}

// ============================================================
// FUNCIONES DE OBTENCIÓN (Getters)
// ============================================================

export const localObtenerVentas = (): LocalVenta[] => {
  return getFromStorage<LocalVenta>(STORAGE_KEYS.VENTAS)
}

export const localObtenerClientes = (): LocalCliente[] => {
  return getFromStorage<LocalCliente>(STORAGE_KEYS.CLIENTES)
}

export const localObtenerDistribuidores = (): LocalDistribuidor[] => {
  return getFromStorage<LocalDistribuidor>(STORAGE_KEYS.DISTRIBUIDORES)
}

export const localObtenerOrdenesCompra = (): LocalOrdenCompra[] => {
  return getFromStorage<LocalOrdenCompra>(STORAGE_KEYS.ORDENES_COMPRA)
}

export const localObtenerProductos = (): LocalProducto[] => {
  return getFromStorage<LocalProducto>(STORAGE_KEYS.ALMACEN)
}

export const localObtenerMovimientos = (): LocalMovimiento[] => {
  return getFromStorage<LocalMovimiento>(STORAGE_KEYS.MOVIMIENTOS)
}

export const localObtenerBancos = (): LocalBanco[] => {
  const bancos = getFromStorage<LocalBanco>(STORAGE_KEYS.BANCOS)
  if (bancos.length === 0) {
    saveToStorage(STORAGE_KEYS.BANCOS, BANCOS_INICIALES)
    return BANCOS_INICIALES
  }
  return bancos
}

export const localObtenerEntradasAlmacen = (): LocalEntradaAlmacen[] => {
  return getFromStorage<LocalEntradaAlmacen>(STORAGE_KEYS.ENTRADAS_ALMACEN)
}

export const localObtenerSalidasAlmacen = (): LocalSalidaAlmacen[] => {
  return getFromStorage<LocalSalidaAlmacen>(STORAGE_KEYS.SALIDAS_ALMACEN)
}

export const localSuscribirMovimientos = (callback: (movimientos: LocalMovimiento[]) => void): (() => void) => {
  return subscribe<LocalMovimiento>(STORAGE_KEYS.MOVIMIENTOS, callback)
}

export const localCrearMovimiento = (data: {
  tipo: 'ingreso' | 'gasto' | 'transferencia' | 'abono'
  monto: number
  bancoId?: string
  bancoOrigenId?: string
  bancoDestinoId?: string
  concepto?: string
  ventaId?: string
  ordenCompraId?: string
}): string => {
  const id = 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(7)
  const nuevoMovimiento: LocalMovimiento = {
    id,
    tipo: data.tipo,
    monto: data.monto,
    bancoId: data.bancoId || '',
    bancoOrigenId: data.bancoOrigenId,
    bancoDestinoId: data.bancoDestinoId,
    concepto: data.concepto || `Movimiento ${data.tipo}`,
    ventaId: data.ventaId,
    ordenCompraId: data.ordenCompraId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  const movimientos = getFromStorage<LocalMovimiento>(STORAGE_KEYS.MOVIMIENTOS)
  movimientos.push(nuevoMovimiento)
  saveToStorage(STORAGE_KEYS.MOVIMIENTOS, movimientos)
  
  logger.info('Movimiento creado localmente', { context: 'LocalStorageService', data: { id } })
  return id
}

export const localObtenerSiguienteIdOrdenCompra = (): string => {
  const ordenes = getFromStorage<LocalOrdenCompra>(STORAGE_KEYS.ORDENES_COMPRA)
  const maxId = ordenes.reduce((max, orden) => {
    const num = parseInt(orden.id.replace(/\D/g, '')) || 0
    return Math.max(max, num)
  }, 0)
  return `OC${String(maxId + 1).padStart(4, '0')}`
}

// ============================================================
// EXPORT SERVICIO COMPLETO
// ============================================================

export const localStorageService = {
  // Bancos
  suscribirBancos: localSuscribirBancos,
  obtenerBanco: localObtenerBanco,
  obtenerBancos: localObtenerBancos,
  actualizarCapitalBanco: localActualizarCapitalBanco,
  // Clientes
  crearCliente: localCrearCliente,
  actualizarCliente: localActualizarCliente,
  eliminarCliente: localEliminarCliente,
  suscribirClientes: localSuscribirClientes,
  obtenerClientes: localObtenerClientes,
  cobrarCliente: localCobrarCliente,
  // Ventas
  crearVenta: localCrearVenta,
  actualizarVenta: localActualizarVenta,
  eliminarVenta: localEliminarVenta,
  suscribirVentas: localSuscribirVentas,
  obtenerVentas: localObtenerVentas,
  // Distribuidores
  crearDistribuidor: localCrearDistribuidor,
  actualizarDistribuidor: localActualizarDistribuidor,
  eliminarDistribuidor: localEliminarDistribuidor,
  suscribirDistribuidores: localSuscribirDistribuidores,
  obtenerDistribuidores: localObtenerDistribuidores,
  pagarDistribuidor: localPagarDistribuidor,
  // Órdenes de Compra
  crearOrdenCompra: localCrearOrdenCompra,
  actualizarOrdenCompra: localActualizarOrdenCompra,
  eliminarOrdenCompra: localEliminarOrdenCompra,
  suscribirOrdenesCompra: localSuscribirOrdenesCompra,
  obtenerOrdenesCompra: localObtenerOrdenesCompra,
  obtenerSiguienteIdOrdenCompra: localObtenerSiguienteIdOrdenCompra,
  // Almacén
  crearProducto: localCrearProducto,
  actualizarProducto: localActualizarProducto,
  eliminarProducto: localEliminarProducto,
  suscribirAlmacen: localSuscribirAlmacen,
  obtenerProductos: localObtenerProductos,
  suscribirEntradasAlmacen: localSuscribirEntradasAlmacen,
  suscribirSalidasAlmacen: localSuscribirSalidasAlmacen,
  crearEntradaAlmacen: localCrearEntradaAlmacen,
  crearSalidaAlmacen: localCrearSalidaAlmacen,
  obtenerEntradasAlmacen: localObtenerEntradasAlmacen,
  obtenerSalidasAlmacen: localObtenerSalidasAlmacen,
  // Movimientos
  crearMovimiento: localCrearMovimiento,
  suscribirMovimientos: localSuscribirMovimientos,
  obtenerMovimientos: localObtenerMovimientos,
  // Transferencias
  crearTransferencia: localCrearTransferencia,
  // Abonos
  crearAbono: localCrearAbono,
  // Ingresos y Gastos
  crearIngreso: localCrearIngreso,
  crearGasto: localCrearGasto,
}
