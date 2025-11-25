"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  trail: { x: number; y: number }[]
}

interface Comet {
  x: number
  y: number
  length: number
  angle: number
  speed: number
  color: string
}

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const colors = [
      "rgba(10, 132, 255, 0.15)", // Apple blue
      "rgba(94, 234, 212, 0.12)", // Teal
      "rgba(168, 85, 247, 0.15)", // Purple
    ]

    const particles: Particle[] = []
    const particleCount = 40 // Reduced for cleaner look
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1 + 0.5, // Smaller particles
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
      })
    }

    const comet: Comet = {
      x: -300,
      y: canvas.height * 0.2,
      length: 200,
      angle: Math.PI / 5,
      speed: 0.6,
      color: "rgba(10, 132, 255, 0.2)",
    }

    const constellations: { x: number; y: number }[][] = []
    for (let i = 0; i < 3; i++) {
      const constellation: { x: number; y: number }[] = []
      const starCount = 3
      for (let j = 0; j < starCount; j++) {
        constellation.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
        })
      }
      constellations.push(constellation)
    }

    let animationFrameId: number
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Particles with refined trails
      particles.forEach((particle) => {
        particle.trail.unshift({ x: particle.x, y: particle.y })
        if (particle.trail.length > 10) particle.trail.pop() // Shorter trails

        particle.trail.forEach((point, index) => {
          const alpha = (1 - index / particle.trail.length) * 0.15
          ctx.fillStyle = particle.color.replace(/[\d.]+\)/, String(alpha) + ")")
          ctx.beginPath()
          ctx.arc(point.x, point.y, particle.size * (1 - index / particle.trail.length), 0, Math.PI * 2)
          ctx.fill()
        })

        ctx.fillStyle = particle.color
        ctx.shadowBlur = 8
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0
      })

      constellations.forEach((constellation) => {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
        ctx.lineWidth = 0.5
        ctx.beginPath()
        constellation.forEach((star, index) => {
          if (index === 0) {
            ctx.moveTo(star.x, star.y)
          } else {
            ctx.lineTo(star.x, star.y)
          }
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)"
          ctx.arc(star.x, star.y, 0.8, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.stroke()
      })

      const gradient = ctx.createLinearGradient(
        comet.x,
        comet.y,
        comet.x - Math.cos(comet.angle) * comet.length,
        comet.y - Math.sin(comet.angle) * comet.length,
      )
      gradient.addColorStop(0, comet.color.replace("0.2", "0.3"))
      gradient.addColorStop(0.3, comet.color.replace("0.2", "0.15"))
      gradient.addColorStop(1, "transparent")

      ctx.strokeStyle = gradient
      ctx.lineWidth = 1.5
      ctx.lineCap = "round"
      ctx.shadowBlur = 12
      ctx.shadowColor = comet.color

      ctx.beginPath()
      ctx.moveTo(comet.x, comet.y)
      ctx.lineTo(comet.x - Math.cos(comet.angle) * comet.length, comet.y - Math.sin(comet.angle) * comet.length)
      ctx.stroke()
      ctx.shadowBlur = 0

      comet.x += Math.cos(comet.angle) * comet.speed
      comet.y += Math.sin(comet.angle) * comet.speed

      if (comet.x > canvas.width + 400 || comet.y > canvas.height + 400) {
        comet.x = -300
        comet.y = Math.random() * (canvas.height * 0.3) + canvas.height * 0.1
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
      style={{ background: "transparent" }}
    />
  )
}
