/**
 * Calculations - Fórmulas de Negocio FlowDistributor
 * Todas las fórmulas críticas del sistema de casa de cambio
 */

// Tipos
export interface VentaData {
  cantidad: number;
  precioVentaUnidad: number;
  precioCompraUnidad: number;
  precioFlete: number;
  montoPagado?: number;
}

export interface OrdenCompraData {
  cantidad: number;
  costoDistribuidor: number;
  costoTransporte: number;
  pagoInicial?: number;
}

export interface DistribucionVenta {
  bovedaMonte: number;
  fletes: number;
  utilidades: number;
  total: number;
}

export interface MargenCalculo {
  margenBruto: number;
  margenNeto: number;
  porcentajeMargen: number;
  rentabilidad: number;
}

export interface ProyeccionData {
  ventasHistoricas: number[];
  meses: number;
}

// ==========================================
// FÓRMULAS DE VENTAS
// ==========================================

/**
 * Calcular precio total de venta
 * Fórmula: (precioVenta + flete) × cantidad
 */
export function calcularPrecioTotalVenta(data: VentaData): number {
  const { cantidad, precioVentaUnidad, precioFlete } = data;
  return (precioVentaUnidad + precioFlete) * cantidad;
}

/**
 * Calcular distribución de venta (80-10-10)
 * - Bóveda Monte: 80% (costo del producto)
 * - Fletes: 10% (costo de flete)
 * - Utilidades: 10% (ganancia neta)
 */
export function calcularDistribucionVenta(data: VentaData): DistribucionVenta {
  const { cantidad, precioVentaUnidad, precioCompraUnidad, precioFlete, montoPagado } = data;
  
  const totalVenta = (precioVentaUnidad + precioFlete) * cantidad;
  const proporcionPagada = montoPagado ? montoPagado / totalVenta : 1;
  
  // Cálculos base
  const costoProducto = precioCompraUnidad * cantidad;
  const costoFletes = precioFlete * cantidad;
  const utilidadBruta = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad;
  
  // Aplicar proporción si es pago parcial
  return {
    bovedaMonte: costoProducto * proporcionPagada,
    fletes: costoFletes * proporcionPagada,
    utilidades: utilidadBruta * proporcionPagada,
    total: totalVenta * proporcionPagada,
  };
}

/**
 * Calcular monto restante de venta
 */
export function calcularMontoRestante(data: VentaData): number {
  const total = calcularPrecioTotalVenta(data);
  return Math.max(0, total - (data.montoPagado || 0));
}

/**
 * Determinar estado de pago de venta
 */
export function determinarEstadoPago(
  precioTotal: number, 
  montoPagado: number
): 'completo' | 'parcial' | 'pendiente' {
  if (montoPagado >= precioTotal) return 'completo';
  if (montoPagado > 0) return 'parcial';
  return 'pendiente';
}

// ==========================================
// FÓRMULAS DE ÓRDENES DE COMPRA
// ==========================================

/**
 * Calcular costo total de orden de compra
 * Fórmula: (costoDistribuidor × cantidad) + costoTransporte
 */
export function calcularCostoTotalOrden(data: OrdenCompraData): number {
  const { cantidad, costoDistribuidor, costoTransporte } = data;
  return (costoDistribuidor * cantidad) + costoTransporte;
}

/**
 * Calcular costo por unidad incluyendo transporte
 */
export function calcularCostoPorUnidad(data: OrdenCompraData): number {
  const { cantidad, costoDistribuidor, costoTransporte } = data;
  return costoDistribuidor + (costoTransporte / cantidad);
}

/**
 * Calcular deuda de orden de compra
 */
export function calcularDeudaOrden(data: OrdenCompraData): number {
  const total = calcularCostoTotalOrden(data);
  return Math.max(0, total - (data.pagoInicial || 0));
}

// ==========================================
// FÓRMULAS DE MÁRGENES Y RENTABILIDAD
// ==========================================

/**
 * Calcular margen bruto
 * Fórmula: PrecioVenta - CostoProducto
 */
export function calcularMargenBruto(precioVenta: number, costoProducto: number): number {
  return precioVenta - costoProducto;
}

/**
 * Calcular margen neto (incluyendo flete)
 * Fórmula: PrecioVenta - CostoProducto - Flete
 */
