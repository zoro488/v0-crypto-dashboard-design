import { NextRequest, NextResponse } from 'next/server'
import { 
  getReporteVentas, 
  getReporteBancos, 
  getReporteClientes, 
  getReporteDistribuidores,
  getReporteAlmacen,
  getResumenFinanciero,
} from '@/app/_actions/reportes'

export const dynamic = 'force-dynamic'

type ReportType = 'ventas' | 'bancos' | 'clientes' | 'distribuidores' | 'almacen' | 'financiero'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> }
) {
  try {
    const { tipo } = await params
    const { searchParams } = new URL(request.url)
    
    // Parsear fechas de query params
    const fechaInicioStr = searchParams.get('fechaInicio')
    const fechaFinStr = searchParams.get('fechaFin')
    const bancoId = searchParams.get('bancoId')
    const clienteId = searchParams.get('clienteId')
    const distribuidorId = searchParams.get('distribuidorId')

    const fechaInicio = fechaInicioStr 
      ? new Date(fechaInicioStr) 
      : new Date(new Date().setMonth(new Date().getMonth() - 1))
    
    const fechaFin = fechaFinStr 
      ? new Date(fechaFinStr) 
      : new Date()

    const filtros = {
      fechaInicio,
      fechaFin,
      bancoId: bancoId || undefined,
      clienteId: clienteId || undefined,
      distribuidorId: distribuidorId || undefined,
    }

    let result

    switch (tipo as ReportType) {
      case 'ventas':
        result = await getReporteVentas(filtros)
        break
      
      case 'bancos':
        result = await getReporteBancos(filtros)
        break
      
      case 'clientes':
        result = await getReporteClientes()
        break
      
      case 'distribuidores':
        result = await getReporteDistribuidores(filtros)
        break
      
      case 'almacen':
        result = await getReporteAlmacen()
        break
      
      case 'financiero':
        result = await getResumenFinanciero(filtros)
        break
      
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte inválido' },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      tipo,
      filtros: {
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error en API reportes:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte' },
      { status: 500 }
    )
  }
}
