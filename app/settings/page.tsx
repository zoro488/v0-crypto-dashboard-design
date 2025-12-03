'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Building2, 
  CreditCard, 
  Bell, 
  Shield, 
  Palette,
  Key,
  Globe,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  Laptop,
  MapPin,
  LogOut,
  Camera,
  Check,
  ChevronRight,
} from 'lucide-react'
import '@/app/styles/chronos-obsidian-os.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROL DECK - Settings & Profile Hub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Página de configuración estilo macOS System Settings:
 * - Sidebar con categorías
 * - Panels para cada sección
 * - Auto-save con feedback visual
 */

type SettingsTab = 'general' | 'profile' | 'organization' | 'billing' | 'security' | 'notifications'

interface Session {
  id: string
  device: string
  deviceIcon: typeof Laptop
  location: string
  lastActive: string
  current?: boolean
}

// Toggle Switch estilo iOS
function Toggle({ 
  checked, 
  onChange, 
  disabled = false 
}: { 
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative w-12 h-7 rounded-full p-1 transition-colors"
      style={{
        background: checked ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)',
        opacity: disabled ? 0.5 : 1,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white shadow-lg"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  )
}

// Toast de guardado
function SaveToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(16, 185, 129, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
          }}
        >
          <Check className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Cambios guardados</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Componente de Settings Card
function SettingsCard({ 
  title, 
  description, 
  children 
}: { 
  title: string
  description?: string
  children: React.ReactNode 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {description && <p className="text-white/40 text-sm mb-4">{description}</p>}
      {children}
    </motion.div>
  )
}

// Theme Selector
function ThemeSelector({ 
  value, 
  onChange 
}: { 
  value: 'dark' | 'light' | 'system'
  onChange: (theme: 'dark' | 'light' | 'system') => void
}) {
  const themes = [
    { id: 'light', icon: Sun, label: 'Claro' },
    { id: 'dark', icon: Moon, label: 'Oscuro' },
    { id: 'system', icon: Monitor, label: 'Sistema' },
  ] as const
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          onClick={() => onChange(theme.id)}
          className="relative p-4 rounded-xl flex flex-col items-center gap-2 transition-colors"
          style={{
            background: value === theme.id 
              ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))' 
              : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${value === theme.id ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <theme.icon 
            className="w-6 h-6" 
            style={{ color: value === theme.id ? '#06b6d4' : 'rgba(255, 255, 255, 0.4)' }}
          />
          <span 
            className="text-sm"
            style={{ color: value === theme.id ? '#06b6d4' : 'rgba(255, 255, 255, 0.6)' }}
          >
            {theme.label}
          </span>
          
          {value === theme.id && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  )
}

// Avatar Upload
function AvatarUpload({ 
  currentAvatar, 
  onUpload 
}: { 
  currentAvatar?: string
  onUpload: (file: File) => void 
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: currentAvatar ? 'transparent' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
            border: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {currentAvatar ? (
            <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-white/40" />
          )}
        </div>
        
        <motion.button
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Camera className="w-4 h-4 text-white" />
        </motion.button>
        
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
      </div>
      
      <div>
        <p className="text-white font-medium mb-1">Foto de perfil</p>
        <p className="text-white/40 text-sm">JPG, PNG o GIF. Máximo 5MB.</p>
      </div>
    </div>
  )
}

// Session Item
function SessionItem({ session, onRevoke }: { session: Session; onRevoke: () => void }) {
  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-xl"
      style={{
        background: session.current ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${session.current ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
      }}
    >
      <div 
        className="p-3 rounded-xl"
        style={{ background: 'rgba(255, 255, 255, 0.03)' }}
      >
        <session.deviceIcon className="w-5 h-5 text-white/60" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium">{session.device}</p>
          {session.current && (
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
            >
              Actual
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-white/40 text-sm mt-0.5">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {session.location}
          </span>
          <span>•</span>
          <span>{session.lastActive}</span>
        </div>
      </div>
      
      {!session.current && (
        <motion.button
          onClick={onRevoke}
          className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cerrar
        </motion.button>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [showSaveToast, setShowSaveToast] = useState(false)
  
  // Settings state
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sales: true,
    stock: true,
    system: false,
  })
  
  const [sessions] = useState<Session[]>([
    { id: '1', device: 'MacBook Pro', deviceIcon: Laptop, location: 'CDMX, México', lastActive: 'Ahora', current: true },
    { id: '2', device: 'iPhone 15 Pro', deviceIcon: Smartphone, location: 'CDMX, México', lastActive: 'Hace 2h' },
    { id: '3', device: 'Windows PC', deviceIcon: Monitor, location: 'Monterrey, México', lastActive: 'Hace 1 día' },
  ])
  
  const showSaved = () => {
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 2000)
  }
  
  const tabs = [
    { id: 'general', icon: Globe, label: 'General', color: '#06b6d4' },
    { id: 'profile', icon: User, label: 'Perfil', color: '#8b5cf6' },
    { id: 'organization', icon: Building2, label: 'Organización', color: '#10b981' },
    { id: 'billing', icon: CreditCard, label: 'Facturación', color: '#f59e0b' },
    { id: 'security', icon: Shield, label: 'Seguridad', color: '#ef4444' },
    { id: 'notifications', icon: Bell, label: 'Notificaciones', color: '#3b82f6' },
  ] as const
  
  return (
    <div 
      className="min-h-screen flex"
      style={{
        background: 'linear-gradient(135deg, #030308 0%, #0a0a0f 50%, #050510 100%)',
      }}
    >
      <SaveToast show={showSaveToast} />
      
      {/* Sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-72 p-6 border-r"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <h1 className="text-xl font-bold text-white mb-8">Configuración</h1>
        
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
              style={{
                background: activeTab === tab.id 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'transparent',
              }}
              whileHover={{ x: 4 }}
            >
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: `${tab.color}15`,
                  color: activeTab === tab.id ? tab.color : 'rgba(255, 255, 255, 0.4)',
                }}
              >
                <tab.icon className="w-4 h-4" />
              </div>
              <span 
                className="font-medium"
                style={{ color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.6)' }}
              >
                {tab.label}
              </span>
              
              {activeTab === tab.id && (
                <ChevronRight className="w-4 h-4 ml-auto text-white/40" />
              )}
            </motion.button>
          ))}
        </nav>
      </motion.aside>
      
      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* General */}
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">General</h2>
                <p className="text-white/40">Configura las preferencias generales de la aplicación</p>
              </div>
              
              <SettingsCard title="Apariencia" description="Personaliza el tema visual de la aplicación">
                <ThemeSelector value={theme} onChange={(t) => { setTheme(t); showSaved() }} />
              </SettingsCard>
              
              <SettingsCard title="Idioma y Región">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Idioma</label>
                    <select 
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                      defaultValue="es-MX"
                    >
                      <option value="es-MX">Español (México)</option>
                      <option value="en-US">English (US)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Zona horaria</label>
                    <select 
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                      defaultValue="America/Mexico_City"
                    >
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                    </select>
                  </div>
                </div>
              </SettingsCard>
            </motion.div>
          )}
          
          {/* Profile */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Perfil</h2>
                <p className="text-white/40">Administra tu información personal</p>
              </div>
              
              <SettingsCard title="Avatar">
                <AvatarUpload onUpload={() => showSaved()} />
              </SettingsCard>
              
              <SettingsCard title="Información Personal">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-sm mb-2 block">Nombre</label>
                      <input 
                        type="text"
                        defaultValue="Carlos"
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-sm mb-2 block">Apellido</label>
                      <input 
                        type="text"
                        defaultValue="López"
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Correo electrónico</label>
                    <input 
                      type="email"
                      defaultValue="carlos@empresa.com"
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              </SettingsCard>
            </motion.div>
          )}
          
          {/* Security */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Seguridad</h2>
                <p className="text-white/40">Protege tu cuenta y administra sesiones activas</p>
              </div>
              
              <SettingsCard title="Autenticación de dos factores">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">2FA habilitado</p>
                    <p className="text-white/40 text-sm">Protección adicional para tu cuenta</p>
                  </div>
                  <Toggle checked={false} onChange={() => showSaved()} />
                </div>
              </SettingsCard>
              
              <SettingsCard title="Sesiones activas" description="Dispositivos donde tu cuenta está abierta">
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <SessionItem 
                      key={session.id} 
                      session={session} 
                      onRevoke={() => showSaved()} 
                    />
                  ))}
                </div>
              </SettingsCard>
              
              <SettingsCard title="Cambiar contraseña">
                <div className="space-y-4">
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Contraseña actual</label>
                    <input 
                      type="password"
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Nueva contraseña</label>
                    <input 
                      type="password"
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <motion.button
                    className="px-6 py-3 rounded-xl font-medium text-white"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Actualizar contraseña
                  </motion.button>
                </div>
              </SettingsCard>
            </motion.div>
          )}
          
          {/* Notifications */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Notificaciones</h2>
                <p className="text-white/40">Configura cómo y cuándo recibir alertas</p>
              </div>
              
              <SettingsCard title="Canales de notificación">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-white font-medium">Correo electrónico</p>
                      <p className="text-white/40 text-sm">Recibe resúmenes diarios por email</p>
                    </div>
                    <Toggle 
                      checked={notifications.email} 
                      onChange={(v) => { setNotifications({ ...notifications, email: v }); showSaved() }}
                    />
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-white font-medium">Notificaciones push</p>
                      <p className="text-white/40 text-sm">Alertas en tiempo real en el navegador</p>
                    </div>
                    <Toggle 
                      checked={notifications.push} 
                      onChange={(v) => { setNotifications({ ...notifications, push: v }); showSaved() }}
                    />
                  </div>
                </div>
              </SettingsCard>
              
              <SettingsCard title="Tipos de alertas">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-white font-medium">Ventas nuevas</p>
                      <p className="text-white/40 text-sm">Cuando se registra una venta</p>
                    </div>
                    <Toggle 
                      checked={notifications.sales} 
                      onChange={(v) => { setNotifications({ ...notifications, sales: v }); showSaved() }}
                    />
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-white font-medium">Alertas de stock</p>
                      <p className="text-white/40 text-sm">Cuando un producto está bajo en inventario</p>
                    </div>
                    <Toggle 
                      checked={notifications.stock} 
                      onChange={(v) => { setNotifications({ ...notifications, stock: v }); showSaved() }}
                    />
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-white font-medium">Actualizaciones del sistema</p>
                      <p className="text-white/40 text-sm">Nuevas funciones y mantenimiento</p>
                    </div>
                    <Toggle 
                      checked={notifications.system} 
                      onChange={(v) => { setNotifications({ ...notifications, system: v }); showSaved() }}
                    />
                  </div>
                </div>
              </SettingsCard>
            </motion.div>
          )}
          
          {/* Organization placeholder */}
          {activeTab === 'organization' && (
            <motion.div
              key="organization"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Organización</h2>
                <p className="text-white/40">Configura los datos de tu empresa</p>
              </div>
              
              <SettingsCard title="Información de la empresa">
                <div className="space-y-4">
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Nombre de la empresa</label>
                    <input 
                      type="text"
                      defaultValue="FlowDistributor Inc."
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">RFC</label>
                    <input 
                      type="text"
                      defaultValue="FDI123456ABC"
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              </SettingsCard>
            </motion.div>
          )}
          
          {/* Billing placeholder */}
          {activeTab === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Facturación</h2>
                <p className="text-white/40">Administra tu plan y métodos de pago</p>
              </div>
              
              <SettingsCard title="Plan actual">
                <div 
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                  }}
                >
                  <div>
                    <p className="text-white font-semibold text-lg">Plan Enterprise</p>
                    <p className="text-white/40 text-sm">Usuarios ilimitados • Soporte prioritario</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">$2,999</p>
                    <p className="text-white/40 text-sm">MXN / mes</p>
                  </div>
                </div>
              </SettingsCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
