/**
 * 💳 UTILIDADES DE GESTIÓN DE CRÉDITO PARA DISTRIBUIDORES
 * 
 * Funciones para:
 * - Cálculo de crédito disponible
 * - Validación de límites de crédito
 * - Registro y procesamiento de pagos
 * - Análisis de morosidad
 * - Historial de crédito
 */

import { Timestamp } from 'firebase/firestore';
import { logger } from '@/app/lib/utils/logger';

// ============================================
// INTERFACES
// ============================================
export interface Distribuidor {
  id: string;
  nombre: string;
  empresa?: string;
  creditoTotal: number;
  creditoDisponible: number;
  deudaActual: number;
  diasCredito: number;
  calificacionCredito?: 'A' | 'B' | 'C' | 'D';
  limiteDeuda?: number;
  fechaUltimoPago?: Date | Timestamp;
  historialPagos?: Pago[];
}

export interface Pago {
  id?: string;
  monto: number;
  fecha: Date | Timestamp;
  referencia: string;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  aplicadoA?: string; // ID de factura específica
  notas?: string;
}

export interface Factura {
  id: string;
  fecha: Date | Timestamp;
  monto: number;
  montoPagado: number;
  saldoPendiente: number;
  pagada: boolean;
  fechaVencimiento: Date | Timestamp;
  diasCredito: number;
  distribuidorId: string;
}

export interface AnalisisCredito {
  creditoDisponible: number;
  porcentajeUtilizado: number;
  capacidadPago: 'buena' | 'regular' | 'limitada' | 'sin_capacidad';
  facturasPendientes: number;
  facturasVencidas: number;
  montoVencido: number;
  diasPromedioMora: number;
  recomendacion: string;
}

export interface ResultadoValidacion {
  permitido: boolean;
  mensaje: string;
  creditoDisponible: number;
  faltante?: number;
}

// ============================================
// FUNCIONES DE CRÉDITO
// ============================================

/**
 * Calcula el crédito disponible de un distribuidor
 * FÓRMULA: Crédito Disponible = Crédito Total - Deuda Actual
 */
export function calcularCreditoDisponible(distribuidor: Distribuidor): number {
  const disponible = distribuidor.creditoTotal - distribuidor.deudaActual;
  return Math.max(0, disponible);
}

/**
 * Valida si una venta puede realizarse con el crédito disponible
 */
export function validarCreditoParaVenta(
  distribuidor: Distribuidor,
  montoVenta: number
): ResultadoValidacion {
  const creditoDisponible = calcularCreditoDisponible(distribuidor);

  if (montoVenta <= creditoDisponible) {
    return {
      permitido: true,
      mensaje: `✅ Crédito suficiente. Disponible: $${creditoDisponible.toLocaleString('es-MX')}`,
      creditoDisponible
    };
  }

  const faltante = montoVenta - creditoDisponible;
  return {
    permitido: false,
    mensaje: `❌ Crédito insuficiente. Disponible: $${creditoDisponible.toLocaleString('es-MX')}, Faltante: $${faltante.toLocaleString('es-MX')}`,
    creditoDisponible,
    faltante
  };
}

/**
 * Procesa un pago y actualiza la deuda del distribuidor
 */
export function procesarPago(
  distribuidor: Distribuidor,
  pago: Pago
): {
  distribuidorActualizado: Distribuidor;
  pagoExcedente: number;
  mensaje: string;
} {
  const nuevaDeuda = Math.max(0, distribuidor.deudaActual - pago.monto);
  const pagoExcedente = pago.monto > distribuidor.deudaActual
    ? pago.monto - distribuidor.deudaActual
    : 0;

  const distribuidorActualizado: Distribuidor = {
    ...distribuidor,
    deudaActual: nuevaDeuda,
    creditoDisponible: distribuidor.creditoTotal - nuevaDeuda,
    fechaUltimoPago: pago.fecha
  };

  let mensaje: string;
  if (pagoExcedente > 0) {
    mensaje = `✅ Pago aplicado. Deuda liquidada. Saldo a favor: $${pagoExcedente.toLocaleString('es-MX')}`;
  } else if (nuevaDeuda === 0) {
    mensaje = '✅ Pago aplicado. Deuda liquidada completamente';
  } else {
    mensaje = `✅ Pago aplicado. Deuda restante: $${nuevaDeuda.toLocaleString('es-MX')}`;
  }

  logger.info('Pago procesado', {
    data: {
      distribuidorId: distribuidor.id,
      montoPago: pago.monto,
      nuevaDeuda,
      pagoExcedente
    }
  });

  return {
    distribuidorActualizado,
    pagoExcedente,
    mensaje
  };
}

