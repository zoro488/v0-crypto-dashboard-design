/**
 * useSpline Hook - Control avanzado de escenas Spline 3D
 * Proporciona interactividad completa con escenas Spline
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Application, SPEObject, SplineEventName } from '@splinetool/runtime'

// Tipos extendidos para eventos de Spline
interface SplineEvent {
  target?: {
    name?: string;
    id?: string;
  };
}

// Tipos
export interface SplineState {
  isLoaded: boolean;
  isInteracting: boolean;
  currentObject: string | null;
  variables: Record<string, unknown>;
}

export interface SplineControls {
  // Estado
  state: SplineState;
  app: Application | null;
  
  // Métodos de control
  onLoad: (spline: Application) => void;
  setVariable: (name: string, value: string | number | boolean) => void;
  getVariable: (name: string) => unknown;
  triggerEvent: (objectName: string, eventName: string) => void;
  
  // Animaciones
  playAnimation: (objectName: string) => void;
  stopAnimation: (objectName: string) => void;
  
  // Cámara
  setCamera: (cameraName: string) => void;
  
  // Interacción
  onObjectClick: (callback: (objectName: string) => void) => void;
  onObjectHover: (callback: (objectName: string | null) => void) => void;
  
  // Estados predefinidos
  setIdle: () => void;
  setActive: () => void;
  setListening: () => void;
  setSpeaking: () => void;
  setThinking: () => void;
  setError: () => void;
  setSuccess: () => void;
  
  // Efectos visuales
  pulse: () => void;
  glow: (color?: string) => void;
  shake: () => void;
  bounce: () => void;
}

// URLs de escenas Spline predefinidas
export const SPLINE_SCENES = {
  ORB_WIDGET: 'https://prod.spline.design/EMUFQmxEYeuyK46H/scene.splinecode',
  ROBOT_BOT: 'https://prod.spline.design/cZAGZ7v6TaqZrhFN/scene.splinecode',
  ANALYTICS_GLOBE: 'https://prod.spline.design/your-globe-scene/scene.splinecode',
  WORKFLOW_3D: 'https://prod.spline.design/your-workflow-scene/scene.splinecode',
} as const

// Variables de estado comunes en Spline
const STATE_VARIABLES = {
  idle: 'state_idle',
  active: 'state_active',
  listening: 'state_listening',
  speaking: 'state_speaking',
  thinking: 'state_thinking',
  error: 'state_error',
  success: 'state_success',
} as const

/**
 * Hook para controlar escenas Spline
 */
