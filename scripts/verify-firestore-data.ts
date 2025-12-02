/**
 * Script para verificar los datos migrados en Firestore
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore'
import 'dotenv/config'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validar configuración
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Error: Variables de entorno de Firebase no configuradas')
  console.error('   Copia .env.local.template a .env.local y configura las credenciales')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function verifyData() {
  console.log('\n🔍 VERIFICACIÓN DE DATOS EN FIRESTORE\n')
  console.log('=' .repeat(60))

  const collectionsToCheck = [
    'bancos',
    'ventas',
    'clientes',
    'ordenes_compra',
    'distribuidores',
    'transferencias',
    // Colecciones por banco
    'profit_ingresos',
    'profit_gastos',
    'profit_cortes',
    'boveda_usa_ingresos',
    'boveda_usa_gastos',
    'boveda_usa_cortes',
    'leftie_ingresos',
    'leftie_gastos',
    'leftie_cortes',
    'azteca_ingresos',
    'azteca_gastos',
    'azteca_cortes',
  ]

  let totalDocs = 0

  for (const collName of collectionsToCheck) {
    try {
      const q = query(collection(db, collName), limit(100))
      const snap = await getDocs(q)
      const count = snap.size
      totalDocs += count

      if (count > 0) {
        console.log(`✅ ${collName}: ${count} documentos`)
        
        // Mostrar primer documento como ejemplo
        const firstDoc = snap.docs[0]
        if (firstDoc) {
          const data = firstDoc.data()
          const keys = Object.keys(data).slice(0, 5).join(', ')
          console.log(`   └─ Campos: ${keys}...`)
        }
      } else {
        console.log(`⚠️ ${collName}: 0 documentos (vacía)`)
      }
    } catch (err) {
      console.log(`❌ ${collName}: Error - ${(err as Error).message}`)
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log(`📊 TOTAL: ${totalDocs} documentos en Firestore`)
  console.log('=' .repeat(60))

  process.exit(0)
}

verifyData().catch(console.error)
