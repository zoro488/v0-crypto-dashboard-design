#!/bin/bash
#
# 🤖 CHRONOS Autonomous Testing Runner
# =====================================
#
# Script para ejecutar el sistema de testing autónomo de forma continua.
#
# Uso:
#   ./run_autonomous.sh              # Ejecutar una vez
#   ./run_autonomous.sh --daemon     # Ejecutar en modo daemon (continuo)
#   ./run_autonomous.sh --watch      # Ejecutar con watch (reinicia en cambios)
#
# Autor: CHRONOS AI System
# Versión: 1.0.0

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
WORKSPACE="/workspaces/v0-crypto-dashboard-design"
AUTOMATION_DIR="$WORKSPACE/automation"
LOGS_DIR="$AUTOMATION_DIR/logs"
REPORTS_DIR="$AUTOMATION_DIR/reports"
PID_FILE="$AUTOMATION_DIR/.agent.pid"
MAX_LOG_SIZE=10485760  # 10MB

# Banner
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║         🤖 CHRONOS Autonomous Testing System v1.0.0                 ║"
    echo "║                                                                      ║"
    echo "║  Sistema autónomo de testing, corrección y validación continua      ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Crear directorios necesarios
setup_directories() {
    mkdir -p "$LOGS_DIR"
    mkdir -p "$REPORTS_DIR"
}

# Verificar dependencias
check_dependencies() {
    echo -e "${BLUE}📋 Verificando dependencias...${NC}"
    
    # Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 no encontrado${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Python3: $(python3 --version)"
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️ Node.js no encontrado (algunos tests pueden fallar)${NC}"
    else
        echo -e "  ${GREEN}✓${NC} Node.js: $(node --version)"
    fi
    
    # pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠️ pnpm no encontrado (algunos tests pueden fallar)${NC}"
    else
        echo -e "  ${GREEN}✓${NC} pnpm: $(pnpm --version)"
    fi
    
    echo ""
}

# Instalar dependencias Python si es necesario
install_python_deps() {
    echo -e "${BLUE}📦 Verificando dependencias Python...${NC}"
    
    if [ -f "$WORKSPACE/evaluation/requirements.txt" ]; then
        pip install -q -r "$WORKSPACE/evaluation/requirements.txt" 2>/dev/null || true
    fi
    
    # Dependencias mínimas
    pip install -q pandas numpy 2>/dev/null || true
    
    echo -e "  ${GREEN}✓${NC} Dependencias Python listas"
    echo ""
}

# Rotar logs si son muy grandes
rotate_logs() {
    local log_file="$LOGS_DIR/agent.log"
    
    if [ -f "$log_file" ]; then
        local size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0)
        
        if [ "$size" -gt "$MAX_LOG_SIZE" ]; then
            mv "$log_file" "$log_file.$(date +%Y%m%d_%H%M%S).bak"
            echo -e "${YELLOW}📁 Log rotado (tamaño: $size bytes)${NC}"
        fi
    fi
}

# Ejecutar agente una vez
run_once() {
    echo -e "${PURPLE}🚀 Iniciando Autonomous Testing Agent...${NC}"
    echo ""
    
    cd "$WORKSPACE"
    python3 automation/autonomous_testing_agent.py
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "\n${GREEN}✅ Agente completado exitosamente${NC}"
    else
        echo -e "\n${YELLOW}⚠️ Agente completado con código de salida: $exit_code${NC}"
    fi
    
    return $exit_code
}

# Ejecutar en modo daemon
run_daemon() {
    echo -e "${PURPLE}🔄 Iniciando en modo daemon...${NC}"
    echo -e "${CYAN}   El agente se ejecutará cada 30 minutos${NC}"
    echo -e "${CYAN}   Presiona Ctrl+C para detener${NC}"
    echo ""
    
    # Guardar PID
    echo $$ > "$PID_FILE"
    
    # Trap para cleanup
    trap cleanup EXIT INT TERM
    
    while true; do
        echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}📅 $(date '+%Y-%m-%d %H:%M:%S') - Iniciando ciclo de testing${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
        
        rotate_logs
        run_once || true
        
        echo -e "\n${CYAN}💤 Próxima ejecución en 30 minutos...${NC}"
        sleep 1800  # 30 minutos
    done
}

