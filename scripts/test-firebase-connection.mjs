#!/usr/bin/env node
/**
 * 🔥 SCRIPT DE VERIFICACIÓN DE CONEXIÓN FIREBASE
 * 
 * Prueba la conexión a Firestore y lista las colecciones disponibles
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, query, limit, orderBy } from 'firebase/firestore'
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

console.log('\n🔥 VERIFICACIÓN DE CONEXIÓN FIREBASE')
console.log('=====================================\n')

// Verificar variables de entorno
console.log('📋 Variables de entorno:')
const requiredVars = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']
let allConfigured = true

for (const varName of requiredVars) {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  console.log(`   ${status} ${varName}: ${value ? '***configurado***' : 'FALTA'}`)
  if (!value) allConfigured = false
}

if (!allConfigured) {
  console.log('\n❌ ERROR: Faltan variables de entorno requeridas')
  process.exit(1)
}

console.log(`\n📦 Project ID: ${firebaseConfig.projectId}`)

// Inicializar Firebase
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  const db = getFirestore(app)
  
  console.log('\n✅ Firebase inicializado correctamente\n')
  
  // Probar colecciones
  const collections = ['ventas', 'clientes', 'distribuidores', 'ordenes_compra', 'bancos', 'movimientos']
  
  console.log('📊 Estado de colecciones:')
  console.log('─'.repeat(50))
  
  for (const collName of collections) {
    try {
      const q = query(collection(db, collName), limit(5))
      const snapshot = await getDocs(q)
      const count = snapshot.size
      const total = count === 5 ? '5+' : count
      console.log(`   📁 ${collName.padEnd(20)} → ${total} documentos`)
      
      // Mostrar primer documento como ejemplo
      if (count > 0) {
        const firstDoc = snapshot.docs[0]
        const data = firstDoc.data()
        const preview = JSON.stringify(data).substring(0, 80)
        console.log(`      └─ Ejemplo: ${preview}...`)
      }
    } catch (error) {
      console.log(`   ❌ ${collName.padEnd(20)} → Error: ${error.message}`)
    }
  }
  
  console.log('\n' + '─'.repeat(50))
  console.log('✅ CONEXIÓN FIREBASE VERIFICADA EXITOSAMENTE\n')
  
} catch (error) {
  console.log('\n❌ ERROR DE CONEXIÓN:')
  console.log(`   ${error.message}\n`)
  process.exit(1)
}
