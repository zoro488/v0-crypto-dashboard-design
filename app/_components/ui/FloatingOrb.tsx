'use client'

// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — FLOATING ORB (Mini)
// Orbe flotante pequeño para logo/iconos
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'

interface FloatingOrbProps {
  size?: number
  color?: string
}

export default function FloatingOrb({ size = 40, color = '#8B00FF' }: FloatingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = size
    canvas.height = size
    
    let animationId: number
    let time = 0
    
    const animate = () => {
      time += 0.02
      
      // Limpiar canvas
      ctx.clearRect(0, 0, size, size)
      
      const centerX = size / 2
      const centerY = size / 2
      const radius = size / 3
      
      // Gradiente pulsante
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      )
      
      const pulse = Math.sin(time * 2) * 0.2 + 0.8
      
      gradient.addColorStop(0, `${color}ff`)
      gradient.addColorStop(0.5, `${color}aa`)
      gradient.addColorStop(1, `${color}00`)
      
      // Dibujar orbe
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Glow exterior
      ctx.shadowBlur = 15
      ctx.shadowColor = color
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * pulse * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = color + '44'
      ctx.fill()
      ctx.shadowBlur = 0
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [size, color])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}
