/**
 * ====================================================================
 * HOOKS DE OPERACIONES DE NEGOCIO - FLOWDISTRIBUTOR/CHRONOS
 * ====================================================================
 * 
 * Hooks para ejecutar operaciones de negocio con la lógica correcta:
 * - Registro de ventas con distribución a 3 bancos
 * - Registro de abonos de clientes
 * - Registro de pagos a distribuidores (GASTOS)
 * - Transferencias entre bancos
 * 
 * IMPORTANTE: Estos hooks utilizan el servicio centralizado de lógica de negocio
 * para garantizar consistencia en todas las operaciones.
 * 
 * @author Chronos System
 * @version 3.0
 */

import { useState, useCallback } from 'react'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'
// Importar desde el nuevo servicio de operaciones de negocio
import {
  crearOrdenCompraCompleta,
  crearVentaCompleta,
  abonarCliente,
  pagarDistribuidor,
  realizarTransferencia,
  registrarGasto,
  registrarIngreso,
  type CrearOrdenCompraInput,
  type OrdenCompraResult,
  type CrearVentaInput,
  type VentaResult,
  type AbonarClienteInput,
  type PagarDistribuidorInput,
  type TransferenciaInput as BizTransferenciaInput,
  type RegistrarGastoInput,
  type RegistrarIngresoInput,
} from '@/app/lib/services/business-operations.service'
// Mantener compatibilidad con business-logic.service si existe
import type { BancoId, CalculoVentaResult } from '@/app/types'

// Re-export tipos del nuevo servicio
export type {
  CrearOrdenCompraInput,
  OrdenCompraResult,
  CrearVentaInput,
  VentaResult,
  AbonarClienteInput,
  PagarDistribuidorInput,
  RegistrarGastoInput,
  RegistrarIngresoInput,
}

// Alias para mantener compatibilidad con versiones anteriores
export type DatosVenta = CrearVentaInput
export type DatosAbonoCliente = AbonarClienteInput
export type DatosPagoDistribuidor = PagarDistribuidorInput
export type DatosTransferencia = BizTransferenciaInput
export type DatosOrdenCompra = CrearOrdenCompraInput

// Lista de bancos disponibles en el sistema
export const BANCOS_LIST: Array<{ id: BancoId; nombre: string; tipo: string }> = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', tipo: 'boveda' },
  { id: 'boveda_usa', nombre: 'Bóveda USA', tipo: 'boveda' },
  { id: 'profit', nombre: 'Profit', tipo: 'operativo' },
  { id: 'leftie', nombre: 'Leftie', tipo: 'operativo' },
  { id: 'azteca', nombre: 'Azteca', tipo: 'operativo' },
  { id: 'flete_sur', nombre: 'Flete Sur', tipo: 'gastos' },
  { id: 'utilidades', nombre: 'Utilidades', tipo: 'utilidades' },
]

export const getBancoNombre = (id: BancoId): string => {
  return BANCOS_LIST.find(b => b.id === id)?.nombre || id
}

// ====================================================================
// TIPOS DE RESPUESTA COMUNES
// ====================================================================

export interface OperationResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface UseOperationResult<TInput, TOutput = void> {
  execute: (data: TInput) => Promise<OperationResult<TOutput>>
  loading: boolean
  error: string | null
  reset: () => void
}

// ====================================================================
// HOOK: REGISTRAR VENTA
// ====================================================================

/**
 * Hook para registrar una venta con distribución automática a 3 bancos
 * 
 * Fórmula de distribución:
 * - Bóveda Monte = precioCompra × cantidad
 * - Fletes = precioFlete × cantidad  
 * - Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad
 */
export function useRegistrarVenta(): UseOperationResult<CrearVentaInput, VentaResult> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { triggerDataRefresh } = useAppStore()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: CrearVentaInput): Promise<OperationResult<VentaResult>> => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones previas
      if (!datos.cliente) {
        throw new Error('El cliente es requerido')
      }
      if (datos.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }
      if (datos.precioVenta <= 0) {
        throw new Error('El precio de venta debe ser mayor a 0')
      }

      const result = await crearVentaCompleta(datos)
      
      if (result) {
        triggerDataRefresh()
        logger.info('[useRegistrarVenta] Venta registrada con distribución GYA', { data: result })
        return { success: true, data: result }
      }
      
      throw new Error('No se pudo crear la venta')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar venta'
      setError(mensaje)
      logger.error('[useRegistrarVenta] Error', err)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [triggerDataRefresh])

  return { execute, loading, error, reset }
}

// ====================================================================
// HOOK: CALCULAR PREVIEW DE VENTA
// ====================================================================

