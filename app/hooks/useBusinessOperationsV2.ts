/**
 * 🔗 HOOK UNIFICADO DE OPERACIONES DE NEGOCIO - CHRONOS SYSTEM
 * 
 * Hook que integra:
 * - Validación con Zod antes de enviar a Firestore
 * - Cálculos GYA centralizados
 * - Operaciones CRUD con feedback visual
 * - Optimistic updates con rollback
 * 
 * USO:
 * ```tsx
 * const { crearVenta, crearOrdenCompra, loading, error } = useBusinessOperations()
 * 
 * const handleVenta = async (data) => {
 *   const resultado = await crearVenta(data)
 *   if (resultado) {
 *     toast.success('Venta creada!')
 *   }
 * }
 * ```
 * 
 * @version 1.0.0
 * @author CHRONOS Team
 */

'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/app/hooks/use-toast'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { logger } from '@/app/lib/utils/logger'

// Servicios
import { 
  crearVentaCompleta, 
  crearOrdenCompraCompleta,
  abonarCliente,
  pagarDistribuidor,
  realizarTransferencia,
  registrarGasto,
  registrarIngreso,
  type CrearVentaInput,
  type CrearOrdenCompraInput,
  type AbonarClienteInput,
  type PagarDistribuidorInput,
  type TransferenciaInput,
  type RegistrarGastoInput,
  type RegistrarIngresoInput,
} from '@/app/lib/services/business-operations.service'

import { 
  calcularDistribucionGYA, 
  calcularOrdenCompra,
  redondearMonto,
} from '@/app/lib/services/calculo.service'

// Validadores
import {
  validarVentaCompleta,
  validarOrdenCompraCompleta,
  validarAbonoCliente,
  validarPagoDistribuidorV2,
  validarTransferenciaV2,
  validarGasto,
  validarIngreso,
  calcularDistribucionGYA as calcularDistribucionSchema,
} from '@/app/lib/schemas'

// Tipos
import type { BancoId } from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface OperationResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: string[]
}

interface UseBusinessOperationsReturn {
  // Estado
  loading: boolean
  error: string | null
  
  // Operaciones de venta
  crearVenta: (data: VentaFormData) => Promise<OperationResult<VentaResult>>
  calcularVenta: (data: VentaFormData) => VentaCalculation
  
  // Operaciones de orden de compra
  crearOrdenCompra: (data: OrdenCompraFormData) => Promise<OperationResult<OrdenCompraResult>>
  calcularOrdenCompra: (data: OrdenCompraFormData) => OrdenCompraCalculation
  
  // Operaciones de abono
  registrarAbonoCliente: (data: AbonoFormData) => Promise<OperationResult<boolean>>
  
  // Operaciones de pago a distribuidor
  registrarPagoDistribuidor: (data: PagoDistribuidorFormData) => Promise<OperationResult<boolean>>
  
  // Transferencias
  realizarTransferencia: (data: TransferenciaFormData) => Promise<OperationResult<string>>
  
  // Gastos e ingresos
  registrarGastoManual: (data: GastoFormData) => Promise<OperationResult<string>>
  registrarIngresoManual: (data: IngresoFormData) => Promise<OperationResult<string>>
}

// Tipos de formulario
interface VentaFormData {
  cliente: string
  clienteId?: string
  items: Array<{
    producto: string
    cantidad: number
    precioVenta: number
    precioCompra: number
    precioFlete?: number
    ocRelacionada?: string
  }>
  estadoPago: 'completo' | 'parcial' | 'pendiente'
  montoPagado?: number
  aplicaFlete?: boolean
  metodoPago?: string
  notas?: string
}

interface VentaResult {
  ventaId: string
  totalVenta: number
  distribucion: {
    bovedaMonte: number
    fletes: number
    utilidades: number
  }
}

interface VentaCalculation {
  totalIngreso: number
  bovedaMonte: number
  fletes: number
  utilidades: number
  margenPorcentaje: number
  cantidadTotal: number
  montoPagado: number
  montoRestante: number
}

