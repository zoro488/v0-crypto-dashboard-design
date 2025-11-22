"use client"

import { motion } from "framer-motion"
import { ShoppingCart, Plus, TrendingUp, AlertCircle, CheckCircle2, Clock, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { suscribirOrdenesCompra } from "@/lib/firebase/firestore-service"
import type { OrdenCompra } from "@/types"
import { CreateOrdenCompraModal } from "@/components/modals/CreateOrdenCompraModal"

export default function BentoOrdenesCompra() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ordenesCompraData, setOrdenesCompraData] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = suscribirOrdenesCompra((ordenes) => {
      setOrdenesCompraData(ordenes)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const totalCompras = ordenesCompraData.reduce((acc, oc) => acc + oc.costoTotal, 0)
  const totalDeuda = ordenesCompraData.reduce((acc, oc) => acc + oc.deuda, 0)
  const totalPagado = ordenesCompraData.reduce((acc, oc) => acc + oc.pagoDistribuidor, 0)
  const ordenesPendientes = ordenesCompraData.filter((oc) => oc.estado === "pendiente").length
  const ordenesPagadas = ordenesCompraData.filter((oc) => oc.estado === "pagado").length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl" />
            <ShoppingCart className="w-12 h-12 text-blue-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Órdenes de Compra
            </h1>
            <p className="text-zinc-400 text-sm">Gestión completa de compras a distribuidores</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
            <Package className="w-8 h-8 text-blue-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">{ordenesCompraData.length}</div>
            <p className="text-sm text-zinc-400">Órdenes Totales</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-purple-500/50 transition-colors">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(totalCompras / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Total Compras</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-red-500/50 transition-colors">
            <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(totalDeuda / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Deuda Pendiente</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <CheckCircle2 className="w-8 h-8 text-green-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">${(totalPagado / 1000).toFixed(0)}K</div>
            <p className="text-sm text-zinc-400">Total Pagado</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-yellow-500/50 transition-colors">
            <Clock className="w-8 h-8 text-yellow-400 mb-4" />
            <div className="text-3xl font-bold text-white mb-2">{ordenesPendientes}</div>
            <p className="text-sm text-zinc-400">Pendientes</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="bg-zinc-800/50 backdrop-blur-xl mb-6">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes ({ordenesPendientes})</TabsTrigger>
              <TabsTrigger value="pagadas">Pagadas ({ordenesPagadas})</TabsTrigger>
            </TabsList>

            <TabsContent value="todas">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Distribuidor</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Costo Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Deuda</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesCompraData.map((orden, idx) => (
                      <motion.tr
                        key={orden.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.05 }}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                      >
                        <td className="py-4 px-4">
                          <div className="font-mono text-sm text-blue-400">{orden.id}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-zinc-400">{orden.fecha}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-white group-hover/row:text-blue-400 transition-colors">
                            {orden.distribuidor}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                            {orden.cantidad} unidades
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-white">${(orden.costoTotal / 1000).toFixed(0)}K</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono text-red-400">${(orden.deuda / 1000).toFixed(0)}K</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {orden.estado === "pagado" ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pagado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
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

            <TabsContent value="pendientes">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Distribuidor</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Costo Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Deuda</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesCompraData
                      .filter((orden) => orden.estado === "pendiente")
                      .map((orden, idx) => (
                        <motion.tr
                          key={orden.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                        >
                          <td className="py-4 px-4">
                            <div className="font-mono text-sm text-blue-400">{orden.id}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-zinc-400">{orden.fecha}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white group-hover/row:text-blue-400 transition-colors">
                              {orden.distribuidor}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                              {orden.cantidad} unidades
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-white">${(orden.costoTotal / 1000).toFixed(0)}K</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-red-400">${(orden.deuda / 1000).toFixed(0)}K</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
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

            <TabsContent value="pagadas">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Fecha</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Distribuidor</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Cantidad</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Costo Total</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Deuda</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesCompraData
                      .filter((orden) => orden.estado === "pagado")
                      .map((orden, idx) => (
                        <motion.tr
                          key={orden.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                        >
                          <td className="py-4 px-4">
                            <div className="font-mono text-sm text-blue-400">{orden.id}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-zinc-400">{orden.fecha}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white group-hover/row:text-blue-400 transition-colors">
                              {orden.distribuidor}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                              {orden.cantidad} unidades
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-white">${(orden.costoTotal / 1000).toFixed(0)}K</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-mono text-red-400">${(orden.deuda / 1000).toFixed(0)}K</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pagado
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

      <CreateOrdenCompraModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
