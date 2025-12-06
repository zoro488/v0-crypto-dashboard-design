'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Truck,
  Calendar,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { formatCurrency, cn } from '@/app/_lib/utils'
import { useChronosStore } from '@/app/lib/store'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ReportType = 'ventas' | 'bancos' | 'clientes' | 'distribuidores' | 'almacen' | 'financiero'

interface ReportConfig {
  id: ReportType
  nombre: string
  descripcion: string
  icon: typeof FileText
  color: string
}

const REPORTS: ReportConfig[] = [
  { id: 'ventas', nombre: 'Ventas', descripcion: 'Análisis de ventas por período', icon: BarChart3, color: 'violet' },
  { id: 'bancos', nombre: 'Bancos', descripcion: 'Estado de capital por banco', icon: DollarSign, color: 'emerald' },
  { id: 'clientes', nombre: 'Clientes', descripcion: 'Cartera de clientes y deudas', icon: Users, color: 'blue' },
  { id: 'distribuidores', nombre: 'Distribuidores', descripcion: 'Órdenes y pagos pendientes', icon: Truck, color: 'amber' },
  { id: 'almacen', nombre: 'Almacén', descripcion: 'Inventario y stock', icon: Package, color: 'purple' },
  { id: 'financiero', nombre: 'Financiero', descripcion: 'Resumen ejecutivo completo', icon: TrendingUp, color: 'gold' },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ReportesClient() {
  const { bancos, ventas, clientes, distribuidores, ordenesCompra } = useChronosStore()
  
  const [selectedReport, setSelectedReport] = useState<ReportType>('financiero')
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0],
  })

  // ═════════════════════════════════════════════════════════════════════════
  // STATS FROM STORE
  // ═════════════════════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const bancosArray = Object.values(bancos)
    const capitalTotal = bancosArray.reduce((acc, b) => acc + (b.capitalActual || 0), 0)
    const ingresosHistoricos = bancosArray.reduce((acc, b) => acc + (b.historicoIngresos || 0), 0)
    const gastosHistoricos = bancosArray.reduce((acc, b) => acc + (b.historicoGastos || 0), 0)
    
    const ventasTotales = ventas.reduce((acc, v) => acc + (v.precioTotalVenta || 0), 0)
    const ventasCobradas = ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
    
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length
    const deudaClientes = clientes.reduce((acc, c) => acc + (c.deuda || c.deudaTotal || c.pendiente || 0), 0)
    
    const deudaDistribuidores = ordenesCompra.reduce((acc, o) => acc + (o.deuda || 0), 0)
    
    return {
      capitalTotal,
      ingresosHistoricos,
      gastosHistoricos,
      utilidadNeta: ingresosHistoricos - gastosHistoricos,
      ventasTotales,
      ventasCobradas,
      pendienteCobro: ventasTotales - ventasCobradas,
      clientesActivos,
      totalClientes: clientes.length,
      deudaClientes,
      totalDistribuidores: distribuidores.length,
      deudaDistribuidores,
      totalOrdenes: ordenesCompra.length,
    }
  }, [bancos, ventas, clientes, distribuidores, ordenesCompra])

  // ═════════════════════════════════════════════════════════════════════════
  // FETCH REPORT
  // ═════════════════════════════════════════════════════════════════════════
  const fetchReport = async (tipo: ReportType) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        fechaInicio: dateRange.inicio,
        fechaFin: dateRange.fin,
      })
      
      const response = await fetch(`/api/reportes/${tipo}?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport(selectedReport)
  }, [selectedReport, dateRange])

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-gray-400">Capital Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.capitalTotal)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-gray-400">Ventas Totales</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.ventasTotales)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Utilidad Neta</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.utilidadNeta)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-400">Pendiente Cobro</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.pendienteCobro)}</p>
        </motion.div>
      </div>

      {/* Date Range & Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.inicio}
              onChange={(e) => setDateRange({ ...dateRange, inicio: e.target.value })}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
            <span className="text-gray-400">a</span>
            <input
              type="date"
              value={dateRange.fin}
              onChange={(e) => setDateRange({ ...dateRange, fin: e.target.value })}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchReport(selectedReport)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {REPORTS.map((report) => {
          const Icon = report.icon
          const isSelected = selectedReport === report.id
          
          return (
            <motion.button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-4 rounded-xl border transition-all text-left",
                isSelected
                  ? `bg-${report.color}-500/20 border-${report.color}-500/30`
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-2",
                isSelected ? `text-${report.color}-400` : 'text-gray-400'
              )} />
              <p className="font-medium text-sm">{report.nombre}</p>
              <p className="text-xs text-gray-500 mt-1">{report.descripcion}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Report Content */}
      <motion.div
        key={selectedReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[400px]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">
              Reporte: {REPORTS.find(r => r.id === selectedReport)?.nombre}
            </h3>

            {/* Quick Stats based on selected report */}
            {selectedReport === 'financiero' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Ingresos Históricos</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(stats.ingresosHistoricos)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Gastos Históricos</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(stats.gastosHistoricos)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Deuda Clientes</p>
                  <p className="text-xl font-bold text-amber-400">{formatCurrency(stats.deudaClientes)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Deuda a Distribuidores</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(stats.deudaDistribuidores)}</p>
                </div>
              </div>
            )}

            {selectedReport === 'clientes' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Total Clientes</p>
                  <p className="text-xl font-bold">{stats.totalClientes}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Clientes Activos</p>
                  <p className="text-xl font-bold text-emerald-400">{stats.clientesActivos}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Saldo Pendiente</p>
                  <p className="text-xl font-bold text-amber-400">{formatCurrency(stats.deudaClientes)}</p>
                </div>
              </div>
            )}

            {selectedReport === 'distribuidores' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Total Distribuidores</p>
                  <p className="text-xl font-bold">{stats.totalDistribuidores}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Órdenes de Compra</p>
                  <p className="text-xl font-bold">{stats.totalOrdenes}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-gray-400">Deuda Pendiente</p>
                  <p className="text-xl font-bold text-amber-400">{formatCurrency(stats.deudaDistribuidores)}</p>
                </div>
              </div>
            )}

            {/* API Response Data */}
            {reportData?.data && (
              <div className="mt-6 p-4 rounded-xl bg-black/20">
                <p className="text-sm text-gray-400 mb-2">Datos del servidor:</p>
                <pre className="text-xs text-gray-300 overflow-auto max-h-48">
                  {JSON.stringify(reportData.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
