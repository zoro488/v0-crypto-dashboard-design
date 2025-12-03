'use client'

import { memo } from 'react'

/**
 * NoiseTexture - Capa de textura de ruido táctil
 * 
 * Añade una sensación física de "aluminio anodizado" o "cerámica de alta tecnología"
 * a toda la interfaz. Es casi imperceptible pero crucial para el efecto premium.
 */
export const NoiseTexture = memo(function NoiseTexture() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        opacity: 0.035,
        mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
      }}
    />
  )
})

export default NoiseTexture
