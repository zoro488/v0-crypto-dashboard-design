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
 * @version 2.0
 */

import { useState, useCallback } from 'react'
import { 
  registrarVenta,
  registrarAbonoCliente,
  registrarPagoDistribuidor,
  registrarOrdenCompra,
  registrarTransferencia,
  calcularDistribucionVenta,
  type NuevaVentaInput,
  type AbonoClienteInput,
  type PagoDistribuidorInput,
  type TransferenciaInput,
} from '@/app/lib/services/business-logic.service'
import type { BancoId, CalculoVentaResult } from '@/app/types'

// Alias para mantener compatibilidad
export type DatosVenta = NuevaVentaInput
export type DatosAbonoCliente = AbonoClienteInput
export type DatosPagoDistribuidor = PagoDistribuidorInput
export type DatosTransferencia = TransferenciaInput
export type DatosOrdenCompra = {
  distribuidorId: string
  distribuidorNombre: string
  producto: string
  cantidad: number
  precioCompra: number
  precioFlete?: number
  pagoInicial?: number
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
export function useRegistrarVenta(): UseOperationResult<DatosVenta, string> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: DatosVenta): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones previas
      if (!datos.clienteId) {
        throw new Error('El cliente es requerido')
      }
      if (!datos.ocId) {
        throw new Error('La orden de compra es requerida')
      }
      if (datos.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }
      if (datos.precioVenta <= 0) {
        throw new Error('El precio de venta debe ser mayor a 0')
      }

      const ventaId = await registrarVenta(datos)
      
      return { success: true, data: ventaId }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar venta'
      setError(mensaje)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [])

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
    precioFlete?: number,
  ) => {
    if (cantidad > 0 && precioVenta > 0 && precioCompra > 0) {
      const aplicaFlete = precioFlete !== undefined && precioFlete > 0
      const resultado = calcularDistribucionVenta(cantidad, precioVenta, precioCompra, aplicaFlete, precioFlete)
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
export function useRegistrarAbonoCliente(): UseOperationResult<DatosAbonoCliente> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: DatosAbonoCliente): Promise<OperationResult> => {
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

      await registrarAbonoCliente(datos)
      
      return { success: true }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar abono'
      setError(mensaje)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [])

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
 * 2. Registra en gastos_abonos como tipo 'gasto'
 * 3. Actualiza deuda del distribuidor
 */
export function usePagoDistribuidor(): UseOperationResult<DatosPagoDistribuidor> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: DatosPagoDistribuidor): Promise<OperationResult> => {
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

      await registrarPagoDistribuidor(datos)
      
      return { success: true }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar pago'
      setError(mensaje)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [])

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
 * 2. Actualiza deuda del distribuidor
 * 3. Crea entrada en almacén
 */
export function useRegistrarOrdenCompra(): UseOperationResult<DatosOrdenCompra, string> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: DatosOrdenCompra): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!datos.distribuidorId) {
        throw new Error('El distribuidor es requerido')
      }
      if (!datos.producto || datos.producto.trim() === '') {
        throw new Error('El producto es requerido')
      }
      if (datos.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }
      if (datos.precioCompra <= 0) {
        throw new Error('El precio de compra debe ser mayor a 0')
      }

      const ocId = await registrarOrdenCompra(
        datos.distribuidorId,
        datos.distribuidorNombre,
        datos.cantidad,
        datos.precioCompra,
        datos.precioFlete ?? 0,
        datos.pagoInicial ?? 0,
      )
      
      return { success: true, data: ocId }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar orden de compra'
      setError(mensaje)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [])

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
export function useTransferenciaBancaria(): UseOperationResult<DatosTransferencia> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (datos: DatosTransferencia): Promise<OperationResult> => {
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

      await registrarTransferencia(datos)
      
      return { success: true }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al realizar transferencia'
      setError(mensaje)
      return { success: false, error: mensaje }
    } finally {
      setLoading(false)
    }
  }, [])

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
