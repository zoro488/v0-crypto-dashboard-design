'use client'
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 💎 GLASS CARD 3D - TARJETA PREMIUM CON GLASSMORPHISM Y TILT 3D
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Tarjeta con efecto de cristal 3D que responde al mouse con tilt físico
 * Bordes con glow dinámico y reflejos volumétricos
 * 
 * PALETA CHRONOS INFINITY (CYAN PROHIBIDO):
 * - Violeta Real: #8B00FF
 * - Oro Líquido: #FFD700
 * - Rosa Eléctrico: #FF1493
 * 
 * Características:
 * - Tilt 3D con spring physics
 * - Glow de borde reactivo
 * - Reflejos dinámicos
 * - Haptic feedback visual
 * - Optimizado 60fps
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import { 
  useRef, 
  useState, 
  useCallback, 
  ReactNode, 
  CSSProperties,
  memo,
} from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// ════════════════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════════════════
export interface GlassCard3DProps {
  children: ReactNode
  /** Clase CSS adicional */
  className?: string
  /** Intensidad del tilt (grados máximos) */
  tiltIntensity?: number
  /** Intensidad del glow */
  glowIntensity?: number
  /** Color del glow: 'violet' | 'gold' | 'pink' | 'gradient' */
  glowColor?: 'violet' | 'gold' | 'pink' | 'gradient'
  /** Mostrar efecto de reflejo */
  showReflection?: boolean
  /** Deshabilitar efectos (accesibilidad) */
  disabled?: boolean
  /** Callback al hover */
  onHover?: (isHovered: boolean) => void
  /** Callback al click */
  onClick?: () => void
  /** Estilo inline adicional */
  style?: CSSProperties
  /** Variante de tamaño */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Variante de esquinas */
  corners?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE COLORES
// ════════════════════════════════════════════════════════════════════════════════════════
const GLOW_COLORS = {
  violet: {
    primary: 'rgba(139, 0, 255, 0.6)',
    secondary: 'rgba(139, 0, 255, 0.3)',
    hover: 'rgba(139, 0, 255, 0.8)',
  },
  gold: {
    primary: 'rgba(255, 215, 0, 0.6)',
    secondary: 'rgba(255, 215, 0, 0.3)',
    hover: 'rgba(255, 215, 0, 0.8)',
  },
  pink: {
    primary: 'rgba(255, 20, 147, 0.6)',
    secondary: 'rgba(255, 20, 147, 0.3)',
    hover: 'rgba(255, 20, 147, 0.8)',
  },
  gradient: {
    primary: 'linear-gradient(135deg, rgba(139, 0, 255, 0.6), rgba(255, 215, 0, 0.6))',
    secondary: 'linear-gradient(135deg, rgba(139, 0, 255, 0.3), rgba(255, 215, 0, 0.3))',
    hover: 'linear-gradient(135deg, rgba(139, 0, 255, 0.8), rgba(255, 215, 0, 0.8))',
  },
} as const

const SIZE_CONFIG = {
  sm: { padding: '16px', minHeight: '100px' },
  md: { padding: '24px', minHeight: '150px' },
  lg: { padding: '32px', minHeight: '200px' },
  xl: { padding: '40px', minHeight: '250px' },
}

const CORNER_CONFIG = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SPRING CONFIG
// ════════════════════════════════════════════════════════════════════════════════════════
const SPRING_CONFIG = {
  stiffness: 300,
  damping: 30,
  mass: 1,
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════════════
function GlassCard3D({
  children,
  className = '',
  tiltIntensity = 15,
  glowIntensity = 1,
  glowColor = 'violet',
  showReflection = true,
  disabled = false,
  onHover,
  onClick,
  style,
  size = 'md',
  corners = 'lg',
}: GlassCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  // Motion values para tilt
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  
  // Springs para movimiento suave
  const springX = useSpring(mouseX, SPRING_CONFIG)
  const springY = useSpring(mouseY, SPRING_CONFIG)
  
  // Transformaciones 3D
  const rotateX = useTransform(springY, [0, 1], [tiltIntensity, -tiltIntensity])
  const rotateY = useTransform(springX, [0, 1], [-tiltIntensity, tiltIntensity])
  
  // Posición del highlight
  const highlightX = useTransform(springX, [0, 1], ['0%', '100%'])
  const highlightY = useTransform(springY, [0, 1], ['0%', '100%'])
  
  // Handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    mouseX.set(x)
    mouseY.set(y)
  }, [disabled, mouseX, mouseY])
  
  const handleMouseEnter = useCallback(() => {
    if (disabled) return
    setIsHovered(true)
    onHover?.(true)
  }, [disabled, onHover])
  
