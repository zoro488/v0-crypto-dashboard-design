/**
 * 🎮 ZERO FORCE: OVERDRIVE - Exports Index
 * 
 * Sistema Operativo Táctico Inmersivo
 * 
 * Arquitectura de componentes:
 * 
 * components/3d/
 * ├── shaders/
 * │   └── ZeroEyeShader.ts    - Shader GLSL procedural para ojos rojos
 * ├── ZeroAvatar.tsx          - Avatar 3D con shader de ojos
 * ├── ZeroEnvironment.tsx     - Entorno cinematográfico con post-processing
 * └── ZeroCombatUnit.tsx      - Núcleo gráfico con sistema de combate
 * 
 * components/widgets/
 * └── ZeroChatWidget.tsx      - Widget conversacional flotante
 * 
 * components/panels/
 * └── ZeroPanel.tsx           - Interfaz de mando táctica completa
 */

// ============================================
// 3D COMPONENTS
// ============================================

export { default as ZeroAvatar } from './3d/ZeroAvatar'
export type { ZeroAvatarProps } from './3d/ZeroAvatar'

export { default as ZeroEnvironment } from './3d/ZeroEnvironment'
export type { ZeroEnvironmentProps, ZeroMode } from './3d/ZeroEnvironment'

export { default as ZeroCombatUnit } from './3d/ZeroCombatUnit'
export type { ZeroCombatUnitProps, CombatMode } from './3d/ZeroCombatUnit'

// ============================================
// SHADERS
// ============================================

export { ZeroEyeMaterial } from './3d/shaders/ZeroEyeShader'

// ============================================
// WIDGETS
// ============================================

export { default as ZeroChatWidget } from './widgets/ZeroChatWidget'
export type { 
  ZeroChatWidgetProps, 
  Message as ZeroChatMessage 
} from './widgets/ZeroChatWidget'

// ============================================
// PANELS
// ============================================

export { default as ZeroPanel } from './panels/ZeroPanel'
export type { 
  ZeroPanelProps, 
  SystemMode, 
  LogEntry 
} from './panels/ZeroPanel'
