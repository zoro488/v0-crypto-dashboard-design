'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏠 CHRONOS UNIFIED DASHBOARD - Panel Principal Unificado
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dashboard principal que muestra:
 * - Hero Card con capital total
 * - KPIs principales (ventas, clientes, ordenes)
 * - Resumen de 7 bancos
 * - Actividad reciente
 * - Navegación a otros paneles
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, useState, useMemo, useCallback, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  DollarSign, ShoppingCart, Users, Truck, Package,
  TrendingUp, ArrowRight, Calendar, Clock, Activity,
  Landmark, RefreshCw,
} from 'lucide-react'
import {
  CHRONOS,
  AmbientBackground,
  ChronosLayout,
  GlassCard,
  KPICard,
  HeroCard,
  BentoGrid,
  BankCard,
  ActivityItem,
  ChronosButton,
  ChronosBadge,
  MiniChart,
} from '@/app/components/unified'
import type { BankData } from '@/app/components/unified'

// ═══════════════════════════════════════════════════════════════════════════
// 📊 DATOS DEMO
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_BANKS: BankData[] = [
  { id: 'boveda_monte', name: 'Bóveda Monte', balance: 1250000, ingresos: 450000, gastos: 120000, trend: 12.5 },
  { id: 'boveda_usa', name: 'Bóveda USA', balance: 890000, ingresos: 320000, gastos: 85000, trend: 8.3 },
  { id: 'profit', name: 'Profit', balance: 567000, ingresos: 180000, gastos: 45000, trend: 15.2 },
  { id: 'leftie', name: 'Leftie', balance: 345000, ingresos: 125000, gastos: 32000, trend: -2.1 },
  { id: 'azteca', name: 'Azteca', balance: 234000, ingresos: 95000, gastos: 28000, trend: 5.7 },
  { id: 'flete_sur', name: 'Flete Sur', balance: 178000, ingresos: 65000, gastos: 22000, trend: 3.4 },
  { id: 'utilidades', name: 'Utilidades', balance: 456000, ingresos: 210000, gastos: 0, trend: 28.9 },
]

const BANK_COLORS: Record<string, 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'cyan' | 'orange'> = {
  boveda_monte: 'emerald',
  boveda_usa: 'sky',
  profit: 'violet',
  leftie: 'amber',
  azteca: 'rose',
  flete_sur: 'cyan',
  utilidades: 'orange',
}

const MOCK_ACTIVITY = [
  { id: 1, icon: ShoppingCart, title: 'Venta #1234', description: 'Cliente: Juan Pérez', amount: 15000, type: 'income' as const, time: 'Hace 5 min' },
  { id: 2, icon: DollarSign, title: 'Pago recibido', description: 'Orden #892', amount: 8500, type: 'income' as const, time: 'Hace 15 min' },
  { id: 3, icon: Truck, title: 'Envío completado', description: 'Orden #891', amount: 2500, type: 'expense' as const, time: 'Hace 30 min' },
  { id: 4, icon: Package, title: 'Inventario actualizado', description: '+50 unidades', amount: 0, type: 'neutral' as const, time: 'Hace 1 hora' },
  { id: 5, icon: Users, title: 'Nuevo cliente', description: 'María García', amount: 0, type: 'neutral' as const, time: 'Hace 2 horas' },
]

const CHART_DATA = [45, 52, 38, 65, 48, 72, 56, 78, 62, 85, 70, 92]

