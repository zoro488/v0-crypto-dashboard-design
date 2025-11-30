'use client'

import { useState, useCallback } from 'react'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIInsight {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'ventas' | 'compras' | 'capital' | 'stock' | 'clientes'
}

interface ProductoStock {
  stock: number
  stockMinimo: number
}

interface VentaData {
  total: number
}

interface DataAnalysis {
  productos?: ProductoStock[]
  ventas?: VentaData[]
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = useCallback(async (message: string): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Basic AI logic
      const response = generateAIResponse(message)
      return response
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateInsights = useCallback(async (data: DataAnalysis): Promise<AIInsight[]> => {
    setIsLoading(true)

    try {
      // Analyze data and generate insights
      const insights: AIInsight[] = []

      // Stock analysis
      if (data.productos) {
        const lowStock = data.productos.filter((p) => p.stock < p.stockMinimo)
        if (lowStock.length > 0) {
          insights.push({
            title: 'Stock Crítico Detectado',
            description: `${lowStock.length} productos por debajo del mínimo`,
            impact: 'high',
            category: 'stock',
          })
        }
      }

      // Sales analysis
      if (data.ventas) {
        const totalVentas = data.ventas.reduce((sum, v) => sum + v.total, 0)
        insights.push({
          title: 'Análisis de Ventas',
          description: `Total de ventas: $${totalVentas.toLocaleString()}`,
          impact: 'medium',
          category: 'ventas',
        })
      }

      return insights
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    sendMessage,
    generateInsights,
  }
}

function generateAIResponse(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes('ventas') || lowerQuestion.includes('vender')) {
    return 'Según el análisis de tus ventas, el mes actual muestra un incremento del 23%. Te recomiendo mantener stock de los productos más vendidos.'
  }

  if (lowerQuestion.includes('banco') || lowerQuestion.includes('capital')) {
    return 'Tu capital total está distribuido en 7 bancos. Bóveda Monte tiene el mayor saldo. ¿Quieres un análisis detallado?'
  }

  return 'Entiendo tu pregunta. Estoy analizando los datos para darte la mejor recomendación...'
}
