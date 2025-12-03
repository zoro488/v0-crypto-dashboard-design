'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Palette,
  Layout,
  Bell,
  Command,
  Smartphone,
  Settings,
  User,
  Lock,
  ArrowRight,
  Check,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHRONOS DESIGN SYSTEM - Showcase Page
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Página de demostración de todos los componentes del sistema de diseño
 */

interface ComponentCard {
  id: string
  title: string
  description: string
  icon: typeof Sparkles
  color: string
  href: string
  features: string[]
}

const components: ComponentCard[] = [
  {
    id: 'auth',
    title: 'The Obsidian Gate',
    description: 'Suite de autenticación cinematográfica con nebulosa animada y efectos premium',
    icon: Lock,
    color: '#8b5cf6',
    href: '/login',
    features: ['Login', 'Register', 'Forgot Password', 'Nebula Background', 'Morphing Button'],
  },
  {
    id: 'command',
    title: 'Neural Nexus',
    description: 'Command Palette global con búsqueda universal y modo AI',
    icon: Command,
    color: '#06b6d4',
    href: '#',
    features: ['⌘K Shortcut', 'Smart Search', 'Quick Actions', 'AI Mode', 'Keyboard Navigation'],
  },
  {
    id: 'notifications',
    title: 'Pulse Feed',
    description: 'Centro de notificaciones con tarjetas inteligentes y acciones inline',
    icon: Bell,
    color: '#ef4444',
    href: '#',
    features: ['Real-time Updates', 'Smart Grouping', 'Inline Actions', 'Tabs Filter', 'Mark All Read'],
  },
  {
    id: 'settings',
    title: 'Control Deck',
    description: 'Hub de configuración estilo macOS con pestañas verticales',
    icon: Settings,
    color: '#10b981',
    href: '/settings',
    features: ['Profile Management', 'Theme Selector', 'Session Control', 'Notifications', 'Security'],
  },
  {
    id: 'mobile',
    title: 'Floating Island',
    description: 'Navegación móvil premium con dock flotante estilo iOS',
    icon: Smartphone,
    color: '#f59e0b',
    href: '#',
    features: ['Floating Dock', 'Spring Animations', 'Action Button', 'Sheet Menu', 'Active Indicator'],
  },
  {
    id: 'ui',
    title: 'Obsidian Glass System',
    description: 'Componentes UI-Premium con vidrio ahumado y luz volumétrica',
    icon: Palette,
    color: '#3b82f6',
    href: '/demo/mega-components',
    features: ['PremiumStatCard', 'QuantumTable', 'HolographicChart', 'AIVoiceAssistant'],
  },
]

function ComponentShowcaseCard({ component, index }: { component: ComponentCard; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = component.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <Link href={component.href} className="block">
        <motion.div
          className="relative p-6 rounded-2xl overflow-hidden cursor-pointer"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
          whileHover={{ 
            y: -4,
            boxShadow: `0 20px 60px -15px ${component.color}30`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(600px circle at 50% 50%, ${component.color}08, transparent 40%)`,
            }}
          />
          
          {/* Icon */}
          <div className="relative mb-4">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${component.color}15`,
                boxShadow: isHovered ? `0 0 30px ${component.color}30` : 'none',
              }}
            >
              <Icon className="w-6 h-6" style={{ color: component.color }} />
            </motion.div>
          </div>
          
          {/* Content */}
          <div className="relative">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text"
              style={{
                backgroundImage: isHovered ? `linear-gradient(135deg, white, ${component.color})` : undefined,
              }}
            >
              {component.title}
            </h3>
            
            <p className="text-white/40 text-sm mb-4 line-clamp-2">
              {component.description}
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-4">
              {component.features.slice(0, 3).map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider"
                  style={{
                    background: `${component.color}10`,
                    color: `${component.color}`,
                    border: `1px solid ${component.color}20`,
                  }}
                >
                  {feature}
                </span>
              ))}
              {component.features.length > 3 && (
                <span
                  className="px-2 py-1 rounded-lg text-[10px] text-white/40"
                  style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                >
                  +{component.features.length - 3} más
                </span>
              )}
            </div>
            
            {/* CTA */}
            <motion.div
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: component.color }}
              animate={{ x: isHovered ? 4 : 0 }}
            >
              <span>Explorar</span>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </div>
          
          {/* Corner accent */}
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-20"
            style={{
              background: `radial-gradient(circle at 100% 0%, ${component.color}, transparent 70%)`,
            }}
          />
        </motion.div>
      </Link>
    </motion.div>
  )
}

export default function DesignSystemShowcase() {
  return (
    <div 
      className="min-h-screen py-16 px-8"
      style={{
        background: 'linear-gradient(135deg, #030308 0%, #0a0a0f 50%, #050510 100%)',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto text-center mb-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-white/60">Design System v1.0</span>
        </motion.div>
        
        <h1 className="text-5xl md:text-6xl font-black mb-4">
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.4) 100%)',
            }}
          >
            CHRONOS
          </span>{' '}
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            }}
          >
            UI
          </span>
        </h1>
        
        <p className="text-xl text-white/40 max-w-2xl mx-auto">
          Sistema de diseño ultra-premium inspirado en Apple y Tesla. 
          Vidrio ahumado, luz volumétrica y tipografía financiera.
        </p>
      </motion.div>
      
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
      >
        {[
          { label: 'Componentes', value: '50+' },
          { label: 'Animaciones', value: '100+' },
          { label: 'Tokens CSS', value: '80+' },
          { label: 'Mega-Prompts', value: '5' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="text-center p-4 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <p className="text-3xl font-bold text-white mb-1 font-mono">{stat.value}</p>
            <p className="text-white/40 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Components Grid */}
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-white mb-8"
        >
          Componentes del Sistema
        </motion.h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.map((component, index) => (
            <ComponentShowcaseCard key={component.id} component={component} index={index} />
          ))}
        </div>
      </div>
      
      {/* Interactive Demo CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="max-w-4xl mx-auto mt-16 text-center"
      >
        <div 
          className="p-8 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))',
            border: '1px solid rgba(139, 92, 246, 0.1)',
          }}
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            ¿Listo para explorar?
          </h3>
          <p className="text-white/40 mb-6">
            Presiona <kbd className="px-2 py-1 rounded bg-white/5 text-cyan-400 mx-1">⌘K</kbd> 
            para abrir el Neural Nexus o navega con la Floating Island en móvil.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <motion.button
                className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Lock className="w-4 h-4" />
                Ver Auth Suite
              </motion.button>
            </Link>
            
            <Link href="/settings">
              <motion.button
                className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.08)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-4 h-4" />
                Ver Control Deck
              </motion.button>
            </Link>
            
            <Link href="/demo/mega-components">
              <motion.button
                className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.08)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Layout className="w-4 h-4" />
                Ver UI Components
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
      
      {/* Keyboard hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 left-6 hidden md:flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <kbd className="px-2 py-1 rounded bg-white/5 text-white/60 text-sm font-mono">⌘K</kbd>
        <span className="text-white/40 text-sm">Command Palette</span>
      </motion.div>
    </div>
  )
}
