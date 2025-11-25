"use client"

import { motion } from "framer-motion"
import { Users, AlertTriangle, CheckCircle2, Clock, DollarSign, Plus } from "lucide-react"
import { Button } from "@/frontend/app/components/ui/button"
import { Badge } from "@/frontend/app/components/ui/badge"
import { useClientes } from "@/frontend/app/lib/firebase/firestore-hooks.service"
import CreateClienteModal from "@/frontend/app/components/modals/CreateClienteModal"
import CreateAbonoModal from "@/frontend/app/components/modals/CreateAbonoModal" // Import CreateAbonoModal
import { useState } from "react"
import { Skeleton } from "@/frontend/app/components/ui/skeleton"
import { ClientNetworkGraph } from "@/frontend/app/components/visualizations/ClientNetworkGraph"

// Interface para cliente
interface ClienteData {
  id?: string
  nombre?: string
  totalVentas?: number
  deudaTotal?: number
  totalPagado?: number
  [key: string]: unknown
}

export default function BentoClientes() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false) // State for Abono Modal
  const { data: clientesRaw, loading } = useClientes()
  
  // Casting seguro
  const clientes = clientesRaw as ClienteData[] | undefined

  const topClientes = clientes?.sort((a, b) => (b.totalVentas ?? 0) - (a.totalVentas ?? 0)).slice(0, 5) ?? []
  const totalDeuda = clientes?.reduce((acc, c) => acc + (c.deudaTotal ?? 0), 0) ?? 0
  const totalVentas = clientes?.reduce((acc, c) => acc + (c.totalVentas ?? 0), 0) ?? 0
  const totalCobrado = clientes?.reduce((acc, c) => acc + (c.totalPagado ?? 0), 0) ?? 0
  const clientesPendientes = clientes?.filter((c) => (c.deudaTotal ?? 0) > 0).length ?? 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl" />
            <Users className="w-12 h-12 text-cyan-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Clientes
            </h1>
            <p className="text-zinc-400 text-sm">Cartera de clientes y adeudos</p>
          </div>
        </div>
        <div className="flex gap-3">
          {" "}
          {/* Container for buttons */}
          <Button
            onClick={() => setShowAbonoModal(true)}
            variant="outline"
            className="border-green-500/20 hover:bg-green-500/10 text-green-400"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Registrar Abono
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </motion.div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                Total Ventas
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${(totalVentas / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Valor total vendido</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-red-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                Por Cobrar
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${(totalDeuda / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">{clientesPendientes} clientes con adeudo</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                Cobrado
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${(totalCobrado / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Pagos recibidos</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-400" />
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                Clientes
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{clientes?.length || 0}</div>
            <p className="text-sm text-zinc-400">Total de clientes activos</p>
          </div>
        </motion.div>
      </div>
      {/* Tabla Clientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cliente</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total Ventas</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Adeudo</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pagado</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {topClientes.map((cliente, idx) => (
                  <motion.tr
                    key={cliente.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover/row:text-cyan-400 transition-colors">
                            {cliente.nombre ?? "-"}
                          </div>
                          <div className="text-xs text-zinc-500">{cliente.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-white">${((cliente.totalVentas ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-red-400">${((cliente.deudaTotal ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-green-400">${((cliente.totalPagado ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {(cliente.deudaTotal ?? 0) === 0 ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Saldado
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
        </div>
      </motion.div>
      {/* Create Cliente Modal */}
      <CreateClienteModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSubmit={() => {}} 
      />
      <CreateAbonoModal isOpen={showAbonoModal} onClose={() => setShowAbonoModal(false)} /> {/* Add Abono Modal */}

      {/* Client Network Graph - Premium Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass p-6 rounded-2xl border border-white/5 bg-black/20 mt-6"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Red de Clientes</h3>
          <p className="text-sm text-white/60">Grafo interactivo de relaciones comerciales</p>
        </div>
        <ClientNetworkGraph width={900} height={600} className="w-full" />
      </motion.div>
    </div>
  )
}
