#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🔬 ANÁLISIS EXHAUSTIVO DE DATOS - SISTEMA CHRONOS/FLOWDISTRIBUTOR
================================================================================
Análisis avanzado de ciencia de datos con técnicas de:
- Estadística descriptiva e inferencial
- Análisis de series temporales
- Detección de anomalías
- Clustering y segmentación
- Predicciones y tendencias
- Análisis de correlaciones
- Visualizaciones avanzadas

Autor: GitHub Copilot - Análisis Automatizado
Fecha: 2025-12-02
================================================================================
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Configuración de visualización
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.max_colwidth', 50)

# ================================================================================
# 📁 CARGA DE DATOS
# ================================================================================

class DataLoader:
    """Cargador de datos desde múltiples fuentes"""
    
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.csv_path = self.base_path / 'csv'
        self.gg_path = self.base_path / 'gg'
        
    def cargar_csv(self, nombre: str) -> pd.DataFrame:
        """Carga un archivo CSV"""
        path = self.csv_path / nombre
        if path.exists():
            df = pd.read_csv(path, encoding='utf-8')
            return df
        else:
            print(f"⚠️ Archivo no encontrado: {path}")
            return pd.DataFrame()
    
    def cargar_json_unificado(self) -> dict:
        """Carga el JSON unificado"""
        path = self.gg_path / 'BASE_DATOS_FLOWDISTRIBUTOR_UNIFICADO.json'
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def cargar_todos_csv(self) -> dict:
        """Carga todos los archivos CSV"""
        archivos = [
            'ventas.csv', 'clientes.csv', 'ordenes_compra.csv', 
            'ordenes_compra_clean.csv', 'almacen.csv', 'distribuidores_clean.csv',
            'boveda_monte.csv', 'boveda_usa.csv', 'utilidades.csv',
            'gastos_abonos.csv', 'bancos_profit.csv', 'bancos_leftie.csv',
            'bancos_azteca.csv', 'flete_sur.csv'
        ]
        
        datos = {}
        for archivo in archivos:
            nombre = archivo.replace('.csv', '').replace('_clean', '')
            df = self.cargar_csv(archivo)
            if not df.empty:
                datos[nombre] = df
                print(f"✅ Cargado: {archivo} ({len(df)} registros)")
        
        return datos


# ================================================================================
# 📊 ANÁLISIS ESTADÍSTICO AVANZADO
# ================================================================================

