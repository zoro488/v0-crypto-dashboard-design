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
} from "firebase/firestore"
import { db } from "./config"
import type { Banco, OrdenCompra, Venta, Distribuidor, Cliente, Producto } from "@/frontend/app/types"
import { logger } from "../utils/logger"

// ============================================================
// COLECCIONES
// ============================================================
const COLLECTIONS = {
  BANCOS: "bancos",
  ORDENES_COMPRA: "ordenesCompra",
  VENTAS: "ventas",
  DISTRIBUIDORES: "distribuidores",
  CLIENTES: "clientes",
  PRODUCTOS: "productos",
  ALMACEN: "almacen",
}

// ============================================================
// BANCOS
// ============================================================

export const suscribirBancos = (callback: (bancos: Banco[]) => void) => {
  try {
    const q = query(collection(db, COLLECTIONS.BANCOS), orderBy("createdAt"))
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
  try {
    const docRef = doc(db, COLLECTIONS.BANCOS, bancoId)
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
  try {
    const bancoRef = doc(db, COLLECTIONS.BANCOS, bancoId)
    const batch = writeBatch(db)

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

export const crearOrdenCompra = async (data: Omit<OrdenCompra, "id">) => {
  try {
    const batch = writeBatch(db)

    // Crear orden de compra
    const ocRef = doc(collection(db, COLLECTIONS.ORDENES_COMPRA))
    batch.set(ocRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Crear o actualizar distribuidor
    const distQuery = query(collection(db, COLLECTIONS.DISTRIBUIDORES), where("nombre", "==", data.distribuidor))
    const distSnapshot = await getDocs(distQuery)

    let distribuidorId: string

    if (distSnapshot.empty) {
      // Crear nuevo distribuidor
      const distRef = doc(collection(db, COLLECTIONS.DISTRIBUIDORES))
      distribuidorId = distRef.id
      batch.set(distRef, {
        nombre: data.distribuidor,
        deudaTotal: data.deuda,
        totalOrdenesCompra: data.costoTotal,
        totalPagado: data.pagoDistribuidor,
        ordenesCompra: [ocRef.id],
        historialPagos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar distribuidor existente
      distribuidorId = distSnapshot.docs[0].id
      const distRef = doc(db, COLLECTIONS.DISTRIBUIDORES, distribuidorId)
      batch.update(distRef, {
        deudaTotal: increment(data.deuda),
        totalOrdenesCompra: increment(data.costoTotal),
        totalPagado: increment(data.pagoDistribuidor),
        ordenesCompra: [...(distSnapshot.docs[0].data().ordenesCompra || []), ocRef.id],
        updatedAt: Timestamp.now(),
      })
    }

    // Actualizar almacén (crear entrada)
    const prodQuery = query(collection(db, COLLECTIONS.ALMACEN), where("nombre", "==", data.producto))
    const prodSnapshot = await getDocs(prodQuery)

    if (prodSnapshot.empty) {
      // Crear nuevo producto
      const prodRef = doc(collection(db, COLLECTIONS.ALMACEN))
      batch.set(prodRef, {
        nombre: data.producto,
        origen: data.origen,
        stockActual: data.cantidad,
        totalEntradas: data.cantidad,
        totalSalidas: 0,
        valorUnitario: data.costoPorUnidad,
        entradas: [
          {
            id: ocRef.id,
            fecha: data.fecha,
            cantidad: data.cantidad,
            origen: data.distribuidor,
            tipo: "entrada",
          },
        ],
        salidas: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar producto existente
      const prodRef = doc(db, COLLECTIONS.ALMACEN, prodSnapshot.docs[0].id)
      const prodData = prodSnapshot.docs[0].data()
      batch.update(prodRef, {
        stockActual: increment(data.cantidad),
        totalEntradas: increment(data.cantidad),
        entradas: [
          ...(prodData.entradas || []),
          {
            id: ocRef.id,
            fecha: data.fecha,
            cantidad: data.cantidad,
            origen: data.distribuidor,
            tipo: "entrada",
          },
        ],
        updatedAt: Timestamp.now(),
      })
    }

    // Si hay pago, actualizar banco
    if (data.pagoDistribuidor > 0 && data.bancoOrigen) {
      const bancoRef = doc(db, COLLECTIONS.BANCOS, data.bancoOrigen)
      batch.update(bancoRef, {
        capitalActual: increment(-data.pagoDistribuidor),
        historicoGastos: increment(data.pagoDistribuidor),
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
  try {
    const q = query(collection(db, COLLECTIONS.ORDENES_COMPRA), orderBy("fecha", "desc"))
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

export const crearVenta = async (data: Omit<Venta, "id">) => {
  try {
    const batch = writeBatch(db)

    // Validar stock disponible
    const prodQuery = query(collection(db, COLLECTIONS.ALMACEN), where("nombre", "==", data.producto))
    const prodSnapshot = await getDocs(prodQuery)

    if (prodSnapshot.empty) {
      throw new Error("Producto no encontrado en almacén")
    }

    const prodData = prodSnapshot.docs[0].data()
    if (prodData.stockActual < data.cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${prodData.stockActual}, Solicitado: ${data.cantidad}`)
    }

    // Crear venta
    const ventaRef = doc(collection(db, COLLECTIONS.VENTAS))
    batch.set(ventaRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Crear o actualizar cliente
    const clienteQuery = query(collection(db, COLLECTIONS.CLIENTES), where("nombre", "==", data.cliente))
    const clienteSnapshot = await getDocs(clienteQuery)

    let clienteId: string

    if (clienteSnapshot.empty) {
      // Crear nuevo cliente
      const clienteRef = doc(collection(db, COLLECTIONS.CLIENTES))
      clienteId = clienteRef.id
      batch.set(clienteRef, {
        nombre: data.cliente,
        deudaTotal: data.montoRestante,
        totalVentas: data.precioTotalVenta,
        totalPagado: data.montoPagado,
        ventas: [ventaRef.id],
        historialPagos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Actualizar cliente existente
      clienteId = clienteSnapshot.docs[0].id
      const clienteRef = doc(db, COLLECTIONS.CLIENTES, clienteId)
      batch.update(clienteRef, {
        deudaTotal: increment(data.montoRestante),
        totalVentas: increment(data.precioTotalVenta),
        totalPagado: increment(data.montoPagado),
        ventas: [...(clienteSnapshot.docs[0].data().ventas || []), ventaRef.id],
        updatedAt: Timestamp.now(),
      })
    }

    // Actualizar almacén (crear salida)
    const prodRef = doc(db, COLLECTIONS.ALMACEN, prodSnapshot.docs[0].id)
    batch.update(prodRef, {
      stockActual: increment(-data.cantidad),
      totalSalidas: increment(data.cantidad),
      salidas: [
        ...(prodData.salidas || []),
        {
          id: ventaRef.id,
          fecha: data.fecha,
          cantidad: data.cantidad,
          destino: data.cliente,
          tipo: "salida",
        },
      ],
      updatedAt: Timestamp.now(),
    })

    // Actualizar bancos (distribución proporcional)
    const proporcion = data.montoPagado / data.precioTotalVenta

    // Bóveda Monte
    const bovedaMonteRef = doc(db, COLLECTIONS.BANCOS, "bovedaMonte")
    batch.update(bovedaMonteRef, {
      capitalActual: increment(data.distribucionBancos.bovedaMonte * proporcion),
      historicoIngresos: increment(data.distribucionBancos.bovedaMonte),
      updatedAt: Timestamp.now(),
    })

    // Fletes
    const fletesRef = doc(db, COLLECTIONS.BANCOS, "fletes")
    batch.update(fletesRef, {
      capitalActual: increment(data.distribucionBancos.fletes * proporcion),
      historicoIngresos: increment(data.distribucionBancos.fletes),
      updatedAt: Timestamp.now(),
    })

    // Utilidades
    const utilidadesRef = doc(db, COLLECTIONS.BANCOS, "utilidades")
    batch.update(utilidadesRef, {
      capitalActual: increment(data.distribucionBancos.utilidades * proporcion),
      historicoIngresos: increment(data.distribucionBancos.utilidades),
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
  try {
    const q = query(collection(db, COLLECTIONS.VENTAS), orderBy("fecha", "desc"))
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

export const suscribirDistribuidores = (callback: (distribuidores: Distribuidor[]) => void) => {
  try {
    const q = query(collection(db, COLLECTIONS.DISTRIBUIDORES), orderBy("nombre"))
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
  try {
    const batch = writeBatch(db)

    // Actualizar orden de compra
    const ocRef = doc(db, COLLECTIONS.ORDENES_COMPRA, ordenCompraId)
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
    const distRef = doc(db, COLLECTIONS.DISTRIBUIDORES, distribuidorId)
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
    const bancoRef = doc(db, COLLECTIONS.BANCOS, bancoOrigenId)
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

export const suscribirClientes = (callback: (clientes: Cliente[]) => void) => {
  try {
    const q = query(collection(db, COLLECTIONS.CLIENTES), orderBy("nombre"))
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
  try {
    const batch = writeBatch(db)

    // Obtener venta
    const ventaRef = doc(db, COLLECTIONS.VENTAS, ventaId)
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
    const clienteRef = doc(db, COLLECTIONS.CLIENTES, clienteId)
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

    const bovedaMonteRef = doc(db, COLLECTIONS.BANCOS, "bovedaMonte")
    batch.update(bovedaMonteRef, {
      capitalActual: increment(ventaData.distribucionBancos.bovedaMonte * proporcion),
      updatedAt: Timestamp.now(),
    })

    const fletesRef = doc(db, COLLECTIONS.BANCOS, "fletes")
    batch.update(fletesRef, {
      capitalActual: increment(ventaData.distribucionBancos.fletes * proporcion),
      updatedAt: Timestamp.now(),
    })

    const utilidadesRef = doc(db, COLLECTIONS.BANCOS, "utilidades")
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
  try {
    const q = query(collection(db, COLLECTIONS.ALMACEN), orderBy("nombre"))
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

// ============================================================
// TRANSFERENCIAS
// ============================================================

export const crearTransferencia = async (
  bancoOrigenId: string,
  bancoDestinoId: string,
  monto: number,
  concepto: string,
) => {
  try {
    const batch = writeBatch(db)

    // Actualizar banco origen
    const origenRef = doc(db, COLLECTIONS.BANCOS, bancoOrigenId)
    batch.update(origenRef, {
      capitalActual: increment(-monto),
      historicoTransferencias: increment(monto),
      updatedAt: Timestamp.now(),
    })

    // Actualizar banco destino
    const destinoRef = doc(db, COLLECTIONS.BANCOS, bancoDestinoId)
    batch.update(destinoRef, {
      capitalActual: increment(monto),
      historicoIngresos: increment(monto),
      updatedAt: Timestamp.now(),
    })

    await batch.commit()
  } catch (error) {
    logger.error("Error creating transferencia", error, { context: "FirestoreService" })
  }
}

export const firestoreService = {
  suscribirBancos,
  obtenerBanco,
  actualizarCapitalBanco,
  crearOrdenCompra,
  suscribirOrdenesCompra,
  crearVenta,
  suscribirVentas,
  suscribirDistribuidores,
  pagarDistribuidor,
  suscribirClientes,
  cobrarCliente,
  suscribirAlmacen,
  crearTransferencia,
}
