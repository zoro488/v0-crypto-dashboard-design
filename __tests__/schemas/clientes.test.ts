/**
 * 🧪 TESTS UNITARIOS - SCHEMAS ZOD
 * 
 * Tests para validación de clientes con Zod
 */

import { 
  validarCliente, 
  validarActualizacionCliente,
  generarKeywordsCliente,
  CrearClienteSchema,
  ActualizarClienteSchema
} from '@/app/lib/schemas/clientes.schema'

describe('Clientes Schema - Validaciones', () => {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTS: validarCliente (Creación completa)
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('validarCliente', () => {
    
    it('✅ debe validar cliente válido completo', () => {
      const clienteValido = {
        nombre: 'Juan Pérez',
        email: 'juan.perez@example.com',
        telefono: '5512345678',
        direccion: 'Calle 123, CDMX',
        totalComprado: 50000,
        saldoPendiente: 10000,
        ventasAsociadas: [],
        keywords: ['juan', 'perez'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      const result = validarCliente(clienteValido)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nombre).toBe('Juan Pérez')
        expect(result.data.email).toBe('juan.perez@example.com')
        expect(result.data.telefono).toBe('5512345678')
      }
    })
    
    it('❌ debe rechazar nombre demasiado corto', () => {
      const clienteInvalido = {
        nombre: 'J', // Solo 1 caracter (mínimo 2)
        email: 'juan@example.com',
        telefono: '5512345678',
      }
      
      const result = validarCliente(clienteInvalido)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors?.some(e => e.includes('nombre'))).toBe(true)
      }
    })
    
    it('❌ debe rechazar nombre demasiado largo', () => {
      const clienteInvalido = {
        nombre: 'A'.repeat(101), // 101 caracteres (máximo 100)
        email: 'juan@example.com',
        telefono: '5512345678',
      }
      
      const result = validarCliente(clienteInvalido)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar email inválido', () => {
      const clienteInvalido = {
        nombre: 'Juan Pérez',
        email: 'email-invalido', // Sin @
        telefono: '5512345678',
      }
      
      const result = validarCliente(clienteInvalido)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors?.some(e => e.includes('email'))).toBe(true)
      }
    })
    
    it('❌ debe rechazar teléfono inválido (con letras)', () => {
      const clienteInvalido = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: 'ABC1234567', // Contiene letras - regex lo rechaza
      }
      
      const result = validarCliente(clienteInvalido)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors?.some(e => e.includes('telefono') || e.includes('teléfono'))).toBe(true)
      }
    })
    
    it('❌ debe rechazar teléfono con letras', () => {
      const clienteInvalido = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '55123ABC78', // Contiene letras
      }
      
      const result = validarCliente(clienteInvalido)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe aceptar cliente sin campos opcionales', () => {
      const cliente = {
        nombre: 'Cliente Nuevo',
        // email, telefono, direccion son opcionales
      }
      
      const result = validarCliente(cliente)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe aceptar direccion vacía', () => {
      const cliente = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '5512345678',
        direccion: '',
      }
      
      const result = validarCliente(cliente)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar direccion muy larga', () => {
      const clienteInvalido = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '5512345678',
        direccion: 'A'.repeat(201), // Más de 200 caracteres
      }
      
      const result = validarCliente(clienteInvalido)
      
      expect(result.success).toBe(false)
    })
  })
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTS: validarActualizacionCliente (Actualización parcial)
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('validarActualizacionCliente', () => {
    
    it('✅ debe validar actualización de solo nombre', () => {
      const actualizacion = {
        nombre: 'Juan Pérez Actualizado',
      }
      
      const result = validarActualizacionCliente(actualizacion)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nombre).toBe('Juan Pérez Actualizado')
      }
    })
    
    it('✅ debe validar actualización de solo email', () => {
      const actualizacion = {
        email: 'nuevo.email@example.com',
      }
      
      const result = validarActualizacionCliente(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar actualización de múltiples campos', () => {
      const actualizacion = {
        nombre: 'Juan Actualizado',
        telefono: '5598765432',
        direccion: 'Nueva Calle 456',
      }
      
      const result = validarActualizacionCliente(actualizacion)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nombre).toBe('Juan Actualizado')
        expect(result.data.telefono).toBe('5598765432')
      }
    })
    
    it('❌ debe rechazar actualización con email inválido', () => {
      const actualizacion = {
        email: 'email-sin-arroba',
      }
      
      const result = validarActualizacionCliente(actualizacion)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar actualización con observaciones muy largas', () => {
      const actualizacion = {
        observaciones: 'A'.repeat(501), // Más de 500 caracteres
      }
      
      const result = validarActualizacionCliente(actualizacion)
      
      expect(result.success).toBe(false)
    })
  })
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTS: generarKeywordsCliente
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('generarKeywordsCliente', () => {
    
    it('✅ debe generar keywords desde nombre', () => {
      const keywords = generarKeywordsCliente('Juan Pérez')
      
      expect(keywords).toContain('juan')
      expect(keywords).toContain('pérez') // La función mantiene acentos
      expect(keywords).toContain('juan pérez')
    })
    
    it('✅ debe manejar nombres con acentos', () => {
      const keywords = generarKeywordsCliente('José María')
      
      expect(keywords).toContain('josé')
      expect(keywords).toContain('maría')
      expect(keywords).toContain('josé maría')
    })
    
    it('✅ debe manejar nombres con múltiples espacios', () => {
      const keywords = generarKeywordsCliente('Juan   Carlos   Pérez')
      
      expect(keywords).toContain('juan')
      expect(keywords).toContain('carlos')
      expect(keywords).toContain('pérez')
    })
    
    it('✅ debe eliminar duplicados', () => {
      const keywords = generarKeywordsCliente('Juan Juan')
      
      const juanCount = keywords.filter(k => k === 'juan').length
      expect(juanCount).toBe(1)
    })
    
    it('✅ debe manejar nombres vacíos', () => {
      const keywords = generarKeywordsCliente('')
      
      // La función puede retornar array vacío o con string vacío
      expect(Array.isArray(keywords)).toBe(true)
    })
  })
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTS: Schemas directos
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('CrearClienteSchema', () => {
    
    it('✅ debe parsear cliente válido', () => {
      const cliente = {
        nombre: 'Test Cliente',
        email: 'test@example.com',
        telefono: '5512345678',
      }
      
      expect(() => CrearClienteSchema.parse(cliente)).not.toThrow()
    })
    
    it('❌ debe lanzar error con datos inválidos', () => {
      const clienteInvalido = {
        nombre: 'T', // Muy corto
        email: 'invalid',
        telefono: '123',
      }
      
      expect(() => CrearClienteSchema.parse(clienteInvalido)).toThrow()
    })
  })
  
  describe('ActualizarClienteSchema', () => {
    
    it('✅ debe parsear actualización parcial', () => {
      const actualizacion = {
        nombre: 'Nombre Actualizado',
      }
      
      expect(() => ActualizarClienteSchema.parse(actualizacion)).not.toThrow()
    })
    
    it('✅ debe aceptar objeto vacío (sin cambios)', () => {
      const actualizacion = {}
      
      expect(() => ActualizarClienteSchema.parse(actualizacion)).not.toThrow()
    })
  })
})
