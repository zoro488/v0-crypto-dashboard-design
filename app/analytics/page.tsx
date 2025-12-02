'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store/useAppStore'
import { Loader2 } from 'lucide-react'

/**
 * Página de Analytics - Redirige al panel de Reportes Premium
 * Los analytics avanzados ahora están integrados en BentoReportesPremium
 */
export default function AnalyticsPage() {
  const router = useRouter()
  const { setCurrentPanel } = useAppStore()

  useEffect(() => {
    // Redirigir al panel de reportes
    setCurrentPanel('reportes')
    router.push('/')
  }, [router, setCurrentPanel])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-[#E31911] animate-spin mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Redirigiendo a Reportes...</p>
        <p className="text-white/60 mt-2">Analytics integrado en panel Premium</p>
      </div>
    </div>
  )
}
