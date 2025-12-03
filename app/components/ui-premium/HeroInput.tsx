'use client'

import { motion } from 'framer-motion'
import { memo, forwardRef, useState, useCallback, useEffect, useRef } from 'react'

interface HeroInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  prefix?: string
  suffix?: string
  variant?: 'emerald' | 'sapphire' | 'amethyst' | 'ruby' | 'gold' | 'cyan' | 'white'
  type?: 'currency' | 'number' | 'text'
  autoFocus?: boolean
  className?: string
}

/**
 * HeroInput - Input Monospaced Gigante Premium
 * 
 * El input de monto que se siente trascendental:
 * - Tipografía MONOSPACED GIGANTE (72px)
 * - Campo de vidrio más claro
 * - Números que brillan
 * - Cursor de luz pulsante (no línea aburrida)
 */
export const HeroInput = memo(forwardRef<HTMLInputElement, HeroInputProps>(
  function HeroInput(
    {
      value,
      onChange,
      placeholder = '0',
      prefix = '$',
      suffix,
      variant = 'emerald',
      type = 'currency',
      autoFocus = false,
      className = ''
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    
    const colorMap = {
      emerald: {
        text: '#10b981',
        glow: 'rgba(16, 185, 129, 0.4)',
        caret: '#34d399'
      },
      sapphire: {
        text: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.4)',
        caret: '#60a5fa'
      },
      amethyst: {
        text: '#8b5cf6',
        glow: 'rgba(139, 92, 246, 0.4)',
        caret: '#a78bfa'
      },
      ruby: {
        text: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.4)',
        caret: '#f87171'
      },
      gold: {
        text: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.4)',
        caret: '#fbbf24'
      },
      cyan: {
        text: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.4)',
        caret: '#22d3ee'
      },
      white: {
        text: '#ffffff',
        glow: 'rgba(255, 255, 255, 0.3)',
        caret: '#ffffff'
      }
    }
    
    const colors = colorMap[variant]
    
    // Formatear valor como moneda
    const formatValue = useCallback((val: string) => {
      if (type === 'currency') {
        // Remover todo excepto números y punto
        const cleaned = val.replace(/[^0-9.]/g, '')
        // Solo permitir un punto decimal
        const parts = cleaned.split('.')
        if (parts.length > 2) {
          return parts[0] + '.' + parts.slice(1).join('')
        }
        return cleaned
      }
      if (type === 'number') {
        return val.replace(/[^0-9]/g, '')
      }
      return val
    }, [type])
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatValue(e.target.value)
      onChange(formatted)
    }, [onChange, formatValue])
    
    // Formatear display con comas
    const displayValue = type === 'currency' && value
      ? parseFloat(value).toLocaleString('en-US', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 2 
        })
      : value
    
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus()
      }
    }, [autoFocus])
    
    return (
      <motion.div 
        className={`relative ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Contenedor del input */}
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          animate={{
            boxShadow: isFocused
              ? `
                inset 0 2px 4px rgba(0, 0, 0, 0.2),
                inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                0 0 80px -20px ${colors.glow}
              `
              : `
                inset 0 2px 4px rgba(0, 0, 0, 0.2),
                inset 0 0 0 1px rgba(255, 255, 255, 0.05)
              `
          }}
          style={{
            background: 'rgba(20, 20, 28, 0.6)',
            backdropFilter: 'blur(16px)'
          }}
        >
          {/* Resplandor de fondo cuando enfocado */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: isFocused ? 0.15 : 0
            }}
            style={{
              background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`
            }}
          />
          
          <div className="relative flex items-center justify-center py-8 px-6">
            {/* Prefijo */}
            {prefix && (
              <motion.span
                className="text-4xl md:text-5xl font-semibold mr-2"
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  color: isFocused ? colors.text : 'rgba(255, 255, 255, 0.4)'
                }}
                animate={{
                  textShadow: isFocused ? `0 0 30px ${colors.glow}` : 'none'
                }}
              >
                {prefix}
              </motion.span>
            )}
            
            {/* Input real (invisible) */}
            <input
              ref={(node) => {
                // Combinar refs
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
                ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
              }}
              type="text"
              inputMode={type === 'text' ? 'text' : 'decimal'}
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="
                absolute inset-0 w-full h-full
                bg-transparent text-transparent
                caret-transparent
                outline-none border-none
                text-center
              "
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
            
            {/* Display del valor (visible) */}
            <motion.span
              className="text-5xl md:text-6xl lg:text-7xl font-semibold"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontFeatureSettings: "'tnum' 1",
                letterSpacing: '-0.02em',
                color: value ? (isFocused ? colors.text : '#ffffff') : 'rgba(255, 255, 255, 0.2)'
              }}
              animate={{
                textShadow: isFocused && value 
                  ? `0 0 40px ${colors.glow}` 
                  : 'none'
              }}
            >
              {value || placeholder}
            </motion.span>
            
            {/* Cursor pulsante personalizado */}
            {isFocused && (
              <motion.div
                className="absolute right-1/3 top-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ 
                  opacity: [1, 0.3, 1],
                  scaleY: 1
                }}
                transition={{
                  opacity: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
                  scaleY: { duration: 0.2 }
                }}
                style={{
                  width: '4px',
                  height: '50px',
                  borderRadius: '2px',
                  background: colors.caret,
                  boxShadow: `0 0 20px ${colors.glow}`
                }}
              />
            )}
            
            {/* Sufijo */}
            {suffix && (
              <motion.span
                className="text-xl font-medium ml-3"
                style={{
                  color: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                {suffix}
              </motion.span>
            )}
          </div>
        </motion.div>
        
        {/* Línea decorativa inferior */}
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
          animate={{
            width: isFocused ? '60%' : '0%',
            opacity: isFocused ? 1 : 0
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.text}, transparent)`
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>
    )
  }
))

export default HeroInput