export function calcularMargenNeto(
  precioVenta: number, 
  costoProducto: number, 
  flete: number
): number {
  return precioVenta - costoProducto - flete;
}

/**
 * Calcular porcentaje de margen
 * Fórmula: (Margen / PrecioVenta) × 100
 */
export function calcularPorcentajeMargen(margen: number, precioVenta: number): number {
  if (precioVenta === 0) return 0;
  return (margen / precioVenta) * 100;
}

/**
 * Calcular rentabilidad sobre costo
 * Fórmula: (Margen / Costo) × 100
 */
export function calcularRentabilidad(margen: number, costo: number): number {
  if (costo === 0) return 0;
  return (margen / costo) * 100;
}

/**
 * Calcular análisis completo de márgenes
 */
export function calcularAnalisisMargen(data: VentaData): MargenCalculo {
  const { precioVentaUnidad, precioCompraUnidad, precioFlete } = data;
  
  const margenBruto = calcularMargenBruto(precioVentaUnidad, precioCompraUnidad);
  const margenNeto = calcularMargenNeto(precioVentaUnidad, precioCompraUnidad, precioFlete);
  const porcentajeMargen = calcularPorcentajeMargen(margenNeto, precioVentaUnidad);
  const rentabilidad = calcularRentabilidad(margenNeto, precioCompraUnidad + precioFlete);
  
  return {
    margenBruto,
    margenNeto,
    porcentajeMargen,
    rentabilidad,
  };
}

// ==========================================
// FÓRMULAS DE INVENTARIO
// ==========================================

/**
 * Calcular valor total de inventario
 */
export function calcularValorInventario(
  productos: Array<{ stockActual: number; valorUnitario: number }>
): number {
  return productos.reduce((sum, p) => sum + (p.stockActual * p.valorUnitario), 0);
}

/**
 * Calcular rotación de inventario
 * Fórmula: Ventas / Inventario Promedio
 */
export function calcularRotacionInventario(
  ventasPeriodo: number,
  inventarioInicial: number,
  inventarioFinal: number
): number {
  const inventarioPromedio = (inventarioInicial + inventarioFinal) / 2;
  if (inventarioPromedio === 0) return 0;
  return ventasPeriodo / inventarioPromedio;
}

/**
 * Calcular días de inventario
 * Fórmula: 365 / Rotación
 */
export function calcularDiasInventario(rotacion: number): number {
  if (rotacion === 0) return 0;
  return 365 / rotacion;
}

/**
 * Determinar si producto necesita reabastecimiento
 */
export function necesitaReabastecimiento(
  stockActual: number,
  stockMinimo: number
): boolean {
  return stockActual <= stockMinimo;
}

/**
 * Calcular cantidad sugerida de reorden
 */
export function calcularCantidadReorden(
  stockActual: number,
  stockMinimo: number,
  stockOptimo: number
): number {
  if (stockActual > stockMinimo) return 0;
  return Math.max(0, stockOptimo - stockActual);
}

// ==========================================
// FÓRMULAS DE BANCOS
// ==========================================

/**
 * Calcular capital total en bancos
 */
export function calcularCapitalTotal(
  bancos: Array<{ saldo: number }>
): number {
  return bancos.reduce((sum, b) => sum + b.saldo, 0);
}

/**
 * Calcular porcentaje por banco
 */
export function calcularPorcentajeBanco(saldoBanco: number, capitalTotal: number): number {
  if (capitalTotal === 0) return 0;
  return (saldoBanco / capitalTotal) * 100;
}

/**
 * Validar transferencia entre bancos
 */
export function validarTransferencia(
  saldoOrigen: number,
  monto: number
): { valido: boolean; mensaje: string } {
  if (monto <= 0) {
    return { valido: false, mensaje: 'El monto debe ser mayor a 0' };
  }
  if (saldoOrigen < monto) {
    return { valido: false, mensaje: 'Saldo insuficiente en banco origen' };
  }
  return { valido: true, mensaje: 'Transferencia válida' };
}

// ==========================================
// FÓRMULAS DE PROYECCIONES Y PREDICCIONES
// ==========================================

/**
 * Calcular promedio móvil simple
 */
export function calcularPromedioMovil(valores: number[], periodo: number): number {
  if (valores.length < periodo) return 0;
  const ultimos = valores.slice(-periodo);
  return ultimos.reduce((a, b) => a + b, 0) / periodo;
}

