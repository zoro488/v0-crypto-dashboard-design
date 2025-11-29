/**
 * 🧪 TESTS UNITARIOS - STORE
 * 
 * Tests para el store Zustand de la aplicación
 * Con mocks para Firebase
 */

// Mock Firebase antes de importar el store
jest.mock('@/app/lib/firebase/config', () => ({
  db: null,
  auth: null,
  isFirebaseConfigured: false,
  isFirestoreAvailable: () => false,
  getFirestoreInstance: () => null,
}))

jest.mock('@/app/lib/firebase/firestore-service', () => ({
  firestoreService: {
    crearTransferencia: jest.fn().mockResolvedValue(true),
    getClientes: jest.fn().mockResolvedValue([]),
    getVentas: jest.fn().mockResolvedValue([]),
    getBancos: jest.fn().mockResolvedValue([]),
  },
}))

import { useAppStore } from '@/app/lib/store/useAppStore'
import '@testing-library/jest-dom'

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      currentPanel: 'dashboard',
      sidebarCollapsed: false,
      theme: 'dark',
    })
  })

  it('should initialize with default state', () => {
    const { currentPanel, sidebarCollapsed, theme } = useAppStore.getState()
    
    expect(currentPanel).toBe('dashboard')
    expect(sidebarCollapsed).toBe(false)
    expect(theme).toBe('dark')
  })

  it('should change current panel', () => {
    const { setCurrentPanel } = useAppStore.getState()
    
    setCurrentPanel('ventas')
    
    expect(useAppStore.getState().currentPanel).toBe('ventas')
  })

  it('should toggle sidebar', () => {
    const { toggleSidebar } = useAppStore.getState()
    
    toggleSidebar()
    expect(useAppStore.getState().sidebarCollapsed).toBe(true)
    
    toggleSidebar()
    expect(useAppStore.getState().sidebarCollapsed).toBe(false)
  })

  it('should change theme', () => {
    const { setTheme } = useAppStore.getState()
    
    setTheme('light')
    expect(useAppStore.getState().theme).toBe('light')
    
    setTheme('cyber')
    expect(useAppStore.getState().theme).toBe('cyber')
  })
})
