# 🚀 SCRIPT DE ACTIVACIÓN COMPLETA DE AUTOMATIZACIÓN
# Premium Ecosystem - Chronos System
# Este script activa TODA la automatización del sistema

param(
    [switch]$SkipTests,
    [switch]$SkipGitHub,
    [switch]$SkipFirebase,
    [switch]$Force
)

Write-Host "🚀 INICIANDO ACTIVACIÓN COMPLETA DE AUTOMATIZACIÓN" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Variables globales
$ErrorActionPreference = if ($Force) { "Continue" } else { "Stop" }
$ProjectRoot = $PSScriptRoot
$TestsPassed = 0
$TestsFailed = 0
$TotalSteps = 0
$CompletedSteps = 0

function Write-Step {
    param([string]$Message)
    $script:TotalSteps++
    Write-Host "`n[$script:CompletedSteps/$script:TotalSteps] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    $script:CompletedSteps++
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# ==============================================
# FASE 1: VALIDACIÓN DE PREREQUISITES
# ==============================================

Write-Step "Validando prerequisites del sistema..."

# Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
}
catch {
    Write-Error-Custom "Node.js no está instalado"
    Write-Info "Instalar desde: https://nodejs.org/"
    if (-not $Force) { exit 1 }
}

# npm
try {
    $npmVersion = npm --version
    Write-Success "npm instalado: v$npmVersion"
}
catch {
    Write-Error-Custom "npm no está instalado"
    if (-not $Force) { exit 1 }
}

# Git
try {
    $gitVersion = git --version
    Write-Success "Git instalado: $gitVersion"
}
catch {
    Write-Error-Custom "Git no está instalado"
    Write-Info "Instalar desde: https://git-scm.com/"
    if (-not $Force) { exit 1 }
}

# Firebase CLI (opcional)
try {
    $firebaseVersion = firebase --version
    Write-Success "Firebase CLI instalado: $firebaseVersion"
}
catch {
    Write-Error-Custom "Firebase CLI no está instalado (opcional)"
    Write-Info "Instalar con: npm install -g firebase-tools"
}

# GitHub CLI (opcional)
try {
    $ghVersion = gh --version
    Write-Success "GitHub CLI instalado"
}
catch {
    Write-Error-Custom "GitHub CLI no está instalado (opcional)"
    Write-Info "Instalar desde: https://cli.github.com/"
}

# Playwright
try {
    $playwrightVersion = npx playwright --version
    Write-Success "Playwright instalado: $playwrightVersion"
}
catch {
    Write-Error-Custom "Playwright no está instalado"
    Write-Info "Se instalará automáticamente..."
}

# ==============================================
# FASE 2: INSTALACIÓN DE DEPENDENCIAS
# ==============================================

Write-Step "Instalando dependencias del proyecto..."

try {
    Push-Location $ProjectRoot

    # Instalar dependencias npm
    Write-Info "Ejecutando npm install..."
    npm install
    Write-Success "Dependencias npm instaladas"

    # Instalar Playwright browsers
    if (-not $SkipTests) {
        Write-Info "Instalando browsers de Playwright..."
        npx playwright install --with-deps
        Write-Success "Browsers de Playwright instalados"
    }

    Pop-Location
}
catch {
    Write-Error-Custom "Error instalando dependencias: $_"
    if (-not $Force) { exit 1 }
}

# ==============================================
# FASE 3: EJECUTAR TESTS E2E
# ==============================================

