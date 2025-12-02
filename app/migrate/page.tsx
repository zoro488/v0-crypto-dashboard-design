'use client'

/**
 * 📦 PÁGINA DE MIGRACIÓN DE DATOS
 * 
 * Esta página permite migrar datos desde los CSVs al Firestore
 * directamente desde el navegador.
 */

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { logger } from '@/app/lib/utils/logger'
import { 
  collection, 
  doc, 
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config'
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Database,
  Users,
  ShoppingCart,
  Truck,
  Building2,
  Banknote,
} from 'lucide-react'

// Datos iniciales de prueba
const DATOS_INICIALES = {
  bancos: [
    { id: 'boveda_monte', nombre: 'Bóveda Monte', tipo: 'boveda', color: 'blue', historicoIngresos: 0, historicoGastos: 0, capitalActual: 0 },
    { id: 'boveda_usa', nombre: 'Bóveda USA', tipo: 'boveda', color: 'purple', historicoIngresos: 0, historicoGastos: 0, capitalActual: 0 },
    { id: 'profit', nombre: 'Profit', tipo: 'banco', color: 'green', historicoIngresos: 0, historicoGastos: 0, capitalActual: 0 },
    { id: 'leftie', nombre: 'Leftie', tipo: 'banco', color: 'orange', historicoIngresos: 0, historicoGastos: 0, capitalActual: 0 },
    { id: 'azteca', nombre: 'Azteca', tipo: 'banco', color: 'red', historicoIngresos: 0, historicoGastos: 0, capitalActual: 0 },
    { id: 'flete_sur', nombre: 'Flete Sur', tipo: 'flete', color: 'yellow', historicoIngresos: 0, historicoGastos: 0, capitalActual: 0 },
    { id: 'utilidades', nombre: 'Utilidades', tipo: 'utilidad', color: 'emerald', historicoIngresos: 0, historicoGastos: 0, capitalActual: 0 },
  ],
  distribuidores: [
    { id: 'dist_pacman', nombre: 'PACMAN', telefono: '555-0001', precioCompra: 6100, precioFlete: 200, activo: true, deudaTotal: 0 },
    { id: 'dist_qmaya', nombre: 'Q-MAYA', telefono: '555-0002', precioCompra: 6100, precioFlete: 200, activo: true, deudaTotal: 0 },
    { id: 'dist_ax', nombre: 'A/X🌶️🦀', telefono: '555-0003', precioCompra: 6100, precioFlete: 200, activo: true, deudaTotal: 0 },
    { id: 'dist_chmonte', nombre: 'CH-MONTE', telefono: '555-0004', precioCompra: 6100, precioFlete: 200, activo: true, deudaTotal: 0 },
    { id: 'dist_vallemonte', nombre: 'VALLE-MONTE', telefono: '555-0005', precioCompra: 6100, precioFlete: 200, activo: true, deudaTotal: 0 },
  ],
  clientes: [
    { id: 'cli_bodega_mp', nombre: 'Bódega M-P', telefono: '555-1001', pendiente: 945000, totalCompras: 945000 },
    { id: 'cli_valle', nombre: 'Valle', telefono: '555-1002', pendiente: 378000, totalCompras: 408000 },
    { id: 'cli_ax', nombre: 'Ax', telefono: '555-1003', pendiente: 0, totalCompras: 350000 },
    { id: 'cli_negrito', nombre: 'Negrito', telefono: '555-1004', pendiente: 0, totalCompras: 175000 },
    { id: 'cli_primo', nombre: 'Primo', telefono: '555-1005', pendiente: 0, totalCompras: 0 },
    { id: 'cli_tavo', nombre: 'Tavo', telefono: '555-1006', pendiente: 0, totalCompras: 0 },
    { id: 'cli_robalo', nombre: 'Robalo', telefono: '555-1007', pendiente: 234000, totalCompras: 660000 },
  ],
  ventas: [
    { 
      id: 'venta_001', 
      fecha: '2025-08-23', 
      clienteId: 'cli_bodega_mp', 
      clienteNombre: 'Bódega M-P',
      ocRelacionada: 'OC0001',
      cantidad: 150, 
      precioVenta: 6300,
      precioCompra: 6100,
      precioFlete: 500,
      totalIngreso: 945000,
      bovedaMonte: 915000,
      fletes: 75000,
      utilidad: 0,
      estadoPago: 'pendiente',
      montoPagado: 0,
    },
    { 
      id: 'venta_002', 
      fecha: '2025-08-23', 
      clienteId: 'cli_valle', 
      clienteNombre: 'Valle',
      ocRelacionada: 'OC0001',
      cantidad: 60, 
      precioVenta: 6800,
      precioCompra: 6100,
      precioFlete: 500,
      totalIngreso: 408000,
      bovedaMonte: 366000,
      fletes: 30000,
      utilidad: 12000,
      estadoPago: 'pendiente',
      montoPagado: 0,
    },
    { 
      id: 'venta_003', 
      fecha: '2025-08-23', 
      clienteId: 'cli_ax', 
      clienteNombre: 'Ax',
      ocRelacionada: 'OC0001',
      cantidad: 50, 
      precioVenta: 7000,
      precioCompra: 6100,
      precioFlete: 500,
      totalIngreso: 350000,
      bovedaMonte: 305000,
      fletes: 25000,
      utilidad: 20000,
      estadoPago: 'completo',
      montoPagado: 350000,
    },
  ],
  ordenes_compra: [
    {
      id: 'OC0001',
      fecha: '2025-08-25',
      distribuidorId: 'dist_qmaya',
      distribuidorNombre: 'Q-MAYA',
      cantidad: 423,
      costoDistribuidor: 6100,
      costoTransporte: 200,
      costoPorUnidad: 6300,
      costoTotal: 2664900,
      pagoDistribuidor: 0,
      deuda: 2664900,
      estado: 'pendiente',
      stockActual: 0,
    },
    {
      id: 'OC0002',
      fecha: '2025-08-25',
      distribuidorId: 'dist_qmaya',
      distribuidorNombre: 'Q-MAYA',
      cantidad: 32,
      costoDistribuidor: 6100,
      costoTransporte: 200,
      costoPorUnidad: 6300,
      costoTotal: 201600,
      pagoDistribuidor: 0,
      deuda: 201600,
      estado: 'pendiente',
      stockActual: 0,
    },
    {
      id: 'OC0003',
      fecha: '2025-08-25',
      distribuidorId: 'dist_ax',
      distribuidorNombre: 'A/X🌶️🦀',
      cantidad: 33,
      costoDistribuidor: 6100,
      costoTransporte: 200,
      costoPorUnidad: 6300,
      costoTotal: 207900,
      pagoDistribuidor: 0,
      deuda: 207900,
      estado: 'pendiente',
      stockActual: 0,
    },
    {
      id: 'OC0004',
      fecha: '2025-08-30',
      distribuidorId: 'dist_pacman',
      distribuidorNombre: 'PACMAN',
      cantidad: 487,
      costoDistribuidor: 6100,
      costoTransporte: 200,
      costoPorUnidad: 6300,
      costoTotal: 3068100,
      pagoDistribuidor: 0,
      deuda: 3068100,
      estado: 'pendiente',
      stockActual: 0,
    },
  ],
}

