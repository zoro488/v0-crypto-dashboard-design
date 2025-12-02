import { withBotId } from 'botid/next/config';
import type { NextConfig } from 'next';
import crypto from 'crypto';

const baseConfig: NextConfig = {
  // Directorio de la app dentro de frontend
  distDir: '.next',
  
  // Permitir orígenes de desarrollo
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/*/o/**',
      },
      {
        protocol: 'https',
        hostname: '*.spline.design',
      },
      {
        protocol: 'https',
        hostname: 'mockend.com',
      },
      {
        protocol: 'https',
        hostname: 'models.github.ai',
      },
    ],
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "recharts",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "botid",
      "@azure-rest/ai-inference",
    ],
    webpackMemoryOptimizations: true,
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Resolver THREE a una única instancia para evitar conflictos
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        three: require.resolve('three'),
      },
    };
    
    // Ignorar warnings de exports deprecados de spline
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@splinetool/,
        message: /sRGBEncoding/,
      },
    ];
    
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
              return module.size() > 160000 && /node_modules[/\\\\]/.test(module.identifier());
            },
            name(module: { identifier: () => string }) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
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
              );
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Evitar problemas con módulos externos en el servidor
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }

    return config;
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
    ];
  },
};

// 🔒 Exportar con BotID habilitado para protección contra bots
export default withBotId(baseConfig);
