/**
 * 🎮 THREE.JS SINGLETON - Exportación centralizada de Three.js
 * 
 * IMPORTANTE: Importa THREE desde este archivo en lugar de 'three' directamente
 * para evitar múltiples instancias de Three.js en la aplicación.
 * 
 * El warning "Multiple instances of Three.js being imported" ocurre cuando
 * diferentes partes de la app cargan three.js desde diferentes lugares.
 * 
 * USO:
 * ❌ MAL:  import * as THREE from 'three'
 * ✅ BIEN: import { THREE } from '@/app/lib/three-singleton'
 * 
 * También se exportan helpers y tipos comunes.
 */

import * as THREE from 'three'
import { logger } from '@/app/lib/utils/logger'

// Re-exportar THREE como singleton
export { THREE }

// Exportar tipos comunes para mayor comodidad
export type {
  Vector3,
  Euler,
  Color,
  Mesh,
  Group,
  Object3D,
  Material,
  BufferGeometry,
  Scene,
  Camera,
  WebGLRenderer,
  Texture,
} from 'three'

// Helper para verificar WebGL
export function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

// Helper para verificar WebGL2
export function checkWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}

// Colores predefinidos del theme
export const THEME_COLORS = {
  primary: new THREE.Color('#3b82f6'),
  secondary: new THREE.Color('#8b5cf6'),
  success: new THREE.Color('#10b981'),
  warning: new THREE.Color('#f59e0b'),
  danger: new THREE.Color('#ef4444'),
  cyan: new THREE.Color('#06b6d4'),
  pink: new THREE.Color('#ec4899'),
} as const

// Helper para crear materiales de vidrio (glass effect)
export function createGlassMaterial(options?: {
  color?: THREE.ColorRepresentation
  opacity?: number
  roughness?: number
  metalness?: number
}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: options?.color ?? '#ffffff',
    transparent: true,
    opacity: options?.opacity ?? 0.3,
    roughness: options?.roughness ?? 0.1,
    metalness: options?.metalness ?? 0.1,
    transmission: 0.9,
    thickness: 0.5,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })
}

// Helper para cleanup de geometrías y materiales
export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose()
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    }
  })
}

// Helper para manejar context lost
export function handleContextLost(
  renderer: THREE.WebGLRenderer,
  onLost?: () => void,
  onRestored?: () => void,
): () => void {
  const canvas = renderer.domElement

  const handleLost = (event: Event) => {
    event.preventDefault()
    logger.warn('[Three.js] WebGL context lost', { context: 'ThreeSingleton' })
    onLost?.()
  }

  const handleRestored = () => {
    console.info('[Three.js] WebGL context restored')
    onRestored?.()
  }

  canvas.addEventListener('webglcontextlost', handleLost)
  canvas.addEventListener('webglcontextrestored', handleRestored)

  // Retornar función de cleanup
  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost)
    canvas.removeEventListener('webglcontextrestored', handleRestored)
  }
}

export default THREE
