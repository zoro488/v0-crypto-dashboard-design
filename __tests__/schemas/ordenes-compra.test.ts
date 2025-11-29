/**
 * 🧪 TESTS UNITARIOS - SCHEMAS ZOD
 * 
 * Tests para validación de órdenes de compra con Zod
 */

import { 
  validarOrdenCompra,
  validarActualizacionOrdenCompra,
} from '@/app/lib/schemas/ordenes-compra.schema'

describe('Órdenes de Compra Schema - Validaciones', () => {
  
  describe('validarOrdenCompra', () => {
    
    it('✅ debe validar orden de compra válida con fórmulas correctas', () => {
      const ordenValida = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800, // = 6300 + 500
        costoTotal: 680000,   // = 6800 * 100
        estadoPago: 'completo' as const,
      }
      
      const result = validarOrdenCompra(ordenValida)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.costoPorUnidad).toBe(6800)
        expect(result.data.costoTotal).toBe(680000)
      }
    })
    
    it('❌ debe rechazar costoPorUnidad incorrecto', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 7000, // Incorrecto (debería ser 6800)
        costoTotal: 680000,
        estadoPago: 'completo' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('costoPorUnidad')
      }
    })
    
    it('❌ debe rechazar costoTotal incorrecto', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 700000, // Incorrecto (debería ser 680000)
        estadoPago: 'completo' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar cantidad = 0', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 0,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 0,
        estadoPago: 'completo' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar costos negativos', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 100,
        costoDistribuidor: -6300,
        costoTransporte: 500,
        costoPorUnidad: -5800,
        costoTotal: -580000,
        estadoPago: 'completo' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe validar con deuda y pagoInicial correctos', () => {
      const orden = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 680000,
        pagoInicial: 400000,
        deuda: 280000, // = 680000 - 400000
        estadoPago: 'parcial' as const,
      }
      
      const result = validarOrdenCompra(orden)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar si pagoInicial + deuda ≠ costoTotal', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 680000,
        pagoInicial: 400000,
        deuda: 300000, // Incorrecto (debería ser 280000)
        estadoPago: 'parcial' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe validar orden pendiente sin pagos', () => {
      const orden = {
        distribuidorId: 'dist_123',
        fecha: new Date(),
        cantidad: 50,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 340000,
        estadoPago: 'pendiente' as const,
      }
      
      const result = validarOrdenCompra(orden)
      
      expect(result.success).toBe(true)
    })
  })
  
  describe('validarActualizacionOrdenCompra', () => {
    
    it('✅ debe validar actualización de estadoPago', () => {
      const actualizacion = {
        estadoPago: 'completo' as const,
      }
      
      const result = validarActualizacionOrdenCompra(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar actualización de deuda', () => {
      const actualizacion = {
        deuda: 150000,
      }
      
      const result = validarActualizacionOrdenCompra(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar deuda negativa', () => {
      const actualizacion = {
        deuda: -1000,
      }
      
      const result = validarActualizacionOrdenCompra(actualizacion)
      
      expect(result.success).toBe(false)
    })
  })
})
