/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                       CASA DE CAMBIO SERVICE                               ║
 * ║                  Conversión USD/MXN con API en tiempo real                 ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';

const db = getFirestore();

export interface TipoCambio {
  id: string;
  fecha: Date;
  usdToMxn: number; // Tipo de cambio USD -> MXN
  mxnToUsd: number; // Tipo de cambio MXN -> USD
  fuente: 'manual' | 'api' | 'banco';
  comisionCompra: number; // % de comisión al comprar USD
  comisionVenta: number; // % de comisión al vender USD
  createdAt: Date;
  createdBy: string;
}

export interface OperacionCambio {
  id: string;
  fecha: Date;
  tipo: 'compra_usd' | 'venta_usd'; // Desde perspectiva del negocio
  montoOriginal: number; // Monto en moneda original
  monedaOriginal: 'USD' | 'MXN';
  montoConvertido: number; // Monto convertido
  monedaConvertida: 'USD' | 'MXN';
  tipoCambio: number;
  comision: number;
  comisionPorcentaje: number;
  ganancia: number; // Ganancia de la operación
  clienteId?: string;
  clienteNombre?: string;
  notas?: string;
  createdAt: Date;
  createdBy: string;
}

export class CasaCambioService {
  // ========== TIPOS DE CAMBIO ==========

  /**
   * Obtener el tipo de cambio más reciente
   */
  static async getTipoCambioActual(): Promise<TipoCambio | null> {
    try {
      const snapshot = await db.collection('tipos_cambio')
        .orderBy('fecha', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as TipoCambio;
    } catch (error) {
      logger.error('Error getting tipo cambio actual:', error);
      throw error;
    }
  }

  /**
   * Obtener histórico de tipos de cambio
   */
  static async getHistoricoTipoCambio(
    fechaDesde?: Date,
    fechaHasta?: Date,
    limit: number = 100
  ): Promise<TipoCambio[]> {
    try {
      let query = db.collection('tipos_cambio').orderBy('fecha', 'desc');

      if (fechaDesde) {
        query = query.where('fecha', '>=', fechaDesde) as any;
      }
      if (fechaHasta) {
        query = query.where('fecha', '<=', fechaHasta) as any;
      }
      query = query.limit(limit) as any;

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as TipoCambio[];
    } catch (error) {
      logger.error('Error getting histórico tipo cambio:', error);
      throw error;
    }
  }

  /**
   * Crear/actualizar tipo de cambio
   */
  static async actualizarTipoCambio(
    usdToMxn: number,
    comisionCompra: number = 0.02, // 2% default
    comisionVenta: number = 0.02,
    fuente: 'manual' | 'api' | 'banco' = 'manual',
    userId: string
  ): Promise<TipoCambio> {
    try {
      const tipoCambioData = {
        fecha: new Date(),
        usdToMxn,
        mxnToUsd: 1 / usdToMxn,
        fuente,
        comisionCompra,
        comisionVenta,
        createdAt: new Date(),
        createdBy: userId,
      };

      const docRef = await db.collection('tipos_cambio').add(tipoCambioData);
      const doc = await docRef.get();

      logger.info(`Tipo de cambio actualizado: ${usdToMxn} MXN/USD`);
      return { id: doc.id, ...doc.data() } as TipoCambio;
    } catch (error) {
      logger.error('Error actualizando tipo de cambio:', error);
      throw error;
    }
  }

  /**
   * Obtener tipo de cambio desde API externa (exchangerate-api.com - Free)
   */
  static async fetchTipoCambioExterno(): Promise<number> {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();

      if (data && data.rates && data.rates.MXN) {
        return data.rates.MXN;
      }

      throw new Error('No se pudo obtener el tipo de cambio');
    } catch (error) {
      logger.error('Error fetching tipo cambio externo:', error);
      // Fallback: retornar último valor conocido
      const ultimoTipoCambio = await this.getTipoCambioActual();
      return ultimoTipoCambio?.usdToMxn || 20.0; // Valor por defecto
    }
  }

  /**
   * Actualizar tipo de cambio desde API externa
   */
  static async actualizarTipoCambioDesdeAPI(userId: string): Promise<TipoCambio> {
    try {
      const usdToMxn = await this.fetchTipoCambioExterno();
      return await this.actualizarTipoCambio(usdToMxn, 0.02, 0.02, 'api', userId);
    } catch (error) {
      logger.error('Error actualizando tipo cambio desde API:', error);
      throw error;
    }
  }

  // ========== OPERACIONES DE CAMBIO ==========

  /**
   * Calcular conversión USD -> MXN
   */
  static async calcularConversionUSDtoMXN(
    montoUSD: number,
    tipoCambioActual?: TipoCambio
  ): Promise<{
    montoMXN: number;
    tipoCambio: number;
    comision: number;
    comisionPorcentaje: number;
    ganancia: number;
    total: number;
  }> {
    if (!tipoCambioActual) {
      tipoCambioActual = await this.getTipoCambioActual() || {
        usdToMxn: 20.0,
        comisionVenta: 0.02,
      } as TipoCambio;
    }

    const tipoCambio = tipoCambioActual.usdToMxn;
    const comisionPorcentaje = tipoCambioActual.comisionVenta;

    const montoMXN = montoUSD * tipoCambio;
    const comision = montoMXN * comisionPorcentaje;
    const ganancia = comision; // En venta de USD, la comisión es la ganancia
    const total = montoMXN - comision;

    return {
      montoMXN: total,
      tipoCambio,
      comision,
      comisionPorcentaje,
      ganancia,
      total,
    };
  }

