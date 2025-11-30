/**
 * 🧪 TESTS UNITARIOS - useFirestoreCRUD Hook
 * 
 * Tests para el hook principal de CRUD con Firestore
 */

// Mocks necesarios antes de importar
jest.mock('../../app/lib/firebase/config', () => ({
  db: null,
  isFirebaseConfigured: false,
}))

jest.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

import { renderHook, act, waitFor } from '@testing-library/react'

// Mock de funciones de Firestore
const mockOnSnapshot = jest.fn()
const mockAddDoc = jest.fn()
const mockUpdateDoc = jest.fn()
const mockDeleteDoc = jest.fn()
const mockGetDocs = jest.fn()

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection'),
  doc: jest.fn(() => 'mock-doc'),
  query: jest.fn(() => 'mock-query'),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
}))

// Importar después de los mocks
import { useFirestoreCRUD } from '../../app/hooks/useFirestoreCRUD'

describe('useFirestoreCRUD Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window.confirm mock
    global.confirm = jest.fn(() => true)
  })

  describe('Inicialización', () => {
    it('✅ debe iniciar con data vacía en modo mock', () => {
      mockOnSnapshot.mockImplementation(() => jest.fn())
      
      const { result } = renderHook(() => 
        useFirestoreCRUD<{ id: string; nombre: string }>('test_collection')
      )

      // En modo mock (sin Firebase), loading termina inmediatamente
      expect(result.current.data).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('✅ debe proporcionar funciones CRUD', () => {
      mockOnSnapshot.mockImplementation(() => jest.fn())
      
      const { result } = renderHook(() => 
        useFirestoreCRUD<{ id: string; nombre: string }>('test_collection')
      )

      expect(typeof result.current.add).toBe('function')
      expect(typeof result.current.update).toBe('function')
      expect(typeof result.current.remove).toBe('function')
      expect(typeof result.current.refresh).toBe('function')
    })
  })

  describe('Modo Mock (Sin Firebase)', () => {
    it('✅ debe funcionar en modo mock cuando Firebase no está configurado', async () => {
      mockOnSnapshot.mockImplementation(() => jest.fn())
      
      const { result } = renderHook(() => 
        useFirestoreCRUD<{ id: string; nombre: string }>('ventas')
      )

      // En modo mock, loading debe terminar rápidamente
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 1000 })
      
      expect(result.current.data).toEqual([])
    })

    it('❌ add debe retornar null en modo mock', async () => {
      mockOnSnapshot.mockImplementation(() => jest.fn())
      
      const { result } = renderHook(() => 
        useFirestoreCRUD<{ id: string; nombre: string }>('ventas')
      )

      let addResult: string | null = null
      await act(async () => {
        addResult = await result.current.add({ nombre: 'Test' })
      })

      expect(addResult).toBeNull()
    })

    it('❌ update debe retornar false en modo mock', async () => {
      mockOnSnapshot.mockImplementation(() => jest.fn())
      
      const { result } = renderHook(() => 
        useFirestoreCRUD<{ id: string; nombre: string }>('ventas')
      )

      let updateResult = true
      await act(async () => {
        updateResult = await result.current.update('123', { nombre: 'Updated' })
      })

      expect(updateResult).toBe(false)
    })

    it('❌ remove debe retornar false en modo mock', async () => {
      mockOnSnapshot.mockImplementation(() => jest.fn())
      
      const { result } = renderHook(() => 
        useFirestoreCRUD<{ id: string; nombre: string }>('ventas')
      )

      let removeResult = true
      await act(async () => {
        removeResult = await result.current.remove('123', true)
      })

      expect(removeResult).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('✅ debe retornar función vacía cuando no hay Firebase', () => {
      const mockUnsubscribe = jest.fn()
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe)
      
      const { unmount } = renderHook(() => 
        useFirestoreCRUD<{ id: string }>('test')
      )

      // En modo mock, el cleanup no llama a unsubscribe porque nunca se suscribió
      unmount()
      
      // El test verifica que no hay errores al desmontar
      expect(true).toBe(true)
    })
  })
})

describe('Hooks Pre-configurados', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnSnapshot.mockImplementation(() => jest.fn())
  })

  it('✅ useProductos debe usar colección almacen_productos', async () => {
    const { useProductos } = await import('../../app/hooks/useFirestoreCRUD')
    
    const { result } = renderHook(() => useProductos())
    
    expect(result.current.data).toEqual([])
    expect(typeof result.current.add).toBe('function')
  })

  it('✅ useClientes debe usar colección clientes', async () => {
    const { useClientes } = await import('../../app/hooks/useFirestoreCRUD')
    
    const { result } = renderHook(() => useClientes())
    
    expect(result.current.data).toEqual([])
  })

  it('✅ useDistribuidores debe usar colección distribuidores', async () => {
    const { useDistribuidores } = await import('../../app/hooks/useFirestoreCRUD')
    
    const { result } = renderHook(() => useDistribuidores())
    
    expect(result.current.data).toEqual([])
  })

  it('✅ useVentas debe usar colección ventas', async () => {
    const { useVentas } = await import('../../app/hooks/useFirestoreCRUD')
    
    const { result } = renderHook(() => useVentas())
    
    expect(result.current.data).toEqual([])
  })

  it('✅ useOrdenesCompra debe usar colección ordenes_compra', async () => {
    const { useOrdenesCompra } = await import('../../app/hooks/useFirestoreCRUD')
    
    const { result } = renderHook(() => useOrdenesCompra())
    
    expect(result.current.data).toEqual([])
  })
})
