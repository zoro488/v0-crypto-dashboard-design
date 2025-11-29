/**
 * ====================================================================
 * LÓGICA DE NEGOCIO COMPLETA - FLOWDISTRIBUTOR/CHRONOS
 * ====================================================================
 * 
 * Basado en:
 * - LOGICA_CORRECTA_SISTEMA_Version2.md
 * - FORMULAS_CORRECTAS_VENTAS_Version2.md
 * - panel-gastos-abonos-manual_Version2.json
 * - panel-clientes-manual_Version2.json
 * 
 * REGLAS DE NEGOCIO:
 * 
 * 1. VENTA → Distribución a 3 bancos:
 *    - Bóveda Monte = precioCompra × cantidad (COSTO)
 *    - Fletes = precioFlete × cantidad (default 500/unidad)
 *    - Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad
 * 
 * 2. ABONO DE CLIENTE → Actualiza perfil cliente + distribuye a bancos proporcionalmente
 * 
 * 3. PAGO A DISTRIBUIDOR → Registra como GASTO desde banco seleccionado
 * 
 * 4. TRANSFERENCIA → Mueve capital entre bancos
 * 
 * @author Chronos System
 * @version 2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  runTransaction,
  Timestamp,
  increment as firestoreIncrement
} from 'firebase/firestore'
import { db, getFirestoreInstance } from '@/app/lib/firebase/config'
import { logger } from '@/app/lib/utils/logger'
import type { 
  Venta, 
  OrdenCompra, 
  Cliente, 
  Distribuidor, 
  Movimiento,
  BancoId,
  GastoAbono,
  CalculoVentaResult 
} from '@/app/types'

// ====================================================================
// CONSTANTES DEL SISTEMA
// ====================================================================

/** Precio de flete por defecto por unidad */
export const PRECIO_FLETE_DEFAULT = 500

/** IDs de los 7 bancos del sistema */
export const BANCOS_IDS: BancoId[] = [
  'boveda_monte',
  'boveda_usa', 
  'profit',
  'leftie',
  'azteca',
  'flete_sur',
  'utilidades'
]

/** Bancos que reciben de ventas */
export const BANCOS_VENTAS: BancoId[] = ['boveda_monte', 'flete_sur', 'utilidades']

// ====================================================================
// INTERFACES DE ENTRADA
// ====================================================================

export interface NuevaVentaInput {
  clienteId: string
  clienteNombre?: string
  ocRelacionada?: string
  ocId?: string // Alias de ocRelacionada para compatibilidad
  cantidad: number
  precioVenta: number
  precioCompra: number // Costo por unidad de la OC
  flete: 'Aplica' | 'NoAplica'
  precioFlete?: number // Default 500
  metodoPago?: string
  bancoDestino?: BancoId
  montoPagado?: number
  concepto?: string
}

export interface AbonoClienteInput {
  clienteId: string
  clienteNombre?: string
  monto: number
  bancoOrigen?: BancoId // De dónde viene el pago (si es transferencia)
  metodoPago?: string
  metodo?: string // Alias de metodoPago para compatibilidad
  referencia?: string
  ventaRelacionada?: string // ID de venta específica
  concepto?: string
  notas?: string
}

export interface PagoDistribuidorInput {
  distribuidorId: string
  distribuidorNombre?: string
  monto: number
  bancoOrigen: BancoId // Desde qué banco se paga
  ordenCompraRelacionada?: string
  concepto?: string
  metodo?: string // Método de pago
  referencia?: string
  notas?: string
  tc?: number // Tipo de cambio si aplica
}

export interface TransferenciaInput {
  bancoOrigen: BancoId
  bancoDestino: BancoId
  monto: number
  concepto?: string
  tc?: number
}

// ====================================================================
// CÁLCULOS DE VENTA (Fórmulas correctas)
// ====================================================================

/**
 * Calcula la distribución de una venta a los 3 bancos
 * 
 * FÓRMULAS:
 * - Bóveda Monte = precioCompra × cantidad
 * - Fletes = precioFlete × cantidad (si aplica)
 * - Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad
 */
export function calcularDistribucionVenta(
  cantidad: number,
  precioVenta: number,
  precioCompra: number,
  aplicaFlete: boolean,
  precioFlete: number = PRECIO_FLETE_DEFAULT
): CalculoVentaResult {
  // Monto que va a Bóveda Monte (COSTO de la mercancía)
  const montoBovedaMonte = precioCompra * cantidad
  
  // Monto de fletes (si aplica)
  const montoFletes = aplicaFlete ? precioFlete * cantidad : 0
  
  // Total de la venta
  const ingresoVenta = precioVenta * cantidad
  
  // Utilidades = Venta - Costo - Fletes
  const montoUtilidades = (precioVenta - precioCompra - (aplicaFlete ? precioFlete : 0)) * cantidad
  
  // Ganancia bruta
  const gananciaBruta = ingresoVenta - montoBovedaMonte
  
  return {
    costoPorUnidad: precioCompra + (aplicaFlete ? precioFlete : 0),
    costoTotalLote: montoBovedaMonte + montoFletes,
    ingresoVenta,
    totalVenta: ingresoVenta,
    montoBovedaMonte,
    montoFletes,
    montoUtilidades,
    gananciaBruta,
    gananciaDesdeCSV: montoUtilidades,
    proporcionPagada: 1, // Se actualiza con pagos parciales
    distribucionParcial: {
      bovedaMonte: montoBovedaMonte,
      fletes: montoFletes,
      utilidades: montoUtilidades
    }
  }
}

