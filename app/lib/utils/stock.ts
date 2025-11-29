/**
 * 📦 UTILIDADES DE GESTIÓN DE STOCK Y ALMACÉN
 * 
 * Funciones para:
 * - Cálculo de niveles de stock
 * - Trazabilidad de movimientos
 * - Rotación de inventario
 * - Proyección de agotamiento
 * - Valorización de inventario
 */

import { Timestamp } from 'firebase/firestore';
import logger from '@/app/lib/utils/logger';

// ============================================
// INTERFACES
// ============================================
export interface MovimientoStock {
  id?: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  fecha: Date | Timestamp;
  concepto: string;
  referencia?: string;
  ordenCompraId?: string;
  ventaId?: string;
  usuarioId?: string;
  costoUnitario?: number;
}

export interface Producto {
  id: string;
  nombre: string;
  sku?: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  precioVenta: number;
  precioCompra: number;
  categoria?: string;
  ubicacion?: string;
  movimientos?: MovimientoStock[];
}

export interface NivelStock {
  nivel: 'critico' | 'bajo' | 'optimo' | 'exceso' | 'agotado';
  mensaje: string;
  color: string;
  bgColor: string;
  porcentaje: number;
}

export interface ProyeccionAgotamiento {
  diasRestantes: number;
  fechaAgotamiento: Date;
  alerta: 'urgente' | 'pronto' | 'normal' | 'seguro';
  confianza: number;
}

export interface RotacionInventario {
  rotacion: number;
  nivel: 'alta' | 'media' | 'baja' | 'sin_movimiento';
  diasPromedio: number;
  recomendacion: string;
}

export interface ValorizacionInventario {
  costoTotal: number;
  precioVentaTotal: number;
  margenPotencial: number;
  margenPorcentaje: number;
}

// ============================================
// FUNCIONES DE STOCK
// ============================================

/**
 * Calcula el nuevo stock después de aplicar un movimiento
 */
export function calcularNuevoStock(
  stockActual: number,
  movimiento: Pick<MovimientoStock, 'tipo' | 'cantidad'>
): number {
  let nuevoStock: number;

  switch (movimiento.tipo) {
    case 'entrada':
      nuevoStock = stockActual + movimiento.cantidad;
      break;
    case 'salida':
      nuevoStock = stockActual - movimiento.cantidad;
      break;
    case 'ajuste':
      // El ajuste puede ser positivo o negativo
      nuevoStock = movimiento.cantidad; // Valor absoluto nuevo
      break;
    default:
      nuevoStock = stockActual;
  }

  if (nuevoStock < 0) {
    logger.warn('Stock negativo detectado', { stockActual, movimiento, nuevoStock });
    throw new Error(`Stock no puede ser negativo. Actual: ${stockActual}, Movimiento: ${movimiento.cantidad}`);
  }

  return nuevoStock;
}

/**
 * Determina el nivel de stock con colores y recomendaciones
 */
export function determinarNivelStock(producto: Producto): NivelStock {
  const { stockActual, stockMinimo, stockMaximo } = producto;

  // Agotado
  if (stockActual === 0) {
    return {
      nivel: 'agotado',
      mensaje: '🚨 Stock agotado - Reabastecer urgentemente',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      porcentaje: 0
    };
  }

  // Crítico (por debajo del mínimo)
  if (stockActual <= stockMinimo) {
    const porcentaje = (stockActual / stockMinimo) * 100;
    return {
      nivel: 'critico',
      mensaje: `⚠️ Stock crítico (${stockActual} <= ${stockMinimo})`,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      porcentaje
    };
  }

  // Calcular stock óptimo (punto medio)
  const stockOptimo = (stockMinimo + stockMaximo) / 2;

  // Bajo (entre mínimo y óptimo)
  if (stockActual < stockOptimo) {
    const porcentaje = ((stockActual - stockMinimo) / (stockOptimo - stockMinimo)) * 50 + 25;
    return {
      nivel: 'bajo',
      mensaje: `📉 Stock bajo - Considerar reabastecimiento`,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      porcentaje
    };
  }

  // Exceso (por encima del máximo)
  if (stockActual > stockMaximo) {
    const exceso = stockActual - stockMaximo;
    return {
      nivel: 'exceso',
      mensaje: `📦 Stock en exceso (+${exceso} unidades)`,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      porcentaje: 100
    };
  }

  // Óptimo
  const porcentaje = ((stockActual - stockMinimo) / (stockMaximo - stockMinimo)) * 100;
  return {
    nivel: 'optimo',
    mensaje: '✅ Stock óptimo',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    porcentaje
  };
}

