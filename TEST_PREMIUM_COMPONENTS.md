# 🧪 GUÍA DE PRUEBA - Componentes Premium CHRONOS

## 📋 PREPARACIÓN

### 1. Verificar que el servidor esté corriendo
```bash
pnpm dev
```

Debe mostrar: `✓ Ready in Xms`  
URL: http://localhost:3000

### 2. Abrir en navegador
- Chrome/Edge: Mejor soporte para haptic feedback
- Firefox: Soporte completo de animaciones
- Safari: Soporte parcial de haptic

---

## 🎨 PRUEBAS DE COMPONENTES

### AnimatedCounter

**Ubicación de Prueba:** Panel de Ventas > Estadísticas

**Qué Buscar:**
1. Los números NO deben aparecer instantáneamente
2. Deben animarse desde 0 hasta el valor final
3. Duración aproximada: 1 segundo
4. Easing suave (rápido al inicio, lento al final)
5. Formato de moneda correcto: `$XX,XXX.XX`

**Prueba Manual:**
```typescript
// En consola del navegador:
// 1. Abrir DevTools (F12)
// 2. Ir a Components tab (React DevTools)
// 3. Buscar AnimatedCounter
// 4. Cambiar prop "value" manualmente
// 5. Ver animación
```

**Criterios de Éxito:**
- ✅ Animación fluida sin saltos
- ✅ FPS estable (verificar en Performance tab)
- ✅ No causa re-renders innecesarios

---

### GlowButton

**Ubicación de Prueba:** Todos los paneles > Botón "Nueva Venta", "Nuevo Cliente", etc.

**Qué Buscar:**
1. **Estado Normal:** Gradiente sutil de cyan a blue
2. **Hover:** Brillo intenso + escala 1.02 + sombra
3. **Click:** Escala 0.98 + vibración (si dispositivo soporta)
4. **Loading:** Spinner animado + botón deshabilitado

**Prueba de Haptic Feedback:**
```javascript
// En consola:
// 1. Abrir móvil en DevTools (Ctrl+Shift+M)
// 2. Activar "Mobile device"
// 3. Click en GlowButton
// 4. Sentir vibración (o ver en log)

// Verificar en código:
navigator.vibrate([10, 50, 10]) // Success pattern
```

**Criterios de Éxito:**
- ✅ Hover suave sin parpadeo
- ✅ Click con feedback inmediato
- ✅ Loading state no permite clicks
- ✅ Vibración en dispositivos compatibles

---

### Tilt3D

**Ubicación de Prueba:** Panel de Clientes > Cards de clientes

**Qué Buscar:**
1. **Mouse Enter:** Card empieza a seguir mouse
2. **Mouse Move:** Inclinación dinámica (máx 10 grados)
3. **Sombra:** Se mueve según inclinación
4. **Mouse Leave:** Retorno suave a posición original

**Prueba de Performance:**
```javascript
// En Performance tab de DevTools:
// 1. Iniciar grabación
// 2. Mover mouse sobre card con Tilt3D
// 3. Detener grabación
// 4. Verificar FPS > 55
```

**Criterios de Éxito:**
- ✅ Respuesta instantánea al mouse
- ✅ No lag visible
- ✅ Retorno suave (no abrupto)
- ✅ FPS constante durante animación

---

### SkeletonTable

**Ubicación de Prueba:** Recargar página > Ver loading state en tablas

**Qué Buscar:**
1. **Estructura:** Filas y columnas correctas
2. **Animación:** Efecto shimmer de izquierda a derecha
3. **Timing:** Aparece inmediatamente, desaparece suavemente
4. **Variantes:** Default, card, compact

**Forzar Loading State:**
```typescript
// En código temporalmente:
const { data, loading } = useVentasData()
const forceLoading = true // <-- Añadir esta línea

{(loading || forceLoading) ? (
  <SkeletonTable rows={10} columns={8} animated />
) : (
  <PremiumDataTable data={data} />
)}
```

**Criterios de Éxito:**
- ✅ Shimmer suave y continuo
- ✅ Dimensiones coinciden con tabla real
- ✅ No causa layout shift al desaparecer

---

### Pulse Effect

**Ubicación de Prueba:** Crear nueva venta > Ver fila nueva en tabla

**Qué Buscar:**
1. **Inicio:** Elemento aparece con glow verde
2. **Animación:** Pulso suave (escala 1 → 1.05 → 1)
3. **Duración:** 2 segundos en loop
4. **Color:** Verde translúcido (`rgba(16,185,129,0.3)`)

**Trigger Manual:**
```typescript
// En componente:
const [showPulse, setShowPulse] = useState(false)

// Al crear venta:
const handleCrearVenta = async (data) => {
  const ventaId = await crearVenta(data)
  setShowPulse(true)
  setTimeout(() => setShowPulse(false), 4000) // 2 loops
}

// En render:
<Pulse enabled={showPulse} color="rgba(16,185,129,0.3)">
  <TableRow>...</TableRow>
</Pulse>
```

