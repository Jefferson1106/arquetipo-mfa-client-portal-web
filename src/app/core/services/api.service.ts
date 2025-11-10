import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@environments/environment';

/**
 * Interfaz para respuestas de la API
 */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

/**
 * Interfaz para parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Interfaz para respuestas paginadas
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Servicio base para comunicación con la API
 * Proporciona métodos comunes para operaciones CRUD y manejo de errores
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Realiza una petición GET
   * @param endpoint - Endpoint de la API
   * @param params - Parámetros de consulta
   * @returns Observable con la respuesta
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    return this.http.get<any>(fullUrl, { params: httpParams })
      .pipe(
        map((resp: any) => this.unwrapResponse<T>(resp)),
        catchError(this.handleError)
      );
  }

  /**
   * Realiza una petición GET paginada
   * @param endpoint - Endpoint de la API
   * @param paginationParams - Parámetros de paginación
   * @param filters - Filtros adicionales
   * @returns Observable con la respuesta paginada
   */
  getPaginated<T>(endpoint: string, paginationParams?: PaginationParams, filters?: any): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    
    // Agregar parámetros de paginación
    if (paginationParams) {
      if (paginationParams.page !== undefined) {
        httpParams = httpParams.set('page', paginationParams.page.toString());
      }
      if (paginationParams.size !== undefined) {
        httpParams = httpParams.set('size', paginationParams.size.toString());
      }
      if (paginationParams.sort) {
        httpParams = httpParams.set('sort', paginationParams.sort);
      }
      if (paginationParams.direction) {
        httpParams = httpParams.set('direction', paginationParams.direction);
      }
    }
    
    // Agregar filtros
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          httpParams = httpParams.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Realiza una petición POST
   * @param endpoint - Endpoint de la API
   * @param data - Datos a enviar
   * @returns Observable con la respuesta
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<any>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map((resp: any) => this.unwrapResponse<T>(resp)),
        catchError(this.handleError)
      );
  }

  /**
   * Realiza una petición PUT
   * @param endpoint - Endpoint de la API
   * @param data - Datos a enviar
   * @returns Observable con la respuesta
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<any>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map((resp: any) => this.unwrapResponse<T>(resp)),
        catchError(this.handleError)
      );
  }

  /**
   * Realiza una petición PATCH
   * @param endpoint - Endpoint de la API
   * @param data - Datos a enviar
   * @returns Observable con la respuesta
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<any>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map((resp: any) => this.unwrapResponse<T>(resp)),
        catchError(this.handleError)
      );
  }

  /**
   * Realiza una petición DELETE
   * @param endpoint - Endpoint de la API
   * @returns Observable con la respuesta
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Descarga un archivo
   * @param endpoint - Endpoint de la API
   * @param params - Parámetros de consulta
   * @returns Observable con el blob del archivo
   */
  downloadFile(endpoint: string, params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    return this.http.get(fullUrl, { 
      params: httpParams,
      responseType: 'blob' 
    })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Maneja errores de la API
   * @param error - Error HTTP
   * @returns Observable con error manejado
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      console.error('❌ Error HTTP:', error.status, error.statusText);
      console.error('🔗 URL:', error.url);
      console.error('📄 Detalles:', error.error);
      
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud incorrecta. Verifique los datos enviados.';
          break;
        case 401:
          errorMessage = 'No autorizado. Inicie sesión nuevamente.';
          break;
        case 403:
          errorMessage = 'Acceso denegado. No tiene permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado. Verifique que el endpoint exista en el backend.';
          break;
        case 409:
          errorMessage = 'Conflicto. El recurso ya existe o está en uso.';
          break;
        case 422:
          errorMessage = 'Datos de validación incorrectos.';
          break;
        case 500:
          errorMessage = 'Error del servidor';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.statusText}`;
      }
    }
    
    console.error('API Error:', error);
    // Reemitir un objeto de error que preserve el status esperado por las pruebas y un mensaje legible
    return throwError(() => ({ status: error.status, message: errorMessage, error } as any));
  }

  /**
   * Desempaqueta una respuesta que puede venir como ApiResponse<T> o como T directo
   */
  private unwrapResponse<T>(resp: any): T {
    if (resp && typeof resp === 'object' && 'data' in resp && 'success' in resp) {
      return (resp as ApiResponse<T>).data;
    }
    return resp as T;
  }
}


