"""
Form Autofill Evaluator
========================

Evalúa la precisión del servicio AIFormAutomation para auto-completado de formularios.

Tipos de formularios soportados (7):
- venta: Formulario de ventas
- compra: Órdenes de compra
- cliente: Registro de clientes
- producto: Productos/inventario
- gasto: Registro de gastos
- orden_compra: Órdenes de compra completas
- transferencia: Transferencias entre bancos

Métricas evaluadas:
- field_accuracy: Precisión por campo individual
- overall_completion: Porcentaje de campos completados correctamente
- validation_accuracy: Precisión de validaciones
- confidence_calibration: Calibración de confianza
"""

import json
from typing import Any, Dict, List, Optional, Union

# Importación condicional para funcionar sin Azure AI Evaluation
try:
    from azure.ai.evaluation import EvaluatorBase
except ImportError:
    class EvaluatorBase:
        """Fallback EvaluatorBase when azure-ai-evaluation is not installed."""
        def __init__(self):
            pass


class FormAutofillEvaluator(EvaluatorBase):
    """
    Evaluador para el servicio AIFormAutomation.
    
    Evalúa la capacidad del sistema para:
    1. Auto-completar campos basándose en contexto
    2. Validar campos correctamente
    3. Aprender de patrones de uso
    """
    
    # Definición de campos por tipo de formulario
    FORM_SCHEMAS = {
        "venta": {
            "required": ["clienteId", "productos", "precioUnitario", "cantidad", "precioTotal"],
            "optional": ["descuento", "notas", "fechaEntrega", "metodoPago"],
            "calculated": ["precioTotal", "montoIVA"],
            "validations": {
                "cantidad": {"type": "number", "min": 1},
                "precioUnitario": {"type": "number", "min": 0},
                "descuento": {"type": "number", "min": 0, "max": 100}
            }
        },
        "compra": {
            "required": ["distribuidorId", "productos", "cantidad", "precioUnitario"],
            "optional": ["fechaEntrega", "notas", "urgente"],
            "calculated": ["precioTotal"],
            "validations": {
                "cantidad": {"type": "number", "min": 1},
                "precioUnitario": {"type": "number", "min": 0}
            }
        },
        "cliente": {
            "required": ["nombre", "telefono"],
            "optional": ["email", "direccion", "rfc", "notas", "limiteCredito"],
            "calculated": [],
            "validations": {
                "telefono": {"type": "phone", "pattern": r"^\d{10}$"},
                "email": {"type": "email"},
                "rfc": {"type": "rfc", "pattern": r"^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$"}
            }
        },
        "producto": {
            "required": ["nombre", "sku", "precioCompra", "precioVenta"],
            "optional": ["descripcion", "categoria", "stockMinimo", "proveedor"],
            "calculated": ["margen"],
            "validations": {
                "precioCompra": {"type": "number", "min": 0},
                "precioVenta": {"type": "number", "min": 0},
                "stockMinimo": {"type": "number", "min": 0}
            }
        },
        "gasto": {
            "required": ["concepto", "monto", "bancoOrigen"],
            "optional": ["categoria", "comprobante", "notas", "recurrente"],
            "calculated": [],
            "validations": {
                "monto": {"type": "number", "min": 0},
                "bancoOrigen": {"type": "enum", "values": [
                    "boveda_monte", "boveda_usa", "profit", "leftie", 
                    "azteca", "flete_sur", "utilidades"
                ]}
            }
        },
        "orden_compra": {
            "required": ["distribuidorId", "productos", "fechaRequerida"],
            "optional": ["urgente", "notas", "metodoPago"],
            "calculated": ["total", "cantidadTotal"],
            "validations": {
                "fechaRequerida": {"type": "date", "min": "today"}
            }
        },
        "transferencia": {
            "required": ["bancoOrigen", "bancoDestino", "monto", "concepto"],
            "optional": ["notas", "referencia"],
            "calculated": [],
            "validations": {
                "monto": {"type": "number", "min": 0.01},
                "bancoOrigen": {"type": "enum", "values": [
                    "boveda_monte", "boveda_usa", "profit", "leftie",
                    "azteca", "flete_sur", "utilidades"
                ]},
                "bancoDestino": {"type": "enum", "values": [
                    "boveda_monte", "boveda_usa", "profit", "leftie",
                    "azteca", "flete_sur", "utilidades"
                ]}
            }
        }
    }
    
    def __init__(
        self,
        strict_validation: bool = True,
        confidence_threshold: float = 0.7
    ):
        """
        Inicializa el evaluador de formularios.
        
        Args:
            strict_validation: Si True, valida estrictamente tipos y formatos
            confidence_threshold: Umbral de confianza para sugerencias
        """
        super().__init__()
        self.strict_validation = strict_validation
        self.confidence_threshold = confidence_threshold
        
    def __call__(
        self,
        *,
        form_type: str,
        context: Dict[str, Any],
        suggestions: Dict[str, Any],
        ground_truth: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evalúa las sugerencias de auto-completado.
        
        Args:
            form_type: Tipo de formulario (venta, compra, etc.)
            context: Contexto para generar sugerencias (cliente previo, historial, etc.)
            suggestions: Sugerencias generadas por el sistema
            ground_truth: Valores correctos esperados (opcional)
            
        Returns:
            Dict con métricas de evaluación
        """
        results = {
            "form_type": form_type,
            "overall_accuracy": 0.0,
            "field_accuracy": {},
            "completion_rate": 0.0,
            "validation_accuracy": 0.0,
            "confidence_calibration": 0.0,
            "details": {},
            "errors": []
        }
        
        # Validar tipo de formulario
        if form_type not in self.FORM_SCHEMAS:
            results["errors"].append(f"Tipo de formulario desconocido: {form_type}")
            return results
            
        schema = self.FORM_SCHEMAS[form_type]
        
        # 1. Evaluar campos sugeridos
        all_fields = schema["required"] + schema["optional"]
        suggested_fields = suggestions.get("fields", suggestions)
        
        if isinstance(suggested_fields, dict):
            # Normalizar estructura
            fields_data = suggested_fields
        else:
            fields_data = {}
            
        # 2. Evaluar precisión por campo
        if ground_truth:
            for field in all_fields:
                if field in ground_truth:
                    suggested_value = fields_data.get(field)
                    expected_value = ground_truth.get(field)
                    
                    accuracy = self._compare_field_values(
                        suggested_value, 
                        expected_value,
                        schema["validations"].get(field, {})
                    )
                    results["field_accuracy"][field] = accuracy
                    
        # 3. Calcular tasa de completado
        required_count = len(schema["required"])
        completed_required = sum(
            1 for f in schema["required"] 
            if f in fields_data and fields_data[f] is not None
        )
        results["completion_rate"] = completed_required / required_count if required_count > 0 else 1.0
        results["details"]["required_fields"] = schema["required"]
        results["details"]["completed_required"] = completed_required
        
        # 4. Evaluar validaciones
        validation_results = self._evaluate_validations(
            fields_data, 
            schema["validations"]
        )
        results["validation_accuracy"] = validation_results["accuracy"]
        results["details"]["validation_errors"] = validation_results["errors"]
        
        # 5. Evaluar calibración de confianza
        if "confidence" in suggestions or "confidenceScores" in suggestions:
            confidence_data = suggestions.get("confidenceScores", suggestions.get("confidence", {}))
            results["confidence_calibration"] = self._evaluate_confidence(
                confidence_data,
                results["field_accuracy"]
            )
            
        # 6. Evaluar campos calculados
        if schema["calculated"]:
            calc_accuracy = self._evaluate_calculated_fields(
                fields_data,
                schema["calculated"],
                ground_truth
            )
            results["details"]["calculated_accuracy"] = calc_accuracy
            
        # 7. Calcular score general
        field_scores = list(results["field_accuracy"].values())
        avg_field_accuracy = sum(field_scores) / len(field_scores) if field_scores else 0.0
        
        results["overall_accuracy"] = (
            avg_field_accuracy * 0.40 +
            results["completion_rate"] * 0.25 +
            results["validation_accuracy"] * 0.25 +
            results["confidence_calibration"] * 0.10
        )
        
        return results
    
    def _compare_field_values(
        self,
        suggested: Any,
        expected: Any,
        validation: Dict[str, Any]
    ) -> float:
        """Compara valores de campo."""
        if suggested is None:
            return 0.0
            
        if expected is None:
            return 0.5  # No podemos evaluar sin ground truth
            
        # Comparación exacta
        if suggested == expected:
            return 1.0
            
        # Comparación numérica con tolerancia
        if validation.get("type") == "number":
            try:
                s_val = float(suggested)
                e_val = float(expected)
                if abs(s_val - e_val) < 0.01 * abs(e_val):
                    return 1.0
                elif abs(s_val - e_val) < 0.05 * abs(e_val):
                    return 0.8
                elif abs(s_val - e_val) < 0.10 * abs(e_val):
                    return 0.5
            except (ValueError, TypeError):
                pass
                
        # Comparación de strings (case-insensitive)
        if isinstance(suggested, str) and isinstance(expected, str):
            if suggested.lower() == expected.lower():
                return 0.95
            if suggested.lower() in expected.lower() or expected.lower() in suggested.lower():
                return 0.7
                
        # Comparación de listas
        if isinstance(suggested, list) and isinstance(expected, list):
            if set(suggested) == set(expected):
                return 0.9
            intersection = set(suggested) & set(expected)
            union = set(suggested) | set(expected)
            return len(intersection) / len(union) if union else 0.0
            
        return 0.0
    
    def _evaluate_validations(
        self,
        fields: Dict[str, Any],
        validations: Dict[str, Dict]
    ) -> Dict[str, Any]:
        """Evalúa si los valores pasan las validaciones."""
        results = {
            "accuracy": 1.0,
            "errors": []
        }
        
        total_checks = 0
        passed_checks = 0
        
        for field, rules in validations.items():
            if field not in fields or fields[field] is None:
                continue
                
            value = fields[field]
            total_checks += 1
            
            # Validar tipo
            field_type = rules.get("type")
            
            if field_type == "number":
                try:
                    num_val = float(value)
                    if "min" in rules and num_val < rules["min"]:
                        results["errors"].append(f"{field}: valor {num_val} menor que mínimo {rules['min']}")
                        continue
                    if "max" in rules and num_val > rules["max"]:
                        results["errors"].append(f"{field}: valor {num_val} mayor que máximo {rules['max']}")
                        continue
                    passed_checks += 1
                except (ValueError, TypeError):
                    results["errors"].append(f"{field}: valor no es numérico")
                    
            elif field_type == "enum":
                if value not in rules.get("values", []):
                    results["errors"].append(
                        f"{field}: valor '{value}' no está en opciones válidas"
                    )
                else:
                    passed_checks += 1
                    
            elif field_type == "email":
                import re
                if re.match(r"[^@]+@[^@]+\.[^@]+", str(value)):
                    passed_checks += 1
                else:
                    results["errors"].append(f"{field}: formato de email inválido")
                    
            elif field_type == "phone":
                import re
                pattern = rules.get("pattern", r"^\d{10}$")
                if re.match(pattern, str(value)):
                    passed_checks += 1
                else:
                    results["errors"].append(f"{field}: formato de teléfono inválido")
                    
            else:
                passed_checks += 1  # Sin validación específica
                
        results["accuracy"] = passed_checks / total_checks if total_checks > 0 else 1.0
        return results
    
    def _evaluate_confidence(
        self,
        confidence_data: Union[Dict, float],
        actual_accuracy: Dict[str, float]
    ) -> float:
        """
        Evalúa la calibración de confianza.
        
        Buena calibración significa que:
        - Alta confianza → valores correctos
        - Baja confianza → valores posiblemente incorrectos
        """
        if isinstance(confidence_data, (int, float)):
            # Confianza global
            avg_accuracy = sum(actual_accuracy.values()) / len(actual_accuracy) if actual_accuracy else 0.5
            diff = abs(confidence_data - avg_accuracy)
            return max(0, 1.0 - diff)
            
        if isinstance(confidence_data, dict):
            calibration_scores = []
            for field, confidence in confidence_data.items():
                if field in actual_accuracy:
                    accuracy = actual_accuracy[field]
                    diff = abs(confidence - accuracy)
                    calibration_scores.append(max(0, 1.0 - diff))
            return sum(calibration_scores) / len(calibration_scores) if calibration_scores else 0.5
            
        return 0.5
    
    def _evaluate_calculated_fields(
        self,
        fields: Dict[str, Any],
        calculated: List[str],
        ground_truth: Optional[Dict] = None
    ) -> float:
        """Evalúa campos calculados."""
        if not calculated:
            return 1.0
            
        correct = 0
        total = 0
        
        for field in calculated:
            if field in fields:
                total += 1
                if ground_truth and field in ground_truth:
                    if fields[field] == ground_truth[field]:
                        correct += 1
                    else:
                        # Tolerancia numérica
                        try:
                            if abs(float(fields[field]) - float(ground_truth[field])) < 0.01:
                                correct += 1
                        except (ValueError, TypeError):
                            pass
                else:
                    # Sin ground truth, verificar que existe
                    correct += 0.5
                    
        return correct / total if total > 0 else 1.0


def create_form_autofill_evaluator(
    strict_validation: bool = True
) -> FormAutofillEvaluator:
    """Factory function para crear evaluador de formularios."""
    return FormAutofillEvaluator(strict_validation=strict_validation)


# Tests de ejemplo
if __name__ == "__main__":
    evaluator = FormAutofillEvaluator()
    
    # Test 1: Formulario de venta
    print("=" * 60)
    print("Test 1: Formulario de Venta")
    print("=" * 60)
    
    result = evaluator(
        form_type="venta",
        context={
            "clienteId": "CLI001",
            "historialCompras": ["producto_a", "producto_b"]
        },
        suggestions={
            "fields": {
                "clienteId": "CLI001",
                "productos": ["producto_a"],
                "precioUnitario": 10000,
                "cantidad": 5,
                "precioTotal": 50000,
                "metodoPago": "contado"
            },
            "confidenceScores": {
                "clienteId": 0.95,
                "productos": 0.85,
                "precioUnitario": 0.90,
                "cantidad": 0.80
            }
        },
        ground_truth={
            "clienteId": "CLI001",
            "productos": ["producto_a"],
            "precioUnitario": 10000,
            "cantidad": 5,
            "precioTotal": 50000
        }
    )
    print(json.dumps(result, indent=2))
    
    # Test 2: Formulario de transferencia
    print("\n" + "=" * 60)
    print("Test 2: Formulario de Transferencia")
    print("=" * 60)
    
    result = evaluator(
        form_type="transferencia",
        context={"ultimaTransferencia": {"origen": "boveda_monte", "destino": "utilidades"}},
        suggestions={
            "fields": {
                "bancoOrigen": "boveda_monte",
                "bancoDestino": "utilidades",
                "monto": 50000,
                "concepto": "Traslado de utilidades"
            }
        },
        ground_truth={
            "bancoOrigen": "boveda_monte",
            "bancoDestino": "utilidades",
            "monto": 50000,
            "concepto": "Traslado de utilidades"
        }
    )
    print(json.dumps(result, indent=2))