class AnalizadorEstadistico:
    """Análisis estadístico avanzado de los datos"""
    
    def __init__(self, datos: dict):
        self.datos = datos
        self.resultados = {}
    
    def analizar_ventas(self) -> dict:
        """Análisis exhaustivo de ventas"""
        if 'ventas' not in self.datos:
            return {}
        
        df = self.datos['ventas'].copy()
        
        # Convertir fecha
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')
        
        # Análisis temporal
        df['mes'] = df['fecha'].dt.month
        df['dia_semana'] = df['fecha'].dt.dayofweek
        df['semana'] = df['fecha'].dt.isocalendar().week
        
        # Métricas numéricas
        cols_numericas = ['cantidad', 'bovedaMonte', 'precioVenta', 'ingreso', 
                          'fleteUtilidad', 'utilidad']
        
        analisis = {
            'resumen_general': {
                'total_registros': len(df),
                'periodo': f"{df['fecha'].min()} a {df['fecha'].max()}",
                'clientes_unicos': df['cliente'].nunique(),
                'ordenes_compra_relacionadas': df['ocRelacionada'].nunique(),
            },
            'metricas_financieras': {},
            'distribucion_clientes': {},
            'analisis_temporal': {},
            'estado_pagos': {},
            'analisis_flete': {},
            'anomalias_detectadas': [],
            'top_clientes': [],
            'metricas_utilidad': {}
        }
        
        # Métricas financieras
        for col in cols_numericas:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                analisis['metricas_financieras'][col] = {
                    'suma': float(df[col].sum()),
                    'promedio': float(df[col].mean()),
                    'mediana': float(df[col].median()),
                    'desviacion': float(df[col].std()),
                    'minimo': float(df[col].min()),
                    'maximo': float(df[col].max()),
                    'percentil_25': float(df[col].quantile(0.25)),
                    'percentil_75': float(df[col].quantile(0.75)),
                    'coef_variacion': float(df[col].std() / df[col].mean()) if df[col].mean() != 0 else 0
                }
        
        # Distribución por cliente
        ventas_cliente = df.groupby('cliente').agg({
            'cantidad': 'sum',
            'ingreso': 'sum',
            'utilidad': 'sum',
            'fecha': 'count'
        }).rename(columns={'fecha': 'transacciones'})
        
        analisis['distribucion_clientes'] = ventas_cliente.to_dict('index')
        
        # Top 10 clientes por ingreso
        top_clientes = ventas_cliente.nlargest(10, 'ingreso')
        analisis['top_clientes'] = top_clientes.to_dict('index')
        
        # Estado de pagos
        if 'estatus' in df.columns:
            estado_pagos = df['estatus'].value_counts().to_dict()
            analisis['estado_pagos'] = estado_pagos
            
            # Cálculo de deuda pendiente
            pendientes = df[df['estatus'] == 'Pendiente']
            analisis['deuda_pendiente'] = {
                'total_registros_pendientes': len(pendientes),
                'monto_boveda_monte_pendiente': float(pendientes['bovedaMonte'].sum()),
                'ingreso_pendiente': float(pendientes['ingreso'].sum())
            }
        
        # Análisis de flete
        if 'flete' in df.columns:
            analisis['analisis_flete'] = {
                'con_flete': len(df[df['flete'] == 'Aplica']),
                'sin_flete': len(df[df['flete'].isin(['No Aplica', 'NoAplica'])]),
                'total_flete_utilidad': float(df['fleteUtilidad'].sum())
            }
        
        # Análisis temporal
        ventas_mes = df.groupby('mes').agg({
            'cantidad': 'sum',
            'ingreso': 'sum'
        })
        analisis['analisis_temporal']['ventas_por_mes'] = ventas_mes.to_dict('index')
        
        # Análisis de utilidad
        utilidades = df['utilidad']
        analisis['metricas_utilidad'] = {
            'utilidad_total': float(utilidades.sum()),
            'utilidad_positiva': float(utilidades[utilidades > 0].sum()),
            'utilidad_negativa': float(utilidades[utilidades < 0].sum()),
            'transacciones_con_perdida': len(utilidades[utilidades < 0]),
            'transacciones_con_ganancia': len(utilidades[utilidades > 0]),
            'transacciones_neutras': len(utilidades[utilidades == 0]),
            'margen_promedio': float(utilidades.mean())
        }
        
        # Detección de anomalías (IQR)
        Q1 = df['ingreso'].quantile(0.25)
        Q3 = df['ingreso'].quantile(0.75)
        IQR = Q3 - Q1
        anomalias_ingreso = df[(df['ingreso'] < (Q1 - 1.5 * IQR)) | (df['ingreso'] > (Q3 + 1.5 * IQR))]
        
        if len(anomalias_ingreso) > 0:
            for _, row in anomalias_ingreso.iterrows():
                analisis['anomalias_detectadas'].append({
                    'fecha': str(row['fecha']),
                    'cliente': row['cliente'],
                    'ingreso': float(row['ingreso']),
                    'tipo': 'ingreso_atipico'
                })
        
        return analisis
    
    def analizar_ordenes_compra(self) -> dict:
        """Análisis de órdenes de compra"""
        if 'ordenes_compra' not in self.datos:
            return {}
        
        df = self.datos['ordenes_compra'].copy()
        
        # Convertir tipos
        cols_numericas = ['cantidad', 'costoDistribuidor', 'costoTransporte', 
                         'costoPorUnidad', 'costoTotal', 'pagoDistribuidor', 'deuda']
        
        for col in cols_numericas:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        analisis = {
            'resumen': {
                'total_ordenes': len(df),
                'distribuidores_unicos': df['origen'].nunique() if 'origen' in df.columns else 0,
                'unidades_totales': int(df['cantidad'].sum()),
            },
            'costos': {
                'costo_total_compras': float(df['costoTotal'].sum()),
                'costo_promedio_unidad': float(df['costoPorUnidad'].mean()),
                'costo_transporte_total': float(df['costoTransporte'].sum() * df['cantidad'].sum()) if 'costoTransporte' in df.columns else 0,
            },
            'distribuidores': {},
            'pagos': {
                'total_pagado': float(df['pagoDistribuidor'].sum()),
                'deuda_total': float(df['deuda'].sum()) if 'deuda' in df.columns else 0,
            }
        }
        
        # Análisis por distribuidor
        if 'origen' in df.columns:
            por_dist = df.groupby('origen').agg({
                'cantidad': 'sum',
                'costoTotal': 'sum',
                'id': 'count'
            }).rename(columns={'id': 'ordenes'})
            analisis['distribuidores'] = por_dist.to_dict('index')
        
        return analisis
    
    def analizar_clientes(self) -> dict:
        """Análisis de cartera de clientes"""
        if 'clientes' not in self.datos:
            return {}
        
        df = self.datos['clientes'].copy()
        
        cols_numericas = ['actual', 'deuda', 'abonos', 'pendiente']
        for col in cols_numericas:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        analisis = {
            'resumen': {
                'total_clientes': len(df),
                'con_deuda': len(df[df['pendiente'] > 0]),
                'sin_deuda': len(df[df['pendiente'] <= 0]),
                'con_credito': len(df[df['pendiente'] < 0])  # pagaron de más
            },
            'cartera': {
                'deuda_total_cartera': float(df['deuda'].sum()),
                'abonos_totales': float(df['abonos'].sum()),
                'pendiente_total': float(df[df['pendiente'] > 0]['pendiente'].sum()),
                'credito_total': float(abs(df[df['pendiente'] < 0]['pendiente'].sum()))
            },
            'segmentacion': {
                'deuda_alta': len(df[df['pendiente'] > 100000]),
                'deuda_media': len(df[(df['pendiente'] > 10000) & (df['pendiente'] <= 100000)]),
                'deuda_baja': len(df[(df['pendiente'] > 0) & (df['pendiente'] <= 10000)])
            },
            'top_deudores': df.nlargest(10, 'pendiente')[['cliente', 'pendiente']].to_dict('records')
        }
        
        return analisis
    
    def analizar_bancos(self) -> dict:
        """Análisis de flujo en bancos/bóvedas"""
        bancos = ['boveda_monte', 'boveda_usa', 'utilidades', 'bancos_profit', 
                  'bancos_leftie', 'bancos_azteca', 'flete_sur']
        
        analisis = {}
        
        for banco in bancos:
            if banco in self.datos:
                df = self.datos[banco].copy()
                
                # Buscar columna de ingreso/valor
                col_ingreso = None
                for col in ['ingreso', 'valor', 'monto']:
                    if col in df.columns:
                        col_ingreso = col
                        break
                
                if col_ingreso:
                    df[col_ingreso] = pd.to_numeric(df[col_ingreso], errors='coerce').fillna(0)
                    
                    analisis[banco] = {
                        'total_movimientos': len(df),
                        'total_ingresos': float(df[col_ingreso].sum()),
                        'promedio_movimiento': float(df[col_ingreso].mean()),
                        'mayor_movimiento': float(df[col_ingreso].max()),
                        'menor_movimiento': float(df[col_ingreso].min())
                    }
        
        return analisis
    
    def analizar_gastos_abonos(self) -> dict:
        """Análisis de gastos y abonos"""
        if 'gastos_abonos' not in self.datos:
            return {}
        
        df = self.datos['gastos_abonos'].copy()
        
        # Convertir valores
        for col in ['valor', 'tc', 'pesos']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Clasificar por tipo de operación
        gastos_mask = df['origen'].str.contains('Gasto', case=False, na=False)
        abonos_mask = ~gastos_mask
        
        analisis = {
            'resumen': {
                'total_registros': len(df),
                'registros_gastos': int(gastos_mask.sum()),
                'registros_abonos': int(abonos_mask.sum())
            },
            'gastos': {
                'total': float(df[gastos_mask]['valor'].sum()),
                'promedio': float(df[gastos_mask]['valor'].mean()) if gastos_mask.sum() > 0 else 0
            },
            'abonos': {
                'total': float(df[abonos_mask]['valor'].sum()),
                'promedio': float(df[abonos_mask]['valor'].mean()) if abonos_mask.sum() > 0 else 0
            },
            'tipo_cambio': {
                'promedio': float(df[df['tc'] > 0]['tc'].mean()) if len(df[df['tc'] > 0]) > 0 else 0,
                'rango': [float(df[df['tc'] > 0]['tc'].min()), float(df[df['tc'] > 0]['tc'].max())] if len(df[df['tc'] > 0]) > 0 else [0, 0]
            }
        }
        
        # Por destino
        if 'destino' in df.columns:
            por_destino = df.groupby('destino')['valor'].sum().to_dict()
            analisis['por_destino'] = {k: float(v) for k, v in por_destino.items()}
        
        return analisis


