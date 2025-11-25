/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                   VENTAS SERVICE - UNIT TESTS                              ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import { VentasService } from '../../src/services/ventas.service';

// Mock Firestore
jest.mock('../../src/config/firebase', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ docs: [] })),
        })),
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: false })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve({
        id: 'test-id',
        get: jest.fn(() => Promise.resolve({
          id: 'test-id',
          data: () => ({ test: 'data' }),
        })),
      })),
    })),
  })),
}));

describe('VentasService', () => {
  describe('getAll', () => {
    it('should return all ventas', async () => {
      const ventas = await VentasService.getAll();
      expect(Array.isArray(ventas)).toBe(true);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        clienteId: 'test-client',
        estado: 'pagado' as const,
        limit: 10,
      };
      const ventas = await VentasService.getAll(filters);
      expect(Array.isArray(ventas)).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return null for non-existent venta', async () => {
      const venta = await VentasService.getById('non-existent');
      expect(venta).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new venta', async () => {
      const ventaData = {
        clienteId: 'client-1',
        productos: [
          {
            productoId: 'prod-1',
            nombre: 'Producto 1',
            cantidad: 2,
            precioUnitario: 100,
            subtotal: 200,
          },
        ],
        subtotal: 200,
        descuento: 0,
        impuestos: 32,
        total: 232,
        formaPago: 'efectivo' as const,
      };

      const venta = await VentasService.create(ventaData, 'user-1');
      expect(venta).toBeDefined();
    });
  });

  describe('getEstadisticas', () => {
    it('should return statistics', async () => {
      const stats = await VentasService.getEstadisticas();
      expect(stats).toHaveProperty('totalVentas');
      expect(stats).toHaveProperty('montoTotal');
      expect(stats).toHaveProperty('totalComisiones');
    });
  });
});
