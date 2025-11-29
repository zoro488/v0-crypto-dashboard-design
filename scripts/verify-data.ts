import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
  console.log('Verificando datos en Firestore...\n');
  
  const collections = ['bancos', 'ventas', 'clientes', 'ordenes_compra', 'distribuidores', 'movimientos', 'gastos_abonos'];
  
  for (const col of collections) {
    const q = query(collection(db, col));
    const snapshot = await getDocs(q);
    console.log(col + ': ' + snapshot.size + ' documentos');
    
    if (col === 'bancos' && snapshot.size > 0) {
      console.log('   Detalle bancos:');
      snapshot.forEach(doc => {
        const data = doc.data();
        const rf = data.rfActual || 0;
        console.log('     - ' + data.nombre + ': $' + rf.toLocaleString());
      });
    }
  }
  
  console.log('\nVerificacion completada');
  process.exit(0);
}

verify();
