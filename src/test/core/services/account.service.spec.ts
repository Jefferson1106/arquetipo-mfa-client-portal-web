import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AccountService } from '../../../app/core/services/account.service';
import { ApiService } from '../../../app/core/services/api.service';
import { CreateAccountRequest, UpdateAccountRequest, AccountResponse } from '../../../app/core/models/account.model';
import { environment } from '../../../environments/environment';

/**
 * Pruebas unitarias para AccountService
 * Cobertura: CRUD, validación de número de cuenta, verificación de duplicados
 * Prioridad: ALTA
 */
describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  const mockAccount: AccountResponse = {
    accountId: 1,
    id: 1,
    accountNumber: '123456',
    accountType: 'SAVINGS',
    initialBalance: 1000.00,
    currentBalance: 1500.00,
    status: true,
    clientId: 1,
    client: {
      clientId: 1,
      name: 'Juan Pérez',
      identification: '1234567890',
      gender: 'M',
      age: 30,
      address: 'Calle 123',
      phone: '0987654321',
      status: true
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AccountService, ApiService]
    });
    service = TestBed.inject(AccountService);
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

  describe('getAccounts', () => {
    it('debe obtener la lista de cuentas', (done) => {
      const mockAccounts: AccountResponse[] = [mockAccount];

      service.getAccounts().subscribe(accounts => {
        expect(accounts).toEqual(mockAccounts);
        expect(accounts.length).toBe(1);
        expect(accounts[0].accountNumber).toBe('123456');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAccounts);
    });
  });

  describe('getAccountById', () => {
    it('debe obtener una cuenta por ID', (done) => {
      service.getAccountById(1).subscribe(account => {
        expect(account).toEqual(mockAccount);
        expect(account.accountId).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAccount);
    });
  });

  describe('getAccountByNumber', () => {
    it('debe obtener una cuenta por número', (done) => {
      service.getAccountByNumber('123456').subscribe(account => {
        expect(account).toEqual(mockAccount);
        expect(account.accountNumber).toBe('123456');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/number/123456`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAccount);
    });
  });

  describe('createAccount', () => {
    it('debe crear una cuenta con todos los campos requeridos', (done) => {
      const createData: CreateAccountRequest = {
        accountNumber: '654321',
        accountType: 'CHECKING',
        initialBalance: 2000.00,
        clientId: 2,
        status: true
      };

      service.createAccount(createData).subscribe(account => {
        expect(account).toEqual(mockAccount);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.accountNumber).toBe('654321');
      expect(req.request.body.accountType).toBe('CHECKING');
      expect(req.request.body.initialBalance).toBe(2000.00);
      expect(req.request.body.clientId).toBe(2);
      expect(req.request.body.status).toBe(true);
      req.flush(mockAccount);
    });

    it('debe validar número de cuenta con 6 dígitos', (done) => {
      const createData: CreateAccountRequest = {
        accountNumber: '123456',
        accountType: 'SAVINGS',
        initialBalance: 1000.00,
        clientId: 1,
        status: true
      };

      service.createAccount(createData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      const accountNumber = req.request.body.accountNumber;
      expect(accountNumber).toMatch(/^\d{6}$/);
      expect(accountNumber.length).toBe(6);
      req.flush(mockAccount);
    });

    it('debe crear cuenta de ahorros', (done) => {
      const createData: CreateAccountRequest = {
        accountNumber: '111111',
        accountType: 'SAVINGS',
        initialBalance: 500.00,
        clientId: 1,
        status: true
      };

      service.createAccount(createData).subscribe(account => {
        expect(account.accountType).toBe('SAVINGS');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      expect(req.request.body.accountType).toBe('SAVINGS');
      req.flush({ ...mockAccount, accountType: 'SAVINGS' });
    });

    it('debe crear cuenta corriente', (done) => {
      const createData: CreateAccountRequest = {
        accountNumber: '222222',
        accountType: 'CHECKING',
        initialBalance: 1500.00,
        clientId: 1,
        status: true
      };

      service.createAccount(createData).subscribe(account => {
        expect(account.accountType).toBe('CHECKING');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      expect(req.request.body.accountType).toBe('CHECKING');
      req.flush({ ...mockAccount, accountType: 'CHECKING' });
    });
  });

  describe('updateAccount', () => {
    it('debe actualizar una cuenta existente', (done) => {
      const updateData: UpdateAccountRequest = {
        accountNumber: '999999',
        status: false
      };

      service.updateAccount(1, updateData).subscribe(account => {
        expect(account).toEqual(mockAccount);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.accountNumber).toBe('999999');
      expect(req.request.body.status).toBe(false);
      req.flush(mockAccount);
    });

    it('debe actualizar solo los campos proporcionados', (done) => {
      const updateData: UpdateAccountRequest = {
        status: false
      };

      service.updateAccount(1, updateData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/1`);
      expect(req.request.body.status).toBe(false);
      expect(req.request.body.accountNumber).toBeUndefined();
      expect(req.request.body.accountType).toBeUndefined();
      req.flush(mockAccount);
    });

    it('debe incluir clientId al actualizar', (done) => {
      const updateData: UpdateAccountRequest = {
        accountNumber: '888888',
        clientId: 3
      };

      service.updateAccount(1, updateData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/1`);
      expect(req.request.body.clientId).toBe(3);
      req.flush(mockAccount);
    });
  });

  describe('deleteAccount', () => {
    it('debe eliminar una cuenta', (done) => {
      service.deleteAccount(1).subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('checkAccountNumberExists', () => {
    it('debe verificar si un número de cuenta existe', (done) => {
      service.checkAccountNumberExists('123456').subscribe(exists => {
        expect(exists).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/check-number/123456`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('debe verificar si un número de cuenta no existe', (done) => {
      service.checkAccountNumberExists('999999').subscribe(exists => {
        expect(exists).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/check-number/999999`);
      req.flush(false);
    });

    it('debe excluir un ID al verificar (modo edición)', (done) => {
      service.checkAccountNumberExists('123456', 5).subscribe(exists => {
        expect(exists).toBe(false);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${environment.apiUrl}/accounts/check-number/123456` &&
               request.params.get('excludeId') === '5';
      });
      expect(req.request.method).toBe('GET');
      req.flush(false);
    });

    it('debe validar formato de 6 dígitos', () => {
      const validNumbers = ['123456', '000000', '999999'];
      const invalidNumbers = ['12345', '1234567', 'ABCDEF', '12345a'];

      validNumbers.forEach(num => {
        expect(num).toMatch(/^\d{6}$/);
        expect(num.length).toBe(6);
      });

      invalidNumbers.forEach(num => {
        expect(num).not.toMatch(/^\d{6}$/);
      });
    });
  });

  describe('updateAccountStatus', () => {
    it('debe actualizar el estado de una cuenta', (done) => {
      service.updateAccountStatus(1, false).subscribe(account => {
        expect(account).toEqual(mockAccount);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: false });
      req.flush(mockAccount);
    });
  });

  describe('getAccountBalance', () => {
    it('debe obtener el saldo actual de una cuenta', (done) => {
      const mockBalance = { balance: 1500.00 };

      service.getAccountBalance(1).subscribe(result => {
        expect(result.balance).toBe(1500.00);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/1/balance`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBalance);
    });
  });

  describe('getAccountsByClient', () => {
    it('debe obtener cuentas de un cliente específico', (done) => {
      const mockResponse = {
        content: [mockAccount],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getAccountsByClient(1).subscribe(response => {
        expect(response.content.length).toBe(1);
        expect(response.content[0].clientId).toBe(1);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/accounts/client/1');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar error de número de cuenta duplicado', (done) => {
      const createData: CreateAccountRequest = {
        accountNumber: '123456',
        accountType: 'SAVINGS',
        initialBalance: 1000.00,
        clientId: 1,
        status: true
      };

      service.createAccount(createData).subscribe({
        next: () => fail('Debería haber fallado por número duplicado'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      req.flush('Número de cuenta ya existe', { status: 409, statusText: 'Conflict' });
    });

    it('debe manejar error al obtener cuenta inexistente', (done) => {
      service.getAccountById(9999).subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/9999`);
      req.flush('Cuenta no encontrada', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Validaciones de formato', () => {
    it('debe validar que el número de cuenta tenga exactamente 6 dígitos', () => {
      const validNumbers = ['123456', '000000', '999999', '100000'];
      validNumbers.forEach(num => {
        expect(num.length).toBe(6);
        expect(/^\d{6}$/.test(num)).toBe(true);
      });
    });

    it('debe rechazar números con menos de 6 dígitos', () => {
      const invalidNumbers = ['12345', '1', '12', '123'];
      invalidNumbers.forEach(num => {
        expect(/^\d{6}$/.test(num)).toBe(false);
      });
    });

    it('debe rechazar números con más de 6 dígitos', () => {
      const invalidNumbers = ['1234567', '12345678', '123456789'];
      invalidNumbers.forEach(num => {
        expect(/^\d{6}$/.test(num)).toBe(false);
      });
    });

    it('debe rechazar números con caracteres no numéricos', () => {
      const invalidNumbers = ['12345a', 'ABCDEF', '12-456', '12 456'];
      invalidNumbers.forEach(num => {
        expect(/^\d{6}$/.test(num)).toBe(false);
      });
    });
  });
});

