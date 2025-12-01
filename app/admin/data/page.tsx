'use client'

/**
 * 🌱 PÁGINA DE ADMINISTRACIÓN DE DATOS - CHRONOS SYSTEM
 * 
 * Permite inicializar, limpiar y verificar datos en Firestore.
 * Esta página es solo para administradores.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  Database,
  RefreshCw,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Building2,
  Users,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  ArrowLeft,
} from 'lucide-react'
import { isFirebaseConfigured } from '@/app/lib/firebase/config'
import {
  seedAllData,
  clearAllData,
  getCollectionCount,
  SEED_BANCOS,
  SEED_CLIENTES,
  SEED_DISTRIBUIDORES,
  SEED_ORDENES_COMPRA,
  SEED_VENTAS,
  SEED_ALMACEN,
  SEED_MOVIMIENTOS,
} from '@/app/lib/firebase/seed-data.service'
import { useToast } from '@/app/hooks/use-toast'
import Link from 'next/link'

interface CollectionStatus {
  name: string
  icon: React.ReactNode
  color: string
  seedCount: number
  currentCount: number
  loading: boolean
}

export default function AdminDataPage() {
  const { toast } = useToast()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [collections, setCollections] = useState<CollectionStatus[]>([
    { name: 'bancos', icon: <Building2 className="w-5 h-5" />, color: 'blue', seedCount: SEED_BANCOS.length, currentCount: 0, loading: true },
    { name: 'clientes', icon: <Users className="w-5 h-5" />, color: 'cyan', seedCount: SEED_CLIENTES.length, currentCount: 0, loading: true },
    { name: 'distribuidores', icon: <Truck className="w-5 h-5" />, color: 'orange', seedCount: SEED_DISTRIBUIDORES.length, currentCount: 0, loading: true },
    { name: 'ordenes_compra', icon: <ShoppingCart className="w-5 h-5" />, color: 'purple', seedCount: SEED_ORDENES_COMPRA.length, currentCount: 0, loading: true },
    { name: 'ventas', icon: <DollarSign className="w-5 h-5" />, color: 'green', seedCount: SEED_VENTAS.length, currentCount: 0, loading: true },
    { name: 'almacen', icon: <Package className="w-5 h-5" />, color: 'amber', seedCount: SEED_ALMACEN.length, currentCount: 0, loading: true },
    { name: 'movimientos', icon: <RefreshCw className="w-5 h-5" />, color: 'teal', seedCount: SEED_MOVIMIENTOS.length, currentCount: 0, loading: true },
  ])

  // Cargar conteos actuales
  const loadCounts = useCallback(async () => {
    const updated = await Promise.all(
      collections.map(async (col) => ({
        ...col,
        currentCount: await getCollectionCount(col.name),
        loading: false,
      })),
    )
    setCollections(updated)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  // Inicializar datos
  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      const result = await seedAllData()
      
      if (result.success) {
        toast({
          title: '✅ Datos inicializados',
          description: 'Todos los datos semilla fueron cargados correctamente.',
        })
      } else {
        const errors = Object.entries(result.results)
          .filter(([, r]) => !r.success)
          .map(([name, r]) => `${name}: ${r.error}`)
          .join(', ')
        
        toast({
          title: '⚠️ Algunos errores',
          description: errors,
          variant: 'destructive',
        })
      }
      
      await loadCounts()
    } catch (error) {
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  // Limpiar datos
  const handleClearData = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro? Esto eliminará TODOS los datos de Firestore.')) {
      return
    }
    
    setIsClearing(true)
    try {
      await clearAllData()
      toast({
        title: '🗑️ Datos eliminados',
        description: 'Todas las colecciones fueron limpiadas.',
      })
      await loadCounts()
    } catch (error) {
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setIsClearing(false)
    }
  }

  const totalSeed = collections.reduce((acc, c) => acc + c.seedCount, 0)
  const totalCurrent = collections.reduce((acc, c) => acc + c.currentCount, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-xl" />
              <Database className="w-12 h-12 text-emerald-400 relative" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Administración de Datos
              </h1>
              <p className="text-zinc-400 text-sm">Inicializa y gestiona datos en Firebase Firestore</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFirebaseConfigured ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Firebase Conectado
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" />
                Firebase No Configurado
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Alerta si no hay Firebase */}
      {!isFirebaseConfigured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-semibold">Firebase no configurado</h3>
              <p className="text-yellow-400/70 text-sm mt-1">
                Configura las variables de entorno en <code className="bg-black/30 px-1 rounded">.env.local</code> para conectar con Firestore.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
        >
          <Upload className="w-8 h-8 text-emerald-400 mb-4" />
          <div className="text-3xl font-bold text-white">{totalSeed}</div>
          <p className="text-zinc-400 text-sm">Registros Semilla</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
        >
          <Database className="w-8 h-8 text-cyan-400 mb-4" />
          <div className="text-3xl font-bold text-white">{totalCurrent}</div>
          <p className="text-zinc-400 text-sm">Registros Actuales</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6"
        >
          <CheckCircle2 className="w-8 h-8 text-purple-400 mb-4" />
          <div className="text-3xl font-bold text-white">{collections.length}</div>
          <p className="text-zinc-400 text-sm">Colecciones</p>
        </motion.div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={handleSeedData}
          disabled={isSeeding || isClearing || !isFirebaseConfigured}
          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
        >
          {isSeeding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Inicializando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Inicializar Datos Semilla
            </>
          )}
        </Button>

        <Button
          onClick={loadCounts}
          disabled={isSeeding || isClearing}
          variant="outline"
          className="border-white/10 text-white/70 hover:bg-white/5"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar Conteos
        </Button>

        <Button
          onClick={handleClearData}
          disabled={isSeeding || isClearing || !isFirebaseConfigured}
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
        >
          {isClearing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Limpiando...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Todo
            </>
          )}
        </Button>
      </div>

      {/* Tabla de colecciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-semibold text-white">Estado de Colecciones</h2>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-black/20">
              <th className="text-left py-3 px-6 text-sm font-medium text-zinc-400">Colección</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-zinc-400">Datos Semilla</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-zinc-400">Datos Actuales</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-zinc-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((col, idx) => (
              <motion.tr
                key={col.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                className="border-b border-zinc-800/50 hover:bg-white/[0.02]"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${col.color}-500/10 text-${col.color}-400`}>
                      {col.icon}
                    </div>
                    <span className="text-white font-medium capitalize">{col.name.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {col.seedCount}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-center">
                  {col.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-500" />
                  ) : (
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                      {col.currentCount}
                    </Badge>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  {col.loading ? (
                    <span className="text-zinc-500">...</span>
                  ) : col.currentCount === 0 ? (
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                      Vacío
                    </Badge>
                  ) : col.currentCount === col.seedCount ? (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completo
                    </Badge>
                  ) : col.currentCount > col.seedCount ? (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      +{col.currentCount - col.seedCount} extra
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                      Parcial
                    </Badge>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Instrucciones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4">📋 Instrucciones</h3>
        <ul className="space-y-2 text-zinc-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">1.</span>
            Haz clic en <strong className="text-white">Inicializar Datos Semilla</strong> para cargar los datos de prueba del negocio.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">2.</span>
            Los datos se cargarán en las 7 colecciones principales de Firestore.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">3.</span>
            Regresa al dashboard para ver los datos reflejados en todos los paneles.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">⚠️</span>
            <strong className="text-white">Limpiar Todo</strong> eliminará permanentemente todos los datos.
          </li>
        </ul>
      </motion.div>
    </div>
  )
}
