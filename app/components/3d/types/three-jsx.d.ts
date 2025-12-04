import type { ShaderMaterial, ShaderMaterialParameters } from 'three'

// Declaraciones para materiales de shaders personalizados de CHRONOS
declare global {
  namespace JSX {
    interface IntrinsicElements {
      infinityOrbMaterial: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          ref?: React.Ref<ShaderMaterial>
          transparent?: boolean
          depthWrite?: boolean
          side?: number
          args?: unknown[]
        },
        HTMLElement
      >
      particleSwarmMaterial: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          ref?: React.Ref<ShaderMaterial>
          transparent?: boolean
          depthWrite?: boolean
          blending?: number
          args?: unknown[]
        },
        HTMLElement
      >
    }
  }
}

export {}
