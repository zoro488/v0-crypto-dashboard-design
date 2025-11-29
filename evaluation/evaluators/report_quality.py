"""
Report Quality Evaluator
=========================

Evalúa la calidad de los reportes generados por AIScheduledReports.service.

Tipos de reportes soportados:
- ventas: Reporte de ventas del período
- compras: Reporte de órdenes de compra
- inventario: Reporte de estado de inventario
- financiero: Reporte financiero con flujo de efectivo
- clientes: Reporte de actividad de clientes
- general: Reporte ejecutivo general

Frecuencias de programación:
- daily: Reportes diarios
- weekly: Reportes semanales
- monthly: Reportes mensuales

Formatos de exportación:
- PDF: Documentos formateados
- Excel: Hojas de cálculo
- CSV: Datos tabulares
"""

import json
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta

# Importación condicional para funcionar sin Azure AI Evaluation
try:
    from azure.ai.evaluation import EvaluatorBase
except ImportError:
    class EvaluatorBase:
        """Fallback EvaluatorBase when azure-ai-evaluation is not installed."""
        def __init__(self):
            pass


class ReportQualityEvaluator(EvaluatorBase):
    """
    Evaluador de calidad de reportes para AIScheduledReports.
    
    Métricas principales:
    - data_completeness: Completitud de datos en el reporte
    - format_correctness: Formato correcto según tipo solicitado
    - schedule_accuracy: Precisión de programación
    - content_relevance: Relevancia del contenido para el tipo de reporte
    """
    
    # Secciones requeridas por tipo de reporte
    REPORT_SECTIONS = {
        "ventas": {
            "required": ["resumen", "detalle_ventas", "totales", "periodo"],
            "optional": ["graficos", "comparativo", "top_productos", "top_clientes"],
            "metrics": ["total_ventas", "cantidad_ventas", "ticket_promedio", "crecimiento"]
        },
        "compras": {
            "required": ["resumen", "detalle_ordenes", "totales", "periodo"],
            "optional": ["por_proveedor", "por_categoria", "pendientes"],
            "metrics": ["total_compras", "ordenes_completadas", "ordenes_pendientes", "tiempo_entrega"]
        },
        "inventario": {
            "required": ["resumen", "existencias", "alertas", "periodo"],
            "optional": ["movimientos", "rotacion", "valoracion"],
            "metrics": ["valor_inventario", "productos_stock_bajo", "rotacion_promedio"]
        },
        "financiero": {
            "required": ["resumen", "balance_bancos", "flujo_efectivo", "periodo"],
            "optional": ["proyeccion", "comparativo", "detalle_gastos"],
            "metrics": ["capital_total", "ingresos", "egresos", "utilidad_neta"]
        },
        "clientes": {
            "required": ["resumen", "listado_clientes", "actividad", "periodo"],
            "optional": ["nuevos_clientes", "clientes_inactivos", "valor_por_cliente"],
            "metrics": ["total_clientes", "clientes_nuevos", "tasa_retencion"]
        },
        "general": {
            "required": ["resumen_ejecutivo", "kpis_principales", "periodo"],
            "optional": ["detalle_ventas", "detalle_compras", "alertas"],
            "metrics": ["ventas_totales", "utilidad", "capital", "clientes_activos"]
        }
    }
    
    # Cronpatterns válidos
    CRON_PATTERNS = {
        "daily": r"^0 \d{1,2} \* \* \*$",       # 0 8 * * * (8am diario)
        "weekly": r"^0 \d{1,2} \* \* [0-6]$",   # 0 8 * * 1 (8am lunes)
        "monthly": r"^0 \d{1,2} [1-9]|[12]\d|3[01] \* \*$"  # 0 8 1 * * (8am día 1)
    }
    
    def __init__(
        self,
        strict_sections: bool = True,
        require_period: bool = True
    ):
        """
        Inicializa el evaluador de reportes.
        
        Args:
            strict_sections: Si True, requiere todas las secciones obligatorias
            require_period: Si True, valida que el período sea correcto
        """
        super().__init__()
        self.strict_sections = strict_sections
        self.require_period = require_period
        
    def __call__(
        self,
        *,
        report_type: str,
        report_content: Dict[str, Any],
        schedule_config: Dict[str, Any] = None,
        expected_data: Dict[str, Any] = None,
        output_format: str = "json",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evalúa la calidad de un reporte generado.
        
        Args:
            report_type: Tipo de reporte (ventas, compras, etc.)
            report_content: Contenido del reporte generado
            schedule_config: Configuración de programación
            expected_data: Datos esperados para validación
            output_format: Formato de salida (json, pdf, excel, csv)
            
        Returns:
            Dict con métricas de evaluación
        """
        results = {
            "report_type": report_type,
            "output_format": output_format,
            "overall_quality": 0.0,
            "data_completeness": 0.0,
            "format_correctness": 0.0,
            "content_relevance": 0.0,
            "schedule_accuracy": 0.0,
            "details": {},
            "errors": []
        }
        
        # Validar tipo de reporte
        if report_type not in self.REPORT_SECTIONS:
            results["errors"].append(f"Tipo de reporte desconocido: {report_type}")
            return results
            
        sections_def = self.REPORT_SECTIONS[report_type]
        
        # 1. Evaluar completitud de datos
        completeness_result = self._evaluate_completeness(
            report_content,
            sections_def,
            expected_data
        )
        results["data_completeness"] = completeness_result["score"]
        results["details"]["sections"] = completeness_result["details"]
        
        # 2. Evaluar formato
        format_result = self._evaluate_format(
            report_content,
            output_format,
            report_type
        )
        results["format_correctness"] = format_result["score"]
        results["details"]["format"] = format_result["details"]
        
        # 3. Evaluar relevancia del contenido
        relevance_result = self._evaluate_content_relevance(
            report_content,
            sections_def,
            report_type
        )
        results["content_relevance"] = relevance_result["score"]
        results["details"]["relevance"] = relevance_result["details"]
        
        # 4. Evaluar programación si está configurada
        if schedule_config:
            schedule_result = self._evaluate_schedule(
                schedule_config,
                report_type
            )
            results["schedule_accuracy"] = schedule_result["score"]
            results["details"]["schedule"] = schedule_result["details"]
        else:
            results["schedule_accuracy"] = 1.0  # No aplica
            
        # 5. Validar métricas incluidas
        metrics_result = self._evaluate_metrics(
            report_content,
            sections_def["metrics"],
            expected_data
        )
        results["details"]["metrics_accuracy"] = metrics_result
        
        # 6. Calcular calidad general
        results["overall_quality"] = (
            results["data_completeness"] * 0.30 +
            results["format_correctness"] * 0.20 +
            results["content_relevance"] * 0.25 +
            results["schedule_accuracy"] * 0.10 +
            metrics_result["score"] * 0.15
        )
        
        return results
    
    def _evaluate_completeness(
        self,
        content: Dict[str, Any],
        sections_def: Dict,
        expected_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Evalúa la completitud de secciones del reporte."""
        result = {
            "score": 0.0,
            "details": {
                "required_present": [],
                "required_missing": [],
                "optional_present": [],
                "optional_missing": []
            }
        }
        
        required = sections_def["required"]
        optional = sections_def["optional"]
        
        # Verificar secciones requeridas
        for section in required:
            if self._section_exists(content, section):
                result["details"]["required_present"].append(section)
            else:
                result["details"]["required_missing"].append(section)
                
        # Verificar secciones opcionales
        for section in optional:
            if self._section_exists(content, section):
                result["details"]["optional_present"].append(section)
            else:
                result["details"]["optional_missing"].append(section)
                
        # Calcular score
        required_score = len(result["details"]["required_present"]) / len(required) if required else 1.0
        optional_bonus = len(result["details"]["optional_present"]) / len(optional) * 0.2 if optional else 0
        
        result["score"] = min(1.0, required_score + optional_bonus)
        
        # Penalizar si faltan secciones requeridas en modo estricto
        if self.strict_sections and result["details"]["required_missing"]:
            result["score"] *= 0.7
            
        return result
    
    def _section_exists(self, content: Dict, section_name: str) -> bool:
        """Verifica si una sección existe en el contenido."""
        # Buscar en nivel superior
        if section_name in content:
            return content[section_name] is not None
            
        # Buscar con variantes de nombre (snake_case, camelCase)
        variants = [
            section_name,
            section_name.replace("_", ""),
            "".join(w.capitalize() for w in section_name.split("_")),
            section_name.lower(),
            section_name.upper()
        ]
        
        for variant in variants:
            if variant in content:
                return content[variant] is not None
                
        # Buscar en secciones anidadas
        for key, value in content.items():
            if isinstance(value, dict) and section_name in value:
                return value[section_name] is not None
                
        return False
    
    def _evaluate_format(
        self,
        content: Dict[str, Any],
        output_format: str,
        report_type: str
    ) -> Dict[str, Any]:
        """Evalúa el formato del reporte."""
        result = {
            "score": 1.0,
            "details": {
                "format_valid": True,
                "structure_valid": True,
                "encoding_valid": True
            }
        }
        
        # Verificar estructura básica
        if not isinstance(content, dict):
            result["score"] = 0.0
            result["details"]["structure_valid"] = False
            return result
            
        # Verificar elementos según formato
        if output_format == "json":
            # Para JSON, verificar que sea serializable
            try:
                json.dumps(content)
                result["details"]["format_valid"] = True
            except (TypeError, ValueError):
                result["details"]["format_valid"] = False
                result["score"] *= 0.5
                
        elif output_format == "pdf":
            # Para PDF, verificar campos necesarios para generación
            pdf_fields = ["titulo", "contenido", "fecha_generacion"]
            has_pdf_fields = sum(1 for f in pdf_fields if f in content or f.replace("_", "") in str(content))
            result["score"] = has_pdf_fields / len(pdf_fields)
            
        elif output_format in ["excel", "csv"]:
            # Para Excel/CSV, verificar que haya datos tabulares
            has_tabular = any(
                isinstance(v, list) and len(v) > 0 
                for v in content.values()
            )
            result["details"]["has_tabular_data"] = has_tabular
            if not has_tabular:
                result["score"] *= 0.7
                
        # Verificar período
        if self.require_period:
            has_period = any(
                k in str(content).lower() 
                for k in ["periodo", "period", "fecha", "date", "desde", "hasta"]
            )
            if not has_period:
                result["score"] *= 0.9
                result["details"]["period_missing"] = True
                
        return result
    
    def _evaluate_content_relevance(
        self,
        content: Dict[str, Any],
        sections_def: Dict,
        report_type: str
    ) -> Dict[str, Any]:
        """Evalúa la relevancia del contenido para el tipo de reporte."""
        result = {
            "score": 0.0,
            "details": {
                "relevant_keywords": [],
                "irrelevant_content": []
            }
        }
        
        # Palabras clave por tipo de reporte
        keywords_by_type = {
            "ventas": ["venta", "cliente", "producto", "monto", "cantidad", "factura", "total"],
            "compras": ["compra", "orden", "proveedor", "distribuidor", "costo", "entrega"],
            "inventario": ["stock", "existencia", "producto", "almacen", "rotacion", "alerta"],
            "financiero": ["capital", "banco", "ingreso", "egreso", "utilidad", "balance"],
            "clientes": ["cliente", "contacto", "compra", "frecuencia", "valor", "retencion"],
            "general": ["resumen", "kpi", "indicador", "meta", "objetivo", "periodo"]
        }
        
        relevant_keywords = keywords_by_type.get(report_type, [])
        content_str = json.dumps(content, default=str).lower()
        
        # Contar keywords presentes
        found_keywords = [kw for kw in relevant_keywords if kw in content_str]
        result["details"]["relevant_keywords"] = found_keywords
        
        keyword_coverage = len(found_keywords) / len(relevant_keywords) if relevant_keywords else 1.0
        
        # Verificar que no haya contenido irrelevante dominante
        all_other_keywords = []
        for other_type, kws in keywords_by_type.items():
            if other_type != report_type:
                all_other_keywords.extend(kws)
                
        other_count = sum(1 for kw in all_other_keywords if kw in content_str)
        relevant_count = len(found_keywords)
        
        if other_count > relevant_count * 2:
            result["details"]["irrelevant_content"].append("Contenido de otros tipos de reporte predominante")
            keyword_coverage *= 0.8
            
        result["score"] = keyword_coverage
        
        return result
    
    def _evaluate_schedule(
        self,
        schedule_config: Dict[str, Any],
        report_type: str
    ) -> Dict[str, Any]:
        """Evalúa la configuración de programación."""
        result = {
            "score": 1.0,
            "details": {
                "frequency_valid": False,
                "time_valid": False,
                "recipients_valid": False
            }
        }
        
        # Verificar frecuencia
        frequency = schedule_config.get("frequency", schedule_config.get("frecuencia", ""))
        if frequency in ["daily", "weekly", "monthly", "diario", "semanal", "mensual"]:
            result["details"]["frequency_valid"] = True
        else:
            result["score"] *= 0.7
            
        # Verificar cron pattern si existe
        cron = schedule_config.get("cron", schedule_config.get("cronPattern", ""))
        if cron:
            import re
            for freq, pattern in self.CRON_PATTERNS.items():
                if re.match(pattern, cron):
                    result["details"]["cron_valid"] = True
                    break
            else:
                result["details"]["cron_valid"] = False
                result["score"] *= 0.9
                
        # Verificar hora de ejecución
        hour = schedule_config.get("hour", schedule_config.get("hora"))
        if hour is not None and 0 <= int(hour) <= 23:
            result["details"]["time_valid"] = True
        else:
            result["score"] *= 0.95
            
        # Verificar destinatarios
        recipients = schedule_config.get("recipients", schedule_config.get("destinatarios", []))
        if recipients and len(recipients) > 0:
            result["details"]["recipients_valid"] = True
        else:
            result["score"] *= 0.9
            
        return result
    
    def _evaluate_metrics(
        self,
        content: Dict[str, Any],
        expected_metrics: List[str],
        expected_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Evalúa las métricas incluidas en el reporte."""
        result = {
            "score": 0.0,
            "metrics_found": [],
            "metrics_missing": [],
            "accuracy": {}
        }
        
        content_str = json.dumps(content, default=str).lower()
        
        for metric in expected_metrics:
            metric_variants = [
                metric.lower(),
                metric.replace("_", "").lower(),
                metric.replace("_", " ").lower()
            ]
            
            found = any(var in content_str for var in metric_variants)
            if found:
                result["metrics_found"].append(metric)
                
                # Si hay datos esperados, verificar valor
                if expected_data and metric in expected_data:
                    # Buscar el valor en el contenido
                    result["accuracy"][metric] = self._find_and_compare_metric(
                        content, metric, expected_data[metric]
                    )
            else:
                result["metrics_missing"].append(metric)
                
        coverage = len(result["metrics_found"]) / len(expected_metrics) if expected_metrics else 1.0
        
        # Calcular precisión promedio
        if result["accuracy"]:
            avg_accuracy = sum(result["accuracy"].values()) / len(result["accuracy"])
            result["score"] = coverage * 0.6 + avg_accuracy * 0.4
        else:
            result["score"] = coverage
            
        return result
    
    def _find_and_compare_metric(
        self,
        content: Dict,
        metric_name: str,
        expected_value: Any
    ) -> float:
        """Busca una métrica y compara con valor esperado."""
        def search_dict(d, key):
            key_lower = key.lower().replace("_", "")
            for k, v in d.items():
                if k.lower().replace("_", "") == key_lower:
                    return v
                if isinstance(v, dict):
                    result = search_dict(v, key)
                    if result is not None:
                        return result
            return None
            
        found_value = search_dict(content, metric_name)
        
        if found_value is None:
            return 0.0
            
        try:
            if isinstance(expected_value, (int, float)):
                found_num = float(str(found_value).replace(",", "").replace("$", ""))
                if expected_value == 0:
                    return 1.0 if found_num == 0 else 0.0
                rel_diff = abs(found_num - expected_value) / abs(expected_value)
                return max(0, 1.0 - rel_diff)
            else:
                return 1.0 if str(found_value) == str(expected_value) else 0.5
        except (ValueError, TypeError):
            return 0.5


def create_report_evaluator(strict_sections: bool = True) -> ReportQualityEvaluator:
    """Factory function para crear evaluador de reportes."""
    return ReportQualityEvaluator(strict_sections=strict_sections)


# Tests de ejemplo
if __name__ == "__main__":
    evaluator = ReportQualityEvaluator()
    
    # Test 1: Reporte de ventas completo
    print("=" * 60)
    print("Test 1: Reporte de Ventas")
    print("=" * 60)
    
    result = evaluator(
        report_type="ventas",
        report_content={
            "resumen": {
                "titulo": "Reporte de Ventas - Enero 2025",
                "total_ventas": 250000,
                "cantidad_ventas": 45,
                "crecimiento": 15.5
            },
            "detalle_ventas": [
                {"id": "V001", "cliente": "Cliente A", "monto": 50000},
                {"id": "V002", "cliente": "Cliente B", "monto": 35000}
            ],
            "totales": {
                "monto_total": 250000,
                "ticket_promedio": 5555.56
            },
            "periodo": {
                "desde": "2025-01-01",
                "hasta": "2025-01-31"
            },
            "top_clientes": [
                {"nombre": "Cliente A", "total": 80000}
            ]
        },
        schedule_config={
            "frequency": "monthly",
            "hour": 8,
            "recipients": ["admin@empresa.com"]
        },
        expected_data={
            "total_ventas": 250000,
            "cantidad_ventas": 45
        },
        output_format="json"
    )
    print(json.dumps(result, indent=2))
    
    # Test 2: Reporte financiero
    print("\n" + "=" * 60)
    print("Test 2: Reporte Financiero")
    print("=" * 60)
    
    result = evaluator(
        report_type="financiero",
        report_content={
            "resumen": "Estado financiero del período",
            "balance_bancos": [
                {"banco": "boveda_monte", "capital": 500000},
                {"banco": "utilidades", "capital": 150000}
            ],
            "flujo_efectivo": {
                "ingresos": 300000,
                "egresos": 180000,
                "neto": 120000
            },
            "periodo": "Enero 2025",
            "capital_total": 650000,
            "utilidad_neta": 120000
        }
    )
    print(json.dumps(result, indent=2))
