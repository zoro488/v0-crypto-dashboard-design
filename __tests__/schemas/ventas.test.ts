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
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 100000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
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
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 0,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 0,
        montoPagado: 0,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 0,
          fletes: 0,
          utilidades: 0,
        },
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar precio venta <= precio compra (sin ganancia)', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: 6000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 60000,
        montoPagado: 60000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: -8000,
        },
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar estado de pago inválido', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 100000,
        montoRestante: 0,
        estadoPago: 'invalido' as any,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: 32000,
        },
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe validar estado pendiente', () => {
      const venta = {
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 0,
        montoRestante: 100000,
        estadoPago: 'pendiente' as const,
        distribucionBancos: {
          bovedaMonte: 0,
          fletes: 0,
          utilidades: 0,
        },
      }
      
      const result = validarVenta(venta)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar estado parcial', () => {
      const venta = {
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 50000,
        montoRestante: 50000,
        estadoPago: 'parcial' as const,
        distribucionBancos: {
          bovedaMonte: 31500,
          fletes: 2500,
          utilidades: 16000,
        },
      }
      
      const result = validarVenta(venta)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar precios negativos', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: -10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: -100000,
        montoPagado: 0,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: 32000,
        },
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
        fecha: new Date().toISOString(),
        cliente: 'Juan Pérez',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 100000,
        montoRestante: 0,
        estadoPago: 'completo',
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: 32000,
        },
      }
      
      expect(() => CrearVentaSchema.parse(venta)).not.toThrow()
    })
  })
})