if (-not $SkipTests) {
    Write-Step "Ejecutando tests E2E de Playwright..."

    try {
        Push-Location $ProjectRoot

        # Verificar si hay tests disponibles
        Write-Info "Listando tests disponibles..."
        $testList = npx playwright test --list 2>&1 | Out-String

        if ($testList -match "Total: (\d+) tests") {
            $totalTests = $Matches[1]
            Write-Info "Total de tests encontrados: $totalTests"            # Ejecutar solo tests de Chronos (nuevos)
            Write-Info "Ejecutando tests E2E (esto puede tardar varios minutos)..."
            Write-Info "Browsers: Chromium, Firefox, Webkit, Mobile Chrome, Mobile Safari, iPad"

            # Ejecutar tests con timeout extendido
            $env:PWTEST_SKIP_TEST_OUTPUT = "1"

            # Ejecutar tests en un solo browser primero (Chromium) para validar
            Write-Info "Ejecutando tests en Chromium primero..."
            npx playwright test --project=chromium --grep="chronos-" --timeout=60000

            if ($LASTEXITCODE -eq 0) {
                Write-Success "Tests de Chromium pasaron exitosamente"
                $script:TestsPassed++
            }
            else {
                Write-Error-Custom "Algunos tests de Chromium fallaron"
                $script:TestsFailed++

                if (-not $Force) {
                    Write-Info "Usa -Force para continuar con errores"
                    exit 1
                }
            }

        }
        else {
            Write-Error-Custom "No se encontraron tests"
            if (-not $Force) { exit 1 }
        }

        Pop-Location
    }
    catch {
        Write-Error-Custom "Error ejecutando tests: $_"
        if (-not $Force) { exit 1 }
    }
}
else {
    Write-Info "Tests E2E omitidos (flag -SkipTests activo)"
}

# ==============================================
# FASE 4: CONFIGURAR GITHUB ACTIONS
# ==============================================

if (-not $SkipGitHub) {
    Write-Step "Configurando GitHub Actions..."

    # Verificar si estamos en un repo de GitHub
    try {
        $remoteUrl = git remote get-url origin

        if ($remoteUrl -match "github.com") {
            Write-Success "Repositorio de GitHub detectado: $remoteUrl"

            # Listar secrets requeridos
            Write-Info ""
            Write-Info "Secrets requeridos en GitHub (Settings > Secrets and variables > Actions):"
            Write-Info "  1. FIREBASE_TOKEN           - Token de CI de Firebase (firebase login:ci)"
            Write-Info "  2. FIREBASE_PROJECT_ID      - ID del proyecto de Firebase"
            Write-Info "  3. VITE_FIREBASE_API_KEY    - API Key de Firebase"
            Write-Info "  4. VITE_FIREBASE_AUTH_DOMAIN - Auth Domain de Firebase"
            Write-Info "  5. VITE_FIREBASE_STORAGE_BUCKET - Storage Bucket"
            Write-Info "  6. VITE_FIREBASE_MESSAGING_SENDER_ID - Sender ID"
            Write-Info "  7. VITE_FIREBASE_APP_ID     - App ID de Firebase"
            Write-Info "  8. OPENAI_API_KEY (opcional) - Para AI Agent automation"
            Write-Info ""

            # Verificar si GitHub CLI está disponible
            try {
                gh auth status 2>$null
                Write-Success "GitHub CLI autenticado"

                # Listar workflows disponibles
                Write-Info "Workflows disponibles:"
                gh workflow list

            }
            catch {
                Write-Error-Custom "GitHub CLI no está autenticado"
                Write-Info "Ejecutar: gh auth login"
            }

        }
        else {
            Write-Error-Custom "No es un repositorio de GitHub"
        }
    }
    catch {
        Write-Error-Custom "Error configurando GitHub Actions: $_"
        if (-not $Force) { exit 1 }
    }
}
else {
    Write-Info "Configuración de GitHub Actions omitida (flag -SkipGitHub activo)"
}

# ==============================================
# FASE 5: CONFIGURAR FIREBASE
# ==============================================