/**
 * Calcula distribución proporcional para pagos parciales
 */
export function calcularDistribucionParcial(
  montoPagado: number,
  totalVenta: number,
  montoBovedaMonte: number,
  montoFletes: number,
  montoUtilidades: number
): { bovedaMonte: number; fletes: number; utilidades: number } {
  const proporcion = montoPagado / totalVenta
  
  return {
    bovedaMonte: montoBovedaMonte * proporcion,
    fletes: montoFletes * proporcion,
    utilidades: montoUtilidades * proporcion
  }
}

// ====================================================================
// OPERACIONES DE NEGOCIO
// ====================================================================

/**
 * Registra una nueva venta con distribución automática a bancos
 * 
 * FLUJO:
 * 1. Crea registro de venta
 * 2. Actualiza stock de OC relacionada
 * 3. Actualiza deuda de cliente
 * 4. Distribuye montos a 3 bancos (Bóveda Monte, Fletes, Utilidades)
 * 5. Crea movimientos financieros
 */
export async function registrarVenta(input: NuevaVentaInput): Promise<string> {
  const ventaId = `VTA-${Date.now()}`
  const firestore = getFirestoreInstance()
  
  try {
    await runTransaction(firestore, async (transaction) => {
      // 0. VALIDACIÓN DE STOCK - Verificar que hay suficiente mercancía
      if (input.ocRelacionada) {
        const ocRef = doc(firestore, 'ordenes_compra', input.ocRelacionada)
        const ocDoc = await transaction.get(ocRef)
        if (ocDoc.exists()) {
          const ocData = ocDoc.data() as OrdenCompra
          const stockDisponible = ocData.stockActual ?? ocData.cantidad ?? 0
          if (input.cantidad > stockDisponible) {
            throw new Error(`Stock insuficiente. Disponible: ${stockDisponible}, Solicitado: ${input.cantidad}`)
          }
        }
      }
      
      // 1. Calcular distribución
      const distribucion = calcularDistribucionVenta(
        input.cantidad,
        input.precioVenta,
        input.precioCompra,
        input.flete === 'Aplica',
        input.precioFlete ?? PRECIO_FLETE_DEFAULT
      )
      
      // 2. Determinar estado de pago
      const montoPagado = input.montoPagado ?? 0
      const montoRestante = distribucion.ingresoVenta - montoPagado
      const estadoPago = montoPagado >= distribucion.ingresoVenta 
        ? 'completo' 
        : montoPagado > 0 
          ? 'parcial' 
          : 'pendiente'
      
      // 3. Crear documento de venta
      const ventaRef = doc(firestore, 'ventas', ventaId)
      const ventaData: Partial<Venta> = {
        id: ventaId,
        fecha: Timestamp.now(),
        clienteId: input.clienteId,
        cliente: input.clienteNombre || '',
        ocRelacionada: input.ocRelacionada || '',
        cantidad: input.cantidad,
        precioVenta: input.precioVenta,
        precioCompra: input.precioCompra,
        ingreso: distribucion.ingresoVenta,
        totalVenta: distribucion.ingresoVenta,
        precioTotalVenta: distribucion.ingresoVenta,
        flete: input.flete,
        fleteUtilidad: distribucion.montoFletes,
        precioFlete: input.precioFlete ?? PRECIO_FLETE_DEFAULT,
        utilidad: distribucion.montoUtilidades,
        ganancia: distribucion.montoUtilidades,
        bovedaMonte: distribucion.montoBovedaMonte,
        distribucionBancos: {
          bovedaMonte: distribucion.montoBovedaMonte,
          fletes: distribucion.montoFletes,
          utilidades: distribucion.montoUtilidades
        },
        estatus: estadoPago === 'completo' ? 'Pagado' : 'Pendiente',
        estadoPago,
        montoPagado,
        montoRestante,
        adeudo: montoRestante,
        metodoPago: input.metodoPago as undefined,
        bancoDestino: input.bancoDestino,
        concepto: input.concepto,
        keywords: [
          (input.clienteNombre || '').toLowerCase(),
          ventaId.toLowerCase(),
          (input.ocRelacionada || '').toLowerCase()
        ],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      transaction.set(ventaRef, ventaData)
      
      // 4. Actualizar stock de OC relacionada
      const ocRef = doc(firestore, 'ordenes_compra', input.ocRelacionada || '')
      const ocDoc = await transaction.get(ocRef)
      if (ocDoc.exists()) {
        const ocData = ocDoc.data() as OrdenCompra
        const nuevoStock = (ocData.stockActual ?? ocData.cantidad) - input.cantidad
        transaction.update(ocRef, {
          stockActual: nuevoStock,
          updatedAt: serverTimestamp()
        })
      }
      
      // 5. Actualizar cliente (deuda)
      const clienteRef = doc(firestore, 'clientes', input.clienteId)
      const clienteDoc = await transaction.get(clienteRef)
      if (clienteDoc.exists()) {
        const clienteData = clienteDoc.data() as Cliente
        transaction.update(clienteRef, {
          deuda: (clienteData.deuda ?? 0) + montoRestante,
          deudaTotal: (clienteData.deudaTotal ?? 0) + montoRestante,
          totalVentas: (clienteData.totalVentas ?? 0) + distribucion.ingresoVenta,
          totalPagado: (clienteData.totalPagado ?? 0) + montoPagado,
          abonos: (clienteData.abonos ?? 0) + montoPagado,
          pendiente: (clienteData.deuda ?? 0) + montoRestante - ((clienteData.abonos ?? 0) + montoPagado),
          numeroCompras: (clienteData.numeroCompras ?? 0) + 1,
          ultimaCompra: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      
      // 6. SIEMPRE registrar históricos completos en bancos (aunque sea pendiente)
      // El capitalActual solo suma si hay pago, pero historicoIngresos siempre registra
      const bovedaRef = doc(firestore, 'bancos', 'boveda_monte')
      const fletesRef = doc(firestore, 'bancos', 'flete_sur')
      const utilidadesRef = doc(firestore, 'bancos', 'utilidades')
      
      if (montoPagado > 0) {
        // Si hay pago, distribuir proporcionalmente al capital Y al histórico
        const distribucionParcial = calcularDistribucionParcial(
          montoPagado,
          distribucion.ingresoVenta,
          distribucion.montoBovedaMonte,
          distribucion.montoFletes,
          distribucion.montoUtilidades
        )
        
        // Actualizar Bóveda Monte (capital + histórico)
        transaction.update(bovedaRef, {
          capitalActual: firestoreIncrement(distribucionParcial.bovedaMonte),
          historicoIngresos: firestoreIncrement(distribucion.montoBovedaMonte), // Histórico completo
          updatedAt: serverTimestamp()
        })
        
        // Actualizar Fletes (capital + histórico)
        if (distribucion.montoFletes > 0) {
          transaction.update(fletesRef, {
            capitalActual: firestoreIncrement(distribucionParcial.fletes),
            historicoIngresos: firestoreIncrement(distribucion.montoFletes), // Histórico completo
            updatedAt: serverTimestamp()
          })
        }
        
        // Actualizar Utilidades (capital + histórico)
        transaction.update(utilidadesRef, {
          capitalActual: firestoreIncrement(distribucionParcial.utilidades),
          historicoIngresos: firestoreIncrement(distribucion.montoUtilidades), // Histórico completo
          updatedAt: serverTimestamp()
        })
      } else {
        // Venta PENDIENTE: Solo registrar en históricos, NO en capitalActual
        transaction.update(bovedaRef, {
          historicoIngresos: firestoreIncrement(distribucion.montoBovedaMonte),
          updatedAt: serverTimestamp()
        })
        
        if (distribucion.montoFletes > 0) {
          transaction.update(fletesRef, {
            historicoIngresos: firestoreIncrement(distribucion.montoFletes),
            updatedAt: serverTimestamp()
          })
        }
        
        transaction.update(utilidadesRef, {
          historicoIngresos: firestoreIncrement(distribucion.montoUtilidades),
          updatedAt: serverTimestamp()
        })
      }
        
      // 7. Crear movimientos financieros (siempre, indicando estado)
      const movimientoBase = {
        ventaId,
        clienteId: input.clienteId,
        cliente: input.clienteNombre || '',
        fecha: Timestamp.now(),
        tipoMovimiento: 'ingreso' as const,
        referenciaTipo: 'venta' as const,
        referenciaId: ventaId,
        estadoPago, // Incluir estado para identificar pendientes
        createdAt: Timestamp.now()
      }
      
      // Movimiento Bóveda Monte
      const movBovedaRef = doc(collection(firestore, 'movimientos'))
      transaction.set(movBovedaRef, {
        ...movimientoBase,
        id: movBovedaRef.id,
        bancoId: 'boveda_monte',
        monto: distribucion.montoBovedaMonte,
        montoPagado: montoPagado > 0 ? (distribucion.montoBovedaMonte * montoPagado / distribucion.ingresoVenta) : 0,
        concepto: `Venta ${ventaId} - Costo mercancía${estadoPago === 'pendiente' ? ' (PENDIENTE)' : ''}`,
      })
      
      // Movimiento Fletes
      if (distribucion.montoFletes > 0) {
        const movFletesRef = doc(collection(firestore, 'movimientos'))
        transaction.set(movFletesRef, {
          ...movimientoBase,
          id: movFletesRef.id,
          bancoId: 'flete_sur',
          monto: distribucion.montoFletes,
          montoPagado: montoPagado > 0 ? (distribucion.montoFletes * montoPagado / distribucion.ingresoVenta) : 0,
          concepto: `Venta ${ventaId} - Fletes${estadoPago === 'pendiente' ? ' (PENDIENTE)' : ''}`,
        })
      }
      
      // Movimiento Utilidades
      const movUtilidadesRef = doc(collection(firestore, 'movimientos'))
      transaction.set(movUtilidadesRef, {
        ...movimientoBase,
        id: movUtilidadesRef.id,
        bancoId: 'utilidades',
        monto: distribucion.montoUtilidades,
        montoPagado: montoPagado > 0 ? (distribucion.montoUtilidades * montoPagado / distribucion.ingresoVenta) : 0,
        concepto: `Venta ${ventaId} - Utilidad${estadoPago === 'pendiente' ? ' (PENDIENTE)' : ''}`,
      })
    })
    
    logger.info('Venta registrada exitosamente', { data: { ventaId, input } })
    return ventaId
    
  } catch (error) {
    logger.error('Error al registrar venta', { data: { error, input } })
    throw new Error('No se pudo registrar la venta. Intenta de nuevo.')
  }
}

/**
 * Registra un abono de cliente
 * 
 * FLUJO:
 * 1. Actualiza perfil del cliente (abonos, pendiente)
 * 2. Actualiza estado de venta relacionada (si se especifica)
 * 3. Distribuye el pago proporcionalmente a los 3 bancos
 * 4. Crea registro en gastos_abonos como ABONO
 */
export async function registrarAbonoCliente(input: AbonoClienteInput): Promise<string> {
  const abonoId = `ABO-${Date.now()}`
  const firestore = getFirestoreInstance()
  
  try {
    await runTransaction(firestore, async (transaction) => {
      // 1. Obtener datos del cliente
      const clienteRef = doc(firestore, 'clientes', input.clienteId)
      const clienteDoc = await transaction.get(clienteRef)
      
      if (!clienteDoc.exists()) {
        throw new Error(`Cliente ${input.clienteId} no encontrado`)
      }
      
      const clienteData = clienteDoc.data() as Cliente
      
      // 2. Actualizar cliente
      const nuevosAbonos = (clienteData.abonos ?? 0) + input.monto
      const nuevaDeuda = clienteData.deuda ?? 0
      const nuevoPendiente = nuevaDeuda - nuevosAbonos
      
      transaction.update(clienteRef, {
        abonos: nuevosAbonos,
        totalPagado: (clienteData.totalPagado ?? 0) + input.monto,
        pendiente: nuevoPendiente,
        updatedAt: serverTimestamp(),
        historialPagos: [
          ...(clienteData.historialPagos ?? []),
          {
            fecha: Timestamp.now(),
            monto: input.monto,
            ventaId: input.ventaRelacionada
          }
        ]
      })
      
      // 3. Si hay venta relacionada, actualizar su estado
      if (input.ventaRelacionada) {
        const ventaRef = doc(firestore, 'ventas', input.ventaRelacionada)
        const ventaDoc = await transaction.get(ventaRef)
        
        if (ventaDoc.exists()) {
          const ventaData = ventaDoc.data() as Venta
          const nuevoMontoPagado = (ventaData.montoPagado ?? 0) + input.monto
          const nuevoMontoRestante = (ventaData.precioTotalVenta ?? 0) - nuevoMontoPagado
          const nuevoEstado = nuevoMontoRestante <= 0 
            ? 'completo' 
            : nuevoMontoPagado > 0 
              ? 'parcial' 
              : 'pendiente'
          
          transaction.update(ventaRef, {
            montoPagado: nuevoMontoPagado,
            montoRestante: Math.max(0, nuevoMontoRestante),
            adeudo: Math.max(0, nuevoMontoRestante),
            estadoPago: nuevoEstado,
            estatus: nuevoEstado === 'completo' ? 'Pagado' : 'Pendiente',
            updatedAt: serverTimestamp()
          })
          
          // 4. Distribuir a bancos proporcionalmente
          const proporcion = input.monto / (ventaData.precioTotalVenta ?? 1)
          const distribucion = ventaData.distribucionBancos ?? {
            bovedaMonte: ventaData.bovedaMonte ?? 0,
            fletes: ventaData.fleteUtilidad ?? 0,
            utilidades: ventaData.utilidad ?? 0
          }
          
          // Bóveda Monte
          const montoBovedaMonte = distribucion.bovedaMonte * proporcion
          const bovedaRef = doc(firestore, 'bancos', 'boveda_monte')
          transaction.update(bovedaRef, {
            capitalActual: firestoreIncrement(montoBovedaMonte),
            historicoIngresos: firestoreIncrement(montoBovedaMonte),
            updatedAt: serverTimestamp()
          })
          
          // Fletes
          if (distribucion.fletes > 0) {
            const montoFletes = distribucion.fletes * proporcion
            const fletesRef = doc(firestore, 'bancos', 'flete_sur')
            transaction.update(fletesRef, {
              capitalActual: firestoreIncrement(montoFletes),
              historicoIngresos: firestoreIncrement(montoFletes),
              updatedAt: serverTimestamp()
            })
          }
          
          // Utilidades
          const montoUtilidades = distribucion.utilidades * proporcion
          const utilidadesRef = doc(firestore, 'bancos', 'utilidades')
          transaction.update(utilidadesRef, {
            capitalActual: firestoreIncrement(montoUtilidades),
            historicoIngresos: firestoreIncrement(montoUtilidades),
            updatedAt: serverTimestamp()
          })
        }
      } else {
        // Sin venta específica: Distribuir proporcionalmente según promedio del sistema
        // Proporciones típicas: 60% Bóveda Monte (costo), 5% Fletes, 35% Utilidades
        const PROPORCION_BOVEDA = 0.60
        const PROPORCION_FLETES = 0.05
        const PROPORCION_UTILIDADES = 0.35
        
        const montoBovedaMonte = input.monto * PROPORCION_BOVEDA
        const montoFletes = input.monto * PROPORCION_FLETES
        const montoUtilidades = input.monto * PROPORCION_UTILIDADES
        
        const bovedaRef = doc(firestore, 'bancos', 'boveda_monte')
        transaction.update(bovedaRef, {
          capitalActual: firestoreIncrement(montoBovedaMonte),
          historicoIngresos: firestoreIncrement(montoBovedaMonte),
          updatedAt: serverTimestamp()
        })
        
        const fletesRef = doc(firestore, 'bancos', 'flete_sur')
        transaction.update(fletesRef, {
          capitalActual: firestoreIncrement(montoFletes),
          historicoIngresos: firestoreIncrement(montoFletes),
          updatedAt: serverTimestamp()
        })
        
        const utilidadesRef = doc(firestore, 'bancos', 'utilidades')
        transaction.update(utilidadesRef, {
          capitalActual: firestoreIncrement(montoUtilidades),
          historicoIngresos: firestoreIncrement(montoUtilidades),
          updatedAt: serverTimestamp()
        })
      }
      
      // 5. Crear registro en gastos_abonos
      const gastoAbonoRef = doc(firestore, 'gastos_abonos', abonoId)
      const gastoAbonoData: Partial<GastoAbono> = {
        id: abonoId,
        fecha: Timestamp.now(),
        tipo: 'abono',
        origen: input.clienteNombre,
        valor: input.monto,
        monto: input.monto,
        tc: 1, // Peso mexicano default
        pesos: input.monto,
        destino: 'boveda_monte', // Principal destino
        bancoId: 'boveda_monte',
        concepto: input.concepto ?? `Abono cliente ${input.clienteNombre}`,
        entidadId: input.clienteId,
        entidadTipo: 'cliente',
        createdAt: Timestamp.now()
      }
      transaction.set(gastoAbonoRef, gastoAbonoData)
    })
    
    logger.info('Abono de cliente registrado', { data: { abonoId, input } })
    return abonoId
    
  } catch (error) {
    logger.error('Error al registrar abono de cliente', { data: { error, input } })
    throw new Error('No se pudo registrar el abono. Intenta de nuevo.')
  }
}

/**
 * Registra un pago a distribuidor
 * 
 * FLUJO:
 * 1. Descuenta del banco seleccionado
 * 2. Actualiza deuda del distribuidor
 * 3. Actualiza deuda de OC relacionada (si se especifica)
 * 4. Registra en gastos_abonos como GASTO
 * 5. Crea movimiento financiero
 * 
 * IMPORTANTE: Los pagos a distribuidores van a la tabla de GASTOS
 */
export async function registrarPagoDistribuidor(input: PagoDistribuidorInput): Promise<string> {
  const pagoId = `PAGO-DIST-${Date.now()}`
  const firestore = getFirestoreInstance()
  
  try {
    await runTransaction(firestore, async (transaction) => {
      // 1. Descontar del banco origen
      const bancoRef = doc(firestore, 'bancos', input.bancoOrigen)
      const bancoDoc = await transaction.get(bancoRef)
      
      if (!bancoDoc.exists()) {
        throw new Error(`Banco ${input.bancoOrigen} no encontrado`)
      }
      
      transaction.update(bancoRef, {
        capitalActual: firestoreIncrement(-input.monto),
        historicoGastos: firestoreIncrement(input.monto),
        updatedAt: serverTimestamp()
      })
      
      // 2. Actualizar distribuidor
      const distribuidorRef = doc(firestore, 'distribuidores', input.distribuidorId)
      const distribuidorDoc = await transaction.get(distribuidorRef)
      
      if (distribuidorDoc.exists()) {
        const distribuidorData = distribuidorDoc.data() as Distribuidor
        const nuevaDeuda = Math.max(0, (distribuidorData.deudaTotal ?? 0) - input.monto)
        
        transaction.update(distribuidorRef, {
          deudaTotal: nuevaDeuda,
          pendiente: nuevaDeuda,
          totalPagado: (distribuidorData.totalPagado ?? 0) + input.monto,
          abonos: (distribuidorData.abonos ?? 0) + input.monto,
          updatedAt: serverTimestamp(),
          historialPagos: [
            ...(distribuidorData.historialPagos ?? []),
            {
              fecha: Timestamp.now(),
              monto: input.monto,
              bancoOrigen: input.bancoOrigen,
              ordenCompraId: input.ordenCompraRelacionada
            }
          ]
        })
      }
      
      // 3. Actualizar OC relacionada si existe
      if (input.ordenCompraRelacionada) {
        const ocRef = doc(firestore, 'ordenes_compra', input.ordenCompraRelacionada)
        const ocDoc = await transaction.get(ocRef)
        
        if (ocDoc.exists()) {
          const ocData = ocDoc.data() as OrdenCompra
          const nuevaDeudaOC = Math.max(0, (ocData.deuda ?? 0) - input.monto)
          const nuevoEstadoOC = nuevaDeudaOC === 0 
            ? 'pagado' 
            : input.monto > 0 
              ? 'parcial' 
              : ocData.estado
          
          transaction.update(ocRef, {
            deuda: nuevaDeudaOC,
            pagoDistribuidor: (ocData.pagoDistribuidor ?? 0) + input.monto,
            estado: nuevoEstadoOC,
            updatedAt: serverTimestamp()
          })
        }
      }
      
      // 4. Registrar en gastos_abonos como GASTO
      const gastoRef = doc(firestore, 'gastos_abonos', pagoId)
      const gastoData: Partial<GastoAbono> = {
        id: pagoId,
        fecha: Timestamp.now(),
        tipo: 'gasto',
        origen: `Gasto ${input.bancoOrigen.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        valor: input.monto,
        monto: input.monto,
        tc: input.tc ?? 1,
        pesos: input.monto * (input.tc ?? 1),
        destino: 'NA',
        bancoId: input.bancoOrigen,
        concepto: input.concepto ?? `Pago a distribuidor ${input.distribuidorNombre || ''}`,
        observaciones: input.ordenCompraRelacionada 
          ? `OC: ${input.ordenCompraRelacionada}` 
          : undefined,
        entidadId: input.distribuidorId,
        entidadTipo: 'distribuidor',
        createdAt: Timestamp.now()
      }
      transaction.set(gastoRef, gastoData)
      
      // 5. Crear movimiento financiero
      const movimientoRef = doc(collection(firestore, 'movimientos'))
      transaction.set(movimientoRef, {
        id: movimientoRef.id,
        bancoId: input.bancoOrigen,
        tipoMovimiento: 'pago_distribuidor',
        fecha: Timestamp.now(),
        monto: input.monto,
        concepto: input.concepto ?? `Pago distribuidor ${input.distribuidorNombre || ''}`,
        referenciaId: input.ordenCompraRelacionada,
        referenciaTipo: 'orden_compra',
        createdAt: Timestamp.now()
      })
    })
    
    logger.info('Pago a distribuidor registrado', { data: { pagoId, input } })
    return pagoId
    
  } catch (error) {
    logger.error('Error al registrar pago a distribuidor', { data: { error, input } })
    throw new Error('No se pudo registrar el pago al distribuidor. Intenta de nuevo.')
  }
}

/**
 * Registra una transferencia entre bancos
 */
export async function registrarTransferencia(input: TransferenciaInput): Promise<string> {
  const transferenciaId = `TRANS-${Date.now()}`
  const firestore = getFirestoreInstance()
  
  try {
    await runTransaction(firestore, async (transaction) => {
      // Descontar del banco origen
      const bancoOrigenRef = doc(firestore, 'bancos', input.bancoOrigen)
      transaction.update(bancoOrigenRef, {
        capitalActual: firestoreIncrement(-input.monto),
        historicoTransferencias: firestoreIncrement(input.monto),
        updatedAt: serverTimestamp()
      })
      
      // Agregar al banco destino
      const bancoDestinoRef = doc(firestore, 'bancos', input.bancoDestino)
      transaction.update(bancoDestinoRef, {
        capitalActual: firestoreIncrement(input.monto),
        historicoTransferencias: firestoreIncrement(input.monto),
        updatedAt: serverTimestamp()
      })
      
      // Crear registro de transferencia
      const transferenciaRef = doc(firestore, 'transferencias', transferenciaId)
      transaction.set(transferenciaRef, {
        id: transferenciaId,
        fecha: Timestamp.now(),
        bancoOrigen: input.bancoOrigen,
        bancoDestino: input.bancoDestino,
        monto: input.monto,
        tc: input.tc ?? 1,
        concepto: input.concepto ?? 'Transferencia entre cuentas',
        estado: 'completada',
        createdAt: Timestamp.now()
      })
      
      // Movimiento de salida en origen
      const movSalidaRef = doc(collection(firestore, 'movimientos'))
      transaction.set(movSalidaRef, {
        id: movSalidaRef.id,
        bancoId: input.bancoOrigen,
        tipoMovimiento: 'transferencia_salida',
        fecha: Timestamp.now(),
        monto: input.monto,
        concepto: `Transferencia a ${input.bancoDestino}`,
        destino: input.bancoDestino,
        referenciaId: transferenciaId,
        referenciaTipo: 'transferencia',
        createdAt: Timestamp.now()
      })
      
      // Movimiento de entrada en destino
      const movEntradaRef = doc(collection(firestore, 'movimientos'))
      transaction.set(movEntradaRef, {
        id: movEntradaRef.id,
        bancoId: input.bancoDestino,
        tipoMovimiento: 'transferencia_entrada',
        fecha: Timestamp.now(),
        monto: input.monto,
        concepto: `Transferencia desde ${input.bancoOrigen}`,
        origen: input.bancoOrigen,
        referenciaId: transferenciaId,
        referenciaTipo: 'transferencia',
        createdAt: Timestamp.now()
      })
    })
    
    logger.info('Transferencia registrada', { data: { transferenciaId, input } })
    return transferenciaId
    
  } catch (error) {
    logger.error('Error al registrar transferencia', { data: { error, input } })
    throw new Error('No se pudo registrar la transferencia. Intenta de nuevo.')
  }
}

/**
 * Registra una nueva orden de compra
 * 
 * FLUJO:
 * 1. Crea registro de OC
 * 2. Actualiza distribuidor (deuda)
 * 3. Actualiza stock en almacén
 * 4. Si hay pago inicial, registra como gasto
 */
export async function registrarOrdenCompra(
  distribuidorId: string,
  distribuidorNombre: string,
  cantidad: number,
  costoDistribuidor: number,
  costoTransporte: number = 0,
  pagoInicial: number = 0,
  bancoOrigen?: BancoId,
  notas?: string
): Promise<string> {
  const ocId = `OC${String(Date.now()).slice(-4).padStart(4, '0')}`
  const firestore = getFirestoreInstance()
  
  try {
    await runTransaction(firestore, async (transaction) => {
      const costoPorUnidad = costoDistribuidor + costoTransporte
      const costoTotal = costoPorUnidad * cantidad
      const deuda = costoTotal - pagoInicial
      const estado = deuda === 0 
        ? 'pagado' 
        : pagoInicial > 0 
          ? 'parcial' 
          : 'pendiente'
      
      // 1. Crear OC
      const ocRef = doc(firestore, 'ordenes_compra', ocId)
      transaction.set(ocRef, {
        id: ocId,
        fecha: Timestamp.now(),
        distribuidorId,
        distribuidor: distribuidorNombre,
        origen: distribuidorNombre,
        cantidad,
        costoDistribuidor,
        costoTransporte,
        costoPorUnidad,
        costoTotal,
        stockActual: cantidad,
        stockInicial: cantidad,
        pagoDistribuidor: pagoInicial,
        pagoInicial,
        deuda,
        bancoOrigen,
        estado,
        keywords: [
          ocId.toLowerCase(),
          distribuidorNombre.toLowerCase()
        ],
        notas,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      // 2. Actualizar distribuidor
      const distribuidorRef = doc(firestore, 'distribuidores', distribuidorId)
      const distribuidorDoc = await transaction.get(distribuidorRef)
      
      if (distribuidorDoc.exists()) {
        const distribuidorData = distribuidorDoc.data() as Distribuidor
        transaction.update(distribuidorRef, {
          costoTotal: (distribuidorData.costoTotal ?? 0) + costoTotal,
          totalOrdenesCompra: (distribuidorData.totalOrdenesCompra ?? 0) + costoTotal,
          deudaTotal: (distribuidorData.deudaTotal ?? 0) + deuda,
          pendiente: (distribuidorData.pendiente ?? 0) + deuda,
          totalPagado: (distribuidorData.totalPagado ?? 0) + pagoInicial,
          abonos: (distribuidorData.abonos ?? 0) + pagoInicial,
          numeroOrdenes: (distribuidorData.numeroOrdenes ?? 0) + 1,
          ultimaOrden: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ordenesCompra: [...(distribuidorData.ordenesCompra ?? []), ocId]
        })
      }
      
      // 3. Si hay pago inicial, descontar de banco y registrar gasto
      if (pagoInicial > 0 && bancoOrigen) {
        const bancoRef = doc(firestore, 'bancos', bancoOrigen)
        transaction.update(bancoRef, {
          capitalActual: firestoreIncrement(-pagoInicial),
          historicoGastos: firestoreIncrement(pagoInicial),
          updatedAt: serverTimestamp()
        })
        
        // Registrar como gasto
        const gastoRef = doc(firestore, 'gastos_abonos', `GASTO-OC-${ocId}`)
        transaction.set(gastoRef, {
          id: `GASTO-OC-${ocId}`,
          fecha: Timestamp.now(),
          tipo: 'gasto',
          origen: `Gasto ${bancoOrigen.replace('_', ' ')}`,
          valor: pagoInicial,
          monto: pagoInicial,
          tc: 1,
          pesos: pagoInicial,
          destino: 'NA',
          bancoId: bancoOrigen,
          concepto: `Pago inicial OC ${ocId} - ${distribuidorNombre}`,
          entidadId: distribuidorId,
          entidadTipo: 'distribuidor',
          createdAt: Timestamp.now()
        })
      }
      
      // 4. Crear entrada en almacén
      const almacenRef = doc(collection(firestore, 'movimientos_almacen'))
      transaction.set(almacenRef, {
        id: almacenRef.id,
        tipo: 'entrada',
        fecha: Timestamp.now(),
        productoId: ocId,
        productoNombre: `Lote ${ocId}`,
        cantidad,
        stockAnterior: 0,
        stockNuevo: cantidad,
        costoUnitario: costoPorUnidad,
        valorTotal: costoTotal,
        referenciaId: ocId,
        referenciaTipo: 'orden_compra',
        origen: distribuidorNombre,
        createdAt: Timestamp.now()
      })
    })
    
    logger.info('Orden de compra registrada', { data: { ocId, distribuidorId, cantidad } })
    return ocId
    
  } catch (error) {
    logger.error('Error al registrar orden de compra', { data: { error } })
    throw new Error('No se pudo registrar la orden de compra. Intenta de nuevo.')
  }
}

// ====================================================================
// FUNCIONES DE CONSULTA
// ====================================================================

/**
 * Obtiene el resumen financiero de un cliente
 */
export async function obtenerResumenCliente(clienteId: string): Promise<{
  totalVentas: number
  totalPagado: number
  deudaActual: number
  ventasPendientes: number
}> {
  try {
    const firestore = getFirestoreInstance()
    const clienteRef = doc(firestore, 'clientes', clienteId)
    const clienteDoc = await getDoc(clienteRef)
    
    if (!clienteDoc.exists()) {
      throw new Error('Cliente no encontrado')
    }
    
    const clienteData = clienteDoc.data() as Cliente
    
    return {
      totalVentas: clienteData.totalVentas ?? 0,
      totalPagado: clienteData.totalPagado ?? 0,
      deudaActual: clienteData.pendiente ?? (clienteData.deuda ?? 0) - (clienteData.abonos ?? 0),
      ventasPendientes: (clienteData.ventas ?? []).length // Aproximado, idealmente consultar ventas
    }
  } catch (error) {
    logger.error('Error al obtener resumen de cliente', { data: { error, clienteId } })
    throw error
  }
}

/**
 * Obtiene el resumen financiero de un distribuidor
 */
export async function obtenerResumenDistribuidor(distribuidorId: string): Promise<{
  totalCompras: number
  totalPagado: number
  deudaActual: number
  ordenesActivas: number
}> {
  try {
    const firestore = getFirestoreInstance()
    const distribuidorRef = doc(firestore, 'distribuidores', distribuidorId)
    const distribuidorDoc = await getDoc(distribuidorRef)
    
    if (!distribuidorDoc.exists()) {
      throw new Error('Distribuidor no encontrado')
    }
    
    const distribuidorData = distribuidorDoc.data() as Distribuidor
    
    return {
      totalCompras: distribuidorData.totalOrdenesCompra ?? 0,
      totalPagado: distribuidorData.totalPagado ?? 0,
      deudaActual: distribuidorData.deudaTotal ?? 0,
      ordenesActivas: (distribuidorData.ordenesCompra ?? []).length
    }
  } catch (error) {
    logger.error('Error al obtener resumen de distribuidor', { data: { error, distribuidorId } })
    throw error
  }
}
