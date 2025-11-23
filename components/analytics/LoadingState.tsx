"use client"

import { motion } from "framer-motion"

export function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-white/10 border-t-purple-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.h3
          className="text-white text-2xl font-bold mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          Cargando datos...
        </motion.h3>
        <p className="text-zinc-400 text-sm">Procesando información del sistema</p>
      </motion.div>
    </div>
  )
}
