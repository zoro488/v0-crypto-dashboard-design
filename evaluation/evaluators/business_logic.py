"""
Business Logic Evaluator
=========================

Evalúa la precisión de la lógica de negocio del sistema CHRONOS.

LÓGICA CRÍTICA - Distribución Automática de Ventas (3 Bancos):
Cuando se registra una venta, el dinero se distribuye automáticamente:

Datos de entrada:
- precioVentaUnidad = 10000  (Precio VENTA al cliente)
- precioCompraUnidad = 6300  (Precio COMPRA/costo distribuidor)
- precioFlete = 500          (Flete por unidad)
- cantidad = 10

DISTRIBUCIÓN CORRECTA:
- montoBovedaMonte = precioCompraUnidad * cantidad     -> 63,000 (COSTO)
- montoFletes = precioFlete * cantidad                  -> 5,000  (FLETE)
- montoUtilidades = (precioVenta - precioCosto - flete) * cantidad -> 32,000 (GANANCIA NETA)

Estados de Pago:
- Completo: 100% distribuido a los 3 bancos
- Parcial: Distribución proporcional (proporcion = montoPagado / precioTotalVenta)
- Pendiente: Solo registro histórico, NO afecta capital actual

Fórmulas de Capital:
- capitalActual = historicoIngresos - historicoGastos (dinámico)
- historicoIngresos y historicoGastos son acumulativos, NUNCA disminuyen
"""

import json
from typing import Any, Dict, List, Optional, Union
from decimal import Decimal, ROUND_HALF_UP

# Importación condicional para funcionar sin Azure AI Evaluation
try:
    from azure.ai.evaluation import EvaluatorBase
except ImportError:
    class EvaluatorBase:
        """Fallback EvaluatorBase when azure-ai-evaluation is not installed."""
        def __init__(self):
            pass


