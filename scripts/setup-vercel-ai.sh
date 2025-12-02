#!/bin/bash

# 🚀 Script de Configuración Rápida - Vercel AI Gateway
# Para el sistema CHRONOS

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🤖 VERCEL AI GATEWAY - Configuración Automática          ║"
echo "║  Sistema CHRONOS                                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verificando prerequisitos...${NC}"
echo ""

# 1. Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI no encontrada. Instalando...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI instalada${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI encontrada ($(vercel --version))${NC}"
fi

# 2. Verificar autenticación
echo ""
echo -e "${BLUE}🔐 Verificando autenticación...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado. Iniciando login...${NC}"
    vercel login
else
    VERCEL_USER=$(vercel whoami 2>&1 | tail -n 1)
    echo -e "${GREEN}✅ Autenticado como: ${VERCEL_USER}${NC}"
fi

# 3. Vincular proyecto
echo ""
echo -e "${BLUE}🔗 Vinculando proyecto...${NC}"
if [ -d ".vercel" ]; then
    echo -e "${GREEN}✅ Proyecto ya vinculado${NC}"
else
    echo -e "${YELLOW}⚠️  Vinculando proyecto...${NC}"
    vercel link --yes
fi

# 4. Verificar OPENAI_API_KEY
echo ""
echo -e "${BLUE}🔑 Verificando OPENAI_API_KEY...${NC}"

# Verificar en .env.local
if [ -f ".env.local" ]; then
    if grep -q "OPENAI_API_KEY=sk-" .env.local; then
        echo -e "${GREEN}✅ OPENAI_API_KEY encontrada en .env.local${NC}"
    else
        echo -e "${YELLOW}⚠️  OPENAI_API_KEY no configurada en .env.local${NC}"
        echo ""
        echo -e "${BLUE}Por favor ingresa tu OpenAI API Key:${NC}"
        echo -e "${YELLOW}(Obtener en: https://platform.openai.com/api-keys)${NC}"
        read -p "API Key (sk-proj-...): " OPENAI_KEY
        
        if [ ! -z "$OPENAI_KEY" ]; then
            sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_KEY/" .env.local
            echo -e "${GREEN}✅ OPENAI_API_KEY actualizada en .env.local${NC}"
        fi
    fi
fi

# Verificar en Vercel
echo ""
echo -e "${BLUE}🔑 Verificando variables en Vercel...${NC}"
VERCEL_VARS=$(vercel env ls 2>&1)

if echo "$VERCEL_VARS" | grep -q "OPENAI_API_KEY"; then
    echo -e "${GREEN}✅ OPENAI_API_KEY configurada en Vercel${NC}"
else
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY no encontrada en Vercel${NC}"
    echo ""
    echo -e "${BLUE}¿Deseas agregarla ahora? (y/n)${NC}"
    read -p "> " ADD_KEY
    
    if [ "$ADD_KEY" = "y" ] || [ "$ADD_KEY" = "Y" ]; then
        echo ""
        echo -e "${BLUE}Ejecuta el siguiente comando:${NC}"
        echo -e "${YELLOW}vercel env add OPENAI_API_KEY${NC}"
        echo ""
        echo "Cuando pregunte:"
        echo "- Value: pega tu API key (sk-proj-...)"
        echo "- Environments: selecciona Production, Preview, Development"
        echo ""
        echo -e "${BLUE}Presiona Enter cuando hayas terminado...${NC}"
        read
    fi
fi

# 5. Verificar dependencias
echo ""
echo -e "${BLUE}📦 Verificando dependencias...${NC}"

REQUIRED_DEPS=(
    "ai"
    "@ai-sdk/openai"
    "@ai-sdk/anthropic"
    "@ai-sdk/google"
    "zod"
)

MISSING_DEPS=()

for dep in "${REQUIRED_DEPS[@]}"; do
    if ! grep -q "\"$dep\"" package.json; then
        MISSING_DEPS+=("$dep")
    fi
done

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Todas las dependencias instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  Dependencias faltantes: ${MISSING_DEPS[*]}${NC}"
    echo -e "${BLUE}Instalando...${NC}"
    pnpm add "${MISSING_DEPS[@]}"
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
fi

# 6. Build de prueba
echo ""
echo -e "${BLUE}🔨 Verificando build...${NC}"
if pnpm build &> /tmp/vercel-build.log; then
    echo -e "${GREEN}✅ Build exitoso${NC}"
else
    echo -e "${RED}❌ Build falló. Ver logs:${NC}"
    cat /tmp/vercel-build.log
    exit 1
fi

# 7. Resumen
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ CONFIGURACIÓN COMPLETADA                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Todo listo para desplegar!${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo ""
echo "1. 🚀 Deploy a producción:"
echo -e "   ${YELLOW}vercel --prod${NC}"
echo ""
echo "2. 🧪 Probar localmente:"
echo -e "   ${YELLOW}pnpm dev${NC}"
echo -e "   Abre: ${YELLOW}http://localhost:3000/ai-panel${NC}"
echo ""
echo "3. 📊 Ver métricas:"
echo -e "   ${YELLOW}https://vercel.com/dashboard${NC}"
echo ""
echo "4. 📖 Documentación completa:"
echo -e "   ${YELLOW}cat VERCEL_AI_GATEWAY_SETUP.md${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
