'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, Check, Send } from 'lucide-react'
import Link from 'next/link'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE OBSIDIAN GATE - Forgot Password Page
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSent(true)
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[#030308]" />
      <div 
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(6, 182, 212, 0.06) 0%, transparent 70%)
          `,
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative">
          {/* Borde iridiscente */}
          <motion.div
            className="absolute -inset-[1px] rounded-3xl opacity-50"
            style={{ background: 'conic-gradient(from 90deg, #06b6d4, #3b82f6, #06b6d4)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          
          <div 
            className="relative rounded-3xl p-8 md:p-10"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(40px)' }}
          >
            {/* Back link */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Volver al login</span>
            </Link>
            
            <AnimatePresence mode="wait">
              {!isSent ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center mb-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Mail className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                    
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Recuperar Contraseña
                    </h1>
                    <p className="text-white/40 text-sm">
                      Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <div className="relative flex items-center">
                        <motion.div
                          className="absolute left-4 z-10"
                          animate={{
                            color: isFocused ? '#06b6d4' : 'rgba(255, 255, 255, 0.3)',
                            filter: isFocused ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' : 'none',
                          }}
                        >
                          <Mail className="w-5 h-5" />
                        </motion.div>
                        
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="correo@empresa.com"
                          className="w-full h-14 pl-12 pr-4 bg-transparent text-white placeholder-white/30 outline-none text-base"
                        />
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
                      <motion.div
                        className="absolute bottom-0 left-0 h-px"
                        style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: isFocused ? '100%' : '0%' }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                        boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)',
                      }}
                      whileHover={{ boxShadow: '0 0 60px rgba(6, 182, 212, 0.5)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                      ) : (
                        <>
                          <span>Enviar enlace</span>
                          <Send className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Check className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2">
                    ¡Correo enviado!
                  </h2>
                  <p className="text-white/40 text-sm mb-8">
                    Revisa tu bandeja de entrada en <span className="text-cyan-400">{email}</span>
                  </p>
                  
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white/80 hover:text-white transition-colors"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al login
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