class BusinessLogicEvaluator(EvaluatorBase):
    """
    Evaluador de lógica de negocio para CHRONOS.
    
    Métricas principales:
    - sales_distribution_accuracy: Precisión en distribución de ventas
    - capital_calculation_accuracy: Precisión en cálculo de capital
    - payment_status_accuracy: Manejo correcto de estados de pago
    """
    
    # Bancos/Bóvedas del sistema (7 total)
    BANCOS = [
        "boveda_monte",
        "boveda_usa", 
        "profit",
        "leftie",
        "azteca",
        "flete_sur",
        "utilidades"
    ]
    
    # Tolerancia para comparaciones numéricas (por redondeo)
    TOLERANCE = 0.01
    
    def __init__(self, tolerance: float = 0.01):
        """
        Inicializa el evaluador de lógica de negocio.
        
        Args:
            tolerance: Tolerancia para comparaciones de valores monetarios
        """
        super().__init__()
        self.tolerance = tolerance
        
    def __call__(
        self,
        *,
        operation_type: str,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        expected_output: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evalúa una operación de lógica de negocio.
        
        Args:
            operation_type: Tipo de operación ('sale_distribution', 'capital_calculation', etc.)
            input_data: Datos de entrada de la operación
            output_data: Resultado generado por el sistema
            expected_output: Resultado esperado (opcional)
            
        Returns:
            Dict con métricas de evaluación
        """
        results = {
            "operation_type": operation_type,
            "overall_accuracy": 0.0,
            "details": {},
            "errors": []
        }
        
        if operation_type in ["sale_distribution", "venta", "distribucion_venta"]:
            results = self._evaluate_sale_distribution(input_data, output_data, expected_output)
        elif operation_type in ["capital_calculation", "calculo_capital"]:
            results = self._evaluate_capital_calculation(input_data, output_data, expected_output)
        elif operation_type in ["payment_status", "estado_pago"]:
            results = self._evaluate_payment_status(input_data, output_data, expected_output)
        elif operation_type in ["partial_payment", "pago_parcial"]:
            results = self._evaluate_partial_payment(input_data, output_data, expected_output)
        else:
            results["errors"].append(f"Tipo de operación desconocido: {operation_type}")
            
        return results
    
    def _evaluate_sale_distribution(
        self,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        expected_output: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evalúa la distribución de una venta a los 3 bancos.
        
        Fórmula correcta:
        - boveda_monte = precioCompraUnidad * cantidad
        - flete_sur = precioFlete * cantidad  
        - utilidades = (precioVenta - precioCosto - flete) * cantidad
        """
        results = {
            "operation_type": "sale_distribution",
            "overall_accuracy": 0.0,
            "distribution_accuracy": {},
            "formula_validation": {},
            "details": {},
            "errors": []
        }
        
        # Extraer datos de entrada (soporta múltiples nombres de campos)
        try:
            precio_venta = Decimal(str(input_data.get("precioVentaUnidad", input_data.get("precioVenta", 0))))
            precio_compra = Decimal(str(input_data.get("precioCompraUnidad", input_data.get("precioCompra", 0))))
            precio_flete = Decimal(str(input_data.get("precioFlete", 0)))
            cantidad = Decimal(str(input_data.get("cantidad", 1)))
        except (ValueError, TypeError) as e:
            results["errors"].append(f"Error parseando datos de entrada: {e}")
            return results
            
        # Calcular distribución correcta según fórmulas
        expected_boveda_monte = precio_compra * cantidad
        expected_flete_sur = precio_flete * cantidad
        expected_utilidades = (precio_venta - precio_compra - precio_flete) * cantidad
        
        results["details"]["calculated"] = {
            "boveda_monte": float(expected_boveda_monte),
            "flete_sur": float(expected_flete_sur),
            "utilidades": float(expected_utilidades),
            "total": float(expected_boveda_monte + expected_flete_sur + expected_utilidades)
        }
        
        # Validar que el total sea correcto
        total_venta = precio_venta * cantidad
        results["details"]["expected_total"] = float(total_venta)
        
        # Extraer distribución del output (soporta estructura anidada o plana)
        distribucion = output_data.get("distribucion", output_data)
        output_boveda = Decimal(str(distribucion.get("boveda_monte", distribucion.get("montoBovedaMonte", 0))))
        output_flete = Decimal(str(distribucion.get("flete_sur", distribucion.get("fletes", distribucion.get("montoFletes", 0)))))
        output_utilidades = Decimal(str(distribucion.get("utilidades", distribucion.get("montoUtilidades", 0))))
        
        results["details"]["output"] = {
            "boveda_monte": float(output_boveda),
            "flete_sur": float(output_flete),
            "utilidades": float(output_utilidades)
        }
        
        # Evaluar cada componente
        boveda_accuracy = self._compare_values(output_boveda, expected_boveda_monte)
        flete_accuracy = self._compare_values(output_flete, expected_flete_sur)
        utilidades_accuracy = self._compare_values(output_utilidades, expected_utilidades)
        
        results["distribution_accuracy"] = {
            "boveda_monte": boveda_accuracy,
            "flete_sur": flete_accuracy,
            "utilidades": utilidades_accuracy
        }
        
        # Validar fórmulas
        results["formula_validation"] = {
            "boveda_formula_correct": boveda_accuracy == 1.0,
            "flete_formula_correct": flete_accuracy == 1.0,
            "utilidades_formula_correct": utilidades_accuracy == 1.0,
            "total_matches": self._compare_values(
                output_boveda + output_flete + output_utilidades,
                total_venta
            ) == 1.0
        }
        
        # Calcular score general (ponderado)
        results["overall_accuracy"] = (
            boveda_accuracy * 0.35 +
            flete_accuracy * 0.25 +
            utilidades_accuracy * 0.40  # Utilidades es más crítico
        )
        
        # Agregar errores si hay discrepancias significativas
        if boveda_accuracy < 1.0:
            results["errors"].append(
                f"Discrepancia en boveda_monte: esperado {expected_boveda_monte}, obtenido {output_boveda}"
            )
        if flete_accuracy < 1.0:
            results["errors"].append(
                f"Discrepancia en flete_sur: esperado {expected_flete_sur}, obtenido {output_flete}"
            )
        if utilidades_accuracy < 1.0:
            results["errors"].append(
                f"Discrepancia en utilidades: esperado {expected_utilidades}, obtenido {output_utilidades}"
            )
            
        return results
    
    def _evaluate_capital_calculation(
        self,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        expected_output: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evalúa el cálculo de capital de un banco.
        
        Fórmula: capitalActual = historicoIngresos - historicoGastos
        """
        results = {
            "operation_type": "capital_calculation",
            "overall_accuracy": 0.0,
            "capital_accuracy": 0.0,
            "details": {},
            "errors": []
        }
        
        try:
            historico_ingresos = Decimal(str(input_data.get("historicoIngresos", 0)))
            historico_gastos = Decimal(str(input_data.get("historicoGastos", 0)))
        except (ValueError, TypeError) as e:
            results["errors"].append(f"Error parseando datos: {e}")
            return results
            
        expected_capital = historico_ingresos - historico_gastos
        
        results["details"]["expected_capital"] = float(expected_capital)
        results["details"]["formula_used"] = "historicoIngresos - historicoGastos"
        
        output_capital = Decimal(str(output_data.get("capitalActual", 0)))
        results["details"]["output_capital"] = float(output_capital)
        
        results["capital_accuracy"] = self._compare_values(output_capital, expected_capital)
        results["overall_accuracy"] = results["capital_accuracy"]
        
        # Validar que históricos no disminuyan (si hay datos previos)
        if "previousHistoricoIngresos" in input_data:
            prev_ingresos = Decimal(str(input_data["previousHistoricoIngresos"]))
            if historico_ingresos < prev_ingresos:
                results["errors"].append(
                    f"historicoIngresos disminuyó: {prev_ingresos} -> {historico_ingresos}"
                )
                results["overall_accuracy"] *= 0.5
                
        if "previousHistoricoGastos" in input_data:
            prev_gastos = Decimal(str(input_data["previousHistoricoGastos"]))
            if historico_gastos < prev_gastos:
                results["errors"].append(
                    f"historicoGastos disminuyó: {prev_gastos} -> {historico_gastos}"
                )
                results["overall_accuracy"] *= 0.5
                
        return results
    
    def _evaluate_payment_status(
        self,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        expected_output: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evalúa el manejo correcto de estados de pago.
        
        Estados:
        - Completo: 100% distribuido a los 3 bancos
        - Parcial: Distribución proporcional
        - Pendiente: Solo registro, NO afecta capital
        """
        results = {
            "operation_type": "payment_status",
            "overall_accuracy": 0.0,
            "status_correct": False,
            "distribution_correct": False,
            "details": {},
            "errors": []
        }
        
        monto_total = Decimal(str(input_data.get("montoTotal", 0)))
        monto_pagado = Decimal(str(input_data.get("montoPagado", 0)))
        
        # Determinar estado esperado
        if monto_pagado == monto_total:
            expected_status = "completo"
            expected_affects_capital = True
        elif monto_pagado > 0:
            expected_status = "parcial"
            expected_affects_capital = True
        else:
            expected_status = "pendiente"
            expected_affects_capital = False
            
        results["details"]["expected_status"] = expected_status
        results["details"]["expected_affects_capital"] = expected_affects_capital
        
        output_status = output_data.get("estadoPago", "").lower()
        output_affects_capital = output_data.get("afectaCapital", None)
        
        results["details"]["output_status"] = output_status
        results["details"]["output_affects_capital"] = output_affects_capital
        
        # Evaluar estado
        results["status_correct"] = output_status == expected_status
        
        # Evaluar si afecta capital correctamente
        if output_affects_capital is not None:
            results["distribution_correct"] = output_affects_capital == expected_affects_capital
        else:
            # Inferir de la distribución
            has_distribution = any([
                output_data.get("boveda_monte", 0) > 0,
                output_data.get("flete_sur", 0) > 0,
                output_data.get("utilidades", 0) > 0
            ])
            results["distribution_correct"] = has_distribution == expected_affects_capital
            
        results["overall_accuracy"] = (
            (1.0 if results["status_correct"] else 0.0) * 0.5 +
            (1.0 if results["distribution_correct"] else 0.0) * 0.5
        )
        
        if not results["status_correct"]:
            results["errors"].append(
                f"Estado incorrecto: esperado '{expected_status}', obtenido '{output_status}'"
            )
        if not results["distribution_correct"]:
            results["errors"].append(
                f"Manejo de capital incorrecto para estado '{expected_status}'"
            )
            
        return results
    
    def _evaluate_partial_payment(
        self,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        expected_output: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evalúa la distribución proporcional en pagos parciales.
        
        Fórmula: proporcion = montoPagado / precioTotalVenta
        Cada banco recibe: montoBase * proporcion
        """
        results = {
            "operation_type": "partial_payment",
            "overall_accuracy": 0.0,
            "proportion_correct": False,
            "distribution_accuracy": {},
            "details": {},
            "errors": []
        }
        
        try:
            monto_total = Decimal(str(input_data.get("montoTotal", 0)))
            monto_pagado = Decimal(str(input_data.get("montoPagado", 0)))
            precio_compra = Decimal(str(input_data.get("precioCompraUnidad", 0)))
            precio_flete = Decimal(str(input_data.get("precioFlete", 0)))
            cantidad = Decimal(str(input_data.get("cantidad", 0)))
        except (ValueError, TypeError) as e:
            results["errors"].append(f"Error parseando datos: {e}")
            return results
            
        if monto_total == 0:
            results["errors"].append("Monto total es 0, no se puede calcular proporción")
            return results
            
        proporcion = monto_pagado / monto_total
        results["details"]["proporcion"] = float(proporcion)
        
        # Calcular distribución base (100%)
        base_boveda = precio_compra * cantidad
        base_flete = precio_flete * cantidad
        base_utilidades = monto_total - base_boveda - base_flete
        
        # Calcular distribución proporcional
        expected_boveda = base_boveda * proporcion
        expected_flete = base_flete * proporcion
        expected_utilidades = base_utilidades * proporcion
        
        results["details"]["expected_distribution"] = {
            "boveda_monte": float(expected_boveda.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            "flete_sur": float(expected_flete.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            "utilidades": float(expected_utilidades.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        }
        
        # Obtener distribución del output
        output_boveda = Decimal(str(output_data.get("boveda_monte", 0)))
        output_flete = Decimal(str(output_data.get("flete_sur", 0)))
        output_utilidades = Decimal(str(output_data.get("utilidades", 0)))
        
        results["details"]["output_distribution"] = {
            "boveda_monte": float(output_boveda),
            "flete_sur": float(output_flete),
            "utilidades": float(output_utilidades)
        }
        
        # Evaluar cada componente
        boveda_acc = self._compare_values(output_boveda, expected_boveda)
        flete_acc = self._compare_values(output_flete, expected_flete)
        util_acc = self._compare_values(output_utilidades, expected_utilidades)
        
        results["distribution_accuracy"] = {
            "boveda_monte": boveda_acc,
            "flete_sur": flete_acc,
            "utilidades": util_acc
        }
        
        # Verificar que la proporción se calculó correctamente
        output_total = output_boveda + output_flete + output_utilidades
        expected_total = monto_pagado
        results["proportion_correct"] = self._compare_values(output_total, expected_total) == 1.0
        
        results["overall_accuracy"] = (
            boveda_acc * 0.30 +
            flete_acc * 0.20 +
            util_acc * 0.30 +
            (1.0 if results["proportion_correct"] else 0.0) * 0.20
        )
        
        return results
    
    def _compare_values(self, actual: Decimal, expected: Decimal) -> float:
        """Compara dos valores con tolerancia."""
        if expected == 0:
            return 1.0 if actual == 0 else 0.0
            
        diff = abs(actual - expected)
        relative_diff = float(diff / abs(expected))
        
        if relative_diff <= self.tolerance:
            return 1.0
        elif relative_diff <= self.tolerance * 5:
            return 0.8
        elif relative_diff <= self.tolerance * 10:
            return 0.5
        else:
            return 0.0


def create_business_logic_evaluator(tolerance: float = 0.01) -> BusinessLogicEvaluator:
    """Factory function para crear evaluador de lógica de negocio."""
    return BusinessLogicEvaluator(tolerance=tolerance)


# Tests de ejemplo
if __name__ == "__main__":
    evaluator = BusinessLogicEvaluator()
    
    # Test 1: Distribución de venta correcta
    print("=" * 60)
    print("Test 1: Distribución de Venta")
    print("=" * 60)
    
    result = evaluator(
        operation_type="sale_distribution",
        input_data={
            "precioVentaUnidad": 10000,
            "precioCompraUnidad": 6300,
            "precioFlete": 500,
            "cantidad": 10
        },
        output_data={
            "boveda_monte": 63000,  # Correcto: 6300 * 10
            "flete_sur": 5000,       # Correcto: 500 * 10
            "utilidades": 32000      # Correcto: (10000-6300-500) * 10
        }
    )
    print(json.dumps(result, indent=2))
    
    # Test 2: Cálculo de capital
    print("\n" + "=" * 60)
    print("Test 2: Cálculo de Capital")
    print("=" * 60)
    
    result = evaluator(
        operation_type="capital_calculation",
        input_data={
            "historicoIngresos": 1500000,
            "historicoGastos": 350000
        },
        output_data={
            "capitalActual": 1150000  # Correcto: 1500000 - 350000
        }
    )
    print(json.dumps(result, indent=2))
    
    # Test 3: Pago parcial
    print("\n" + "=" * 60)
    print("Test 3: Pago Parcial (50%)")
    print("=" * 60)
    
    result = evaluator(
        operation_type="partial_payment",
        input_data={
            "montoTotal": 100000,
            "montoPagado": 50000,  # 50%
            "precioCompraUnidad": 6300,
            "precioFlete": 500,
            "cantidad": 10
        },
        output_data={
            "boveda_monte": 31500,   # 63000 * 0.5
            "flete_sur": 2500,        # 5000 * 0.5
            "utilidades": 16000       # 32000 * 0.5
        }
    )
    print(json.dumps(result, indent=2))
