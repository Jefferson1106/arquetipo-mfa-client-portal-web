/**
 * Index file para exportar todos los modelos del core
 * Facilita las importaciones en otros módulos
 */
export * from './person.model';
export type { 
  Client, 
  CreateClientRequest, 
  UpdateClientRequest, 
  ClientResponse 
} from './client.model';
export type { 
  AccountType, 
  CreateAccountRequest, 
  UpdateAccountRequest, 
  AccountResponse 
} from './account.model';
export type { 
  MovementType, 
  CreateMovementRequest, 
  UpdateMovementRequest, 
  MovementResponse 
} from './movement.model';
export { AccountTypeLabels } from './account.model';
export { MovementTypeLabels } from './movement.model';

// Las interfaces de Report ahora están en @core/services/report.service
// Para usarlas: import { Report, ReportFilters } from '@core/services/report.service';