/**
 * Calcula facturas vencidas y morosidad
 */
export function calcularFacturasVencidas(
  facturas: Factura[],
  diasCredito: number
): {
  total: number;
  vencidas: number;
  montoVencido: number;
  diasPromediomora: number;
  facturasMasVencidas: Factura[];
} {
  const hoy = new Date();
  let montoVencido = 0;
  let diasMoraTotal = 0;
  const facturasMasVencidas: Factura[] = [];

  const pendientes = facturas.filter(f => !f.pagada && f.saldoPendiente > 0);

  pendientes.forEach(factura => {
    const fechaFactura = factura.fecha instanceof Timestamp
      ? factura.fecha.toDate()
      : new Date(factura.fecha);

    const diasTranscurridos = Math.floor(
      (hoy.getTime() - fechaFactura.getTime()) / (1000 * 60 * 60 * 24)
    );

    const diasCreditoFactura = factura.diasCredito || diasCredito;

    if (diasTranscurridos > diasCreditoFactura) {
      const diasMora = diasTranscurridos - diasCreditoFactura;
      montoVencido += factura.saldoPendiente;
      diasMoraTotal += diasMora;
      facturasMasVencidas.push(factura);
    }
  });

  // Ordenar por días vencidos (más vencidas primero)
  facturasMasVencidas.sort((a, b) => {
    const fechaA = a.fecha instanceof Timestamp ? a.fecha.toDate() : new Date(a.fecha);
    const fechaB = b.fecha instanceof Timestamp ? b.fecha.toDate() : new Date(b.fecha);
    return fechaA.getTime() - fechaB.getTime();
  });

  const diasPromediomora = facturasMasVencidas.length > 0
    ? diasMoraTotal / facturasMasVencidas.length
    : 0;

  return {
    total: pendientes.length,
    vencidas: facturasMasVencidas.length,
    montoVencido,
    diasPromediomora: Math.round(diasPromediomora),
    facturasMasVencidas: facturasMasVencidas.slice(0, 5) // Top 5 más vencidas
  };
}

/**
 * Genera análisis completo de crédito del distribuidor
 */
export function analizarCredito(
  distribuidor: Distribuidor,
  facturas: Factura[]
): AnalisisCredito {
  const creditoDisponible = calcularCreditoDisponible(distribuidor);
  const porcentajeUtilizado = distribuidor.creditoTotal > 0
    ? (distribuidor.deudaActual / distribuidor.creditoTotal) * 100
    : 0;

  const analisisFacturas = calcularFacturasVencidas(facturas, distribuidor.diasCredito);

  // Determinar capacidad de pago
  let capacidadPago: 'buena' | 'regular' | 'limitada' | 'sin_capacidad';
  let recomendacion: string;

  if (porcentajeUtilizado < 50 && analisisFacturas.vencidas === 0) {
    capacidadPago = 'buena';
    recomendacion = '✅ Distribuidor confiable. Considerar aumento de línea de crédito.';
  } else if (porcentajeUtilizado < 75 && analisisFacturas.diasPromediomora < 15) {
    capacidadPago = 'regular';
    recomendacion = '👍 Comportamiento aceptable. Monitorear pagos.';
  } else if (porcentajeUtilizado < 90 || analisisFacturas.vencidas <= 2) {
    capacidadPago = 'limitada';
    recomendacion = '⚠️ Crédito casi agotado. Solicitar pago antes de nueva venta.';
  } else {
    capacidadPago = 'sin_capacidad';
    recomendacion = '🚨 Sin capacidad de crédito. Requerir pago al contado.';
  }

  return {
    creditoDisponible,
    porcentajeUtilizado: Number(porcentajeUtilizado.toFixed(2)),
    capacidadPago,
    facturasPendientes: analisisFacturas.total,
    facturasVencidas: analisisFacturas.vencidas,
    montoVencido: analisisFacturas.montoVencido,
    diasPromedioMora: analisisFacturas.diasPromediomora,
    recomendacion
  };
}

