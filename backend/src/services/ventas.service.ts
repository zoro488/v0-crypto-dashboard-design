/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         VENTAS SERVICE                                     ║
 * ║            Lógica de negocio para gestión de ventas                       ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';
import type {
  Venta,
  CreateVentaDto,
  UpdateVentaDto,
  VentaFilters
} from '../models/venta.model.js';

const db = getFirestore();
const COLLECTION = 'ventas';

export class VentasService {
  /**
   * Obtener todas las ventas con filtros opcionales
   */
  static async getAll(filters?: VentaFilters): Promise<Venta[]> {
    try {
      let query = db.collection(COLLECTION).orderBy('fecha', 'desc');

      // Aplicar filtros
      if (filters?.clienteId) {
        query = query.where('clienteId', '==', filters.clienteId) as any;
      }
      if (filters?.distribuidorId) {
        query = query.where('distribuidorId', '==', filters.distribuidorId) as any;
      }
      if (filters?.estado) {
        query = query.where('estado', '==', filters.estado) as any;
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

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Venta));
    } catch (error) {
      logger.error('Error getting ventas:', error);
      throw new Error('Failed to fetch ventas');
    }
  }

  /**
   * Obtener una venta por ID
   */
  static async getById(id: string): Promise<Venta | null> {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as Venta;
    } catch (error) {
      logger.error(`Error getting venta ${id}:`, error);
      throw new Error('Failed to fetch venta');
    }
  }

  /**
   * Crear una nueva venta
   */
  static async create(data: CreateVentaDto, userId: string): Promise<Venta> {
    try {
      const now = new Date();
      const ventaData = {
        ...data,
        estado: data.estado || 'pendiente',
        saldoPendiente: data.saldoPendiente || data.total,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };

      const docRef = await db.collection(COLLECTION).add(ventaData);
      const doc = await docRef.get();

      // Actualizar inventario si hay productos
      if (data.productos && data.productos.length > 0) {
        await this.updateInventory(data.productos, 'salida');
      }

      logger.info(`Venta created: ${docRef.id}`);

      return {
        id: doc.id,
        ...doc.data()
      } as Venta;
    } catch (error) {
      logger.error('Error creating venta:', error);
      throw new Error('Failed to create venta');
    }
  }

  /**
   * Actualizar una venta existente
   */
  static async update(id: string, data: UpdateVentaDto, userId: string): Promise<Venta> {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Venta not found');
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      await docRef.update(updateData);
      const updatedDoc = await docRef.get();

      logger.info(`Venta updated: ${id}`);

      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Venta;
    } catch (error) {
      logger.error(`Error updating venta ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una venta
   */
  static async delete(id: string): Promise<void> {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Venta not found');
      }

      // Restaurar inventario si hay productos
      const ventaData = doc.data() as Venta;
      if (ventaData.productos && ventaData.productos.length > 0) {
        await this.updateInventory(ventaData.productos, 'entrada');
      }

      await docRef.delete();
      logger.info(`Venta deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting venta ${id}:`, error);
      throw error;
    }
  }

  /**
   * Registrar un abono a una venta
   */
  static async registrarAbono(
    ventaId: string,
    monto: number,
    formaPago: string,
    userId: string
  ): Promise<Venta> {
    try {
      const venta = await this.getById(ventaId);
      if (!venta) {
        throw new Error('Venta not found');
      }

      const nuevoSaldo = (venta.saldoPendiente || venta.total) - monto;
      const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'parcial';

      // Crear registro de abono
      await db.collection('abonos').add({
        ventaId,
        clienteId: venta.clienteId,
        monto,
        formaPago,
        fecha: new Date(),
        tipo: 'venta',
        createdBy: userId,
      });

      // Actualizar venta
      return await this.update(ventaId, {
        saldoPendiente: nuevoSaldo,
        estado: nuevoEstado,
      }, userId);
    } catch (error) {
      logger.error(`Error registrando abono para venta ${ventaId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener ventas por cliente
   */
  static async getByCliente(clienteId: string): Promise<Venta[]> {
    return this.getAll({ clienteId });
  }

  /**
   * Obtener ventas por distribuidor
   */
  static async getByDistribuidor(distribuidorId: string): Promise<Venta[]> {
    return this.getAll({ distribuidorId });
  }

  /**
   * Obtener estadísticas de ventas
   */
  static async getEstadisticas(fechaDesde?: Date, fechaHasta?: Date) {
    try {
      const ventas = await this.getAll({
        fechaDesde,
        fechaHasta,
        limit: 1000
      });

      const total = ventas.reduce((sum, v) => sum + v.total, 0);
      const totalPagado = ventas
        .filter(v => v.estado === 'pagado')
        .reduce((sum, v) => sum + v.total, 0);
      const totalPendiente = ventas
        .reduce((sum, v) => sum + (v.saldoPendiente || 0), 0);

      return {
        totalVentas: ventas.length,
        montoTotal: total,
        montoPagado: totalPagado,
        montoPendiente: totalPendiente,
        ventasPagadas: ventas.filter(v => v.estado === 'pagado').length,
        ventasPendientes: ventas.filter(v => v.estado === 'pendiente').length,
        ventasParciales: ventas.filter(v => v.estado === 'parcial').length,
      };
    } catch (error) {
      logger.error('Error getting estadísticas:', error);
      throw error;
    }
  }

  /**
   * Actualizar inventario (privado)
   */
  private static async updateInventory(
    productos: Array<{ productoId: string; cantidad: number }>,
    tipo: 'entrada' | 'salida'
  ): Promise<void> {
    try {
      const batch = db.batch();

      for (const item of productos) {
        const productoRef = db.collection('productos').doc(item.productoId);
        const productoDoc = await productoRef.get();

        if (productoDoc.exists) {
          const currentStock = productoDoc.data()?.stock || 0;
          const newStock = tipo === 'salida'
            ? currentStock - item.cantidad
            : currentStock + item.cantidad;

          batch.update(productoRef, { stock: newStock });
        }

        // Registrar movimiento de inventario
        const movimientoRef = db.collection('inventario_movimientos').doc();
        batch.set(movimientoRef, {
          productoId: item.productoId,
          cantidad: item.cantidad,
          tipo,
          motivo: tipo === 'salida' ? 'venta' : 'devolucion',
          fecha: new Date(),
        });
      }

      await batch.commit();
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }
}
