"""
Dataset Generator for CHRONOS AI Evaluation
=============================================

Genera datasets de test a partir de los CSVs originales del sistema.
"""

import csv
import json
import os
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

# Ruta base
BASE_DIR = Path(__file__).parent.parent
CSV_DIR = BASE_DIR.parent / "csv"
DATASETS_DIR = BASE_DIR / "datasets"

# Asegurar que el directorio existe
DATASETS_DIR.mkdir(parents=True, exist_ok=True)


def load_csv(filename: str) -> List[Dict[str, Any]]:
    """Carga un archivo CSV y retorna lista de diccionarios."""
    filepath = CSV_DIR / filename
    if not filepath.exists():
        print(f"⚠️ Archivo no encontrado: {filepath}")
        return []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)


def save_jsonl(data: List[Dict], filename: str):
    """Guarda datos en formato JSONL."""
    filepath = DATASETS_DIR / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    print(f"✅ Guardado: {filepath} ({len(data)} registros)")


def generate_mega_ai_agent_queries():
    """
    Genera queries de test para MegaAIAgent.
    Incluye todas las intenciones detectables.
    """
    queries = []
    
    # Queries de tipo query_data
    query_data_examples = [
        {"query": "Mostrar ventas del día", "expected_intent": "query_data", "expected_entity": "ventas", "expected_timeframe": "hoy"},
        {"query": "Ver ventas de esta semana", "expected_intent": "query_data", "expected_entity": "ventas", "expected_timeframe": "semana"},
        {"query": "¿Cuántos clientes tenemos?", "expected_intent": "query_data", "expected_entity": "clientes", "expected_timeframe": "mes"},
        {"query": "Lista de productos en stock", "expected_intent": "query_data", "expected_entity": "productos", "expected_timeframe": "mes"},
        {"query": "Dame el estado de los bancos", "expected_intent": "query_data", "expected_entity": "bancos", "expected_timeframe": "mes"},
        {"query": "Busca ventas del mes", "expected_intent": "query_data", "expected_entity": "ventas", "expected_timeframe": "mes"},
        {"query": "Consulta los gastos de ayer", "expected_intent": "query_data", "expected_entity": "gastos", "expected_timeframe": "ayer"},
        {"query": "Ver distribuidores activos", "expected_intent": "query_data", "expected_entity": "distribuidores", "expected_timeframe": "mes"},
        {"query": "¿Cuánto hay en bóveda monte?", "expected_intent": "query_data", "expected_entity": "bancos", "expected_timeframe": "mes"},
        {"query": "Mostrar almacén actual", "expected_intent": "query_data", "expected_entity": "almacen", "expected_timeframe": "mes"},
        {"query": "Ver órdenes de compra pendientes", "expected_intent": "query_data", "expected_entity": "compras", "expected_timeframe": "mes"},
        {"query": "Lista clientes con deuda", "expected_intent": "query_data", "expected_entity": "clientes", "expected_timeframe": "mes"},
    ]
    
    # Queries de tipo create_record
    create_record_examples = [
        {"query": "Crear nueva venta", "expected_intent": "create_record", "expected_entity": "ventas", "expected_collection": "ventas"},
        {"query": "Registrar un cliente nuevo", "expected_intent": "create_record", "expected_entity": "clientes", "expected_collection": "clientes"},
        {"query": "Agregar orden de compra", "expected_intent": "create_record", "expected_entity": "compras", "expected_collection": "ordenesCompra"},
        {"query": "Nueva venta para Valle", "expected_intent": "create_record", "expected_entity": "ventas", "expected_collection": "ventas"},
        {"query": "Añadir producto al inventario", "expected_intent": "create_record", "expected_entity": "productos", "expected_collection": "productos"},
        {"query": "Registrar nuevo gasto", "expected_intent": "create_record", "expected_entity": "gastos", "expected_collection": "gastos"},
    ]
    
    # Queries de tipo generate_report
    generate_report_examples = [
        {"query": "Generar reporte de ventas", "expected_intent": "generate_report", "expected_entity": "ventas"},
        {"query": "Informe de clientes del mes", "expected_intent": "generate_report", "expected_entity": "clientes"},
        {"query": "Resumen financiero", "expected_intent": "generate_report", "expected_entity": "financiero"},
        {"query": "Análisis de inventario", "expected_intent": "generate_report", "expected_entity": "inventario"},
        {"query": "Reporte de bancos", "expected_intent": "generate_report", "expected_entity": "bancos"},
    ]
    
    # Queries de tipo navigate
    navigate_examples = [
        {"query": "Ir a dashboard", "expected_intent": "navigate", "expected_destination": "/dashboard"},
        {"query": "Abrir panel de ventas", "expected_intent": "navigate", "expected_destination": "/ventas"},
        {"query": "Panel de clientes", "expected_intent": "navigate", "expected_destination": "/clientes"},
        {"query": "Ir a la sección de bancos", "expected_intent": "navigate", "expected_destination": "/bancos"},
        {"query": "Abrir reportes", "expected_intent": "navigate", "expected_destination": "/reportes"},
    ]
    
    # Queries de tipo analyze
    analyze_examples = [
        {"query": "Analiza las tendencias de ventas", "expected_intent": "analyze", "expected_entity": "ventas"},
        {"query": "Predicción de ventas del próximo mes", "expected_intent": "analyze", "expected_entity": "ventas"},
        {"query": "Proyección de capital", "expected_intent": "analyze", "expected_entity": "bancos"},
        {"query": "Analizar comportamiento de clientes", "expected_intent": "analyze", "expected_entity": "clientes"},
    ]
    
    # Queries de tipo export
    export_examples = [
        {"query": "Exportar ventas a Excel", "expected_intent": "export", "expected_entity": "ventas", "expected_format": "excel"},
        {"query": "Descargar reporte PDF", "expected_intent": "export", "expected_entity": "general", "expected_format": "pdf"},
        {"query": "Exportar clientes", "expected_intent": "export", "expected_entity": "clientes", "expected_format": "excel"},
    ]
    
    # Queries de tipo help
    help_examples = [
        {"query": "Ayuda", "expected_intent": "help"},
        {"query": "¿Qué puedes hacer?", "expected_intent": "help"},
        {"query": "Muéstrame los comandos", "expected_intent": "help"},
        {"query": "Opciones disponibles", "expected_intent": "help"},
    ]
    
    # Queries de tipo conversation
    conversation_examples = [
        {"query": "Hola", "expected_intent": "conversation", "expected_type": "greeting"},
        {"query": "Buenos días", "expected_intent": "conversation", "expected_type": "greeting"},
        {"query": "Gracias", "expected_intent": "conversation", "expected_type": "thanks"},
        {"query": "Adiós", "expected_intent": "conversation", "expected_type": "farewell"},
        {"query": "Perfecto", "expected_intent": "conversation", "expected_type": "thanks"},
    ]
    
    # Combinar todos
    all_examples = (
        query_data_examples + 
        create_record_examples + 
        generate_report_examples +
        navigate_examples +
        analyze_examples +
        export_examples +
        help_examples +
        conversation_examples
    )
    
    # Agregar IDs
    for i, example in enumerate(all_examples):
        example["id"] = f"query_{i+1:04d}"
    
    return all_examples


