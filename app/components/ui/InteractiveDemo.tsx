'use client'

/**
 * 🎬 INTERACTIVE DEMO OVERLAY
 * 
 * Sistema de demostración interactiva que simula clicks y muestra
 * el flujo completo del sistema CHRONOS
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, X, MousePointer2, CheckCircle2, Zap } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { cn } from '@/app/lib/utils'
import { haptic } from './microinteractions'

interface DemoStep {
  id: string
  title: string
  description: string
  action: () => void | Promise<void>
  target?: string // CSS selector
  duration: number
  highlight?: boolean
}

interface InteractiveDemoProps {
  steps: DemoStep[]
  onComplete?: () => void
}

export function InteractiveDemo({ steps, onComplete }: InteractiveDemoProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!isRunning || currentStep >= steps.length) return

    const step = steps[currentStep]
    const timer = setTimeout(async () => {
      // Execute step action
      await step.action()
      
      // Mark as completed
      setCompleted(prev => [...prev, currentStep])
      haptic.success()

      // Move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        setIsRunning(false)
        onComplete?.()
      }
    }, step.duration)

    return () => clearTimeout(timer)
  }, [isRunning, currentStep, steps, onComplete])

  const handleStart = () => {
    setIsRunning(true)
    setCurrentStep(0)
    setCompleted([])
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentStep(0)
    setCompleted([])
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 z-50 w-96"
    >
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: isRunning ? 360 : 0,
              }}
              transition={{
                duration: 2,
                repeat: isRunning ? Infinity : 0,
                ease: 'linear',
              }}
            >
              <MousePointer2 className="w-5 h-5 text-cyan-400" />
            </motion.div>
            <h3 className="text-white font-semibold">Demostración Interactiva</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Progreso</span>
            <span>{completed.length} / {steps.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ 
                width: `${(completed.length / steps.length) * 100}%`, 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                {currentStep + 1}
              </Badge>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium mb-1">
                  {steps[currentStep]?.title}
                </h4>
                <p className="text-sm text-white/60">
                  {steps[currentStep]?.description}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Steps List */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg transition-colors',
                index === currentStep && 'bg-cyan-500/20 border border-cyan-500/50',
                completed.includes(index) && 'opacity-50',
              )}
            >
              {completed.includes(index) ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/30" />
              )}
              <span className="text-sm text-white/80">{step.title}</span>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              <Play className="w-4 h-4 mr-2" />
              {completed.length === 0 ? 'Iniciar Demo' : 'Continuar'}
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="outline"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            size="icon"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Highlight Indicator */}
        {isRunning && steps[currentStep]?.highlight && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -right-2"
          >
            <div className="relative">
              <motion.div
                className="w-8 h-8 rounded-full bg-cyan-500"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <Zap className="absolute inset-0 m-auto w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// CLICK SIMULATOR
// ============================================================================

export function simulateClick(selector: string, delay = 0) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const element = document.querySelector(selector)
      if (element) {
        // Visual feedback
        element.classList.add('demo-highlight')
        
        // Simulate click
        if (element instanceof HTMLElement) {
          element.click()
          haptic.medium()
        }
        
        // Remove highlight after animation
        setTimeout(() => {
          element.classList.remove('demo-highlight')
        }, 1000)
      }
      resolve()
    }, delay)
  })
}

export function simulateType(selector: string, text: string, delay = 50) {
  return new Promise<void>((resolve) => {
    const element = document.querySelector(selector)
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      let index = 0
      const typeChar = () => {
        if (index < text.length) {
          element.value += text[index]
          element.dispatchEvent(new Event('input', { bubbles: true }))
          index++
          setTimeout(typeChar, delay)
        } else {
          resolve()
        }
      }
      typeChar()
    } else {
      resolve()
    }
  })
}

export function simulateScroll(selector: string, behavior: ScrollBehavior = 'smooth') {
  return new Promise<void>((resolve) => {
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({ behavior, block: 'center' })
      setTimeout(resolve, 500)
    } else {
      resolve()
    }
  })
}

// ============================================================================
// DEMO HIGHLIGHTS CSS (inject into head)
// ============================================================================

if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .demo-highlight {
      animation: demo-pulse 1s ease-in-out;
      outline: 3px solid #06b6d4 !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.2), 
                  0 0 30px rgba(6, 182, 212, 0.4) !important;
      z-index: 9999 !important;
      position: relative !important;
    }
    
    @keyframes demo-pulse {
      0%, 100% {
        outline-color: #06b6d4;
        box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.2), 
                    0 0 30px rgba(6, 182, 212, 0.4);
      }
      50% {
        outline-color: #0891b2;
        box-shadow: 0 0 0 8px rgba(6, 182, 212, 0.4), 
                    0 0 50px rgba(6, 182, 212, 0.6);
      }
    }
  `
  document.head.appendChild(style)
}
