'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Database, Lock, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export function FirestoreSetupAlert() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4"
    >
      <div className="glass-transmission rounded-2xl p-6 border border-orange-500/20 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-2">Configuración de Firestore Requerida</h3>
            <p className="text-white/70 text-sm mb-4">
              El sistema está funcionando en modo local. Para habilitar la persistencia de datos en Firestore, necesitas
              configurar las reglas de seguridad.
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">1. Ve a Firebase Console</p>
                  <p className="text-white/60 text-xs">
                    Accede a{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      console.firebase.google.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">2. Configura las reglas de Firestore</p>
                  <p className="text-white/60 text-xs">
                    En Firestore {'>'} Rules, agrega las reglas de seguridad para permitir lectura/escritura
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">3. Publica las reglas</p>
                  <p className="text-white/60 text-xs">Guarda y publica los cambios para activar la persistencia</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
              <p className="text-white/40 text-xs font-mono mb-2">Reglas básicas para desarrollo:</p>
              <pre className="text-white/60 text-xs overflow-x-auto">
                {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="w-full py-2 px-4 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-sm font-medium transition-colors"
            >
              Entendido, trabajar en modo local
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
