'use client'

/**
 * CHRONOS 2026 - Bento Grid Premium
 * Grid inteligente con layout adaptativo y animaciones stagger
 * 
 * Features:
 * - Auto-layout inteligente
 * - Stagger animations
 * - Responsive breakpoints
 * - Tilt cards
 * - Memoizado para performance
 */

import { memo, ReactNode } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TiltCard } from './motion'
import { CHRONOS_ANIMATIONS } from '@/app/lib/constants/chronos-2026'

interface BentoItem {
  id: string
  content: ReactNode
  span?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  rowSpan?: 1 | 2
}

interface BentoGridProps {
  items: BentoItem[]
  className?: string
  gap?: 'sm' | 'md' | 'lg'
}

const spanConfig = {
  sm: 'col-span-1',
  md: 'col-span-1 md:col-span-2',
  lg: 'col-span-1 md:col-span-2 lg:col-span-3',
  xl: 'col-span-1 md:col-span-2 lg:col-span-4',
  full: 'col-span-full',
}

const rowSpanConfig = {
  1: 'row-span-1',
  2: 'row-span-2',
}

const gapConfig = {
  sm: 'gap-3 md:gap-4',
  md: 'gap-4 md:gap-6',
  lg: 'gap-6 md:gap-8',
}

// Item individual memoizado
const BentoGridItem = memo(({ 
  item, 
  index,
  prefersReducedMotion, 
}: { 
  item: BentoItem
  index: number
  prefersReducedMotion: boolean | null
}) => {
  const content = (
    <m.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        delay: index * 0.08,
        duration: CHRONOS_ANIMATIONS.duration.slow,
        ease: CHRONOS_ANIMATIONS.ease.smooth,
      }}
      className={cn(
        spanConfig[item.span || 'sm'],
        rowSpanConfig[item.rowSpan || 1],
        'min-h-[180px]',
      )}
    >
      {item.content}
    </m.div>
  )
  
  if (prefersReducedMotion) {
    return content
  }
  
  return (
    <TiltCard maxTilt={6}>
      {content}
    </TiltCard>
  )
})
BentoGridItem.displayName = 'BentoGridItem'

function BentoGrid({ items, className = '', gap = 'md' }: BentoGridProps) {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <LazyMotion features={domAnimation}>
      <div 
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
          'auto-rows-[minmax(180px,auto)]',
          gapConfig[gap],
          className,
        )}
      >
        {items.map((item, index) => (
          <BentoGridItem
            key={item.id}
            item={item}
            index={index}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>
    </LazyMotion>
  )
}

export default memo(BentoGrid)
