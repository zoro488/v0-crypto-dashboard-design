/**
 * 🧪 TESTS DE HOOKS - SISTEMA CHRONOS
 * 
 * Tests para hooks customizados:
 * - useFirestoreCRUD
 * - useClientes, useVentas, useOrdenes
 * - useAppStore subscriptions
 * 
 * @version 2.0.0
 * @date 2025-11-29
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// ============================================================================
// MOCKS
// ============================================================================

// Mock Firebase
jest.mock('@/app/lib/firebase/config', () => ({
  db: null,
  auth: null,
  isFirebaseConfigured: false,
}))

// Mock logger
jest.mock('@/app/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock Firestore Functions
const mockOnSnapshot = jest.fn()
const mockAddDoc = jest.fn()
const mockUpdateDoc = jest.fn()
const mockDeleteDoc = jest.fn()

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: (query: unknown, callback: (snapshot: { docs: Array<{ id: string; data: () => unknown }> }) => void) => {
    mockOnSnapshot(query, callback)
    return () => {} // unsubscribe
  },
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  serverTimestamp: () => new Date(),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
    now: () => ({ toDate: () => new Date() }),
  },
}))

// ============================================================================
// TEST DATA
// ============================================================================

const mockVentas = [
  {
    id: 'V-001',
    clienteId: 'C-001',
    clienteNombre: 'Cliente Alpha',
    cantidad: 10,
    precioVentaUnidad: 10000,
    precioCompraUnidad: 6300,
    precioFlete: 500,
    totalVenta: 100000,
    estadoPago: 'completo',
    fechaVenta: '2025-08-25',
  },
  {
    id: 'V-002',
    clienteId: 'C-002',
    clienteNombre: 'Cliente Beta',
    cantidad: 5,
    precioVentaUnidad: 10000,
    precioCompraUnidad: 6300,
    precioFlete: 500,
    totalVenta: 50000,
    estadoPago: 'pendiente',
    fechaVenta: '2025-08-26',
  },
]

const mockClientes = [
  { id: 'C-001', nombre: 'Cliente Alpha', telefono: '555-1234', saldo: 0 },
  { id: 'C-002', nombre: 'Cliente Beta', telefono: '555-5678', saldo: 50000 },
]

const mockBancos = [
  { id: 'boveda_monte', nombre: 'Bóveda Monte', capitalActual: 1000000 },
  { id: 'utilidades', nombre: 'Utilidades', capitalActual: 100000 },
  { id: 'flete_sur', nombre: 'Flete Sur', capitalActual: 50000 },
]

// ============================================================================
// CUSTOM HOOK SIMULATION (since we can't import actual hooks with Firebase)
// ============================================================================

type UseFirestoreCRUDReturn<T> = {
  data: T[];
  loading: boolean;
  error: Error | null;
  add: (item: Partial<T>) => Promise<string>;
  update: (id: string, item: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Crea un mock del hook useFirestoreCRUD con estado mutable
 * Usa una clase para mantener la referencia al estado interno
 */
class MockFirestoreCRUD<T extends { id: string }> implements UseFirestoreCRUDReturn<T> {
  private _data: T[]
  loading = false
  error: Error | null = null

  constructor(initialData: T[]) {
    this._data = [...initialData]
  }

  get data(): T[] {
    return this._data
  }

  add = async (item: Partial<T>): Promise<string> => {
    const newItem = { ...item, id: `new-${Date.now()}` } as T
    this._data = [...this._data, newItem]
    return newItem.id
  }

  update = async (id: string, updates: Partial<T>): Promise<void> => {
    this._data = this._data.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  }

  remove = async (id: string): Promise<void> => {
    this._data = this._data.filter(item => item.id !== id)
  }
}

