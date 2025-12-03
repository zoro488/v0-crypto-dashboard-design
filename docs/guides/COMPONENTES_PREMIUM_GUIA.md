# 🎨 Guía Completa: Componentes Premium UI

Sistema completo de componentes de interfaz con diseño **Apple/Tesla**, glassmorphism y animaciones premium.

## 📦 Componentes Disponibles

### 🏗️ Layout Components

#### 1. **CardPremium**
Card premium con 5 variantes y efectos hover.

```tsx
import { CardPremium } from '@/app/components/ui-premium'

<CardPremium 
  variant="glass"           // glass | solid | elevated | gradient | neon
  hover={true}              // Efecto hover lift
  padding="md"              // none | sm | md | lg | xl
  rounded="tesla"           // apple | tesla | sm | md | lg
  glowColor="10, 132, 255"  // RGB para variant="neon"
>
  <CardHeaderPremium>
    <CardTitlePremium>Título</CardTitlePremium>
    <CardDescriptionPremium>Descripción</CardDescriptionPremium>
  </CardHeaderPremium>
  
  <CardContentPremium>
    {/* Contenido */}
  </CardContentPremium>
  
  <CardFooterPremium>
    {/* Footer con acciones */}
  </CardFooterPremium>
</CardPremium>
```

**Variantes:**
- `glass`: Glassmorphism translúcido (default)
- `solid`: Superficie sólida oscura
- `elevated`: Con sombra profunda
- `gradient`: Gradiente de fondo
- `neon`: Borde neón con efecto glow

---

#### 2. **ModalPremium**
Modal con backdrop glassmorphism y animaciones suaves.

```tsx
import { ModalPremium, ModalFooterPremium } from '@/app/components/ui-premium'

const [open, setOpen] = useState(false)

<ModalPremium
  open={open}
  onOpenChange={setOpen}
  title="Crear Venta"
  description="Completa los datos de la venta"
  size="lg"                    // sm | md | lg | xl | full
  showClose={true}
  closeOnOutsideClick={true}
  closeOnEscape={true}
>
  {/* Contenido del modal */}
  
  <ModalFooterPremium>
    <ButtonPremium variant="secondary" onClick={() => setOpen(false)}>
      Cancelar
    </ButtonPremium>
    <ButtonPremium variant="primary" onClick={handleSubmit}>
      Guardar
    </ButtonPremium>
  </ModalFooterPremium>
</ModalPremium>
```

---

#### 3. **DialogPremium**
Diálogos especializados con variantes predefinidas.

```tsx
import { DialogPremium } from '@/app/components/ui-premium'

<DialogPremium
  open={open}
  onOpenChange={setOpen}
  variant="confirm"         // confirm | alert | warning | success
  title="¿Eliminar venta?"
  description="Esta acción no se puede deshacer"
  confirmLabel="Eliminar"
  cancelLabel="Cancelar"
  onConfirm={async () => {
    await eliminarVenta()
  }}
  destructive={true}
  loading={isLoading}
/>
```

**Variantes:**
- `confirm`: Confirmación general (azul)
- `alert`: Alerta importante (rojo)
- `warning`: Advertencia (naranja)
- `success`: Confirmación exitosa (verde)

---

#### 4. **TabsPremium**
Sistema de pestañas con 3 variantes visuales.

```tsx
import { TabsPremium, TabsContentPremium } from '@/app/components/ui-premium'

<TabsPremium
  tabs={[
    { value: 'ventas', label: 'Ventas', icon: <ShoppingCart /> },
    { value: 'clientes', label: 'Clientes', icon: <Users /> },
    { value: 'reportes', label: 'Reportes', icon: <FileText /> }
  ]}
  defaultValue="ventas"
  variant="pill"              // line | pill | card
  orientation="horizontal"    // horizontal | vertical
  fullWidth={false}
  onValueChange={(value) => console.log(value)}
>
  <TabsContentPremium value="ventas">
    <ListaVentas />
  </TabsContentPremium>
  
  <TabsContentPremium value="clientes">
    <ListaClientes />
  </TabsContentPremium>
  
  <TabsContentPremium value="reportes">
    <Reportes />
  </TabsContentPremium>
</TabsPremium>
```

