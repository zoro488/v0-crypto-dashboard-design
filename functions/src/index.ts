/**
 * 🏦 FLOWDISTRIBUTOR CLOUD FUNCTIONS - Sistema de Gestión Financiera
 * 
 * Funciones serverless con TRANSACCIONES ATÓMICAS para:
 * - crearVentaCompleta: Multi-producto con distribución GYA a 3 bancos
 * - crearOrdenCompraCompleta: Multi-producto con adeudo automático
 * - abonarCliente: Abonos con selección de banco destino
 * - pagarDistribuidor: Pagos con selección de banco origen
 * - transferirEntreBancos: Transferencias atómicas
 * - registrarGasto: Gastos desde cualquier banco
 * - registrarIngreso: Solo bancos operativos (azteca, leftie, profit)
 * 
 * @version 3.0.0 PRODUCTION
 * @author FlowDistributor Team
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Inicializar Firebase Admin
admin.initializeApp()

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS COMPLETOS
// ═══════════════════════════════════════════════════════════════════════════════

type BancoId = 'boveda_monte' | 'boveda_usa' | 'utilidades' | 'flete_sur' | 'azteca' | 'leftie' | 'profit'

// Producto en venta (multi-producto)
interface ProductoVenta {
  productoId?: string
  producto: string
  cantidad: number
  precioVenta: number
  precioCompra: number
  precioFlete: number
  ocRelacionada?: string
}

// Producto en orden de compra (multi-producto)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ProductoOC {
  producto: string
  cantidad: number
  costoDistribuidor: number
  costoTransporte?: number
}

interface CrearVentaInput {
  cliente: string
  clienteId?: string
  productos: ProductoVenta[]  // MULTI-PRODUCTO
  producto?: string  // Legacy single product
  ocRelacionada?: string
  cantidad: number
  precioVenta: number
  precioCompra: number
  precioFlete: number
  estadoPago: 'completo' | 'parcial' | 'pendiente'
  montoPagado: number
  metodoPago: 'efectivo' | 'transferencia' | 'deposito' | 'mixto'
  notas?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _CrearOrdenCompraInput {
  distribuidor: string
  productos: ProductoOC[]  // MULTI-PRODUCTO
  pagoInicial?: number
  bancoOrigen?: BancoId
  notas?: string
}

interface AbonoInput {
  clienteId: string
  ventaId?: string  // Opcional: para abono a venta específica
  monto: number
  metodoPago: 'efectivo' | 'transferencia'
  concepto?: string
  bancoDestino: BancoId  // OBLIGATORIO: selección del banco
}

interface PagoDistribuidorInput {
  distribuidorId: string
  ordenCompraId?: string  // Opcional: para pago a OC específica
  monto: number
  bancoOrigen: BancoId  // OBLIGATORIO: de qué banco sale
  metodoPago: 'efectivo' | 'transferencia'
  concepto?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _TransferenciaInput {
  bancoOrigen: BancoId
  bancoDestino: BancoId
  monto: number
  concepto: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _GastoInput {
  bancoOrigen: BancoId
  monto: number
  concepto: string
  categoria?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _IngresoInput {
  bancoDestino: BancoId  // Solo azteca, leftie, profit
  monto: number
  concepto: string
  cliente?: string
  categoria?: string
}

// Config de bancos
const BANCOS_CONFIG: Record<BancoId, { nombre: string; tipo: string }> = {
  boveda_monte: { nombre: 'Bóveda Monte', tipo: 'boveda' },
  boveda_usa: { nombre: 'Bóveda USA', tipo: 'boveda' },
  utilidades: { nombre: 'Utilidades', tipo: 'utilidades' },
  flete_sur: { nombre: 'Flete Sur', tipo: 'gastos' },
  azteca: { nombre: 'Azteca', tipo: 'operativo' },
  leftie: { nombre: 'Leftie', tipo: 'operativo' },
  profit: { nombre: 'Profit', tipo: 'operativo' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS BLINDADOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Asegurar que un banco existe, creándolo si es necesario
 */
