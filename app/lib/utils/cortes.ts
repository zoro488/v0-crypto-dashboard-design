/**
 * 📊 UTILIDADES DE CORTES DE CAJA Y CONCILIACIÓN BANCARIA
 * 
 * Funciones para:
 * - Generación de cortes de caja automáticos
 * - Conciliación de movimientos
 * - Detección de discrepancias
 * - Reportes de cierre diario
 * - Historial de cortes
 */

import { Timestamp } from 'firebase/firestore';
import logger from '@/app/lib/utils/logger';

// ============================================
// INTERFACES
// ============================================
export interface MovimientoCaja {
  id?: string;
  tipo: 'ingreso' | 'gasto' | 'transferencia_entrada' | 'transferencia_salida';
  tipoMovimiento?: string; // Más específico: venta, pago_proveedor, etc.
  monto: number;
  fecha: Date | Timestamp;
  concepto: string;
  banco: string;
  bancoDestino?: string; // Para transferencias
  referencia?: string;
  usuarioId?: string;
  ventaId?: string;
  ordenCompraId?: string;
  verificado?: boolean;
}

export interface CorteCaja {
  id?: string;
  fecha: Date;
  banco: string;
  saldoInicial: number;
  totalIngresos: number;
  totalGastos: number;
  totalTransferenciasEntrada: number;
  totalTransferenciasSalida: number;
  saldoFinal: number;
  saldoEsperado: number;
  diferencia: number;
  movimientos: MovimientoCaja[];
  estado: 'abierto' | 'cerrado' | 'conciliado' | 'discrepancia';
  notas?: string;
  usuarioId?: string;
  fechaCierre?: Date;
}

export interface ResumenDiario {
  fecha: Date;
  bancos: Array<{
    banco: string;
    saldoInicial: number;
    saldoFinal: number;
    ingresos: number;
    gastos: number;
    movimientos: number;
  }>;
  totalIngresos: number;
  totalGastos: number;
  balanceNeto: number;
  ventasDelDia: number;
  pagosRecibidos: number;
  pagosRealizados: number;
}

export interface Discrepancia {
  tipo: 'faltante' | 'sobrante';
  monto: number;
  porcentaje: number;
  severidad: 'menor' | 'moderada' | 'grave';
  posiblesCausas: string[];
}

// ============================================
// FUNCIONES DE CORTE DE CAJA
// ============================================

/**
 * Calcula un corte de caja para un periodo específico
 */
export function calcularCorte(
  banco: string,
  fechaInicio: Date,
  fechaFin: Date,
  movimientos: MovimientoCaja[],
  saldoInicial: number = 0
): CorteCaja {
  // Filtrar movimientos del banco y periodo
  const movimientosPeriodo = movimientos.filter(m => {
    const fechaMov = m.fecha instanceof Timestamp ? m.fecha.toDate() : new Date(m.fecha);
    return m.banco === banco &&
           fechaMov >= fechaInicio &&
           fechaMov <= fechaFin;
  });

  // Calcular totales por tipo
  let totalIngresos = 0;
  let totalGastos = 0;
  let totalTransferenciasEntrada = 0;
  let totalTransferenciasSalida = 0;

  movimientosPeriodo.forEach(m => {
    switch (m.tipo) {
      case 'ingreso':
        totalIngresos += m.monto;
        break;
      case 'gasto':
        totalGastos += m.monto;
        break;
      case 'transferencia_entrada':
        totalTransferenciasEntrada += m.monto;
        break;
      case 'transferencia_salida':
        totalTransferenciasSalida += m.monto;
        break;
    }
  });

  // Calcular saldo esperado
  const saldoEsperado = saldoInicial +
    totalIngresos +
    totalTransferenciasEntrada -
    totalGastos -
    totalTransferenciasSalida;

  return {
    fecha: new Date(),
    banco,
    saldoInicial,
    totalIngresos,
    totalGastos,
    totalTransferenciasEntrada,
    totalTransferenciasSalida,
    saldoFinal: saldoEsperado, // Se ajusta después con saldo real
    saldoEsperado,
    diferencia: 0, // Se calcula al cerrar con saldo real
    movimientos: movimientosPeriodo,
    estado: 'abierto'
  };
}

/**
 * Genera un corte diario automático
 */
