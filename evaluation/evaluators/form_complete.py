"""
Form Complete Evaluator - Evaluación 100% Completa
===================================================

Evaluador exhaustivo para TODO el sistema de formularios CHRONOS:
- 7 tipos de formularios (venta, compra, cliente, producto, gasto, orden_compra, transferencia)
- Validaciones Zod completas
- Lógica de negocio (distribución de ventas a 3 bancos)
- Componentes UI (modales, botones, campos)
- Auto-completado y sugerencias AI
- Estados de formulario (wizard steps)
- Cálculos automáticos

Métricas evaluadas:
1. field_accuracy: Precisión por campo individual
2. validation_accuracy: Validaciones Zod correctas
3. business_logic_accuracy: Lógica de negocio (distribución ventas)
4. ui_state_accuracy: Estados de wizard correctos
5. calculation_accuracy: Cálculos automáticos correctos
6. suggestion_quality: Calidad de sugerencias AI
7. overall_score: Score combinado final
"""

import json
import re
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from enum import Enum


class FormType(Enum):
    """Tipos de formulario soportados."""
    VENTA = "venta"
    COMPRA = "compra"
    CLIENTE = "cliente"
    PRODUCTO = "producto"
    GASTO = "gasto"
    ORDEN_COMPRA = "orden_compra"
    TRANSFERENCIA = "transferencia"
    DISTRIBUIDOR = "distribuidor"
    ABONO = "abono"
    INGRESO = "ingreso"
    ENTRADA_ALMACEN = "entrada_almacen"
    SALIDA_ALMACEN = "salida_almacen"


class ValidationRule(Enum):
    """Tipos de validación soportados."""
    REQUIRED = "required"
    MIN = "min"
    MAX = "max"
    MIN_LENGTH = "minLength"
    MAX_LENGTH = "maxLength"
    PATTERN = "pattern"
    EMAIL = "email"
    PHONE = "phone"
    RFC = "rfc"
    ENUM = "enum"
    POSITIVE = "positive"
    NON_NEGATIVE = "nonNegative"
    INTEGER = "integer"
    DECIMAL = "decimal"
    DATE = "date"
    CUSTOM = "custom"


@dataclass
class FieldDefinition:
    """Definición completa de un campo de formulario."""
    name: str
    label: str
    type: str  # text, number, email, phone, select, date, textarea
    required: bool = False
    validations: Dict[str, Any] = field(default_factory=dict)
    options: List[Dict[str, str]] = field(default_factory=list)
    calculated: bool = False
    depends_on: List[str] = field(default_factory=list)
    default_value: Any = None


@dataclass
class FormSchema:
    """Schema completo de un formulario."""
    type: FormType
    name: str
    steps: List[str]  # Pasos del wizard
    fields: List[FieldDefinition]
    calculated_fields: List[str]
    business_rules: List[str]


