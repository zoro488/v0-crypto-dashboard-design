/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🧪 TESTS REALISTAS - SCHEMAS Y FORMULARIOS DEL SISTEMA
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Tests que importan y validan los SCHEMAS REALES del sistema:
 * - ventas.schema.ts
 * - clientes.schema.ts
 * - distribuidores.schema.ts
 * - ordenes-compra.schema.ts
 * - business-operations.schema.ts
 * 
 * Fecha: 02 de Diciembre de 2025
 * ════════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTACIONES DE SCHEMAS REALES
// ═══════════════════════════════════════════════════════════════════════════════

import {
  CrearVentaSchema,
  MontoSchema,
  CantidadSchema,
  BancoIdSchema,
  EstadoPagoSchema,
  TransferenciaSchema,
  AbonoClienteSchema,
  validarVenta,
  validarTransferencia,
  validarAbono,
} from '@/app/lib/schemas/ventas.schema'

import {
  CrearClienteSchema,
  ActualizarClienteSchema,
  validarCliente,
  validarActualizacionCliente,
  generarKeywordsCliente,
} from '@/app/lib/schemas/clientes.schema'

import {
  CrearDistribuidorSchema,
  ActualizarDistribuidorSchema,
  validarDistribuidor,
  validarActualizacionDistribuidor,
  generarKeywordsDistribuidor,
} from '@/app/lib/schemas/distribuidores.schema'

import {
  CrearOrdenCompraSchema,
  EstadoOrdenSchema,
  PagoDistribuidorSchema,
  validarOrdenCompra,
  validarPagoDistribuidor as validarPagoDistribuidorOC,
  generarKeywordsOrdenCompra,
} from '@/app/lib/schemas/ordenes-compra.schema'

