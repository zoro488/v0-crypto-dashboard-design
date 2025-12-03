'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { User, Lock, Mail, Eye, EyeOff, ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE OBSIDIAN GATE - Login Page
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Página de login cinematográfica con:
 * - Nebulosa animada que sigue al mouse
 * - Panel de vidrio ahumado con borde iridiscente
 * - Inputs con línea de luz animada
 * - Botón que se transforma en círculo de carga → check
 * - Social auth con efecto desaturate-to-color
 */

// Componente de nebulosa animada
function NebulaBackground() {
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 })
  
  const gradientX = useTransform(springX, [0, 1], [20, 80])
  const gradientY = useTransform(springY, [0, 1], [20, 80])
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth)
      mouseY.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base oscura */}
      <div className="absolute inset-0 bg-[#030308]" />
      
      {/* Nebulosa principal */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at ${gradientX.get()}% ${gradientY.get()}%, 
              rgba(6, 182, 212, 0.08) 0%, 
              rgba(139, 92, 246, 0.04) 30%, 
              transparent 70%
            ),
            radial-gradient(ellipse 60% 80% at ${100 - gradientX.get()}% ${100 - gradientY.get()}%, 
              rgba(139, 92, 246, 0.06) 0%, 
              rgba(16, 185, 129, 0.03) 40%, 
              transparent 70%
            )
          `,
        }}
      />
      
      {/* Estrellas sutiles */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.3) 0%, transparent 100%)
          `,
        }}
      />
      
      {/* Líneas de grid muy sutiles */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />
    </div>
  )
}

// Input con línea de luz animada
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
        {/* Icono */}
        <motion.div
          className="absolute left-4 z-10"
          animate={{
            color: isFocused ? '#06b6d4' : 'rgba(255, 255, 255, 0.3)',
            filter: isFocused ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' : 'none',
          }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        
        {/* Input */}
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-14 pl-12 pr-12 bg-transparent text-white placeholder-white/30 outline-none text-base"
          style={{ fontFamily: 'system-ui' }}
        />
        
        {/* Toggle password visibility */}
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
      
      {/* Línea base */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      
      {/* Línea de luz animada */}
      <motion.div
        className="absolute bottom-0 left-0 h-px"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}
        initial={{ width: '0%' }}
        animate={{ width: isFocused ? '100%' : '0%' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}

// Botón de submit con transformación
function SubmitButton({
  isLoading,
  isSuccess,
  onClick,
}: {
  isLoading: boolean
  isSuccess: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="submit"
      onClick={onClick}
      disabled={isLoading || isSuccess}
      className="relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden"
      animate={{
        width: isLoading || isSuccess ? 56 : '100%',
        borderRadius: isLoading || isSuccess ? 28 : 12,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: isSuccess 
          ? '#10b981' 
          : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
        boxShadow: isSuccess
          ? '0 0 40px rgba(16, 185, 129, 0.4)'
          : '0 0 40px rgba(6, 182, 212, 0.3)',
      }}
      whileHover={!isLoading && !isSuccess ? { 
        boxShadow: '0 0 60px rgba(6, 182, 212, 0.5), inset 0 0 40px rgba(255,255,255,0.1)',
      } : undefined}
      whileTap={!isLoading && !isSuccess ? { scale: 0.98 } : undefined}
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
          >
            <Check className="w-6 h-6" />
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center"
          >
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <span>Ingresar</span>
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// Botón de Social Auth
function SocialButton({
  provider,
  icon,
  brandColor,
}: {
  provider: string
  icon: React.ReactNode
  brandColor: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
      style={{
        background: isHovered ? `${brandColor}15` : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isHovered ? brandColor : 'rgba(255, 255, 255, 0.08)'}`,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        animate={{ filter: isHovered ? 'grayscale(0)' : 'grayscale(1)' }}
        transition={{ duration: 0.3 }}
        style={{ color: isHovered ? brandColor : 'rgba(255, 255, 255, 0.6)' }}
      >
        {icon}
      </motion.div>
      <span 
        className="text-sm font-medium transition-colors duration-300"
        style={{ color: isHovered ? brandColor : 'rgba(255, 255, 255, 0.6)' }}
      >
        {provider}
      </span>
    </motion.button>
  )
}

// Confetti mini
function MiniConfetti({ show }: { show: boolean }) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${50 + (Math.random() - 0.5) * 30}%`,
            top: '50%',
            background: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'][i % 4],
          }}
          initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
          animate={{
            y: -200 - Math.random() * 100,
            x: (Math.random() - 0.5) * 200,
            opacity: 0,
            scale: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1, ease: 'easeOut', delay: i * 0.02 }}
        />
      ))}
    </div>
  )
}

