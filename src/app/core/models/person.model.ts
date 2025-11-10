/**
 * Modelo base para Persona
 * Define la estructura común para todas las entidades que representan personas
 */
export interface Person {
  id?: number;
  name: string;
  gender: 'M' | 'F' | 'O'; // Masculino, Femenino, Otro
  age: number;
  identification: string;
  address: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Enum para géneros
 */
export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
  OTHER = 'O'
}

/**
 * Etiquetas para géneros
 */
export const GenderLabels: Record<Gender, string> = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Femenino',
  [Gender.OTHER]: 'Otro'
};



