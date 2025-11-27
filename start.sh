#!/bin/bash

# 🚀 Quick Start Script - FlowDistributor Ultra Premium
# Este script inicia el proyecto en modo desarrollo

echo "🎨 FlowDistributor Ultra Premium Dashboard"
echo "=========================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Cambiar al directorio frontend
cd frontend || exit 1

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Instalando dependencias..."
    npm install
fi

# Build del proyecto
echo ""
echo "🔨 Compilando proyecto..."
npm run build

# Verificar si el build fue exitoso
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build exitoso!"
    echo ""
    echo "🚀 Iniciando servidor de desarrollo..."
    echo ""
    echo "📍 La aplicación estará disponible en:"
    echo "   http://localhost:3000"
    echo ""
    echo "⚡ Características activas:"
    echo "   • 8 visualizaciones Canvas premium"
    echo "   • Animaciones 60fps"
    echo "   • Sistema Chronos completo"
    echo "   • Integración Firestore"
    echo "   • Bot 3D de Spline"
    echo ""
    echo "🛑 Para detener: Ctrl+C"
    echo ""
    
    npm run dev
else
    echo ""
    echo "❌ Error en el build"
    echo "Revisa los errores arriba para más detalles"
    exit 1
fi
