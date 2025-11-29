"""
CHRONOS AI Evaluation Framework - Configuration
================================================

Configuración central para el framework de evaluación del sistema CHRONOS.
"""

import os
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum


class EvaluationService(Enum):
    """Servicios de IA disponibles para evaluación."""
    MEGA_AI_AGENT = "MegaAIAgent"
    FORM_AUTOMATION = "AIFormAutomation"
    POWER_BI = "AIPowerBI"
    SCHEDULED_REPORTS = "AIScheduledReports"
    USER_LEARNING = "UserLearning"


class IntentType(Enum):
    """Tipos de intención detectables por MegaAIAgent."""
    QUERY_DATA = "query_data"
    CREATE_RECORD = "create_record"
    UPDATE_RECORD = "update_record"
    GENERATE_REPORT = "generate_report"
    SCHEDULE_REPORT = "schedule_report"
    NAVIGATE = "navigate"
    EXPORT = "export"
    ANALYZE = "analyze"
    CONVERSATION = "conversation"
    HELP = "help"


class CollectionName(Enum):
    """Colecciones Firestore disponibles (33 total según ESTRATEGIA)."""
    # Operaciones
    VENTAS = "ventas"
    COMPRAS = "compras"
    ORDENES_COMPRA = "ordenesCompra"
    COTIZACIONES = "cotizaciones"
    DEVOLUCIONES = "devoluciones"
    
    # Inventario
    PRODUCTOS = "productos"
    ALMACEN = "almacen"
    ALMACEN_MOVIMIENTOS = "almacen_movimientos"
    
    # Relaciones
    CLIENTES = "clientes"
    DISTRIBUIDORES = "distribuidores"
    PROVEEDORES = "proveedores"
    
    # Finanzas - 7 Bancos
    BANCOS = "bancos"
    BOVEDA_MONTE = "boveda_monte"
    BOVEDA_USA = "boveda_usa"
    UTILIDADES = "utilidades"
    FLETE_SUR = "flete_sur"
    AZTECA = "azteca"
    LEFTIE = "leftie"
    PROFIT = "profit"
    
    # Gastos y Pagos
    GASTOS = "gastos"
    PAGOS = "pagos"


@dataclass
class ModelConfig:
    """Configuración del modelo LLM para evaluaciones prompt-based."""
    provider: str = "azure"  # "azure" o "openai"
    
    # Azure OpenAI
    azure_endpoint: Optional[str] = None
    azure_deployment: Optional[str] = None
    azure_api_key: Optional[str] = None
    azure_api_version: str = "2025-04-01-preview"
    
    # OpenAI
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    openai_base_url: Optional[str] = None
    
    def __post_init__(self):
        """Cargar configuración desde variables de entorno."""
        # Azure OpenAI
        self.azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", self.azure_endpoint)
        self.azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", self.azure_deployment)
        self.azure_api_key = os.getenv("AZURE_OPENAI_API_KEY", self.azure_api_key)
        
        # OpenAI
        self.openai_api_key = os.getenv("OPENAI_API_KEY", self.openai_api_key)
        self.openai_model = os.getenv("OPENAI_MODEL", self.openai_model)
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", self.openai_base_url)
        
        # Detectar provider automáticamente
        if self.azure_endpoint and self.azure_api_key:
            self.provider = "azure"
        elif self.openai_api_key:
            self.provider = "openai"


@dataclass
class EvaluationThresholds:
    """Umbrales mínimos para cada métrica de evaluación."""
    intent_detection_accuracy: float = 0.85
    response_relevance: float = 0.80
    business_logic_accuracy: float = 0.99  # Muy alto porque es crítico
    form_autofill_accuracy: float = 0.75
    kpi_accuracy: float = 0.90
    report_quality: float = 0.80
    user_learning_accuracy: float = 0.75
    
    # Tolerancias para cálculos numéricos
    numeric_tolerance: float = 0.01  # 1% de tolerancia
    currency_tolerance: float = 0.005  # 0.5% para montos


@dataclass
class BusinessLogicConfig:
    """Configuración de lógica de negocio para evaluación."""
    # Distribución de ventas (porcentajes por defecto según LOGICA_CORRECTA)
    default_distribution: Dict[str, float] = field(default_factory=lambda: {
        "boveda_monte": 80.0,
        "fletes": 10.0,
        "utilidades": 10.0
    })
    
    # Estados de pago válidos
    payment_states: List[str] = field(default_factory=lambda: [
        "Pendiente",
        "Parcial", 
        "Pagado",
        "Completado"
    ])
    
    # Bancos disponibles (7 según arquitectura)
    banks: List[str] = field(default_factory=lambda: [
        "boveda_monte",
        "boveda_usa", 
        "utilidades",
        "flete_sur",
        "azteca",
        "leftie",
        "profit"
    ])
    
    # Fórmulas de cálculo
    @staticmethod
    def calculate_sale_distribution(
        precio_venta_unidad: float,
        precio_compra_unidad: float,
        precio_flete: float,
        cantidad: int
    ) -> Dict[str, float]:
        """
        Calcula la distribución correcta de una venta según FORMULAS_CORRECTAS_VENTAS.
        
        Returns:
            Dict con montos para cada banco:
            - boveda_monte: precioCompraUnidad * cantidad (COSTO)
            - fletes: precioFlete * cantidad
            - utilidades: (precioVenta - precioCompra - precioFlete) * cantidad (GANANCIA NETA)
        """
        return {
            "boveda_monte": precio_compra_unidad * cantidad,
            "fletes": precio_flete * cantidad,
            "utilidades": (precio_venta_unidad - precio_compra_unidad - precio_flete) * cantidad
        }
    
    @staticmethod
    def calculate_capital(historico_ingresos: float, historico_gastos: float) -> float:
        """
        Calcula el capital actual de un banco.
        Formula: capitalActual = historicoIngresos - historicoGastos
        """
        return historico_ingresos - historico_gastos