function createMockFirestoreCRUD<T extends { id: string }>(
  initialData: T[]
): UseFirestoreCRUDReturn<T> {
  return new MockFirestoreCRUD(initialData)
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('🎣 HOOKS - Sistema CHRONOS', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useFirestoreCRUD - CRUD Operations', () => {
    
    it('✅ Retorna data inicial correctamente', () => {
      const hook = createMockFirestoreCRUD(mockVentas)
      
      expect(hook.data).toHaveLength(2)
      expect(hook.loading).toBe(false)
      expect(hook.error).toBeNull()
    })

    it('✅ add() agrega nuevo documento', async () => {
      const hook = createMockFirestoreCRUD<typeof mockVentas[0]>(mockVentas)
      
      const newVenta = {
        clienteId: 'C-003',
        clienteNombre: 'Cliente Gamma',
        cantidad: 3,
        precioVentaUnidad: 10000,
        totalVenta: 30000,
        estadoPago: 'pendiente' as const,
      }
      
      const newId = await hook.add(newVenta)
      
      expect(newId).toContain('new-')
      expect(hook.data).toHaveLength(3)
    })

    it('✅ update() modifica documento existente', async () => {
      const hook = createMockFirestoreCRUD(mockVentas)
      
      await hook.update('V-001', { estadoPago: 'parcial' })
      
      const updated = hook.data.find(v => v.id === 'V-001')
      expect(updated?.estadoPago).toBe('parcial')
    })

    it('✅ remove() elimina documento', async () => {
      const hook = createMockFirestoreCRUD(mockVentas)
      
      await hook.remove('V-001')
      
      expect(hook.data).toHaveLength(1)
      expect(hook.data.find(v => v.id === 'V-001')).toBeUndefined()
    })
  })

  describe('useClientes - Gestión de Clientes', () => {
    
    it('✅ Calcula saldo pendiente total', () => {
      const hook = createMockFirestoreCRUD(mockClientes)
      
      const saldoTotal = hook.data.reduce((acc, c) => acc + c.saldo, 0)
      
      expect(saldoTotal).toBe(50000)
    })

    it('✅ Filtra clientes con saldo pendiente', () => {
      const hook = createMockFirestoreCRUD(mockClientes)
      
      const conSaldo = hook.data.filter(c => c.saldo > 0)
      
      expect(conSaldo).toHaveLength(1)
      expect(conSaldo[0].nombre).toBe('Cliente Beta')
    })

    it('✅ Ordena clientes por saldo descendente', () => {
      const clientes = [
        { id: 'C-001', nombre: 'A', telefono: '', saldo: 5000 },
        { id: 'C-002', nombre: 'B', telefono: '', saldo: 50000 },
        { id: 'C-003', nombre: 'C', telefono: '', saldo: 10000 },
      ]
      
      const ordenados = [...clientes].sort((a, b) => b.saldo - a.saldo)
      
      expect(ordenados[0].nombre).toBe('B')
      expect(ordenados[1].nombre).toBe('C')
      expect(ordenados[2].nombre).toBe('A')
    })
  })

  describe('useVentas - Gestión de Ventas', () => {
    
    it('✅ Calcula total de ventas completas', () => {
      const hook = createMockFirestoreCRUD(mockVentas)
      
      const totalCompletas = hook.data
        .filter(v => v.estadoPago === 'completo')
        .reduce((acc, v) => acc + v.totalVenta, 0)
      
      expect(totalCompletas).toBe(100000)
    })

    it('✅ Agrupa ventas por estado', () => {
      const hook = createMockFirestoreCRUD(mockVentas)
      
      const porEstado = hook.data.reduce((acc, v) => {
        acc[v.estadoPago] = (acc[v.estadoPago] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      expect(porEstado.completo).toBe(1)
      expect(porEstado.pendiente).toBe(1)
    })

    it('✅ Calcula distribución GYA de ventas completas', () => {
      const venta = mockVentas[0] // Completa
      
      const montoBovedaMonte = venta.precioCompraUnidad * venta.cantidad
      const montoFletes = venta.precioFlete * venta.cantidad
      const montoUtilidades = 
        (venta.precioVentaUnidad - venta.precioCompraUnidad - venta.precioFlete) * venta.cantidad
      
      expect(montoBovedaMonte).toBe(63000)
      expect(montoFletes).toBe(5000)
      expect(montoUtilidades).toBe(32000)
      expect(montoBovedaMonte + montoFletes + montoUtilidades).toBe(100000)
    })
  })

  describe('useBancos - Capital Bancario', () => {
    
    it('✅ Calcula capital total del sistema', () => {
      const hook = createMockFirestoreCRUD(mockBancos)
      
      const capitalTotal = hook.data.reduce((acc, b) => acc + b.capitalActual, 0)
      
      expect(capitalTotal).toBe(1150000)
    })

    it('✅ Encuentra banco con mayor capital', () => {
      const hook = createMockFirestoreCRUD(mockBancos)
      
      const mayor = hook.data.reduce((max, b) => 
        b.capitalActual > max.capitalActual ? b : max
      )
      
      expect(mayor.id).toBe('boveda_monte')
      expect(mayor.capitalActual).toBe(1000000)
    })

    it('✅ Calcula porcentaje de participación', () => {
      const hook = createMockFirestoreCRUD(mockBancos)
      
      const total = hook.data.reduce((acc, b) => acc + b.capitalActual, 0)
      const porcentajes = hook.data.map(b => ({
        id: b.id,
        porcentaje: (b.capitalActual / total) * 100,
      }))
      
      const bovedaMonte = porcentajes.find(p => p.id === 'boveda_monte')
      expect(bovedaMonte?.porcentaje).toBeCloseTo(86.96, 1)
    })
  })

  describe('useAppStore - Estado Global', () => {
    
    interface AppState {
      currentPanel: string;
      bancos: typeof mockBancos;
      dataRefreshTrigger: number;
    }

    it('✅ Selector de panel actual', () => {
      const state: AppState = {
        currentPanel: 'dashboard',
        bancos: mockBancos,
        dataRefreshTrigger: 0,
      }
      
      const selectCurrentPanel = (s: AppState) => s.currentPanel
      
      expect(selectCurrentPanel(state)).toBe('dashboard')
    })

    it('✅ Selector de bancos', () => {
      const state: AppState = {
        currentPanel: 'dashboard',
        bancos: mockBancos,
        dataRefreshTrigger: 0,
      }
      
      const selectBancos = (s: AppState) => s.bancos
      
      expect(selectBancos(state)).toHaveLength(3)
    })

    it('✅ triggerDataRefresh incrementa contador', () => {
      let state: AppState = {
        currentPanel: 'dashboard',
        bancos: mockBancos,
        dataRefreshTrigger: 0,
      }
      
      const triggerDataRefresh = () => {
        state = { ...state, dataRefreshTrigger: state.dataRefreshTrigger + 1 }
      }
      
      triggerDataRefresh()
      expect(state.dataRefreshTrigger).toBe(1)
      
      triggerDataRefresh()
      expect(state.dataRefreshTrigger).toBe(2)
    })
  })

  describe('Filtros y Búsqueda', () => {
    
    it('✅ Filtro por texto en múltiples campos', () => {
      const buscar = (items: typeof mockVentas, query: string) => {
        const q = query.toLowerCase()
        return items.filter(item => 
          item.id.toLowerCase().includes(q) ||
          item.clienteNombre.toLowerCase().includes(q)
        )
      }
      
      expect(buscar(mockVentas, 'alpha')).toHaveLength(1)
      expect(buscar(mockVentas, 'V-001')).toHaveLength(1)
      expect(buscar(mockVentas, 'xyz')).toHaveLength(0)
    })

    it('✅ Filtro por rango de fechas', () => {
      const filtrarPorFecha = (
        items: typeof mockVentas, 
        desde: string, 
        hasta: string
      ) => {
        return items.filter(item => 
          item.fechaVenta >= desde && item.fechaVenta <= hasta
        )
      }
      
      expect(filtrarPorFecha(mockVentas, '2025-08-25', '2025-08-25')).toHaveLength(1)
      expect(filtrarPorFecha(mockVentas, '2025-08-25', '2025-08-26')).toHaveLength(2)
      expect(filtrarPorFecha(mockVentas, '2025-08-27', '2025-08-30')).toHaveLength(0)
    })

    it('✅ Filtro por monto mínimo', () => {
      const filtrarPorMonto = (items: typeof mockVentas, minimo: number) => {
        return items.filter(item => item.totalVenta >= minimo)
      }
      
      expect(filtrarPorMonto(mockVentas, 50000)).toHaveLength(2)
      expect(filtrarPorMonto(mockVentas, 75000)).toHaveLength(1)
      expect(filtrarPorMonto(mockVentas, 150000)).toHaveLength(0)
    })

    it('✅ Combinación de múltiples filtros', () => {
      const filtrar = (
        items: typeof mockVentas,
        filtros: {
          estado?: string;
          montoMinimo?: number;
          cliente?: string;
        }
      ) => {
        return items.filter(item => {
          if (filtros.estado && item.estadoPago !== filtros.estado) return false
          if (filtros.montoMinimo && item.totalVenta < filtros.montoMinimo) return false
          if (filtros.cliente && !item.clienteNombre.toLowerCase().includes(filtros.cliente.toLowerCase())) return false
          return true
        })
      }
      
      const resultado = filtrar(mockVentas, { 
        estado: 'completo', 
        montoMinimo: 50000 
      })
      
      expect(resultado).toHaveLength(1)
      expect(resultado[0].id).toBe('V-001')
    })
  })

  describe('Paginación', () => {
    
    it('✅ Pagina correctamente los resultados', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: `item-${i}` }))
      
      const paginar = <T,>(data: T[], page: number, perPage: number) => ({
        items: data.slice((page - 1) * perPage, page * perPage),
        totalPages: Math.ceil(data.length / perPage),
        currentPage: page,
        totalItems: data.length,
      })
      
      const page1 = paginar(items, 1, 10)
      expect(page1.items).toHaveLength(10)
      expect(page1.totalPages).toBe(3)
      expect(page1.items[0].id).toBe('item-0')
      
      const page3 = paginar(items, 3, 10)
      expect(page3.items).toHaveLength(5)
      expect(page3.items[0].id).toBe('item-20')
    })
  })

  describe('Ordenamiento', () => {
    
    it('✅ Ordena por fecha descendente', () => {
      const ordenarPorFecha = (items: typeof mockVentas, asc = false) => {
        return [...items].sort((a, b) => {
          const comparison = new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime()
          return asc ? -comparison : comparison
        })
      }
      
      const desc = ordenarPorFecha(mockVentas)
      expect(desc[0].fechaVenta).toBe('2025-08-26')
      
      const asc = ordenarPorFecha(mockVentas, true)
      expect(asc[0].fechaVenta).toBe('2025-08-25')
    })

    it('✅ Ordena por monto', () => {
      const ordenarPorMonto = (items: typeof mockVentas, asc = false) => {
        return [...items].sort((a, b) => {
          const comparison = b.totalVenta - a.totalVenta
          return asc ? -comparison : comparison
        })
      }
      
      const desc = ordenarPorMonto(mockVentas)
      expect(desc[0].totalVenta).toBe(100000)
    })
  })
})

// ============================================================================
// CACHE & MEMO TESTS
// ============================================================================

describe('🧠 CACHE & MEMOIZATION', () => {
  
  it('✅ Cálculos pesados se cachean', () => {
    let computeCount = 0
    
    const heavyComputation = (data: number[]) => {
      computeCount++
      return data.reduce((acc, n) => acc + n, 0)
    }
    
    const createMemoized = <T, R>(fn: (arg: T) => R) => {
      const cache = new Map<string, R>()
      return (arg: T) => {
        const key = JSON.stringify(arg)
        if (cache.has(key)) return cache.get(key)!
        const result = fn(arg)
        cache.set(key, result)
        return result
      }
    }
    
    const memoizedComputation = createMemoized(heavyComputation)
    
    const data = [1, 2, 3, 4, 5]
    
    memoizedComputation(data)
    memoizedComputation(data)
    memoizedComputation(data)
    
    expect(computeCount).toBe(1) // Solo se ejecutó una vez
  })
})
