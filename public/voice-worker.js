/**
 * 🎤 VOICE WORKER - CHRONOS 2026
 * 
 * Web Worker para procesamiento de voz y AI off-main-thread
 * Garantiza 0ms de bloqueo en el hilo principal
 * 
 * @version 1.0.0
 */

// Estado del worker
let isListening = false;
let audioContext = null;

// Procesar mensajes del hilo principal
self.onmessage = async function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_LISTENING':
      isListening = true;
      self.postMessage({ type: 'STATUS', status: 'listening' });
      break;
      
    case 'STOP_LISTENING':
      isListening = false;
      self.postMessage({ type: 'STATUS', status: 'idle' });
      break;
      
    case 'PROCESS_AUDIO':
      // Procesar audio en background
      const result = await processAudioData(data);
      self.postMessage({ type: 'AUDIO_PROCESSED', result });
      break;
      
    case 'TRANSCRIBE':
      // Simulación de transcripción (en producción usaría Whisper API)
      const transcription = await transcribeAudio(data);
      self.postMessage({ type: 'TRANSCRIPTION', text: transcription });
      break;
      
    case 'AI_QUERY':
      // Procesar consulta AI en background
      const response = await processAIQuery(data);
      self.postMessage({ type: 'AI_RESPONSE', response });
      break;
      
    case 'PING':
      self.postMessage({ type: 'PONG', timestamp: Date.now() });
      break;
      
    default:
      console.warn('[VoiceWorker] Mensaje desconocido:', type);
  }
};

/**
 * Procesa datos de audio sin bloquear UI
 */
async function processAudioData(audioData) {
  // Análisis de frecuencias para visualización
  const frequencies = new Float32Array(32);
  
  if (audioData && audioData.length > 0) {
    // Calcular magnitudes de frecuencia
    for (let i = 0; i < 32; i++) {
      const start = Math.floor((i / 32) * audioData.length);
      const end = Math.floor(((i + 1) / 32) * audioData.length);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += Math.abs(audioData[j] || 0);
      }
      frequencies[i] = sum / (end - start);
    }
  }
  
  return {
    frequencies: Array.from(frequencies),
    volume: calculateVolume(audioData),
    timestamp: Date.now(),
  };
}

/**
 * Calcular volumen RMS
 */
function calculateVolume(audioData) {
  if (!audioData || audioData.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  return Math.sqrt(sum / audioData.length);
}

/**
 * Transcribir audio (placeholder - en producción usaría Whisper)
 */
async function transcribeAudio(audioBlob) {
  // En producción, esto enviaría el audio a Whisper API
  // Por ahora retorna placeholder
  return '';
}

/**
 * Procesar consulta AI sin bloquear UI
 */
async function processAIQuery(query) {
  // Validar query
  if (!query || typeof query.text !== 'string') {
    return { error: 'Query inválida', success: false };
  }
  
  try {
    // Análisis de intención local (sin red)
    const intent = analyzeIntent(query.text);
    
    return {
      success: true,
      intent,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Análisis de intención local
 */
function analyzeIntent(text) {
  const lowerText = text.toLowerCase();
  
  // Patrones de intención
  const intents = {
    venta: ['venta', 'vender', 'vendí', 'ingreso', 'cobrar'],
    compra: ['compra', 'orden', 'proveedor', 'distribuidor', 'pedir'],
    balance: ['balance', 'capital', 'saldo', 'dinero', 'cuanto'],
    cliente: ['cliente', 'deuda', 'debe', 'pago', 'abono'],
    reporte: ['reporte', 'resumen', 'estadística', 'gráfica'],
  };
  
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return intent;
    }
  }
  
  return 'general';
}

// Indicar que el worker está listo
self.postMessage({ type: 'READY', timestamp: Date.now() });