type MigrationStatus = 'idle' | 'running' | 'success' | 'error'

interface CollectionStatus {
  name: string
  icon: React.ReactNode
  status: MigrationStatus
  count: number
  error?: string
}

export default function MigratePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [collections, setCollections] = useState<CollectionStatus[]>([
    { name: 'bancos', icon: <Banknote className="w-4 h-4" />, status: 'idle', count: 0 },
    { name: 'distribuidores', icon: <Truck className="w-4 h-4" />, status: 'idle', count: 0 },
    { name: 'clientes', icon: <Users className="w-4 h-4" />, status: 'idle', count: 0 },
    { name: 'ventas', icon: <ShoppingCart className="w-4 h-4" />, status: 'idle', count: 0 },
    { name: 'ordenes_compra', icon: <Building2 className="w-4 h-4" />, status: 'idle', count: 0 },
  ])

  const updateCollectionStatus = (name: string, update: Partial<CollectionStatus>) => {
    setCollections(prev => prev.map(c => 
      c.name === name ? { ...c, ...update } : c,
    ))
  }

  const migrateCollection = async (
    collectionName: string, 
    data: Array<{ id: string; [key: string]: unknown }>,
  ) => {
    if (!db) {
      throw new Error('Firestore no disponible')
    }

    updateCollectionStatus(collectionName, { status: 'running' })

    try {
      const batch = writeBatch(db)
      
      for (const item of data) {
        const { id, ...docData } = item
        const docRef = doc(db, collectionName, id)
        batch.set(docRef, {
          ...docData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      await batch.commit()
      updateCollectionStatus(collectionName, { status: 'success', count: data.length })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      updateCollectionStatus(collectionName, { status: 'error', error: errorMsg })
      throw error
    }
  }

  const runMigration = async () => {
    if (!isFirebaseConfigured || !db) {
      logger.error('Firebase no está configurado. Verifica las variables de entorno.', undefined, { context: 'MigratePage' })
      return
    }

    setIsRunning(true)
    
    try {
      // Migrar en orden
      await migrateCollection('bancos', DATOS_INICIALES.bancos)
      await migrateCollection('distribuidores', DATOS_INICIALES.distribuidores)
      await migrateCollection('clientes', DATOS_INICIALES.clientes)
      await migrateCollection('ventas', DATOS_INICIALES.ventas)
      await migrateCollection('ordenes_compra', DATOS_INICIALES.ordenes_compra)
      
      logger.info('Migración completada exitosamente!', { context: 'MigratePage' })
    } catch (error) {
      logger.error('Error en migración', error as Error, { context: 'MigratePage' })
    } finally {
      setIsRunning(false)
    }
  }

  const checkExistingData = async () => {
    if (!db) return

    for (const col of collections) {
      try {
        const snapshot = await getDocs(collection(db, col.name))
        updateCollectionStatus(col.name, { count: snapshot.size })
      } catch {
        // Colección no existe o sin permisos
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-3xl font-bold mb-2">Migración de Datos</h1>
          <p className="text-zinc-400">
            Sistema CHRONOS - Migrar datos iniciales a Firestore
          </p>
        </div>

        {/* Status de Firebase */}
        <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Estado de Firebase:</span>
            {isFirebaseConfigured ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                <XCircle className="w-3 h-3 mr-1" />
                No Configurado
              </Badge>
            )}
          </div>
        </div>

        {/* Lista de colecciones */}
        <div className="space-y-3 mb-6">
          {collections.map((col) => (
            <div 
              key={col.name}
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  {col.icon}
                </div>
                <div>
                  <p className="font-medium capitalize">{col.name.replace('_', ' ')}</p>
                  <p className="text-xs text-zinc-500">
                    {col.count > 0 ? `${col.count} registros` : 'Sin datos'}
                  </p>
                </div>
              </div>
              <div>
                {col.status === 'idle' && (
                  <Badge variant="outline" className="text-zinc-400">Pendiente</Badge>
                )}
                {col.status === 'running' && (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Migrando...
                  </Badge>
                )}
                {col.status === 'success' && (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completado
                  </Badge>
                )}
                {col.status === 'error' && (
                  <Badge className="bg-red-500/20 text-red-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4">
          <Button
            onClick={checkExistingData}
            variant="outline"
            className="flex-1"
            disabled={!isFirebaseConfigured}
          >
            <Database className="w-4 h-4 mr-2" />
            Verificar Datos
          </Button>
          <Button
            onClick={runMigration}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isRunning || !isFirebaseConfigured}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Iniciar Migración
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-yellow-200">
            <strong>⚠️ Importante:</strong> Esta migración creará datos iniciales de prueba.
            Los datos existentes con el mismo ID serán sobrescritos.
          </p>
        </div>
      </div>
    </div>
  )
}
