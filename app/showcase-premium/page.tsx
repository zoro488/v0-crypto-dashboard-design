'use client'

import { useState } from 'react'
import { 
  Settings, 
  User, 
  Bell, 
  Download, 
  Copy, 
  Trash2, 
  ChevronDown,
  Star,
  Heart,
  Zap,
} from 'lucide-react'
import {
  ButtonPremium,
  CardPremium,
  CardHeaderPremium,
  CardTitlePremium,
  CardDescriptionPremium,
  CardContentPremium,
  InputPremium,
  TextareaPremium,
  BadgePremium,
  DotBadgePremium,
  SelectPremium,
  CheckboxPremium,
  RadioGroupPremium,
  SwitchPremium,
  SliderPremium,
  ModalPremium,
  DialogPremium,
  ToastProvider,
  useToastHelpers,
  DropdownPremium,
  TooltipPremium,
  SimpleTooltip,
  TabsPremium,
  TabsContentPremium,
} from '@/app/components/ui-premium'

/**
 * 🎨 SHOWCASE DE COMPONENTES PREMIUM
 * 
 * Demo completo de todos los componentes del sistema
 * de diseño Apple/Tesla
 */

export default function ComponentsShowcasePage() {
  return (
    <ToastProvider position="bottom-right">
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#1A1A2E] to-[#16213E] p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-white apple-font-smoothing">
              🎨 Componentes Premium
            </h1>
            <p className="text-xl text-white/60 apple-font-smoothing">
              Sistema de Diseño Apple/Tesla - CHRONOS
            </p>
          </div>

          {/* Sections */}
          <ShowcaseContent />
        </div>
      </div>
    </ToastProvider>
  )
}