/**
 * Calcula la rotación de inventario
 * Rotación = Ventas del periodo / Stock promedio
 */
export function calcularRotacion(
  ventasDelPeriodo: number,
  stockPromedio: number,
  diasPeriodo: number = 30
): RotacionInventario {
  if (stockPromedio === 0) {
    return {
      rotacion: 0,
      nivel: 'sin_movimiento',
      diasPromedio: 999,
      recomendacion: 'Sin datos de stock para calcular rotación'
    };
  }

  const rotacion = ventasDelPeriodo / stockPromedio;
  const diasPromedio = stockPromedio > 0 ? diasPeriodo / rotacion : 999;

  let nivel: 'alta' | 'media' | 'baja' | 'sin_movimiento';
  let recomendacion: string;

  if (rotacion >= 10) {
    nivel = 'alta';
    recomendacion = '🚀 Excelente rotación - Considerar aumentar stock mínimo';
  } else if (rotacion >= 3) {
    nivel = 'media';
    recomendacion = '👍 Rotación saludable - Mantener niveles actuales';
  } else if (rotacion > 0) {
    nivel = 'baja';
    recomendacion = '⚠️ Baja rotación - Evaluar promociones o reducir pedidos';
  } else {
    nivel = 'sin_movimiento';
    recomendacion = '❌ Sin movimiento - Producto estancado';
  }

  return {
    rotacion: Number(rotacion.toFixed(2)),
    nivel,
    diasPromedio: Math.round(diasPromedio),
    recomendacion
  };
}

/**
 * Proyecta cuándo se agotará el stock basado en ventas históricas
 */
export function proyectarAgotamiento(
  stockActual: number,
  ventasUltimos30Dias: number,
  diasHistorico: number = 30
): ProyeccionAgotamiento {
  // Calcular ventas promedio diarias
  const ventasPromedioDiario = ventasUltimos30Dias / diasHistorico;

  if (ventasPromedioDiario <= 0 || stockActual <= 0) {
    return {
      diasRestantes: stockActual <= 0 ? 0 : 999,
      fechaAgotamiento: stockActual <= 0 ? new Date() : new Date('2099-12-31'),
      alerta: stockActual <= 0 ? 'urgente' : 'seguro',
      confianza: ventasUltimos30Dias > 0 ? 0.9 : 0.3
    };
  }

  const diasRestantes = Math.floor(stockActual / ventasPromedioDiario);
  const fechaAgotamiento = new Date();
  fechaAgotamiento.setDate(fechaAgotamiento.getDate() + diasRestantes);

  // Determinar nivel de alerta
  let alerta: 'urgente' | 'pronto' | 'normal' | 'seguro';

  if (diasRestantes <= 7) {
    alerta = 'urgente';
  } else if (diasRestantes <= 14) {
    alerta = 'pronto';
  } else if (diasRestantes <= 30) {
    alerta = 'normal';
  } else {
    alerta = 'seguro';
  }

  // Confianza basada en volumen de datos
  const confianza = Math.min(0.95, 0.5 + (ventasUltimos30Dias / 100) * 0.45);

  return {
    diasRestantes,
    fechaAgotamiento,
    alerta,
    confianza: Number(confianza.toFixed(2))
  };
}

/**
 * Calcula la valorización del inventario
 */
export function valorizarInventario(productos: Producto[]): ValorizacionInventario {
  let costoTotal = 0;
  let precioVentaTotal = 0;

  productos.forEach(producto => {
    costoTotal += producto.stockActual * producto.precioCompra;
    precioVentaTotal += producto.stockActual * producto.precioVenta;
  });

  const margenPotencial = precioVentaTotal - costoTotal;
  const margenPorcentaje = costoTotal > 0 
    ? ((precioVentaTotal - costoTotal) / costoTotal) * 100 
    : 0;

  return {
    costoTotal: Number(costoTotal.toFixed(2)),
    precioVentaTotal: Number(precioVentaTotal.toFixed(2)),
    margenPotencial: Number(margenPotencial.toFixed(2)),
    margenPorcentaje: Number(margenPorcentaje.toFixed(2))
  };
}