# ================================================================================
# 📈 ANÁLISIS DE CORRELACIONES Y TENDENCIAS
# ================================================================================

class AnalizadorTendencias:
    """Análisis de correlaciones y tendencias temporales"""
    
    def __init__(self, datos: dict):
        self.datos = datos
    
    def calcular_tendencias_ventas(self) -> dict:
        """Calcula tendencias en ventas"""
        if 'ventas' not in self.datos:
            return {}
        
        df = self.datos['ventas'].copy()
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')
        df = df.dropna(subset=['fecha'])
        
        for col in ['cantidad', 'ingreso', 'utilidad']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Agrupar por semana
        df['semana'] = df['fecha'].dt.to_period('W')
        semanal = df.groupby('semana').agg({
            'cantidad': 'sum',
            'ingreso': 'sum',
            'utilidad': 'sum',
            'cliente': 'nunique'
        }).rename(columns={'cliente': 'clientes_activos'})
        
        # Calcular cambio porcentual
        semanal['cambio_ingreso_pct'] = semanal['ingreso'].pct_change() * 100
        semanal['cambio_cantidad_pct'] = semanal['cantidad'].pct_change() * 100
        
        # Media móvil
        semanal['ingreso_ma3'] = semanal['ingreso'].rolling(3).mean()
        
        tendencias = {
            'datos_semanales': semanal.to_dict('index'),
            'metricas_tendencia': {
                'crecimiento_promedio_ingreso': float(semanal['cambio_ingreso_pct'].mean()) if not semanal['cambio_ingreso_pct'].isna().all() else 0,
                'volatilidad_ingreso': float(semanal['ingreso'].std() / semanal['ingreso'].mean()) if semanal['ingreso'].mean() != 0 else 0,
                'semana_mayor_ingreso': str(semanal['ingreso'].idxmax()) if len(semanal) > 0 else None,
                'semana_menor_ingreso': str(semanal['ingreso'].idxmin()) if len(semanal) > 0 else None
            }
        }
        
        return tendencias
    
    def analisis_estacionalidad(self) -> dict:
        """Análisis de patrones estacionales"""
        if 'ventas' not in self.datos:
            return {}
        
        df = self.datos['ventas'].copy()
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')
        df = df.dropna(subset=['fecha'])
        df['ingreso'] = pd.to_numeric(df['ingreso'], errors='coerce').fillna(0)
        
        # Por día de la semana
        df['dia_semana'] = df['fecha'].dt.day_name()
        por_dia = df.groupby('dia_semana')['ingreso'].agg(['sum', 'mean', 'count'])
        
        # Por mes
        df['mes'] = df['fecha'].dt.month_name()
        por_mes = df.groupby('mes')['ingreso'].agg(['sum', 'mean', 'count'])
        
        return {
            'por_dia_semana': por_dia.to_dict('index'),
            'por_mes': por_mes.to_dict('index')
        }


