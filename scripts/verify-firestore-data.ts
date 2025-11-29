/**
 * Script para verificar los datos migrados en Firestore
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBwIBzl5LyWgKljRQJJLFzBf7u2eSO8Cvc",
  authDomain: "premium-ecosystem-1760790572.firebaseapp.com",
  projectId: "premium-ecosystem-1760790572",
  storageBucket: "premium-ecosystem-1760790572.firebasestorage.app",
  messagingSenderId: "781178880075",
  appId: "1:781178880075:web:aa3b0f5badd5ebd94e1a2f"
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
