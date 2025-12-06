import { Suspense } from 'react'
import { ReportesClient } from './_components/ReportesClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'Reportes | CHRONOS',
  description: 'Centro de reportes y análisis',
}

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis financiero y reportes del sistema
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <ReportesClient />
      </Suspense>
    </div>
  )
}