if (-not $SkipFirebase) {
    Write-Step "Configurando Firebase..."

    try {
        # Verificar si Firebase está configurado
        if (Test-Path "$ProjectRoot/.firebaserc") {
            Write-Success "Firebase ya está inicializado"

            # Mostrar proyectos configurados
            $firebaserc = Get-Content "$ProjectRoot/.firebaserc" | ConvertFrom-Json
            Write-Info "Proyectos configurados:"
            $firebaserc.projects | Get-Member -MemberType NoteProperty | ForEach-Object {
                $env = $_.Name
                $project = $firebaserc.projects.$env
                Write-Info "  - $env`: $project"
            }

        }
        else {
            Write-Error-Custom "Firebase no está inicializado"
            Write-Info "Ejecutar: firebase init"
        }

        # Verificar autenticación
        try {
            firebase login:list
            Write-Success "Firebase autenticado"
        }
        catch {
            Write-Error-Custom "Firebase no está autenticado"
            Write-Info "Ejecutar: firebase login"
        }

    }
    catch {
        Write-Error-Custom "Error configurando Firebase: $_"
        if (-not $Force) { exit 1 }
    }
}
else {
    Write-Info "Configuración de Firebase omitida (flag -SkipFirebase activo)"
}

# ==============================================
# FASE 6: GENERAR REPORTE FINAL
# ==============================================

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🎉 ACTIVACIÓN COMPLETA FINALIZADA" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Resumen de ejecución
Write-Host "📊 RESUMEN DE EJECUCIÓN:" -ForegroundColor Yellow
Write-Host "  - Steps completados: $CompletedSteps/$TotalSteps"
Write-Host "  - Tests pasados: $TestsPassed"
Write-Host "  - Tests fallidos: $TestsFailed"
Write-Host ""

# Estado de componentes
Write-Host "🔧 ESTADO DE COMPONENTES:" -ForegroundColor Yellow

$components = @{
    "E2E Tests (Playwright)" = -not $SkipTests
    "GitHub Actions"         = -not $SkipGitHub
    "Firebase Automation"    = -not $SkipFirebase
}

foreach ($component in $components.Keys) {
    $status = if ($components[$component]) { "✅ ACTIVO" } else { "⏭️  OMITIDO" }
    $color = if ($components[$component]) { "Green" } else { "Gray" }
    Write-Host "  - $component`: " -NoNewline
    Write-Host $status -ForegroundColor $color
}

Write-Host ""

# Próximos pasos
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""

if (-not $SkipTests -and $TestsFailed -eq 0) {
    Write-Host "  ✅ Tests E2E: LISTO" -ForegroundColor Green
    Write-Host "     - Ver reporte: npx playwright show-report" -ForegroundColor Gray
}
else {
    Write-Host "  ⏳ Tests E2E: Configurar y ejecutar" -ForegroundColor Yellow
    Write-Host "     - Comando: npx playwright test" -ForegroundColor Gray
}

if (-not $SkipGitHub) {
    Write-Host "  ⏳ GitHub Actions: Configurar secrets" -ForegroundColor Yellow
    Write-Host "     - URL: https://github.com/TU_USUARIO/premium-ecosystem/settings/secrets/actions" -ForegroundColor Gray
}
else {
    Write-Host "  ⏭️  GitHub Actions: Omitido" -ForegroundColor Gray
}

if (-not $SkipFirebase) {
    Write-Host "  ⏳ Firebase: Deploy manual" -ForegroundColor Yellow
    Write-Host "     - Comando: firebase deploy" -ForegroundColor Gray
}
else {
    Write-Host "  ⏭️  Firebase: Omitido" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📚 DOCUMENTACIÓN:" -ForegroundColor Yellow
Write-Host "  - Tests E2E: tests/E2E_TEST_DOCUMENTATION.md" -ForegroundColor Gray
Write-Host "  - Guía de activación: AUTOMATION_ACTIVATION_GUIDE.md" -ForegroundColor Gray
Write-Host "  - Workflows: .github/workflows/" -ForegroundColor Gray

Write-Host ""
Write-Host "🔗 ENLACES ÚTILES:" -ForegroundColor Yellow
Write-Host "  - Playwright: https://playwright.dev/" -ForegroundColor Gray
Write-Host "  - Firebase: https://console.firebase.google.com/" -ForegroundColor Gray
Write-Host "  - GitHub Actions: https://github.com/TU_USUARIO/premium-ecosystem/actions" -ForegroundColor Gray

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Para más información, consulta la documentación" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Código de salida
if ($TestsFailed -gt 0 -and -not $Force) {
    exit 1
}
else {
    exit 0
}
