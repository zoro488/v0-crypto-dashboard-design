import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { logger } from '../utils/logger'
import type { PanelId, BancoId } from '@/app/types'
import { BANCOS_ORDENADOS, type BancoConfig } from '../constants/bancos'

// ============================================================
// TIPOS DEL STORE - Solo UI State
// Los tipos de dominio vienen de @/app/types
// Los datos de negocio viven SOLO en Firestore
// ============================================================

/**
 * Estado local de un banco para UI
 * Los saldos reales vienen de Firestore via useFirestoreCRUD
 */
export interface BancoUIState {
  id: BancoId
  nombre: string
  saldo: number
  color: string
}

/**
 * AppState - Estado de la aplicación CHRONOS
 * 
 * PRINCIPIOS:
 * 1. Solo estado UI - datos de negocio viven en Firestore
 * 2. Usa tipos de @/app/types, no duplicados locales
 * 3. No persiste datos de negocio en localStorage
 * 4. No contiene lógica de negocio (usa servicios)
 */
interface AppState {
  // ========== UI State ==========
  currentPanel: PanelId
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'cyber'
  
  // ========== User State ==========
  currentUserId: string | null

  // ========== Voice Agent State ==========
  voiceAgentActive: boolean
  voiceAgentStatus: 'idle' | 'listening' | 'thinking' | 'speaking'
  audioFrequencies: number[]

  // ========== 3D State ==========
  modelRotation: number
  activeScene: string | null

  // ========== Financial UI Cache ==========
  // Estos son cache de UI sincronizados desde Firestore
  // No son la fuente de verdad, solo para rendering rápido
  totalCapital: number
  bancos: BancoUIState[]

  // ========== Data Refresh ==========
  dataRefreshTrigger: number
  triggerDataRefresh: () => void

  // ========== UI Actions ==========
  setCurrentPanel: (panel: PanelId) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'cyber') => void
  setVoiceAgentActive: (active: boolean) => void
  setVoiceAgentStatus: (status: 'idle' | 'listening' | 'thinking' | 'speaking') => void
  setAudioFrequencies: (frequencies: number[]) => void
  setModelRotation: (rotation: number) => void
  setActiveScene: (scene: string | null) => void
  
  // ========== Financial UI Sync ==========
  // Solo para sincronizar cache de UI desde Firestore
  updateBancoSaldo: (id: BancoId, saldo: number) => void
  syncBancosFromFirestore: (bancos: Array<{ id: BancoId; saldo: number }>) => void
}

// ============================================================
// ESTADO INICIAL DE BANCOS - Desde constantes centralizadas
// ============================================================
const BANCOS_UI_INICIAL: BancoUIState[] = BANCOS_ORDENADOS.map((banco: BancoConfig) => ({
  id: banco.id,
  nombre: banco.nombre,
  saldo: 0, // Se sincronizará desde Firestore
  color: banco.color,
}))

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== Initial UI State ==========
        currentPanel: 'dashboard',
        sidebarCollapsed: false,
        theme: 'dark',
        currentUserId: 'anonymous',
        
        // Voice Agent
        voiceAgentActive: false,
        voiceAgentStatus: 'idle',
        audioFrequencies: Array(32).fill(0),
        
        // 3D
        modelRotation: 0,
        activeScene: null,
        
        // Financial UI Cache (sincronizado desde Firestore)
        totalCapital: 0,
        bancos: BANCOS_UI_INICIAL,

        // Data Refresh
        dataRefreshTrigger: 0,
        triggerDataRefresh: () => set((state) => ({ 
          dataRefreshTrigger: state.dataRefreshTrigger + 1 
        })),

        // ========== UI Actions ==========
        setCurrentPanel: (panel) => set({ currentPanel: panel }),
        toggleSidebar: () => set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        })),
        setTheme: (theme) => set({ theme }),
        setVoiceAgentActive: (active) => set({ voiceAgentActive: active }),
        setVoiceAgentStatus: (status) => set({ voiceAgentStatus: status }),
        setAudioFrequencies: (frequencies) => set({ audioFrequencies: frequencies }),
        setModelRotation: (rotation) => set({ modelRotation: rotation }),
        setActiveScene: (scene) => set({ activeScene: scene }),
        
        // ========== Financial UI Sync ==========
        updateBancoSaldo: (id, saldo) => {
          set((state) => {
            const newBancos = state.bancos.map((banco) => 
              banco.id === id ? { ...banco, saldo } : banco
            )
            const newTotalCapital = newBancos.reduce((acc, banco) => acc + banco.saldo, 0)
            return { 
              bancos: newBancos, 
              totalCapital: newTotalCapital 
            }
          })
        },
        
        syncBancosFromFirestore: (bancosData) => {
          set((state) => {
            const newBancos = state.bancos.map((banco) => {
              const firestoreData = bancosData.find((b) => b.id === banco.id)
              return firestoreData 
                ? { ...banco, saldo: firestoreData.saldo } 
                : banco
            })
            const newTotalCapital = newBancos.reduce((acc, banco) => acc + banco.saldo, 0)
            
            logger.debug('Bancos sincronizados desde Firestore', {
              context: 'AppStore',
              data: { totalCapital: newTotalCapital }
            })
            
            return { 
              bancos: newBancos, 
              totalCapital: newTotalCapital 
            }
          })
        },
      }),
      {
        name: 'chronos-ui-storage',
        // Solo persistir preferencias de UI, NO datos de negocio
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          currentPanel: state.currentPanel,
        }),
      },
    ),
    { name: 'ChronosStore' }
  ),
)
