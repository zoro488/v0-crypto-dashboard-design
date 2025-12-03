'use client'

/**
 * 🎨 CHRONOS 2025 Sidebar
 * 
 * Sidebar colapsable estilo Linear/Vercel (280px → 72px)
 * Iconos blancos puros con glow sutil en activo
 * Solo 2 colores principales: #0066FF y #C81EFF
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Warehouse,
  Users,
  UserCheck,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  Building2,
  DollarSign,
  Truck,
  PiggyBank,
  Wallet,
  Loader2,
  Menu,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible'
import { useState, useCallback } from 'react'
import type { Banco } from '@/app/types'
import { useBancosData } from '@/app/lib/firebase/firestore-hooks.service'
import { CHRONOS_2025 } from '@/app/lib/chronos-2025-tokens'
import { cn } from '@/app/lib/utils'

interface SidebarProps {
  collapsed: boolean
  currentPanel: string
  onPanelChange: (panel: string) => void
  selectedBanco: Banco
  onBancoChange: (banco: Banco) => void
  onToggleCollapse?: () => void
}

const MENU_ITEMS = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null }]

const OPERACIONES = [
  { id: 'ordenes', label: 'Órdenes de Compra', icon: ShoppingCart, badge: null },
  { id: 'ventas', label: 'Ventas', icon: TrendingUp, badge: null },
  { id: 'almacen', label: 'Almacén', icon: Warehouse, badge: null },
]

const GESTION = [
  { id: 'distribuidores', label: 'Distribuidores', icon: Users, badge: null },
  { id: 'clientes', label: 'Clientes', icon: UserCheck, badge: null },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, badge: null },
]

// Spring animation config Chronos 2025
const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 30,
}

export default function Sidebar({
  collapsed,
  currentPanel,
  onPanelChange,
  selectedBanco,
  onBancoChange,
  onToggleCollapse,
}: SidebarProps) {
  const [bancosOpen, setBancosOpen] = useState(true)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={SPRING_CONFIG}
      className={cn(
        'fixed left-0 top-[72px] h-[calc(100vh-72px)] z-20',
        // Glassmorphism sutil Chronos 2025
        'bg-[rgba(0,0,0,0.8)] backdrop-blur-[24px]',
        'border-r border-[rgba(255,255,255,0.05)]',
        'shadow-[0_0_40px_rgba(0,0,0,0.5)]'
      )}
    >
      {/* Toggle Button - Estilo Linear/Vercel */}
      {onToggleCollapse && (
        <motion.button
          onClick={onToggleCollapse}
          className={cn(
            'absolute -right-3 top-6 z-50',
            'w-6 h-6 rounded-full',
            'bg-[#0066FF] border-2 border-black',
            'flex items-center justify-center',
            'shadow-[0_0_20px_rgba(0,102,255,0.4)]',
            'hover:bg-[#0052CC] transition-colors'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={SPRING_CONFIG}
          >
            <ChevronLeft className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </motion.div>
        </motion.button>
      )}

      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Dashboard */}
          <div className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <SidebarItem
                key={item.id}
                {...item}
                collapsed={collapsed}
                active={currentPanel === item.id}
                onClick={() => onPanelChange(item.id)}
              />
            ))}
          </div>

          {/* Operaciones */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-2 text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-[0.1em]">
                Operaciones
              </p>
            )}
            {OPERACIONES.map((item) => (
              <SidebarItem
                key={item.id}
                {...item}
                collapsed={collapsed}
                active={currentPanel === item.id}
                onClick={() => onPanelChange(item.id)}
              />
            ))}
          </div>

          {/* Bancos */}
          <Collapsible open={bancosOpen && !collapsed} onOpenChange={setBancosOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full text-[#A0A0A0] hover:text-white hover:bg-[rgba(255,255,255,0.03)]',
                  collapsed ? 'justify-center px-2' : 'justify-between px-3'
                )}
              >
                {!collapsed ? (
                  <>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Bancos</span>
                    <ChevronDown className={cn(
                      'h-4 w-4 transition-transform text-[#6B6B6B]',
                      bancosOpen && 'rotate-180'
                    )} />
                  </>
                ) : (
                  <Building2 className="h-5 w-5 text-white" strokeWidth={1.8} />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <BancoSelector
                collapsed={collapsed}
                selectedBanco={selectedBanco}
                onBancoChange={onBancoChange}
                onViewBanco={() => onPanelChange('banco')}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Gestión */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-2 text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-[0.1em]">
                Gestión
              </p>
            )}
            {GESTION.map((item) => (
              <SidebarItem
                key={item.id}
                {...item}
                collapsed={collapsed}
                active={currentPanel === item.id}
                onClick={() => onPanelChange(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer - Solo cuando está expandido */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 p-4 border-t border-[rgba(255,255,255,0.05)] bg-black/40"
            >
              <div className="flex items-center justify-between text-[12px] text-[#6B6B6B]">
                <span>v3.0.0</span>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00FF57] shadow-[0_0_8px_#00FF57]" />
                  <span>Online</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </motion.aside>
  )
}

interface SidebarItemProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  badge?: string | null
  collapsed: boolean
  active: boolean
  onClick: () => void
}

function SidebarItem({ label, icon: Icon, badge, collapsed, active, onClick }: SidebarItemProps) {
  return (
    <motion.div 
      whileHover={{ x: collapsed ? 0 : 4 }} 
      whileTap={{ scale: 0.98 }}
      transition={SPRING_CONFIG}
    >
      <Button
        variant="ghost"
        className={cn(
          'w-full gap-3 transition-all duration-300 rounded-[12px]',
          collapsed ? 'justify-center px-2' : 'justify-start px-3',
          active
            ? 'bg-[#0066FF] text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]'
            : 'text-[#A0A0A0] hover:text-white hover:bg-[rgba(255,255,255,0.03)]'
        )}
        onClick={onClick}
      >
        {/* Icono blanco puro, stroke 1.8, glow en activo */}
        <Icon 
          className={cn(
            'h-5 w-5 flex-shrink-0',
            active && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
          )} 
          strokeWidth={1.8}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-[14px] font-medium">{label}</span>
            {badge && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-[rgba(255,255,255,0.1)] text-white border-none"
              >
                {badge}
              </Badge>
            )}
          </>
        )}
      </Button>
    </motion.div>
  )
}

