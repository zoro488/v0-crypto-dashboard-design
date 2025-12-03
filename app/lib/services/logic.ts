/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧮 CHRONOS 2026 — LÓGICA SAGRADA DE NEGOCIO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FÓRMULAS MATEMÁTICAMENTE GARANTIZADAS:
 * 
 * DISTRIBUCIÓN DE VENTA (3 bancos):
 * → Bóveda Monte = precioCompra × cantidad (COSTO del producto)
 * → Fletes = precioFlete × cantidad
 * → Utilidades = (precioVenta - precioCompra - precioFlete) × cantidad
 * 
 * ESTADOS DE PAGO:
 * → Completo: 100% a capital + 100% a histórico
 * → Parcial: proporción = montoPagado / totalVenta
 *   - Capital recibe: distribución × proporción
 *   - Histórico recibe: 100% siempre
 * → Pendiente: Solo histórico, NO afecta capital
 * 
 * CAPITAL BANCARIO:
 * → capitalActual = historicoIngresos - historicoGastos
 * → historicoIngresos y historicoGastos NUNCA disminuyen
 * 
 * STOCK:
 * → stockActual = stockInicial - unidadesVendidas
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { 
  BancoId, 
  Venta, 
  OrdenCompra, 
  Banco, 
  Movimiento,
  Cliente,
  Distribuidor,
  CalculoVentaResult,
  DistribucionBancos,
} from '@/app/types'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════

export interface DistribucionVenta {
  bovedaMonte: number
  fletes: number
  utilidades: number
  total: number
}

export interface DistribucionParcial extends DistribucionVenta {
  proporcion: number
  capitalBovedaMonte: number
  capitalFletes: number
  capitalUtilidades: number
}

export interface ResultadoAbono {
  nuevoMontoPagado: number
  nuevoMontoRestante: number
  nuevoEstado: 'completo' | 'parcial' | 'pendiente'
  distribucionAdicional: DistribucionVenta
  movimientos: Omit<Movimiento, 'id' | 'createdAt'>[]
}

export interface ResultadoTransferencia {
  bancoOrigenNuevo: Partial<Banco>
  bancoDestinoNuevo: Partial<Banco>
  movimientoOrigen: Omit<Movimiento, 'id' | 'createdAt'>
  movimientoDestino: Omit<Movimiento, 'id' | 'createdAt'>
}

// ═══════════════════════════════════════════════════════════════════════════
// FÓRMULAS SAGRADAS — DISTRIBUCIÓN DE VENTAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula la distribución de una venta a los 3 bancos
 * 
 * @param precioVenta - Precio de venta por unidad al cliente
 * @param precioCompra - Costo por unidad (de la orden de compra)
 * @param precioFlete - Costo de flete por unidad
 * @param cantidad - Cantidad de unidades vendidas
 * @returns Distribución a los 3 bancos
 */
export function calcularDistribucionVenta(
  precioVenta: number,
  precioCompra: number,
  precioFlete: number,
  cantidad: number,
): DistribucionVenta {
  // Validaciones
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }
  if (precioVenta < 0 || precioCompra < 0 || precioFlete < 0) {
    throw new Error('Los precios no pueden ser negativos')
  }

  const bovedaMonte = precioCompra * cantidad
  const fletes = precioFlete * cantidad
  const utilidades = (precioVenta - precioCompra - precioFlete) * cantidad
  const total = bovedaMonte + fletes + utilidades // = precioVenta * cantidad

  return {
    bovedaMonte,
    fletes,
    utilidades,
    total,
  }
}

/**
 * Calcula la distribución para un pago parcial
 * 
 * @param distribucionTotal - Distribución completa de la venta
 * @param montoPagado - Monto que el cliente ha pagado
 * @param totalVenta - Precio total de la venta
 * @returns Distribución parcial con proporciones
 */