def generate_business_logic_tests():
    """
    Genera tests para validar la lógica de negocio.
    Fórmulas de distribución de ventas según FORMULAS_CORRECTAS_VENTAS.
    """
    tests = []
    
    # Casos de test basados en el CSV de ventas real
    ventas = load_csv("ventas.csv")
    
    for i, venta in enumerate(ventas[:30]):  # Primeros 30 registros
        try:
            # Extraer datos del CSV
            cantidad = int(venta.get("cantidad", 0))
            precio_venta = float(venta.get("precioVenta", 0))
            boveda_monte = float(venta.get("bovedaMonte", 0))
            flete_utilidad = float(venta.get("fleteUtilidad", 0))
            utilidad = float(venta.get("utilidad", 0))
            
            if cantidad <= 0 or precio_venta <= 0:
                continue
                
            # Calcular precio de compra (bovedaMonte / cantidad)
            precio_compra = boveda_monte / cantidad if cantidad > 0 else 0
            
            # Calcular flete por unidad
            flete_unidad = flete_utilidad / cantidad if cantidad > 0 else 0
            
            tests.append({
                "id": f"biz_logic_{i+1:04d}",
                "test_type": "sale_distribution",
                "input": {
                    "precio_venta_unidad": precio_venta,
                    "precio_compra_unidad": precio_compra,
                    "precio_flete": flete_unidad,
                    "cantidad": cantidad
                },
                "expected_output": {
                    "boveda_monte": boveda_monte,
                    "fletes": flete_utilidad,
                    "utilidades": utilidad
                },
                "cliente": venta.get("cliente", ""),
                "fecha": venta.get("fecha", ""),
                "estatus": venta.get("estatus", "")
            })
        except (ValueError, ZeroDivisionError):
            continue
    
    # Agregar casos de test adicionales para edge cases
    edge_cases = [
        {
            "id": "biz_logic_edge_001",
            "test_type": "sale_distribution",
            "description": "Venta sin flete",
            "input": {
                "precio_venta_unidad": 7000,
                "precio_compra_unidad": 6300,
                "precio_flete": 0,
                "cantidad": 10
            },
            "expected_output": {
                "boveda_monte": 63000,
                "fletes": 0,
                "utilidades": 7000
            }
        },
        {
            "id": "biz_logic_edge_002",
            "test_type": "sale_distribution",
            "description": "Venta con margen cero",
            "input": {
                "precio_venta_unidad": 6300,
                "precio_compra_unidad": 6300,
                "precio_flete": 0,
                "cantidad": 5
            },
            "expected_output": {
                "boveda_monte": 31500,
                "fletes": 0,
                "utilidades": 0
            }
        },
        {
            "id": "biz_logic_edge_003",
            "test_type": "capital_calculation",
            "description": "Cálculo de capital bancario",
            "input": {
                "historico_ingresos": 1000000,
                "historico_gastos": 750000
            },
            "expected_output": {
                "capital_actual": 250000
            }
        },
        {
            "id": "biz_logic_edge_004",
            "test_type": "capital_calculation",
            "description": "Capital negativo (gastos > ingresos)",
            "input": {
                "historico_ingresos": 500000,
                "historico_gastos": 678715
            },
            "expected_output": {
                "capital_actual": -178715
            }
        }
    ]
    
    tests.extend(edge_cases)
    
    return tests


