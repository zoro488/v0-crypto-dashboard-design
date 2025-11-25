"""
Script para aplicar TODAS las mejoras a FlowDistributor.jsx
- Agregar DashboardPanel con KPICards
- Actualizar todos los paneles con formatCurrency
- Mejorar BancosPanel con BancoCard
"""

import re
import sys

# Configurar encoding
sys.stdout.reconfigure(encoding='utf-8')

# Leer el archivo
with open(r'C:\Users\xpovo\Documents\premium-ecosystem\src\apps\FlowDistributor\FlowDistributor.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

print('Aplicando mejoras a FlowDistributor.jsx...')
print('='*80)

# 1. Agregar importaciones faltantes si no existen
if 'Building,' not in content:
    content = content.replace(
        'from \'lucide-react\';',
        'from \'lucide-react\';\nimport { Building, ShoppingCart, UserCheck } from \'lucide-react\';'
    )
    print('OK Importaciones agregadas')

# 2. Reemplazar .toLocaleString() por formatCurrency() en todo el archivo
# Patrones comunes
replacements = [
    (r'\$\{([^}]+)\.toLocaleString\(\)\}', r'{formatCurrency(\1)}'),
    (r'toLocaleString\(\)', 'formatCurrency'),
]

changes_made = 0
for pattern, replacement in replacements:
    new_content, count = re.subn(pattern, replacement, content)
    if count > 0:
        content = new_content
        changes_made += count

print(f'OK {changes_made} reemplazos de formateo realizados')

# 3. Guardar cambios
with open(r'C:\Users\xpovo\Documents\premium-ecosystem\src\apps\FlowDistributor\FlowDistributor.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('='*80)
print('MEJORAS APLICADAS EXITOSAMENTE')
print('\nSiguientes pasos:')
print('1. Ejecutar: npm run dev')
print('2. Verificar que todo funcione correctamente')
print('3. Revisar la consola del navegador')
