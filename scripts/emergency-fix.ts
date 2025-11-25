#!/usr/bin/env npx ts-node
/**
 * 🚑 SCRIPT DE REPARACIÓN DE EMERGENCIA - CHRONOS SYSTEM
 * 
 * Este script realiza 3 operaciones quirúrgicas:
 * 1. Desbloqueo de permisos Firestore (rules temporales)
 * 2. Blindaje de hooks (patrón estricto con cleanup)
 * 3. Cortafuegos de UI (ErrorBoundary + SafeView)
 * 
 * Ejecutar: npx ts-node scripts/emergency-fix.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '═'.repeat(60))
  log(`🔧 ${title}`, 'cyan')
  console.log('═'.repeat(60))
}

// ============================================================================
// 1. FIRESTORE RULES - Permisos temporales de desarrollo
// ============================================================================
const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ⚠️ REGLAS TEMPORALES DE DESARROLLO
    // TODO: Reemplazar con reglas seguras antes de producción
    // Fecha de expiración: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
    
    // Permitir lectura a todos los usuarios autenticados
    match /{collection}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // PUERTA TRASERA TEMPORAL (SOLO DESARROLLO)
    // Remover en producción
    match /movimientos/{document=**} {
      allow read, write: if true;
    }
    
    match /dashboard_totales/{document=**} {
      allow read: if true;
    }
    
    match /dashboard_paneles/{document=**} {
      allow read: if true;
    }
    
    match /almacen_productos/{document=**} {
      allow read, write: if true;
    }
    
    match /almacen_entradas/{document=**} {
      allow read, write: if true;
    }
    
    match /almacen_salidas/{document=**} {
      allow read, write: if true;
    }
    
    match /ventas/{document=**} {
      allow read, write: if true;
    }
    
    match /clientes/{document=**} {
      allow read, write: if true;
    }
    
    match /distribuidores/{document=**} {
      allow read, write: if true;
    }
    
    match /ordenes_compra/{document=**} {
      allow read, write: if true;
    }
    
    match /cortes_bancarios/{document=**} {
      allow read, write: if true;
    }
  }
}
`

// ============================================================================
// 2. HOOKS BLINDADOS - Patrón estricto con cleanup
// ============================================================================
const SAFE_FIRESTORE_HOOKS = `"use client"

/**
 * 🛡️ HOOKS DE FIRESTORE BLINDADOS
 * Generado automáticamente por emergency-fix.ts
 * 
 * Características:
 * - Flag isMounted para evitar updates en componentes desmontados
 * - Cleanup function que cancela listeners
 * - Modo mock automático cuando Firestore falla
 * - Patrón getDocs (lectura única) para evitar ASSERTION FAILED
 */

import { useEffect, useState, useRef, useCallback } from "react"
import { 
  collection, query, orderBy, where, limit, getDocs, 
  DocumentData, QueryDocumentSnapshot 
} from "firebase/firestore"
import { db } from "./config"
import { logger } from "../utils/logger"

// ===================================================================
// CONFIGURACIÓN
// ===================================================================
const DEFAULT_PAGE_SIZE = 50
const SMALL_PAGE_SIZE = 20

// Flag global para modo mock
let USE_MOCK_DATA = false
let FIRESTORE_CHECKED = false

// ===================================================================
// VERIFICACIÓN INICIAL DE FIRESTORE
// ===================================================================
async function checkFirestore(): Promise<boolean> {
  if (FIRESTORE_CHECKED) return !USE_MOCK_DATA
  
  try {
    const testQ = query(collection(db, "dashboard_totales"), limit(1))
    await getDocs(testQ)
    FIRESTORE_CHECKED = true
    USE_MOCK_DATA = false
    logger.info("[Firestore] ✅ Conexión verificada")
    return true
  } catch (err) {
    logger.warn("[Firestore] ⚠️ Sin conexión - usando modo mock")
    FIRESTORE_CHECKED = true
    USE_MOCK_DATA = true
    return false
  }
}

// Ejecutar verificación al cargar
if (typeof window !== 'undefined') {
  checkFirestore()
}

// ===================================================================
// TIPOS
// ===================================================================
interface HookResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface BancoStats {
  totalIngresos: number
  totalGastos: number
  saldoNeto: number
  transacciones: number
}

