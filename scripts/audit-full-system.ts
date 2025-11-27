/**
 * 🛡️ CHRONOS SYSTEM - AUDITORÍA TOTAL
 * Script de validación y saneamiento de base de datos
 * 
 * Ejecutar: npx ts-node scripts/audit-full-system.ts
 * 
 * @author Chronos System
 * @version 1.0.0
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================
// 🎨 COLORES ANSI PARA CONSOLA
// ============================================================
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colores de texto
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Fondos
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
}

// Helpers de logging
const log = {
  title: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}${'═'.repeat(60)}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bold}${colors.cyan}🔷 ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}   ✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}   ❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}   ⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}   ℹ️  ${msg}${colors.reset}`),
  critical: (msg: string) => console.log(`${colors.bgRed}${colors.white}${colors.bold}   🚨 CRÍTICO: ${msg}${colors.reset}`),
  zombie: (msg: string) => console.log(`${colors.red}${colors.bold}   🧟 ZOMBIE: ${msg}${colors.reset}`),
  orphan: (msg: string) => console.log(`${colors.magenta}   👻 HUÉRFANO: ${msg}${colors.reset}`),
  corrupt: (msg: string) => console.log(`${colors.yellow}   💀 CORRUPTO: ${msg}${colors.reset}`),
  money: (msg: string) => console.log(`${colors.green}   💰 ${msg}${colors.reset}`),
  command: (msg: string) => console.log(`${colors.dim}      $ ${msg}${colors.reset}`),
  divider: () => console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`),
}

// ============================================================
// 📋 CONFIGURACIÓN - LA FUENTE DE LA VERDAD
// ============================================================
const COLECCIONES_LEGITIMAS: string[] = [
  'bancos',
  'ordenesCompra',
  'ventas',
  'clientes',
  'movimientos',
  'transacciones',
  'distribuidores',
  'almacen',
  'productos',
  'transferencias',
  'abonos',
  'ingresos',
  'gastos',
]

// Colecciones conocidas que son basura segura de eliminar
const COLECCIONES_BASURA_CONOCIDA: string[] = [
  'test',
  'tests',
  'prueba',
  'pruebas',
  '_test',
  '_tests',
  'backup',
  'old',
  '_old',
  'temp',
  '_temp',
  'deprecated',
  'users_old',
  'ventas_test',
  'products',
]

// ============================================================
// 📊 INTERFACES
// ============================================================
interface AuditResults {
  zombieCollections: string[]
  orphanDocuments: Array<{ collection: string; id: string; reason: string }>
  corruptDocuments: Array<{ collection: string; id: string; issues: string[] }>
  codeIssues: Array<{ file: string; line: number; issue: string; severity: 'error' | 'warning' }>
  financialDiscrepancy: number | null
  summary: {
    totalCollections: number
    legitimateCollections: number
    zombieCollections: number
    totalDocuments: number
    corruptDocuments: number
    orphanDocuments: number
    codeIssues: number
  }
}

let db: FirebaseFirestore.Firestore

// ============================================================
// 🔥 INICIALIZACIÓN DE FIREBASE ADMIN
// ============================================================
async function initializeFirebase(): Promise<boolean> {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json')
    const envServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount)
        })
      }
      
      db = getFirestore()
      log.success('Firebase Admin inicializado con serviceAccountKey.json')
      return true
    } else if (envServiceAccount && fs.existsSync(envServiceAccount)) {
      const serviceAccount = JSON.parse(fs.readFileSync(envServiceAccount, 'utf8'))
      
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount)
        })
      }
      
      db = getFirestore()
      log.success('Firebase Admin inicializado con GOOGLE_APPLICATION_CREDENTIALS')
      return true
    } else {
      log.error('No se encontró archivo de credenciales de Firebase Admin')
      log.info('Opciones:')
      log.command('1. Coloca serviceAccountKey.json en la raíz del proyecto')
      log.command('2. Establece GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json')
      log.info('Descarga las credenciales desde Firebase Console > Project Settings > Service Accounts')
      return false
    }
  } catch (error) {
    log.error(`Error inicializando Firebase: ${error}`)
    return false
  }
}

// ============================================================
// 🧹 PASO 1: DETECCIÓN DE COLECCIONES ZOMBIE
// ============================================================
async function detectZombieCollections(): Promise<string[]> {
  log.title('')
  log.header('PASO 1: DETECCIÓN DE COLECCIONES ZOMBIE')
  log.divider()
  
  const zombies: string[] = []
  
  try {
    const collections = await db.listCollections()
    const existingCollections = collections.map(col => col.id)
    
    log.info(`Total de colecciones encontradas: ${existingCollections.length}`)
    console.log('')
    
    for (const colName of existingCollections) {
      const isLegitimate = COLECCIONES_LEGITIMAS.includes(colName)
      const isKnownGarbage = COLECCIONES_BASURA_CONOCIDA.some(garbage => 
        colName.toLowerCase().includes(garbage.toLowerCase())
      )
      
      // Detectar patrones de colecciones antiguas
      const isOldBankPattern = /^(boveda|azteca|leftie|profit|fletes|utilidades)_/.test(colName.toLowerCase())
      const isTestPattern = /_test$|_old$|_backup$|_temp$/i.test(colName)
      
      if (isLegitimate) {
        log.success(`${colName} - LEGÍTIMA`)
      } else if (isKnownGarbage || isOldBankPattern || isTestPattern) {
        log.zombie(`${colName} - BASURA CONFIRMADA`)
        zombies.push(colName)
      } else {
        log.warning(`${colName} - NO RECONOCIDA (revisar manualmente)`)
        zombies.push(colName)
      }
    }
    
    if (zombies.length > 0) {
      console.log('')
      log.critical(`Se encontraron ${zombies.length} colecciones zombie`)
      log.info('Comandos sugeridos para limpiar:')
      console.log('')
      
      for (const zombie of zombies) {
        log.command(`firebase firestore:delete --project YOUR_PROJECT_ID -r ${zombie}`)
      }
    } else {
      log.success('No se encontraron colecciones zombie 🎉')
    }
    
  } catch (error) {
    log.error(`Error listando colecciones: ${error}`)
  }
  
  return zombies
}

// ============================================================
// 🧬 PASO 2: VALIDACIÓN DE INTEGRIDAD DE DATOS
// ============================================================
interface ValidationResult {
  orphans: Array<{ collection: string; id: string; reason: string }>
  corrupts: Array<{ collection: string; id: string; issues: string[] }>
  totalDocs: number
}

async function validateDataIntegrity(): Promise<ValidationResult> {
  log.title('')
  log.header('PASO 2: VALIDACIÓN DE INTEGRIDAD DE DATOS')
  log.divider()
  
  const orphans: Array<{ collection: string; id: string; reason: string }> = []
  const corrupts: Array<{ collection: string; id: string; issues: string[] }> = []
  let totalDocs = 0
  
  try {
    // 2.1 Validar ventas huérfanas
    log.info('Buscando ventas huérfanas...')
    
    let ventasSnapshot
    let ordenesSnapshot
    
    try {
      ventasSnapshot = await db.collection('ventas').get()
      ordenesSnapshot = await db.collection('ordenesCompra').get()
    } catch {
      log.warning('Colecciones ventas/ordenesCompra no existen aún')
      ventasSnapshot = { docs: [], size: 0 }
      ordenesSnapshot = { docs: [], size: 0 }
    }
    
    const ordenesIds = new Set(ordenesSnapshot.docs.map(doc => doc.id))
    totalDocs += ventasSnapshot.size
    
    for (const ventaDoc of ventasSnapshot.docs) {
      const venta = ventaDoc.data()
      const issues: string[] = []
      
      // Verificar referencia a orden de compra
      if (venta.ocRelacionadaId && !ordenesIds.has(venta.ocRelacionadaId)) {
        orphans.push({
          collection: 'ventas',
          id: ventaDoc.id,
          reason: `Referencia a OC inexistente: ${venta.ocRelacionadaId}`
        })
      }
      
      // Validar campos
      if (!venta.fecha) issues.push('Campo "fecha" faltante')
      
      const total = venta.total ?? venta.precioTotalVenta ?? venta.ingreso
      if (typeof total !== 'number' || isNaN(total)) issues.push('Campo "total/ingreso" inválido o NaN')
      if (total < 0) issues.push(`Monto negativo: ${total}`)
      if (!venta.clienteId && !venta.cliente && !venta.clienteNombre) issues.push('Sin referencia a cliente')
      
      if (issues.length > 0) {
        corrupts.push({ collection: 'ventas', id: ventaDoc.id, issues })
      }
    }
    
    log.info(`Ventas analizadas: ${ventasSnapshot.size}`)
    
    // 2.2 Validar movimientos
    log.info('Buscando movimientos corruptos...')
    
    let movimientosSnapshot
    try {
      movimientosSnapshot = await db.collection('movimientos').get()
    } catch {
      log.warning('Colección movimientos no existe aún')
      movimientosSnapshot = { docs: [], size: 0 }
    }
    
    totalDocs += movimientosSnapshot.size
    
    for (const movDoc of movimientosSnapshot.docs) {
      const mov = movDoc.data()
      const issues: string[] = []
      
      if (typeof mov.monto !== 'number') issues.push('Campo "monto" no es número')
      if (isNaN(mov.monto)) issues.push('Campo "monto" es NaN')
      if (mov.monto === null || mov.monto === undefined) issues.push('Campo "monto" es null/undefined')
      if (!mov.tipo) issues.push('Campo "tipo" faltante')
      
      const tiposValidos = ['ingreso', 'gasto', 'transferencia', 'abono', 'pago', 'entrada', 'salida', 'INGRESO', 'GASTO', 'UTILIDAD']
      if (mov.tipo && !tiposValidos.includes(mov.tipo)) {
        issues.push(`Tipo no estándar: ${mov.tipo}`)
      }
      if (!mov.bancoId) issues.push('Sin referencia a banco')
      
      if (issues.length > 0) {
        corrupts.push({ collection: 'movimientos', id: movDoc.id, issues })
      }
    }
    
    log.info(`Movimientos analizados: ${movimientosSnapshot.size}`)
    
    // 2.3 Validar órdenes de compra
    log.info('Buscando órdenes de compra corruptas...')
    totalDocs += ordenesSnapshot.size
    
    for (const ocDoc of ordenesSnapshot.docs) {
      const oc = ocDoc.data()
      const issues: string[] = []
      
      if (!oc.costos && !oc.costoTotal) {
        issues.push('Sin información de costos')
      }
      
      if (oc.costos?.unitarioCalculado === 0) {
        issues.push('Costo unitario es 0')
      }
      
      if (oc.costos?.unitarioCalculado === undefined && oc.costos?.unitarioCalculado !== 0) {
        // Solo advertir si el objeto costos existe pero no tiene unitarioCalculado
        if (oc.costos) {
          issues.push('Costo unitario no calculado')
        }
      }
      
      if (!oc.distribuidorId && !oc.distribuidor && !oc.origen) {
        issues.push('Sin referencia a distribuidor')
      }
      
      if (!oc.fecha) issues.push('Campo "fecha" faltante')
      
      if (issues.length > 0) {
        corrupts.push({ collection: 'ordenesCompra', id: ocDoc.id, issues })
      }
    }
    
    log.info(`Órdenes de compra analizadas: ${ordenesSnapshot.size}`)
    
    // 2.4 Validar bancos
    log.info('Validando bancos...')
    
    let bancosSnapshot
    try {
      bancosSnapshot = await db.collection('bancos').get()
    } catch {
      log.warning('Colección bancos no existe aún')
      bancosSnapshot = { docs: [], size: 0 }
    }
    
    totalDocs += bancosSnapshot.size
    
    for (const bancoDoc of bancosSnapshot.docs) {
      const banco = bancoDoc.data()
      const issues: string[] = []
      
      const saldo = banco.saldoActual ?? banco.capitalActual ?? 0
      if (typeof saldo !== 'number') issues.push('saldoActual no es número')
      if (isNaN(saldo)) issues.push('saldoActual es NaN')
      if (!banco.nombre) issues.push('Sin nombre')
      if (!banco.tipo) issues.push('Sin tipo')
      
      if (issues.length > 0) {
        corrupts.push({ collection: 'bancos', id: bancoDoc.id, issues })
      }
    }
    
    log.info(`Bancos analizados: ${bancosSnapshot.size}`)
    
    // 2.5 Validar clientes
    log.info('Validando clientes...')
    
    let clientesSnapshot
    try {
      clientesSnapshot = await db.collection('clientes').get()
    } catch {
      log.warning('Colección clientes no existe aún')
      clientesSnapshot = { docs: [], size: 0 }
    }
    
    totalDocs += clientesSnapshot.size
    
    for (const clienteDoc of clientesSnapshot.docs) {
      const cliente = clienteDoc.data()
      const issues: string[] = []
      
      if (!cliente.nombre) issues.push('Sin nombre')
      
      if (issues.length > 0) {
        corrupts.push({ collection: 'clientes', id: clienteDoc.id, issues })
      }
    }
    
    log.info(`Clientes analizados: ${clientesSnapshot.size}`)
    
    // Resumen
    console.log('')
    log.divider()
    
    if (orphans.length > 0) {
      log.critical(`${orphans.length} documentos huérfanos encontrados:`)
      for (const orphan of orphans.slice(0, 10)) {
        log.orphan(`${orphan.collection}/${orphan.id}: ${orphan.reason}`)
      }
      if (orphans.length > 10) {
        log.info(`... y ${orphans.length - 10} más`)
      }
    } else {
      log.success('No se encontraron documentos huérfanos')
    }
    
    console.log('')
    
    if (corrupts.length > 0) {
      log.critical(`${corrupts.length} documentos corruptos encontrados:`)
      for (const corrupt of corrupts.slice(0, 10)) {
        log.corrupt(`${corrupt.collection}/${corrupt.id}:`)
        for (const issue of corrupt.issues) {
          console.log(`${colors.dim}         - ${issue}${colors.reset}`)
        }
      }
      if (corrupts.length > 10) {
        log.info(`... y ${corrupts.length - 10} más`)
      }
    } else {
      log.success('No se encontraron documentos corruptos')
    }
    
  } catch (error) {
    log.error(`Error validando integridad: ${error}`)
  }
  
  return { orphans, corrupts, totalDocs }
}

// ============================================================
// 🔗 PASO 3: VERIFICACIÓN DE CONEXIÓN UI
// ============================================================
interface CodeIssue {
  file: string
  line: number
  issue: string
  severity: 'error' | 'warning'
}

async function verifyUIConnections(): Promise<CodeIssue[]> {
  log.title('')
  log.header('PASO 3: VERIFICACIÓN DE CONEXIÓN UI (Análisis de Código)')
  log.divider()
  
  const issues: CodeIssue[] = []
  
  const directoriesToScan = [
    'frontend/app/lib/firebase',
    'frontend/app/hooks',
    'frontend/app/components',
    'app/lib/firebase',
    'app/hooks',
    'app/components',
    'lib/firebase',
    'hooks',
    'components',
  ]
  
  const fileExtensions = ['.ts', '.tsx', '.js', '.jsx']
  
  // Patrón para encontrar llamadas a collection()
  const collectionPattern = /collection\s*\(\s*db\s*,\s*["'`]([^"'`\$]+)["'`]\s*\)/g
  
  function scanDirectory(dirPath: string): void {
    const fullPath = path.join(process.cwd(), dirPath)
    
    if (!fs.existsSync(fullPath)) {
      return
    }
    
    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true })
      
      for (const item of items) {
        const itemPath = path.join(fullPath, item.name)
        
        if (item.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item.name)) {
            scanDirectory(path.join(dirPath, item.name))
          }
        } else if (item.isFile() && fileExtensions.some(ext => item.name.endsWith(ext))) {
          scanFile(itemPath, path.join(dirPath, item.name))
        }
      }
    } catch {
      // Ignorar errores de lectura
    }
  }
  
  function scanFile(fullPath: string, relativePath: string): void {
    try {
      const content = fs.readFileSync(fullPath, 'utf8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNumber = i + 1
        
        // Buscar llamadas a collection()
        let match
        collectionPattern.lastIndex = 0
        
        while ((match = collectionPattern.exec(line)) !== null) {
          const collectionName = match[1]
          checkCollectionReference(collectionName, relativePath, lineNumber, issues)
        }
        
        // Buscar patrones problemáticos
        if (line.includes('_ingresos') || line.includes('_gastos') || 
            line.includes('_transferencias') || line.includes('_cortes')) {
          // Verificar que no sea comentario
          const trimmed = line.trim()
          if (!trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
            issues.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Patrón de subcolección de banco detectado (migrar a colección "movimientos")',
              severity: 'error'
            })
          }
        }
        
        // Detectar colecciones de prueba en código
        const testPatterns = ['_test"', '_old"', '_backup"', 'test_"', '"prueba']
        for (const pattern of testPatterns) {
          if (line.includes(pattern)) {
            issues.push({
              file: relativePath,
              line: lineNumber,
              issue: `Referencia a colección de prueba: contiene "${pattern}"`,
              severity: 'warning'
            })
          }
        }
      }
    } catch {
      // Ignorar errores de lectura
    }
  }
  
  function checkCollectionReference(
    collectionName: string, 
    file: string, 
    line: number, 
    issues: CodeIssue[]
  ): void {
    // Lista de colecciones que deberían migrar
    const deprecatedCollections: Record<string, string> = {
      'banco_ingresos': 'movimientos',
      'banco_gastos': 'movimientos',
      'gastos_y_abonos': 'movimientos',
    }
    
    // Verificar si es una colección deprecated conocida
    if (deprecatedCollections[collectionName]) {
      issues.push({
        file,
        line,
        issue: `Colección "${collectionName}" debe migrarse a "${deprecatedCollections[collectionName]}"`,
        severity: 'error'
      })
    }
    
    // Verificar patrones de banco_X
    if (/^(boveda|azteca|leftie|profit)_/.test(collectionName)) {
      issues.push({
        file,
        line,
        issue: `Patrón antiguo de banco detectado: "${collectionName}" - Migrar a colección "movimientos"`,
        severity: 'error'
      })
    }
  }
  
  log.info('Escaneando archivos de código...')
  
  let filesScanned = 0
  for (const dir of directoriesToScan) {
    const fullPath = path.join(process.cwd(), dir)
    if (fs.existsSync(fullPath)) {
      log.info(`Escaneando ${dir}...`)
      scanDirectory(dir)
      filesScanned++
    }
  }
  
  if (filesScanned === 0) {
    log.warning('No se encontraron directorios para escanear')
  }
  
  console.log('')
  log.divider()
  
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  
  if (errors.length > 0) {
    log.critical(`${errors.length} errores críticos en código:`)
    for (const error of errors.slice(0, 15)) {
      console.log(`${colors.red}   ❌ ${error.file}:${error.line}${colors.reset}`)
      console.log(`${colors.dim}      ${error.issue}${colors.reset}`)
    }
    if (errors.length > 15) {
      log.info(`... y ${errors.length - 15} errores más`)
    }
  } else {
    log.success('No se encontraron errores críticos en el código')
  }
  
  console.log('')
  
  if (warnings.length > 0) {
    log.warning(`${warnings.length} advertencias:`)
    for (const warning of warnings.slice(0, 10)) {
      console.log(`${colors.yellow}   ⚠️  ${warning.file}:${warning.line}${colors.reset}`)
      console.log(`${colors.dim}      ${warning.issue}${colors.reset}`)
    }
    if (warnings.length > 10) {
      log.info(`... y ${warnings.length - 10} advertencias más`)
    }
  } else {
    log.success('No se encontraron advertencias')
  }
  
  return issues
}

// ============================================================
// 💰 PASO 4: CONCILIACIÓN FINANCIERA
// ============================================================
interface FinancialReport {
  saldosBancos: number
  ingresosTotales: number
  gastosTotales: number
  saldoCalculado: number
  discrepancia: number
  bancosDetalle: Array<{
    id: string
    nombre: string
    saldo: number
  }>
}

async function reconcileFinances(): Promise<FinancialReport | null> {
  log.title('')
  log.header('PASO 4: CONCILIACIÓN FINANCIERA (La Prueba de Fuego)')
  log.divider()
  
  try {
    // Obtener todos los bancos
    let bancosSnapshot
    try {
      bancosSnapshot = await db.collection('bancos').get()
    } catch {
      log.warning('Colección bancos no existe')
      return null
    }
    
    if (bancosSnapshot.empty) {
      log.warning('No hay bancos configurados en el sistema')
      return null
    }
    
    let totalSaldos = 0
    const bancosDetalle: FinancialReport['bancosDetalle'] = []
    
    log.info('Analizando saldos de bancos...')
    
    for (const bancoDoc of bancosSnapshot.docs) {
      const banco = bancoDoc.data()
      const saldoActual = banco.saldoActual ?? banco.capitalActual ?? 0
      const saldo = typeof saldoActual === 'number' && !isNaN(saldoActual) ? saldoActual : 0
      totalSaldos += saldo
      
      log.money(`${banco.nombre || bancoDoc.id}: $${saldo.toLocaleString('es-MX')}`)
      
      bancosDetalle.push({
        id: bancoDoc.id,
        nombre: banco.nombre || bancoDoc.id,
        saldo
      })
    }
    
    console.log('')
    log.divider()
    
    // Obtener movimientos y calcular
    log.info('Calculando desde historial de movimientos...')
    
    let movimientosSnapshot
    try {
      movimientosSnapshot = await db.collection('movimientos').get()
    } catch {
      log.warning('Colección movimientos no existe')
      movimientosSnapshot = { docs: [], size: 0 }
    }
    
    let totalIngresos = 0
    let totalGastos = 0
    let movimientosValidos = 0
    let movimientosInvalidos = 0
    
    for (const movDoc of movimientosSnapshot.docs) {
      const mov = movDoc.data()
      const monto = typeof mov.monto === 'number' && !isNaN(mov.monto) ? mov.monto : 0
      
      if (monto === 0 && mov.monto !== 0) {
        movimientosInvalidos++
        continue
      }
      
      movimientosValidos++
      
      const tipo = (mov.tipo || '').toLowerCase()
      
      if (['ingreso', 'entrada', 'venta', 'abono', 'utilidad'].includes(tipo)) {
        totalIngresos += Math.abs(monto)
      } else if (['gasto', 'salida', 'pago', 'egreso'].includes(tipo)) {
        totalGastos += Math.abs(monto)
      }
    }
    
    const saldoCalculado = totalIngresos - totalGastos
    const discrepancia = totalSaldos - saldoCalculado
    
    console.log('')
    log.info('=== RESUMEN FINANCIERO ===')
    log.money(`Total Saldos en Bancos:    $${totalSaldos.toLocaleString('es-MX')}`)
    log.money(`Total Ingresos Históricos: $${totalIngresos.toLocaleString('es-MX')}`)
    log.money(`Total Gastos Históricos:   $${totalGastos.toLocaleString('es-MX')}`)
    log.money(`Saldo Calculado:           $${saldoCalculado.toLocaleString('es-MX')}`)
    
    console.log('')
    
    if (movimientosSnapshot.size === 0) {
      log.warning('No hay movimientos registrados - No se puede validar conciliación')
      log.info('Los saldos actuales son considerados como saldos iniciales')
    } else if (Math.abs(discrepancia) < 0.01) {
      log.success(`✅ CONCILIACIÓN EXITOSA - Los números cuadran perfectamente`)
    } else if (Math.abs(discrepancia) < 1000) {
      log.warning(`⚠️  Discrepancia menor: $${discrepancia.toLocaleString('es-MX')}`)
      log.info('Puede deberse a redondeos o saldos iniciales.')
    } else {
      log.critical(`DISCREPANCIA SIGNIFICATIVA: $${discrepancia.toLocaleString('es-MX')}`)
      log.error('Los números NO cuadran. Posibles causas:')
      console.log(`${colors.dim}      1. Movimientos no registrados${colors.reset}`)
      console.log(`${colors.dim}      2. Saldos iniciales no contabilizados${colors.reset}`)
      console.log(`${colors.dim}      3. Movimientos con montos incorrectos${colors.reset}`)
      console.log(`${colors.dim}      4. Transferencias mal registradas${colors.reset}`)
    }
    
    if (movimientosInvalidos > 0) {
      console.log('')
      log.warning(`${movimientosInvalidos} movimientos con montos inválidos fueron ignorados`)
    }
    
    return {
      saldosBancos: totalSaldos,
      ingresosTotales: totalIngresos,
      gastosTotales: totalGastos,
      saldoCalculado,
      discrepancia,
      bancosDetalle
    }
    
  } catch (error) {
    log.error(`Error en conciliación financiera: ${error}`)
    return null
  }
}

// ============================================================
// 📊 GENERAR REPORTE FINAL
// ============================================================
function generateFinalReport(results: AuditResults): void {
  log.title('')
  console.log(`${colors.bold}${colors.cyan}`)
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║           📊 REPORTE FINAL DE AUDITORÍA                    ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(colors.reset)
  
  const { summary } = results
  
  console.log(`${colors.bold}Resumen Ejecutivo:${colors.reset}`)
  console.log('')
  console.log(`   Colecciones totales:     ${summary.totalCollections}`)
  console.log(`   Colecciones legítimas:   ${colors.green}${summary.legitimateCollections}${colors.reset}`)
  console.log(`   Colecciones zombie:      ${summary.zombieCollections > 0 ? colors.red : colors.green}${summary.zombieCollections}${colors.reset}`)
  console.log('')
  console.log(`   Documentos analizados:   ${summary.totalDocuments}`)
  console.log(`   Documentos corruptos:    ${summary.corruptDocuments > 0 ? colors.red : colors.green}${summary.corruptDocuments}${colors.reset}`)
  console.log(`   Documentos huérfanos:    ${summary.orphanDocuments > 0 ? colors.yellow : colors.green}${summary.orphanDocuments}${colors.reset}`)
  console.log('')
  console.log(`   Problemas en código:     ${summary.codeIssues > 0 ? colors.red : colors.green}${summary.codeIssues}${colors.reset}`)
  console.log('')
  
  // Calificación final
  const totalIssues = summary.zombieCollections + summary.corruptDocuments + 
                     summary.orphanDocuments + summary.codeIssues
  
  let grade: string
  let emoji: string
  let gradeColor: string
  
  if (totalIssues === 0) {
    grade = 'A+'
    emoji = '🏆'
    gradeColor = colors.green
  } else if (totalIssues <= 3) {
    grade = 'A'
    emoji = '✅'
    gradeColor = colors.green
  } else if (totalIssues <= 10) {
    grade = 'B'
    emoji = '⚠️'
    gradeColor = colors.yellow
  } else if (totalIssues <= 20) {
    grade = 'C'
    emoji = '🔶'
    gradeColor = colors.yellow
  } else {
    grade = 'D'
    emoji = '🚨'
    gradeColor = colors.red
  }
  
  console.log(`${colors.bold}Calificación del Sistema: ${emoji} ${gradeColor}${grade}${colors.reset}`)
  console.log('')
  
  if (results.financialDiscrepancy !== null) {
    const discrepancyColor = Math.abs(results.financialDiscrepancy) < 1 ? colors.green : colors.red
    console.log(`${colors.bold}Discrepancia Financiera: ${discrepancyColor}$${results.financialDiscrepancy.toLocaleString('es-MX')}${colors.reset}`)
  }
  
  console.log('')
  log.divider()
  
  // Próximos pasos
  if (totalIssues > 0) {
    console.log('')
    console.log(`${colors.bold}📋 Próximos Pasos Recomendados:${colors.reset}`)
    console.log('')
    
    let stepNum = 1
    
    if (summary.zombieCollections > 0) {
      console.log(`   ${stepNum}. ${colors.red}Eliminar ${summary.zombieCollections} colecciones zombie${colors.reset}`)
      stepNum++
    }
    
    if (summary.corruptDocuments > 0) {
      console.log(`   ${stepNum}. ${colors.yellow}Reparar ${summary.corruptDocuments} documentos corruptos${colors.reset}`)
      stepNum++
    }
    
    if (summary.orphanDocuments > 0) {
      console.log(`   ${stepNum}. ${colors.yellow}Revisar ${summary.orphanDocuments} documentos huérfanos${colors.reset}`)
      stepNum++
    }
    
    if (summary.codeIssues > 0) {
      console.log(`   ${stepNum}. ${colors.yellow}Actualizar ${summary.codeIssues} referencias en código${colors.reset}`)
      stepNum++
    }
    
    if (results.financialDiscrepancy && Math.abs(results.financialDiscrepancy) > 1) {
      console.log(`   ${stepNum}. ${colors.red}Investigar discrepancia financiera${colors.reset}`)
    }
  } else {
    console.log('')
    console.log(`${colors.green}${colors.bold}🎉 ¡El sistema está limpio y saludable!${colors.reset}`)
  }
  
  console.log('')
  log.divider()
  console.log(`${colors.dim}Auditoría completada: ${new Date().toLocaleString('es-MX')}${colors.reset}`)
  console.log('')
}

// ============================================================
// 🚀 FUNCIÓN PRINCIPAL
// ============================================================
async function main(): Promise<void> {
  console.clear()
  console.log('')
  console.log(`${colors.bold}${colors.cyan}`)
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     🛡️  CHRONOS SYSTEM - AUDITORÍA TOTAL                   ║')
  console.log('║         Sistema de Validación y Saneamiento                ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(colors.reset)
  console.log(`${colors.dim}Iniciando auditoría completa del sistema...${colors.reset}`)
  
  // Inicializar Firebase
  const firebaseReady = await initializeFirebase()
  
  let zombies: string[] = []
  let validationResult: ValidationResult = { orphans: [], corrupts: [], totalDocs: 0 }
  let financialReport: FinancialReport | null = null
  
  if (firebaseReady) {
    // Ejecutar todas las validaciones de Firebase
    zombies = await detectZombieCollections()
    validationResult = await validateDataIntegrity()
    financialReport = await reconcileFinances()
  } else {
    console.log('')
    log.warning('Sin conexión a Firebase - Solo ejecutando análisis de código local')
  }
  
  // Análisis de código (siempre se ejecuta)
  const codeIssues = await verifyUIConnections()
  
  // Compilar resultados
  const existingCollectionsCount = firebaseReady ? 
    (await db.listCollections()).length : 0
  
  const results: AuditResults = {
    zombieCollections: zombies,
    orphanDocuments: validationResult.orphans,
    corruptDocuments: validationResult.corrupts,
    codeIssues,
    financialDiscrepancy: financialReport?.discrepancia || null,
    summary: {
      totalCollections: existingCollectionsCount,
      legitimateCollections: existingCollectionsCount - zombies.length,
      zombieCollections: zombies.length,
      totalDocuments: validationResult.totalDocs,
      corruptDocuments: validationResult.corrupts.length,
      orphanDocuments: validationResult.orphans.length,
      codeIssues: codeIssues.filter(i => i.severity === 'error').length
    }
  }
  
  // Generar reporte final
  generateFinalReport(results)
  
  // Código de salida basado en errores críticos
  const criticalErrors = results.summary.zombieCollections + 
                        results.summary.corruptDocuments +
                        results.summary.codeIssues
  
  process.exit(criticalErrors > 0 ? 1 : 0)
}

// Ejecutar
main().catch((error) => {
  console.error(`${colors.red}Error fatal:${colors.reset}`, error)
  process.exit(1)
})