**Criterios de Éxito:**
- ✅ Visible pero no intrusivo
- ✅ Loop suave sin saltos
- ✅ Se desactiva automáticamente

---

### ShineEffect

**Ubicación de Prueba:** Panel de Clientes > Hover sobre cards

**Qué Buscar:**
1. **Trigger Hover:** Brillo cruza card de izquierda a derecha
2. **Trigger Always:** Brillo continuo en loop
3. **Velocidad:** 1000ms por defecto
4. **Color:** Blanco translúcido por defecto

**Prueba de Variantes:**
```typescript
// Hover (default)
<ShineEffect trigger="hover">
  <Card />
</ShineEffect>

// Always (para destacar elementos)
<ShineEffect trigger="always" duration={2000}>
  <Card className="bg-cyan-500/20" />
</ShineEffect>

// Custom color y ángulo
<ShineEffect 
  trigger="hover" 
  color="rgba(255,215,0,0.5)"
  angle={135}
>
  <Card />
</ShineEffect>
```

**Criterios de Éxito:**
- ✅ Shine visible en ambos modos
- ✅ No interfiere con contenido del card
- ✅ Performance fluida

---

## 🎬 PRUEBAS DE DEMOSTRACIÓN INTERACTIVA

### SystemShowcase Component

**Ubicación:** Botón flotante en esquina superior derecha

**Flujo de Prueba:**

1. **Click en "Iniciar Demostración Completa"**
   - Debe aparecer overlay de demo en bottom-right
   - Haptic feedback al click
   - Toast de bienvenida

2. **Observar Ejecución Automática**
   - Progress bar debe avanzar paso a paso
   - Cada paso muestra título y descripción
   - Elementos del DOM se highlightean con borde cyan
   - Toasts informativos aparecen sincronizados

3. **Control Manual**
   - Botón "Pausar" detiene ejecución
   - Botón "Reset" reinicia desde el inicio
   - Botón "X" cierra demo

4. **Completado**
   - Pantalla de éxito con checkmark animado
   - Métricas finales (27 funciones, 0 errores)
   - Confetti animation (opcional)

**Verificar 27 Pasos:**

| Paso | Acción | Duración | Verificación |
|------|--------|----------|--------------|
| 1 | Bienvenida | 2s | Toast + haptic |
| 2 | Scroll a Ventas | 2s | Panel visible |
| 3 | Stats de Ventas | 1.5s | Highlight stat |
| 4 | Abrir modal venta | 2s | Modal visible |
| 5-7 | Wizard steps | 3-4s cada | Inputs llenos |
| 8 | Guardar venta | 2s | Toast éxito |
| 9 | Scroll a Bancos | 2s | Panel visible |
| 10-12 | Verificar bóvedas | 2s cada | Highlights |
| 13-14 | Transf + Gasto | 3-3.5s | Modales |
| 15 | Scroll a Clientes | 2s | Panel visible |
| 16-18 | Perfil + Abono | 2.5-3s | Modales |
| 19-20 | Viz 3D | 2s cada | Canvas activos |
| 21-22 | Reportes | 1.5-2s | Gráficos |
| 23 | Completado | 2s | Pantalla éxito |

**Criterios de Éxito:**
- ✅ Todos los 27 pasos ejecutan sin error
- ✅ Highlights son visibles y precisos
- ✅ No hay memory leaks (verificar en DevTools Memory)
- ✅ Progress bar refleja avance correcto

---

## 🔍 DEBUGGING TIPS

### Si AnimatedCounter no anima:

```typescript
// Verificar:
1. Prop "value" está cambiando (no es constante)
2. Component no está dentro de <Suspense> sin fallback
3. Framer Motion está instalado: pnpm list framer-motion
4. No hay CSS que bloquee animation: check will-change
```

### Si GlowButton no brilla:

```typescript
// Verificar:
1. Import correcto: import { GlowButton } from '@/app/components/ui/microinteractions'
2. Tailwind está procesando las clases de gradiente
3. No hay z-index conflicts
4. Hover funciona en desktop (no mobile-only)
```

### Si Haptic no vibra:

```typescript
// Verificar en consola:
if ('vibrate' in navigator) {
  console.log('✅ Vibration API supported')
  navigator.vibrate(200) // Test
} else {
  console.log('❌ Vibration API NOT supported')
}

// Browsers con soporte:
// ✅ Chrome Android
// ✅ Firefox Android
// ❌ iOS Safari (no soporta)
// ❌ Desktop browsers (ignoran silently)
```

### Si SkeletonTable no aparece:

```typescript
// Verificar:
1. Loading state es true: console.log('loading:', loading)
2. Component está montado: React DevTools
3. No hay error en console
4. CSS de skeleton está cargado

// Forzar loading:
const loading = true // temporal
```

---