export function generarCorteDiario(
  banco: string,
  movimientosDia: MovimientoCaja[],
  saldoInicialDia: number,
  fecha?: Date
): CorteCaja {
  const hoy = fecha || new Date();
  const inicioDelDia = new Date(hoy);
  inicioDelDia.setHours(0, 0, 0, 0);

  const finDelDia = new Date(hoy);
  finDelDia.setHours(23, 59, 59, 999);

  return calcularCorte(banco, inicioDelDia, finDelDia, movimientosDia, saldoInicialDia);
}

/**
 * Cierra un corte y detecta discrepancias
 */
export function cerrarCorte(
  corte: CorteCaja,
  saldoRealContado: number,
  notas?: string,
  usuarioId?: string
): {
  corteCerrado: CorteCaja;
  discrepancia: Discrepancia | null;
} {
  const diferencia = saldoRealContado - corte.saldoEsperado;
  const discrepancia = detectarDiscrepancias(corte, saldoRealContado);

  const corteCerrado: CorteCaja = {
    ...corte,
    saldoFinal: saldoRealContado,
    diferencia,
    estado: discrepancia ? 'discrepancia' : 'cerrado',
    notas,
    usuarioId,
    fechaCierre: new Date()
  };

  if (discrepancia) {
    logger.warn('Discrepancia en corte de caja', {
      banco: corte.banco,
      diferencia,
      severidad: discrepancia.severidad
    });
  }

  return {
    corteCerrado,
    discrepancia
  };
}

/**
 * Detecta discrepancias entre saldo esperado y real
 */
export function detectarDiscrepancias(
  corte: CorteCaja,
  saldoRealContado: number
): Discrepancia | null {
  const diferencia = saldoRealContado - corte.saldoEsperado;

  // Tolerancia de 1 peso (ajustar según necesidades)
  if (Math.abs(diferencia) <= 1) {
    return null;
  }

  const porcentaje = corte.saldoEsperado > 0
    ? (Math.abs(diferencia) / corte.saldoEsperado) * 100
    : 0;

  const tipo: 'faltante' | 'sobrante' = diferencia < 0 ? 'faltante' : 'sobrante';

  // Determinar severidad
  let severidad: 'menor' | 'moderada' | 'grave';
  if (Math.abs(diferencia) < 100 || porcentaje < 0.5) {
    severidad = 'menor';
  } else if (Math.abs(diferencia) < 1000 || porcentaje < 2) {
    severidad = 'moderada';
  } else {
    severidad = 'grave';
  }

  // Posibles causas según el tipo
  const posiblesCausas = tipo === 'faltante'
    ? [
        'Error al dar cambio',
        'Venta no registrada correctamente',
        'Retiro no documentado',
        'Robo o pérdida',
        'Error de captura en sistema'
      ]
    : [
        'Cobro duplicado',
        'Pago recibido no registrado',
        'Error de captura en sistema',
        'Transferencia no registrada como salida'
      ];

  return {
    tipo,
    monto: Math.abs(diferencia),
    porcentaje: Number(porcentaje.toFixed(2)),
    severidad,
    posiblesCausas
  };
}

/**
 * Genera resumen diario de todos los bancos
 */
export function generarResumenDiario(
  bancos: string[],
  movimientosDia: MovimientoCaja[],
  saldosIniciales: Record<string, number>,
  fecha?: Date
): ResumenDiario {
  const hoy = fecha || new Date();

  const bancosResumen = bancos.map(banco => {
    const movBanco = movimientosDia.filter(m => m.banco === banco);
    const ingresos = movBanco
      .filter(m => m.tipo === 'ingreso' || m.tipo === 'transferencia_entrada')
      .reduce((sum, m) => sum + m.monto, 0);
    const gastos = movBanco
      .filter(m => m.tipo === 'gasto' || m.tipo === 'transferencia_salida')
      .reduce((sum, m) => sum + m.monto, 0);

    return {
      banco,
      saldoInicial: saldosIniciales[banco] || 0,
      saldoFinal: (saldosIniciales[banco] || 0) + ingresos - gastos,
      ingresos,
      gastos,
      movimientos: movBanco.length
    };
  });

  const totalIngresos = bancosResumen.reduce((sum, b) => sum + b.ingresos, 0);
  const totalGastos = bancosResumen.reduce((sum, b) => sum + b.gastos, 0);

  // Categorizar movimientos específicos
  const ventasDelDia = movimientosDia
    .filter(m => m.tipoMovimiento === 'venta' || m.ventaId)
    .reduce((sum, m) => sum + m.monto, 0);

  const pagosRecibidos = movimientosDia
    .filter(m => m.tipo === 'ingreso' && m.tipoMovimiento !== 'venta')
    .reduce((sum, m) => sum + m.monto, 0);

  const pagosRealizados = movimientosDia
    .filter(m => m.tipo === 'gasto')
    .reduce((sum, m) => sum + m.monto, 0);

  return {
    fecha: hoy,
    bancos: bancosResumen,
    totalIngresos,
    totalGastos,
    balanceNeto: totalIngresos - totalGastos,
    ventasDelDia,
    pagosRecibidos,
    pagosRealizados
  };
}

