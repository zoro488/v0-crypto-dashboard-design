"use client"

/**
 * ZeroEnvironment - Efectos de Post-Procesamiento Cinematográficos
 * 
 * Este componente envuelve la escena 3D con efectos visuales avanzados:
 * - Bloom: Resplandor en elementos brillantes
 * - Glitch: Distorsión digital en estados de combate/error
 * - Noise: Ruido cinematográfico sutil
 * - Vignette: Oscurecimiento de esquinas
 * - Scanlines: Líneas de escaneo CRT
 * - Chromatic Aberration: Aberración cromática
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  Noise, 
  Vignette,
  ChromaticAberration,
  Scanline,
  Glitch,
  DepthOfField,
  ToneMapping
} from '@react-three/postprocessing'
import { BlendFunction, GlitchMode, ToneMappingMode } from 'postprocessing'
import { ZeroState } from './ZeroAvatar'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface ZeroEnvironmentProps {
  state: ZeroState
  intensity?: 'minimal' | 'normal' | 'intense' | 'cinematic'
  enableBloom?: boolean
  enableGlitch?: boolean
  enableNoise?: boolean
  enableVignette?: boolean
  enableScanlines?: boolean
  enableChromaticAberration?: boolean
  enableDepthOfField?: boolean
}

interface EffectSettings {
  bloom: {
    intensity: number
    luminanceThreshold: number
    luminanceSmoothing: number
    radius: number
  }
  glitch: {
    enabled: boolean
    delay: [number, number]
    duration: [number, number]
    strength: [number, number]
    mode: GlitchMode
  }
  noise: {
    opacity: number
    blendFunction: BlendFunction
  }
  vignette: {
    offset: number
    darkness: number
  }
  scanline: {
    density: number
    opacity: number
  }
  chromaticAberration: {
    offset: [number, number]
  }
  dof: {
    enabled: boolean
    focusDistance: number
    focalLength: number
    bokehScale: number
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIONES DE EFECTOS POR ESTADO
// ═══════════════════════════════════════════════════════════════════════════════

const getEffectSettings = (
  state: ZeroState, 
  intensity: ZeroEnvironmentProps['intensity']
): EffectSettings => {
  // Multiplicadores base según intensidad
  const intensityMultipliers = {
    minimal: 0.3,
    normal: 1,
    intense: 1.5,
    cinematic: 2
  }
  
  const mult = intensityMultipliers[intensity || 'normal']
  
  // Configuraciones base por estado
  const baseSettings: Record<ZeroState, EffectSettings> = {
    idle: {
      bloom: {
        intensity: 0.3 * mult,
        luminanceThreshold: 0.9,
        luminanceSmoothing: 0.9,
        radius: 0.5
      },
      glitch: {
        enabled: false,
        delay: [1.5, 3.5],
        duration: [0.1, 0.3],
        strength: [0.01, 0.02],
        mode: GlitchMode.SPORADIC
      },
      noise: {
        opacity: 0.02 * mult,
        blendFunction: BlendFunction.OVERLAY
      },
      vignette: {
        offset: 0.3,
        darkness: 0.5
      },
      scanline: {
        density: 1.5,
        opacity: 0.03 * mult
      },
      chromaticAberration: {
        offset: [0.0002 * mult, 0.0002 * mult]
      },
      dof: {
        enabled: false,
        focusDistance: 0.02,
        focalLength: 0.5,
        bokehScale: 2
      }
    },
    
    listening: {
      bloom: {
        intensity: 0.4 * mult,
        luminanceThreshold: 0.85,
        luminanceSmoothing: 0.8,
        radius: 0.6
      },
      glitch: {
        enabled: false,
        delay: [2, 4],
        duration: [0.05, 0.15],
        strength: [0.005, 0.01],
        mode: GlitchMode.SPORADIC
      },
      noise: {
        opacity: 0.03 * mult,
        blendFunction: BlendFunction.OVERLAY
      },
      vignette: {
        offset: 0.25,
        darkness: 0.55
      },
      scanline: {
        density: 1.8,
        opacity: 0.04 * mult
      },
      chromaticAberration: {
        offset: [0.0003 * mult, 0.0003 * mult]
      },
      dof: {
        enabled: true,
        focusDistance: 0.02,
        focalLength: 0.4,
        bokehScale: 3
      }
    },
    
    speaking: {
      bloom: {
        intensity: 0.5 * mult,
        luminanceThreshold: 0.8,
        luminanceSmoothing: 0.7,
        radius: 0.7
      },
      glitch: {
        enabled: false,
        delay: [3, 5],
        duration: [0.02, 0.08],
        strength: [0.002, 0.005],
        mode: GlitchMode.SPORADIC
      },
      noise: {
        opacity: 0.025 * mult,
        blendFunction: BlendFunction.OVERLAY
      },
      vignette: {
        offset: 0.2,
        darkness: 0.5
      },
      scanline: {
        density: 1.5,
        opacity: 0.035 * mult
      },
      chromaticAberration: {
        offset: [0.0002 * mult, 0.0002 * mult]
      },
      dof: {
        enabled: false,
        focusDistance: 0.02,
        focalLength: 0.5,
        bokehScale: 2
      }
    },
    
    processing: {
      bloom: {
        intensity: 0.6 * mult,
        luminanceThreshold: 0.75,
        luminanceSmoothing: 0.65,
        radius: 0.8
      },
      glitch: {
        enabled: true,
        delay: [0.5, 1.5],
        duration: [0.1, 0.2],
        strength: [0.02, 0.05],
        mode: GlitchMode.SPORADIC
      },
      noise: {
        opacity: 0.04 * mult,
        blendFunction: BlendFunction.OVERLAY
      },
      vignette: {
        offset: 0.15,
        darkness: 0.6
      },
      scanline: {
        density: 2,
        opacity: 0.05 * mult
      },
      chromaticAberration: {
        offset: [0.0005 * mult, 0.0005 * mult]
      },
      dof: {
        enabled: true,
        focusDistance: 0.015,
        focalLength: 0.3,
        bokehScale: 4
      }
    },
    
    combat: {
      bloom: {
        intensity: 1.0 * mult,
        luminanceThreshold: 0.6,
        luminanceSmoothing: 0.5,
        radius: 1.0
      },
      glitch: {
        enabled: true,
        delay: [0.2, 0.8],
        duration: [0.15, 0.4],
        strength: [0.05, 0.15],
        mode: GlitchMode.CONSTANT_WILD
      },
      noise: {
        opacity: 0.06 * mult,
        blendFunction: BlendFunction.OVERLAY
      },
      vignette: {
        offset: 0.1,
        darkness: 0.7
      },
      scanline: {
        density: 2.5,
        opacity: 0.08 * mult
      },
      chromaticAberration: {
        offset: [0.001 * mult, 0.001 * mult]
      },
      dof: {
        enabled: false,
        focusDistance: 0.01,
        focalLength: 0.2,
        bokehScale: 5
      }
    },
    
    success: {
      bloom: {
        intensity: 0.8 * mult,
        luminanceThreshold: 0.65,
        luminanceSmoothing: 0.6,
        radius: 0.9
      },
      glitch: {
        enabled: false,
        delay: [5, 10],
        duration: [0.02, 0.05],
        strength: [0.001, 0.003],
        mode: GlitchMode.SPORADIC
      },
      noise: {
        opacity: 0.02 * mult,
        blendFunction: BlendFunction.OVERLAY
      },
      vignette: {
        offset: 0.25,
        darkness: 0.4
      },
      scanline: {
        density: 1.2,
        opacity: 0.02 * mult
      },
      chromaticAberration: {
        offset: [0.0001 * mult, 0.0001 * mult]
      },
      dof: {
        enabled: true,
        focusDistance: 0.025,
        focalLength: 0.6,
        bokehScale: 3
      }
    },
    
    error: {
      bloom: {
        intensity: 0.9 * mult,
        luminanceThreshold: 0.5,
        luminanceSmoothing: 0.4,
        radius: 1.1
      },
      glitch: {
        enabled: true,
        delay: [0.1, 0.5],
        duration: [0.2, 0.5],
        strength: [0.08, 0.2],
        mode: GlitchMode.CONSTANT_WILD
      },
      noise: {
        opacity: 0.08 * mult,
        blendFunction: BlendFunction.OVERLAY
      },
      vignette: {
        offset: 0.05,
        darkness: 0.8
      },
      scanline: {
        density: 3,
        opacity: 0.1 * mult
      },
      chromaticAberration: {
        offset: [0.002 * mult, 0.002 * mult]
      },
      dof: {
        enabled: false,
        focusDistance: 0.01,
        focalLength: 0.15,
        bokehScale: 6
      }
    }
  }
  
  return baseSettings[state]
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE EFECTOS DINÁMICOS
// ═══════════════════════════════════════════════════════════════════════════════

function DynamicEffects({ 
  settings, 
  enableBloom = true,
  enableGlitch = true,
  enableNoise = true,
  enableVignette = true,
  enableScanlines = true,
  enableChromaticAberration = true,
  enableDepthOfField = false
}: { 
  settings: EffectSettings 
} & Omit<ZeroEnvironmentProps, 'state' | 'intensity'>) {
  
  // Offset para aberración cromática (necesita ser Vector2)
  const chromaticOffset = useMemo(() => 
    new THREE.Vector2(
      settings.chromaticAberration.offset[0], 
      settings.chromaticAberration.offset[1]
    ), 
    [settings.chromaticAberration.offset]
  )
  
  // Renderizar solo los efectos habilitados
  const effects: React.ReactNode[] = []
  
  // Tone Mapping siempre activo
  effects.push(
    <ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />
  )
  
  // Bloom
  if (enableBloom) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={settings.bloom.intensity}
        luminanceThreshold={settings.bloom.luminanceThreshold}
        luminanceSmoothing={settings.bloom.luminanceSmoothing}
        mipmapBlur
      />
    )
  }
  
  // Depth of Field
  if (enableDepthOfField && settings.dof.enabled) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={settings.dof.focusDistance}
        focalLength={settings.dof.focalLength}
        bokehScale={settings.dof.bokehScale}
      />
    )
  }
  
  // Chromatic Aberration
  if (enableChromaticAberration) {
    effects.push(
      <ChromaticAberration
        key="chromatic"
        offset={chromaticOffset}
        radialModulation={false}
        modulationOffset={0}
      />
    )
  }
  
  // Scanlines
  if (enableScanlines) {
    effects.push(
      <Scanline
        key="scanline"
        density={settings.scanline.density}
        blendFunction={BlendFunction.OVERLAY}
      />
    )
  }
  
  // Glitch
  if (enableGlitch && settings.glitch.enabled) {
    effects.push(
      <Glitch
        key="glitch"
        delay={new THREE.Vector2(settings.glitch.delay[0], settings.glitch.delay[1])}
        duration={new THREE.Vector2(settings.glitch.duration[0], settings.glitch.duration[1])}
        strength={new THREE.Vector2(settings.glitch.strength[0], settings.glitch.strength[1])}
        mode={settings.glitch.mode}
        active
        ratio={0.85}
      />
    )
  }
  
  // Noise
  if (enableNoise) {
    effects.push(
      <Noise
        key="noise"
        opacity={settings.noise.opacity}
        blendFunction={settings.noise.blendFunction}
      />
    )
  }
  
  // Vignette
  if (enableVignette) {
    effects.push(
      <Vignette
        key="vignette"
        offset={settings.vignette.offset}
        darkness={settings.vignette.darkness}
        eskil={false}
      />
    )
  }
  
  return (
    <EffectComposer multisampling={4}>
      {effects as React.ReactElement[]}
    </EffectComposer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL EXPORTADO
// ═══════════════════════════════════════════════════════════════════════════════

export function ZeroEnvironment({
  state = 'idle',
  intensity = 'normal',
  enableBloom = true,
  enableGlitch = true,
  enableNoise = true,
  enableVignette = true,
  enableScanlines = true,
  enableChromaticAberration = true,
  enableDepthOfField = false
}: ZeroEnvironmentProps) {
  
  // Obtener configuración de efectos basada en estado e intensidad
  const settings = useMemo(() => 
    getEffectSettings(state, intensity), 
    [state, intensity]
  )
  
  return (
    <DynamicEffects
      settings={settings}
      enableBloom={enableBloom}
      enableGlitch={enableGlitch}
      enableNoise={enableNoise}
      enableVignette={enableVignette}
      enableScanlines={enableScanlines}
      enableChromaticAberration={enableChromaticAberration}
      enableDepthOfField={enableDepthOfField}
    />
  )
}

export type { ZeroEnvironmentProps, EffectSettings }
export default ZeroEnvironment
