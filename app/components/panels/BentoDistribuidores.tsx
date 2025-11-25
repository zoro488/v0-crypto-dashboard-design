"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building2, AlertCircle, CheckCircle2, Clock, DollarSign, Package, Plus } from "lucide-react"
import { Button } from "@/frontend/app/components/ui/button"
import { Badge } from "@/frontend/app/components/ui/badge"
import { useDistribuidores, useOrdenesCompra } from "@/frontend/app/lib/firebase/firestore-hooks.service"
import CreateDistribuidorModal from "@/frontend/app/components/modals/CreateDistribuidorModal"
import CreateAbonoModal from "@/frontend/app/components/modals/CreateAbonoModal"
import { Skeleton } from "@/frontend/app/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/app/components/ui/alert"

// Interface para distribuidor
interface DistribuidorData {
  id?: string
  nombre?: string
  totalOrdenesCompra?: number
  deudaTotal?: number
  totalPagado?: number
  [key: string]: unknown
}

export default function BentoDistribuidores() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)
  const { data: distribuidoresRaw, loading: loadingDist, error: errorDist } = useDistribuidores()
  const { data: ordenesCompra = [], loading: loadingOC, error: errorOC } = useOrdenesCompra()

  // Casting seguro
  const distribuidores = distribuidoresRaw as DistribuidorData[] | undefined

  const [internalLoading, setInternalLoading] = useState(true)

  useEffect(() => {
    if (!loadingDist && !loadingOC) {
      setInternalLoading(false)
    }
  }, [loadingDist, loadingOC, distribuidores, ordenesCompra, errorDist, errorOC])

  // Timeout de seguridad
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalLoading) {
        setInternalLoading(false)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [internalLoading])

  const isLoading = internalLoading || (loadingDist && loadingOC) // Show loading if both are strictly loading, otherwise show what we have

  const topDistribuidores = distribuidores
    ? [...distribuidores].sort((a, b) => (b.totalOrdenesCompra ?? 0) - (a.totalOrdenesCompra ?? 0)).slice(0, 5)
    : []

  const totalDeuda = distribuidores?.reduce((acc, d) => acc + (d.deudaTotal ?? 0), 0) ?? 0
  const totalOrdenesCompra = distribuidores?.reduce((acc, d) => acc + (d.totalOrdenesCompra ?? 0), 0) ?? 0
  const totalPagado = distribuidores?.reduce((acc, d) => acc + (d.totalPagado ?? 0), 0) ?? 0
  const distribuidoresPendientes = distribuidores?.filter((d) => (d.deudaTotal ?? 0) > 0).length ?? 0

  if (isLoading) {
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
      {(errorDist || errorOC) && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>
              No se pudieron cargar algunos datos. Es posible que falten permisos de Firestore.
              {(errorDist || errorOC)?.includes("Missing or insufficient permissions") && (
                <span className="block mt-1 text-xs opacity-80">
                  Configure las reglas de seguridad en la consola de Firebase.
                </span>
              )}
            </AlertDescription>
          </Alert>
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
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl" />
            <Building2 className="w-12 h-12 text-purple-400 relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Distribuidores
            </h1>
            <p className="text-zinc-400 text-sm">Gestión completa de proveedores</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAbonoModal(true)}
            variant="outline"
            className="border-green-500/20 hover:bg-green-500/10 text-green-400"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Distribuidor
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-purple-400" />
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                Total Compras
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${(totalOrdenesCompra / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">Valor total de órdenes</p>
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
              <AlertCircle className="w-8 h-8 text-red-400" />
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                Adeudo
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${(totalDeuda / 1000000).toFixed(2)}M</div>
            <p className="text-sm text-zinc-400">{distribuidoresPendientes} distribuidores pendientes</p>
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
                Pagado
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">${(totalPagado / 1000).toFixed(0)}K</div>
            <p className="text-sm text-zinc-400">Pagos realizados</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-cyan-400" />
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                Órdenes
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{ordenesCompra.length}</div>
            <p className="text-sm text-zinc-400">Órdenes de compra totales</p>
          </div>
        </motion.div>
      </div>

      {/* Tabla Distribuidores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Distribuidores</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Distribuidor</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Total Compras</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Adeudo</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-zinc-400">Pagado</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Órdenes</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-zinc-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {topDistribuidores.map((dist, idx) => (
                  <motion.tr
                    key={dist.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group/row"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover/row:text-purple-400 transition-colors">
                            {dist.nombre ?? "-"}
                          </div>
                          <div className="text-xs text-zinc-500">{dist.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-white">${((dist.totalOrdenesCompra ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-red-400">${((dist.deudaTotal ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-mono text-green-400">${((dist.totalPagado ?? 0) / 1000).toFixed(0)}K</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                        {Array.isArray(dist.ordenesCompra) ? dist.ordenesCompra.length : 0}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {(dist.deudaTotal ?? 0) === 0 ? (
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

      {/* Create Distribuidor Modal */}
      <CreateDistribuidorModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSubmit={() => {}} 
      />
      <CreateAbonoModal isOpen={showAbonoModal} onClose={() => setShowAbonoModal(false)} />
    </div>
  )
}