def generate_form_automation_tests():
    """
    Genera tests para AIFormAutomation.
    Valida auto-llenado y validaciones de formularios.
    """
    tests = []
    
    # Tests de validación de campos
    validation_tests = [
        {
            "id": "form_val_001",
            "test_type": "field_validation",
            "form_type": "venta",
            "field": "cantidad",
            "value": 10,
            "expected_valid": True
        },
        {
            "id": "form_val_002",
            "test_type": "field_validation",
            "form_type": "venta",
            "field": "cantidad",
            "value": -5,
            "expected_valid": False,
            "expected_error": "La cantidad debe ser al menos 1"
        },
        {
            "id": "form_val_003",
            "test_type": "field_validation",
            "form_type": "cliente",
            "field": "email",
            "value": "cliente@email.com",
            "expected_valid": True
        },
        {
            "id": "form_val_004",
            "test_type": "field_validation",
            "form_type": "cliente",
            "field": "email",
            "value": "invalid-email",
            "expected_valid": False,
            "expected_error": "Email inválido"
        },
        {
            "id": "form_val_005",
            "test_type": "field_validation",
            "form_type": "cliente",
            "field": "telefono",
            "value": "5551234567",
            "expected_valid": True
        },
        {
            "id": "form_val_006",
            "test_type": "field_validation",
            "form_type": "cliente",
            "field": "telefono",
            "value": "123",
            "expected_valid": False,
            "expected_error": "Teléfono inválido (10 dígitos)"
        },
        {
            "id": "form_val_007",
            "test_type": "field_validation",
            "form_type": "cliente",
            "field": "rfc",
            "value": "XAXX010101000",
            "expected_valid": True
        },
        {
            "id": "form_val_008",
            "test_type": "field_validation",
            "form_type": "venta",
            "field": "descuento",
            "value": 50,
            "expected_valid": True
        },
        {
            "id": "form_val_009",
            "test_type": "field_validation",
            "form_type": "venta",
            "field": "descuento",
            "value": 150,
            "expected_valid": False,
            "expected_error": "El descuento debe estar entre 0 y 100%"
        }
    ]
    
    # Tests de auto-completado
    autofill_tests = [
        {
            "id": "form_auto_001",
            "test_type": "autofill_suggestion",
            "form_type": "venta",
            "user_patterns": {
                "metodoPago": {"mostCommon": "efectivo", "frequency": 15}
            },
            "current_data": {"cliente": "Valle"},
            "expected_suggestions": [
                {"field": "metodoPago", "value": "efectivo", "min_confidence": 0.8}
            ]
        },
        {
            "id": "form_auto_002",
            "test_type": "autofill_suggestion",
            "form_type": "gasto",
            "user_patterns": {
                "banco": {"mostCommon": "boveda_monte", "frequency": 20},
                "categoria": {"mostCommon": "operativo", "frequency": 10}
            },
            "current_data": {},
            "expected_suggestions": [
                {"field": "banco", "value": "boveda_monte", "min_confidence": 0.8},
                {"field": "categoria", "value": "operativo", "min_confidence": 0.5}
            ]
        }
    ]
    
    tests.extend(validation_tests)
    tests.extend(autofill_tests)
    
    return tests


