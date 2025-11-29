"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Send, Mic, FileDown, TrendingUp, Zap, Brain, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Badge } from "@/app/components/ui/badge"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import Spline from "@splinetool/react-spline"
import type { Application } from "@splinetool/runtime"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "text" | "insight" | "recommendation"
}

interface AIInsight {
  title: string
  description: string
  impact: "high" | "medium" | "low"
  action?: string
}

export default function PanelIA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente IA para FlowDistributor. Puedo ayudarte con análisis de ventas, predicciones, optimización de capital y mucho más. ¿En qué te puedo ayudar hoy?",
      timestamp: new Date(),
      type: "text",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [splineApp, setSplineApp] = useState<Application | null>(null)
  const [agentState, setAgentState] = useState<"idle" | "thinking" | "speaking">("idle")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const insights: AIInsight[] = [
    {
      title: "Oportunidad de Venta",
      description: "Cliente 'Bódega Valle' tiene patrón de compra cada 15 días. Última compra: hace 14 días.",
      impact: "high",
      action: "Contactar ahora",
    },
    {
      title: "Stock Crítico Detectado",
      description: "3 productos por debajo del mínimo. Recomendar orden de compra urgente.",
      impact: "high",
      action: "Crear OC",
    },
    {
      title: "Optimización de Capital",
      description: "Banco 'Profit' tiene exceso de liquidez. Considera transferir a inversión.",
      impact: "medium",
      action: "Ver detalles",
    },
    {
      title: "Tendencia Positiva",
      description: "Ventas aumentaron 23% este mes comparado con el anterior.",
      impact: "low",
      action: "Ver reporte",
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const onSplineLoad = (app: Application) => {
    setSplineApp(app)

    // Animate agent based on state
    if (app) {
      try {
        // Set initial idle animation
        app.emitEvent("mouseDown", "idle")
      } catch (error) {
        // Ignorar errores de eventos Spline silenciosamente
      }
    }
  }

  useEffect(() => {
    if (!splineApp) return

    try {
      switch (agentState) {
        case "idle":
          splineApp.emitEvent("mouseDown", "idle")
          break
        case "thinking":
          splineApp.emitEvent("mouseDown", "thinking")
          break
        case "speaking":
          splineApp.emitEvent("mouseDown", "speaking")
          break
      }
    } catch (error) {
      // Ignorar errores de animación silenciosamente
    }
  }, [agentState, splineApp])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setAgentState("thinking")

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(inputValue),
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
      setAgentState("speaking")

      setTimeout(() => setAgentState("idle"), 2000)
    }, 1500)
  }

  const getAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes("ventas") || lowerQuestion.includes("vender")) {
      return "Según el análisis de tus ventas, el mes actual muestra un incremento del 23% comparado con el mes anterior. Los productos más vendidos son Producto A ($85,000) y Producto B ($72,000). Te recomiendo enfocarte en mantener stock de estos productos y considerar aumentar márgenes en productos de menor rotación."
    }

    if (lowerQuestion.includes("banco") || lowerQuestion.includes("capital")) {
      return "Tu capital total es de $344,000 distribuido en 7 bancos. Bóveda Monte tiene el mayor saldo ($145,000), seguido de Utilidades ($85,000). Detecté que Profit tiene exceso de liquidez que podría ser optimizado. ¿Quieres que te genere un reporte detallado?"
    }

    if (lowerQuestion.includes("cliente")) {
      return "Tienes 45 clientes activos. Los top 3 por volumen de compra son: Bódega Valle ($85K), Super Express ($72K) y Mega M ($68K). Hay 3 clientes con pagos pendientes que requieren seguimiento."
    }

    return "Entiendo tu pregunta. Estoy analizando los datos... Basándome en tu historial, te recomiendo revisar el panel de Reportes donde encontrarás análisis detallados. También puedo ayudarte con predicciones específicas o generar reportes personalizados. ¿Qué te gustaría analizar?"
  }

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setTimeout(() => setIsListening(false), 3000)
    }
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Left Panel - Chat */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Consultas Hoy", value: "24", icon: Zap, color: "from-blue-500 to-cyan-500" },
            { label: "Insights Generados", value: "8", icon: Brain, color: "from-purple-500 to-pink-500" },
            { label: "Precisión", value: "94%", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
            { label: "Reportes Auto", value: "3", icon: FileDown, color: "from-orange-500 to-red-500" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                    >
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Chat Area */}
        <Card className="flex-1 bg-slate-900/50 border-white/10 backdrop-blur-xl flex flex-col">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-slate-900" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Asistente IA</CardTitle>
                  <p className="text-xs text-slate-400">Siempre disponible para ayudarte</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                        : "bg-white/10 text-white backdrop-blur-xl"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xl">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <CardContent className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleVoiceInput}
                className={`text-white ${isListening ? "bg-red-500/20 text-red-400" : ""}`}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {isListening && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 mt-2 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Escuchando...
              </motion.p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - 3D Agent & Insights */}
      <div className="flex flex-col gap-6">
        {/* 3D Agent */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-0 relative h-[400px]">
            <Spline
              scene="https://prod.spline.design/EMUFQmxEYeuyK46H/scene.splinecode"
              onLoad={onSplineLoad}
              style={{ width: "100%", height: "100%" }}
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <Badge className="bg-black/50 backdrop-blur-xl border-white/20 text-white">
                Estado: {agentState === "idle" ? "En espera" : agentState === "thinking" ? "Pensando..." : "Hablando"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl flex-1">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              Insights IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold text-sm">{insight.title}</h4>
                      <Badge
                        variant={
                          insight.impact === "high"
                            ? "destructive"
                            : insight.impact === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {insight.impact === "high" ? "Alto" : insight.impact === "medium" ? "Medio" : "Bajo"}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-xs mb-3">{insight.description}</p>
                    {insight.action && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 text-xs p-0 h-auto"
                      >
                        {insight.action} →
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
