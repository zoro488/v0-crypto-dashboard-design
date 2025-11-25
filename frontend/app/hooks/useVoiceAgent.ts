"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"

interface VoiceAgentConfig {
  apiKey?: string
  model?: string
  voice?: string
}

interface FunctionCall {
  name: string
  arguments: Record<string, any>
}

export function useVoiceAgent(config: VoiceAgentConfig = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const { setVoiceAgentStatus, setAudioFrequencies, setTheme, setModelRotation, currentPanel, setCurrentPanel } =
    useAppStore()

  // Function mapping for AI to control the UI
  const functionMap: Record<string, (args: any) => void> = {
    update_ui: (args) => {
      if (args.theme) setTheme(args.theme)
      if (args.show_section) setCurrentPanel(args.show_section)
      if (args.model_rotation !== undefined) setModelRotation(args.model_rotation)
    },
    navigate: (args) => {
      if (args.panel) setCurrentPanel(args.panel)
    },
    get_balance: (args) => {
      // Return balance info - would connect to actual data
      return { success: true, message: "Balance retrieved" }
    },
  }

  // Initialize WebRTC connection to OpenAI Realtime API
  const connect = useCallback(async () => {
    try {
      setVoiceAgentStatus("listening")

      // Note: This is a placeholder for the actual OpenAI Realtime API connection
      // In production, you would set up proper WebRTC signaling here

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 64

      setIsConnected(true)

      // Start frequency visualization loop
      animateFrequencies()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect")
      setVoiceAgentStatus("idle")
    }
  }, [setVoiceAgentStatus])

  // Animate audio frequencies for visualization
  const animateFrequencies = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const animate = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const normalizedData = Array.from(dataArray).map((v) => v / 255)
      setAudioFrequencies(normalizedData)

      requestAnimationFrame(animate)
    }

    animate()
  }, [setAudioFrequencies])

  // Handle function calls from AI
  const handleFunctionCall = useCallback((functionCall: FunctionCall) => {
    const handler = functionMap[functionCall.name]
    if (handler) {
      handler(functionCall.arguments)
    }
  }, []) // Removed functionMap from dependencies

  // Disconnect from voice agent
  const disconnect = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setIsConnected(false)
    setVoiceAgentStatus("idle")
  }, [setVoiceAgentStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    error,
    connect,
    disconnect,
    handleFunctionCall,
  }
}
