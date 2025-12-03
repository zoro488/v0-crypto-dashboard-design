#!/usr/bin/env node
/**
 * 🏦 INICIALIZACIÓN DE BANCOS/BÓVEDAS - CHRONOS SYSTEM
 * 
 * Crea los 7 bancos base requeridos para la lógica de negocio GYA:
 * - boveda_monte, boveda_usa, profit, leftie, azteca, flete_sur, utilidades
 * 
 * NO migra datos de Excel/CSV - solo crea la estructura base vacía.
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Definición de los 7 bancos del sistema
const BANCOS_BASE = [
  {
    id: 'boveda_monte',
    nombre: 'Bóveda Monte',
    tipo: 'boveda',
    descripcion: 'Capital de compra a distribuidores (precioCompra × cantidad)',
    color: '#3B82F6', // blue-500
    icono: 'vault',
    capitalActual: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    activo: true,
  },
  {
    id: 'boveda_usa',
    nombre: 'Bóveda USA',
    tipo: 'boveda',
    descripcion: 'Capital en dólares',
    color: '#10B981', // emerald-500
    icono: 'dollar',
    capitalActual: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    activo: true,
  },
  {
    id: 'profit',
    nombre: 'Profit',
    tipo: 'cuenta',
    descripcion: 'Cuenta de beneficios operativos',
    color: '#8B5CF6', // violet-500
    icono: 'trending-up',
    capitalActual: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    activo: true,
  },
  {
    id: 'leftie',
    nombre: 'Leftie',
    tipo: 'cuenta',
    descripcion: 'Cuenta auxiliar',
    color: '#F59E0B', // amber-500
    icono: 'wallet',
    capitalActual: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    activo: true,
  },
  {
    id: 'azteca',
    nombre: 'Azteca',
    tipo: 'banco',
    descripcion: 'Banco Azteca',
    color: '#EF4444', // red-500
    icono: 'bank',
    capitalActual: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    activo: true,
  },
  {
    id: 'flete_sur',
    nombre: 'Fletes Sur',
    tipo: 'operativo',
    descripcion: 'Costos de transporte/flete (precioFlete × cantidad)',
    color: '#06B6D4', // cyan-500
    icono: 'truck',
    capitalActual: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    activo: true,
  },
  {
    id: 'utilidades',
    nombre: 'Utilidades',
    tipo: 'utilidades',
    descripcion: 'Ganancias netas (totalVenta - bovedaMonte - fletes)',
    color: '#22C55E', // green-500
    icono: 'sparkles',
    capitalActual: 0,
    historicoIngresos: 0,
    historicoGastos: 0,
    activo: true,
  },
]

async function initBancos() {
  console.log('\n🏦 INICIALIZACIÓN DE BANCOS - CHRONOS SYSTEM')
  console.log('═'.repeat(50))
  
  // Verificar configuración
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.log('\n❌ ERROR: Variables de entorno de Firebase no configuradas')
    process.exit(1)
  }
  
  console.log(`\n📦 Project: ${firebaseConfig.projectId}`)
  
  try {
    // Inicializar Firebase
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    const db = getFirestore(app)
    
    console.log('\n📊 Creando bancos base...\n')
    
    let created = 0
    let skipped = 0
    
    for (const banco of BANCOS_BASE) {
      const docRef = doc(db, 'bancos', banco.id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        console.log(`   ⏭️  ${banco.nombre.padEnd(15)} → Ya existe (skipped)`)
        skipped++
      } else {
        await setDoc(docRef, {
          ...banco,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        console.log(`   ✅ ${banco.nombre.padEnd(15)} → Creado`)
        created++
      }
    }
    
    console.log('\n' + '─'.repeat(50))
    console.log(`\n📈 Resumen:`)
    console.log(`   • Creados: ${created}`)
    console.log(`   • Ya existían: ${skipped}`)
    console.log(`   • Total bancos: ${BANCOS_BASE.length}`)
    
    console.log('\n✅ BANCOS INICIALIZADOS CORRECTAMENTE')
    console.log('\n💡 Ahora puedes crear clientes, distribuidores y ventas desde la UI\n')
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message)
    process.exit(1)
  }
}

initBancos()