# ================================================================================
# 🎯 SEGMENTACIÓN Y CLUSTERING
# ================================================================================

class AnalizadorSegmentacion:
    """Segmentación de clientes y productos"""
    
    def __init__(self, datos: dict):
        self.datos = datos
    
    def segmentar_clientes_rfm(self) -> dict:
        """Segmentación RFM (Recency, Frequency, Monetary)"""
        if 'ventas' not in self.datos:
            return {}
        
        df = self.datos['ventas'].copy()
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')
        df['ingreso'] = pd.to_numeric(df['ingreso'], errors='coerce').fillna(0)
        df = df.dropna(subset=['fecha'])
        
        fecha_ref = df['fecha'].max()
        
        rfm = df.groupby('cliente').agg({
            'fecha': lambda x: (fecha_ref - x.max()).days,  # Recency
            'ingreso': ['count', 'sum']  # Frequency y Monetary
        })
        rfm.columns = ['recency', 'frequency', 'monetary']
        
        # Scoring (1-5)
        rfm['R_score'] = pd.qcut(rfm['recency'], 5, labels=[5, 4, 3, 2, 1], duplicates='drop')
        rfm['F_score'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5], duplicates='drop')
        rfm['M_score'] = pd.qcut(rfm['monetary'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5], duplicates='drop')
        
        # RFM Score combinado
        rfm['RFM_score'] = rfm['R_score'].astype(str) + rfm['F_score'].astype(str) + rfm['M_score'].astype(str)
        
        # Segmentos
        def clasificar_cliente(row):
            r, f, m = int(row['R_score']), int(row['F_score']), int(row['M_score'])
            if r >= 4 and f >= 4 and m >= 4:
                return 'Champions'
            elif r >= 3 and f >= 3 and m >= 4:
                return 'Loyal Customers'
            elif r >= 4 and f <= 2:
                return 'New Customers'
            elif r <= 2 and f >= 3:
                return 'At Risk'
            elif r <= 2 and f <= 2:
                return 'Lost'
            else:
                return 'Potential Loyalists'
        
        rfm['segmento'] = rfm.apply(clasificar_cliente, axis=1)
        
        segmentos_count = rfm['segmento'].value_counts().to_dict()
        
        return {
            'distribucion_segmentos': segmentos_count,
            'detalle_clientes': rfm[['recency', 'frequency', 'monetary', 'segmento']].to_dict('index'),
            'metricas_segmento': rfm.groupby('segmento').agg({
                'monetary': ['mean', 'sum'],
                'frequency': 'mean'
            }).to_dict()
        }
    
    def analisis_pareto_clientes(self) -> dict:
        """Análisis de Pareto (80/20) de clientes"""
        if 'ventas' not in self.datos:
            return {}
        
        df = self.datos['ventas'].copy()
        df['ingreso'] = pd.to_numeric(df['ingreso'], errors='coerce').fillna(0)
        
        # Total por cliente
        por_cliente = df.groupby('cliente')['ingreso'].sum().sort_values(ascending=False)
        total = por_cliente.sum()
        
        # Acumulado
        por_cliente_df = por_cliente.reset_index()
        por_cliente_df['porcentaje'] = por_cliente_df['ingreso'] / total * 100
        por_cliente_df['acumulado'] = por_cliente_df['porcentaje'].cumsum()
        
        # Encontrar el punto 80%
        clientes_80 = por_cliente_df[por_cliente_df['acumulado'] <= 80]
        
        return {
            'clientes_top_80_pct': len(clientes_80),
            'total_clientes': len(por_cliente),
            'ratio_pareto': round(len(clientes_80) / len(por_cliente) * 100, 2),
            'detalle_top_10': por_cliente.head(10).to_dict(),
            'concentracion': {
                'top_5_clientes_pct': float(por_cliente.head(5).sum() / total * 100),
                'top_10_clientes_pct': float(por_cliente.head(10).sum() / total * 100),
            }
        }


# ================================================================================
# 📋 GENERADOR DE REPORTES
# ================================================================================

