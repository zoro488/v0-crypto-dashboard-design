'use client'

import { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Glitch,
  Bloom,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { GlitchMode, BlendFunction } from 'postprocessing'
import useSpline from '@splinetool/r3f-spline'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'

// URL del bot IA en Spline - USAR LA ESCENA REAL
const SPLINE_BOT_URL = 'https://prod.spline.design/X2wQi1Id1gUKP4Od/scene.splinecode'

// Interface para las props del componente
interface AIAgentSceneProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showChat?: boolean
  onMessageSend?: (_message: string) => void
  isProcessing?: boolean
  enableGlitch?: boolean
  enableFloating?: boolean
  useSplineModel?: boolean
}

// Componente del Bot 3D usando Spline
function SplineBot({
  isThinking,
  enableFloating,
}: {
  isThinking: boolean
  enableFloating: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { pointer } = useThree()
  
  // Cargar la escena de Spline - devuelve nodes
  const splineResult = useSpline(SPLINE_BOT_URL)
  const nodes = splineResult.nodes
  
  // Buscar el nodo principal del bot
  const botNode = useMemo(() => {
    if (!nodes) return null
    
    // Buscar posibles nombres del nodo del bot en la escena
    const possibleNames = [
      'Bot', 'Robot', 'AI', 'Agent', 'Character', 
      'Scene', 'Group', 'bot', 'robot', 'ai',
    ]
    
    for (const name of possibleNames) {
      if (nodes[name]) {
        return nodes[name] as THREE.Object3D
      }
    }
    
    // Si no encontramos un nombre específico, tomar el primer nodo
    const nodeKeys = Object.keys(nodes)
    if (nodeKeys.length > 0) {
      return nodes[nodeKeys[0]] as THREE.Object3D
    }
    
    return null
  }, [nodes])
  
  // Animación del bot Spline
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Seguir el mouse suavemente (lookAt)
    const targetRotationY = pointer.x * 0.5
    const targetRotationX = -pointer.y * 0.3
    
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotationY,
      0.05,
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotationX,
      0.05,
    )
    
    // Flotación suave
    if (enableFloating) {
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.15
    }
    
    // Escala pulsante cuando piensa
    if (isThinking) {
      const pulse = 1 + Math.sin(time * 4) * 0.05
      groupRef.current.scale.setScalar(pulse)
    } else {
      groupRef.current.scale.setScalar(
        THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1),
      )
    }
  })
  
  if (!botNode) return null
  
  return (
    <group ref={groupRef} scale={0.8}>
      <primitive object={botNode.clone()} />
      {/* Luz adicional para el modelo */}
      <pointLight
        color="#4a90d9"
        intensity={isThinking ? 3 : 1}
        distance={5}
        decay={2}
      />
    </group>
  )
}

