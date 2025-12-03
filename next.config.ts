import { withBotId } from 'botid/next/config'
import type { NextConfig } from 'next'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 CHRONOS - CONFIGURACIÓN NEXT.JS ULTRA OPTIMIZADA
// ═══════════════════════════════════════════════════════════════════════════

const isProd = process.env.NODE_ENV === 'production'

const baseConfig: NextConfig = {
  distDir: '.next',
  
  // Orígenes permitidos
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📝 TYPESCRIPT - Validación estricta
  // ═══════════════════════════════════════════════════════════════════════════
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🖼️ IMÁGENES - Optimización máxima
  // ═══════════════════════════════════════════════════════════════════════════
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/*/o/**' },
      { protocol: 'https', hostname: '*.spline.design' },
      { protocol: 'https', hostname: 'mockend.com' },
      { protocol: 'https', hostname: 'models.github.ai' },
      { protocol: 'https', hostname: '*.vercel.app' },
    ],
  },
  
  reactStrictMode: true,
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚡ SWC COMPILER - OPTIMIZACIONES MÁXIMAS DE PRODUCCIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  compiler: {
    // Eliminar console.log en producción
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
    // Eliminar propiedades React innecesarias
    reactRemoveProperties: isProd ? { properties: ['^data-testid$', '^data-test$'] } : false,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🧪 EXPERIMENTAL - TODAS LAS OPTIMIZACIONES HABILITADAS
  // ═══════════════════════════════════════════════════════════════════════════
  experimental: {
    // Tree-shaking ultra agresivo para paquetes
    optimizePackageImports: [
      // UI Libraries
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-slider',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-avatar',
      '@radix-ui/react-progress',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-label',
      '@radix-ui/react-radio-group',
      // 3D Libraries
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'three-stdlib',
      'maath',
      '@splinetool/react-spline',
      '@splinetool/runtime',
      // Data Libraries
      'recharts',
      'd3',
      '@tanstack/react-query',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      // Utilities
      'date-fns',
      'zod',
      'immer',
      'zustand',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
      // AI/API
      'ai',
      '@ai-sdk/openai',
      '@ai-sdk/anthropic',
      '@ai-sdk/google',
      '@azure-rest/ai-inference',
      'botid',
      // Firebase
      'firebase',
      // Form
      'react-hook-form',
      '@hookform/resolvers',
      // Animation
      '@react-spring/web',
      '@react-spring/three',
      'sonner',
      'cmdk',
    ],
    // Memoria webpack optimizada
    webpackMemoryOptimizations: true,
    // Compilación paralela del servidor
    parallelServerCompiles: true,
    // CSS optimizado
    optimizeCss: true,
    // Server Actions optimizadas
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Turbopack deshabilitado temporalmente por issues en Codespaces
  // turbopack: {},
  webpack: (config, { isServer }) => {
    // Resolver THREE a una única instancia para evitar conflictos
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        three: require.resolve('three'),
      },
    }
    
    // Ignorar warnings de exports deprecados de spline
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@splinetool/,
        message: /sRGBEncoding/,
      },
    ]
    
    // Optimizaciones de webpack
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module: { size: () => number; identifier: () => string }) {
              return module.size() > 160000 && /node_modules[/\\\\]/.test(module.identifier())
            },
            name(module: { identifier: () => string }) {
              const hash = crypto.createHash('sha1')
              hash.update(module.identifier())
              return hash.digest('hex').substring(0, 8)
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(_module: unknown, chunks: Array<{ name: string }>) {
              return (
                crypto
                  .createHash('sha1')
                  .update(chunks.reduce((acc: string, chunk: { name: string }) => acc + chunk.name, ''))
                  .digest('hex') + '_shared'
              )
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      },
    }

    // Evitar problemas con módulos externos en el servidor
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom']
    }

    return config
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

// 🔒 Exportar con BotID habilitado para protección contra bots
export default withBotId(baseConfig)
