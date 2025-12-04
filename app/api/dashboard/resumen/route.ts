import { NextResponse } from 'next/server'
import { getDashboardResumen } from '@/app/_actions/reportes'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await getDashboardResumen()

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error en API dashboard/resumen:', error)
    return NextResponse.json(
      { error: 'Error al obtener resumen del dashboard' },
      { status: 500 }
    )
  }
}