interface OrdenCompraFormData {
  distribuidor: string
  distribuidorId?: string
  items: Array<{
    producto: string
    cantidad: number
    costoDistribuidor: number
    costoTransporte?: number
  }>
  pagoInicial?: number
  bancoOrigen?: BancoId
  notas?: string
}

interface OrdenCompraResult {
  ordenId: string
  costoTotal: number
  deuda: number
}

interface OrdenCompraCalculation {
  costoTotal: number
  deuda: number
  cantidadTotal: number
  costoPorUnidadPromedio: number
}

interface AbonoFormData {
  clienteId: string
  ventaId?: string
  monto: number
  metodoPago?: string
  notas?: string
}

interface PagoDistribuidorFormData {
  distribuidorId: string
  ordenCompraId?: string
  monto: number
  bancoOrigen: BancoId
  notas?: string
}

interface TransferenciaFormData {
  bancoOrigen: BancoId
  bancoDestino: BancoId
  monto: number
  concepto: string
  descripcion?: string
}

interface GastoFormData {
  bancoOrigen: BancoId
  monto: number
  concepto: string
  descripcion?: string
  categoria?: string
}

interface IngresoFormData {
  bancoDestino: BancoId
  monto: number
  concepto: string
  descripcion?: string
  cliente?: string
  categoria?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function useBusinessOperations(): UseBusinessOperationsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const triggerDataRefresh = useAppStore(state => state.triggerDataRefresh)

  // ═══════════════════════════════════════════════════════════════════════
  // CÁLCULO DE VENTA (sin guardar)
  // ═══════════════════════════════════════════════════════════════════════

