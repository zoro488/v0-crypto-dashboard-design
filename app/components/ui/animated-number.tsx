'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { cn } from '@/app/lib/utils'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
  format?: 'currency' | 'number' | 'percent' | 'compact'
  prefix?: string
  suffix?: string
  decimals?: number
}

export function AnimatedNumber({
  value,
  className,
  duration = 1000,
  format = 'number',
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration })
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        const formatted = formatNumber(latest, format, decimals)
        setDisplayValue(formatted)
      }
    })

    return () => unsubscribe()
  }, [springValue, format, decimals])

  const formatNumber = (num: number, formatType: string, decimals: number): string => {
    switch (formatType) {
      case 'currency':
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(num)

      case 'percent':
        return `${num.toFixed(decimals)}%`

      case 'compact':
        if (num >= 1000000000) {
          return `${(num / 1000000000).toFixed(1)}B`
        } else if (num >= 1000000) {
          return `${(num / 1000000).toFixed(1)}M`
        } else if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}K`
        }
        return num.toFixed(decimals)

      case 'number':
      default:
        return new Intl.NumberFormat('es-MX', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(num)
    }
  }

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn('inline-block tabular-nums', className)}
    >
      {prefix}
      {displayValue || formatNumber(value, format, decimals)}
      {suffix}
    </motion.span>
  )
}