/**
 * Hook para previsualizar la distribución antes de confirmar una venta
 */
export function useCalculoVentaPreview() {
  const [preview, setPreview] = useState<CalculoVentaResult | null>(null)

  const calcular = useCallback((
    cantidad: number,
    precioVenta: number,
    precioCompra: number,
    precioFlete: number = 500,
  ): CalculoVentaResult | null => {
    if (cantidad > 0 && precioVenta > 0 && precioCompra >= 0) {
      const totalVenta = cantidad * precioVenta
      const bovedaMonte = cantidad * precioCompra
      const fletes = cantidad * precioFlete
      const utilidades = cantidad * (precioVenta - precioCompra - precioFlete)
      const costoPorUnidad = precioCompra + precioFlete
      const costoTotalLote = costoPorUnidad * cantidad
      
      // Usar los nombres correctos del tipo CalculoVentaResult
      const resultado: CalculoVentaResult = {
        // Costos
        costoPorUnidad,
        costoTotalLote,
        // Venta
        ingresoVenta: totalVenta,
        totalVenta,
        // Distribución a bancos
        montoBovedaMonte: bovedaMonte,
        montoFletes: fletes,
        montoUtilidades: utilidades,
        // Ganancias
        gananciaBruta: utilidades,
        gananciaDesdeCSV: utilidades,
        // Para pagos parciales (asumimos pago completo por defecto)
        proporcionPagada: 1,
        distribucionParcial: {
          bovedaMonte,
          fletes,
          utilidades,
        },
      }
      setPreview(resultado)
      return resultado
    }
    setPreview(null)
    return null
  }, [])

  const reset = useCallback(() => {
    setPreview(null)
  }, [])

  return { preview, calcular, reset }
}

// ====================================================================
// HOOK: REGISTRAR ABONO DE CLIENTE
// ====================================================================

/**
 * Hook para registrar un abono de cliente
 * 
 * Proceso:
 * 1. Actualiza perfil del cliente (abonos += monto, pendiente recalculado)
 * 2. Distribuye proporcionalmente a los 3 bancos según el ratio de la deuda
 * 3. Si paga completamente, cambia estado a 'completo'
 */
export function useRegistrarAbonoCliente(): UseOperationResult<AbonarClienteInput> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { triggerDataRefresh } = useAppStore()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: AbonarClienteInput): Promise<OperationResult> => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!datos.clienteId) {
        throw new Error('El cliente es requerido')
      }
      if (datos.monto <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }

      const result = await abonarCliente(datos)
      
      if (result) {
        triggerDataRefresh()
        logger.info('[useRegistrarAbonoCliente] Abono procesado exitosamente')
        return { success: true }
      }
      
      throw new Error('No se pudo procesar el abono')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar abono'
      setError(mensaje)
      logger.error('[useRegistrarAbonoCliente] Error', err)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [triggerDataRefresh])

  return { execute, loading, error, reset }
}

// ====================================================================
// HOOK: REGISTRAR PAGO A DISTRIBUIDOR (GASTO)
// ====================================================================

/**
 * Hook para registrar un pago a distribuidor
 * 
 * ⚠️ IMPORTANTE: Los pagos a distribuidores son GASTOS, no abonos
 * 
 * Proceso:
 * 1. Descuenta del banco seleccionado (capitalActual -= monto)
 * 2. Registra en movimientos como tipo 'pago_distribuidor'
 * 3. Actualiza deuda del distribuidor
 */
export function usePagoDistribuidor(): UseOperationResult<PagarDistribuidorInput> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { triggerDataRefresh } = useAppStore()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: PagarDistribuidorInput): Promise<OperationResult> => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!datos.distribuidorId) {
        throw new Error('El distribuidor es requerido')
      }
      if (!datos.bancoOrigen) {
        throw new Error('Debe seleccionar el banco de origen')
      }
      if (datos.monto <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }

      const result = await pagarDistribuidor(datos)
      
      if (result) {
        triggerDataRefresh()
        logger.info('[usePagoDistribuidor] Pago procesado exitosamente')
        return { success: true }
      }
      
      throw new Error('No se pudo procesar el pago')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar pago'
      setError(mensaje)
      logger.error('[usePagoDistribuidor] Error', err)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [triggerDataRefresh])

  return { execute, loading, error, reset }
}

// ====================================================================
// HOOK: REGISTRAR ORDEN DE COMPRA
// ====================================================================

/**
 * Hook para registrar una nueva orden de compra
 * 
 * Proceso:
 * 1. Crea la OC con stock inicial = cantidad
 * 2. Crea/Actualiza perfil distribuidor con deuda
 * 3. Crea entrada en almacén
 * 4. Si hay pago inicial, descuenta del banco seleccionado
 */
