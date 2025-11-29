"""
CHRONOS AI Evaluation Runner
=============================

Script principal para ejecutar evaluaciones del sistema CHRONOS.
Utiliza Azure AI Evaluation SDK con evaluadores personalizados y built-in.

Uso:
    python run_evaluation.py --service all
    python run_evaluation.py --service mega_ai_agent --output results/
    python run_evaluation.py --dataset custom_dataset.jsonl

Servicios evaluables:
    - mega_ai_agent: MegaAIAgent conversacional
    - form_automation: AIFormAutomation auto-completado
    - power_bi: AIPowerBI dashboards y KPIs
    - scheduled_reports: AIScheduledReports reportes
    - user_learning: UserLearning patrones de usuario
    - all: Todos los servicios
"""

import os
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Azure AI Evaluation imports (opcional)
try:
    from azure.ai.evaluation import evaluate
    from azure.ai.evaluation import (
        CoherenceEvaluator,
        RelevanceEvaluator,
        FluencyEvaluator,
        GroundednessEvaluator
    )
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False
    print("⚠️ Azure AI Evaluation no disponible - usando evaluadores locales")

# Custom evaluators
from evaluators import (
    IntentDetectionEvaluator,
    BusinessLogicEvaluator,
    FormAutofillEvaluator,
    KPIAccuracyEvaluator,
    ReportQualityEvaluator,
    UserLearningEvaluator
)

# Configuration
from config import EvaluationConfig


