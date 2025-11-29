#!/usr/bin/env python3
"""
CHRONOS Evaluation Test Script
===============================

Script de prueba para verificar que los evaluadores funcionan correctamente
sin dependencias externas de Azure.

Uso:
    python test_evaluators.py
"""

import sys
import json
from pathlib import Path

# Agregar el directorio padre al path
sys.path.insert(0, str(Path(__file__).parent))

def test_intent_detection():
    """Prueba el evaluador de detección de intención."""
    print("\n" + "="*50)
    print("🧪 Test: Intent Detection Evaluator")
    print("="*50)
    
    from evaluators.intent_detection import IntentDetectionEvaluator
    
    evaluator = IntentDetectionEvaluator()
    
    # Test 1: Intent correcto
    result = evaluator(
        query="Muéstrame las ventas del mes pasado",
        response={
            "intent": "query_data",
            "confidence": 0.92,
            "entities": {"collection": "ventas"}
        },
        ground_truth={
            "intent": "query_data",
            "entities": {"collection": "ventas"}
        }
    )
    
    print(f"\n  Test 1 - Query Data:")
    print(f"    Intent Accuracy: {result['intent_accuracy']:.2%}")
    print(f"    Overall Score: {result['overall_score']:.2%}")
    
    assert result['intent_accuracy'] == 1.0, "Intent accuracy should be 1.0"
    print("    ✅ PASSED")
    
    # Test 2: Intent incorrecto
    result = evaluator(
        query="Crea una nueva venta",
        response={
            "intent": "query_data",  # Incorrecto
            "confidence": 0.5
        },
        ground_truth={
            "intent": "create_record"
        }
    )
    
    print(f"\n  Test 2 - Wrong Intent:")
    print(f"    Intent Accuracy: {result['intent_accuracy']:.2%}")
    print(f"    Overall Score: {result['overall_score']:.2%}")
    
    assert result['intent_accuracy'] == 0.0, "Intent accuracy should be 0.0 for wrong intent"
    print("    ✅ PASSED")
    
    return True


def test_business_logic():
    """Prueba el evaluador de lógica de negocio."""
    print("\n" + "="*50)
    print("🧪 Test: Business Logic Evaluator")
    print("="*50)
    
    from evaluators.business_logic import BusinessLogicEvaluator
    
    evaluator = BusinessLogicEvaluator()
    
    # Test 1: Distribución de venta correcta
    result = evaluator(
        operation_type="sale_distribution",
        input_data={
            "precioVentaUnidad": 10000,
            "precioCompraUnidad": 6300,
            "precioFlete": 500,
            "cantidad": 10
        },
        output_data={
            "boveda_monte": 63000,  # 6300 * 10
            "flete_sur": 5000,       # 500 * 10
            "utilidades": 32000      # (10000-6300-500) * 10
        }
    )
    
    print(f"\n  Test 1 - Sale Distribution:")
    print(f"    Boveda Monte: {result['distribution_accuracy']['boveda_monte']:.2%}")
    print(f"    Flete Sur: {result['distribution_accuracy']['flete_sur']:.2%}")
    print(f"    Utilidades: {result['distribution_accuracy']['utilidades']:.2%}")
    print(f"    Overall: {result['overall_accuracy']:.2%}")
    
    assert result['overall_accuracy'] >= 0.99, "Distribution should be 100% accurate"
    print("    ✅ PASSED")
    
    # Test 2: Cálculo de capital
    result = evaluator(
        operation_type="capital_calculation",
        input_data={
            "historicoIngresos": 1500000,
            "historicoGastos": 350000
        },
        output_data={
            "capitalActual": 1150000  # 1500000 - 350000
        }
    )
    
    print(f"\n  Test 2 - Capital Calculation:")
    print(f"    Capital Accuracy: {result['capital_accuracy']:.2%}")
    
    assert result['capital_accuracy'] == 1.0, "Capital calculation should be exact"
    print("    ✅ PASSED")
    
    # Test 3: Distribución incorrecta
    result = evaluator(
        operation_type="sale_distribution",
        input_data={
            "precioVentaUnidad": 10000,
            "precioCompraUnidad": 6300,
            "precioFlete": 500,
            "cantidad": 10
        },
        output_data={
            "boveda_monte": 60000,   # Incorrecto (debería ser 63000)
            "flete_sur": 5000,
            "utilidades": 35000      # Incorrecto (debería ser 32000)
        }
    )
    
    print(f"\n  Test 3 - Wrong Distribution:")
    print(f"    Overall Accuracy: {result['overall_accuracy']:.2%}")
    print(f"    Errors: {len(result['errors'])}")
    
    assert result['overall_accuracy'] < 0.9, "Wrong distribution should have lower accuracy"
    assert len(result['errors']) > 0, "Should have errors"
    print("    ✅ PASSED")
    
    return True