@dataclass
class DatasetPaths:
    """Rutas de datasets para evaluación."""
    base_dir: str = "evaluation/datasets"
    
    # Datasets generados
    mega_ai_queries: str = "datasets/mega_ai_agent_queries.jsonl"
    form_automation: str = "datasets/form_automation_test.jsonl"
    business_logic: str = "datasets/business_logic_test.jsonl"
    kpi_test: str = "datasets/kpi_test.jsonl"
    report_test: str = "datasets/report_test.jsonl"
    user_learning: str = "datasets/user_learning_test.jsonl"
    
    # CSVs originales
    csv_dir: str = "../csv"
    ventas_csv: str = "../csv/ventas.csv"
    clientes_csv: str = "../csv/clientes.csv"
    ordenes_compra_csv: str = "../csv/ordenes_compra_clean.csv"
    distribuidores_csv: str = "../csv/distribuidores_clean.csv"
    almacen_csv: str = "../csv/almacen.csv"


@dataclass
class EvaluationConfig:
    """Configuración principal del framework de evaluación."""
    # Nombre del proyecto
    project_name: str = "CHRONOS AI Evaluation"
    version: str = "1.0.0"
    
    # Configuraciones específicas
    model: ModelConfig = field(default_factory=ModelConfig)
    thresholds: EvaluationThresholds = field(default_factory=EvaluationThresholds)
    business_logic: BusinessLogicConfig = field(default_factory=BusinessLogicConfig)
    paths: DatasetPaths = field(default_factory=DatasetPaths)
    
    # Servicios a evaluar
    services_to_evaluate: List[EvaluationService] = field(default_factory=lambda: [
        EvaluationService.MEGA_AI_AGENT,
        EvaluationService.FORM_AUTOMATION,
        EvaluationService.POWER_BI,
        EvaluationService.SCHEDULED_REPORTS,
        EvaluationService.USER_LEARNING
    ])
    
    # Output
    output_dir: str = "evaluation/results"
    save_detailed_results: bool = True
    
    # Ejecución
    parallel_evaluations: bool = True
    max_workers: int = 4
    verbose: bool = True
    
    def get_model_config(self) -> Optional[Dict]:
        """
        Obtiene la configuración del modelo para Azure AI Evaluation.
        
        Returns:
            Dict con configuración del modelo o None si no está configurado.
        """
        if self.model.provider == "azure" and self.model.azure_endpoint and self.model.azure_api_key:
            return {
                "api_key": self.model.azure_api_key,
                "azure_endpoint": self.model.azure_endpoint,
                "azure_deployment": self.model.azure_deployment,
                "api_version": self.model.azure_api_version
            }
        elif self.model.provider == "openai" and self.model.openai_api_key:
            return {
                "api_key": self.model.openai_api_key,
                "model": self.model.openai_model
            }
        return None


# Instancia global de configuración
CONFIG = EvaluationConfig()


# Exportar constantes útiles
INTENT_PATTERNS = {
    IntentType.QUERY_DATA: [
        "mostrar", "ver", "cuánto", "cuantos", "lista", "dame", "busca", "consulta"
    ],
    IntentType.CREATE_RECORD: [
        "crear", "registrar", "agregar", "nueva", "nuevo", "añadir"
    ],
    IntentType.GENERATE_REPORT: [
        "reporte", "informe", "resumen", "análisis"
    ],
    IntentType.NAVIGATE: [
        "ir a", "abrir", "panel", "página", "sección"
    ],
    IntentType.ANALYZE: [
        "analiza", "analizar", "tendencia", "predicción", "proyección"
    ],
    IntentType.EXPORT: [
        "exportar", "descargar", "pdf", "excel"
    ],
    IntentType.HELP: [
        "ayuda", "help", "qué puedes", "comandos", "opciones"
    ]
}

ENTITY_KEYWORDS = {
    "ventas": ["venta", "ventas", "vender"],
    "compras": ["compra", "compras", "orden"],
    "clientes": ["cliente", "clientes"],
    "productos": ["producto", "productos", "inventario", "stock"],
    "bancos": ["banco", "bancos", "capital", "saldo"],
    "distribuidores": ["distribuidor", "distribuidores"],
    "gastos": ["gasto", "gastos"],
    "almacen": ["almacén", "almacen"]
}

TIMEFRAME_KEYWORDS = {
    "hoy": ["hoy"],
    "ayer": ["ayer"],
    "semana": ["semana"],
    "mes": ["mes"],
    "trimestre": ["trimestre"],
    "año": ["año"]
}
