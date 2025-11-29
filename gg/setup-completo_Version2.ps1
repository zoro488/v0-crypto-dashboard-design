# ========================================
# 🚀 SETUP COMPLETO - PREMIUM ECOSYSTEM
# ========================================

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 PREMIUM ECOSYSTEM - SETUP COMPLETO      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar mensajes con color
function Write-Step {
    param(
        [string]$Message,
        [string]$Color = "Green"
    )
    Write-Host "✓ $Message" -ForegroundColor $Color
}

function Write-Error-Step {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Step {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# ========================================
# 1. VERIFICAR DEPENDENCIAS
# ========================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📋 1. VERIFICANDO DEPENDENCIAS..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Verificar Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Step "Node.js instalado: $nodeVersion"
}
else {
    Write-Error-Step "Node.js no encontrado. Instala Node.js desde https://nodejs.org"
    exit 1
}

# Verificar npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Step "npm instalado: $npmVersion"
}
else {
    Write-Error-Step "npm no encontrado"
    exit 1
}

# Verificar Git
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVersion = git --version
    Write-Step "Git instalado: $gitVersion"
}
else {
    Write-Warning-Step "Git no encontrado (opcional para MCP git server)"
}

Write-Host ""

# ========================================
# 2. INSTALAR DEPENDENCIAS NPM
# ========================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📦 2. INSTALANDO DEPENDENCIAS DEL PROYECTO..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if (Test-Path "package.json") {
    Write-Host "   Ejecutando: npm install" -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Dependencias del proyecto instaladas"
    }
    else {
        Write-Error-Step "Error al instalar dependencias"
        exit 1
    }
}
else {
    Write-Warning-Step "No se encontró package.json"
}

Write-Host ""

# ========================================
# 3. INSTALAR MCP SERVERS (OPCIONAL)
# ========================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔌 3. INSTALANDO MCP SERVERS (OPCIONAL)..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "   Los MCP Servers mejoran GitHub Copilot con contexto adicional" -ForegroundColor Gray
Write-Host ""

$installMCP = Read-Host "¿Deseas instalar los MCP Servers? (s/n)"

if ($installMCP -eq "s" -or $installMCP -eq "S") {
    Write-Host "   Instalando 6 MCP Servers globalmente..." -ForegroundColor Gray

    $mcpServers = @(
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-git",
        "@modelcontextprotocol/server-github",
        "@modelcontextprotocol/server-memory",
        "@modelcontextprotocol/server-sequential-thinking",
        "@modelcontextprotocol/server-fetch"
    )

    foreach ($server in $mcpServers) {
        Write-Host "   → $server" -ForegroundColor Gray
        npm install -g $server --silent 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Step "$server instalado"
        }
        else {
            Write-Warning-Step "Error al instalar $server (continuando...)"
        }
    }

    Write-Host ""
    Write-Host "   📝 Nota: Reinicia VS Code para activar los MCP Servers" -ForegroundColor Yellow
}
else {
    Write-Warning-Step "Instalación de MCP Servers omitida"
}

Write-Host ""

# ========================================
# 4. VERIFICAR BUILD
# ========================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🏗️  4. VERIFICANDO BUILD..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "   Ejecutando: npm run build" -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Step "Build completado exitosamente"
}
else {
    Write-Error-Step "Error en el build"
    Write-Host "   Ejecuta 'npm run lint:fix' para corregir errores automáticamente" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# 5. INICIAR SERVIDOR DE DESARROLLO
# ========================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🚀 5. SERVIDOR DE DESARROLLO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$startDev = Read-Host "¿Deseas iniciar el servidor de desarrollo? (s/n)"

if ($startDev -eq "s" -or $startDev -eq "S") {
    Write-Host ""
    Write-Host "   🌐 Servidor iniciando en: http://localhost:5173" -ForegroundColor Green
    Write-Host "   ⏸  Presiona Ctrl+C para detener" -ForegroundColor Yellow
    Write-Host ""

    # Intentar abrir el navegador automáticamente
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"

    # Iniciar servidor
    npm run dev
}
else {
    Write-Host ""
    Write-Host "   Para iniciar el servidor más tarde, ejecuta:" -ForegroundColor Yellow
    Write-Host "   → npm run dev" -ForegroundColor Cyan
}

Write-Host ""

# ========================================
# RESUMEN FINAL
# ========================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 COMANDOS DISPONIBLES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Desarrollo:" -ForegroundColor White
Write-Host "   → npm run dev              # Servidor desarrollo" -ForegroundColor Gray
Write-Host "   → npm run build            # Build producción" -ForegroundColor Gray
Write-Host "   → npm run preview          # Preview build" -ForegroundColor Gray
Write-Host ""
Write-Host "   Testing:" -ForegroundColor White
Write-Host "   → npm run test             # Unit tests" -ForegroundColor Gray
Write-Host "   → npm run test:coverage    # Coverage report" -ForegroundColor Gray
Write-Host "   → npm run test:e2e         # E2E tests" -ForegroundColor Gray
Write-Host ""
Write-Host "   Linting:" -ForegroundColor White
Write-Host "   → npm run lint             # Revisar errores" -ForegroundColor Gray
Write-Host "   → npm run lint:fix         # Auto-fix errores" -ForegroundColor Gray
Write-Host "   → npm run format           # Prettier format" -ForegroundColor Gray
Write-Host ""
Write-Host "   Firebase:" -ForegroundColor White
Write-Host "   → npm run deploy           # Deploy producción" -ForegroundColor Gray
Write-Host "   → npm run deploy:preview   # Deploy preview" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 DOCUMENTACIÓN:" -ForegroundColor Cyan
Write-Host "   → SISTEMA_OPTIMIZADO_COMPLETO.md" -ForegroundColor Gray
Write-Host "   → SNIPPETS_OPTIMIZADOS.md" -ForegroundColor Gray
Write-Host "   → CONFIGURACION_TOOLS_OPTIMIZADA.md" -ForegroundColor Gray
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   🎉 PREMIUM ECOSYSTEM LISTO PARA USAR      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
