/**
 * Chronos Ultra Premium - Módulo de Reportes
 * 
 * Componentes para generación, programación y visualización de reportes
 */

// Constructor visual de reportes drag & drop
export { ReportBuilder } from './ReportBuilder'
export type { 
  ReportComponent, 
  ReportConfig, 
  ReportBuilderProps 
} from './ReportBuilder'

// Reportes programados / automatizados
export { ScheduledReports } from './ScheduledReports'
export { default as ScheduledReportsPanel } from './ScheduledReports'