export function useSpline(): SplineControls {
  const appRef = useRef<Application | null>(null)
  const clickCallbackRef = useRef<((objectName: string) => void) | null>(null)
  const hoverCallbackRef = useRef<((objectName: string | null) => void) | null>(null)
  
  const [state, setState] = useState<SplineState>({
    isLoaded: false,
    isInteracting: false,
    currentObject: null,
    variables: {},
  })

  // Callback cuando se carga la escena
  const onLoad = useCallback((spline: Application) => {
    appRef.current = spline
    
    setState(prev => ({
      ...prev,
      isLoaded: true,
    }))

    // Configurar eventos de interacción
    spline.addEventListener('mouseDown', (e: SplineEvent) => {
      const objectName = e.target?.name
      if (objectName && clickCallbackRef.current) {
        clickCallbackRef.current(objectName)
      }
      setState(prev => ({
        ...prev,
        isInteracting: true,
        currentObject: objectName || null,
      }))
    })

    spline.addEventListener('mouseUp', () => {
      setState(prev => ({
        ...prev,
        isInteracting: false,
      }))
    })

    spline.addEventListener('mouseHover', (e: SplineEvent) => {
      const objectName = e.target?.name || null
      if (hoverCallbackRef.current) {
        hoverCallbackRef.current(objectName)
      }
      setState(prev => ({
        ...prev,
        currentObject: objectName,
      }))
    })
  }, [])

  // Establecer variable en Spline
  const setVariable = useCallback((name: string, value: string | number | boolean) => {
    if (appRef.current) {
      try {
        appRef.current.setVariable(name, value)
        setState(prev => ({
          ...prev,
          variables: {
            ...prev.variables,
            [name]: value,
          },
        }))
      } catch (error) {
        console.warn(`Error setting Spline variable ${name}:`, error)
      }
    }
  }, [])

  // Obtener variable de Spline
  const getVariable = useCallback((name: string): unknown => {
    if (appRef.current) {
      try {
        return appRef.current.getVariable(name)
      } catch (error) {
        console.warn(`Error getting Spline variable ${name}:`, error)
        return undefined
      }
    }
    return undefined
  }, [])

  // Disparar evento en objeto
  const triggerEvent = useCallback((objectName: string, eventName: string) => {
    if (appRef.current) {
      try {
        // emitEvent requiere SplineEventName, usamos type assertion
        appRef.current.emitEvent(eventName as SplineEventName, objectName)
      } catch (error) {
        console.warn(`Error triggering event ${eventName} on ${objectName}:`, error)
      }
    }
  }, [])

  // Control de animaciones
  const playAnimation = useCallback((objectName: string) => {
    triggerEvent(objectName, 'start')
  }, [triggerEvent])

  const stopAnimation = useCallback((objectName: string) => {
    triggerEvent(objectName, 'stop')
  }, [triggerEvent])

  // Control de cámara
  const setCamera = useCallback((cameraName: string) => {
    if (appRef.current) {
      try {
        // Buscar objeto de cámara y establecerla
        setVariable('active_camera', cameraName)
      } catch (error) {
        console.warn(`Error setting camera ${cameraName}:`, error)
      }
    }
  }, [setVariable])

  // Callbacks de interacción
  const onObjectClick = useCallback((callback: (objectName: string) => void) => {
    clickCallbackRef.current = callback
  }, [])

  const onObjectHover = useCallback((callback: (objectName: string | null) => void) => {
    hoverCallbackRef.current = callback
  }, [])

  // Estados predefinidos
  const setIdle = useCallback(() => {
    Object.values(STATE_VARIABLES).forEach(v => setVariable(v, false))
    setVariable(STATE_VARIABLES.idle, true)
  }, [setVariable])

  const setActive = useCallback(() => {
    Object.values(STATE_VARIABLES).forEach(v => setVariable(v, false))
    setVariable(STATE_VARIABLES.active, true)
  }, [setVariable])

  const setListening = useCallback(() => {
    Object.values(STATE_VARIABLES).forEach(v => setVariable(v, false))
    setVariable(STATE_VARIABLES.listening, true)
  }, [setVariable])

  const setSpeaking = useCallback(() => {
    Object.values(STATE_VARIABLES).forEach(v => setVariable(v, false))
    setVariable(STATE_VARIABLES.speaking, true)
  }, [setVariable])

  const setThinking = useCallback(() => {
    Object.values(STATE_VARIABLES).forEach(v => setVariable(v, false))
    setVariable(STATE_VARIABLES.thinking, true)
  }, [setVariable])

  const setError = useCallback(() => {
    Object.values(STATE_VARIABLES).forEach(v => setVariable(v, false))
    setVariable(STATE_VARIABLES.error, true)
    // Auto-reset después de 2 segundos
    setTimeout(setIdle, 2000)
  }, [setVariable, setIdle])

  const setSuccess = useCallback(() => {
    Object.values(STATE_VARIABLES).forEach(v => setVariable(v, false))
    setVariable(STATE_VARIABLES.success, true)
    // Auto-reset después de 2 segundos
    setTimeout(setIdle, 2000)
  }, [setVariable, setIdle])

  // Efectos visuales
  const pulse = useCallback(() => {
    setVariable('effect_pulse', true)
    setTimeout(() => setVariable('effect_pulse', false), 500)
  }, [setVariable])

  const glow = useCallback((color?: string) => {
    setVariable('effect_glow', true)
    if (color) {
      setVariable('glow_color', color)
    }
    setTimeout(() => setVariable('effect_glow', false), 1000)
  }, [setVariable])

  const shake = useCallback(() => {
    setVariable('effect_shake', true)
    setTimeout(() => setVariable('effect_shake', false), 500)
  }, [setVariable])

  const bounce = useCallback(() => {
    setVariable('effect_bounce', true)
    setTimeout(() => setVariable('effect_bounce', false), 600)
  }, [setVariable])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      appRef.current = null
      clickCallbackRef.current = null
      hoverCallbackRef.current = null
    }
  }, [])

  return {
    state,
    app: appRef.current,
    onLoad,
    setVariable,
    getVariable,
    triggerEvent,
    playAnimation,
    stopAnimation,
    setCamera,
    onObjectClick,
    onObjectHover,
    setIdle,
    setActive,
    setListening,
    setSpeaking,
    setThinking,
    setError,
    setSuccess,
    pulse,
    glow,
    shake,
    bounce,
  }
}

/**
 * Hook simplificado para el orb de IA
 */
export function useSplineOrb() {
  const controls = useSpline()
  
  // Estados específicos del orb
  const setOrbEmotion = useCallback((emotion: 'happy' | 'sad' | 'neutral' | 'excited' | 'curious') => {
    controls.setVariable('orb_emotion', emotion)
  }, [controls])

  const setOrbSize = useCallback((size: 'small' | 'medium' | 'large') => {
    const sizeMap = { small: 0.8, medium: 1, large: 1.3 }
    controls.setVariable('orb_scale', sizeMap[size])
  }, [controls])

  const blink = useCallback(() => {
    controls.setVariable('orb_blink', true)
    setTimeout(() => controls.setVariable('orb_blink', false), 200)
  }, [controls])

  // Auto-blink aleatorio
  useEffect(() => {
    if (controls.state.isLoaded) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          blink()
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [controls.state.isLoaded, blink])

  return {
    ...controls,
    setOrbEmotion,
    setOrbSize,
    blink,
  }
}

/**
 * Hook simplificado para el robot bot
 */
export function useSplineRobot() {
  const controls = useSpline()
  
  // Acciones del robot
  const wave = useCallback(() => {
    controls.triggerEvent('robot_arm', 'wave')
  }, [controls])

  const nod = useCallback(() => {
    controls.triggerEvent('robot_head', 'nod')
  }, [controls])

  const headShake = useCallback(() => {
    controls.triggerEvent('robot_head', 'shake')
  }, [controls])

  const point = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    controls.setVariable('point_direction', direction)
    controls.triggerEvent('robot_arm', 'point')
  }, [controls])

  const setExpression = useCallback((expression: 'happy' | 'thinking' | 'surprised' | 'neutral') => {
    controls.setVariable('robot_expression', expression)
  }, [controls])

  return {
    ...controls,
    wave,
    nod,
    headShake,
    point,
    setExpression,
  }
}

export default useSpline