def test_form_autofill():
    """Prueba el evaluador de auto-completado de formularios."""
    print("\n" + "="*50)
    print("🧪 Test: Form Autofill Evaluator")
    print("="*50)
    
    from evaluators.form_autofill import FormAutofillEvaluator
    
    evaluator = FormAutofillEvaluator()
    
    # Test 1: Formulario de venta
    result = evaluator(
        form_type="venta",
        context={"clienteId": "CLI001"},
        suggestions={
            "fields": {
                "clienteId": "CLI001",
                "productos": ["Laptop"],
                "precioUnitario": 10000,
                "cantidad": 5,
                "precioTotal": 50000
            }
        },
        ground_truth={
            "clienteId": "CLI001",
            "productos": ["Laptop"],
            "precioUnitario": 10000,
            "cantidad": 5,
            "precioTotal": 50000
        }
    )
    
    print(f"\n  Test 1 - Venta Form:")
    print(f"    Completion Rate: {result['completion_rate']:.2%}")
    print(f"    Validation Accuracy: {result['validation_accuracy']:.2%}")
    print(f"    Overall Accuracy: {result['overall_accuracy']:.2%}")
    
    assert result['completion_rate'] == 1.0, "All required fields should be completed"
    print("    ✅ PASSED")
    
    # Test 2: Formulario de transferencia con validación
    result = evaluator(
        form_type="transferencia",
        context={},
        suggestions={
            "fields": {
                "bancoOrigen": "boveda_monte",
                "bancoDestino": "utilidades",
                "monto": 50000,
                "concepto": "Traslado"
            }
        },
        ground_truth={
            "bancoOrigen": "boveda_monte",
            "bancoDestino": "utilidades",
            "monto": 50000,
            "concepto": "Traslado"
        }
    )
    
    print(f"\n  Test 2 - Transferencia Form:")
    print(f"    Validation Accuracy: {result['validation_accuracy']:.2%}")
    
    assert result['validation_accuracy'] == 1.0, "Valid banco values should pass validation"
    print("    ✅ PASSED")
    
    return True


def test_kpi_accuracy():
    """Prueba el evaluador de KPIs."""
    print("\n" + "="*50)
    print("🧪 Test: KPI Accuracy Evaluator")
    print("="*50)
    
    from evaluators.kpi_accuracy import KPIAccuracyEvaluator
    
    evaluator = KPIAccuracyEvaluator()
    
    # Test 1: Dashboard de ventas
    result = evaluator(
        dashboard_type="ventas",
        raw_data={"ventas": [{"precioTotal": 100000}]},
        generated_kpis={
            "totalVentas": 100000,
            "ticketPromedio": 100000,
            "crecimientoMensual": 15.0
        },
        ground_truth_kpis={
            "totalVentas": 100000,
            "ticketPromedio": 100000,
            "crecimientoMensual": 15.0
        },
        visualizations=[
            {"type": "line_chart", "kpi": "totalVentas"}
        ],
        insights=["Las ventas aumentaron 15%"]
    )
    
    print(f"\n  Test 1 - Sales Dashboard:")
    print(f"    KPI Accuracy: {list(result['kpi_accuracy'].values())}")
    print(f"    Visualization Score: {result['visualization_score']:.2%}")
    print(f"    Overall Accuracy: {result['overall_accuracy']:.2%}")
    
    assert result['overall_accuracy'] > 0.5, "Should have good accuracy"
    print("    ✅ PASSED")
    
    return True