// Componente del Bot 3D procedural (fallback) con shaders personalizados
function ProceduralBot({
  isThinking,
  isGlitching: _isGlitching,
  enableFloating,
}: {
  isThinking: boolean
  isGlitching: boolean
  enableFloating: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const { pointer } = useThree()
  
  // Shader material para el núcleo del bot
  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uThinking: { value: 0 },
        uColor1: { value: new THREE.Color('#4a90d9') },
        uColor2: { value: new THREE.Color('#9333ea') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uThinking;
        
        void main() {
          vUv = uv;
          vNormal = normal;
          vPosition = position;
          
          vec3 pos = position;
          
          // Efecto de respiración
          float breathe = sin(uTime * 2.0) * 0.05;
          pos *= 1.0 + breathe;
          
          // Distorsión cuando está pensando
          if (uThinking > 0.5) {
            float noise = sin(pos.x * 10.0 + uTime * 5.0) * 
                         cos(pos.y * 10.0 + uTime * 3.0) * 0.02;
            pos += normal * noise * uThinking;
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uThinking;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Gradiente basado en posición
          float gradient = (vPosition.y + 1.0) * 0.5;
          vec3 color = mix(uColor1, uColor2, gradient);
          
          // Efecto de fresnel para brillo en los bordes
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(viewDir, vNormal), 2.0);
          
          // Pulso cuando está pensando
          float pulse = sin(uTime * 4.0) * 0.3 + 0.7;
          if (uThinking > 0.5) {
            color *= pulse;
          }
          
          // Añadir brillo de fresnel
          color += fresnel * 0.5;
          
          gl_FragColor = vec4(color, 0.9);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [])

  // Animación del bot
  useFrame((state) => {
    if (!groupRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Actualizar uniforms del shader
    if (coreMaterial.uniforms) {
      coreMaterial.uniforms.uTime.value = time
      coreMaterial.uniforms.uThinking.value = isThinking ? 1.0 : 0.0
    }
    
    // Seguir el mouse suavemente
    const targetRotationY = pointer.x * 0.5
    const targetRotationX = -pointer.y * 0.3
    
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotationY,
      0.05,
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotationX,
      0.05,
    )
    
    // Flotación
    if (enableFloating) {
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.15
    }
    
    // Rotar los anillos
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.x = time * (0.5 + i * 0.2)
        ring.rotation.y = time * (0.3 + i * 0.15)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {/* Núcleo principal */}
      <mesh ref={coreRef} material={coreMaterial}>
        <icosahedronGeometry args={[0.6, 3]} />
      </mesh>
      
      {/* Anillos orbitales */}
      <group ref={ringsRef}>
        {[0.9, 1.1, 1.3].map((radius, i) => (
          <mesh key={i} rotation={[Math.PI / 4 * i, 0, Math.PI / 6 * i]}>
            <torusGeometry args={[radius, 0.02, 16, 64]} />
            <meshBasicMaterial
              color={i === 1 ? '#9333ea' : '#4a90d9'}
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>
      
      {/* Partículas orbitando */}
      <OrbitalParticles isThinking={isThinking} />
      
      {/* Luz del núcleo */}
      <pointLight
        color="#4a90d9"
        intensity={isThinking ? 3 : 1}
        distance={5}
        decay={2}
      />
    </group>
  )
}

// Componente del Bot 3D que elige entre Spline y procedural
function AIBot({
  isThinking,
  isGlitching,
  enableFloating,
  useSplineModel = true,
}: {
  isThinking: boolean
  isGlitching: boolean
  enableFloating: boolean
  useSplineModel?: boolean
}) {
  const [splineError, setSplineError] = useState(false)
  
  // Si hay error cargando Spline o no se quiere usar, usar procedural
  if (!useSplineModel || splineError) {
    return (
      <ProceduralBot
        isThinking={isThinking}
        isGlitching={isGlitching}
        enableFloating={enableFloating}
      />
    )
  }
  
  return (
    <ErrorBoundary onError={() => setSplineError(true)}>
      <SplineBot isThinking={isThinking} enableFloating={enableFloating} />
    </ErrorBoundary>
  )
}

// Error boundary simple para capturar errores de Spline
function ErrorBoundary({ 
  children, 
  onError, 
}: { 
  children: React.ReactNode
  onError: () => void 
}) {
  const [hasError, _setHasError] = useState(false)
  
  useEffect(() => {
    if (hasError) {
      onError()
    }
  }, [hasError, onError])
  
  if (hasError) {
    return null
  }
  
  return <>{children}</>
}

// Partículas orbitando el núcleo
function OrbitalParticles({ isThinking }: { isThinking: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 100
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 1.5 + Math.random() * 0.5
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    
    return pos
  }, [])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    const speed = isThinking ? 3 : 1
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Movimiento orbital
      const x = posArray[i3]
      const y = posArray[i3 + 1]
      const angle = time * speed * 0.5 + i * 0.1
      
      posArray[i3] = x * Math.cos(angle * 0.01) - y * Math.sin(angle * 0.01)
      posArray[i3 + 1] = x * Math.sin(angle * 0.01) + y * Math.cos(angle * 0.01)
      posArray[i3 + 2] += Math.sin(time + i) * 0.001
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.rotation.y = time * 0.2
  })
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#4a90d9"
        size={0.05}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// Componente de efectos de post-procesamiento con Glitch aleatorio
function GlitchEffects({
  isGlitching,
  enableGlitch,
}: {
  isGlitching: boolean
  enableGlitch: boolean
}) {
  const [activeGlitch, setActiveGlitch] = useState(false)
  
  // Activar glitch aleatoriamente cada 5 segundos
  useEffect(() => {
    if (!enableGlitch) return
    
    const interval = setInterval(() => {
      // Probabilidad del 30% de activar glitch
      if (Math.random() < 0.3) {
        setActiveGlitch(true)
        // Desactivar después de 200-500ms
        setTimeout(() => setActiveGlitch(false), 200 + Math.random() * 300)
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [enableGlitch])
  
  const shouldGlitch = activeGlitch || isGlitching
  
  return (
    <EffectComposer>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.ADD}
      />
      <Glitch
        delay={new THREE.Vector2(0, 0)}
        duration={new THREE.Vector2(0.1, 0.3)}
        strength={new THREE.Vector2(0.1, 0.2)}
        mode={GlitchMode.SPORADIC}
        active={shouldGlitch}
        ratio={0.85}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(shouldGlitch ? 0.005 : 0.001, shouldGlitch ? 0.005 : 0.001)}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}

// Componente de fallback durante la carga
function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshBasicMaterial color="#4a90d9" wireframe transparent opacity={0.5} />
    </mesh>
  )
}

// Escena 3D completa
function AIBotScene({
  isThinking,
  isGlitching,
  enableGlitch,
  enableFloating,
  useSplineModel = true,
}: {
  isThinking: boolean
  isGlitching: boolean
  enableGlitch: boolean
  enableFloating: boolean
  useSplineModel?: boolean
}) {
  return (
    <>
      {/* Iluminación */}
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-3, -3, 3]} intensity={0.4} color="#4a90d9" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#9333ea"
      />
      
      {/* Bot IA - Usa Spline si está disponible, fallback a procedural */}
      <Suspense fallback={<LoadingFallback />}>
        <AIBot
          isThinking={isThinking}
          isGlitching={isGlitching}
          enableFloating={enableFloating}
          useSplineModel={useSplineModel}
        />
      </Suspense>
      
      {/* Efectos de post-procesamiento */}
      <GlitchEffects isGlitching={isGlitching} enableGlitch={enableGlitch} />
    </>
  )
}

// Componente de chat integrado
interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

function ChatInterface({
  messages,
  onSendMessage,
  isProcessing,
}: {
  messages: ChatMessage[]
  onSendMessage: (_message: string) => void
  isProcessing: boolean
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim())
      setInput('')
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] px-4 py-2 rounded-2xl
                ${msg.type === 'user'
                  ? 'bg-blue-500/80 text-white rounded-br-md'
                  : 'bg-white/10 text-white/90 rounded-bl-md border border-white/10'
                }
              `}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-[10px] opacity-50 mt-1 block">
                {msg.timestamp.toLocaleTimeString('es-MX', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                })}
              </span>
            </div>
          </motion.div>
        ))}
        
        {/* Indicador de escritura */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-bl-md border border-white/10">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isProcessing}
            className="
              flex-1 px-4 py-2 rounded-xl
              bg-white/5 border border-white/10
              text-white placeholder-white/40
              focus:outline-none focus:border-blue-500/50
              disabled:opacity-50
            "
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="
              px-4 py-2 rounded-xl
              bg-blue-500 text-white font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-blue-600 transition-colors
            "
          >
            Enviar
          </motion.button>
        </div>
      </form>
    </div>
  )
}

// Componente principal exportado
export function AIAgentScene({
  className = '',
  size = 'md',
  showChat = false,
  onMessageSend,
  isProcessing = false,
  enableGlitch = true,
  enableFloating = true,
  useSplineModel = true,
}: AIAgentSceneProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(showChat)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ])
  const [isThinking, setIsThinking] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)
  
  // Tamaños del widget
  const sizes = {
    sm: { width: 200, height: 200 },
    md: { width: 300, height: 300 },
    lg: { width: 400, height: 400 },
    xl: { width: 500, height: 500 },
  }
  
  const currentSize = isExpanded 
    ? { width: 600, height: 500 } 
    : sizes[size]
  
  // Manejar envío de mensajes
  const handleSendMessage = (content: string) => {
    // Añadir mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    
    // Activar estado de procesamiento
    setIsThinking(true)
    setIsGlitching(true)
    
    // Simular respuesta del bot (o llamar a onMessageSend)
    if (onMessageSend) {
      onMessageSend(content)
    }
    
    // Simular respuesta después de un delay
    setTimeout(() => {
      setIsGlitching(false)
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: `Procesé tu mensaje: "${content}". ¿Necesitas algo más?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsThinking(false)
    }, 1500 + Math.random() * 1000)
  }
  
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        width: currentSize.width + (isChatOpen ? 300 : 0),
        height: currentSize.height,
      }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Contenedor con efecto cristal */}
      <div className="
        absolute inset-0 rounded-2xl overflow-hidden
        bg-black/30 backdrop-blur-xl
        border border-white/10
        shadow-[0_0_30px_rgba(74,144,217,0.2)]
      ">
        {/* Canvas del Bot 3D */}
        <div 
          className="absolute left-0 top-0 bottom-0"
          style={{ width: currentSize.width }}
        >
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 3], fov: 50 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            style={{ background: 'transparent' }}
          >
            <AIBotScene
              isThinking={isThinking || isProcessing}
              isGlitching={isGlitching}
              enableGlitch={enableGlitch}
              enableFloating={enableFloating}
              useSplineModel={useSplineModel}
            />
          </Canvas>
        </div>
        
        {/* Panel de Chat */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute right-0 top-0 bottom-0 w-[300px] border-l border-white/10"
            >
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isThinking || isProcessing}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Controles */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          {/* Botón de chat */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="
              p-2 rounded-lg
              bg-white/10 backdrop-blur-xl
              border border-white/10
              hover:bg-white/20 transition-colors
            "
          >
            {isChatOpen ? (
              <X className="w-4 h-4 text-white" />
            ) : (
              <MessageCircle className="w-4 h-4 text-white" />
            )}
          </motion.button>
          
          {/* Botón de expandir */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              p-2 rounded-lg
              bg-white/10 backdrop-blur-xl
              border border-white/10
              hover:bg-white/20 transition-colors
            "
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white" />
            )}
          </motion.button>
        </div>
        
        {/* Indicador de estado */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className={`
            w-2 h-2 rounded-full
            ${isThinking ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}
          `} />
          <span className="text-xs text-white/60">
            {isThinking ? 'Procesando...' : 'En línea'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Versión simplificada solo del Bot (sin wrapper)
export function AIBotWidget({
  isThinking = false,
  enableFloating = true,
}: {
  isThinking?: boolean
  enableFloating?: boolean
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AIBot
        isThinking={isThinking}
        isGlitching={false}
        enableFloating={enableFloating}
      />
    </Suspense>
  )
}

export default AIAgentScene
