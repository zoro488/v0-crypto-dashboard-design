'use client';

/**
 * 🤖 FloatingAIOrb - Widget Flotante de Asistente IA con Orbe 3D
 * 
 * Reemplaza el widget flotante existente con el modelo AI Voice Orb
 * Características:
 * - Orbe 3D interactivo basado en GLTF
 * - Panel de chat inmersivo con glassmorphism
 * - Visualización de audio en tiempo real
 * - Animaciones reactivas por estado
 * - Sugerencias contextuales
 * - Historial de conversación
 */

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
  X, Send, Minimize2, Maximize2, Sparkles, Bot, User, 
  Zap, Brain, Activity, MessageSquare, Mic, MicOff,
  ChevronUp, BarChart3, FileText, Calculator, Package
} from 'lucide-react';
import * as THREE from 'three';

import { AIVoiceOrb, OrbState } from './models/AIVoiceOrb';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';

// ============================================================================
// TIPOS
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'chart' | 'form' | 'data';
  metadata?: {
    chartType?: string;
    formFields?: string[];
    dataPreview?: Record<string, unknown>;
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: typeof BarChart3;
  prompt: string;
  color: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'sales', label: 'Ventas del día', icon: BarChart3, prompt: '¿Cuáles son las ventas de hoy?', color: '#3b82f6' },
  { id: 'inventory', label: 'Inventario', icon: Package, prompt: 'Dame un resumen del inventario actual', color: '#22c55e' },
  { id: 'report', label: 'Generar reporte', icon: FileText, prompt: 'Genera un reporte financiero del mes', color: '#a855f7' },
  { id: 'calculate', label: 'Calcular utilidades', icon: Calculator, prompt: 'Calcula las utilidades de esta semana', color: '#f59e0b' },
];

// ============================================================================
// HOOK DE IA (Conectar con tu backend real)
// ============================================================================

function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<OrbState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de Chronos. Puedo ayudarte a analizar datos, generar reportes, automatizar registros y más. ¿En qué te puedo ayudar?',
      timestamp: new Date(),
      type: 'text'
    }
  ]);

  // Simular nivel de audio cuando habla
  useEffect(() => {
    if (status === 'speaking') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [status]);

  const askAgent = useCallback(async (query: string) => {
    setIsLoading(true);
    setStatus('listening');
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, userMessage]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus('thinking');
    
    // Simular procesamiento (reemplazar con llamada real a API)
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    setStatus('speaking');
    
    // Determinar tipo de respuesta basado en la consulta
    let responseType: Message['type'] = 'text';
    let metadata: Message['metadata'] = undefined;
    
    if (query.toLowerCase().includes('ventas') || query.toLowerCase().includes('gráfico')) {
      responseType = 'chart';
      metadata = { chartType: 'bar' };
    } else if (query.toLowerCase().includes('registro') || query.toLowerCase().includes('formulario')) {
      responseType = 'form';
      metadata = { formFields: ['Producto', 'Cantidad', 'Precio', 'Cliente'] };
    } else if (query.toLowerCase().includes('inventario') || query.toLowerCase().includes('stock')) {
      responseType = 'data';
      metadata = { dataPreview: { total: 1234, lowStock: 15, categories: 8 } };
    }
    
    const responses = [
      `He analizado tu consulta sobre "${query}". Basándome en los datos del sistema, aquí tienes la información solicitada.`,
      `Perfecto, procesando "${query}". Los datos muestran tendencias positivas este período.`,
      `Entendido. Respecto a "${query}", he preparado un análisis detallado para ti.`,
    ];
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      type: responseType,
      metadata
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStatus('success');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus('idle');
    setIsLoading(false);
  }, []);

  const toggleListening = useCallback(() => {
    setIsListening(prev => {
      if (!prev) {
        setStatus('listening');
      } else {
        setStatus('idle');
      }
      return !prev;
    });
  }, []);

  return { 
    isLoading, 
    status, 
    messages, 
    askAgent, 
    audioLevel,
    isListening,
    toggleListening
  };
}

// ============================================================================
// COMPONENTE DE MENSAJE CON VISUALIZACIÓN
// ============================================================================

