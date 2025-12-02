#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# 🔒 SCRIPT DE AUDITORÍA DE SEGURIDAD - CHRONOS SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

echo "🔒 INICIANDO AUDITORÍA DE SEGURIDAD - Sistema CHRONOS"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

ERRORS=0
WARNINGS=0

# Función para reportar
report_error() {
    echo "❌ ERROR: $1"
    ((ERRORS++))
}

report_warning() {
    echo "⚠️  WARNING: $1"
    ((WARNINGS++))
}

report_ok() {
    echo "✅ OK: $1"
}

# ═══════════════════════════════════════════════════════════════════════════
# 1. VERIFICAR VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 1. Verificando configuración de variables de entorno..."

# Verificar que NO hay credenciales en código
if grep -r "AIza" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules .; then
    report_error "Posible API key de Firebase expuesta en código"
else
    report_ok "No se encontraron API keys hardcodeadas"
fi

# Verificar .env.local.template existe
if [ -f ".env.local.template" ]; then
    report_ok ".env.local.template existe"
else
    report_warning ".env.local.template no existe - crear template para otros developers"
fi

# Verificar .gitignore incluye .env
if grep -q "\.env" .gitignore; then
    report_ok ".env files están en .gitignore"
else
    report_error ".env files NO están en .gitignore - CRÍTICO"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 2. VERIFICAR FIRESTORE RULES
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 2. Verificando Firestore Security Rules..."

if grep -q "allowAccess() = true" firestore.rules 2>/dev/null || grep -q "return true" firestore.rules 2>/dev/null; then
    report_error "Firestore rules en MODO DESARROLLO - cambiar antes de producción"
else
    report_ok "Firestore rules no tienen allowAccess() abierto"
fi

if [ -f "firestore.rules.secure" ]; then
    report_ok "firestore.rules.secure existe como backup de producción"
else
    report_warning "firestore.rules.secure no existe - crear reglas de producción"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 3. VERIFICAR CORS Y HEADERS DE SEGURIDAD
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 3. Verificando configuración CORS y headers..."

if grep -q '"Access-Control-Allow-Origin": "\*"' vercel.json 2>/dev/null; then
    report_error "CORS abierto a todos los orígenes (*) en vercel.json"
else
    report_ok "CORS no está abierto a todos los orígenes"
fi

if grep -q "X-Content-Type-Options" vercel.json 2>/dev/null; then
    report_ok "Header X-Content-Type-Options configurado"
else
    report_warning "Header X-Content-Type-Options no configurado"
fi

if grep -q "X-Frame-Options" vercel.json 2>/dev/null; then
    report_ok "Header X-Frame-Options configurado"
else
    report_warning "Header X-Frame-Options no configurado"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 4. VERIFICAR DEPENDENCIAS
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 4. Verificando seguridad de dependencias..."

# NPM Audit
npm audit --audit-level=high 2>/dev/null || report_warning "Vulnerabilidades de alta severidad en dependencias"

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 5. VERIFICAR TYPESCRIPT
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 5. Verificando TypeScript strict mode..."

if grep -q '"strict": true' tsconfig.json; then
    report_ok "TypeScript strict mode habilitado"
else
    report_error "TypeScript strict mode NO habilitado"
fi

# Buscar 'any' en código
ANY_COUNT=$(grep -r ": any" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null | wc -l)
if [ "$ANY_COUNT" -gt 10 ]; then
    report_warning "Se encontraron $ANY_COUNT usos de 'any' - considerar tipar correctamente"
else
    report_ok "Uso mínimo de 'any' en el código"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════════════════"
echo "📊 RESUMEN DE AUDITORÍA"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "   ❌ Errores críticos: $ERRORS"
echo "   ⚠️  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "🚨 RESULTADO: NO APTO PARA PRODUCCIÓN"
    echo "   Corrige los errores críticos antes de deployar"
    exit 1
else
    if [ $WARNINGS -gt 0 ]; then
        echo "✅ RESULTADO: APTO CON ADVERTENCIAS"
        echo "   Considera resolver los warnings antes de deployar"
        exit 0
    else
        echo "✅ RESULTADO: APTO PARA PRODUCCIÓN"
        exit 0
    fi
fi