class CHRONOSEvaluator:
    """
    Clase principal para evaluar servicios de IA de CHRONOS.
    """
    
    def __init__(
        self,
        config: EvaluationConfig = None,
        output_dir: str = "results"
    ):
        """
        Inicializa el evaluador CHRONOS.
        
        Args:
            config: Configuración de evaluación
            output_dir: Directorio para resultados
        """
        self.config = config or EvaluationConfig()
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Inicializar evaluadores
        self._init_evaluators()
        
    def _init_evaluators(self):
        """Inicializa todos los evaluadores."""
        # Custom evaluators
        self.intent_evaluator = IntentDetectionEvaluator()
        self.business_logic_evaluator = BusinessLogicEvaluator(tolerance=0.01)
        self.form_evaluator = FormAutofillEvaluator()
        self.kpi_evaluator = KPIAccuracyEvaluator()
        self.report_evaluator = ReportQualityEvaluator()
        self.user_learning_evaluator = UserLearningEvaluator(min_data_points=5)
        
        # Built-in evaluators (requieren Azure OpenAI)
        model_config = self.config.get_model_config()
        if model_config and AZURE_AVAILABLE:
            try:
                self.coherence_evaluator = CoherenceEvaluator(model_config=model_config)
                self.relevance_evaluator = RelevanceEvaluator(model_config=model_config)
                self.fluency_evaluator = FluencyEvaluator(model_config=model_config)
                self.has_builtin_evaluators = True
            except Exception as e:
                print(f"⚠️ No se pudieron inicializar evaluadores built-in: {e}")
                self.has_builtin_evaluators = False
        else:
            self.has_builtin_evaluators = False
            if not AZURE_AVAILABLE:
                print("ℹ️ Modo local - solo evaluadores personalizados disponibles")
            
    def evaluate_mega_ai_agent(
        self,
        dataset_path: str = None
    ) -> Dict[str, Any]:
        """
        Evalúa el servicio MegaAIAgent.
        
        Args:
            dataset_path: Ruta al dataset de prueba
            
        Returns:
            Dict con resultados de evaluación
        """
        print("\n" + "="*60)
        print("📊 Evaluando MegaAIAgent")
        print("="*60)
        
        # Cargar dataset
        if dataset_path:
            data = self._load_dataset(dataset_path)
        else:
            data = self._load_dataset("datasets/mega_ai_agent_test.jsonl")
            
        if not data:
            return {"error": "No se pudo cargar dataset"}
            
        results = {
            "service": "MegaAIAgent",
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(data),
            "metrics": {},
            "detailed_results": []
        }
        
        intent_scores = []
        business_logic_scores = []
        
        for i, sample in enumerate(data):
            print(f"  Procesando muestra {i+1}/{len(data)}...", end="\r")
            
            # Evaluar detección de intención
            intent_result = self.intent_evaluator(
                query=sample.get("query", ""),
                response=sample.get("response", {}),
                ground_truth=sample.get("ground_truth", {})
            )
            intent_scores.append(intent_result["overall_score"])
            
            # Evaluar lógica de negocio si aplica
            if "business_operation" in sample:
                bl_result = self.business_logic_evaluator(
                    operation_type=sample["business_operation"]["type"],
                    input_data=sample["business_operation"]["input"],
                    output_data=sample["business_operation"]["output"],
                    expected_output=sample["business_operation"].get("expected")
                )
                business_logic_scores.append(bl_result["overall_accuracy"])
                
            results["detailed_results"].append({
                "sample_id": i,
                "query": sample.get("query", "")[:100],
                "intent_score": intent_result["overall_score"],
                "details": intent_result["details"]
            })
            
        # Calcular métricas agregadas
        results["metrics"]["intent_detection"] = {
            "mean": sum(intent_scores) / len(intent_scores) if intent_scores else 0,
            "min": min(intent_scores) if intent_scores else 0,
            "max": max(intent_scores) if intent_scores else 0,
            "samples": len(intent_scores)
        }
        
        if business_logic_scores:
            results["metrics"]["business_logic"] = {
                "mean": sum(business_logic_scores) / len(business_logic_scores),
                "min": min(business_logic_scores),
                "max": max(business_logic_scores),
                "samples": len(business_logic_scores)
            }
            
        print(f"\n  ✅ Completado: {len(data)} muestras evaluadas")
        print(f"  📈 Intent Detection Score: {results['metrics']['intent_detection']['mean']:.2%}")
        
        return results
    
    def evaluate_form_automation(
        self,
        dataset_path: str = None
    ) -> Dict[str, Any]:
        """
        Evalúa el servicio AIFormAutomation.
        """
        print("\n" + "="*60)
        print("📊 Evaluando AIFormAutomation")
        print("="*60)
        
        data = self._load_dataset(dataset_path or "datasets/form_automation_test.jsonl")
        
        if not data:
            return {"error": "No se pudo cargar dataset"}
            
        results = {
            "service": "AIFormAutomation",
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(data),
            "metrics": {},
            "detailed_results": []
        }
        
        scores_by_form_type = {}
        
        for i, sample in enumerate(data):
            print(f"  Procesando muestra {i+1}/{len(data)}...", end="\r")
            
            form_result = self.form_evaluator(
                form_type=sample.get("form_type", "venta"),
                context=sample.get("context", {}),
                suggestions=sample.get("suggestions", {}),
                ground_truth=sample.get("ground_truth")
            )
            
            form_type = sample.get("form_type", "unknown")
            if form_type not in scores_by_form_type:
                scores_by_form_type[form_type] = []
            scores_by_form_type[form_type].append(form_result["overall_accuracy"])
            
            results["detailed_results"].append({
                "sample_id": i,
                "form_type": form_type,
                "overall_score": form_result["overall_accuracy"],
                "completion_rate": form_result["completion_rate"],
                "validation_accuracy": form_result["validation_accuracy"]
            })
            
        # Métricas por tipo de formulario
        for form_type, scores in scores_by_form_type.items():
            results["metrics"][f"form_{form_type}"] = {
                "mean": sum(scores) / len(scores),
                "samples": len(scores)
            }
            
        # Métrica general
        all_scores = [r["overall_score"] for r in results["detailed_results"]]
        results["metrics"]["overall"] = {
            "mean": sum(all_scores) / len(all_scores) if all_scores else 0,
            "samples": len(all_scores)
        }
        
        print(f"\n  ✅ Completado: {len(data)} muestras evaluadas")
        print(f"  📈 Overall Form Accuracy: {results['metrics']['overall']['mean']:.2%}")
        
        return results
    
    def evaluate_power_bi(
        self,
        dataset_path: str = None
    ) -> Dict[str, Any]:
        """
        Evalúa el servicio AIPowerBI.
        """
        print("\n" + "="*60)
        print("📊 Evaluando AIPowerBI")
        print("="*60)
        
        data = self._load_dataset(dataset_path or "datasets/power_bi_test.jsonl")
        
        if not data:
            return {"error": "No se pudo cargar dataset"}
            
        results = {
            "service": "AIPowerBI",
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(data),
            "metrics": {},
            "detailed_results": []
        }
        
        kpi_scores = []
        
        for i, sample in enumerate(data):
            print(f"  Procesando muestra {i+1}/{len(data)}...", end="\r")
            
            kpi_result = self.kpi_evaluator(
                dashboard_type=sample.get("dashboard_type", "general"),
                raw_data=sample.get("raw_data", {}),
                generated_kpis=sample.get("generated_kpis", {}),
                ground_truth_kpis=sample.get("ground_truth_kpis"),
                visualizations=sample.get("visualizations"),
                insights=sample.get("insights")
            )
            
            kpi_scores.append(kpi_result["overall_accuracy"])
            
            results["detailed_results"].append({
                "sample_id": i,
                "dashboard_type": sample.get("dashboard_type"),
                "overall_score": kpi_result["overall_accuracy"],
                "trend_accuracy": kpi_result["trend_accuracy"],
                "insight_relevance": kpi_result["insight_relevance"]
            })
            
        results["metrics"]["kpi_accuracy"] = {
            "mean": sum(kpi_scores) / len(kpi_scores) if kpi_scores else 0,
            "min": min(kpi_scores) if kpi_scores else 0,
            "max": max(kpi_scores) if kpi_scores else 0,
            "samples": len(kpi_scores)
        }
        
        print(f"\n  ✅ Completado: {len(data)} muestras evaluadas")
        print(f"  📈 KPI Accuracy: {results['metrics']['kpi_accuracy']['mean']:.2%}")
        
        return results
    
    def evaluate_scheduled_reports(
        self,
        dataset_path: str = None
    ) -> Dict[str, Any]:
        """
        Evalúa el servicio AIScheduledReports.
        """
        print("\n" + "="*60)
        print("📊 Evaluando AIScheduledReports")
        print("="*60)
        
        data = self._load_dataset(dataset_path or "datasets/scheduled_reports_test.jsonl")
        
        if not data:
            return {"error": "No se pudo cargar dataset"}
            
        results = {
            "service": "AIScheduledReports",
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(data),
            "metrics": {},
            "detailed_results": []
        }
        
        quality_scores = []
        
        for i, sample in enumerate(data):
            print(f"  Procesando muestra {i+1}/{len(data)}...", end="\r")
            
            report_result = self.report_evaluator(
                report_type=sample.get("report_type", "general"),
                report_content=sample.get("report_content", {}),
                schedule_config=sample.get("schedule_config"),
                expected_data=sample.get("expected_data"),
                output_format=sample.get("output_format", "json")
            )
            
            quality_scores.append(report_result["overall_quality"])
            
            results["detailed_results"].append({
                "sample_id": i,
                "report_type": sample.get("report_type"),
                "overall_quality": report_result["overall_quality"],
                "data_completeness": report_result["data_completeness"],
                "format_correctness": report_result["format_correctness"]
            })
            
        results["metrics"]["report_quality"] = {
            "mean": sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            "min": min(quality_scores) if quality_scores else 0,
            "max": max(quality_scores) if quality_scores else 0,
            "samples": len(quality_scores)
        }
        
        print(f"\n  ✅ Completado: {len(data)} muestras evaluadas")
        print(f"  📈 Report Quality: {results['metrics']['report_quality']['mean']:.2%}")
        
        return results
    
    def evaluate_user_learning(
        self,
        dataset_path: str = None
    ) -> Dict[str, Any]:
        """
        Evalúa el servicio UserLearning.
        """
        print("\n" + "="*60)
        print("📊 Evaluando UserLearning")
        print("="*60)
        
        data = self._load_dataset(dataset_path or "datasets/user_learning_test.jsonl")
        
        if not data:
            return {"error": "No se pudo cargar dataset"}
            
        results = {
            "service": "UserLearning",
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(data),
            "metrics": {},
            "detailed_results": []
        }
        
        effectiveness_scores = []
        
        for i, sample in enumerate(data):
            print(f"  Procesando muestra {i+1}/{len(data)}...", end="\r")
            
            learning_result = self.user_learning_evaluator(
                user_activity=sample.get("user_activity", []),
                detected_patterns=sample.get("detected_patterns", {}),
                predictions=sample.get("predictions"),
                engagement_score=sample.get("engagement_score"),
                insights=sample.get("insights"),
                ground_truth=sample.get("ground_truth")
            )
            
            effectiveness_scores.append(learning_result["overall_effectiveness"])
            
            results["detailed_results"].append({
                "sample_id": i,
                "overall_effectiveness": learning_result["overall_effectiveness"],
                "pattern_accuracy": learning_result["pattern_detection_accuracy"],
                "prediction_accuracy": learning_result["prediction_accuracy"]
            })
            
        results["metrics"]["learning_effectiveness"] = {
            "mean": sum(effectiveness_scores) / len(effectiveness_scores) if effectiveness_scores else 0,
            "min": min(effectiveness_scores) if effectiveness_scores else 0,
            "max": max(effectiveness_scores) if effectiveness_scores else 0,
            "samples": len(effectiveness_scores)
        }
        
        print(f"\n  ✅ Completado: {len(data)} muestras evaluadas")
        print(f"  📈 Learning Effectiveness: {results['metrics']['learning_effectiveness']['mean']:.2%}")
        
        return results
    
    def evaluate_business_logic(
        self,
        dataset_path: str = None
    ) -> Dict[str, Any]:
        """
        Evalúa específicamente la lógica de negocio (distribución de ventas, capital, etc.)
        """
        print("\n" + "="*60)
        print("📊 Evaluando Lógica de Negocio")
        print("="*60)
        
        data = self._load_dataset(dataset_path or "datasets/business_logic_test.jsonl")
        
        if not data:
            return {"error": "No se pudo cargar dataset"}
            
        results = {
            "service": "BusinessLogic",
            "timestamp": datetime.now().isoformat(),
            "total_samples": len(data),
            "metrics": {},
            "detailed_results": []
        }
        
        scores_by_operation = {}
        
        for i, sample in enumerate(data):
            print(f"  Procesando muestra {i+1}/{len(data)}...", end="\r")
            
            bl_result = self.business_logic_evaluator(
                operation_type=sample.get("operation_type", "sale_distribution"),
                input_data=sample.get("input_data", {}),
                output_data=sample.get("output_data", {}),
                expected_output=sample.get("expected_output")
            )
            
            op_type = sample.get("operation_type", "unknown")
            if op_type not in scores_by_operation:
                scores_by_operation[op_type] = []
            scores_by_operation[op_type].append(bl_result["overall_accuracy"])
            
            results["detailed_results"].append({
                "sample_id": i,
                "operation_type": op_type,
                "overall_accuracy": bl_result["overall_accuracy"],
                "errors": bl_result.get("errors", [])
            })
            
        # Métricas por tipo de operación
        for op_type, scores in scores_by_operation.items():
            results["metrics"][op_type] = {
                "mean": sum(scores) / len(scores),
                "samples": len(scores),
                "perfect_score_rate": sum(1 for s in scores if s >= 0.99) / len(scores)
            }
            
        all_scores = [r["overall_accuracy"] for r in results["detailed_results"]]
        results["metrics"]["overall"] = {
            "mean": sum(all_scores) / len(all_scores) if all_scores else 0,
            "samples": len(all_scores)
        }
        
        print(f"\n  ✅ Completado: {len(data)} muestras evaluadas")
        print(f"  📈 Business Logic Accuracy: {results['metrics']['overall']['mean']:.2%}")
        
        return results
    
    def evaluate_all(self) -> Dict[str, Any]:
        """
        Ejecuta evaluación de todos los servicios.
        """
        print("\n" + "="*60)
        print("🚀 EVALUACIÓN COMPLETA DE CHRONOS AI")
        print("="*60)
        
        all_results = {
            "timestamp": datetime.now().isoformat(),
            "services": {}
        }
        
        # Evaluar cada servicio
        all_results["services"]["mega_ai_agent"] = self.evaluate_mega_ai_agent()
        all_results["services"]["form_automation"] = self.evaluate_form_automation()
        all_results["services"]["power_bi"] = self.evaluate_power_bi()
        all_results["services"]["scheduled_reports"] = self.evaluate_scheduled_reports()
        all_results["services"]["user_learning"] = self.evaluate_user_learning()
        all_results["services"]["business_logic"] = self.evaluate_business_logic()
        
        # Calcular resumen
        all_results["summary"] = self._generate_summary(all_results["services"])
        
        # Guardar resultados
        self._save_results(all_results, "full_evaluation")
        
        # Imprimir resumen
        self._print_summary(all_results["summary"])
        
        return all_results
    
    def _load_dataset(self, path: str) -> List[Dict]:
        """Carga un dataset JSONL."""
        full_path = Path(path)
        if not full_path.is_absolute():
            full_path = Path(__file__).parent / path
            
        if not full_path.exists():
            print(f"  ⚠️ Dataset no encontrado: {full_path}")
            # Intentar generar dataset de ejemplo
            return self._generate_sample_data(path)
            
        data = []
        with open(full_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        data.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
                        
        print(f"  📁 Cargado dataset: {len(data)} muestras")
        return data
    
    def _generate_sample_data(self, dataset_type: str) -> List[Dict]:
        """Genera datos de ejemplo para evaluación."""
        print(f"  🔧 Generando datos de ejemplo...")
        
        if "mega_ai_agent" in dataset_type:
            return [
                {
                    "query": "Muéstrame las ventas del mes pasado",
                    "response": {"intent": "query_data", "confidence": 0.92},
                    "ground_truth": {"intent": "query_data"}
                },
                {
                    "query": "Crea una nueva venta de 50 unidades",
                    "response": {"intent": "create_record", "confidence": 0.88},
                    "ground_truth": {"intent": "create_record"}
                },
                {
                    "query": "Genera un reporte de inventario",
                    "response": {"intent": "generate_report", "confidence": 0.85},
                    "ground_truth": {"intent": "generate_report"}
                }
            ]
        elif "business_logic" in dataset_type:
            return [
                {
                    "operation_type": "sale_distribution",
                    "input_data": {
                        "precioVentaUnidad": 10000,
                        "precioCompraUnidad": 6300,
                        "precioFlete": 500,
                        "cantidad": 10
                    },
                    "output_data": {
                        "boveda_monte": 63000,
                        "flete_sur": 5000,
                        "utilidades": 32000
                    }
                },
                {
                    "operation_type": "capital_calculation",
                    "input_data": {
                        "historicoIngresos": 1500000,
                        "historicoGastos": 350000
                    },
                    "output_data": {
                        "capitalActual": 1150000
                    }
                }
            ]
        elif "form" in dataset_type:
            return [
                {
                    "form_type": "venta",
                    "context": {"clienteId": "CLI001"},
                    "suggestions": {
                        "fields": {
                            "clienteId": "CLI001",
                            "precioUnitario": 10000,
                            "cantidad": 5
                        }
                    },
                    "ground_truth": {
                        "clienteId": "CLI001",
                        "precioUnitario": 10000,
                        "cantidad": 5
                    }
                }
            ]
        else:
            return []
    
    def _generate_summary(self, services: Dict) -> Dict:
        """Genera resumen de resultados."""
        summary = {
            "total_services": len(services),
            "overall_score": 0.0,
            "service_scores": {},
            "status": "passed"
        }
        
        scores = []
        for service_name, service_result in services.items():
            if "error" in service_result:
                continue
                
            metrics = service_result.get("metrics", {})
            if "overall" in metrics:
                score = metrics["overall"]["mean"]
            elif metrics:
                # Tomar promedio de todas las métricas
                score = sum(m["mean"] for m in metrics.values() if isinstance(m, dict) and "mean" in m) / len(metrics)
            else:
                score = 0.0
                
            summary["service_scores"][service_name] = score
            scores.append(score)
            
        if scores:
            summary["overall_score"] = sum(scores) / len(scores)
            
        # Determinar status
        if summary["overall_score"] < 0.6:
            summary["status"] = "failed"
        elif summary["overall_score"] < 0.8:
            summary["status"] = "warning"
            
        return summary
    
    def _print_summary(self, summary: Dict):
        """Imprime resumen de evaluación."""
        print("\n" + "="*60)
        print("📋 RESUMEN DE EVALUACIÓN")
        print("="*60)
        
        status_emoji = {"passed": "✅", "warning": "⚠️", "failed": "❌"}
        
        print(f"\n  Status General: {status_emoji.get(summary['status'], '?')} {summary['status'].upper()}")
        print(f"  Score General: {summary['overall_score']:.2%}")
        print(f"\n  Scores por Servicio:")
        
        for service, score in summary["service_scores"].items():
            bar = "█" * int(score * 20) + "░" * (20 - int(score * 20))
            print(f"    {service:25} [{bar}] {score:.2%}")
            
        print("\n" + "="*60)
    
    def _save_results(self, results: Dict, name: str):
        """Guarda resultados de evaluación."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.output_dir / f"{name}_{timestamp}.json"
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
            
        print(f"\n  💾 Resultados guardados: {filename}")


def main():
    """Función principal."""
    parser = argparse.ArgumentParser(
        description="CHRONOS AI Evaluation Runner"
    )
    parser.add_argument(
        "--service",
        choices=["mega_ai_agent", "form_automation", "power_bi", 
                 "scheduled_reports", "user_learning", "business_logic", "all"],
        default="all",
        help="Servicio a evaluar"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        help="Ruta a dataset personalizado"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="results",
        help="Directorio de salida"
    )
    
    args = parser.parse_args()
    
    # Inicializar evaluador
    evaluator = CHRONOSEvaluator(output_dir=args.output)
    
    # Ejecutar evaluación
    if args.service == "all":
        results = evaluator.evaluate_all()
    elif args.service == "mega_ai_agent":
        results = evaluator.evaluate_mega_ai_agent(args.dataset)
    elif args.service == "form_automation":
        results = evaluator.evaluate_form_automation(args.dataset)
    elif args.service == "power_bi":
        results = evaluator.evaluate_power_bi(args.dataset)
    elif args.service == "scheduled_reports":
        results = evaluator.evaluate_scheduled_reports(args.dataset)
    elif args.service == "user_learning":
        results = evaluator.evaluate_user_learning(args.dataset)
    elif args.service == "business_logic":
        results = evaluator.evaluate_business_logic(args.dataset)
        
    return results


if __name__ == "__main__":
    main()
