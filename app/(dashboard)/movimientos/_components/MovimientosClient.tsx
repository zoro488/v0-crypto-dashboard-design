'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Filter,
  Calendar,
  Wallet,
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/app/_lib/utils'
import { BANCOS_CONFIG } from '@/app/_lib/constants/bancos'
import type { Movimiento, Banco } from '@/database/schema'

interface MovimientosClientProps {
  initialMovimientos: Movimiento[]
  bancos: Banco[]
}

const tipoConfig = {
  ingreso: {
    label: 'Ingreso',
    icon: ArrowUpRight,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  egreso: {
    label: 'Egreso',
    icon: ArrowDownRight,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  transferencia: {
    label: 'Transferencia',
    icon: ArrowRightLeft,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
}

export function MovimientosClient({ 
  initialMovimientos,
  bancos,
}: MovimientosClientProps) {
  const [movimientos] = useState(initialMovimientos)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTipo, setFilterTipo] = useState<string | null>(null)
  const [filterBanco, setFilterBanco] = useState<string | null>(null)

  const filteredMovimientos = movimientos.filter(mov => {
    const matchesSearch = 
      mov.concepto?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTipo = !filterTipo || mov.tipo === filterTipo
    const matchesBanco = !filterBanco || mov.bancoId === filterBanco
    return matchesSearch && matchesTipo && matchesBanco
  })

  const getBancoNombre = (bancoId: string) => {
    const banco = bancos.find(b => b.id === bancoId)
    return banco?.nombre || bancoId
  }

  const getBancoColor = (bancoId: string) => {
    const config = BANCOS_CONFIG[bancoId as keyof typeof BANCOS_CONFIG]
    return config?.color || '#8B5CF6'
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar movimientos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          
          <select
            value={filterTipo || ''}
            onChange={(e) => setFilterTipo(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
            <option value="transferencia">Transferencias</option>
          </select>

          <select
            value={filterBanco || ''}
            onChange={(e) => setFilterBanco(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Todos los bancos</option>
            {bancos.map(banco => (
              <option key={banco.id} value={banco.id}>{banco.nombre}</option>
            ))}
          </select>
        </div>

        <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Movimientos List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden"
      >
        <div className="divide-y divide-white/5">
          <AnimatePresence mode="popLayout">
            {filteredMovimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  No hay movimientos registrados
                </p>
              </div>
            ) : (
              filteredMovimientos.map((mov, index) => {
                const tipo = tipoConfig[mov.tipo as keyof typeof tipoConfig] || tipoConfig.ingreso
                const TipoIcon = tipo.icon
                const bancoColor = getBancoColor(mov.bancoId)

                return (
                  <motion.div
                    key={mov.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className="group flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                      tipo.bg
                    )}>
                      <TipoIcon className={cn('h-5 w-5', tipo.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {mov.concepto || 'Sin concepto'}
                        </p>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          tipo.bg,
                          tipo.color
                        )}>
                          {tipo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Wallet className="h-3.5 w-3.5" />
                          <span 
                            className="font-medium"
                            style={{ color: bancoColor }}
                          >
                            {getBancoNombre(mov.bancoId)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(mov.fecha)}
                        </span>
                        {mov.referencia && (
                          <span className="text-xs opacity-60">
                            Ref: {mov.referencia}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={cn(
                        'font-mono font-semibold text-lg',
                        mov.tipo === 'ingreso' || mov.tipo === 'abono' ? 'text-green-400' : 
                        mov.tipo === 'gasto' || mov.tipo === 'pago' ? 'text-red-400' : 'text-blue-400'
                      )}>
                        {mov.tipo === 'ingreso' || mov.tipo === 'abono' ? '+' : 
                         mov.tipo === 'gasto' || mov.tipo === 'pago' ? '-' : ''}
                        {formatCurrency(mov.monto)}
                      </p>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