  /**
   * Calcular conversión MXN -> USD
   */
  static async calcularConversionMXNtoUSD(
    montoMXN: number,
    tipoCambioActual?: TipoCambio
  ): Promise<{
    montoUSD: number;
    tipoCambio: number;
    comision: number;
    comisionPorcentaje: number;
    ganancia: number;
    total: number;
  }> {
    if (!tipoCambioActual) {
      tipoCambioActual = await this.getTipoCambioActual() || {
        mxnToUsd: 0.05,
        comisionCompra: 0.02,
      } as TipoCambio;
    }

    const tipoCambio = tipoCambioActual.mxnToUsd;
    const comisionPorcentaje = tipoCambioActual.comisionCompra;

    const montoUSD = montoMXN * tipoCambio;
    const comision = montoUSD * comisionPorcentaje;
    const ganancia = comision; // En compra de USD, la comisión es la ganancia
    const total = montoUSD - comision;

    return {
      montoUSD: total,
      tipoCambio,
      comision,
      comisionPorcentaje,
      ganancia,
      total,
    };
  }

  /**
   * Registrar operación de cambio
   */
  static async registrarOperacion(
    tipo: 'compra_usd' | 'venta_usd',
    montoOriginal: number,
    monedaOriginal: 'USD' | 'MXN',
    clienteId?: string,
    clienteNombre?: string,
    notas?: string,
    userId: string = 'system'
  ): Promise<OperacionCambio> {
    try {
      const tipoCambioActual = await this.getTipoCambioActual();
      if (!tipoCambioActual) {
        throw new Error('No hay tipo de cambio configurado');
      }

      let conversion: any;
      let montoConvertido: number;
      let monedaConvertida: 'USD' | 'MXN';

      if (tipo === 'venta_usd') {
        // Cliente vende USD, recibe MXN
        conversion = await this.calcularConversionUSDtoMXN(montoOriginal, tipoCambioActual);
        montoConvertido = conversion.total;
        monedaConvertida = 'MXN';
      } else {
        // Cliente compra USD con MXN
        conversion = await this.calcularConversionMXNtoUSD(montoOriginal, tipoCambioActual);
        montoConvertido = conversion.total;
        monedaConvertida = 'USD';
      }

      const operacionData: Omit<OperacionCambio, 'id'> = {
        fecha: new Date(),
        tipo,
        montoOriginal,
        monedaOriginal,
        montoConvertido,
        monedaConvertida,
        tipoCambio: conversion.tipoCambio,
        comision: conversion.comision,
        comisionPorcentaje: conversion.comisionPorcentaje,
        ganancia: conversion.ganancia,
        clienteId,
        clienteNombre,
        notas,
        createdAt: new Date(),
        createdBy: userId,
      };

      const docRef = await db.collection('operaciones_cambio').add(operacionData);
      const doc = await docRef.get();

      logger.info(`Operación de cambio registrada: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as OperacionCambio;
    } catch (error) {
      logger.error('Error registrando operación de cambio:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de operaciones
   */
  static async getHistorialOperaciones(
    filters?: {
      tipo?: 'compra_usd' | 'venta_usd';
      clienteId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
      limit?: number;
    }
  ): Promise<OperacionCambio[]> {
    try {
      let query = db.collection('operaciones_cambio').orderBy('fecha', 'desc');

      if (filters?.tipo) {
        query = query.where('tipo', '==', filters.tipo) as any;
      }
      if (filters?.clienteId) {
        query = query.where('clienteId', '==', filters.clienteId) as any;
      }
      if (filters?.fechaDesde) {
        query = query.where('fecha', '>=', filters.fechaDesde) as any;
      }
      if (filters?.fechaHasta) {
        query = query.where('fecha', '<=', filters.fechaHasta) as any;
      }
      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as OperacionCambio[];
    } catch (error) {
      logger.error('Error getting historial operaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de casa de cambio
   */
  static async getEstadisticas(fechaDesde?: Date, fechaHasta?: Date) {
    try {
      const operaciones = await this.getHistorialOperaciones({
        fechaDesde,
        fechaHasta,
        limit: 10000,
      });

      const compras = operaciones.filter(op => op.tipo === 'compra_usd');
      const ventas = operaciones.filter(op => op.tipo === 'venta_usd');

      const totalOperaciones = operaciones.length;
      const totalComisiones = operaciones.reduce((sum, op) => sum + op.comision, 0);
      const totalGanancias = operaciones.reduce((sum, op) => sum + op.ganancia, 0);

      const montoTotalCompras = compras.reduce((sum, op) => sum + op.montoOriginal, 0);
      const montoTotalVentas = ventas.reduce((sum, op) => sum + op.montoOriginal, 0);

      return {
        totalOperaciones,
        cantidadCompras: compras.length,
        cantidadVentas: ventas.length,
        montoTotalCompras,
        montoTotalVentas,
        totalComisiones,
        totalGanancias,
        promedioComision: totalOperaciones > 0 ? totalComisiones / totalOperaciones : 0,
        promedioGanancia: totalOperaciones > 0 ? totalGanancias / totalOperaciones : 0,
      };
    } catch (error) {
      logger.error('Error getting estadísticas casa de cambio:', error);
      throw error;
    }
  }
}
