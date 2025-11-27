#!/bin/bash
# 🔄 Script de Migración usando gcloud CLI
# 
# Este script usa la API REST de Firestore con autenticación de gcloud
# para migrar las colecciones fragmentadas a la estructura consolidada.
#
# USO:
#   ./scripts/migrate-via-rest.sh --analyze     # Solo analizar
#   ./scripts/migrate-via-rest.sh --migrate     # Ejecutar migración
#   ./scripts/migrate-via-rest.sh --report      # Ver estado final

set -e

PROJECT_ID="premium-ecosystem-1760790572"
DATABASE="(default)"
BASE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents"

# Obtener token de acceso
get_token() {
    gcloud auth print-access-token
}

# Función para listar documentos de una colección
list_collection() {
    local collection=$1
    local token=$(get_token)
    curl -s -H "Authorization: Bearer $token" \
        "${BASE_URL}/${collection}?pageSize=500" 2>/dev/null
}

# Función para contar documentos
count_collection() {
    local collection=$1
    local count=$(list_collection "$collection" | grep -c '"name":' || echo "0")
    echo "$count"
}

# Función para crear un documento
create_document() {
    local collection=$1
    local doc_id=$2
    local data=$3
    local token=$(get_token)
    
    curl -s -X POST \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        "${BASE_URL}/${collection}?documentId=${doc_id}" \
        -d "$data"
}

# Análisis completo
analyze() {
    echo "📊 ANÁLISIS DE COLECCIONES FIRESTORE"
    echo "======================================"
    echo ""
    
    echo "🏦 COLECCIONES DE MOVIMIENTOS (a consolidar):"
    for col in boveda_monte_ingresos boveda_usa_ingresos profit_ingresos leftie_ingresos azteca_ingresos flete_sur_ingresos utilidades_ingresos transaccionesBoveda transaccionesBanco transferencias gya; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
    
    echo ""
    echo "📦 COLECCIONES PRINCIPALES:"
    for col in ventas ventas_local clientes distribuidores ordenes_compra ordenesCompra bancos movimientos; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
    
    echo ""
    echo "📁 COLECCIONES DE SISTEMA:"
    for col in configuracion sistema reportes user_profiles logs; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
    
    echo ""
    echo "📁 ALMACÉN:"
    for col in almacen almacen_productos almacen_entradas almacen_salidas productos inventario; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
    
    echo ""
    echo "❓ COLECCIONES A REVISAR:"
    for col in bancosRfActual rf_actual control_maestro data_adicional estadoGlobal capitales stock_actual cortes_caja compras dashboard; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
}

# Migrar movimientos de una colección específica
migrate_movimientos_collection() {
    local source_col=$1
    local banco_id=$2
    
    echo "📁 Migrando $source_col → movimientos (bancoId: $banco_id)"
    
    local token=$(get_token)
    local response=$(list_collection "$source_col")
    
    # Verificar si hay documentos
    local doc_count=$(echo "$response" | grep -c '"name":' || echo "0")
    
    if [ "$doc_count" -eq "0" ]; then
        echo "   ⚪ Vacía - saltando"
        return 0
    fi
    
    echo "   📄 $doc_count documentos encontrados"
    
    # Extraer y transformar documentos
    # Esto es una simplificación - en producción usaríamos jq para parsear JSON
    echo "   ⚠️  Usar el script Node.js para migración real"
    
    return "$doc_count"
}

# Reporte de estado
report() {
    echo "📊 REPORTE DE ESTADO POST-MIGRACIÓN"
    echo "===================================="
    echo ""
    
    echo "✅ COLECCIONES CONSOLIDADAS:"
    for col in movimientos ventas clientes distribuidores ordenes_compra bancos; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
    
    echo ""
    echo "📦 ALMACÉN:"
    for col in almacen_productos almacen_entradas almacen_salidas; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
    
    echo ""
    echo "⚙️ SISTEMA:"
    for col in configuracion sistema reportes logs cortes_bancarios dashboard_paneles user_profiles; do
        count=$(count_collection "$col")
        echo "   $col: $count docs"
    done
}

# Main
case "${1:-}" in
    --analyze|-a)
        analyze
        ;;
    --migrate|-m)
        echo "🔄 INICIANDO MIGRACIÓN"
        echo "======================"
        echo ""
        echo "⚠️  Para migración completa, ejecutar:"
        echo "    npx ts-node scripts/migrate-firestore-consolidation.ts"
        echo ""
        echo "O usar Firebase Console para copiar colecciones manualmente."
        ;;
    --report|-r)
        report
        ;;
    *)
        echo "Uso: $0 [--analyze|--migrate|--report]"
        echo ""
        echo "Opciones:"
        echo "  --analyze, -a   Analizar estado actual de colecciones"
        echo "  --migrate, -m   Mostrar instrucciones de migración"
        echo "  --report, -r    Ver estado de colecciones consolidadas"
        exit 1
        ;;
esac
