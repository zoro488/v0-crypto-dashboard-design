/**
 * 🧪 TESTS UNITARIOS - SCHEMAS ZOD
 * 
 * Tests para validación de ventas con Zod
 */

import { 
  validarVenta,
  validarActualizacionVenta,
  CrearVentaSchema,
} from '@/app/lib/schemas/ventas.schema'

describe('Ventas Schema - Validaciones', () => {
  
  describe('validarVenta', () => {
    
    it('✅ debe validar venta válida completa', () => {
      const ventaValida = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'completo' as const,
        distribuciones: {
          boveda_monte: 63000,
          flete_sur: 5000,
          utilidades: 32000,
        },
      }
      
      const result = validarVenta(ventaValida)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cantidad).toBe(10)
        expect(result.data.estadoPago).toBe('completo')
      }
    })
    
    it('❌ debe rechazar cantidad = 0', () => {
      const ventaInvalida = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 0,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'completo' as const,
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar precio venta <= precio compra (sin ganancia)', () => {
      const ventaInvalida = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 10,
        precioVentaUnidad: 6000, // Menor que precioCompraUnidad
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'completo' as const,
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar estado de pago inválido', () => {
      const ventaInvalida = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'invalido' as any,
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe validar estado pendiente', () => {
      const venta = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'pendiente' as const,
      }
      
      const result = validarVenta(venta)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar estado parcial', () => {
      const venta = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'parcial' as const,
        montoPagado: 50000,
      }
      
      const result = validarVenta(venta)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar precios negativos', () => {
      const ventaInvalida = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 10,
        precioVentaUnidad: -10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'completo' as const,
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('validarActualizacionVenta', () => {
    
    it('✅ debe validar actualización de estadoPago', () => {
      const actualizacion = {
        estadoPago: 'completo' as const,
      }
      
      const result = validarActualizacionVenta(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar actualización de montoPagado', () => {
      const actualizacion = {
        montoPagado: 50000,
      }
      
      const result = validarActualizacionVenta(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar montoPagado negativo', () => {
      const actualizacion = {
        montoPagado: -1000,
      }
      
      const result = validarActualizacionVenta(actualizacion)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('CrearVentaSchema', () => {
    
    it('✅ debe parsear venta completa', () => {
      const venta = {
        clienteId: 'cliente_123',
        fecha: new Date(),
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        estadoPago: 'completo',
        distribuciones: {
          boveda_monte: 63000,
          flete_sur: 5000,
          utilidades: 32000,
        },
      }
      
      expect(() => CrearVentaSchema.parse(venta)).not.toThrow()
    })
  })
})