# Ejecutar en modo watch
run_watch() {
    echo -e "${PURPLE}👀 Iniciando en modo watch...${NC}"
    echo -e "${CYAN}   El agente se ejecutará cuando detecte cambios${NC}"
    echo -e "${CYAN}   Presiona Ctrl+C para detener${NC}"
    echo ""
    
    # Verificar si inotifywait está disponible
    if command -v inotifywait &> /dev/null; then
        # Linux con inotify
        while true; do
            inotifywait -r -e modify,create,delete \
                --exclude '(node_modules|\.git|automation/logs|automation/reports)' \
                "$WORKSPACE/app" "$WORKSPACE/evaluation" 2>/dev/null
            
            echo -e "\n${YELLOW}🔄 Cambios detectados, ejecutando tests...${NC}\n"
            sleep 2  # Pequeña pausa para que terminen los cambios
            run_once || true
        done
    else
        # Fallback: polling cada 60 segundos
        echo -e "${YELLOW}⚠️ inotifywait no disponible, usando polling${NC}"
        
        local last_hash=""
        
        while true; do
            local current_hash=$(find "$WORKSPACE/app" "$WORKSPACE/evaluation" -name "*.ts" -o -name "*.tsx" -o -name "*.py" 2>/dev/null | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)
            
            if [ "$current_hash" != "$last_hash" ] && [ -n "$last_hash" ]; then
                echo -e "\n${YELLOW}🔄 Cambios detectados, ejecutando tests...${NC}\n"
                run_once || true
            fi
            
            last_hash="$current_hash"
            sleep 60
        done
    fi
}

# Mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado del sistema${NC}"
    echo ""
    
    # Verificar si el daemon está corriendo
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Daemon corriendo (PID: $pid)"
        else
            echo -e "  ${YELLOW}○${NC} Daemon no está corriendo (PID file obsoleto)"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "  ${YELLOW}○${NC} Daemon no está corriendo"
    fi
    
    # Último reporte
    if [ -d "$REPORTS_DIR" ]; then
        local latest_report=$(ls -t "$REPORTS_DIR"/*.json 2>/dev/null | head -1)
        if [ -n "$latest_report" ]; then
            echo -e "  ${GREEN}✓${NC} Último reporte: $(basename "$latest_report")"
            
            # Extraer score del reporte
            local score=$(python3 -c "import json; print(json.load(open('$latest_report')).get('final_score', 'N/A'))" 2>/dev/null || echo "N/A")
            echo -e "  ${GREEN}✓${NC} Score final: $score%"
        fi
    fi
    
    # Logs
    if [ -f "$LOGS_DIR/agent.log" ]; then
        local log_size=$(du -h "$LOGS_DIR/agent.log" | cut -f1)
        echo -e "  ${GREEN}✓${NC} Log size: $log_size"
    fi
    
    echo ""
}

# Detener daemon
stop_daemon() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}🛑 Deteniendo daemon (PID: $pid)...${NC}"
            kill "$pid"
            rm -f "$PID_FILE"
            echo -e "${GREEN}✓ Daemon detenido${NC}"
        else
            echo -e "${YELLOW}⚠️ Daemon no está corriendo${NC}"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}⚠️ No hay daemon corriendo${NC}"
    fi
}

# Cleanup
cleanup() {
    echo -e "\n${YELLOW}🧹 Limpiando...${NC}"
    rm -f "$PID_FILE"
}

# Mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  (sin opción)    Ejecutar agente una vez"
    echo "  --daemon        Ejecutar en modo daemon (cada 30 min)"
    echo "  --watch         Ejecutar cuando detecte cambios"
    echo "  --status        Mostrar estado del sistema"
    echo "  --stop          Detener daemon"
    echo "  --help          Mostrar esta ayuda"
    echo ""
}

# Main
main() {
    print_banner
    setup_directories
    
    case "${1:-}" in
        --daemon)
            check_dependencies
            install_python_deps
            run_daemon
            ;;
        --watch)
            check_dependencies
            install_python_deps
            run_watch
            ;;
        --status)
            show_status
            ;;
        --stop)
            stop_daemon
            ;;
        --help|-h)
            show_help
            ;;
        "")
            check_dependencies
            install_python_deps
            run_once
            ;;
        *)
            echo -e "${RED}Opción desconocida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