/**
 * Calcular tendencia (regresión lineal simple)
 */
export function calcularTendencia(valores: number[]): { pendiente: number; intercepto: number } {
  const n = valores.length;
  if (n < 2) return { pendiente: 0, intercepto: valores[0] || 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += valores[i];
    sumXY += i * valores[i];
    sumX2 += i * i;
  }
  
  const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercepto = (sumY - pendiente * sumX) / n;
  
  return { pendiente, intercepto };
}

/**
 * Proyectar valor futuro basado en tendencia
 */
export function proyectarValorFuturo(
  valores: number[],
  periodosFuturos: number
): number {
  const { pendiente, intercepto } = calcularTendencia(valores);
  const x = valores.length + periodosFuturos - 1;
  return Math.max(0, intercepto + pendiente * x);
}

/**
 * Calcular crecimiento porcentual
 */
export function calcularCrecimiento(valorAnterior: number, valorActual: number): number {
  if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
  return ((valorActual - valorAnterior) / valorAnterior) * 100;
}

/**
 * Proyección de ventas para próximos meses
 */
export function proyectarVentas(data: ProyeccionData): number[] {
  const { ventasHistoricas, meses } = data;
  const proyecciones: number[] = [];
  
  for (let i = 1; i <= meses; i++) {
    const proyeccion = proyectarValorFuturo(ventasHistoricas, i);
    proyecciones.push(Math.round(proyeccion));
  }
  
  return proyecciones;
}

// ==========================================
// FÓRMULAS DE CLIENTES Y DEUDAS
// ==========================================

/**
 * Calcular deuda total de clientes
 */
export function calcularDeudaTotalClientes(
  clientes: Array<{ deudaTotal: number }>
): number {
  return clientes.reduce((sum, c) => sum + c.deudaTotal, 0);
}

/**
 * Clasificar cliente por nivel de deuda
 */
export function clasificarClienteDeuda(
  deuda: number,
  limites: { bajo: number; medio: number }
): 'bajo' | 'medio' | 'alto' {
  if (deuda <= limites.bajo) return 'bajo';
  if (deuda <= limites.medio) return 'medio';
  return 'alto';
}

/**
 * Calcular días de mora (aproximado)
 */
export function calcularDiasMora(fechaVenta: Date, fechaActual: Date = new Date()): number {
  const diffTime = fechaActual.getTime() - fechaVenta.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

// ==========================================
// UTILIDADES DE FORMATO
// ==========================================

/**
 * Formatear moneda MXN
 */
export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(valor);
}

/**
 * Formatear porcentaje
 */
export function formatearPorcentaje(valor: number, decimales: number = 1): string {
  return `${valor.toFixed(decimales)}%`;
}

/**
 * Formatear número con separadores
 */
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX').format(valor);
}

/**
 * Redondear a 2 decimales
 */
export function redondear(valor: number, decimales: number = 2): number {
  const factor = Math.pow(10, decimales);
  return Math.round(valor * factor) / factor;
}

export default {
  // Ventas
  calcularPrecioTotalVenta,
  calcularDistribucionVenta,
  calcularMontoRestante,
  determinarEstadoPago,
  
  // Órdenes de Compra
  calcularCostoTotalOrden,
  calcularCostoPorUnidad,
  calcularDeudaOrden,
  
  // Márgenes
  calcularMargenBruto,
  calcularMargenNeto,
  calcularPorcentajeMargen,
  calcularRentabilidad,
  calcularAnalisisMargen,
  
  // Inventario
  calcularValorInventario,
  calcularRotacionInventario,
  calcularDiasInventario,
  necesitaReabastecimiento,
  calcularCantidadReorden,
  
  // Bancos
  calcularCapitalTotal,
  calcularPorcentajeBanco,
  validarTransferencia,
  
  // Proyecciones
  calcularPromedioMovil,
  calcularTendencia,
  proyectarValorFuturo,
  calcularCrecimiento,
  proyectarVentas,
  
  // Clientes
  calcularDeudaTotalClientes,
  clasificarClienteDeuda,
  calcularDiasMora,
  
  // Formato
  formatearMoneda,
  formatearPorcentaje,
  formatearNumero,
  redondear,
};
