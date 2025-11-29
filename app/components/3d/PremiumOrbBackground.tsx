'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

// ============================================
// INTERFACES Y TIPOS
// ============================================
export type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'multi' | 'cyberpunk';

export interface PremiumOrbBackgroundProps {
  opacity?: number;
  animate?: boolean;
  colorScheme?: ColorScheme;
  intensity?: 'low' | 'medium' | 'high';
  blur?: number;
  interactive?: boolean;
}

interface Orb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
}

// ============================================
// CONFIGURACIÓN DE COLORES
// ============================================
const COLOR_SCHEMES = {
  blue: {
    colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
    glow: 'rgba(59, 130, 246, 0.3)'
  },
  purple: {
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  green: {
    colors: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'],
    glow: 'rgba(16, 185, 129, 0.3)'
  },
  orange: {
    colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#d97706', '#b45309'],
    glow: 'rgba(245, 158, 11, 0.3)'
  },
  multi: {
    colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
    glow: 'rgba(139, 92, 246, 0.25)'
  },
  cyberpunk: {
    colors: ['#06b6d4', '#ec4899', '#8b5cf6', '#f97316', '#22d3ee'],
    glow: 'rgba(6, 182, 212, 0.3)'
  }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const PremiumOrbBackground = ({
  opacity = 0.3,
  animate = true,
  colorScheme = 'multi',
  intensity = 'medium',
  blur = 60,
  interactive = true
}: PremiumOrbBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const orbsRef = useRef<Orb[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const scheme = COLOR_SCHEMES[colorScheme];

  // Configuración basada en intensidad
  const config = useMemo(() => {
    const configs = {
      low: { orbCount: 3, minRadius: 100, maxRadius: 200, speed: 0.3 },
      medium: { orbCount: 5, minRadius: 150, maxRadius: 300, speed: 0.5 },
      high: { orbCount: 8, minRadius: 200, maxRadius: 400, speed: 0.7 }
    };
    return configs[intensity];
  }, [intensity]);

  // Inicializar orbes
  const initOrbs = useCallback((width: number, height: number) => {
    const orbs: Orb[] = [];

    for (let i = 0; i < config.orbCount; i++) {
      const radius = config.minRadius + Math.random() * (config.maxRadius - config.minRadius);

      orbs.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        radius,
        color: scheme.colors[i % scheme.colors.length],
        opacity: 0.3 + Math.random() * 0.4,
        pulseSpeed: 0.02 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    orbsRef.current = orbs;
  }, [config, scheme.colors]);

  // Actualizar posiciones de orbes
  const updateOrbs = useCallback((width: number, height: number) => {
    orbsRef.current.forEach(orb => {
      // Movimiento base
      orb.x += orb.vx;
      orb.y += orb.vy;

      // Interacción con el mouse (repulsión suave)
      if (interactive) {
        const dx = mouseRef.current.x - orb.x;
        const dy = mouseRef.current.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300) {
          const force = (300 - distance) / 300 * 0.02;
          orb.vx -= dx * force * 0.01;
          orb.vy -= dy * force * 0.01;
        }
      }

      // Límite de velocidad
      const maxSpeed = config.speed;
      const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
      if (currentSpeed > maxSpeed) {
        orb.vx = (orb.vx / currentSpeed) * maxSpeed;
        orb.vy = (orb.vy / currentSpeed) * maxSpeed;
      }

      // Rebote en los bordes (suave)
      const padding = orb.radius;
      if (orb.x < -padding) orb.x = width + padding;
      if (orb.x > width + padding) orb.x = -padding;
      if (orb.y < -padding) orb.y = height + padding;
      if (orb.y > height + padding) orb.y = -padding;

      // Actualizar fase de pulso
      orb.pulsePhase += orb.pulseSpeed;
    });
  }, [config.speed, interactive]);

  // Renderizar canvas
  const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Renderizar cada orbe
    orbsRef.current.forEach(orb => {
      // Calcular radio pulsante
      const pulseFactor = 1 + Math.sin(orb.pulsePhase) * 0.1;
      const currentRadius = orb.radius * pulseFactor;

      // Crear gradiente radial
      const gradient = ctx.createRadialGradient(
        orb.x,
        orb.y,
        0,
        orb.x,
        orb.y,
        currentRadius
      );

      // Parsear color y aplicar opacidad
      const baseOpacity = orb.opacity * (0.8 + Math.sin(time / 1000 + orb.id) * 0.2);

      gradient.addColorStop(0, `${orb.color}${Math.floor(baseOpacity * 255 * 0.8).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.4, `${orb.color}${Math.floor(baseOpacity * 255 * 0.4).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.7, `${orb.color}${Math.floor(baseOpacity * 255 * 0.15).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Efecto de conexión entre orbes cercanos
    orbsRef.current.forEach((orb, i) => {
      for (let j = i + 1; j < orbsRef.current.length; j++) {
        const other = orbsRef.current[j];
        const dx = orb.x - other.x;
        const dy = orb.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = (orb.radius + other.radius) * 0.8;

        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * 0.15;
          ctx.beginPath();
          ctx.moveTo(orb.x, orb.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
  }, []);

  // Configurar canvas y animación
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      setDimensions({ width, height });
      initOrbs(width, height);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [initOrbs]);

  // Loop de animación
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !animate) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = Date.now();

    const animationLoop = () => {
      const time = Date.now() - startTime;

      updateOrbs(dimensions.width, dimensions.height);
      render(ctx, dimensions.width, dimensions.height, time);

      animationRef.current = requestAnimationFrame(animationLoop);
    };

    animationLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, dimensions, updateOrbs, render]);

  // Manejador de mouse
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Canvas principal con orbes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          opacity,
          filter: `blur(${blur}px)`
        }}
      />

      {/* Capa de gradiente superior */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, ${scheme.glow} 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, ${scheme.colors[1]}15 0%, transparent 50%)
          `
        }}
      />

      {/* Viñeta oscura en los bordes */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)
          `
        }}
      />

      {/* Noise overlay para textura */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Gradiente de fundido hacia abajo para mejor legibilidad */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, 
            transparent 0%, 
            transparent 60%, 
            rgba(15, 23, 42, 0.3) 80%, 
            rgba(15, 23, 42, 0.5) 100%
          )`
        }}
      />
    </div>
  );
};

// ============================================
// VARIANTES PRE-CONFIGURADAS
// ============================================
export const DashboardBackground = () => (
  <PremiumOrbBackground
    colorScheme="multi"
    opacity={0.25}
    intensity="medium"
    blur={80}
    interactive
  />
);

export const LoginBackground = () => (
  <PremiumOrbBackground
    colorScheme="blue"
    opacity={0.4}
    intensity="low"
    blur={60}
    interactive={false}
  />
);

export const CyberpunkBackground = () => (
  <PremiumOrbBackground
    colorScheme="cyberpunk"
    opacity={0.35}
    intensity="high"
    blur={50}
    interactive
  />
);

export default PremiumOrbBackground;
