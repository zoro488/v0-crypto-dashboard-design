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
  type Firestore,
} from "firebase/firestore"
import { db } from "./config"
import type { Banco, OrdenCompra, Venta, Distribuidor, Cliente, Producto } from "@/app/types"
import { logger } from "../utils/logger"

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
  BANCOS: "bancos",
  ORDENES_COMPRA: "ordenes_compra",
  VENTAS: "ventas",
  DISTRIBUIDORES: "distribuidores",
  CLIENTES: "clientes",
  PRODUCTOS: "almacen_productos",
  ALMACEN: "almacen",
  ALMACEN_PRODUCTOS: "almacen_productos",
  ALMACEN_ENTRADAS: "almacen_entradas",
  ALMACEN_SALIDAS: "almacen_salidas",
  MOVIMIENTOS: "movimientos",
  TRANSFERENCIAS: "transferencias",
  ABONOS: "abonos",
  CORTES_BANCARIOS: "cortes_bancarios",
  INGRESOS: "ingresos",
  GASTOS: "gastos",
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
    const q = query(collection(db!, COLLECTIONS.BANCOS), orderBy("createdAt"))
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
        logger.error("Error fetching bancos", error, { context: "FirestoreService" })
        // Return empty array on error
        callback([])
      },
    )
  } catch (error) {
    logger.error("Error subscribing to bancos", error, { context: "FirestoreService" })
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
    logger.error("Error fetching banco", error, { context: "FirestoreService" })
    return null
  }
}

export const actualizarCapitalBanco = async (
  bancoId: string,
  monto: number,
  tipo: "ingreso" | "gasto" | "transferencia",
) => {
  if (!isFirestoreAvailable()) {
    logger.warn("actualizarCapitalBanco: Firestore no disponible", { context: "FirestoreService" })
    return
  }
  
  try {
    const bancoRef = doc(db!, COLLECTIONS.BANCOS, bancoId)
    const batch = writeBatch(db!)

    if (tipo === "ingreso") {
      batch.update(bancoRef, {
        capitalActual: increment(monto),
        historicoIngresos: increment(monto),
        updatedAt: Timestamp.now(),
      })
    } else if (tipo === "gasto") {
      batch.update(bancoRef, {
        capitalActual: increment(-monto),
        historicoGastos: increment(monto),
        updatedAt: Timestamp.now(),
      })
    }

    await batch.commit()
  } catch (error) {
    logger.error("Error updating banco capital", error, { context: "FirestoreService" })
  }
}

// ============================================================
// ÓRDENES DE COMPRA
// ============================================================

// Tipo flexible para crear órdenes - solo requiere campos esenciales
type CrearOrdenCompraInput = Partial<Omit<OrdenCompra, "id">> & {
  distribuidor: string
  cantidad: number
  costoTotal?: number
}

export const crearOrdenCompra = async (data: CrearOrdenCompraInput) => {
  if (!isFirestoreAvailable()) {
    logger.warn("crearOrdenCompra: Firestore no disponible", { context: "FirestoreService" })
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
      estado: data.estado || "pendiente",
    }

    // Crear orden de compra
    const ocRef = doc(collection(db!, COLLECTIONS.ORDENES_COMPRA))
    batch.set(ocRef, {
      ...ordenCompleta,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Crear o actualizar distribuidor
    const distQuery = query(collection(db!, COLLECTIONS.DISTRIBUIDORES), where("nombre", "==", ordenCompleta.distribuidor))
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
    const prodQuery = query(collection(db!, COLLECTIONS.ALMACEN), where("nombre", "==", ordenCompleta.producto))
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
            tipo: "entrada",
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
            tipo: "entrada",
          },
        ],
        updatedAt: Timestamp.now(),
      })
    }

    // Si hay pago, actualizar banco
    if ((ordenCompleta.pagoDistribuidor || 0) > 0 && ordenCompleta.bancoOrigen) {
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
    logger.error("Error creating orden de compra", error, { context: "FirestoreService" })
    return null
  }
}

export const suscribirOrdenesCompra = (callback: (ordenes: OrdenCompra[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.ORDENES_COMPRA), orderBy("fecha", "desc"))
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
        logger.error("Error fetching ordenes compra", error, { context: "FirestoreService" })
        callback([])
      },
    )
  } catch (error) {
    logger.error("Error subscribing to ordenes compra", error, { context: "FirestoreService" })
    callback([])
    return () => {}
  }
}

