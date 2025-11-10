import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, PaginationParams } from './api.service';
import { 
  Account, 
  CreateAccountRequest, 
  UpdateAccountRequest, 
  AccountResponse 
} from '../models/account.model';

/**
 * Servicio para gestión de cuentas
 * Proporciona métodos para operaciones CRUD de cuentas bancarias
 */
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly endpoint = '/accounts';

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene todas las cuentas
   * @param paginationParams - Parámetros de paginación (opcional, no usado por ahora)
   * @param filters - Filtros de búsqueda
   * @returns Observable con la respuesta
   */
  getAccounts(
    paginationParams?: PaginationParams, 
    filters?: any
  ): Observable<AccountResponse[]> {
    return this.apiService.get<AccountResponse[]>(this.endpoint);
  }

  /**
   * Obtiene una cuenta por ID
   * @param id - ID de la cuenta
   * @returns Observable con la cuenta
   */
  getAccountById(id: number): Observable<AccountResponse> {
    return this.apiService.get<AccountResponse>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene una cuenta por número de cuenta
   * @param accountNumber - Número de cuenta
   * @returns Observable con la cuenta
   */
  getAccountByNumber(accountNumber: string): Observable<AccountResponse> {
    return this.apiService.get<AccountResponse>(`${this.endpoint}/number/${accountNumber}`);
  }

  /**
   * Obtiene todas las cuentas de un cliente
   * @param clientId - ID del cliente
   * @param paginationParams - Parámetros de paginación
   * @returns Observable con la respuesta paginada
   */
  getAccountsByClient(
    clientId: number, 
    paginationParams?: PaginationParams
  ): Observable<PaginatedResponse<AccountResponse>> {
    return this.apiService.getPaginated<AccountResponse>(
      `${this.endpoint}/client/${clientId}`,
      paginationParams
    );
  }

  /**
   * Busca cuentas por número de cuenta
   * @param accountNumber - Número de cuenta a buscar
   * @param paginationParams - Parámetros de paginación
   * @returns Observable con la respuesta paginada
   */
  searchAccountsByNumber(
    accountNumber: string, 
    paginationParams?: PaginationParams
  ): Observable<PaginatedResponse<AccountResponse>> {
    return this.apiService.getPaginated<AccountResponse>(
      `${this.endpoint}/search`,
      paginationParams,
      { accountNumber }
    );
  }

  /**
   * Crea una nueva cuenta
   * @param account - Datos de la cuenta a crear
   * @returns Observable con la cuenta creada
   */
  createAccount(account: CreateAccountRequest): Observable<AccountResponse> {
    return this.apiService.post<AccountResponse>(this.endpoint, account);
  }

  /**
   * Actualiza una cuenta existente
   * @param id - ID de la cuenta
   * @param account - Datos de la cuenta a actualizar
   * @returns Observable con la cuenta actualizada
   */
  updateAccount(id: number, account: UpdateAccountRequest): Observable<AccountResponse> {
    return this.apiService.put<AccountResponse>(`${this.endpoint}/${id}`, account);
  }

  /**
   * Actualiza el estado de una cuenta
   * @param id - ID de la cuenta
   * @param status - Nuevo estado
   * @returns Observable con la cuenta actualizada
   */
  updateAccountStatus(id: number, status: boolean): Observable<AccountResponse> {
    return this.apiService.patch<AccountResponse>(`${this.endpoint}/${id}/status`, { status });
  }

  /**
   * Elimina una cuenta
   * @param id - ID de la cuenta
   * @returns Observable con la respuesta
   */
  deleteAccount(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Verifica si un número de cuenta ya existe
   * @param accountNumber - Número de cuenta
   * @param excludeId - ID de la cuenta a excluir (para actualizaciones)
   * @returns Observable con el resultado de la verificación
   */
  checkAccountNumberExists(accountNumber: string, excludeId?: number): Observable<boolean> {
    const params = excludeId ? { excludeId: excludeId.toString() } : {};
    return this.apiService.get<boolean>(`${this.endpoint}/check-number/${accountNumber}`, params);
  }

  /**
   * Obtiene el saldo actual de una cuenta
   * @param id - ID de la cuenta
   * @returns Observable con el saldo
   */
  getAccountBalance(id: number): Observable<{ balance: number }> {
    return this.apiService.get<{ balance: number }>(`${this.endpoint}/${id}/balance`);
  }

  /**
   * Obtiene estadísticas de cuentas
   * @returns Observable con las estadísticas
   */
  getAccountStats(): Observable<{
    totalAccounts: number;
    activeAccounts: number;
    inactiveAccounts: number;
    totalBalance: number;
    savingsAccounts: number;
    checkingAccounts: number;
  }> {
    return this.apiService.get<any>(`${this.endpoint}/stats`);
  }

  /**
   * Obtiene estadísticas de cuentas por cliente
   * @param clientId - ID del cliente
   * @returns Observable con las estadísticas
   */
  getAccountStatsByClient(clientId: number): Observable<{
    totalAccounts: number;
    activeAccounts: number;
    totalBalance: number;
    savingsAccounts: number;
    checkingAccounts: number;
  }> {
    return this.apiService.get<any>(`${this.endpoint}/stats/client/${clientId}`);
  }
}


