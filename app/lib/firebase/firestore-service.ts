/**
 * 🔥 FIRESTORE SERVICE - CHRONOS SYSTEM
 * Servicio centralizado para operaciones CRUD con Firebase Firestore
 * 
 * Características:
 * - Operaciones batch para consistencia
 * - Manejo de errores con logger
 * - Validación de conexión Firebase
 * - Tipado estricto TypeScript
 * 
 * @version 2.0.0
 * @author CHRONOS Team
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  increment,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { db } from './config'
import type { Banco, OrdenCompra, Venta, Distribuidor, Cliente, Producto } from '@/app/types'
import { logger } from '../utils/logger'

// ============================================================
// HELPER: Asegurar que un banco existe
// ============================================================

const BANCOS_DEFAULT: Record<string, Partial<Banco>> = {
  boveda_monte: { nombre: 'Bóveda Monte', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 },
  boveda_usa: { nombre: 'Bóveda USA', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 },
  profit: { nombre: 'Profit', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 },
  leftie: { nombre: 'Leftie', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 },
  azteca: { nombre: 'Azteca', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 },
  flete_sur: { nombre: 'Flete Sur', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 },
  utilidades: { nombre: 'Utilidades', capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 },
}

/**
 * Asegura que un banco existe en Firestore, creándolo si es necesario
 */
const ensureBancoExists = async (bancoId: string): Promise<void> => {
  if (!db) return
  
  const bancoRef = doc(db, COLLECTIONS.BANCOS, bancoId)
  const bancoSnap = await getDoc(bancoRef)
  
  if (!bancoSnap.exists()) {
    const defaultData = BANCOS_DEFAULT[bancoId] || { nombre: bancoId, capitalActual: 0, historicoIngresos: 0, historicoGastos: 0 }
    await setDoc(bancoRef, {
      id: bancoId,
      ...defaultData,
      historicoTransferencias: 0,
      operaciones: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    logger.info(`Banco ${bancoId} creado automáticamente`, { context: 'FirestoreService' })
  }
}

// ============================================================
// VERIFICACIÓN DE CONEXIÓN
// ============================================================

/**
 * Verifica si Firestore está disponible
 * Retorna false si db es null (modo mock)
 */
const isFirestoreAvailable = (): boolean => {
  if (!db) {
    logger.warn('[FirestoreService] Firestore no disponible - operando en modo mock', { context: 'FirestoreService' })
    return false
  }
  return true
}

/**
 * Obtiene la instancia de Firestore de forma segura
 * Lanza error si no está disponible
 */
const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firestore no configurado')
  }
  return db
}

// ============================================================
// COLECCIONES - Nombres estandarizados (snake_case)
// ============================================================
const COLLECTIONS = {
  BANCOS: 'bancos',
  ORDENES_COMPRA: 'ordenes_compra',
  VENTAS: 'ventas',
  DISTRIBUIDORES: 'distribuidores',
  CLIENTES: 'clientes',
  PRODUCTOS: 'almacen_productos',
  ALMACEN: 'almacen',
  ALMACEN_PRODUCTOS: 'almacen_productos',
  ALMACEN_ENTRADAS: 'almacen_entradas',
  ALMACEN_SALIDAS: 'almacen_salidas',
  MOVIMIENTOS: 'movimientos',
  TRANSFERENCIAS: 'transferencias',
  ABONOS: 'abonos',
  CORTES_BANCARIOS: 'cortes_bancarios',
  INGRESOS: 'ingresos',
  GASTOS: 'gastos',
} as const

// Tipo para nombres de colecciones
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]

// Exportar colecciones para uso externo
export { COLLECTIONS }

// ============================================================
// BANCOS
// ============================================================

export const suscribirBancos = (callback: (bancos: Banco[]) => void) => {
  // Guard: verificar conexión a Firestore
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {} // Retornar función vacía de desuscripción
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.BANCOS), orderBy('createdAt'))
    return onSnapshot(
      q,
      (snapshot) => {
        const bancos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Banco[]
        callback(bancos)
      },
      (error) => {
        logger.error('Error fetching bancos', error, { context: 'FirestoreService' })
        // Return empty array on error
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to bancos', error, { context: 'FirestoreService' })
    callback([])
    return () => {} // Return empty unsubscribe function
  }
}

export const obtenerBanco = async (bancoId: string): Promise<Banco | null> => {
  if (!isFirestoreAvailable()) {
    return null
  }
  
  try {
    const docRef = doc(db!, COLLECTIONS.BANCOS, bancoId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Banco) : null
  } catch (error) {
    logger.error('Error fetching banco', error, { context: 'FirestoreService' })
    return null
  }
}