function ShowcaseContent() {
  const { success, error, warning, info } = useToastHelpers()
  const [modalOpen, setModalOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [switchValue, setSwitchValue] = useState(false)
  const [sliderValue, setSliderValue] = useState([50])
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [radioValue, setRadioValue] = useState('option1')

  return (
    <div className="space-y-12">
      {/* Buttons */}
      <CardPremium variant="glass">
        <CardHeaderPremium>
          <CardTitlePremium>Buttons</CardTitlePremium>
          <CardDescriptionPremium>5 variantes, múltiples tamaños</CardDescriptionPremium>
        </CardHeaderPremium>
        <CardContentPremium>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <ButtonPremium variant="primary" onClick={() => success('¡Éxito!', 'Botón primario presionado')}>
                Primary
              </ButtonPremium>
              <ButtonPremium variant="secondary">Secondary</ButtonPremium>
              <ButtonPremium variant="tertiary">Tertiary</ButtonPremium>
              <ButtonPremium variant="destructive">Destructive</ButtonPremium>
              <ButtonPremium variant="ghost">Ghost</ButtonPremium>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <ButtonPremium variant="primary" size="xs">Extra Small</ButtonPremium>
              <ButtonPremium variant="primary" size="sm">Small</ButtonPremium>
              <ButtonPremium variant="primary" size="md">Medium</ButtonPremium>
              <ButtonPremium variant="primary" size="lg">Large</ButtonPremium>
              <ButtonPremium variant="primary" size="xl">Extra Large</ButtonPremium>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <ButtonPremium variant="primary" iconLeft={<Download />}>
                Con Icono
              </ButtonPremium>
              <ButtonPremium variant="primary" loading>
                Loading...
              </ButtonPremium>
              <ButtonPremium variant="primary" disabled>
                Disabled
              </ButtonPremium>
            </div>
          </div>
        </CardContentPremium>
      </CardPremium>

      {/* Badges */}
      <CardPremium variant="glass">
        <CardHeaderPremium>
          <CardTitlePremium>Badges</CardTitlePremium>
          <CardDescriptionPremium>Status indicators y labels</CardDescriptionPremium>
        </CardHeaderPremium>
        <CardContentPremium>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <BadgePremium variant="solid" color="blue">Solid Blue</BadgePremium>
              <BadgePremium variant="solid" color="green">Solid Green</BadgePremium>
              <BadgePremium variant="solid" color="red">Solid Red</BadgePremium>
              <BadgePremium variant="solid" color="orange">Solid Orange</BadgePremium>
              <BadgePremium variant="solid" color="purple">Solid Purple</BadgePremium>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <BadgePremium variant="outline" color="blue">Outline</BadgePremium>
              <BadgePremium variant="ghost" color="green">Ghost</BadgePremium>
              <BadgePremium variant="gradient" color="purple">Gradient</BadgePremium>
              <BadgePremium variant="glow" color="red">Glow</BadgePremium>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <BadgePremium variant="solid" color="blue" icon={Star}>Con Icono</BadgePremium>
              <BadgePremium variant="solid" color="green" removable onRemove={() => info('Badge eliminado')}>
                Removable
              </BadgePremium>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <DotBadgePremium color="green" pulse>Online</DotBadgePremium>
              <DotBadgePremium color="red">Offline</DotBadgePremium>
              <DotBadgePremium color="orange">Away</DotBadgePremium>
            </div>
          </div>
        </CardContentPremium>
      </CardPremium>

      {/* Inputs */}
      <CardPremium variant="glass">
        <CardHeaderPremium>
          <CardTitlePremium>Inputs & Forms</CardTitlePremium>
          <CardDescriptionPremium>Text fields, selects, checkboxes, etc.</CardDescriptionPremium>
        </CardHeaderPremium>
        <CardContentPremium>
          <div className="space-y-6 max-w-2xl">
            <InputPremium
              label="Email"
              type="email"
              placeholder="tu@email.com"
              helperText="Ingresa un email válido"
              required
            />
            
            <InputPremium
              label="Búsqueda"
              variant="search"
              placeholder="Buscar..."
            />
            
            <InputPremium
              label="Password"
              type="password"
              error="La contraseña debe tener al menos 8 caracteres"
            />
            
            <TextareaPremium
              label="Mensaje"
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
            />
            
            <SelectPremium
              label="País"
              placeholder="Selecciona un país"
              options={[
                { value: 'mx', label: 'México' },
                { value: 'us', label: 'Estados Unidos' },
                { value: 'es', label: 'España' },
                { value: 'ar', label: 'Argentina' },
              ]}
              required
            />
            
            <CheckboxPremium
              label="Acepto términos y condiciones"
              description="Lee nuestros términos antes de continuar"
              checked={checkboxValue}
              onCheckedChange={(c) => setCheckboxValue(c as boolean)}
            />
            
            <RadioGroupPremium
              label="Plan"
              options={[
                { value: 'option1', label: 'Básico', description: '$10/mes' },
                { value: 'option2', label: 'Pro', description: '$25/mes' },
                { value: 'option3', label: 'Enterprise', description: '$50/mes' },
              ]}
              value={radioValue}
              onValueChange={setRadioValue}
            />
            
            <SwitchPremium
              label="Notificaciones"
              description="Recibe actualizaciones por email"
              checked={switchValue}
              onCheckedChange={setSwitchValue}
              labelPosition="right"
            />
            
            <SliderPremium
              label="Volumen"
              value={sliderValue}
              onValueChange={setSliderValue}
              min={0}
              max={100}
              step={5}
              showValue
              showSteps
              formatValue={(v) => `${v}%`}
            />
          </div>
        </CardContentPremium>
      </CardPremium>

      {/* Tabs */}
      <CardPremium variant="glass">
        <CardHeaderPremium>
          <CardTitlePremium>Tabs</CardTitlePremium>
          <CardDescriptionPremium>3 variantes de navegación por tabs</CardDescriptionPremium>
        </CardHeaderPremium>
        <CardContentPremium>
          <TabsPremium
            tabs={[
              { value: 'tab1', label: 'Dashboard', icon: <Settings className="w-5 h-5" /> },
              { value: 'tab2', label: 'Perfil', icon: <User className="w-5 h-5" /> },
              { value: 'tab3', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
            ]}
            defaultValue="tab1"
            variant="line"
          >
            <TabsContentPremium value="tab1">
              <p className="text-white/60">Contenido del Dashboard</p>
            </TabsContentPremium>
            <TabsContentPremium value="tab2">
              <p className="text-white/60">Contenido del Perfil</p>
            </TabsContentPremium>
            <TabsContentPremium value="tab3">
              <p className="text-white/60">Contenido de Notificaciones</p>
            </TabsContentPremium>
          </TabsPremium>
        </CardContentPremium>
      </CardPremium>

      {/* Modals & Overlays */}
      <CardPremium variant="glass">
        <CardHeaderPremium>
          <CardTitlePremium>Modals & Overlays</CardTitlePremium>
          <CardDescriptionPremium>Dialogs, toasts, dropdowns, tooltips</CardDescriptionPremium>
        </CardHeaderPremium>
        <CardContentPremium>
          <div className="flex flex-wrap gap-3">
            <ButtonPremium variant="primary" onClick={() => setModalOpen(true)}>
              Abrir Modal
            </ButtonPremium>
            
            <ButtonPremium variant="secondary" onClick={() => setDialogOpen(true)}>
              Abrir Dialog
            </ButtonPremium>
            
            <ButtonPremium variant="tertiary" onClick={() => success('¡Bien hecho!', 'Toast de éxito')}>
              Toast Success
            </ButtonPremium>
            
            <ButtonPremium variant="tertiary" onClick={() => error('Error', 'Algo salió mal')}>
              Toast Error
            </ButtonPremium>
            
            <ButtonPremium variant="tertiary" onClick={() => warning('Cuidado', 'Revisa esto')}>
              Toast Warning
            </ButtonPremium>
            
            <ButtonPremium variant="tertiary" onClick={() => info('Info', 'Dato interesante')}>
              Toast Info
            </ButtonPremium>
            
            <DropdownPremium
              trigger={
                <ButtonPremium variant="secondary" iconRight={<ChevronDown />}>
                  Dropdown
                </ButtonPremium>
              }
              items={[
                { type: 'label', label: 'Acciones' },
                { type: 'item', label: 'Copiar', icon: <Copy className="w-5 h-5" />, shortcut: '⌘C' },
                { type: 'item', label: 'Descargar', icon: <Download className="w-5 h-5" />, shortcut: '⌘D' },
                { type: 'separator' },
                { type: 'item', label: 'Eliminar', icon: <Trash2 className="w-5 h-5" />, shortcut: '⌘⌫' },
              ]}
            />
            
            <TooltipPremium content="Esto es un tooltip premium con animación suave">
              <ButtonPremium variant="ghost" iconLeft={<Heart />}>
                Hover me
              </ButtonPremium>
            </TooltipPremium>
            
            <SimpleTooltip content="Tooltip simple con CSS" position="top">
              <ButtonPremium variant="ghost" iconLeft={<Zap />}>
                Simple Tooltip
              </ButtonPremium>
            </SimpleTooltip>
          </div>
        </CardContentPremium>
      </CardPremium>

      {/* Modal Example */}
      <ModalPremium
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Modal Premium"
        description="Este es un ejemplo de modal con glassmorphism"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-white/60">
            Contenido del modal aquí. Puedes agregar formularios, imágenes, o cualquier contenido.
          </p>
          <InputPremium placeholder="Escribe algo..." />
          <div className="flex gap-3 justify-end">
            <ButtonPremium variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </ButtonPremium>
            <ButtonPremium variant="primary" onClick={() => setModalOpen(false)}>
              Guardar
            </ButtonPremium>
          </div>
        </div>
      </ModalPremium>

      {/* Dialog Example */}
      <DialogPremium
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        variant="confirm"
        title="¿Estás seguro?"
        description="Esta acción no se puede deshacer. ¿Deseas continuar?"
        confirmLabel="Sí, continuar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          success('¡Confirmado!', 'Acción completada exitosamente')
          setDialogOpen(false)
        }}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  )
}
