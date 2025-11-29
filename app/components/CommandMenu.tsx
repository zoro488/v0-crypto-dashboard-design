/**
 * CommandMenu - Menú de comandos rápidos (Cmd+K / Ctrl+K)
 * Búsqueda y navegación rápida estilo Spotlight/Raycast
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/app/components/ui/command';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Building2,
  Users,
  Package,
  FileText,
  Brain,
  DollarSign,
  Settings,
  Search,
  PlusCircle,
  Calculator,
  Bell,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Keyboard,
  Sparkles,
  ArrowRightLeft,
  Receipt,
  Truck,
  BarChart3,
  Calendar,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/app/lib/store/useAppStore';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  group: 'navigation' | 'actions' | 'search' | 'settings' | 'ai';
  keywords?: string[];
}

interface CommandMenuProps {
  onOpenChange?: (open: boolean) => void;
}

export function CommandMenu({ onOpenChange }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { setCurrentPanel, theme, setTheme } = useAppStore();

  // Toggle del menú
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Notificar cambios
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Acciones disponibles
  const commands: CommandAction[] = useMemo(() => [
    // Navegación
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      description: 'Ver panel principal',
      icon: LayoutDashboard,
      shortcut: '⌘1',
      action: () => { setCurrentPanel('dashboard'); setOpen(false); },
      group: 'navigation',
      keywords: ['inicio', 'home', 'principal'],
    },
    {
      id: 'nav-ordenes',
      label: 'Órdenes de Compra',
      description: 'Gestionar órdenes',
      icon: ShoppingCart,
      shortcut: '⌘2',
      action: () => { setCurrentPanel('ordenes'); setOpen(false); },
      group: 'navigation',
      keywords: ['compras', 'pedidos', 'distribuidores'],
    },
    {
      id: 'nav-ventas',
      label: 'Ventas',
      description: 'Registrar y ver ventas',
      icon: TrendingUp,
      shortcut: '⌘3',
      action: () => { setCurrentPanel('ventas'); setOpen(false); },
      group: 'navigation',
      keywords: ['facturación', 'clientes', 'vender'],
    },
    {
      id: 'nav-banco',
      label: 'Bancos',
      description: 'Control de bancos y capital',
      icon: Building2,
      shortcut: '⌘4',
      action: () => { setCurrentPanel('banco'); setOpen(false); },
      group: 'navigation',
      keywords: ['dinero', 'capital', 'saldos', 'transferencias'],
    },
    {
      id: 'nav-clientes',
      label: 'Clientes',
      description: 'Gestión de clientes',
      icon: Users,
      shortcut: '⌘5',
      action: () => { setCurrentPanel('clientes'); setOpen(false); },
      group: 'navigation',
      keywords: ['compradores', 'deudores', 'cartera'],
    },
    {
      id: 'nav-distribuidores',
      label: 'Distribuidores',
      description: 'Gestión de proveedores',
      icon: Truck,
      shortcut: '⌘6',
      action: () => { setCurrentPanel('distribuidores'); setOpen(false); },
      group: 'navigation',
      keywords: ['proveedores', 'suppliers'],
    },
    {
      id: 'nav-almacen',
      label: 'Almacén',
      description: 'Control de inventario',
      icon: Package,
      shortcut: '⌘7',
      action: () => { setCurrentPanel('almacen'); setOpen(false); },
      group: 'navigation',
      keywords: ['stock', 'inventario', 'productos'],
    },
    {
      id: 'nav-reportes',
      label: 'Reportes',
      description: 'Generar informes',
      icon: FileText,
      shortcut: '⌘8',
      action: () => { setCurrentPanel('reportes'); setOpen(false); },
      group: 'navigation',
      keywords: ['informes', 'estadísticas', 'análisis'],
    },
    {
      id: 'nav-ia',
      label: 'Asistente IA',
      description: 'Inteligencia Artificial',
      icon: Brain,
      shortcut: '⌘9',
      action: () => { setCurrentPanel('ia'); setOpen(false); },
      group: 'navigation',
      keywords: ['ai', 'chat', 'asistente', 'bot'],
    },
    {
      id: 'nav-profit',
      label: 'Profit & Utilidades',
      description: 'Ver ganancias',
      icon: DollarSign,
      shortcut: '⌘0',
      action: () => { setCurrentPanel('profit'); setOpen(false); },
      group: 'navigation',
      keywords: ['ganancias', 'utilidad', 'rentabilidad'],
    },

    // Acciones Rápidas
    {
      id: 'action-nueva-venta',
      label: 'Nueva Venta',
      description: 'Registrar una venta',
      icon: PlusCircle,
      shortcut: '⌘N',
      action: () => { setCurrentPanel('ventas'); setOpen(false); },
      group: 'actions',
      keywords: ['crear', 'agregar', 'registrar'],
    },
    {
      id: 'action-nueva-orden',
      label: 'Nueva Orden de Compra',
      description: 'Crear orden de compra',
      icon: ShoppingCart,
      shortcut: '⌘O',
      action: () => { setCurrentPanel('ordenes'); setOpen(false); },
      group: 'actions',
      keywords: ['crear', 'agregar', 'pedido'],
    },
    {
      id: 'action-transferencia',
      label: 'Nueva Transferencia',
      description: 'Transferir entre bancos',
      icon: ArrowRightLeft,
      shortcut: '⌘T',
      action: () => { setCurrentPanel('banco'); setOpen(false); },
      group: 'actions',
      keywords: ['mover', 'dinero', 'enviar'],
    },
    {
      id: 'action-abono',
      label: 'Registrar Abono',
      description: 'Abono de cliente',
      icon: Receipt,
      action: () => { setCurrentPanel('clientes'); setOpen(false); },
      group: 'actions',
      keywords: ['pago', 'cobrar', 'recibir'],
    },
    {
      id: 'action-gasto',
      label: 'Registrar Gasto',
      description: 'Nuevo gasto',
      icon: Wallet,
      action: () => { setCurrentPanel('banco'); setOpen(false); },
      group: 'actions',
      keywords: ['egreso', 'pago', 'salida'],
    },

    // IA y Análisis
    {
      id: 'ai-analisis',
      label: 'Análisis con IA',
      description: 'Analizar datos con inteligencia artificial',
      icon: Sparkles,
      action: () => { setCurrentPanel('ia'); setOpen(false); },
      group: 'ai',
      keywords: ['análisis', 'predicción', 'insights'],
    },
    {
      id: 'ai-reporte',
      label: 'Generar Reporte IA',
      description: 'Crear reporte automatizado',
      icon: BarChart3,
      action: () => { setCurrentPanel('reportes'); setOpen(false); },
      group: 'ai',
      keywords: ['automático', 'informe'],
    },
    {
      id: 'ai-prediccion',
      label: 'Predicciones',
      description: 'Ver predicciones de ventas',
      icon: Calculator,
      action: () => { setCurrentPanel('ia'); setOpen(false); },
      group: 'ai',
      keywords: ['forecast', 'proyección', 'futuro'],
    },

    // Configuración
    {
      id: 'settings-theme-toggle',
      label: theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro',
      description: 'Cambiar tema de la aplicación',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); },
      group: 'settings',
      keywords: ['tema', 'apariencia', 'color'],
    },
    {
      id: 'settings-notifications',
      label: 'Notificaciones',
      description: 'Configurar alertas',
      icon: Bell,
      action: () => { /* TODO: Abrir modal de notificaciones */ setOpen(false); },
      group: 'settings',
      keywords: ['alertas', 'avisos'],
    },
    {
      id: 'settings-help',
      label: 'Ayuda',
      description: 'Centro de ayuda',
      icon: HelpCircle,
      action: () => { /* TODO: Abrir ayuda */ setOpen(false); },
      group: 'settings',
      keywords: ['soporte', 'documentación'],
    },
    {
      id: 'settings-shortcuts',
      label: 'Atajos de Teclado',
      description: 'Ver todos los atajos',
      icon: Keyboard,
      shortcut: '⌘/',
      action: () => { /* TODO: Mostrar modal de atajos */ setOpen(false); },
      group: 'settings',
      keywords: ['keyboard', 'hotkeys'],
    },
  ], [setCurrentPanel, theme, setTheme]);

  // Filtrar comandos por búsqueda
  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
    );
  }, [commands, search]);

  // Agrupar comandos
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {
      navigation: [],
      actions: [],
      ai: [],
      settings: [],
    };

    filteredCommands.forEach(cmd => {
      groups[cmd.group].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Ejecutar comando
  const runCommand = useCallback((action: () => void) => {
    action();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl">
        <div className="flex items-center border-b border-white/10 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-white/50" />
          <CommandInput
            placeholder="Buscar comandos, paneles, acciones..."
            value={search}
            onValueChange={setSearch}
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        <CommandList className="max-h-[400px] overflow-y-auto p-2">
          <CommandEmpty className="py-6 text-center text-sm text-white/50">
            No se encontraron resultados para "{search}"
          </CommandEmpty>

          {/* Navegación */}
          {groupedCommands.navigation.length > 0 && (
            <CommandGroup heading="Navegación" className="text-white/50">
              {groupedCommands.navigation.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => runCommand(cmd.action)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-white/80 hover:bg-white/10 hover:text-white aria-selected:bg-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <cmd.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{cmd.label}</span>
                    {cmd.description && (
                      <span className="text-xs text-white/50">{cmd.description}</span>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <CommandShortcut className="text-xs text-white/30">
                      {cmd.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {groupedCommands.navigation.length > 0 && groupedCommands.actions.length > 0 && (
            <CommandSeparator className="my-2 bg-white/10" />
          )}

          {/* Acciones */}
          {groupedCommands.actions.length > 0 && (
            <CommandGroup heading="Acciones Rápidas" className="text-white/50">
              {groupedCommands.actions.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => runCommand(cmd.action)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-white/80 hover:bg-white/10 hover:text-white aria-selected:bg-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <cmd.icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{cmd.label}</span>
                    {cmd.description && (
                      <span className="text-xs text-white/50">{cmd.description}</span>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <CommandShortcut className="text-xs text-white/30">
                      {cmd.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {groupedCommands.actions.length > 0 && groupedCommands.ai.length > 0 && (
            <CommandSeparator className="my-2 bg-white/10" />
          )}

          {/* IA */}
          {groupedCommands.ai.length > 0 && (
            <CommandGroup heading="Inteligencia Artificial" className="text-white/50">
              {groupedCommands.ai.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => runCommand(cmd.action)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-white/80 hover:bg-white/10 hover:text-white aria-selected:bg-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <cmd.icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{cmd.label}</span>
                    {cmd.description && (
                      <span className="text-xs text-white/50">{cmd.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {groupedCommands.ai.length > 0 && groupedCommands.settings.length > 0 && (
            <CommandSeparator className="my-2 bg-white/10" />
          )}

          {/* Configuración */}
          {groupedCommands.settings.length > 0 && (
            <CommandGroup heading="Configuración" className="text-white/50">
              {groupedCommands.settings.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => runCommand(cmd.action)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-white/80 hover:bg-white/10 hover:text-white aria-selected:bg-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                    <cmd.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{cmd.label}</span>
                    {cmd.description && (
                      <span className="text-xs text-white/50">{cmd.description}</span>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <CommandShortcut className="text-xs text-white/30">
                      {cmd.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-white/40">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd>
              seleccionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10">esc</kbd>
              cerrar
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Chronos Command
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

export default CommandMenu;
