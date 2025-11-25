#!/usr/bin/env node

/**
 * Quick Start Script - Chronos Migration
 * Ejecuta limpieza y análisis de datos en un solo comando
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 CHRONOS - QUICK START MIGRATION\n');
console.log('='.repeat(60));

// Verificar archivos necesarios
const baseDataPath = path.join(process.cwd(), 'BASE_DATOS_excel_data.json');
const scriptsDir = path.join(process.cwd(), 'scripts');

if (!fs.existsSync(baseDataPath)) {
  console.error('\n❌ Error: No se encontró BASE_DATOS_excel_data.json');
  console.error('   Por favor, asegúrate de que el archivo esté en la raíz del proyecto.\n');
  process.exit(1);
}

if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
  console.log('✅ Directorio scripts/ creado');
}

try {
  console.log('\n📦 Instalando dependencias de scripts...\n');
  
  // Instalar dependencias de scripts
  process.chdir(scriptsDir);
  
  if (!fs.existsSync('node_modules')) {
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('   ℹ️  Dependencias ya instaladas');
  }

  console.log('\n✨ Dependencias listas\n');
  console.log('='.repeat(60));
  
  // Ejecutar limpieza
  console.log('\n🧹 PASO 1: Limpiando datos...\n');
  execSync('npm run clean', { stdio: 'inherit' });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ LIMPIEZA COMPLETADA\n');
  
  // Mostrar archivos generados
  const cleanedPath = path.join(process.cwd(), '..', 'BASE_DATOS_CLEANED.json');
  const reportPath = path.join(process.cwd(), '..', 'CLEANING_REPORT.json');
  
  console.log('📁 Archivos generados:');
  console.log(`   1. ${path.relative(process.cwd(), cleanedPath)}`);
  console.log(`   2. ${path.relative(process.cwd(), reportPath)}`);
  
  // Mostrar estadísticas del reporte
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Total correcciones: ${report.totalFixes}`);
    console.log(`   - Ventas: ${report.resumenDatos.ventas}`);
    console.log(`   - Clientes: ${report.resumenDatos.clientes}`);
    console.log(`   - Distribuidores: ${report.resumenDatos.distribuidores}`);
    console.log(`   - Bancos: ${report.resumenDatos.bancos}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 PROCESO COMPLETADO\n');
  console.log('📋 Próximos pasos:');
  console.log('   1. Revisa CLEANING_REPORT.json para ver todos los cambios');
  console.log('   2. Ejecuta "npm run migrate" para migrar a Firestore');
  console.log('   3. O ejecuta "npm run migrate:verify" para verificar migración\n');

} catch (error) {
  console.error('\n❌ Error durante el proceso:', error.message);
  process.exit(1);
}
