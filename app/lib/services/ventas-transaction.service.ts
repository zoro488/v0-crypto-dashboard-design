/**
 * 🔒 SERVICIO DE TRANSACCIONES ATÓMICAS
 * 
 * Este servicio maneja las operaciones críticas de negocio usando
 * Firestore Transactions para garantizar la integridad de los datos.
 * 
 * Características:
 * - Transacciones atómicas (todo o nada)
 * - Validación de stock antes de ventas
 * - Distribución automática de ingresos a bancos
 * - Logging completo de operaciones
 */

import { 
  runTransaction, 
  collection, 
  doc, 
  serverTimestamp,
  getDoc,
  Timestamp,
  increment as firestoreIncrement,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config'
import { logger } from '@/app/lib/utils/logger'

// ===================================================================
// TIPOS
// ===================================================================

// IDs de los 7 bancos del sistema
export type BancoId = 
  | 'boveda_monte' 
  | 'boveda_usa' 
  | 'utilidades' 
  | 'flete_sur' 
  | 'azteca' 
  | 'leftie' 
  | 'profit'

// Interfaz de distribución a los 7 bancos
export interface DistribucionBancos {
  boveda_monte: number  // Costo producto MXN
  boveda_usa: number    // Costo producto USD
  utilidades: number    // Ganancia neta
  flete_sur: number     // Costos de transporte
  azteca: number        // Pagos servicios
  leftie: number        // Operaciones USD
  profit: number        // Banco operativo principal
}

export interface VentaItem {
  productoId: string
  productoNombre: string
  cantidad: number
  precioUnitario: number
  precioCompra: number
  precioFlete: number
}

export interface VentaData {
  items: VentaItem[]
  total: number
  clienteId: string
  clienteNombre: string
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'transferencia_usa' | 'crypto'
  montoPagado: number
  montoRestante: number
  moneda?: 'MXN' | 'USD'
  tipoCambio?: number  // Para conversiones USD/MXN
}

export interface OrdenCompraData {
  distribuidorId: string
  distribuidorNombre: string
  producto: string
  cantidad: number
  costoDistribuidor: number
  costoTransporte: number
  costoTotal: number
  pagoInicial: number
  deuda: number
  bancoOrigen?: string
}

export interface AbonoData {
  entidadId: string
  entidadTipo: 'cliente' | 'distribuidor'
  monto: number
  bancoDestino?: string
  concepto?: string
}

export interface TransferenciaData {
  bancoOrigenId: string
  bancoDestinoId: string
  monto: number
  concepto: string
}

export interface ResultadoTransaccion {
  success: boolean
  error?: string
  documentId?: string
  data?: Record<string, unknown>
}

// ===================================================================
// SERVICIO DE TRANSACCIONES
// ===================================================================

/**
 * Procesa una venta de forma atómica
 * 1. Verifica stock de todos los productos
 * 2. Valida límite de crédito del cliente (si aplica)
 * 3. Resta stock de productos
 * 4. Crea documento de venta
 * 5. Actualiza deuda del cliente (si aplica)
 * 6. Distribuye ingresos a bancos correspondientes
 */
export async function procesarVentaAtomica(venta: VentaData): Promise<ResultadoTransaccion> {
  try {
    const resultado = await runTransaction(db!, async (transaction) => {
      // 1. LEER Y VALIDAR: Verificar stock de TODOS los productos primero
      const productosVerificados: Array<{
        ref: ReturnType<typeof doc>
        cantidad: number
        stockActual: number
        nombre: string
      }> = []

      for (const item of venta.items) {
        const productRef = doc(db!, 'almacen_productos', item.productoId)
        const productSnap = await transaction.get(productRef)

        if (!productSnap.exists()) {
          throw new Error(`El producto "${item.productoNombre}" no existe en el sistema.`)
        }

        const prodData = productSnap.data()
        const stockActual = prodData.stock ?? prodData.stockActual ?? 0

        if (stockActual < item.cantidad) {
          throw new Error(
            `Stock insuficiente para "${item.productoNombre}". ` +
            `Disponible: ${stockActual}, Solicitado: ${item.cantidad}`,
          )
        }

        productosVerificados.push({
          ref: productRef,
          cantidad: item.cantidad,
          stockActual,
          nombre: item.productoNombre,
        })
      }

      // 2. VALIDAR LÍMITE DE CRÉDITO si hay saldo pendiente
      if (venta.montoRestante > 0 && venta.clienteId) {
        const clienteRef = doc(db!, 'clientes', venta.clienteId)
        const clienteSnap = await transaction.get(clienteRef)
        
        if (clienteSnap.exists()) {
          const clienteData = clienteSnap.data()
          const deudaActual = clienteData.deudaTotal || 0
          const limiteCredito = clienteData.limiteCredito || 0
          const nuevaDeuda = deudaActual + venta.montoRestante
          
          // Solo validar si el cliente tiene límite de crédito configurado
          if (limiteCredito > 0 && nuevaDeuda > limiteCredito) {
            throw new Error(
              `Límite de crédito excedido para "${venta.clienteNombre}". ` +
              `Límite: $${limiteCredito.toLocaleString('es-MX')}, ` +
              `Deuda actual: $${deudaActual.toLocaleString('es-MX')}, ` +
              `Nuevo crédito: $${venta.montoRestante.toLocaleString('es-MX')}, ` +
              `Deuda total resultante: $${nuevaDeuda.toLocaleString('es-MX')}`,
            )
          }
        }
      }

      // 3. ESCRIBIR: Si todo está bien, procedemos a escribir

      // A) Restar Stock de cada producto
      for (const prod of productosVerificados) {
        transaction.update(prod.ref, {
          stock: prod.stockActual - prod.cantidad,
          stockActual: prod.stockActual - prod.cantidad,
          updatedAt: serverTimestamp(),
        })
      }

      // B) Crear documento de Venta
      const nuevaVentaRef = doc(collection(db!, 'ventas'))
      transaction.set(nuevaVentaRef, {
        ...venta,
        fecha: serverTimestamp(),
        estado: venta.montoRestante > 0 ? 'parcial' : 'completada',
        estadoPago: venta.montoRestante > 0 ? 'parcial' : 'completo',
        createdAt: serverTimestamp(),
      })

      // C) Registrar salida de almacén
      for (const item of venta.items) {
        const salidaRef = doc(collection(db!, 'almacen_salidas'))
        transaction.set(salidaRef, {
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          cantidad: item.cantidad,
          valorTotal: item.cantidad * item.precioUnitario,
          tipo: 'venta',
          destino: venta.clienteNombre,
          ventaRef: nuevaVentaRef.id,
          fecha: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
      }

      // D) Distribuir ingresos si hubo pago - LÓGICA DE PRIORIDAD
      if (venta.montoPagado > 0) {
        // Calcular totales absolutos (sin proporción)
        let totalCostoProducto = 0  // Va a Bóveda Monte o USA
        let totalFletes = 0         // Va a Flete Sur
        let totalUtilidades = 0     // Va a Utilidades

        for (const item of venta.items) {
          totalCostoProducto += item.precioCompra * item.cantidad
          totalFletes += item.precioFlete * item.cantidad
          // Fórmula correcta: Utilidad = (PrecioVenta - CostoProducto - Flete) * Cantidad
          const utilidadUnit = item.precioUnitario - item.precioCompra - item.precioFlete
          totalUtilidades += utilidadUnit * item.cantidad
        }

        // LÓGICA DE PRIORIDAD DE PAGO (para pagos parciales)
        // 1º Costo del producto (Bóveda Monte/USA)
        // 2º Fletes
        // 3º Utilidades (lo que sobra)
        let montoDisponible = venta.montoPagado
        
        const distribucion: DistribucionBancos = {
          boveda_monte: 0,
          boveda_usa: 0,
          utilidades: 0,
          flete_sur: 0,
          azteca: 0,
          leftie: 0,
          profit: 0,
        }

        // Determinar banco destino según método de pago
        const esOperacionUSD = venta.metodoPago === 'transferencia_usa' || venta.moneda === 'USD'
        const bancoCosto = esOperacionUSD ? 'boveda_usa' : 'boveda_monte'

        // 1º PRIORIDAD: Cubrir costo del producto
        if (montoDisponible > 0) {
          const montoCosto = Math.min(montoDisponible, totalCostoProducto)
          distribucion[bancoCosto] = montoCosto
          montoDisponible -= montoCosto
        }

        // 2º PRIORIDAD: Cubrir fletes
        if (montoDisponible > 0) {
          const montoFlete = Math.min(montoDisponible, totalFletes)
          distribucion.flete_sur = montoFlete
          montoDisponible -= montoFlete
        }

        // 3º PRIORIDAD: El remanente son utilidades
        if (montoDisponible > 0) {
          distribucion.utilidades = montoDisponible
        }

        // Registrar ingreso principal con distribución completa
        const ingresoRef = doc(collection(db!, 'ingresos'))
        transaction.set(ingresoRef, {
          monto: venta.montoPagado,
          concepto: `Venta a ${venta.clienteNombre}`,
          categoria: 'ventas',
          metodoPago: venta.metodoPago,
          moneda: venta.moneda || 'MXN',
          ventaRef: nuevaVentaRef.id,
          distribucion: distribucion,
          totalesVenta: {
            costoProducto: totalCostoProducto,
            fletes: totalFletes,
            utilidades: totalUtilidades,
          },
          fecha: serverTimestamp(),
          createdAt: serverTimestamp(),
        })

        // Registrar movimientos bancarios para cada banco con monto > 0
        const movimientosData: Array<{ bancoId: BancoId; monto: number; concepto: string }> = [
          { bancoId: bancoCosto, monto: distribucion[bancoCosto], concepto: 'Costo de producto vendido' },
          { bancoId: 'flete_sur', monto: distribucion.flete_sur, concepto: 'Comisión de flete' },
          { bancoId: 'utilidades', monto: distribucion.utilidades, concepto: 'Utilidad de venta' },
        ]

        for (const mov of movimientosData) {
          if (mov.monto > 0) {
            // Crear movimiento
            const movRef = doc(collection(db!, 'movimientos'))
            transaction.set(movRef, {
              bancoId: mov.bancoId,
              tipo: 'ingreso',
              tipoMovimiento: 'ingreso',
              monto: mov.monto,
              concepto: mov.concepto,
              moneda: esOperacionUSD ? 'USD' : 'MXN',
              referenciaId: nuevaVentaRef.id,
              fecha: serverTimestamp(),
              createdAt: serverTimestamp(),
            })
            
            // CRÍTICO: Actualizar saldo del banco
            const bancoRef = doc(db!, 'bancos', mov.bancoId)
            transaction.update(bancoRef, {
              capitalActual: firestoreIncrement(mov.monto),
              historicoIngresos: firestoreIncrement(mov.monto),
              updatedAt: serverTimestamp(),
            })
          }
        }
        
        // HISTÓRICOS: Si hay ventas pendientes, registrar en histórico sin sumar al capital
        if (venta.montoRestante > 0) {
          const totalesParaHistorico = {
            bovedaMonte: totalCostoProducto - distribucion[bancoCosto],
            fletes: totalFletes - distribucion.flete_sur,
            utilidades: totalUtilidades - distribucion.utilidades,
          }
          
          // Solo registrar histórico de lo pendiente (sin sumar a capitalActual)
          if (totalesParaHistorico.bovedaMonte > 0) {
            const bovedaRef = doc(db!, 'bancos', bancoCosto)
            transaction.update(bovedaRef, {
              historicoIngresos: firestoreIncrement(totalesParaHistorico.bovedaMonte),
              updatedAt: serverTimestamp(),
            })
          }
          if (totalesParaHistorico.fletes > 0) {
            const fletesRef = doc(db!, 'bancos', 'flete_sur')
            transaction.update(fletesRef, {
              historicoIngresos: firestoreIncrement(totalesParaHistorico.fletes),
              updatedAt: serverTimestamp(),
            })
          }
          if (totalesParaHistorico.utilidades > 0) {
            const utilidadesRef = doc(db!, 'bancos', 'utilidades')
            transaction.update(utilidadesRef, {
              historicoIngresos: firestoreIncrement(totalesParaHistorico.utilidades),
              updatedAt: serverTimestamp(),
            })
          }
        }
      }

      // E) Actualizar deuda del cliente si hay saldo pendiente
      if (venta.montoRestante > 0 && venta.clienteId) {
        const clienteRef = doc(db!, 'clientes', venta.clienteId)
        const clienteSnap = await transaction.get(clienteRef)
        
        if (clienteSnap.exists()) {
          const clienteData = clienteSnap.data()
          transaction.update(clienteRef, {
            deudaTotal: (clienteData.deudaTotal || 0) + venta.montoRestante,
            ultimaCompra: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      }

      return { ventaId: nuevaVentaRef.id }
    })

    logger.info(`[Transacción] ✅ Venta procesada exitosamente - ID: ${resultado.ventaId}`)
    return { success: true, documentId: resultado.ventaId }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    logger.error('[Transacción] ❌ Error en venta:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Procesa una orden de compra de forma atómica
 * 1. Actualiza/crea distribuidor
 * 2. Crea orden de compra
 * 3. Registra entrada al almacén
 * 4. Descuenta pago inicial del banco (si aplica)
 */
export async function procesarOrdenCompraAtomica(orden: OrdenCompraData): Promise<ResultadoTransaccion> {
  try {
    const resultado = await runTransaction(db!, async (transaction) => {
      // 1. Crear orden de compra
      const ordenRef = doc(collection(db!, 'ordenes_compra'))
      transaction.set(ordenRef, {
        distribuidorId: orden.distribuidorId,
        distribuidor: orden.distribuidorNombre,
        producto: orden.producto,
        cantidad: orden.cantidad,
        costoDistribuidor: orden.costoDistribuidor,
        costoTransporte: orden.costoTransporte,
        costoPorUnidad: orden.costoTotal / orden.cantidad,
        costoTotal: orden.costoTotal,
        pagoInicial: orden.pagoInicial,
        deuda: orden.deuda,
        estado: orden.deuda > 0 ? 'pendiente' : 'pagada',
        fecha: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      // 2. Registrar entrada al almacén
      const entradaRef = doc(collection(db!, 'almacen_entradas'))
      transaction.set(entradaRef, {
        productoNombre: orden.producto,
        cantidad: orden.cantidad,
        costoUnitario: orden.costoTotal / orden.cantidad,
        valorTotal: orden.costoTotal,
        tipo: 'compra',
        origen: orden.distribuidorNombre,
        ordenCompraRef: ordenRef.id,
        fecha: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      // 3. Actualizar o crear producto en almacén
      // Nota: Esto buscaría por nombre, en producción usaríamos ID
      const productoRef = doc(collection(db!, 'almacen_productos'))
      transaction.set(productoRef, {
        nombre: orden.producto,
        stock: orden.cantidad,
        stockActual: orden.cantidad,
        precioCompra: orden.costoTotal / orden.cantidad,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })

      // 4. Si hubo pago inicial, registrar movimiento
      if (orden.pagoInicial > 0 && orden.bancoOrigen) {
        const movimientoRef = doc(collection(db!, 'movimientos'))
        transaction.set(movimientoRef, {
          bancoId: orden.bancoOrigen,
          tipo: 'gasto',
          tipoMovimiento: 'gasto',
          monto: orden.pagoInicial,
          concepto: `Pago inicial OC: ${orden.producto}`,
          referenciaId: ordenRef.id,
          fecha: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
      }

      // 5. Actualizar deuda del distribuidor
      if (orden.distribuidorId) {
        const distRef = doc(db!, 'distribuidores', orden.distribuidorId)
        const distSnap = await transaction.get(distRef)
        
        if (distSnap.exists()) {
          const distData = distSnap.data()
          transaction.update(distRef, {
            deudaTotal: (distData.deudaTotal || 0) + orden.deuda,
            totalOrdenesCompra: (distData.totalOrdenesCompra || 0) + orden.costoTotal,
            updatedAt: serverTimestamp(),
          })
        }
      }

      return { ordenId: ordenRef.id }
    })

    logger.info(`[Transacción] ✅ Orden de compra procesada - ID: ${resultado.ordenId}`)
    return { success: true, documentId: resultado.ordenId }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    logger.error('[Transacción] ❌ Error en orden de compra:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Procesa un abono de forma atómica
 * 1. Reduce deuda de cliente/distribuidor
 * 2. Registra el pago
 * 3. Distribuye a bancos (para clientes con ventas pendientes)
 */
export async function procesarAbonoAtomico(abono: AbonoData): Promise<ResultadoTransaccion> {
  try {
    const resultado = await runTransaction(db!, async (transaction) => {
      const coleccion = abono.entidadTipo === 'cliente' ? 'clientes' : 'distribuidores'
      const entidadRef = doc(db!, coleccion, abono.entidadId)
      const entidadSnap = await transaction.get(entidadRef)

      if (!entidadSnap.exists()) {
        throw new Error(`${abono.entidadTipo === 'cliente' ? 'Cliente' : 'Distribuidor'} no encontrado`)
      }

      const entidadData = entidadSnap.data()
      const deudaActual = entidadData.deudaTotal || 0

      if (abono.monto > deudaActual) {
        throw new Error(`El abono ($${abono.monto}) excede la deuda actual ($${deudaActual})`)
      }

      // Actualizar deuda
      transaction.update(entidadRef, {
        deudaTotal: deudaActual - abono.monto,
        updatedAt: serverTimestamp(),
      })

      // Registrar abono
      const abonoRef = doc(collection(db!, 'abonos'))
      transaction.set(abonoRef, {
        entidadId: abono.entidadId,
        entidadTipo: abono.entidadTipo,
        entidadNombre: entidadData.nombre,
        monto: abono.monto,
        concepto: abono.concepto || 'Abono a deuda',
        bancoDestino: abono.bancoDestino,
        deudaAnterior: deudaActual,
        deudaNueva: deudaActual - abono.monto,
        fecha: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      // Si es cliente, distribuir el ingreso a bancos
      if (abono.entidadTipo === 'cliente') {
        const ingresoRef = doc(collection(db!, 'ingresos'))
        transaction.set(ingresoRef, {
          monto: abono.monto,
          concepto: `Abono de ${entidadData.nombre}`,
          categoria: 'abonos',
          clienteId: abono.entidadId,
          abonoRef: abonoRef.id,
          fecha: serverTimestamp(),
          createdAt: serverTimestamp(),
        })

        // Registrar movimiento en bóveda monte
        const movRef = doc(collection(db!, 'movimientos'))
        transaction.set(movRef, {
          bancoId: 'boveda_monte',
          tipo: 'ingreso',
          tipoMovimiento: 'ingreso',
          monto: abono.monto,
          concepto: `Abono cliente: ${entidadData.nombre}`,
          referenciaId: abonoRef.id,
          fecha: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
      }

      // Si es distribuidor, registrar el gasto desde el banco
      if (abono.entidadTipo === 'distribuidor' && abono.bancoDestino) {
        const movRef = doc(collection(db!, 'movimientos'))
        transaction.set(movRef, {
          bancoId: abono.bancoDestino,
          tipo: 'gasto',
          tipoMovimiento: 'gasto',
          monto: abono.monto,
          concepto: `Pago a ${entidadData.nombre}`,
          referenciaId: abonoRef.id,
          fecha: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
      }

      return { abonoId: abonoRef.id }
    })

    logger.info(`[Transacción] ✅ Abono procesado - ID: ${resultado.abonoId}`)
    return { success: true, documentId: resultado.abonoId }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    logger.error('[Transacción] ❌ Error en abono:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Procesa una transferencia entre bancos
 */
export async function procesarTransferenciaAtomica(
  transferencia: TransferenciaData,
): Promise<ResultadoTransaccion> {
  try {
    const resultado = await runTransaction(db!, async (transaction) => {
      // Registrar movimiento de salida
      const salidaRef = doc(collection(db!, 'movimientos'))
      transaction.set(salidaRef, {
        bancoId: transferencia.bancoOrigenId,
        tipo: 'gasto',
        tipoMovimiento: 'transferencia_salida',
        monto: transferencia.monto,
        concepto: transferencia.concepto,
        bancoDestino: transferencia.bancoDestinoId,
        fecha: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      // Registrar movimiento de entrada
      const entradaRef = doc(collection(db!, 'movimientos'))
      transaction.set(entradaRef, {
        bancoId: transferencia.bancoDestinoId,
        tipo: 'ingreso',
        tipoMovimiento: 'transferencia_entrada',
        monto: transferencia.monto,
        concepto: transferencia.concepto,
        bancoOrigen: transferencia.bancoOrigenId,
        transferenciaRef: salidaRef.id,
        fecha: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      return { transferenciaId: salidaRef.id }
    })

    logger.info(`[Transacción] ✅ Transferencia procesada - ID: ${resultado.transferenciaId}`)
    return { success: true, documentId: resultado.transferenciaId }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    logger.error('[Transacción] ❌ Error en transferencia:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ===================================================================
// EXPORTACIÓN POR DEFECTO
// ===================================================================

export const transactionService = {
  procesarVenta: procesarVentaAtomica,
  procesarOrdenCompra: procesarOrdenCompraAtomica,
  procesarAbono: procesarAbonoAtomico,
  procesarTransferencia: procesarTransferenciaAtomica,
}

export default transactionService
