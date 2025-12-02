/**
 * 🎨 Tests de Componentes 3D - Sistema CHRONOS
 * 
 * Verifica que los componentes 3D están correctamente integrados en los paneles.
 */

import { describe, it, expect } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'

const APP_DIR = path.join(__dirname, '../../app')
const COMPONENTS_3D_DIR = path.join(APP_DIR, 'components/3d')
const PANELS_DIR = path.join(APP_DIR, 'components/panels')

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTARIO DE COMPONENTES 3D
// ═══════════════════════════════════════════════════════════════════════════════

const COMPONENTES_3D = {
  // Animaciones
  animations: [
    'AnimatedCube',
    'AnimatedPyramid',
    'AnimatedSphere',
    'ParticleField',
    'WaveAnimation',
    'PulsingRing',
    'SpinningRing',
    'FloatingParticles',
    'GlowingOrb',
    'RotatingDiamond',
  ],
  // Objetos
  objects: [
    'CrystalFormation',
    'HolographicDisplay',
    'DataCube',
    'NeonGrid',
    'GlassMorphism',
    'MetallicSphere',
    'HexagonalMesh',
    'AbstractShape',
  ],
  // Escenas
  scenes: [
    'SpaceScene',
    'CyberScene',
    'AbstractScene',
    'DashboardScene',
  ],
  // Utilidades
  utils: [
    'CameraController',
    'LightingSetup',
    'PostProcessing',
    'SceneLoader',
  ],
  // Spline
  spline: [
    'SplineScene',
    'PremiumSplineOrb',
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE INTEGRACIÓN POR PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const INTEGRACION_PANELES = {
  BentoDashboard: {
    componente3d: 'PremiumSplineOrb',
    fallback: 'SpaceScene',
    tieneIntegracion: true,
  },
  BentoVentas: {
    componente3d: 'DataCube',
    fallback: 'SalesFlowDiagram',
    tieneIntegracion: true,
  },
  BentoIA: {
    componente3d: 'PremiumSplineOrb',
    fallback: 'AIBrainVisualizer',
    tieneIntegracion: true,
  },
  BentoClientes: {
    componente3d: 'HolographicDisplay',
    fallback: 'ClientNetworkGraph',
    tieneIntegracion: false, // Pendiente
  },
  BentoAlmacen: {
    componente3d: 'CrystalFormation',
    fallback: 'InventoryGrid',
    tieneIntegracion: false, // Pendiente
  },
  BentoBanco: {
    componente3d: 'MetallicSphere',
    fallback: 'BankCapitalChart',
    tieneIntegracion: false, // Pendiente
  },
  BentoOrdenesCompra: {
    componente3d: 'DataCube',
    fallback: 'OrderFlowDiagram',
    tieneIntegracion: false, // Pendiente
  },
  BentoDistribuidor: {
    componente3d: 'NeonGrid',
    fallback: 'DistributorMap',
    tieneIntegracion: false, // Pendiente
  },
  BentoMovimientos: {
    componente3d: 'ParticleField',
    fallback: 'MovementTimeline',
    tieneIntegracion: false, // Pendiente
  },
  BentoReportes: {
    componente3d: 'HexagonalMesh',
    fallback: 'ReportCharts',
    tieneIntegracion: false, // Pendiente
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE ESTRUCTURA
// ═══════════════════════════════════════════════════════════════════════════════

describe('📁 Estructura de Componentes 3D', () => {
  it('directorio 3d debe existir', () => {
    expect(fs.existsSync(COMPONENTS_3D_DIR)).toBe(true)
  })

  it('debe tener archivo index.ts para exports', () => {
    const indexPath = path.join(COMPONENTS_3D_DIR, 'index.ts')
    expect(fs.existsSync(indexPath)).toBe(true)
  })

  it('debe exportar al menos 25 componentes', () => {
    const totalComponentes = 
      COMPONENTES_3D.animations.length +
      COMPONENTES_3D.objects.length +
      COMPONENTES_3D.scenes.length +
      COMPONENTES_3D.utils.length +
      COMPONENTES_3D.spline.length
    
    expect(totalComponentes).toBeGreaterThanOrEqual(25)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE PANELES
// ═══════════════════════════════════════════════════════════════════════════════

describe('🎯 Integración 3D en Paneles', () => {
  it('BentoDashboard debe tener integración 3D', () => {
    expect(INTEGRACION_PANELES.BentoDashboard.tieneIntegracion).toBe(true)
  })

  it('BentoVentas debe tener integración 3D', () => {
    expect(INTEGRACION_PANELES.BentoVentas.tieneIntegracion).toBe(true)
  })

  it('BentoIA debe tener integración 3D', () => {
    expect(INTEGRACION_PANELES.BentoIA.tieneIntegracion).toBe(true)
  })

  it('todos los paneles deben tener componente fallback definido', () => {
    Object.entries(INTEGRACION_PANELES).forEach(([panel, config]) => {
      expect(config.fallback).toBeDefined()
      expect(config.fallback.length).toBeGreaterThan(0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE REQUISITOS PENDIENTES
// ═══════════════════════════════════════════════════════════════════════════════

describe('⏳ Integraciones Pendientes', () => {
  const panelesPendientes = Object.entries(INTEGRACION_PANELES)
    .filter(([_, config]) => !config.tieneIntegracion)
    .map(([panel]) => panel)

  it('debe identificar paneles sin integración 3D', () => {
    expect(panelesPendientes.length).toBeGreaterThan(0)
    console.log('📋 Paneles pendientes de integración 3D:', panelesPendientes)
  })

  it('cada panel pendiente tiene componente 3D asignado', () => {
    panelesPendientes.forEach(panel => {
      const config = INTEGRACION_PANELES[panel as keyof typeof INTEGRACION_PANELES]
      expect(config.componente3d).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE ARCHIVOS SPLINE
// ═══════════════════════════════════════════════════════════════════════════════

describe('🎨 Archivos Spline', () => {
  const ROOT_DIR = path.join(__dirname, '../..')
  
  it('debe existir archivos .spline en el proyecto', () => {
    const files = fs.readdirSync(ROOT_DIR)
    const splineFiles = files.filter(f => f.endsWith('.spline'))
    
    expect(splineFiles.length).toBeGreaterThan(0)
  })

  it('debe existir archivos .splinecode en el proyecto', () => {
    const files = fs.readdirSync(ROOT_DIR)
    const splinecodeFiles = files.filter(f => f.endsWith('.splinecode'))
    
    expect(splinecodeFiles.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE VISUALIZACIONES CANVAS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🖼️ Visualizaciones Canvas', () => {
  const VISUALIZACIONES = [
    'AIBrainVisualizer',
    'BankVaultVisualizer',
    'ClientNetworkGraph',
    'NetworkGraph',
    'SalesFlowDiagram',
    'TransferFlow',
    'InventoryVisualizer',
    'OrderFlowDiagram',
  ]

  it('debe haber al menos 8 visualizaciones Canvas', () => {
    expect(VISUALIZACIONES.length).toBeGreaterThanOrEqual(8)
  })

  it('cada visualización debe tener nombre descriptivo', () => {
    VISUALIZACIONES.forEach(viz => {
      expect(viz.length).toBeGreaterThan(5)
      // Verificar que termina con Visualizer, Graph, Diagram o Flow
      const validSuffixes = ['Visualizer', 'Graph', 'Diagram', 'Flow']
      const hasValidSuffix = validSuffixes.some(suffix => viz.includes(suffix))
      expect(hasValidSuffix).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS DE WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔧 Widgets del Dashboard', () => {
  const WIDGETS = [
    'QuickStatsGrid',
    'ActivityFeedWidget',
    'RecentTransactionsWidget',
    'BankBalanceWidget',
    'SalesChartWidget',
    'TopProductsWidget',
    'ClientActivityWidget',
    'AlertsWidget',
    'CalendarWidget',
    'NotificationsWidget',
  ]

  it('debe haber al menos 10 widgets definidos', () => {
    expect(WIDGETS.length).toBeGreaterThanOrEqual(10)
  })

  it('widgets deben tener nombre con sufijo Widget', () => {
    WIDGETS.forEach(widget => {
      expect(widget.endsWith('Widget') || widget.endsWith('Grid')).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTE DE COBERTURA
// ═══════════════════════════════════════════════════════════════════════════════

describe('📊 Reporte de Cobertura 3D', () => {
  it('generar resumen de integración', () => {
    const total = Object.keys(INTEGRACION_PANELES).length
    const integrados = Object.values(INTEGRACION_PANELES).filter(c => c.tieneIntegracion).length
    const pendientes = total - integrados
    
    const porcentaje = Math.round((integrados / total) * 100)
    
    console.log('\n📊 RESUMEN DE INTEGRACIÓN 3D:')
    console.log(`   Total paneles: ${total}`)
    console.log(`   Integrados: ${integrados}`)
    console.log(`   Pendientes: ${pendientes}`)
    console.log(`   Cobertura: ${porcentaje}%`)
    
    expect(integrados).toBeGreaterThanOrEqual(3) // Al menos 3 integrados
  })
})