---

### 📝 Form Components

#### 5. **ButtonPremium**
Botones con 5 variantes y animaciones.

```tsx
import { ButtonPremium } from '@/app/components/ui-premium'

<ButtonPremium
  variant="primary"         // primary | secondary | tertiary | destructive | ghost
  size="md"                 // xs | sm | md (44px) | lg | xl
  loading={isLoading}
  leftIcon={<Save />}
  rightIcon={<ArrowRight />}
  fullWidth={false}
  onClick={handleClick}
>
  Guardar Venta
</ButtonPremium>
```

**Tamaños (Apple standard):**
- `xs`: 28px (7)
- `sm`: 36px (9)
- `md`: 44px (11) - **Estándar táctil Apple**
- `lg`: 52px (13)
- `xl`: 60px (15)

---

#### 6. **InputPremium**
Input premium con 3 variantes y estados completos.

```tsx
import { InputPremium } from '@/app/components/ui-premium'

<InputPremium
  label="Cliente"
  placeholder="Nombre del cliente..."
  variant="default"           // default | search | minimal
  inputSize="md"              // sm | md (44px) | lg
  leftIcon={User}
  rightIcon={Check}
  error={errors.cliente}
  helperText="Nombre completo del cliente"
  required
  value={cliente}
  onChange={(e) => setCliente(e.target.value)}
/>

// Textarea variant
<TextareaPremium
  label="Observaciones"
  rows={4}
  error={errors.observaciones}
  value={obs}
  onChange={(e) => setObs(e.target.value)}
/>
```

---

#### 7. **SelectPremium**
Select dropdown con Radix UI.

```tsx
import { SelectPremium } from '@/app/components/ui-premium'

<SelectPremium
  label="Banco Destino"
  options={[
    { value: 'boveda_monte', label: 'Bóveda Monte', icon: <Building /> },
    { value: 'utilidades', label: 'Utilidades', icon: <DollarSign /> },
    { value: 'flete_sur', label: 'Flete Sur', icon: <Truck /> }
  ]}
  placeholder="Seleccionar banco..."
  value={bancoSeleccionado}
  onValueChange={setBancoSeleccionado}
  error={errors.banco}
  helperText="Selecciona el banco de destino"
  required
/>
```

---

#### 8. **CheckboxPremium**
Checkbox con 2 variantes.

```tsx
import { CheckboxPremium } from '@/app/components/ui-premium'

// Default variant
<CheckboxPremium
  label="Aceptar términos"
  description="Acepto los términos y condiciones"
  checked={aceptado}
  onCheckedChange={setAceptado}
  required
/>

// Card variant (seleccionable)
<CheckboxPremium
  variant="card"
  label="Plan Premium"
  description="Acceso completo a todas las funcionalidades"
  checked={planPremium}
  onCheckedChange={setPlanPremium}
/>
```

---

#### 9. **RadioGroupPremium**
Grupo de radio buttons con 2 variantes.

```tsx
import { RadioGroupPremium } from '@/app/components/ui-premium'

<RadioGroupPremium
  label="Método de Pago"
  options={[
    { 
      value: 'efectivo', 
      label: 'Efectivo', 
      description: 'Pago inmediato en efectivo',
      icon: <DollarSign />
    },
    { 
      value: 'credito', 
      label: 'Crédito', 
      description: 'Pago a 30 días',
      icon: <CreditCard />
    }
  ]}
  value={metodoPago}
  onValueChange={setMetodoPago}
  variant="card"              // default | card
  orientation="vertical"      // vertical | horizontal
  required
/>
```

---

#### 10. **SwitchPremium**
Toggle switch estilo iOS.

```tsx
import { SwitchPremium } from '@/app/components/ui-premium'

<SwitchPremium
  label="Notificaciones"
  description="Recibir alertas de ventas pendientes"
  checked={notificaciones}
  onCheckedChange={setNotificaciones}
  labelPosition="right"       // left | right | top | bottom
/>
```

---

#### 11. **SliderPremium**
Slider con range support y step marks.