// ═══════════════════════════════════════════════════════════════════════════
// 🏠 DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const UnifiedDashboard = memo(() => {
  const prefersReducedMotion = useReducedMotion()
  const [activePanel, setActivePanel] = useState('dashboard')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // Calcular totales
  const totals = useMemo(() => {
    const totalCapital = MOCK_BANKS.reduce((sum, b) => sum + b.balance, 0)
    const totalIngresos = MOCK_BANKS.reduce((sum, b) => sum + b.ingresos, 0)
    const totalGastos = MOCK_BANKS.reduce((sum, b) => sum + b.gastos, 0)
    const avgTrend = MOCK_BANKS.reduce((sum, b) => sum + (b.trend || 0), 0) / MOCK_BANKS.length
    
    return { totalCapital, totalIngresos, totalGastos, avgTrend }
  }, [])
  
  const formatCurrency = useCallback((n: number) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n), [])
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // Simular refresh
    setTimeout(() => {
      setIsRefreshing(false)
      setLastUpdate(new Date())
    }, 1500)
  }, [])
  
  // User mock
  const user = {
    name: 'Admin CHRONOS',
    email: 'admin@chronos.local',
  }
  
  // Get title based on active panel
  const getPanelTitle = () => {
    const titles: Record<string, { title: string; subtitle: string }> = {
      dashboard: { title: 'Dashboard', subtitle: 'Resumen general del sistema' },
      ventas: { title: 'Ventas', subtitle: 'Gestión de ventas y transacciones' },
      clientes: { title: 'Clientes', subtitle: 'Base de datos de clientes' },
      distribuidores: { title: 'Distribuidores', subtitle: 'Red de distribución' },
      almacen: { title: 'Almacén', subtitle: 'Control de inventario' },
      reportes: { title: 'Reportes', subtitle: 'Análisis y estadísticas' },
      settings: { title: 'Configuración', subtitle: 'Ajustes del sistema' },
    }
    return titles[activePanel] || titles.dashboard
  }
  
  const panelInfo = getPanelTitle()
  
  return (
    <div className="relative min-h-screen" style={{ background: CHRONOS.colors.void }}>
      <AmbientBackground />
      
      <ChronosLayout
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        user={user}
        onLogout={() => console.log('Logout')}
        title={panelInfo.title}
        subtitle={panelInfo.subtitle}
      >
        {/* Dashboard Content */}
        {activePanel === 'dashboard' && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChronosBadge variant="success" dot>
                  Sistema Operativo
                </ChronosBadge>
                <span 
                  className="text-sm"
                  style={{ color: CHRONOS.colors.textMuted }}
                >
                  Última actualización: {lastUpdate.toLocaleTimeString('es-MX')}
                </span>
              </div>
              
              <ChronosButton
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={handleRefresh}
                isLoading={isRefreshing}
              >
                Actualizar
              </ChronosButton>
            </div>
            
            {/* Hero Section - Capital Total */}
            <HeroCard
              title="Capital Total"
              value={formatCurrency(totals.totalCapital)}
              subtitle="Suma de los 7 bancos"
              trend={totals.avgTrend >= 0 ? 'up' : 'down'}
              trendValue={`${totals.avgTrend >= 0 ? '+' : ''}${totals.avgTrend.toFixed(1)}% este mes`}
              gradient="cyan"
            />
            
            {/* KPIs Row */}
            <BentoGrid cols={4}>
              <KPICard
                title="Ingresos Totales"
                value={formatCurrency(totals.totalIngresos)}
                change="+18.2% vs mes anterior"
                trend="up"
                icon={TrendingUp}
                color="success"
              />
              <KPICard
                title="Gastos Totales"
                value={formatCurrency(totals.totalGastos)}
                change="-5.3% vs mes anterior"
                trend="down"
                icon={DollarSign}
                color="error"
              />
              <KPICard
                title="Ventas del Mes"
                value="156"
                change="+24 nuevas"
                trend="up"
                icon={ShoppingCart}
                color="cyan"
              />
              <KPICard
                title="Clientes Activos"
                value="89"
                change="+12 este mes"
                trend="up"
                icon={Users}
                color="violet"
              />
            </BentoGrid>
            
            {/* Banks Section */}
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 
                    className="text-lg font-semibold"
                    style={{ color: CHRONOS.colors.textPrimary }}
                  >
                    Bóvedas y Bancos
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: CHRONOS.colors.textMuted }}
                  >
                    Estado actual de los 7 bancos del sistema
                  </p>
                </div>
                <ChronosButton
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setActivePanel('bancos')}
                >
                  Ver todos
                </ChronosButton>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {MOCK_BANKS.map((bank) => (
                  <BankCard
                    key={bank.id}
                    bank={bank}
                    color={BANK_COLORS[bank.id]}
                    onClick={() => setActivePanel(bank.id)}
                  />
                ))}
              </div>
            </GlassCard>
            
            {/* Two Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Feed */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 
                    className="font-semibold flex items-center gap-2"
                    style={{ color: CHRONOS.colors.textPrimary }}
                  >
                    <Activity className="w-5 h-5" style={{ color: CHRONOS.colors.cyan }} />
                    Actividad Reciente
                  </h3>
                  <ChronosBadge variant="premium" size="sm">
                    {MOCK_ACTIVITY.length} nuevos
                  </ChronosBadge>
                </div>
                
                <div className="space-y-1">
                  {MOCK_ACTIVITY.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      icon={activity.icon}
                      title={activity.title}
                      description={activity.description}
                      amount={activity.amount || undefined}
                      type={activity.type}
                      timestamp={activity.time}
                    />
                  ))}
                </div>
              </GlassCard>
              
              {/* Chart Card */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 
                    className="font-semibold flex items-center gap-2"
                    style={{ color: CHRONOS.colors.textPrimary }}
                  >
                    <TrendingUp className="w-5 h-5" style={{ color: CHRONOS.colors.cyan }} />
                    Tendencia Mensual
                  </h3>
                  <ChronosBadge variant="success" size="sm">
                    +15.8%
                  </ChronosBadge>
                </div>
                
                <div className="h-[200px]">
                  <MiniChart data={CHART_DATA} height={200} color={CHRONOS.colors.cyan} />
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: CHRONOS.colors.glassBorder }}>
                  <div className="text-center">
                    <p className="text-sm" style={{ color: CHRONOS.colors.textMuted }}>Máximo</p>
                    <p className="text-lg font-semibold" style={{ color: CHRONOS.colors.success }}>
                      {formatCurrency(Math.max(...CHART_DATA) * 10000)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm" style={{ color: CHRONOS.colors.textMuted }}>Promedio</p>
                    <p className="text-lg font-semibold" style={{ color: CHRONOS.colors.textPrimary }}>
                      {formatCurrency((CHART_DATA.reduce((a, b) => a + b, 0) / CHART_DATA.length) * 10000)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm" style={{ color: CHRONOS.colors.textMuted }}>Mínimo</p>
                    <p className="text-lg font-semibold" style={{ color: CHRONOS.colors.error }}>
                      {formatCurrency(Math.min(...CHART_DATA) * 10000)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
            
            {/* Quick Access */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'ventas', label: 'Nueva Venta', icon: ShoppingCart, color: 'cyan' as const },
                { id: 'clientes', label: 'Agregar Cliente', icon: Users, color: 'violet' as const },
                { id: 'almacen', label: 'Inventario', icon: Package, color: 'magenta' as const },
                { id: 'reportes', label: 'Generar Reporte', icon: Calendar, color: 'success' as const },
              ].map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivePanel(action.id)}
                  className="p-4 rounded-xl text-left transition-colors"
                  style={{
                    background: CHRONOS.colors.glassBg,
                    border: `1px solid ${CHRONOS.colors.glassBorder}`,
                  }}
                >
                  <action.icon 
                    className="w-6 h-6 mb-2"
                    style={{ color: CHRONOS.colors[action.color as keyof typeof CHRONOS.colors] as string }}
                  />
                  <p 
                    className="text-sm font-medium"
                    style={{ color: CHRONOS.colors.textPrimary }}
                  >
                    {action.label}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Other Panels - Placeholder */}
        {activePanel !== 'dashboard' && !MOCK_BANKS.some(b => b.id === activePanel) && (
          <GlassCard className="flex flex-col items-center justify-center py-20">
            <Landmark 
              className="w-16 h-16 mb-4"
              style={{ color: CHRONOS.colors.textMuted }}
            />
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ color: CHRONOS.colors.textPrimary }}
            >
              Panel: {activePanel}
            </h2>
            <p style={{ color: CHRONOS.colors.textMuted }}>
              Este panel está en construcción con el nuevo sistema unificado.
            </p>
            <ChronosButton
              variant="primary"
              className="mt-6"
              onClick={() => setActivePanel('dashboard')}
            >
              Volver al Dashboard
            </ChronosButton>
          </GlassCard>
        )}
        
        {/* Bank Detail - When a bank is selected */}
        {MOCK_BANKS.some(b => b.id === activePanel) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {(() => {
              const bank = MOCK_BANKS.find(b => b.id === activePanel)!
              return (
                <>
                  <HeroCard
                    title={bank.name}
                    value={formatCurrency(bank.balance)}
                    subtitle="Capital actual del banco"
                    trend={(bank.trend || 0) >= 0 ? 'up' : 'down'}
                    trendValue={`${(bank.trend || 0) >= 0 ? '+' : ''}${bank.trend?.toFixed(1)}% este mes`}
                    gradient={['emerald', 'sky', 'violet'].includes(BANK_COLORS[bank.id]) ? 'cyan' : 'magenta'}
                  />
                  
                  <BentoGrid cols={3}>
                    <KPICard
                      title="Ingresos"
                      value={formatCurrency(bank.ingresos)}
                      trend="up"
                      icon={TrendingUp}
                      color="success"
                    />
                    <KPICard
                      title="Gastos"
                      value={formatCurrency(bank.gastos)}
                      trend="down"
                      icon={DollarSign}
                      color="error"
                    />
                    <KPICard
                      title="Balance Neto"
                      value={formatCurrency(bank.ingresos - bank.gastos)}
                      trend={(bank.ingresos - bank.gastos) >= 0 ? 'up' : 'down'}
                      icon={Activity}
                      color="cyan"
                    />
                  </BentoGrid>
                  
                  <GlassCard>
                    <h3 
                      className="font-semibold mb-4"
                      style={{ color: CHRONOS.colors.textPrimary }}
                    >
                      Movimientos del Banco
                    </h3>
                    <p style={{ color: CHRONOS.colors.textMuted }}>
                      Aquí se mostrarán los movimientos detallados del banco {bank.name}.
                    </p>
                  </GlassCard>
                </>
              )
            })()}
          </motion.div>
        )}
      </ChronosLayout>
    </div>
  )
})
UnifiedDashboard.displayName = 'UnifiedDashboard'

export default UnifiedDashboard