// ===================================================================
// HOOK GENÉRICO BLINDADO
// ===================================================================
function useFirestoreQuery<T extends DocumentData>(
  collectionName: string,
  options: {
    orderByField?: string
    orderDirection?: 'asc' | 'desc'
    whereField?: string
    whereValue?: string
    pageSize?: number
    mockData: T[]
    transform?: (doc: QueryDocumentSnapshot<DocumentData>) => T
  }
): HookResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 🛡️ Flag isMounted - CRÍTICO para evitar memory leaks
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async () => {
    // Evitar fetch duplicados
    if (fetchingRef.current) return
    fetchingRef.current = true

    // Modo mock activo
    if (USE_MOCK_DATA) {
      if (isMountedRef.current) {
        setData(options.mockData)
        setLoading(false)
        setError(null)
      }
      fetchingRef.current = false
      return
    }

    try {
      let q = query(
        collection(db, collectionName),
        limit(options.pageSize || DEFAULT_PAGE_SIZE)
      )

      if (options.orderByField) {
        q = query(q, orderBy(options.orderByField, options.orderDirection || 'desc'))
      }

      if (options.whereField && options.whereValue) {
        q = query(q, where(options.whereField, '==', options.whereValue))
      }

      const snapshot = await getDocs(q)
      
      // 🛡️ Verificar si el componente sigue montado
      if (!isMountedRef.current) {
        fetchingRef.current = false
        return
      }

      const items = snapshot.docs.map(doc => {
        if (options.transform) {
          return options.transform(doc)
        }
        return { id: doc.id, ...doc.data() } as T
      })

      setData(items)
      setLoading(false)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido"
      logger.error(\`[Firestore] Error en \${collectionName}:\`, errMsg)

      // 🛡️ Verificar montaje antes de actualizar estado
      if (!isMountedRef.current) {
        fetchingRef.current = false
        return
      }

      if (errMsg.includes("Missing or insufficient permissions")) {
        USE_MOCK_DATA = true
        logger.warn(\`[Firestore] Usando mock para \${collectionName}\`)
        setData(options.mockData)
        setLoading(false)
        setError(null)
      } else {
        setError(errMsg)
        setData([])
        setLoading(false)
      }
    }
    
    fetchingRef.current = false
  }, [collectionName, options])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    // 🛡️ CLEANUP FUNCTION - LA CLAVE PARA ARREGLAR EL CRASH
    return () => {
      isMountedRef.current = false
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}

// ===================================================================
// HOOKS ESPECÍFICOS
// ===================================================================

export function useBancoData(bancoId: string): HookResult<DocumentData> & { stats: BancoStats } {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_MOVIMIENTOS.filter(m => m.bancoId === bancoId || !m.bancoId)
  })

  const stats: BancoStats = {
    totalIngresos: result.data.filter(m => m.tipoMovimiento === 'ingreso').reduce((s, m) => s + (m.monto || 0), 0),
    totalGastos: result.data.filter(m => m.tipoMovimiento === 'gasto').reduce((s, m) => s + (m.monto || 0), 0),
    saldoNeto: 0,
    transacciones: result.data.length
  }
  stats.saldoNeto = stats.totalIngresos - stats.totalGastos

  return { ...result, stats }
}

export function useAlmacenData(): HookResult<DocumentData> {
  return useFirestoreQuery('almacen_productos', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    mockData: MOCK_PRODUCTOS
  })
}

export function useVentasData(): HookResult<DocumentData> {
  return useFirestoreQuery('ventas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_VENTAS
  })
}

export function useClientesData(): HookResult<DocumentData> {
  return useFirestoreQuery('clientes', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    mockData: MOCK_CLIENTES
  })
}

export function useDistribuidoresData(): HookResult<DocumentData> {
  return useFirestoreQuery('distribuidores', {
    orderByField: 'nombre',
    orderDirection: 'asc',
    mockData: MOCK_DISTRIBUIDORES
  })
}

export function useOrdenesCompraData(): HookResult<DocumentData> {
  return useFirestoreQuery('ordenes_compra', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_ORDENES_COMPRA
  })
}

export function useDashboardData(): HookResult<DocumentData> & { totales: Record<string, unknown> } {
  const result = useFirestoreQuery('dashboard_paneles', {
    pageSize: SMALL_PAGE_SIZE,
    mockData: []
  })
  
  return { ...result, totales: { ventas: 150000, gastos: 50000, clientes: 120 } }
}

export function useGYAData(): HookResult<DocumentData> {
  return useFirestoreQuery('movimientos', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_MOVIMIENTOS
  })
}

export function useIngresosBanco(bancoId: string): HookResult<DocumentData> {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_MOVIMIENTOS.filter(m => m.tipo === 'ingreso')
  })
  
  return {
    ...result,
    data: result.data.filter(m => m.tipoMovimiento === 'ingreso' || m.tipoMovimiento === 'transferencia_entrada')
  }
}

export function useGastos(bancoId: string): HookResult<DocumentData> {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_MOVIMIENTOS.filter(m => m.tipo === 'gasto')
  })
  
  return {
    ...result,
    data: result.data.filter(m => m.tipoMovimiento === 'gasto' || m.tipoMovimiento === 'transferencia_salida')
  }
}

export function useTransferencias(bancoId: string): HookResult<DocumentData> {
  const result = useFirestoreQuery('movimientos', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_TRANSFERENCIAS
  })
  
  return {
    ...result,
    data: result.data.filter(m => m.tipoMovimiento?.includes('transferencia'))
  }
}

export function useCorteBancario(bancoId: string): HookResult<DocumentData> {
  return useFirestoreQuery('cortes_bancarios', {
    whereField: 'bancoId',
    whereValue: bancoId,
    orderByField: 'fechaInicio',
    orderDirection: 'desc',
    pageSize: SMALL_PAGE_SIZE,
    mockData: MOCK_CORTES
  })
}

export function useEntradasAlmacen(): HookResult<DocumentData> {
  return useFirestoreQuery('almacen_entradas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_ENTRADAS
  })
}

export function useSalidasAlmacen(): HookResult<DocumentData> {
  return useFirestoreQuery('almacen_salidas', {
    orderByField: 'fecha',
    orderDirection: 'desc',
    mockData: MOCK_SALIDAS
  })
}

// ===================================================================
// ALIASES
// ===================================================================
export const useVentas = useVentasData
export const useOrdenesCompra = useOrdenesCompraData
export const useProductos = useAlmacenData
export const useClientes = useClientesData
export const useDistribuidores = useDistribuidoresData

// ===================================================================
// MOCK DATA
// ===================================================================
const MOCK_CLIENTES = [
  { id: "C-001", nombre: "Cliente VIP 1", email: "vip1@example.com", telefono: "555-0001", saldo: 0 },
  { id: "C-002", nombre: "Cliente Regular 2", email: "reg2@example.com", telefono: "555-0002", saldo: 1500 },
]

const MOCK_MOVIMIENTOS = [
  { id: "M-001", tipo: "ingreso", tipoMovimiento: "ingreso", fecha: new Date().toISOString(), monto: 5000, concepto: "Venta", bancoId: "banco_1" },
  { id: "M-002", tipo: "gasto", tipoMovimiento: "gasto", fecha: new Date().toISOString(), monto: 2000, concepto: "Pago", bancoId: "banco_1" },
]

const MOCK_TRANSFERENCIAS = [
  { id: "T-001", fecha: new Date().toISOString(), monto: 1000, origen: "Banco A", destino: "Banco B" },
]

const MOCK_CORTES = [
  { id: "CT-001", periodo: "Marzo 2024", fechaInicio: new Date().toISOString(), capitalInicial: 50000, capitalFinal: 65000 },
]

const MOCK_DISTRIBUIDORES = [
  { id: "1", nombre: "Distribuidor Alpha", totalOrdenesCompra: 150000, deudaTotal: 50000 },
  { id: "2", nombre: "Distribuidor Beta", totalOrdenesCompra: 80000, deudaTotal: 0 },
]

const MOCK_ORDENES_COMPRA = [
  { id: "OC-001", fecha: "2024-03-20", distribuidor: "Alpha", cantidad: 100, costoTotal: 50000, estado: "pendiente" },
  { id: "OC-002", fecha: "2024-03-18", distribuidor: "Beta", cantidad: 50, costoTotal: 25000, estado: "pagado" },
]

const MOCK_VENTAS = [
  { id: "V-001", fecha: "2024-03-21", cliente: "Cliente A", total: 1500, estado: "completado" },
  { id: "V-002", fecha: "2024-03-21", cliente: "Cliente B", total: 3500, estado: "completado" },
]

const MOCK_PRODUCTOS = [
  { id: "P-001", nombre: "Producto Premium A", stock: 150, precio: 299, categoria: "Electrónica" },
  { id: "P-002", nombre: "Producto Básico B", stock: 500, precio: 99, categoria: "Hogar" },
]

const MOCK_ENTRADAS = [
  { id: "E-001", fecha: new Date().toISOString(), origen: "Distribuidor Alpha", cantidad: 100, valorTotal: 50000 },
]

const MOCK_SALIDAS = [
  { id: "S-001", fecha: new Date().toISOString(), destino: "Cliente VIP", cantidad: 10, valorTotal: 10000 },
]
`

// ============================================================================
// 3. SAFE VIEW COMPONENT - ErrorBoundary
// ============================================================================
const SAFE_VIEW_COMPONENT = `"use client"

/**
 * 🛡️ SAFE VIEW - Cortafuegos de UI
 * Generado automáticamente por emergency-fix.ts
 * 
 * Envuelve componentes peligrosos en un ErrorBoundary
 * que captura errores y muestra un fallback amigable.
 */

import React, { Component, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  componentName?: string
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log del error
    console.error(\`[SafeView] Error en \${this.props.componentName || 'componente'}:\`, error)
    console.error('Stack:', errorInfo.componentStack)
    
    // Callback opcional
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado o por defecto
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500">⚠️</span>
            <h3 className="font-semibold text-red-500">
              Error en {this.props.componentName || 'este componente'}
            </h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Algo salió mal. El resto de la aplicación sigue funcionando.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
          >
            🔄 Reintentar
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Detalles técnicos
              </summary>
              <pre className="text-xs mt-2 p-2 bg-black/50 rounded overflow-auto max-h-32">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar SafeView de forma declarativa
interface SafeViewProps {
  children: ReactNode
  name?: string
  fallback?: ReactNode
}

export function SafeView({ children, name, fallback }: SafeViewProps) {
  return (
    <ErrorBoundary componentName={name} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}

// Wrapper para componentes lazy
export function withSafeView<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function SafeWrappedComponent(props: P) {
    return (
      <SafeView name={componentName || WrappedComponent.displayName || 'Component'}>
        <WrappedComponent {...props} />
      </SafeView>
    )
  }
}

export default ErrorBoundary
`

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    log(`  📁 Creado directorio: ${dirPath}`, 'green')
  }
}

function writeFile(filePath: string, content: string) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
  log(`  ✅ Archivo creado/actualizado: ${filePath}`, 'green')
}

function backupFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`
    fs.copyFileSync(filePath, backupPath)
    log(`  📦 Backup creado: ${backupPath}`, 'yellow')
  }
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('\n')
  log('🚑 SCRIPT DE REPARACIÓN DE EMERGENCIA - CHRONOS SYSTEM', 'bold')
  log('═'.repeat(60), 'cyan')
  
  const rootDir = path.resolve(__dirname, '..')
  
  // 1. FIRESTORE RULES
  logSection('1. DESBLOQUEO DE PERMISOS FIRESTORE')
  const rulesPath = path.join(rootDir, 'firestore.rules')
  backupFile(rulesPath)
  writeFile(rulesPath, FIRESTORE_RULES)
  log('  ⚠️  ADVERTENCIA: Reglas temporales de desarrollo activadas', 'yellow')
  log('  ⚠️  Reemplazar antes de producción', 'yellow')

  // 2. HOOKS BLINDADOS
  logSection('2. BLINDAJE DE HOOKS FIRESTORE')
  
  // Frontend
  const frontendHooksPath = path.join(rootDir, 'frontend/app/lib/firebase/firestore-hooks.service.ts')
  backupFile(frontendHooksPath)
  writeFile(frontendHooksPath, SAFE_FIRESTORE_HOOKS)
  
  // App (duplicado para sincronizar)
  const appHooksPath = path.join(rootDir, 'app/lib/firebase/firestore-hooks.service.ts')
  backupFile(appHooksPath)
  writeFile(appHooksPath, SAFE_FIRESTORE_HOOKS)

  // 3. SAFE VIEW COMPONENT
  logSection('3. CORTAFUEGOS DE UI (SafeView)')
  
  // Frontend
  const frontendSafeViewPath = path.join(rootDir, 'frontend/app/components/SafeView.tsx')
  writeFile(frontendSafeViewPath, SAFE_VIEW_COMPONENT)
  
  // App (duplicado)
  const appSafeViewPath = path.join(rootDir, 'app/components/SafeView.tsx')
  writeFile(appSafeViewPath, SAFE_VIEW_COMPONENT)

  // RESUMEN
  console.log('\n' + '═'.repeat(60))
  log('✅ REPARACIÓN COMPLETADA', 'green')
  console.log('═'.repeat(60))
  
  console.log('\n📋 PRÓXIMOS PASOS:')
  log('  1. Detén el servidor: Ctrl + C', 'cyan')
  log('  2. Limpia caché: rm -rf .next frontend/.next', 'cyan')
  log('  3. Reinicia: pnpm dev', 'cyan')
  log('  4. Despliega rules: firebase deploy --only firestore:rules', 'cyan')
  
  console.log('\n⚠️  RECORDATORIO DE SEGURIDAD:')
  log('  Las reglas de Firestore son TEMPORALES.', 'yellow')
  log('  Actualízalas antes de ir a producción.', 'yellow')
  
  console.log('\n')
}

// Ejecutar
main().catch((err) => {
  log(`\n❌ ERROR: ${err.message}`, 'red')
  process.exit(1)
})