interface BancoSelectorProps {
  collapsed: boolean
  selectedBanco: Banco
  onBancoChange: (banco: Banco) => void
  onViewBanco: () => void
}

function BancoSelector({ collapsed, selectedBanco, onBancoChange, onViewBanco }: BancoSelectorProps) {
  // Conectado a Firestore - datos reales de bancos
  const { data: bancosData, loading } = useBancosData()
  
  // Mapear datos de Firestore a tipo Banco
  const bancos: Banco[] = bancosData.map((banco) => ({
    id: banco.id,
    nombre: banco.nombre || 'Sin nombre',
    icon: banco.icon || 'building',
    color: banco.color || 'from-slate-500 to-slate-700',
    tipo: banco.tipo || 'operativo',
    descripcion: banco.descripcion || '',
    moneda: banco.moneda || 'MXN',
    capitalActual: banco.capitalActual ?? 0,
    capitalInicial: banco.capitalInicial ?? 0,
    historicoIngresos: banco.historicoIngresos ?? 0,
    historicoGastos: banco.historicoGastos ?? 0,
    historicoTransferencias: banco.historicoTransferencias ?? 0,
    estado: banco.estado || 'activo',
    createdAt: banco.createdAt?.toDate?.() || new Date(),
    updatedAt: banco.updatedAt?.toDate?.() || new Date(),
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B6B6B]" />
      </div>
    )
  }

  return (
    <div className="space-y-1 mt-2">
      {bancos.map((banco) => (
        <motion.button
          key={banco.id}
          whileHover={{ x: collapsed ? 0 : 4 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_CONFIG}
          className={cn(
            'w-full rounded-[12px] py-3 transition-all duration-300',
            collapsed ? 'px-2' : 'px-3',
            selectedBanco.id === banco.id
              ? 'bg-[rgba(0,102,255,0.1)] border border-[rgba(0,102,255,0.3)]'
              : 'hover:bg-[rgba(255,255,255,0.03)]'
          )}
          onClick={() => {
            onBancoChange(banco)
            onViewBanco()
          }}
        >
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
            {/* Icono del banco - blanco puro */}
            <div
              className={cn(
                'h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0',
                'bg-gradient-to-br',
                banco.color
              )}
            >
              {banco.icon === 'building' && <Building2 className="h-4 w-4 text-white" strokeWidth={1.8} />}
              {banco.icon === 'flag' && <DollarSign className="h-4 w-4 text-white" strokeWidth={1.8} />}
              {banco.icon === 'diamond' && <PiggyBank className="h-4 w-4 text-white" strokeWidth={1.8} />}
              {banco.icon === 'truck' && <Truck className="h-4 w-4 text-white" strokeWidth={1.8} />}
              {banco.icon === 'store' && <Building2 className="h-4 w-4 text-white" strokeWidth={1.8} />}
              {banco.icon === 'briefcase' && <Wallet className="h-4 w-4 text-white" strokeWidth={1.8} />}
              {banco.icon === 'trending-up' && <TrendingUp className="h-4 w-4 text-white" strokeWidth={1.8} />}
            </div>
            
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{banco.nombre}</p>
                  <p className={cn(
                    'text-[12px] font-mono',
                    banco.capitalActual < 0 ? 'text-[#FF0033]' : 'text-[#00FF57]'
                  )}>
                    {banco.moneda === 'USD' ? '$' : '$'}
                    {banco.capitalActual.toLocaleString('es-MX')}
                    {banco.moneda === 'USD' && ' USD'}
                  </p>
                </div>
                
                {/* Status indicator */}
                <div className={cn(
                  'h-2 w-2 rounded-full flex-shrink-0',
                  banco.estado === 'activo' 
                    ? 'bg-[#00FF57] shadow-[0_0_6px_#00FF57]' 
                    : 'bg-[#FF0033] shadow-[0_0_6px_#FF0033]'
                )} />
              </>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  )
}
