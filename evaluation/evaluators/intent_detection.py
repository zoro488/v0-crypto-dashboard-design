"""
Intent Detection Evaluator
===========================

Evalúa la precisión de detección de intenciones del MegaAIAgent.

Intenciones soportadas (11 tipos):
- query_data: Consultas de datos
- create_record: Crear registros
- update_record: Actualizar registros  
- delete_record: Eliminar registros
- generate_report: Generar reportes
- schedule_report: Programar reportes
- navigate: Navegación entre paneles
- export: Exportar datos
- analyze: Análisis de datos
- conversation: Conversación general
- help: Solicitar ayuda
"""

import json
from typing import Any, Dict, List, Union

# Importación condicional para funcionar sin Azure AI Evaluation
try:
    from azure.ai.evaluation import EvaluatorBase
except ImportError:
    # Base class fallback cuando azure-ai-evaluation no está disponible
    class EvaluatorBase:
        """Fallback EvaluatorBase when azure-ai-evaluation is not installed."""
        def __init__(self):
            pass


class IntentDetectionEvaluator(EvaluatorBase):
    """
    Evaluador de detección de intenciones para MegaAIAgent.
    
    Métricas:
    - intent_accuracy: Precisión de intent detectado vs esperado
    - confidence_calibration: Calibración del score de confianza
    - entity_extraction: Precisión en extracción de entidades
    """
    
    # Intenciones válidas del sistema CHRONOS
    VALID_INTENTS = [
        "query_data",
        "create_record", 
        "update_record",
        "delete_record",
        "generate_report",
        "schedule_report",
        "navigate",
        "export",
        "analyze",
        "conversation",
        "help"
    ]
    
    # Palabras clave por intención para validación adicional
    INTENT_KEYWORDS = {
        "query_data": ["mostrar", "listar", "ver", "buscar", "consultar", "cuántos", "cuántas", "cuánto"],
        "create_record": ["crear", "agregar", "nuevo", "registrar", "añadir"],
        "update_record": ["actualizar", "modificar", "editar", "cambiar"],
        "delete_record": ["eliminar", "borrar", "quitar", "remover"],
        "generate_report": ["reporte", "informe", "generar reporte", "crear informe"],
        "schedule_report": ["programar", "agendar", "schedule", "automático"],
        "navigate": ["ir a", "navegar", "mostrar panel", "abrir"],
        "export": ["exportar", "descargar", "excel", "pdf", "csv"],
        "analyze": ["analizar", "análisis", "tendencia", "comparar", "estadísticas"],
        "conversation": ["hola", "gracias", "cómo estás", "buenos días"],
        "help": ["ayuda", "cómo", "qué puedo", "funciones", "capacidades"]
    }
    
    def __init__(
        self,
        model_config: Dict[str, Any] = None,
        threshold: float = 0.7
    ):
        """
        Inicializa el evaluador de intenciones.
        
        Args:
            model_config: Configuración del modelo para evaluación con LLM
            threshold: Umbral de confianza para considerar intent correcto
        """
        super().__init__()
        self.model_config = model_config
        self.threshold = threshold
        
    def __call__(
        self,
        *,
        query: str,
        response: Union[str, Dict],
        ground_truth: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evalúa la detección de intención.
        
        Args:
            query: Consulta del usuario
            response: Respuesta del agente (puede ser string o dict con intent)
            ground_truth: Intención esperada {"intent": str, "entities": dict}
            
        Returns:
            Dict con métricas de evaluación
        """
        results = {
            "intent_accuracy": 0.0,
            "confidence_calibration": 0.0,
            "entity_extraction_score": 0.0,
            "overall_score": 0.0,
            "details": {}
        }
        
        # Parsear respuesta si es string JSON
        if isinstance(response, str):
            try:
                response = json.loads(response)
            except json.JSONDecodeError:
                response = {"intent": "conversation", "confidence": 0.5}
        
        detected_intent = response.get("intent", "unknown")
        confidence = response.get("confidence", 0.0)
        detected_entities = response.get("entities", {})
        
        # 1. Evaluar precisión de intención
        if ground_truth:
            expected_intent = ground_truth.get("intent")
            results["intent_accuracy"] = 1.0 if detected_intent == expected_intent else 0.0
            results["details"]["expected_intent"] = expected_intent
            results["details"]["detected_intent"] = detected_intent
            results["details"]["intent_match"] = detected_intent == expected_intent
        else:
            # Sin ground truth, evaluar basándose en keywords
            results["intent_accuracy"] = self._evaluate_intent_by_keywords(query, detected_intent)
            
        # 2. Evaluar calibración de confianza
        results["confidence_calibration"] = self._evaluate_confidence_calibration(
            detected_intent, 
            confidence, 
            results["intent_accuracy"]
        )
        results["details"]["confidence"] = confidence
        
        # 3. Evaluar extracción de entidades
        if ground_truth and "entities" in ground_truth:
            results["entity_extraction_score"] = self._evaluate_entity_extraction(
                detected_entities,
                ground_truth["entities"]
            )
            results["details"]["expected_entities"] = ground_truth["entities"]
            results["details"]["detected_entities"] = detected_entities
        else:
            # Evaluar si las entidades extraídas son válidas para el contexto
            results["entity_extraction_score"] = self._evaluate_entities_validity(
                detected_entities,
                query
            )
            
        # 4. Calcular score general
        results["overall_score"] = (
            results["intent_accuracy"] * 0.5 +
            results["confidence_calibration"] * 0.2 +
            results["entity_extraction_score"] * 0.3
        )
        
        # 5. Agregar validación de intención válida
        results["details"]["valid_intent"] = detected_intent in self.VALID_INTENTS
        
        return results
    
    def _evaluate_intent_by_keywords(self, query: str, detected_intent: str) -> float:
        """Evalúa intención basándose en keywords cuando no hay ground truth."""
        query_lower = query.lower()
        
        if detected_intent not in self.INTENT_KEYWORDS:
            return 0.0
            
        keywords = self.INTENT_KEYWORDS[detected_intent]
        matches = sum(1 for kw in keywords if kw in query_lower)
        
        if matches > 0:
            return min(1.0, matches * 0.5)
        
        # Verificar si algún otro intent tiene mejor match
        best_match = 0
        for intent, kws in self.INTENT_KEYWORDS.items():
            match_count = sum(1 for kw in kws if kw in query_lower)
            best_match = max(best_match, match_count)
            
        if best_match == 0:
            # Query ambiguo, dar crédito parcial
            return 0.5
            
        return 0.0
    
    def _evaluate_confidence_calibration(
        self, 
        intent: str, 
        confidence: float, 
        accuracy: float
    ) -> float:
        """
        Evalúa si la confianza está bien calibrada.
        Una buena calibración significa:
        - Alta confianza cuando el intent es correcto
        - Baja confianza cuando el intent es incorrecto
        """
        if accuracy == 1.0:
            # Intent correcto: la confianza debería ser alta
            return min(1.0, confidence / self.threshold)
        else:
            # Intent incorrecto: la confianza debería ser baja
            if confidence < self.threshold:
                return 1.0 - confidence  # Menor confianza = mejor
            return 0.0
    
    def _evaluate_entity_extraction(
        self,
        detected: Dict[str, Any],
        expected: Dict[str, Any]
    ) -> float:
        """Evalúa precisión de extracción de entidades."""
        if not expected:
            return 1.0 if not detected else 0.5
            
        if not detected:
            return 0.0
            
        matches = 0
        total = len(expected)
        
        for key, value in expected.items():
            if key in detected:
                if detected[key] == value:
                    matches += 1
                elif str(detected[key]).lower() == str(value).lower():
                    matches += 0.8  # Partial match
                    
        return matches / total if total > 0 else 0.0
    
    def _evaluate_entities_validity(
        self,
        entities: Dict[str, Any],
        query: str
    ) -> float:
        """Evalúa si las entidades extraídas son válidas para el query."""
        if not entities:
            # Algunas queries no tienen entidades
            return 0.7
            
        # Verificar que los valores de entidades aparezcan en el query
        valid_count = 0
        for key, value in entities.items():
            if value and str(value).lower() in query.lower():
                valid_count += 1
                
        if len(entities) == 0:
            return 0.7
            
        return valid_count / len(entities)


def create_intent_evaluator(model_config: Dict[str, Any] = None) -> IntentDetectionEvaluator:
    """Factory function para crear evaluador de intenciones."""
    return IntentDetectionEvaluator(model_config=model_config)


# Ejemplo de uso
if __name__ == "__main__":
    evaluator = IntentDetectionEvaluator()
    
    # Test case 1: Query de consulta de datos
    result = evaluator(
        query="Muéstrame las ventas del mes pasado",
        response={
            "intent": "query_data",
            "confidence": 0.92,
            "entities": {
                "collection": "ventas",
                "timeframe": "mes pasado"
            }
        },
        ground_truth={
            "intent": "query_data",
            "entities": {
                "collection": "ventas",
                "timeframe": "mes pasado"
            }
        }
    )
    print("Test 1 - Query Data:", json.dumps(result, indent=2))
    
    # Test case 2: Crear registro
    result = evaluator(
        query="Registra una nueva venta de 50 unidades a $10,000",
        response={
            "intent": "create_record",
            "confidence": 0.88,
            "entities": {
                "collection": "ventas",
                "cantidad": 50,
                "monto": 10000
            }
        },
        ground_truth={
            "intent": "create_record",
            "entities": {
                "collection": "ventas",
                "cantidad": 50,
                "monto": 10000
            }
        }
    )
    print("\nTest 2 - Create Record:", json.dumps(result, indent=2))