import {
  BANCOS_IDS,
  ESTADOS_PAGO,
  ESTADOS_ORDEN,
  PRECIO_FLETE_DEFAULT,
  MontoPositivoSchema,
  MontoNoNegativoSchema,
  ItemVentaSchema,
  CrearVentaCompletaSchema,
  TransferenciaBancosSchema,
  RegistrarGastoSchema,
  RegistrarIngresoSchema,
  AbonoClienteSchema as AbonoClienteSchemaBO,
  PagoDistribuidorSchema as PagoDistribuidorSchemaBO,
  calcularDistribucionGYA,
  calcularDistribucionGYATotal,
  validarVentaCompleta,
  validarOrdenCompraCompleta,
  validarAbonoCliente,
  validarPagoDistribuidor,
  validarTransferencia as validarTransferenciaBO,
  validarGasto,
  validarIngreso,
  BANCOS_OPERATIVOS,
} from '@/app/lib/schemas/business-operations.schema'

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: CONSTANTES DEL SISTEMA
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔧 CONSTANTES DEL SISTEMA (business-operations.schema.ts)', () => {
  test('BANCOS_IDS contiene los 7 bancos correctos', () => {
    expect(BANCOS_IDS).toHaveLength(7)
    expect(BANCOS_IDS).toContain('boveda_monte')
    expect(BANCOS_IDS).toContain('boveda_usa')
    expect(BANCOS_IDS).toContain('utilidades')
    expect(BANCOS_IDS).toContain('flete_sur')
    expect(BANCOS_IDS).toContain('azteca')
    expect(BANCOS_IDS).toContain('leftie')
    expect(BANCOS_IDS).toContain('profit')
  })

  test('ESTADOS_PAGO contiene los 3 estados', () => {
    expect(ESTADOS_PAGO).toEqual(['completo', 'parcial', 'pendiente'])
  })

  test('ESTADOS_ORDEN contiene los 4 estados', () => {
    expect(ESTADOS_ORDEN).toEqual(['pendiente', 'parcial', 'pagado', 'cancelado'])
  })

  test('PRECIO_FLETE_DEFAULT = 500', () => {
    expect(PRECIO_FLETE_DEFAULT).toBe(500)
  })

  test('BANCOS_OPERATIVOS solo incluye azteca, leftie, profit', () => {
    expect(BANCOS_OPERATIVOS).toEqual(['azteca', 'leftie', 'profit'])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: SCHEMAS PRIMITIVOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('📐 SCHEMAS PRIMITIVOS', () => {
  describe('MontoSchema (ventas.schema.ts)', () => {
    test('acepta montos positivos', () => {
      expect(MontoSchema.safeParse(100).success).toBe(true)
      expect(MontoSchema.safeParse(10000.50).success).toBe(true)
    })

    test('rechaza montos negativos', () => {
      expect(MontoSchema.safeParse(-100).success).toBe(false)
    })

    test('rechaza cero', () => {
      expect(MontoSchema.safeParse(0).success).toBe(false)
    })

    test('rechaza más de 2 decimales', () => {
      expect(MontoSchema.safeParse(100.999).success).toBe(false)
    })
  })

  describe('MontoPositivoSchema (business-operations.schema.ts)', () => {
    test('acepta montos positivos', () => {
      expect(MontoPositivoSchema.safeParse(1).success).toBe(true)
      expect(MontoPositivoSchema.safeParse(99999.99).success).toBe(true)
    })

    test('rechaza cero y negativos', () => {
      expect(MontoPositivoSchema.safeParse(0).success).toBe(false)
      expect(MontoPositivoSchema.safeParse(-1).success).toBe(false)
    })
  })

  describe('MontoNoNegativoSchema', () => {
    test('acepta cero y positivos', () => {
      expect(MontoNoNegativoSchema.safeParse(0).success).toBe(true)
      expect(MontoNoNegativoSchema.safeParse(100).success).toBe(true)
    })

    test('rechaza negativos', () => {
      expect(MontoNoNegativoSchema.safeParse(-1).success).toBe(false)
    })
  })

  describe('CantidadSchema (ventas.schema.ts)', () => {
    test('acepta enteros positivos', () => {
      expect(CantidadSchema.safeParse(1).success).toBe(true)
      expect(CantidadSchema.safeParse(100).success).toBe(true)
    })

    test('rechaza decimales', () => {
      expect(CantidadSchema.safeParse(10.5).success).toBe(false)
    })

    test('rechaza cero y negativos', () => {
      expect(CantidadSchema.safeParse(0).success).toBe(false)
      expect(CantidadSchema.safeParse(-5).success).toBe(false)
    })
  })

  describe('BancoIdSchema (ventas.schema.ts)', () => {
    test('acepta IDs de bancos válidos', () => {
      expect(BancoIdSchema.safeParse('boveda_monte').success).toBe(true)
      expect(BancoIdSchema.safeParse('utilidades').success).toBe(true)
      expect(BancoIdSchema.safeParse('flete_sur').success).toBe(true)
    })

    test('rechaza IDs inválidos', () => {
      expect(BancoIdSchema.safeParse('banco_falso').success).toBe(false)
      expect(BancoIdSchema.safeParse('Bóveda Monte').success).toBe(false)
      expect(BancoIdSchema.safeParse('').success).toBe(false)
    })
  })

  describe('EstadoPagoSchema', () => {
    test('acepta estados válidos', () => {
      expect(EstadoPagoSchema.safeParse('completo').success).toBe(true)
      expect(EstadoPagoSchema.safeParse('parcial').success).toBe(true)
      expect(EstadoPagoSchema.safeParse('pendiente').success).toBe(true)
    })

    test('rechaza estados inválidos', () => {
      expect(EstadoPagoSchema.safeParse('pagado').success).toBe(false)
      expect(EstadoPagoSchema.safeParse('cancelado').success).toBe(false)
    })
  })

  describe('EstadoOrdenSchema (ordenes-compra.schema.ts)', () => {
    test('acepta estados de orden válidos', () => {
      expect(EstadoOrdenSchema.safeParse('pendiente').success).toBe(true)
      expect(EstadoOrdenSchema.safeParse('parcial').success).toBe(true)
      expect(EstadoOrdenSchema.safeParse('pagado').success).toBe(true)
      expect(EstadoOrdenSchema.safeParse('cancelado').success).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: SCHEMA DE CLIENTE
// ═══════════════════════════════════════════════════════════════════════════════

describe('👤 SCHEMA DE CLIENTE (clientes.schema.ts)', () => {
  describe('CrearClienteSchema', () => {
    test('acepta datos válidos mínimos', () => {
      const result = CrearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
      })
      expect(result.success).toBe(true)
    })

    test('acepta datos válidos completos', () => {
      const result = CrearClienteSchema.safeParse({
        nombre: 'María García',
        telefono: '+52 55 1234 5678',
        email: 'maria@example.com',
        direccion: 'Calle Principal 123',
        observaciones: 'Cliente frecuente',
      })
      expect(result.success).toBe(true)
    })

    test('rechaza nombre muy corto', () => {
      const result = CrearClienteSchema.safeParse({
        nombre: 'A',
      })
      expect(result.success).toBe(false)
    })

    test('rechaza email inválido', () => {
      const result = CrearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
        email: 'email-invalido',
      })
      expect(result.success).toBe(false)
    })

    test('acepta email vacío', () => {
      const result = CrearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
        email: '',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validarCliente (función)', () => {
    test('retorna success con datos válidos', () => {
      const result = validarCliente({ nombre: 'Test Cliente' })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    test('retorna errores con datos inválidos', () => {
      const result = validarCliente({ nombre: '' })
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('generarKeywordsCliente', () => {
    test('genera keywords correctamente', () => {
      const keywords = generarKeywordsCliente(
        'Juan Carlos Pérez',
        '+52 55 1234',
        'juan@example.com',
      )
      expect(keywords).toContain('juan carlos pérez')
      expect(keywords).toContain('juan')
      expect(keywords).toContain('carlos')
      expect(keywords).toContain('pérez')
      expect(keywords).toContain('+52551234')
      expect(keywords).toContain('juan@example.com')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 4: SCHEMA DE DISTRIBUIDOR
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏭 SCHEMA DE DISTRIBUIDOR (distribuidores.schema.ts)', () => {
  describe('CrearDistribuidorSchema', () => {
    test('acepta datos válidos mínimos', () => {
      const result = CrearDistribuidorSchema.safeParse({
        nombre: 'Distribuidor XYZ',
      })
      expect(result.success).toBe(true)
    })

    test('acepta datos válidos completos', () => {
      const result = CrearDistribuidorSchema.safeParse({
        nombre: 'Distribuidor Premium',
        empresa: 'Premium Corp S.A.',
        contacto: 'Carlos Ruiz',
        telefono: '+52 55 9876 5432',
        email: 'contacto@premium.com',
        direccion: 'Av. Industrial 456',
      })
      expect(result.success).toBe(true)
    })

    test('rechaza nombre muy corto', () => {
      const result = CrearDistribuidorSchema.safeParse({
        nombre: 'X',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validarDistribuidor (función)', () => {
    test('valida correctamente', () => {
      const result = validarDistribuidor({ nombre: 'Test Distribuidor' })
      expect(result.success).toBe(true)
    })
  })

  describe('generarKeywordsDistribuidor', () => {
    test('genera keywords correctamente', () => {
      const keywords = generarKeywordsDistribuidor(
        'Distribuidor ABC',
        'ABC Corp',
        'Juan Contacto',
        '+52 55 1111',
        'abc@corp.com',
      )
      expect(keywords).toContain('distribuidor abc')
      expect(keywords).toContain('abc corp')
      expect(keywords).toContain('+52551111')
      expect(keywords).toContain('abc@corp.com')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 5: SCHEMA DE VENTA
// ═══════════════════════════════════════════════════════════════════════════════

describe('🛒 SCHEMA DE VENTA (ventas.schema.ts)', () => {
  describe('CrearVentaSchema - Validaciones de negocio', () => {
    test('acepta venta válida con todos los campos', () => {
      const ventaValida = {
        fecha: new Date().toISOString(),
        cliente: 'Cliente Test',
        producto: 'Producto Test',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000, // 10 × 10000
        montoPagado: 100000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 63000, // 10 × 6300
          fletes: 5000,       // 10 × 500
          utilidades: 32000,  // 10 × (10000 - 6300 - 500)
        },
      }
      const result = CrearVentaSchema.safeParse(ventaValida)
      expect(result.success).toBe(true)
    })

    test('rechaza si precioVenta <= precioCompra', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Cliente',
        producto: 'Producto',
        cantidad: 10,
        precioVentaUnidad: 5000, // Menor que compra!
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 50000,
        montoPagado: 50000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: -18000, // Negativo!
        },
      }
      const result = CrearVentaSchema.safeParse(ventaInvalida)
      expect(result.success).toBe(false)
    })

    test('rechaza si montoPagado + montoRestante !== precioTotal', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Cliente',
        producto: 'Producto',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 100000,
        montoPagado: 50000,
        montoRestante: 30000, // No suma 100000!
        estadoPago: 'parcial' as const,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: 32000,
        },
      }
      const result = CrearVentaSchema.safeParse(ventaInvalida)
      expect(result.success).toBe(false)
    })

    test('rechaza si precioTotal no coincide con cantidad × precioUnidad', () => {
      const ventaInvalida = {
        fecha: new Date().toISOString(),
        cliente: 'Cliente',
        producto: 'Producto',
        cantidad: 10,
        precioVentaUnidad: 10000,
        precioCompraUnidad: 6300,
        precioFlete: 500,
        precioTotalVenta: 80000, // Debería ser 100000!
        montoPagado: 80000,
        montoRestante: 0,
        estadoPago: 'completo' as const,
        distribucionBancos: {
          bovedaMonte: 63000,
          fletes: 5000,
          utilidades: 32000,
        },
      }
      const result = CrearVentaSchema.safeParse(ventaInvalida)
      expect(result.success).toBe(false)
    })
  })

  describe('validarVenta (función)', () => {
    test('retorna errores formateados', () => {
      const result = validarVenta({
        cliente: '', // Vacío
        cantidad: -5, // Negativo
      })
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.some(e => e.includes('cliente'))).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 6: SCHEMA DE ORDEN DE COMPRA
// ═══════════════════════════════════════════════════════════════════════════════

describe('📦 SCHEMA DE ORDEN DE COMPRA (ordenes-compra.schema.ts)', () => {
  describe('CrearOrdenCompraSchema - Validaciones de negocio', () => {
    test('acepta OC válida completa', () => {
      const ocValida = {
        distribuidorId: 'DIST-001',
        distribuidor: 'Distribuidor Test',
        producto: 'Producto Test',
        cantidad: 100,
        costoDistribuidor: 6000,
        costoTransporte: 300,
        costoPorUnidad: 6300, // 6000 + 300
        costoTotal: 630000,   // 100 × 6300
        deuda: 630000,
        estado: 'pendiente' as const,
      }
      const result = CrearOrdenCompraSchema.safeParse(ocValida)
      expect(result.success).toBe(true)
    })

    test('rechaza si costoPorUnidad !== costoDistribuidor + costoTransporte', () => {
      const ocInvalida = {
        distribuidorId: 'DIST-001',
        distribuidor: 'Distribuidor',
        producto: 'Producto',
        cantidad: 100,
        costoDistribuidor: 6000,
        costoTransporte: 300,
        costoPorUnidad: 7000, // Debería ser 6300!
        costoTotal: 700000,
        deuda: 700000,
      }
      const result = CrearOrdenCompraSchema.safeParse(ocInvalida)
      expect(result.success).toBe(false)
    })

    test('rechaza si costoTotal !== costoPorUnidad × cantidad', () => {
      const ocInvalida = {
        distribuidorId: 'DIST-001',
        distribuidor: 'Distribuidor',
        producto: 'Producto',
        cantidad: 100,
        costoDistribuidor: 6000,
        costoTransporte: 300,
        costoPorUnidad: 6300,
        costoTotal: 500000, // Debería ser 630000!
        deuda: 500000,
      }
      const result = CrearOrdenCompraSchema.safeParse(ocInvalida)
      expect(result.success).toBe(false)
    })

    test('rechaza si pagoInicial + deuda !== costoTotal', () => {
      const ocInvalida = {
        distribuidorId: 'DIST-001',
        distribuidor: 'Distribuidor',
        producto: 'Producto',
        cantidad: 100,
        costoDistribuidor: 6000,
        costoTransporte: 300,
        costoPorUnidad: 6300,
        costoTotal: 630000,
        pagoInicial: 100000,
        deuda: 400000, // Debería ser 530000!
        bancoOrigen: 'boveda_monte',
      }
      const result = CrearOrdenCompraSchema.safeParse(ocInvalida)
      expect(result.success).toBe(false)
    })

    test('rechaza si hay pago inicial sin banco origen', () => {
      const ocInvalida = {
        distribuidorId: 'DIST-001',
        distribuidor: 'Distribuidor',
        producto: 'Producto',
        cantidad: 100,
        costoDistribuidor: 6000,
        costoTransporte: 300,
        costoPorUnidad: 6300,
        costoTotal: 630000,
        pagoInicial: 100000, // Hay pago...
        deuda: 530000,
        // Sin bancoOrigen!
      }
      const result = CrearOrdenCompraSchema.safeParse(ocInvalida)
      expect(result.success).toBe(false)
    })
  })

  describe('validarOrdenCompra (función)', () => {
    test('retorna errores formateados', () => {
      const result = validarOrdenCompra({
        distribuidor: '', // Vacío
        cantidad: 0,      // Inválido
      })
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 7: SCHEMA DE TRANSFERENCIA
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔄 SCHEMA DE TRANSFERENCIA (ventas.schema.ts)', () => {
  describe('TransferenciaSchema', () => {
    test('acepta transferencia válida', () => {
      const result = TransferenciaSchema.safeParse({
        bancoOrigenId: 'boveda_monte',
        bancoDestinoId: 'utilidades',
        monto: 50000,
        concepto: 'Distribución de utilidades',
      })
      expect(result.success).toBe(true)
    })

    test('rechaza si origen === destino', () => {
      const result = TransferenciaSchema.safeParse({
        bancoOrigenId: 'boveda_monte',
        bancoDestinoId: 'boveda_monte', // Mismo banco!
        monto: 50000,
        concepto: 'Test',
      })
      expect(result.success).toBe(false)
    })

    test('rechaza monto negativo', () => {
      const result = TransferenciaSchema.safeParse({
        bancoOrigenId: 'boveda_monte',
        bancoDestinoId: 'utilidades',
        monto: -100,
        concepto: 'Test',
      })
      expect(result.success).toBe(false)
    })

    test('rechaza concepto vacío', () => {
      const result = TransferenciaSchema.safeParse({
        bancoOrigenId: 'boveda_monte',
        bancoDestinoId: 'utilidades',
        monto: 50000,
        concepto: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('TransferenciaBancosSchema (business-operations.schema.ts)', () => {
    test('también rechaza origen === destino', () => {
      const result = TransferenciaBancosSchema.safeParse({
        bancoOrigen: 'profit',
        bancoDestino: 'profit',
        monto: 1000,
        concepto: 'Test',
      })
      expect(result.success).toBe(false)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 8: SCHEMA DE ABONO A CLIENTE
// ═══════════════════════════════════════════════════════════════════════════════

describe('💰 SCHEMA DE ABONO A CLIENTE', () => {
  describe('AbonoClienteSchema (ventas.schema.ts)', () => {
    test('acepta abono válido', () => {
      const result = AbonoClienteSchema.safeParse({
        clienteId: 'CLI-001',
        monto: 25000,
      })
      expect(result.success).toBe(true)
    })

    test('rechaza sin clienteId', () => {
      const result = AbonoClienteSchema.safeParse({
        monto: 25000,
      })
      expect(result.success).toBe(false)
    })

    test('rechaza monto negativo', () => {
      const result = AbonoClienteSchema.safeParse({
        clienteId: 'CLI-001',
        monto: -100,
      })
      expect(result.success).toBe(false)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 9: SCHEMA DE INGRESO Y GASTO
// ═══════════════════════════════════════════════════════════════════════════════

describe('📊 SCHEMAS DE INGRESO Y GASTO (business-operations.schema.ts)', () => {
  describe('RegistrarGastoSchema', () => {
    test('acepta gasto válido', () => {
      const result = RegistrarGastoSchema.safeParse({
        bancoOrigen: 'boveda_monte',
        monto: 15000,
        concepto: 'Pago de servicios',
      })
      expect(result.success).toBe(true)
    })

    test('acepta cualquier banco válido', () => {
      BANCOS_IDS.forEach(bancoId => {
        const result = RegistrarGastoSchema.safeParse({
          bancoOrigen: bancoId,
          monto: 1000,
          concepto: 'Test',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('RegistrarIngresoSchema', () => {
    test('solo acepta bancos operativos (azteca, leftie, profit)', () => {
      // Bancos que SÍ deben funcionar
      expect(RegistrarIngresoSchema.safeParse({
        bancoDestino: 'azteca',
        monto: 5000,
        concepto: 'Ingreso extra',
      }).success).toBe(true)

      expect(RegistrarIngresoSchema.safeParse({
        bancoDestino: 'leftie',
        monto: 5000,
        concepto: 'Ingreso extra',
      }).success).toBe(true)

      expect(RegistrarIngresoSchema.safeParse({
        bancoDestino: 'profit',
        monto: 5000,
        concepto: 'Ingreso extra',
      }).success).toBe(true)
    })

    test('rechaza bancos NO operativos (boveda_monte, boveda_usa, utilidades, flete_sur)', () => {
      // Estos bancos NO pueden recibir ingresos directos
      const bancosNoOperativos = ['boveda_monte', 'boveda_usa', 'utilidades', 'flete_sur']
      
      bancosNoOperativos.forEach(banco => {
        const result = RegistrarIngresoSchema.safeParse({
          bancoDestino: banco,
          monto: 5000,
          concepto: 'Test',
        })
        expect(result.success).toBe(false)
      })
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 10: ITEM DE VENTA
// ═══════════════════════════════════════════════════════════════════════════════

describe('📋 ITEM DE VENTA (business-operations.schema.ts)', () => {
  describe('ItemVentaSchema', () => {
    test('acepta item válido', () => {
      const result = ItemVentaSchema.safeParse({
        producto: 'Producto Test',
        cantidad: 10,
        precioVenta: 10000,
        precioCompra: 6300,
        precioFlete: 500,
      })
      expect(result.success).toBe(true)
    })

    test('rechaza si precioVenta <= precioCompra', () => {
      const result = ItemVentaSchema.safeParse({
        producto: 'Producto',
        cantidad: 10,
        precioVenta: 5000, // Menor que compra!
        precioCompra: 6300,
        precioFlete: 500,
      })
      expect(result.success).toBe(false)
    })

    test('rechaza si genera utilidad negativa', () => {
      const result = ItemVentaSchema.safeParse({
        producto: 'Producto',
        cantidad: 10,
        precioVenta: 6500,  // 6500 - 6300 - 500 = -300 negativo!
        precioCompra: 6300,
        precioFlete: 500,
      })
      expect(result.success).toBe(false)
    })

    test('acepta utilidad = 0 (punto de equilibrio)', () => {
      const result = ItemVentaSchema.safeParse({
        producto: 'Producto',
        cantidad: 10,
        precioVenta: 6800,  // 6800 - 6300 - 500 = 0
        precioCompra: 6300,
        precioFlete: 500,
      })
      expect(result.success).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 11: CÁLCULO DE DISTRIBUCIÓN GYA
// ═══════════════════════════════════════════════════════════════════════════════

describe('🧮 CÁLCULO DISTRIBUCIÓN GYA (business-operations.schema.ts)', () => {
  describe('calcularDistribucionGYA', () => {
    test('calcula correctamente con valores estándar', () => {
      const dist = calcularDistribucionGYA(10000, 6300, 500, 10, true)
      
      expect(dist.bovedaMonte).toBe(63000)   // 6300 × 10
      expect(dist.fletes).toBe(5000)          // 500 × 10
      expect(dist.utilidades).toBe(32000)     // (10000 - 6300 - 500) × 10
      expect(dist.totalIngreso).toBe(100000)  // 10000 × 10
    })

    test('calcula correctamente SIN flete', () => {
      const dist = calcularDistribucionGYA(10000, 6300, 500, 10, false)
      
      expect(dist.bovedaMonte).toBe(63000)
      expect(dist.fletes).toBe(0)             // Sin flete
      expect(dist.utilidades).toBe(37000)     // (10000 - 6300 - 0) × 10
    })

    test('calcula margen de ganancia correctamente', () => {
      const dist = calcularDistribucionGYA(10000, 6300, 500, 10, true)
      
      // Margen = utilidades / totalIngreso × 100 = 32000 / 100000 × 100 = 32%
      expect(dist.margenPorcentaje).toBe(32)
    })
  })

  describe('calcularDistribucionGYATotal (multi-producto)', () => {
    test('suma correctamente múltiples items', () => {
      const items = [
        { precioVenta: 10000, precioCompra: 6300, precioFlete: 500, cantidad: 10 },
        { precioVenta: 15000, precioCompra: 9000, precioFlete: 500, cantidad: 5 },
      ]
      
      const dist = calcularDistribucionGYATotal(items, true)
      
      // Item 1: boveda=63000, fletes=5000, utilidades=32000
      // Item 2: boveda=45000, fletes=2500, utilidades=27500
      expect(dist.bovedaMonte).toBe(63000 + 45000)
      expect(dist.fletes).toBe(5000 + 2500)
      expect(dist.utilidades).toBe(32000 + 27500)
      expect(dist.cantidadTotal).toBe(15)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 12: FUNCIONES DE VALIDACIÓN EXPORTADAS
// ═══════════════════════════════════════════════════════════════════════════════

describe('✅ FUNCIONES DE VALIDACIÓN EXPORTADAS', () => {
  test('validarVentaCompleta funciona', () => {
    const result = validarVentaCompleta({
      cliente: 'Test',
      items: [{
        producto: 'Producto',
        cantidad: 10,
        precioVenta: 10000,
        precioCompra: 6300,
        precioFlete: 500,
      }],
      estadoPago: 'completo',
    })
    expect(result.success).toBe(true)
  })

  test('validarAbonoCliente funciona', () => {
    const result = validarAbonoCliente({
      clienteId: 'CLI-001',
      monto: 5000,
    })
    expect(result.success).toBe(true)
  })

  test('validarPagoDistribuidor funciona', () => {
    const result = validarPagoDistribuidor({
      distribuidorId: 'DIST-001',
      monto: 10000,
      bancoOrigen: 'boveda_monte',
    })
    expect(result.success).toBe(true)
  })

  test('validarTransferenciaBO funciona', () => {
    const result = validarTransferenciaBO({
      bancoOrigen: 'utilidades',
      bancoDestino: 'profit',
      monto: 5000,
      concepto: 'Distribución',
    })
    expect(result.success).toBe(true)
  })

  test('validarGasto funciona', () => {
    const result = validarGasto({
      bancoOrigen: 'azteca',
      monto: 1500,
      concepto: 'Servicios',
    })
    expect(result.success).toBe(true)
  })

  test('validarIngreso funciona', () => {
    const result = validarIngreso({
      bancoDestino: 'profit',
      monto: 10000,
      concepto: 'Ingreso adicional',
    })
    expect(result.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 13: RESUMEN FINAL
// ═══════════════════════════════════════════════════════════════════════════════

describe('🏆 RESUMEN - TODOS LOS SCHEMAS VERIFICADOS CON CÓDIGO REAL', () => {
  test('Todos los schemas importados son funciones/objetos válidos', () => {
    // Ventas
    expect(CrearVentaSchema).toBeDefined()
    expect(MontoSchema).toBeDefined()
    expect(typeof validarVenta).toBe('function')
    
    // Clientes
    expect(CrearClienteSchema).toBeDefined()
    expect(typeof validarCliente).toBe('function')
    expect(typeof generarKeywordsCliente).toBe('function')
    
    // Distribuidores
    expect(CrearDistribuidorSchema).toBeDefined()
    expect(typeof validarDistribuidor).toBe('function')
    expect(typeof generarKeywordsDistribuidor).toBe('function')
    
    // Órdenes de Compra
    expect(CrearOrdenCompraSchema).toBeDefined()
    expect(typeof validarOrdenCompra).toBe('function')
    
    // Business Operations
    expect(ItemVentaSchema).toBeDefined()
    expect(typeof calcularDistribucionGYA).toBe('function')
    expect(typeof validarVentaCompleta).toBe('function')
  })

  test('Constantes del sistema exportadas correctamente', () => {
    expect(BANCOS_IDS.length).toBe(7)
    expect(ESTADOS_PAGO.length).toBe(3)
    expect(ESTADOS_ORDEN.length).toBe(4)
    expect(PRECIO_FLETE_DEFAULT).toBe(500)
    expect(BANCOS_OPERATIVOS.length).toBe(3)
  })
})
