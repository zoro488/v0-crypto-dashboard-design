/**
 * Componentes UI Premium con animaciones avanzadas
 */

import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useHoverGlow, useCountUp, useRipple, premiumVariants } from '@/frontend/app/hooks/usePremiumAnimations';
import { cn } from '@/frontend/app/lib/utils';

// Premium Card con hover glow effect
interface PremiumCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  glowColor?: string;
  className?: string;
}

export const PremiumCard = ({
  children,
  glowColor = 'rgba(59, 130, 246, 0.5)',
  className,
  ...props
}: PremiumCardProps) => {
  const { isHovered, handleMouseEnter, handleMouseLeave, glowStyle } = useHoverGlow(glowColor);

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30',
        'backdrop-blur-xl border border-white/10',
        'transition-all duration-300',
        className
      )}
      initial="rest"
      whileHover="hover"
      variants={{
        rest: { scale: 1, y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' },
        hover: { 
          scale: 1.02, 
          y: -4, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Glow effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 -z-10"
          style={glowStyle as any}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {children as any}
    </motion.div>
  );
};

// Animated Counter con easing
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}) => {
  const { displayValue } = useCountUp(value, duration, delay);

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : displayValue.toLocaleString();

  return (
    <motion.span
      className={cn('font-mono font-bold', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  );
};

// Button con ripple effect
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowColor?: string;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  glowColor = 'rgba(59, 130, 246, 0.6)',
  className,
  onClick,
  ...props
}) => {
  const { ripples, createRipple } = useRipple();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.(e);
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600',
    secondary: 'bg-gray-800 text-white border border-white/20 hover:bg-gray-700',
    ghost: 'bg-transparent text-white hover:bg-white/10',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      {...(props as any)}
    >
      {children as any}

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{
            width: 400,
            height: 400,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </motion.button>
  );
};

// Stat Card con animaciones
interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix = '$',
  suffix = '',
  change,
  trend = 'neutral',
  icon,
  color = 'from-blue-500 to-cyan-500',
  delay = 0,
}) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <PremiumCard
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            className="text-3xl text-white"
            delay={delay + 0.2}
          />
        </div>
        
        {icon && (
          <motion.div
            className={cn('p-3 rounded-xl bg-gradient-to-br', color)}
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            {icon as any}
          </motion.div>
        )}
      </div>

      {change !== undefined && (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.4 }}
        >
          <span className={cn('text-sm font-semibold', trendColors[trend])}>
            {trendIcons[trend]} {Math.abs(change)}%
          </span>
          <span className="text-gray-500 text-xs">vs último mes</span>
        </motion.div>
      )}
    </PremiumCard>
  );
};

// Loading Skeleton Premium
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const PremiumSkeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
}) => {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <motion.div
      className={cn(
        'bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50',
        'animate-pulse',
        variantStyles[variant],
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
};

// Badge con animación
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  pulse?: boolean;
  className?: string;
}

export const AnimatedBadge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  pulse = false,
  className,
}) => {
  const variantStyles = {
    default: 'bg-gray-800 text-gray-200',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <motion.span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
        'border backdrop-blur-sm',
        variantStyles[variant],
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {pulse && (
        <motion.span
          className="w-2 h-2 rounded-full bg-current mr-2"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      {children as any}
    </motion.span>
  );
};

// Progress Bar animado
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  className?: string;
}

export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'from-blue-500 to-cyan-500',
  height = 'h-2',
  showLabel = false,
  className,
}) => {
  const percentage = (value / max) * 100;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-400">Progress</span>
          <AnimatedCounter
            value={percentage}
            suffix="%"
            decimals={1}
            className="text-white text-sm"
          />
        </div>
      )}
      
      <div className={cn('relative w-full rounded-full bg-gray-800/50 overflow-hidden', height)}>
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
