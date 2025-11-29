/**
 * Hook para animaciones premium de micro-interacciones
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSpring, type MotionValue } from 'framer-motion';

interface GlowStyle {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  boxShadow: string;
}

interface UseHoverGlowReturn {
  isHovered: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  glowStyle: GlowStyle;
}

export const useHoverGlow = (color: string = 'rgba(59, 130, 246, 0.5)'): UseHoverGlowReturn => {
  const [isHovered, setIsHovered] = useState(false);

  const glowOpacity = useSpring(0, {
    stiffness: 300,
    damping: 30,
  });

  const glowScale = useSpring(1, {
    stiffness: 400,
    damping: 25,
  });

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    glowOpacity.set(1);
    glowScale.set(1.05);
  }, [glowOpacity, glowScale]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    glowOpacity.set(0);
    glowScale.set(1);
  }, [glowOpacity, glowScale]);

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    glowStyle: {
      opacity: glowOpacity,
      scale: glowScale,
      boxShadow: `0 0 40px ${color}, 0 0 80px ${color}`,
    },
  };
};

interface UseCountUpReturn {
  displayValue: number;
  isAnimating: boolean;
}

export const useCountUp = (
  targetValue: number,
  duration: number = 1000,
  delay: number = 0
): UseCountUpReturn => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const startAnimation = () => {
      setIsAnimating(true);
      const startTime = Date.now();
      const startValue = displayValue;
      const difference = targetValue - startValue;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (easeOutCubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + difference * easeProgress;

        setDisplayValue(Math.round(currentValue));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [targetValue, duration, delay]);

  return { displayValue, isAnimating };
};

interface UseParallaxReturn {
  y: number;
  opacity: number;
}

export const useParallax = (strength: number = 0.5): UseParallaxReturn => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    y: scrollY * strength,
    opacity: Math.max(0, 1 - scrollY / 500),
  };
};

interface UseRippleReturn {
  ripples: Array<{ id: number; x: number; y: number }>;
  createRipple: (event: React.MouseEvent<HTMLElement>) => void;
}

export const useRipple = (duration: number = 600): UseRippleReturn => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, duration);
    },
    [duration]
  );

  return { ripples, createRipple };
};

interface UseInViewReturn {
  ref: React.RefObject<HTMLElement | null>;
  isInView: boolean;
}

export const useInView = (threshold: number = 0.1): UseInViewReturn => {
  const [isInView, setIsInView] = useState(false);
  const ref = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isInView };
};

interface UseShimmerReturn {
  shimmerStyle: {
    backgroundImage: string;
    backgroundSize: string;
    backgroundPosition: string;
    animation: string;
  };
}

export const useShimmer = (
  color1: string = 'rgba(255, 255, 255, 0)',
  color2: string = 'rgba(255, 255, 255, 0.1)',
  duration: number = 2000
): UseShimmerReturn => {
  return {
    shimmerStyle: {
      backgroundImage: `linear-gradient(90deg, ${color1} 0%, ${color2} 50%, ${color1} 100%)`,
      backgroundSize: '200% 100%',
      backgroundPosition: '-100% 0',
      animation: `shimmer ${duration}ms infinite`,
    },
  };
};

interface UsePulseReturn {
  pulseScale: number;
  pulseOpacity: number;
}

export const usePulse = (interval: number = 2000): UsePulseReturn => {
  const [pulse, setPulse] = useState({ scale: 1, opacity: 1 });

  useEffect(() => {
    const animate = () => {
      setPulse({ scale: 1.05, opacity: 0.8 });
      setTimeout(() => {
        setPulse({ scale: 1, opacity: 1 });
      }, interval / 2);
    };

    const timer = setInterval(animate, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return {
    pulseScale: pulse.scale,
    pulseOpacity: pulse.opacity,
  };
};

// Variantes de animación predefinidas para framer-motion
export const premiumVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  },
  
  slideUp: {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  slideInLeft: {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  slideInRight: {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  cardHover: {
    rest: {
      scale: 1,
      y: 0,
      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
    },
    hover: {
      scale: 1.02,
      y: -8,
      boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.5)',
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  glowPulse: {
    initial: {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
    },
    animate: {
      boxShadow: [
        '0 0 20px rgba(59, 130, 246, 0.3)',
        '0 0 40px rgba(59, 130, 246, 0.6)',
        '0 0 20px rgba(59, 130, 246, 0.3)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  float: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  rotate: {
    animate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
};

// Configuraciones de spring predefinidas
export const springConfigs = {
  default: { stiffness: 300, damping: 30 },
  gentle: { stiffness: 120, damping: 14 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 400, damping: 25 },
  slow: { stiffness: 80, damping: 20 },
  molasses: { stiffness: 50, damping: 20 },
};
