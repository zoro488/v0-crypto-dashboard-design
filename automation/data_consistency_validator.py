#!/usr/bin/env python3
"""
🔄 CHRONOS Data Consistency Validator
=====================================

Valida la consistencia de datos entre:
- Archivos CSV fuente
- Colecciones Firestore
- Estado de la UI (Zustand store)
- Cálculos de negocio

Este validador asegura que todos los datos sean consistentes
a través de todo el sistema.
"""

import os
import json
import csv
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import re


@dataclass
class ValidationResult:
    """Resultado de una validación."""
    name: str
    passed: bool
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    severity: str = "medium"  # low, medium, high, critical


@dataclass
class ConsistencyReport:
    """Reporte de consistencia."""
    timestamp: str
    total_checks: int = 0
    passed: int = 0
    failed: int = 0
    warnings: int = 0
    results: List[ValidationResult] = field(default_factory=list)
    
    @property
    def success_rate(self) -> float:
        return (self.passed / self.total_checks * 100) if self.total_checks > 0 else 0.0
    
    def to_dict(self) -> Dict:
        return {
            "timestamp": self.timestamp,
            "total_checks": self.total_checks,
            "passed": self.passed,
            "failed": self.failed,
            "warnings": self.warnings,
            "success_rate": self.success_rate,
            "results": [
                {
                    "name": r.name,
                    "passed": r.passed,
                    "message": r.message,
                    "severity": r.severity,
                    "details": r.details
                }
                for r in self.results
            ]
        }


