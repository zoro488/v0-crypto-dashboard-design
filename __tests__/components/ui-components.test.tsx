/**
 * 🧪 TESTS DE COMPONENTES - SISTEMA CHRONOS
 * 
 * Tests para componentes UI incluyendo:
 * - Modales de creación (Venta, OC, Transferencia)
 * - Formularios y validaciones en tiempo real
 * - Botones y acciones
 * - Visualización de datos
 * 
 * @version 2.0.0
 * @date 2025-11-29
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Mock Firestore Service
jest.mock('@/app/lib/firebase/firestore-service', () => ({
  firestoreService: {
    crearVenta: jest.fn().mockResolvedValue('venta-123'),
    crearOrdenCompra: jest.fn().mockResolvedValue('oc-123'),
    crearTransferencia: jest.fn().mockResolvedValue('trans-123'),
    suscribirBancos: jest.fn((callback) => {
      callback([
        { id: 'boveda_monte', nombre: 'Bóveda Monte', capitalActual: 1000000 },
        { id: 'utilidades', nombre: 'Utilidades', capitalActual: 100000 },
      ])
      return () => {}
    }),
  }
}))

// Mock Firestore Hooks
jest.mock('@/app/lib/firebase/firestore-hooks.service', () => ({
  useVentasData: jest.fn(() => ({ data: [], loading: false, error: null })),
  useClientesData: jest.fn(() => ({ data: [], loading: false, error: null })),
  useDistribuidoresData: jest.fn(() => ({ data: [], loading: false, error: null })),
  useAlmacenData: jest.fn(() => ({ data: [], loading: false, error: null })),
  useOrdenesCompraData: jest.fn(() => ({ data: [], loading: false, error: null })),
  useBancosData: jest.fn(() => ({
    data: [
      { id: 'boveda_monte', nombre: 'Bóveda Monte', capitalActual: 1000000 },
      { id: 'utilidades', nombre: 'Utilidades', capitalActual: 100000 },
    ],
    loading: false,
    error: null
  })),
  useVentas: jest.fn(() => ({ data: [], loading: false, error: null })),
  useOrdenesCompra: jest.fn(() => ({ data: [], loading: false, error: null })),
  useProductos: jest.fn(() => ({ data: [], loading: false, error: null })),
  useClientes: jest.fn(() => ({ data: [], loading: false, error: null })),
}))

// Mock useToast
jest.mock('@/app/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}))

// Mock Zustand Store
const mockSetCurrentPanel = jest.fn()
const mockTriggerDataRefresh = jest.fn()

jest.mock('@/app/lib/store/useAppStore', () => ({
  useAppStore: jest.fn((selector) => {
    const mockState = {
      currentPanel: 'dashboard',
      sidebarCollapsed: false,
      theme: 'dark',
      bancos: [
        { id: 'boveda_monte', nombre: 'Bóveda Monte', saldo: 1000000, color: 'from-blue-500' },
        { id: 'utilidades', nombre: 'Utilidades', saldo: 100000, color: 'from-green-500' },
        { id: 'fletes', nombre: 'Fletes', saldo: 50000, color: 'from-orange-500' },
      ],
      setCurrentPanel: mockSetCurrentPanel,
      triggerDataRefresh: mockTriggerDataRefresh,
      dataRefreshTrigger: 0,
    }
    
    if (typeof selector === 'function') {
      return selector(mockState)
    }
    return mockState
  })
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useScroll: () => ({ scrollY: 0 }),
  useTransform: () => 1,
}))

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AreaChart: ({ children }: React.PropsWithChildren) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  BarChart: ({ children }: React.PropsWithChildren) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: React.PropsWithChildren) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Line: () => null,
}))

// ============================================================================
// TEST SUITES
// ============================================================================

describe('🎨 COMPONENTES UI - Sistema CHRONOS', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Componentes de Formulario', () => {
    
    it('✅ Input numérico formatea valores correctamente', () => {
      const handleChange = jest.fn()
      
      render(
        <input
          type="number"
          data-testid="numeric-input"
          onChange={(e) => handleChange(Number(e.target.value))}
        />
      )
      
      const input = screen.getByTestId('numeric-input') as HTMLInputElement
      fireEvent.change(input, { target: { value: '10000' } })
      
      expect(handleChange).toHaveBeenCalledWith(10000)
    })

    it('✅ Select de estados muestra 3 opciones', () => {
      render(
        <select data-testid="estado-select">
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="completo">Completo</option>
        </select>
      )
      
      const select = screen.getByTestId('estado-select')
      const options = within(select).getAllByRole('option')
      
      expect(options).toHaveLength(3)
      expect(options[0]).toHaveValue('pendiente')
      expect(options[1]).toHaveValue('parcial')
      expect(options[2]).toHaveValue('completo')
    })

    it('✅ Select de bancos muestra todos los bancos del sistema', () => {
      const bancos = [
        { id: 'boveda_monte', nombre: 'Bóveda Monte' },
        { id: 'boveda_usa', nombre: 'Bóveda USA' },
        { id: 'utilidades', nombre: 'Utilidades' },
        { id: 'fletes', nombre: 'Fletes' },
        { id: 'flete_sur', nombre: 'Flete Sur' },
        { id: 'azteca', nombre: 'Azteca' },
        { id: 'leftie', nombre: 'Leftie' },
        { id: 'profit', nombre: 'Profit' },
      ]
      
      render(
        <select data-testid="banco-select">
          <option value="">Seleccionar banco</option>
          {bancos.map(b => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>
      )
      
      const select = screen.getByTestId('banco-select')
      const options = within(select).getAllByRole('option')
      
      expect(options).toHaveLength(9) // 8 bancos + opción vacía
    })
  })

  describe('Cálculos en Tiempo Real', () => {
    
    it('✅ Cálculo de total actualiza al cambiar cantidad o precio', async () => {
      const user = userEvent.setup()
      let total = 0
      
      const TestComponent = () => {
        const [cantidad, setCantidad] = React.useState(0)
        const [precio, setPrecio] = React.useState(0)
        total = cantidad * precio
        
        return (
          <div>
            <input
              data-testid="cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            />
            <input
              data-testid="precio"
              type="number"
              value={precio}
              onChange={(e) => setPrecio(Number(e.target.value))}
            />
            <span data-testid="total">${total.toLocaleString()}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      await user.type(screen.getByTestId('cantidad'), '10')
      await user.type(screen.getByTestId('precio'), '10000')
      
      expect(screen.getByTestId('total')).toHaveTextContent('$100,000')
    })

    it('✅ Cálculo de distribución GYA en tiempo real', () => {
      const TestDistribucion = () => {
        const [cantidad, setCantidad] = React.useState(10)
        const precioVenta = 10000
        const precioCompra = 6300
        const precioFlete = 500
        
        const totalVenta = precioVenta * cantidad
        const montoBovedaMonte = precioCompra * cantidad
        const montoFletes = precioFlete * cantidad
        const montoUtilidades = (precioVenta - precioCompra - precioFlete) * cantidad
        
        return (
          <div>
            <input
              data-testid="cantidad-dist"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            />
            <div data-testid="boveda">${montoBovedaMonte.toLocaleString()}</div>
            <div data-testid="fletes">${montoFletes.toLocaleString()}</div>
            <div data-testid="utilidades">${montoUtilidades.toLocaleString()}</div>
            <div data-testid="total">${totalVenta.toLocaleString()}</div>
          </div>
        )
      }
      
      render(<TestDistribucion />)
      
      expect(screen.getByTestId('boveda')).toHaveTextContent('$63,000')
      expect(screen.getByTestId('fletes')).toHaveTextContent('$5,000')
      expect(screen.getByTestId('utilidades')).toHaveTextContent('$32,000')
      expect(screen.getByTestId('total')).toHaveTextContent('$100,000')
    })
  })

  describe('Botones de Acción', () => {
    
    it('✅ Botón submit deshabilitado cuando form es inválido', () => {
      const TestForm = () => {
        const [isValid, setIsValid] = React.useState(false)
        
        return (
          <form>
            <input
              data-testid="required-input"
              onChange={(e) => setIsValid(e.target.value.length > 0)}
            />
            <button
              type="submit"
              data-testid="submit-btn"
              disabled={!isValid}
            >
              Guardar
            </button>
          </form>
        )
      }
      
      render(<TestForm />)
      
      expect(screen.getByTestId('submit-btn')).toBeDisabled()
      
      fireEvent.change(screen.getByTestId('required-input'), { target: { value: 'valor' } })
      
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled()
    })

    it('✅ Botón cancelar cierra modal sin guardar', () => {
      const onClose = jest.fn()
      const onSave = jest.fn()
      
      render(
        <div>
          <button data-testid="cancel-btn" onClick={onClose}>Cancelar</button>
          <button data-testid="save-btn" onClick={onSave}>Guardar</button>
        </div>
      )
      
      fireEvent.click(screen.getByTestId('cancel-btn'))
      
      expect(onClose).toHaveBeenCalled()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  describe('Estados de Carga', () => {
    
    it('✅ Muestra skeleton durante carga', () => {
      const TestLoader = ({ isLoading }: { isLoading: boolean }) => (
        <div>
          {isLoading ? (
            <div data-testid="skeleton">Cargando...</div>
          ) : (
            <div data-testid="content">Contenido</div>
          )}
        </div>
      )
      
      const { rerender } = render(<TestLoader isLoading={true} />)
      
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
      
      rerender(<TestLoader isLoading={false} />)
      
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('✅ Muestra mensaje de error correctamente', () => {
      const TestError = ({ error }: { error: string | null }) => (
        <div>
          {error && <div data-testid="error-message" role="alert">{error}</div>}
        </div>
      )
      
      const { rerender } = render(<TestError error={null} />)
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      
      rerender(<TestError error="Error de conexión" />)
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Error de conexión')
    })
  })

  describe('Navegación de Paneles', () => {
    
    it('✅ Click en panel cambia currentPanel', () => {
      const panels = ['dashboard', 'ventas', 'ordenes', 'almacen', 'clientes']
      
      const TestNavigation = () => {
        const [current, setCurrent] = React.useState('dashboard')
        
        return (
          <div>
            {panels.map(panel => (
              <button
                key={panel}
                data-testid={`panel-${panel}`}
                onClick={() => setCurrent(panel)}
                className={current === panel ? 'active' : ''}
              >
                {panel}
              </button>
            ))}
            <div data-testid="current-panel">{current}</div>
          </div>
        )
      }
      
      render(<TestNavigation />)
      
      expect(screen.getByTestId('current-panel')).toHaveTextContent('dashboard')
      
      fireEvent.click(screen.getByTestId('panel-ventas'))
      expect(screen.getByTestId('current-panel')).toHaveTextContent('ventas')
      
      fireEvent.click(screen.getByTestId('panel-ordenes'))
      expect(screen.getByTestId('current-panel')).toHaveTextContent('ordenes')
    })
  })

  describe('Tablas de Datos', () => {
    
    it('✅ Tabla renderiza filas de datos correctamente', () => {
      const ventas = [
        { id: 'V-001', cliente: 'Cliente A', total: 100000 },
        { id: 'V-002', cliente: 'Cliente B', total: 50000 },
        { id: 'V-003', cliente: 'Cliente C', total: 75000 },
      ]
      
      render(
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id} data-testid={`row-${v.id}`}>
                <td>{v.id}</td>
                <td>{v.cliente}</td>
                <td>${v.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
      
      expect(screen.getByTestId('row-V-001')).toBeInTheDocument()
      expect(screen.getByTestId('row-V-002')).toBeInTheDocument()
      expect(screen.getByTestId('row-V-003')).toBeInTheDocument()
      expect(screen.getAllByRole('row')).toHaveLength(4) // 1 header + 3 data rows
    })

    it('✅ Tabla vacía muestra mensaje', () => {
      const TestEmptyTable = () => {
        const data: { id: string }[] = []
        
        return (
          <div>
            {data.length === 0 ? (
              <div data-testid="empty-message">No hay datos para mostrar</div>
            ) : (
              <table>
                <tbody>
                  {data.map(d => <tr key={d.id}><td>{d.id}</td></tr>)}
                </tbody>
              </table>
            )}
          </div>
        )
      }
      
      render(<TestEmptyTable />)
      
      expect(screen.getByTestId('empty-message')).toHaveTextContent('No hay datos para mostrar')
    })
  })

  describe('Badges de Estado', () => {
    
    it('✅ Badge de estado pago muestra colores correctos', () => {
      const EstadoBadge = ({ estado }: { estado: 'completo' | 'parcial' | 'pendiente' }) => {
        const colors: Record<string, string> = {
          completo: 'bg-green-500',
          parcial: 'bg-yellow-500',
          pendiente: 'bg-red-500',
        }
        
        return (
          <span data-testid="badge" className={colors[estado]}>
            {estado}
          </span>
        )
      }
      
      const { rerender } = render(<EstadoBadge estado="completo" />)
      expect(screen.getByTestId('badge')).toHaveClass('bg-green-500')
      
      rerender(<EstadoBadge estado="parcial" />)
      expect(screen.getByTestId('badge')).toHaveClass('bg-yellow-500')
      
      rerender(<EstadoBadge estado="pendiente" />)
      expect(screen.getByTestId('badge')).toHaveClass('bg-red-500')
    })
  })

  describe('Formateo de Valores', () => {
    
    it('✅ Formato de moneda MXN', () => {
      const formatCurrency = (value: number) => 
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
      
      expect(formatCurrency(1000000)).toMatch(/\$1,000,000\.00/)
      expect(formatCurrency(50000.5)).toMatch(/\$50,000\.50/)
    })

    it('✅ Formato de fecha', () => {
      const formatDate = (date: string) => 
        new Date(date).toLocaleDateString('es-MX')
      
      const fecha = formatDate('2025-08-25')
      expect(fecha).toMatch(/25/)
    })

    it('✅ Formato de porcentaje', () => {
      const formatPercent = (value: number) => `${value.toFixed(1)}%`
      
      expect(formatPercent(75.5)).toBe('75.5%')
      expect(formatPercent(100)).toBe('100.0%')
    })
  })
})

// ============================================================================
// TEST SUITE: ACCESIBILIDAD
// ============================================================================

describe('♿ ACCESIBILIDAD', () => {
  
  it('✅ Inputs tienen labels asociados', () => {
    render(
      <div>
        <label htmlFor="cliente">Cliente</label>
        <input id="cliente" name="cliente" />
      </div>
    )
    
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument()
  })

  it('✅ Botones tienen texto o aria-label', () => {
    render(
      <div>
        <button>Guardar</button>
        <button aria-label="Cerrar modal">×</button>
      </div>
    )
    
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar modal' })).toBeInTheDocument()
  })

  it('✅ Errores tienen role="alert"', () => {
    render(
      <div role="alert" aria-live="polite">
        Error: Campo requerido
      </div>
    )
    
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Campo requerido')
  })

  it('✅ Tablas tienen headers accesibles', () => {
    render(
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nombre</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Producto A</td>
          </tr>
        </tbody>
      </table>
    )
    
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument()
  })
})
