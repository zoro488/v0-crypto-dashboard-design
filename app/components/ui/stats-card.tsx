'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/app/components/ui/card'
import { AnimatedNumber } from '@/app/components/ui/animated-number'
import { cn } from '@/app/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  prefix?: string
  suffix?: string
  description?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  animate?: boolean
}

const variantStyles = {
  default: 'from-slate-500 to-slate-600',
  primary: 'from-blue-500 to-blue-600',
  success: 'from-emerald-500 to-emerald-600',
  warning: 'from-amber-500 to-amber-600',
  danger: 'from-red-500 to-red-600',
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  prefix = '',
  suffix = '',
  description,
  variant = 'default',
  className,
  animate = true,
}: StatsCardProps) {
  const isNumeric = typeof value === 'number'

  return (
    <Card className={cn('overflow-hidden hover-lift', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              'p-3 rounded-xl bg-gradient-to-br',
              variantStyles[variant],
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            {prefix && (
              <span className="text-xl font-medium text-muted-foreground">
                {prefix}
              </span>
            )}
            {isNumeric && animate ? (
              <AnimatedNumber
                value={value}
                className="text-3xl font-bold"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold"
              >
                {value}
              </motion.div>
            )}
            {suffix && (
              <span className="text-xl font-medium text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>

          {(trend || description) && (
            <div className="flex items-center gap-3">
              {trend && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
                    trend.isPositive
                      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950'
                      : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {Math.abs(trend.value).toFixed(1)}%
                  </span>
                </div>
              )}
              {description && (
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
