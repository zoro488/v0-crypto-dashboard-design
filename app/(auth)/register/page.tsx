'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Mail, Building2, ArrowRight, Check, Sparkles, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE OBSIDIAN GATE - Register Page
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Input reutilizable
function GlowInput({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  icon: typeof User
  type?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <motion.div
          className="absolute left-4 z-10"
          animate={{
            color: isFocused ? '#06b6d4' : 'rgba(255, 255, 255, 0.3)',
            filter: isFocused ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' : 'none',
          }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-14 pl-12 pr-12 bg-transparent text-white placeholder-white/30 outline-none text-base"
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      <motion.div
        className="absolute bottom-0 left-0 h-px"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}
        initial={{ width: '0%' }}
        animate={{ width: isFocused ? '100%' : '0%' }}
        transition={{ duration: 0.4 }}
      />
    </div>
  )
}

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }
  
  const strength = getStrength()
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981']
  const labels = ['Débil', 'Regular', 'Buena', 'Excelente']
  
  if (!password) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-2"
    >
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i < strength ? colors[strength - 1] : 'rgba(255,255,255,0.1)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[strength - 1] || 'rgba(255,255,255,0.3)' }}>
        {strength > 0 ? labels[strength - 1] : 'Escribe una contraseña'}
      </p>
    </motion.div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step < 2) {
      setStep(step + 1)
      return
    }
    
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSuccess(true)
    
    setTimeout(() => router.push('/'), 1200)
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {/* Nebulosa background */}
      <div className="fixed inset-0 bg-[#030308]" />
      <div 
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 40%, rgba(139, 92, 246, 0.08) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 70% 60%, rgba(6, 182, 212, 0.06) 0%, transparent 70%)
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
            className="absolute -inset-[1px] rounded-3xl opacity-60"
            style={{ background: 'conic-gradient(from 180deg, #8b5cf6, #06b6d4, #10b981, #8b5cf6)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          
          <div 
            className="relative rounded-3xl p-8 md:p-10"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(40px)' }}
          >
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Sparkles className="w-8 h-8 text-violet-400" />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-white mb-2">Crear Cuenta</h1>
              <p className="text-white/40 text-sm">
                Paso {step} de 2 — {step === 1 ? 'Información básica' : 'Seguridad'}
              </p>
              
              {/* Progress */}
              <div className="flex gap-2 justify-center mt-4">
                {[1, 2].map((s) => (
                  <motion.div
                    key={s}
                    className="h-1 w-12 rounded-full"
                    style={{
                      background: s <= step ? 'linear-gradient(90deg, #8b5cf6, #06b6d4)' : 'rgba(255,255,255,0.1)',
                    }}
                    animate={{ scale: s === step ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <GlowInput
                      icon={User}
                      placeholder="Nombre completo"
                      value={formData.name}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                      autoComplete="name"
                    />
                    <GlowInput
                      icon={Mail}
                      type="email"
                      placeholder="correo@empresa.com"
                      value={formData.email}
                      onChange={(v) => setFormData({ ...formData, email: v })}
                      autoComplete="email"
                    />
                    <GlowInput
                      icon={Building2}
                      placeholder="Nombre de la empresa"
                      value={formData.company}
                      onChange={(v) => setFormData({ ...formData, company: v })}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <GlowInput
                        icon={Lock}
                        type="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={(v) => setFormData({ ...formData, password: v })}
                        autoComplete="new-password"
                      />
                      <PasswordStrength password={formData.password} />
                    </div>
                    <GlowInput
                      icon={Lock}
                      type="password"
                      placeholder="Confirmar contraseña"
                      value={formData.confirmPassword}
                      onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
                      autoComplete="new-password"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Buttons */}
              <div className="flex gap-4">
                {step > 1 && (
                  <motion.button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 h-14 rounded-xl font-medium text-white/60 hover:text-white transition-colors"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Atrás
                  </motion.button>
                )}
                
                <motion.button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="flex-1 h-14 rounded-xl font-semibold text-white overflow-hidden"
                  animate={{
                    width: isLoading || isSuccess ? 56 : '100%',
                    borderRadius: isLoading || isSuccess ? 28 : 12,
                  }}
                  style={{
                    background: isSuccess ? '#10b981' : 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                    boxShadow: isSuccess ? '0 0 40px rgba(16, 185, 129, 0.4)' : '0 0 40px rgba(139, 92, 246, 0.3)',
                  }}
                  whileHover={!isLoading && !isSuccess ? { boxShadow: '0 0 60px rgba(139, 92, 246, 0.5)' } : undefined}
                  whileTap={!isLoading && !isSuccess ? { scale: 0.98 } : undefined}
                >
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center">
                        <Check className="w-6 h-6" />
                      </motion.div>
                    ) : isLoading ? (
                      <motion.div key="loading" className="flex items-center justify-center">
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div key="text" className="flex items-center justify-center gap-2">
                        <span>{step < 2 ? 'Continuar' : 'Crear cuenta'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>
            
            <p className="text-center mt-8 text-white/40 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