/**
 * Calcula la calificación crediticia basada en historial
 */
export function calcularCalificacionCrediticia(
  distribuidor: Distribuidor,
  facturas: Factura[],
  pagosUltimos12Meses: Pago[]
): {
  calificacion: 'A' | 'B' | 'C' | 'D';
  puntaje: number;
  factores: string[];
} {
  let puntaje = 100;
  const factores: string[] = [];

  // Factor 1: Utilización de crédito (máx -20 puntos)
  const utilizacion = (distribuidor.deudaActual / distribuidor.creditoTotal) * 100;
  if (utilizacion > 90) {
    puntaje -= 20;
    factores.push('Utilización de crédito muy alta (>90%)');
  } else if (utilizacion > 75) {
    puntaje -= 10;
    factores.push('Utilización de crédito alta (75-90%)');
  } else if (utilizacion > 50) {
    puntaje -= 5;
    factores.push('Utilización de crédito moderada (50-75%)');
  }

  // Factor 2: Facturas vencidas (máx -30 puntos)
  const analisisFacturas = calcularFacturasVencidas(facturas, distribuidor.diasCredito);
  if (analisisFacturas.vencidas > 5) {
    puntaje -= 30;
    factores.push('Más de 5 facturas vencidas');
  } else if (analisisFacturas.vencidas > 2) {
    puntaje -= 20;
    factores.push('3-5 facturas vencidas');
  } else if (analisisFacturas.vencidas > 0) {
    puntaje -= 10;
    factores.push('1-2 facturas vencidas');
  }

  // Factor 3: Días promedio de mora (máx -25 puntos)
  if (analisisFacturas.diasPromediomora > 60) {
    puntaje -= 25;
    factores.push('Mora promedio mayor a 60 días');
  } else if (analisisFacturas.diasPromediomora > 30) {
    puntaje -= 15;
    factores.push('Mora promedio 30-60 días');
  } else if (analisisFacturas.diasPromediomora > 15) {
    puntaje -= 10;
    factores.push('Mora promedio 15-30 días');
  }

  // Factor 4: Frecuencia de pagos (máx -15 puntos)
  if (pagosUltimos12Meses.length === 0) {
    puntaje -= 15;
    factores.push('Sin pagos en últimos 12 meses');
  } else if (pagosUltimos12Meses.length < 4) {
    puntaje -= 10;
    factores.push('Pocos pagos en últimos 12 meses');
  }

  // Factor 5: Antigüedad del cliente (bonus +10)
  // Esto requeriría fecha de creación del distribuidor

  // Determinar calificación
  let calificacion: 'A' | 'B' | 'C' | 'D';
  if (puntaje >= 80) {
    calificacion = 'A';
  } else if (puntaje >= 60) {
    calificacion = 'B';
  } else if (puntaje >= 40) {
    calificacion = 'C';
  } else {
    calificacion = 'D';
  }

  return {
    calificacion,
    puntaje: Math.max(0, puntaje),
    factores
  };
}

/**
 * Calcula el límite de crédito recomendado basado en historial
 */
