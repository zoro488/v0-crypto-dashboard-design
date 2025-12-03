/**
 * ====================================================================
 * LÓGICA DE NEGOCIO COMPLETA - FLOWDISTRIBUTOR/CHRONOS
 * ====================================================================
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
 * @version 3.0 - Sin Firebase, solo localStorage
 */

import { logger } from '@/app/lib/utils/logger'
import * as localService from '@/app/lib/storage/local-storage-service'
import type { 
  BancoId,
  CalculoVentaResult, 
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
  'utilidades',
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
  ocId?: string
  cantidad: number
  precioVenta: number
  precioCompra: number
  flete: 'Aplica' | 'NoAplica'
  precioFlete?: number
  metodoPago?: string
  bancoDestino?: BancoId
  montoPagado?: number
  concepto?: string
}

export interface AbonoClienteInput {
  clienteId: string
  clienteNombre?: string
  monto: number
  bancoOrigen?: BancoId
  metodoPago?: string
  metodo?: string
  referencia?: string
  ventaRelacionada?: string
  concepto?: string
  notas?: string
}

export interface PagoDistribuidorInput {
  distribuidorId: string
  distribuidorNombre?: string
  monto: number
  bancoOrigen: BancoId
  ordenCompraRelacionada?: string
  concepto?: string
  metodo?: string
  referencia?: string
  notas?: string
  tc?: number
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
  precioFlete: number = PRECIO_FLETE_DEFAULT,
): CalculoVentaResult {
  const montoBovedaMonte = precioCompra * cantidad
  const montoFletes = aplicaFlete ? precioFlete * cantidad : 0
  const ingresoVenta = precioVenta * cantidad
  const montoUtilidades = (precioVenta - precioCompra - (aplicaFlete ? precioFlete : 0)) * cantidad
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
    proporcionPagada: 1,
    distribucionParcial: {
      bovedaMonte: montoBovedaMonte,
      fletes: montoFletes,
      utilidades: montoUtilidades,
    },
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
  montoUtilidades: number,
): { bovedaMonte: number; fletes: number; utilidades: number } {
  const proporcion = totalVenta > 0 ? montoPagado / totalVenta : 0
  
  return {
    bovedaMonte: montoBovedaMonte * proporcion,
    fletes: montoFletes * proporcion,
    utilidades: montoUtilidades * proporcion,
  }
}

// ====================================================================
// REGISTRAR VENTA - Usando localStorage
// ====================================================================

export async function registrarVenta(input: NuevaVentaInput): Promise<string> {
  try {
    // 1. Calcular distribución
    const distribucion = calcularDistribucionVenta(
      input.cantidad,
      input.precioVenta,
      input.precioCompra,
      input.flete === 'Aplica',
      input.precioFlete ?? PRECIO_FLETE_DEFAULT,
    )
    
    // 2. Determinar estado de pago
    const montoPagado = input.montoPagado ?? 0
    const montoRestante = distribucion.ingresoVenta - montoPagado
    const estadoPago = montoPagado >= distribucion.ingresoVenta 
      ? 'completo' 
      : montoPagado > 0 
        ? 'parcial' 
        : 'pendiente'
    
    // 3. Crear venta en localStorage
    const ventaId = localService.localCrearVenta({
      cliente: input.clienteNombre || '',
      clienteId: input.clienteId,
      cantidad: input.cantidad,
      precioVenta: input.precioVenta,
      precioTotalVenta: distribucion.ingresoVenta,
      precioCompra: input.precioCompra,
      flete: input.flete,
      precioFlete: input.precioFlete ?? PRECIO_FLETE_DEFAULT,
      montoPagado,
      concepto: input.concepto || `OC: ${input.ocRelacionada || 'N/A'}`,
    })
    
    // 4. Actualizar bancos si hay pago
    if (montoPagado > 0) {
      const distribucionParcial = calcularDistribucionParcial(
        montoPagado,
        distribucion.ingresoVenta,
        distribucion.montoBovedaMonte,
        distribucion.montoFletes,
        distribucion.montoUtilidades,
      )
      
      localService.localActualizarCapitalBanco('boveda_monte', distribucionParcial.bovedaMonte, 'ingreso')
      if (distribucionParcial.fletes > 0) {
        localService.localActualizarCapitalBanco('flete_sur', distribucionParcial.fletes, 'ingreso')
      }
      localService.localActualizarCapitalBanco('utilidades', distribucionParcial.utilidades, 'ingreso')
    }
    
    logger.info('Venta registrada', { context: 'BusinessLogic', data: { ventaId } })
    return ventaId
  } catch (error) {
    logger.error('Error al registrar venta', error, { context: 'BusinessLogic' })
    throw error
  }
}

// ====================================================================
// REGISTRAR ABONO DE CLIENTE
// ====================================================================

export async function registrarAbonoCliente(input: AbonoClienteInput): Promise<string> {
  try {
    const abonoId = localService.localCrearAbono({
      tipo: 'cliente',
      entidadId: input.clienteId,
      monto: input.monto,
      bancoDestino: 'utilidades', // Por defecto abonos van a utilidades
      metodo: (input.metodoPago || input.metodo || 'efectivo') as 'efectivo' | 'transferencia' | 'cheque',
      referencia: input.referencia,
      notas: input.notas,
    })
    
    // Actualizar bancos con distribución proporcional
    // Por defecto, abonos van a utilidades
    localService.localActualizarCapitalBanco('utilidades', input.monto, 'ingreso')
    
    logger.info('Abono registrado', { context: 'BusinessLogic', data: { abonoId } })
    return abonoId
  } catch (error) {
    logger.error('Error al registrar abono', error, { context: 'BusinessLogic' })
    throw error
  }
}