## ⚡ PERFORMANCE BENCHMARKS

### Métricas Objetivo:

| Métrica | Target | Cómo Medir |
|---------|--------|------------|
| **FPS Animaciones** | 60fps | DevTools Performance |
| **First Paint** | < 1s | Lighthouse |
| **Time to Interactive** | < 2s | Lighthouse |
| **Layout Shifts (CLS)** | < 0.1 | Lighthouse |
| **Memory Usage** | < 50MB | DevTools Memory |

### Cómo Correr Lighthouse:

```bash
# En Chrome:
1. Abrir DevTools (F12)
2. Tab "Lighthouse"
3. Seleccionar:
   - Mode: Navigation
   - Device: Desktop
   - Categories: Performance, Accessibility
4. Click "Analyze page load"
5. Esperar reporte
6. Verificar score > 90
```

### Performance Monitoring en Tiempo Real:

```typescript
// Añadir en app/layout.tsx:
useEffect(() => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration}ms`)
      }
    })
    observer.observe({ entryTypes: ['measure', 'navigation'] })
  }
}, [])
```

---

## 🎯 CHECKLIST DE PRUEBA COMPLETA

### Componentes Individuales
- [ ] AnimatedCounter anima correctamente
- [ ] GlowButton tiene estados hover/click/loading
- [ ] Tilt3D responde a mouse suavemente
- [ ] SkeletonTable muestra shimmer animado
- [ ] Pulse effect destaca nuevos elementos
- [ ] ShineEffect brilla en hover
- [ ] Haptic vibra en dispositivos compatibles
- [ ] Toast premium aparece con animación

### Integración en Paneles
- [ ] BentoVentasPremium usa microinteracciones
- [ ] BentoClientesPremium usa microinteracciones
- [ ] BentoBanco usa microinteracciones
- [ ] No hay conflictos de imports
- [ ] TypeScript compila sin errores

### Demostración Interactiva
- [ ] SystemShowcase inicia correctamente
- [ ] 27 pasos ejecutan sin error
- [ ] Highlights son precisos
- [ ] Control manual funciona
- [ ] Pantalla de completado aparece
- [ ] No hay memory leaks

### Performance
- [ ] Lighthouse score > 90
- [ ] FPS constante en 60
- [ ] No layout shifts visibles
- [ ] Memoria estable durante uso

### Cross-Browser
- [ ] Chrome/Edge: ✅ 100% funcional
- [ ] Firefox: ✅ 100% funcional
- [ ] Safari: ⚠️ Sin haptic, resto OK
- [ ] Mobile Chrome: ✅ Con haptic

---

## 🚨 ISSUES CONOCIDOS Y SOLUCIONES

### Issue 1: AnimatedCounter no se ve en Safari < 15
**Causa:** Safari antiguo no soporta CSS will-change correctamente  
**Solución:** Fallback a número estático
```typescript
const supportsWillChange = CSS.supports('will-change', 'transform')
{supportsWillChange ? <AnimatedCounter /> : <span>{value}</span>}
```

### Issue 2: Haptic no funciona en iOS
**Causa:** iOS no soporta Vibration API  
**Solución:** Graceful degradation (ya implementado)
```typescript
haptic.light() // Silently fails en iOS, no error
```

### Issue 3: SkeletonTable causa layout shift
**Causa:** Dimensiones no coinciden con tabla real  
**Solución:** Medir tabla y aplicar dimensiones exactas
```typescript
<SkeletonTable 
  rows={10} 
  columns={8}
  height="600px" // Altura exacta de tabla real
/>
```

---

## ✅ REPORTE FINAL DE PRUEBAS

**Fecha:** _______________  
**Tester:** _______________  
**Browser:** _______________  
**Device:** _______________  

### Resultados:

| Componente | Estado | Notas |
|------------|--------|-------|
| AnimatedCounter | ☐ Pass ☐ Fail |  |
| GlowButton | ☐ Pass ☐ Fail |  |
| Tilt3D | ☐ Pass ☐ Fail |  |
| SkeletonTable | ☐ Pass ☐ Fail |  |
| Pulse | ☐ Pass ☐ Fail |  |
| ShineEffect | ☐ Pass ☐ Fail |  |
| Haptic | ☐ Pass ☐ Fail ☐ N/A |  |
| SystemShowcase | ☐ Pass ☐ Fail |  |

### Performance:
- Lighthouse Score: ____/100
- FPS Promedio: ____fps
- Memory Usage: ____MB

### Issues Encontrados:
1. ________________________________
2. ________________________________
3. ________________________________

**Estado General:** ☐ Aprobado ☐ Requiere cambios

---

**🎉 Fin de la Guía de Pruebas**

Para soporte o reportar bugs, revisar:
- `SISTEMA_PREMIUM_COMPLETO.md` - Documentación completa
- `app/components/ui/microinteractions.tsx` - Código fuente
- Console del navegador - Logs de debugging
