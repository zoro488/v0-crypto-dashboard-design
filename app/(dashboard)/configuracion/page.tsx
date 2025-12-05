import { Metadata } from 'next'
import { ConfiguracionClient } from './_components/ConfiguracionClient'

export const metadata: Metadata = {
  title: 'Configuración | CHRONOS',
  description: 'Configuración del sistema',
}

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias del sistema
        </p>
      </header>

      <ConfiguracionClient />
    </div>
  )
}