def generate_kpi_tests():
    """
    Genera tests para validar KPIs de AIPowerBI.
    """
    # Cargar datos reales para calcular KPIs esperados
    ventas = load_csv("ventas.csv")
    clientes = load_csv("clientes.csv")
    
    # Calcular KPIs esperados
    total_ventas = 0
    num_ventas = len(ventas)
    
    for v in ventas:
        try:
            total_ventas += float(v.get("ingreso", 0))
        except (ValueError, TypeError):
            pass
    
    ticket_promedio = total_ventas / num_ventas if num_ventas > 0 else 0
    
    total_clientes = len(clientes)
    clientes_activos = sum(1 for c in clientes if c.get("actual", "0") != "0" or c.get("deuda", "0") != "0")
    
    tests = [
        {
            "id": "kpi_001",
            "test_type": "kpi_calculation",
            "kpi_name": "total_ventas",
            "data_source": "ventas",
            "expected_value_range": {
                "min": total_ventas * 0.95,
                "max": total_ventas * 1.05
            },
            "expected_format": "currency"
        },
        {
            "id": "kpi_002",
            "test_type": "kpi_calculation",
            "kpi_name": "num_ventas",
            "data_source": "ventas",
            "expected_value": num_ventas,
            "expected_format": "number"
        },
        {
            "id": "kpi_003",
            "test_type": "kpi_calculation",
            "kpi_name": "ticket_promedio",
            "data_source": "ventas",
            "expected_value_range": {
                "min": ticket_promedio * 0.95,
                "max": ticket_promedio * 1.05
            },
            "expected_format": "currency"
        },
        {
            "id": "kpi_004",
            "test_type": "kpi_calculation",
            "kpi_name": "total_clientes",
            "data_source": "clientes",
            "expected_value": total_clientes,
            "expected_format": "number"
        },
        {
            "id": "kpi_005",
            "test_type": "kpi_trend",
            "kpi_name": "ventas_trend",
            "expected_trend_values": ["up", "down", "neutral"],
            "description": "Tendencia debe ser uno de los valores válidos"
        }
    ]
    
    return tests


