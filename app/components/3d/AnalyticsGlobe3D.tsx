'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  RefreshCw, 
  MapPin, 
  DollarSign, 
  Users, 
  Truck,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { logger } from '@/app/lib/utils/logger';

// ============================================
// INTERFACES Y TIPOS
// ============================================
export interface DataPoint {
  id: string;
  country: string;
  city: string;
  value: number;
  lat: number;
  lng: number;
  type: 'venta' | 'cliente' | 'distribuidor';
  label?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface AnalyticsGlobe3DProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  onPointClick?: (point: DataPoint) => void;
  autoRotate?: boolean;
  showLegend?: boolean;
}

// ============================================
// COLORES Y CONFIGURACIÓN
// ============================================
const TYPE_COLORS = {
  venta: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)'
  },
  cliente: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.5)'
  },
  distribuidor: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)'
  }
};

const TYPE_ICONS = {
  venta: DollarSign,
  cliente: Users,
  distribuidor: Truck
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const AnalyticsGlobe3D = ({
  data,
  title = "Distribución Global",
  height = 500,
  onPointClick,
  autoRotate = true,
  showLegend = true
}: AnalyticsGlobe3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calcular métricas agregadas
  const totalValue = data.reduce((sum, p) => sum + p.value, 0);
  const countByType = {
    venta: data.filter(p => p.type === 'venta').length,
    cliente: data.filter(p => p.type === 'cliente').length,
    distribuidor: data.filter(p => p.type === 'distribuidor').length
  };

  // ============================================
  // FUNCIONES DE RENDERIZADO DEL GLOBO
  // ============================================
  const latLngToXY = useCallback((lat: number, lng: number, radius: number, centerX: number, centerY: number) => {
    // Proyección esférica simplificada
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180 + rotation.y;

    const x = centerX + radius * Math.cos(latRad) * Math.sin(lngRad) * zoom;
    const y = centerY - radius * Math.sin(latRad) * zoom;
    const z = Math.cos(latRad) * Math.cos(lngRad);

    return { x, y, z, visible: z > -0.1 };
  }, [rotation.y, zoom]);

  const drawGlobe = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Fondo gradiente espacial
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
    bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.3)');
    bgGradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.6)');
    bgGradient.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Dibujar globo base
    const globeGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, 
      centerY - radius * 0.3, 
      0,
      centerX, 
      centerY, 
      radius
    );
    globeGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    globeGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
    globeGradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = globeGradient;
    ctx.fill();

    // Borde del globo con glow
    ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dibujar líneas de latitud
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      for (let lng = -180; lng <= 180; lng += 5) {
        const { x, y, visible } = latLngToXY(lat, lng, radius, centerX, centerY);
        if (visible) {
          if (lng === -180) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Dibujar líneas de longitud
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath();
      for (let lat = -90; lat <= 90; lat += 5) {
        const { x, y, visible } = latLngToXY(lat, lng, radius, centerX, centerY);
        if (visible) {
          if (lat === -90) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Ordenar puntos por profundidad (z) para renderizado correcto
    const sortedData = [...data].sort((a, b) => {
      const za = latLngToXY(a.lat, a.lng, radius, centerX, centerY).z;
      const zb = latLngToXY(b.lat, b.lng, radius, centerX, centerY).z;
      return za - zb;
    });

    // Dibujar puntos de datos
    sortedData.forEach((point) => {
      const { x, y, z, visible } = latLngToXY(point.lat, point.lng, radius, centerX, centerY);

      if (!visible) return;

      const colors = TYPE_COLORS[point.type];
      const pointRadius = Math.max(4, Math.min(12, point.value / 10000)) * (0.5 + z * 0.5);
      const alpha = 0.3 + z * 0.7;

      // Glow effect
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 15;

      // Punto principal
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = `${colors.primary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();

      // Anillo exterior
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pulso animado para puntos seleccionados o con trend up
      if (selectedPoint?.id === point.id || point.trend === 'up') {
        ctx.beginPath();
        ctx.arc(x, y, pointRadius * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `${colors.primary}40`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    });

  }, [data, latLngToXY, selectedPoint]);

  // ============================================
  // ANIMACIÓN Y EFECTOS
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamaño del canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    setIsLoading(false);

    let currentRotation = rotation.y;

    const animate = () => {
      if (autoRotate && !isDragging) {
        currentRotation += 0.002;
        setRotation(prev => ({ ...prev, y: currentRotation }));
      }

      drawGlobe(ctx, rect.width, rect.height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoRotate, isDragging, drawGlobe, rotation.y]);

  // ============================================
  // HANDLERS DE INTERACCIÓN
  // ============================================
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const deltaX = (e.clientX - dragStart.x) * 0.01;
    setRotation(prev => ({ ...prev, y: prev.y + deltaX }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.35;

    // Encontrar el punto más cercano al click
    let closestPoint: DataPoint | null = null;
    let minDistance = Infinity;

    data.forEach(point => {
      const { x, y, visible } = latLngToXY(point.lat, point.lng, radius, centerX, centerY);
      if (!visible) return;

      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
      if (distance < 20 && distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint) {
      setSelectedPoint(closestPoint);
      onPointClick?.(closestPoint);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(2, prev + 0.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.2));
  const handleReset = () => {
    setZoom(1);
    setRotation({ x: 0, y: 0 });
    setSelectedPoint(null);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-950/50 to-purple-950/30 border-slate-700/50 backdrop-blur-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {data.length} ubicaciones activas
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              ${totalValue.toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-slate-400">Valor total</p>
          </div>
        </div>

        {/* Stats rápidos por tipo */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {Object.entries(countByType).map(([type, count]) => {
            const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
            const colors = TYPE_COLORS[type as keyof typeof TYPE_COLORS];
            return (
              <div 
                key={type}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300 capitalize">{type}s:</span>
                <span className="text-sm font-semibold text-white">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Globo 3D Canvas */}
      <div className="relative" style={{ height: `${height}px` }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Cargando globo 3D...</p>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        />

        {/* Controles de vista */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition border border-white/10"
            title="Acercar"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition border border-white/10"
            title="Alejar"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition border border-white/10"
            title="Resetear vista"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Indicador de auto-rotación */}
        {autoRotate && !isDragging && (
          <div className="absolute bottom-4 left-4 px-2 py-1 bg-blue-500/20 backdrop-blur-md rounded text-xs text-blue-300 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />
            Auto-rotación activa
          </div>
        )}
      </div>

      {/* Panel de punto seleccionado */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl p-4 rounded-xl border border-slate-700"
          >
            <button
              onClick={() => setSelectedPoint(null)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Ubicación</span>
                </div>
                <p className="text-white font-semibold">
                  {selectedPoint.city}, {selectedPoint.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Tipo</p>
                <Badge 
                  className="text-white"
                  style={{ 
                    backgroundColor: TYPE_COLORS[selectedPoint.type].primary,
                    borderColor: TYPE_COLORS[selectedPoint.type].secondary
                  }}
                >
                  {selectedPoint.type}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">Valor</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  ${selectedPoint.value.toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      {showLegend && (
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
          <div className="flex items-center justify-center gap-6 text-sm">
            {Object.entries(TYPE_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
                <span className="text-slate-400 capitalize">{type}s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AnalyticsGlobe3D;