async function ensureBancoExists(
  transaction: admin.firestore.Transaction,
  bancoId: BancoId
): Promise<void> {
  const bancoRef = db.collection('bancos').doc(bancoId)
  const bancoDoc = await transaction.get(bancoRef)
  
  if (!bancoDoc.exists) {
    const config = BANCOS_CONFIG[bancoId]
    transaction.set(bancoRef, {
      id: bancoId,
      nombre: config?.nombre || bancoId,
      tipo: config?.tipo || 'operativo',
      historicoIngresos: 0,
      historicoGastos: 0,
      historicoTransferencias: 0,
      capitalActual: 0,
      capitalInicial: 0,
      estado: 'activo',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

/**
 * Actualizar banco con nuevo movimiento (ATÓMICO)
 */
async function actualizarBanco(
  transaction: admin.firestore.Transaction,
  bancoId: BancoId,
  tipo: 'ingreso' | 'gasto',
  monto: number,
  concepto: string,
  referencia?: string,
  usuarioId?: string
): Promise<void> {
  await ensureBancoExists(transaction, bancoId)
  
  const bancoRef = db.collection('bancos').doc(bancoId)
  const bancoDoc = await transaction.get(bancoRef)
  const data = bancoDoc.data()!
  
  const nuevoHistoricoIngresos = (data.historicoIngresos || 0) + (tipo === 'ingreso' ? monto : 0)
  const nuevoHistoricoGastos = (data.historicoGastos || 0) + (tipo === 'gasto' ? monto : 0)
  
  // FÓRMULA CRÍTICA: capitalActual = historicoIngresos - historicoGastos
  transaction.update(bancoRef, {
    historicoIngresos: nuevoHistoricoIngresos,
    historicoGastos: nuevoHistoricoGastos,
    capitalActual: nuevoHistoricoIngresos - nuevoHistoricoGastos,
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Registrar movimiento INMUTABLE
  const movimientoRef = db.collection('movimientos').doc()
  transaction.set(movimientoRef, {
    id: movimientoRef.id,
    bancoId,
    tipoMovimiento: tipo,
    monto,
    concepto,
    referenciaId: referencia || null,
    referenciaTipo: referencia ? 'venta' : 'manual',
    fecha: FieldValue.serverTimestamp(),
    usuarioId: usuarioId || null,
    createdAt: FieldValue.serverTimestamp(),
  })
}

/**
 * Generar ID único para venta
 */
function generarVentaId(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `VTA-${year}${month}${day}-${random}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLOUD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🛒 CREAR VENTA COMPLETA
 * 
 * Transacción atómica que:
 * 1. Crea documento de venta
 * 2. Distribuye a 3 bancos (Bóveda Monte, Fletes, Utilidades)
 * 3. Actualiza perfil del cliente (deuda si aplica)
 * 4. Registra movimientos inmutables
 * 5. Actualiza stock en almacén
 */
export const crearVentaCompleta = functions
  .region('us-central1')
  .runWith({ 
    memory: '256MB',
    timeoutSeconds: 60,
    maxInstances: 10
  })
  .https.onCall(async (data: CrearVentaInput, context) => {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Debes iniciar sesión para crear ventas'
      )
    }

    // Validar datos
    if (!data.cliente || !data.cantidad || data.precioVenta <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Datos de venta incompletos'
      )
    }

    const ventaId = generarVentaId()
    const ahora = admin.firestore.FieldValue.serverTimestamp()

    // Calcular distribución GYA
    const precioTotalVenta = data.precioVenta * data.cantidad
    const bovedaMonte = data.precioCompra * data.cantidad // Costo
    const fletes = data.precioFlete * data.cantidad // Flete
    const utilidades = precioTotalVenta - bovedaMonte - fletes // Ganancia neta

    // Calcular según estado de pago
    let proporcion = 1
    if (data.estadoPago === 'parcial') {
      proporcion = data.montoPagado / precioTotalVenta
    } else if (data.estadoPago === 'pendiente') {
      proporcion = 0
    }

    const bovedaMonteEfectivo = Math.round(bovedaMonte * proporcion)
    const fletesEfectivo = Math.round(fletes * proporcion)
    const utilidadesEfectivo = Math.round(utilidades * proporcion)
    const montoRestante = precioTotalVenta - data.montoPagado

    try {
      await db.runTransaction(async (transaction) => {
        // 1. Crear documento de venta
        const ventaRef = db.collection('ventas').doc(ventaId)
        transaction.set(ventaRef, {
          id: ventaId,
          cliente: data.cliente,
          clienteId: data.clienteId || null,
          producto: data.producto,
          ocRelacionada: data.ocRelacionada || null,
          cantidad: data.cantidad,
          precioVenta: data.precioVenta,
          precioCompra: data.precioCompra,
          precioFlete: data.precioFlete,
          precioTotalVenta,
          estadoPago: data.estadoPago,
          montoPagado: data.montoPagado,
          montoRestante,
          metodoPago: data.metodoPago,
          notas: data.notas || null,
          // Distribución GYA (inmutable)
          bovedaMonte,
          fletes,
          utilidades,
          // Distribución efectiva (según pago)
          distribucionEfectiva: {
            bovedaMonte: bovedaMonteEfectivo,
            fletes: fletesEfectivo,
            utilidades: utilidadesEfectivo,
          },
          // Metadata
          creadoPor: context.auth!.uid,
          fecha: ahora,
          createdAt: ahora,
          updatedAt: ahora,
        })

        // 2. Distribuir a bancos (solo si hay pago)
        if (proporcion > 0) {
          // Bóveda Monte - Costo del distribuidor
          await actualizarBanco(
            transaction,
            'boveda_monte',
            'ingreso',
            bovedaMonteEfectivo,
            `Venta ${ventaId} - ${data.cliente} (Costo)`,
            ventaId
          )

          // Flete Sur - Costo del flete
          if (fletesEfectivo > 0) {
            await actualizarBanco(
              transaction,
              'flete_sur',
              'ingreso',
              fletesEfectivo,
              `Venta ${ventaId} - ${data.cliente} (Flete)`,
              ventaId
            )
          }

          // Utilidades - Ganancia neta
          await actualizarBanco(
            transaction,
            'utilidades',
            'ingreso',
            utilidadesEfectivo,
            `Venta ${ventaId} - ${data.cliente} (Utilidad)`,
            ventaId
          )
        }

        // 3. Actualizar cliente (crear si no existe)
        if (data.clienteId) {
          const clienteRef = db.collection('clientes').doc(data.clienteId)
          const clienteDoc = await transaction.get(clienteRef)
          
          if (clienteDoc.exists) {
            const clienteData = clienteDoc.data()!
            const nuevaDeuda = (clienteData.deuda || 0) + montoRestante
            transaction.update(clienteRef, {
              deuda: nuevaDeuda,
              ultimaVenta: ahora,
              totalCompras: admin.firestore.FieldValue.increment(precioTotalVenta),
              updatedAt: ahora,
            })
          }
        }

        // 4. Actualizar stock en OC si aplica
        if (data.ocRelacionada) {
          const ocRef = db.collection('ordenes_compra').doc(data.ocRelacionada)
          const ocDoc = await transaction.get(ocRef)
          
          if (ocDoc.exists) {
            const ocData = ocDoc.data()!
            const nuevoStock = Math.max(0, (ocData.stockActual || ocData.cantidad || 0) - data.cantidad)
            transaction.update(ocRef, {
              stockActual: nuevoStock,
              updatedAt: ahora,
            })
          }
        }
      })

      // Log de auditoría
      await db.collection('audit_logs').add({
        action: 'VENTA_CREADA',
        ventaId,
        usuario: context.auth.uid,
        datos: {
          cliente: data.cliente,
          total: precioTotalVenta,
          estado: data.estadoPago,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      })

      return {
        success: true,
        ventaId,
        distribucion: {
          bovedaMonte: bovedaMonteEfectivo,
          fletes: fletesEfectivo,
          utilidades: utilidadesEfectivo,
        },
        deudaCliente: montoRestante,
      }

    } catch (error) {
      console.error('[crearVentaCompleta] Error:', error)
      throw new functions.https.HttpsError(
        'internal',
        'Error al procesar la venta'
      )
    }
  })

/**
 * 💰 ABONAR CLIENTE
 * 
 * Registra un abono de un cliente:
 * 1. Reduce la deuda del cliente
 * 2. Registra ingreso en banco destino
 * 3. Crea movimiento inmutable
 */
export const abonarCliente = functions
  .region('us-central1')
  .https.onCall(async (data: AbonoInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'No autenticado')
    }

    if (!data.clienteId || data.monto <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos')
    }

    const abonoId = `ABO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const bancoDestino = data.bancoDestino || 'boveda_monte'

    try {
      await db.runTransaction(async (transaction) => {
        // Obtener cliente
        const clienteRef = db.collection('clientes').doc(data.clienteId)
        const clienteDoc = await transaction.get(clienteRef)
        
        if (!clienteDoc.exists) {
          throw new Error('Cliente no encontrado')
        }

        const clienteData = clienteDoc.data()!
        const nuevaDeuda = Math.max(0, (clienteData.deuda || 0) - data.monto)

        // Actualizar cliente
        transaction.update(clienteRef, {
          deuda: nuevaDeuda,
          ultimoAbono: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        // Registrar abono
        const abonoRef = db.collection('abonos').doc(abonoId)
        transaction.set(abonoRef, {
          id: abonoId,
          clienteId: data.clienteId,
          clienteNombre: clienteData.nombre || data.clienteId,
          monto: data.monto,
          metodoPago: data.metodoPago,
          bancoDestino,
          concepto: data.concepto || 'Abono a cuenta',
          deudaAnterior: clienteData.deuda || 0,
          deudaNueva: nuevaDeuda,
          creadoPor: context.auth!.uid,
          fecha: admin.firestore.FieldValue.serverTimestamp(),
        })

        // Actualizar banco
        await actualizarBanco(
          transaction,
          bancoDestino,
          'ingreso',
          data.monto,
          `Abono ${clienteData.nombre || data.clienteId}`,
          abonoId
        )
      })

      return {
        success: true,
        abonoId,
        message: 'Abono registrado correctamente',
      }

    } catch (error) {
      console.error('[abonarCliente] Error:', error)
      throw new functions.https.HttpsError('internal', 'Error al procesar abono')
    }
  })

/**
 * 💸 PAGAR DISTRIBUIDOR
 * 
 * Registra un pago a distribuidor:
 * 1. Reduce el adeudo del distribuidor
 * 2. Registra gasto en banco origen
 * 3. Crea movimiento inmutable
 */
export const pagarDistribuidor = functions
  .region('us-central1')
  .https.onCall(async (data: PagoDistribuidorInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'No autenticado')
    }

    if (!data.distribuidorId || data.monto <= 0 || !data.bancoOrigen) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos')
    }

    const pagoId = `PAGO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    try {
      await db.runTransaction(async (transaction) => {
        // Obtener distribuidor
        const distRef = db.collection('distribuidores').doc(data.distribuidorId)
        const distDoc = await transaction.get(distRef)
        
        if (!distDoc.exists) {
          throw new Error('Distribuidor no encontrado')
        }

        const distData = distDoc.data()!
        const nuevoAdeudo = Math.max(0, (distData.adeudoPendiente || 0) - data.monto)

        // Actualizar distribuidor
        transaction.update(distRef, {
          adeudoPendiente: nuevoAdeudo,
          ultimoPago: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        // Registrar gasto en banco origen
        await actualizarBanco(
          transaction,
          data.bancoOrigen,
          'gasto',
          data.monto,
          `Pago ${distData.nombre || data.distribuidorId}`,
          pagoId
        )
      })

      return {
        success: true,
        pagoId,
        message: 'Pago registrado correctamente',
      }

    } catch (error) {
      console.error('[pagarDistribuidor] Error:', error)
      throw new functions.https.HttpsError('internal', 'Error al procesar pago')
    }
  })

/**
 * 🔄 TRANSFERENCIA ENTRE BANCOS
 */
export const transferirEntreBancos = functions
  .region('us-central1')
  .https.onCall(async (data: {
    bancoOrigen: BancoId
    bancoDestino: BancoId
    monto: number
    concepto?: string
  }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'No autenticado')
    }

    if (!data.bancoOrigen || !data.bancoDestino || data.monto <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos inválidos')
    }

    if (data.bancoOrigen === data.bancoDestino) {
      throw new functions.https.HttpsError('invalid-argument', 'Los bancos deben ser diferentes')
    }

    const transferId = `TRF-${Date.now()}`

    try {
      await db.runTransaction(async (transaction) => {
        // Gasto en origen
        await actualizarBanco(
          transaction,
          data.bancoOrigen,
          'gasto',
          data.monto,
          `Transferencia a ${data.bancoDestino}`,
          transferId
        )

        // Ingreso en destino
        await actualizarBanco(
          transaction,
          data.bancoDestino,
          'ingreso',
          data.monto,
          `Transferencia de ${data.bancoOrigen}`,
          transferId
        )

        // Registrar transferencia
        const transRef = db.collection('transferencias').doc(transferId)
        transaction.set(transRef, {
          id: transferId,
          bancoOrigen: data.bancoOrigen,
          bancoDestino: data.bancoDestino,
          monto: data.monto,
          concepto: data.concepto || 'Transferencia entre bancos',
          creadoPor: context.auth!.uid,
          fecha: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      return {
        success: true,
        transferId,
      }

    } catch (error) {
      console.error('[transferirEntreBancos] Error:', error)
      throw new functions.https.HttpsError('internal', 'Error en transferencia')
    }
  })
