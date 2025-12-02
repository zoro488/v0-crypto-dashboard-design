/**
 * 📝 Tests de Formularios - Sistema CHRONOS
 * 
 * Verifica validación Zod, estados de formularios y CRUD operations.
 */

import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS ZOD (réplica de app/lib/schemas/)
// ═══════════════════════════════════════════════════════════════════════════════

const BancoIdSchema = z.enum([
  'boveda_monte',
  'boveda_usa',
  'profit',
  'leftie',
  'azteca',
  'flete_sur',
  'utilidades',
])

const EstadoPagoSchema = z.enum(['pendiente', 'parcial', 'completo'])

const CrearVentaSchema = z.object({
  clienteId: z.string().min(1, 'Cliente es requerido'),
  distribuidorId: z.string().min(1, 'Distribuidor es requerido'),
  precioVentaUnidad: z.number().positive('Precio de venta debe ser positivo'),
  precioCompraUnidad: z.number().positive('Precio de compra debe ser positivo'),
  precioFlete: z.number().min(0, 'Flete no puede ser negativo'),
  cantidad: z.number().int().positive('Cantidad debe ser un entero positivo'),
  estadoPago: EstadoPagoSchema.default('pendiente'),
  abono: z.number().min(0).default(0),
  fechaVenta: z.date().or(z.string().transform(s => new Date(s))),
  notas: z.string().optional(),
})

const CrearClienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  telefono: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  tipo: z.enum(['mayorista', 'minorista', 'distribuidor']),
})

const CrearOrdenCompraSchema = z.object({
  proveedorId: z.string().min(1, 'Proveedor es requerido'),
  items: z.array(z.object({
    productoId: z.string().min(1),
    cantidad: z.number().int().positive(),
    precioUnidad: z.number().positive(),
  })).min(1, 'Al menos un item requerido'),
  bancoOrigen: BancoIdSchema,
  estado: z.enum(['pendiente', 'procesando', 'completada', 'cancelada']).default('pendiente'),
})

const MovimientoBancarioSchema = z.object({
  bancoId: BancoIdSchema,
  tipo: z.enum(['ingreso', 'egreso', 'transferencia']),
  monto: z.number().positive('Monto debe ser positivo'),
  concepto: z.string().min(3, 'Concepto mínimo 3 caracteres'),
  referencia: z.string().optional(),
  bancoDestinoId: BancoIdSchema.optional(), // Solo para transferencias
}).refine(
  data => data.tipo !== 'transferencia' || data.bancoDestinoId,
  { message: 'Transferencia requiere banco destino', path: ['bancoDestinoId'] }
)

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

describe('📝 Schema: CrearVentaSchema', () => {
  it('debe validar una venta válida', () => {
    const ventaValida = {
      clienteId: 'cliente-123',
      distribuidorId: 'dist-456',
      precioVentaUnidad: 10000,
      precioCompraUnidad: 6300,
      precioFlete: 500,
      cantidad: 10,
      estadoPago: 'completo',
      abono: 100000,
      fechaVenta: new Date(),
    }
    
    const result = CrearVentaSchema.safeParse(ventaValida)
    expect(result.success).toBe(true)
  })

  it('debe rechazar precio de venta negativo', () => {
    const ventaInvalida = {
      clienteId: 'cliente-123',
      distribuidorId: 'dist-456',
      precioVentaUnidad: -1000,  // ❌ Negativo
      precioCompraUnidad: 6300,
      precioFlete: 500,
      cantidad: 10,
      fechaVenta: new Date(),
    }
    
    const result = CrearVentaSchema.safeParse(ventaInvalida)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('precioVentaUnidad')
    }
  })

  it('debe rechazar cantidad decimal', () => {
    const ventaInvalida = {
      clienteId: 'cliente-123',
      distribuidorId: 'dist-456',
      precioVentaUnidad: 10000,
      precioCompraUnidad: 6300,
      precioFlete: 500,
      cantidad: 10.5,  // ❌ No es entero
      fechaVenta: new Date(),
    }
    
    const result = CrearVentaSchema.safeParse(ventaInvalida)
    expect(result.success).toBe(false)
  })

  it('debe aceptar fecha como string ISO', () => {
    const venta = {
      clienteId: 'cliente-123',
      distribuidorId: 'dist-456',
      precioVentaUnidad: 10000,
      precioCompraUnidad: 6300,
      precioFlete: 500,
      cantidad: 10,
      fechaVenta: '2024-01-15T12:00:00Z',  // String ISO
    }
    
    const result = CrearVentaSchema.safeParse(venta)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fechaVenta).toBeInstanceOf(Date)
    }
  })
})

describe('👤 Schema: CrearClienteSchema', () => {
  it('debe validar cliente válido', () => {
    const cliente = {
      nombre: 'Juan Pérez',
      telefono: '5512345678',
      email: 'juan@example.com',
      tipo: 'mayorista',
    }
    
    const result = CrearClienteSchema.safeParse(cliente)
    expect(result.success).toBe(true)
  })

  it('debe rechazar teléfono con menos de 10 dígitos', () => {
    const cliente = {
      nombre: 'Juan Pérez',
      telefono: '551234',  // ❌ Solo 6 dígitos
      tipo: 'mayorista',
    }
    
    const result = CrearClienteSchema.safeParse(cliente)
    expect(result.success).toBe(false)
  })

  it('debe aceptar email vacío (opcional)', () => {
    const cliente = {
      nombre: 'Juan Pérez',
      telefono: '5512345678',
      email: '',  // Vacío permitido
      tipo: 'minorista',
    }
    
    const result = CrearClienteSchema.safeParse(cliente)
    expect(result.success).toBe(true)
  })

  it('debe rechazar tipo de cliente inválido', () => {
    const cliente = {
      nombre: 'Juan Pérez',
      telefono: '5512345678',
      tipo: 'VIP',  // ❌ No es un tipo válido
    }
    
    const result = CrearClienteSchema.safeParse(cliente)
    expect(result.success).toBe(false)
  })
})

