/**
 * UserLearningService - Aprendizaje y Patrones de Usuario
 * Capacidades:
 * - Tracking de comportamiento
 * - Detección de patrones
 * - Preferencias aprendidas
 * - Recomendaciones personalizadas
 * - Análisis de actividad
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/app/lib/firebase/config';

// Tipos
export interface UserProfile {
  userId: string;
  createdAt: Date;
  lastActive: Date;
  totalSessions: number;
  preferences: UserPreferences;
  patterns: UserPatterns;
  analytics: UserAnalytics;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  defaultPanel: string;
  dashboardLayout: string[];
  notifications: NotificationPreferences;
  aiAssistant: AIAssistantPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'realtime' | 'hourly' | 'daily';
  types: string[];
}

export interface AIAssistantPreferences {
  autoSuggestions: boolean;
  voiceEnabled: boolean;
  proactiveInsights: boolean;
  detailLevel: 'basic' | 'detailed' | 'expert';
}

export interface UserPatterns {
  commonActions: ActionPattern[];
  timePatterns: TimePattern[];
  searchPatterns: SearchPattern[];
  navigationPatterns: NavigationPattern[];
}

export interface ActionPattern {
  action: string;
  frequency: number;
  lastUsed: Date;
  context?: string;
  avgDuration?: number;
}

export interface TimePattern {
  hour: number;
  dayOfWeek: number;
  activityLevel: 'high' | 'medium' | 'low';
  commonActivities: string[];
}

export interface SearchPattern {
  query: string;
  frequency: number;
  results: number;
  successful: boolean;
}

export interface NavigationPattern {
  from: string;
  to: string;
  frequency: number;
  avgTime: number;
}

export interface UserAnalytics {
  totalActions: number;
  actionsToday: number;
  avgSessionDuration: number;
  mostUsedFeatures: FeatureUsage[];
  peakActivityHours: number[];
  engagementScore: number;
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  lastUsed: Date;
  satisfaction?: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  context: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  sessionId?: string;
  duration?: number;
}

export interface LearningInsight {
  type: 'shortcut' | 'recommendation' | 'optimization' | 'alert';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
}

export class UserLearningService {
  private sessionId: string;
  private sessionStart: Date;
  private activityBuffer: UserActivity[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStart = new Date();
    this.startActivityFlush();
  }

  /**
   * Inicia el flush periódico de actividades
   */
  private startActivityFlush(): void {
    // Flush cada 30 segundos
    this.flushInterval = setInterval(() => {
      this.flushActivities().catch(console.error);
    }, 30000);
  }

  /**
   * Registra una actividad del usuario
   */
  async trackActivity(
    userId: string,
    action: string,
    context: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const activity: UserActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      context,
      metadata,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.activityBuffer.push(activity);

    // Si el buffer tiene más de 20 items, flush inmediato
    if (this.activityBuffer.length >= 20) {
      await this.flushActivities();
    }
  }

  /**
   * Flush actividades a Firestore
   */
  private async flushActivities(): Promise<void> {
    if (this.activityBuffer.length === 0) return;

    const activitiesToFlush = [...this.activityBuffer];
    this.activityBuffer = [];

    try {
      // Guardar actividades en batch
      const batch = activitiesToFlush.map(activity => {
        const activityRef = doc(db!, 'userActivities', activity.id);
        return setDoc(activityRef, {
          ...activity,
          timestamp: Timestamp.fromDate(activity.timestamp)
        });
      });

      await Promise.all(batch);

      // Actualizar patrones del usuario
      if (activitiesToFlush.length > 0) {
        await this.updateUserPatterns(activitiesToFlush[0].userId, activitiesToFlush);
      }
    } catch (error) {
      // Re-agregar al buffer si falla
      this.activityBuffer = [...activitiesToFlush, ...this.activityBuffer];
      console.error('Error flushing activities:', error);
    }
  }

  /**
   * Actualiza los patrones del usuario basándose en actividades
   */
  private async updateUserPatterns(
    userId: string,
    activities: UserActivity[]
  ): Promise<void> {
    try {
      const userPatternsRef = doc(db!, 'userPatterns', userId);
      
      // Calcular nuevos patrones
      const actionCounts: Record<string, number> = {};
      const contextCounts: Record<string, number> = {};

      activities.forEach(activity => {
        actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
        contextCounts[activity.context] = (contextCounts[activity.context] || 0) + 1;
      });

      // Actualizar con merge
      await setDoc(userPatternsRef, {
        userId,
        lastUpdated: Timestamp.now(),
        sessionCount: increment(0), // Se actualizará en getProfile
        actionPatterns: actionCounts,
        contextPatterns: contextCounts
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user patterns:', error);
    }
  }

  /**
   * Obtiene el perfil de aprendizaje del usuario
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Obtener actividades del usuario
      const activitiesRef = collection(db!, 'userActivities');
      const q = query(
        activitiesRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      })) as UserActivity[];

      if (activities.length === 0) {
        return this.createDefaultProfile(userId);
      }

      // Analizar patrones
      const patterns = this.analyzePatterns(activities);
      const analytics = this.calculateAnalytics(activities);
      const preferences = await this.getPreferences(userId);

      return {
        userId,
        createdAt: activities[activities.length - 1].timestamp,
        lastActive: activities[0].timestamp,
        totalSessions: this.countSessions(activities),
        preferences,
        patterns,
        analytics
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Crea un perfil por defecto
   */
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      createdAt: new Date(),
      lastActive: new Date(),
      totalSessions: 1,
      preferences: {
        theme: 'dark',
        language: 'es',
        defaultPanel: 'dashboard',
        dashboardLayout: ['ventas', 'inventario', 'bancos'],
        notifications: {
          email: true,
          push: true,
          inApp: true,
          frequency: 'realtime',
          types: ['alerts', 'reports', 'updates']
        },
        aiAssistant: {
          autoSuggestions: true,
          voiceEnabled: true,
          proactiveInsights: true,
          detailLevel: 'detailed'
        }
      },
      patterns: {
        commonActions: [],
        timePatterns: [],
        searchPatterns: [],
        navigationPatterns: []
      },
      analytics: {
        totalActions: 0,
        actionsToday: 0,
        avgSessionDuration: 0,
        mostUsedFeatures: [],
        peakActivityHours: [],
        engagementScore: 50
      }
    };
  }

  /**
   * Analiza patrones de actividad
   */
  private analyzePatterns(activities: UserActivity[]): UserPatterns {
    // Patrones de acciones comunes
    const actionFrequency: Record<string, { count: number; lastUsed: Date }> = {};
    activities.forEach(a => {
      if (!actionFrequency[a.action]) {
        actionFrequency[a.action] = { count: 0, lastUsed: a.timestamp };
      }
      actionFrequency[a.action].count++;
      if (a.timestamp > actionFrequency[a.action].lastUsed) {
        actionFrequency[a.action].lastUsed = a.timestamp;
      }
    });

    const commonActions: ActionPattern[] = Object.entries(actionFrequency)
      .map(([action, data]) => ({
        action,
        frequency: data.count,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Patrones de tiempo
    const timeActivity: Record<string, { count: number; activities: string[] }> = {};
    activities.forEach(a => {
      const hour = a.timestamp.getHours();
      const day = a.timestamp.getDay();
      const key = `${day}_${hour}`;
      
      if (!timeActivity[key]) {
        timeActivity[key] = { count: 0, activities: [] };
      }
      timeActivity[key].count++;
      if (!timeActivity[key].activities.includes(a.action)) {
        timeActivity[key].activities.push(a.action);
      }
    });

    const timePatterns: TimePattern[] = Object.entries(timeActivity)
      .map(([key, data]) => {
        const [day, hour] = key.split('_').map(Number);
        const level = data.count > 10 ? 'high' : data.count > 5 ? 'medium' : 'low';
        return {
          dayOfWeek: day,
          hour,
          activityLevel: level as 'low' | 'medium' | 'high',
          commonActivities: data.activities.slice(0, 5)
        };
      })
      .filter(p => p.activityLevel !== 'low');

    // Patrones de navegación
    const navigationFrequency: Record<string, { count: number; times: number[] }> = {};
    for (let i = 1; i < activities.length; i++) {
      const from = activities[i].context;
      const to = activities[i - 1].context;
      if (from !== to) {
        const key = `${from}|${to}`;
        if (!navigationFrequency[key]) {
          navigationFrequency[key] = { count: 0, times: [] };
        }
        navigationFrequency[key].count++;
        const timeDiff = activities[i - 1].timestamp.getTime() - activities[i].timestamp.getTime();
        navigationFrequency[key].times.push(timeDiff);
      }
    }

    const navigationPatterns: NavigationPattern[] = Object.entries(navigationFrequency)
      .map(([key, data]) => {
        const [from, to] = key.split('|');
        const avgTime = data.times.reduce((a, b) => a + b, 0) / data.times.length;
        return { from, to, frequency: data.count, avgTime };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      commonActions,
      timePatterns,
      searchPatterns: [],
      navigationPatterns
    };
  }

  /**
   * Calcula analíticas del usuario
   */
  private calculateAnalytics(activities: UserActivity[]): UserAnalytics {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Acciones de hoy
    const actionsToday = activities.filter(a => a.timestamp >= todayStart).length;

    // Features más usadas
    const featureUsage: Record<string, { count: number; lastUsed: Date }> = {};
    activities.forEach(a => {
      const feature = a.context;
      if (!featureUsage[feature]) {
        featureUsage[feature] = { count: 0, lastUsed: a.timestamp };
      }
      featureUsage[feature].count++;
      if (a.timestamp > featureUsage[feature].lastUsed) {
        featureUsage[feature].lastUsed = a.timestamp;
      }
    });

    const mostUsedFeatures: FeatureUsage[] = Object.entries(featureUsage)
      .map(([feature, data]) => ({
        feature,
        usageCount: data.count,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    // Horas pico
    const hourActivity: Record<number, number> = {};
    activities.forEach(a => {
      const hour = a.timestamp.getHours();
      hourActivity[hour] = (hourActivity[hour] || 0) + 1;
    });

    const peakActivityHours = Object.entries(hourActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => Number(hour));

    // Engagement score (0-100)
    const daysActive = this.countUniqueDays(activities);
    const avgActionsPerDay = activities.length / Math.max(daysActive, 1);
    const featureVariety = Object.keys(featureUsage).length;
    
    const engagementScore = Math.min(100, Math.round(
      (avgActionsPerDay * 2) + // Frecuencia
      (featureVariety * 5) + // Diversidad
      (actionsToday > 0 ? 20 : 0) // Actividad reciente
    ));

    return {
      totalActions: activities.length,
      actionsToday,
      avgSessionDuration: this.calculateAvgSessionDuration(activities),
      mostUsedFeatures,
      peakActivityHours,
      engagementScore
    };
  }

  /**
   * Cuenta días únicos de actividad
   */
  private countUniqueDays(activities: UserActivity[]): number {
    const uniqueDays = new Set(
      activities.map(a => a.timestamp.toISOString().split('T')[0])
    );
    return uniqueDays.size;
  }

  /**
   * Cuenta sesiones únicas
   */
  private countSessions(activities: UserActivity[]): number {
    const uniqueSessions = new Set(
      activities.map(a => a.sessionId).filter(Boolean)
    );
    return uniqueSessions.size || 1;
  }

  /**
   * Calcula duración promedio de sesión
   */
  private calculateAvgSessionDuration(activities: UserActivity[]): number {
    const sessionDurations: Record<string, { start: Date; end: Date }> = {};
    
    activities.forEach(a => {
      if (!a.sessionId) return;
      
      if (!sessionDurations[a.sessionId]) {
        sessionDurations[a.sessionId] = { start: a.timestamp, end: a.timestamp };
      } else {
        if (a.timestamp < sessionDurations[a.sessionId].start) {
          sessionDurations[a.sessionId].start = a.timestamp;
        }
        if (a.timestamp > sessionDurations[a.sessionId].end) {
          sessionDurations[a.sessionId].end = a.timestamp;
        }
      }
    });

    const durations = Object.values(sessionDurations).map(
      s => s.end.getTime() - s.start.getTime()
    );

    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000); // en segundos
  }

  /**
   * Obtiene preferencias del usuario
   */
  private async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const prefsRef = collection(db!, 'userPreferences');
      const q = query(prefsRef, where('userId', '==', userId), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as UserPreferences;
      }
    } catch (error) {
      console.error('Error getting preferences:', error);
    }

    return this.createDefaultProfile(userId).preferences;
  }

  /**
   * Actualiza preferencias del usuario
   */
  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<boolean> {
    try {
      const prefsRef = doc(db!, 'userPreferences', userId);
      await setDoc(prefsRef, {
        userId,
        ...updates,
        updatedAt: Timestamp.now()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Genera insights personalizados basados en aprendizaje
   */
  async generateLearningInsights(userId: string): Promise<LearningInsight[]> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return [];

    const insights: LearningInsight[] = [];

    // Sugerir atajos basados en acciones comunes
    if (profile.patterns.commonActions.length > 0) {
      const topAction = profile.patterns.commonActions[0];
      if (topAction.frequency > 10) {
        insights.push({
          type: 'shortcut',
          title: `Acceso Rápido a ${topAction.action}`,
          description: `Usas "${topAction.action}" frecuentemente. ¿Te gustaría agregarlo a tus accesos rápidos?`,
          confidence: 0.9,
          actionable: true,
          suggestedAction: `addQuickAccess:${topAction.action}`
        });
      }
    }

    // Recomendaciones basadas en horas de actividad
    if (profile.analytics.peakActivityHours.length > 0) {
      const peakHour = profile.analytics.peakActivityHours[0];
      insights.push({
        type: 'optimization',
        title: 'Horario Óptimo de Trabajo',
        description: `Tu mayor productividad es alrededor de las ${peakHour}:00. Considera agendar tareas importantes para este horario.`,
        confidence: 0.75,
        actionable: false
      });
    }

    // Alertas de engagement bajo
    if (profile.analytics.engagementScore < 30) {
      insights.push({
        type: 'alert',
        title: 'Explora Más Funcionalidades',
        description: 'Hay muchas funcionalidades que aún no has explorado. ¿Te gustaría un tour guiado?',
        confidence: 0.8,
        actionable: true,
        suggestedAction: 'startTour'
      });
    }

    // Recomendaciones de features no usadas
    const allFeatures = ['ventas', 'compras', 'inventario', 'bancos', 'clientes', 'reportes'];
    const usedFeatures = profile.analytics.mostUsedFeatures.map(f => f.feature);
    const unusedFeatures = allFeatures.filter(f => !usedFeatures.includes(f));

    if (unusedFeatures.length > 0) {
      insights.push({
        type: 'recommendation',
        title: `Descubre: ${unusedFeatures[0]}`,
        description: `Aún no has explorado la sección de ${unusedFeatures[0]}. Esta funcionalidad podría ayudarte a optimizar tu trabajo.`,
        confidence: 0.6,
        actionable: true,
        suggestedAction: `navigate:${unusedFeatures[0]}`
      });
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Predice siguiente acción del usuario
   */
  async predictNextAction(userId: string, currentContext: string): Promise<string | null> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;

    // Buscar patrón de navegación desde contexto actual
    const matchingPattern = profile.patterns.navigationPatterns.find(
      p => p.from === currentContext
    );

    if (matchingPattern && matchingPattern.frequency >= 3) {
      return matchingPattern.to;
    }

    // Si no hay patrón, sugerir acción más común
    if (profile.patterns.commonActions.length > 0) {
      return profile.patterns.commonActions[0].action;
    }

    return null;
  }

  /**
   * Limpia recursos al destruir
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushActivities().catch(console.error);
  }
}
