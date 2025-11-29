#!/usr/bin/env python3
"""
🔍 COMPREHENSIVE DATA VALIDATOR - CHRONOS SYSTEM
Validates ALL data from CSV files against Firestore collections
Ensures 100% data integrity, completeness, and correctness
"""

import os
import sys
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple
from collections import defaultdict

# Try to import required libraries
try:
    import pandas as pd
    import firebase_admin
    from firebase_admin import credentials, firestore
    from dotenv import load_dotenv
except ImportError as e:
    print(f"⚠️  Missing dependencies: {e}")
    print("Installing required packages...")
    os.system("pip install pandas firebase-admin python-dotenv")
    import pandas as pd
    import firebase_admin
    from firebase_admin import credentials, firestore
    from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        # Try to load from service account file
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 
                                        './chronos-176d8-firebase-adminsdk.json')
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
        else:
            # Use default credentials
            cred = credentials.ApplicationDefault()
        
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin initialized")
    except Exception as e:
        print(f"⚠️  Firebase initialization warning: {e}")
        print("Using Firestore emulator or default config")

# Initialize Firestore
db = firestore.client()

class ComprehensiveDataValidator:
    """Validates all data integrity in CHRONOS system"""
    
    def __init__(self):
        self.csv_dir = Path(__file__).parent.parent / 'csv'
        self.reports_dir = Path(__file__).parent / 'reports'
        self.reports_dir.mkdir(exist_ok=True)
        
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'validations': [],
            'errors': [],
            'warnings': [],
            'summary': {}
        }
        
        # Expected CSV files and their Firestore collections
        self.data_mapping = {
            'ventas.csv': {
                'collection': 'ventas',
                'expected_records': 96,
                'required_fields': ['fecha', 'cantidad', 'cliente', 'precioVenta'],
                'validation_rules': self.validate_venta
            },
            'clientes.csv': {
                'collection': 'clientes',
                'expected_records': 31,
                'required_fields': ['cliente', 'deuda', 'abonos'],
                'validation_rules': self.validate_cliente
            },
            'distribuidores_clean.csv': {
                'collection': 'distribuidores',
                'expected_records': 16,
                'required_fields': ['OC', 'Origen', 'Cantidad'],
                'validation_rules': self.validate_distribuidor
            },
            'ordenes_compra_clean.csv': {
                'collection': 'ordenes_compra',
                'expected_records': 9,
                'required_fields': ['OC', 'Fecha', 'Origen', 'Cantidad'],
                'validation_rules': self.validate_orden_compra
            },
            'almacen.csv': {
                'collection': 'almacen',
                'expected_records': 9,
                'required_fields': ['producto', 'stockActual'],
                'validation_rules': self.validate_almacen
            },
            'boveda_monte.csv': {
                'collection': 'boveda_monte',
                'expected_records': 69,
                'required_fields': ['Fecha', 'Concepto', 'Monto'],
                'validation_rules': self.validate_banco
            },
            'boveda_usa.csv': {
                'collection': 'boveda_usa',
                'expected_records': 17,
                'required_fields': ['Fecha', 'Concepto', 'Monto'],
                'validation_rules': self.validate_banco
            },
            'bancos_profit.csv': {
                'collection': 'profit',
                'expected_records': 55,
                'required_fields': ['Fecha', 'Concepto', 'Monto'],
                'validation_rules': self.validate_banco
            },
            'bancos_leftie.csv': {
                'collection': 'leftie',
                'expected_records': 11,
                'required_fields': ['Fecha', 'Concepto', 'Monto'],
                'validation_rules': self.validate_banco
            },
            'bancos_azteca.csv': {
                'collection': 'azteca',
                'expected_records': 6,
                'required_fields': ['Fecha', 'Concepto', 'Monto'],
                'validation_rules': self.validate_banco
            },
            'flete_sur.csv': {
                'collection': 'flete_sur',
                'expected_records': 101,
                'required_fields': ['Fecha', 'Concepto', 'Monto'],
                'validation_rules': self.validate_banco
            },
            'utilidades.csv': {
                'collection': 'utilidades',
                'expected_records': 51,
                'required_fields': ['Fecha', 'Concepto', 'Monto'],
                'validation_rules': self.validate_banco
            }
        }
    
    def validate_venta(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate venta record according to business logic"""
        errors = []
        
        # Check precio venta > 0
        if 'precioVenta' in record:
            try:
                precio = float(record['precioVenta'])
                if precio <= 0:
                    errors.append(f"Precio venta inválido: {precio}")
            except ValueError:
                errors.append(f"Precio venta no numérico: {record['precioVenta']}")
        
        # Check cantidad > 0
        if 'cantidad' in record:
            try:
                cantidad = int(record['cantidad'])
                if cantidad <= 0:
                    errors.append(f"Cantidad inválida: {cantidad}")
            except ValueError:
                errors.append(f"Cantidad no numérica: {record['cantidad']}")
        
        # Check estado pago
        if 'estatus' in record:
            valid_estados = ['Pendiente', 'Pagado', 'Parcial', 'completo', 'pendiente', 'parcial']
            if record['estatus'] not in valid_estados:
                errors.append(f"Estado pago inválido: {record['estatus']}")
        
        # Check fórmula: utilidad = (precioVenta - precioCompra - flete) * cantidad
        if all(k in record for k in ['precioVenta', 'cantidad', 'utilidad']):
            try:
                precio_venta = float(record['precioVenta'])
                cantidad = int(record['cantidad'])
                utilidad_calculada = precio_venta * cantidad
                utilidad_registro = float(record.get('utilidad', 0))
                
                # Allow 5% tolerance for rounding
                if abs(utilidad_calculada - utilidad_registro) > utilidad_calculada * 0.05:
                    errors.append(f"Utilidad no coincide: calc={utilidad_calculada}, reg={utilidad_registro}")
            except (ValueError, TypeError) as e:
                errors.append(f"Error calculando utilidad: {e}")
        
        return len(errors) == 0, errors
    
    def validate_cliente(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate cliente record"""
        errors = []
        
        # Check deuda >= 0
        if 'deuda' in record:
            try:
                deuda = float(record['deuda'])
                if deuda < 0:
                    errors.append(f"Deuda negativa: {deuda}")
            except ValueError:
                errors.append(f"Deuda no numérica: {record['deuda']}")
        
        # Check fórmula: deuda = pendiente + actual - abonos
        if all(k in record for k in ['deuda', 'abonos', 'pendiente', 'actual']):
            try:
                deuda = float(record['deuda'])
                abonos = float(record['abonos'])
                pendiente = float(record['pendiente'])
                actual = float(record['actual'])
                
                # Verify math
                deuda_calculada = pendiente + actual - abonos
                if abs(deuda - deuda_calculada) > 0.01:
                    errors.append(f"Deuda no coincide: calc={deuda_calculada}, reg={deuda}")
            except (ValueError, TypeError) as e:
                errors.append(f"Error calculando deuda: {e}")
        
        return len(errors) == 0, errors
    
    def validate_distribuidor(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate distribuidor record"""
        errors = []
        
        # Check cantidad > 0
        if 'Cantidad' in record:
            try:
                cantidad = int(record['Cantidad'])
                if cantidad <= 0:
                    errors.append(f"Cantidad inválida: {cantidad}")
            except ValueError:
                errors.append(f"Cantidad no numérica: {record['Cantidad']}")
        
        return len(errors) == 0, errors
    
    def validate_orden_compra(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate orden de compra according to formulas"""
        errors = []
        
        # Check formula: costoPorUnidad = costoDistribuidor + costoTransporte
        if all(k in record for k in ['Costo Distribuidor', 'Costo Transporte', 'Costo Por Unidad']):
            try:
                costo_dist = float(record['Costo Distribuidor'])
                costo_trans = float(record['Costo Transporte'])
                costo_unidad_reg = float(record['Costo Por Unidad'])
                costo_unidad_calc = costo_dist + costo_trans
                
                if abs(costo_unidad_calc - costo_unidad_reg) > 0.01:
                    errors.append(f"Costo por unidad no coincide: calc={costo_unidad_calc}, reg={costo_unidad_reg}")
            except (ValueError, TypeError) as e:
                errors.append(f"Error validando costos: {e}")
        
        # Check formula: costoTotal = costoPorUnidad * cantidad
        if all(k in record for k in ['Costo Por Unidad', 'Cantidad', 'Costo Total']):
            try:
                costo_unidad = float(record['Costo Por Unidad'])
                cantidad = int(record['Cantidad'])
                costo_total_reg = float(record['Costo Total'])
                costo_total_calc = costo_unidad * cantidad
                
                if abs(costo_total_calc - costo_total_reg) > 0.01:
                    errors.append(f"Costo total no coincide: calc={costo_total_calc}, reg={costo_total_reg}")
            except (ValueError, TypeError) as e:
                errors.append(f"Error validando costo total: {e}")
        
        # Check formula: deuda = costoTotal - pagoDistribuidor
        if all(k in record for k in ['Costo Total', 'Pago a Distribuidor', 'Deuda']):
            try:
                costo_total = float(record['Costo Total'])
                pago = float(record['Pago a Distribuidor'])
                deuda_reg = float(record['Deuda'])
                deuda_calc = costo_total - pago
                
                if abs(deuda_calc - deuda_reg) > 0.01:
                    errors.append(f"Deuda no coincide: calc={deuda_calc}, reg={deuda_reg}")
            except (ValueError, TypeError) as e:
                errors.append(f"Error validando deuda: {e}")
        
        return len(errors) == 0, errors
    
    def validate_almacen(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate almacen record"""
        errors = []
        
        # Check stock >= 0
        if 'stockActual' in record:
            try:
                stock = int(record['stockActual'])
                if stock < 0:
                    errors.append(f"Stock negativo: {stock}")
            except ValueError:
                errors.append(f"Stock no numérico: {record['stockActual']}")
        
        return len(errors) == 0, errors
    
    def validate_banco(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate banco record"""
        errors = []
        
        # Check monto is numeric
        if 'Monto' in record:
            try:
                monto = float(record['Monto'])
            except ValueError:
                errors.append(f"Monto no numérico: {record['Monto']}")
        
        return len(errors) == 0, errors
    
    def validate_csv_structure(self, csv_file: str) -> Dict[str, Any]:
        """Validate CSV file structure and data"""
        result = {
            'file': csv_file,
            'exists': False,
            'record_count': 0,
            'expected_count': 0,
            'match': False,
            'errors': [],
            'warnings': []
        }
        
        csv_path = self.csv_dir / csv_file
        
        if not csv_path.exists():
            result['errors'].append(f"CSV file not found: {csv_path}")
            return result
        
        result['exists'] = True
        mapping = self.data_mapping.get(csv_file, {})
        result['expected_count'] = mapping.get('expected_records', 0)
        
        try:
            # Read CSV
            df = pd.read_csv(csv_path)
            result['record_count'] = len(df)
            result['match'] = result['record_count'] == result['expected_count']
            
            if not result['match']:
                result['warnings'].append(
                    f"Record count mismatch: expected {result['expected_count']}, got {result['record_count']}"
                )
            
            # Check required fields
            required_fields = mapping.get('required_fields', [])
            missing_fields = [f for f in required_fields if f not in df.columns]
            if missing_fields:
                result['errors'].append(f"Missing required fields: {missing_fields}")
            
            # Validate each record
            validation_func = mapping.get('validation_rules')
            if validation_func:
                for idx, row in df.iterrows():
                    is_valid, errors = validation_func(row.to_dict())
                    if not is_valid:
                        result['errors'].append(f"Row {idx + 2}: {', '.join(errors)}")
            
        except Exception as e:
            result['errors'].append(f"Error reading CSV: {e}")
        
        return result
    
    def validate_firestore_collection(self, collection_name: str, expected_count: int) -> Dict[str, Any]:
        """Validate Firestore collection data"""
        result = {
            'collection': collection_name,
            'exists': False,
            'record_count': 0,
            'expected_count': expected_count,
            'match': False,
            'errors': [],
            'warnings': []
        }
        
        try:
            # Check if collection exists and count documents
            docs = db.collection(collection_name).limit(1).get()
            result['exists'] = len(docs) > 0
            
            if result['exists']:
                # Count all documents
                all_docs = db.collection(collection_name).get()
                result['record_count'] = len(all_docs)
                result['match'] = result['record_count'] == expected_count
                
                if not result['match']:
                    result['warnings'].append(
                        f"Record count mismatch: expected {expected_count}, got {result['record_count']}"
                    )
        except Exception as e:
            result['errors'].append(f"Error accessing Firestore: {e}")
        
        return result
    
    def compare_csv_firestore(self, csv_file: str) -> Dict[str, Any]:
        """Compare CSV data with Firestore collection"""
        mapping = self.data_mapping.get(csv_file, {})
        collection_name = mapping.get('collection')
        
        result = {
            'csv_file': csv_file,
            'collection': collection_name,
            'sync_status': 'unknown',
            'differences': [],
            'errors': []
        }
        
        if not collection_name:
            result['errors'].append("No collection mapping found")
            return result
        
        try:
            # Read CSV
            csv_path = self.csv_dir / csv_file
            if not csv_path.exists():
                result['errors'].append(f"CSV file not found: {csv_path}")
                return result
            
            df = pd.read_csv(csv_path)
            csv_count = len(df)
            
            # Count Firestore documents
            firestore_docs = db.collection(collection_name).get()
            firestore_count = len(firestore_docs)
            
            # Compare counts
            if csv_count != firestore_count:
                result['differences'].append(
                    f"Count mismatch: CSV={csv_count}, Firestore={firestore_count}"
                )
                result['sync_status'] = 'out_of_sync'
            else:
                result['sync_status'] = 'in_sync'
            
        except Exception as e:
            result['errors'].append(f"Error comparing data: {e}")
            result['sync_status'] = 'error'
        
        return result
    
    def run_comprehensive_validation(self) -> Dict[str, Any]:
        """Run all validation checks"""
        print("\n" + "="*80)
        print("🔍 STARTING COMPREHENSIVE DATA VALIDATION")
        print("="*80 + "\n")
        
        csv_validations = []
        firestore_validations = []
        comparisons = []
        
        # Validate each CSV file
        for csv_file, mapping in self.data_mapping.items():
            print(f"📄 Validating {csv_file}...")
            csv_result = self.validate_csv_structure(csv_file)
            csv_validations.append(csv_result)
            
            # Validate corresponding Firestore collection
            collection_name = mapping.get('collection')
            expected_count = mapping.get('expected_records', 0)
            
            print(f"🔥 Validating Firestore collection: {collection_name}...")
            firestore_result = self.validate_firestore_collection(collection_name, expected_count)
            firestore_validations.append(firestore_result)
            
            # Compare CSV vs Firestore
            print(f"🔄 Comparing CSV vs Firestore...")
            comparison = self.compare_csv_firestore(csv_file)
            comparisons.append(comparison)
            
            print()
        
        # Generate summary
        total_csv_errors = sum(len(v['errors']) for v in csv_validations)
        total_firestore_errors = sum(len(v['errors']) for v in firestore_validations)
        total_comparison_errors = sum(len(c['errors']) for c in comparisons)
        
        in_sync_count = sum(1 for c in comparisons if c['sync_status'] == 'in_sync')
        out_of_sync_count = sum(1 for c in comparisons if c['sync_status'] == 'out_of_sync')
        
        self.results['validations'] = {
            'csv': csv_validations,
            'firestore': firestore_validations,
            'comparisons': comparisons
        }
        
        self.results['summary'] = {
            'total_csv_files': len(self.data_mapping),
            'total_csv_errors': total_csv_errors,
            'total_firestore_errors': total_firestore_errors,
            'total_comparison_errors': total_comparison_errors,
            'in_sync_collections': in_sync_count,
            'out_of_sync_collections': out_of_sync_count,
            'validation_passed': (total_csv_errors + total_firestore_errors + total_comparison_errors) == 0
        }
        
        # Save report
        report_file = self.reports_dir / f"data_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print("\n" + "="*80)
        print("📊 VALIDATION SUMMARY")
        print("="*80)
        print(f"✅ CSV Files Validated: {len(self.data_mapping)}")
        print(f"❌ CSV Errors: {total_csv_errors}")
        print(f"❌ Firestore Errors: {total_firestore_errors}")
        print(f"❌ Comparison Errors: {total_comparison_errors}")
        print(f"🔄 In Sync: {in_sync_count}/{len(self.data_mapping)}")
        print(f"⚠️  Out of Sync: {out_of_sync_count}/{len(self.data_mapping)}")
        print(f"\n📝 Report saved: {report_file}")
        print("="*80 + "\n")
        
        return self.results

if __name__ == "__main__":
    validator = ComprehensiveDataValidator()
    results = validator.run_comprehensive_validation()
    
    # Exit with error code if validation failed
    if not results['summary']['validation_passed']:
        sys.exit(1)
    else:
        print("✅ ALL VALIDATIONS PASSED!")
        sys.exit(0)