/**
 * Genera recomendación de reabastecimiento basada en datos históricos
 */
export function recomendarReabastecimiento(
  producto: Producto,
  ventasPromedioDiario: number,
  diasCobertura: number = 30
): {
  cantidadSugerida: number;
  prioridad: 'alta' | 'media' | 'baja';
  razon: string;
} {
  const stockNecesario = ventasPromedioDiario * diasCobertura;
  const stockFaltante = stockNecesario - producto.stockActual;

  if (stockFaltante <= 0) {
    return {
      cantidadSugerida: 0,
      prioridad: 'baja',
      razon: `Stock suficiente para ${diasCobertura} días`
    };
  }

  // Ajustar al stock máximo si es necesario
  const cantidadSugerida = Math.min(
    Math.ceil(stockFaltante),
    producto.stockMaximo - producto.stockActual
  );

  const nivel = determinarNivelStock(producto);
  let prioridad: 'alta' | 'media' | 'baja';
  let razon: string;

  if (nivel.nivel === 'critico' || nivel.nivel === 'agotado') {
    prioridad = 'alta';
    razon = 'Stock crítico - Reabastecer urgentemente';
  } else if (nivel.nivel === 'bajo') {
    prioridad = 'media';
    razon = 'Stock bajo - Programar reabastecimiento';
  } else {
    prioridad = 'baja';
    razon = 'Reabastecimiento preventivo';
  }

  return {
    cantidadSugerida: Math.max(0, cantidadSugerida),
    prioridad,
    razon
  };
}

/**
 * Calcula el costo promedio ponderado (para valorización FIFO/LIFO)
 */
export function calcularCostoPromedioPonderado(
  movimientos: MovimientoStock[]
): number {
  const entradas = movimientos.filter(m => 
    m.tipo === 'entrada' && m.costoUnitario !== undefined
  );

  if (entradas.length === 0) return 0;

  let totalCosto = 0;
  let totalCantidad = 0;

  entradas.forEach(entrada => {
    totalCosto += entrada.cantidad * (entrada.costoUnitario || 0);
    totalCantidad += entrada.cantidad;
  });

  return totalCantidad > 0 ? totalCosto / totalCantidad : 0;
}

/**
 * Genera timeline de movimientos para trazabilidad
 */
export function generarTimelineMovimientos(
  movimientos: MovimientoStock[]
): Array<{
  fecha: Date;
  tipo: string;
  cantidad: number;
  saldoResultante: number;
  descripcion: string;
}> {
  // Ordenar por fecha
  const ordenados = [...movimientos].sort((a, b) => {
    const fechaA = a.fecha instanceof Timestamp ? a.fecha.toDate() : new Date(a.fecha);
    const fechaB = b.fecha instanceof Timestamp ? b.fecha.toDate() : new Date(b.fecha);
    return fechaA.getTime() - fechaB.getTime();
  });

  let saldoAcumulado = 0;

  return ordenados.map(mov => {
    const fecha = mov.fecha instanceof Timestamp ? mov.fecha.toDate() : new Date(mov.fecha);

    if (mov.tipo === 'entrada') {
      saldoAcumulado += mov.cantidad;
    } else if (mov.tipo === 'salida') {
      saldoAcumulado -= mov.cantidad;
    } else if (mov.tipo === 'ajuste') {
      saldoAcumulado = mov.cantidad;
    }

    return {
      fecha,
      tipo: mov.tipo,
      cantidad: mov.cantidad,
      saldoResultante: saldoAcumulado,
      descripcion: mov.concepto
    };
  });
}

export default {
  calcularNuevoStock,
  determinarNivelStock,
  calcularRotacion,
  proyectarAgotamiento,
  valorizarInventario,
  recomendarReabastecimiento,
  calcularCostoPromedioPonderado,
  generarTimelineMovimientos
};
