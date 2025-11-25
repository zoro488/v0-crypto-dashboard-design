# 🎨 Guía para Crear Componentes 3D Faltantes en Spline

## 📦 Componentes Pendientes

### 1. **AnalyticsGlobe3D** - Globo terráqueo con datos de ventas
### 2. **PremiumOrb** - Orbe flotante con métricas en tiempo real

---

## 🌍 1. AnalyticsGlobe3D (Globo Interactivo)

### Diseño Visual
- **Base**: Esfera 3D con textura de mapa mundial
- **Puntos de Datos**: Pines/marcadores en ubicaciones geográficas
  - México (ventas principales)
  - Otros países según distribuidores
- **Líneas de Conexión**: Arcos animados entre ubicaciones
- **Colores**: 
  - Globo: Azul oscuro (#1e3a8a) con transparencia
  - Pines: Verde (#22c55e) para ventas altas, Amarillo (#eab308) para medias, Rojo (#ef4444) para bajas
  - Líneas: Gradiente azul-cyan (#3b82f6 → #06b6d4)

### Animaciones
1. **Rotación continua**: 360° cada 30 segundos
2. **Hover sobre pines**: 
   - Escala +20%
   - Tooltip con información (ciudad, ventas totales, % del total)
3. **Click en pin**: 
   - Zoom hacia región
   - Mostrar panel lateral con desglose de ventas
4. **Partículas**: Pequeñas estrellas flotando alrededor del globo

### Estados (para control desde React)
```javascript
// Eventos que debes configurar en Spline:
- 'regionClick' → Emite nombre de región
- 'hover' → Emite datos de tooltip
- 'rotationSpeed' → Controla velocidad de rotación (1x, 2x, paused)
- 'dataUpdate' → Actualiza posiciones de pines
```

### Exportar desde Spline
1. Crear escena → Configurar eventos
2. Exportar como **React Component**
3. URL de la escena: `https://prod.spline.design/[TU_ID]/scene.splinecode`
4. Compartir el archivo ZIP o la URL

---

## 🔮 2. PremiumOrb (Orbe con Métricas)

### Diseño Visual
- **Núcleo**: Esfera cristalina con efecto glassmorphism
- **Anillos Orbitales**: 3 anillos rotando en diferentes velocidades
  - Anillo 1 (exterior): Ventas totales
  - Anillo 2 (medio): Ganancias netas
  - Anillo 3 (interior): ROI
- **Partículas Internas**: Puntos de luz flotando dentro del orbe
- **Colores Dinámicos**:
  - Verde (#10b981): Métricas positivas
  - Azul (#3b82f6): Neutro
  - Rojo (#f43f5e): Alertas/negativos
  - Dorado (#fbbf24): Objetivos alcanzados

### Animaciones
1. **Pulso**: El orbe escala ±5% cada 2 segundos
2. **Respuesta a Datos**:
   - Venta nueva → Flash de luz verde
   - Métrica negativa → Temblor + color rojo
   - Objetivo alcanzado → Explosión de partículas doradas
3. **Idle**: Rotación suave + partículas flotando
4. **Hover**: Desacelera rotación, muestra tooltip con métricas

### Estados (para control desde React)
```javascript
// Eventos que debes configurar en Spline:
- 'pulseIntensity' → Aumenta/disminuye pulso (0.5x - 3x)
- 'colorState' → Cambia color según estado ('positive', 'neutral', 'alert', 'achievement')
- 'dataFlash' → Trigger para animación de nueva venta
- 'showMetrics' → Toggle overlay con números
```

### Exportar desde Spline
1. Crear escena → Configurar eventos
2. Exportar como **React Component**
3. URL de la escena: `https://prod.spline.design/[TU_ID]/scene.splinecode`
4. Compartir el archivo ZIP o la URL

---

## 🔧 Integración en el Proyecto

Una vez que tengas las escenas de Spline:

### Paso 1: Crear componentes wrapper
```typescript
// frontend/app/components/3d/AnalyticsGlobe3D.tsx
"use client"
import Spline from "@splinetool/react-spline"
import { useEffect, useRef } from "react"

export function AnalyticsGlobe3D({ salesData }) {
  const splineRef = useRef<any>(null)
  
  const handleLoad = (spline: any) => {
    splineRef.current = spline
    
    // Listener para clicks en regiones
    spline.addEventListener('regionClick', (e: any) => {
      console.log('Región clickeada:', e.target.name)
    })
  }
  
  useEffect(() => {
    if (splineRef.current && salesData) {
      // Actualizar pines cuando cambien los datos
      splineRef.current.emitEvent('dataUpdate', salesData)
    }
  }, [salesData])
  
  return (
    <Spline 
      scene="TU_URL_AQUI/scene.splinecode"
      onLoad={handleLoad}
    />
  )
}
```

### Paso 2: Integrar en paneles
- **AnalyticsGlobe3D** → `BentoVentas.tsx` (tab "Mapa de Ventas")
- **PremiumOrb** → `BentoDashboard.tsx` (background flotante)

---

## 📚 Recursos de Spline

### Tutoriales Recomendados
1. **Globe Tutorial**: https://www.youtube.com/watch?v=ZTdoB3qJFy8
2. **Events & React**: https://docs.spline.design/docs/events
3. **Export to React**: https://docs.spline.design/docs/export-to-react

### Librerías de Assets Gratis
- **3D Icons**: https://www.iconfinder.com/search?q=3d&price=free
- **HDRIs (iluminación)**: https://polyhaven.com/hdris
- **Texturas**: https://www.textures.com/

---

## 🎯 Alternativa: Usar Three.js + React Three Fiber

Si prefieres que YO los cree con código (calidad inferior pero funcionales):

### Pros
- ✅ Control total desde código
- ✅ No depende de Spline
- ✅ Más ligero (sin iframe)

### Contras
- ❌ Calidad visual menor
- ❌ Animaciones más simples
- ❌ Requiere más tiempo de desarrollo

**¿Qué prefieres?**
1. **Crear en Spline** (recomendado - máxima calidad)
2. **Usar Three.js** (código, menor calidad pero funcional)
3. **Buscar modelos pre-hechos** (marketplaces como Sketchfab)
