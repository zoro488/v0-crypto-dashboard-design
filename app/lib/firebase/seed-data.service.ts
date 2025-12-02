/**
 * 🌱 SERVICIO DE DATOS SEMILLA - CHRONOS SYSTEM
 * 
 * Este servicio inicializa Firestore con datos reales del negocio.
 * Los datos están basados en los CSVs del Excel original.
 * 
 * @version 2.0.0
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  Timestamp,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config'
import { logger } from '../utils/logger'

// ============================================================
// DATOS SEMILLA - BASADOS EN EXCEL ORIGINAL
// ============================================================

export const SEED_BANCOS = [
  {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    tipo: 'boveda',
    color: 'from-blue-500 to-cyan-500',
    icon: 'building',
    descripcion: 'Capital principal de operaciones',
    moneda: 'MXN',
    capitalActual: 2450000,
    capitalInicial: 2000000,
    historicoIngresos: 5000000,
    historicoGastos: 2550000,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    tipo: 'boveda',
    color: 'from-red-500 to-blue-500',
    icon: 'flag',
    descripcion: 'Capital en dólares',
    moneda: 'USD',
    capitalActual: 128005,
    capitalInicial: 100000,
    historicoIngresos: 200000,
    historicoGastos: 71995,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'utilidades',
    nombre: 'Utilidades',
    tipo: 'utilidades',
    color: 'from-green-500 to-emerald-500',
    icon: 'diamond',
    descripcion: 'Ganancias netas del negocio',
    moneda: 'MXN',
    capitalActual: 102658,
    capitalInicial: 0,
    historicoIngresos: 150000,
    historicoGastos: 47342,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'flete_sur',
    nombre: 'Flete Sur',
    tipo: 'gastos',
    color: 'from-orange-500 to-amber-500',
    icon: 'truck',
    descripcion: 'Capital para gastos de transporte',
    moneda: 'MXN',
    capitalActual: 185792,
    capitalInicial: 200000,
    historicoIngresos: 250000,
    historicoGastos: 64208,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'azteca',
    nombre: 'Azteca',
    tipo: 'operativo',
    color: 'from-purple-500 to-pink-500',
    icon: 'store',
    descripcion: 'Cuenta bancaria externa Azteca',
    moneda: 'MXN',
    capitalActual: -178715,
    capitalInicial: 50000,
    historicoIngresos: 50000,
    historicoGastos: 228715,
    historicoTransferencias: 0,
    estado: 'negativo',
  },
  {
    id: 'leftie',
    nombre: 'Leftie',
    tipo: 'operativo',
    color: 'from-yellow-500 to-orange-500',
    icon: 'briefcase',
    descripcion: 'Capital de negocio secundario',
    moneda: 'MXN',
    capitalActual: 45844,
    capitalInicial: 50000,
    historicoIngresos: 80000,
    historicoGastos: 34156,
    historicoTransferencias: 0,
    estado: 'activo',
  },
  {
    id: 'profit',
    nombre: 'Profit',
    tipo: 'inversiones',
    color: 'from-teal-500 to-cyan-500',
    icon: 'trending-up',
    descripcion: 'Capital de inversiones y rendimientos',
    moneda: 'MXN',
    capitalActual: 350000,
    capitalInicial: 300000,
    historicoIngresos: 400000,
    historicoGastos: 50000,
    historicoTransferencias: 0,
    estado: 'activo',
  },
]

export const SEED_DISTRIBUIDORES = [
  {
    id: 'dist_pacman',
    nombre: 'PACMAN',
    empresa: 'PACMAN Distribuciones',
    telefono: '555-0001',
    email: 'pacman@dist.com',
    direccion: 'Col. Centro, CDMX',
    origen: 'CDMX',
    precioCompra: 6100,
    precioFlete: 200,
    activo: true,
    deudaTotal: 3068100,
    totalOrdenesCompra: 3068100,
    totalPagado: 0,
    ordenesCompra: ['OC0004'],
    historialPagos: [],
  },
  {
    id: 'dist_qmaya',
    nombre: 'Q-MAYA',
    empresa: 'Q-MAYA Trading',
    telefono: '555-0002',
    email: 'qmaya@dist.com',
    direccion: 'Cancún, QR',
    origen: 'Quintana Roo',
    precioCompra: 6100,
    precioFlete: 200,
    activo: true,
    deudaTotal: 2866500,
    totalOrdenesCompra: 2866500,
    totalPagado: 0,
    ordenesCompra: ['OC0001', 'OC0002'],
    historialPagos: [],
  },
  {
    id: 'dist_ax',
    nombre: 'A/X🌶️🦀',
    empresa: 'AX Importaciones',
    telefono: '555-0003',
    email: 'ax@dist.com',
    direccion: 'Monterrey, NL',
    origen: 'Nuevo León',
    precioCompra: 6100,
    precioFlete: 200,
    activo: true,
    deudaTotal: 207900,
    totalOrdenesCompra: 207900,
    totalPagado: 0,
    ordenesCompra: ['OC0003'],
    historialPagos: [],
  },
  {
    id: 'dist_chmonte',
    nombre: 'CH-MONTE',
    empresa: 'CH Monte Distribuidora',
    telefono: '555-0004',
    email: 'chmonte@dist.com',
    direccion: 'Guadalajara, JAL',
    origen: 'Jalisco',
    precioCompra: 6100,
    precioFlete: 200,
    activo: true,
    deudaTotal: 0,
    totalOrdenesCompra: 0,
    totalPagado: 0,
    ordenesCompra: [],
    historialPagos: [],
  },
  {
    id: 'dist_vallemonte',
    nombre: 'VALLE-MONTE',
    empresa: 'Valle Monte SA de CV',
    telefono: '555-0005',
    email: 'vallemonte@dist.com',
    direccion: 'Puebla, PUE',
    origen: 'Puebla',
    precioCompra: 6100,
    precioFlete: 200,
    activo: true,
    deudaTotal: 0,
    totalOrdenesCompra: 0,
    totalPagado: 0,
    ordenesCompra: [],
    historialPagos: [],
  },
]

export const SEED_CLIENTES = [
  {
    id: 'cli_bodega_mp',
    nombre: 'Bódega M-P',
    empresa: 'Bódega M-P SA',
    telefono: '555-1001',
    email: 'bodega.mp@correo.com',
    direccion: 'Col. Roma, CDMX',
    deudaTotal: 945000,
    pendiente: 945000,
    totalVentas: 945000,
    totalPagado: 0,
    ventas: ['venta_001'],
    historialPagos: [],
    estado: 'activo',
  },
  {
    id: 'cli_valle',
    nombre: 'Valle',
    empresa: 'Distribuidora Valle',
    telefono: '555-1002',
    email: 'valle@correo.com',
    direccion: 'Coyoacán, CDMX',
    deudaTotal: 378000,
    pendiente: 378000,
    totalVentas: 408000,
    totalPagado: 30000,
    ventas: ['venta_002'],
    historialPagos: [],
    estado: 'activo',
  },
  {
    id: 'cli_ax',
    nombre: 'Ax',
    empresa: 'Comercializadora Ax',
    telefono: '555-1003',
    email: 'ax@correo.com',
    direccion: 'Naucalpan, EDO MEX',
    deudaTotal: 0,
    pendiente: 0,
    totalVentas: 350000,
    totalPagado: 350000,
    ventas: ['venta_003'],
    historialPagos: [],
    estado: 'activo',
  },
  {
    id: 'cli_negrito',
    nombre: 'Negrito',
    empresa: 'Negrito Comercial',
    telefono: '555-1004',
    email: 'negrito@correo.com',
    direccion: 'Tlalpan, CDMX',
    deudaTotal: 0,
    pendiente: 0,
    totalVentas: 175000,
    totalPagado: 175000,
    ventas: [],
    historialPagos: [],
    estado: 'activo',
  },
  {
    id: 'cli_primo',
    nombre: 'Primo',
    empresa: 'Primo Distribuciones',
    telefono: '555-1005',
    email: 'primo@correo.com',
    direccion: 'Iztapalapa, CDMX',
    deudaTotal: 0,
    pendiente: 0,
    totalVentas: 0,
    totalPagado: 0,
    ventas: [],
    historialPagos: [],
    estado: 'activo',
  },
  {
    id: 'cli_tavo',
    nombre: 'Tavo',
    empresa: 'Tavo y Asociados',
    telefono: '555-1006',
    email: 'tavo@correo.com',
    direccion: 'Xochimilco, CDMX',
    deudaTotal: 0,
    pendiente: 0,
    totalVentas: 0,
    totalPagado: 0,
    ventas: [],
    historialPagos: [],
    estado: 'activo',
  },
  {
    id: 'cli_robalo',
    nombre: 'Robalo',
    empresa: 'Robalo Trading',
    telefono: '555-1007',
    email: 'robalo@correo.com',
    direccion: 'Azcapotzalco, CDMX',
    deudaTotal: 234000,
    pendiente: 234000,
    totalVentas: 660000,
    totalPagado: 426000,
    ventas: [],
    historialPagos: [],
    estado: 'activo',
  },
  {
    id: 'cli_chino',
    nombre: 'El Chino',
    empresa: 'Importadora El Chino',
    telefono: '555-1008',
    email: 'chino@correo.com',
    direccion: 'La Merced, CDMX',
    deudaTotal: 150000,
    pendiente: 150000,
    totalVentas: 500000,
    totalPagado: 350000,
    ventas: [],
    historialPagos: [],
    estado: 'activo',
  },
]

export const SEED_ORDENES_COMPRA = [
  {
    id: 'OC0001',
    fecha: Timestamp.fromDate(new Date('2025-08-25')),
    distribuidorId: 'dist_qmaya',
    distribuidor: 'Q-MAYA',
    origen: 'Quintana Roo',
    producto: 'iPhone 15 Pro Max',
    cantidad: 423,
    costoDistribuidor: 6100,
    costoTransporte: 200,
    costoPorUnidad: 6300,
    costoTotal: 2664900,
    pagoDistribuidor: 0,
    pagoInicial: 0,
    deuda: 2664900,
    estado: 'pendiente',
    stockActual: 163,
    stockInicial: 423,
    bancoOrigen: 'boveda_monte',
    keywords: ['qmaya', 'iphone', 'quintana roo'],
  },
  {
    id: 'OC0002',
    fecha: Timestamp.fromDate(new Date('2025-08-25')),
    distribuidorId: 'dist_qmaya',
    distribuidor: 'Q-MAYA',
    origen: 'Quintana Roo',
    producto: 'Samsung Galaxy S24 Ultra',
    cantidad: 32,
    costoDistribuidor: 6100,
    costoTransporte: 200,
    costoPorUnidad: 6300,
    costoTotal: 201600,
    pagoDistribuidor: 0,
    pagoInicial: 0,
    deuda: 201600,
    estado: 'pendiente',
    stockActual: 32,
    stockInicial: 32,
    bancoOrigen: 'boveda_monte',
    keywords: ['qmaya', 'samsung', 'quintana roo'],
  },
  {
    id: 'OC0003',
    fecha: Timestamp.fromDate(new Date('2025-08-25')),
    distribuidorId: 'dist_ax',
    distribuidor: 'A/X🌶️🦀',
    origen: 'Nuevo León',
    producto: 'MacBook Pro M3',
    cantidad: 33,
    costoDistribuidor: 6100,
    costoTransporte: 200,
    costoPorUnidad: 6300,
    costoTotal: 207900,
    pagoDistribuidor: 0,
    pagoInicial: 0,
    deuda: 207900,
    estado: 'pendiente',
    stockActual: 33,
    stockInicial: 33,
    bancoOrigen: 'boveda_monte',
    keywords: ['ax', 'macbook', 'nuevo leon'],
  },
  {
    id: 'OC0004',
    fecha: Timestamp.fromDate(new Date('2025-08-30')),
    distribuidorId: 'dist_pacman',
    distribuidor: 'PACMAN',
    origen: 'CDMX',
    producto: 'iPhone 15 Pro',
    cantidad: 487,
    costoDistribuidor: 6100,
    costoTransporte: 200,
    costoPorUnidad: 6300,
    costoTotal: 3068100,
    pagoDistribuidor: 0,
    pagoInicial: 0,
    deuda: 3068100,
    estado: 'pendiente',
    stockActual: 487,
    stockInicial: 487,
    bancoOrigen: 'boveda_monte',
    keywords: ['pacman', 'iphone', 'cdmx'],
  },
  {
    id: 'OC0005',
    fecha: Timestamp.fromDate(new Date('2025-09-01')),
    distribuidorId: 'dist_chmonte',
    distribuidor: 'CH-MONTE',
    origen: 'Jalisco',
    producto: 'iPad Pro 12.9',
    cantidad: 50,
    costoDistribuidor: 5800,
    costoTransporte: 150,
    costoPorUnidad: 5950,
    costoTotal: 297500,
    pagoDistribuidor: 297500,
    pagoInicial: 297500,
    deuda: 0,
    estado: 'pagado',
    stockActual: 50,
    stockInicial: 50,
    bancoOrigen: 'boveda_monte',
    keywords: ['chmonte', 'ipad', 'jalisco'],
  },
]

export const SEED_VENTAS = [
  {
    id: 'venta_001',
    fecha: Timestamp.fromDate(new Date('2025-08-23')),
    clienteId: 'cli_bodega_mp',
    cliente: 'Bódega M-P',
    ocRelacionada: 'OC0001',
    producto: 'iPhone 15 Pro Max',
    cantidad: 150,
    precioVenta: 6300,
    precioCompra: 6100,
    precioFlete: 500,
    precioTotalVenta: 945000,
    ingreso: 945000,
    totalVenta: 945000,
    montoPagado: 0,
    montoRestante: 945000,
    adeudo: 945000,
    estadoPago: 'pendiente',
    estatus: 'Pendiente',
    flete: 'Aplica',
    fleteUtilidad: 75000,
    distribucion: {
      bovedaMonte: 915000,
      fletes: 75000,
      utilidades: -45000,
    },
    distribucionBancos: {
      bovedaMonte: 915000,
      fletes: 75000,
      utilidades: -45000,
    },
    bovedaMonte: 915000,
    utilidad: -45000,
    ganancia: -45000,
    concepto: 'Venta mayoreo',
    notas: 'Cliente frecuente',
    keywords: ['venta_001', 'bodega m-p', 'iphone'],
  },
  {
    id: 'venta_002',
    fecha: Timestamp.fromDate(new Date('2025-08-23')),
    clienteId: 'cli_valle',
    cliente: 'Valle',
    ocRelacionada: 'OC0001',
    producto: 'iPhone 15 Pro Max',
    cantidad: 60,
    precioVenta: 6800,
    precioCompra: 6100,
    precioFlete: 500,
    precioTotalVenta: 408000,
    ingreso: 408000,
    totalVenta: 408000,
    montoPagado: 30000,
    montoRestante: 378000,
    adeudo: 378000,
    estadoPago: 'parcial',
    estatus: 'Parcial',
    flete: 'Aplica',
    fleteUtilidad: 30000,
    distribucion: {
      bovedaMonte: 366000,
      fletes: 30000,
      utilidades: 12000,
    },
    distribucionBancos: {
      bovedaMonte: 366000,
      fletes: 30000,
      utilidades: 12000,
    },
    bovedaMonte: 366000,
    utilidad: 12000,
    ganancia: 12000,
    concepto: 'Venta medio mayoreo',
    notas: '',
    keywords: ['venta_002', 'valle', 'iphone'],
  },
  {
    id: 'venta_003',
    fecha: Timestamp.fromDate(new Date('2025-08-23')),
    clienteId: 'cli_ax',
    cliente: 'Ax',
    ocRelacionada: 'OC0001',
    producto: 'iPhone 15 Pro Max',
    cantidad: 50,
    precioVenta: 7000,
    precioCompra: 6100,
    precioFlete: 500,
    precioTotalVenta: 350000,
    ingreso: 350000,
    totalVenta: 350000,
    montoPagado: 350000,
    montoRestante: 0,
    adeudo: 0,
    estadoPago: 'completo',
    estatus: 'Pagado',
    flete: 'Aplica',
    fleteUtilidad: 25000,
    distribucion: {
      bovedaMonte: 305000,
      fletes: 25000,
      utilidades: 20000,
    },
    distribucionBancos: {
      bovedaMonte: 305000,
      fletes: 25000,
      utilidades: 20000,
    },
    bovedaMonte: 305000,
    utilidad: 20000,
    ganancia: 20000,
    concepto: 'Venta contado',
    notas: 'Pago inmediato',
    keywords: ['venta_003', 'ax', 'iphone'],
  },
  {
    id: 'venta_004',
    fecha: Timestamp.fromDate(new Date('2025-08-25')),
    clienteId: 'cli_negrito',
    cliente: 'Negrito',
    ocRelacionada: 'OC0002',
    producto: 'Samsung Galaxy S24 Ultra',
    cantidad: 25,
    precioVenta: 7000,
    precioCompra: 6100,
    precioFlete: 400,
    precioTotalVenta: 175000,
    ingreso: 175000,
    totalVenta: 175000,
    montoPagado: 175000,
    montoRestante: 0,
    adeudo: 0,
    estadoPago: 'completo',
    estatus: 'Pagado',
    flete: 'Aplica',
    fleteUtilidad: 10000,
    distribucion: {
      bovedaMonte: 152500,
      fletes: 10000,
      utilidades: 12500,
    },
    distribucionBancos: {
      bovedaMonte: 152500,
      fletes: 10000,
      utilidades: 12500,
    },
    bovedaMonte: 152500,
    utilidad: 12500,
    ganancia: 12500,
    concepto: 'Venta Samsung',
    notas: '',
    keywords: ['venta_004', 'negrito', 'samsung'],
  },
  {
    id: 'venta_005',
    fecha: Timestamp.fromDate(new Date('2025-09-01')),
    clienteId: 'cli_robalo',
    cliente: 'Robalo',
    ocRelacionada: 'OC0004',
    producto: 'iPhone 15 Pro',
    cantidad: 100,
    precioVenta: 6600,
    precioCompra: 6100,
    precioFlete: 400,
    precioTotalVenta: 660000,
    ingreso: 660000,
    totalVenta: 660000,
    montoPagado: 426000,
    montoRestante: 234000,
    adeudo: 234000,
    estadoPago: 'parcial',
    estatus: 'Parcial',
    flete: 'Aplica',
    fleteUtilidad: 40000,
    distribucion: {
      bovedaMonte: 610000,
      fletes: 40000,
      utilidades: 10000,
    },
    distribucionBancos: {
      bovedaMonte: 610000,
      fletes: 40000,
      utilidades: 10000,
    },
    bovedaMonte: 610000,
    utilidad: 10000,
    ganancia: 10000,
    concepto: 'Venta mayoreo',
    notas: 'Abono parcial recibido',
    keywords: ['venta_005', 'robalo', 'iphone'],
  },
]

export const SEED_ALMACEN = [
  {
    id: 'prod_iphone15promax',
    nombre: 'iPhone 15 Pro Max',
    categoria: 'Smartphones',
    origen: 'Quintana Roo',
    unidad: 'piezas',
    stockActual: 163,
    stockMinimo: 50,
    valorUnitario: 6300,
    totalEntradas: 423,
    totalSalidas: 260,
    descripcion: 'iPhone 15 Pro Max 256GB',
    entradas: [],
    salidas: [],
  },
  {
    id: 'prod_samsungs24',
    nombre: 'Samsung Galaxy S24 Ultra',
    categoria: 'Smartphones',
    origen: 'Quintana Roo',
    unidad: 'piezas',
    stockActual: 7,
    stockMinimo: 10,
    valorUnitario: 6300,
    totalEntradas: 32,
    totalSalidas: 25,
    descripcion: 'Samsung Galaxy S24 Ultra 512GB',
    entradas: [],
    salidas: [],
  },
  {
    id: 'prod_macbookm3',
    nombre: 'MacBook Pro M3',
    categoria: 'Laptops',
    origen: 'Nuevo León',
    unidad: 'piezas',
    stockActual: 33,
    stockMinimo: 10,
    valorUnitario: 6300,
    totalEntradas: 33,
    totalSalidas: 0,
    descripcion: 'MacBook Pro M3 14 pulgadas',
    entradas: [],
    salidas: [],
  },
  {
    id: 'prod_iphone15pro',
    nombre: 'iPhone 15 Pro',
    categoria: 'Smartphones',
    origen: 'CDMX',
    unidad: 'piezas',
    stockActual: 387,
    stockMinimo: 50,
    valorUnitario: 6300,
    totalEntradas: 487,
    totalSalidas: 100,
    descripcion: 'iPhone 15 Pro 256GB',
    entradas: [],
    salidas: [],
  },
  {
    id: 'prod_ipadpro',
    nombre: 'iPad Pro 12.9',
    categoria: 'Tablets',
    origen: 'Jalisco',
    unidad: 'piezas',
    stockActual: 50,
    stockMinimo: 15,
    valorUnitario: 5950,
    totalEntradas: 50,
    totalSalidas: 0,
    descripcion: 'iPad Pro 12.9 M2 256GB',
    entradas: [],
    salidas: [],
  },
]

export const SEED_MOVIMIENTOS = [
  {
    id: 'mov_001',
    tipoMovimiento: 'ingreso',
    tipo: 'ingreso_venta',
    bancoId: 'boveda_monte',
    monto: 350000,
    concepto: 'Venta venta_003 - Ax',
    referencia: 'Pago completo',
    referenciaId: 'venta_003',
    referenciaTipo: 'venta',
    cliente: 'Ax',
    fecha: Timestamp.fromDate(new Date('2025-08-23')),
  },
  {
    id: 'mov_002',
    tipoMovimiento: 'ingreso',
    tipo: 'ingreso_venta',
    bancoId: 'flete_sur',
    monto: 25000,
    concepto: 'Flete Venta venta_003',
    referencia: 'Recuperación de flete',
    referenciaId: 'venta_003',
    referenciaTipo: 'venta',
    cliente: 'Ax',
    fecha: Timestamp.fromDate(new Date('2025-08-23')),
  },
  {
    id: 'mov_003',
    tipoMovimiento: 'ingreso',
    tipo: 'ingreso_venta',
    bancoId: 'utilidades',
    monto: 20000,
    concepto: 'Utilidad Venta venta_003',
    referencia: 'Ganancia neta',
    referenciaId: 'venta_003',
    referenciaTipo: 'venta',
    cliente: 'Ax',
    fecha: Timestamp.fromDate(new Date('2025-08-23')),
  },
  {
    id: 'mov_004',
    tipoMovimiento: 'gasto',
    tipo: 'gasto_operativo',
    bancoId: 'boveda_monte',
    monto: 50000,
    concepto: 'Gastos operativos mensuales',
    referencia: 'Nómina',
    fecha: Timestamp.fromDate(new Date('2025-08-15')),
  },
  {
    id: 'mov_005',
    tipoMovimiento: 'ingreso',
    tipo: 'ingreso_venta',
    bancoId: 'boveda_monte',
    monto: 175000,
    concepto: 'Venta venta_004 - Negrito',
    referencia: 'Pago completo Samsung',
    referenciaId: 'venta_004',
    referenciaTipo: 'venta',
    cliente: 'Negrito',
    fecha: Timestamp.fromDate(new Date('2025-08-25')),
  },
]

// ============================================================
// FUNCIONES DE SEED
// ============================================================

export async function seedCollection<T extends { id: string }>(
  collectionName: string,
  data: T[],
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!db) {
    return { success: false, count: 0, error: 'Firebase no configurado' }
  }

  try {
    const batch = writeBatch(db)
    const now = Timestamp.now()

    for (const item of data) {
      const docRef = doc(db, collectionName, item.id)
      batch.set(docRef, {
        ...item,
        createdAt: now,
        updatedAt: now,
      })
    }

    await batch.commit()
    logger.info(`Seeded ${data.length} documents to ${collectionName}`, { context: 'SeedService' })
    return { success: true, count: data.length }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    logger.error(`Error seeding ${collectionName}`, error, { context: 'SeedService' })
    return { success: false, count: 0, error: errorMsg }
  }
}

export async function seedAllData(): Promise<{
  success: boolean
  results: Record<string, { success: boolean; count: number; error?: string }>
}> {
  const results: Record<string, { success: boolean; count: number; error?: string }> = {}

  // Seed en orden de dependencias
  results.bancos = await seedCollection('bancos', SEED_BANCOS)
  results.distribuidores = await seedCollection('distribuidores', SEED_DISTRIBUIDORES)
  results.clientes = await seedCollection('clientes', SEED_CLIENTES)
  results.ordenes_compra = await seedCollection('ordenes_compra', SEED_ORDENES_COMPRA)
  results.ventas = await seedCollection('ventas', SEED_VENTAS)
  results.almacen = await seedCollection('almacen', SEED_ALMACEN)
  results.movimientos = await seedCollection('movimientos', SEED_MOVIMIENTOS)

  const allSuccess = Object.values(results).every((r) => r.success)
  return { success: allSuccess, results }
}

export async function clearCollection(collectionName: string): Promise<{ success: boolean; count: number }> {
  if (!db) {
    return { success: false, count: 0 }
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName))
    const batch = writeBatch(db)
    let count = 0

    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref)
      count++
    })

    if (count > 0) {
      await batch.commit()
    }

    logger.info(`Cleared ${count} documents from ${collectionName}`, { context: 'SeedService' })
    return { success: true, count }
  } catch (error) {
    logger.error(`Error clearing ${collectionName}`, error, { context: 'SeedService' })
    return { success: false, count: 0 }
  }
}

export async function clearAllData(): Promise<Record<string, { success: boolean; count: number }>> {
  const collections = ['movimientos', 'ventas', 'ordenes_compra', 'clientes', 'distribuidores', 'almacen', 'bancos']
  const results: Record<string, { success: boolean; count: number }> = {}

  for (const col of collections) {
    results[col] = await clearCollection(col)
  }

  return results
}

// ============================================================
// FUNCIONES CRUD GENÉRICAS
// ============================================================

export async function deleteDocument(collectionName: string, docId: string): Promise<boolean> {
  if (!db) return false
  
  try {
    await deleteDoc(doc(db, collectionName, docId))
    logger.info(`Deleted ${docId} from ${collectionName}`, { context: 'SeedService' })
    return true
  } catch (error) {
    logger.error(`Error deleting ${docId} from ${collectionName}`, error, { context: 'SeedService' })
    return false
  }
}

export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
): Promise<boolean> {
  if (!db) return false
  
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: Timestamp.now(),
    })
    logger.info(`Updated ${docId} in ${collectionName}`, { context: 'SeedService' })
    return true
  } catch (error) {
    logger.error(`Error updating ${docId} in ${collectionName}`, error, { context: 'SeedService' })
    return false
  }
}

export async function getCollectionCount(collectionName: string): Promise<number> {
  if (!db) return 0
  
  try {
    const snapshot = await getDocs(collection(db, collectionName))
    return snapshot.size
  } catch {
    return 0
  }
}
