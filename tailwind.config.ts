import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./frontend/app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./pages/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          blue: "hsl(var(--accent-blue))",
          teal: "hsl(var(--accent-teal))",
          orange: "hsl(var(--accent-orange))",
          purple: "hsl(var(--accent-purple))",
          green: "hsl(var(--accent-green))",
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
          strong: "var(--glass-strong)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        glow: "var(--shadow-glow)",
        "glow-teal": "var(--shadow-glow-teal)",
        "glow-orange": "var(--shadow-glow-orange)",
        "glow-purple": "var(--shadow-glow-purple)",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow: "var(--transition-slow)",
        spring: "var(--transition-spring)",
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          '"SF Mono"',
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      spacing: {
        unit: "var(--spacing-unit)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
        "3xl": "64px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "premium-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "blue-gradient": "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
        "teal-gradient": "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
