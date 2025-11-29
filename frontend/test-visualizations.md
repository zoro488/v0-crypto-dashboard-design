# 🧪 Test de Visualizaciones Premium

## Checklist de Pruebas

### ✅ Dashboard - InteractiveMetricsOrb
- [ ] El orbe central se renderiza correctamente
- [ ] Las 4 métricas orbitan alrededor del centro
- [ ] Hover en métricas muestra efecto de glow
- [ ] Partículas explotan en hover
- [ ] Datos reales: ventasMes, capitalTotal, stockActual, ordenesActivas
- [ ] Animación fluida a 60fps

### ✅ Ventas - SalesFlowDiagram
- [ ] Diagrama Sankey con 5 nodos
- [ ] Curvas Bézier conectan los nodos
- [ ] Partículas fluyen por los enlaces
- [ ] Hover en nodos resalta conexiones
- [ ] Click selecciona nodo
- [ ] Tooltip muestra información

### ✅ Banco - FinancialRiverFlow
- [ ] 4 cuentas bancarias visibles
- [ ] Burbujas de transacciones se mueven
- [ ] Efectos de ondas (ripples) en destino
- [ ] Simulación de agua en fondo
- [ ] Hover en cuenta muestra saldo
- [ ] Auto-generación de transacciones cada 2s

### ✅ Almacén - InventoryHeatGrid
- [ ] Grid isométrico 8x8 (64 items)
- [ ] Cajas con altura según stock
- [ ] Colores: Rojo (crítico) → Verde (normal) → Azul (alto)
- [ ] Partículas de alerta en stock bajo
- [ ] Hover muestra detalles del producto
- [ ] Leyenda de colores visible

### ✅ Clientes - ClientNetworkGraph
- [ ] 30 nodos con física de repulsión
- [ ] Conexiones entre nodos relacionados
- [ ] Partículas fluyen en conexiones activas
- [ ] Búsqueda filtra y resalta nodos
- [ ] Click selecciona cliente
- [ ] Colores por tipo: cliente/distribuidor/empresa

### ✅ Profit - ProfitWaterfallChart
- [ ] 5 barras: Ingresos, Costos, Gastos, Impuestos, Ganancia
- [ ] Efecto líquido con ondas
- [ ] Gotas caen de las barras
- [ ] Conexiones flotantes entre barras
- [ ] Fill animado progresivamente
- [ ] Hover muestra valor exacto

### ✅ IA - AIBrainVisualizer
- [ ] Red neuronal con 5 capas (56 nodos)
- [ ] Pulsos eléctricos en sinapsis
- [ ] Ondas cerebrales en fondo
- [ ] Actividad aumenta cuando isThinking=true
- [ ] Sincronizado con estado del bot 3D
- [ ] Intensidad responde a activityLevel

### ✅ Reportes - ReportsTimeline
- [ ] Timeline espiral con 30 eventos
- [ ] Controles de zoom funcionales
- [ ] Pan con botones izquierda/derecha
- [ ] Partículas siguen eventos
- [ ] Hover muestra detalles del evento
- [ ] 5 tipos de eventos con colores distintos

## 🎯 Pruebas de Performance

### FPS (Frames Per Second)
\`\`\`javascript
// Agregar en console del navegador:
let lastTime = performance.now();
let frames = 0;
setInterval(() => {
  const now = performance.now();
  const fps = Math.round(frames * 1000 / (now - lastTime));
  console.log(`FPS: ${fps}`);
  frames = 0;
  lastTime = now;
}, 1000);

// En cada frame:
frames++;
\`\`\`

**Target**: ≥ 55 FPS (mínimo aceptable)
**Ideal**: 60 FPS constante

### Memory Leaks
1. Abrir Chrome DevTools → Performance
2. Grabar durante 30 segundos
3. Verificar que la memoria no suba constantemente
4. Cerrar y abrir paneles varias veces
5. Verificar que animationFrame se cancele correctamente

### Bundle Size
\`\`\`bash
cd frontend
npm run build
# Verificar output size en .next/static/
\`\`\`

**Target**: < 500KB por visualización

## 🐛 Tests de Edge Cases

### Datos Vacíos
- [ ] Componentes muestran placeholder cuando no hay datos
- [ ] No crashes con arrays vacíos
- [ ] Mensajes informativos

### Valores Extremos
- [ ] Números muy grandes (millones)
- [ ] Números negativos
- [ ] Valores en cero
- [ ] NaN / Infinity

### Interacciones
- [ ] Rapid hover (mouse moviéndose rápido)
- [ ] Click fuera del canvas
- [ ] Resize de ventana
- [ ] Touch en móviles (si aplica)

### Navegación
- [ ] Cambio rápido entre paneles
- [ ] No memory leaks al unmount
- [ ] Estado preservado al regresar
- [ ] Animaciones no se acumulan

## 🔍 Inspección Visual

### Calidad Gráfica
- [ ] Sin aliasing visible
- [ ] Gradientes suaves
- [ ] Sombras bien renderizadas
- [ ] Colores consistentes con el tema

### Responsive
- [ ] Canvas escala correctamente
- [ ] Tooltips no salen de pantalla
- [ ] Botones accesibles en móvil
- [ ] Texto legible en todas las resoluciones

### Accesibilidad
- [ ] Contraste suficiente
- [ ] Textos descriptivos
- [ ] Keyboard navigation (si aplica)
- [ ] Screen reader friendly

## 📊 Resultados Esperados

### ✅ Éxito Total
- 8/8 visualizaciones funcionando
- 60 FPS en todas
- 0 errores en console
- 0 warnings de React
- Build exitoso

### ⚠️ Parcial
- 6-7/8 visualizaciones OK
- 45-60 FPS
- Warnings menores
- Algunas microinteracciones lentas

### ❌ Fallo
- < 6/8 visualizaciones funcionando
- < 45 FPS
- Crashes o errores frecuentes
- Build falla

## 🚀 Comandos de Test

\`\`\`bash
# Desarrollo
cd frontend
npm run dev
# Abrir http://localhost:3000

# Build de producción
npm run build
npm start

# Verificar errores TypeScript
npx tsc --noEmit

# Linting
npm run lint
\`\`\`

## 📝 Reporte de Bugs

**Template**:
\`\`\`
### [Componente] - [Descripción corta]

**Pasos para reproducir**:
1. Navegar a panel X
2. Hacer hover en elemento Y
3. Observar comportamiento Z

**Comportamiento esperado**:
...

**Comportamiento actual**:
...

**Screenshot** (si aplica):
...

**Consola**:
\`\`\`console
... errores ...
\`\`\`

**Navegador**: Chrome 120 / Firefox 121 / Safari 17
**OS**: Windows 11 / macOS 14 / Linux Ubuntu 22.04
\`\`\`

---

**Última actualización**: 23 Nov 2025
**Status**: ✅ Listo para testing
