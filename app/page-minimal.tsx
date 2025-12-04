'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 CHRONOS 2026 — DASHBOARD PRINCIPAL LIMPIO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dashboard ultra-premium sin Firebase, 100% local.
 * Paleta: Negro #000000 + Violeta #8B00FF + Oro #FFD700 + Rosa #FF1493
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { 
  Wallet, TrendingUp, Users, ShoppingCart, 
  Package, ArrowUpRight, ArrowDownRight, Plus,
  LayoutDashboard, FileText, Building2, Truck
} from 'lucide-react'
import { useDataStore } from '@/app/lib/store/useDataStore'

// ============================================================================
// COMPONENTES UI PREMIUM
// ============================================================================

function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = '#8B00FF',
  delay = 0 
}: { 
  title: string
  value: string
  change?: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color?: string
  delay?: number
}) {
  const isPositive = (change ?? 0) >= 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group cursor-pointer"
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
      
      {/* Card */}
      <div className="relative p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${color}40 0%, transparent 60%)` 
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
          </div>
          
          <p className="text-white/60 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

function BancoMiniCard({ 
  nombre, 
  capital, 
  color,
  delay = 0 
}: { 
  nombre: string
  capital: number
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-lg flex items-center gap-4 cursor-pointer group"
    >
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <p className="text-white/60 text-xs">{nombre}</p>
        <p className="text-white font-semibold">
          ${capital.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
    </motion.div>
  )
}

function NavButton({ 
  icon: Icon, 
  label, 
  active = false,
  onClick 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30' 
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </motion.button>
  )
}

// ============================================================================
// DASHBOARD PRINCIPAL
// ============================================================================

export default function ChronosDashboard() {
  const [mounted, setMounted] = useState(false)
  const { ventas, clientes, bancos, getKPIs } = useDataStore()
  
  // Esperar montaje para evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Calcular KPIs
  const kpis = useMemo(() => {
    if (!mounted) return { totalCapital: 0, totalVentas: 0, totalClientes: 0, ventasHoy: 0 }
    return getKPIs()
  }, [mounted, getKPIs, ventas, bancos])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-violet-500/30 border-t-violet-500"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-black to-fuchsia-950/10" />
        
        {/* Animated orbs */}
        <motion.div 
          className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.2, 1], 
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.3, 1], 
            x: [0, -40, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        
        {/* Grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-black/40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <motion.div 
                className="text-3xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                CHRONOS
              </motion.div>
              <span className="text-white/30 text-sm">2026</span>
            </div>
            
            <div className="flex items-center gap-2">
              <NavButton icon={LayoutDashboard} label="Dashboard" active />
              <NavButton icon={ShoppingCart} label="Ventas" />
              <NavButton icon={FileText} label="Órdenes" />
              <NavButton icon={Building2} label="Bancos" />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium shadow-lg shadow-violet-500/30"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Venta</span>
            </motion.button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">
              Bienvenido a <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">CHRONOS</span>
            </h1>
            <p className="text-white/60">Sistema de gestión empresarial ultra-premium</p>
          </motion.div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard 
              title="Capital Total" 
              value={`$${kpis.totalCapital.toLocaleString('es-MX')}`}
              change={15.7}
              icon={Wallet}
              color="#8B00FF"
              delay={0.1}
            />
            <KPICard 
              title="Ventas Totales" 
              value={`$${kpis.totalVentas.toLocaleString('es-MX')}`}
              change={12.3}
              icon={TrendingUp}
              color="#FFD700"
              delay={0.2}
            />
            <KPICard 
              title="Clientes" 
              value={kpis.totalClientes.toString()}
              change={8.5}
              icon={Users}
              color="#FF1493"
              delay={0.3}
            />
            <KPICard 
              title="Ventas Hoy" 
              value={kpis.ventasHoy.toString()}
              change={23.4}
              icon={ShoppingCart}
              color="#22C55E"
              delay={0.4}
            />
          </div>

          {/* Bancos Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-400" />
              <span>7 Bancos</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bancos.map((banco, i) => (
                <BancoMiniCard
                  key={banco.id}
                  nombre={banco.nombre}
                  capital={banco.capitalActual}
                  color={banco.color}
                  delay={0.6 + i * 0.1}
                />
              ))}
            </div>
          </motion.div>

          {/* Empty State / Getting Started */}
          {ventas.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center py-16 border border-dashed border-white/20 rounded-2xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <Package className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sistema Limpio</h3>
              <p className="text-white/60 mb-6">No hay datos aún. Comienza registrando tu primera venta.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium shadow-lg shadow-violet-500/30"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Primera Venta</span>
              </motion.button>
            </motion.div>
          )}
        </main>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-500/40 flex items-center justify-center z-50"
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  )
}