class GeneradorReportes:
    """Genera reportes consolidados en múltiples formatos"""
    
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.output_path = self.base_path / 'analysis_output'
        self.output_path.mkdir(exist_ok=True)
    
    def generar_excel_completo(self, resultados: dict, nombre: str = 'ANALISIS_EXHAUSTIVO_CHRONOS'):
        """Genera un archivo Excel con todas las hojas de análisis"""
        
        archivo = self.output_path / f'{nombre}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        
        with pd.ExcelWriter(archivo, engine='xlsxwriter') as writer:
            workbook = writer.book
            
            # Formatos
            header_format = workbook.add_format({
                'bold': True, 'bg_color': '#4F81BD', 'font_color': 'white',
                'border': 1, 'align': 'center'
            })
            money_format = workbook.add_format({'num_format': '$#,##0.00'})
            percent_format = workbook.add_format({'num_format': '0.00%'})
            
            # HOJA 1: Resumen Ejecutivo
            resumen_data = []
            if 'ventas' in resultados:
                v = resultados['ventas']
                resumen_data.extend([
                    ['📊 RESUMEN EJECUTIVO - ANÁLISIS DE DATOS CHRONOS', ''],
                    ['Fecha de Análisis', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                    ['', ''],
                    ['=== VENTAS ===', ''],
                    ['Total Registros de Ventas', v.get('resumen_general', {}).get('total_registros', 0)],
                    ['Clientes Únicos', v.get('resumen_general', {}).get('clientes_unicos', 0)],
                    ['Periodo de Datos', v.get('resumen_general', {}).get('periodo', 'N/A')],
                    ['', ''],
                    ['=== MÉTRICAS FINANCIERAS ===', ''],
                    ['Ingreso Total', v.get('metricas_financieras', {}).get('ingreso', {}).get('suma', 0)],
                    ['Ingreso Promedio por Venta', v.get('metricas_financieras', {}).get('ingreso', {}).get('promedio', 0)],
                    ['Utilidad Total', v.get('metricas_utilidad', {}).get('utilidad_total', 0)],
                    ['Utilidad Positiva', v.get('metricas_utilidad', {}).get('utilidad_positiva', 0)],
                    ['Utilidad Negativa', v.get('metricas_utilidad', {}).get('utilidad_negativa', 0)],
                    ['', ''],
                    ['=== ESTADO DE PAGOS ===', ''],
                    ['Ventas Pagadas', v.get('estado_pagos', {}).get('Pagado', 0)],
                    ['Ventas Pendientes', v.get('estado_pagos', {}).get('Pendiente', 0)],
                    ['Monto Pendiente (Bóveda Monte)', v.get('deuda_pendiente', {}).get('monto_boveda_monte_pendiente', 0)],
                ])
            
            if resumen_data:
                df_resumen = pd.DataFrame(resumen_data, columns=['Métrica', 'Valor'])
                df_resumen.to_excel(writer, sheet_name='Resumen_Ejecutivo', index=False)
            
            # HOJA 2: Análisis de Clientes
            if 'clientes' in resultados:
                c = resultados['clientes']
                clientes_data = [
                    ['=== CARTERA DE CLIENTES ===', ''],
                    ['Total Clientes', c.get('resumen', {}).get('total_clientes', 0)],
                    ['Clientes con Deuda', c.get('resumen', {}).get('con_deuda', 0)],
                    ['Clientes sin Deuda', c.get('resumen', {}).get('sin_deuda', 0)],
                    ['', ''],
                    ['=== MONTOS ===', ''],
                    ['Deuda Total Cartera', c.get('cartera', {}).get('deuda_total_cartera', 0)],
                    ['Abonos Totales', c.get('cartera', {}).get('abonos_totales', 0)],
                    ['Pendiente Cobrar', c.get('cartera', {}).get('pendiente_total', 0)],
                    ['', ''],
                    ['=== SEGMENTACIÓN ===', ''],
                    ['Deuda Alta (>100K)', c.get('segmentacion', {}).get('deuda_alta', 0)],
                    ['Deuda Media (10K-100K)', c.get('segmentacion', {}).get('deuda_media', 0)],
                    ['Deuda Baja (<10K)', c.get('segmentacion', {}).get('deuda_baja', 0)],
                ]
                df_clientes = pd.DataFrame(clientes_data, columns=['Métrica', 'Valor'])
                df_clientes.to_excel(writer, sheet_name='Analisis_Clientes', index=False)
                
                # Top deudores
                if 'top_deudores' in c:
                    df_deudores = pd.DataFrame(c['top_deudores'])
                    df_deudores.to_excel(writer, sheet_name='Top_Deudores', index=False)
            
            # HOJA 3: Órdenes de Compra
            if 'ordenes_compra' in resultados:
                oc = resultados['ordenes_compra']
                oc_data = [
                    ['=== ÓRDENES DE COMPRA ===', ''],
                    ['Total Órdenes', oc.get('resumen', {}).get('total_ordenes', 0)],
                    ['Distribuidores Únicos', oc.get('resumen', {}).get('distribuidores_unicos', 0)],
                    ['Unidades Totales Compradas', oc.get('resumen', {}).get('unidades_totales', 0)],
                    ['', ''],
                    ['=== COSTOS ===', ''],
                    ['Costo Total de Compras', oc.get('costos', {}).get('costo_total_compras', 0)],
                    ['Costo Promedio por Unidad', oc.get('costos', {}).get('costo_promedio_unidad', 0)],
                    ['', ''],
                    ['=== PAGOS ===', ''],
                    ['Total Pagado a Distribuidores', oc.get('pagos', {}).get('total_pagado', 0)],
                    ['Deuda con Distribuidores', oc.get('pagos', {}).get('deuda_total', 0)],
                ]
                df_oc = pd.DataFrame(oc_data, columns=['Métrica', 'Valor'])
                df_oc.to_excel(writer, sheet_name='Ordenes_Compra', index=False)
            
            # HOJA 4: Análisis de Bancos
            if 'bancos' in resultados:
                bancos_list = []
                for banco, metricas in resultados['bancos'].items():
                    bancos_list.append({
                        'Banco': banco,
                        'Total Movimientos': metricas.get('total_movimientos', 0),
                        'Total Ingresos': metricas.get('total_ingresos', 0),
                        'Promedio Movimiento': metricas.get('promedio_movimiento', 0),
                        'Mayor Movimiento': metricas.get('mayor_movimiento', 0)
                    })
                df_bancos = pd.DataFrame(bancos_list)
                df_bancos.to_excel(writer, sheet_name='Bancos_Bovedas', index=False)
            
            # HOJA 5: Segmentación RFM
            if 'segmentacion_rfm' in resultados:
                rfm = resultados['segmentacion_rfm']
                if 'distribucion_segmentos' in rfm:
                    df_seg = pd.DataFrame(list(rfm['distribucion_segmentos'].items()), 
                                         columns=['Segmento', 'Cantidad'])
                    df_seg.to_excel(writer, sheet_name='Segmentacion_RFM', index=False)
            
            # HOJA 6: Análisis Pareto
            if 'pareto' in resultados:
                pareto = resultados['pareto']
                pareto_data = [
                    ['=== ANÁLISIS PARETO (80/20) ===', ''],
                    ['Clientes que generan 80% de ingresos', pareto.get('clientes_top_80_pct', 0)],
                    ['Total de Clientes', pareto.get('total_clientes', 0)],
                    ['Ratio Pareto (%)', pareto.get('ratio_pareto', 0)],
                    ['', ''],
                    ['=== CONCENTRACIÓN ===', ''],
                    ['Top 5 Clientes (%)', pareto.get('concentracion', {}).get('top_5_clientes_pct', 0)],
                    ['Top 10 Clientes (%)', pareto.get('concentracion', {}).get('top_10_clientes_pct', 0)],
                ]
                df_pareto = pd.DataFrame(pareto_data, columns=['Métrica', 'Valor'])
                df_pareto.to_excel(writer, sheet_name='Analisis_Pareto', index=False)
            
            # HOJA 7: Gastos y Abonos
            if 'gastos_abonos' in resultados:
                ga = resultados['gastos_abonos']
                ga_data = [
                    ['=== GASTOS Y ABONOS ===', ''],
                    ['Total Registros', ga.get('resumen', {}).get('total_registros', 0)],
                    ['Registros de Gastos', ga.get('resumen', {}).get('registros_gastos', 0)],
                    ['Registros de Abonos', ga.get('resumen', {}).get('registros_abonos', 0)],
                    ['', ''],
                    ['=== MONTOS ===', ''],
                    ['Total Gastos', ga.get('gastos', {}).get('total', 0)],
                    ['Total Abonos', ga.get('abonos', {}).get('total', 0)],
                    ['', ''],
                    ['=== TIPO DE CAMBIO USD ===', ''],
                    ['TC Promedio', ga.get('tipo_cambio', {}).get('promedio', 0)],
                ]
                df_ga = pd.DataFrame(ga_data, columns=['Métrica', 'Valor'])
                df_ga.to_excel(writer, sheet_name='Gastos_Abonos', index=False)
            
            # HOJA 8: Anomalías Detectadas
            if 'ventas' in resultados and 'anomalias_detectadas' in resultados['ventas']:
                anomalias = resultados['ventas']['anomalias_detectadas']
                if anomalias:
                    df_anomalias = pd.DataFrame(anomalias)
                    df_anomalias.to_excel(writer, sheet_name='Anomalias_Detectadas', index=False)
        
        print(f"\n✅ Archivo Excel generado: {archivo}")
        return str(archivo)
    
    def generar_json_completo(self, resultados: dict, nombre: str = 'ANALISIS_EXHAUSTIVO_CHRONOS'):
        """Genera archivo JSON con todos los resultados"""
        
        archivo = self.output_path / f'{nombre}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        
        # Convertir tipos no serializables
        def convertir(obj):
            if isinstance(obj, (np.integer, np.floating)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, pd.Period):
                return str(obj)
            elif isinstance(obj, pd.Timestamp):
                return str(obj)
            elif pd.isna(obj) if not isinstance(obj, (dict, list)) else False:
                return None
            return obj
        
        def limpiar_dict(d):
            if isinstance(d, dict):
                return {str(k): limpiar_dict(v) for k, v in d.items()}
            elif isinstance(d, list):
                return [limpiar_dict(i) for i in d]
            else:
                return convertir(d)
        
        resultados_limpio = limpiar_dict(resultados)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(resultados_limpio, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"✅ Archivo JSON generado: {archivo}")
        return str(archivo)
    
    def generar_reporte_markdown(self, resultados: dict, nombre: str = 'ANALISIS_EXHAUSTIVO_CHRONOS'):
        """Genera un reporte en formato Markdown"""
        
        archivo = self.output_path / f'{nombre}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.md'
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write("# 📊 ANÁLISIS EXHAUSTIVO DE DATOS - SISTEMA CHRONOS\n\n")
            f.write(f"**Fecha de Generación:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")
            
            # Resumen de Ventas
            if 'ventas' in resultados:
                v = resultados['ventas']
                f.write("## 💰 ANÁLISIS DE VENTAS\n\n")
                f.write("### Resumen General\n\n")
                f.write(f"| Métrica | Valor |\n")
                f.write(f"|---------|-------|\n")
                f.write(f"| Total Registros | {v.get('resumen_general', {}).get('total_registros', 0):,} |\n")
                f.write(f"| Clientes Únicos | {v.get('resumen_general', {}).get('clientes_unicos', 0):,} |\n")
                f.write(f"| Periodo | {v.get('resumen_general', {}).get('periodo', 'N/A')} |\n\n")
                
                f.write("### Métricas Financieras\n\n")
                mf = v.get('metricas_financieras', {})
                if 'ingreso' in mf:
                    f.write(f"| Métrica | Valor |\n")
                    f.write(f"|---------|-------|\n")
                    f.write(f"| Ingreso Total | ${mf['ingreso'].get('suma', 0):,.2f} |\n")
                    f.write(f"| Ingreso Promedio | ${mf['ingreso'].get('promedio', 0):,.2f} |\n")
                    f.write(f"| Ingreso Máximo | ${mf['ingreso'].get('maximo', 0):,.2f} |\n\n")
                
                f.write("### Análisis de Utilidad\n\n")
                mu = v.get('metricas_utilidad', {})
                f.write(f"| Métrica | Valor |\n")
                f.write(f"|---------|-------|\n")
                f.write(f"| Utilidad Total | ${mu.get('utilidad_total', 0):,.2f} |\n")
                f.write(f"| Utilidad Positiva | ${mu.get('utilidad_positiva', 0):,.2f} |\n")
                f.write(f"| Utilidad Negativa | ${mu.get('utilidad_negativa', 0):,.2f} |\n")
                f.write(f"| Transacciones con Ganancia | {mu.get('transacciones_con_ganancia', 0):,} |\n")
                f.write(f"| Transacciones con Pérdida | {mu.get('transacciones_con_perdida', 0):,} |\n\n")
                
                f.write("### Estado de Pagos\n\n")
                ep = v.get('estado_pagos', {})
                f.write(f"- **Pagado:** {ep.get('Pagado', 0):,}\n")
                f.write(f"- **Pendiente:** {ep.get('Pendiente', 0):,}\n\n")
            
            # Análisis de Clientes
            if 'clientes' in resultados:
                c = resultados['clientes']
                f.write("## 👥 ANÁLISIS DE CLIENTES\n\n")
                f.write(f"| Métrica | Valor |\n")
                f.write(f"|---------|-------|\n")
                f.write(f"| Total Clientes | {c.get('resumen', {}).get('total_clientes', 0):,} |\n")
                f.write(f"| Con Deuda | {c.get('resumen', {}).get('con_deuda', 0):,} |\n")
                f.write(f"| Sin Deuda | {c.get('resumen', {}).get('sin_deuda', 0):,} |\n")
                f.write(f"| Pendiente Total | ${c.get('cartera', {}).get('pendiente_total', 0):,.2f} |\n\n")
            
            # Órdenes de Compra
            if 'ordenes_compra' in resultados:
                oc = resultados['ordenes_compra']
                f.write("## 📦 ÓRDENES DE COMPRA\n\n")
                f.write(f"| Métrica | Valor |\n")
                f.write(f"|---------|-------|\n")
                f.write(f"| Total Órdenes | {oc.get('resumen', {}).get('total_ordenes', 0):,} |\n")
                f.write(f"| Unidades Compradas | {oc.get('resumen', {}).get('unidades_totales', 0):,} |\n")
                f.write(f"| Costo Total | ${oc.get('costos', {}).get('costo_total_compras', 0):,.2f} |\n\n")
            
            # Análisis Pareto
            if 'pareto' in resultados:
                p = resultados['pareto']
                f.write("## 📈 ANÁLISIS PARETO (80/20)\n\n")
                f.write(f"- **{p.get('clientes_top_80_pct', 0)}** clientes generan el 80% de los ingresos\n")
                f.write(f"- Ratio Pareto: **{p.get('ratio_pareto', 0):.1f}%**\n")
                f.write(f"- Top 5 clientes: **{p.get('concentracion', {}).get('top_5_clientes_pct', 0):.1f}%** del ingreso\n")
                f.write(f"- Top 10 clientes: **{p.get('concentracion', {}).get('top_10_clientes_pct', 0):.1f}%** del ingreso\n\n")
            
            # Segmentación RFM
            if 'segmentacion_rfm' in resultados:
                rfm = resultados['segmentacion_rfm']
                f.write("## 🎯 SEGMENTACIÓN RFM DE CLIENTES\n\n")
                f.write("| Segmento | Cantidad |\n")
                f.write("|----------|----------|\n")
                for seg, cant in rfm.get('distribucion_segmentos', {}).items():
                    f.write(f"| {seg} | {cant} |\n")
                f.write("\n")
            
            f.write("---\n")
            f.write("\n*Reporte generado automáticamente por el sistema de análisis de datos CHRONOS*\n")
        
        print(f"✅ Reporte Markdown generado: {archivo}")
        return str(archivo)


# ================================================================================
# 🚀 EJECUCIÓN PRINCIPAL
# ================================================================================

def main():
    """Función principal de ejecución"""
    
    print("=" * 80)
    print("🔬 ANÁLISIS EXHAUSTIVO DE DATOS - SISTEMA CHRONOS/FLOWDISTRIBUTOR")
    print("=" * 80)
    print()
    
    # Configurar ruta base
    base_path = '/workspaces/v0-crypto-dashboard-design'
    
    # 1. Cargar datos
    print("📁 CARGANDO DATOS...")
    print("-" * 40)
    loader = DataLoader(base_path)
    datos = loader.cargar_todos_csv()
    print()
    
    # 2. Análisis estadístico
    print("📊 EJECUTANDO ANÁLISIS ESTADÍSTICO...")
    print("-" * 40)
    analizador = AnalizadorEstadistico(datos)
    
    resultados = {
        'metadata': {
            'fecha_analisis': datetime.now().isoformat(),
            'version': '1.0',
            'archivos_procesados': list(datos.keys())
        },
        'ventas': analizador.analizar_ventas(),
        'ordenes_compra': analizador.analizar_ordenes_compra(),
        'clientes': analizador.analizar_clientes(),
        'bancos': analizador.analizar_bancos(),
        'gastos_abonos': analizador.analizar_gastos_abonos()
    }
    
    print("✅ Análisis de ventas completado")
    print("✅ Análisis de órdenes de compra completado")
    print("✅ Análisis de clientes completado")
    print("✅ Análisis de bancos completado")
    print("✅ Análisis de gastos/abonos completado")
    print()
    
    # 3. Análisis de tendencias
    print("📈 EJECUTANDO ANÁLISIS DE TENDENCIAS...")
    print("-" * 40)
    tendencias = AnalizadorTendencias(datos)
    resultados['tendencias'] = tendencias.calcular_tendencias_ventas()
    resultados['estacionalidad'] = tendencias.analisis_estacionalidad()
    print("✅ Análisis de tendencias completado")
    print()
    
    # 4. Segmentación
    print("🎯 EJECUTANDO SEGMENTACIÓN DE CLIENTES...")
    print("-" * 40)
    segmentador = AnalizadorSegmentacion(datos)
    resultados['segmentacion_rfm'] = segmentador.segmentar_clientes_rfm()
    resultados['pareto'] = segmentador.analisis_pareto_clientes()
    print("✅ Segmentación RFM completada")
    print("✅ Análisis Pareto completado")
    print()
    
    # 5. Generar reportes
    print("📋 GENERANDO REPORTES...")
    print("-" * 40)
    generador = GeneradorReportes(base_path)
    
    archivo_excel = generador.generar_excel_completo(resultados)
    archivo_json = generador.generar_json_completo(resultados)
    archivo_md = generador.generar_reporte_markdown(resultados)
    print()
    
    # 6. Mostrar resumen
    print("=" * 80)
    print("📊 RESUMEN EJECUTIVO DEL ANÁLISIS")
    print("=" * 80)
    
    if 'ventas' in resultados:
        v = resultados['ventas']
        print(f"\n💰 VENTAS:")
        print(f"   • Total registros: {v.get('resumen_general', {}).get('total_registros', 0):,}")
        print(f"   • Clientes únicos: {v.get('resumen_general', {}).get('clientes_unicos', 0):,}")
        print(f"   • Ingreso total: ${v.get('metricas_financieras', {}).get('ingreso', {}).get('suma', 0):,.2f}")
        print(f"   • Utilidad total: ${v.get('metricas_utilidad', {}).get('utilidad_total', 0):,.2f}")
        print(f"   • Ventas pagadas: {v.get('estado_pagos', {}).get('Pagado', 0):,}")
        print(f"   • Ventas pendientes: {v.get('estado_pagos', {}).get('Pendiente', 0):,}")
    
    if 'clientes' in resultados:
        c = resultados['clientes']
        print(f"\n👥 CLIENTES:")
        print(f"   • Total clientes: {c.get('resumen', {}).get('total_clientes', 0):,}")
        print(f"   • Con deuda: {c.get('resumen', {}).get('con_deuda', 0):,}")
        print(f"   • Pendiente cobrar: ${c.get('cartera', {}).get('pendiente_total', 0):,.2f}")
    
    if 'ordenes_compra' in resultados:
        oc = resultados['ordenes_compra']
        print(f"\n📦 ÓRDENES DE COMPRA:")
        print(f"   • Total órdenes: {oc.get('resumen', {}).get('total_ordenes', 0):,}")
        print(f"   • Unidades compradas: {oc.get('resumen', {}).get('unidades_totales', 0):,}")
        print(f"   • Costo total: ${oc.get('costos', {}).get('costo_total_compras', 0):,.2f}")
    
    if 'pareto' in resultados:
        p = resultados['pareto']
        print(f"\n📈 ANÁLISIS PARETO:")
        print(f"   • {p.get('clientes_top_80_pct', 0)} clientes generan 80% de ingresos")
        print(f"   • Ratio Pareto: {p.get('ratio_pareto', 0):.1f}%")
        print(f"   • Top 10 clientes: {p.get('concentracion', {}).get('top_10_clientes_pct', 0):.1f}% del ingreso")
    
    if 'segmentacion_rfm' in resultados:
        rfm = resultados['segmentacion_rfm']
        print(f"\n🎯 SEGMENTACIÓN RFM:")
        for seg, cant in rfm.get('distribucion_segmentos', {}).items():
            print(f"   • {seg}: {cant} clientes")
    
    print("\n" + "=" * 80)
    print("✅ ANÁLISIS COMPLETADO EXITOSAMENTE")
    print("=" * 80)
    print(f"\n📁 Archivos generados en: {base_path}/analysis_output/")
    print(f"   • Excel: {Path(archivo_excel).name}")
    print(f"   • JSON: {Path(archivo_json).name}")
    print(f"   • Markdown: {Path(archivo_md).name}")
    print()
    
    return resultados


if __name__ == "__main__":
    resultados = main()
