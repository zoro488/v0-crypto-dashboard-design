#!/bin/bash
# 🎮 Script de Integración 3D - Sistema CHRONOS
# Automatiza la verificación e integración de componentes 3D

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🎮 CHRONOS - Verificador de Integración 3D${NC}"
echo "================================================"

# ════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE VERIFICACIÓN
# ════════════════════════════════════════════════════════════════════════════

check_3d_integration() {
    local panel="$1"
    local name=$(basename "$panel" .tsx)
    
    local comp_3d=$(grep -c "from.*components/3d" "$panel" 2>/dev/null || echo "0")
    comp_3d=$(echo "$comp_3d" | tr -d '[:space:]')
    local spline=$(grep -c "Spline\|spline" "$panel" 2>/dev/null || echo "0")
    spline=$(echo "$spline" | tr -d '[:space:]')
    local viz=$(grep -c "from.*visualizations" "$panel" 2>/dev/null || echo "0")
    viz=$(echo "$viz" | tr -d '[:space:]')
    
    if [ "$comp_3d" -gt 0 ] || [ "$spline" -gt 0 ]; then
        echo -e "${GREEN}✅ $name: Integración 3D activa (3D: $comp_3d, Spline: $spline, Viz: $viz)${NC}"
        return 0
    elif [ "$viz" -gt 0 ]; then
        echo -e "${YELLOW}🔶 $name: Solo visualizaciones Canvas (Viz: $viz)${NC}"
        return 1
    else
        echo -e "${RED}⚪ $name: Sin componentes 3D${NC}"
        return 2
    fi
}

# ════════════════════════════════════════════════════════════════════════════
# ANÁLISIS DE PANELES
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}📊 Analizando paneles Bento...${NC}"
echo ""

integrated=0
partial=0
pending=0

for panel in app/components/panels/Bento*.tsx; do
    check_3d_integration "$panel"
    result=$?
    
    case $result in
        0) ((integrated++)) ;;
        1) ((partial++)) ;;
        2) ((pending++)) ;;
    esac
done

echo ""
echo -e "${BLUE}📈 Resumen:${NC}"
echo "  ✅ Integrados: $integrated"
echo "  🔶 Parciales: $partial"
echo "  ⚪ Pendientes: $pending"

# ════════════════════════════════════════════════════════════════════════════
# COMPONENTES 3D DISPONIBLES
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}🎮 Componentes 3D disponibles:${NC}"
echo ""

find app/components/3d -name "*.tsx" -exec basename {} .tsx \; 2>/dev/null | sort | while read comp; do
    echo "  🧊 $comp"
done

echo ""
echo -e "${BLUE}📊 Visualizaciones disponibles:${NC}"
echo ""

find app/components/visualizations -name "*.tsx" -exec basename {} .tsx \; 2>/dev/null | sort | while read comp; do
    echo "  📈 $comp"
done

# ════════════════════════════════════════════════════════════════════════════
# RECOMENDACIONES
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${PURPLE}🎯 Recomendaciones de Integración:${NC}"
echo ""
echo "  | Panel              | Componente 3D Recomendado    |"
echo "  |--------------------|------------------------------|"
echo "  | BentoDashboard     | PremiumSplineOrb ✅          |"
echo "  | BentoVentas        | SalesFlowDiagram ✅          |"
echo "  | BentoClientes      | ClientNetworkGraph           |"
echo "  | BentoAlmacen       | InventoryHeatGrid            |"
echo "  | BentoBanco         | FinancialRiverFlow           |"
echo "  | BentoIA            | AIBrainVisualizer ✅         |"
echo "  | BentoOrdenesCompra | WorkflowVisualizer3D         |"
echo "  | BentoReportes      | ReportsTimeline              |"

# ════════════════════════════════════════════════════════════════════════════
# VERIFICACIÓN DE DEPENDENCIAS
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}📦 Verificando dependencias 3D...${NC}"
echo ""

if grep -q "@splinetool" package.json 2>/dev/null; then
    echo -e "  ${GREEN}✅ @splinetool/react-spline instalado${NC}"
else
    echo -e "  ${YELLOW}⚠️ @splinetool/react-spline no instalado${NC}"
fi

if grep -q "three" package.json 2>/dev/null; then
    echo -e "  ${GREEN}✅ three.js instalado${NC}"
else
    echo -e "  ${YELLOW}⚠️ three.js no instalado${NC}"
fi

if grep -q "@react-three/fiber" package.json 2>/dev/null; then
    echo -e "  ${GREEN}✅ @react-three/fiber instalado${NC}"
else
    echo -e "  ${YELLOW}⚠️ @react-three/fiber no instalado${NC}"
fi

echo ""
echo -e "${GREEN}✅ Verificación completada${NC}"
