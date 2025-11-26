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
  AIAction,
  AIVisualization,
  ConversationMessage,
} from './MegaAIAgent.service';

// Tipos de AIScheduledReports
export type {
  ScheduledReport,
  ReportType,
  RecurrenceType,
  ExportFormat,
  ReportFilters,
  GeneratedReport,
  ReportData,
  ChartData,
  KPIData,
  ReportInsight,
} from './AIScheduledReports.service';

// Tipos de AIFormAutomation
export type {
  FormTemplate,
  FormType,
  FormField,
  FieldValidation,
  FormSuggestion,
  FormAnalysis,
  ValidationResult,
  UserFormPattern,
  PatternData,
} from './AIFormAutomation.service';

// Tipos de AIPowerBI
export type {
  Dashboard,
  DashboardType,
  DashboardFilters,
  DashboardResult,
  KPI,
  Visualization,
  ChartDataPoint,
  VisualizationConfig,
  Insight,
  Recommendation,
} from './AIPowerBI.service';

// Tipos de UserLearning
export type {
  UserProfile,
  UserPreferences,
  NotificationPreferences,
  AIAssistantPreferences,
  UserPatterns,
  ActionPattern,
  TimePattern,
  SearchPattern,
  NavigationPattern,
  UserAnalytics,
  FeatureUsage,
  UserActivity,
  LearningInsight,
} from './UserLearning.service';

// Instancias singleton para uso global (por userId)
const megaAIAgentInstances: Map<string, InstanceType<typeof import('./MegaAIAgent.service').MegaAIAgentService>> = new Map();
let scheduledReportsInstance: InstanceType<typeof import('./AIScheduledReports.service').AIScheduledReportsService> | null = null;
let formAutomationInstance: InstanceType<typeof import('./AIFormAutomation.service').AIFormAutomationService> | null = null;
let powerBIInstance: InstanceType<typeof import('./AIPowerBI.service').AIPowerBIService> | null = null;
let userLearningInstance: InstanceType<typeof import('./UserLearning.service').UserLearningService> | null = null;

/**
 * Obtiene instancia singleton del MegaAIAgent para un usuario
 */
export async function getMegaAIAgent(userId: string) {
  if (!megaAIAgentInstances.has(userId)) {
    const { MegaAIAgentService } = await import('./MegaAIAgent.service');
    megaAIAgentInstances.set(userId, new MegaAIAgentService(userId));
  }
  return megaAIAgentInstances.get(userId)!;
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
 * Inicializa todos los servicios de IA (excepto MegaAIAgent que requiere userId)
 */
export async function initializeAIServices() {
  const [reports, forms, powerBI, learning] = await Promise.all([
    getScheduledReports(),
    getFormAutomation(),
    getPowerBI(),
    getUserLearning()
  ]);

  return {
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
  
  megaAIAgentInstances.clear();
  scheduledReportsInstance = null;
  formAutomationInstance = null;
  powerBIInstance = null;
  userLearningInstance = null;
}