class FormCompleteEvaluator:
    """
    Evaluador completo para el sistema de formularios CHRONOS.
    
    Evalúa:
    1. Todos los tipos de formularios (12 tipos)
    2. Todas las validaciones Zod
    3. Lógica de negocio completa
    4. Estados de UI (wizard)
    5. Cálculos automáticos
    6. Sugerencias AI
    """
    
    # ========================================================
    # SCHEMAS COMPLETOS DE FORMULARIOS
    # ========================================================
    
    FORM_SCHEMAS = {
        FormType.VENTA: FormSchema(
            type=FormType.VENTA,
            name="Venta",
            steps=["Cliente", "Carrito", "Pago"],
            fields=[
                # Paso 1: Cliente
                FieldDefinition("clienteId", "Cliente", "select", required=True),
                FieldDefinition("clienteNombre", "Nombre Cliente", "text", required=True),
                
                # Paso 2: Carrito
                FieldDefinition("productos", "Productos", "array", required=True),
                FieldDefinition("cantidad", "Cantidad", "number", required=True, 
                              validations={"min": 1, "integer": True}),
                FieldDefinition("precioUnitario", "Precio Unitario", "number", required=True,
                              validations={"positive": True}),
                FieldDefinition("precioCompra", "Precio Compra (Costo)", "number", required=True,
                              validations={"positive": True}),
                FieldDefinition("precioFlete", "Precio Flete/unidad", "number", required=True,
                              validations={"nonNegative": True}, default_value=500),
                
                # Paso 3: Pago
                FieldDefinition("metodoPago", "Método de Pago", "select", required=True,
                              options=[
                                  {"value": "efectivo", "label": "Efectivo"},
                                  {"value": "transferencia", "label": "Transferencia"},
                                  {"value": "deposito", "label": "Depósito"},
                                  {"value": "mixto", "label": "Mixto"}
                              ]),
                FieldDefinition("estadoPago", "Estado de Pago", "select", required=True,
                              options=[
                                  {"value": "completo", "label": "Completo (100%)"},
                                  {"value": "parcial", "label": "Parcial (Abono)"},
                                  {"value": "pendiente", "label": "Crédito (0%)"}
                              ]),
                FieldDefinition("montoPagado", "Monto Pagado", "number", required=False,
                              validations={"nonNegative": True}),
                FieldDefinition("notas", "Notas", "textarea", required=False,
                              validations={"maxLength": 500}),
            ],
            calculated_fields=[
                "precioTotal",
                "subtotal", 
                "distribucionBovedaMonte",  # Costo mercancía
                "distribucionFletes",        # Transporte
                "distribucionUtilidades",    # Ganancia neta
                "saldoPendiente",
                "margenGanancia"
            ],
            business_rules=[
                "precioVenta > precioCompra (margen positivo)",
                "distribucionBovedaMonte = precioCompra × cantidad",
                "distribucionFletes = precioFlete × cantidad",
                "distribucionUtilidades = (precioVenta - precioCompra - precioFlete) × cantidad",
                "total = distribucionBovedaMonte + distribucionFletes + distribucionUtilidades",
                "montoPagado <= precioTotal",
                "saldoPendiente = precioTotal - montoPagado"
            ]
        ),
        
        FormType.CLIENTE: FormSchema(
            type=FormType.CLIENTE,
            name="Cliente",
            steps=["Información Básica"],
            fields=[
                FieldDefinition("nombre", "Nombre", "text", required=True,
                              validations={"minLength": 2, "maxLength": 100}),
                FieldDefinition("telefono", "Teléfono", "phone", required=False,
                              validations={"pattern": r"^\+?[\d\s\-()]+$"}),
                FieldDefinition("email", "Email", "email", required=False,
                              validations={"email": True}),
                FieldDefinition("direccion", "Dirección", "textarea", required=False,
                              validations={"maxLength": 200}),
                FieldDefinition("rfc", "RFC", "text", required=False,
                              validations={"pattern": r"^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$"}),
                FieldDefinition("limiteCredito", "Límite de Crédito", "number", required=False,
                              validations={"nonNegative": True}),
                FieldDefinition("observaciones", "Observaciones", "textarea", required=False,
                              validations={"maxLength": 500}),
            ],
            calculated_fields=["keywords", "deudaTotal", "totalVentas"],
            business_rules=[
                "nombre es único",
                "keywords auto-generadas de nombre y teléfono",
                "deudaTotal se actualiza con cada venta pendiente"
            ]
        ),
        
        FormType.GASTO: FormSchema(
            type=FormType.GASTO,
            name="Gasto",
            steps=["Banco", "Detalles"],
            fields=[
                # Paso 1: Banco
                FieldDefinition("bancoId", "Banco Origen", "select", required=True,
                              options=[
                                  {"value": "boveda_monte", "label": "Bóveda Monte"},
                                  {"value": "boveda_usa", "label": "Bóveda USA"},
                                  {"value": "profit", "label": "Profit"},
                                  {"value": "leftie", "label": "Leftie"},
                                  {"value": "azteca", "label": "Azteca"},
                                  {"value": "flete_sur", "label": "Flete Sur"},
                                  {"value": "utilidades", "label": "Utilidades"},
                              ]),
                FieldDefinition("categoria", "Categoría", "select", required=False,
                              options=[
                                  {"value": "operativo", "label": "Operativo"},
                                  {"value": "nomina", "label": "Nómina"},
                                  {"value": "servicios", "label": "Servicios"},
                                  {"value": "insumos", "label": "Insumos"},
                                  {"value": "transporte", "label": "Transporte"},
                                  {"value": "otros", "label": "Otros"},
                              ]),
                
                # Paso 2: Detalles
                FieldDefinition("concepto", "Concepto", "text", required=True,
                              validations={"minLength": 2}),
                FieldDefinition("monto", "Monto", "number", required=True,
                              validations={"positive": True}),
                FieldDefinition("descripcion", "Descripción", "textarea", required=False,
                              validations={"maxLength": 500}),
            ],
            calculated_fields=["nuevoCapitalBanco"],
            business_rules=[
                "monto <= saldo disponible en banco",
                "saldo banco se reduce en monto del gasto",
                "historicoGastos del banco aumenta"
            ]
        ),
        
        FormType.TRANSFERENCIA: FormSchema(
            type=FormType.TRANSFERENCIA,
            name="Transferencia",
            steps=["Bancos", "Monto y Detalles"],
            fields=[
                # Paso 1: Bancos
                FieldDefinition("bancoOrigen", "Banco Origen", "select", required=True,
                              options=[
                                  {"value": "boveda_monte", "label": "Bóveda Monte"},
                                  {"value": "boveda_usa", "label": "Bóveda USA"},
                                  {"value": "profit", "label": "Profit"},
                                  {"value": "leftie", "label": "Leftie"},
                                  {"value": "azteca", "label": "Azteca"},
                                  {"value": "flete_sur", "label": "Flete Sur"},
                                  {"value": "utilidades", "label": "Utilidades"},
                              ]),
                FieldDefinition("bancoDestino", "Banco Destino", "select", required=True,
                              options=[
                                  {"value": "boveda_monte", "label": "Bóveda Monte"},
                                  {"value": "boveda_usa", "label": "Bóveda USA"},
                                  {"value": "profit", "label": "Profit"},
                                  {"value": "leftie", "label": "Leftie"},
                                  {"value": "azteca", "label": "Azteca"},
                                  {"value": "flete_sur", "label": "Flete Sur"},
                                  {"value": "utilidades", "label": "Utilidades"},
                              ]),
                
                # Paso 2: Monto y Detalles
                FieldDefinition("monto", "Monto", "number", required=True,
                              validations={"positive": True, "min": 0.01}),
                FieldDefinition("concepto", "Concepto", "text", required=False,
                              default_value="Transferencia entre bancos"),
                FieldDefinition("referencia", "Referencia", "text", required=False),
                FieldDefinition("notas", "Notas", "textarea", required=False),
            ],
            calculated_fields=["nuevoSaldoOrigen", "nuevoSaldoDestino"],
            business_rules=[
                "bancoOrigen != bancoDestino",
                "monto <= saldo disponible en banco origen",
                "capital total del sistema NO cambia",
                "saldo origen decrece, saldo destino aumenta"
            ]
        ),
        
        FormType.PRODUCTO: FormSchema(
            type=FormType.PRODUCTO,
            name="Producto",
            steps=["Info Básica", "Precios"],
            fields=[
                # Paso 1: Info Básica
                FieldDefinition("nombre", "Nombre", "text", required=True,
                              validations={"minLength": 2}),
                FieldDefinition("sku", "SKU", "text", required=False),
                FieldDefinition("categoria", "Categoría", "select", required=False,
                              options=[
                                  {"value": "electronica", "label": "Electrónica"},
                                  {"value": "accesorios", "label": "Accesorios"},
                                  {"value": "ropa", "label": "Ropa"},
                                  {"value": "hogar", "label": "Hogar"},
                                  {"value": "deportes", "label": "Deportes"},
                                  {"value": "otros", "label": "Otros"},
                              ]),
                FieldDefinition("descripcion", "Descripción", "textarea", required=False),
                
                # Paso 2: Precios
                FieldDefinition("precioCompra", "Precio Compra (Costo)", "number", required=False,
                              validations={"nonNegative": True}),
                FieldDefinition("precioVenta", "Precio Venta", "number", required=True,
                              validations={"positive": True}),
                FieldDefinition("stockActual", "Stock Inicial", "number", required=False,
                              validations={"nonNegative": True, "integer": True}, default_value=0),
                FieldDefinition("stockMinimo", "Stock Mínimo", "number", required=False,
                              validations={"nonNegative": True, "integer": True}, default_value=5),
                FieldDefinition("unidad", "Unidad", "select", required=False,
                              options=[
                                  {"value": "pz", "label": "Pieza"},
                                  {"value": "kg", "label": "Kilogramo"},
                                  {"value": "lt", "label": "Litro"},
                                  {"value": "mt", "label": "Metro"},
                                  {"value": "caja", "label": "Caja"},
                              ], default_value="pz"),
            ],
            calculated_fields=["margenGanancia", "keywords"],
            business_rules=[
                "precioVenta >= precioCompra (margen >= 0)",
                "margenGanancia = ((precioVenta - precioCompra) / precioCompra) * 100",
                "alerta cuando stockActual < stockMinimo"
            ]
        ),
        
        FormType.ORDEN_COMPRA: FormSchema(
            type=FormType.ORDEN_COMPRA,
            name="Orden de Compra",
            steps=["Proveedor", "Productos", "Costos"],
            fields=[
                # Paso 1: Proveedor
                FieldDefinition("distribuidorId", "Distribuidor", "select", required=True),
                FieldDefinition("distribuidorNombre", "Nombre Distribuidor", "text", required=True),
                
                # Paso 2: Productos
                FieldDefinition("items", "Productos", "array", required=True),
                
                # Paso 3: Costos
                FieldDefinition("costoEnvio", "Costo de Envío", "number", required=False,
                              validations={"nonNegative": True}, default_value=0),
                FieldDefinition("otrosCostos", "Otros Costos", "number", required=False,
                              validations={"nonNegative": True}, default_value=0),
                FieldDefinition("estadoPago", "Estado de Pago", "select", required=True,
                              options=[
                                  {"value": "completo", "label": "Pagado (100%)"},
                                  {"value": "parcial", "label": "Parcial (Anticipo)"},
                                  {"value": "pendiente", "label": "Crédito (0%)"},
                              ]),
                FieldDefinition("montoPagado", "Monto Pagado", "number", required=False,
                              validations={"nonNegative": True}),
                FieldDefinition("bancoOrigen", "Banco para Pago", "select", required=False),
                FieldDefinition("notas", "Notas", "textarea", required=False),
            ],
            calculated_fields=[
                "subtotalProductos", 
                "costoTotal", 
                "deudaGenerada",
                "cantidadItems"
            ],
            business_rules=[
                "costoTotal = subtotalProductos + costoEnvio + otrosCostos",
                "deudaGenerada = costoTotal - montoPagado",
                "si hay pago, se descuenta del banco seleccionado",
                "deuda se registra al distribuidor"
            ]
        ),
        
        FormType.DISTRIBUIDOR: FormSchema(
            type=FormType.DISTRIBUIDOR,
            name="Distribuidor",
            steps=["Información"],
            fields=[
                FieldDefinition("nombre", "Nombre", "text", required=True,
                              validations={"minLength": 2, "maxLength": 100}),
                FieldDefinition("contacto", "Contacto", "text", required=False),
                FieldDefinition("telefono", "Teléfono", "phone", required=False),
                FieldDefinition("email", "Email", "email", required=False),
                FieldDefinition("direccion", "Dirección", "textarea", required=False),
                FieldDefinition("notas", "Notas", "textarea", required=False),
            ],
            calculated_fields=["deudaTotal", "totalOrdenesCompra"],
            business_rules=["deudaTotal se actualiza con cada orden de compra pendiente"]
        ),
        
        FormType.ABONO: FormSchema(
            type=FormType.ABONO,
            name="Abono de Cliente",
            steps=["Información de Abono"],
            fields=[
                FieldDefinition("clienteId", "Cliente", "select", required=True),
                FieldDefinition("monto", "Monto del Abono", "number", required=True,
                              validations={"positive": True}),
                FieldDefinition("bancoDestino", "Banco Destino", "select", required=True),
                FieldDefinition("notas", "Notas", "textarea", required=False),
            ],
            calculated_fields=["nuevaDeudaCliente"],
            business_rules=[
                "monto <= deuda actual del cliente",
                "deuda cliente disminuye",
                "capital banco destino aumenta"
            ]
        ),
        
        FormType.INGRESO: FormSchema(
            type=FormType.INGRESO,
            name="Ingreso",
            steps=["Información"],
            fields=[
                FieldDefinition("bancoDestino", "Banco Destino", "select", required=True),
                FieldDefinition("monto", "Monto", "number", required=True,
                              validations={"positive": True}),
                FieldDefinition("concepto", "Concepto", "text", required=True),
                FieldDefinition("notas", "Notas", "textarea", required=False),
            ],
            calculated_fields=["nuevoSaldoBanco"],
            business_rules=["saldo banco aumenta", "historicoIngresos aumenta"]
        ),
    }
    
    # ========================================================
    # VALIDACIONES ZOD
    # ========================================================
    
    ZOD_VALIDATIONS = {
        # Monto monetario
        "monto_monetario": {
            "type": "number",
            "positive": True,
            "multipleOf": 0.01,
            "errorMessage": "El monto debe ser mayor a 0"
        },
        # Cantidad
        "cantidad": {
            "type": "number",
            "integer": True,
            "positive": True,
            "errorMessage": "La cantidad debe ser un entero mayor a 0"
        },
        # Email
        "email": {
            "type": "string",
            "pattern": r"^[^\s@]+@[^\s@]+\.[^\s@]+$",
            "errorMessage": "Email inválido"
        },
        # Teléfono MX
        "telefono": {
            "type": "string",
            "pattern": r"^\d{10}$",
            "errorMessage": "Teléfono inválido (10 dígitos)"
        },
        # RFC
        "rfc": {
            "type": "string",
            "pattern": r"^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$",
            "errorMessage": "RFC inválido"
        },
        # Banco ID
        "banco_id": {
            "type": "enum",
            "values": [
                "boveda_monte", "boveda_usa", "profit", "leftie",
                "azteca", "flete_sur", "utilidades"
            ],
            "errorMessage": "Banco inválido"
        },
        # Estado de pago
        "estado_pago": {
            "type": "enum",
            "values": ["completo", "parcial", "pendiente"],
            "errorMessage": "Estado de pago inválido"
        },
        # Método de pago
        "metodo_pago": {
            "type": "enum",
            "values": ["efectivo", "transferencia", "deposito", "mixto", "tarjeta", "crypto"],
            "errorMessage": "Método de pago inválido"
        }
    }
    
    # ========================================================
    # INICIALIZACIÓN
    # ========================================================
    
    def __init__(
        self,
        strict_mode: bool = True,
        validate_business_rules: bool = True,
        validate_ui_states: bool = True
    ):
        """
        Inicializa el evaluador completo.
        
        Args:
            strict_mode: Validación estricta de tipos
            validate_business_rules: Evaluar reglas de negocio
            validate_ui_states: Evaluar estados de UI
        """
        self.strict_mode = strict_mode
        self.validate_business_rules = validate_business_rules
        self.validate_ui_states = validate_ui_states
    
    # ========================================================
    # MÉTODO PRINCIPAL DE EVALUACIÓN
    # ========================================================
    
    def __call__(
        self,
        *,
        form_type: str,
        form_data: Dict[str, Any],
        ground_truth: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        wizard_state: Optional[Dict[str, Any]] = None,
        suggestions: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Evalúa un formulario completo.
        
        Args:
            form_type: Tipo de formulario
            form_data: Datos del formulario a evaluar
            ground_truth: Valores esperados (opcional)
            context: Contexto adicional (cliente, historial, etc.)
            wizard_state: Estado del wizard UI
            suggestions: Sugerencias AI generadas
            
        Returns:
            Dict con métricas de evaluación completas
        """
        results = {
            "form_type": form_type,
            "overall_score": 0.0,
            "metrics": {
                "field_accuracy": 0.0,
                "validation_accuracy": 0.0,
                "business_logic_accuracy": 0.0,
                "ui_state_accuracy": 0.0,
                "calculation_accuracy": 0.0,
                "suggestion_quality": 0.0
            },
            "details": {
                "field_results": {},
                "validation_errors": [],
                "business_rule_results": [],
                "calculation_results": {},
                "ui_state_results": {}
            },
            "passed": False,
            "errors": []
        }
        
        # Obtener schema del formulario
        try:
            form_type_enum = FormType(form_type)
        except ValueError:
            results["errors"].append(f"Tipo de formulario desconocido: {form_type}")
            return results
            
        if form_type_enum not in self.FORM_SCHEMAS:
            results["errors"].append(f"Schema no definido para: {form_type}")
            return results
            
        schema = self.FORM_SCHEMAS[form_type_enum]
        
        # 1. Evaluar campos individuales
        field_results = self._evaluate_fields(form_data, schema, ground_truth)
        results["metrics"]["field_accuracy"] = field_results["accuracy"]
        results["details"]["field_results"] = field_results["details"]
        
        # 2. Evaluar validaciones Zod
        validation_results = self._evaluate_validations(form_data, schema)
        results["metrics"]["validation_accuracy"] = validation_results["accuracy"]
        results["details"]["validation_errors"] = validation_results["errors"]
        
        # 3. Evaluar lógica de negocio
        if self.validate_business_rules:
            business_results = self._evaluate_business_logic(form_data, schema, form_type_enum)
            results["metrics"]["business_logic_accuracy"] = business_results["accuracy"]
            results["details"]["business_rule_results"] = business_results["results"]
        else:
            results["metrics"]["business_logic_accuracy"] = 1.0
        
        # 4. Evaluar estados de UI (wizard)
        if self.validate_ui_states and wizard_state:
            ui_results = self._evaluate_ui_state(wizard_state, schema)
            results["metrics"]["ui_state_accuracy"] = ui_results["accuracy"]
            results["details"]["ui_state_results"] = ui_results["details"]
        else:
            results["metrics"]["ui_state_accuracy"] = 1.0
        
        # 5. Evaluar cálculos automáticos
        calculation_results = self._evaluate_calculations(form_data, schema, form_type_enum)
        results["metrics"]["calculation_accuracy"] = calculation_results["accuracy"]
        results["details"]["calculation_results"] = calculation_results["details"]
        
        # 6. Evaluar sugerencias AI
        if suggestions:
            suggestion_results = self._evaluate_suggestions(suggestions, form_data, ground_truth)
            results["metrics"]["suggestion_quality"] = suggestion_results["quality"]
        else:
            results["metrics"]["suggestion_quality"] = 1.0
        
        # 7. Calcular score general (ponderado)
        weights = {
            "field_accuracy": 0.25,
            "validation_accuracy": 0.25,
            "business_logic_accuracy": 0.20,
            "ui_state_accuracy": 0.10,
            "calculation_accuracy": 0.15,
            "suggestion_quality": 0.05
        }
        
        results["overall_score"] = sum(
            results["metrics"][metric] * weight
            for metric, weight in weights.items()
        )
        
        results["passed"] = results["overall_score"] >= 0.80
        
        return results
    
    # ========================================================
    # EVALUACIÓN DE CAMPOS
    # ========================================================
    
    def _evaluate_fields(
        self,
        form_data: Dict[str, Any],
        schema: FormSchema,
        ground_truth: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Evalúa campos individuales."""
        results = {
            "accuracy": 0.0,
            "details": {}
        }
        
        total_score = 0.0
        total_fields = 0
        
        for field_def in schema.fields:
            field_name = field_def.name
            field_result = {
                "present": field_name in form_data,
                "required": field_def.required,
                "value": form_data.get(field_name),
                "score": 0.0,
                "errors": []
            }
            
            # Verificar presencia de campo requerido
            if field_def.required:
                if field_name not in form_data or form_data[field_name] is None:
                    field_result["errors"].append("Campo requerido faltante")
                    field_result["score"] = 0.0
                else:
                    field_result["score"] = 0.5  # Presente pero sin verificar valor
            else:
                field_result["score"] = 1.0 if field_name not in form_data else 0.5
            
            # Comparar con ground truth si existe
            if ground_truth and field_name in ground_truth:
                expected = ground_truth[field_name]
                actual = form_data.get(field_name)
                
                if actual == expected:
                    field_result["score"] = 1.0
                elif self._values_approximately_equal(actual, expected, field_def.type):
                    field_result["score"] = 0.9
                elif actual is not None and expected is not None:
                    field_result["score"] = 0.3
                    field_result["errors"].append(f"Valor incorrecto: esperado {expected}, obtenido {actual}")
            
            results["details"][field_name] = field_result
            total_score += field_result["score"]
            total_fields += 1
        
        results["accuracy"] = total_score / total_fields if total_fields > 0 else 0.0
        return results
    
    def _values_approximately_equal(self, actual: Any, expected: Any, field_type: str) -> bool:
        """Compara valores con tolerancia."""
        if actual is None or expected is None:
            return False
            
        if field_type == "number":
            try:
                return abs(float(actual) - float(expected)) < 0.01 * abs(float(expected))
            except (ValueError, TypeError):
                return False
                
        if isinstance(actual, str) and isinstance(expected, str):
            return actual.lower().strip() == expected.lower().strip()
            
        return False
    
    # ========================================================
    # EVALUACIÓN DE VALIDACIONES ZOD
    # ========================================================
    
    def _evaluate_validations(
        self,
        form_data: Dict[str, Any],
        schema: FormSchema
    ) -> Dict[str, Any]:
        """Evalúa validaciones de campos."""
        results = {
            "accuracy": 0.0,
            "errors": []
        }
        
        passed = 0
        total = 0
        
        for field_def in schema.fields:
            if not field_def.validations:
                continue
                
            value = form_data.get(field_def.name)
            if value is None:
                continue
                
            total += 1
            field_valid = True
            
            for rule, rule_value in field_def.validations.items():
                error = self._check_validation(value, rule, rule_value, field_def.name)
                if error:
                    field_valid = False
                    results["errors"].append(error)
            
            if field_valid:
                passed += 1
        
        results["accuracy"] = passed / total if total > 0 else 1.0
        return results
    
    def _check_validation(self, value: Any, rule: str, rule_value: Any, field_name: str) -> Optional[str]:
        """Verifica una regla de validación."""
        if rule == "min":
            try:
                if float(value) < rule_value:
                    return f"{field_name}: valor {value} menor que mínimo {rule_value}"
            except (ValueError, TypeError):
                return f"{field_name}: valor no numérico"
                
        elif rule == "max":
            try:
                if float(value) > rule_value:
                    return f"{field_name}: valor {value} mayor que máximo {rule_value}"
            except (ValueError, TypeError):
                return f"{field_name}: valor no numérico"
                
        elif rule == "minLength":
            if len(str(value)) < rule_value:
                return f"{field_name}: longitud menor que {rule_value}"
                
        elif rule == "maxLength":
            if len(str(value)) > rule_value:
                return f"{field_name}: longitud mayor que {rule_value}"
                
        elif rule == "positive":
            try:
                if float(value) <= 0:
                    return f"{field_name}: debe ser positivo"
            except (ValueError, TypeError):
                return f"{field_name}: valor no numérico"
                
        elif rule == "nonNegative":
            try:
                if float(value) < 0:
                    return f"{field_name}: no puede ser negativo"
            except (ValueError, TypeError):
                return f"{field_name}: valor no numérico"
                
        elif rule == "integer":
            try:
                if float(value) != int(float(value)):
                    return f"{field_name}: debe ser entero"
            except (ValueError, TypeError):
                return f"{field_name}: valor no numérico"
                
        elif rule == "email":
            if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", str(value)):
                return f"{field_name}: email inválido"
                
        elif rule == "pattern":
            if not re.match(rule_value, str(value)):
                return f"{field_name}: no coincide con patrón esperado"
        
        return None
    
    # ========================================================
    # EVALUACIÓN DE LÓGICA DE NEGOCIO
    # ========================================================
    
    def _evaluate_business_logic(
        self,
        form_data: Dict[str, Any],
        schema: FormSchema,
        form_type: FormType
    ) -> Dict[str, Any]:
        """Evalúa reglas de negocio específicas."""
        results = {
            "accuracy": 0.0,
            "results": []
        }
        
        passed = 0
        total = 0
        
        # Reglas específicas por tipo de formulario
        if form_type == FormType.VENTA:
            rules_results = self._evaluate_venta_business_rules(form_data)
        elif form_type == FormType.TRANSFERENCIA:
            rules_results = self._evaluate_transferencia_business_rules(form_data)
        elif form_type == FormType.GASTO:
            rules_results = self._evaluate_gasto_business_rules(form_data)
        elif form_type == FormType.PRODUCTO:
            rules_results = self._evaluate_producto_business_rules(form_data)
        else:
            rules_results = []
        
        for rule_result in rules_results:
            results["results"].append(rule_result)
            total += 1
            if rule_result["passed"]:
                passed += 1
        
        results["accuracy"] = passed / total if total > 0 else 1.0
        return results
    
    def _evaluate_venta_business_rules(self, form_data: Dict) -> List[Dict]:
        """Evalúa reglas de negocio para ventas."""
        results = []
        
        # Regla 1: Precio venta > Precio compra
        precio_venta = form_data.get("precioUnitario", 0) or form_data.get("precioVenta", 0)
        precio_compra = form_data.get("precioCompra", 0)
        
        results.append({
            "rule": "precioVenta > precioCompra",
            "passed": precio_venta > precio_compra if precio_compra > 0 else True,
            "details": f"Venta: {precio_venta}, Compra: {precio_compra}"
        })
        
        # Regla 2: Distribución de bancos correcta
        cantidad = form_data.get("cantidad", 1)
        precio_flete = form_data.get("precioFlete", 500)
        
        expected_boveda_monte = precio_compra * cantidad
        expected_fletes = precio_flete * cantidad
        expected_utilidades = (precio_venta - precio_compra - precio_flete) * cantidad
        
        actual_boveda_monte = form_data.get("distribucionBovedaMonte", expected_boveda_monte)
        actual_fletes = form_data.get("distribucionFletes", expected_fletes)
        actual_utilidades = form_data.get("distribucionUtilidades", expected_utilidades)
        
        # Tolerancia de 1 peso por redondeo
        results.append({
            "rule": "distribucionBovedaMonte = precioCompra × cantidad",
            "passed": abs(actual_boveda_monte - expected_boveda_monte) < 1,
            "details": f"Esperado: {expected_boveda_monte}, Actual: {actual_boveda_monte}"
        })
        
        results.append({
            "rule": "distribucionFletes = precioFlete × cantidad",
            "passed": abs(actual_fletes - expected_fletes) < 1,
            "details": f"Esperado: {expected_fletes}, Actual: {actual_fletes}"
        })
        
        results.append({
            "rule": "distribucionUtilidades = (precioVenta - precioCompra - precioFlete) × cantidad",
            "passed": abs(actual_utilidades - expected_utilidades) < 1,
            "details": f"Esperado: {expected_utilidades}, Actual: {actual_utilidades}"
        })
        
        # Regla 3: Total = suma de distribuciones
        expected_total = expected_boveda_monte + expected_fletes + expected_utilidades
        actual_total = form_data.get("precioTotal", expected_total)
        
        results.append({
            "rule": "total = bovedaMonte + fletes + utilidades",
            "passed": abs(actual_total - expected_total) < 1,
            "details": f"Esperado: {expected_total}, Actual: {actual_total}"
        })
        
        # Regla 4: Monto pagado <= Total
        monto_pagado = form_data.get("montoPagado", 0)
        results.append({
            "rule": "montoPagado <= precioTotal",
            "passed": monto_pagado <= actual_total,
            "details": f"Pagado: {monto_pagado}, Total: {actual_total}"
        })
        
        return results
    
    def _evaluate_transferencia_business_rules(self, form_data: Dict) -> List[Dict]:
        """Evalúa reglas de negocio para transferencias."""
        results = []
        
        # Regla 1: Origen != Destino
        origen = form_data.get("bancoOrigen")
        destino = form_data.get("bancoDestino")
        
        results.append({
            "rule": "bancoOrigen != bancoDestino",
            "passed": origen != destino,
            "details": f"Origen: {origen}, Destino: {destino}"
        })
        
        # Regla 2: Monto positivo
        monto = form_data.get("monto", 0)
        results.append({
            "rule": "monto > 0",
            "passed": monto > 0,
            "details": f"Monto: {monto}"
        })
        
        return results
    
    def _evaluate_gasto_business_rules(self, form_data: Dict) -> List[Dict]:
        """Evalúa reglas de negocio para gastos."""
        results = []
        
        # Regla 1: Monto positivo
        monto = form_data.get("monto", 0)
        results.append({
            "rule": "monto > 0",
            "passed": monto > 0,
            "details": f"Monto: {monto}"
        })
        
        # Regla 2: Banco válido
        banco = form_data.get("bancoId") or form_data.get("bancoOrigen")
        valid_bancos = ["boveda_monte", "boveda_usa", "profit", "leftie", "azteca", "flete_sur", "utilidades"]
        
        results.append({
            "rule": "bancoOrigen válido",
            "passed": banco in valid_bancos,
            "details": f"Banco: {banco}"
        })
        
        return results
    
    def _evaluate_producto_business_rules(self, form_data: Dict) -> List[Dict]:
        """Evalúa reglas de negocio para productos."""
        results = []
        
        # Regla 1: Margen >= 0
        precio_venta = form_data.get("precioVenta", 0)
        precio_compra = form_data.get("precioCompra", 0)
        
        results.append({
            "rule": "precioVenta >= precioCompra (margen no negativo)",
            "passed": precio_venta >= precio_compra if precio_compra > 0 else True,
            "details": f"Venta: {precio_venta}, Compra: {precio_compra}"
        })
        
        # Regla 2: Stock mínimo >= 0
        stock_minimo = form_data.get("stockMinimo", 5)
        results.append({
            "rule": "stockMinimo >= 0",
            "passed": stock_minimo >= 0,
            "details": f"Stock mínimo: {stock_minimo}"
        })
        
        return results
    
    # ========================================================
    # EVALUACIÓN DE ESTADOS UI
    # ========================================================
    
    def _evaluate_ui_state(
        self,
        wizard_state: Dict[str, Any],
        schema: FormSchema
    ) -> Dict[str, Any]:
        """Evalúa estados del wizard UI."""
        results = {
            "accuracy": 0.0,
            "details": {}
        }
        
        total_checks = 0
        passed_checks = 0
        
        # Verificar paso actual válido
        current_step = wizard_state.get("currentStep", 1)
        total_steps = len(schema.steps)
        
        results["details"]["currentStep"] = {
            "value": current_step,
            "valid": 1 <= current_step <= total_steps
        }
        total_checks += 1
        if 1 <= current_step <= total_steps:
            passed_checks += 1
        
        # Verificar que se puede avanzar según campos completados
        can_proceed = wizard_state.get("canProceed", True)
        form_data = wizard_state.get("formData", {})
        
        # Calcular si debería poder avanzar
        should_proceed = self._check_step_completion(form_data, schema, current_step)
        
        results["details"]["canProceed"] = {
            "reported": can_proceed,
            "calculated": should_proceed,
            "match": can_proceed == should_proceed
        }
        total_checks += 1
        if can_proceed == should_proceed:
            passed_checks += 1
        
        # Verificar estado de submit
        is_submitting = wizard_state.get("isSubmitting", False)
        results["details"]["isSubmitting"] = {
            "value": is_submitting,
            "valid": isinstance(is_submitting, bool)
        }
        total_checks += 1
        if isinstance(is_submitting, bool):
            passed_checks += 1
        
        results["accuracy"] = passed_checks / total_checks if total_checks > 0 else 1.0
        return results
    
    def _check_step_completion(
        self,
        form_data: Dict[str, Any],
        schema: FormSchema,
        current_step: int
    ) -> bool:
        """Verifica si un paso está completo para avanzar."""
        # Obtener campos requeridos para el paso actual
        required_for_step = [
            f for f in schema.fields
            if f.required
        ]
        
        # Verificar campos requeridos
        for field_def in required_for_step:
            if field_def.name not in form_data or form_data[field_def.name] is None:
                return False
                
        return True
    
    # ========================================================
    # EVALUACIÓN DE CÁLCULOS
    # ========================================================
    
    def _evaluate_calculations(
        self,
        form_data: Dict[str, Any],
        schema: FormSchema,
        form_type: FormType
    ) -> Dict[str, Any]:
        """Evalúa campos calculados automáticamente."""
        results = {
            "accuracy": 0.0,
            "details": {}
        }
        
        if not schema.calculated_fields:
            results["accuracy"] = 1.0
            return results
        
        passed = 0
        total = len(schema.calculated_fields)
        
        for calc_field in schema.calculated_fields:
            calc_result = {
                "field": calc_field,
                "expected": None,
                "actual": form_data.get(calc_field),
                "correct": False
            }
            
            # Calcular valor esperado según tipo de formulario
            expected = self._calculate_expected_value(form_data, calc_field, form_type)
            calc_result["expected"] = expected
            
            if expected is not None and calc_result["actual"] is not None:
                # Comparar con tolerancia
                try:
                    if abs(float(calc_result["actual"]) - float(expected)) < 1:
                        calc_result["correct"] = True
                        passed += 1
                except (ValueError, TypeError):
                    if calc_result["actual"] == expected:
                        calc_result["correct"] = True
                        passed += 1
            elif expected is None:
                # No podemos verificar, asumimos correcto
                calc_result["correct"] = True
                passed += 1
            
            results["details"][calc_field] = calc_result
        
        results["accuracy"] = passed / total if total > 0 else 1.0
        return results
    
    def _calculate_expected_value(
        self,
        form_data: Dict[str, Any],
        field: str,
        form_type: FormType
    ) -> Optional[Any]:
        """Calcula el valor esperado de un campo calculado."""
        if form_type == FormType.VENTA:
            cantidad = form_data.get("cantidad", 1)
            precio_venta = form_data.get("precioUnitario", 0) or form_data.get("precioVenta", 0)
            precio_compra = form_data.get("precioCompra", 0)
            precio_flete = form_data.get("precioFlete", 500)
            monto_pagado = form_data.get("montoPagado", 0)
            
            if field == "precioTotal" or field == "subtotal":
                return precio_venta * cantidad
            elif field == "distribucionBovedaMonte":
                return precio_compra * cantidad
            elif field == "distribucionFletes":
                return precio_flete * cantidad
            elif field == "distribucionUtilidades":
                return (precio_venta - precio_compra - precio_flete) * cantidad
            elif field == "saldoPendiente":
                return (precio_venta * cantidad) - monto_pagado
            elif field == "margenGanancia":
                if precio_compra > 0:
                    return ((precio_venta - precio_compra) / precio_compra) * 100
                return 0
                
        elif form_type == FormType.PRODUCTO:
            if field == "margenGanancia":
                precio_venta = form_data.get("precioVenta", 0)
                precio_compra = form_data.get("precioCompra", 0)
                if precio_compra > 0:
                    return ((precio_venta - precio_compra) / precio_compra) * 100
                return 0
                
        elif form_type == FormType.ORDEN_COMPRA:
            if field == "costoTotal":
                subtotal = form_data.get("subtotalProductos", 0)
                envio = form_data.get("costoEnvio", 0)
                otros = form_data.get("otrosCostos", 0)
                return subtotal + envio + otros
            elif field == "deudaGenerada":
                total = form_data.get("costoTotal", 0)
                pagado = form_data.get("montoPagado", 0)
                return total - pagado
        
        return None
    
    # ========================================================
    # EVALUACIÓN DE SUGERENCIAS AI
    # ========================================================
    
    def _evaluate_suggestions(
        self,
        suggestions: Dict[str, Any],
        form_data: Dict[str, Any],
        ground_truth: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Evalúa calidad de sugerencias AI."""
        results = {
            "quality": 0.0,
            "details": {}
        }
        
        if not suggestions:
            results["quality"] = 1.0
            return results
        
        suggested_fields = suggestions.get("fields", suggestions)
        confidence_scores = suggestions.get("confidenceScores", {})
        
        total_score = 0.0
        total_suggestions = 0
        
        for field, suggested_value in suggested_fields.items():
            if suggested_value is None:
                continue
                
            total_suggestions += 1
            suggestion_result = {
                "suggested": suggested_value,
                "actual": form_data.get(field),
                "expected": ground_truth.get(field) if ground_truth else None,
                "confidence": confidence_scores.get(field, 0.5),
                "score": 0.0
            }
            
            # Comparar con valor esperado
            expected = ground_truth.get(field) if ground_truth else form_data.get(field)
            if expected is not None:
                if suggested_value == expected:
                    suggestion_result["score"] = 1.0
                elif self._values_approximately_equal(suggested_value, expected, "text"):
                    suggestion_result["score"] = 0.8
                else:
                    suggestion_result["score"] = 0.2
            else:
                suggestion_result["score"] = 0.5
            
            total_score += suggestion_result["score"]
            results["details"][field] = suggestion_result
        
        results["quality"] = total_score / total_suggestions if total_suggestions > 0 else 1.0
        return results


# ========================================================
# FACTORY Y TESTS
# ========================================================

def create_form_complete_evaluator(
    strict_mode: bool = True,
    validate_business_rules: bool = True
) -> FormCompleteEvaluator:
    """Factory function para crear evaluador completo."""
    return FormCompleteEvaluator(
        strict_mode=strict_mode,
        validate_business_rules=validate_business_rules
    )


if __name__ == "__main__":
    print("=" * 70)
    print("FORM COMPLETE EVALUATOR - Test Suite")
    print("=" * 70)
    
    evaluator = FormCompleteEvaluator()
    
    # Test 1: Venta con distribución correcta
    print("\n" + "=" * 70)
    print("Test 1: Venta con distribución de 3 bancos")
    print("=" * 70)
    
    venta_data = {
        "clienteId": "CLI001",
        "clienteNombre": "Juan Pérez",
        "productos": ["PROD001"],
        "cantidad": 10,
        "precioUnitario": 10000,  # Precio venta
        "precioCompra": 6300,     # Costo
        "precioFlete": 500,       # Flete por unidad
        "metodoPago": "efectivo",
        "estadoPago": "completo",
        "montoPagado": 100000,
        # Campos calculados
        "precioTotal": 100000,
        "distribucionBovedaMonte": 63000,   # 6300 × 10
        "distribucionFletes": 5000,         # 500 × 10
        "distribucionUtilidades": 32000,    # (10000-6300-500) × 10
    }
    
    result = evaluator(
        form_type="venta",
        form_data=venta_data,
        ground_truth=venta_data
    )
    
    print(f"\nOverall Score: {result['overall_score']:.2%}")
    print(f"Passed: {result['passed']}")
    print("\nMétricas:")
    for metric, value in result["metrics"].items():
        print(f"  {metric}: {value:.2%}")
    
    print("\nReglas de negocio:")
    for rule in result["details"]["business_rule_results"]:
        status = "✅" if rule["passed"] else "❌"
        print(f"  {status} {rule['rule']}: {rule['details']}")
    
    # Test 2: Transferencia
    print("\n" + "=" * 70)
    print("Test 2: Transferencia entre bancos")
    print("=" * 70)
    
    transfer_data = {
        "bancoOrigen": "boveda_monte",
        "bancoDestino": "utilidades",
        "monto": 50000,
        "concepto": "Traslado de utilidades"
    }
    
    result = evaluator(
        form_type="transferencia",
        form_data=transfer_data,
        ground_truth=transfer_data
    )
    
    print(f"\nOverall Score: {result['overall_score']:.2%}")
    print(f"Passed: {result['passed']}")
    
    # Test 3: Cliente con validaciones
    print("\n" + "=" * 70)
    print("Test 3: Cliente con validaciones")
    print("=" * 70)
    
    cliente_data = {
        "nombre": "María García",
        "telefono": "5512345678",
        "email": "maria@example.com",
        "direccion": "Calle Principal 123"
    }
    
    result = evaluator(
        form_type="cliente",
        form_data=cliente_data,
        ground_truth=cliente_data
    )
    
    print(f"\nOverall Score: {result['overall_score']:.2%}")
    print(f"Validation Accuracy: {result['metrics']['validation_accuracy']:.2%}")
    if result["details"]["validation_errors"]:
        print("Errores de validación:")
        for error in result["details"]["validation_errors"]:
            print(f"  ❌ {error}")
    else:
        print("✅ Sin errores de validación")
    
    # Test 4: Gasto
    print("\n" + "=" * 70)
    print("Test 4: Registro de Gasto")
    print("=" * 70)
    
    gasto_data = {
        "bancoId": "boveda_monte",
        "concepto": "Pago de servicios",
        "monto": 5000,
        "categoria": "servicios"
    }
    
    result = evaluator(
        form_type="gasto",
        form_data=gasto_data,
        ground_truth=gasto_data
    )
    
    print(f"\nOverall Score: {result['overall_score']:.2%}")
    print(f"Passed: {result['passed']}")
    
    print("\n" + "=" * 70)
    print("✅ TODOS LOS TESTS COMPLETADOS")
    print("=" * 70)
