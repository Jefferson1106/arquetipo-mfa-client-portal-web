/**
 * Modelo para Movimiento
 * Define la estructura de los movimientos bancarios
 */
export interface Movement {
  id?: number;
  date: Date;
  movementType: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  balance: number;
  accountId: number;
  account?: Account;
  description?: string;
  createdAt?: Date;
}

/**
 * Enum para tipos de movimiento
 */
export enum MovementType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL'
}

/**
 * Etiquetas para tipos de movimiento
 */
export const MovementTypeLabels: Record<MovementType, string> = {
  [MovementType.DEPOSIT]: 'Depósito',
  [MovementType.WITHDRAWAL]: 'Retiro'
};

/**
 * DTO para crear un nuevo movimiento
 */
export interface CreateMovementRequest {
  date: string;  // Fecha en formato ISO
  accountId: number;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL';  // El backend usa transactionType
  amount: number;
  description?: string;
}

/**
 * DTO para actualizar un movimiento
 */
export interface UpdateMovementRequest {
  date?: string;  // Fecha en formato ISO
  transactionType?: 'DEPOSIT' | 'WITHDRAWAL';  // El backend usa transactionType
  amount?: number;
  balance?: number;
  description?: string;
}

/**
 * DTO para respuesta de movimiento (del backend)
 */
export interface MovementResponse {
  transactionId?: number;  // ID de la transacción en el backend
  id?: number;  // Puede venir como id también
  date: Date | string;
  transactionType?: 'DEPOSIT' | 'WITHDRAWAL';  // Nombre que usa el backend
  movementType?: 'DEPOSIT' | 'WITHDRAWAL';  // Por compatibilidad
  amount: number;
  balance: number;
  accountId: number;
  account?: Account;  // El backend SÍ lo envía completo
  description?: string;
  createdAt?: Date | string;
}

// Importaciones circulares
export interface Account {
  id?: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING';
  currentBalance: number;
  client?: Client;
}

export interface Client {
  id?: number;
  name: string;
  clientId: string;
}


