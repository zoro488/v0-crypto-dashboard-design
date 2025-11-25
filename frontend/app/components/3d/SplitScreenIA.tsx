"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SplitScreenIAProps {
  leftContent: ReactNode
  rightContent: ReactNode
  defaultRatio?: number
  showControls?: boolean
  className?: string
}

export function SplitScreenIA({ 
  leftContent, 
  rightContent, 
  defaultRatio = 40,
  showControls = true,
  className = "" 
}: SplitScreenIAProps) {
  const [splitRatio, setSplitRatio] = useState(defaultRatio)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = (event: any, info: any) => {
    const containerWidth = window.innerWidth
    const newRatio = ((info.point.x / containerWidth) * 100)
    const clampedRatio = Math.max(20, Math.min(80, newRatio))
    setSplitRatio(clampedRatio)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const presets = [
    { label: "30/70", value: 30 },
    { label: "40/60", value: 40 },
    { label: "50/50", value: 50 },
    { label: "60/40", value: 60 },
  ]

  return (
    <div className={`relative w-full h-full flex ${className}`}>
      {/* Left panel - 3D Character */}
      <motion.div
        className="relative h-full bg-gradient-to-br from-blue-950/40 via-purple-950/40 to-black/40 backdrop-blur-sm"
        animate={{
          width: isCollapsed ? "0%" : `${splitRatio}%`,
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="w-full h-full overflow-hidden">
          {leftContent}
        </div>

        {/* Collapse button */}
        {showControls && (
          <button
            onClick={toggleCollapse}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors z-20"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-white" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </motion.div>

      {/* Divider - draggable */}
      {!isCollapsed && showControls && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleDrag}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          className={`relative w-2 h-full cursor-col-resize bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-pink-500/20 hover:bg-gradient-to-b hover:from-blue-500/40 hover:via-purple-500/40 hover:to-pink-500/40 transition-colors group ${
            isDragging ? "bg-blue-500/50" : ""
          }`}
        >
          {/* Divider handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <div className="w-1 h-8 bg-white/50 rounded-full" />
              <div className="w-1 h-8 bg-white/50 rounded-full" />
            </div>
          </div>

          {/* Preset buttons */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setSplitRatio(preset.value)}
                className="px-2 py-1 text-xs font-medium text-white bg-white/10 backdrop-blur-xl border border-white/20 rounded hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Right panel - Dynamic Content */}
      <motion.div
        className="relative h-full flex-1 bg-gradient-to-br from-slate-950/40 via-gray-950/40 to-black/40 backdrop-blur-sm overflow-auto"
        animate={{
          width: isCollapsed ? "100%" : "auto",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {rightContent}
      </motion.div>

      {/* Expand left panel button (when collapsed) */}
      <AnimatePresence>
        {isCollapsed && showControls && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={toggleCollapse}
            className="absolute top-4 left-4 p-3 rounded-lg bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 hover:bg-blue-500/30 transition-colors z-30 shadow-lg"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
