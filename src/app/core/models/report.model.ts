/**
 * Modelo para Reporte
 * Define la estructura de los reportes de estado de cuenta
 * Basado en el DTO ReportDTO del backend
 */
export interface Report {
  date: string;
  client: string;
  accountNumber: string;
  type: string;
  initialBalance: number;
  status: boolean;
  movement: number;
  availableBalance: number;
  totalDebits?: number;
  totalCredits?: number;
}

/**
 * Interfaz para filtros de reporte
 */
export interface ReportFilters {
  clientId: number;  // Obligatorio - el backend lo requiere
  startDate?: string;
  endDate?: string;
}

/**
 * Interfaz para respuesta de reporte
 */
export interface ReportResponse {
  reports: Report[];
  totalRecords: number;
  clientName?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