  const calcularVenta = useCallback((data: VentaFormData): VentaCalculation => {
    const aplicaFlete = data.aplicaFlete ?? true
    
    let totalIngreso = 0
    let bovedaMonte = 0
    let fletes = 0
    let utilidades = 0
    let cantidadTotal = 0

    for (const item of data.items) {
      const calc = calcularDistribucionGYA({
        cantidad: item.cantidad,
        precioVenta: item.precioVenta,
        precioCompra: item.precioCompra,
        precioFlete: item.precioFlete ?? 500,
        aplicaFlete,
      })

      totalIngreso += calc.ingresoVenta
      bovedaMonte += calc.montoBovedaMonte
      fletes += calc.montoFletes
      utilidades += calc.montoUtilidades
      cantidadTotal += item.cantidad
    }

    const margenPorcentaje = totalIngreso > 0 ? (utilidades / totalIngreso) * 100 : 0
    
    let montoPagado = 0
    if (data.estadoPago === 'completo') {
      montoPagado = totalIngreso
    } else if (data.estadoPago === 'parcial') {
      montoPagado = data.montoPagado || 0
    }
    
    const montoRestante = totalIngreso - montoPagado

    return {
      totalIngreso: redondearMonto(totalIngreso),
      bovedaMonte: redondearMonto(bovedaMonte),
      fletes: redondearMonto(fletes),
      utilidades: redondearMonto(utilidades),
      margenPorcentaje: redondearMonto(margenPorcentaje),
      cantidadTotal,
      montoPagado: redondearMonto(montoPagado),
      montoRestante: redondearMonto(montoRestante),
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════
  // CREAR VENTA
  // ═══════════════════════════════════════════════════════════════════════

  const crearVenta = useCallback(async (data: VentaFormData): Promise<OperationResult<VentaResult>> => {
    setLoading(true)
    setError(null)

    try {
      // Validar datos con schema
      const validation = validarVentaCompleta(data)
      if (!validation.success) {
        return {
          success: false,
          validationErrors: validation.errors,
          error: 'Datos de venta inválidos',
        }
      }

      // Crear ventas (una por item para trazabilidad)
      const resultados: VentaResult[] = []
      
      for (const item of data.items) {
        const ventaInput: CrearVentaInput = {
          cliente: data.cliente,
          producto: item.producto,
          ocRelacionada: item.ocRelacionada,
          cantidad: item.cantidad,
          precioVenta: item.precioVenta,
          precioCompra: item.precioCompra,
          precioFlete: data.aplicaFlete ? (item.precioFlete ?? 500) : 0,
          estadoPago: data.estadoPago,
          montoPagado: data.estadoPago === 'completo' 
            ? item.precioVenta * item.cantidad
            : data.estadoPago === 'parcial' && data.montoPagado
              ? Math.round((data.montoPagado / (data.items.reduce((a, i) => a + i.precioVenta * i.cantidad, 0))) * item.precioVenta * item.cantidad)
              : 0,
          metodoPago: data.metodoPago || 'efectivo',
          notas: data.notas,
        }

        const result = await crearVentaCompleta(ventaInput)
        if (result) {
          resultados.push({
            ventaId: result.ventaId,
            totalVenta: result.totalVenta,
            distribucion: {
              bovedaMonte: result.bovedaMonte,
              fletes: result.fletes,
              utilidades: result.utilidades,
            },
          })
        }
      }

      if (resultados.length > 0) {
        // Sumar totales
        const totalVenta = resultados.reduce((a, r) => a + r.totalVenta, 0)
        const bovedaMonte = resultados.reduce((a, r) => a + r.distribucion.bovedaMonte, 0)
        const fletes = resultados.reduce((a, r) => a + r.distribucion.fletes, 0)
        const utilidades = resultados.reduce((a, r) => a + r.distribucion.utilidades, 0)

        triggerDataRefresh()

        toast({
          title: '✅ Venta Registrada',
          description: `$${totalVenta.toLocaleString()} • ${resultados.length} producto(s)`,
        })

        logger.info('[useBusinessOperations] Venta creada', { data: { ventaIds: resultados.map(r => r.ventaId) } })

        return {
          success: true,
          data: {
            ventaId: resultados[0].ventaId,
            totalVenta,
            distribucion: { bovedaMonte, fletes, utilidades },
          },
        }
      }

      return { success: false, error: 'No se pudieron crear las ventas' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      logger.error('[useBusinessOperations] Error creando venta', err)
      
      toast({
        title: '❌ Error',
        description: errorMsg,
        variant: 'destructive',
      })

      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [toast, triggerDataRefresh])

  // ═══════════════════════════════════════════════════════════════════════
  // CÁLCULO DE ORDEN DE COMPRA (sin guardar)
  // ═══════════════════════════════════════════════════════════════════════

  const calcularOC = useCallback((data: OrdenCompraFormData): OrdenCompraCalculation => {
    let costoTotal = 0
    let cantidadTotal = 0

    for (const item of data.items) {
      const calc = calcularOrdenCompra({
        cantidad: item.cantidad,
        costoDistribuidor: item.costoDistribuidor,
        costoTransporte: item.costoTransporte ?? 0,
      })
      costoTotal += calc.costoTotal
      cantidadTotal += item.cantidad
    }

    const deuda = Math.max(0, costoTotal - (data.pagoInicial || 0))
    const costoPorUnidadPromedio = cantidadTotal > 0 ? costoTotal / cantidadTotal : 0

    return {
      costoTotal: redondearMonto(costoTotal),
      deuda: redondearMonto(deuda),
      cantidadTotal,
      costoPorUnidadPromedio: redondearMonto(costoPorUnidadPromedio),
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════
  // CREAR ORDEN DE COMPRA
  // ═══════════════════════════════════════════════════════════════════════

  const crearOC = useCallback(async (data: OrdenCompraFormData): Promise<OperationResult<OrdenCompraResult>> => {
    setLoading(true)
    setError(null)

    try {
      // Validar datos
      const validation = validarOrdenCompraCompleta(data)
      if (!validation.success) {
        return {
          success: false,
          validationErrors: validation.errors,
          error: 'Datos de orden de compra inválidos',
        }
      }

      // Crear OCs (una por item)
      const resultados: OrdenCompraResult[] = []

      for (const item of data.items) {
        const ocInput: CrearOrdenCompraInput = {
          distribuidor: data.distribuidor,
          producto: item.producto,
          cantidad: item.cantidad,
          costoDistribuidor: item.costoDistribuidor,
          costoTransporte: item.costoTransporte ?? 0,
          pagoInicial: data.pagoInicial,
          bancoOrigen: data.bancoOrigen,
          notas: data.notas,
        }

        const result = await crearOrdenCompraCompleta(ocInput)
        if (result) {
          resultados.push({
            ordenId: result.ordenId,
            costoTotal: result.costoTotal,
            deuda: result.deudaGenerada,
          })
        }
      }

      if (resultados.length > 0) {
        const costoTotal = resultados.reduce((a, r) => a + r.costoTotal, 0)
        const deuda = resultados.reduce((a, r) => a + r.deuda, 0)

        triggerDataRefresh()

        toast({
          title: '✅ Orden de Compra Creada',
          description: `$${costoTotal.toLocaleString()} • Deuda: $${deuda.toLocaleString()}`,
        })

        logger.info('[useBusinessOperations] OC creada', { data: { ordenIds: resultados.map(r => r.ordenId) } })

        return {
          success: true,
          data: {
            ordenId: resultados[0].ordenId,
            costoTotal,
            deuda,
          },
        }
      }

      return { success: false, error: 'No se pudieron crear las órdenes' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      logger.error('[useBusinessOperations] Error creando OC', err)
      
      toast({
        title: '❌ Error',
        description: errorMsg,
        variant: 'destructive',
      })

      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [toast, triggerDataRefresh])

  // ═══════════════════════════════════════════════════════════════════════
  // REGISTRAR ABONO A CLIENTE
  // ═══════════════════════════════════════════════════════════════════════

  const registrarAbono = useCallback(async (data: AbonoFormData): Promise<OperationResult<boolean>> => {
    setLoading(true)
    setError(null)

    try {
      const validation = validarAbonoCliente(data)
      if (!validation.success) {
        return { success: false, validationErrors: validation.errors }
      }

      const abonoInput: AbonarClienteInput = {
        clienteId: data.clienteId,
        ventaId: data.ventaId,
        monto: data.monto,
        metodoPago: data.metodoPago || 'efectivo',
        notas: data.notas,
      }

      const result = await abonarCliente(abonoInput)
      
      if (result) {
        triggerDataRefresh()
        toast({
          title: '✅ Abono Registrado',
          description: `$${data.monto.toLocaleString()} aplicado correctamente`,
        })
        return { success: true, data: true }
      }

      return { success: false, error: 'No se pudo registrar el abono' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      toast({ title: '❌ Error', description: errorMsg, variant: 'destructive' })
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [toast, triggerDataRefresh])

  // ═══════════════════════════════════════════════════════════════════════
  // REGISTRAR PAGO A DISTRIBUIDOR
  // ═══════════════════════════════════════════════════════════════════════

  const registrarPago = useCallback(async (data: PagoDistribuidorFormData): Promise<OperationResult<boolean>> => {
    setLoading(true)
    setError(null)

    try {
      const validation = validarPagoDistribuidorV2(data)
      if (!validation.success) {
        return { success: false, validationErrors: validation.errors }
      }

      const pagoInput: PagarDistribuidorInput = {
        distribuidorId: data.distribuidorId,
        ordenCompraId: data.ordenCompraId,
        monto: data.monto,
        bancoOrigen: data.bancoOrigen,
        notas: data.notas,
      }

      const result = await pagarDistribuidor(pagoInput)
      
      if (result) {
        triggerDataRefresh()
        toast({
          title: '✅ Pago Registrado',
          description: `$${data.monto.toLocaleString()} desde ${data.bancoOrigen}`,
        })
        return { success: true, data: true }
      }

      return { success: false, error: 'No se pudo registrar el pago' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      toast({ title: '❌ Error', description: errorMsg, variant: 'destructive' })
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [toast, triggerDataRefresh])

  // ═══════════════════════════════════════════════════════════════════════
  // REALIZAR TRANSFERENCIA
  // ═══════════════════════════════════════════════════════════════════════

  const realizarTransf = useCallback(async (data: TransferenciaFormData): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      const validation = validarTransferenciaV2(data)
      if (!validation.success) {
        return { success: false, validationErrors: validation.errors }
      }

      const transInput: TransferenciaInput = {
        bancoOrigen: data.bancoOrigen,
        bancoDestino: data.bancoDestino,
        monto: data.monto,
        concepto: data.concepto,
        descripcion: data.descripcion,
      }

      const result = await realizarTransferencia(transInput)
      
      if (result) {
        triggerDataRefresh()
        toast({
          title: '✅ Transferencia Completada',
          description: `$${data.monto.toLocaleString()} de ${data.bancoOrigen} a ${data.bancoDestino}`,
        })
        return { success: true, data: result }
      }

      return { success: false, error: 'No se pudo realizar la transferencia' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      toast({ title: '❌ Error', description: errorMsg, variant: 'destructive' })
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [toast, triggerDataRefresh])

  // ═══════════════════════════════════════════════════════════════════════
  // REGISTRAR GASTO
  // ═══════════════════════════════════════════════════════════════════════

  const registrarGastoManual = useCallback(async (data: GastoFormData): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      const validation = validarGasto(data)
      if (!validation.success) {
        return { success: false, validationErrors: validation.errors }
      }

      const gastoInput: RegistrarGastoInput = {
        bancoOrigen: data.bancoOrigen,
        monto: data.monto,
        concepto: data.concepto,
        descripcion: data.descripcion,
        categoria: data.categoria,
      }

      const result = await registrarGasto(gastoInput)
      
      if (result) {
        triggerDataRefresh()
        toast({
          title: '✅ Gasto Registrado',
          description: `$${data.monto.toLocaleString()} desde ${data.bancoOrigen}`,
        })
        return { success: true, data: result }
      }

      return { success: false, error: 'No se pudo registrar el gasto' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      toast({ title: '❌ Error', description: errorMsg, variant: 'destructive' })
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [toast, triggerDataRefresh])

  // ═══════════════════════════════════════════════════════════════════════
  // REGISTRAR INGRESO
  // ═══════════════════════════════════════════════════════════════════════

  const registrarIngresoManual = useCallback(async (data: IngresoFormData): Promise<OperationResult<string>> => {
    setLoading(true)
    setError(null)

    try {
      const validation = validarIngreso(data)
      if (!validation.success) {
        return { success: false, validationErrors: validation.errors }
      }

      const ingresoInput: RegistrarIngresoInput = {
        bancoDestino: data.bancoDestino,
        monto: data.monto,
        concepto: data.concepto,
        descripcion: data.descripcion,
        cliente: data.cliente,
        categoria: data.categoria,
      }

      const result = await registrarIngreso(ingresoInput)
      
      if (result) {
        triggerDataRefresh()
        toast({
          title: '✅ Ingreso Registrado',
          description: `$${data.monto.toLocaleString()} a ${data.bancoDestino}`,
        })
        return { success: true, data: result }
      }

      return { success: false, error: 'No se pudo registrar el ingreso' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      toast({ title: '❌ Error', description: errorMsg, variant: 'destructive' })
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [toast, triggerDataRefresh])

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════

  return {
    loading,
    error,
    
    // Ventas
    crearVenta,
    calcularVenta,
    
    // Órdenes de Compra
    crearOrdenCompra: crearOC,
    calcularOrdenCompra: calcularOC,
    
    // Abonos
    registrarAbonoCliente: registrarAbono,
    
    // Pagos a distribuidor
    registrarPagoDistribuidor: registrarPago,
    
    // Transferencias
    realizarTransferencia: realizarTransf,
    
    // Gastos e ingresos
    registrarGastoManual,
    registrarIngresoManual,
  }
}

export default useBusinessOperations