def test_report_quality():
    """Prueba el evaluador de calidad de reportes."""
    print("\n" + "="*50)
    print("🧪 Test: Report Quality Evaluator")
    print("="*50)
    
    from evaluators.report_quality import ReportQualityEvaluator
    
    evaluator = ReportQualityEvaluator()
    
    # Test 1: Reporte de ventas completo
    result = evaluator(
        report_type="ventas",
        report_content={
            "resumen": {"titulo": "Reporte de Ventas"},
            "detalle_ventas": [{"id": "V001", "monto": 50000}],
            "totales": {"monto_total": 50000},
            "periodo": {"mes": "Enero", "año": 2025},
            "total_ventas": 50000,
            "cantidad_ventas": 1
        },
        schedule_config={
            "frequency": "monthly",
            "hour": 8,
            "recipients": ["admin@test.com"]
        },
        output_format="json"
    )
    
    print(f"\n  Test 1 - Complete Sales Report:")
    print(f"    Data Completeness: {result['data_completeness']:.2%}")
    print(f"    Format Correctness: {result['format_correctness']:.2%}")
    print(f"    Overall Quality: {result['overall_quality']:.2%}")
    
    assert result['data_completeness'] > 0.8, "Complete report should have high completeness"
    print("    ✅ PASSED")
    
    return True


def test_user_learning():
    """Prueba el evaluador de aprendizaje de usuario."""
    print("\n" + "="*50)
    print("🧪 Test: User Learning Evaluator")
    print("="*50)
    
    from evaluators.user_learning import UserLearningEvaluator
    
    evaluator = UserLearningEvaluator(min_data_points=3)
    
    # Test 1: Patrones de usuario
    result = evaluator(
        user_activity=[
            {"timestamp": "2025-01-15T09:00:00Z", "action": "login", "panel": "dashboard"},
            {"timestamp": "2025-01-15T09:05:00Z", "action": "view", "panel": "ventas"},
            {"timestamp": "2025-01-15T09:15:00Z", "action": "create", "panel": "ventas"},
            {"timestamp": "2025-01-16T09:00:00Z", "action": "login", "panel": "dashboard"},
            {"timestamp": "2025-01-16T09:10:00Z", "action": "view", "panel": "ventas"}
        ],
        detected_patterns={
            "time_pattern": {"preferred_hours": [9]},
            "navigation_pattern": {"most_visited": "ventas"},
            "action_pattern": {"most_common": "view"}
        },
        predictions={"next_actions": ["view", "create"]},
        engagement_score=0.7,
        insights=["Usuario activo en horario matutino"]
    )
    
    print(f"\n  Test 1 - User Patterns:")
    print(f"    Pattern Detection: {result['pattern_detection_accuracy']:.2%}")
    print(f"    Engagement Accuracy: {result['engagement_accuracy']:.2%}")
    print(f"    Overall Effectiveness: {result['overall_effectiveness']:.2%}")
    
    assert result['overall_effectiveness'] > 0.3, "Should detect some patterns"
    print("    ✅ PASSED")
    
    return True


def run_all_tests():
    """Ejecuta todas las pruebas."""
    print("\n" + "="*60)
    print("🚀 CHRONOS EVALUATION FRAMEWORK - TEST SUITE")
    print("="*60)
    
    tests = [
        ("Intent Detection", test_intent_detection),
        ("Business Logic", test_business_logic),
        ("Form Autofill", test_form_autofill),
        ("KPI Accuracy", test_kpi_accuracy),
        ("Report Quality", test_report_quality),
        ("User Learning", test_user_learning)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, "✅ PASSED" if success else "❌ FAILED"))
        except Exception as e:
            results.append((name, f"❌ ERROR: {str(e)[:50]}"))
            print(f"\n  ❌ ERROR: {e}")
    
    # Resumen
    print("\n" + "="*60)
    print("📋 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, r in results if "PASSED" in r)
    total = len(results)
    
    for name, result in results:
        print(f"  {name:25} {result}")
    
    print("\n" + "-"*60)
    print(f"  Total: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print("="*60)
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
