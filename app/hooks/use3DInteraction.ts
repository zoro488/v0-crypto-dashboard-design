'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Hook para rastrear la posición del mouse en coordenadas 3D normalizadas
 */
export function useMousePosition() {
  const mouseRef = useRef(new THREE.Vector2(0, 0))
  const { viewport, pointer } = useThree()
  
  useFrame(() => {
    mouseRef.current.set(
      pointer.x * viewport.width * 0.5,
      pointer.y * viewport.height * 0.5,
    )
  })
  
  return mouseRef
}

/**
 * Hook para crear un efecto de hover con escala animada
 */
export function useHoverScale(
  baseScale = 1,
  hoverScale = 1.2,
  lerpFactor = 0.1,
) {
  const [isHovered, setIsHovered] = useState(false)
  const scaleRef = useRef(baseScale)
  const targetScale = isHovered ? hoverScale : baseScale
  
  useFrame(() => {
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      targetScale,
      lerpFactor,
    )
  })
  
  const bind = {
    onPointerOver: () => setIsHovered(true),
    onPointerOut: () => setIsHovered(false),
  }
  
  return { scale: scaleRef, isHovered, bind }
}

/**
 * Hook para animar la rotación de un objeto siguiendo el mouse
 */
export function useMouseLookAt(
  intensity = 0.3,
  smoothing = 0.1,
) {
  const rotationRef = useRef(new THREE.Euler(0, 0, 0))
  const { pointer } = useThree()
  
  useFrame(() => {
    const targetX = -pointer.y * intensity
    const targetY = pointer.x * intensity
    
    rotationRef.current.x = THREE.MathUtils.lerp(
      rotationRef.current.x,
      targetX,
      smoothing,
    )
    rotationRef.current.y = THREE.MathUtils.lerp(
      rotationRef.current.y,
      targetY,
      smoothing,
    )
  })
  
  return rotationRef
}

/**
 * Hook para crear un efecto de flotación sinusoidal
 */
export function useFloatingAnimation(
  amplitude = 0.1,
  frequency = 1,
  phase = 0,
) {
  const positionRef = useRef(new THREE.Vector3(0, 0, 0))
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    positionRef.current.y = Math.sin(time * frequency + phase) * amplitude
    positionRef.current.x = Math.cos(time * frequency * 0.5 + phase) * amplitude * 0.3
  })
  
  return positionRef
}

/**
 * Hook para detectar si un objeto está siendo presionado
 */
export function usePressAnimation(
  normalScale = 1,
  pressedScale = 0.95,
  lerpFactor = 0.2,
) {
  const [isPressed, setIsPressed] = useState(false)
  const scaleRef = useRef(normalScale)
  
  useFrame(() => {
    const target = isPressed ? pressedScale : normalScale
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, target, lerpFactor)
  })
  
  const bind = {
    onPointerDown: () => setIsPressed(true),
    onPointerUp: () => setIsPressed(false),
    onPointerLeave: () => setIsPressed(false),
  }
  
  return { scale: scaleRef, isPressed, bind }
}

/**
 * Hook para crear un efecto de repulsión de partículas
 */
export function useParticleRepulsion(
  particleCount: number,
  repulsionRadius = 2,
  repulsionStrength = 0.5,
  elasticity = 0.05,
) {
  const positionsRef = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const targetPositionsRef = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const { pointer, viewport } = useThree()
  
  useFrame(() => {
    const mouseX = pointer.x * viewport.width * 0.5
    const mouseY = pointer.y * viewport.height * 0.5
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const x = positionsRef.current[i3]
      const y = positionsRef.current[i3 + 1]
      
      // Calcular distancia al mouse
      const dx = x - mouseX
      const dy = y - mouseY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < repulsionRadius && distance > 0) {
        // Aplicar fuerza de repulsión
        const force = (1 - distance / repulsionRadius) * repulsionStrength
        const nx = dx / distance
        const ny = dy / distance
        
        positionsRef.current[i3] += nx * force
        positionsRef.current[i3 + 1] += ny * force
      }
      
      // Volver a la posición original con elasticidad
      positionsRef.current[i3] += (targetPositionsRef.current[i3] - positionsRef.current[i3]) * elasticity
      positionsRef.current[i3 + 1] += (targetPositionsRef.current[i3 + 1] - positionsRef.current[i3 + 1]) * elasticity
      positionsRef.current[i3 + 2] += (targetPositionsRef.current[i3 + 2] - positionsRef.current[i3 + 2]) * elasticity
    }
  })
  
  return { positions: positionsRef, targetPositions: targetPositionsRef }
}

/**
 * Hook para crear una animación de pulso
 */
export function usePulseAnimation(
  minScale = 0.95,
  maxScale = 1.05,
  frequency = 2,
) {
  const scaleRef = useRef(1)
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    const range = maxScale - minScale
    scaleRef.current = minScale + (Math.sin(time * frequency) * 0.5 + 0.5) * range
  })
  
  return scaleRef
}

/**
 * Hook para gestionar el estado de carga de assets 3D
 */
export function use3DLoadingState() {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const onProgress = useCallback((progress: number) => {
    setLoadingProgress(Math.min(progress, 100))
  }, [])
  
  const onLoad = useCallback(() => {
    setLoadingProgress(100)
    setIsLoaded(true)
  }, [])
  
  const onError = useCallback((err: Error) => {
    setError(err)
  }, [])
  
  return {
    loadingProgress,
    isLoaded,
    error,
    onProgress,
    onLoad,
    onError,
  }
}

export default {
  useMousePosition,
  useHoverScale,
  useMouseLookAt,
  useFloatingAnimation,
  usePressAnimation,
  useParticleRepulsion,
  usePulseAnimation,
  use3DLoadingState,
}
