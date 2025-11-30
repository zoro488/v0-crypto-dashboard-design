#!/bin/bash
# =============================================================================
# Script para configurar secretos de GitHub para CHRONOS
# =============================================================================
# 
# INSTRUCCIONES:
# 1. Asegúrate de tener gh CLI instalado y autenticado con permisos admin
# 2. Ejecuta: gh auth login
# 3. Luego ejecuta este script: ./scripts/setup-github-secrets.sh
#
# =============================================================================

set -e

echo "🔐 Configurando secretos de GitHub para CHRONOS..."
echo ""

# Verificar autenticación
if ! gh auth status &>/dev/null; then
    echo "❌ Error: No estás autenticado en GitHub CLI"
    echo "   Ejecuta: gh auth login"
    exit 1
fi

# Secretos de Firebase (del archivo .env.local)
FIREBASE_API_KEY="AIzaSyCR7zKZJAzCEq-jBbfkLJxWaz98zuRCkX4"
FIREBASE_AUTH_DOMAIN="premium-ecosystem-1760790572.firebaseapp.com"
FIREBASE_PROJECT_ID="premium-ecosystem-1760790572"
FIREBASE_STORAGE_BUCKET="premium-ecosystem-1760790572.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="100411784487"
FIREBASE_APP_ID="1:100411784487:web:ac2713291717869bc83d02"

echo "📝 Configurando secretos de Firebase..."

# Configurar cada secreto
gh secret set NEXT_PUBLIC_FIREBASE_API_KEY --body "$FIREBASE_API_KEY" && echo "✅ FIREBASE_API_KEY configurado"
gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --body "$FIREBASE_AUTH_DOMAIN" && echo "✅ FIREBASE_AUTH_DOMAIN configurado"
gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID --body "$FIREBASE_PROJECT_ID" && echo "✅ FIREBASE_PROJECT_ID configurado"
gh secret set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --body "$FIREBASE_STORAGE_BUCKET" && echo "✅ FIREBASE_STORAGE_BUCKET configurado"
gh secret set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --body "$FIREBASE_MESSAGING_SENDER_ID" && echo "✅ FIREBASE_MESSAGING_SENDER_ID configurado"
gh secret set NEXT_PUBLIC_FIREBASE_APP_ID --body "$FIREBASE_APP_ID" && echo "✅ FIREBASE_APP_ID configurado"

echo ""
echo "🎉 ¡Todos los secretos de Firebase configurados!"
echo ""
echo "📋 Secretos configurados:"
gh secret list

echo ""
echo "💡 Para configurar Vercel (deploy), necesitas también:"
echo "   gh secret set VERCEL_TOKEN --body 'tu-vercel-token'"
echo "   gh secret set VERCEL_ORG_ID --body 'tu-org-id'"
echo "   gh secret set VERCEL_PROJECT_ID --body 'tu-project-id'"
