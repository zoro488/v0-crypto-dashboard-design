# 🧪 CHRONOS AI Evaluation Framework

Framework de evaluación completo para el sistema CHRONOS - Sistema empresarial de gestión financiera con IA.

![Tests](https://img.shields.io/badge/tests-6%2F6%20passing-brightgreen)
![Python](https://img.shields.io/badge/python-3.9%2B-blue)

## ⚡ Quick Start (Sin Dependencias de Azure)

```bash
# 1. Ir al directorio de evaluación
cd evaluation

# 2. Ejecutar pruebas unitarias (no requiere Azure)
python test_evaluators.py

# 3. Resultado esperado:
# Total: 6/6 tests passed (100%)
```

## 🚀 Evaluación Completa (Con Azure AI)

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar Azure (opcional)
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
export AZURE_OPENAI_API_KEY="your-key"

# 3. Ejecutar evaluación
python run_evaluation.py --service all
```

## 📋 Estructura del Framework

```
evaluation/
├── README.md                          # Esta documentación
├── requirements.txt                   # Dependencias Python
├── config.py                          # Configuración del framework
├── datasets/
│   ├── mega_ai_agent_queries.jsonl    # Queries de test para MegaAIAgent
│   ├── form_automation_test.jsonl     # Tests para AIFormAutomation
│   ├── business_logic_test.jsonl      # Tests de lógica de negocio
│   └── generate_datasets.py           # Script para generar datasets desde CSVs
├── evaluators/
│   ├── __init__.py
│   ├── intent_detection.py            # Evaluador de detección de intenciones
│   ├── business_logic.py              # Evaluador de lógica de negocio (distribución)
│   ├── form_autofill.py               # Evaluador de auto-llenado de formularios
│   ├── kpi_accuracy.py                # Evaluador de KPIs y dashboards
│   ├── report_quality.py              # Evaluador de calidad de reportes
│   └── user_learning.py               # Evaluador de patrones de usuario
├── prompts/
│   ├── response_relevance.prompty     # Prompt para evaluar relevancia
│   └── report_quality.prompty         # Prompt para evaluar reportes
├── run_evaluation.py                  # Script principal de evaluación
└── results/                           # Directorio para resultados
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
cd evaluation
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

```bash
# Para Azure OpenAI (recomendado)
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
export AZURE_OPENAI_API_KEY="your-api-key"
export AZURE_OPENAI_DEPLOYMENT="gpt-4"

# O para OpenAI
export OPENAI_API_KEY="your-api-key"
export OPENAI_MODEL="gpt-4"
```

### 3. Generar datasets de test

```bash
python datasets/generate_datasets.py
```

### 4. Ejecutar evaluación

```bash
python run_evaluation.py
```

## 📊 Métricas de Evaluación

### 1. Intent Detection Accuracy (MegaAIAgent)
Evalúa si el agente detecta correctamente las intenciones del usuario:
- `query_data`: Consultas de datos
- `create_record`: Crear registros
- `generate_report`: Generar reportes
- `navigate`: Navegación
- `analyze`: Análisis
- `help`: Ayuda
- `conversation`: Conversación general

### 2. Response Relevance
Mide si las respuestas son relevantes al contexto financiero de CHRONOS:
- Ventas y distribución
- Estado de bancos (7 bóvedas)
- Inventario y stock
- Clientes y distribuidores

### 3. Business Logic Accuracy
Verifica las fórmulas de distribución de ventas:
```
montoBovedaMonte = precioCompraUnidad * cantidad
montoFletes = precioFlete * cantidad  
montoUtilidades = (precioVentaUnidad - precioCompraUnidad - precioFlete) * cantidad
```

### 4. Form Autofill Accuracy (AIFormAutomation)
Evalúa la precisión del auto-llenado predictivo:
- Sugerencias basadas en patrones
- Validaciones de campos
- Campos requeridos vs opcionales

### 5. KPI Accuracy (AIPowerBI)
Verifica que los KPIs generados sean correctos:
- Total de ventas
- Capital por banco
- Stock bajo
- Métricas de clientes

### 6. Report Quality (AIScheduledReports)
Evalúa calidad de reportes:
- Completitud de datos
- Insights generados
- Formato y estructura

### 7. User Pattern Learning (UserLearning)
Mide detección de patrones:
- Acciones comunes
- Patrones de tiempo
- Patrones de navegación

## 🔧 Configuración Avanzada

### Personalizar evaluadores

Edita `config.py` para ajustar:

```python
# Umbrales de evaluación
THRESHOLDS = {
    "intent_accuracy_min": 0.85,
    "relevance_min": 0.80,
    "business_logic_tolerance": 0.01,  # 1% de tolerancia
    "form_accuracy_min": 0.75,
}

# Servicios a evaluar
SERVICES_TO_EVALUATE = [
    "MegaAIAgent",
    "AIFormAutomation",
    "AIPowerBI",
    "AIScheduledReports",
    "UserLearning"
]
```

### Agregar nuevas métricas

1. Crea un nuevo evaluador en `evaluators/`
2. Hereda de la clase base o implementa `__init__` y `__call__`
3. Agrégalo en `run_evaluation.py`

## 📈 Interpretar Resultados

Los resultados se guardan en `results/evaluation_YYYYMMDD_HHMMSS.json`:

```json
{
  "summary": {
    "total_tests": 150,
    "passed": 142,
    "failed": 8,
    "pass_rate": 0.947
  },
  "metrics": {
    "intent_detection_accuracy": 0.92,
    "response_relevance": 0.88,
    "business_logic_accuracy": 0.99,
    "form_autofill_accuracy": 0.78,
    "kpi_accuracy": 0.95,
    "report_quality": 0.85,
    "user_learning_accuracy": 0.82
  },
  "details": {...}
}
```

## 🔗 Integración con CI/CD

Agrega a tu pipeline:

```yaml
- name: Run AI Evaluation
  run: |
    cd evaluation
    pip install -r requirements.txt
    python run_evaluation.py --output results/
    python check_thresholds.py --min-pass-rate 0.90
```

## 📚 Referencias

- [Azure AI Evaluation SDK](https://learn.microsoft.com/azure/ai-studio/how-to/evaluate-sdk)
- [CHRONOS System Documentation](../ESTRATEGIA_DEFINITIVA_V0_SPLINE_FIREBASE_COMPLETA.md)
- [Business Logic Formulas](../FORMULAS_CORRECTAS_VENTAS_Version2.md)
