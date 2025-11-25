"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"

export function AIAgent3DWidget() {
  const { voiceAgentStatus } = useAppStore()

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      animate={{
        scale: voiceAgentStatus === "listening" ? [1, 1.05, 1] : 1,
      }}
      transition={{
        repeat: voiceAgentStatus === "listening" ? Number.POSITIVE_INFINITY : 0,
        duration: 2,
      }}
    >
      {/* 3D Agent Orb */}
      <motion.div
        className="relative w-48 h-48 rounded-full"
        animate={{
          rotate: voiceAgentStatus === "listening" ? 360 : 0,
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-2xl opacity-50" />

        {/* Main sphere */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl">
          {/* Reflections */}
          <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/30 blur-xl" />
          <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full bg-white/20 blur-lg" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Outer rings */}
        {voiceAgentStatus === "listening" && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400/50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-purple-400/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0.5,
              }}
            />
          </>
        )}
      </motion.div>

      {/* Status indicator */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
          <p className="text-white text-sm font-medium capitalize">{voiceAgentStatus}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
