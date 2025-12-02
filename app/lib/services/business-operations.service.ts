/**
 * 🏦 BUSINESS OPERATIONS SERVICE - CHRONOS SYSTEM
 * Servicio completo de operaciones de negocio con lógica GYA
 * 
 * FLUJO DE OPERACIONES:
 * 
 * 1. ORDEN DE COMPRA:
 *    - Crea OC → Crea/Actualiza Distribuidor → Genera adeudo
 *    - Actualiza Almacén (entrada) → Stock actual aumenta
 * 
 * 2. VENTA:
 *    - Crea Venta → Crea/Actualiza Cliente → Genera adeudo (si aplica)
 *    - Actualiza Almacén (salida) → Stock actual disminuye
 *    - Distribuye a 3 bancos: Bóveda Monte, Fletes, Utilidades
 * 
 * 3. ABONO CLIENTE:
 *    - Reduce deuda del cliente
 *    - Actualiza capital de bancos según proporción original
 * 
 * 4. PAGO A DISTRIBUIDOR:
 *    - Reduce deuda con distribuidor
 *    - Descuenta del capital del banco seleccionado
 *    - Registra como gasto del banco
 * 
 * 5. TRANSFERENCIA:
 *    - Descuenta del banco origen
 *    - Suma al banco destino
 *    - Registra movimiento en ambos
 * 
 * 6. GASTO:
 *    - Descuenta del capital del banco
 *    - Registra en histórico de gastos
 * 
 * 7. INGRESO (para Azteca, Leftie, Profit):
 *    - Suma al capital del banco
 *    - Registra en histórico de ingresos
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  increment,
  Timestamp,
  setDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { logger } from '../utils/logger'
import type { 
  BancoId, 
  Venta, 
  OrdenCompra, 
  Cliente, 
  Distribuidor,
  Movimiento,
  TipoMovimiento,
} from '@/app/types'

// ============================================================
// TIPOS Y CONSTANTES
// ============================================================

const COLLECTIONS = {
  BANCOS: 'bancos',
  ORDENES_COMPRA: 'ordenes_compra',
  VENTAS: 'ventas',
  DISTRIBUIDORES: 'distribuidores',
  CLIENTES: 'clientes',
  ALMACEN: 'almacen',
  MOVIMIENTOS: 'movimientos',
  TRANSFERENCIAS: 'transferencias',
  INGRESOS: 'ingresos',
  GASTOS: 'gastos',
  ABONOS: 'abonos',
} as const

// Bancos del sistema
const BANCOS_CONFIG: Record<BancoId, { nombre: string; tipo: 'boveda' | 'operativo' | 'gastos' | 'utilidades' }> = {
  boveda_monte: { nombre: 'Bóveda Monte', tipo: 'boveda' },
  boveda_usa: { nombre: 'Bóveda USA', tipo: 'boveda' },
  profit: { nombre: 'Profit', tipo: 'operativo' },
  leftie: { nombre: 'Leftie', tipo: 'operativo' },
  azteca: { nombre: 'Azteca', tipo: 'operativo' },
  flete_sur: { nombre: 'Flete Sur', tipo: 'gastos' },
  utilidades: { nombre: 'Utilidades', tipo: 'utilidades' },
}

// ============================================================
// HELPERS
// ============================================================

const isFirestoreAvailable = (): boolean => {
  if (!isFirebaseConfigured || !db) {
    logger.warn('[BusinessOps] Firestore no disponible')
    return false
  }
  return true
}

/**
 * Asegura que un banco existe, creándolo si es necesario
 */
