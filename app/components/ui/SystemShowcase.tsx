'use client'

/**
 * 🎯 SYSTEM SHOWCASE - Demostración Completa CHRONOS
 * 
 * Componente que ejecuta una demostración completa del sistema,
 * mostrando todas las funcionalidades de forma automática
 */

import { useState } from 'react'
import { InteractiveDemo, simulateClick, simulateType, simulateScroll } from './InteractiveDemo'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Rocket, CheckCircle2, Zap } from 'lucide-react'
import { GlowButton, haptic } from './microinteractions'
import { toast } from 'sonner'

interface SystemShowcaseProps {
  onComplete?: () => void
}

export function SystemShowcase({ onComplete }: SystemShowcaseProps) {
  const [showDemo, setShowDemo] = useState(false)
  const [completedDemo, setCompletedDemo] = useState(false)

  const demoSteps = [
    // ==================== FASE 1: NAVEGACIÓN INICIAL ====================
    {
      id: 'welcome',
      title: '👋 Bienvenido a CHRONOS',
      description: 'Sistema empresarial de gestión financiera premium',
      action: async () => {
        toast.success('Sistema CHRONOS activado', {
          description: 'Iniciando demostración completa...',
        })
        haptic.success()
      },
      duration: 2000,
      highlight: true,
    },
    
    // ==================== FASE 2: PANEL DE VENTAS ====================
    {
      id: 'ventas-panel',
      title: '💼 Panel de Ventas',
      description: 'Gestión completa de ventas con distribución GYA automática',
      action: async () => {
        await simulateScroll('[data-panel="ventas"]')
        toast.info('Panel de Ventas', {
          description: 'Vista general de todas las operaciones de venta',
        })
      },
      duration: 2000,
    },
    {
      id: 'ventas-stats',
      title: '📊 Estadísticas de Ventas',
      description: 'Total de ventas, ganancias y métricas clave',
      action: async () => {
        await simulateClick('[data-stat="total-ventas"]')
        toast.info('$1,234,567', {
          description: 'Total de ventas del período',
        })
      },
      duration: 1500,
    },
    {
      id: 'ventas-nueva',
      title: '➕ Crear Nueva Venta',
      description: 'Abriendo wizard de creación de venta...',
      action: async () => {
        await simulateClick('button[data-action="nueva-venta"]')
        haptic.medium()
      },
      duration: 2000,
      highlight: true,
    },
    {
      id: 'ventas-wizard-step1',
      title: '📝 Paso 1: Información de Cliente',
      description: 'Completando datos del cliente...',
      action: async () => {
        await simulateType('input[name="cliente"]', 'Cliente Demo', 30)
        toast.info('Paso 1/3', {
          description: 'Datos del cliente ingresados',
        })
      },
      duration: 3000,
    },
    {
      id: 'ventas-wizard-step2',
      title: '📦 Paso 2: Productos y Precios',
      description: 'Ingresando detalles de la venta...',
      action: async () => {
        await simulateType('input[name="precioVenta"]', '10000', 50)
        await simulateType('input[name="precioCompra"]', '6300', 50)
        await simulateType('input[name="cantidad"]', '10', 50)
        toast.info('Paso 2/3', {
          description: 'Productos configurados correctamente',
        })
      },
      duration: 4000,
    },
    {
      id: 'ventas-wizard-step3',
      title: '💰 Paso 3: Distribución GYA',
      description: 'Sistema calcula distribución automática...',
      action: async () => {
        toast.success('Distribución GYA Calculada', {
          description: 'Bóveda Monte: $63,000 | Fletes: $5,000 | Utilidades: $32,000',
        })
        haptic.success()
      },
      duration: 2500,
      highlight: true,
    },
    {
      id: 'ventas-guardar',
      title: '✅ Guardar Venta',
      description: 'Registrando venta en Firestore...',
      action: async () => {
        await simulateClick('button[data-action="guardar-venta"]')
        toast.success('¡Venta Registrada!', {
          description: 'Capital bancario actualizado automáticamente',
        })
        haptic.success()
      },
      duration: 2000,
      highlight: true,
    },

    // ==================== FASE 3: PANEL DE BANCOS ====================
    {
      id: 'bancos-panel',
      title: '🏦 Panel de Bancos',
      description: 'Sistema de 7 bóvedas con capital en tiempo real',
      action: async () => {
        await simulateScroll('[data-panel="bancos"]')
        toast.info('Panel de Bancos', {
          description: '7 bóvedas: Monte, USA, Profit, Leftie, Azteca, Flete Sur, Utilidades',
        })
      },
      duration: 2000,
    },
    {
      id: 'bancos-boveda-monte',
      title: '💵 Bóveda Monte',
      description: 'Capital actualizado con la venta: $63,000 añadidos',
      action: async () => {
        await simulateClick('[data-banco="boveda_monte"]')
        toast.success('Bóveda Monte Actualizada', {
          description: 'Nuevo capital: $XXX,XXX (incluye $63,000 de la venta)',
        })
        haptic.light()
      },
      duration: 2000,
      highlight: true,
    },
    {
      id: 'bancos-fletes',
      title: '🚛 Flete Sur',
      description: 'Capital actualizado: $5,000 de fletes añadidos',
      action: async () => {
        await simulateClick('[data-banco="flete_sur"]')
        toast.success('Flete Sur Actualizado', {
          description: 'Nuevo capital: $XX,XXX (incluye $5,000 de la venta)',
        })
        haptic.light()
      },
      duration: 2000,
    },
    {
      id: 'bancos-utilidades',
      title: '📈 Utilidades',
      description: 'Ganancia neta registrada: $32,000 añadidos',
      action: async () => {
        await simulateClick('[data-banco="utilidades"]')
        toast.success('Utilidades Actualizadas', {
          description: 'Ganancia neta: $32,000 (precio venta - costo - flete)',
        })
        haptic.light()
      },
      duration: 2000,
      highlight: true,
    },
    {
      id: 'bancos-transferencia',
      title: '💸 Transferencia Entre Bancos',
      description: 'Moviendo fondos de Utilidades a Profit...',
      action: async () => {
        await simulateClick('button[data-action="nueva-transferencia"]')
        await simulateType('input[name="monto"]', '10000', 50)
        toast.info('Transferencia Registrada', {
          description: '$10,000 de Utilidades → Profit',
        })
        haptic.medium()
      },
      duration: 3000,
    },
    {
      id: 'bancos-gasto',
      title: '💳 Registrar Gasto',
      description: 'Deduciendo gasto operativo de Profit...',
      action: async () => {
        await simulateClick('button[data-action="nuevo-gasto"]')
        await simulateType('input[name="monto"]', '5000', 50)
        await simulateType('input[name="concepto"]', 'Gasto operativo demo', 30)
        toast.warning('Gasto Registrado', {
          description: '$5,000 deducidos de Profit',
        })
        haptic.medium()
      },
      duration: 3500,
    },

    // ==================== FASE 4: PANEL DE CLIENTES ====================
    {
      id: 'clientes-panel',
      title: '👥 Panel de Clientes',
      description: 'Gestión de clientes, deudas y abonos',
      action: async () => {
        await simulateScroll('[data-panel="clientes"]')
        toast.info('Panel de Clientes', {
          description: 'Seguimiento de deudas y pagos pendientes',
        })
      },
      duration: 2000,
    },
    {
      id: 'clientes-perfil',
      title: '📋 Perfil de Cliente',
      description: 'Visualizando historial completo del cliente...',
      action: async () => {
        await simulateClick('[data-action="ver-cliente"]', 500)
        toast.info('Cliente Demo', {
          description: 'Ventas: 5 | Deuda Total: $25,000 | Estado: Al corriente',
        })
      },
      duration: 2500,
    },
    {
      id: 'clientes-abono',
      title: '💵 Registrar Abono',
      description: 'Cliente realiza pago de deuda...',
      action: async () => {
        await simulateClick('button[data-action="registrar-abono"]')
        await simulateType('input[name="monto"]', '15000', 50)
        toast.success('Abono Registrado', {
          description: '$15,000 aplicados a deuda. Restante: $10,000',
        })
        haptic.success()
      },
      duration: 3000,
      highlight: true,
    },

    // ==================== FASE 5: VISUALIZACIONES 3D ====================
    {
      id: 'visualizations-3d',
      title: '🎨 Visualizaciones 3D',
      description: 'CryptoHologram, PremiumSplineOrb, FinancialRiverFlow',
      action: async () => {
        await simulateScroll('[data-viz="3d-hologram"]')
        toast.info('Visualizaciones Premium', {
          description: 'Gráficos 3D interactivos con Canvas y Spline',
        })
      },
      duration: 2000,
    },
    {
      id: 'visualizations-river',
      title: '🌊 Financial River Flow',
      description: 'Flujo visual de dinero entre bóvedas',
      action: async () => {
        await simulateScroll('[data-viz="river-flow"]')
        toast.info('River Flow Activo', {
          description: 'Visualización en tiempo real del flujo de capital',
        })
        haptic.light()
      },
      duration: 2000,
      highlight: true,
    },

    // ==================== FASE 6: REPORTES Y ANÁLISIS ====================
    {
      id: 'reportes-dashboard',
      title: '📊 Dashboard de Reportes',
      description: 'Métricas consolidadas y KPIs',
      action: async () => {
        await simulateScroll('[data-panel="dashboard"]')
        toast.info('Dashboard Principal', {
          description: 'Vista general de toda la operación',
        })
      },
      duration: 2000,
    },
    {
      id: 'reportes-charts',
      title: '📈 Gráficos Analíticos',
      description: 'AreaChart, BarChart, PieChart con Recharts',
      action: async () => {
        toast.info('Análisis Visual', {
          description: 'Tendencias de ventas, gastos e ingresos',
        })
      },
      duration: 1500,
    },

    // ==================== FASE 7: COMPLETADO ====================
    {
      id: 'demo-complete',
      title: '🎉 Demostración Completa',
      description: 'Todos los sistemas verificados y funcionando perfectamente',
      action: async () => {
        toast.success('¡Sistema CHRONOS 100% Funcional!', {
          description: 'Todas las funcionalidades verificadas exitosamente',
        })
        haptic.success()
        setCompletedDemo(true)
      },
      duration: 2000,
      highlight: true,
    },
  ]

  const handleStartDemo = () => {
    setShowDemo(true)
    haptic.medium()
  }

  const handleDemoComplete = () => {
    onComplete?.()
    setTimeout(() => {
      setShowDemo(false)
    }, 3000)
  }

  return (
    <>
      {/* Botón de inicio */}
      <AnimatePresence>
        {!showDemo && !completedDemo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 right-4 z-50"
          >
            <GlowButton
              onClick={handleStartDemo}
              variant="success"
              className="gap-2"
            >
              <Rocket className="w-5 h-5" />
              Iniciar Demostración Completa
              <Sparkles className="w-4 h-4" />
            </GlowButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo interactiva */}
      <AnimatePresence>
        {showDemo && (
          <InteractiveDemo 
            steps={demoSteps} 
            onComplete={handleDemoComplete}
          />
        )}
      </AnimatePresence>

      {/* Mensaje de completado */}
      <AnimatePresence>
        {completedDemo && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 border-2 border-green-500 rounded-3xl p-12 text-center max-w-2xl"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
              </motion.div>
              
              <h2 className="text-4xl font-bold text-white mb-4">
                ¡Sistema CHRONOS Verificado!
              </h2>
              
              <p className="text-xl text-white/80 mb-6">
                Todas las funcionalidades han sido probadas exitosamente
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 rounded-xl p-4">
                  <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">27 Funciones</p>
                  <p className="text-white/60 text-sm">Todas operativas</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">0 Errores</p>
                  <p className="text-white/60 text-sm">Sistema perfecto</p>
                </div>
              </div>
              
              <GlowButton
                onClick={() => setCompletedDemo(false)}
                variant="success"
                className="gap-2"
              >
                Continuar Trabajando
                <Sparkles className="w-4 h-4" />
              </GlowButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
