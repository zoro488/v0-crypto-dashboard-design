/**
 * CHRONOS - Script Maestro de Migración
 * 
 * Ejecuta todas las fases de migración en secuencia:
 * - FASE 1: Bancos, Clientes, Distribuidores
 * - FASE 2: Órdenes de Compra
 * - FASE 3: Ventas
 * - FASE 4: Movimientos Bancarios
 * 
 * Uso: npx ts-node scripts/migrate-all.ts
 * 
 * @author Chronos System
 * @version 1.0.0
 */

import { execSync } from 'child_process'
import * as path from 'path'

const scripts = [
  { name: 'FASE 1 y 2: Bancos, Clientes y Órdenes', file: 'migrate-init.ts' },
  { name: 'FASE 3: Ventas', file: 'migrate-phase3.ts' },
  { name: 'FASE 4: Movimientos Bancarios', file: 'migrate-phase4.ts' }
]

console.log('╔════════════════════════════════════════════════════════════╗')
console.log('║       CHRONOS - Migración Completa del Sistema             ║')
console.log('║       Ejecutando todas las fases secuencialmente           ║')
console.log('╚════════════════════════════════════════════════════════════╝')

async function runMigration() {
  for (const script of scripts) {
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`🚀 Ejecutando: ${script.name}`)
    console.log('═'.repeat(60))
    
    try {
      const scriptPath = path.join(__dirname, script.file)
      execSync(`npx ts-node ${scriptPath}`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      })
    } catch (error) {
      console.error(`\n❌ Error en ${script.name}:`, error)
      console.log('\n⚠️ La migración se detuvo. Revisa el error y vuelve a ejecutar.')
      process.exit(1)
    }
  }

  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     🎉 MIGRACIÓN COMPLETA EXITOSA                          ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log('║  Todas las fases se ejecutaron correctamente.              ║')
  console.log('║                                                            ║')
  console.log('║  Próximos pasos:                                           ║')
  console.log('║  1. Verifica los datos en Firebase Console                 ║')
  console.log('║  2. Ajusta manualmente los saldos iniciales de bancos      ║')
  console.log('║  3. Prueba la aplicación web                               ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
}

runMigration()