const ensureBancoExists = async (bancoId: BancoId): Promise<void> => {
  if (!db) return
  
  const bancoRef = doc(db, COLLECTIONS.BANCOS, bancoId)
  const bancoSnap = await getDoc(bancoRef)
  
  if (!bancoSnap.exists()) {
    const config = BANCOS_CONFIG[bancoId]
    await setDoc(bancoRef, {
      id: bancoId,
      nombre: config?.nombre || bancoId,
      tipo: config?.tipo || 'operativo',
      capitalActual: 0,
      capitalInicial: 0,
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      estado: 'activo',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    logger.info(`[BusinessOps] Banco ${bancoId} creado automáticamente`)
  }
}

// ============================================================
// 1. ORDEN DE COMPRA COMPLETA
// ============================================================

export interface CrearOrdenCompraInput {
  distribuidor: string
  producto?: string
  cantidad: number
  costoDistribuidor: number  // Precio por unidad del distribuidor
  costoTransporte?: number   // Costo de transporte por unidad
  pagoInicial?: number       // Monto pagado al crear la OC
  bancoOrigen?: BancoId      // De qué banco sale el pago inicial
  notas?: string
  fecha?: string | Date
}

export interface OrdenCompraResult {
  ordenId: string
  distribuidorId: string
  entradaAlmacenId: string
  costoTotal: number
  deudaGenerada: number
}

/**
 * Crea una orden de compra completa con toda la lógica de negocio
 * 
 * Efectos:
 * - Crea la orden de compra
 * - Crea/actualiza el perfil del distribuidor con el adeudo
 * - Registra entrada en almacén (aumenta stock)
 * - Si hay pago inicial, descuenta del banco origen
 */
export async function crearOrdenCompraCompleta(
  input: CrearOrdenCompraInput,
): Promise<OrdenCompraResult | null> {
  if (!isFirestoreAvailable()) return null
  
  const batch = writeBatch(db!)
  
  try {
    // Calcular costos
    const costoPorUnidad = input.costoDistribuidor + (input.costoTransporte || 0)
    const costoTotal = costoPorUnidad * input.cantidad
    const pagoInicial = input.pagoInicial || 0
    const deuda = costoTotal - pagoInicial
    
    // 1. Crear Orden de Compra
    const ocRef = doc(collection(db!, COLLECTIONS.ORDENES_COMPRA))
    const ocData = {
      id: ocRef.id,
      fecha: input.fecha || Timestamp.now(),
      distribuidor: input.distribuidor,
      distribuidorId: '', // Se actualiza después
      producto: input.producto || 'Producto General',
      origen: input.distribuidor,
      cantidad: input.cantidad,
      costoDistribuidor: input.costoDistribuidor,
      costoTransporte: input.costoTransporte || 0,
      costoPorUnidad,
      costoTotal,
      stockActual: input.cantidad,
      stockInicial: input.cantidad,
      pagoDistribuidor: pagoInicial,
      pagoInicial,
      deuda,
      bancoOrigen: input.bancoOrigen || null,
      estado: deuda === 0 ? 'pagado' : pagoInicial > 0 ? 'parcial' : 'pendiente',
      notas: input.notas || '',
      keywords: [input.distribuidor.toLowerCase(), input.producto?.toLowerCase()].filter(Boolean) as string[],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    batch.set(ocRef, ocData)
    
    // 2. Crear/Actualizar Distribuidor
    const distQuery = query(
      collection(db!, COLLECTIONS.DISTRIBUIDORES),
      where('nombre', '==', input.distribuidor),
    )
    const distSnapshot = await getDocs(distQuery)
    
    let distribuidorId: string
    
    if (distSnapshot.empty) {
      // Crear nuevo distribuidor
      const distRef = doc(collection(db!, COLLECTIONS.DISTRIBUIDORES))
      distribuidorId = distRef.id
      batch.set(distRef, {
        id: distRef.id,
        nombre: input.distribuidor,
        costoTotal,
        abonos: pagoInicial,
        pendiente: deuda,
        totalOrdenesCompra: costoTotal,
        totalPagado: pagoInicial,
        deudaTotal: deuda,
        numeroOrdenes: 1,
        ultimaOrden: Timestamp.now(),
        ordenesCompra: [ocRef.id],
        historialPagos: pagoInicial > 0 ? [{
          fecha: Timestamp.now(),
          monto: pagoInicial,
          bancoOrigen: input.bancoOrigen,
          ordenCompraId: ocRef.id,
        }] : [],
        keywords: [input.distribuidor.toLowerCase()],
        estado: 'activo',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      logger.info(`[BusinessOps] Distribuidor creado: ${input.distribuidor}`)
    } else {
      // Actualizar distribuidor existente
      distribuidorId = distSnapshot.docs[0].id
      const distRef = doc(db!, COLLECTIONS.DISTRIBUIDORES, distribuidorId)
      const distData = distSnapshot.docs[0].data()
      
      batch.update(distRef, {
        costoTotal: increment(costoTotal),
        abonos: increment(pagoInicial),
        pendiente: increment(deuda),
        totalOrdenesCompra: increment(costoTotal),
        totalPagado: increment(pagoInicial),
        deudaTotal: increment(deuda),
        numeroOrdenes: increment(1),
        ultimaOrden: Timestamp.now(),
        ordenesCompra: [...(distData.ordenesCompra || []), ocRef.id],
        historialPagos: pagoInicial > 0 ? [
          ...(distData.historialPagos || []),
          {
            fecha: Timestamp.now(),
            monto: pagoInicial,
            bancoOrigen: input.bancoOrigen,
            ordenCompraId: ocRef.id,
          },
        ] : (distData.historialPagos || []),
        updatedAt: Timestamp.now(),
      })
    }
    
    // Actualizar ID del distribuidor en la OC
    batch.update(ocRef, { distribuidorId })
    
    // 3. Registrar entrada en Almacén
    const prodQuery = query(
      collection(db!, COLLECTIONS.ALMACEN),
      where('nombre', '==', input.producto || 'Producto General'),
    )
    const prodSnapshot = await getDocs(prodQuery)
    
    let entradaAlmacenId: string
    
    if (prodSnapshot.empty) {
      // Crear nuevo producto
      const prodRef = doc(collection(db!, COLLECTIONS.ALMACEN))
      entradaAlmacenId = prodRef.id
      batch.set(prodRef, {
        id: prodRef.id,
        nombre: input.producto || 'Producto General',
        origen: input.distribuidor,
        stockActual: input.cantidad,
        stockMinimo: 10,
        valorUnitario: costoPorUnidad,
        precioCompra: input.costoDistribuidor,
        totalEntradas: input.cantidad,
        totalSalidas: 0,
        entradas: [{
          id: ocRef.id,
          fecha: Timestamp.now(),
          cantidad: input.cantidad,
          origen: input.distribuidor,
          ordenCompraId: ocRef.id,
          costoUnitario: costoPorUnidad,
          valorTotal: costoTotal,
          tipo: 'entrada',
        }],
        salidas: [],
        keywords: [input.producto?.toLowerCase(), input.distribuidor.toLowerCase()].filter(Boolean) as string[],
        activo: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar producto existente
      entradaAlmacenId = prodSnapshot.docs[0].id
      const prodRef = doc(db!, COLLECTIONS.ALMACEN, entradaAlmacenId)
      const prodData = prodSnapshot.docs[0].data()
      
      batch.update(prodRef, {
        stockActual: increment(input.cantidad),
        totalEntradas: increment(input.cantidad),
        entradas: [
          ...(prodData.entradas || []),
          {
            id: ocRef.id,
            fecha: Timestamp.now(),
            cantidad: input.cantidad,
            origen: input.distribuidor,
            ordenCompraId: ocRef.id,
            costoUnitario: costoPorUnidad,
            valorTotal: costoTotal,
            tipo: 'entrada',
          },
        ],
        updatedAt: Timestamp.now(),
      })
    }
    
    // 4. Si hay pago inicial, descontar del banco origen
    if (pagoInicial > 0 && input.bancoOrigen) {
      await ensureBancoExists(input.bancoOrigen)
      
      const bancoRef = doc(db!, COLLECTIONS.BANCOS, input.bancoOrigen)
      batch.update(bancoRef, {
        capitalActual: increment(-pagoInicial),
        historicoGastos: increment(pagoInicial),
        updatedAt: Timestamp.now(),
      })
      
      // Registrar movimiento de gasto
      const movRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
      batch.set(movRef, {
        id: movRef.id,
        bancoId: input.bancoOrigen,
        tipoMovimiento: 'pago_distribuidor' as TipoMovimiento,
        monto: pagoInicial,
        concepto: `Pago OC ${ocRef.id} - ${input.distribuidor}`,
        referencia: 'Pago a distribuidor',
        referenciaId: ocRef.id,
        referenciaTipo: 'orden_compra',
        destino: input.distribuidor,
        fecha: Timestamp.now(),
        createdAt: Timestamp.now(),
      })
    }
    
    await batch.commit()
    
    logger.info(`[BusinessOps] Orden de compra creada: ${ocRef.id}`, {
      data: { costoTotal, deuda, distribuidor: input.distribuidor },
    })
    
    return {
      ordenId: ocRef.id,
      distribuidorId,
      entradaAlmacenId,
      costoTotal,
      deudaGenerada: deuda,
    }
  } catch (error) {
    logger.error('[BusinessOps] Error creando orden de compra', error)
    throw error
  }
}

// ============================================================
// 2. VENTA COMPLETA CON DISTRIBUCIÓN GYA
// ============================================================

export interface CrearVentaInput {
  cliente: string
  producto?: string
  ocRelacionada?: string      // ID de la OC de donde sale el producto
  cantidad: number
  precioVenta: number         // Precio por unidad al cliente
  precioCompra?: number       // Costo por unidad (de la OC)
  precioFlete?: number        // Flete por unidad (default 500)
  estadoPago: 'completo' | 'parcial' | 'pendiente'
  montoPagado?: number        // Solo si es parcial
  metodoPago?: string
  notas?: string
  fecha?: string | Date
}

export interface VentaResult {
  ventaId: string
  clienteId: string
  salidaAlmacenId: string
  totalVenta: number
  // Distribución GYA
  bovedaMonte: number
  fletes: number
  utilidades: number
  // Deuda generada
  deudaCliente: number
}

/**
 * Crea una venta completa con toda la lógica de negocio GYA
 * 
 * FÓRMULAS DE DISTRIBUCIÓN:
 * - Bóveda Monte: precioCompra × cantidad (COSTO)
 * - Fletes: precioFlete × cantidad
 * - Utilidades: (precioVenta - precioCompra - precioFlete) × cantidad (GANANCIA NETA)
 * 
 * ESTADOS DE PAGO:
 * - Completo: 100% va a capitalActual de cada banco
 * - Parcial: Proporción va a capitalActual
 * - Pendiente: Solo historicoIngresos, NO capitalActual (hasta que pague)
 */
export async function crearVentaCompleta(
  input: CrearVentaInput,
): Promise<VentaResult | null> {
  if (!isFirestoreAvailable()) return null
  
  const batch = writeBatch(db!)
  
  try {
    // Obtener costo de la OC si está relacionada
    let costoUnitario = input.precioCompra || 0
    
    if (input.ocRelacionada && costoUnitario === 0) {
      try {
        const ocDoc = await getDoc(doc(db!, COLLECTIONS.ORDENES_COMPRA, input.ocRelacionada))
        if (ocDoc.exists()) {
          costoUnitario = ocDoc.data().costoPorUnidad || ocDoc.data().costoDistribuidor || 0
        }
      } catch (err) {
        logger.warn(`[BusinessOps] No se pudo obtener OC ${input.ocRelacionada}`)
      }
    }
    
    // Valores por defecto
    const precioFlete = input.precioFlete ?? 500  // Default 500 USD
    const precioVenta = input.precioVenta
    const cantidad = input.cantidad
    
    // Cálculos de venta
    const totalVenta = precioVenta * cantidad
    
    // DISTRIBUCIÓN GYA CORRECTA:
    const montoBovedaMonte = costoUnitario * cantidad           // COSTO
    const montoFletes = precioFlete * cantidad                  // FLETE
    const montoUtilidades = (precioVenta - costoUnitario - precioFlete) * cantidad  // GANANCIA NETA
    
    // Determinar monto pagado según estado
    let montoPagado = 0
    let montoRestante = totalVenta
    
    if (input.estadoPago === 'completo') {
      montoPagado = totalVenta
      montoRestante = 0
    } else if (input.estadoPago === 'parcial') {
      montoPagado = input.montoPagado || 0
      montoRestante = totalVenta - montoPagado
    }
    
    const proporcionPagada = totalVenta > 0 ? montoPagado / totalVenta : 0
    
    // 1. Crear venta
    const ventaRef = doc(collection(db!, COLLECTIONS.VENTAS))
    const clienteId = input.cliente.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    batch.set(ventaRef, {
      id: ventaRef.id,
      fecha: input.fecha || Timestamp.now(),
      clienteId,
      cliente: input.cliente,
      producto: input.producto || '',
      ocRelacionada: input.ocRelacionada || '',
      cantidad,
      precioVenta,
      precioCompra: costoUnitario,
      precioFlete,
      ingreso: totalVenta,
      totalVenta,
      precioTotalVenta: totalVenta,
      flete: precioFlete > 0 ? 'Aplica' : 'NoAplica',
      fleteUtilidad: montoFletes,
      utilidad: montoUtilidades,
      ganancia: montoUtilidades,
      bovedaMonte: montoBovedaMonte,
      distribucionBancos: {
        bovedaMonte: montoBovedaMonte,
        fletes: montoFletes,
        utilidades: montoUtilidades,
      },
      estatus: input.estadoPago === 'completo' ? 'Pagado' : input.estadoPago === 'parcial' ? 'Parcial' : 'Pendiente',
      estadoPago: input.estadoPago,
      montoPagado,
      montoRestante,
      adeudo: montoRestante,
      metodoPago: input.metodoPago || 'efectivo',
      notas: input.notas || '',
      keywords: [ventaRef.id, input.cliente.toLowerCase(), input.producto?.toLowerCase()].filter(Boolean) as string[],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    
    // 2. Crear/Actualizar Cliente
    const clienteQuery = query(
      collection(db!, COLLECTIONS.CLIENTES),
      where('nombre', '==', input.cliente),
    )
    const clienteSnapshot = await getDocs(clienteQuery)
    
    let finalClienteId: string = clienteId
    
    if (clienteSnapshot.empty) {
      // Crear nuevo cliente
      const clienteRef = doc(db!, COLLECTIONS.CLIENTES, clienteId)
      finalClienteId = clienteId
      batch.set(clienteRef, {
        id: clienteId,
        nombre: input.cliente,
        actual: montoPagado,
        deuda: montoRestante,
        abonos: montoPagado,
        pendiente: montoRestante,
        totalVentas: totalVenta,
        totalPagado: montoPagado,
        deudaTotal: montoRestante,
        numeroCompras: 1,
        ultimaCompra: Timestamp.now(),
        ventas: [ventaRef.id],
        historialPagos: montoPagado > 0 ? [{
          fecha: Timestamp.now(),
          monto: montoPagado,
          ventaId: ventaRef.id,
        }] : [],
        keywords: [input.cliente.toLowerCase()],
        estado: 'activo',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      logger.info(`[BusinessOps] Cliente creado: ${input.cliente}`)
    } else {
      // Actualizar cliente existente
      finalClienteId = clienteSnapshot.docs[0].id
      const clienteRef = doc(db!, COLLECTIONS.CLIENTES, finalClienteId)
      const clienteData = clienteSnapshot.docs[0].data()
      
      batch.update(clienteRef, {
        actual: increment(montoPagado),
        deuda: increment(montoRestante),
        abonos: increment(montoPagado),
        pendiente: increment(montoRestante),
        totalVentas: increment(totalVenta),
        totalPagado: increment(montoPagado),
        deudaTotal: increment(montoRestante),
        numeroCompras: increment(1),
        ultimaCompra: Timestamp.now(),
        ventas: [...(clienteData.ventas || []), ventaRef.id],
        historialPagos: montoPagado > 0 ? [
          ...(clienteData.historialPagos || []),
          {
            fecha: Timestamp.now(),
            monto: montoPagado,
            ventaId: ventaRef.id,
          },
        ] : (clienteData.historialPagos || []),
        updatedAt: Timestamp.now(),
      })
    }
    
    // 3. Actualizar Almacén (salida)
    let salidaAlmacenId = ''
    
    if (input.producto) {
      const prodQuery = query(
        collection(db!, COLLECTIONS.ALMACEN),
        where('nombre', '==', input.producto),
      )
      const prodSnapshot = await getDocs(prodQuery)
      
      if (!prodSnapshot.empty) {
        salidaAlmacenId = prodSnapshot.docs[0].id
        const prodRef = doc(db!, COLLECTIONS.ALMACEN, salidaAlmacenId)
        const prodData = prodSnapshot.docs[0].data()
        
        // Validar stock
        const stockActual = prodData.stockActual || 0
        if (stockActual < cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidad}`)
        }
        
        batch.update(prodRef, {
          stockActual: increment(-cantidad),
          totalSalidas: increment(cantidad),
          salidas: [
            ...(prodData.salidas || []),
            {
              id: ventaRef.id,
              fecha: Timestamp.now(),
              cantidad,
              destino: input.cliente,
              ventaId: ventaRef.id,
              precioVenta,
              valorTotal: totalVenta,
              tipo: 'salida',
            },
          ],
          updatedAt: Timestamp.now(),
        })
      }
    }
    
    // 4. Actualizar stock de la OC relacionada
    if (input.ocRelacionada) {
      const ocRef = doc(db!, COLLECTIONS.ORDENES_COMPRA, input.ocRelacionada)
      batch.update(ocRef, {
        stockActual: increment(-cantidad),
        updatedAt: Timestamp.now(),
      })
    }
    
    // 5. Distribuir a bancos según estado de pago
    await Promise.all([
      ensureBancoExists('boveda_monte'),
      ensureBancoExists('flete_sur'),
      ensureBancoExists('utilidades'),
    ])
    
    // Montos reales según proporción pagada
    const bovedaReal = montoBovedaMonte * proporcionPagada
    const fletesReal = montoFletes * proporcionPagada
    const utilidadesReal = montoUtilidades * proporcionPagada
    
    if (input.estadoPago === 'completo' || input.estadoPago === 'parcial') {
      // Actualizar capitalActual + historicoIngresos
      
      if (bovedaReal > 0) {
        const bovedaRef = doc(db!, COLLECTIONS.BANCOS, 'boveda_monte')
        batch.update(bovedaRef, {
          capitalActual: increment(bovedaReal),
          historicoIngresos: increment(bovedaReal),
          updatedAt: Timestamp.now(),
        })
        
        const movRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movRef, {
          id: movRef.id,
          bancoId: 'boveda_monte',
          tipoMovimiento: 'ingreso',
          monto: bovedaReal,
          concepto: `Venta ${ventaRef.id} - ${input.cliente}`,
          referencia: 'Recuperación de costo',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: input.cliente,
          estadoVenta: input.estadoPago,
          fecha: Timestamp.now(),
          createdAt: Timestamp.now(),
        })
      }
      
      if (fletesReal > 0) {
        const fletesRef = doc(db!, COLLECTIONS.BANCOS, 'flete_sur')
        batch.update(fletesRef, {
          capitalActual: increment(fletesReal),
          historicoIngresos: increment(fletesReal),
          updatedAt: Timestamp.now(),
        })
        
        const movRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movRef, {
          id: movRef.id,
          bancoId: 'flete_sur',
          tipoMovimiento: 'ingreso',
          monto: fletesReal,
          concepto: `Flete Venta ${ventaRef.id}`,
          referencia: 'Ingreso por flete',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: input.cliente,
          estadoVenta: input.estadoPago,
          fecha: Timestamp.now(),
          createdAt: Timestamp.now(),
        })
      }
      
      if (utilidadesReal > 0) {
        const utilRef = doc(db!, COLLECTIONS.BANCOS, 'utilidades')
        batch.update(utilRef, {
          capitalActual: increment(utilidadesReal),
          historicoIngresos: increment(utilidadesReal),
          updatedAt: Timestamp.now(),
        })
        
        const movRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movRef, {
          id: movRef.id,
          bancoId: 'utilidades',
          tipoMovimiento: 'ingreso',
          monto: utilidadesReal,
          concepto: `Utilidad Venta ${ventaRef.id}`,
          referencia: 'Ganancia neta',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: input.cliente,
          estadoVenta: input.estadoPago,
          fecha: Timestamp.now(),
          createdAt: Timestamp.now(),
        })
      }
    }
    
    // Para ventas pendientes, solo registrar en histórico (NO en capitalActual)
    if (input.estadoPago === 'pendiente') {
      // Solo historicoIngresos para referencia futura
      if (montoBovedaMonte > 0) {
        const bovedaRef = doc(db!, COLLECTIONS.BANCOS, 'boveda_monte')
        batch.update(bovedaRef, {
          historicoIngresos: increment(montoBovedaMonte),
          updatedAt: Timestamp.now(),
        })
      }
      if (montoFletes > 0) {
        const fletesRef = doc(db!, COLLECTIONS.BANCOS, 'flete_sur')
        batch.update(fletesRef, {
          historicoIngresos: increment(montoFletes),
          updatedAt: Timestamp.now(),
        })
      }
      if (montoUtilidades > 0) {
        const utilRef = doc(db!, COLLECTIONS.BANCOS, 'utilidades')
        batch.update(utilRef, {
          historicoIngresos: increment(montoUtilidades),
          updatedAt: Timestamp.now(),
        })
      }
    }
    
    await batch.commit()
    
    logger.info(`[BusinessOps] Venta creada: ${ventaRef.id}`, {
      data: {
        totalVenta,
        distribucion: { bovedaMonte: montoBovedaMonte, fletes: montoFletes, utilidades: montoUtilidades },
        estadoPago: input.estadoPago,
      },
    })
    
    return {
      ventaId: ventaRef.id,
      clienteId: finalClienteId,
      salidaAlmacenId,
      totalVenta,
      bovedaMonte: montoBovedaMonte,
      fletes: montoFletes,
      utilidades: montoUtilidades,
      deudaCliente: montoRestante,
    }
  } catch (error) {
    logger.error('[BusinessOps] Error creando venta', error)
    throw error
  }
}

// ============================================================
// 3. ABONO A CLIENTE
// ============================================================

export interface AbonarClienteInput {
  clienteId: string
  ventaId?: string        // Opcional: si es abono a una venta específica
  monto: number
  metodoPago?: string
  notas?: string
}

export async function abonarCliente(input: AbonarClienteInput): Promise<boolean> {
  if (!isFirestoreAvailable()) return false
  
  const batch = writeBatch(db!)
  
  try {
    // Obtener cliente
    const clienteRef = doc(db!, COLLECTIONS.CLIENTES, input.clienteId)
    const clienteSnap = await getDoc(clienteRef)
    
    if (!clienteSnap.exists()) {
      throw new Error('Cliente no encontrado')
    }
    
    const clienteData = clienteSnap.data()
    
    // Actualizar cliente
    batch.update(clienteRef, {
      actual: increment(input.monto),
      deuda: increment(-input.monto),
      abonos: increment(input.monto),
      pendiente: increment(-input.monto),
      totalPagado: increment(input.monto),
      deudaTotal: increment(-input.monto),
      historialPagos: [
        ...(clienteData.historialPagos || []),
        {
          fecha: Timestamp.now(),
          monto: input.monto,
          ventaId: input.ventaId || null,
          metodoPago: input.metodoPago || 'efectivo',
          notas: input.notas || '',
        },
      ],
      updatedAt: Timestamp.now(),
    })
    
    // Si hay venta específica, actualizar su estado
    if (input.ventaId) {
      const ventaRef = doc(db!, COLLECTIONS.VENTAS, input.ventaId)
      const ventaSnap = await getDoc(ventaRef)
      
      if (ventaSnap.exists()) {
        const ventaData = ventaSnap.data() as Venta
        const nuevoMontoPagado = (ventaData.montoPagado || 0) + input.monto
        const nuevoMontoRestante = (ventaData.precioTotalVenta || 0) - nuevoMontoPagado
        
        let nuevoEstado: 'completo' | 'parcial' | 'pendiente' = 'parcial'
        if (nuevoMontoRestante <= 0) {
          nuevoEstado = 'completo'
        } else if (nuevoMontoPagado === 0) {
          nuevoEstado = 'pendiente'
        }
        
        batch.update(ventaRef, {
          montoPagado: nuevoMontoPagado,
          montoRestante: Math.max(0, nuevoMontoRestante),
          adeudo: Math.max(0, nuevoMontoRestante),
          estadoPago: nuevoEstado,
          estatus: nuevoEstado === 'completo' ? 'Pagado' : nuevoEstado === 'parcial' ? 'Parcial' : 'Pendiente',
          updatedAt: Timestamp.now(),
        })
        
        // Calcular proporción del abono
        const totalVenta = ventaData.precioTotalVenta || 0
        const proporcion = totalVenta > 0 ? input.monto / totalVenta : 0
        
        // Distribuir proporcionalmente a los bancos
        const distribucion = ventaData.distribucionBancos || {
          bovedaMonte: 0,
          fletes: 0,
          utilidades: 0,
        }
        
        await Promise.all([
          ensureBancoExists('boveda_monte'),
          ensureBancoExists('flete_sur'),
          ensureBancoExists('utilidades'),
        ])
        
        if (distribucion.bovedaMonte > 0) {
          const montoAbono = distribucion.bovedaMonte * proporcion
          const bancoRef = doc(db!, COLLECTIONS.BANCOS, 'boveda_monte')
          batch.update(bancoRef, {
            capitalActual: increment(montoAbono),
            updatedAt: Timestamp.now(),
          })
        }
        
        if (distribucion.fletes > 0) {
          const montoAbono = distribucion.fletes * proporcion
          const bancoRef = doc(db!, COLLECTIONS.BANCOS, 'flete_sur')
          batch.update(bancoRef, {
            capitalActual: increment(montoAbono),
            updatedAt: Timestamp.now(),
          })
        }
        
        if (distribucion.utilidades > 0) {
          const montoAbono = distribucion.utilidades * proporcion
          const bancoRef = doc(db!, COLLECTIONS.BANCOS, 'utilidades')
          batch.update(bancoRef, {
            capitalActual: increment(montoAbono),
            updatedAt: Timestamp.now(),
          })
        }
      }
    }
    
    // Registrar abono
    const abonoRef = doc(collection(db!, COLLECTIONS.ABONOS))
    batch.set(abonoRef, {
      id: abonoRef.id,
      tipo: 'cliente',
      entidadId: input.clienteId,
      entidadNombre: clienteData.nombre,
      ventaId: input.ventaId || null,
      monto: input.monto,
      metodoPago: input.metodoPago || 'efectivo',
      notas: input.notas || '',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    await batch.commit()
    
    logger.info(`[BusinessOps] Abono a cliente: ${input.clienteId}`, { data: { monto: input.monto } })
    return true
  } catch (error) {
    logger.error('[BusinessOps] Error abonando a cliente', error)
    throw error
  }
}

// ============================================================
// 4. PAGO A DISTRIBUIDOR
// ============================================================

export interface PagarDistribuidorInput {
  distribuidorId: string
  ordenCompraId?: string    // Opcional: si es pago a una OC específica
  monto: number
  bancoOrigen: BancoId      // De qué banco sale el pago
  notas?: string
}

export async function pagarDistribuidor(input: PagarDistribuidorInput): Promise<boolean> {
  if (!isFirestoreAvailable()) return false
  
  const batch = writeBatch(db!)
  
  try {
    // Verificar banco origen
    await ensureBancoExists(input.bancoOrigen)
    
    // Obtener distribuidor
    const distRef = doc(db!, COLLECTIONS.DISTRIBUIDORES, input.distribuidorId)
    const distSnap = await getDoc(distRef)
    
    if (!distSnap.exists()) {
      throw new Error('Distribuidor no encontrado')
    }
    
    const distData = distSnap.data()
    
    // Actualizar distribuidor
    batch.update(distRef, {
      abonos: increment(input.monto),
      pendiente: increment(-input.monto),
      totalPagado: increment(input.monto),
      deudaTotal: increment(-input.monto),
      historialPagos: [
        ...(distData.historialPagos || []),
        {
          fecha: Timestamp.now(),
          monto: input.monto,
          bancoOrigen: input.bancoOrigen,
          ordenCompraId: input.ordenCompraId || null,
          notas: input.notas || '',
        },
      ],
      updatedAt: Timestamp.now(),
    })
    
    // Si hay OC específica, actualizar su estado
    if (input.ordenCompraId) {
      const ocRef = doc(db!, COLLECTIONS.ORDENES_COMPRA, input.ordenCompraId)
      const ocSnap = await getDoc(ocRef)
      
      if (ocSnap.exists()) {
        const ocData = ocSnap.data() as OrdenCompra
        const nuevoPago = (ocData.pagoDistribuidor || 0) + input.monto
        const nuevaDeuda = (ocData.costoTotal || 0) - nuevoPago
        
        let nuevoEstado: 'pendiente' | 'parcial' | 'pagado' = 'parcial'
        if (nuevaDeuda <= 0) {
          nuevoEstado = 'pagado'
        } else if (nuevoPago === 0) {
          nuevoEstado = 'pendiente'
        }
        
        batch.update(ocRef, {
          pagoDistribuidor: nuevoPago,
          pagoInicial: nuevoPago,
          deuda: Math.max(0, nuevaDeuda),
          estado: nuevoEstado,
          updatedAt: Timestamp.now(),
        })
      }
    }
    
    // Descontar del banco origen
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, input.bancoOrigen)
    batch.update(bancoRef, {
      capitalActual: increment(-input.monto),
      historicoGastos: increment(input.monto),
      updatedAt: Timestamp.now(),
    })
    
    // Registrar movimiento de gasto
    const movRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
    batch.set(movRef, {
      id: movRef.id,
      bancoId: input.bancoOrigen,
      tipoMovimiento: 'pago_distribuidor' as TipoMovimiento,
      monto: input.monto,
      concepto: `Pago a ${distData.nombre}`,
      referencia: input.ordenCompraId ? `OC: ${input.ordenCompraId}` : 'Pago general',
      referenciaId: input.ordenCompraId || input.distribuidorId,
      referenciaTipo: 'orden_compra',
      destino: distData.nombre,
      notas: input.notas || '',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    await batch.commit()
    
    logger.info(`[BusinessOps] Pago a distribuidor: ${input.distribuidorId}`, {
      data: { monto: input.monto, bancoOrigen: input.bancoOrigen },
    })
    return true
  } catch (error) {
    logger.error('[BusinessOps] Error pagando a distribuidor', error)
    throw error
  }
}

// ============================================================
// 5. TRANSFERENCIA ENTRE BANCOS
// ============================================================

export interface TransferenciaInput {
  bancoOrigen: BancoId
  bancoDestino: BancoId
  monto: number
  concepto: string
  descripcion?: string
}

export async function realizarTransferencia(input: TransferenciaInput): Promise<string | null> {
  if (!isFirestoreAvailable()) return null
  
  const batch = writeBatch(db!)
  
  try {
    // Asegurar que ambos bancos existen
    await Promise.all([
      ensureBancoExists(input.bancoOrigen),
      ensureBancoExists(input.bancoDestino),
    ])
    
    // Crear transferencia
    const transRef = doc(collection(db!, COLLECTIONS.TRANSFERENCIAS))
    batch.set(transRef, {
      id: transRef.id,
      bancoOrigenId: input.bancoOrigen,
      bancoDestinoId: input.bancoDestino,
      origen: BANCOS_CONFIG[input.bancoOrigen]?.nombre || input.bancoOrigen,
      destino: BANCOS_CONFIG[input.bancoDestino]?.nombre || input.bancoDestino,
      monto: input.monto,
      concepto: input.concepto,
      descripcion: input.descripcion || '',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    // Actualizar banco origen (resta)
    const origenRef = doc(db!, COLLECTIONS.BANCOS, input.bancoOrigen)
    batch.update(origenRef, {
      capitalActual: increment(-input.monto),
      historicoTransferencias: increment(input.monto),
      updatedAt: Timestamp.now(),
    })
    
    // Registrar movimiento de salida
    const movSalidaRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
    batch.set(movSalidaRef, {
      id: movSalidaRef.id,
      bancoId: input.bancoOrigen,
      tipoMovimiento: 'transferencia_salida' as TipoMovimiento,
      monto: input.monto,
      concepto: `Transferencia a ${BANCOS_CONFIG[input.bancoDestino]?.nombre}`,
      referencia: input.concepto,
      referenciaId: transRef.id,
      referenciaTipo: 'transferencia',
      destino: input.bancoDestino,
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    // Actualizar banco destino (suma)
    const destinoRef = doc(db!, COLLECTIONS.BANCOS, input.bancoDestino)
    batch.update(destinoRef, {
      capitalActual: increment(input.monto),
      historicoIngresos: increment(input.monto),
      updatedAt: Timestamp.now(),
    })
    
    // Registrar movimiento de entrada
    const movEntradaRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
    batch.set(movEntradaRef, {
      id: movEntradaRef.id,
      bancoId: input.bancoDestino,
      tipoMovimiento: 'transferencia_entrada' as TipoMovimiento,
      monto: input.monto,
      concepto: `Transferencia de ${BANCOS_CONFIG[input.bancoOrigen]?.nombre}`,
      referencia: input.concepto,
      referenciaId: transRef.id,
      referenciaTipo: 'transferencia',
      origen: input.bancoOrigen,
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    await batch.commit()
    
    logger.info('[BusinessOps] Transferencia realizada', {
      data: { de: input.bancoOrigen, a: input.bancoDestino, monto: input.monto },
    })
    
    return transRef.id
  } catch (error) {
    logger.error('[BusinessOps] Error en transferencia', error)
    throw error
  }
}

// ============================================================
// 6. REGISTRAR GASTO
// ============================================================

export interface RegistrarGastoInput {
  bancoOrigen: BancoId
  monto: number
  concepto: string
  descripcion?: string
  categoria?: string
}

export async function registrarGasto(input: RegistrarGastoInput): Promise<string | null> {
  if (!isFirestoreAvailable()) return null
  
  const batch = writeBatch(db!)
  
  try {
    await ensureBancoExists(input.bancoOrigen)
    
    // Crear gasto
    const gastoRef = doc(collection(db!, COLLECTIONS.GASTOS))
    batch.set(gastoRef, {
      id: gastoRef.id,
      bancoId: input.bancoOrigen,
      bancoOrigen: input.bancoOrigen,
      monto: input.monto,
      gasto: input.monto,
      concepto: input.concepto,
      descripcion: input.descripcion || '',
      categoria: input.categoria || 'General',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    // Actualizar banco
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, input.bancoOrigen)
    batch.update(bancoRef, {
      capitalActual: increment(-input.monto),
      historicoGastos: increment(input.monto),
      updatedAt: Timestamp.now(),
    })
    
    // Registrar movimiento
    const movRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
    batch.set(movRef, {
      id: movRef.id,
      bancoId: input.bancoOrigen,
      tipoMovimiento: 'gasto' as TipoMovimiento,
      monto: input.monto,
      concepto: input.concepto,
      referencia: input.categoria || 'Gasto general',
      referenciaId: gastoRef.id,
      referenciaTipo: 'manual',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    await batch.commit()
    
    logger.info('[BusinessOps] Gasto registrado', {
      data: { banco: input.bancoOrigen, monto: input.monto },
    })
    
    return gastoRef.id
  } catch (error) {
    logger.error('[BusinessOps] Error registrando gasto', error)
    throw error
  }
}

// ============================================================
// 7. REGISTRAR INGRESO (Para Azteca, Leftie, Profit)
// ============================================================

export interface RegistrarIngresoInput {
  bancoDestino: BancoId
  monto: number
  concepto: string
  descripcion?: string
  cliente?: string
  categoria?: string
}

export async function registrarIngreso(input: RegistrarIngresoInput): Promise<string | null> {
  if (!isFirestoreAvailable()) return null
  
  const batch = writeBatch(db!)
  
  try {
    await ensureBancoExists(input.bancoDestino)
    
    // Crear ingreso
    const ingresoRef = doc(collection(db!, COLLECTIONS.INGRESOS))
    batch.set(ingresoRef, {
      id: ingresoRef.id,
      bancoId: input.bancoDestino,
      bancoDestino: input.bancoDestino,
      monto: input.monto,
      ingreso: input.monto,
      concepto: input.concepto,
      descripcion: input.descripcion || '',
      cliente: input.cliente || '',
      categoria: input.categoria || 'General',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    // Actualizar banco
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, input.bancoDestino)
    batch.update(bancoRef, {
      capitalActual: increment(input.monto),
      historicoIngresos: increment(input.monto),
      updatedAt: Timestamp.now(),
    })
    
    // Registrar movimiento
    const movRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
    batch.set(movRef, {
      id: movRef.id,
      bancoId: input.bancoDestino,
      tipoMovimiento: 'ingreso' as TipoMovimiento,
      monto: input.monto,
      concepto: input.concepto,
      cliente: input.cliente || '',
      referencia: input.categoria || 'Ingreso directo',
      referenciaId: ingresoRef.id,
      referenciaTipo: 'manual',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
    
    await batch.commit()
    
    logger.info('[BusinessOps] Ingreso registrado', {
      data: { banco: input.bancoDestino, monto: input.monto },
    })
    
    return ingresoRef.id
  } catch (error) {
    logger.error('[BusinessOps] Error registrando ingreso', error)
    throw error
  }
}

// ============================================================
// EXPORTAR SERVICIO
// ============================================================

export const businessOperationsService = {
  crearOrdenCompraCompleta,
  crearVentaCompleta,
  abonarCliente,
  pagarDistribuidor,
  realizarTransferencia,
  registrarGasto,
  registrarIngreso,
}

export default businessOperationsService
