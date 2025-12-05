// ═══════════════════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — LÓGICA DE NEGOCIO GYA
// Fórmulas verificadas 100% según LOGICA_CORRECTA_SISTEMA_Version2.md
// Compatibles al 100% con app/lib/store/index.ts
// ═══════════════════════════════════════════════════════════════════════════

import { nanoid } from 'nanoid'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS COMPATIBLES CON EL STORE
// ═══════════════════════════════════════════════════════════════════════════

export type BancoId = 
  | 'boveda_monte' 
  | 'utilidades' 
  | 'azteca' 
  | 'leftie' 
  | 'profit' 
  | 'boveda_usa'
  | 'flete_sur' // Fletes

export type EstadoPago = 'pendiente' | 'parcial' | 'completo' | 'cancelado'

// Interface que el store espera de calcularDistribucionVenta
export interface DistribucionVenta {
  bovedaMonte: number  // Costo de mercancía
  fletes: number       // Costo de flete
  utilidades: number   // Ganancia neta
  total: number        // Total de la venta
}

// Interface que el store espera de calcularDistribucionParcial
export interface DistribucionParcial {
  capitalBovedaMonte: number
  capitalFletes: number
  capitalUtilidades: number
  proporcion: number
}

// Interface que el store espera de calcularAbono
export interface ResultadoAbono {
  nuevoMontoPagado: number
  nuevoMontoRestante: number
  nuevoEstado: 'pendiente' | 'parcial' | 'completo'
  distribucionAdicional: {
    bovedaMonte: number
    fletes: number
    utilidades: number
  }
  movimientos: Array<{
    bancoId: BancoId
    tipo: 'abono'
    tipoMovimiento: 'abono_cliente'
    monto: number
    concepto: string
    referencia: string
    fecha: string
  }>
}

// Interface que el store espera de calcularTransferencia
export interface ResultadoTransferencia {
  bancoOrigenNuevo: {
    capitalActual: number
    historicoGastos: number
  }
  bancoDestinoNuevo: {
    capitalActual: number
    historicoIngresos: number
  }
  movimientoOrigen: {
    bancoId: BancoId
    tipo: 'transferencia_salida'
    tipoMovimiento: 'transferencia_salida'
    monto: number
    concepto: string
    bancoOrigenId: string
    bancoDestinoId: string
    fecha: string
  }
  movimientoDestino: {
    bancoId: BancoId
    tipo: 'transferencia_entrada'
    tipoMovimiento: 'transferencia_entrada'
    monto: number
    concepto: string
    bancoOrigenId: string
    bancoDestinoId: string
    fecha: string
  }
}

// Tipos internos
interface Banco {
  id: string
  capitalActual: number
  historicoIngresos: number
  historicoGastos: number
}

interface Cliente {
  id: string
  deudaTotal?: number
}

interface Distribuidor {
  id: string
  saldoPendiente?: number
}

interface Venta {
  id?: string
  clienteId?: string
  montoRestante: number
  montoPagado?: number
  estadoPago: string
  distribucionBancos?: {
    bovedaMonte: number
    fletes: number
    utilidades: number
  }
  bovedaMonte?: number
  ganancia?: number
  utilidad?: number
  precioTotalVenta?: number
  totalVenta?: number
}

interface OrdenCompra {
  id?: string
  distribuidorId: string
  cantidad?: number
  stockActual?: number
  montoTotal?: number
  total?: number
  montoPagado?: number
  estado?: string
}

interface Movimiento {
  bancoId: string
  tipo?: string
  tipoMovimiento?: string
  monto: number
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUCIÓN GYA — FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la distribución GYA para una venta
 * ESTA ES LA FUNCIÓN QUE EL STORE USA DIRECTAMENTE
 * 
 * FÓRMULAS GYA VERIFICADAS:
 * - bovedaMonte = precioCompraUnidad × cantidad (COSTO)
 * - fletes = precioFlete × cantidad
 * - utilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) × cantidad (GANANCIA)
 * - total = precioVentaUnidad × cantidad
 */
