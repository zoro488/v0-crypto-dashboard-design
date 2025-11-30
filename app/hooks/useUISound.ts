'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
// Importación dinámica para evitar errores en SSR
// import useSound from "use-sound" // Se importará dinámicamente

// Tipos para los sonidos
interface SoundOptions {
  volume?: number
  playbackRate?: number
  interrupt?: boolean
  soundEnabled?: boolean
}

interface UISound {
  play: () => void
  stop: () => void
}

// URLs de sonidos sci-fi (puedes reemplazar con tus propios archivos)
const SOUND_URLS = {
  click: '/sounds/ui-click.mp3',
  hover: '/sounds/ui-hover.mp3',
  success: '/sounds/ui-success.mp3',
  error: '/sounds/ui-error.mp3',
  notification: '/sounds/ui-notification.mp3',
  transition: '/sounds/ui-transition.mp3',
  warp: '/sounds/ui-warp.mp3',
  glitch: '/sounds/ui-glitch.mp3',
} as const

type SoundType = keyof typeof SOUND_URLS

/**
 * Hook para reproducir sonidos de interfaz sci-fi
 * Usa use-sound internamente con fallback si no está disponible
 */
export function useUISound(
  soundType: SoundType = 'click',
  options: SoundOptions = {},
) {
  const {
    volume = 0.5,
    playbackRate = 1,
    interrupt = true,
    soundEnabled = true,
  } = options

  const [isReady, setIsReady] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Inicializar audio element como fallback
  useEffect(() => {
    if (typeof window === 'undefined') return

    const audio = new Audio(SOUND_URLS[soundType])
    audio.volume = volume
    audio.playbackRate = playbackRate
    audioRef.current = audio

    audio.addEventListener('canplaythrough', () => {
      setIsReady(true)
    })

    audio.addEventListener('error', () => {
      // Silenciar errores si el archivo no existe
      console.debug(`Sonido no encontrado: ${SOUND_URLS[soundType]}`)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [soundType, volume, playbackRate])

  const play = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return

    if (interrupt) {
      audioRef.current.currentTime = 0
    }

    audioRef.current.play().catch(() => {
      // Silenciar errores de autoplay
    })
  }, [soundEnabled, interrupt])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  return { play, stop, isReady }
}

/**
 * Hook para gestionar múltiples sonidos de UI
 */
export function useUISounds(soundEnabled = true) {
  const [sounds, setSounds] = useState<Record<SoundType, UISound | null>>({
    click: null,
    hover: null,
    success: null,
    error: null,
    notification: null,
    transition: null,
    warp: null,
    glitch: null,
  })

  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    click: null,
    hover: null,
    success: null,
    error: null,
    notification: null,
    transition: null,
    warp: null,
    glitch: null,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const soundTypes = Object.keys(SOUND_URLS) as SoundType[]
    
    soundTypes.forEach((type) => {
      const audio = new Audio(SOUND_URLS[type])
      audio.volume = type === 'hover' ? 0.3 : 0.5
      audioRefs.current[type] = audio
    })

    const newSounds: Record<SoundType, UISound> = {} as Record<SoundType, UISound>
    
    soundTypes.forEach((type) => {
      newSounds[type] = {
        play: () => {
          if (!soundEnabled) return
          const audio = audioRefs.current[type]
          if (audio) {
            audio.currentTime = 0
            audio.play().catch(() => {})
          }
        },
        stop: () => {
          const audio = audioRefs.current[type]
          if (audio) {
            audio.pause()
            audio.currentTime = 0
          }
        },
      }
    })

    setSounds(newSounds)

    return () => {
      soundTypes.forEach((type) => {
        const audio = audioRefs.current[type]
        if (audio) {
          audio.pause()
          audio.src = ''
        }
      })
    }
  }, [soundEnabled])

  // Funciones de conveniencia
  const playClick = useCallback(() => sounds.click?.play(), [sounds.click])
  const playHover = useCallback(() => sounds.hover?.play(), [sounds.hover])
  const playSuccess = useCallback(() => sounds.success?.play(), [sounds.success])
  const playError = useCallback(() => sounds.error?.play(), [sounds.error])
  const playNotification = useCallback(() => sounds.notification?.play(), [sounds.notification])
  const playTransition = useCallback(() => sounds.transition?.play(), [sounds.transition])
  const playWarp = useCallback(() => sounds.warp?.play(), [sounds.warp])
  const playGlitch = useCallback(() => sounds.glitch?.play(), [sounds.glitch])

  return {
    sounds,
    playClick,
    playHover,
    playSuccess,
    playError,
    playNotification,
    playTransition,
    playWarp,
    playGlitch,
  }
}

/**
 * Hook para crear bindings de eventos con sonidos
 */
export function useSoundBindings(soundEnabled = true) {
  const { playClick, playHover } = useUISounds(soundEnabled)

  const withClickSound = useCallback(
    <T extends (...args: unknown[]) => unknown>(handler: T) => {
      return (...args: Parameters<T>) => {
        playClick()
        return handler(...args)
      }
    },
    [playClick],
  )

  const withHoverSound = useCallback(
    <T extends (...args: unknown[]) => unknown>(handler: T) => {
      return (...args: Parameters<T>) => {
        playHover()
        return handler(...args)
      }
    },
    [playHover],
  )

  // Props para añadir a cualquier elemento
  const soundProps = useCallback(
    (onClick?: () => void) => ({
      onClick: onClick ? withClickSound(onClick) : playClick,
      onMouseEnter: playHover,
    }),
    [withClickSound, playClick, playHover],
  )

  return {
    withClickSound,
    withHoverSound,
    soundProps,
  }
}

export default useUISound
