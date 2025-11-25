/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                          BANCO SERVICE                                     ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';

const db = getFirestore();

export interface MovimientoBancario {
  id: string;
  bancoId: string;
  bancoNombre: string;
  tipo: 'ingreso' | 'gasto' | 'transferencia';
  monto: number;
  categoria?: string;
  descripcion?: string;
  referencia?: string;
  fecha: Date;
  // Para transferencias
  bancoDestinoId?: string;
  bancoDestinoNombre?: string;
  // Metadata
  createdAt: Date;
  createdBy: string;
}

export interface CorteCaja {
  id: string;
  fecha: Date;
  bancoId: string;
  bancoNombre: string;
  saldoInicial: number;
  totalIngresos: number;
  totalGastos: number;
  saldoFinal: number;
  diferencia?: number;
  notas?: string;
  createdAt: Date;
  createdBy: string;
}

const BANCOS = [
  'Bancomer',
  'Banorte',
  'Santander',
  'HSBC',
  'Scotiabank',
  'Banamex',
  'Caja'
];

export class BancoService {
  // ========== MOVIMIENTOS BANCARIOS ==========

  static async getAllMovimientos(filters?: any): Promise<MovimientoBancario[]> {
    try {
      let query = db.collection('movimientos_bancarios').orderBy('fecha', 'desc');

      if (filters?.bancoId) {
        query = query.where('bancoId', '==', filters.bancoId) as any;
      }
      if (filters?.tipo) {
        query = query.where('tipo', '==', filters.tipo) as any;
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
      })) as MovimientoBancario[];
    } catch (error) {
      logger.error('Error getting movimientos bancarios:', error);
      throw error;
    }
  }

  static async getMovimientoById(id: string): Promise<MovimientoBancario | null> {
    try {
      const doc = await db.collection('movimientos_bancarios').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as MovimientoBancario;
    } catch (error) {
      logger.error(`Error getting movimiento ${id}:`, error);
      throw error;
    }
  }

  static async createMovimiento(
    data: Omit<MovimientoBancario, 'id' | 'createdAt'>,
    userId: string
  ): Promise<MovimientoBancario> {
    try {
      const movimientoData = {
        ...data,
        fecha: data.fecha || new Date(),
        createdAt: new Date(),
        createdBy: userId,
      };

      const docRef = await db.collection('movimientos_bancarios').add(movimientoData);
      const doc = await docRef.get();

      logger.info(`Movimiento bancario created: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as MovimientoBancario;
    } catch (error) {
      logger.error('Error creating movimiento:', error);
      throw error;
    }
  }

  static async registrarIngreso(
    bancoId: string,
    bancoNombre: string,
    monto: number,
    categoria: string,
    descripcion: string,
    userId: string
  ): Promise<MovimientoBancario> {
    return this.createMovimiento({
      bancoId,
      bancoNombre,
      tipo: 'ingreso',
      monto,
      categoria,
      descripcion,
      fecha: new Date(),
      createdBy: userId,
    }, userId);
  }

  static async registrarGasto(
    bancoId: string,
    bancoNombre: string,
    monto: number,
    categoria: string,
    descripcion: string,
    userId: string
  ): Promise<MovimientoBancario> {
    return this.createMovimiento({
      bancoId,
      bancoNombre,
      tipo: 'gasto',
      monto,
      categoria,
      descripcion,
      fecha: new Date(),
      createdBy: userId,
    }, userId);
  }

  static async registrarTransferencia(
    bancoOrigenId: string,
    bancoOrigenNombre: string,
    bancoDestinoId: string,
    bancoDestinoNombre: string,
    monto: number,
    descripcion: string,
    userId: string
  ): Promise<MovimientoBancario> {
    try {
      // Crear movimiento de salida en banco origen
      await this.createMovimiento({
        bancoId: bancoOrigenId,
        bancoNombre: bancoOrigenNombre,
        tipo: 'transferencia',
        monto: -monto, // Negativo para salida
        descripcion: `Transferencia a ${bancoDestinoNombre}: ${descripcion}`,
        bancoDestinoId,
        bancoDestinoNombre,
        fecha: new Date(),
        createdBy: userId,
      }, userId);

      // Crear movimiento de entrada en banco destino
      const movimientoDestino = await this.createMovimiento({
        bancoId: bancoDestinoId,
        bancoNombre: bancoDestinoNombre,
        tipo: 'transferencia',
        monto: monto, // Positivo para entrada
        descripcion: `Transferencia desde ${bancoOrigenNombre}: ${descripcion}`,
        bancoDestinoId: bancoOrigenId, // En este caso, el destino es el origen
        bancoDestinoNombre: bancoOrigenNombre,
        fecha: new Date(),
        createdBy: userId,
      }, userId);

      return movimientoDestino;
    } catch (error) {
      logger.error('Error registrando transferencia:', error);
      throw error;
    }
  }

  // ========== CORTES DE CAJA ==========

  static async getAllCortes(filters?: any): Promise<CorteCaja[]> {
    try {
      let query = db.collection('cortes_caja').orderBy('fecha', 'desc');

      if (filters?.bancoId) {
        query = query.where('bancoId', '==', filters.bancoId) as any;
      }
      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as CorteCaja[];
    } catch (error) {
      logger.error('Error getting cortes:', error);
      throw error;
    }
  }

  static async createCorte(
    data: Omit<CorteCaja, 'id' | 'createdAt'>,
    userId: string
  ): Promise<CorteCaja> {
    try {
      const corteData = {
        ...data,
        fecha: data.fecha || new Date(),
        createdAt: new Date(),
        createdBy: userId,
      };

      const docRef = await db.collection('cortes_caja').add(corteData);
      const doc = await docRef.get();

      logger.info(`Corte de caja created: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as CorteCaja;
    } catch (error) {
      logger.error('Error creating corte:', error);
      throw error;
    }
  }

  static async calcularSaldoBanco(bancoId: string, fechaHasta?: Date): Promise<number> {
    try {
      const movimientos = await this.getAllMovimientos({
        bancoId,
        fechaHasta,
        limit: 10000
      });

      const saldo = movimientos.reduce((total, mov) => {
        if (mov.tipo === 'ingreso') {
          return total + mov.monto;
        } else if (mov.tipo === 'gasto') {
          return total - mov.monto;
        } else if (mov.tipo === 'transferencia') {
          // Si es transferencia, el monto ya viene con el signo correcto
          return total + mov.monto;
        }
        return total;
      }, 0);

      return saldo;
    } catch (error) {
      logger.error(`Error calculando saldo banco ${bancoId}:`, error);
      throw error;
    }
  }

  static async getEstadisticasBanco(bancoId?: string, fechaDesde?: Date, fechaHasta?: Date) {
    try {
      const movimientos = await this.getAllMovimientos({
        bancoId,
        fechaDesde,
        fechaHasta,
        limit: 10000
      });

      const ingresos = movimientos.filter(m => m.tipo === 'ingreso');
      const gastos = movimientos.filter(m => m.tipo === 'gasto');
      const transferencias = movimientos.filter(m => m.tipo === 'transferencia');

      const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0);
      const totalGastos = gastos.reduce((sum, m) => sum + m.monto, 0);
      const saldoActual = totalIngresos - totalGastos;

      return {
        totalMovimientos: movimientos.length,
        totalIngresos,
        totalGastos,
        saldoActual,
        cantidadIngresos: ingresos.length,
        cantidadGastos: gastos.length,
        cantidadTransferencias: transferencias.length,
      };
    } catch (error) {
      logger.error('Error getting estadísticas banco:', error);
      throw error;
    }
  }

  static async getSaldosTodosBancos(): Promise<Record<string, number>> {
    try {
      const saldos: Record<string, number> = {};

      for (const banco of BANCOS) {
        const saldo = await this.calcularSaldoBanco(banco);
        saldos[banco] = saldo;
      }

      return saldos;
    } catch (error) {
      logger.error('Error getting saldos todos los bancos:', error);
      throw error;
    }
  }
}