export const actualizarCapitalBanco = async (
  bancoId: string,
  monto: number,
  tipo: 'ingreso' | 'gasto' | 'transferencia',
) => {
  if (!isFirestoreAvailable()) {
    logger.warn('actualizarCapitalBanco: Firestore no disponible', { context: 'FirestoreService' })
    return
  }
  
  try {
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, bancoId)
    const batch = writeBatch(db!)

    if (tipo === 'ingreso') {
      batch.update(bancoRef, {
        capitalActual: increment(monto),
        historicoIngresos: increment(monto),
        updatedAt: Timestamp.now(),
      })
    } else if (tipo === 'gasto') {
      batch.update(bancoRef, {
        capitalActual: increment(-monto),
        historicoGastos: increment(monto),
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()
  } catch (error) {
    logger.error('Error updating banco capital', error, { context: 'FirestoreService' })
  }
}

// ============================================================
// ÓRDENES DE COMPRA
// ============================================================

// Tipo flexible para crear órdenes - solo requiere campos esenciales
type CrearOrdenCompraInput = Partial<Omit<OrdenCompra, 'id'>> & {
  distribuidor: string
  cantidad: number
  costoTotal?: number
}

export const crearOrdenCompra = async (data: CrearOrdenCompraInput) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearOrdenCompra: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Completar campos faltantes con valores por defecto
    const ordenCompleta = {
      ...data,
      distribuidorId: data.distribuidorId || data.distribuidor?.toLowerCase().replace(/\s+/g, '_') || '',
      keywords: data.keywords || [data.distribuidor?.toLowerCase(), data.producto?.toLowerCase(), data.origen?.toLowerCase()].filter(Boolean) as string[],
      stockActual: data.stockActual ?? data.cantidad,
      stockInicial: data.stockInicial ?? data.cantidad,
      pagoInicial: data.pagoInicial ?? data.pagoDistribuidor ?? 0,
      deuda: data.deuda ?? ((data.costoTotal || 0) - (data.pagoDistribuidor || 0)),
      estado: data.estado || 'pendiente',
    }

    // Crear orden de compra
    const ocRef = doc(collection(db!, COLLECTIONS.ORDENES_COMPRA))
    batch.set(ocRef, {
      ...ordenCompleta,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Crear o actualizar distribuidor
    const distQuery = query(collection(db!, COLLECTIONS.DISTRIBUIDORES), where('nombre', '==', ordenCompleta.distribuidor))
    const distSnapshot = await getDocs(distQuery)

    let distribuidorId: string

    if (distSnapshot.empty) {
      // Crear nuevo distribuidor
      const distRef = doc(collection(db!, COLLECTIONS.DISTRIBUIDORES))
      distribuidorId = distRef.id
      batch.set(distRef, {
        nombre: ordenCompleta.distribuidor,
        deudaTotal: ordenCompleta.deuda || 0,
        totalOrdenesCompra: ordenCompleta.costoTotal || 0,
        totalPagado: ordenCompleta.pagoDistribuidor || 0,
        ordenesCompra: [ocRef.id],
        historialPagos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar distribuidor existente
      distribuidorId = distSnapshot.docs[0].id
      const distRef = doc(db!, COLLECTIONS.DISTRIBUIDORES, distribuidorId)
      batch.update(distRef, {
        deudaTotal: increment(ordenCompleta.deuda || 0),
        totalOrdenesCompra: increment(ordenCompleta.costoTotal || 0),
        totalPagado: increment(ordenCompleta.pagoDistribuidor || 0),
        ordenesCompra: [...(distSnapshot.docs[0].data().ordenesCompra || []), ocRef.id],
        updatedAt: Timestamp.now(),
      })
    }

    // Actualizar almacén (crear entrada)
    const prodQuery = query(collection(db!, COLLECTIONS.ALMACEN), where('nombre', '==', ordenCompleta.producto))
    const prodSnapshot = await getDocs(prodQuery)

    if (prodSnapshot.empty) {
      // Crear nuevo producto
      const prodRef = doc(collection(db!, COLLECTIONS.ALMACEN))
      batch.set(prodRef, {
        nombre: ordenCompleta.producto,
        origen: ordenCompleta.origen,
        stockActual: ordenCompleta.cantidad,
        totalEntradas: ordenCompleta.cantidad,
        totalSalidas: 0,
        valorUnitario: ordenCompleta.costoPorUnidad || 0,
        entradas: [
          {
            id: ocRef.id,
            fecha: ordenCompleta.fecha,
            cantidad: ordenCompleta.cantidad,
            origen: ordenCompleta.distribuidor,
            tipo: 'entrada',
          },
        ],
        salidas: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar producto existente
      const prodRef = doc(db!, COLLECTIONS.ALMACEN, prodSnapshot.docs[0].id)
      const prodData = prodSnapshot.docs[0].data()
      batch.update(prodRef, {
        stockActual: increment(ordenCompleta.cantidad),
        totalEntradas: increment(ordenCompleta.cantidad),
        entradas: [
          ...(prodData.entradas || []),
          {
            id: ocRef.id,
            fecha: ordenCompleta.fecha,
            cantidad: ordenCompleta.cantidad,
            origen: ordenCompleta.distribuidor,
            tipo: 'entrada',
          },
        ],
        updatedAt: Timestamp.now(),
      })
    }

    // Si hay pago, actualizar banco
    if ((ordenCompleta.pagoDistribuidor || 0) > 0 && ordenCompleta.bancoOrigen) {
      // Asegurar que el banco existe
      await ensureBancoExists(ordenCompleta.bancoOrigen)
      
      const bancoRef = doc(db!, COLLECTIONS.BANCOS, ordenCompleta.bancoOrigen)
      batch.update(bancoRef, {
        capitalActual: increment(-(ordenCompleta.pagoDistribuidor || 0)),
        historicoGastos: increment(ordenCompleta.pagoDistribuidor || 0),
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()
    return ocRef.id
  } catch (error) {
    logger.error('Error creating orden de compra', error, { context: 'FirestoreService' })
    return null
  }
}

export const suscribirOrdenesCompra = (callback: (ordenes: OrdenCompra[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.ORDENES_COMPRA), orderBy('fecha', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        const ordenes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as OrdenCompra[]
        callback(ordenes)
      },
      (error) => {
        logger.error('Error fetching ordenes compra', error, { context: 'FirestoreService' })
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to ordenes compra', error, { context: 'FirestoreService' })
    callback([])
    return () => {}
  }
}

// ============================================================
// VENTAS - CON LÓGICA GYA (Ganancia y Asignación)
// ============================================================

/**
 * Tipo flexible para crear ventas
 * La lógica GYA calcula automáticamente la distribución a bancos:
 * - Bóveda Monte: Recibe el COSTO (precioCompra × cantidad)
 * - Flete Sur: Recibe el monto de flete (si aplica)
 * - Utilidades: Recibe la ganancia neta (Venta - Costo - Flete)
 */
type CrearVentaInput = Partial<Omit<Venta, 'id'>> & {
  cliente: string
  cantidad: number
  precioTotalVenta?: number
  precioVenta?: number      // Precio unitario de venta
  precioCompra?: number     // ✅ CRÍTICO: Precio de compra/costo para cálculo GYA
  producto?: string
  ocRelacionada?: string    // OC de donde viene el producto (para obtener costo)
  precioFlete?: number      // Flete por unidad
  fleteUtilidad?: number    // Flete total (alternativa)
  distribucionBancos?: {    // Distribución precalculada (opcional, para validación)
    bovedaMonte: number
    fletes: number
    utilidades: number
  }
}

export const crearVenta = async (data: CrearVentaInput) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearVenta: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)
    
    // ═══════════════════════════════════════════════════════════════════════
    // 1. OBTENER DATOS DEL PRODUCTO Y COSTO BASE
    // ═══════════════════════════════════════════════════════════════════════
    
    let costoUnitarioBase = 0 // Costo por unidad (de la OC)
    let prodSnapshot: Awaited<ReturnType<typeof getDocs>> | null = null
    
    // PRIORIDAD 1: Usar precioCompra pasado directamente desde el formulario
    if (data.precioCompra && data.precioCompra > 0) {
      costoUnitarioBase = data.precioCompra
      logger.info(`Costo obtenido del formulario: $${costoUnitarioBase}`, { context: 'FirestoreService' })
    }
    // PRIORIDAD 2: Intentar obtener costo desde la OC relacionada
    else if (data.ocRelacionada) {
      try {
        const ocDoc = await getDoc(doc(db!, COLLECTIONS.ORDENES_COMPRA, data.ocRelacionada))
        if (ocDoc.exists()) {
          const ocData = ocDoc.data()
          costoUnitarioBase = ocData.costoPorUnidad || ocData.costoDistribuidor || 0
          logger.info(`Costo obtenido de OC ${data.ocRelacionada}: $${costoUnitarioBase}`, { context: 'FirestoreService' })
        }
      } catch {
        logger.warn(`No se pudo obtener OC ${data.ocRelacionada}`, { context: 'FirestoreService' })
      }
    }
    
    // Si hay producto, validar stock y obtener costo alternativo
    if (data.producto) {
      const prodQuery = query(collection(db!, COLLECTIONS.ALMACEN), where('nombre', '==', data.producto))
      prodSnapshot = await getDocs(prodQuery)
      
      if (!prodSnapshot.empty) {
        const prodData = prodSnapshot.docs[0].data() as Record<string, unknown>
        
        // Validar stock
        const stockActual = Number(prodData.stockActual) || 0
        if (stockActual < data.cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${data.cantidad}`)
        }
        
        // Si no tenemos costo de OC, usar valorUnitario del producto
        if (costoUnitarioBase === 0) {
          costoUnitarioBase = Number(prodData.valorUnitario) || Number(prodData.precioCompra) || 0
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // 2. CÁLCULOS DE NEGOCIO - LÓGICA GYA (del Excel)
    // ═══════════════════════════════════════════════════════════════════════
    
    const cantidad = data.cantidad
    const precioVentaUnitario = data.precioVenta || (data.precioTotalVenta ? data.precioTotalVenta / cantidad : 0)
    const totalVenta = data.precioTotalVenta || (precioVentaUnitario * cantidad)
    
    // ✅ DISTRIBUCIÓN GYA CORRECTA según FORMULAS_CORRECTAS_VENTAS_Version2.md:
    // A. Bóveda Monte = Precio COMPRA × Cantidad (COSTO del distribuidor)
    const montoBovedaMonte = costoUnitarioBase * cantidad
    
    // B. Fletes = Flete × Cantidad (TRANSPORTE)
    const fleteAplica = data.flete === 'Aplica' || (data.precioFlete && data.precioFlete > 0) || (data.fleteUtilidad && data.fleteUtilidad > 0)
    const montoFlete = data.fleteUtilidad || ((data.precioFlete || 0) * cantidad) || 0
    const fleteUnitario = cantidad > 0 ? montoFlete / cantidad : 0
    
    // C. ✅ Utilidades = (Precio VENTA - Precio COMPRA - Flete) × Cantidad (GANANCIA NETA)
    // Esta es la fórmula CORRECTA del documento FORMULAS_CORRECTAS_VENTAS_Version2.md
    const montoUtilidad = (precioVentaUnitario - costoUnitarioBase - fleteUnitario) * cantidad
    
    // Log de cálculo para debugging
    logger.info('Cálculo GYA de venta:', {
      context: 'FirestoreService',
      data: {
        totalVenta,
        costoUnitario: costoUnitarioBase,
        costoTotal: montoBovedaMonte,
        flete: montoFlete,
        utilidad: montoUtilidad,
      },
    })
    
    // ═══════════════════════════════════════════════════════════════════════
    // 3. DETERMINAR ESTADO DE PAGO
    // ═══════════════════════════════════════════════════════════════════════
    
    const montoPagado = data.montoPagado || 0
    const montoRestante = totalVenta - montoPagado
    
    let estadoPago: 'completo' | 'parcial' | 'pendiente' = 'pendiente'
    let estatus: 'Pagado' | 'Parcial' | 'Pendiente' = 'Pendiente'
    
    if (montoPagado >= totalVenta) {
      estadoPago = 'completo'
      estatus = 'Pagado'
    } else if (montoPagado > 0) {
      estadoPago = 'parcial'
      estatus = 'Parcial'
    }
    
    // Proporción pagada (para distribución parcial)
    const proporcionPagada = totalVenta > 0 ? montoPagado / totalVenta : 0
    
    // ═══════════════════════════════════════════════════════════════════════
    // 4. CREAR DOCUMENTO DE VENTA
    // ═══════════════════════════════════════════════════════════════════════
    
    const clienteId = data.clienteId || data.cliente?.toLowerCase().replace(/[^a-z0-9]/g, '_') || ''
    
    const ventaRef = doc(collection(db!, COLLECTIONS.VENTAS))
    batch.set(ventaRef, {
      // IDs y referencias
      id: ventaRef.id,
      clienteId,
      cliente: data.cliente,
      ocRelacionada: data.ocRelacionada || '',
      producto: data.producto || '',
      
      // Cantidades y precios
      cantidad,
      precioVenta: precioVentaUnitario,
      precioCompra: costoUnitarioBase, // Guardamos el costo unitario
      ingreso: totalVenta,
      totalVenta,
      precioTotalVenta: totalVenta,
      
      // Flete
      flete: fleteAplica ? 'Aplica' : 'NoAplica',
      fleteUtilidad: montoFlete,
      precioFlete: data.precioFlete || (cantidad > 0 ? montoFlete / cantidad : 0),
      
      // Utilidad/Ganancia
      utilidad: montoUtilidad,
      ganancia: montoUtilidad,
      bovedaMonte: montoBovedaMonte,
      
      // DISTRIBUCIÓN GYA (para reportes y auditoría)
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
      
      // Estado de pago
      estatus,
      estadoPago,
      montoPagado,
      montoRestante,
      adeudo: montoRestante,
      
      // Metadata
      fecha: data.fecha || Timestamp.now(),
      concepto: data.concepto || '',
      notas: data.notas || '',
      keywords: [ventaRef.id, data.cliente?.toLowerCase(), data.producto?.toLowerCase()].filter(Boolean) as string[],
      
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    
    // ═══════════════════════════════════════════════════════════════════════
    // 5. CREAR/ACTUALIZAR CLIENTE
    // ═══════════════════════════════════════════════════════════════════════
    
    const clienteQuery = query(collection(db!, COLLECTIONS.CLIENTES), where('nombre', '==', data.cliente))
    const clienteSnapshot = await getDocs(clienteQuery)

    if (clienteSnapshot.empty) {
      // Crear nuevo cliente
      const clienteRef = doc(db!, COLLECTIONS.CLIENTES, clienteId)
      batch.set(clienteRef, {
        id: clienteId,
        nombre: data.cliente,
        deudaTotal: montoRestante,
        pendiente: montoRestante,
        totalVentas: totalVenta,
        totalPagado: montoPagado,
        ventas: [ventaRef.id],
        historialPagos: [],
        estado: 'activo',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar cliente existente
      const existingClienteRef = doc(db!, COLLECTIONS.CLIENTES, clienteSnapshot.docs[0].id)
      batch.update(existingClienteRef, {
        deudaTotal: increment(montoRestante),
        pendiente: increment(montoRestante),
        totalVentas: increment(totalVenta),
        totalPagado: increment(montoPagado),
        ventas: [...(clienteSnapshot.docs[0].data().ventas || []), ventaRef.id],
        updatedAt: Timestamp.now(),
      })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. ACTUALIZAR ALMACÉN (salida de inventario)
    // ═══════════════════════════════════════════════════════════════════════
    
    if (prodSnapshot && !prodSnapshot.empty) {
      const prodRef = doc(db!, COLLECTIONS.ALMACEN, prodSnapshot.docs[0].id)
      const prodData = prodSnapshot.docs[0].data() as Record<string, unknown>
      
      batch.update(prodRef, {
        stockActual: increment(-cantidad),
        totalSalidas: increment(cantidad),
        salidas: [
          ...((prodData.salidas as unknown[]) || []),
          {
            id: ventaRef.id,
            fecha: data.fecha || Timestamp.now(),
            cantidad: cantidad,
            destino: data.cliente,
            tipo: 'salida',
          },
        ],
        updatedAt: Timestamp.now(),
      })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6.5. ACTUALIZAR STOCK DE LA ORDEN DE COMPRA (TRAZABILIDAD COMPLETA)
    // ═══════════════════════════════════════════════════════════════════════
    
    if (data.ocRelacionada) {
      try {
        const ocRef = doc(db!, COLLECTIONS.ORDENES_COMPRA, data.ocRelacionada)
        const ocDoc = await getDoc(ocRef)
        
        if (ocDoc.exists()) {
          const ocData = ocDoc.data() as OrdenCompra
          const stockActualOC = ocData.stockActual || ocData.cantidad || 0
          
          // Validar que hay stock suficiente en la OC
          if (stockActualOC >= cantidad) {
            batch.update(ocRef, {
              stockActual: increment(-cantidad),
              updatedAt: Timestamp.now(),
            })
            
            logger.info(`Stock de OC ${data.ocRelacionada} actualizado: -${cantidad}`, {
              context: 'FirestoreService',
              data: { stockAnterior: stockActualOC, stockNuevo: stockActualOC - cantidad },
            })
          } else {
            logger.warn(`Stock insuficiente en OC ${data.ocRelacionada}`, {
              context: 'FirestoreService',
              data: { stockDisponible: stockActualOC, cantidadSolicitada: cantidad },
            })
          }
        } else {
          logger.warn(`OC ${data.ocRelacionada} no encontrada para actualizar stock`, {
            context: 'FirestoreService',
          })
        }
      } catch (error) {
        logger.error(`Error actualizando stock de OC ${data.ocRelacionada}`, error, {
          context: 'FirestoreService',
        })
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. GENERAR MOVIMIENTOS BANCARIOS (distribución GYA)
    // ═══════════════════════════════════════════════════════════════════════
    
    // ✅ LÓGICA CORRECTA según LOGICA_CORRECTA_SISTEMA_Version2.md:
    // - PAGO COMPLETO: Actualiza capitalActual + historicoIngresos (100%)
    // - PAGO PARCIAL: Actualiza capitalActual + historicoIngresos (PROPORCIONAL)
    // - PAGO PENDIENTE: Solo actualiza historicoIngresos, NO capitalActual (0%)
    
    // Solo generamos movimientos si hay pago (completo o parcial)
    if (montoPagado > 0) {
      // Monto que va a cada banco (proporcional al pago)
      const montoBovedaMonteReal = montoBovedaMonte * proporcionPagada
      const montoFleteReal = montoFlete * proporcionPagada
      const montoUtilidadReal = montoUtilidad * proporcionPagada
      
      // ⚡ ASEGURAR QUE LOS BANCOS EXISTEN ANTES DE ACTUALIZAR
      await Promise.all([
        montoBovedaMonteReal > 0 ? ensureBancoExists('boveda_monte') : Promise.resolve(),
        montoFleteReal > 0 ? ensureBancoExists('flete_sur') : Promise.resolve(),
        montoUtilidadReal > 0 ? ensureBancoExists('utilidades') : Promise.resolve(),
      ])
      
      // 1. Ingreso a Bóveda Monte (recuperación de costo)
      if (montoBovedaMonteReal > 0) {
        const movMonteRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movMonteRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta',
          bancoId: 'boveda_monte',
          monto: montoBovedaMonteReal,
          concepto: `Venta ${ventaRef.id} - ${data.cliente}`,
          referencia: 'Recuperación de costo',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: data.cliente,
          fecha: data.fecha || Timestamp.now(),
          createdAt: Timestamp.now(),
        })
        
        // Actualizar banco
        const bovedaMonteRef = doc(db!, COLLECTIONS.BANCOS, 'boveda_monte')
        batch.update(bovedaMonteRef, {
          capitalActual: increment(montoBovedaMonteReal),
          historicoIngresos: increment(montoBovedaMonteReal),
          updatedAt: Timestamp.now(),
        })
      }
      
      // 2. Ingreso a Flete Sur
      if (montoFleteReal > 0) {
        const movFleteRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movFleteRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta',
          bancoId: 'flete_sur',
          monto: montoFleteReal,
          concepto: `Flete Venta ${ventaRef.id}`,
          referencia: 'Recuperación de flete',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: data.cliente,
          fecha: data.fecha || Timestamp.now(),
          createdAt: Timestamp.now(),
        })
        
        // Actualizar banco
        const fletesRef = doc(db!, COLLECTIONS.BANCOS, 'flete_sur')
        batch.update(fletesRef, {
          capitalActual: increment(montoFleteReal),
          historicoIngresos: increment(montoFleteReal),
          updatedAt: Timestamp.now(),
        })
      }
      
      // 3. Ingreso a Utilidades (ganancia neta)
      if (montoUtilidadReal > 0) {
        const movUtilRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movUtilRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta',
          bancoId: 'utilidades',
          monto: montoUtilidadReal,
          concepto: `Utilidad Venta ${ventaRef.id}`,
          referencia: 'Ganancia neta',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: data.cliente,
          fecha: data.fecha || Timestamp.now(),
          createdAt: Timestamp.now(),
        })
        
        // Actualizar banco
        const utilidadesRef = doc(db!, COLLECTIONS.BANCOS, 'utilidades')
        batch.update(utilidadesRef, {
          capitalActual: increment(montoUtilidadReal),
          historicoIngresos: increment(montoUtilidadReal),
          updatedAt: Timestamp.now(),
        })
      }
    } else if (estadoPago === 'pendiente') {
      // ✅ ESTADO PENDIENTE según LOGICA_CORRECTA_SISTEMA_Version2.md:
      // Solo actualiza HISTÓRICOS (para referencia futura), NO capitalActual
      
      await Promise.all([
        ensureBancoExists('boveda_monte'),
        ensureBancoExists('flete_sur'),
        ensureBancoExists('utilidades'),
      ])
      
      // Actualizar SOLO historicoIngresos (sin tocar capitalActual)
      if (montoBovedaMonte > 0) {
        const bovedaMonteRef = doc(db!, COLLECTIONS.BANCOS, 'boveda_monte')
        batch.update(bovedaMonteRef, {
          historicoIngresos: increment(montoBovedaMonte),
          updatedAt: Timestamp.now(),
        })
        
        // Registrar movimiento PENDIENTE (sin afectar capital)
        const movMonteRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movMonteRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta_pendiente',
          bancoId: 'boveda_monte',
          monto: montoBovedaMonte,
          concepto: `Venta PENDIENTE ${ventaRef.id} - ${data.cliente}`,
          referencia: 'Pendiente de cobro',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: data.cliente,
          fecha: data.fecha || Timestamp.now(),
          createdAt: Timestamp.now(),
        })
      }
      
      if (montoFlete > 0) {
        const fletesRef = doc(db!, COLLECTIONS.BANCOS, 'flete_sur')
        batch.update(fletesRef, {
          historicoIngresos: increment(montoFlete),
          updatedAt: Timestamp.now(),
        })
        
        const movFleteRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movFleteRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta_pendiente',
          bancoId: 'flete_sur',
          monto: montoFlete,
          concepto: `Flete PENDIENTE Venta ${ventaRef.id}`,
          referencia: 'Pendiente de cobro',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: data.cliente,
          fecha: data.fecha || Timestamp.now(),
          createdAt: Timestamp.now(),
        })
      }
      
      if (montoUtilidad > 0) {
        const utilidadesRef = doc(db!, COLLECTIONS.BANCOS, 'utilidades')
        batch.update(utilidadesRef, {
          historicoIngresos: increment(montoUtilidad),
          updatedAt: Timestamp.now(),
        })
        
        const movUtilRef = doc(collection(db!, COLLECTIONS.MOVIMIENTOS))
        batch.set(movUtilRef, {
          tipoMovimiento: 'ingreso',
          tipo: 'ingreso_venta_pendiente',
          bancoId: 'utilidades',
          monto: montoUtilidad,
          concepto: `Utilidad PENDIENTE Venta ${ventaRef.id}`,
          referencia: 'Pendiente de cobro',
          referenciaId: ventaRef.id,
          referenciaTipo: 'venta',
          cliente: data.cliente,
          fecha: data.fecha || Timestamp.now(),
          createdAt: Timestamp.now(),
        })
      }
      
      logger.info('Venta PENDIENTE registrada - Solo historicoIngresos actualizado', {
        context: 'FirestoreService',
        data: {
          ventaId: ventaRef.id,
          totalVenta,
          distribucion: { bovedaMonte: montoBovedaMonte, fletes: montoFlete, utilidades: montoUtilidad },
          estadoPago: 'pendiente',
          nota: 'capitalActual NO modificado hasta que se cobre',
        },
      })
    }

    await batch.commit()
    
    logger.info('Venta creada con distribución GYA', {
      context: 'FirestoreService',
      data: {
        ventaId: ventaRef.id,
        totalVenta,
        distribucion: { bovedaMonte: montoBovedaMonte, fletes: montoFlete, utilidades: montoUtilidad },
        estadoPago,
      },
    })
    
    return ventaRef.id
  } catch (error) {
    logger.error('Error creating venta con lógica GYA', error, { context: 'FirestoreService' })
    throw error
  }
}

export const suscribirVentas = (callback: (ventas: Venta[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.VENTAS), orderBy('fecha', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        const ventas = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Venta[]
        callback(ventas)
      },
      (error) => {
        logger.error('Error fetching ventas', error, { context: 'FirestoreService' })
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to ventas', error, { context: 'FirestoreService' })
    callback([])
    return () => {}
  }
}

// ============================================================
// DISTRIBUIDORES
// ============================================================

/**
 * Crear un nuevo distribuidor en Firestore
 */
export const crearDistribuidor = async (data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  origen?: string
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearDistribuidor: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Verificar si el distribuidor ya existe
    const distQuery = query(
      collection(db!, COLLECTIONS.DISTRIBUIDORES),
      where('nombre', '==', data.nombre),
    )
    const existingDist = await getDocs(distQuery)

    if (!existingDist.empty) {
      throw new Error(`El distribuidor "${data.nombre}" ya existe`)
    }

    // Crear nuevo distribuidor
    const distRef = doc(collection(db!, COLLECTIONS.DISTRIBUIDORES))
    batch.set(distRef, {
      ...data,
      deudaTotal: 0,
      totalOrdenesCompra: 0,
      totalPagado: 0,
      ordenesCompra: [],
      historialPagos: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Distribuidor creado exitosamente', { data: { id: distRef.id, nombre: data.nombre } })
    return distRef.id
  } catch (error) {
    logger.error('Error creating distribuidor', error, { context: 'FirestoreService' })
    throw error
  }
}

export const suscribirDistribuidores = (callback: (distribuidores: Distribuidor[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.DISTRIBUIDORES), orderBy('nombre'))
    return onSnapshot(
      q,
      (snapshot) => {
        const distribuidores = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Distribuidor[]
        callback(distribuidores)
      },
      (error) => {
        logger.error('Error fetching distribuidores', error, { context: 'FirestoreService' })
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to distribuidores', error, { context: 'FirestoreService' })
    callback([])
    return () => {}
  }
}

export const pagarDistribuidor = async (
  distribuidorId: string,
  ordenCompraId: string,
  monto: number,
  bancoOrigenId: string,
) => {
  if (!isFirestoreAvailable()) {
    logger.warn('pagarDistribuidor: Firestore no disponible', { context: 'FirestoreService' })
    return
  }
  
  try {
    const batch = writeBatch(db!)

    // Actualizar orden de compra
    const ocRef = doc(db!, COLLECTIONS.ORDENES_COMPRA, ordenCompraId)
    const ocSnap = await getDoc(ocRef)
    const ocData = ocSnap.data() as OrdenCompra

    const nuevaDeuda = ocData.deuda - monto
    const nuevoPagado = ocData.pagoDistribuidor + monto
    const nuevoEstado = nuevaDeuda === 0 ? 'pagado' : nuevaDeuda < ocData.costoTotal ? 'parcial' : 'pendiente'

    batch.update(ocRef, {
      deuda: nuevaDeuda,
      pagoDistribuidor: nuevoPagado,
      estado: nuevoEstado,
      updatedAt: Timestamp.now(),
    })

    // Actualizar distribuidor
    const distRef = doc(db!, COLLECTIONS.DISTRIBUIDORES, distribuidorId)
    const distSnap = await getDoc(distRef)
    const distData = distSnap.data() as Distribuidor

    batch.update(distRef, {
      deudaTotal: increment(-monto),
      totalPagado: increment(monto),
      historialPagos: [
        ...(distData.historialPagos || []),
        {
          fecha: Timestamp.now(),
          monto,
          bancoOrigen: bancoOrigenId,
          ordenCompraId,
        },
      ],
      updatedAt: Timestamp.now(),
    })

    // Actualizar banco
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, bancoOrigenId)
    batch.update(bancoRef, {
      capitalActual: increment(-monto),
      historicoGastos: increment(monto),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
  } catch (error) {
    logger.error('Error paying distribuidor', error, { context: 'FirestoreService' })
  }
}

// ============================================================
// CLIENTES
// ============================================================

/**
 * Crear un nuevo cliente en Firestore
 */
export const crearCliente = async (data: {
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  deudaTotal?: number
  totalPagado?: number
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearCliente: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Verificar si el cliente ya existe
    const clienteQuery = query(
      collection(db!, COLLECTIONS.CLIENTES),
      where('nombre', '==', data.nombre),
    )
    const existingCliente = await getDocs(clienteQuery)

    if (!existingCliente.empty) {
      throw new Error(`El cliente "${data.nombre}" ya existe`)
    }

    // Crear nuevo cliente
    const clienteRef = doc(collection(db!, COLLECTIONS.CLIENTES))
    batch.set(clienteRef, {
      nombre: data.nombre,
      empresa: data.empresa,
      telefono: data.telefono,
      email: data.email,
      direccion: data.direccion,
      deudaTotal: data.deudaTotal || 0,
      totalVentas: 0,
      totalPagado: data.totalPagado || 0,
      ventas: [],
      historialPagos: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Cliente creado exitosamente', { data: { id: clienteRef.id, nombre: data.nombre } })
    return clienteRef.id
  } catch (error) {
    logger.error('Error creating cliente', error, { context: 'FirestoreService' })
    throw error
  }
}

export const suscribirClientes = (callback: (clientes: Cliente[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.CLIENTES), orderBy('nombre'))
    return onSnapshot(
      q,
      (snapshot) => {
        const clientes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Cliente[]
        callback(clientes)
      },
      (error) => {
        logger.error('Error fetching clientes', error, { context: 'FirestoreService' })
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to clientes', error, { context: 'FirestoreService' })
    callback([])
    return () => {}
  }
}

export const cobrarCliente = async (clienteId: string, ventaId: string, monto: number) => {
  if (!isFirestoreAvailable()) {
    logger.warn('cobrarCliente: Firestore no disponible', { context: 'FirestoreService' })
    return
  }
  
  try {
    const batch = writeBatch(db!)

    // Obtener venta
    const ventaRef = doc(db!, COLLECTIONS.VENTAS, ventaId)
    const ventaSnap = await getDoc(ventaRef)
    const ventaData = ventaSnap.data() as Venta

    const nuevoRestante = ventaData.montoRestante - monto
    const nuevoPagado = ventaData.montoPagado + monto
    const nuevoEstado =
      nuevoRestante === 0 ? 'completo' : nuevoRestante < ventaData.precioTotalVenta ? 'parcial' : 'pendiente'

    batch.update(ventaRef, {
      montoRestante: nuevoRestante,
      montoPagado: nuevoPagado,
      estadoPago: nuevoEstado,
      updatedAt: Timestamp.now(),
    })

    // Actualizar cliente
    const clienteRef = doc(db!, COLLECTIONS.CLIENTES, clienteId)
    const clienteSnap = await getDoc(clienteRef)
    const clienteData = clienteSnap.data() as Cliente

    batch.update(clienteRef, {
      deudaTotal: increment(-monto),
      totalPagado: increment(monto),
      historialPagos: [
        ...(clienteData.historialPagos || []),
        {
          fecha: Timestamp.now(),
          monto,
          ventaId,
        },
      ],
      updatedAt: Timestamp.now(),
    })

    // Actualizar bancos (distribución proporcional)
    const proporcion = monto / ventaData.precioTotalVenta

    // Distribución a los 3 bancos (snake_case IDs)
    const bovedaMonteRef = doc(db!, COLLECTIONS.BANCOS, 'boveda_monte')
    batch.update(bovedaMonteRef, {
      capitalActual: increment(ventaData.distribucionBancos.bovedaMonte * proporcion),
      historicoIngresos: increment(ventaData.distribucionBancos.bovedaMonte * proporcion),
      updatedAt: Timestamp.now(),
    })

    const fletesRef = doc(db!, COLLECTIONS.BANCOS, 'flete_sur')
    batch.update(fletesRef, {
      capitalActual: increment(ventaData.distribucionBancos.fletes * proporcion),
      historicoIngresos: increment(ventaData.distribucionBancos.fletes * proporcion),
      updatedAt: Timestamp.now(),
    })

    const utilidadesRef = doc(db!, COLLECTIONS.BANCOS, 'utilidades')
    batch.update(utilidadesRef, {
      capitalActual: increment(ventaData.distribucionBancos.utilidades * proporcion),
      historicoIngresos: increment(ventaData.distribucionBancos.utilidades * proporcion), // ✅ FIX: Actualizar historicoIngresos
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
  } catch (error) {
    logger.error('Error collecting cliente', error, { context: 'FirestoreService' })
  }
}

/**
 * Actualizar un cliente existente
 */
export const actualizarCliente = async (clienteId: string, data: Partial<{
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  deudaTotal?: number
  totalVentas?: number
  totalPagado?: number
}>) => {
  if (!isFirestoreAvailable()) {
    logger.warn('actualizarCliente: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)
    const clienteRef = doc(db!, COLLECTIONS.CLIENTES, clienteId)
    
    batch.update(clienteRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Cliente actualizado exitosamente', { data: { id: clienteId } })
    return clienteId
  } catch (error) {
    logger.error('Error updating cliente', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Eliminar un cliente
 * ADVERTENCIA: Esto eliminará el cliente permanentemente
 */
export const eliminarCliente = async (clienteId: string) => {
  if (!isFirestoreAvailable()) {
    logger.warn('eliminarCliente: Firestore no disponible', { context: 'FirestoreService' })
    return false
  }
  
  try {
    const batch = writeBatch(db!)
    const clienteRef = doc(db!, COLLECTIONS.CLIENTES, clienteId)
    
    // Verificar si el cliente tiene ventas pendientes
    const ventasQuery = query(
      collection(db!, COLLECTIONS.VENTAS),
      where('clienteId', '==', clienteId),
      where('estadoPago', '!=', 'completo'),
    )
    const ventasPendientes = await getDocs(ventasQuery)
    
    if (!ventasPendientes.empty) {
      throw new Error('No se puede eliminar un cliente con ventas pendientes')
    }
    
    batch.delete(clienteRef)
    await batch.commit()
    
    logger.info('Cliente eliminado exitosamente', { data: { id: clienteId } })
    return true
  } catch (error) {
    logger.error('Error deleting cliente', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Actualizar una venta existente
 */
export const actualizarVenta = async (ventaId: string, data: Partial<Venta>) => {
  if (!isFirestoreAvailable()) {
    logger.warn('actualizarVenta: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)
    const ventaRef = doc(db!, COLLECTIONS.VENTAS, ventaId)
    
    batch.update(ventaRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Venta actualizada exitosamente', { data: { id: ventaId } })
    return ventaId
  } catch (error) {
    logger.error('Error updating venta', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Eliminar una venta
 * ADVERTENCIA: Esto eliminará la venta y revertirá las distribuciones bancarias
 */
export const eliminarVenta = async (ventaId: string) => {
  if (!isFirestoreAvailable()) {
    logger.warn('eliminarVenta: Firestore no disponible', { context: 'FirestoreService' })
    return false
  }
  
  try {
    const batch = writeBatch(db!)
    const ventaRef = doc(db!, COLLECTIONS.VENTAS, ventaId)
    
    // Obtener venta para revertir distribución
    const ventaSnap = await getDoc(ventaRef)
    if (!ventaSnap.exists()) {
      throw new Error('La venta no existe')
    }
    const ventaData = ventaSnap.data() as Venta
    
    // Solo revertir si la venta está pagada (completo o parcial)
    if (ventaData.estadoPago !== 'pendiente') {
      const proporcion = ventaData.montoPagado / ventaData.precioTotalVenta
      
      // Revertir distribución a los 3 bancos
      if (ventaData.distribucionBancos) {
        const bovedaMonteRef = doc(db!, COLLECTIONS.BANCOS, 'boveda_monte')
        batch.update(bovedaMonteRef, {
          capitalActual: increment(-ventaData.distribucionBancos.bovedaMonte * proporcion),
          historicoIngresos: increment(-ventaData.distribucionBancos.bovedaMonte * proporcion),
          updatedAt: Timestamp.now(),
        })

        const fletesRef = doc(db!, COLLECTIONS.BANCOS, 'flete_sur')
        batch.update(fletesRef, {
          capitalActual: increment(-ventaData.distribucionBancos.fletes * proporcion),
          historicoIngresos: increment(-ventaData.distribucionBancos.fletes * proporcion),
          updatedAt: Timestamp.now(),
        })

        const utilidadesRef = doc(db!, COLLECTIONS.BANCOS, 'utilidades')
        batch.update(utilidadesRef, {
          capitalActual: increment(-ventaData.distribucionBancos.utilidades * proporcion),
          updatedAt: Timestamp.now(),
        })
      }
      
      // Actualizar cliente
      if (ventaData.clienteId) {
        const clienteRef = doc(db!, COLLECTIONS.CLIENTES, ventaData.clienteId)
        batch.update(clienteRef, {
          deudaTotal: increment(-ventaData.montoRestante),
          totalVentas: increment(-ventaData.precioTotalVenta),
          totalPagado: increment(-ventaData.montoPagado),
          updatedAt: Timestamp.now(),
        })
      }
    }
    
    batch.delete(ventaRef)
    await batch.commit()
    
    logger.info('Venta eliminada exitosamente', { data: { id: ventaId } })
    return true
  } catch (error) {
    logger.error('Error deleting venta', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Actualizar una orden de compra existente
 */
export const actualizarOrdenCompra = async (ordenId: string, data: Partial<OrdenCompra>) => {
  if (!isFirestoreAvailable()) {
    logger.warn('actualizarOrdenCompra: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)
    const ordenRef = doc(db!, COLLECTIONS.ORDENES_COMPRA, ordenId)
    
    batch.update(ordenRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Orden de compra actualizada exitosamente', { data: { id: ordenId } })
    return ordenId
  } catch (error) {
    logger.error('Error updating orden de compra', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Eliminar una orden de compra
 */
export const eliminarOrdenCompra = async (ordenId: string) => {
  if (!isFirestoreAvailable()) {
    logger.warn('eliminarOrdenCompra: Firestore no disponible', { context: 'FirestoreService' })
    return false
  }
  
  try {
    const batch = writeBatch(db!)
    const ordenRef = doc(db!, COLLECTIONS.ORDENES_COMPRA, ordenId)
    
    batch.delete(ordenRef)
    await batch.commit()
    
    logger.info('Orden de compra eliminada exitosamente', { data: { id: ordenId } })
    return true
  } catch (error) {
    logger.error('Error deleting orden de compra', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Actualizar un producto del almacén
 */
export const actualizarProducto = async (productoId: string, data: Partial<Producto>) => {
  if (!isFirestoreAvailable()) {
    logger.warn('actualizarProducto: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)
    const productoRef = doc(db!, COLLECTIONS.ALMACEN, productoId)
    
    batch.update(productoRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Producto actualizado exitosamente', { data: { id: productoId } })
    return productoId
  } catch (error) {
    logger.error('Error updating producto', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Eliminar un producto del almacén
 */
export const eliminarProducto = async (productoId: string) => {
  if (!isFirestoreAvailable()) {
    logger.warn('eliminarProducto: Firestore no disponible', { context: 'FirestoreService' })
    return false
  }
  
  try {
    const batch = writeBatch(db!)
    const productoRef = doc(db!, COLLECTIONS.ALMACEN, productoId)
    
    batch.delete(productoRef)
    await batch.commit()
    
    logger.info('Producto eliminado exitosamente', { data: { id: productoId } })
    return true
  } catch (error) {
    logger.error('Error deleting producto', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Actualizar un distribuidor existente
 */
export const actualizarDistribuidor = async (distribuidorId: string, data: Partial<Distribuidor>) => {
  if (!isFirestoreAvailable()) {
    logger.warn('actualizarDistribuidor: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)
    const distribuidorRef = doc(db!, COLLECTIONS.DISTRIBUIDORES, distribuidorId)
    
    batch.update(distribuidorRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Distribuidor actualizado exitosamente', { data: { id: distribuidorId } })
    return distribuidorId
  } catch (error) {
    logger.error('Error updating distribuidor', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Eliminar un distribuidor
 */
export const eliminarDistribuidor = async (distribuidorId: string) => {
  if (!isFirestoreAvailable()) {
    logger.warn('eliminarDistribuidor: Firestore no disponible', { context: 'FirestoreService' })
    return false
  }
  
  try {
    const batch = writeBatch(db!)
    const distribuidorRef = doc(db!, COLLECTIONS.DISTRIBUIDORES, distribuidorId)
    
    // Verificar si tiene órdenes pendientes
    const ordenesQuery = query(
      collection(db!, COLLECTIONS.ORDENES_COMPRA),
      where('distribuidorId', '==', distribuidorId),
      where('estado', '!=', 'entregado'),
    )
    const ordenesPendientes = await getDocs(ordenesQuery)
    
    if (!ordenesPendientes.empty) {
      throw new Error('No se puede eliminar un distribuidor con órdenes pendientes')
    }
    
    batch.delete(distribuidorRef)
    await batch.commit()
    
    logger.info('Distribuidor eliminado exitosamente', { data: { id: distribuidorId } })
    return true
  } catch (error) {
    logger.error('Error deleting distribuidor', error, { context: 'FirestoreService' })
    throw error
  }
}

// ============================================================
// ALMACÉN
// ============================================================

export const suscribirAlmacen = (callback: (productos: Producto[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.ALMACEN), orderBy('nombre'))
    return onSnapshot(
      q,
      (snapshot) => {
        const productos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Producto[]
        callback(productos)
      },
      (error) => {
        logger.error('Error fetching almacen', error, { context: 'FirestoreService' })
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to almacen', error, { context: 'FirestoreService' })
    callback([])
    return () => {}
  }
}

/**
 * Suscribirse a entradas de almacén
 */
export const suscribirEntradasAlmacen = (callback: (entradas: unknown[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, 'almacen_entradas'), orderBy('fecha', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        const entradas = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        callback(entradas)
      },
      (error) => {
        logger.error('Error fetching almacen_entradas', error, { context: 'FirestoreService' })
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to almacen_entradas', error, { context: 'FirestoreService' })
    callback([])
    return () => {}
  }
}

/**
 * Suscribirse a salidas de almacén
 */
export const suscribirSalidasAlmacen = (callback: (salidas: unknown[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, 'almacen_salidas'), orderBy('fecha', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        const salidas = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        callback(salidas)
      },
      (error) => {
        logger.error('Error fetching almacen_salidas', error, { context: 'FirestoreService' })
        callback([])
      },
    )
  } catch (error) {
    logger.error('Error subscribing to almacen_salidas', error, { context: 'FirestoreService' })
    callback([])
    return () => {}
  }
}

/**
 * Crear un nuevo producto en el almacén
 */
export const crearProducto = async (data: {
  nombre: string
  categoria?: string
  origen?: string
  unidad?: string
  stockInicial?: number
  valorUnitario?: number
  stockMinimo?: number
  descripcion?: string
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearProducto: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Verificar si el producto ya existe
    const prodQuery = query(
      collection(db!, COLLECTIONS.ALMACEN),
      where('nombre', '==', data.nombre),
    )
    const existingProd = await getDocs(prodQuery)

    if (!existingProd.empty) {
      throw new Error(`El producto "${data.nombre}" ya existe en el almacén`)
    }

    // Crear nuevo producto
    const prodRef = doc(collection(db!, COLLECTIONS.ALMACEN))
    batch.set(prodRef, {
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
      entradas: data.stockInicial ? [{
        id: `inicial-${Date.now()}`,
        fecha: Timestamp.now(),
        cantidad: data.stockInicial,
        origen: 'Inventario Inicial',
        tipo: 'entrada',
      }] : [],
      salidas: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Producto creado exitosamente', { data: { id: prodRef.id, nombre: data.nombre } })
    return prodRef.id
  } catch (error) {
    logger.error('Error creating producto', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Registrar una entrada al almacén
 */
export const crearEntradaAlmacen = async (data: {
  productoId: string
  cantidad: number
  origen: string
  costoUnitario?: number
  ordenCompraId?: string
  notas?: string
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearEntradaAlmacen: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Obtener producto
    const prodRef = doc(db!, COLLECTIONS.ALMACEN, data.productoId)
    const prodSnap = await getDoc(prodRef)

    if (!prodSnap.exists()) {
      throw new Error('Producto no encontrado')
    }

    const prodData = prodSnap.data()
    const entradaId = `entrada-${Date.now()}`

    // Actualizar producto
    batch.update(prodRef, {
      stockActual: increment(data.cantidad),
      totalEntradas: increment(data.cantidad),
      valorUnitario: data.costoUnitario || prodData.valorUnitario,
      entradas: [
        ...(prodData.entradas || []),
        {
          id: entradaId,
          fecha: Timestamp.now(),
          cantidad: data.cantidad,
          origen: data.origen,
          costoUnitario: data.costoUnitario || 0,
          ordenCompraId: data.ordenCompraId || null,
          notas: data.notas || '',
          tipo: 'entrada',
        },
      ],
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Entrada de almacén registrada', { data: { productoId: data.productoId, cantidad: data.cantidad } })
    return entradaId
  } catch (error) {
    logger.error('Error creating entrada almacen', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Registrar una salida del almacén
 */
export const crearSalidaAlmacen = async (data: {
  productoId: string
  cantidad: number
  destino: string
  ventaId?: string
  motivo?: string
  notas?: string
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearSalidaAlmacen: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Obtener producto
    const prodRef = doc(db!, COLLECTIONS.ALMACEN, data.productoId)
    const prodSnap = await getDoc(prodRef)

    if (!prodSnap.exists()) {
      throw new Error('Producto no encontrado')
    }

    const prodData = prodSnap.data()

    // Validar stock
    if (prodData.stockActual < data.cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${prodData.stockActual}, Solicitado: ${data.cantidad}`)
    }

    const salidaId = `salida-${Date.now()}`

    // Actualizar producto
    batch.update(prodRef, {
      stockActual: increment(-data.cantidad),
      totalSalidas: increment(data.cantidad),
      salidas: [
        ...(prodData.salidas || []),
        {
          id: salidaId,
          fecha: Timestamp.now(),
          cantidad: data.cantidad,
          destino: data.destino,
          ventaId: data.ventaId || null,
          motivo: data.motivo || 'Salida manual',
          notas: data.notas || '',
          tipo: 'salida',
        },
      ],
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Salida de almacén registrada', { data: { productoId: data.productoId, cantidad: data.cantidad } })
    return salidaId
  } catch (error) {
    logger.error('Error creating salida almacen', error, { context: 'FirestoreService' })
    throw error
  }
}

// ============================================================
// INGRESOS / GASTOS
// ============================================================

/**
 * Crear un ingreso en el sistema
 */
export const crearIngreso = async (data: {
  monto: number
  concepto: string
  bancoDestino: string
  categoria?: string
  referencia?: string
  notas?: string
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearIngreso: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    // Asegurar que el banco existe
    await ensureBancoExists(data.bancoDestino)
    
    const batch = writeBatch(db!)

    // Crear documento de ingreso
    const ingresoRef = doc(collection(db!, 'ingresos'))
    batch.set(ingresoRef, {
      id: ingresoRef.id,
      monto: data.monto,
      concepto: data.concepto,
      bancoDestino: data.bancoDestino,
      categoria: data.categoria || 'General',
      referencia: data.referencia || '',
      notas: data.notas || '',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Actualizar banco destino
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, data.bancoDestino)
    batch.update(bancoRef, {
      capitalActual: increment(data.monto),
      historicoIngresos: increment(data.monto),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Ingreso creado exitosamente', { data: { id: ingresoRef.id, monto: data.monto } })
    return ingresoRef.id
  } catch (error) {
    logger.error('Error creating ingreso', error, { context: 'FirestoreService' })
    throw error
  }
}

/**
 * Crear un gasto en el sistema
 */
export const crearGasto = async (data: {
  monto: number
  concepto: string
  bancoOrigen: string
  categoria?: string
  referencia?: string
  notas?: string
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn('crearGasto: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    // Asegurar que el banco existe
    await ensureBancoExists(data.bancoOrigen)
    
    const batch = writeBatch(db!)

    // Crear documento de gasto
    const gastoRef = doc(collection(db!, 'gastos'))
    batch.set(gastoRef, {
      id: gastoRef.id,
      monto: data.monto,
      concepto: data.concepto,
      bancoOrigen: data.bancoOrigen,
      categoria: data.categoria || 'General',
      referencia: data.referencia || '',
      notas: data.notas || '',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Actualizar banco origen
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, data.bancoOrigen)
    batch.update(bancoRef, {
      capitalActual: increment(-data.monto),
      historicoGastos: increment(data.monto),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Gasto creado exitosamente', { data: { id: gastoRef.id, monto: data.monto } })
    return gastoRef.id
  } catch (error) {
    logger.error('Error creating gasto', error, { context: 'FirestoreService' })
    throw error
  }
}

// ============================================================
// TRANSFERENCIAS
// ============================================================

export interface TransferenciaData {
  bancoOrigenId: string
  bancoDestinoId: string
  monto: number
  concepto: string
  referencia?: string
  notas?: string
}

export const addTransferencia = async (data: TransferenciaData): Promise<string | null> => {
  if (!isFirestoreAvailable()) {
    logger.warn('addTransferencia: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    // Asegurar que ambos bancos existen
    await Promise.all([
      ensureBancoExists(data.bancoOrigenId),
      ensureBancoExists(data.bancoDestinoId),
    ])
    
    const batch = writeBatch(db!)

    // Crear documento en colección transferencias
    const transRef = doc(collection(db!, COLLECTIONS.TRANSFERENCIAS))
    batch.set(transRef, {
      id: transRef.id,
      bancoOrigenId: data.bancoOrigenId,
      bancoDestinoId: data.bancoDestinoId,
      monto: data.monto,
      concepto: data.concepto,
      referencia: data.referencia || '',
      notas: data.notas || '',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Actualizar banco origen
    const origenRef = doc(db!, COLLECTIONS.BANCOS, data.bancoOrigenId)
    batch.update(origenRef, {
      capitalActual: increment(-data.monto),
      historicoTransferencias: increment(data.monto),
      updatedAt: Timestamp.now(),
    })

    // Actualizar banco destino
    const destinoRef = doc(db!, COLLECTIONS.BANCOS, data.bancoDestinoId)
    batch.update(destinoRef, {
      capitalActual: increment(data.monto),
      historicoIngresos: increment(data.monto),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Transferencia creada exitosamente', { data: { id: transRef.id, monto: data.monto } })
    return transRef.id
  } catch (error) {
    logger.error('Error creating transferencia', error, { context: 'FirestoreService' })
    throw error
  }
}

// Mantener compatibilidad con función anterior
export const crearTransferencia = async (
  bancoOrigenId: string,
  bancoDestinoId: string,
  monto: number,
  concepto: string,
) => {
  return addTransferencia({ bancoOrigenId, bancoDestinoId, monto, concepto })
}

// ============================================================
// ABONOS
// ============================================================

export interface AbonoData {
  tipo: 'distribuidor' | 'cliente'
  entidadId: string
  monto: number
  bancoDestino: string
  metodo: 'efectivo' | 'transferencia' | 'cheque'
  referencia?: string
  notas?: string
}

export const addAbono = async (data: AbonoData): Promise<string | null> => {
  if (!isFirestoreAvailable()) {
    logger.warn('addAbono: Firestore no disponible', { context: 'FirestoreService' })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Crear documento en colección abonos
    const abonoRef = doc(collection(db!, COLLECTIONS.ABONOS))
    batch.set(abonoRef, {
      id: abonoRef.id,
      tipo: data.tipo,
      entidadId: data.entidadId,
      monto: data.monto,
      bancoDestino: data.bancoDestino,
      metodo: data.metodo,
      referencia: data.referencia || '',
      notas: data.notas || '',
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Actualizar entidad (distribuidor o cliente)
    if (data.tipo === 'distribuidor') {
      const distRef = doc(db!, COLLECTIONS.DISTRIBUIDORES, data.entidadId)
      const distSnap = await getDoc(distRef)
      if (distSnap.exists()) {
        const distData = distSnap.data()
        batch.update(distRef, {
          deudaTotal: increment(-data.monto),
          totalPagado: increment(data.monto),
          historialPagos: [
            ...(distData.historialPagos || []),
            {
              fecha: Timestamp.now(),
              monto: data.monto,
              bancoDestino: data.bancoDestino,
              abonoId: abonoRef.id,
            },
          ],
          updatedAt: Timestamp.now(),
        })
      }
    } else {
      const clienteRef = doc(db!, COLLECTIONS.CLIENTES, data.entidadId)
      const clienteSnap = await getDoc(clienteRef)
      if (clienteSnap.exists()) {
        const clienteData = clienteSnap.data()
        batch.update(clienteRef, {
          deudaTotal: increment(-data.monto),
          totalPagado: increment(data.monto),
          historialPagos: [
            ...(clienteData.historialPagos || []),
            {
              fecha: Timestamp.now(),
              monto: data.monto,
              abonoId: abonoRef.id,
            },
          ],
          updatedAt: Timestamp.now(),
        })
      }
    }

    // Actualizar banco destino (ingreso)
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, data.bancoDestino)
    batch.update(bancoRef, {
      capitalActual: increment(data.monto),
      historicoIngresos: increment(data.monto),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info('Abono creado exitosamente', { data: { id: abonoRef.id, monto: data.monto, tipo: data.tipo } })
    return abonoRef.id
  } catch (error) {
    logger.error('Error creating abono', error, { context: 'FirestoreService' })
    throw error
  }
}

// ============================================================================
// FUNCIONES AUXILIARES PARA AI (wrappers síncronos-promesas)
// ============================================================================

/**
 * Obtener todos los bancos como promesa (para uso en AI tools)
 */
export const obtenerBancos = (): Promise<Banco[]> => {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = suscribirBancos((bancos) => {
        unsubscribe() // Desuscribirse inmediatamente
        resolve(bancos)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Obtener todas las ventas como promesa (para uso en AI tools)
 */
export const obtenerVentas = (): Promise<Venta[]> => {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = suscribirVentas((ventas) => {
        unsubscribe() // Desuscribirse inmediatamente
        resolve(ventas)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Obtener todos los clientes como promesa (para uso en AI tools)
 */
export const obtenerClientes = (): Promise<Cliente[]> => {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = suscribirClientes((clientes) => {
        unsubscribe() // Desuscribirse inmediatamente
        resolve(clientes)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Obtener todas las órdenes de compra como promesa (para uso en AI tools)
 */
export const obtenerOrdenesCompra = (): Promise<OrdenCompra[]> => {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = suscribirOrdenesCompra((ordenes) => {
        unsubscribe() // Desuscribirse inmediatamente
        resolve(ordenes)
      })
    } catch (error) {
      reject(error)
    }
  })
}

export const firestoreService = {
  // Bancos
  suscribirBancos,
  obtenerBanco,
  actualizarCapitalBanco,
  // Órdenes de Compra
  crearOrdenCompra,
  suscribirOrdenesCompra,
  actualizarOrdenCompra,
  eliminarOrdenCompra,
  // Ventas
  crearVenta,
  suscribirVentas,
  actualizarVenta,
  eliminarVenta,
  // Distribuidores
  crearDistribuidor,
  suscribirDistribuidores,
  pagarDistribuidor,
  actualizarDistribuidor,
  eliminarDistribuidor,
  // Clientes
  crearCliente,
  suscribirClientes,
  cobrarCliente,
  actualizarCliente,
  eliminarCliente,
  // Almacén
  suscribirAlmacen,
  crearProducto,
  crearEntradaAlmacen,
  crearSalidaAlmacen,
  actualizarProducto,
  eliminarProducto,
  // Ingresos y Gastos
  crearIngreso,
  crearGasto,
  // Transferencias y Abonos
  crearTransferencia,
  addTransferencia,
  addAbono,
}
