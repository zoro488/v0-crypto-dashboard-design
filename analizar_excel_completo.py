import json
import sys

# Configurar encoding de salida
sys.stdout.reconfigure(encoding='utf-8')

# Cargar datos del Excel
with open(r'C:\Users\xpovo\Documents\premium-ecosystem\public\excel_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('ANALISIS COMPLETO DEL EXCEL')
print('='*80)

# Ventas
ventas = data.get("ventas", [])
print(f'\nVENTAS: {len(ventas)} registros')
if ventas:
    print(f'   Primera venta: {ventas[0].get("id", "N/A")}')
    print(f'   Ultima venta: {ventas[-1].get("id", "N/A")}')
    total_ventas = sum(v.get("totalVenta", 0) for v in ventas)
    print(f'   Total en ventas: ${total_ventas:,.2f}')

# Clientes
clientes = data.get("clientes", [])
print(f'\nCLIENTES: {len(clientes)} registros')
if clientes:
    print(f'   Primero: {clientes[0].get("nombre", "N/A")}')
    print(f'   Ultimo: {clientes[-1].get("nombre", "N/A")}')
    total_adeudo = sum(c.get("adeudo", 0) for c in clientes if c.get("adeudo", 0) > 0)
    print(f'   Total adeudos: ${total_adeudo:,.2f}')

# Distribuidores
distribuidores = data.get("distribuidores", [])
print(f'\nDISTRIBUIDORES: {len(distribuidores)} registros')
if distribuidores:
    for dist in distribuidores:
        print(f'   - {dist.get("nombre", "N/A")}: Adeudo ${dist.get("adeudo", 0):,.2f}')

# Ordenes de Compra
ordenes = data.get("ordenesCompra", [])
print(f'\nORDENES DE COMPRA: {len(ordenes)} registros')
if ordenes:
    for oc in ordenes:
        print(f'   - {oc.get("id", "N/A")}: {oc.get("cantidad", 0)} unidades, ${oc.get("costoTotal", 0):,.2f}')

# Bancos
bancos = data.get("bancos", {})
print(f'\nBANCOS: {len(bancos)} registros')
if bancos:
    for nombre, banco in bancos.items():
        capital = banco.get("capitalActual", 0)
        print(f'   - {nombre}: ${capital:,.2f}')

# Gastos y Abonos
gastos = data.get("gastosAbonos", [])
print(f'\nGASTOS Y ABONOS: {len(gastos)} registros')

# Almacen
almacen = data.get('almacen', {})
if almacen:
    print(f'\nALMACEN:')
    print(f'   Stock actual: {almacen.get("stockActual", 0)} unidades')
    print(f'   Total entradas: {almacen.get("totalEntradas", 0)}')
    print(f'   Total salidas: {almacen.get("totalSalidas", 0)}')
    print(f'   Valor inventario: ${almacen.get("valorInventario", 0):,.2f}')

# Resumen
resumen = data.get('resumen', {})
if resumen:
    print(f'\nRESUMEN:')
    for key, value in resumen.items():
        print(f'   {key}: {value}')

print('\n' + '='*80)
print('ANALISIS COMPLETADO')
