"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface MagneticCursorProps {
  /** Color principal del cursor */
  color?: string
  /** Color secundario (glow) */
  glowColor?: string
  /** Tamaño base del cursor */
  size?: number
  /** Intensidad del efecto magnético */
  magneticStrength?: number
  /** Selector CSS de elementos que activan el efecto magnético */
  magneticSelector?: string
  /** Habilitar el cursor personalizado */
  enabled?: boolean
}

/**
 * Hook para obtener la posición del mouse en tiempo real
 */
export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setIsMoving(true)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setIsMoving(false)
      }, 100)
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { position, isMoving }
}

/**
 * Hook para detectar elementos interactivos bajo el cursor
 */
export function useHoveredElement(selector = "button, a, [data-magnetic]") {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [isOverInteractive, setIsOverInteractive] = useState(false)

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const interactive = target.closest(selector) as HTMLElement | null

      if (interactive) {
        setHoveredElement(interactive)
        setIsOverInteractive(true)
      } else {
        setHoveredElement(null)
        setIsOverInteractive(false)
      }
    }

    document.addEventListener("mouseover", handleMouseOver)

    return () => {
      document.removeEventListener("mouseover", handleMouseOver)
    }
  }, [selector])

  return { hoveredElement, isOverInteractive }
}

/**
 * Componente de cursor magnético personalizado
 */
export function MagneticCursor({
  color = "#4a90d9",
  glowColor = "rgba(74, 144, 217, 0.3)",
  size = 20,
  magneticStrength = 0.3,
  magneticSelector = "button, a, [data-magnetic], [data-cursor-expand]",
  enabled = true,
}: MagneticCursorProps) {
  const { position, isMoving } = useMousePosition()
  const { hoveredElement, isOverInteractive } = useHoveredElement(magneticSelector)
  const [isClicking, setIsClicking] = useState(false)
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 })

  // Calcular offset magnético
  useEffect(() => {
    if (!hoveredElement || !isOverInteractive) {
      setMagneticOffset({ x: 0, y: 0 })
      return
    }

    const rect = hoveredElement.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const offsetX = (position.x - centerX) * magneticStrength
    const offsetY = (position.y - centerY) * magneticStrength

    setMagneticOffset({ x: offsetX, y: offsetY })
  }, [position, hoveredElement, isOverInteractive, magneticStrength])

  // Detectar clicks
  useEffect(() => {
    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // Ocultar cursor nativo
  useEffect(() => {
    if (enabled) {
      document.body.style.cursor = "none"
    } else {
      document.body.style.cursor = "auto"
    }

    return () => {
      document.body.style.cursor = "auto"
    }
  }, [enabled])

  if (!enabled) return null

  const cursorX = position.x + magneticOffset.x
  const cursorY = position.y + magneticOffset.y

  // Tamaño expandido cuando está sobre elementos interactivos
  const expandedSize = isOverInteractive ? size * 2.5 : size
  const ringSize = isOverInteractive ? size * 3 : size * 1.5

  return (
    <>
      {/* Cursor principal */}
      <motion.div
        className="fixed pointer-events-none z-[10000] mix-blend-difference"
        animate={{
          x: cursorX - expandedSize / 2,
          y: cursorY - expandedSize / 2,
          width: expandedSize,
          height: expandedSize,
          scale: isClicking ? 0.8 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
          mass: 0.5,
        }}
        style={{
          borderRadius: "50%",
          backgroundColor: isOverInteractive ? "transparent" : color,
          border: isOverInteractive ? `2px solid ${color}` : "none",
        }}
      />

      {/* Anillo exterior con glow */}
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        animate={{
          x: cursorX - ringSize / 2,
          y: cursorY - ringSize / 2,
          width: ringSize,
          height: ringSize,
          opacity: isMoving ? 0.6 : 0.3,
          scale: isClicking ? 0.9 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
          mass: 0.1,
        }}
        style={{
          borderRadius: "50%",
          border: `1px solid ${color}`,
          boxShadow: `0 0 20px ${glowColor}, inset 0 0 10px ${glowColor}`,
        }}
      />

      {/* Punto central */}
      <motion.div
        className="fixed pointer-events-none z-[10001]"
        animate={{
          x: cursorX - 2,
          y: cursorY - 2,
          scale: isClicking ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 1000,
          damping: 35,
        }}
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
        }}
      />

      {/* Estela de luz (trail) */}
      <AnimatePresence>
        {isMoving && (
          <motion.div
            key="trail"
            className="fixed pointer-events-none z-[9998]"
            initial={{ opacity: 0.5, scale: 0.5 }}
            animate={{
              x: cursorX - 15,
              y: cursorY - 15,
              opacity: 0,
              scale: 2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Hook para usar el cursor magnético
 */
export function useMagneticCursor(enabled = true) {
  const [isEnabled, setIsEnabled] = useState(enabled)

  const enable = useCallback(() => setIsEnabled(true), [])
  const disable = useCallback(() => setIsEnabled(false), [])
  const toggle = useCallback(() => setIsEnabled((prev) => !prev), [])

  return {
    isEnabled,
    enable,
    disable,
    toggle,
    CursorComponent: isEnabled ? MagneticCursor : () => null,
  }
}

/**
 * Componente wrapper que añade el atributo data-magnetic
 */
interface MagneticWrapperProps {
  children: React.ReactNode
  className?: string
  intensity?: "low" | "medium" | "high"
}

export function MagneticWrapper({
  children,
  className = "",
  intensity = "medium",
}: MagneticWrapperProps) {
  return (
    <div
      data-magnetic
      data-magnetic-intensity={intensity}
      className={className}
    >
      {children}
    </div>
  )
}

export default MagneticCursor
