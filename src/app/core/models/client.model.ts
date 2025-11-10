import { Person } from './person.model';

/**
 * Modelo para Cliente
 * Extiende de Person y agrega propiedades específicas del cliente bancario
 */
export interface Client extends Person {
  clientId: string;
  password: string;
  status: boolean;
  accounts?: Account[];
}

/**
 * DTO para crear un nuevo cliente
 */
export interface CreateClientRequest {
  name: string;
  gender: 'M' | 'F' | 'O';
  age: number;
  identification: string;
  address: string;
  phone: string;
  password: string;
  status: boolean;
}

/**
 * DTO para actualizar un cliente
 */
export interface UpdateClientRequest {
  name?: string;
  gender?: 'M' | 'F' | 'O';
  age?: number;
  identification?: string;
  address?: string;
  phone?: string;
  password?: string; // password nueva si se cambia
  status?: boolean;
}

/**
 * DTO para respuesta de cliente (sin password en vista)
 */
export interface ClientResponse {
  clientId: number;  // ID del cliente en el backend
  name: string;
  gender: 'M' | 'F' | 'O';
  age: number;
  identification: string;
  address: string;
  phone: string;
  password?: string;  // El backend puede devolver password, pero no lo mostramos
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  accounts?: Account[];
}

// Importación circular - se define aquí para evitar problemas
export interface Account {
  id?: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING';
  initialBalance: number;
  currentBalance: number;
  status: boolean;
  clientId: number;
  createdAt?: Date;
  updatedAt?: Date;
}


