'use client';

/**
 * Demo de componentes Glass 3D
 * Para visualizar y probar todos los iconos y botones
 */

import { useState } from 'react';
import { GlassButton3D, GlassButtonGroup } from './GlassButton3D';
import { GlassNavIcon, GlassNavBar, CHRONOS_NAV_ITEMS } from './GlassNavIcons';

export function Glass3DDemo() {
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            🔮 Glass 3D Components
          </h1>
          <p className="text-white/60">
            Componentes 3D glassmorphism recreados para Chronos Dashboard
          </p>
        </div>

        {/* Sección: Barra de Navegación Completa */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Barra de Navegación - Chronos
          </h2>
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <GlassNavBar
              items={CHRONOS_NAV_ITEMS}
              activeIndex={activeNavIndex}
              onSelect={setActiveNavIndex}
              size="sm"
            />
          </div>
          <p className="text-white/50 text-sm">
            Seleccionado: <span className="text-white">{CHRONOS_NAV_ITEMS[activeNavIndex].label}</span>
          </p>
        </section>

        {/* Sección: Iconos Individuales */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Iconos Individuales (Diferentes tamaños)
          </h2>
          <div className="flex flex-wrap items-end gap-8">
            <div className="text-center space-y-2">
              <GlassNavIcon icon="dashboard" label="XS" size="xs" colorScheme="blue" />
              <p className="text-white/40 text-xs">40px</p>
            </div>
            <div className="text-center space-y-2">
              <GlassNavIcon icon="analytics" label="SM" size="sm" colorScheme="purple" />
              <p className="text-white/40 text-xs">52px</p>
            </div>
            <div className="text-center space-y-2">
              <GlassNavIcon icon="inventory" label="MD" size="md" colorScheme="cyan" />
              <p className="text-white/40 text-xs">64px</p>
            </div>
          </div>
        </section>

        {/* Sección: Colores */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Esquemas de Color
          </h2>
          <div className="flex flex-wrap gap-6">
            {(['blue', 'purple', 'cyan', 'emerald', 'amber', 'rose'] as const).map((color) => (
              <div key={color} className="text-center space-y-2">
                <GlassNavIcon 
                  icon="vault" 
                  label={color} 
                  size="md" 
                  colorScheme={color}
                  isActive
                />
              </div>
            ))}
          </div>
        </section>

        {/* Sección: Con Notificaciones */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Con Notificaciones
          </h2>
          <div className="flex flex-wrap gap-6">
            <GlassNavIcon 
              icon="notifications" 
              label="3 nuevas" 
              size="md" 
              colorScheme="amber"
              hasNotification
              notificationCount={3}
            />
            <GlassNavIcon 
              icon="orders" 
              label="Órdenes" 
              size="md" 
              colorScheme="emerald"
              hasNotification
              notificationCount={12}
            />
            <GlassNavIcon 
              icon="clients" 
              label="Clientes" 
              size="md" 
              colorScheme="blue"
              hasNotification
              notificationCount={156}
            />
          </div>
        </section>

        {/* Sección: Botones 3D Grandes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Botones 3D (Estilo Reijo Palmiste)
          </h2>
          <div className="flex flex-wrap gap-8 items-center justify-center">
            <GlassButton3D
              icon="home"
              label="Inicio"
              color="blue"
              size="lg"
              isActive={activeButtonIndex === 0}
              onClick={() => setActiveButtonIndex(0)}
            />
            <GlassButton3D
              icon="chart"
              label="Gráficos"
              color="purple"
              size="lg"
              isActive={activeButtonIndex === 1}
              onClick={() => setActiveButtonIndex(1)}
            />
            <GlassButton3D
              icon="settings"
              label="Config"
              color="cyan"
              size="lg"
              isActive={activeButtonIndex === 2}
              onClick={() => setActiveButtonIndex(2)}
            />
          </div>
        </section>

        {/* Sección: Grupo de Botones */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Grupo de Botones
          </h2>
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <GlassButtonGroup
              buttons={[
                { icon: 'home', label: 'Inicio', color: 'blue' },
                { icon: 'search', label: 'Buscar', color: 'purple' },
                { icon: 'bell', label: 'Alertas', color: 'orange' },
                { icon: 'user', label: 'Perfil', color: 'green' },
                { icon: 'settings', label: 'Ajustes', color: 'cyan' },
              ]}
              activeIndex={activeButtonIndex}
              onSelect={setActiveButtonIndex}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm pt-8 border-t border-white/10">
          <p>
            Componentes recreados con React Three Fiber + Drei
          </p>
          <p className="mt-2">
            Inspirados en Glass Buttons de Reijo Palmiste (Spline)
          </p>
        </footer>

      </div>
    </div>
  );
}

export default Glass3DDemo;
