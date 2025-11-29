/**
 * 🧪 TESTS UNITARIOS - SCHEMAS ZOD
 * 
 * Tests para validación de ventas con Zod
 */

import { 
  validarVenta,
  validarTransferencia,
  validarAbono,
  CrearVentaSchema,
  TransferenciaSchema,
  AbonoClienteSchema,
} from '@/app/lib/schemas/ventas.schema'

describe('Ventas Schema - Validaciones', () => {
  
  describe('validarVenta', () => {
    
    it('✅ debe validar venta válida completa', () => {
      const ventaValida = {
        fecha: new Date().toISOString(),
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
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
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
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
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
        cantidad: 10,
        precioVentaUnidad: 6000, // Menor que precioCompraUnidad
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 60000,
        montoPagado: 60000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: -8000, // Negativo
        },
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar estado de pago inválido', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 100000,
        montoRestante: 0,
        estadoPago: 'invalido' as unknown as 'completo',
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
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
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
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
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
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
        cantidad: 10,
        precioVentaUnidad: -10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: -100000,
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
    
    it('❌ debe rechazar si montoPagado + montoRestante ≠ precioTotalVenta', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Cliente Alpha',
        producto: 'Producto Premium',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 30000,
        montoRestante: 50000, // 30000 + 50000 ≠ 100000
        estadoPago: 'parcial' as const,
        distribucionBancos: {
          bovedaMonte: 31500,
          fletes: 2500,
          utilidades: 16000,
        },
      }
      
      const result = validarVenta(ventaInvalida)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('validarTransferencia', () => {
    
    it('✅ debe validar transferencia válida', () => {
      const transferencia = {
        bancoOrigenId: 'utilidades',
        bancoDestinoId: 'boveda-monte',
        monto: 50000,
        concepto: 'Transferencia de utilidades',
      }
      
      const result = validarTransferencia(transferencia)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar mismo banco origen y destino', () => {
      const transferencia = {
        bancoOrigenId: 'utilidades',
        bancoDestinoId: 'utilidades',
        monto: 50000,
        concepto: 'Transferencia inválida',
      }
      
      const result = validarTransferencia(transferencia)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar monto negativo', () => {
      const transferencia = {
        bancoOrigenId: 'utilidades',
        bancoDestinoId: 'boveda-monte',
        monto: -50000,
        concepto: 'Transferencia inválida',
      }
      
      const result = validarTransferencia(transferencia)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar concepto vacío', () => {
      const transferencia = {
        bancoOrigenId: 'utilidades',
        bancoDestinoId: 'boveda-monte',
        monto: 50000,
        concepto: '',
      }
      
      const result = validarTransferencia(transferencia)
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('validarAbono', () => {
    
    it('✅ debe validar abono válido', () => {
      const abono = {
        clienteId: 'cliente-123',
        monto: 25000,
      }
      
      const result = validarAbono(abono)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar monto negativo', () => {
      const abono = {
        clienteId: 'cliente-123',
        monto: -25000,
      }
      
      const result = validarAbono(abono)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar clienteId vacío', () => {
      const abono = {
        clienteId: '',
        monto: 25000,
      }
      
      const result = validarAbono(abono)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe aceptar notas opcionales', () => {
      const abono = {
        clienteId: 'cliente-123',
        monto: 25000,
        notas: 'Pago parcial de la deuda',
      }
      
      const result = validarAbono(abono)
      
      expect(result.success).toBe(true)
    })
  })
  
  describe('CrearVentaSchema - Direct', () => {
    
    it('✅ debe parsear venta completa válida', () => {
      const venta = {
        fecha: new Date().toISOString(),
        cliente: 'Test Cliente',
        producto: 'Test Producto',
        cantidad: 5,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 50000,
        montoPagado: 50000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 31500,
          fletes: 2500,
          utilidades: 16000,
        },
      }
      
      expect(() => CrearVentaSchema.parse(venta)).not.toThrow()
    })
    
    it('❌ debe lanzar error con datos inválidos', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: '', // vacío
        producto: 'Test',
        cantidad: -5, // negativo
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 50000,
        montoPagado: 50000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 31500,
          fletes: 2500,
          utilidades: 16000,
        },
      }
      
      expect(() => CrearVentaSchema.parse(ventaInvalida)).toThrow()
    })
  })
})
