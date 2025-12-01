/**
 * 🔧 ESLint Configuration v9 - CHRONOS System
 * 
 * Configuración moderna de ESLint usando flat config
 * Compatible con Next.js 16, React 19, TypeScript
 */

import js from '@eslint/js'
import typescriptParser from '@typescript-eslint/parser'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  // ═══════════════════════════════════════════════════════════════════════════
  // BASE CONFIG - Recommended rules
  // ═══════════════════════════════════════════════════════════════════════════
  js.configs.recommended,
  
  {
    // ═══════════════════════════════════════════════════════════════════════════
    // FILES - Apply to all TypeScript/JavaScript files
    // ═══════════════════════════════════════════════════════════════════════════
    files: ['**/*.{ts,tsx,js,jsx}'],
    
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // Browser APIs
        performance: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        // Canvas/WebGL
        CanvasRenderingContext2D: 'readonly',
        WebGLRenderingContext: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        Image: 'readonly',
        // Audio
        AudioContext: 'readonly',
        AudioBuffer: 'readonly',
        // Web APIs
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
      },
    },
    
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    
    rules: {
      // ═══════════════════════════════════════════════════════════════════════════
      // TYPESCRIPT RULES - Strict type safety
      // ═══════════════════════════════════════════════════════════════════════════
      '@typescript-eslint/no-explicit-any': 'error', // ⛔ Prohibir 'any'
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', // Opcional en React
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
      }],
      
      // ═══════════════════════════════════════════════════════════════════════════
      // REACT RULES - Best practices
      // ═══════════════════════════════════════════════════════════════════════════
      'react/react-in-jsx-scope': 'off', // No necesario en Next.js
      'react/prop-types': 'off', // Usamos TypeScript
      'react/display-name': 'off', // Permitir componentes anónimos
      'react/jsx-key': 'error', // Keys en listas
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-target-blank': 'error', // Seguridad
      
      // ═══════════════════════════════════════════════════════════════════════════
      // REACT HOOKS RULES - Reglas de hooks
      // ═══════════════════════════════════════════════════════════════════════════
      'react-hooks/rules-of-hooks': 'error', // Verificar orden de hooks
      'react-hooks/exhaustive-deps': 'warn', // Advertir dependencias faltantes
      
      // ═══════════════════════════════════════════════════════════════════════════
      // CONSOLE RULES - Usar logger en lugar de console.log
      // ═══════════════════════════════════════════════════════════════════════════
      'no-console': ['warn', {
        allow: ['warn', 'error'], // Permitir console.warn/error temporalmente
      }],
      
      // ═══════════════════════════════════════════════════════════════════════════
      // CODE QUALITY - General best practices
      // ═══════════════════════════════════════════════════════════════════════════
      'no-debugger': 'error',
      'no-alert': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'], // Usar === en lugar de ==
      'curly': ['error', 'multi-line'], // Llaves en bloques
      'no-unused-expressions': 'warn',
      'no-duplicate-imports': 'error',
      
      // ═══════════════════════════════════════════════════════════════════════════
      // FORMATTING - Preferencias de estilo (opcional con Prettier)
      // ═══════════════════════════════════════════════════════════════════════════
      'semi': ['error', 'never'], // Sin punto y coma (estilo proyecto)
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'max-len': ['warn', { 
        code: 120, 
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
    },
    
    settings: {
      react: {
        version: '19.0.0',
      },
      next: {
        rootDir: '.',
      },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IGNORES - Archivos/carpetas a ignorar
  // ═══════════════════════════════════════════════════════════════════════════
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      'public/**',
      '.git/**',
      '__tests__/**', // Opcional: no lintear tests si usan reglas diferentes
      'scripts/**', // Scripts de migración pueden tener console.log
      'SPLINE COMPONENTS/**', // Componentes Spline extraídos con formato diferente
      '_deprecated/**', // Código deprecado
      'backend/**', // Backend Python
      'automation/**', // Scripts de automatización
      'csv/**', // Datos CSV
      'dataconnect/**', // Firebase DataConnect
      'e2e/**', // E2E tests con Playwright (reglas diferentes)
      'gg/**', // Assets
      'hooks/**', // Hooks duplicados en raíz (usar app/hooks)
      'lib/**', // Lib duplicado en raíz (usar app/lib)
      'components/ui/**', // shadcn/ui components con formato propio
      'jest.setup.ts', // Setup de Jest
      'jest.config.js', // Config de Jest
      'tailwind.config.ts', // Config de Tailwind
      'playwright.config.ts', // Config de Playwright
      'next.config.*.js', // Configs adicionales de Next
      'sentry.*.config.ts', // Configs de Sentry
      'evaluation/**', // Evaluación de AI
      'next-env.d.ts', // Autogenerado por Next.js - no editar
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OVERRIDES - Reglas específicas para ciertos archivos
  // ═══════════════════════════════════════════════════════════════════════════
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Permitir 'any' en tests
      'no-console': 'off', // Permitir console.log en tests
    },
  },
  
  {
    files: ['app/page.tsx', 'app/layout.tsx', 'app/**/page.tsx'],
    rules: {
      'react/display-name': 'off', // Componentes de Next.js no necesitan displayName
    },
  },
  
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off', // Tipos declarativos no usan las vars
      '@typescript-eslint/no-unused-vars': 'off',
      'no-redeclare': 'off', // Permitir redeclaración para extensión de tipos
    },
  },
  
  {
    files: ['app/components/3d/**/*.tsx', 'app/components/visualizations/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off', // Three.js refs pueden usar !
      'no-unused-vars': 'warn',
    },
  },
  
  {
    // Archivos excluidos de TypeScript project - no usar reglas que requieren type checking
    files: [
      'app/lib/profit-engine/**/*.ts',
      'app/lib/services/ai/**/*.ts',
    ],
    languageOptions: {
      parserOptions: {
        project: null, // Deshabilitar project para estos archivos
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-case-declarations': 'off',
    },
  },
]
