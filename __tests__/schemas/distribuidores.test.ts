/**
 * 🧪 TESTS UNITARIOS - Distribuidores Schema
 * 
 * Tests para validación de distribuidores con Zod
 */

import { 
  validarDistribuidor,
  validarActualizacionDistribuidor,
  generarKeywordsDistribuidor,
  CrearDistribuidorSchema,
  ActualizarDistribuidorSchema,
} from '../../app/lib/schemas/distribuidores.schema'

describe('Distribuidores Schema - Validaciones', () => {
  
  describe('validarDistribuidor', () => {
    
    it('✅ debe validar distribuidor válido con todos los campos', () => {
      const distribuidorValido = {
        nombre: 'PACMAN',
        empresa: 'Distribuidora PACMAN S.A.',
        telefono: '+52 555 123 4567',
        email: 'contacto@pacman.com',
        direccion: 'Av. Principal 123, CDMX',
      }
      
      const result = validarDistribuidor(distribuidorValido)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.nombre).toBe('PACMAN')
      }
    })
    
    it('✅ debe validar distribuidor solo con nombre (campos mínimos)', () => {
      const distribuidorMinimo = {
        nombre: 'Q-MAYA',
      }
      
      const result = validarDistribuidor(distribuidorMinimo)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar nombre muy corto', () => {
      const distribuidorInvalido = {
        nombre: 'A', // Solo 1 caracter
      }
      
      const result = validarDistribuidor(distribuidorInvalido)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors?.some((e: string) => e.includes('nombre'))).toBe(true)
      }
    })
    
    it('❌ debe rechazar nombre muy largo', () => {
      const distribuidorInvalido = {
        nombre: 'A'.repeat(101), // 101 caracteres
      }
      
      const result = validarDistribuidor(distribuidorInvalido)
      
      expect(result.success).toBe(false)
    })
    
    it('❌ debe rechazar email inválido', () => {
      const distribuidorInvalido = {
        nombre: 'Distribuidor Test',
        email: 'email-invalido',
      }
      
      const result = validarDistribuidor(distribuidorInvalido)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors?.some((e: string) => e.includes('email') || e.includes('Email'))).toBe(true)
      }
    })
    
    it('✅ debe aceptar email vacío como string vacío', () => {
      const distribuidor = {
        nombre: 'Distribuidor Test',
        email: '',
      }
      
      const result = validarDistribuidor(distribuidor)
      
      expect(result.success).toBe(true)
    })
    
    it('❌ debe rechazar teléfono con formato inválido', () => {
      const distribuidorInvalido = {
        nombre: 'Distribuidor Test',
        telefono: 'abc123', // Formato inválido
      }
      
      const result = validarDistribuidor(distribuidorInvalido)
      
      expect(result.success).toBe(false)
    })
    
    it('✅ debe aceptar varios formatos de teléfono válidos', () => {
      const formatos = [
        '+52 555 123 4567',
        '(555) 123-4567',
        '5551234567',
        '+1-800-555-1234',
      ]
      
      formatos.forEach(telefono => {
        const result = validarDistribuidor({
          nombre: 'Test',
          telefono,
        })
        
        expect(result.success).toBe(true)
      })
    })
  })
  
  describe('validarActualizacionDistribuidor', () => {
    
    it('✅ debe validar actualización parcial', () => {
      const actualizacion = {
        telefono: '+52 555 999 8888',
      }
      
      const result = validarActualizacionDistribuidor(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar actualización vacía (sin cambios)', () => {
      const actualizacion = {}
      
      const result = validarActualizacionDistribuidor(actualizacion)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ debe validar actualización de múltiples campos', () => {
      const actualizacion = {
        empresa: 'Nueva Empresa S.A.',
        direccion: 'Nueva Dirección 456',
        email: 'nuevo@email.com',
      }
      
      const result = validarActualizacionDistribuidor(actualizacion)
      
      expect(result.success).toBe(true)
    })
  })
  
  describe('generarKeywordsDistribuidor', () => {
    
    it('✅ debe generar keywords desde nombre', () => {
      const keywords = generarKeywordsDistribuidor(
        'Distribuidor Alpha',
        undefined,
        undefined
      )
      
      expect(keywords).toContain('distribuidor alpha')
      expect(keywords).toContain('distribuidor')
      expect(keywords).toContain('alpha')
    })
    
    it('✅ debe incluir empresa en keywords', () => {
      const keywords = generarKeywordsDistribuidor(
        'PACMAN',
        'Distribuidora PACMAN S.A.',
        undefined
      )
      
      expect(keywords).toContain('pacman')
      expect(keywords).toContain('distribuidora pacman s.a.')
    })
    
    it('✅ debe incluir teléfono sin formato', () => {
      const keywords = generarKeywordsDistribuidor(
        'Test',
        undefined,
        undefined,
        '+52 (555) 123-4567'
      )
      
      // La función elimina espacios y guiones
      expect(keywords).toContain('+525551234567')
    })
    
    it('✅ debe eliminar duplicados', () => {
      const keywords = generarKeywordsDistribuidor(
        'Test Test',
        'Test Company',
        undefined
      )
      
      // Contar cuántas veces aparece 'test'
      const testCount = keywords.filter((k: string) => k === 'test').length
      expect(testCount).toBe(1)
    })
    
    it('✅ debe ignorar palabras muy cortas', () => {
      const keywords = generarKeywordsDistribuidor(
        'A B CD',
        undefined,
        undefined
      )
      
      // 'A', 'B' son muy cortas (< 3 caracteres)
      expect(keywords).not.toContain('a')
      expect(keywords).not.toContain('b')
    })
  })
  
  describe('Esquemas Zod directos', () => {
    
    it('✅ CrearDistribuidorSchema debe funcionar con safeParse', () => {
      const data = {
        nombre: 'Distribuidor Directo',
        empresa: 'Empresa Test',
      }
      
      const result = CrearDistribuidorSchema.safeParse(data)
      
      expect(result.success).toBe(true)
    })
    
    it('✅ ActualizarDistribuidorSchema debe ser parcial', () => {
      const data = {
        direccion: 'Solo dirección',
      }
      
      const result = ActualizarDistribuidorSchema.safeParse(data)
      
      expect(result.success).toBe(true)
    })
  })
})
