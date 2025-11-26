"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Send, Maximize2, X, Minimize2, Brain } from "lucide-react"
import { useState, useRef, useEffect, Suspense } from "react"
import Spline from "@splinetool/react-spline"
import type { Application } from "@splinetool/runtime"
import { useAppStore } from "@/frontend/app/lib/store/useAppStore"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

// URL del Spline Widget (orb con ojos)
const SPLINE_WIDGET_URL = "https://prod.spline.design/EMUFQmxEYeuyK46H/scene.splinecode"

export function FloatingAIWidget() {
  const [state, setState] = useState<"minimized" | "chat" | "fullscreen">("minimized")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [splineApp, setSplineApp] = useState<Application | null>(null)
  const [notificationCount, setNotificationCount] = useState(3)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { setCurrentPanel, voiceAgentStatus } = useAppStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Manejar carga del Spline
  const handleSplineLoad = (app: Application) => {
    setSplineApp(app)
    setSplineLoaded(true)
  }

  // Ir al panel IA en fullscreen
  const goToIAPanel = () => {
    setCurrentPanel("ia")
    setState("minimized")
  }

  const sendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setIsTyping(true)

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Entiendo tu pregunta. Estoy procesando la información en tiempo real...",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  if (state === "minimized") {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-20 h-20 rounded-full cursor-pointer group"
          onClick={() => setState("chat")}
        >
          {/* Glow exterior animado */}
          <motion.div
            className="absolute -inset-2 rounded-full bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* Anillo de pulso */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400/50"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />

          {/* Contenedor del Spline Widget */}
          <div className="absolute inset-0 rounded-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <motion.div
                  className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </div>
            }>
              <Spline
                scene={SPLINE_WIDGET_URL}
                onLoad={handleSplineLoad}
                style={{ width: '100%', height: '100%', transform: 'scale(1.2)' }}
              />
            </Suspense>
          </div>

          {/* Borde brillante */}
          <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40 transition-colors" />

          {/* Badge de notificaciones */}
          <AnimatePresence>
            {notificationCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {notificationCount}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Indicador de estado */}
          <motion.div
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
              voiceAgentStatus === "listening" ? "bg-green-500" :
              voiceAgentStatus === "speaking" ? "bg-blue-500" :
              voiceAgentStatus === "thinking" ? "bg-purple-500" :
              "bg-gray-500"
            }`}
            animate={voiceAgentStatus !== "idle" ? {
              scale: [1, 1.3, 1],
            } : {}}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          />
        </motion.div>
      </motion.div>
    )
  }

  if (state === "chat") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 w-[400px] h-[600px] z-50"
      >
        <div className="apple-glass h-full rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          {/* Header con mini Spline */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mini Spline avatar */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 relative">
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-400 animate-pulse" />
                    </div>
                  }>
                    <Spline
                      scene={SPLINE_WIDGET_URL}
                      style={{ width: '100%', height: '100%', transform: 'scale(1.5)' }}
                    />
                  </Suspense>
                  {/* Indicador de estado */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                    isListening ? "bg-green-500 animate-pulse" :
                    isTyping ? "bg-blue-500 animate-pulse" :
                    "bg-green-500"
                  }`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Chronos AI</h3>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isListening ? "bg-green-500" :
                      isTyping ? "bg-blue-500" :
                      "bg-green-500"
                    } animate-pulse`} />
                    <span className="text-white/60 text-xs">
                      {isListening ? "Escuchando..." : isTyping ? "Pensando..." : "Online"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToIAPanel}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Abrir Panel IA completo"
                >
                  <Maximize2 className="w-4 h-4 text-white/60" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setState("minimized")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4 text-white/60" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {/* Spline widget grande cuando no hay mensajes */}
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 mb-4 relative">
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <motion.div
                        className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                    </div>
                  }>
                    <Spline
                      scene={SPLINE_WIDGET_URL}
                      style={{ width: '100%', height: '100%', transform: 'scale(1.3)' }}
                    />
                  </Suspense>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none" />
                </div>
                <h4 className="text-white font-semibold mb-1">Asistente Chronos</h4>
                <p className="text-white/60 text-xs mb-4">¿En qué puedo ayudarte?</p>
                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Ventas", "Inventario", "Clientes"].map((action) => (
                    <motion.button
                      key={action}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInputText(`Analiza ${action.toLowerCase()}`)}
                      className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 text-xs border border-white/10 transition-colors"
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`
                        max-w-[75%] px-4 py-2 rounded-2xl text-sm
                        ${message.sender === "user" ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white" : "bg-white/10 text-white"}
                      `}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white/10 px-4 py-3 rounded-2xl">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 0.6,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsListening(!isListening)}
                className={`
                  p-2.5 rounded-xl transition-all
                  ${isListening ? "bg-red-500" : "bg-white/10 hover:bg-white/15"}
                `}
              >
                {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
              </motion.button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-white/5 text-white px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 text-sm placeholder:text-white/40"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return null
}