function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <motion.div 
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
          ${isAssistant 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
          }
        `}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {isAssistant ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
      </motion.div>
      
      {/* Contenido */}
      <div className={`max-w-[80%] space-y-2`}>
        {/* Texto */}
        <motion.div 
          className={`
            p-4 rounded-2xl text-sm leading-relaxed
            ${isAssistant
              ? 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
              : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/20'
            }
          `}
          whileHover={{ scale: 1.01 }}
        >
          {message.content}
        </motion.div>
        
        {/* Visualización adicional según tipo */}
        {message.type === 'chart' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Visualización de datos</span>
            </div>
            {/* Gráfico simple de barras */}
            <div className="flex items-end gap-2 h-24">
              {[65, 40, 85, 55, 70, 90, 45].map((height, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-600 to-purple-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1, type: 'spring' }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-white/40">
              <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
            </div>
          </motion.div>
        )}
        
        {message.type === 'form' && message.metadata?.formFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-white/60">Formulario detectado</span>
            </div>
            <div className="space-y-2">
              {message.metadata.formFields.map((field, i) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs text-white/70">{field}</span>
                  <div className="flex-1 h-6 bg-white/5 rounded border border-white/10" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {message.type === 'data' && message.metadata?.dataPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-white/60">Datos del sistema</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(message.metadata.dataPreview).map(([key, value], i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 rounded-lg p-2 text-center"
                >
                  <div className="text-lg font-bold text-white">{String(value)}</div>
                  <div className="text-[10px] text-white/40 capitalize">{key}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Timestamp */}
        <div className={`text-[10px] ${isAssistant ? 'text-white/30' : 'text-white/50'} px-1`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// INDICADOR DE ESTADO
// ============================================================================

function StatusIndicator({ status }: { status: OrbState }) {
  const config: Record<OrbState, { color: string; label: string; icon: typeof Activity }> = {
    idle: { color: 'bg-emerald-500', label: 'Listo', icon: Activity },
    listening: { color: 'bg-blue-500', label: 'Escuchando...', icon: Mic },
    thinking: { color: 'bg-purple-500', label: 'Procesando...', icon: Brain },
    speaking: { color: 'bg-cyan-500', label: 'Respondiendo...', icon: Zap },
    success: { color: 'bg-green-500', label: 'Completado', icon: Sparkles },
    error: { color: 'bg-red-500', label: 'Error', icon: X }
  };
  
  const { color, label, icon: Icon } = config[status];
  
  return (
    <motion.div className="flex items-center gap-2" key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div 
        className={`w-2 h-2 rounded-full ${color}`}
        animate={status === 'idle' ? {} : { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1, repeat: status === 'idle' ? 0 : Infinity }}
      />
      <span className="text-xs text-white/50">{label}</span>
    </motion.div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function FloatingAIOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isLoading, status, messages, askAgent, audioLevel, isListening, toggleListening } = useAI();
  
  // Motion para el orbe
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const orbX = useSpring(mouseX, { damping: 25, stiffness: 150 });
  const orbY = useSpring(mouseY, { damping: 25, stiffness: 150 });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    await askAgent(query);
    setQuery('');
  };

  const handleQuickAction = (action: QuickAction) => {
    setQuery(action.prompt);
    askAgent(action.prompt);
  };

  const handleOrbMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) * 0.15);
    mouseY.set((e.clientY - rect.top - rect.height / 2) * 0.15);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      
      {/* ══════════════════════════════════════════════════════════════════
          PANEL DE CHAT INMERSIVO
          ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 30, scale: 0.85, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[440px] h-[600px] bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden"
          >
            {/* Fondo animado */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <motion.div 
                className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"
                animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div 
                className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px]"
                animate={{ x: [0, -30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            
            {/* Header */}
            <div className="relative p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-purple-900/20">
              <div className="flex items-center gap-4">
                <motion.div className="relative" animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                </motion.div>
                <div>
                  <span className="font-bold text-white text-lg">Chronos AI</span>
                  <StatusIndicator status={status} />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10 text-white/60" onClick={() => setIsMinimized(true)}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10 text-white/60" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-5" ref={scrollRef}>
              <div className="space-y-5">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Brain className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.span 
                            key={i}
                            className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                            animate={{ y: [-3, 3, -3], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Acciones rápidas */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {QUICK_ACTIONS.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/10 whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative p-4 border-t border-white/10 bg-black/40">
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={toggleListening}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                    isListening ? 'bg-red-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>
                
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Escribe o usa el micrófono..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50 rounded-xl h-12"
                />
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !query.trim()}
                    className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-30"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel Minimizado */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-4 cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-white">Chronos AI</span>
            <span className="text-xs text-white/50">{messages.length} mensajes</span>
            <Maximize2 className="w-4 h-4 text-white/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          ORBE 3D FLOTANTE
          ══════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative w-32 h-32 cursor-pointer"
        style={{ x: orbX, y: orbY }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
        onMouseMove={handleOrbMouseMove}
        onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      >
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 4], fov: 45 }}
          style={{ pointerEvents: 'none' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={1} color="#60a5fa" />
            <pointLight position={[-5, -5, 5]} intensity={0.5} color="#a855f7" />
            
            <AIVoiceOrb
              state={status}
              audioLevel={audioLevel}
              scale={0.8}
              enableParticles={!isOpen}
            />
            
            <Environment preset="city" />
            
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.5} mipmapBlur />
              <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.002, 0.002)} />
              <Vignette darkness={0.3} offset={0.3} />
            </EffectComposer>
          </Suspense>
        </Canvas>

        {/* Efectos de fondo */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -z-10"
          animate={{ scale: isLoading ? [1, 1.3, 1] : [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Anillos decorativos */}
        <motion.div
          className="absolute inset-[-4px] border border-blue-500/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Badge de notificación */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full border-2 border-black flex items-center justify-center"
          >
            <span className="text-[10px] font-bold text-white">AI</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default FloatingAIOrb;
