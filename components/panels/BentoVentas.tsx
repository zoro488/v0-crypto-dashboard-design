"use client"

import { motion } from "framer-motion"
import { TrendingUp, Plus, DollarSign, Users, Package, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useVentasData } from "@/lib/firebase/firestore-hooks.service"
import { CreateVentaModal } from "@/components/modals/CreateVentaModal"

export default function BentoVentas() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: ventasData, loading, error } = useVentasData()

  const totalVentas = ventasData.reduce((acc: number, v: any) => acc + (v.precioTotalVenta || 0), 0)
  const totalCobrado = ventasData.reduce((acc: number, v: any) => acc + (v.montoPagado || 0), 0)
  const totalPendiente = ventasData.reduce((acc: number, v: any) => acc + (v.montoRestante || 0), 0)
  const ventasPendientes = ventasData.filter((v: any) => v.estadoPago === "pendiente").length
  const ventasCompletas = ventasData.filter((v: any) => v.estadoPago === "completo").length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/10 border-t-green-500 animate-spin" />
          <div className="text-white text-lg">Cargando ventas...</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
        >
          <p className="text-yellow-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl" />
            <TrendingUp className="w-12 h-12 text-green-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Ventas
            </h1>
            <p className="text-zinc-400 text-sm">Registro de ventas y gestión de cobros</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <Package className="w-8 h-8 text-green-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">{ventasData.length}</div>
            <p className="text-sm text-zinc-400">Ventas Totales</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
            <DollarSign className="w-8 h-8 text-emerald-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(totalVentas / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Valor Total</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-lime-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <CheckCircle2 className="w-8 h-8 text-lime-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(totalCobrado / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Cobrado</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-yellow-500/50 transition-colors">
            <Clock className="w-8 h-8 text-yellow-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(totalPendiente / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Por Cobrar</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
            <Users className="w-8 h-8 text-cyan-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">{ventasCompletas}</div>
            <p className="text-sm text-zinc-400">Completas</p>
          </div>
        </motion.div>
      </div>

      {/* Tables Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="bg-zinc-800/50 backdrop-blur-xl mb-6">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes ({ventasPendientes})</TabsTrigger>
              <TabsTrigger value="completas">Completas ({ventasCompletas})</TabsTrigger>
            </TabsList>

            <TabsContent value="todas">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pendiente</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasData.map((venta: any, idx: number) => (
                      <motion.tr
                        key={venta.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.05 }}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                      >
                        <td className="py-4 px-4">
                          <div className="font-mono text-sm text-green-400">{venta.id}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-zinc-400">{venta.fecha}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-white group-hover/row:text-green-400 transition-colors">
                            {venta.cliente}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {venta.cantidad} unidades
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-white">
                            ${((venta.precioTotalVenta || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-yellow-400">
                            ${((venta.montoRestante || 0) / 1000).toFixed(0)}K
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {venta.estadoPago === "completo" ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completo
                            </Badge>
                          ) : venta.estadoPago === "parcial" ? (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Parcial
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Similar tables for pendientes and completas tabs */}
            <TabsContent value="pendientes">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pendiente</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasData
                      .filter((venta: any) => venta.estadoPago === "pendiente")
                      .map((venta: any, idx: number) => (
                        <motion.tr
                          key={venta.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                        >
                          <td className="py-4 px-4">
                            <div className="font-mono text-sm text-green-400">{venta.id}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-zinc-400">{venta.fecha}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white group-hover/row:text-green-400 transition-colors">
                              {venta.cliente}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            >
                              {venta.cantidad} unidades
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-white">
                              ${((venta.precioTotalVenta || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-yellow-400">
                              ${((venta.montoRestante || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="completas">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pendiente</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasData
                      .filter((venta: any) => venta.estadoPago === "completo")
                      .map((venta: any, idx: number) => (
                        <motion.tr
                          key={venta.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                        >
                          <td className="py-4 px-4">
                            <div className="font-mono text-sm text-green-400">{venta.id}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-zinc-400">{venta.fecha}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white group-hover/row:text-green-400 transition-colors">
                              {venta.cliente}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            >
                              {venta.cantidad} unidades
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-white">
                              ${((venta.precioTotalVenta || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-yellow-400">
                              ${((venta.montoRestante || 0) / 1000).toFixed(0)}K
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completo
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      <CreateVentaModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
