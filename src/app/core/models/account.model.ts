/**
 * Modelo para Cuenta
 * Define la estructura de las cuentas bancarias
 */
export interface Account {
  id?: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING';
  initialBalance: number;
  currentBalance: number;
  status: boolean;
  clientId: number;
  client?: Client;
  movements?: Movement[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Enum para tipos de cuenta
 */
export enum AccountType {
  SAVINGS = 'SAVINGS',
  CHECKING = 'CHECKING'
}

/**
 * Etiquetas para tipos de cuenta
 */
export const AccountTypeLabels: Record<AccountType, string> = {
  [AccountType.SAVINGS]: 'Ahorros',
  [AccountType.CHECKING]: 'Corriente'
};

/**
 * DTO para crear una nueva cuenta
 */
export interface CreateAccountRequest {
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING';
  initialBalance: number;
  status: boolean;
  clientId: number;
}

/**
 * DTO para actualizar una cuenta
 */
export interface UpdateAccountRequest {
  accountNumber?: string;
  accountType?: 'SAVINGS' | 'CHECKING';
  initialBalance?: number;
  status?: boolean;
  clientId?: number;
}

/**
 * DTO para respuesta de cuenta (del backend)
 */
export interface AccountResponse {
  accountId?: number;  // ID en el backend
  id?: number;  // Puede venir como id también
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING';
  initialBalance: number;
  currentBalance: number;
  status: boolean;
  clientId: number;
  client?: Client;  // Puede que el backend no lo devuelva
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Importaciones circulares
export interface Client {
  id?: number;
  clientId: number;
  name: string;
  identification: string;
  gender: 'M' | 'F' | 'O';
  age: number;
  address: string;
  phone: string;
  status: boolean;
}

export interface Movement {
  id?: number;
  date: Date;
  movementType: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  balance: number;
  accountId: number;
  description?: string;
  createdAt?: Date;
}
