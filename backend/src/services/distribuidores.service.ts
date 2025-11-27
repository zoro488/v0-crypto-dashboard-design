/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                      DISTRIBUIDORES SERVICE                                ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';

const db = getFirestore();
const COLLECTION = 'distribuidores';

export interface Distribuidor {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  zonaAsignada?: string;
  comision: number; // Porcentaje de comisión
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateDistribuidorDto extends Omit<Distribuidor, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {}
export interface UpdateDistribuidorDto extends Partial<CreateDistribuidorDto> {}

export class DistribuidoresService {
  static async getAll(filters?: {
    zonaAsignada?: string;
    activo?: boolean;
    limit?: number;
  }): Promise<Distribuidor[]> {
    try {
      let query = db.collection(COLLECTION).orderBy('nombre', 'asc');

      if (filters?.zonaAsignada) {
        query = query.where('zonaAsignada', '==', filters.zonaAsignada) as any;
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
      })) as Distribuidor[];
    } catch (error) {
      logger.error('Error getting distribuidores:', error);
      throw new Error('Failed to fetch distribuidores');
    }
  }

  static async getById(id: string): Promise<Distribuidor | null> {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as Distribuidor;
    } catch (error) {
      logger.error(`Error getting distribuidor ${id}:`, error);
      throw error;
    }
  }

  static async create(data: CreateDistribuidorDto, userId: string): Promise<Distribuidor> {
    try {
      const now = new Date();
      const distribuidorData = {
        ...data,
        activo: data.activo ?? true,
        comision: data.comision || 0,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };

      const docRef = await db.collection(COLLECTION).add(distribuidorData);
      const doc = await docRef.get();

      logger.info(`Distribuidor created: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as Distribuidor;
    } catch (error) {
      logger.error('Error creating distribuidor:', error);
      throw error;
    }
  }

  static async update(id: string, data: UpdateDistribuidorDto, userId: string): Promise<Distribuidor> {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Distribuidor not found');
      }

      await docRef.update({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      });

      const updatedDoc = await docRef.get();
      logger.info(`Distribuidor updated: ${id}`);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Distribuidor;
    } catch (error) {
      logger.error(`Error updating distribuidor ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      logger.info(`Distribuidor deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting distribuidor ${id}:`, error);
      throw error;
    }
  }

  static async getVentas(distribuidorId: string): Promise<any[]> {
    try {
      const snapshot = await db.collection('ventas')
        .where('distribuidorId', '==', distribuidorId)
        .orderBy('fecha', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error getting ventas for distribuidor ${distribuidorId}:`, error);
      throw error;
    }
  }

  static async getComisiones(distribuidorId: string, fechaDesde?: Date, fechaHasta?: Date) {
    try {
      let query = db.collection('ventas')
        .where('distribuidorId', '==', distribuidorId)
        .where('estado', '==', 'pagado');

      if (fechaDesde) {
        query = query.where('fecha', '>=', fechaDesde) as any;
      }
      if (fechaHasta) {
        query = query.where('fecha', '<=', fechaHasta) as any;
      }

      const snapshot = await query.get();
      const ventas = snapshot.docs.map((doc: any) => doc.data());

      const distribuidor = await this.getById(distribuidorId);
      const comisionPorcentaje = distribuidor?.comision || 0;

      const totalVentas = ventas.reduce((sum: number, v: any) => sum + v.total, 0);
      const totalComisiones = totalVentas * (comisionPorcentaje / 100);

      return {
        distribuidorId,
        distribuidorNombre: distribuidor?.nombre,
        comisionPorcentaje,
        cantidadVentas: ventas.length,
        totalVentas,
        totalComisiones,
        fechaDesde,
        fechaHasta,
      };
    } catch (error) {
      logger.error(`Error calculating comisiones for distribuidor ${distribuidorId}:`, error);
      throw error;
    }
  }
}