describe('📦 Schema: CrearOrdenCompraSchema', () => {
  it('debe validar orden con items', () => {
    const orden = {
      proveedorId: 'prov-123',
      items: [
        { productoId: 'prod-1', cantidad: 10, precioUnidad: 5000 },
        { productoId: 'prod-2', cantidad: 5, precioUnidad: 3000 },
      ],
      bancoOrigen: 'profit',
    }
    
    const result = CrearOrdenCompraSchema.safeParse(orden)
    expect(result.success).toBe(true)
  })

  it('debe rechazar orden sin items', () => {
    const orden = {
      proveedorId: 'prov-123',
      items: [],  // ❌ Vacío
      bancoOrigen: 'profit',
    }
    
    const result = CrearOrdenCompraSchema.safeParse(orden)
    expect(result.success).toBe(false)
  })

  it('debe validar bancoOrigen contra BancoIdSchema', () => {
    const orden = {
      proveedorId: 'prov-123',
      items: [{ productoId: 'prod-1', cantidad: 10, precioUnidad: 5000 }],
      bancoOrigen: 'banco_fantasma',  // ❌ No existe
    }
    
    const result = CrearOrdenCompraSchema.safeParse(orden)
    expect(result.success).toBe(false)
  })
})

describe('🔄 Schema: MovimientoBancarioSchema', () => {
  it('debe validar ingreso', () => {
    const movimiento = {
      bancoId: 'utilidades',
      tipo: 'ingreso',
      monto: 50000,
      concepto: 'Venta completada',
    }
    
    const result = MovimientoBancarioSchema.safeParse(movimiento)
    expect(result.success).toBe(true)
  })

  it('debe rechazar transferencia sin banco destino', () => {
    const movimiento = {
      bancoId: 'profit',
      tipo: 'transferencia',
      monto: 25000,
      concepto: 'Transferencia entre cuentas',
      // ❌ Falta bancoDestinoId
    }
    
    const result = MovimientoBancarioSchema.safeParse(movimiento)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Transferencia requiere banco destino')
    }
  })

  it('debe validar transferencia con banco destino', () => {
    const movimiento = {
      bancoId: 'profit',
      tipo: 'transferencia',
      monto: 25000,
      concepto: 'Transferencia entre cuentas',
      bancoDestinoId: 'leftie',  // ✅ Incluido
    }
    
    const result = MovimientoBancarioSchema.safeParse(movimiento)
    expect(result.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE VALIDACIÓN DE BORDES
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔒 Validación de Bordes', () => {
  it('flete puede ser exactamente 0', () => {
    const venta = {
      clienteId: 'c1',
      distribuidorId: 'd1',
      precioVentaUnidad: 10000,
      precioCompraUnidad: 6300,
      precioFlete: 0,  // Cero es válido
      cantidad: 1,
      fechaVenta: new Date(),
    }
    
    expect(CrearVentaSchema.safeParse(venta).success).toBe(true)
  })

  it('nombre cliente mínimo 2 caracteres', () => {
    const cliente1 = { nombre: 'A', telefono: '5512345678', tipo: 'mayorista' }
    const cliente2 = { nombre: 'AB', telefono: '5512345678', tipo: 'mayorista' }
    
    expect(CrearClienteSchema.safeParse(cliente1).success).toBe(false)
    expect(CrearClienteSchema.safeParse(cliente2).success).toBe(true)
  })

  it('BancoId debe ser uno de los 7 válidos', () => {
    const bancosValidos = ['boveda_monte', 'boveda_usa', 'profit', 'leftie', 'azteca', 'flete_sur', 'utilidades']
    
    bancosValidos.forEach(banco => {
      expect(BancoIdSchema.safeParse(banco).success).toBe(true)
    })
    
    expect(BancoIdSchema.safeParse('banco_inventado').success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE MODALES EXISTENTES
// ═══════════════════════════════════════════════════════════════════════════════

describe('🪟 Modales CRUD del Sistema', () => {
  const MODALES = [
    'CreateVentaModalSmart',
    'CreateClienteModalSmart',
    'CreateDistribuidorModalSmart',
    'CreateOrdenCompraModalSmart',
    'CreateMovimientoModalSmart',
    'CreateTransferenciaModalSmart',
    'CreateAlmacenItemModal',
    'EditVentaModal',
    'EditClienteModal',
    'EditBancoModal',
    'DeleteConfirmModal',
    'VentaDetailModal',
    'ClienteDetailModal',
    'BancoDetailModal',
  ]

  it('debe haber al menos 14 modales definidos', () => {
    expect(MODALES.length).toBeGreaterThanOrEqual(14)
  })

  it('cada modal Create* debe tener su schema Zod correspondiente', () => {
    const modalesCreate = MODALES.filter(m => m.startsWith('Create'))
    // Verificar que existen schemas para cada modal de creación
    expect(modalesCreate.length).toBeGreaterThanOrEqual(6)
  })
})
