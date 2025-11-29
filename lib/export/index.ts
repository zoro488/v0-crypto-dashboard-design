/**
 * Módulo de exportación a Excel y PDF
 * 
 * Proporciona funciones para exportar datos del sistema CHRONOS
 * a formatos Excel (xlsx) y PDF.
 */

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ===================================================================
// TIPOS
// ===================================================================

export interface ExportColumn<T> {
  /** Clave del campo en el objeto de datos */
  key: keyof T | string
  /** Título de la columna en el archivo exportado */
  header: string
  /** Ancho de la columna (opcional, para Excel) */
  width?: number
  /** Función de formato para el valor (opcional) */
  // eslint-disable-next-line no-unused-vars
  format?: (value: unknown, row: T) => string | number
}

export interface ExportOptions<T> {
  /** Nombre del archivo (sin extensión) */
  filename: string
  /** Título del reporte (para PDF) */
  title?: string
  /** Subtítulo o descripción */
  subtitle?: string
  /** Columnas a exportar */
  columns: ExportColumn<T>[]
  /** Datos a exportar */
  data: T[]
  /** Nombre de la hoja (para Excel) */
  sheetName?: string
  /** Incluir fecha de generación */
  includeDate?: boolean
  /** Orientación de página (para PDF) */
  orientation?: 'portrait' | 'landscape'
}

export interface ExportResult {
  success: boolean
  filename: string
  error?: string
}

// ===================================================================
// UTILIDADES
// ===================================================================

/**
 * Obtiene el valor de una propiedad anidada usando notación de punto
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Formatea una fecha para mostrar
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea un valor numérico como moneda
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatea un valor de forma segura como moneda (maneja null/undefined)
 */
function safeFormatCurrency(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'number') {
    return formatCurrency(value)
  }
  const num = Number(value)
  return isNaN(num) ? String(value) : formatCurrency(num)
}

/**
 * Prepara los datos para exportación según las columnas definidas
 */
function prepareData<T>(data: T[], columns: ExportColumn<T>[]): (string | number)[][] {
  return data.map((row) => {
    return columns.map((col) => {
      const rawValue = getNestedValue(row, col.key as string)
      
      if (col.format) {
        return col.format(rawValue, row)
      }
      
      if (rawValue === null || rawValue === undefined) {
        return ''
      }
      
      if (typeof rawValue === 'number') {
        return rawValue
      }
      
      if (rawValue instanceof Date) {
        return formatDate(rawValue)
      }
      
      return String(rawValue)
    })
  })
}

// ===================================================================
// EXPORTACIÓN A EXCEL
// ===================================================================

/**
 * Exporta datos a formato Excel (.xlsx)
 * 
 * @example
 * ```typescript
 * await exportToExcel({
 *   filename: 'ventas-enero',
 *   title: 'Reporte de Ventas',
 *   sheetName: 'Ventas',
 *   columns: [
 *     { key: 'fecha', header: 'Fecha' },
 *     { key: 'cliente', header: 'Cliente' },
 *     { key: 'totalVenta', header: 'Total', format: formatCurrency },
 *   ],
 *   data: ventas,
 * })
 * ```
 */
export async function exportToExcel<T>(options: ExportOptions<T>): Promise<ExportResult> {
  const {
    filename,
    title,
    subtitle,
    columns,
    data,
    sheetName = 'Datos',
    includeDate = true,
  } = options

  try {
    // Preparar headers
    const headers = columns.map((col) => col.header)
    
    // Preparar datos
    const preparedData = prepareData(data, columns)
    
    // Crear array de datos para la hoja
    const sheetData: (string | number)[][] = []
    
    // Agregar título si existe
    if (title) {
      sheetData.push([title])
      sheetData.push([]) // Fila vacía
    }
    
    // Agregar subtítulo si existe
    if (subtitle) {
      sheetData.push([subtitle])
      sheetData.push([]) // Fila vacía
    }
    
    // Agregar fecha de generación
    if (includeDate) {
      sheetData.push([`Generado: ${formatDate(new Date())}`])
      sheetData.push([]) // Fila vacía
    }
    
    // Agregar headers y datos
    sheetData.push(headers)
    sheetData.push(...preparedData)
    
    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Configurar anchos de columna
    const colWidths = columns.map((col) => ({
      wch: col.width || Math.max(col.header.length, 15),
    }))
    worksheet['!cols'] = colWidths
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    // Generar archivo y descargar
    const finalFilename = `${filename}.xlsx`
    XLSX.writeFile(workbook, finalFilename)
    
    return {
      success: true,
      filename: finalFilename,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      filename: '',
      error: `Error al exportar a Excel: ${errorMessage}`,
    }
  }
}

// ===================================================================
// EXPORTACIÓN A PDF
// ===================================================================

/**
 * Exporta datos a formato PDF
 * 
 * @example
 * ```typescript
 * await exportToPDF({
 *   filename: 'reporte-bancos',
 *   title: 'Estado de Bancos',
 *   subtitle: 'Sistema CHRONOS',
 *   orientation: 'landscape',
 *   columns: [
 *     { key: 'nombre', header: 'Banco' },
 *     { key: 'capitalActual', header: 'Capital', format: formatCurrency },
 *   ],
 *   data: bancos,
 * })
 * ```
 */
