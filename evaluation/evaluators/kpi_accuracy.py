"""
KPI Accuracy Evaluator
=======================

Evalúa la precisión de los KPIs generados por AIPowerBI.service.

Tipos de Dashboard:
- ventas: Métricas de ventas (revenue, growth, conversion)
- compras: Métricas de compras (cost, frequency, suppliers)
- inventario: Métricas de inventario (stock, rotation, alerts)
- financiero: Métricas financieras (profit, margins, cash flow)
- clientes: Métricas de clientes (retention, value, acquisition)
- general: Dashboard general con KPIs principales

KPIs por tipo:
- Ventas: totalVentas, ventasDelMes, crecimientoMensual, ticketPromedio
- Compras: totalCompras, costosDelMes, ahorroNegociado
- Inventario: valorInventario, rotacionInventario, productosAlertaBaja
- Financiero: capitalTotal, utilidadNeta, margenOperativo
- Clientes: totalClientes, clientesNuevosMes, clientesRecurrentes
"""

import json
import decimal
from typing import Any, Dict, List, Optional, Union
from decimal import Decimal

# Importación condicional para funcionar sin Azure AI Evaluation
try:
    from azure.ai.evaluation import EvaluatorBase
except ImportError:
    class EvaluatorBase:
        """Fallback EvaluatorBase when azure-ai-evaluation is not installed."""
        def __init__(self):
            pass


