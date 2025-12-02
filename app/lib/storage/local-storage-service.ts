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
  MOVIMIENTOS: 'chronos_movimientos',
  TRANSFERENCIAS: 'chronos_transferencias',
  ABONOS: 'chronos_abonos',
  INGRESOS: 'chronos_ingresos',
  GASTOS: 'chronos_gastos',
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
// DATOS INICIALES - 7 BANCOS DEL SISTEMA
// ============================================================

const BANCOS_INICIALES: LocalBanco[] = [
  { 
    id: 'boveda_monte', 
    nombre: 'Bóveda Monte', 
    capitalActual: 50000, 
    historicoIngresos: 50000, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'boveda_usa', 
    nombre: 'Bóveda USA', 
    capitalActual: 25000, 
    historicoIngresos: 25000, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'utilidades', 
    nombre: 'Utilidades', 
    capitalActual: 15000, 
    historicoIngresos: 15000, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'flete_sur', 
    nombre: 'Flete Sur', 
    capitalActual: 8000, 
    historicoIngresos: 8000, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'azteca', 
    nombre: 'Azteca', 
    capitalActual: 12000, 
    historicoIngresos: 12000, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'leftie', 
    nombre: 'Leftie', 
    capitalActual: 5000, 
    historicoIngresos: 5000, 
    historicoGastos: 0,
    historicoTransferencias: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'profit', 
    nombre: 'Profit', 
    capitalActual: 20000, 
    historicoIngresos: 20000, 
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
  tipo: 'ingreso' | 'gasto' | 'transferencia'
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
    updatedAt: new Date().toISOString() 
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
  
  // Actualizar almacén si hay producto
  if (data.producto) {
    const prodIndex = productos.findIndex(p => p.nombre.toLowerCase() === data.producto!.toLowerCase())
    if (prodIndex !== -1) {
      productos[prodIndex].stockActual -= cantidad
      productos[prodIndex].totalSalidas = (productos[prodIndex].totalSalidas || 0) + cantidad
      productos[prodIndex].updatedAt = new Date().toISOString()
      saveToStorage(STORAGE_KEYS.PRODUCTOS, productos)
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
    d.id === data.distribuidorId || d.nombre.toLowerCase() === data.distribuidor.toLowerCase()
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
  
  // Actualizar almacén
  if (data.producto) {
    const prodIndex = productos.findIndex(p => p.nombre.toLowerCase() === data.producto!.toLowerCase())
    if (prodIndex !== -1) {
      productos[prodIndex].stockActual += data.cantidad
      productos[prodIndex].totalEntradas = (productos[prodIndex].totalEntradas || 0) + data.cantidad
      productos[prodIndex].updatedAt = new Date().toISOString()
    } else {
      // Crear producto
      const nuevoProducto: LocalProducto = {
        id: generateId('prod'),
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
  
  logger.info('Orden de compra creada localmente', {
    context: 'LocalStorageService',
    data: { ordenId, costoTotal, deuda },
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
  bancoOrigenId: string
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
// EXPORT SERVICIO COMPLETO
// ============================================================

export const localStorageService = {
  // Bancos
  suscribirBancos: localSuscribirBancos,
  obtenerBanco: localObtenerBanco,
  actualizarCapitalBanco: localActualizarCapitalBanco,
  // Clientes
  crearCliente: localCrearCliente,
  actualizarCliente: localActualizarCliente,
  eliminarCliente: localEliminarCliente,
  suscribirClientes: localSuscribirClientes,
  // Ventas
  crearVenta: localCrearVenta,
  suscribirVentas: localSuscribirVentas,
  // Distribuidores
  crearDistribuidor: localCrearDistribuidor,
  suscribirDistribuidores: localSuscribirDistribuidores,
  pagarDistribuidor: localPagarDistribuidor,
  // Órdenes de Compra
  crearOrdenCompra: localCrearOrdenCompra,
  suscribirOrdenesCompra: localSuscribirOrdenesCompra,
  // Almacén
  crearProducto: localCrearProducto,
  suscribirAlmacen: localSuscribirAlmacen,
  // Transferencias
  crearTransferencia: localCrearTransferencia,
  // Abonos
  crearAbono: localCrearAbono,
  // Ingresos y Gastos
  crearIngreso: localCrearIngreso,
  crearGasto: localCrearGasto,
}
