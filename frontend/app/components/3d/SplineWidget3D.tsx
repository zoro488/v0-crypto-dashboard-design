"use client"

import { Suspense, useState } from "react"
import Spline from "@splinetool/react-spline"
import { motion } from "framer-motion"
import { Loader2, Maximize2, Minimize2 } from "lucide-react"

interface SplineWidget3DProps {
  className?: string
  size?: "sm" | "md" | "lg"
  interactive?: boolean
}

export function SplineWidget3D({ 
  className = "", 
  size = "md",
  interactive = true 
}: SplineWidget3DProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const sizes = {
    sm: { width: 256, height: 256 },
    md: { width: 512, height: 512 },
    lg: { width: 768, height: 768 },
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return (
    <motion.div 
      className={`relative rounded-2xl overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: isExpanded ? 1.5 : 1,
        zIndex: isExpanded ? 50 : 1
      }}
      transition={{ duration: 0.3 }}
      style={{
        width: sizes[size].width,
        height: sizes[size].height,
      }}
    >
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 backdrop-blur-xl">
            <div className="text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto" />
              <p className="text-xs text-white/60">Cargando widget 3D...</p>
            </div>
          </div>
        }
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full bg-black/20"
        >
          <Spline
            scene="https://prod.spline.design/EMUFQmxEYeuyK46H/scene.splinecode"
            onLoad={handleLoad}
            style={{ width: '100%', height: '100%' }}
          />
        </motion.div>
      </Suspense>

      {/* Interactive controls */}
      {interactive && isLoaded && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors z-10"
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-white" />
          ) : (
            <Maximize2 className="w-4 h-4 text-white" />
          )}
        </motion.button>
      )}

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 pointer-events-none rounded-2xl" />
    </motion.div>
  )
}
