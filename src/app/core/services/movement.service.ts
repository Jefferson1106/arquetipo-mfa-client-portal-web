import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, PaginationParams } from './api.service';
import { 
  Movement, 
  CreateMovementRequest, 
  UpdateMovementRequest, 
  MovementResponse
} from '../models/movement.model';

/**
 * Servicio para gestión de movimientos
 * Proporciona métodos para operaciones CRUD de movimientos bancarios
 */
@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private readonly endpoint = '/transactions';

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene todos los movimientos
   * @param paginationParams - Parámetros de paginación (opcional, no usado por ahora)
   * @param filters - Filtros de búsqueda
   * @returns Observable con la respuesta
   */
  getMovements(
    paginationParams?: PaginationParams, 
    filters?: any
  ): Observable<MovementResponse[]> {
    return this.apiService.get<MovementResponse[]>(this.endpoint);
  }

  /**
   * Obtiene un movimiento por ID
   * @param id - ID del movimiento
   * @returns Observable con el movimiento
   */
  getMovementById(id: number): Observable<MovementResponse> {
    return this.apiService.get<MovementResponse>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene todos los movimientos de una cuenta
   * @param accountId - ID de la cuenta
   * @param paginationParams - Parámetros de paginación
   * @returns Observable con la respuesta paginada
   */
  getMovementsByAccount(
    accountId: number, 
    paginationParams?: PaginationParams
  ): Observable<PaginatedResponse<MovementResponse>> {
    return this.apiService.getPaginated<MovementResponse>(
      `${this.endpoint}/account/${accountId}`,
      paginationParams
    );
  }

  /**
   * Obtiene todos los movimientos de un cliente
   * @param clientId - ID del cliente
   * @param paginationParams - Parámetros de paginación
   * @returns Observable con la respuesta paginada
   */
  getMovementsByClient(
    clientId: number, 
    paginationParams?: PaginationParams
  ): Observable<PaginatedResponse<MovementResponse>> {
    return this.apiService.getPaginated<MovementResponse>(
      `${this.endpoint}/client/${clientId}`,
      paginationParams
    );
  }

  /**
   * Obtiene movimientos por rango de fechas
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @param paginationParams - Parámetros de paginación
   * @returns Observable con la respuesta paginada
   */
  getMovementsByDateRange(
    startDate: Date, 
    endDate: Date, 
    paginationParams?: PaginationParams
  ): Observable<PaginatedResponse<MovementResponse>> {
    const filters = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    
    return this.apiService.getPaginated<MovementResponse>(
      this.endpoint,
      paginationParams,
      filters
    );
  }

  /**
   * Crea un nuevo movimiento
   * @param movement - Datos del movimiento a crear
   * @returns Observable con el movimiento creado
   */
  createMovement(movement: CreateMovementRequest): Observable<MovementResponse> {
    return this.apiService.post<MovementResponse>(this.endpoint, movement);
  }

  /**
   * Actualiza un movimiento existente
   * @param id - ID del movimiento
   * @param movement - Datos del movimiento a actualizar
   * @returns Observable con el movimiento actualizado
   */
  updateMovement(id: number, movement: UpdateMovementRequest): Observable<MovementResponse> {
    return this.apiService.put<MovementResponse>(`${this.endpoint}/${id}`, movement);
  }

  /**
   * Elimina un movimiento
   * @param id - ID del movimiento
   * @returns Observable con la respuesta
   */
  deleteMovement(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }


  /**
   * Obtiene estadísticas de movimientos
   * @returns Observable con las estadísticas
   */
  getMovementStats(): Observable<{
    totalMovements: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalDepositAmount: number;
    totalWithdrawalAmount: number;
    movementsThisMonth: number;
  }> {
    return this.apiService.get<any>(`${this.endpoint}/stats`);
  }

  /**
   * Obtiene estadísticas de movimientos por cuenta
   * @param accountId - ID de la cuenta
   * @returns Observable con las estadísticas
   */
  getMovementStatsByAccount(accountId: number): Observable<{
    totalMovements: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalDepositAmount: number;
    totalWithdrawalAmount: number;
    currentBalance: number;
  }> {
    return this.apiService.get<any>(`${this.endpoint}/stats/account/${accountId}`);
  }

  /**
   * Obtiene estadísticas de movimientos por cliente
   * @param clientId - ID del cliente
   * @returns Observable con las estadísticas
   */
  getMovementStatsByClient(clientId: number): Observable<{
    totalMovements: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalDepositAmount: number;
    totalWithdrawalAmount: number;
    accountsCount: number;
  }> {
    return this.apiService.get<any>(`${this.endpoint}/stats/client/${clientId}`);
  }
}


