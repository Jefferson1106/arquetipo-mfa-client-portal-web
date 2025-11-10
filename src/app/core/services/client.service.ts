import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs';
import { ApiService, PaginatedResponse, PaginationParams } from './api.service';
import { 
  Client, 
  CreateClientRequest, 
  UpdateClientRequest, 
  ClientResponse 
} from '../models/client.model';
import * as CryptoJS from 'crypto-js';

/**
 * Servicio para gestión de clientes
 * Proporciona métodos para operaciones CRUD de clientes
 */
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly endpoint = '/clients';

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene todos los clientes
   * @param paginationParams - Parámetros de paginación (opcional, no usado por ahora)
   * @param filters - Filtros de búsqueda
   * @returns Observable con la respuesta
   */
  getClients(
    paginationParams?: PaginationParams, 
    filters?: any
  ): Observable<ClientResponse[]> {
    return this.apiService.get<ClientResponse[]>(this.endpoint);
  }

  /**
   * Obtiene un cliente por ID
   * @param id - ID del cliente
   * @returns Observable con el cliente
   */
  getClientById(id: number): Observable<ClientResponse> {
    return this.apiService.get<ClientResponse>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene un cliente por número de identificación
   * @param identification - Número de identificación
   * @returns Observable con el cliente
   */
  getClientByIdentification(identification: string): Observable<ClientResponse> {
    return this.apiService.get<ClientResponse>(`${this.endpoint}/identification/${identification}`);
  }

  /**
   * Busca clientes por nombre
   * @param name - Nombre a buscar
   * @param paginationParams - Parámetros de paginación
   * @returns Observable con la respuesta paginada
   */
  searchClientsByName(
    name: string, 
    paginationParams?: PaginationParams
  ): Observable<PaginatedResponse<ClientResponse>> {
    return this.apiService.getPaginated<ClientResponse>(
      `${this.endpoint}/search`,
      paginationParams,
      { name }
    );
  }

  /**
   * Crea un nuevo cliente
   * @param client - Datos del cliente a crear
   * @returns Observable con el cliente creado
   */
  createClient(client: CreateClientRequest): Observable<ClientResponse> {
    // Hash password before sending
    return from(this.hashSha256Hex(client.password)).pipe(
      switchMap((hashedPassword) => {
        const payload: CreateClientRequest = { ...client, password: hashedPassword };
        return this.apiService.post<ClientResponse>(this.endpoint, payload);
      })
    );
  }

  /**
   * Actualiza un cliente existente
   * @param id - ID del cliente
   * @param client - Datos del cliente a actualizar
   * @returns Observable con el cliente actualizado
   */
  updateClient(id: number, client: UpdateClientRequest): Observable<ClientResponse> {
    // Hash only password if provided
    const payload: UpdateClientRequest = { ...client };
    if (client.password) {
      return from(this.hashSha256Hex(client.password)).pipe(
        switchMap((hashedPassword) => {
          payload.password = hashedPassword;
          return this.apiService.put<ClientResponse>(`${this.endpoint}/${id}`, payload);
        })
      );
    }
    return this.apiService.put<ClientResponse>(`${this.endpoint}/${id}`, payload);
  }

  /**
   * Actualiza el estado de un cliente
   * @param id - ID del cliente
   * @param status - Nuevo estado
   * @returns Observable con el cliente actualizado
   */
  updateClientStatus(id: number, status: boolean): Observable<ClientResponse> {
    return this.apiService.patch<ClientResponse>(`${this.endpoint}/${id}/status`, { status });
  }

  // Eliminado: updateClientPassword - se unifica en updateClient según requerimiento

  /**
   * Elimina un cliente
   * @param id - ID del cliente
   * @returns Observable con la respuesta
   */
  deleteClient(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Verifica si un número de identificación ya existe
   * @param identification - Número de identificación
   * @param excludeId - ID del cliente a excluir (para actualizaciones)
   * @returns Observable con el resultado de la verificación
   */
  checkIdentificationExists(identification: string, excludeId?: number): Observable<boolean> {
    const params = excludeId ? { excludeId: excludeId.toString() } : {};
    return this.apiService.get<boolean>(`${this.endpoint}/check-identification/${identification}`, params);
  }

  /**
   * Verifica si un nombre de cliente ya existe
   * @param name - Nombre del cliente
   * @param excludeId - ID del cliente a excluir (para actualizaciones)
   * @returns Observable con el resultado de la verificación
   */
  checkNameExists(name: string, excludeId?: number): Observable<boolean> {
    const params = excludeId ? { excludeId: excludeId.toString() } : {};
    return this.apiService.get<boolean>(`${this.endpoint}/check-name/${name}`, params);
  }

  /**
   * Obtiene estadísticas de clientes
   * @returns Observable con las estadísticas
   */
  getClientStats(): Observable<{
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    newClientsThisMonth: number;
  }> {
    return this.apiService.get<any>(`${this.endpoint}/stats`);
  }

  /**
   * Hashes a string using SHA-256 and returns hex representation
   */
  private async hashSha256Hex(value: string): Promise<string> {
    // Usar CryptoJS que funciona sin HTTPS
    return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
  }
}