export function calcularDistribucionParcial(
  distribucionTotal: DistribucionVenta,
  montoPagado: number,
  totalVenta: number,
): DistribucionParcial {
  if (totalVenta <= 0) {
    throw new Error('El total de venta debe ser mayor a 0')
  }
  if (montoPagado < 0) {
    throw new Error('El monto pagado no puede ser negativo')
  }

  const proporcion = Math.min(montoPagado / totalVenta, 1)

  return {
    ...distribucionTotal,
    proporcion,
    capitalBovedaMonte: distribucionTotal.bovedaMonte * proporcion,
    capitalFletes: distribucionTotal.fletes * proporcion,
    capitalUtilidades: distribucionTotal.utilidades * proporcion,
  }
}

/**
 * Calcula el resultado completo de una venta (compatible con CalculoVentaResult)
 */
export function calcularVentaCompleta(
  precioVenta: number,
  precioCompra: number,
  precioFlete: number,
  cantidad: number,
  montoPagado: number,
): CalculoVentaResult {
  const totalVenta = precioVenta * cantidad
  const distribucion = calcularDistribucionVenta(precioVenta, precioCompra, precioFlete, cantidad)
  
  let distribucionParcial: DistribucionBancos | undefined
  let proporcionPagada: number | undefined

  if (montoPagado < totalVenta && montoPagado > 0) {
    const parcial = calcularDistribucionParcial(distribucion, montoPagado, totalVenta)
    proporcionPagada = parcial.proporcion
    distribucionParcial = {
      bovedaMonte: parcial.capitalBovedaMonte,
      fletes: parcial.capitalFletes,
      utilidades: parcial.capitalUtilidades,
    }
  }

  return {
    costoPorUnidad: precioCompra + precioFlete,
    costoTotalLote: (precioCompra + precioFlete) * cantidad,
    ingresoVenta: totalVenta,
    totalVenta,
    montoBovedaMonte: distribucion.bovedaMonte,
    montoFletes: distribucion.fletes,
    montoUtilidades: distribucion.utilidades,
    gananciaBruta: distribucion.utilidades,
    gananciaDesdeCSV: distribucion.utilidades,
    proporcionPagada,
    distribucionParcial,
    margenPorcentaje: totalVenta > 0 ? (distribucion.utilidades / totalVenta) * 100 : 0,
    // Legacy aliases
    precioTotalVenta: totalVenta,
    bovedaMonte: distribucion.bovedaMonte,
    fletes: distribucion.fletes,
    utilidades: distribucion.utilidades,
    totalDistribuido: distribucion.total,
    ganancia: distribucion.utilidades,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FÓRMULAS SAGRADAS — ABONOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula el resultado de un abono a una venta existente
 * 
 * @param venta - Venta actual
 * @param montoAbono - Monto del nuevo abono
 * @param bancoDestino - Banco donde se deposita el abono
 * @returns Resultado del abono con nuevos estados y movimientos
 */
export function calcularAbono(
  venta: Venta,
  montoAbono: number,
  bancoDestino: BancoId = 'boveda_monte',
): ResultadoAbono {
  if (montoAbono <= 0) {
    throw new Error('El monto del abono debe ser mayor a 0')
  }

  const totalVenta = venta.precioTotalVenta || venta.ingreso || (venta.precioVenta * venta.cantidad)
  const montoPagadoAnterior = venta.montoPagado || 0
  const nuevoMontoPagado = Math.min(montoPagadoAnterior + montoAbono, totalVenta)
  const nuevoMontoRestante = totalVenta - nuevoMontoPagado

  // Determinar nuevo estado
  let nuevoEstado: 'completo' | 'parcial' | 'pendiente'
  if (nuevoMontoRestante <= 0.01) { // Tolerancia de centavos
    nuevoEstado = 'completo'
  } else if (nuevoMontoPagado > 0) {
    nuevoEstado = 'parcial'
  } else {
    nuevoEstado = 'pendiente'
  }

  // Calcular distribución del abono
  const precioCompra = venta.precioCompra || venta.bovedaMonte / venta.cantidad
  const precioFlete = (venta.fleteUtilidad || venta.precioFlete || 0) / venta.cantidad
  
  const distribucionTotal = calcularDistribucionVenta(
    venta.precioVenta,
    precioCompra,
    precioFlete,
    venta.cantidad,
  )

  // Proporción que cubre este abono específico
  const proporcionAbono = montoAbono / totalVenta
  
  const distribucionAdicional: DistribucionVenta = {
    bovedaMonte: distribucionTotal.bovedaMonte * proporcionAbono,
    fletes: distribucionTotal.fletes * proporcionAbono,
    utilidades: distribucionTotal.utilidades * proporcionAbono,
    total: montoAbono,
  }

  // Crear movimientos para cada banco
  const fechaActual = new Date().toISOString()
  const movimientos: Omit<Movimiento, 'id' | 'createdAt'>[] = []

  if (distribucionAdicional.bovedaMonte > 0) {
    movimientos.push({
      bancoId: 'boveda_monte',
      tipoMovimiento: 'abono_cliente',
      fecha: fechaActual,
      monto: distribucionAdicional.bovedaMonte,
      concepto: `Abono venta ${venta.id} - Cliente: ${venta.cliente}`,
      cliente: venta.cliente,
      referenciaId: venta.id,
      referenciaTipo: 'abono',
    })
  }

  if (distribucionAdicional.fletes > 0) {
    movimientos.push({
      bancoId: 'flete_sur',
      tipoMovimiento: 'abono_cliente',
      fecha: fechaActual,
      monto: distribucionAdicional.fletes,
      concepto: `Abono venta ${venta.id} - Flete - Cliente: ${venta.cliente}`,
      cliente: venta.cliente,
      referenciaId: venta.id,
      referenciaTipo: 'abono',
    })
  }

  if (distribucionAdicional.utilidades > 0) {
    movimientos.push({
      bancoId: 'utilidades',
      tipoMovimiento: 'abono_cliente',
      fecha: fechaActual,
      monto: distribucionAdicional.utilidades,
      concepto: `Abono venta ${venta.id} - Utilidad - Cliente: ${venta.cliente}`,
      cliente: venta.cliente,
      referenciaId: venta.id,
      referenciaTipo: 'abono',
    })
  }

  return {
    nuevoMontoPagado,
    nuevoMontoRestante,
    nuevoEstado,
    distribucionAdicional,
    movimientos,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FÓRMULAS SAGRADAS — TRANSFERENCIAS ATÓMICAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula una transferencia atómica entre dos bancos
 * 
 * @param bancoOrigen - Banco de origen
 * @param bancoDestino - Banco de destino
 * @param monto - Monto a transferir
 * @param concepto - Concepto de la transferencia
 * @returns Resultado con nuevos estados de bancos y movimientos
 */
export function calcularTransferencia(
  bancoOrigen: Banco,
  bancoDestino: Banco,
  monto: number,
  concepto: string = 'Transferencia entre bancos',
): ResultadoTransferencia {
  if (monto <= 0) {
    throw new Error('El monto de transferencia debe ser mayor a 0')
  }
  if (bancoOrigen.id === bancoDestino.id) {
    throw new Error('El banco origen y destino deben ser diferentes')
  }
  if (bancoOrigen.capitalActual < monto) {
    throw new Error(`Fondos insuficientes en ${bancoOrigen.nombre}. Disponible: ${bancoOrigen.capitalActual}, Requerido: ${monto}`)
  }

  const fechaActual = new Date().toISOString()

  return {
    bancoOrigenNuevo: {
      capitalActual: bancoOrigen.capitalActual - monto,
      historicoGastos: bancoOrigen.historicoGastos + monto,
      historicoTransferencias: bancoOrigen.historicoTransferencias + monto,
    },
    bancoDestinoNuevo: {
      capitalActual: bancoDestino.capitalActual + monto,
      historicoIngresos: bancoDestino.historicoIngresos + monto,
      historicoTransferencias: bancoDestino.historicoTransferencias + monto,
    },
    movimientoOrigen: {
      bancoId: bancoOrigen.id,
      tipoMovimiento: 'transferencia_salida',
      fecha: fechaActual,
      monto: -monto,
      concepto,
      destino: bancoDestino.nombre,
      saldoAnterior: bancoOrigen.capitalActual,
      saldoNuevo: bancoOrigen.capitalActual - monto,
    },
    movimientoDestino: {
      bancoId: bancoDestino.id,
      tipoMovimiento: 'transferencia_entrada',
      fecha: fechaActual,
      monto,
      concepto,
      origen: bancoOrigen.nombre,
      saldoAnterior: bancoDestino.capitalActual,
      saldoNuevo: bancoDestino.capitalActual + monto,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FÓRMULAS SAGRADAS — STOCK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula el stock actual de una orden de compra
 * 
 * @param ordenCompra - Orden de compra
 * @param ventasRelacionadas - Ventas que usan stock de esta OC
 * @returns Stock actual
 */
export function calcularStock(
  ordenCompra: OrdenCompra,
  ventasRelacionadas: Venta[],
): number {
  const unidadesVendidas = ventasRelacionadas
    .filter(v => v.ocRelacionada === ordenCompra.id)
    .reduce((acc, v) => acc + v.cantidad, 0)
  
  return Math.max(0, ordenCompra.stockInicial - unidadesVendidas)
}

/**
 * Verifica si hay stock suficiente para una venta
 */
export function verificarStock(
  ordenCompra: OrdenCompra,
  cantidadRequerida: number,
  ventasExistentes: Venta[],
): { disponible: boolean; stockActual: number; mensaje?: string } {
  const stockActual = calcularStock(ordenCompra, ventasExistentes)
  
  if (stockActual < cantidadRequerida) {
    return {
      disponible: false,
      stockActual,
      mensaje: `Stock insuficiente. Disponible: ${stockActual}, Requerido: ${cantidadRequerida}`,
    }
  }
  
  return { disponible: true, stockActual }
}

// ═══════════════════════════════════════════════════════════════════════════
// FÓRMULAS SAGRADAS — CAPITAL BANCARIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula el capital actual de un banco
 * capitalActual = historicoIngresos - historicoGastos
 */
export function calcularCapitalBanco(banco: Banco): number {
  return banco.historicoIngresos - banco.historicoGastos
}

/**
 * Recalcula todos los campos de un banco basándose en sus movimientos
 */
export function recalcularBanco(
  banco: Banco,
  movimientos: Movimiento[],
): Banco {
  const movimientosBanco = movimientos.filter(m => m.bancoId === banco.id)
  
  let historicoIngresos = 0
  let historicoGastos = 0
  let historicoTransferencias = 0

  for (const mov of movimientosBanco) {
    if (mov.monto > 0) {
      historicoIngresos += mov.monto
    } else {
      historicoGastos += Math.abs(mov.monto)
    }
    
    if (mov.tipoMovimiento === 'transferencia_entrada' || mov.tipoMovimiento === 'transferencia_salida') {
      historicoTransferencias += Math.abs(mov.monto)
    }
  }

  const capitalActual = historicoIngresos - historicoGastos

  return {
    ...banco,
    capitalActual,
    historicoIngresos,
    historicoGastos,
    historicoTransferencias,
    estado: capitalActual < 0 ? 'negativo' : 'activo',
    updatedAt: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FÓRMULAS SAGRADAS — CLIENTES Y DISTRIBUIDORES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recalcula los totales de un cliente basándose en sus ventas
 */
export function recalcularCliente(
  cliente: Cliente,
  ventasCliente: Venta[],
): Partial<Cliente> {
  const totalVentas = ventasCliente.reduce((acc, v) => acc + (v.precioTotalVenta || v.ingreso || 0), 0)
  const totalPagado = ventasCliente.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  const deudaTotal = totalVentas - totalPagado
  
  return {
    totalVentas,
    totalPagado,
    deudaTotal,
    deuda: deudaTotal,
    pendiente: deudaTotal,
    actual: -deudaTotal, // Positivo = a favor del cliente, negativo = debe
    numeroCompras: ventasCliente.length,
    ultimaCompra: ventasCliente.length > 0 
      ? ventasCliente.sort((a, b) => 
          new Date(b.fecha as string).getTime() - new Date(a.fecha as string).getTime(),
        )[0].fecha 
      : undefined,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Recalcula los totales de un distribuidor basándose en sus órdenes de compra
 */
export function recalcularDistribuidor(
  distribuidor: Distribuidor,
  ordenesDistribuidor: OrdenCompra[],
): Partial<Distribuidor> {
  const totalOrdenesCompra = ordenesDistribuidor.reduce((acc, oc) => acc + (oc.costoTotal || 0), 0)
  const totalPagado = ordenesDistribuidor.reduce((acc, oc) => acc + (oc.pagoDistribuidor || oc.pagoInicial || 0), 0)
  const deudaTotal = totalOrdenesCompra - totalPagado
  
  return {
    totalOrdenesCompra,
    costoTotal: totalOrdenesCompra,
    totalPagado,
    abonos: totalPagado,
    deudaTotal,
    pendiente: deudaTotal,
    numeroOrdenes: ordenesDistribuidor.length,
    ultimaOrden: ordenesDistribuidor.length > 0 
      ? ordenesDistribuidor.sort((a, b) => 
          new Date(b.fecha as string).getTime() - new Date(a.fecha as string).getTime(),
        )[0].fecha 
      : undefined,
    updatedAt: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDACIONES
// ═══════════════════════════════════════════════════════════════════════════

export function validarVenta(venta: Partial<Venta>): { valido: boolean; errores: string[] } {
  const errores: string[] = []
  
  if (!venta.clienteId) errores.push('Cliente es requerido')
  if (!venta.ocRelacionada) errores.push('Orden de compra es requerida')
  if (!venta.cantidad || venta.cantidad <= 0) errores.push('Cantidad debe ser mayor a 0')
  if (!venta.precioVenta || venta.precioVenta <= 0) errores.push('Precio de venta debe ser mayor a 0')
  
  return { valido: errores.length === 0, errores }
}

export function validarOrdenCompra(oc: Partial<OrdenCompra>): { valido: boolean; errores: string[] } {
  const errores: string[] = []
  
  if (!oc.distribuidorId) errores.push('Distribuidor es requerido')
  if (!oc.cantidad || oc.cantidad <= 0) errores.push('Cantidad debe ser mayor a 0')
  if (!oc.costoDistribuidor || oc.costoDistribuidor < 0) errores.push('Costo del distribuidor es requerido')
  
  return { valido: errores.length === 0, errores }
}

export function validarTransferencia(
  bancoOrigenId: BancoId,
  bancoDestinoId: BancoId,
  monto: number,
): { valido: boolean; errores: string[] } {
  const errores: string[] = []
  
  if (!bancoOrigenId) errores.push('Banco origen es requerido')
  if (!bancoDestinoId) errores.push('Banco destino es requerido')
  if (bancoOrigenId === bancoDestinoId) errores.push('Los bancos deben ser diferentes')
  if (!monto || monto <= 0) errores.push('El monto debe ser mayor a 0')
  
  return { valido: errores.length === 0, errores }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function generarIdVenta(): string {
  const fecha = new Date()
  const year = fecha.getFullYear().toString().slice(-2)
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `V${year}${month}-${random}`
}

export function generarIdOrdenCompra(numero: number): string {
  return `OC${numero.toString().padStart(4, '0')}`
}

export function generarIdMovimiento(): string {
  return `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}