def generate_report_tests():
    """
    Genera tests para AIScheduledReports.
    """
    tests = [
        {
            "id": "report_001",
            "test_type": "report_generation",
            "report_type": "ventas",
            "expected_sections": ["summary", "details", "kpis"],
            "expected_kpis": ["total_ventas", "num_ventas", "ticket_promedio"]
        },
        {
            "id": "report_002",
            "test_type": "report_generation",
            "report_type": "inventario",
            "expected_sections": ["summary", "details", "charts"],
            "expected_kpis": ["valor_inventario", "total_productos", "stock_bajo"]
        },
        {
            "id": "report_003",
            "test_type": "report_generation",
            "report_type": "financiero",
            "expected_sections": ["summary", "details", "charts"],
            "expected_kpis": ["capital_total", "bancos_activos"]
        },
        {
            "id": "report_004",
            "test_type": "report_insights",
            "report_type": "general",
            "expected_insight_types": ["positive", "warning", "info", "critical"],
            "min_insights": 1
        },
        {
            "id": "report_005",
            "test_type": "report_scheduling",
            "recurrence": "daily",
            "expected_cron": "0 8 * * *"
        },
        {
            "id": "report_006",
            "test_type": "report_scheduling",
            "recurrence": "weekly",
            "expected_cron": "0 8 * * 1"
        },
        {
            "id": "report_007",
            "test_type": "report_scheduling",
            "recurrence": "monthly",
            "expected_cron": "0 8 1 * *"
        }
    ]
    
    return tests


def generate_user_learning_tests():
    """
    Genera tests para UserLearningService.
    """
    tests = [
        {
            "id": "learn_001",
            "test_type": "pattern_detection",
            "activities": [
                {"action": "view_sales", "context": "ventas", "count": 15},
                {"action": "create_sale", "context": "ventas", "count": 10},
                {"action": "view_clients", "context": "clientes", "count": 5}
            ],
            "expected_top_action": "view_sales",
            "expected_min_frequency": 10
        },
        {
            "id": "learn_002",
            "test_type": "time_pattern",
            "activities_by_hour": {
                "9": 20,
                "10": 25,
                "11": 15,
                "14": 18,
                "15": 12
            },
            "expected_peak_hour": 10
        },
        {
            "id": "learn_003",
            "test_type": "navigation_pattern",
            "navigation_sequence": [
                {"from": "dashboard", "to": "ventas", "count": 12},
                {"from": "ventas", "to": "clientes", "count": 8},
                {"from": "dashboard", "to": "bancos", "count": 5}
            ],
            "expected_top_navigation": {"from": "dashboard", "to": "ventas"}
        },
        {
            "id": "learn_004",
            "test_type": "engagement_score",
            "user_stats": {
                "total_actions": 150,
                "days_active": 20,
                "features_used": 8
            },
            "expected_score_range": {"min": 50, "max": 100}
        },
        {
            "id": "learn_005",
            "test_type": "insight_generation",
            "user_patterns": {
                "top_action": {"action": "view_sales", "frequency": 50},
                "unused_features": ["reportes", "exportar"]
            },
            "expected_insight_types": ["shortcut", "recommendation"]
        }
    ]
    
    return tests


def main():
    """Genera todos los datasets."""
    print("=" * 60)
    print("🔄 Generando datasets para CHRONOS AI Evaluation")
    print("=" * 60)
    
    # 1. MegaAIAgent Queries
    print("\n📝 Generando queries para MegaAIAgent...")
    queries = generate_mega_ai_agent_queries()
    save_jsonl(queries, "mega_ai_agent_queries.jsonl")
    
    # 2. Business Logic Tests
    print("\n📊 Generando tests de lógica de negocio...")
    biz_tests = generate_business_logic_tests()
    save_jsonl(biz_tests, "business_logic_test.jsonl")
    
    # 3. Form Automation Tests
    print("\n📋 Generando tests de formularios...")
    form_tests = generate_form_automation_tests()
    save_jsonl(form_tests, "form_automation_test.jsonl")
    
    # 4. KPI Tests
    print("\n📈 Generando tests de KPIs...")
    kpi_tests = generate_kpi_tests()
    save_jsonl(kpi_tests, "kpi_test.jsonl")
    
    # 5. Report Tests
    print("\n📑 Generando tests de reportes...")
    report_tests = generate_report_tests()
    save_jsonl(report_tests, "report_test.jsonl")
    
    # 6. User Learning Tests
    print("\n🧠 Generando tests de aprendizaje de usuario...")
    learning_tests = generate_user_learning_tests()
    save_jsonl(learning_tests, "user_learning_test.jsonl")
    
    print("\n" + "=" * 60)
    print("✅ Todos los datasets generados exitosamente!")
    print("=" * 60)


if __name__ == "__main__":
    main()
