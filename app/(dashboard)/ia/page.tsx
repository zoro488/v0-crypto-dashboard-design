import { Suspense } from 'react'
import { IAClient } from './_components/IAClient'
import { LoadingSpinner } from '@/app/_components/ui/LoadingSpinner'

export const metadata = {
  title: 'IA Asistente | CHRONOS',
  description: 'Asistente de inteligencia artificial',
}

export default function IAPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<LoadingSpinner />}>
        <IAClient />
      </Suspense>
    </div>
  )
}
