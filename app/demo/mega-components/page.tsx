'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PremiumStatCard,
  QuantumTable,
  HolographicAreaChart,
  type ColumnDef,
} from '@/app/components/ui-premium'
import { AIVoiceAssistant } from '@/app/components/ai'
import { 
  Wallet, 
  TrendingUp, 
  CreditCard,
  BarChart3,
} from 'lucide-react'
import '@/app/styles/chronos-obsidian-os.css'

// Datos de ejemplo para la tabla
interface TransactionRow extends Record<string, unknown> {
  id: string
  cliente: string
  monto: number
  fecha: string
  estado: string
  tipo: string
}

const sampleTransactions: TransactionRow[] = [
  { id: '1', cliente: 'Carlos López', monto: 15000, fecha: '2024-01-15', estado: 'completado', tipo: 'Venta' },
  { id: '2', cliente: 'María García', monto: 8500, fecha: '2024-01-14', estado: 'pendiente', tipo: 'Venta' },
  { id: '3', cliente: 'Juan Martínez', monto: 22000, fecha: '2024-01-13', estado: 'completado', tipo: 'Compra' },
  { id: '4', cliente: 'Ana Rodríguez', monto: 5200, fecha: '2024-01-12', estado: 'procesando', tipo: 'Venta' },
  { id: '5', cliente: 'Pedro Sánchez', monto: 18000, fecha: '2024-01-11', estado: 'completado', tipo: 'Venta' },
  { id: '6', cliente: 'Laura Fernández', monto: 12500, fecha: '2024-01-10', estado: 'cancelado', tipo: 'Compra' },
  { id: '7', cliente: 'Diego Hernández', monto: 9800, fecha: '2024-01-09', estado: 'completado', tipo: 'Venta' },
  { id: '8', cliente: 'Sofia Moreno', monto: 31000, fecha: '2024-01-08', estado: 'pendiente', tipo: 'Venta' },
]

const columns: ColumnDef<TransactionRow>[] = [
  { id: 'cliente', header: 'Cliente', accessor: 'cliente' },
  { id: 'monto', header: 'Monto', accessor: 'monto', format: 'currency', align: 'right' },
  { id: 'fecha', header: 'Fecha', accessor: 'fecha', format: 'date' },
  { id: 'estado', header: 'Estado', accessor: 'estado', format: 'status' },
  { id: 'tipo', header: 'Tipo', accessor: 'tipo' },
]

// Datos para el gráfico (compatible con HolographicAreaChart)
const chartData = [
  { fecha: 'Ene', monto: 45000 },
  { fecha: 'Feb', monto: 52000 },
  { fecha: 'Mar', monto: 48000 },
  { fecha: 'Abr', monto: 61000 },
  { fecha: 'May', monto: 55000 },
  { fecha: 'Jun', monto: 67000 },
  { fecha: 'Jul', monto: 72000 },
]

// Sparkline data
const generateSparkline = () => 
  Array.from({ length: 20 }, () => Math.random() * 100 + 50)

export default function MegaComponentsDemo() {
  const [loading, setLoading] = useState(false)

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        background: 'linear-gradient(135deg, #030308 0%, #0a0a0f 50%, #050510 100%)',
      }}
    >
      {/* Header */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 
          className="text-5xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CHRONOS OBSIDIAN OS
        </h1>
        <p className="text-white/40 text-lg tracking-widest uppercase">
          Premium Components Showcase
        </p>
      </motion.div>

      {/* AI Voice Assistant - Floating */}
      <AIVoiceAssistant 
        onSendMessage={async (msg: string) => {
          console.log('AI Message:', msg)
          return 'Respuesta de ejemplo del asistente'
        }}
      />

      {/* Premium Stat Cards */}
      <section className="mb-16">
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
          📊 Premium Stat Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumStatCard
            title="Capital Total"
            value={2847500}
            prefix="$"
            trend={13.9}
            trendLabel="vs mes anterior"
            icon={<Wallet className="w-5 h-5" />}
            variant="emerald"
            sparklineData={generateSparkline()}
          />
          <PremiumStatCard
            title="Ventas del Mes"
            value={156}
            suffix=" ventas"
            trend={9.8}
            trendLabel="vs mes anterior"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="sapphire"
            sparklineData={generateSparkline()}
          />
          <PremiumStatCard
            title="Ticket Promedio"
            value={18250}
            prefix="$"
            trend={2.5}
            trendLabel="vs mes anterior"
            icon={<CreditCard className="w-5 h-5" />}
            variant="amethyst"
            sparklineData={generateSparkline()}
          />
          <PremiumStatCard
            title="ROI Mensual"
            value={23.5}
            suffix="%"
            trend={16.9}
            trendLabel="vs mes anterior"
            icon={<BarChart3 className="w-5 h-5" />}
            variant="cyan"
            sparklineData={generateSparkline()}
          />
        </div>
      </section>

      {/* Holographic Chart */}
      <section className="mb-16">
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
          📈 Holographic Area Chart
        </h2>
        <div className="rounded-3xl p-6" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
          <HolographicAreaChart
            data={chartData}
            height={400}
            variant="emerald"
          />
        </div>
      </section>

      {/* Quantum Table */}
      <section className="mb-16">
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
          🔮 Quantum Table
        </h2>
        <QuantumTable
          data={sampleTransactions}
          columns={columns}
          loading={loading}
          onRowClick={(row) => console.log('Row clicked:', row)}
          onEdit={(row) => console.log('Edit:', row)}
          onDelete={(row) => console.log('Delete:', row)}
          onView={(row) => console.log('View:', row)}
          variant="cyan"
          maxHeight={500}
        />
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => setLoading(!loading)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Toggle Loading State
          </button>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        className="text-center py-12 border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-white/20 text-sm tracking-widest">
          CHRONOS OBSIDIAN OS • PREMIUM EXPERIENCE
        </p>
      </motion.footer>
    </div>
  )
}
