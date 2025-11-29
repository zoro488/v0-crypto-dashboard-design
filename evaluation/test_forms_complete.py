#!/usr/bin/env python3
"""
Test Form Complete Evaluator
============================

Script de pruebas exhaustivas para el evaluador completo de formularios.
Verifica 100% de cobertura en:
- Todos los tipos de formularios (12 tipos)
- Validaciones Zod
- Lógica de negocio (distribución de ventas)
- Estados de UI (wizard)
- Cálculos automáticos
- Sugerencias AI
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass

# Agregar path del proyecto
sys.path.insert(0, str(Path(__file__).parent.parent))

from evaluators.form_complete import FormCompleteEvaluator, FormType


@dataclass
class TestResult:
    """Resultado de un test."""
    test_id: str
    passed: bool
    expected_score: float
    actual_score: float
    metric: str
    details: str


def load_test_dataset(filepath: str) -> List[Dict[str, Any]]:
    """Carga dataset de pruebas JSONL."""
    tests = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                tests.append(json.loads(line))
    return tests


def run_form_tests() -> Dict[str, Any]:
    """Ejecuta todas las pruebas de formularios."""
    print("=" * 70)
    print("🧪 FORM COMPLETE EVALUATOR - TEST SUITE")
    print("=" * 70)
    
    # Inicializar evaluador
    evaluator = FormCompleteEvaluator(
        strict_mode=True,
        validate_business_rules=True,
        validate_ui_states=True
    )
    
    # Cargar dataset
    dataset_path = Path(__file__).parent / "datasets" / "form_complete_tests.jsonl"
    
    if not dataset_path.exists():
        print(f"❌ Dataset no encontrado: {dataset_path}")
        return {"error": "Dataset not found"}
    
    tests = load_test_dataset(str(dataset_path))
    print(f"\n📊 Cargadas {len(tests)} pruebas\n")
    
    # Resultados
    results = {
        "total": len(tests),
        "passed": 0,
        "failed": 0,
        "by_form_type": {},
        "by_metric": {},
        "failures": [],
        "details": []
    }
    
    # Categorías de tests
    categories = {
        "venta": {"passed": 0, "total": 0},
        "cliente": {"passed": 0, "total": 0},
        "gasto": {"passed": 0, "total": 0},
        "transferencia": {"passed": 0, "total": 0},
        "producto": {"passed": 0, "total": 0},
        "orden_compra": {"passed": 0, "total": 0},
        "wizard": {"passed": 0, "total": 0},
        "suggestions": {"passed": 0, "total": 0},
        "calculations": {"passed": 0, "total": 0},
        "validations": {"passed": 0, "total": 0},
        "edge_cases": {"passed": 0, "total": 0},
    }
    
    # Ejecutar tests
    for i, test in enumerate(tests, 1):
        test_id = test.get("test_id", f"TEST-{i}")
        form_type = test.get("form_type")
        description = test.get("description", "Sin descripción")
        form_data = test.get("form_data", {})
        ground_truth = test.get("ground_truth", form_data)
        wizard_state = test.get("wizard_state")
        suggestions = test.get("suggestions")
        expected = test.get("expected", {})
        
        # Categorizar test
        category = form_type
        if "WIZARD" in test_id:
            category = "wizard"
        elif "SUGGEST" in test_id:
            category = "suggestions"
        elif "CALC" in test_id:
            category = "calculations"
        elif "VALID" in test_id:
            category = "validations"
        elif "EDGE" in test_id:
            category = "edge_cases"
        
        if category not in categories:
            categories[category] = {"passed": 0, "total": 0}
        categories[category]["total"] += 1
        
        # Ejecutar evaluación
        try:
            result = evaluator(
                form_type=form_type,
                form_data=form_data,
                ground_truth=ground_truth,
                wizard_state=wizard_state,
                suggestions=suggestions
            )
            
            # Verificar métricas esperadas
            test_passed = True
            fail_reason = []
            
            for metric, expected_value in expected.items():
                if metric == "overall_score":
                    actual_value = result.get("overall_score", 0)
                else:
                    actual_value = result.get("metrics", {}).get(metric, 0)
                
                # Tolerancia del 10% para scores parciales esperados
                if expected_value == 1.0:
                    if actual_value < 0.95:  # 95% para considerar "perfecto"
                        test_passed = False
                        fail_reason.append(f"{metric}: esperado ≥0.95, obtenido {actual_value:.2f}")
                elif expected_value == 0.0:
                    if actual_value > 0.1:  # Debería fallar
                        test_passed = False
                        fail_reason.append(f"{metric}: esperado ≤0.10, obtenido {actual_value:.2f}")
                else:
                    # Tolerancia del 15%
                    if abs(actual_value - expected_value) > 0.15:
                        test_passed = False
                        fail_reason.append(f"{metric}: esperado ~{expected_value:.2f}, obtenido {actual_value:.2f}")
            
            # Registrar resultado
            status = "✅" if test_passed else "❌"
            
            if test_passed:
                results["passed"] += 1
                categories[category]["passed"] += 1
            else:
                results["failed"] += 1
                results["failures"].append({
                    "test_id": test_id,
                    "description": description,
                    "reasons": fail_reason
                })
            
            # Mostrar progreso
            overall = result.get("overall_score", 0)
            print(f"  {status} [{test_id}] {description[:40]}... Score: {overall:.2%}")
            
            results["details"].append({
                "test_id": test_id,
                "passed": test_passed,
                "overall_score": overall,
                "metrics": result.get("metrics", {})
            })
            
        except Exception as e:
            results["failed"] += 1
            print(f"  ❌ [{test_id}] ERROR: {str(e)}")
            results["failures"].append({
                "test_id": test_id,
                "description": description,
                "reasons": [f"Exception: {str(e)}"]
            })
    
    # Resumen
    print("\n" + "=" * 70)
    print("📋 RESUMEN DE RESULTADOS")
    print("=" * 70)
    
    pass_rate = (results["passed"] / results["total"]) * 100 if results["total"] > 0 else 0
    
    print(f"\n  Total Tests: {results['total']}")
    print(f"  ✅ Passed: {results['passed']}")
    print(f"  ❌ Failed: {results['failed']}")
    print(f"  📊 Pass Rate: {pass_rate:.1f}%")
    
    # Por categoría
    print("\n  📂 Por Categoría:")
    for category, stats in sorted(categories.items()):
        if stats["total"] > 0:
            cat_rate = (stats["passed"] / stats["total"]) * 100
            status = "✅" if cat_rate >= 80 else "⚠️" if cat_rate >= 50 else "❌"
            print(f"    {status} {category}: {stats['passed']}/{stats['total']} ({cat_rate:.0f}%)")
    
    # Fallos detallados
    if results["failures"]:
        print("\n  ⚠️ Tests Fallidos:")
        for failure in results["failures"][:5]:  # Solo mostrar primeros 5
            print(f"    • [{failure['test_id']}] {failure['description'][:30]}")
            for reason in failure["reasons"]:
                print(f"      → {reason}")
    
    # Status final
    print("\n" + "=" * 70)
    if pass_rate >= 95:
        print("🎉 RESULTADO: EXCELENTE (≥95%)")
    elif pass_rate >= 80:
        print("✅ RESULTADO: APROBADO (≥80%)")
    elif pass_rate >= 60:
        print("⚠️ RESULTADO: ACEPTABLE (≥60%)")
    else:
        print("❌ RESULTADO: NECESITA MEJORAS (<60%)")
    print("=" * 70)
    
    results["pass_rate"] = pass_rate
    results["by_category"] = categories
    
    return results


def run_unit_tests():
    """Ejecuta tests unitarios específicos."""
    print("\n" + "=" * 70)
    print("🔬 UNIT TESTS - Funciones Específicas")
    print("=" * 70)
    
    evaluator = FormCompleteEvaluator()
    passed = 0
    total = 0
    
    # Test 1: Distribución de ventas (fórmula correcta)
    print("\n1️⃣ Test Distribución de Ventas (3 Bancos)")
    total += 1
    
    venta_data = {
        "cantidad": 10,
        "precioUnitario": 10000,
        "precioCompra": 6300,
        "precioFlete": 500,
        "distribucionBovedaMonte": 63000,  # 6300 × 10
        "distribucionFletes": 5000,         # 500 × 10
        "distribucionUtilidades": 32000,    # (10000-6300-500) × 10
        "precioTotal": 100000
    }
    
    result = evaluator(
        form_type="venta",
        form_data=venta_data,
        ground_truth=venta_data
    )
    
    business_accuracy = result["metrics"]["business_logic_accuracy"]
    if business_accuracy >= 0.95:
        print(f"   ✅ Distribución correcta: {business_accuracy:.2%}")
        passed += 1
    else:
        print(f"   ❌ Distribución incorrecta: {business_accuracy:.2%}")
        for rule in result["details"]["business_rule_results"]:
            status = "✓" if rule["passed"] else "✗"
            print(f"      {status} {rule['rule']}: {rule['details']}")
    
    # Test 2: Validación de email
    print("\n2️⃣ Test Validación Email")
    total += 1
    
    # Email válido
    cliente_valid = {"nombre": "Test User", "email": "test@example.com"}
    result_valid = evaluator(form_type="cliente", form_data=cliente_valid)
    
    # Email inválido
    cliente_invalid = {"nombre": "Test User", "email": "invalid-email"}
    result_invalid = evaluator(form_type="cliente", form_data=cliente_invalid)
    
    if result_valid["metrics"]["validation_accuracy"] >= 0.9 and result_invalid["metrics"]["validation_accuracy"] < 1.0:
        print(f"   ✅ Validación email correcta")
        print(f"      Email válido: {result_valid['metrics']['validation_accuracy']:.2%}")
        print(f"      Email inválido: {result_invalid['metrics']['validation_accuracy']:.2%}")
        passed += 1
    else:
        print(f"   ❌ Validación email incorrecta")
    
    # Test 3: Transferencia origen != destino
    print("\n3️⃣ Test Transferencia Bancos Diferentes")
    total += 1
    
    transfer_valid = {"bancoOrigen": "boveda_monte", "bancoDestino": "utilidades", "monto": 1000}
    transfer_invalid = {"bancoOrigen": "profit", "bancoDestino": "profit", "monto": 1000}
    
    result_valid = evaluator(form_type="transferencia", form_data=transfer_valid)
    result_invalid = evaluator(form_type="transferencia", form_data=transfer_invalid)
    
    if result_valid["metrics"]["business_logic_accuracy"] >= 0.9 and result_invalid["metrics"]["business_logic_accuracy"] < 1.0:
        print(f"   ✅ Validación transferencia correcta")
        print(f"      Bancos diferentes: {result_valid['metrics']['business_logic_accuracy']:.2%}")
        print(f"      Mismo banco: {result_invalid['metrics']['business_logic_accuracy']:.2%}")
        passed += 1
    else:
        print(f"   ❌ Validación transferencia incorrecta")
    
    # Test 4: Cálculo de margen
    print("\n4️⃣ Test Cálculo Margen Producto")
    total += 1
    
    producto_data = {
        "nombre": "Test Product",
        "precioCompra": 1000,
        "precioVenta": 1500,
        "margenGanancia": 50.0  # ((1500-1000)/1000)*100
    }
    
    result = evaluator(form_type="producto", form_data=producto_data)
    calc_accuracy = result["metrics"]["calculation_accuracy"]
    
    if calc_accuracy >= 0.9:
        print(f"   ✅ Cálculo margen correcto: {calc_accuracy:.2%}")
        passed += 1
    else:
        print(f"   ❌ Cálculo margen incorrecto: {calc_accuracy:.2%}")
    
    # Test 5: Campos requeridos
    print("\n5️⃣ Test Campos Requeridos")
    total += 1
    
    # Venta sin cliente (faltante requerido)
    venta_incomplete = {"productos": ["PROD001"], "cantidad": 5}
    result = evaluator(form_type="venta", form_data=venta_incomplete)
    field_accuracy = result["metrics"]["field_accuracy"]
    
    if field_accuracy < 1.0:  # Debería penalizar campo faltante
        print(f"   ✅ Detección campos faltantes: {field_accuracy:.2%}")
        passed += 1
    else:
        print(f"   ❌ No detectó campos faltantes")
    
    # Resumen
    print("\n" + "-" * 40)
    print(f"   Unit Tests: {passed}/{total} ({(passed/total)*100:.0f}%)")
    
    return passed == total


def main():
    """Punto de entrada principal."""
    print("\n" + "🚀" * 35)
    print("   CHRONOS FORM EVALUATION SUITE")
    print("🚀" * 35 + "\n")
    
    # 1. Unit tests
    unit_passed = run_unit_tests()
    
    # 2. Integration tests con dataset
    results = run_form_tests()
    
    # 3. Resultado final
    print("\n" + "=" * 70)
    print("📊 RESULTADO FINAL")
    print("=" * 70)
    
    if unit_passed and results.get("pass_rate", 0) >= 80:
        print("\n  🎉 ¡EVALUACIÓN COMPLETADA EXITOSAMENTE!")
        print(f"  📈 Tasa de éxito: {results.get('pass_rate', 0):.1f}%")
        print(f"  ✅ Unit Tests: PASSED")
        return 0
    else:
        print("\n  ⚠️ Evaluación completada con advertencias")
        print(f"  📈 Tasa de éxito: {results.get('pass_rate', 0):.1f}%")
        print(f"  Unit Tests: {'PASSED' if unit_passed else 'FAILED'}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
