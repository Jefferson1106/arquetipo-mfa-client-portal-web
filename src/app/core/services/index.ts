/**
 * Index file para exportar todos los servicios del core
 * Facilita las importaciones en otros módulos
 */
export * from './api.service';
export * from './client.service';
export * from './account.service';
export * from './movement.service';
export * from './notification.service';

// Export servicios de reporte
export { ReportService, Report, ReportFilters } from './report.service';

