/**
 * 🧪 TESTS UNITARIOS - SCHEMAS ZOD
 * 
 * Tests para validación de órdenes de compra con Zod
 */

import { 
  validarOrdenCompra,
  generarKeywordsOrdenCompra,
  CrearOrdenCompraSchema,
  ActualizarOrdenCompraSchema,
} from '@/app/lib/schemas/ordenes-compra.schema'

describe('Órdenes de Compra Schema - Validaciones', () => {
  
  describe('validarOrdenCompra', () => {
    
    it('✅ debe validar orden de compra válida completa', () => {
      const ordenValida = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800, // = 6300 + 500
        costoTotal: 680000,   // = 6800 * 100
        pagoInicial: 680000,
        deuda: 0,             // = 680000 - 680000
        bancoOrigen: 'boveda_monte',
        estado: 'pagado' as const,
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
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 7000, // Incorrecto (debería ser 6800)
        costoTotal: 700000,
        pagoInicial: 700000,
        deuda: 0,
        bancoOrigen: 'boveda_monte',
        estado: 'pagado' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors?.some(e => e.includes('costo'))).toBe(true)
      }
    })
    
    it('❌ debe rechazar costoTotal incorrecto', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 700000, // Incorrecto (debería ser 680000)
        pagoInicial: 700000,
        deuda: 0,
        bancoOrigen: 'boveda_monte',
        estado: 'pagado' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar cantidad = 0', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 0,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 0,
        deuda: 0,
        estado: 'pendiente' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar costos negativos', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 100,
        costoDistribuidor: -6300, // Negativo
        costoTransporte: 500,
        costoPorUnidad: -5800,
        costoTotal: -580000,
        deuda: 0,
        estado: 'pendiente' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe validar con deuda y pagoInicial correctos', () => {
      const orden = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 680000,
        pagoInicial: 400000,
        deuda: 280000, // = 680000 - 400000
        bancoOrigen: 'boveda_monte',
        estado: 'parcial' as const,
      }
      
      const result = validarOrdenCompra(orden)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar si pagoInicial + deuda ≠ costoTotal', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 680000,
        pagoInicial: 400000,
        deuda: 300000, // Incorrecto (debería ser 280000)
        bancoOrigen: 'boveda_monte',
        estado: 'parcial' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe validar orden pendiente sin pagos', () => {
      const orden = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 50,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 340000,
        deuda: 340000, // Todo es deuda
        estado: 'pendiente' as const,
      }
      
      const result = validarOrdenCompra(orden)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar si hay pago inicial sin banco', () => {
      const ordenInvalida = {
        distribuidorId: 'dist_123',
        distribuidor: 'Distribuidor Alpha',
        producto: 'Producto A',
        cantidad: 100,
        costoDistribuidor: 6300,
        costoTransporte: 500,
        costoPorUnidad: 6800,
        costoTotal: 680000,
        pagoInicial: 400000,
        deuda: 280000,
        // falta bancoOrigen
        estado: 'parcial' as const,
      }
      
      const result = validarOrdenCompra(ordenInvalida)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('ActualizarOrdenCompraSchema', () => {
    
    it('✅ debe validar actualización de estado', () => {
      const actualizacion = {
        id: 'oc-123',
        estado: 'pagado' as const,
      }
      
      const result = ActualizarOrdenCompraSchema.safeParse(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar actualización de deuda', () => {
      const actualizacion = {
        id: 'oc-123',
        deuda: 150000,
      }
      
      const result = ActualizarOrdenCompraSchema.safeParse(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar deuda negativa', () => {
      const actualizacion = {
        id: 'oc-123',
        deuda: -1000,
      }
      
      const result = ActualizarOrdenCompraSchema.safeParse(actualizacion)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar sin id', () => {
      const actualizacion = {
        estado: 'pagado' as const,
      }
      
      const result = ActualizarOrdenCompraSchema.safeParse(actualizacion)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('generarKeywordsOrdenCompra', () => {
    
    it('✅ debe generar keywords desde los datos', () => {
      const keywords = generarKeywordsOrdenCompra(
        'OC-001',
        'Distribuidor Alpha',
        'Producto Premium',
        'CDMX'
      )
      
      expect(keywords).toContain('oc-001')
      expect(keywords).toContain('distribuidor alpha')
      expect(keywords).toContain('distribuidor')
      expect(keywords).toContain('alpha')
      expect(keywords).toContain('producto premium')
      expect(keywords).toContain('cdmx')
    })
    
    it('✅ debe eliminar duplicados', () => {
      const keywords = generarKeywordsOrdenCompra(
        'OC-001',
        'Test Test',
        'Producto',
        ''
      )
      
      const testCount = keywords.filter(k => k === 'test').length
      expect(testCount).toBe(1)
    })
    
    it('✅ debe manejar origen undefined', () => {
      const keywords = generarKeywordsOrdenCompra(
        'OC-001',
        'Distribuidor',
        'Producto'
      )
      
      expect(Array.isArray(keywords)).toBe(true)
      expect(keywords.length).toBeGreaterThan(0)
    })
  })
})
