'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { logger } from '@/app/lib/utils/logger'

interface AudioAnalyzerState {
  isInitialized: boolean
  hasPermission: boolean
  error: string | null
}

interface AudioData {
  bass: number      // Bajos (0-1)
  mid: number       // Medios (0-1)
  treble: number    // Agudos (0-1)
  average: number   // Volumen promedio (0-1)
  peak: number      // Pico máximo (0-1)
  raw: Uint8Array<ArrayBufferLike> | null
}

/**
 * Hook profesional para análisis de audio en tiempo real
 * Extrae frecuencias bajas, medias y altas para visualizaciones reactivas
 */
export function useAudioAnalyzer(isActive: boolean) {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [state, setState] = useState<AudioAnalyzerState>({
    isInitialized: false,
    hasPermission: false,
    error: null,
  })

  // Inicializar el analizador de audio
  const initializeAudio = useCallback(async () => {
    if (analyserRef.current) return // Ya inicializado

    try {
      logger.info('🎤 Solicitando acceso al micrófono...', { context: 'useAudioAnalyzer' })
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }, 
      })
      
      streamRef.current = stream
      
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioContextClass()
      audioContextRef.current = audioCtx
      
      const source = audioCtx.createMediaStreamSource(stream)
      
      const analyzerNode = audioCtx.createAnalyser()
      analyzerNode.fftSize = 512 // 256 frecuencias para análisis detallado
      analyzerNode.smoothingTimeConstant = 0.8 // Suavizado para transiciones fluidas
      
      source.connect(analyzerNode)
      // NO conectar a destination para evitar feedback
      
      analyserRef.current = analyzerNode
      dataArrayRef.current = new Uint8Array(analyzerNode.frequencyBinCount)
      
      setState({
        isInitialized: true,
        hasPermission: true,
        error: null,
      })
      
      logger.info('✅ Analizador de audio inicializado', { 
        context: 'useAudioAnalyzer',
        data: { fftSize: analyzerNode.fftSize, frequencyBinCount: analyzerNode.frequencyBinCount },
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      logger.error('❌ Error al acceder al micrófono', error, { context: 'useAudioAnalyzer' })
      
      setState({
        isInitialized: false,
        hasPermission: false,
        error: errorMessage,
      })
    }
  }, [])

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    analyserRef.current = null
    dataArrayRef.current = null
    
    setState({
      isInitialized: false,
      hasPermission: false,
      error: null,
    })
    
    logger.info('🔇 Analizador de audio limpiado', { context: 'useAudioAnalyzer' })
  }, [])

  // Efecto para manejar activación/desactivación
  useEffect(() => {
    if (isActive) {
      initializeAudio()
    } else {
      cleanup()
    }
    
    return () => {
      cleanup()
    }
  }, [isActive, initializeAudio, cleanup])

  // Función para obtener datos de audio en tiempo real
  const getAudioData = useCallback((): AudioData => {
    const defaultData: AudioData = {
      bass: 0,
      mid: 0,
      treble: 0,
      average: 0,
      peak: 0,
      raw: null,
    }
    
    if (!analyserRef.current || !dataArrayRef.current) {
      return defaultData
    }
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    const data = dataArrayRef.current
    const bufferLength = data.length
    
    // Dividir frecuencias en rangos
    // Bajos: 0-20% del espectro (~20-200Hz)
    // Medios: 20-60% del espectro (~200-2000Hz)
    // Agudos: 60-100% del espectro (~2000-20000Hz)
    
    const bassEnd = Math.floor(bufferLength * 0.2)
    const midEnd = Math.floor(bufferLength * 0.6)
    
    let bassSum = 0
    let midSum = 0
    let trebleSum = 0
    let totalSum = 0
    let peak = 0
    
    for (let i = 0; i < bufferLength; i++) {
      const value = data[i]
      totalSum += value
      
      if (value > peak) peak = value
      
      if (i < bassEnd) {
        bassSum += value
      } else if (i < midEnd) {
        midSum += value
      } else {
        trebleSum += value
      }
    }
    
    return {
      bass: bassSum / (bassEnd * 255),
      mid: midSum / ((midEnd - bassEnd) * 255),
      treble: trebleSum / ((bufferLength - midEnd) * 255),
      average: totalSum / (bufferLength * 255),
      peak: peak / 255,
      raw: data.slice(), // Slice crea copia
    }
  }, [])

  return {
    ...state,
    getAudioData,
    analyser: analyserRef,
    dataArray: dataArrayRef,
  }
}

export type { AudioData, AudioAnalyzerState }
