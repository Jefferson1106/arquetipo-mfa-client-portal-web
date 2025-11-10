import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MovementService } from '../../../app/core/services/movement.service';
import { ApiService } from '../../../app/core/services/api.service';
import { CreateMovementRequest, UpdateMovementRequest, MovementResponse } from '../../../app/core/models/movement.model';
import { environment } from '../../../environments/environment';

/**
 * Pruebas unitarias para MovementService
 * Cobertura: CRUD, manejo de transacciones, cálculo de saldos
 * Prioridad: CRÍTICA
 */
describe('MovementService', () => {
  let service: MovementService;
  let httpMock: HttpTestingController;

  const mockMovement: MovementResponse = {
    id: 1,
    transactionId: 1,
    date: '2025-10-20T10:00:00Z',
    transactionType: 'DEPOSIT',
    amount: 500.00,
    balance: 1500.00,
    accountId: 1,
    account: {
      id: 1,
      accountNumber: '123456',
      accountType: 'SAVINGS',
      currentBalance: 1000.00
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MovementService, ApiService]
    });
    service = TestBed.inject(MovementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Creación del servicio', () => {
    it('debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getMovements', () => {
    it('debe obtener la lista de movimientos', (done) => {
      const mockMovements: MovementResponse[] = [mockMovement];

      service.getMovements().subscribe(movements => {
        expect(movements).toEqual(mockMovements);
        expect(movements.length).toBe(1);
        expect(movements[0].transactionType).toBe('DEPOSIT');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMovements);
    });
  });

  describe('getMovementById', () => {
    it('debe obtener un movimiento por ID', (done) => {
      service.getMovementById(1).subscribe(movement => {
        expect(movement).toEqual(mockMovement);
        expect(movement.id).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMovement);
    });
  });

  describe('createMovement - DEPOSIT', () => {
    it('debe crear un movimiento de depósito con monto positivo', (done) => {
      const createData: CreateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        accountId: 1,
        transactionType: 'DEPOSIT',
        amount: 500.00
      };

      service.createMovement(createData).subscribe(movement => {
        expect(movement).toEqual(mockMovement);
        expect(movement.transactionType).toBe('DEPOSIT');
        expect(movement.amount).toBe(500.00);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.transactionType).toBe('DEPOSIT');
      expect(req.request.body.amount).toBe(500.00);
      expect(req.request.body.amount).toBeGreaterThan(0);
      req.flush(mockMovement);
    });

    it('debe incluir fecha y accountId al crear depósito', (done) => {
      const createData: CreateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        accountId: 1,
        transactionType: 'DEPOSIT',
        amount: 1000.00
      };

      service.createMovement(createData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(req.request.body.date).toBeDefined();
      expect(req.request.body.accountId).toBe(1);
      req.flush(mockMovement);
    });
  });

  describe('createMovement - WITHDRAWAL', () => {
    it('debe crear un movimiento de retiro con monto negativo', (done) => {
      const withdrawalMovement: MovementResponse = {
        ...mockMovement,
        transactionType: 'WITHDRAWAL',
        amount: -200.00,
        balance: 800.00
      };

      const createData: CreateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        accountId: 1,
        transactionType: 'WITHDRAWAL',
        amount: -200.00
      };

      service.createMovement(createData).subscribe(movement => {
        expect(movement.transactionType).toBe('WITHDRAWAL');
        expect(movement.amount).toBe(-200.00);
        expect(movement.amount).toBeLessThan(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.transactionType).toBe('WITHDRAWAL');
      expect(req.request.body.amount).toBe(-200.00);
      req.flush(withdrawalMovement);
    });
  });

  describe('updateMovement', () => {
    it('debe actualizar un movimiento existente', (done) => {
      const updateData: UpdateMovementRequest = {
        date: '2025-10-20T12:00:00Z',
        transactionType: 'DEPOSIT',
        amount: 750.00,
        balance: 1750.00
      };

      const updatedMovement: MovementResponse = {
        ...mockMovement,
        amount: 750.00,
        balance: 1750.00
      };

      service.updateMovement(1, updateData).subscribe(movement => {
        expect(movement.amount).toBe(750.00);
        expect(movement.balance).toBe(1750.00);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.amount).toBe(750.00);
      expect(req.request.body.balance).toBe(1750.00);
      req.flush(updatedMovement);
    });

    it('debe mantener la fecha original al actualizar', (done) => {
      const originalDate = '2025-10-15T08:00:00Z';
      const updateData: UpdateMovementRequest = {
        date: originalDate,
        transactionType: 'DEPOSIT',
        amount: 600.00,
        balance: 1600.00
      };

      service.updateMovement(1, updateData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
      expect(req.request.body.date).toBe(originalDate);
      req.flush(mockMovement);
    });

    it('debe actualizar el saldo correctamente al cambiar monto', (done) => {
      const updateData: UpdateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        transactionType: 'DEPOSIT',
        amount: 1000.00,
        balance: 2000.00
      };

      service.updateMovement(1, updateData).subscribe(movement => {
        expect(movement.balance).toBe(2000.00);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
      req.flush({ ...mockMovement, amount: 1000.00, balance: 2000.00 });
    });
  });

  describe('deleteMovement', () => {
    it('debe eliminar un movimiento', (done) => {
      service.deleteMovement(1).subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getMovementsByAccount', () => {
    it('debe obtener movimientos de una cuenta específica', (done) => {
      const mockResponse = {
        content: [mockMovement],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getMovementsByAccount(1).subscribe(response => {
        expect(response.content.length).toBe(1);
        expect(response.content[0].accountId).toBe(1);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/transactions/account/1');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getMovementsByClient', () => {
    it('debe obtener movimientos de un cliente específico', (done) => {
      const mockResponse = {
        content: [mockMovement],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getMovementsByClient(1).subscribe(response => {
        expect(response.content.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/transactions/client/1');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getMovementsByDateRange', () => {
    it('debe obtener movimientos por rango de fechas', (done) => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');
      const mockResponse = {
        content: [mockMovement],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getMovementsByDateRange(startDate, endDate).subscribe(response => {
        expect(response.content.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/transactions') &&
               request.params.has('startDate') &&
               request.params.has('endDate');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Manejo de transacciones financieras', () => {
  it('debe manejar múltiples depósitos consecutivos', (done) => {
      const deposit1: CreateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        accountId: 1,
        transactionType: 'DEPOSIT',
        amount: 100.00
      };
      const deposit2: CreateMovementRequest = {
        date: '2025-10-20T11:00:00Z',
        accountId: 1,
        transactionType: 'DEPOSIT',
        amount: 200.00
      };

      service.createMovement(deposit1).subscribe();
      service.createMovement(deposit2).subscribe(() => {
        done();
      });

      const reqs = httpMock.match(`${environment.apiUrl}/transactions`);
      expect(reqs.length).toBe(2);
      // Responder a ambas peticiones
      reqs[0].flush({ ...mockMovement, amount: 100.00, balance: 1100.00 });
      reqs[1].flush({ ...mockMovement, amount: 200.00, balance: 1300.00 });
    });

    it('debe validar que los retiros tengan monto negativo', (done) => {
      const withdrawal: CreateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        accountId: 1,
        transactionType: 'WITHDRAWAL',
        amount: -150.00
      };

      service.createMovement(withdrawal).subscribe(movement => {
        expect(movement.amount).toBeLessThan(0);
        expect(movement.transactionType).toBe('WITHDRAWAL');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      req.flush({ ...mockMovement, transactionType: 'WITHDRAWAL', amount: -150.00, balance: 850.00 });
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar error de saldo insuficiente', (done) => {
      const withdrawal: CreateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        accountId: 1,
        transactionType: 'WITHDRAWAL',
        amount: -5000.00
      };

      service.createMovement(withdrawal).subscribe({
        next: () => fail('Debería haber fallado por saldo insuficiente'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      req.flush('Saldo insuficiente', { status: 400, statusText: 'Bad Request' });
    });

    it('debe manejar error al actualizar movimiento inexistente', (done) => {
      const updateData: UpdateMovementRequest = {
        date: '2025-10-20T10:00:00Z',
        transactionType: 'DEPOSIT',
        amount: 500.00,
        balance: 1500.00
      };

      service.updateMovement(9999, updateData).subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/9999`);
      req.flush('Movimiento no encontrado', { status: 404, statusText: 'Not Found' });
    });
  });
});