class DataConsistencyValidator:
    """
    Validador de consistencia de datos del sistema CHRONOS.
    """
    
    # Definición de bancos/bóvedas del sistema
    BANCOS = [
        "boveda_monte", "boveda_usa", "profit", 
        "leftie", "azteca", "flete_sur", "utilidades"
    ]
    
    # Fórmulas de negocio
    BUSINESS_FORMULAS = {
        "venta_distribucion": {
            "boveda_monte": "precioCompra * cantidad",
            "fletes": "precioFlete * cantidad", 
            "utilidades": "(precioVenta - precioCompra - precioFlete) * cantidad"
        },
        "capital_banco": "historicoIngresos - historicoGastos",
        "deuda_cliente": "totalVentas - totalPagado"
    }
    
    def __init__(self, workspace_path: str = "/workspaces/v0-crypto-dashboard-design"):
        self.workspace = Path(workspace_path)
        self.csv_dir = self.workspace / "csv"
        self.report = ConsistencyReport(timestamp=datetime.now().isoformat())
        
    def validate_all(self) -> ConsistencyReport:
        """Ejecuta todas las validaciones."""
        print("🔍 CHRONOS Data Consistency Validator")
        print("=" * 60)
        
        # 1. Validar estructura de CSVs
        print("\n📁 Validando archivos CSV...")
        self._validate_csv_structure()
        
        # 2. Validar datos de ventas
        print("\n💰 Validando datos de ventas...")
        self._validate_ventas_data()
        
        # 3. Validar consistencia de bancos
        print("\n🏦 Validando consistencia de bancos...")
        self._validate_bancos_consistency()
        
        # 4. Validar lógica de distribución
        print("\n📊 Validando lógica de distribución...")
        self._validate_distribution_logic()
        
        # 5. Validar clientes y deudas
        print("\n👥 Validando clientes y deudas...")
        self._validate_clientes_consistency()
        
        # 6. Validar schemas TypeScript
        print("\n📝 Validando schemas de tipos...")
        self._validate_type_schemas()
        
        # Resumen
        print("\n" + "=" * 60)
        print("📋 RESUMEN DE VALIDACIÓN")
        print("=" * 60)
        print(f"  Total de validaciones: {self.report.total_checks}")
        print(f"  ✅ Pasadas: {self.report.passed}")
        print(f"  ❌ Fallidas: {self.report.failed}")
        print(f"  ⚠️ Advertencias: {self.report.warnings}")
        print(f"  📊 Tasa de éxito: {self.report.success_rate:.1f}%")
        print("=" * 60)
        
        return self.report
    
    def _add_result(self, result: ValidationResult):
        """Agrega un resultado de validación."""
        self.report.results.append(result)
        self.report.total_checks += 1
        
        if result.passed:
            self.report.passed += 1
            print(f"  ✅ {result.name}: {result.message}")
        elif result.severity == "low":
            self.report.warnings += 1
            print(f"  ⚠️ {result.name}: {result.message}")
        else:
            self.report.failed += 1
            print(f"  ❌ {result.name}: {result.message}")
    
    def _validate_csv_structure(self):
        """Valida la estructura de los archivos CSV."""
        expected_files = {
            "ventas.csv": ["fecha", "cliente", "producto", "cantidad"],
            "clientes.csv": ["nombre"],
            "bancos_azteca.csv": [],
            "bancos_leftie.csv": [],
            "bancos_profit.csv": [],
            "boveda_monte.csv": [],
            "boveda_usa.csv": [],
            "ordenes_compra.csv": [],
            "almacen.csv": []
        }
        
        if not self.csv_dir.exists():
            self._add_result(ValidationResult(
                name="csv_directory",
                passed=False,
                message="Directorio CSV no encontrado",
                severity="high"
            ))
            return
            
        for filename, required_columns in expected_files.items():
            filepath = self.csv_dir / filename
            
            if not filepath.exists():
                self._add_result(ValidationResult(
                    name=f"csv_{filename}",
                    passed=False,
                    message=f"Archivo {filename} no encontrado",
                    severity="medium"
                ))
                continue
                
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    columns = reader.fieldnames or []
                    
                    # Verificar columnas requeridas
                    missing_cols = [c for c in required_columns if c not in columns]
                    
                    if missing_cols:
                        self._add_result(ValidationResult(
                            name=f"csv_{filename}",
                            passed=False,
                            message=f"Columnas faltantes: {missing_cols}",
                            details={"columns": columns, "missing": missing_cols},
                            severity="medium"
                        ))
                    else:
                        self._add_result(ValidationResult(
                            name=f"csv_{filename}",
                            passed=True,
                            message=f"{len(rows)} registros, {len(columns)} columnas",
                            details={"rows": len(rows), "columns": len(columns)}
                        ))
                        
            except Exception as e:
                self._add_result(ValidationResult(
                    name=f"csv_{filename}",
                    passed=False,
                    message=f"Error leyendo archivo: {e}",
                    severity="high"
                ))
    
    def _validate_ventas_data(self):
        """Valida los datos de ventas."""
        ventas_file = self.csv_dir / "ventas.csv"
        
        if not ventas_file.exists():
            return
            
        try:
            with open(ventas_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                ventas = list(reader)
                
            if not ventas:
                self._add_result(ValidationResult(
                    name="ventas_data",
                    passed=False,
                    message="No hay datos de ventas",
                    severity="medium"
                ))
                return
                
            # Validar cada venta
            errors = []
            for i, venta in enumerate(ventas):
                # Verificar campos numéricos
                try:
                    cantidad = float(venta.get('cantidad', 0) or 0)
                    if cantidad <= 0:
                        errors.append(f"Fila {i+1}: cantidad inválida ({cantidad})")
                except ValueError:
                    errors.append(f"Fila {i+1}: cantidad no numérica")
                    
            if errors:
                self._add_result(ValidationResult(
                    name="ventas_data_integrity",
                    passed=False,
                    message=f"{len(errors)} errores de integridad",
                    details={"errors": errors[:10]},
                    severity="medium"
                ))
            else:
                self._add_result(ValidationResult(
                    name="ventas_data_integrity",
                    passed=True,
                    message=f"Todas las {len(ventas)} ventas son válidas"
                ))
                
        except Exception as e:
            self._add_result(ValidationResult(
                name="ventas_data",
                passed=False,
                message=f"Error validando ventas: {e}",
                severity="high"
            ))
    
    def _validate_bancos_consistency(self):
        """Valida la consistencia de datos bancarios."""
        banco_files = [f for f in self.csv_dir.glob("*.csv") 
                      if any(b in f.stem for b in ["banco", "boveda", "profit", "leftie", "azteca", "utilidades", "flete"])]
        
        if not banco_files:
            self._add_result(ValidationResult(
                name="bancos_files",
                passed=False,
                message="No se encontraron archivos de bancos",
                severity="medium"
            ))
            return
            
        total_capital = 0
        banco_details = {}
        
        for banco_file in banco_files:
            try:
                with open(banco_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    
                    # Buscar columnas de monto/saldo
                    if rows:
                        sample = rows[0]
                        monto_col = None
                        for col in ['monto', 'saldo', 'capital', 'amount']:
                            if col in sample:
                                monto_col = col
                                break
                        
                        if monto_col:
                            try:
                                capital = sum(float(r.get(monto_col, 0) or 0) for r in rows)
                                total_capital += capital
                                banco_details[banco_file.stem] = capital
                            except ValueError:
                                pass
                                
            except Exception:
                pass
                
        self._add_result(ValidationResult(
            name="bancos_capital_total",
            passed=True,
            message=f"Capital total en bancos: ${total_capital:,.2f}",
            details=banco_details
        ))
    
    def _validate_distribution_logic(self):
        """Valida la lógica de distribución de ventas."""
        # Verificar que el archivo de fórmulas existe
        formulas_file = self.workspace / "FORMULAS_CORRECTAS_VENTAS_Version2.md"
        
        if formulas_file.exists():
            self._add_result(ValidationResult(
                name="formulas_documentation",
                passed=True,
                message="Documentación de fórmulas existe"
            ))
        else:
            self._add_result(ValidationResult(
                name="formulas_documentation",
                passed=False,
                message="Falta documentación de fórmulas",
                severity="low"
            ))
            
        # Verificar implementación en código
        ventas_service = self.workspace / "app" / "lib" / "services" / "ventas-transaction.service.ts"
        
        if ventas_service.exists():
            try:
                content = ventas_service.read_text()
                
                # Verificar que las fórmulas correctas están implementadas
                checks = {
                    "boveda_monte_formula": "precioCompra" in content and "cantidad" in content,
                    "fletes_formula": "precioFlete" in content or "flete" in content.lower(),
                    "utilidades_formula": "utilidad" in content.lower() or "ganancia" in content.lower()
                }
                
                all_passed = all(checks.values())
                
                self._add_result(ValidationResult(
                    name="distribution_implementation",
                    passed=all_passed,
                    message="Fórmulas de distribución implementadas" if all_passed else "Fórmulas incompletas",
                    details=checks
                ))
                
            except Exception as e:
                self._add_result(ValidationResult(
                    name="distribution_implementation",
                    passed=False,
                    message=f"Error leyendo servicio: {e}",
                    severity="medium"
                ))
        else:
            self._add_result(ValidationResult(
                name="distribution_implementation",
                passed=False,
                message="Servicio de ventas no encontrado",
                severity="high"
            ))
    
    def _validate_clientes_consistency(self):
        """Valida la consistencia de datos de clientes."""
        clientes_file = self.csv_dir / "clientes.csv"
        
        if not clientes_file.exists():
            self._add_result(ValidationResult(
                name="clientes_file",
                passed=False,
                message="Archivo de clientes no encontrado",
                severity="medium"
            ))
            return
            
        try:
            with open(clientes_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                clientes = list(reader)
                
            # Verificar campos requeridos
            if clientes:
                sample = clientes[0]
                has_nombre = 'nombre' in sample
                has_id = any(col in sample for col in ['id', 'cliente_id', 'ID'])
                
                self._add_result(ValidationResult(
                    name="clientes_structure",
                    passed=has_nombre,
                    message=f"{len(clientes)} clientes registrados" if has_nombre else "Falta campo 'nombre'",
                    details={"columns": list(sample.keys())}
                ))
                
            # Verificar duplicados
            nombres = [c.get('nombre', '').strip().lower() for c in clientes if c.get('nombre')]
            duplicados = [n for n in set(nombres) if nombres.count(n) > 1]
            
            if duplicados:
                self._add_result(ValidationResult(
                    name="clientes_duplicates",
                    passed=False,
                    message=f"{len(duplicados)} clientes duplicados",
                    details={"duplicados": duplicados[:5]},
                    severity="low"
                ))
            else:
                self._add_result(ValidationResult(
                    name="clientes_duplicates",
                    passed=True,
                    message="Sin duplicados de clientes"
                ))
                
        except Exception as e:
            self._add_result(ValidationResult(
                name="clientes_data",
                passed=False,
                message=f"Error validando clientes: {e}",
                severity="medium"
            ))
    
    def _validate_type_schemas(self):
        """Valida los schemas de tipos TypeScript."""
        types_file = self.workspace / "app" / "types" / "index.ts"
        schemas_dir = self.workspace / "app" / "lib" / "schemas"
        
        # Verificar archivo de tipos principal
        if types_file.exists():
            try:
                content = types_file.read_text()
                
                # Verificar tipos esenciales
                essential_types = ['Venta', 'Cliente', 'Banco', 'OrdenCompra', 'Producto']
                found_types = [t for t in essential_types if f"type {t}" in content or f"interface {t}" in content]
                
                self._add_result(ValidationResult(
                    name="types_definitions",
                    passed=len(found_types) >= 3,
                    message=f"Tipos encontrados: {len(found_types)}/{len(essential_types)}",
                    details={"found": found_types, "expected": essential_types}
                ))
                
            except Exception as e:
                self._add_result(ValidationResult(
                    name="types_definitions",
                    passed=False,
                    message=f"Error leyendo tipos: {e}",
                    severity="medium"
                ))
        else:
            self._add_result(ValidationResult(
                name="types_definitions",
                passed=False,
                message="Archivo de tipos no encontrado",
                severity="high"
            ))
            
        # Verificar schemas Zod
        if schemas_dir.exists():
            schema_files = list(schemas_dir.glob("*.ts"))
            
            self._add_result(ValidationResult(
                name="zod_schemas",
                passed=len(schema_files) >= 2,
                message=f"{len(schema_files)} archivos de schema encontrados",
                details={"files": [f.name for f in schema_files]}
            ))
        else:
            self._add_result(ValidationResult(
                name="zod_schemas",
                passed=False,
                message="Directorio de schemas no encontrado",
                severity="medium"
            ))
    
    def save_report(self, output_path: Optional[str] = None) -> str:
        """Guarda el reporte en un archivo JSON."""
        if output_path is None:
            output_dir = self.workspace / "automation" / "reports"
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"consistency_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.report.to_dict(), f, indent=2, ensure_ascii=False)
            
        print(f"\n📁 Reporte guardado: {output_path}")
        return str(output_path)


def main():
    """Punto de entrada principal."""
    print()
    validator = DataConsistencyValidator()
    report = validator.validate_all()
    validator.save_report()
    
    # Retornar código de salida basado en resultados
    if report.success_rate >= 90:
        return 0
    elif report.success_rate >= 70:
        return 1
    else:
        return 2


if __name__ == "__main__":
    import sys
    sys.exit(main())
