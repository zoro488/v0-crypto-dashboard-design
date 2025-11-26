'use client'
/**
 * 🌌 LOGIN PAGE - Experiencia de Partículas Singularidad
 * 
 * Esta página muestra el orbe de partículas interactivo como 
 * elemento principal visual junto con el formulario de login.
 */

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import SingularityParticles from '@/app/components/3d/SingularityParticles'
import { Button } from '@/frontend/app/components/ui/button'
import { Input } from '@/frontend/app/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/frontend/app/components/ui/card'
import { Cpu, Lock, User, Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simular autenticación (reemplazar con Firebase Auth real)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Redirigir al dashboard
    router.push('/')
    setIsLoading(false)
  }

  return (
    <main className="flex h-screen w-full overflow-hidden">
      
      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN IZQUIERDA: ORBE DE PARTÍCULAS (Solo Desktop)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center">
        {/* Canvas exclusivo para el Logo de Partículas */}
        <div className="absolute inset-0 z-0">
          <Canvas 
            camera={{ position: [0, 0, 12], fov: 45 }} 
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <SingularityParticles 
                count={15000}
                radius={4.5}
                interactionRadius={4}
                interactionStrength={1}
              />
            </Suspense>
          </Canvas>
        </div>
        
        {/* Texto flotante sobre las partículas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-10 text-center space-y-6 pointer-events-none select-none"
        >
          <motion.h1 
            className="text-8xl font-bold tracking-tighter"
            style={{
              background: 'linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.1) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.3))'
            }}
          >
            CHRONOS
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto max-w-xs"
          />
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xl text-blue-200/80 font-light tracking-[0.5em] uppercase"
          >
            Singularity OS
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-white/40"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sistema de Gestión Neural</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECCIÓN DERECHA: FORMULARIO DE LOGIN
          ════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="bg-black/40 border-white/10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <CardHeader className="text-center space-y-4 pb-8">
              {/* Logo animado */}
              <motion.div 
                className="mx-auto relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-5 rounded-2xl shadow-lg shadow-purple-500/30">
                  <Cpu className="w-10 h-10 text-white" />
                </div>
                {/* Anillos decorativos */}
                <motion.div
                  className="absolute inset-0 border-2 border-blue-500/30 rounded-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              <div>
                <CardTitle className="text-3xl font-bold text-white tracking-tight">
                  Bienvenido
                </CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  Credenciales de acceso al sistema neural
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Campo de Email */}
                <div className="space-y-2 group">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ID de Operador (Email)"
                      required
                      className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/10 transition-all rounded-xl"
                    />
                  </div>
                </div>
                
                {/* Campo de Password */}
                <div className="space-y-2 group">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Clave Encriptada"
                      required
                      className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:bg-white/10 transition-all rounded-xl"
                    />
                  </div>
                </div>

                {/* Botón de Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Iniciando Secuencia...
                    </>
                  ) : (
                    'INICIAR SECUENCIA'
                  )}
                </Button>
                
                {/* Footer */}
                <div className="text-center pt-4">
                  <p className="text-xs text-gray-600 font-mono tracking-wider">
                    CHRONOS SYSTEM v2.0 // SECURE CONNECTION
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Sistema Operacional
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
