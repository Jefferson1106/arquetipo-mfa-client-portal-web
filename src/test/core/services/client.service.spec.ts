import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import * as CryptoJS from 'crypto-js';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClientService } from '../../../app/core/services/client.service';
import { ApiService } from '../../../app/core/services/api.service';
import { CreateClientRequest, UpdateClientRequest, ClientResponse } from '../../../app/core/models/client.model';
import { environment } from '../../../environments/environment';

/**
 * Pruebas unitarias para ClientService
 * Cobertura: CRUD, hash de contraseñas, validación de duplicados
 * Prioridad: CRÍTICA
 */
describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const mockClient: ClientResponse = {
    clientId: 1,
    name: 'Juan Pérez',
    identification: '1234567890',
    gender: 'M',
    age: 30,
    address: 'Calle 123',
    phone: '0987654321',
    password: 'hashedpassword123',
    status: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientService, ApiService]
    });
    service = TestBed.inject(ClientService);
    apiService = TestBed.inject(ApiService);
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

  describe('getClients', () => {
    it('debe obtener la lista de clientes', (done) => {
      const mockClients: ClientResponse[] = [mockClient];

      service.getClients().subscribe(clients => {
        expect(clients).toEqual(mockClients);
        expect(clients.length).toBe(1);
        expect(clients[0].name).toBe('Juan Pérez');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClients);
    });

    it('debe manejar errores al obtener clientes', (done) => {
      service.getClients().subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients`);
      req.flush('Error del servidor', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getClientById', () => {
    it('debe obtener un cliente por ID', (done) => {
      service.getClientById(1).subscribe(client => {
        expect(client).toEqual(mockClient);
        expect(client.clientId).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClient);
    });
  });

  describe('createClient', () => {
  it('debe crear un cliente con contraseña hasheada en SHA-256', fakeAsync(() => {
      const createData: CreateClientRequest = {
        name: 'María García',
        identification: '9876543210',
        gender: 'F',
        age: 25,
        address: 'Avenida 456',
        phone: '0912345678',
        password: 'password123',
        status: true
      };

  // Hash esperado calculado con la misma librería usada en el servicio
  const expectedHash = CryptoJS.SHA256('password123').toString(CryptoJS.enc.Hex);

      service.createClient(createData).subscribe(client => {
        expect(client).toEqual(mockClient);
      });

      // Permitir que se resuelvan microtareas (hash async)
      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/clients`);
      expect(req.request.method).toBe('POST');
      // Verificar que la contraseña fue hasheada
      expect(req.request.body.password).toBe(expectedHash);
      expect(req.request.body.password).not.toBe('password123');
      expect(req.request.body.name).toBe('María García');
      req.flush(mockClient);
    }));

  it('debe incluir todos los campos requeridos al crear', fakeAsync(() => {
      const createData: CreateClientRequest = {
        name: 'Carlos López',
        identification: '1111111111',
        gender: 'M',
        age: 40,
        address: 'Plaza Central 789',
        phone: '0923456789',
        password: 'mypass',
        status: false
      };

      service.createClient(createData).subscribe(() => {});

      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/clients`);
      expect(req.request.body.name).toBe('Carlos López');
      expect(req.request.body.identification).toBe('1111111111');
      expect(req.request.body.gender).toBe('M');
      expect(req.request.body.age).toBe(40);
      expect(req.request.body.address).toBe('Plaza Central 789');
      expect(req.request.body.phone).toBe('0923456789');
      expect(req.request.body.status).toBe(false);
      expect(req.request.body.password).toBeDefined();
      req.flush(mockClient);
    }));
  });

  describe('updateClient', () => {
    it('debe actualizar un cliente sin cambiar la contraseña', (done) => {
      const updateData: UpdateClientRequest = {
        name: 'Juan Actualizado',
        address: 'Nueva Dirección 999'
      };

      service.updateClient(1, updateData).subscribe(client => {
        expect(client).toEqual(mockClient);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.name).toBe('Juan Actualizado');
      expect(req.request.body.address).toBe('Nueva Dirección 999');
      expect(req.request.body.password).toBeUndefined();
      req.flush(mockClient);
    });

  it('debe actualizar un cliente con nueva contraseña hasheada', fakeAsync(() => {
      const updateData: UpdateClientRequest = {
        name: 'Juan Pérez',
        password: 'newpassword456'
      };

  // Hash esperado calculado con la misma librería usada en el servicio
  const expectedHash = CryptoJS.SHA256('newpassword456').toString(CryptoJS.enc.Hex);

      service.updateClient(1, updateData).subscribe(() => {});

      flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.password).toBe(expectedHash);
      expect(req.request.body.password).not.toBe('newpassword456');
      req.flush(mockClient);
    }));

    it('debe actualizar solo los campos proporcionados', (done) => {
      const updateData: UpdateClientRequest = {
        age: 31
      };

      service.updateClient(1, updateData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/1`);
      expect(req.request.body.age).toBe(31);
      expect(req.request.body.name).toBeUndefined();
      expect(req.request.body.address).toBeUndefined();
      req.flush(mockClient);
    });
  });

  describe('deleteClient', () => {
    it('debe eliminar un cliente', (done) => {
      service.deleteClient(1).subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('checkIdentificationExists', () => {
    it('debe verificar si una identificación existe', (done) => {
      service.checkIdentificationExists('1234567890').subscribe(exists => {
        expect(exists).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/check-identification/1234567890`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('debe verificar si una identificación no existe', (done) => {
      service.checkIdentificationExists('9999999999').subscribe(exists => {
        expect(exists).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/check-identification/9999999999`);
      req.flush(false);
    });

    it('debe excluir un ID al verificar identificación (modo edición)', (done) => {
      service.checkIdentificationExists('1234567890', 5).subscribe(exists => {
        expect(exists).toBe(false);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${environment.apiUrl}/clients/check-identification/1234567890` &&
               request.params.get('excludeId') === '5';
      });
      expect(req.request.method).toBe('GET');
      req.flush(false);
    });
  });

  describe('checkNameExists', () => {
    it('debe verificar si un nombre existe', (done) => {
      service.checkNameExists('Juan Pérez').subscribe(exists => {
        expect(exists).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/check-name/Juan Pérez`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('debe verificar si un nombre no existe', (done) => {
      service.checkNameExists('Cliente Nuevo').subscribe(exists => {
        expect(exists).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/check-name/Cliente Nuevo`);
      req.flush(false);
    });

    it('debe excluir un ID al verificar nombre (modo edición)', (done) => {
      service.checkNameExists('Juan Pérez', 3).subscribe(exists => {
        expect(exists).toBe(false);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${environment.apiUrl}/clients/check-name/Juan Pérez` &&
               request.params.get('excludeId') === '3';
      });
      req.flush(false);
    });
  });

  describe('updateClientStatus', () => {
    it('debe actualizar el estado de un cliente', (done) => {
      service.updateClientStatus(1, false).subscribe(client => {
        expect(client).toEqual(mockClient);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/clients/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: false });
      req.flush(mockClient);
    });
  });

  describe('Hash SHA-256', () => {
  it('debe generar el mismo hash para la misma contraseña', fakeAsync(() => {
      const password = 'testpassword';
      const createData1: CreateClientRequest = {
        name: 'Test',
        identification: '1111111111',
        gender: 'M',
        age: 30,
        address: 'Test',
        phone: '0999999999',
        password: password,
        status: true
      };
      const createData2: CreateClientRequest = { ...createData1 };

  service.createClient(createData1).subscribe();
  service.createClient(createData2).subscribe();

  flushMicrotasks();

      const reqs = httpMock.match(`${environment.apiUrl}/clients`);
      expect(reqs.length).toBe(2);
      // Los hashes deben ser idénticos
      expect(reqs[0].request.body.password).toBe(reqs[1].request.body.password);
      reqs[0].flush(mockClient);
      reqs[1].flush(mockClient);
    }));

  it('debe generar hashes diferentes para contraseñas diferentes', fakeAsync(() => {
      const createData1: CreateClientRequest = {
        name: 'Test',
        identification: '1111111111',
        gender: 'M',
        age: 30,
        address: 'Test',
        phone: '0999999999',
        password: 'password1',
        status: true
      };
      const createData2: CreateClientRequest = {
        ...createData1,
        password: 'password2'
      };

  service.createClient(createData1).subscribe();
  service.createClient(createData2).subscribe();

  flushMicrotasks();

      const reqs = httpMock.match(`${environment.apiUrl}/clients`);
      expect(reqs.length).toBe(2);
      // Los hashes deben ser diferentes
      expect(reqs[0].request.body.password).not.toBe(reqs[1].request.body.password);
      reqs[0].flush(mockClient);
      reqs[1].flush(mockClient);
    }));
  });
});