/**
 * Concilia movimientos entre dos bancos (para transferencias)
 */
export function conciliarTransferencias(
  movimientosBancoOrigen: MovimientoCaja[],
  movimientosBancoDestino: MovimientoCaja[]
): {
  conciliados: Array<{ origen: MovimientoCaja; destino: MovimientoCaja }>;
  sinConciliar: MovimientoCaja[];
  diferencias: Array<{ tipo: string; monto: number; fecha: Date }>;
} {
  const conciliados: Array<{ origen: MovimientoCaja; destino: MovimientoCaja }> = [];
  const sinConciliar: MovimientoCaja[] = [];
  const diferencias: Array<{ tipo: string; monto: number; fecha: Date }> = [];

  const salidas = movimientosBancoOrigen.filter(m => m.tipo === 'transferencia_salida');
  const entradas = movimientosBancoDestino.filter(m => m.tipo === 'transferencia_entrada');

  // Intentar hacer match por monto y fecha cercana
  const entradasUsadas = new Set<string>();

  salidas.forEach(salida => {
    const fechaSalida = salida.fecha instanceof Timestamp
      ? salida.fecha.toDate()
      : new Date(salida.fecha);

    // Buscar entrada coincidente
    const entradaMatch = entradas.find(entrada => {
      if (entradasUsadas.has(entrada.id || '')) return false;

      const fechaEntrada = entrada.fecha instanceof Timestamp
        ? entrada.fecha.toDate()
        : new Date(entrada.fecha);

      // Mismo monto y fecha dentro de 24 horas
      const diferenciaHoras = Math.abs(fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60);

      return entrada.monto === salida.monto && diferenciaHoras <= 24;
    });

    if (entradaMatch) {
      conciliados.push({ origen: salida, destino: entradaMatch });
      entradasUsadas.add(entradaMatch.id || '');
    } else {
      sinConciliar.push(salida);
      diferencias.push({
        tipo: 'Salida sin entrada correspondiente',
        monto: salida.monto,
        fecha: fechaSalida
      });
    }
  });

  // Entradas sin salida correspondiente
  entradas.forEach(entrada => {
    if (!entradasUsadas.has(entrada.id || '')) {
      sinConciliar.push(entrada);
      const fechaEntrada = entrada.fecha instanceof Timestamp
        ? entrada.fecha.toDate()
        : new Date(entrada.fecha);

      diferencias.push({
        tipo: 'Entrada sin salida correspondiente',
        monto: entrada.monto,
        fecha: fechaEntrada
      });
    }
  });

  return { conciliados, sinConciliar, diferencias };
}

/**
 * Obtiene el saldo del día anterior para un banco
 */
export function obtenerSaldoAnterior(
  cortesHistoricos: CorteCaja[],
  banco: string,
  fecha: Date
): number {
  // Buscar el último corte cerrado antes de la fecha
  const cortesOrdenados = cortesHistoricos
    .filter(c =>
      c.banco === banco &&
      c.estado === 'cerrado' &&
      c.fecha < fecha
    )
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  if (cortesOrdenados.length === 0) {
    return 0; // Sin historial, empezar en 0
  }

  return cortesOrdenados[0].saldoFinal;
}

/**
 * Genera historial de cortes con métricas
 */
