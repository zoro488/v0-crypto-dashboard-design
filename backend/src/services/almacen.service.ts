/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         ALMACÉN SERVICE                                    ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';

const db = getFirestore();

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  categoria?: string;
  precio: number;
  costo?: number;
  stock: number;
  stockMinimo?: number;
  unidad?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'transferencia';
  motivo: string;
  almacenOrigen?: string;
  almacenDestino?: string;
  referencia?: string;
  fecha: Date;
  createdBy: string;
}

export class AlmacenService {
  // ========== PRODUCTOS ==========

  static async getAllProductos(filters?: any): Promise<Producto[]> {
    try {
      let query = db.collection('productos').orderBy('nombre', 'asc');

      if (filters?.categoria) {
        query = query.where('categoria', '==', filters.categoria) as any;
      }
      if (filters?.activo !== undefined) {
        query = query.where('activo', '==', filters.activo) as any;
      }
      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Producto[];
    } catch (error) {
      logger.error('Error getting productos:', error);
      throw new Error('Failed to fetch productos');
    }
  }

  static async getProductoById(id: string): Promise<Producto | null> {
    try {
      const doc = await db.collection('productos').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as Producto;
    } catch (error) {
      logger.error(`Error getting producto ${id}:`, error);
      throw error;
    }
  }

  static async createProducto(data: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Producto> {
    try {
      const now = new Date();
      const productoData = {
        ...data,
        activo: data.activo ?? true,
        stock: data.stock ?? 0,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };

      const docRef = await db.collection('productos').add(productoData);
      const doc = await docRef.get();

      logger.info(`Producto created: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as Producto;
    } catch (error) {
      logger.error('Error creating producto:', error);
      throw error;
    }
  }

  static async updateProducto(id: string, data: Partial<Producto>, userId: string): Promise<Producto> {
    try {
      const docRef = db.collection('productos').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Producto not found');
      }

      await docRef.update({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      });

      const updatedDoc = await docRef.get();
      logger.info(`Producto updated: ${id}`);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Producto;
    } catch (error) {
      logger.error(`Error updating producto ${id}:`, error);
      throw error;
    }
  }

  static async deleteProducto(id: string): Promise<void> {
    try {
      await db.collection('productos').doc(id).delete();
      logger.info(`Producto deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting producto ${id}:`, error);
      throw error;
    }
  }

  // ========== MOVIMIENTOS DE INVENTARIO ==========

  static async getAllMovimientos(filters?: any): Promise<MovimientoInventario[]> {
    try {
      let query = db.collection('inventario_movimientos').orderBy('fecha', 'desc');

      if (filters?.productoId) {
        query = query.where('productoId', '==', filters.productoId) as any;
      }
      if (filters?.tipo) {
        query = query.where('tipo', '==', filters.tipo) as any;
      }
      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as MovimientoInventario[];
    } catch (error) {
      logger.error('Error getting movimientos:', error);
      throw error;
    }
  }

  static async registrarMovimiento(data: Omit<MovimientoInventario, 'id'>, userId: string): Promise<MovimientoInventario> {
    try {
      const movimientoData = {
        ...data,
        fecha: data.fecha || new Date(),
        createdBy: userId,
      };

      // Actualizar stock del producto
      const productoRef = db.collection('productos').doc(data.productoId);
      const productoDoc = await productoRef.get();

      if (productoDoc.exists) {
        const currentStock = productoDoc.data()?.stock || 0;
        let newStock = currentStock;

        switch (data.tipo) {
          case 'entrada':
            newStock = currentStock + data.cantidad;
            break;
          case 'salida':
            newStock = currentStock - data.cantidad;
            break;
          case 'ajuste':
            newStock = data.cantidad; // Ajuste absoluto
            break;
        }

        await productoRef.update({ stock: newStock, updatedAt: new Date() });
      }

      // Crear movimiento
      const docRef = await db.collection('inventario_movimientos').add(movimientoData);
      const doc = await docRef.get();

      logger.info(`Movimiento registrado: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as MovimientoInventario;
    } catch (error) {
      logger.error('Error registrando movimiento:', error);
      throw error;
    }
  }

  static async getProductosBajoStock(): Promise<Producto[]> {
    try {
      const productos = await this.getAllProductos({ activo: true });
      return productos.filter(p =>
        p.stockMinimo && p.stock <= p.stockMinimo
      );
    } catch (error) {
      logger.error('Error getting productos bajo stock:', error);
      throw error;
    }
  }

  static async getEstadisticasInventario() {
    try {
      const productos = await this.getAllProductos({ activo: true });

      const totalProductos = productos.length;
      const valorTotal = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);
      const costoTotal = productos.reduce((sum, p) => sum + ((p.costo || 0) * p.stock), 0);
      const productosBajoStock = productos.filter(p => p.stockMinimo && p.stock <= p.stockMinimo).length;
      const productosAgotados = productos.filter(p => p.stock === 0).length;

      return {
        totalProductos,
        valorTotal,
        costoTotal,
        margenTotal: valorTotal - costoTotal,
        productosBajoStock,
        productosAgotados,
      };
    } catch (error) {
      logger.error('Error getting estadísticas inventario:', error);
      throw error;
    }
  }
}