  const handleMouseLeave = useCallback(() => {
    if (disabled) return
    setIsHovered(false)
    onHover?.(false)
    mouseX.set(0.5)
    mouseY.set(0.5)
  }, [disabled, onHover, mouseX, mouseY])
  
  const handleClick = useCallback(() => {
    if (disabled) return
    onClick?.()
  }, [disabled, onClick])
  
  // Estilos
  const glowColors = GLOW_COLORS[glowColor]
  const sizeStyles = SIZE_CONFIG[size]
  const cornerRadius = CORNER_CONFIG[corners]
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective: '1200px',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX: disabled ? 0 : rotateX,
          rotateY: disabled ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow de fondo (sombra exterior) */}
        <motion.div
          className="absolute inset-0"
          style={{
            borderRadius: cornerRadius,
            background: typeof glowColors.primary === 'string' && glowColors.primary.includes('linear-gradient')
              ? glowColors.primary
              : 'transparent',
            boxShadow: !glowColors.primary.includes('linear-gradient')
              ? `0 0 ${40 * glowIntensity}px ${glowColors.secondary}, 
                 0 0 ${80 * glowIntensity}px ${glowColors.secondary}`
              : 'none',
            opacity: isHovered ? 1 : 0.5,
            filter: 'blur(20px)',
            transform: 'translateZ(-20px)',
            transition: 'opacity 0.3s ease',
          }}
        />
        
        {/* Tarjeta principal */}
        <motion.div
          className="relative w-full h-full overflow-hidden"
          style={{
            padding: sizeStyles.padding,
            minHeight: sizeStyles.minHeight,
            borderRadius: cornerRadius,
            background: 'rgba(20, 20, 30, 0.6)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 8px 32px rgba(0, 0, 0, 0.4),
              0 2px 8px rgba(0, 0, 0, 0.2)
            `,
            transform: 'translateZ(0px)',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            borderColor: isHovered 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(255, 255, 255, 0.08)',
          }}
          animate={{
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
        >
          {/* Borde con glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: cornerRadius,
              border: '1px solid transparent',
              background: `linear-gradient(${cornerRadius}, ${cornerRadius}) padding-box, 
                          linear-gradient(135deg, 
                            ${glowColor === 'gradient' 
                              ? 'rgba(139, 0, 255, 0.5), rgba(255, 215, 0, 0.5)' 
                              : `${glowColors.primary}, transparent`
                            }) border-box`,
              opacity: isHovered ? glowIntensity * 0.8 : glowIntensity * 0.3,
              transition: 'opacity 0.3s ease',
            }}
          />
          
          {/* Highlight que sigue al mouse */}
          {showReflection && !disabled && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${
                  glowColor === 'gold' 
                    ? 'rgba(255, 215, 0, 0.15)' 
                    : 'rgba(139, 0, 255, 0.15)'
                } 0%, transparent 70%)`,
                left: highlightX,
                top: highlightY,
                transform: 'translate(-50%, -50%)',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}
          
          {/* Reflejo superior */}
          {showReflection && (
            <div
              className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
              style={{
                borderRadius: `${cornerRadius} ${cornerRadius} 0 0`,
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              }}
            />
          )}
          
          {/* Contenido */}
          <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default memo(GlassCard3D)

// ════════════════════════════════════════════════════════════════════════════════════════
// VARIANTES ESPECIALIZADAS
// ════════════════════════════════════════════════════════════════════════════════════════

/** Card para KPIs con glow dorado */
export const KPIGlassCard = memo(function KPIGlassCard(
  props: Omit<GlassCard3DProps, 'glowColor' | 'size'>
) {
  return (
    <GlassCard3D
      {...props}
      glowColor="gold"
      size="lg"
      tiltIntensity={12}
    />
  )
})

/** Card para métricas con glow violeta */
export const MetricGlassCard = memo(function MetricGlassCard(
  props: Omit<GlassCard3DProps, 'glowColor'>
) {
  return (
    <GlassCard3D
      {...props}
      glowColor="violet"
      tiltIntensity={10}
    />
  )
})

/** Card para alertas con glow rosa */
export const AlertGlassCard = memo(function AlertGlassCard(
  props: Omit<GlassCard3DProps, 'glowColor'>
) {
  return (
    <GlassCard3D
      {...props}
      glowColor="pink"
      tiltIntensity={8}
    />
  )
})

/** Card hero con gradiente */
export const HeroGlassCard = memo(function HeroGlassCard(
  props: Omit<GlassCard3DProps, 'glowColor' | 'size' | 'tiltIntensity'>
) {
  return (
    <GlassCard3D
      {...props}
      glowColor="gradient"
      size="xl"
      tiltIntensity={6}
      glowIntensity={1.2}
    />
  )
})

// Export named para compatibilidad
export { GlassCard3D }
