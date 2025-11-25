"use client"

import { motion } from "framer-motion"
import { Package, TrendingUp, TrendingDown, Archive, Edit, Plus, Box, Activity } from "lucide-react"
import { useState } from "react"
import { useProductos, useEntradasAlmacen, useSalidasAlmacen } from "@/frontend/app/lib/firebase/firestore-hooks.service"
import { Skeleton } from "@/frontend/app/components/ui/skeleton"
import CreateEntradaAlmacenModal from "@/frontend/app/components/modals/CreateEntradaAlmacenModal"
import CreateSalidaAlmacenModal from "@/frontend/app/components/modals/CreateSalidaAlmacenModal"
import { InventoryHeatGrid } from "@/frontend/app/components/visualizations/InventoryHeatGrid"

const tabs = [
  { id: "entradas", label: "Entradas", icon: TrendingUp },
  { id: "salidas", label: "Salidas", icon: TrendingDown },
  { id: "stock", label: "Stock Actual", icon: Archive },
  { id: "modificaciones", label: "Modificaciones", icon: Edit },
]

export default function BentoAlmacen() {
  const [activeTab, setActiveTab] = useState("entradas")
  const [searchQuery, setSearchQuery] = useState("")
  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [showSalidaModal, setShowSalidaModal] = useState(false)

  const { data: productos = [], loading: loadingProductos } = useProductos()
  const { data: entradas = [], loading: loadingEntradas } = useEntradasAlmacen()
  const { data: salidas = [], loading: loadingSalidas } = useSalidasAlmacen()

  const totalEntradas = Array.isArray(entradas) ? entradas.reduce((sum, e) => sum + (e.cantidad || 0), 0) : 0
  const totalSalidas = Array.isArray(salidas) ? salidas.reduce((sum, s) => sum + (s.cantidad || 0), 0) : 0
  const stockActual = Array.isArray(productos)
    ? productos.reduce((sum, p) => sum + (p.stock || p.stockActual || 0), 0)
    : 0
  const valorStock = Array.isArray(productos)
    ? productos.reduce((sum, p) => sum + (p.stock || p.stockActual || 0) * (p.valorUnitario || p.precio || 0), 0)
    : 0
  const potencialVentas = stockActual * 10000

  const loading = loadingProductos || loadingEntradas || loadingSalidas

  if (loading) {
    return (
      <div className="bento-container space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="bento-container space-y-6">
      {/* Immersive Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-full crystal-card p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 animate-gradient" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/20 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Package className="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Centro de Distribución</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Operativo
                </span>
                <span className="text-white/40 text-sm">Última actualización: Hace 2 min</span>
              </div>
            </div>
          </div>

          <div className="flex items-end flex-col">
            <p className="text-white/40 text-sm font-medium uppercase tracking-wider">Producto Estrella</p>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              {productos.length > 0 ? productos[0].nombre : "Cargando..."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Gamified KPI Grid */}
      <div className="bento-full grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI_Card
          title="Entradas Totales"
          value={totalEntradas}
          subValue={`+${totalEntradas} unid.`}
          icon={TrendingUp}
          color="green"
          delay={0.1}
        />
        <KPI_Card
          title="Salidas Totales"
          value={totalSalidas}
          subValue={`-${totalSalidas} unid.`}
          icon={TrendingDown}
          color="red"
          delay={0.2}
        />
        <KPI_Card
          title="Stock Disponible"
          value={stockActual}
          subValue={`$${valorStock.toLocaleString("en-US")} USD`}
          icon={Box}
          color="blue"
          delay={0.3}
          highlight
        />
        <KPI_Card
          title="Potencial Ventas"
          value={`$${(potencialVentas / 1000).toFixed(0)}K`}
          subValue="Si se vende todo"
          icon={Archive}
          color="purple"
          delay={0.4}
        />
      </div>

      {/* Controls & Tabs - Similar structure to Banco but customized */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/20 p-2 rounded-3xl backdrop-blur-xl border border-white/5">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap relative
                ${activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white hover:bg-white/5"}
              `}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabAlmacen"
                  className="absolute inset-0 bg-white/10 rounded-2xl shadow-inner shadow-white/5"
                />
              )}
              <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? "text-cyan-400" : ""}`} />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
        {/* Search bar logic same as Banco */}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="bento-full min-h-[500px]"
      >
        {activeTab === "entradas" && (
          <div className="crystal-card p-1 relative overflow-hidden group">
            <div className="flex items-center justify-between p-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Entradas de Mercancía</h3>
                <p className="text-white/40 text-sm mt-1">Registro detallado de recepción de productos</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEntradaModal(true)}
                className="btn-premium bg-cyan-500 hover:bg-cyan-400 text-white border-none flex items-center gap-2 shadow-lg shadow-cyan-900/20"
              >
                <Plus className="w-4 h-4" />
                Nueva Entrada
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Ref
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entradas.map((entrada, index) => (
                    <motion.tr
                      key={entrada.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group/row hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-white/80">{entrada.id}</td>
                      <td className="px-6 py-4 text-white/60">{new Date(entrada.fecha).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-white/80">{entrada.origen}</td>
                      <td className="px-6 py-4 text-white/80">{entrada.cantidad}</td>
                      <td className="px-6 py-4 text-white/80">${entrada.valorUnitario.toLocaleString()}</td>
                      <td className="px-6 py-4 text-white/80">${entrada.valorTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-400">{entrada.referencia}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "salidas" && (
          <div className="crystal-card p-1 relative overflow-hidden group">
            <div className="flex items-center justify-between p-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Salidas de Mercancía</h3>
                <p className="text-white/40 text-sm mt-1">Historial de despachos y ventas</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSalidaModal(true)}
                className="btn-premium bg-orange-500 hover:bg-orange-400 text-white border-none flex items-center gap-2 shadow-lg shadow-orange-900/20"
              >
                <TrendingDown className="w-4 h-4" />
                Nueva Salida
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Destino
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Ref
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {salidas.map((salida, index) => (
                    <motion.tr
                      key={salida.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group/row hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-white/80">{salida.id}</td>
                      <td className="px-6 py-4 text-white/60">{new Date(salida.fecha).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-white/80">{salida.destino}</td>
                      <td className="px-6 py-4 text-white/80">{salida.cantidad}</td>
                      <td className="px-6 py-4 text-white/80">${salida.valorUnitario.toLocaleString()}</td>
                      <td className="px-6 py-4 text-white/80">${salida.valorTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-400">{salida.referencia}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "stock" && (
          <div className="crystal-card p-1 relative overflow-hidden group">
            <div className="flex items-center justify-between p-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Stock Actual</h3>
                <p className="text-white/40 text-sm mt-1">Estado del inventario en tiempo real</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Disponible
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="text-center py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {productos.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group/row hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-white/80">{item.id}</td>
                      <td className="px-6 py-4 text-white/80">{item.nombre}</td>
                      <td className="px-6 py-4 text-white/60">Múltiples</td>
                      <td className="px-6 py-4 text-white/80">{item.stock || item.stockActual}</td>
                      <td className="px-6 py-4 text-white/80">${item.valorUnitario || item.precio.toLocaleString()}</td>
                      <td className="px-6 py-4 text-white/80">
                        ${(item.stock || item.stockActual) * (item.valorUnitario || item.precio).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            (item.stock || item.stockActual) < 20
                              ? "bg-red-500/20 text-red-400"
                              : (item.stock || item.stockActual) < 50
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {(item.stock || item.stockActual) < 20
                            ? "Bajo"
                            : (item.stock || item.stockActual) < 50
                              ? "Medio"
                              : "Alto"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "modificaciones" && <ModificacionesTable />}
      </motion.div>

      {showEntradaModal && (
        <CreateEntradaAlmacenModal isOpen={showEntradaModal} onClose={() => setShowEntradaModal(false)} />
      )}

      {showSalidaModal && (
        <CreateSalidaAlmacenModal isOpen={showSalidaModal} onClose={() => setShowSalidaModal(false)} />
      )}

      {/* Inventory Heat Grid - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Mapa de Calor de Inventario</h3>
          <p className="text-sm text-white/60">Visualización isométrica de niveles de stock</p>
        </div>
        <InventoryHeatGrid className="w-full" />
      </motion.div>
    </div>
  )
}

interface KPI_CardProps {
  title: string
  value: string | number
  subValue?: string
  icon: React.ComponentType<{ className?: string }>
  color: "green" | "red" | "blue" | "purple"
  delay: number
  highlight?: boolean
}

function KPI_Card({ title, value, subValue, icon: Icon, color, delay, highlight = false }: KPI_CardProps) {
  const colors: Record<KPI_CardProps["color"], string> = {
    green: "from-emerald-500 to-teal-600 text-emerald-400 bg-emerald-500/10",
    red: "from-rose-500 to-pink-600 text-rose-400 bg-rose-500/10",
    blue: "from-blue-500 to-cyan-600 text-cyan-400 bg-cyan-500/10",
    purple: "from-violet-500 to-purple-600 text-purple-400 bg-purple-500/10",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative p-6 rounded-3xl border border-white/5 overflow-hidden group ${highlight ? "bg-white/[0.03]" : "glass"}`}
    >
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-50" />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider">{title}</span>
          <div className={`p-2.5 rounded-xl ${colors[color].split(" ").slice(2).join(" ")}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded-full bg-white/10 overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ delay: delay + 0.5, duration: 1 }}
              className={`h-full bg-gradient-to-r ${colors[color].split(" ").slice(0, 2).join(" ")}`}
            />
          </div>
          <p className={`text-xs font-medium ${colors[color].split(" ")[2]}`}>{subValue}</p>
        </div>
      </div>
    </motion.div>
  )
}

function ModificacionesTable() {
  return (
    <div className="crystal-card p-1 relative overflow-hidden group">
      <div className="flex items-center justify-between p-6 relative z-10">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Modificaciones Manuales</h3>
          <p className="text-white/40 text-sm mt-1">Registro de ajustes de inventario</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-premium bg-purple-500 hover:bg-purple-400 text-white border-none flex items-center gap-2 shadow-lg shadow-purple-900/20"
        >
          <Edit className="w-4 h-4" />
          Nuevo Ajuste
        </motion.button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">Tipo</th>
              <th className="text-right py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Cantidad
              </th>
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Motivo
              </th>
              <th className="text-left py-4 px-6 text-white/40 text-xs font-semibold uppercase tracking-wider">
                Usuario
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">{/* Placeholder for actual data */}</tbody>
        </table>
      </div>
    </div>
  )
}