export function generarHistorialCortes(
  cortes: CorteCaja[],
  banco?: string
): {
  cortes: CorteCaja[];
  metricas: {
    totalCortes: number;
    cortesConDiscrepancia: number;
    porcentajeExactitud: number;
    diferenciaPromedio: number;
    mayorDiscrepancia: number;
  };
  tendencia: 'mejorando' | 'estable' | 'deteriorando';
} {
  const cortesFiltrados = banco
    ? cortes.filter(c => c.banco === banco)
    : cortes;

  const cortesOrdenados = [...cortesFiltrados].sort(
    (a, b) => b.fecha.getTime() - a.fecha.getTime()
  );

  const cortesConDiscrepancia = cortesFiltrados.filter(
    c => c.estado === 'discrepancia'
  ).length;

  const diferencias = cortesFiltrados.map(c => Math.abs(c.diferencia));
  const diferenciaPromedio = diferencias.length > 0
    ? diferencias.reduce((a, b) => a + b, 0) / diferencias.length
    : 0;

  const mayorDiscrepancia = Math.max(...diferencias, 0);

  const porcentajeExactitud = cortesFiltrados.length > 0
    ? ((cortesFiltrados.length - cortesConDiscrepancia) / cortesFiltrados.length) * 100
    : 100;

  // Calcular tendencia (últimos 10 vs anteriores 10)
  let tendencia: 'mejorando' | 'estable' | 'deteriorando' = 'estable';

  if (cortesOrdenados.length >= 10) {
    const ultimos10 = cortesOrdenados.slice(0, 10);
    const anteriores10 = cortesOrdenados.slice(10, 20);

    if (anteriores10.length >= 5) {
      const discrepanciasRecientes = ultimos10.filter(c => c.estado === 'discrepancia').length;
      const discrepanciasAnteriores = anteriores10.filter(c => c.estado === 'discrepancia').length;

      if (discrepanciasRecientes < discrepanciasAnteriores * 0.7) {
        tendencia = 'mejorando';
      } else if (discrepanciasRecientes > discrepanciasAnteriores * 1.3) {
        tendencia = 'deteriorando';
      }
    }
  }

  return {
    cortes: cortesOrdenados,
    metricas: {
      totalCortes: cortesFiltrados.length,
      cortesConDiscrepancia,
      porcentajeExactitud: Number(porcentajeExactitud.toFixed(2)),
      diferenciaPromedio: Number(diferenciaPromedio.toFixed(2)),
      mayorDiscrepancia
    },
    tendencia
  };
}

/**
 * Genera reporte de cierre mensual
 */
export function generarCierreMensual(
  cortesMes: CorteCaja[],
  banco: string,
  mes: number,
  año: number
): {
  periodo: { mes: number; año: number };
  banco: string;
  saldoInicial: number;
  saldoFinal: number;
  totalIngresos: number;
  totalGastos: number;
  totalDiscrepancias: number;
  diasConDiscrepancia: number;
  resumenDiario: Array<{
    fecha: Date;
    saldoInicial: number;
    saldoFinal: number;
    diferencia: number;
    estado: string;
  }>;
} {
  const cortesOrdenados = cortesMes
    .filter(c => c.banco === banco)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const saldoInicial = cortesOrdenados.length > 0 ? cortesOrdenados[0].saldoInicial : 0;
  const saldoFinal = cortesOrdenados.length > 0
    ? cortesOrdenados[cortesOrdenados.length - 1].saldoFinal
    : 0;

  const totalIngresos = cortesOrdenados.reduce((sum, c) =>
    sum + c.totalIngresos + c.totalTransferenciasEntrada, 0
  );

  const totalGastos = cortesOrdenados.reduce((sum, c) =>
    sum + c.totalGastos + c.totalTransferenciasSalida, 0
  );

  const totalDiscrepancias = cortesOrdenados.reduce((sum, c) =>
    sum + Math.abs(c.diferencia), 0
  );

  const diasConDiscrepancia = cortesOrdenados.filter(c =>
    c.estado === 'discrepancia'
  ).length;

  const resumenDiario = cortesOrdenados.map(c => ({
    fecha: c.fecha,
    saldoInicial: c.saldoInicial,
    saldoFinal: c.saldoFinal,
    diferencia: c.diferencia,
    estado: c.estado
  }));

  return {
    periodo: { mes, año },
    banco,
    saldoInicial,
    saldoFinal,
    totalIngresos,
    totalGastos,
    totalDiscrepancias,
    diasConDiscrepancia,
    resumenDiario
  };
}

export default {
  calcularCorte,
  generarCorteDiario,
  cerrarCorte,
  detectarDiscrepancias,
  generarResumenDiario,
  conciliarTransferencias,
  obtenerSaldoAnterior,
  generarHistorialCortes,
  generarCierreMensual
};
