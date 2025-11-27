/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         CLIENTES SERVICE                                   ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { getFirestore } from '../config/firebase.js';
import { logger } from '../config/logger.js';

const db = getFirestore();
const COLLECTION = 'clientes';

export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  rfc?: string;
  tipo: 'individual' | 'empresa';
  credito?: {
    limite: number;
    disponible: number;
    diasCredito: number;
  };
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateClienteDto extends Omit<Cliente, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {}
export interface UpdateClienteDto extends Partial<CreateClienteDto> {}

export class ClientesService {
  /**
   * Obtener todos los clientes
   */
  static async getAll(filters?: {
    tipo?: string;
    activo?: boolean;
    limit?: number;
  }): Promise<Cliente[]> {
    try {
      let query = db.collection(COLLECTION).orderBy('nombre', 'asc');

      if (filters?.tipo) {
        query = query.where('tipo', '==', filters.tipo) as any;
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
      })) as Cliente[];
    } catch (error) {
      logger.error('Error getting clientes:', error);
      throw new Error('Failed to fetch clientes');
    }
  }

  /**
   * Obtener cliente por ID
   */
  static async getById(id: string): Promise<Cliente | null> {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as Cliente;
    } catch (error) {
      logger.error(`Error getting cliente ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear nuevo cliente
   */
  static async create(data: CreateClienteDto, userId: string): Promise<Cliente> {
    try {
      const now = new Date();
      const clienteData = {
        ...data,
        activo: data.activo ?? true,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };

      const docRef = await db.collection(COLLECTION).add(clienteData);
      const doc = await docRef.get();

      logger.info(`Cliente created: ${docRef.id}`);
      return { id: doc.id, ...doc.data() } as Cliente;
    } catch (error) {
      logger.error('Error creating cliente:', error);
      throw error;
    }
  }

  /**
   * Actualizar cliente
   */
  static async update(id: string, data: UpdateClienteDto, userId: string): Promise<Cliente> {
    try {
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Cliente not found');
      }

      await docRef.update({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      });

      const updatedDoc = await docRef.get();
      logger.info(`Cliente updated: ${id}`);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Cliente;
    } catch (error) {
      logger.error(`Error updating cliente ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar cliente
   */
  static async delete(id: string): Promise<void> {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      logger.info(`Cliente deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting cliente ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener abonos del cliente
   */
  static async getAbonos(clienteId: string): Promise<any[]> {
    try {
      const snapshot = await db.collection('abonos')
        .where('clienteId', '==', clienteId)
        .orderBy('fecha', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error(`Error getting abonos for cliente ${clienteId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estado de cuenta del cliente
   */
  static async getEstadoCuenta(clienteId: string) {
    try {
      // Obtener ventas del cliente
      const ventasSnapshot = await db.collection('ventas')
        .where('clienteId', '==', clienteId)
        .get();

      const ventas = ventasSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calcular totales
      const totalVentas = ventas.reduce((sum: number, v: any) => sum + v.total, 0);
      const totalPendiente = ventas.reduce((sum: number, v: any) => sum + (v.saldoPendiente || 0), 0);
      const totalPagado = totalVentas - totalPendiente;

      // Obtener abonos
      const abonos = await this.getAbonos(clienteId);
      const totalAbonos = abonos.reduce((sum: number, a: any) => sum + a.monto, 0);

      return {
        totalVentas,
        totalPagado,
        totalPendiente,
        totalAbonos,
        cantidadVentas: ventas.length,
        ventasPendientes: ventas.filter((v: any) => v.estado === 'pendiente').length,
        ventasPagadas: ventas.filter((v: any) => v.estado === 'pagado').length,
      };
    } catch (error) {
      logger.error(`Error getting estado cuenta for cliente ${clienteId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar límite de crédito
   */
  static async updateCreditLimit(clienteId: string, limite: number, userId: string): Promise<Cliente> {
    try {
      const cliente = await this.getById(clienteId);
      if (!cliente) {
        throw new Error('Cliente not found');
      }

      const credito = {
        ...cliente.credito,
        limite,
        disponible: limite - (cliente.credito?.limite || 0) + (cliente.credito?.disponible || 0),
      };

      return await this.update(clienteId, { credito }, userId);
    } catch (error) {
      logger.error(`Error updating credit limit for cliente ${clienteId}:`, error);
      throw error;
    }
  }
}
