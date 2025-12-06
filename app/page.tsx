'use client'

import { motion } from 'framer-motion'
import { useSystemData } from '@/app/_hooks'
import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Truck,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 - Dashboard Principal
// ═══════════════════════════════════════════════════════════════

export default function HomePage() {
  const { bancos, ventas, clientes, distribuidores, productos, loading, stats } = useSystemData()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
            CHRONOS INFINITY
          </h2>
          <p className="text-gray-500 mt-2">Cargando sistema...</p>
        </motion.div>
      </div>
    )
  }

  const kpis = [
    {
      label: 'Capital Total',
      value: stats.capitalTotal,
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-500',
      change: 12.5,
    },
    {
      label: 'Ventas Totales',
      value: stats.ventasTotales,
      icon: ShoppingCart,
      color: 'from-violet-500 to-purple-500',
      change: 8.3,
    },
    {
      label: 'Pendiente Cobrar',
      value: stats.ventasPendientes,
      icon: TrendingUp,
      color: 'from-pink-500 to-rose-500',
      change: -3.2,
    },
    {
      label: 'Clientes Activos',
      value: stats.totalClientes,
      icon: Users,
      color: 'from-emerald-500 to-green-500',
      change: 5.1,
    },
    {
      label: 'Distribuidores',
      value: stats.totalDistribuidores,
      icon: Truck,
      color: 'from-blue-500 to-cyan-500',
      change: 0,
    },
    {
      label: 'Productos',
      value: stats.totalProductos,
      icon: Package,
      color: 'from-amber-500 to-yellow-500',
      change: 2.4,
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
          CHRONOS INFINITY
        </h1>
        <p className="text-gray-400 mt-2">
          {new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-white/10 p-6 backdrop-blur-xl"
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${kpi.color} opacity-5`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${kpi.color}`}>
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
                {kpi.change !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${kpi.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {kpi.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(kpi.change)}%
                  </div>
                )}
              </div>
              
              <p className="text-gray-400 text-sm mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold">
                {typeof kpi.value === 'number' && (kpi.label.includes('Capital') || kpi.label.includes('Ventas') || kpi.label.includes('Pendiente'))
                  ? `$${kpi.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                  : kpi.value.toLocaleString('es-MX')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bancos Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-white/10 p-6 backdrop-blur-xl mb-8"
      >
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          Sistema Bancario
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {bancos.map((banco, index) => (
            <motion.div
              key={banco.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-4 cursor-pointer group"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: banco.color }}
                >
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs text-gray-400 mb-1 truncate">{banco.nombre}</p>
                <p className="text-lg font-bold text-white">
                  ${banco.capitalActual?.toLocaleString('es-MX', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Ventas Recientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-black border border-white/10 p-6 backdrop-blur-xl"
      >
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Últimas Ventas
        </h2>
        
        {ventas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay ventas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Cantidad</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ventas.slice(0, 5).map((venta, index) => (
                  <motion.tr
                    key={venta.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3">{venta.cliente?.nombre || 'N/A'}</td>
                    <td className="py-3">{venta.cantidad}</td>
                    <td className="py-3 font-semibold text-yellow-400">
                      ${venta.precioTotalVenta?.toLocaleString('es-MX') || '0'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        venta.estadoPago === 'completo' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : venta.estadoPago === 'parcial'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {venta.estadoPago}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {venta.fecha ? new Date(venta.fecha).toLocaleDateString('es-MX') : 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