export function calcularLimiteCreditoRecomendado(
  distribuidor: Distribuidor,
  ventasUltimos6Meses: number,
  pagosAPuntuales: number, // porcentaje de pagos a tiempo
  mesesRelacion: number
): {
  limiteRecomendado: number;
  razon: string;
  aumentoSugerido?: number;
} {
  // Base: promedio mensual de compras x 2
  const promedioMensual = ventasUltimos6Meses / 6;
  let limiteBase = promedioMensual * 2;

  // Ajustes por comportamiento de pago
  if (pagosAPuntuales >= 90) {
    limiteBase *= 1.5; // Bonus 50%
  } else if (pagosAPuntuales >= 75) {
    limiteBase *= 1.2; // Bonus 20%
  } else if (pagosAPuntuales < 50) {
    limiteBase *= 0.7; // Reducción 30%
  }

  // Ajuste por antigüedad
  if (mesesRelacion >= 24) {
    limiteBase *= 1.3; // Bonus 30%
  } else if (mesesRelacion >= 12) {
    limiteBase *= 1.15; // Bonus 15%
  } else if (mesesRelacion < 6) {
    limiteBase *= 0.8; // Reducción 20%
  }

  const limiteRecomendado = Math.round(limiteBase / 1000) * 1000; // Redondear a miles

  let razon: string;
  if (limiteRecomendado > distribuidor.creditoTotal * 1.2) {
    razon = '📈 Buen historial de pagos. Se recomienda aumentar línea de crédito.';
  } else if (limiteRecomendado < distribuidor.creditoTotal * 0.8) {
    razon = '📉 Historial de pagos irregular. Considerar reducir línea de crédito.';
  } else {
    razon = '✅ Límite actual adecuado según historial de pagos.';
  }

  const aumentoSugerido = limiteRecomendado > distribuidor.creditoTotal
    ? limiteRecomendado - distribuidor.creditoTotal
    : undefined;

  return {
    limiteRecomendado,
    razon,
    aumentoSugerido
  };
}

/**
 * Genera estado de cuenta del distribuidor
 */
export function generarEstadoCuenta(
  distribuidor: Distribuidor,
  facturas: Factura[],
  pagos: Pago[]
): {
  saldoInicial: number;
  cargos: Array<{ fecha: Date; concepto: string; monto: number }>;
  abonos: Array<{ fecha: Date; concepto: string; monto: number }>;
  saldoFinal: number;
  resumen: {
    totalCargos: number;
    totalAbonos: number;
    saldoAnterior: number;
  };
} {
  const cargos: Array<{ fecha: Date; concepto: string; monto: number }> = [];
  const abonos: Array<{ fecha: Date; concepto: string; monto: number }> = [];

  // Procesar facturas como cargos
  facturas.forEach(factura => {
    const fecha = factura.fecha instanceof Timestamp
      ? factura.fecha.toDate()
      : new Date(factura.fecha);

    cargos.push({
      fecha,
      concepto: `Factura ${factura.id}`,
      monto: factura.monto
    });
  });

  // Procesar pagos como abonos
  pagos.forEach(pago => {
    const fecha = pago.fecha instanceof Timestamp
      ? pago.fecha.toDate()
      : new Date(pago.fecha);

    abonos.push({
      fecha,
      concepto: `Pago - ${pago.referencia}`,
      monto: pago.monto
    });
  });

  // Ordenar por fecha
  cargos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  abonos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const totalCargos = cargos.reduce((sum, c) => sum + c.monto, 0);
  const totalAbonos = abonos.reduce((sum, a) => sum + a.monto, 0);
  const saldoFinal = totalCargos - totalAbonos;

  return {
    saldoInicial: 0, // Asumiendo que empezamos desde cero
    cargos,
    abonos,
    saldoFinal,
    resumen: {
      totalCargos,
      totalAbonos,
      saldoAnterior: 0
    }
  };
}

export default {
  calcularCreditoDisponible,
  validarCreditoParaVenta,
  procesarPago,
  calcularFacturasVencidas,
  analizarCredito,
  calcularCalificacionCrediticia,
  calcularLimiteCreditoRecomendado,
  generarEstadoCuenta
};
