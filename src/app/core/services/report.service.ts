import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// Definición temporal de interfaces hasta que se resuelva el caché
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

export interface ReportFilters {
  clientId: number;  // Obligatorio - el backend lo requiere
  startDate?: string;
  endDate?: string;
}

export interface ReportPdfResponse {
  reportJson: Report[];
  pdfBase64: string;
}

/**
 * Servicio para gestión de reportes
 * Proporciona métodos para generar reportes de estado de cuenta
 */
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly endpoint = '/reports';

  constructor(private apiService: ApiService) {}

  /**
   * Genera un reporte de estado de cuenta
   * @param filters - Filtros para el reporte (clientId, startDate, endDate)
   * @returns Observable con el reporte
   */
  generateAccountStatement(filters: ReportFilters): Observable<Report[]> {
    const params: any = {
      clientId: filters.clientId.toString()  // Siempre requerido
    };
    
    if (filters.startDate) {
      params.startDate = filters.startDate;
    }
    if (filters.endDate) {
      params.endDate = filters.endDate;
    }
    
    return this.apiService.get<Report[]>(this.endpoint, params);
  }

  /**
   * Genera un reporte de estado de cuenta con fechas tipo Date
   * @param clientId - ID del cliente
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @returns Observable con el reporte
   */
  generateAccountStatementByDates(
    clientId: number,
    startDate: Date,
    endDate: Date
  ): Observable<Report[]> {
    const params = {
      clientId: clientId.toString(),
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
    
    return this.apiService.get<Report[]>(this.endpoint, params);
  }

  /**
   * Descarga el reporte de estado de cuenta en formato PDF
   * @param filters - Filtros para el reporte
   * @returns Observable con el blob del PDF
   */
  downloadAccountStatementPdf(filters: ReportFilters): Observable<ReportPdfResponse> {
    const params: any = {
      clientId: filters.clientId.toString()
    };
    
    if (filters.startDate) {
      params.startDate = filters.startDate;
    }
    if (filters.endDate) {
      params.endDate = filters.endDate;
    }
    
    // El backend devuelve { reportJson: [...], pdfBase64: "..." }
    return this.apiService.get<ReportPdfResponse>(`${this.endpoint}/pdf`, params);
  }

  /**
   * Formatea una fecha a formato YYYY-MM-DD
   * @param date - Fecha a formatear
   * @returns Fecha en formato string YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