// ============================================================
// VENTAS
// ============================================================

// Tipo flexible para crear ventas - solo requiere campos esenciales
type CrearVentaInput = Partial<Omit<Venta, "id">> & {
  cliente: string
  cantidad: number
  precioTotalVenta?: number
  producto?: string
}

export const crearVenta = async (data: CrearVentaInput) => {
  if (!isFirestoreAvailable()) {
    logger.warn("crearVenta: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Validar stock disponible
    const prodQuery = query(collection(db!, COLLECTIONS.ALMACEN), where("nombre", "==", data.producto))
    const prodSnapshot = await getDocs(prodQuery)

    if (prodSnapshot.empty) {
      throw new Error("Producto no encontrado en almacén")
    }

    const prodData = prodSnapshot.docs[0].data()
    if (prodData.stockActual < data.cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${prodData.stockActual}, Solicitado: ${data.cantidad}`)
    }

    // Completar campos faltantes con valores por defecto
    const ventaCompleta = {
      ...data,
      clienteId: data.clienteId || data.cliente?.toLowerCase().replace(/\s+/g, '_') || '',
      keywords: data.keywords || [data.cliente?.toLowerCase(), data.producto?.toLowerCase()].filter(Boolean) as string[],
      precioVenta: data.precioVenta || data.precioTotalVenta || 0,
      ingreso: data.ingreso || data.precioTotalVenta || 0,
      totalVenta: data.totalVenta || data.precioTotalVenta || 0,
      flete: data.flete || "NoAplica",
      fleteUtilidad: data.fleteUtilidad || data.precioFlete || 0,
      precioFlete: data.precioFlete || 0,
      utilidad: data.utilidad || 0,
      bovedaMonte: data.bovedaMonte || data.distribucionBancos?.bovedaMonte || 0,
      estatus: data.estatus || (data.estadoPago === "completo" ? "Pagado" : data.estadoPago === "parcial" ? "Parcial" : "Pendiente"),
      estadoPago: data.estadoPago || "pendiente",
      montoPagado: data.montoPagado || 0,
      montoRestante: data.montoRestante || (data.precioTotalVenta || 0) - (data.montoPagado || 0),
      adeudo: data.adeudo || (data.precioTotalVenta || 0) - (data.montoPagado || 0),
      ocRelacionada: data.ocRelacionada || "",
    }

    // Crear venta
    const ventaRef = doc(collection(db!, COLLECTIONS.VENTAS))
    batch.set(ventaRef, {
      ...ventaCompleta,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Crear o actualizar cliente
    const clienteQuery = query(collection(db!, COLLECTIONS.CLIENTES), where("nombre", "==", ventaCompleta.cliente))
    const clienteSnapshot = await getDocs(clienteQuery)

    let clienteId: string

    if (clienteSnapshot.empty) {
      // Crear nuevo cliente
      const clienteRef = doc(collection(db!, COLLECTIONS.CLIENTES))
      clienteId = clienteRef.id
      batch.set(clienteRef, {
        nombre: ventaCompleta.cliente,
        deudaTotal: ventaCompleta.montoRestante || 0,
        totalVentas: ventaCompleta.precioTotalVenta || 0,
        totalPagado: ventaCompleta.montoPagado || 0,
        ventas: [ventaRef.id],
        historialPagos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar cliente existente
      clienteId = clienteSnapshot.docs[0].id
      const clienteRef = doc(db!, COLLECTIONS.CLIENTES, clienteId)
      batch.update(clienteRef, {
        deudaTotal: increment(ventaCompleta.montoRestante || 0),
        totalVentas: increment(ventaCompleta.precioTotalVenta || 0),
        totalPagado: increment(ventaCompleta.montoPagado || 0),
        ventas: [...(clienteSnapshot.docs[0].data().ventas || []), ventaRef.id],
        updatedAt: Timestamp.now(),
      })
    }

    // Actualizar almacén (crear salida)
    const prodRef = doc(db!, COLLECTIONS.ALMACEN, prodSnapshot.docs[0].id)
    batch.update(prodRef, {
      stockActual: increment(-ventaCompleta.cantidad),
      totalSalidas: increment(ventaCompleta.cantidad),
      salidas: [
        ...(prodData.salidas || []),
        {
          id: ventaRef.id,
          fecha: ventaCompleta.fecha,
          cantidad: ventaCompleta.cantidad,
          destino: ventaCompleta.cliente,
          tipo: "salida",
        },
      ],
      updatedAt: Timestamp.now(),
    })

    // Actualizar bancos (distribución proporcional)
    const precioTotal = ventaCompleta.precioTotalVenta || ventaCompleta.ingreso || 0
    const montoPagado = ventaCompleta.montoPagado || 0
    const proporcion = precioTotal > 0 ? montoPagado / precioTotal : 0

    const distribucion = ventaCompleta.distribucionBancos || { bovedaMonte: 0, fletes: 0, utilidades: 0 }

    // Bóveda Monte
    const bovedaMonteRef = doc(db!, COLLECTIONS.BANCOS, "boveda_monte")
    batch.update(bovedaMonteRef, {
      capitalActual: increment((distribucion.bovedaMonte || 0) * proporcion),
      historicoIngresos: increment(distribucion.bovedaMonte || 0),
      updatedAt: Timestamp.now(),
    })

    // Fletes
    const fletesRef = doc(db!, COLLECTIONS.BANCOS, "flete_sur")
    batch.update(fletesRef, {
      capitalActual: increment((distribucion.fletes || 0) * proporcion),
      historicoIngresos: increment(distribucion.fletes || 0),
      updatedAt: Timestamp.now(),
    })

    // Utilidades
    const utilidadesRef = doc(db!, COLLECTIONS.BANCOS, "utilidades")
    batch.update(utilidadesRef, {
      capitalActual: increment((distribucion.utilidades || 0) * proporcion),
      historicoIngresos: increment(distribucion.utilidades || 0),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    return ventaRef.id
  } catch (error) {
    logger.error("Error creating venta", error, { context: "FirestoreService" })
    return null
  }
}

export const suscribirVentas = (callback: (ventas: Venta[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.VENTAS), orderBy("fecha", "desc"))
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
        logger.error("Error fetching ventas", error, { context: "FirestoreService" })
        callback([])
      },
    )
  } catch (error) {
    logger.error("Error subscribing to ventas", error, { context: "FirestoreService" })
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
    logger.warn("crearDistribuidor: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Verificar si el distribuidor ya existe
    const distQuery = query(
      collection(db!, COLLECTIONS.DISTRIBUIDORES),
      where("nombre", "==", data.nombre)
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
    logger.info("Distribuidor creado exitosamente", { data: { id: distRef.id, nombre: data.nombre } })
    return distRef.id
  } catch (error) {
    logger.error("Error creating distribuidor", error, { context: "FirestoreService" })
    throw error
  }
}

export const suscribirDistribuidores = (callback: (distribuidores: Distribuidor[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.DISTRIBUIDORES), orderBy("nombre"))
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
        logger.error("Error fetching distribuidores", error, { context: "FirestoreService" })
        callback([])
      },
    )
  } catch (error) {
    logger.error("Error subscribing to distribuidores", error, { context: "FirestoreService" })
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
    logger.warn("pagarDistribuidor: Firestore no disponible", { context: "FirestoreService" })
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
    const nuevoEstado = nuevaDeuda === 0 ? "pagado" : nuevaDeuda < ocData.costoTotal ? "parcial" : "pendiente"

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
    logger.error("Error paying distribuidor", error, { context: "FirestoreService" })
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
}) => {
  if (!isFirestoreAvailable()) {
    logger.warn("crearCliente: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Verificar si el cliente ya existe
    const clienteQuery = query(
      collection(db!, COLLECTIONS.CLIENTES),
      where("nombre", "==", data.nombre)
    )
    const existingCliente = await getDocs(clienteQuery)

    if (!existingCliente.empty) {
      throw new Error(`El cliente "${data.nombre}" ya existe`)
    }

    // Crear nuevo cliente
    const clienteRef = doc(collection(db!, COLLECTIONS.CLIENTES))
    batch.set(clienteRef, {
      ...data,
      deudaTotal: 0,
      totalVentas: 0,
      totalPagado: 0,
      ventas: [],
      historialPagos: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info("Cliente creado exitosamente", { data: { id: clienteRef.id, nombre: data.nombre } })
    return clienteRef.id
  } catch (error) {
    logger.error("Error creating cliente", error, { context: "FirestoreService" })
    throw error
  }
}

export const suscribirClientes = (callback: (clientes: Cliente[]) => void) => {
  if (!isFirestoreAvailable()) {
    callback([])
    return () => {}
  }
  
  try {
    const q = query(collection(db!, COLLECTIONS.CLIENTES), orderBy("nombre"))
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
        logger.error("Error fetching clientes", error, { context: "FirestoreService" })
        callback([])
      },
    )
  } catch (error) {
    logger.error("Error subscribing to clientes", error, { context: "FirestoreService" })
    callback([])
    return () => {}
  }
}

export const cobrarCliente = async (clienteId: string, ventaId: string, monto: number) => {
  if (!isFirestoreAvailable()) {
    logger.warn("cobrarCliente: Firestore no disponible", { context: "FirestoreService" })
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
      nuevoRestante === 0 ? "completo" : nuevoRestante < ventaData.precioTotalVenta ? "parcial" : "pendiente"

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

    const bovedaMonteRef = doc(db!, COLLECTIONS.BANCOS, "bovedaMonte")
    batch.update(bovedaMonteRef, {
      capitalActual: increment(ventaData.distribucionBancos.bovedaMonte * proporcion),
      updatedAt: Timestamp.now(),
    })

    const fletesRef = doc(db!, COLLECTIONS.BANCOS, "fletes")
    batch.update(fletesRef, {
      capitalActual: increment(ventaData.distribucionBancos.fletes * proporcion),
      updatedAt: Timestamp.now(),
    })

    const utilidadesRef = doc(db!, COLLECTIONS.BANCOS, "utilidades")
    batch.update(utilidadesRef, {
      capitalActual: increment(ventaData.distribucionBancos.utilidades * proporcion),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
  } catch (error) {
    logger.error("Error collecting cliente", error, { context: "FirestoreService" })
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
    const q = query(collection(db!, COLLECTIONS.ALMACEN), orderBy("nombre"))
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
        logger.error("Error fetching almacen", error, { context: "FirestoreService" })
        callback([])
      },
    )
  } catch (error) {
    logger.error("Error subscribing to almacen", error, { context: "FirestoreService" })
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
    logger.warn("crearProducto: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Verificar si el producto ya existe
    const prodQuery = query(
      collection(db!, COLLECTIONS.ALMACEN),
      where("nombre", "==", data.nombre)
    )
    const existingProd = await getDocs(prodQuery)

    if (!existingProd.empty) {
      throw new Error(`El producto "${data.nombre}" ya existe en el almacén`)
    }

    // Crear nuevo producto
    const prodRef = doc(collection(db!, COLLECTIONS.ALMACEN))
    batch.set(prodRef, {
      nombre: data.nombre,
      categoria: data.categoria || "General",
      origen: data.origen || "",
      unidad: data.unidad || "unidades",
      stockActual: data.stockInicial || 0,
      stockMinimo: data.stockMinimo || 0,
      valorUnitario: data.valorUnitario || 0,
      totalEntradas: data.stockInicial || 0,
      totalSalidas: 0,
      descripcion: data.descripcion || "",
      entradas: data.stockInicial ? [{
        id: `inicial-${Date.now()}`,
        fecha: Timestamp.now(),
        cantidad: data.stockInicial,
        origen: "Inventario Inicial",
        tipo: "entrada",
      }] : [],
      salidas: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info("Producto creado exitosamente", { data: { id: prodRef.id, nombre: data.nombre } })
    return prodRef.id
  } catch (error) {
    logger.error("Error creating producto", error, { context: "FirestoreService" })
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
    logger.warn("crearEntradaAlmacen: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Obtener producto
    const prodRef = doc(db!, COLLECTIONS.ALMACEN, data.productoId)
    const prodSnap = await getDoc(prodRef)

    if (!prodSnap.exists()) {
      throw new Error("Producto no encontrado")
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
          notas: data.notas || "",
          tipo: "entrada",
        },
      ],
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info("Entrada de almacén registrada", { data: { productoId: data.productoId, cantidad: data.cantidad } })
    return entradaId
  } catch (error) {
    logger.error("Error creating entrada almacen", error, { context: "FirestoreService" })
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
    logger.warn("crearSalidaAlmacen: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Obtener producto
    const prodRef = doc(db!, COLLECTIONS.ALMACEN, data.productoId)
    const prodSnap = await getDoc(prodRef)

    if (!prodSnap.exists()) {
      throw new Error("Producto no encontrado")
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
          motivo: data.motivo || "Salida manual",
          notas: data.notas || "",
          tipo: "salida",
        },
      ],
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
    logger.info("Salida de almacén registrada", { data: { productoId: data.productoId, cantidad: data.cantidad } })
    return salidaId
  } catch (error) {
    logger.error("Error creating salida almacen", error, { context: "FirestoreService" })
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
    logger.warn("crearIngreso: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Crear documento de ingreso
    const ingresoRef = doc(collection(db!, "ingresos"))
    batch.set(ingresoRef, {
      id: ingresoRef.id,
      monto: data.monto,
      concepto: data.concepto,
      bancoDestino: data.bancoDestino,
      categoria: data.categoria || "General",
      referencia: data.referencia || "",
      notas: data.notas || "",
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
    logger.info("Ingreso creado exitosamente", { data: { id: ingresoRef.id, monto: data.monto } })
    return ingresoRef.id
  } catch (error) {
    logger.error("Error creating ingreso", error, { context: "FirestoreService" })
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
    logger.warn("crearGasto: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Crear documento de gasto
    const gastoRef = doc(collection(db!, "gastos"))
    batch.set(gastoRef, {
      id: gastoRef.id,
      monto: data.monto,
      concepto: data.concepto,
      bancoOrigen: data.bancoOrigen,
      categoria: data.categoria || "General",
      referencia: data.referencia || "",
      notas: data.notas || "",
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
    logger.info("Gasto creado exitosamente", { data: { id: gastoRef.id, monto: data.monto } })
    return gastoRef.id
  } catch (error) {
    logger.error("Error creating gasto", error, { context: "FirestoreService" })
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
    logger.warn("addTransferencia: Firestore no disponible", { context: "FirestoreService" })
    return null
  }
  
  try {
    const batch = writeBatch(db!)

    // Crear documento en colección transferencias
    const transRef = doc(collection(db!, COLLECTIONS.TRANSFERENCIAS))
    batch.set(transRef, {
      id: transRef.id,
      bancoOrigenId: data.bancoOrigenId,
      bancoDestinoId: data.bancoDestinoId,
      monto: data.monto,
      concepto: data.concepto,
      referencia: data.referencia || "",
      notas: data.notas || "",
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
    logger.info("Transferencia creada exitosamente", { data: { id: transRef.id, monto: data.monto } })
    return transRef.id
  } catch (error) {
    logger.error("Error creating transferencia", error, { context: "FirestoreService" })
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
  tipo: "distribuidor" | "cliente"
  entidadId: string
  monto: number
  bancoDestino: string
  metodo: "efectivo" | "transferencia" | "cheque"
  referencia?: string
  notas?: string
}

export const addAbono = async (data: AbonoData): Promise<string | null> => {
  if (!isFirestoreAvailable()) {
    logger.warn("addAbono: Firestore no disponible", { context: "FirestoreService" })
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
      referencia: data.referencia || "",
      notas: data.notas || "",
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Actualizar entidad (distribuidor o cliente)
    if (data.tipo === "distribuidor") {
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
    logger.info("Abono creado exitosamente", { data: { id: abonoRef.id, monto: data.monto, tipo: data.tipo } })
    return abonoRef.id
  } catch (error) {
    logger.error("Error creating abono", error, { context: "FirestoreService" })
    throw error
  }
}

export const firestoreService = {
  // Bancos
  suscribirBancos,
  obtenerBanco,
  actualizarCapitalBanco,
  // Órdenes de Compra
  crearOrdenCompra,
  suscribirOrdenesCompra,
  // Ventas
  crearVenta,
  suscribirVentas,
  // Distribuidores
  crearDistribuidor,
  suscribirDistribuidores,
  pagarDistribuidor,
  // Clientes
  crearCliente,
  suscribirClientes,
  cobrarCliente,
  // Almacén
  suscribirAlmacen,
  crearProducto,
  crearEntradaAlmacen,
  crearSalidaAlmacen,
  // Ingresos y Gastos
  crearIngreso,
  crearGasto,
  // Transferencias y Abonos
  crearTransferencia,
  addTransferencia,
  addAbono,
}