export function useRegistrarOrdenCompra(): UseOperationResult<CrearOrdenCompraInput, OrdenCompraResult> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { triggerDataRefresh } = useAppStore()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: CrearOrdenCompraInput): Promise<OperationResult<OrdenCompraResult>> => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!datos.distribuidor) {
        throw new Error('El distribuidor es requerido')
      }
      if (datos.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }
      if (datos.costoDistribuidor <= 0) {
        throw new Error('El costo del distribuidor debe ser mayor a 0')
      }

      const result = await crearOrdenCompraCompleta(datos)
      
      if (result) {
        triggerDataRefresh()
        logger.info('[useRegistrarOrdenCompra] OC creada exitosamente', { data: result })
        return { success: true, data: result }
      }
      
      throw new Error('No se pudo crear la orden de compra')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar orden de compra'
      setError(mensaje)
      logger.error('[useRegistrarOrdenCompra] Error', err)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [triggerDataRefresh])

  return { execute, loading, error, reset }
}

// ====================================================================
// HOOK: TRANSFERENCIA ENTRE BANCOS
// ====================================================================

/**
 * Hook para realizar transferencias entre bancos
 * 
 * Proceso:
 * 1. Descuenta del banco origen
 * 2. Suma al banco destino
 * 3. Registra movimiento en ambos bancos
 */
export function useTransferenciaBancaria(): UseOperationResult<BizTransferenciaInput, string> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { triggerDataRefresh } = useAppStore()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: BizTransferenciaInput): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!datos.bancoOrigen) {
        throw new Error('El banco origen es requerido')
      }
      if (!datos.bancoDestino) {
        throw new Error('El banco destino es requerido')
      }
      if (datos.bancoOrigen === datos.bancoDestino) {
        throw new Error('El banco origen y destino no pueden ser el mismo')
      }
      if (datos.monto <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }

      const transferId = await realizarTransferencia(datos)
      
      if (transferId) {
        triggerDataRefresh()
        logger.info('[useTransferenciaBancaria] Transferencia procesada', { data: { id: transferId } })
        return { success: true, data: transferId }
      }
      
      throw new Error('No se pudo procesar la transferencia')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al realizar transferencia'
      setError(mensaje)
      logger.error('[useTransferenciaBancaria] Error', err)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [triggerDataRefresh])

  return { execute, loading, error, reset }
}

// ====================================================================
// HOOK: REGISTRAR GASTO
// ====================================================================

/**
 * Hook para registrar un gasto desde un banco
 */
export function useRegistrarGasto(): UseOperationResult<RegistrarGastoInput, string> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { triggerDataRefresh } = useAppStore()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: RegistrarGastoInput): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      if (!datos.bancoOrigen) {
        throw new Error('El banco origen es requerido')
      }
      if (datos.monto <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      if (!datos.concepto) {
        throw new Error('El concepto es requerido')
      }

      const gastoId = await registrarGasto(datos)
      
      if (gastoId) {
        triggerDataRefresh()
        logger.info('[useRegistrarGasto] Gasto registrado', { data: { id: gastoId } })
        return { success: true, data: gastoId }
      }
      
      throw new Error('No se pudo registrar el gasto')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar gasto'
      setError(mensaje)
      logger.error('[useRegistrarGasto] Error', err)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [triggerDataRefresh])

  return { execute, loading, error, reset }
}

// ====================================================================
// HOOK: REGISTRAR INGRESO
// ====================================================================

/**
 * Hook para registrar un ingreso directo a un banco
 */
export function useRegistrarIngreso(): UseOperationResult<RegistrarIngresoInput, string> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { triggerDataRefresh } = useAppStore()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: RegistrarIngresoInput): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      if (!datos.bancoDestino) {
        throw new Error('El banco destino es requerido')
      }
      if (datos.monto <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      if (!datos.concepto) {
        throw new Error('El concepto es requerido')
      }

      const ingresoId = await registrarIngreso(datos)
      
      if (ingresoId) {
        triggerDataRefresh()
        logger.info('[useRegistrarIngreso] Ingreso registrado', { data: { id: ingresoId } })
        return { success: true, data: ingresoId }
      }
      
      throw new Error('No se pudo registrar el ingreso')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar ingreso'
      setError(mensaje)
      logger.error('[useRegistrarIngreso] Error', err)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [triggerDataRefresh])

  return { execute, loading, error, reset }
}

// ====================================================================
// HOOK: VALIDACIÓN DE STOCK
// ====================================================================

export interface ValidacionStock {
  disponible: boolean
  stockActual: number
  mensaje: string
}

