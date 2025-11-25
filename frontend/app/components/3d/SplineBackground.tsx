"use client"

import { Suspense } from "react"
import Spline from "@splinetool/react-spline/next"
import { motion } from "framer-motion"

export default function SplineBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              className="w-16 h-16 border-4 border-[hsl(0_84%_60%)] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </div>
        }
      >
        {/* @ts-ignore - Spline async component */}
        <Spline scene="https://prod.spline.design/Z1JMEPmko2vVo-lL/scene.splinecode" />
      </Suspense>
    </div>
  )
}