// Componente principal
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    
    setIsLoading(true)
    
    // Simular autenticación
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setIsSuccess(true)
    setShowConfetti(true)
    
    // Redirigir después de la animación
    setTimeout(() => {
      router.push('/')
    }, 1200)
  }
  
  return (
    <div className="min-h-screen flex">
      <NebulaBackground />
      <MiniConfetti show={showConfetti} />
      
      {/* Panel izquierdo - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Card de vidrio con borde iridiscente */}
          <div className="relative">
            {/* Borde iridiscente rotante */}
            <motion.div
              className="absolute -inset-[1px] rounded-3xl opacity-60"
              style={{
                background: 'conic-gradient(from 0deg, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #10b981, #06b6d4)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Card principal */}
            <div 
              className="relative rounded-3xl p-8 md:p-10"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(40px)',
              }}
            >
              {/* Header */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </motion.div>
                
                <h1 className="text-2xl font-bold text-white mb-2">
                  Bienvenido a CHRONOS
                </h1>
                <p className="text-white/40 text-sm">
                  Ingresa a tu panel de control financiero
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <GlowInput
                  icon={Mail}
                  type="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                
                <GlowInput
                  icon={Lock}
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
                
                {/* Forgot password */}
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-white/40 hover:text-cyan-400 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                
                <SubmitButton
                  isLoading={isLoading}
                  isSuccess={isSuccess}
                  onClick={() => {}}
                />
              </form>
              
              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs uppercase tracking-wider">o continúa con</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              
              {/* Social Auth */}
              <div className="flex gap-4">
                <SocialButton
                  provider="Google"
                  brandColor="#4285F4"
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  }
                />
                <SocialButton
                  provider="Microsoft"
                  brandColor="#00A4EF"
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                    </svg>
                  }
                />
              </div>
              
              {/* Register link */}
              <p className="text-center mt-8 text-white/40 text-sm">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Panel derecho - Visual (solo desktop) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          {/* Métricas flotantes */}
          <div className="relative w-[500px] h-[500px]">
            {/* Círculo central con glow */}
            <motion.div
              className="absolute inset-[100px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
              }}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            {/* Métrica 1 */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 p-4 rounded-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Capital Total</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">$2,847,500</p>
            </motion.div>
            
            {/* Métrica 2 */}
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2 p-4 rounded-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Ventas Hoy</p>
              <p className="text-2xl font-bold text-cyan-400 font-mono">156</p>
            </motion.div>
            
            {/* Métrica 3 */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 p-4 rounded-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">ROI Mensual</p>
              <p className="text-2xl font-bold text-violet-400 font-mono">+23.5%</p>
            </motion.div>
            
            {/* Métrica 4 */}
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 p-4 rounded-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
              animate={{ x: [0, -10, 0] }}
              transition={{ duration: 3.2, repeat: Infinity }}
            >
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Ticket Promedio</p>
              <p className="text-2xl font-bold text-amber-400 font-mono">$18,250</p>
            </motion.div>
            
            {/* Logo central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-4xl font-black tracking-tighter"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.4) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                CHRONOS
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
