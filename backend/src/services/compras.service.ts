/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                       COMPRAS (ÓRDENES) SERVICE                            ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';

const db = getFirestore();
const COLLECTION = 'ordenes_compra';

export interface OrdenCompra {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  productos: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: 'pendiente' | 'aprobada' | 'recibida' | 'cancelada';
  fechaOrden: Date;
  fechaEntregaEstimada?: Date;
  fechaEntregaReal?: Date;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class ComprasService {
  static async getAll(filters?: any): Promise<OrdenCompra[]> {
    try {
      let query = db.collection(COLLECTION).orderBy('fechaOrden', 'desc');

      if (filters?.proveedorId) {
        query = query.where('proveedorId', '==', filters.proveedorId) as any;
      }
      if (filters?.estado) {
        query = query.where('estado', '==', filters.estado) as any;
      }
      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as OrdenCompra[];
    } catch (error) {
      logger.error('Error getting ordenes:', error);
      throw new Error('Failed to fetch ordenes de compra');
    }
  }

  static async getById(id: string): Promise<OrdenCompra | null> {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as OrdenCompra;
    } catch (error) {
      logger.error(`Error getting orden ${id}:`, error);
      throw new Error('Failed to fetch orden');
    }
  }

  static async create(data: Omit<OrdenCompra, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<OrdenCompra> {
    try {
      const now = new Date();
      const ordenData = {
        ...data,
        estado: data.estado || 'pendiente',
        fechaOrden: data.fechaOrden || now,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };

      const docRef = await db.collection(COLLECTION).add(ordenData);
      const doc = await docRef.get();

      logger.info(`Orden de compra created: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as OrdenCompra;
    } catch (error) {
      logger.error('Error creating orden:', error);
      throw new Error('Failed to create orden de compra');
    }
  }

  static async update(id: string, data: Partial<OrdenCompra>, userId: string): Promise<OrdenCompra> {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Orden not found');
      }

      await docRef.update({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      });

      const updatedDoc = await docRef.get();
      logger.info(`Orden updated: ${id}`);
      return { id: updatedDoc.id, ...updatedDoc.data() } as OrdenCompra;
    } catch (error) {
      logger.error(`Error updating orden ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      logger.info(`Orden deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting orden ${id}:`, error);
      throw error;
    }
  }

  static async marcarComoRecibida(id: string, userId: string): Promise<OrdenCompra> {
    try {
      const orden = await this.getById(id);
      if (!orden) throw new Error('Orden not found');

      // Actualizar inventario
      if (orden.productos && orden.productos.length > 0) {
        await this.updateInventory(orden.productos, 'entrada');
      }

      return await this.update(id, {
        estado: 'recibida',
        fechaEntregaReal: new Date(),
      }, userId);
    } catch (error) {
      logger.error(`Error marcando orden como recibida ${id}:`, error);
      throw error;
    }
  }

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
          const newStock = tipo === 'entrada'
            ? currentStock + item.cantidad
            : currentStock - item.cantidad;

          batch.update(productoRef, { stock: newStock });
        }

        const movimientoRef = db.collection('inventario_movimientos').doc();
        batch.set(movimientoRef, {
          productoId: item.productoId,
          cantidad: item.cantidad,
          tipo,
          motivo: 'orden_compra',
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
