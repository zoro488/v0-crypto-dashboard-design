'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock,
  TrendingUp, TrendingDown, Calendar, Filter, Download, RefreshCcw,
  ChevronRight, CheckCircle2, X, Scan, FileText,
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { BancoId, Banco, Movimiento, CorteBancario } from '@/app/types'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏦 BANK VAULT PANEL - The Financial Vaults
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Template reutilizable para los 7 bancos del sistema con:
 * - Tarjeta Hero estilo tarjeta de crédito metálica
 * - Gradiente mesh animado según themeColor
 * - Tabs flotantes de Glass Pills
 * - Lista de transacciones estilo QuantumTable
 * - Funcionalidad de Corte con animación de escaneo
 */

type ThemeColor = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan' | 'indigo'

interface BankVaultPanelProps {
  banco: Banco
  movimientos: Movimiento[]
  cortes?: CorteBancario[]
  themeColor?: ThemeColor
  onTransfer?: (monto: number, destino: BancoId) => void
  onCorte?: () => Promise<CorteBancario>
  onExport?: (formato: 'csv' | 'pdf') => void
}

type TabId = 'movimientos' | 'transferencias' | 'cortes'

const THEME_CONFIGS: Record<ThemeColor, {
  gradient: string
  accent: string
  glow: string
  border: string
  text: string
}> = {
  blue: {
    gradient: 'from-blue-600 via-blue-500 to-indigo-600',
    accent: 'bg-blue-500',
    glow: 'shadow-blue-500/30',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  emerald: {
    gradient: 'from-emerald-600 via-teal-500 to-emerald-600',
    accent: 'bg-emerald-500',
    glow: 'shadow-emerald-500/30',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  purple: {
    gradient: 'from-purple-600 via-violet-500 to-purple-600',
    accent: 'bg-purple-500',
    glow: 'shadow-purple-500/30',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
  amber: {
    gradient: 'from-amber-600 via-orange-500 to-amber-600',
    accent: 'bg-amber-500',
    glow: 'shadow-amber-500/30',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
  rose: {
    gradient: 'from-rose-600 via-pink-500 to-rose-600',
    accent: 'bg-rose-500',
    glow: 'shadow-rose-500/30',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
  },
  cyan: {
    gradient: 'from-cyan-600 via-teal-400 to-cyan-600',
    accent: 'bg-cyan-500',
    glow: 'shadow-cyan-500/30',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  },
  indigo: {
    gradient: 'from-indigo-600 via-blue-500 to-indigo-600',
    accent: 'bg-indigo-500',
    glow: 'shadow-indigo-500/30',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
  },
}

const BANCO_THEMES: Record<BancoId, ThemeColor> = {
  boveda_monte: 'purple',
  boveda_usa: 'blue',
  profit: 'emerald',
  leftie: 'cyan',
  azteca: 'amber',
  flete_sur: 'rose',
  utilidades: 'indigo',
}

export default function BankVaultPanel({
  banco,
  movimientos,
  cortes = [],
  themeColor,
  onTransfer,
  onCorte,
  onExport,
}: BankVaultPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('movimientos')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<CorteBancario | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'gasto' | 'transferencia'>('all')
  
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Tema basado en el banco o prop
  const theme = THEME_CONFIGS[themeColor || BANCO_THEMES[banco.id] || 'blue']

  // Transformaciones para efecto tilt
  const rotateX = useTransform(mouseY, [0, 300], [5, -5])
  const rotateY = useTransform(mouseX, [0, 500], [-5, 5])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])

  // Filtrar movimientos
  const filteredMovimientos = useMemo(() => {
    let result = movimientos.filter(m => m.bancoId === banco.id)
    
    if (filterType !== 'all') {
      result = result.filter(m => {
        if (filterType === 'transferencia') {
          return m.tipoMovimiento.includes('transferencia')
        }
        return m.tipoMovimiento === filterType
      })
    }
    
    return result.slice(0, 50)
  }, [movimientos, banco.id, filterType])

  // Estadísticas
  const stats = useMemo(() => {
    const ingresos = filteredMovimientos
      .filter(m => m.tipoMovimiento === 'ingreso')
      .reduce((acc, m) => acc + m.monto, 0)
    
    const gastos = filteredMovimientos
      .filter(m => m.tipoMovimiento === 'gasto')
      .reduce((acc, m) => acc + m.monto, 0)
    
    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
      transacciones: filteredMovimientos.length,
    }
  }, [filteredMovimientos])

  // Handler de Corte con animación de escaneo
  const handleCorte = async () => {
    if (!onCorte) return
    
    setIsScanning(true)
    
    // Simular escaneo
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const corte = await onCorte()
      setScanResult(corte)
    } catch (error) {
      console.error('Error al realizar corte:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof Wallet }[] = [
    { id: 'movimientos', label: 'Movimientos', icon: Clock },
    { id: 'transferencias', label: 'Transferencias', icon: ArrowRightLeft },
    { id: 'cortes', label: 'Cortes', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Card - Tarjeta de Crédito Metálica */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        style={{ 
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
        className={cn(
          'relative h-56 md:h-64 rounded-3xl overflow-hidden cursor-pointer',
          `shadow-2xl ${theme.glow}`,
        )}
      >
        {/* Fondo con Gradiente Mesh Animado */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br',
          theme.gradient,
        )}>
          {/* Mesh pattern animado */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Brillo especular que sigue al mouse */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mouseX.get()}px ${mouseY.get()}px, rgba(255,255,255,0.15), transparent 40%)`,
          }}
        />

        {/* Textura de ruido sutil */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Contenido */}
        <div className="relative z-10 h-full p-6 md:p-8 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Wallet className="w-4 h-4" />
                <span>{banco.tipo.toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">{banco.nombre}</h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40 uppercase tracking-wider">Moneda</div>
              <div className="text-lg font-bold text-white">{banco.moneda}</div>
            </div>
          </div>

          {/* Saldo */}
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Saldo Actual</div>
            <div 
              className="text-4xl md:text-5xl font-bold text-white tracking-tight"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              ${banco.capitalActual.toLocaleString('es-MX', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2, 
              })}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="flex items-end justify-between">
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-white/40">Ingresos</div>
                <div className="flex items-center gap-1 text-emerald-300">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-mono text-sm">
                    +${banco.historicoIngresos.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40">Gastos</div>
                <div className="flex items-center gap-1 text-red-300">
                  <TrendingDown className="w-3 h-3" />
                  <span className="font-mono text-sm">
                    -${banco.historicoGastos.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right opacity-60">
              <div className="text-xs text-white/40">ID</div>
              <div className="font-mono text-sm text-white">{banco.id.toUpperCase()}</div>
            </div>
          </div>

          {/* Líneas decorativas (tipo tarjeta) */}
          <div className="absolute top-6 right-6 w-12 h-8 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-5 rounded-sm bg-gradient-to-br from-amber-400/80 to-amber-600/80" />
          </div>
        </div>
      </motion.div>

      {/* Tabs de Navegación - Glass Pills */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors',
              activeTab === tab.id 
                ? 'text-white' 
                : 'text-white/40 hover:text-white/60',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className={cn(
                  'absolute inset-0 rounded-xl',
                  'bg-white/10',
                  `shadow-lg ${theme.glow}`,
                )}
                style={{
                  boxShadow: `0 0 20px ${theme.glow.replace('shadow-', '').replace('/30', '')}`,
                }}
              />
            )}
            <tab.icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10 font-medium text-sm">{tab.label}</span>
          </motion.button>
        ))}

        {/* Actions */}
        <div className="flex-1" />
        <div className="flex items-center gap-2 pr-1">
          <motion.button
            onClick={() => onExport?.('csv')}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleCorte}
            disabled={isScanning}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all',
              'bg-gradient-to-r',
              theme.gradient,
              'text-white shadow-lg',
              theme.glow,
              isScanning && 'opacity-50 cursor-wait',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isScanning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCcw className="w-4 h-4" />
                </motion.div>
                Escaneando...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                Cerrar Caja
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {/* Tab: Movimientos */}
        {activeTab === 'movimientos' && (
          <motion.div
            key="movimientos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Filtros */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/40 text-sm">Filtrar:</span>
              {(['all', 'ingreso', 'gasto', 'transferencia'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filterType === f 
                      ? `bg-white/10 ${theme.text}` 
                      : 'text-white/40 hover:text-white/60',
                  )}
                >
                  {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Lista de Movimientos */}
            <div className="space-y-2">
              {filteredMovimientos.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  No hay movimientos registrados
                </div>
              ) : (
                filteredMovimientos.map((mov, index) => (
                  <TransactionRow 
                    key={mov.id} 
                    movimiento={mov} 
                    index={index}
                    theme={theme}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Transferencias */}
        {activeTab === 'transferencias' && (
          <motion.div
            key="transferencias"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <TransferPanel 
              banco={banco}
              theme={theme}
              onTransfer={onTransfer}
            />
          </motion.div>
        )}

        {/* Tab: Cortes */}
        {activeTab === 'cortes' && (
          <motion.div
            key="cortes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="space-y-3">
              {cortes.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  No hay cortes registrados
                </div>
              ) : (
                cortes.map((corte, index) => (
                  <CorteCard key={corte.id} corte={corte} index={index} theme={theme} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Escaneo/Corte */}
      <AnimatePresence>
        {isScanning && (
          <ScanningOverlay theme={theme} />
        )}
        {scanResult && (
          <CorteResultModal
            corte={scanResult}
            theme={theme}
            onClose={() => setScanResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

function TransactionRow({ 
  movimiento, 
  index,
  theme,
}: { 
  movimiento: Movimiento
  index: number
  theme: typeof THEME_CONFIGS.blue
}) {
  const isIngreso = movimiento.tipoMovimiento === 'ingreso'
  const isGasto = movimiento.tipoMovimiento === 'gasto'
  const isTransferencia = movimiento.tipoMovimiento.includes('transferencia')

  const Icon = isIngreso ? ArrowDownLeft : isGasto ? ArrowUpRight : ArrowRightLeft
  const iconColor = isIngreso ? 'text-emerald-400' : isGasto ? 'text-red-400' : 'text-blue-400'
  const iconBg = isIngreso ? 'bg-emerald-500/20' : isGasto ? 'bg-red-500/20' : 'bg-blue-500/20'

  const fecha = typeof movimiento.fecha === 'string' 
    ? new Date(movimiento.fecha)
    : movimiento.fecha instanceof Date 
      ? movimiento.fecha 
      : new Date()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl',
        'bg-black/40 border border-white/5',
        'hover:bg-white/5 hover:border-white/10 transition-all',
        'group cursor-pointer',
      )}
    >
      {/* Icono */}
      <div className={cn('p-2.5 rounded-xl', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium truncate">{movimiento.concepto}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/40 mt-0.5">
          <span>{fecha.toLocaleDateString('es-MX')}</span>
          {movimiento.cliente && <span>• {movimiento.cliente}</span>}
        </div>
      </div>

      {/* Monto */}
      <div className="text-right">
        <div className={cn(
          'text-lg font-mono font-bold',
          isIngreso ? 'text-emerald-400' : isGasto ? 'text-red-400' : theme.text,
        )}>
          {isIngreso ? '+' : isGasto ? '-' : ''}
          ${movimiento.monto.toLocaleString('es-MX')}
        </div>
        <div className="text-xs text-white/30 capitalize">{movimiento.tipoMovimiento.replace('_', ' ')}</div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
    </motion.div>
  )
}

function TransferPanel({ 
  banco, 
  theme,
  onTransfer, 
}: { 
  banco: Banco
  theme: typeof THEME_CONFIGS.blue
  onTransfer?: (monto: number, destino: BancoId) => void
}) {
  const [monto, setMonto] = useState('')
  const [destino, setDestino] = useState<BancoId | ''>('')

  const bancos = [
    { id: 'boveda_monte' as BancoId, nombre: 'Bóveda Monte' },
    { id: 'boveda_usa' as BancoId, nombre: 'Bóveda USA' },
    { id: 'profit' as BancoId, nombre: 'Profit' },
    { id: 'leftie' as BancoId, nombre: 'Leftie' },
    { id: 'azteca' as BancoId, nombre: 'Azteca' },
    { id: 'flete_sur' as BancoId, nombre: 'Flete Sur' },
    { id: 'utilidades' as BancoId, nombre: 'Utilidades' },
  ].filter(b => b.id !== banco.id)

  return (
    <div className="p-6 rounded-2xl bg-black/40 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Nueva Transferencia</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/40 mb-2">Monto</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className={cn(
                'w-full h-14 pl-8 pr-4 rounded-xl text-xl font-mono',
                'bg-black/40 border border-white/10',
                'text-white placeholder:text-white/20',
                'focus:outline-none focus:border-white/20',
              )}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/40 mb-2">Destino</label>
          <div className="grid grid-cols-2 gap-2">
            {bancos.map(b => (
              <button
                key={b.id}
                onClick={() => setDestino(b.id)}
                className={cn(
                  'p-3 rounded-xl text-left transition-all border',
                  destino === b.id 
                    ? `bg-white/10 ${theme.border} text-white` 
                    : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10',
                )}
              >
                <span className="text-sm font-medium">{b.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            if (monto && destino) {
              onTransfer?.(Number(monto), destino)
              setMonto('')
              setDestino('')
            }
          }}
          disabled={!monto || !destino}
          className={cn(
            'w-full py-4 rounded-xl font-semibold transition-all',
            'bg-gradient-to-r',
            theme.gradient,
            'text-white shadow-lg',
            theme.glow,
            (!monto || !destino) && 'opacity-50 cursor-not-allowed',
          )}
        >
          Transferir
        </button>
      </div>
    </div>
  )
}

function CorteCard({ 
  corte, 
  index,
  theme, 
}: { 
  corte: CorteBancario
  index: number
  theme: typeof THEME_CONFIGS.blue
}) {
  const fechaInicio = typeof corte.fechaInicio === 'string' ? new Date(corte.fechaInicio) : new Date()
  const fechaFin = typeof corte.fechaFin === 'string' ? new Date(corte.fechaFin) : new Date()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'p-5 rounded-xl',
        'bg-black/40 border border-white/10',
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-white/40" />
          <div>
            <div className="text-white font-medium capitalize">{corte.periodo}</div>
            <div className="text-xs text-white/40">
              {fechaInicio.toLocaleDateString('es-MX')} - {fechaFin.toLocaleDateString('es-MX')}
            </div>
          </div>
        </div>
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          corte.estado === 'positivo' ? 'bg-emerald-500/20 text-emerald-400' :
          corte.estado === 'negativo' ? 'bg-red-500/20 text-red-400' :
          'bg-white/10 text-white/60',
        )}>
          {corte.variacionPorcentaje > 0 ? '+' : ''}{corte.variacionPorcentaje.toFixed(1)}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-white/40">Ingresos</div>
          <div className="text-emerald-400 font-mono font-bold">
            +${corte.totalIngresosPeriodo.toLocaleString('es-MX')}
          </div>
        </div>
        <div>
          <div className="text-xs text-white/40">Gastos</div>
          <div className="text-red-400 font-mono font-bold">
            -${corte.totalGastosPeriodo.toLocaleString('es-MX')}
          </div>
        </div>
        <div>
          <div className="text-xs text-white/40">Balance</div>
          <div className={cn(
            'font-mono font-bold',
            corte.diferencia >= 0 ? 'text-emerald-400' : 'text-red-400',
          )}>
            ${corte.diferencia.toLocaleString('es-MX')}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ScanningOverlay({ theme }: { theme: typeof THEME_CONFIGS.blue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-8"
        >
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r', theme.gradient)}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <motion.div
          className="text-white text-xl font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Escaneando transacciones...
        </motion.div>
        <p className="text-white/40 mt-2">Generando corte de caja</p>
      </div>
    </motion.div>
  )
}

function CorteResultModal({ 
  corte, 
  theme,
  onClose, 
}: { 
  corte: CorteBancario
  theme: typeof THEME_CONFIGS.blue
  onClose: () => void
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'w-full max-w-md p-6',
          'bg-[rgba(8,8,12,0.95)] backdrop-blur-2xl',
          'rounded-3xl border border-white/10',
        )}
      >
        {/* Header con check */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={cn(
              'w-16 h-16 rounded-full mx-auto mb-4',
              'bg-gradient-to-br from-emerald-500 to-teal-600',
              'flex items-center justify-center',
            )}
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white">Corte Completado</h3>
          <p className="text-white/40 text-sm mt-1">Resumen del período</p>
        </div>

        {/* Datos del corte */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/60">Capital Inicial</span>
            <span className="text-white font-mono">${corte.capitalInicial.toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/60">Ingresos</span>
            <span className="text-emerald-400 font-mono">+${corte.totalIngresosPeriodo.toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/60">Gastos</span>
            <span className="text-red-400 font-mono">-${corte.totalGastosPeriodo.toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/60">Transacciones</span>
            <span className="text-white font-mono">{corte.numeroTransacciones}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-white font-semibold">Capital Final</span>
            <span className={cn(
              'text-2xl font-mono font-bold',
              corte.estado === 'positivo' ? 'text-emerald-400' : 'text-red-400',
            )}>
              ${corte.capitalFinal.toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className={cn(
            'w-full py-4 rounded-xl font-semibold',
            'bg-gradient-to-r',
            theme.gradient,
            'text-white',
          )}
        >
          Cerrar
        </button>
      </motion.div>
    </>
  )
}
