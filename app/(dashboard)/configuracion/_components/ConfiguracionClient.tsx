'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User,
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Database,
  Palette,
  KeyRound,
  Smartphone,
  Save,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/app/_lib/utils'

const sections = [
  {
    id: 'perfil',
    title: 'Perfil',
    icon: User,
    description: 'Información de tu cuenta',
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones',
    icon: Bell,
    description: 'Preferencias de alertas',
  },
  {
    id: 'apariencia',
    title: 'Apariencia',
    icon: Palette,
    description: 'Tema y diseño visual',
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    icon: Shield,
    description: 'Contraseña y autenticación',
  },
  {
    id: 'datos',
    title: 'Datos',
    icon: Database,
    description: 'Respaldo y exportación',
  },
]

export function ConfiguracionClient() {
  const [activeSection, setActiveSection] = useState('perfil')
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    ventas: true,
    pagos: true,
  })

  const handleSave = () => {
    toast.success('Configuración guardada', {
      description: 'Tus preferencias han sido actualizadas',
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-1"
      >
        <nav className="space-y-1 rounded-2xl border border-white/5 bg-white/[0.02] p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                activeSection === section.id
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'hover:bg-white/5 text-muted-foreground'
              )}
            >
              <section.icon className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">{section.title}</p>
                <p className="text-xs opacity-60">{section.description}</p>
              </div>
            </button>
          ))}
        </nav>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6"
      >
        {activeSection === 'perfil' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Perfil de Usuario</h2>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nombre</label>
                  <input
                    type="text"
                    defaultValue="Administrador"
                    className="w-full mt-1 h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <input
                    type="email"
                    defaultValue="admin@chronos.com"
                    className="w-full mt-1 h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notificaciones' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Notificaciones</h2>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]"
                >
                  <div>
                    <p className="font-medium capitalize">{key}</p>
                    <p className="text-xs text-muted-foreground">
                      Recibir notificaciones de {key}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof notifications],
                      }))
                    }
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      value ? 'bg-purple-500' : 'bg-white/10'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        value ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'apariencia' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Apariencia</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'p-4 rounded-xl border transition-all text-center',
                    theme === t
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/5 hover:border-white/10'
                  )}
                >
                  {t === 'dark' && <Moon className="h-8 w-8 mx-auto mb-2" />}
                  {t === 'light' && <Sun className="h-8 w-8 mx-auto mb-2" />}
                  {t === 'system' && <Smartphone className="h-8 w-8 mx-auto mb-2" />}
                  <p className="capitalize font-medium">{t}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'seguridad' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Seguridad</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <KeyRound className="h-5 w-5 text-purple-400" />
                  <p className="font-medium">Cambiar Contraseña</p>
                </div>
                <div className="grid gap-3">
                  <input
                    type="password"
                    placeholder="Contraseña actual"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'datos' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Datos</h2>
            <div className="grid gap-4">
              <button className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium">Exportar Datos</p>
                    <p className="text-xs text-muted-foreground">
                      Descargar todos tus datos en formato CSV
                    </p>
                  </div>
                </div>
              </button>
              <button className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-green-400" />
                  <div className="text-left">
                    <p className="font-medium">Crear Respaldo</p>
                    <p className="text-xs text-muted-foreground">
                      Generar copia de seguridad completa
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <button
            onClick={handleSave}
            className="h-10 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Cambios
          </button>
        </div>
      </motion.div>
    </div>
  )
}
