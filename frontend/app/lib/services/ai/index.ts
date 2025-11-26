/**
 * AI Services Index
 * Exporta todos los servicios de IA para uso centralizado
 */

// Servicios
export { MegaAIAgentService } from './MegaAIAgent.service';
export { AIScheduledReportsService } from './AIScheduledReports.service';
export { AIFormAutomationService } from './AIFormAutomation.service';
export { AIPowerBIService } from './AIPowerBI.service';
export { UserLearningService } from './UserLearning.service';

// Tipos de MegaAIAgent
export type {
  AIRequest,
  AIResponse,
  Message,
  Visualization,
  IntentType,
  CollectionName
} from './MegaAIAgent.service';

// Tipos de AIScheduledReports
export type {
  ReportSchedule,
  ReportConfig,
  ScheduledReport,
  ReportType,
  ReportFrequency,
  GeneratedReport
} from './AIScheduledReports.service';

// Tipos de AIFormAutomation
export type {
  FormPrediction,
  ValidationResult,
  FormField,
  FormPattern,
  AutoFillResult,
  ValidationRule
} from './AIFormAutomation.service';

// Tipos de AIPowerBI
export type {
  Dashboard,
  DashboardType,
  DashboardFilters,
  DashboardResult,
  KPI,
  Insight,
  Recommendation,
  ChartDataPoint,
  VisualizationConfig
} from './AIPowerBI.service';

// Tipos de UserLearning
export type {
  UserProfile,
  UserPreferences,
  UserPatterns,
  UserAnalytics,
  UserActivity,
  LearningInsight,
  ActionPattern,
  TimePattern,
  FeatureUsage
} from './UserLearning.service';

// Instancias singleton para uso global
let megaAIAgentInstance: InstanceType<typeof import('./MegaAIAgent.service').MegaAIAgentService> | null = null;
let scheduledReportsInstance: InstanceType<typeof import('./AIScheduledReports.service').AIScheduledReportsService> | null = null;
let formAutomationInstance: InstanceType<typeof import('./AIFormAutomation.service').AIFormAutomationService> | null = null;
let powerBIInstance: InstanceType<typeof import('./AIPowerBI.service').AIPowerBIService> | null = null;
let userLearningInstance: InstanceType<typeof import('./UserLearning.service').UserLearningService> | null = null;

/**
 * Obtiene instancia singleton del MegaAIAgent
 */
export async function getMegaAIAgent() {
  if (!megaAIAgentInstance) {
    const { MegaAIAgentService } = await import('./MegaAIAgent.service');
    megaAIAgentInstance = new MegaAIAgentService();
  }
  return megaAIAgentInstance;
}

/**
 * Obtiene instancia singleton de AIScheduledReports
 */
export async function getScheduledReports() {
  if (!scheduledReportsInstance) {
    const { AIScheduledReportsService } = await import('./AIScheduledReports.service');
    scheduledReportsInstance = new AIScheduledReportsService();
  }
  return scheduledReportsInstance;
}

/**
 * Obtiene instancia singleton de AIFormAutomation
 */
export async function getFormAutomation() {
  if (!formAutomationInstance) {
    const { AIFormAutomationService } = await import('./AIFormAutomation.service');
    formAutomationInstance = new AIFormAutomationService();
  }
  return formAutomationInstance;
}

/**
 * Obtiene instancia singleton de AIPowerBI
 */
export async function getPowerBI() {
  if (!powerBIInstance) {
    const { AIPowerBIService } = await import('./AIPowerBI.service');
    powerBIInstance = new AIPowerBIService();
  }
  return powerBIInstance;
}

/**
 * Obtiene instancia singleton de UserLearning
 */
export async function getUserLearning() {
  if (!userLearningInstance) {
    const { UserLearningService } = await import('./UserLearning.service');
    userLearningInstance = new UserLearningService();
  }
  return userLearningInstance;
}

/**
 * Inicializa todos los servicios de IA
 */
export async function initializeAIServices() {
  const [megaAI, reports, forms, powerBI, learning] = await Promise.all([
    getMegaAIAgent(),
    getScheduledReports(),
    getFormAutomation(),
    getPowerBI(),
    getUserLearning()
  ]);

  return {
    megaAI,
    reports,
    forms,
    powerBI,
    learning
  };
}

/**
 * Limpia todas las instancias de servicios
 */
export function cleanupAIServices() {
  if (userLearningInstance) {
    userLearningInstance.destroy();
  }
  
  megaAIAgentInstance = null;
  scheduledReportsInstance = null;
  formAutomationInstance = null;
  powerBIInstance = null;
  userLearningInstance = null;
}