export function calcularDistribucionVenta(
  precioVentaUnidad: number,
  precioCompraUnidad: number,
  precioFlete: number,
  cantidad: number
): DistribucionVenta {
  // Validaciones con valores por defecto
  if (cantidad <= 0) {
    return { bovedaMonte: 0, fletes: 0, utilidades: 0, total: 0 }
  }
  
  // Fórmulas GYA verificadas
  const precioTotalVenta = precioVentaUnidad * cantidad
  const montoBovedaMonte = (precioCompraUnidad || 0) * cantidad      // COSTO
  const montoFletes = (precioFlete || 0) * cantidad                   // FLETE
  const montoUtilidades = (precioVentaUnidad - (precioCompraUnidad || 0) - (precioFlete || 0)) * cantidad // GANANCIA
  
  return {
    bovedaMonte: Math.max(0, montoBovedaMonte),
    fletes: Math.max(0, montoFletes),
    utilidades: montoUtilidades, // Puede ser negativo (pérdida)
    total: precioTotalVenta,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGOS PARCIALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la distribución proporcional para un pago parcial
 * FIRMA: calcularDistribucionParcial(distribucionOriginal, montoPagado, totalVenta)
 */
export function calcularDistribucionParcial(
  distribucionOriginal: DistribucionVenta,
  montoPagado: number,
  totalVenta: number
): DistribucionParcial {
  if (totalVenta <= 0 || montoPagado <= 0) {
    return { 
      capitalBovedaMonte: 0, 
      capitalFletes: 0, 
      capitalUtilidades: 0,
      proporcion: 0
    }
  }
  
  const proporcion = montoPagado / totalVenta
  
  return {
    capitalBovedaMonte: distribucionOriginal.bovedaMonte * proporcion,
    capitalFletes: distribucionOriginal.fletes * proporcion,
    capitalUtilidades: distribucionOriginal.utilidades * proporcion,
    proporcion,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ABONOS A VENTAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula abono a una venta existente
 * FIRMA: calcularAbono(venta, monto)
 */
export function calcularAbono(
  venta: Venta,
  montoAbono: number
): ResultadoAbono {
  const totalVenta = venta.precioTotalVenta || venta.totalVenta || 0
  const ventaId = venta.id || 'unknown'
  const now = new Date().toISOString()
  
  if (montoAbono <= 0 || totalVenta <= 0) {
    return {
      nuevoMontoPagado: venta.montoPagado || 0,
      nuevoMontoRestante: venta.montoRestante,
      nuevoEstado: 'pendiente',
      distribucionAdicional: { bovedaMonte: 0, fletes: 0, utilidades: 0 },
      movimientos: [],
    }
  }
  
  // Calcular proporción del abono sobre el total original
  const proporcion = montoAbono / totalVenta
  
  // Obtener distribución original
  const bovedaMonteOriginal = venta.distribucionBancos?.bovedaMonte || venta.bovedaMonte || 0
  const fletesOriginal = venta.distribucionBancos?.fletes || 0
  const utilidadesOriginal = venta.distribucionBancos?.utilidades || venta.ganancia || venta.utilidad || 0
  
  // Calcular distribución proporcional del abono
  const distribucionAbono = {
    bovedaMonte: bovedaMonteOriginal * proporcion,
    fletes: fletesOriginal * proporcion,
    utilidades: utilidadesOriginal * proporcion,
  }
  
  // Calcular nuevos totales
  const nuevoMontoPagado = (venta.montoPagado || 0) + montoAbono
  const nuevoMontoRestante = Math.max(0, venta.montoRestante - montoAbono)
  
  // Determinar nuevo estado
  let nuevoEstado: 'pendiente' | 'parcial' | 'completo' = 'parcial'
  if (nuevoMontoRestante <= 0) {
    nuevoEstado = 'completo'
  }
  
  // Crear movimientos
  const movimientos: ResultadoAbono['movimientos'] = []
  
  if (distribucionAbono.bovedaMonte > 0) {
    movimientos.push({
      bancoId: 'boveda_monte',
      tipo: 'abono',
      tipoMovimiento: 'abono_cliente',
      monto: distribucionAbono.bovedaMonte,
      concepto: `Abono venta ${ventaId}`,
      referencia: ventaId,
      fecha: now,
    })
  }
  
  if (distribucionAbono.fletes > 0) {
    movimientos.push({
      bancoId: 'flete_sur',
      tipo: 'abono',
      tipoMovimiento: 'abono_cliente',
      monto: distribucionAbono.fletes,
      concepto: `Abono venta ${ventaId}`,
      referencia: ventaId,
      fecha: now,
    })
  }
  
  if (distribucionAbono.utilidades > 0) {
    movimientos.push({
      bancoId: 'utilidades',
      tipo: 'abono',
      tipoMovimiento: 'abono_cliente',
      monto: distribucionAbono.utilidades,
      concepto: `Abono venta ${ventaId}`,
      referencia: ventaId,
      fecha: now,
    })
  }
  
  return {
    nuevoMontoPagado,
    nuevoMontoRestante,
    nuevoEstado,
    distribucionAdicional: distribucionAbono,
    movimientos,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFERENCIAS ENTRE BANCOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula transferencia entre bancos
 * FIRMA: calcularTransferencia(bancoOrigen, bancoDestino, monto, concepto)
 */
export function calcularTransferencia(
  bancoOrigen: Banco,
  bancoDestino: Banco,
  monto: number,
  _concepto?: string
): ResultadoTransferencia {
  const concepto = _concepto || 'Transferencia entre bancos'
  const now = new Date().toISOString()
  
  if (monto <= 0) {
    throw new Error('Monto debe ser mayor a 0')
  }
  if (monto > bancoOrigen.capitalActual) {
    throw new Error(`Fondos insuficientes. Disponible: ${bancoOrigen.capitalActual.toLocaleString()}`)
  }
  
  return {
    bancoOrigenNuevo: {
      capitalActual: bancoOrigen.capitalActual - monto,
      historicoGastos: bancoOrigen.historicoGastos + monto,
    },
    bancoDestinoNuevo: {
      capitalActual: bancoDestino.capitalActual + monto,
      historicoIngresos: bancoDestino.historicoIngresos + monto,
    },
    movimientoOrigen: {
      bancoId: bancoOrigen.id as BancoId,
      tipo: 'transferencia_salida',
      tipoMovimiento: 'transferencia_salida',
      monto: monto,
      concepto: `${concepto} → ${bancoDestino.id}`,
      bancoOrigenId: bancoOrigen.id,
      bancoDestinoId: bancoDestino.id,
      fecha: now,
    },
    movimientoDestino: {
      bancoId: bancoDestino.id as BancoId,
      tipo: 'transferencia_entrada',
      tipoMovimiento: 'transferencia_entrada',
      monto: monto,
      concepto: `${concepto} ← ${bancoOrigen.id}`,
      bancoOrigenId: bancoOrigen.id,
      bancoDestinoId: bancoDestino.id,
      fecha: now,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CÁLCULOS DE STOCK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula stock de una orden de compra basado en ventas
 * FIRMA: calcularStock(ordenCompra, ventas)
 */
export function calcularStock(
  ordenCompra: OrdenCompra,
  ventas: Array<{ ocRelacionada?: string; cantidad: number }>
): number {
  const cantidadOriginal = ordenCompra.cantidad || ordenCompra.stockActual || 0
  
  const cantidadVendida = ventas
    .filter(v => v.ocRelacionada === ordenCompra.id)
    .reduce((acc, v) => acc + (v.cantidad || 0), 0)
  
  return Math.max(0, cantidadOriginal - cantidadVendida)
}

/**
 * Valida si hay stock suficiente para una venta
 */
export function validarStock(
  stockActual: number,
  cantidadSolicitada: number
): { valido: boolean; mensaje?: string } {
  if (cantidadSolicitada <= 0) {
    return { valido: false, mensaje: 'Cantidad debe ser mayor a 0' }
  }
  if (stockActual < cantidadSolicitada) {
    return { 
      valido: false, 
      mensaje: `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidadSolicitada}` 
    }
  }
  return { valido: true }
}

// ═══════════════════════════════════════════════════════════════════════════
// RECÁLCULOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recalcula capital de un banco basado en movimientos
 * FIRMA: recalcularBanco(banco, movimientos)
 */
export function recalcularBanco<T extends Banco>(
  banco: T,
  movimientos: Movimiento[]
): T {
  // Calcular ingresos y gastos desde movimientos
  let historicoIngresos = 0
  let historicoGastos = 0
  
  movimientos
    .filter(m => m.bancoId === banco.id)
    .forEach(m => {
      const tipo = m.tipo || m.tipoMovimiento || ''
      if (tipo === 'ingreso' || tipo === 'distribucion' || tipo === 'abono' || tipo === 'abono_cliente' || tipo === 'transferencia_entrada') {
        historicoIngresos += m.monto
      } else if (tipo === 'gasto' || tipo === 'transferencia_salida' || tipo === 'pago_distribuidor') {
        historicoGastos += m.monto
      }
    })
  
  return {
    ...banco,
    historicoIngresos,
    historicoGastos,
    capitalActual: historicoIngresos - historicoGastos,
  }
}

/**
 * Recalcula deuda total de un cliente
 * FIRMA: recalcularCliente(cliente, ventas)
 */
export function recalcularCliente(
  cliente: Cliente,
  ventas: Venta[]
): { deudaTotal: number } {
  const deudaTotal = ventas
    .filter(v => v.clienteId === cliente.id && v.estadoPago !== 'completo' && v.estadoPago !== 'cancelado')
    .reduce((acc, v) => acc + (v.montoRestante || 0), 0)
  
  return { deudaTotal }
}

/**
 * Recalcula el saldo pendiente de un distribuidor
 * FIRMA: recalcularDistribuidor(distribuidor, ordenes)
 */
export function recalcularDistribuidor(
  distribuidor: Distribuidor,
  ordenesCompra: OrdenCompra[]
): { saldoPendiente: number } {
  const saldoPendiente = ordenesCompra
    .filter(o => o.distribuidorId === distribuidor.id && o.estado !== 'cancelada')
    .reduce((acc, o) => {
      const montoTotal = o.montoTotal || o.total || 0
      const montoPagado = o.montoPagado || 0
      return acc + (montoTotal - montoPagado)
    }, 0)
  
  return { saldoPendiente }
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICAS FINANCIERAS AVANZADAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula el ROCE (Return on Capital Employed)
 */
export function calcularROCE(
  gananciaOperativaAnualizada: number,
  capitalEmpleadoPromedio: number
): number {
  if (capitalEmpleadoPromedio <= 0) return 0
  return (gananciaOperativaAnualizada / capitalEmpleadoPromedio) * 100
}

/**
 * Calcula días de liquidez
 */
export function calcularDiasLiquidez(
  capitalTotal: number,
  gastoPromedioDiario: number
): number {
  if (gastoPromedioDiario <= 0) return Infinity
  return Math.floor(capitalTotal / gastoPromedioDiario)
}

/**
 * Calcula el margen neto
 */
export function calcularMargenNeto(
  utilidades: number,
  ventasTotales: number
): number {
  if (ventasTotales <= 0) return 0
  return (utilidades / ventasTotales) * 100
}

/**
 * Calcula el índice de salud financiera (0-100)
 */
export function calcularSaludFinanciera(
  liquidezDias: number,
  margenNeto: number,
  roce: number,
  rotacionCapital: number
): number {
  const puntajeLiquidez = Math.min(100, (liquidezDias / 120) * 100) * 0.30
  const puntajeMargen = Math.min(100, (margenNeto / 50) * 100) * 0.25
  const puntajeROCE = Math.min(100, (roce / 60) * 100) * 0.25
  const puntajeRotacion = Math.min(100, (rotacionCapital / 8) * 100) * 0.20
  
  return Math.round(puntajeLiquidez + puntajeMargen + puntajeROCE + puntajeRotacion)
}

/**
 * Calcula el capital actual de un banco
 */
export function calcularCapitalActual(
  historicoIngresos: number,
  historicoGastos: number
): number {
  return historicoIngresos - historicoGastos
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERADORES DE IDS
// ═══════════════════════════════════════════════════════════════════════════

export function generarIdVenta(): string {
  return `venta_${nanoid(10)}`
}

export function generarIdOrdenCompra(numero?: number): string {
  if (numero !== undefined) {
    return `OC-${String(numero).padStart(4, '0')}-${nanoid(4)}`
  }
  return `orden_${nanoid(10)}`
}

export function generarIdMovimiento(): string {
  return `mov_${nanoid(10)}`
}

export function generarIdCliente(): string {
  return `cli_${nanoid(10)}`
}

export function generarIdDistribuidor(): string {
  return `dist_${nanoid(10)}`
}

export function generarIdProducto(): string {
  return `prod_${nanoid(10)}`
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE LOS 7 BANCOS SAGRADOS
// ═══════════════════════════════════════════════════════════════════════════

export const BANCOS_CONFIG = {
  boveda_monte: {
    id: 'boveda_monte' as BancoId,
    nombre: 'Bóveda Monte',
    tipo: 'operativo',
    color: '#FFD700',
    icono: 'vault',
    esAutomatico: true,
    orden: 1,
  },
  utilidades: {
    id: 'utilidades' as BancoId,
    nombre: 'Utilidades',
    tipo: 'ganancia',
    color: '#FF1493',
    icono: 'trending-up',
    esAutomatico: true,
    orden: 2,
  },
  flete_sur: {
    id: 'flete_sur' as BancoId,
    nombre: 'Flete Sur',
    tipo: 'flete',
    color: '#8B00FF',
    icono: 'truck',
    esAutomatico: true,
    orden: 3,
  },
  azteca: {
    id: 'azteca' as BancoId,
    nombre: 'Azteca',
    tipo: 'externo',
    color: '#00FF88',
    icono: 'building-2',
    esAutomatico: false,
    orden: 4,
  },
  leftie: {
    id: 'leftie' as BancoId,
    nombre: 'Leftie',
    tipo: 'externo',
    color: '#FFD700',
    icono: 'shirt',
    esAutomatico: false,
    orden: 5,
  },
  profit: {
    id: 'profit' as BancoId,
    nombre: 'Profit',
    tipo: 'ganancia',
    color: '#FFD700',
    icono: 'crown',
    esAutomatico: false,
    orden: 6,
  },
  boveda_usa: {
    id: 'boveda_usa' as BancoId,
    nombre: 'Bóveda USA',
    tipo: 'operativo',
    color: '#FFD700',
    icono: 'dollar-sign',
    esAutomatico: false,
    orden: 7,
  },
} as const

export const BANCOS_IDS = Object.keys(BANCOS_CONFIG) as BancoId[]