// ====================================================================
// REGISTRAR PAGO A DISTRIBUIDOR
// ====================================================================

export async function registrarPagoDistribuidor(input: PagoDistribuidorInput): Promise<string> {
  try {
    // Registrar gasto
    const gastoId = localService.localCrearGasto({
      monto: input.monto,
      bancoOrigen: input.bancoOrigen,
      concepto: input.concepto || `Pago a distribuidor ${input.distribuidorNombre || input.distribuidorId}`,
      referencia: input.referencia,
      notas: input.notas,
    })
    
    // Actualizar capital del banco origen
    localService.localActualizarCapitalBanco(input.bancoOrigen, input.monto, 'gasto')
    
    // Pagar al distribuidor
    if (input.ordenCompraRelacionada) {
      localService.localPagarDistribuidor(
        input.distribuidorId, 
        input.ordenCompraRelacionada, 
        input.monto, 
        input.bancoOrigen
      )
    }
    
    logger.info('Pago a distribuidor registrado', { context: 'BusinessLogic', data: { gastoId } })
    return gastoId
  } catch (error) {
    logger.error('Error al registrar pago a distribuidor', error, { context: 'BusinessLogic' })
    throw error
  }
}

// ====================================================================
// REGISTRAR TRANSFERENCIA
// ====================================================================

export async function registrarTransferencia(input: TransferenciaInput): Promise<string> {
  try {
    const transferenciaId = localService.localCrearTransferencia({
      bancoOrigenId: input.bancoOrigen,
      bancoDestinoId: input.bancoDestino,
      monto: input.monto,
      concepto: input.concepto || `Transferencia de ${input.bancoOrigen} a ${input.bancoDestino}`,
    })
    
    // Actualizar bancos
    localService.localActualizarCapitalBanco(input.bancoOrigen, input.monto, 'gasto')
    localService.localActualizarCapitalBanco(input.bancoDestino, input.monto, 'ingreso')
    
    logger.info('Transferencia registrada', { context: 'BusinessLogic', data: { transferenciaId } })
    return transferenciaId
  } catch (error) {
    logger.error('Error al registrar transferencia', error, { context: 'BusinessLogic' })
    throw error
  }
}

// ====================================================================
// REGISTRAR ORDEN DE COMPRA
// ====================================================================

export async function registrarOrdenCompra(data: {
  distribuidorId: string
  distribuidorNombre?: string
  cantidad: number
  precioCompra: number
  producto?: string
  notas?: string
}): Promise<string> {
  try {
    const ordenId = localService.localCrearOrdenCompra({
      distribuidor: data.distribuidorNombre || data.distribuidorId,
      distribuidorId: data.distribuidorId,
      cantidad: data.cantidad,
      costoPorUnidad: data.precioCompra,
      costoTotal: data.cantidad * data.precioCompra,
      producto: data.producto,
      notas: data.notas,
    })
    
    logger.info('Orden de compra registrada', { context: 'BusinessLogic', data: { ordenId } })
    return ordenId
  } catch (error) {
    logger.error('Error al registrar orden de compra', error, { context: 'BusinessLogic' })
    throw error
  }
}

// ====================================================================
// OBTENER RESUMEN DE CLIENTE
// ====================================================================

export async function obtenerResumenCliente(clienteId: string): Promise<{
  totalVentas: number
  totalPagado: number
  deudaActual: number
  ventasPendientes: number
}> {
  try {
    const clientes = localService.localObtenerClientes()
    const cliente = clientes.find(c => c.id === clienteId)
    
    if (!cliente) {
      return {
        totalVentas: 0,
        totalPagado: 0,
        deudaActual: 0,
        ventasPendientes: 0,
      }
    }
    
    return {
      totalVentas: cliente.totalVentas ?? 0,
      totalPagado: cliente.totalPagado ?? 0,
      deudaActual: cliente.pendiente ?? (cliente.deudaTotal ?? 0) - (cliente.totalPagado ?? 0),
      ventasPendientes: (cliente.ventas ?? []).length,
    }
  } catch (error) {
    logger.error('Error al obtener resumen de cliente', error, { context: 'BusinessLogic' })
    throw error
  }
}

// ====================================================================
// OBTENER RESUMEN DE DISTRIBUIDOR
// ====================================================================

export async function obtenerResumenDistribuidor(distribuidorId: string): Promise<{
  totalCompras: number
  totalPagado: number
  deudaActual: number
  ordenesActivas: number
}> {
  try {
    const distribuidores = localService.localObtenerDistribuidores()
    const distribuidor = distribuidores.find(d => d.id === distribuidorId)
    
    if (!distribuidor) {
      return {
        totalCompras: 0,
        totalPagado: 0,
        deudaActual: 0,
        ordenesActivas: 0,
      }
    }
    
    return {
      totalCompras: distribuidor.totalOrdenesCompra ?? 0,
      totalPagado: distribuidor.totalPagado ?? 0,
      deudaActual: distribuidor.deudaTotal ?? 0,
      ordenesActivas: (distribuidor.ordenesCompra ?? []).length,
    }
  } catch (error) {
    logger.error('Error al obtener resumen de distribuidor', error, { context: 'BusinessLogic' })
    throw error
  }
}

// ====================================================================
// EXPORTS ADICIONALES PARA COMPATIBILIDAD
// ====================================================================

export const businessLogicService = {
  calcularDistribucionVenta,
  calcularDistribucionParcial,
  registrarVenta,
  registrarAbonoCliente,
  registrarPagoDistribuidor,
  registrarTransferencia,
  registrarOrdenCompra,
  obtenerResumenCliente,
  obtenerResumenDistribuidor,
}

export default businessLogicService