```tsx
import { SliderPremium } from '@/app/components/ui-premium'

<SliderPremium
  label="Descuento"
  value={[descuento]}
  onValueChange={([val]) => setDescuento(val)}
  min={0}
  max={100}
  step={5}
  showValue={true}
  showSteps={true}
  formatValue={(v) => `${v}%`}
/>

// Range slider
<SliderPremium
  label="Rango de Precios"
  value={rangoPrecios}
  onValueChange={setRangoPrecios}
  min={0}
  max={1000000}
  step={10000}
  formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
/>
```

---

### 💬 Feedback Components

#### 12. **BadgePremium**
Badges con 5 variantes y 6 colores.

```tsx
import { BadgePremium, DotBadgePremium } from '@/app/components/ui-premium'

<BadgePremium
  variant="solid"           // solid | outline | ghost | gradient | glow
  color="blue"              // blue | green | red | orange | purple | gray
  size="md"                 // sm | md | lg
  icon={Check}
  removable
  onRemove={() => handleRemove()}
>
  Pagado
</BadgePremium>

// Dot Badge (status indicator)
<DotBadgePremium color="green" pulse>
  En línea
</DotBadgePremium>
```

---

#### 13. **ToastPremium**
Sistema de notificaciones con provider.

```tsx
// En app/layout.tsx
import { ToastProvider } from '@/app/components/ui-premium'

<ToastProvider position="bottom-right" maxToasts={5}>
  {children}
</ToastProvider>

// En componentes
import { useToastHelpers } from '@/app/components/ui-premium'

function CrearVenta() {
  const { success, error, warning, info } = useToastHelpers()
  
  const handleSubmit = async () => {
    try {
      await crearVenta()
      success('Venta creada', 'La venta se registró correctamente')
    } catch (e) {
      error('Error', 'No se pudo crear la venta')
    }
  }
  
  // Con acción
  info('Nueva actualización', 'Hay cambios disponibles', {
    action: {
      label: 'Ver Cambios',
      onClick: () => verCambios()
    },
    duration: 10000  // 10 segundos
  })
}
```

---

#### 14. **TooltipPremium**
Tooltips con Radix UI.

```tsx
import { TooltipPremium, SimpleTooltip } from '@/app/components/ui-premium'

// Tooltip completo
<TooltipPremium
  content="Eliminar venta permanentemente"
  side="top"              // top | right | bottom | left
  align="center"          // start | center | end
  delayDuration={200}
  showArrow={true}
>
  <ButtonPremium variant="ghost" size="sm">
    <Trash />
  </ButtonPremium>
</TooltipPremium>

// Simple tooltip (solo CSS)
<SimpleTooltip content="Editar" position="top">
  <IconButton>
    <Edit />
  </IconButton>
</SimpleTooltip>
```

---

### 🧭 Navigation Components

#### 15. **DropdownPremium**
Dropdown menu con sub-menus.

```tsx
import { DropdownPremium } from '@/app/components/ui-premium'

const items = [
  { type: 'label', label: 'Acciones' },
  { 
    type: 'item', 
    label: 'Editar', 
    icon: <Edit />, 
    shortcut: '⌘E',
    onSelect: () => editar() 
  },
  { 
    type: 'item', 
    label: 'Duplicar', 
    icon: <Copy />, 
    shortcut: '⌘D',
    onSelect: () => duplicar() 
  },
  { type: 'separator' },
  { 
    type: 'checkbox', 
    label: 'Favorito', 
    checked: isFavorito,
    onSelect: () => toggleFavorito() 
  },
  { type: 'separator' },
  {
    type: 'sub',
    label: 'Exportar',
    icon: <Download />,
    subItems: [
      { type: 'item', label: 'PDF', onSelect: () => exportarPDF() },
      { type: 'item', label: 'Excel', onSelect: () => exportarExcel() },
      { type: 'item', label: 'CSV', onSelect: () => exportarCSV() }
    ]
  },
  { type: 'separator' },
  { 
    type: 'item', 
    label: 'Eliminar', 
    icon: <Trash />, 
    shortcut: '⌘⌫',
    onSelect: () => eliminar() 
  }
]

<DropdownPremium
  items={items}
  trigger={
    <ButtonPremium variant="ghost" size="sm">
      <MoreVertical />
    </ButtonPremium>
  }
  align="end"
  side="bottom"
/>
```

