"""
User Learning Evaluator
========================

Evalúa la efectividad del sistema UserLearning.service para aprendizaje de patrones.

Capacidades evaluadas:
- Tracking de actividad del usuario
- Análisis de patrones de comportamiento
- Predicción de próximas acciones
- Generación de insights de aprendizaje
- Cálculo de engagement score

Métricas de usuario trackeadas:
- Acciones realizadas (crear, editar, consultar, exportar)
- Navegación entre paneles
- Patrones de tiempo (horarios de uso, duración de sesión)
- Frecuencia de uso de features
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


class UserLearningEvaluator(EvaluatorBase):
    """
    Evaluador del sistema de aprendizaje de usuario.
    
    Métricas principales:
    - pattern_detection_accuracy: Precisión en detección de patrones
    - prediction_accuracy: Precisión en predicción de acciones
    - engagement_calculation: Precisión del score de engagement
    - insight_quality: Calidad de insights generados
    """
    
    # Tipos de acciones trackeadas
    ACTION_TYPES = [
        "view", "create", "edit", "delete", "export", "search",
        "navigate", "login", "logout", "report", "filter"
    ]
    
    # Paneles del sistema
    PANELS = [
        "dashboard", "ventas", "compras", "clientes", "inventario",
        "distribuidores", "bancos", "reportes", "configuracion"
    ]
    
    # Rangos de engagement score
    ENGAGEMENT_LEVELS = {
        "muy_alto": (0.8, 1.0),
        "alto": (0.6, 0.8),
        "medio": (0.4, 0.6),
        "bajo": (0.2, 0.4),
        "muy_bajo": (0.0, 0.2)
    }
    
    def __init__(
        self,
        min_data_points: int = 10,
        prediction_window: int = 5
    ):
        """
        Inicializa el evaluador de aprendizaje de usuario.
        
        Args:
            min_data_points: Mínimo de puntos de datos para evaluar patrones
            prediction_window: Ventana de predicción en acciones
        """
        super().__init__()
        self.min_data_points = min_data_points
        self.prediction_window = prediction_window
        
    def __call__(
        self,
        *,
        user_activity: List[Dict[str, Any]],
        detected_patterns: Dict[str, Any],
        predictions: Dict[str, Any] = None,
        engagement_score: float = None,
        insights: List[str] = None,
        ground_truth: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evalúa el sistema de aprendizaje de usuario.
        
        Args:
            user_activity: Lista de actividades del usuario
            detected_patterns: Patrones detectados por el sistema
            predictions: Predicciones de próximas acciones
            engagement_score: Score de engagement calculado
            insights: Insights generados sobre el usuario
            ground_truth: Patrones y predicciones correctas (opcional)
            
        Returns:
            Dict con métricas de evaluación
        """
        results = {
            "overall_effectiveness": 0.0,
            "pattern_detection_accuracy": 0.0,
            "prediction_accuracy": 0.0,
            "engagement_accuracy": 0.0,
            "insight_quality": 0.0,
            "details": {},
            "errors": []
        }
        
        # Validar datos de entrada
        if not user_activity or len(user_activity) < self.min_data_points:
            results["errors"].append(
                f"Insuficientes datos de actividad (mínimo: {self.min_data_points})"
            )
            # Continuar con evaluación parcial si es posible
            
        # 1. Evaluar detección de patrones
        if detected_patterns:
            pattern_result = self._evaluate_pattern_detection(
                user_activity,
                detected_patterns,
                ground_truth.get("patterns") if ground_truth else None
            )
            results["pattern_detection_accuracy"] = pattern_result["score"]
            results["details"]["patterns"] = pattern_result["details"]
        else:
            results["errors"].append("No se proporcionaron patrones detectados")
            
        # 2. Evaluar predicciones
        if predictions:
            prediction_result = self._evaluate_predictions(
                user_activity,
                predictions,
                ground_truth.get("next_actions") if ground_truth else None
            )
            results["prediction_accuracy"] = prediction_result["score"]
            results["details"]["predictions"] = prediction_result["details"]
        else:
            results["prediction_accuracy"] = 0.5  # Neutral si no hay predicciones
            
        # 3. Evaluar engagement score
        if engagement_score is not None:
            engagement_result = self._evaluate_engagement(
                user_activity,
                engagement_score,
                ground_truth.get("engagement") if ground_truth else None
            )
            results["engagement_accuracy"] = engagement_result["score"]
            results["details"]["engagement"] = engagement_result["details"]
        else:
            results["engagement_accuracy"] = 0.5
            
        # 4. Evaluar calidad de insights
        if insights:
            insight_result = self._evaluate_insights(
                insights,
                user_activity,
                detected_patterns
            )
            results["insight_quality"] = insight_result["score"]
            results["details"]["insights"] = insight_result["details"]
        else:
            results["insight_quality"] = 0.5
            
        # 5. Calcular efectividad general
        results["overall_effectiveness"] = (
            results["pattern_detection_accuracy"] * 0.35 +
            results["prediction_accuracy"] * 0.25 +
            results["engagement_accuracy"] * 0.20 +
            results["insight_quality"] * 0.20
        )
        
        # 6. Métricas adicionales
        results["details"]["activity_summary"] = self._summarize_activity(user_activity)
        
        return results
    
    def _evaluate_pattern_detection(
        self,
        activity: List[Dict],
        detected: Dict[str, Any],
        ground_truth: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Evalúa la precisión de detección de patrones."""
        result = {
            "score": 0.0,
            "details": {
                "patterns_found": [],
                "pattern_validity": {},
                "accuracy_per_pattern": {}
            }
        }
        
        scores = []
        
        # Evaluar patrón de tiempo
        if "time_pattern" in detected or "patronTiempo" in detected:
            time_pattern = detected.get("time_pattern", detected.get("patronTiempo", {}))
            time_score = self._validate_time_pattern(activity, time_pattern)
            result["details"]["accuracy_per_pattern"]["time"] = time_score
            result["details"]["patterns_found"].append("time_pattern")
            scores.append(time_score)
            
        # Evaluar patrón de navegación
        if "navigation_pattern" in detected or "patronNavegacion" in detected:
            nav_pattern = detected.get("navigation_pattern", detected.get("patronNavegacion", {}))
            nav_score = self._validate_navigation_pattern(activity, nav_pattern)
            result["details"]["accuracy_per_pattern"]["navigation"] = nav_score
            result["details"]["patterns_found"].append("navigation_pattern")
            scores.append(nav_score)
            
        # Evaluar patrón de acciones
        if "action_pattern" in detected or "patronAcciones" in detected:
            action_pattern = detected.get("action_pattern", detected.get("patronAcciones", {}))
            action_score = self._validate_action_pattern(activity, action_pattern)
            result["details"]["accuracy_per_pattern"]["actions"] = action_score
            result["details"]["patterns_found"].append("action_pattern")
            scores.append(action_score)
            
        # Evaluar patrón de frecuencia
        if "frequency_pattern" in detected or "patronFrecuencia" in detected:
            freq_pattern = detected.get("frequency_pattern", detected.get("patronFrecuencia", {}))
            freq_score = self._validate_frequency_pattern(activity, freq_pattern)
            result["details"]["accuracy_per_pattern"]["frequency"] = freq_score
            result["details"]["patterns_found"].append("frequency_pattern")
            scores.append(freq_score)
            
        # Comparar con ground truth si existe
        if ground_truth:
            gt_score = self._compare_patterns_with_ground_truth(detected, ground_truth)
            scores.append(gt_score)
            result["details"]["ground_truth_match"] = gt_score
            
        result["score"] = sum(scores) / len(scores) if scores else 0.0
        
        return result
    
    def _validate_time_pattern(
        self,
        activity: List[Dict],
        pattern: Dict
    ) -> float:
        """Valida patrón de tiempo contra actividad real."""
        if not activity or not pattern:
            return 0.5
            
        # Extraer timestamps
        timestamps = []
        for act in activity:
            ts = act.get("timestamp", act.get("fecha", act.get("time")))
            if ts:
                if isinstance(ts, str):
                    try:
                        ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    except ValueError:
                        continue
                timestamps.append(ts)
                
        if not timestamps:
            return 0.5
            
        # Verificar horario preferido
        preferred_hours = pattern.get("preferred_hours", pattern.get("horasPreferidas", []))
        if preferred_hours:
            actual_hours = [ts.hour for ts in timestamps]
            hour_matches = sum(1 for h in actual_hours if h in preferred_hours)
            hour_accuracy = hour_matches / len(actual_hours) if actual_hours else 0
        else:
            hour_accuracy = 0.5
            
        # Verificar días activos
        active_days = pattern.get("active_days", pattern.get("diasActivos", []))
        if active_days:
            actual_days = [ts.weekday() for ts in timestamps]
            day_matches = sum(1 for d in actual_days if d in active_days)
            day_accuracy = day_matches / len(actual_days) if actual_days else 0
        else:
            day_accuracy = 0.5
            
        return (hour_accuracy + day_accuracy) / 2
    
    def _validate_navigation_pattern(
        self,
        activity: List[Dict],
        pattern: Dict
    ) -> float:
        """Valida patrón de navegación."""
        if not activity or not pattern:
            return 0.5
            
        # Extraer secuencia de paneles visitados
        visited_panels = []
        for act in activity:
            panel = act.get("panel", act.get("screen", act.get("page")))
            if panel:
                visited_panels.append(panel.lower())
                
        if not visited_panels:
            return 0.5
            
        # Verificar panel más frecuente
        most_visited = pattern.get("most_visited", pattern.get("masVisitado"))
        if most_visited:
            from collections import Counter
            actual_most = Counter(visited_panels).most_common(1)
            if actual_most and actual_most[0][0] == most_visited.lower():
                freq_accuracy = 1.0
            else:
                freq_accuracy = 0.5
        else:
            freq_accuracy = 0.5
            
        # Verificar secuencias comunes
        common_sequences = pattern.get("common_sequences", pattern.get("secuenciasComunes", []))
        if common_sequences:
            sequence_matches = 0
            for seq in common_sequences:
                seq_lower = [s.lower() for s in seq]
                for i in range(len(visited_panels) - len(seq_lower) + 1):
                    if visited_panels[i:i+len(seq_lower)] == seq_lower:
                        sequence_matches += 1
            seq_accuracy = min(1.0, sequence_matches / len(common_sequences))
        else:
            seq_accuracy = 0.5
            
        return (freq_accuracy + seq_accuracy) / 2
    
    def _validate_action_pattern(
        self,
        activity: List[Dict],
        pattern: Dict
    ) -> float:
        """Valida patrón de acciones."""
        if not activity or not pattern:
            return 0.5
            
        # Extraer acciones
        actions = []
        for act in activity:
            action = act.get("action", act.get("accion", act.get("type")))
            if action:
                actions.append(action.lower())
                
        if not actions:
            return 0.5
            
        from collections import Counter
        action_counts = Counter(actions)
        
        # Verificar acción más frecuente
        most_common = pattern.get("most_common", pattern.get("masComun"))
        if most_common:
            actual_most = action_counts.most_common(1)
            if actual_most and actual_most[0][0] == most_common.lower():
                common_accuracy = 1.0
            else:
                common_accuracy = 0.5
        else:
            common_accuracy = 0.5
            
        # Verificar distribución de acciones
        distribution = pattern.get("distribution", pattern.get("distribucion", {}))
        if distribution:
            total_actions = len(actions)
            dist_accuracy_scores = []
            for action_type, expected_pct in distribution.items():
                actual_pct = action_counts.get(action_type.lower(), 0) / total_actions * 100
                diff = abs(actual_pct - expected_pct)
                dist_accuracy_scores.append(max(0, 1 - diff / 50))  # Tolerancia de 50%
            dist_accuracy = sum(dist_accuracy_scores) / len(dist_accuracy_scores) if dist_accuracy_scores else 0.5
        else:
            dist_accuracy = 0.5
            
        return (common_accuracy + dist_accuracy) / 2
    
    def _validate_frequency_pattern(
        self,
        activity: List[Dict],
        pattern: Dict
    ) -> float:
        """Valida patrón de frecuencia de uso."""
        if not activity:
            return 0.5
            
        # Calcular frecuencia real
        timestamps = []
        for act in activity:
            ts = act.get("timestamp", act.get("fecha"))
            if ts:
                if isinstance(ts, str):
                    try:
                        timestamps.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
                    except ValueError:
                        continue
                elif isinstance(ts, datetime):
                    timestamps.append(ts)
                    
        if len(timestamps) < 2:
            return 0.5
            
        timestamps.sort()
        
        # Calcular sesiones por día/semana
        days_active = len(set(ts.date() for ts in timestamps))
        total_days = (timestamps[-1] - timestamps[0]).days + 1
        daily_frequency = days_active / total_days if total_days > 0 else 0
        
        # Verificar frecuencia detectada
        detected_freq = pattern.get("sessions_per_week", pattern.get("sesionesPorSemana"))
        if detected_freq:
            expected_daily = detected_freq / 7
            freq_diff = abs(daily_frequency - expected_daily)
            freq_accuracy = max(0, 1 - freq_diff)
        else:
            freq_accuracy = 0.5
            
        # Verificar regularidad
        regularity = pattern.get("regularity", pattern.get("regularidad"))
        if regularity:
            # Calcular varianza en intervalos
            intervals = [(timestamps[i+1] - timestamps[i]).total_seconds() 
                        for i in range(len(timestamps)-1)]
            if intervals:
                avg_interval = sum(intervals) / len(intervals)
                variance = sum((i - avg_interval)**2 for i in intervals) / len(intervals)
                cv = (variance ** 0.5) / avg_interval if avg_interval > 0 else 1
                
                # Regularidad alta = CV bajo
                actual_regularity = "alta" if cv < 0.3 else "media" if cv < 0.7 else "baja"
                reg_accuracy = 1.0 if actual_regularity == regularity.lower() else 0.5
            else:
                reg_accuracy = 0.5
        else:
            reg_accuracy = 0.5
            
        return (freq_accuracy + reg_accuracy) / 2
    
    def _compare_patterns_with_ground_truth(
        self,
        detected: Dict,
        ground_truth: Dict
    ) -> float:
        """Compara patrones detectados con ground truth."""
        if not ground_truth:
            return 0.5
            
        matches = 0
        total = 0
        
        for key in ground_truth:
            total += 1
            if key in detected:
                if detected[key] == ground_truth[key]:
                    matches += 1
                elif isinstance(detected[key], dict) and isinstance(ground_truth[key], dict):
                    # Comparar diccionarios anidados
                    nested_match = sum(
                        1 for k in ground_truth[key] 
                        if k in detected[key] and detected[key][k] == ground_truth[key][k]
                    )
                    nested_total = len(ground_truth[key])
                    matches += nested_match / nested_total if nested_total > 0 else 0
                    
        return matches / total if total > 0 else 0.5
    
    def _evaluate_predictions(
        self,
        activity: List[Dict],
        predictions: Dict[str, Any],
        ground_truth: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Evalúa la precisión de predicciones."""
        result = {
            "score": 0.0,
            "details": {
                "predictions_made": [],
                "correct_predictions": [],
                "confidence_calibration": 0.0
            }
        }
        
        predicted_actions = predictions.get("next_actions", predictions.get("proximasAcciones", []))
        confidence_scores = predictions.get("confidence", predictions.get("confianza", {}))
        
        result["details"]["predictions_made"] = predicted_actions
        
        if ground_truth:
            # Comparar con acciones reales
            correct = sum(1 for p in predicted_actions if p in ground_truth)
            result["details"]["correct_predictions"] = [p for p in predicted_actions if p in ground_truth]
            
            if predicted_actions:
                result["score"] = correct / len(predicted_actions)
            else:
                result["score"] = 0.0
                
            # Evaluar calibración de confianza
            if confidence_scores:
                calibration_scores = []
                for action, conf in confidence_scores.items():
                    was_correct = action in ground_truth
                    expected_conf = 1.0 if was_correct else 0.0
                    calibration_scores.append(1 - abs(conf - expected_conf))
                result["details"]["confidence_calibration"] = (
                    sum(calibration_scores) / len(calibration_scores) if calibration_scores else 0.5
                )
        else:
            # Sin ground truth, evaluar coherencia
            if predicted_actions:
                # Verificar que predicciones son acciones válidas
                valid_actions = sum(1 for p in predicted_actions if p.lower() in self.ACTION_TYPES)
                result["score"] = valid_actions / len(predicted_actions)
            else:
                result["score"] = 0.5
                
        return result
    
    def _evaluate_engagement(
        self,
        activity: List[Dict],
        calculated_score: float,
        ground_truth: Optional[float] = None
    ) -> Dict[str, Any]:
        """Evalúa la precisión del cálculo de engagement."""
        result = {
            "score": 0.0,
            "details": {
                "calculated_engagement": calculated_score,
                "engagement_level": self._get_engagement_level(calculated_score),
                "factors_considered": []
            }
        }
        
        if ground_truth is not None:
            # Comparar con ground truth
            diff = abs(calculated_score - ground_truth)
            result["score"] = max(0, 1 - diff)
            result["details"]["expected_engagement"] = ground_truth
        else:
            # Calcular engagement basado en actividad y comparar
            estimated = self._estimate_engagement(activity)
            diff = abs(calculated_score - estimated)
            result["score"] = max(0, 1 - diff * 2)  # Más tolerante sin ground truth
            result["details"]["estimated_engagement"] = estimated
            
        # Identificar factores considerados
        result["details"]["factors_considered"] = [
            "session_frequency",
            "action_diversity",
            "feature_usage",
            "session_duration"
        ]
        
        return result
    
    def _estimate_engagement(self, activity: List[Dict]) -> float:
        """Estima engagement basado en actividad."""
        if not activity:
            return 0.0
            
        # Factor 1: Frecuencia de actividad
        freq_score = min(1.0, len(activity) / 100)
        
        # Factor 2: Diversidad de acciones
        actions = set()
        for act in activity:
            action = act.get("action", act.get("type"))
            if action:
                actions.add(action.lower())
        diversity_score = len(actions) / len(self.ACTION_TYPES)
        
        # Factor 3: Cobertura de paneles
        panels = set()
        for act in activity:
            panel = act.get("panel", act.get("screen"))
            if panel:
                panels.add(panel.lower())
        coverage_score = len(panels) / len(self.PANELS)
        
        return (freq_score * 0.4 + diversity_score * 0.3 + coverage_score * 0.3)
    
    def _get_engagement_level(self, score: float) -> str:
        """Obtiene nivel de engagement basado en score."""
        for level, (min_val, max_val) in self.ENGAGEMENT_LEVELS.items():
            if min_val <= score < max_val:
                return level
        return "muy_alto" if score >= 0.8 else "muy_bajo"
    
    def _evaluate_insights(
        self,
        insights: List[str],
        activity: List[Dict],
        patterns: Dict
    ) -> Dict[str, Any]:
        """Evalúa la calidad de insights generados."""
        result = {
            "score": 0.0,
            "details": {
                "insights_count": len(insights),
                "actionable_count": 0,
                "relevant_count": 0,
                "quality_scores": []
            }
        }
        
        if not insights:
            return result
            
        for insight in insights:
            insight_score = 0.0
            
            # Verificar que es accionable
            actionable_keywords = [
                "aumentar", "reducir", "mejorar", "considerar", "recomendar",
                "sugerir", "optimizar", "revisar", "priorizar"
            ]
            is_actionable = any(kw in insight.lower() for kw in actionable_keywords)
            if is_actionable:
                result["details"]["actionable_count"] += 1
                insight_score += 0.4
                
            # Verificar relevancia con patrones
            pattern_keywords = []
            if patterns:
                pattern_keywords = [str(v).lower() for v in patterns.values() if v]
            is_relevant = any(kw in insight.lower() for kw in pattern_keywords)
            if is_relevant:
                result["details"]["relevant_count"] += 1
                insight_score += 0.4
                
            # Verificar longitud razonable
            if 30 <= len(insight) <= 300:
                insight_score += 0.2
                
            result["details"]["quality_scores"].append(insight_score)
            
        result["score"] = (
            sum(result["details"]["quality_scores"]) / len(insights) if insights else 0.0
        )
        
        return result
    
    def _summarize_activity(self, activity: List[Dict]) -> Dict:
        """Resume la actividad del usuario."""
        if not activity:
            return {"total_actions": 0}
            
        from collections import Counter
        
        actions = [a.get("action", a.get("type", "unknown")).lower() for a in activity]
        panels = [a.get("panel", a.get("screen", "unknown")).lower() for a in activity]
        
        return {
            "total_actions": len(activity),
            "unique_actions": len(set(actions)),
            "unique_panels": len(set(panels)),
            "top_actions": Counter(actions).most_common(3),
            "top_panels": Counter(panels).most_common(3)
        }


def create_user_learning_evaluator(
    min_data_points: int = 10
) -> UserLearningEvaluator:
    """Factory function para crear evaluador de aprendizaje de usuario."""
    return UserLearningEvaluator(min_data_points=min_data_points)


# Tests de ejemplo
if __name__ == "__main__":
    evaluator = UserLearningEvaluator(min_data_points=5)
    
    # Test 1: Evaluación de patrones de usuario
    print("=" * 60)
    print("Test 1: Patrones de Usuario")
    print("=" * 60)
    
    result = evaluator(
        user_activity=[
            {"timestamp": "2025-01-15T09:00:00Z", "action": "login", "panel": "dashboard"},
            {"timestamp": "2025-01-15T09:05:00Z", "action": "view", "panel": "ventas"},
            {"timestamp": "2025-01-15T09:15:00Z", "action": "create", "panel": "ventas"},
            {"timestamp": "2025-01-15T09:30:00Z", "action": "view", "panel": "clientes"},
            {"timestamp": "2025-01-15T10:00:00Z", "action": "export", "panel": "reportes"},
            {"timestamp": "2025-01-16T09:00:00Z", "action": "login", "panel": "dashboard"},
            {"timestamp": "2025-01-16T09:10:00Z", "action": "view", "panel": "ventas"},
            {"timestamp": "2025-01-16T09:20:00Z", "action": "create", "panel": "ventas"},
        ],
        detected_patterns={
            "time_pattern": {
                "preferred_hours": [9, 10],
                "active_days": [0, 1, 2, 3, 4]  # Lunes a Viernes
            },
            "navigation_pattern": {
                "most_visited": "ventas",
                "common_sequences": [["dashboard", "ventas"]]
            },
            "action_pattern": {
                "most_common": "view",
                "distribution": {"view": 50, "create": 25, "export": 12.5, "login": 12.5}
            },
            "frequency_pattern": {
                "sessions_per_week": 5,
                "regularity": "alta"
            }
        },
        predictions={
            "next_actions": ["view", "create"],
            "confidence": {"view": 0.85, "create": 0.70}
        },
        engagement_score=0.75,
        insights=[
            "El usuario prefiere trabajar en horario matutino (9-10am)",
            "Alta frecuencia de uso del módulo de ventas - considerar shortcuts personalizados",
            "Patrón consistente: dashboard -> ventas. Optimizar este flujo."
        ]
    )
    print(json.dumps(result, indent=2))