class KPIAccuracyEvaluator(EvaluatorBase):
    """
    Evaluador de precisión de KPIs para AIPowerBI.
    
    Métricas principales:
    - kpi_calculation_accuracy: Precisión en cálculos de KPIs
    - trend_detection_accuracy: Precisión en detección de tendencias
    - insight_relevance: Relevancia de insights generados
    - visualization_appropriateness: Apropiabilidad de visualizaciones sugeridas
    """
    
    # Definición de KPIs por tipo de dashboard
    KPI_DEFINITIONS = {
        "ventas": {
            "totalVentas": {"formula": "SUM(ventas.precioTotal)", "type": "currency"},
            "ventasDelMes": {"formula": "SUM(ventas.precioTotal WHERE mes=current)", "type": "currency"},
            "crecimientoMensual": {"formula": "(mes_actual - mes_anterior) / mes_anterior * 100", "type": "percentage"},
            "ticketPromedio": {"formula": "AVG(ventas.precioTotal)", "type": "currency"},
            "unidadesVendidas": {"formula": "SUM(ventas.cantidad)", "type": "number"},
            "ventasPorCliente": {"formula": "totalVentas / totalClientes", "type": "currency"}
        },
        "compras": {
            "totalCompras": {"formula": "SUM(ordenes_compra.total)", "type": "currency"},
            "costosDelMes": {"formula": "SUM(ordenes_compra.total WHERE mes=current)", "type": "currency"},
            "ahorroNegociado": {"formula": "SUM(precioLista - precioCompra)", "type": "currency"},
            "ordenesActivas": {"formula": "COUNT(ordenes_compra WHERE estado='pendiente')", "type": "number"},
            "tiempoPromedioEntrega": {"formula": "AVG(fechaEntrega - fechaOrden)", "type": "days"}
        },
        "inventario": {
            "valorInventario": {"formula": "SUM(productos.stock * productos.precioCompra)", "type": "currency"},
            "rotacionInventario": {"formula": "costo_ventas / inventario_promedio", "type": "number"},
            "productosAlertaBaja": {"formula": "COUNT(productos WHERE stock < stockMinimo)", "type": "number"},
            "diasInventario": {"formula": "inventario_promedio / ventas_diarias", "type": "days"},
            "skusTotales": {"formula": "COUNT(productos)", "type": "number"}
        },
        "financiero": {
            "capitalTotal": {"formula": "SUM(bancos.capitalActual)", "type": "currency"},
            "utilidadNeta": {"formula": "ingresos - costos - gastos", "type": "currency"},
            "margenOperativo": {"formula": "(utilidadOperativa / ingresos) * 100", "type": "percentage"},
            "flujoEfectivo": {"formula": "ingresos_efectivo - egresos_efectivo", "type": "currency"},
            "rotacionCuentas": {"formula": "ventas_credito / cuentas_por_cobrar", "type": "number"}
        },
        "clientes": {
            "totalClientes": {"formula": "COUNT(clientes)", "type": "number"},
            "clientesNuevosMes": {"formula": "COUNT(clientes WHERE mes_registro=current)", "type": "number"},
            "clientesRecurrentes": {"formula": "COUNT(clientes WHERE compras > 1)", "type": "number"},
            "valorPromedioCliente": {"formula": "totalVentas / totalClientes", "type": "currency"},
            "tasaRetencion": {"formula": "(clientes_activos / clientes_totales) * 100", "type": "percentage"}
        },
        "general": {
            "capitalTotal": {"formula": "SUM(bancos.capitalActual)", "type": "currency"},
            "ventasDelMes": {"formula": "SUM(ventas WHERE mes=current)", "type": "currency"},
            "utilidadDelMes": {"formula": "ventasDelMes - costosDelMes", "type": "currency"},
            "clientesActivos": {"formula": "COUNT(clientes WHERE ultimaCompra > 30dias)", "type": "number"}
        }
    }
    
    # Tipos de visualización válidos
    VALID_VISUALIZATIONS = [
        "line_chart", "bar_chart", "pie_chart", "area_chart",
        "kpi_card", "gauge", "table", "heatmap", "scatter_plot",
        "donut_chart", "waterfall", "treemap", "funnel"
    ]
    
    def __init__(
        self,
        tolerance: float = 0.02,
        trend_sensitivity: float = 0.05
    ):
        """
        Inicializa el evaluador de KPIs.
        
        Args:
            tolerance: Tolerancia para comparación de valores numéricos
            trend_sensitivity: Sensibilidad para detección de tendencias
        """
        super().__init__()
        self.tolerance = tolerance
        self.trend_sensitivity = trend_sensitivity
        
    def __call__(
        self,
        *,
        dashboard_type: str,
        raw_data: Dict[str, Any],
        generated_kpis: Dict[str, Any],
        ground_truth_kpis: Dict[str, Any] = None,
        visualizations: List[Dict] = None,
        insights: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evalúa los KPIs generados.
        
        Args:
            dashboard_type: Tipo de dashboard (ventas, compras, etc.)
            raw_data: Datos crudos usados para calcular KPIs
            generated_kpis: KPIs generados por el sistema
            ground_truth_kpis: KPIs correctos esperados (opcional)
            visualizations: Visualizaciones sugeridas
            insights: Insights generados
            
        Returns:
            Dict con métricas de evaluación
        """
        results = {
            "dashboard_type": dashboard_type,
            "overall_accuracy": 0.0,
            "kpi_accuracy": {},
            "trend_accuracy": 0.0,
            "insight_relevance": 0.0,
            "visualization_score": 0.0,
            "details": {},
            "errors": []
        }
        
        # Validar tipo de dashboard
        if dashboard_type not in self.KPI_DEFINITIONS:
            results["errors"].append(f"Tipo de dashboard desconocido: {dashboard_type}")
            return results
            
        kpi_defs = self.KPI_DEFINITIONS[dashboard_type]
        
        # 1. Evaluar precisión de KPIs
        kpi_scores = []
        for kpi_name, kpi_def in kpi_defs.items():
            if kpi_name in generated_kpis:
                generated_value = generated_kpis[kpi_name]
                
                # Si hay ground truth, comparar
                if ground_truth_kpis and kpi_name in ground_truth_kpis:
                    expected_value = ground_truth_kpis[kpi_name]
                    accuracy = self._compare_kpi_values(
                        generated_value, 
                        expected_value, 
                        kpi_def["type"]
                    )
                    results["kpi_accuracy"][kpi_name] = {
                        "accuracy": accuracy,
                        "generated": generated_value,
                        "expected": expected_value
                    }
                else:
                    # Sin ground truth, validar formato y rango
                    validity = self._validate_kpi_format(generated_value, kpi_def["type"])
                    results["kpi_accuracy"][kpi_name] = {
                        "accuracy": validity,
                        "generated": generated_value,
                        "validation_only": True
                    }
                    accuracy = validity
                    
                kpi_scores.append(accuracy)
            else:
                results["kpi_accuracy"][kpi_name] = {
                    "accuracy": 0.0,
                    "error": "KPI no generado"
                }
                kpi_scores.append(0.0)
                
        # 2. Evaluar detección de tendencias
        if "trends" in generated_kpis or any("trend" in str(k).lower() for k in generated_kpis.keys()):
            results["trend_accuracy"] = self._evaluate_trends(
                generated_kpis,
                raw_data,
                ground_truth_kpis
            )
        else:
            results["trend_accuracy"] = 0.5  # Neutral si no hay tendencias
            
        # 3. Evaluar visualizaciones
        if visualizations:
            results["visualization_score"] = self._evaluate_visualizations(
                visualizations,
                dashboard_type,
                list(generated_kpis.keys())
            )
            results["details"]["visualizations"] = [v.get("type") for v in visualizations]
            
        # 4. Evaluar insights
        if insights:
            results["insight_relevance"] = self._evaluate_insights(
                insights,
                dashboard_type,
                generated_kpis
            )
            results["details"]["insights_count"] = len(insights)
            
        # 5. Calcular score general
        avg_kpi_accuracy = sum(kpi_scores) / len(kpi_scores) if kpi_scores else 0.0
        
        results["overall_accuracy"] = (
            avg_kpi_accuracy * 0.50 +
            results["trend_accuracy"] * 0.20 +
            results["visualization_score"] * 0.15 +
            results["insight_relevance"] * 0.15
        )
        
        # 6. Métricas adicionales
        results["details"]["kpis_generated"] = len(generated_kpis)
        results["details"]["kpis_expected"] = len(kpi_defs)
        results["details"]["coverage"] = len(generated_kpis) / len(kpi_defs) if kpi_defs else 0
        
        return results
    
    def _compare_kpi_values(
        self,
        generated: Any,
        expected: Any,
        kpi_type: str
    ) -> float:
        """Compara valores de KPI según su tipo."""
        try:
            if kpi_type == "currency":
                gen_val = Decimal(str(generated).replace(",", "").replace("$", ""))
                exp_val = Decimal(str(expected).replace(",", "").replace("$", ""))
                
            elif kpi_type == "percentage":
                gen_val = Decimal(str(generated).replace("%", ""))
                exp_val = Decimal(str(expected).replace("%", ""))
                
            elif kpi_type in ["number", "days"]:
                gen_val = Decimal(str(generated))
                exp_val = Decimal(str(expected))
                
            else:
                # Comparación directa
                return 1.0 if generated == expected else 0.0
                
            # Calcular diferencia relativa
            if exp_val == 0:
                return 1.0 if gen_val == 0 else 0.0
                
            rel_diff = abs(float((gen_val - exp_val) / exp_val))
            
            if rel_diff <= self.tolerance:
                return 1.0
            elif rel_diff <= self.tolerance * 2:
                return 0.9
            elif rel_diff <= self.tolerance * 5:
                return 0.7
            elif rel_diff <= self.tolerance * 10:
                return 0.5
            else:
                return max(0, 1.0 - rel_diff)
                
        except (ValueError, TypeError, decimal.InvalidOperation) as e:
            return 0.0
    
    def _validate_kpi_format(self, value: Any, kpi_type: str) -> float:
        """Valida formato de KPI cuando no hay ground truth."""
        try:
            if kpi_type == "currency":
                val = float(str(value).replace(",", "").replace("$", ""))
                return 1.0 if val >= 0 else 0.5
                
            elif kpi_type == "percentage":
                val = float(str(value).replace("%", ""))
                # Porcentajes típicamente entre -100 y 1000
                return 1.0 if -100 <= val <= 1000 else 0.5
                
            elif kpi_type == "number":
                val = float(value)
                return 1.0 if val >= 0 else 0.5
                
            elif kpi_type == "days":
                val = float(value)
                return 1.0 if val >= 0 else 0.5
                
            return 0.5
            
        except (ValueError, TypeError):
            return 0.0
    
    def _evaluate_trends(
        self,
        generated_kpis: Dict[str, Any],
        raw_data: Dict[str, Any],
        ground_truth: Optional[Dict] = None
    ) -> float:
        """Evalúa la precisión de detección de tendencias."""
        trend_keys = [k for k in generated_kpis if "trend" in k.lower() or "growth" in k.lower()]
        
        if not trend_keys:
            return 0.5
            
        correct_trends = 0
        total_trends = len(trend_keys)
        
        for key in trend_keys:
            trend_value = generated_kpis[key]
            
            # Determinar dirección de tendencia
            if isinstance(trend_value, (int, float)):
                detected_direction = "up" if trend_value > 0 else "down" if trend_value < 0 else "stable"
            elif isinstance(trend_value, str):
                trend_lower = trend_value.lower()
                if any(w in trend_lower for w in ["up", "increase", "growth", "subió", "aumentó"]):
                    detected_direction = "up"
                elif any(w in trend_lower for w in ["down", "decrease", "decline", "bajó", "disminuyó"]):
                    detected_direction = "down"
                else:
                    detected_direction = "stable"
            else:
                continue
                
            # Verificar contra ground truth o datos
            if ground_truth and key in ground_truth:
                expected_direction = ground_truth[key]
                if detected_direction == expected_direction:
                    correct_trends += 1
            else:
                # Sin ground truth, dar crédito parcial
                correct_trends += 0.5
                
        return correct_trends / total_trends if total_trends > 0 else 0.5
    
    def _evaluate_visualizations(
        self,
        visualizations: List[Dict],
        dashboard_type: str,
        kpi_names: List[str]
    ) -> float:
        """Evalúa apropiabilidad de visualizaciones."""
        if not visualizations:
            return 0.0
            
        scores = []
        
        for viz in visualizations:
            viz_type = viz.get("type", "").lower()
            viz_kpi = viz.get("kpi", viz.get("metric", ""))
            
            # Verificar tipo válido
            type_valid = any(vt in viz_type for vt in self.VALID_VISUALIZATIONS)
            
            # Verificar que el KPI existe
            kpi_valid = viz_kpi in kpi_names if viz_kpi else True
            
            # Evaluar apropiabilidad del tipo de visualización para el KPI
            appropriateness = self._check_viz_appropriateness(viz_type, viz_kpi)
            
            score = (
                (1.0 if type_valid else 0.0) * 0.3 +
                (1.0 if kpi_valid else 0.5) * 0.3 +
                appropriateness * 0.4
            )
            scores.append(score)
            
        return sum(scores) / len(scores) if scores else 0.0
    
    def _check_viz_appropriateness(self, viz_type: str, kpi: str) -> float:
        """Verifica si la visualización es apropiada para el KPI."""
        # Mapeo de KPIs a tipos de visualización recomendados
        recommendations = {
            "trend": ["line_chart", "area_chart"],
            "total": ["kpi_card", "gauge", "bar_chart"],
            "distribution": ["pie_chart", "donut_chart", "treemap"],
            "comparison": ["bar_chart", "waterfall"],
            "time_series": ["line_chart", "area_chart"],
            "percentage": ["gauge", "pie_chart", "donut_chart"],
            "ranking": ["bar_chart", "table"],
        }
        
        kpi_lower = kpi.lower()
        viz_lower = viz_type.lower()
        
        # Determinar categoría del KPI
        for category, rec_types in recommendations.items():
            if category in kpi_lower:
                if any(rt in viz_lower for rt in rec_types):
                    return 1.0
                return 0.5
                
        # Sin categoría específica, dar crédito parcial
        return 0.7
    
    def _evaluate_insights(
        self,
        insights: List[str],
        dashboard_type: str,
        kpis: Dict[str, Any]
    ) -> float:
        """Evalúa la relevancia de los insights generados."""
        if not insights:
            return 0.0
            
        kpi_names = [k.lower() for k in kpis.keys()]
        scores = []
        
        for insight in insights:
            insight_lower = insight.lower()
            
            # Verificar que menciona KPIs relevantes
            mentions_kpi = any(kpi in insight_lower for kpi in kpi_names)
            
            # Verificar que tiene información accionable
            has_action = any(word in insight_lower for word in [
                "aumentar", "reducir", "mejorar", "considerar", "optimizar",
                "increase", "decrease", "improve", "consider", "optimize"
            ])
            
            # Verificar longitud razonable
            reasonable_length = 20 <= len(insight) <= 500
            
            score = (
                (1.0 if mentions_kpi else 0.3) * 0.4 +
                (1.0 if has_action else 0.5) * 0.4 +
                (1.0 if reasonable_length else 0.5) * 0.2
            )
            scores.append(score)
            
        return sum(scores) / len(scores) if scores else 0.0


def create_kpi_evaluator(tolerance: float = 0.02) -> KPIAccuracyEvaluator:
    """Factory function para crear evaluador de KPIs."""
    return KPIAccuracyEvaluator(tolerance=tolerance)


# Import adicional necesario
import decimal

# Tests de ejemplo
if __name__ == "__main__":
    evaluator = KPIAccuracyEvaluator()
    
    # Test 1: Dashboard de ventas
    print("=" * 60)
    print("Test 1: Dashboard de Ventas")
    print("=" * 60)
    
    result = evaluator(
        dashboard_type="ventas",
        raw_data={
            "ventas": [
                {"precioTotal": 10000, "cantidad": 5},
                {"precioTotal": 15000, "cantidad": 3},
                {"precioTotal": 8000, "cantidad": 2}
            ]
        },
        generated_kpis={
            "totalVentas": 33000,
            "ticketPromedio": 11000,
            "unidadesVendidas": 10,
            "crecimientoMensual": 15.5
        },
        ground_truth_kpis={
            "totalVentas": 33000,
            "ticketPromedio": 11000,
            "unidadesVendidas": 10,
            "crecimientoMensual": 15.0
        },
        visualizations=[
            {"type": "line_chart", "kpi": "totalVentas"},
            {"type": "kpi_card", "kpi": "ticketPromedio"}
        ],
        insights=[
            "Las ventas aumentaron 15% respecto al mes anterior. Considerar expandir inventario.",
            "El ticket promedio es estable. Oportunidad de cross-selling."
        ]
    )
    print(json.dumps(result, indent=2, default=str))
    
    # Test 2: Dashboard financiero
    print("\n" + "=" * 60)
    print("Test 2: Dashboard Financiero")
    print("=" * 60)
    
    result = evaluator(
        dashboard_type="financiero",
        raw_data={
            "bancos": [
                {"nombre": "boveda_monte", "capitalActual": 500000},
                {"nombre": "utilidades", "capitalActual": 150000}
            ]
        },
        generated_kpis={
            "capitalTotal": 650000,
            "utilidadNeta": 120000,
            "margenOperativo": 18.5
        },
        ground_truth_kpis={
            "capitalTotal": 650000,
            "utilidadNeta": 118000,
            "margenOperativo": 18.2
        }
    )
    print(json.dumps(result, indent=2, default=str))