---

## 🎨 Estilos y Temas

### Colores Apple

```css
--blue-apple: #0A84FF
--green-apple: #30D158
--red-apple: #FF453A
--orange-apple: #FF9F0A
--purple-apple: #5E5CE6
--gray-apple: rgba(255,255,255,0.85)
```

### Glassmorphism

```css
bg-white/[0.03]
backdrop-blur-[40px]
border border-white/[0.08]
shadow-[0_0_80px_rgba(0,0,0,0.5)]
```

### Border Radius

- **Apple**: `rounded-xl` (12px)
- **Tesla**: `rounded-[24px]` (24px)

### Tamaños Táctiles (44px mínimo)

Todos los componentes interactivos siguen el estándar de Apple de 44px de altura mínima para garantizar usabilidad táctil.

---

## 🚀 Integración en Paneles

### Ejemplo: Panel de Ventas

```tsx
import {
  CardPremium,
  ButtonPremium,
  InputPremium,
  SelectPremium,
  TabsPremium,
  TabsContentPremium,
  ModalPremium,
  useToastHelpers,
} from '@/app/components/ui-premium'

export function PanelVentas() {
  const [modalOpen, setModalOpen] = useState(false)
  const { success, error } = useToastHelpers()

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <CardPremium variant="neon" hover>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Ventas</h1>
          <ButtonPremium
            variant="primary"
            size="lg"
            leftIcon={<Plus />}
            onClick={() => setModalOpen(true)}
          >
            Nueva Venta
          </ButtonPremium>
        </div>
      </CardPremium>

      {/* Tabs de contenido */}
      <TabsPremium
        tabs={[
          { value: 'todas', label: 'Todas', icon: <List /> },
          { value: 'pagadas', label: 'Pagadas', icon: <CheckCircle /> },
          { value: 'pendientes', label: 'Pendientes', icon: <Clock /> }
        ]}
        variant="pill"
      >
        <TabsContentPremium value="todas">
          <ListaVentas filtro="todas" />
        </TabsContentPremium>
        <TabsContentPremium value="pagadas">
          <ListaVentas filtro="pagadas" />
        </TabsContentPremium>
        <TabsContentPremium value="pendientes">
          <ListaVentas filtro="pendientes" />
        </TabsContentPremium>
      </TabsPremium>

      {/* Modal de creación */}
      <ModalPremium
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Nueva Venta"
        size="lg"
      >
        <FormularioVenta
          onSuccess={() => {
            success('Venta creada', 'La venta se registró correctamente')
            setModalOpen(false)
          }}
          onError={(msg) => error('Error', msg)}
        />
      </ModalPremium>
    </div>
  )
}
```

---

## ✨ Características Avanzadas

### 1. Animaciones con Framer Motion

Todos los componentes usan easing de Apple:
```typescript
transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
```

### 2. Accesibilidad

- Navegación por teclado completa
- ARIA labels y roles
- Focus visible states
- Screen reader support

### 3. Responsive Design

Todos los componentes se adaptan automáticamente a móvil, tablet y escritorio.

### 4. TypeScript Strict Mode

Tipos completos con IntelliSense para todas las props.

### 5. Font Smoothing

```css
.apple-font-smoothing {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 📚 Recursos Adicionales

- **Radix UI**: https://www.radix-ui.com/
- **Framer Motion**: https://www.framer.com/motion/
- **Apple HIG**: https://developer.apple.com/design/human-interface-guidelines/
- **Tesla Design**: https://www.tesla.com/design

---

## 🔄 Próximas Actualizaciones

- [ ] Componentes de Data Display (Table, DataGrid)
- [ ] Componentes de Navegación (Breadcrumb, Pagination)
- [ ] Componentes de Media (Avatar, Image)
- [ ] Componentes de Visualización (Charts, Graphs)
- [ ] Variantes de tema claro/oscuro
- [ ] Sistema de theming configurable

---

**Última actualización**: Diciembre 2025
**Versión**: 2.0.0
**Mantenedor**: Sistema CHRONOS