/**
 * Hook para validar si hay stock disponible antes de una venta
 */
export function useValidarStock() {
  const [validacion, setValidacion] = useState<ValidacionStock | null>(null)

  const validar = useCallback((stockActual: number, cantidadSolicitada: number): ValidacionStock => {
    const disponible = stockActual >= cantidadSolicitada
    const resultado: ValidacionStock = {
      disponible,
      stockActual,
      mensaje: disponible 
        ? `Stock disponible: ${stockActual} unidades` 
        : `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidadSolicitada}`,
    }
    setValidacion(resultado)
    return resultado
  }, [])

  const reset = useCallback(() => {
    setValidacion(null)
  }, [])

  return { validacion, validar, reset }
}

// ====================================================================
// HOOK: ESTADO DE PAGO
// ====================================================================

export type EstadoPago = 'completo' | 'parcial' | 'pendiente'

export interface CalculoEstadoPago {
  estado: EstadoPago
  montoPagado: number
  montoTotal: number
  montoPendiente: number
  porcentajePagado: number
}

/**
 * Hook para calcular y manejar estados de pago
 */
export function useEstadoPago() {
  const calcular = useCallback((montoPagado: number, montoTotal: number): CalculoEstadoPago => {
    const montoPendiente = montoTotal - montoPagado
    const porcentajePagado = montoTotal > 0 ? (montoPagado / montoTotal) * 100 : 0
    
    let estado: EstadoPago = 'pendiente'
    if (montoPagado >= montoTotal) {
      estado = 'completo'
    } else if (montoPagado > 0) {
      estado = 'parcial'
    }

    return {
      estado,
      montoPagado,
      montoTotal,
      montoPendiente,
      porcentajePagado,
    }
  }, [])

  const getColorEstado = useCallback((estado: EstadoPago): string => {
    switch (estado) {
      case 'completo':
        return 'text-emerald-400 bg-emerald-400/10'
      case 'parcial':
        return 'text-amber-400 bg-amber-400/10'
      case 'pendiente':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }, [])

  const getIconEstado = useCallback((estado: EstadoPago): string => {
    switch (estado) {
      case 'completo':
        return '✓'
      case 'parcial':
        return '◐'
      case 'pendiente':
        return '○'
      default:
        return '?'
    }
  }, [])

  return { calcular, getColorEstado, getIconEstado }
}

// ====================================================================
// HOOK: SELECCIÓN DE BANCO
// ====================================================================

export interface BancoOption {
  id: BancoId
  nombre: string
  capitalActual: number
}

/**
 * Hook para manejar selección de banco con validación de saldo
 */
export function useSeleccionBanco(bancosDisponibles: BancoOption[]) {
  const [bancoSeleccionado, setBancoSeleccionado] = useState<BancoId | null>(null)

  const seleccionar = useCallback((bancoId: BancoId | null) => {
    setBancoSeleccionado(bancoId)
  }, [])

  const validarSaldo = useCallback((bancoId: BancoId, montoRequerido: number): boolean => {
    const banco = bancosDisponibles.find(b => b.id === bancoId)
    if (!banco) return false
    return banco.capitalActual >= montoRequerido
  }, [bancosDisponibles])

  const getBanco = useCallback((bancoId: BancoId): BancoOption | undefined => {
    return bancosDisponibles.find(b => b.id === bancoId)
  }, [bancosDisponibles])

  const reset = useCallback(() => {
    setBancoSeleccionado(null)
  }, [])

  return {
    bancoSeleccionado,
    seleccionar,
    validarSaldo,
    getBanco,
    reset,
    bancosDisponibles,
  }
}

// ====================================================================
// HOOK COMBINADO: OPERACIÓN DE VENTA COMPLETA
// ====================================================================

/**
 * Hook que combina preview y registro de venta
 * Uso típico en formularios de venta
 */
export function useVentaCompleta() {
  const { preview, calcular: calcularPreview, reset: resetPreview } = useCalculoVentaPreview()
  const { execute: registrar, loading, error, reset: resetRegistro } = useRegistrarVenta()
  const { validar: validarStock, validacion, reset: resetStock } = useValidarStock()
  const { calcular: calcularEstado, getColorEstado, getIconEstado } = useEstadoPago()

  const reset = useCallback(() => {
    resetPreview()
    resetRegistro()
    resetStock()
  }, [resetPreview, resetRegistro, resetStock])

  return {
    // Preview
    preview,
    calcularPreview,
    
    // Stock
    validarStock,
    validacionStock: validacion,
    
    // Registro
    registrar,
    loading,
    error,
    
    // Estado de pago
    calcularEstado,
    getColorEstado,
    getIconEstado,
    
    // Reset
    reset,
  }
}
