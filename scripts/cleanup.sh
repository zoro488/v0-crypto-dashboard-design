#!/bin/bash

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                    CHRONOS SYSTEM - CLEANUP SCRIPT                         ║
# ║              Remove duplicates and optimize project structure              ║
# ╚════════════════════════════════════════════════════════════════════════════╝

echo "🧹 CHRONOS System Cleanup Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Remove duplicate node_modules
echo "📦 Step 1: Cleaning duplicate node_modules..."
if [ -d "./components/ui/node_modules" ]; then
    rm -rf ./components/ui/node_modules
    print_status "Removed components/ui/node_modules"
fi

if [ -d "./frontend/app/node_modules" ]; then
    rm -rf ./frontend/app/node_modules
    print_status "Removed frontend/app/node_modules"
fi

# 2. Clean build artifacts
echo ""
echo "🏗️  Step 2: Cleaning build artifacts..."
rm -rf .next
rm -rf out
rm -rf dist
rm -rf build
print_status "Removed build directories"

# 3. Clean cache
echo ""
echo "🗑️  Step 3: Cleaning cache..."
rm -rf .turbo
rm -rf .vercel
rm -rf .cache
print_status "Removed cache directories"

# 4. Clean logs
echo ""
echo "📝 Step 4: Cleaning logs..."
find . -name "*.log" -type f -delete
find . -name "npm-debug.log*" -type f -delete
find . -name "yarn-debug.log*" -type f -delete
find . -name "yarn-error.log*" -type f -delete
print_status "Removed log files"

# 5. Clean temporary files
echo ""
echo "🗂️  Step 5: Cleaning temporary files..."
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete
find . -name "*.bak" -type f -delete
find . -name "*.backup" -type f -delete
find . -name "*~" -type f -delete
print_status "Removed temporary files"

# 6. Clean TypeScript build info
echo ""
echo "📘 Step 6: Cleaning TypeScript artifacts..."
find . -name "*.tsbuildinfo" -type f -delete
print_status "Removed TypeScript build info"

# 7. Report
echo ""
echo "📊 Cleanup Report:"
echo "=================="
SIZE_BEFORE=$(du -sh . 2>/dev/null | cut -f1)
echo "Current project size: $SIZE_BEFORE"
echo ""

# 8. Optional: Reinstall dependencies
read -p "🔄 Do you want to reinstall dependencies? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Reinstalling dependencies..."
    pnpm install
    print_status "Dependencies reinstalled"
else
    print_warning "Skipping dependency reinstallation"
fi

echo ""
echo "✨ Cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm dev' to start development server"
echo "2. Run 'pnpm build' to create production build"
echo "3. Review SISTEMA_OPTIMIZADO_COMPLETO.md for optimization details"
