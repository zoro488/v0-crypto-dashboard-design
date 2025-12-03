import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: {
          blue: 'hsl(var(--accent-blue))',
          teal: 'hsl(var(--accent-teal))',
          orange: 'hsl(var(--accent-orange))',
          purple: 'hsl(var(--accent-purple))',
          green: 'hsl(var(--accent-green))',
        },
        glass: {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)',
          strong: 'var(--glass-strong)',
        },
        // CHRONOS 2026 ULTRA Colors
        c26: {
          void: '#000000',
          'void-deep': '#030305',
          'void-soft': '#0a0a0f',
          cyan: '#00F5FF',
          'cyan-soft': '#00D4E0',
          magenta: '#FF00AA',
          'magenta-soft': '#E000A0',
          violet: '#7B61FF',
          'violet-soft': '#6B50E0',
          success: '#00FF9F',
          warning: '#FFB800',
          error: '#FF3366',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        glow: 'var(--shadow-glow)',
        'glow-teal': 'var(--shadow-glow-teal)',
        'glow-orange': 'var(--shadow-glow-orange)',
        'glow-purple': 'var(--shadow-glow-purple)',
        // CHRONOS 2026 ULTRA Glows
        'glow-cyan': '0 0 40px rgba(0, 245, 255, 0.5), 0 0 80px rgba(0, 245, 255, 0.2)',
        'glow-magenta': '0 0 40px rgba(255, 0, 170, 0.5), 0 0 80px rgba(255, 0, 170, 0.2)',
        'glow-violet': '0 0 40px rgba(123, 97, 255, 0.5), 0 0 80px rgba(123, 97, 255, 0.2)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
        spring: 'var(--transition-spring)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'var(--font-geist-mono)',
          '"SF Mono"',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      spacing: {
        unit: 'var(--spacing-unit)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
        '4xl': '80px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'liquid-morph': 'liquidMorph 20s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateZ(0)' },
          '50%': { transform: 'translateY(-20px) translateZ(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5', filter: 'blur(40px)' },
          '50%': { opacity: '0.8', filter: 'blur(60px)' },
        },
        liquidMorph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%': { borderRadius: '50% 60% 30% 60% / 30% 40% 70% 50%' },
          '75%': { borderRadius: '40% 60% 50% 40% / 60% 50% 40% 60%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'premium-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'blue-gradient': 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        'teal-gradient': 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
        // CHRONOS 2026 ULTRA Gradients
        'c26-primary': 'linear-gradient(135deg, #00F5FF 0%, #7B61FF 100%)',
        'c26-accent': 'linear-gradient(135deg, #FF00AA 0%, #7B61FF 100%)',
        'c26-success': 'linear-gradient(135deg, #00FF9F 0%, #00F5FF 100%)',
        'c26-mesh': `
          radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0, 245, 255, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 80% 70%, rgba(255, 0, 170, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 50% 60% at 50% 50%, rgba(123, 97, 255, 0.15) 0%, transparent 40%)
        `,
      },
    },
  },
  plugins: [],
}

export default config