export async function exportToPDF<T>(options: ExportOptions<T>): Promise<ExportResult> {
  const {
    filename,
    title,
    subtitle,
    columns,
    data,
    includeDate = true,
    orientation = 'portrait',
  } = options

  try {
    // Crear documento PDF
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    })

    // Configurar fuente
    doc.setFont('helvetica')
    
    let currentY = 15
    
    // Agregar título
    if (title) {
      doc.setFontSize(18)
      doc.setTextColor(33, 33, 33)
      doc.text(title, 14, currentY)
      currentY += 10
    }
    
    // Agregar subtítulo
    if (subtitle) {
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(subtitle, 14, currentY)
      currentY += 8
    }
    
    // Agregar fecha de generación
    if (includeDate) {
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generado: ${formatDate(new Date())}`, 14, currentY)
      currentY += 10
    }
    
    // Preparar datos para la tabla
    const headers = columns.map((col) => col.header)
    const tableData = prepareData(data, columns)
    
    // Generar tabla usando autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue-500
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Gray-50
      },
      columnStyles: columns.reduce((acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width }
        }
        return acc
      }, {} as Record<number, { cellWidth: number }>),
      margin: { top: 10, left: 14, right: 14, bottom: 10 },
      didDrawPage: (pageData) => {
        // Agregar número de página
        const pageCount = doc.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Página ${pageData.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10,
        )
      },
    })
    
    // Guardar PDF
    const finalFilename = `${filename}.pdf`
    doc.save(finalFilename)
    
    return {
      success: true,
      filename: finalFilename,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      filename: '',
      error: `Error al exportar a PDF: ${errorMessage}`,
    }
  }
}

// ===================================================================
// FUNCIONES DE CONVENIENCIA
// ===================================================================

/**
 * Exporta ventas a Excel
 */
export async function exportVentasToExcel(
  ventas: Array<{
    fecha: string
    cliente: string
    cantidad: number
    precioVenta: number
    totalVenta: number
    estadoPago: string
  }>,
): Promise<ExportResult> {
  return exportToExcel({
    filename: `ventas-${new Date().toISOString().split('T')[0]}`,
    title: 'Reporte de Ventas',
    subtitle: 'Sistema CHRONOS',
    sheetName: 'Ventas',
    columns: [
      { key: 'fecha', header: 'Fecha', width: 12 },
      { key: 'cliente', header: 'Cliente', width: 25 },
      { key: 'cantidad', header: 'Cantidad', width: 10 },
      { key: 'precioVenta', header: 'Precio Unit.', width: 15, format: (v) => safeFormatCurrency(v) },
      { key: 'totalVenta', header: 'Total', width: 15, format: (v) => safeFormatCurrency(v) },
      { key: 'estadoPago', header: 'Estado', width: 12 },
    ],
    data: ventas,
  })
}

/**
 * Exporta estado de bancos a PDF
 */
export async function exportBancosToPDF(
  bancos: Array<{
    nombre: string
    capitalActual: number
    historicoIngresos: number
    historicoGastos: number
  }>,
): Promise<ExportResult> {
  return exportToPDF({
    filename: `bancos-${new Date().toISOString().split('T')[0]}`,
    title: 'Estado de Bancos',
    subtitle: 'Sistema CHRONOS - Resumen de Capital',
    orientation: 'landscape',
    columns: [
      { key: 'nombre', header: 'Banco', width: 40 },
      { key: 'capitalActual', header: 'Capital Actual', width: 35, format: (v) => safeFormatCurrency(v) },
      { key: 'historicoIngresos', header: 'Total Ingresos', width: 35, format: (v) => safeFormatCurrency(v) },
      { key: 'historicoGastos', header: 'Total Gastos', width: 35, format: (v) => safeFormatCurrency(v) },
    ],
    data: bancos,
  })
}

/**
 * Exporta movimientos a Excel
 */
export async function exportMovimientosToExcel(
  movimientos: Array<{
    fecha: string
    bancoId: string
    tipoMovimiento: string
    monto: number
    concepto: string
  }>,
): Promise<ExportResult> {
  return exportToExcel({
    filename: `movimientos-${new Date().toISOString().split('T')[0]}`,
    title: 'Historial de Movimientos',
    subtitle: 'Sistema CHRONOS',
    sheetName: 'Movimientos',
    columns: [
      { key: 'fecha', header: 'Fecha', width: 12 },
      { key: 'bancoId', header: 'Banco', width: 15 },
      { key: 'tipoMovimiento', header: 'Tipo', width: 15 },
      { key: 'monto', header: 'Monto', width: 15, format: (v) => safeFormatCurrency(v) },
      { key: 'concepto', header: 'Concepto', width: 30 },
    ],
    data: movimientos,
  })
}

// Re-exportar utilidades de formato
export { formatCurrency, safeFormatCurrency, formatDate }
