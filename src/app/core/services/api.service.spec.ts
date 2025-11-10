import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '@environments/environment';

/**
 * Pruebas unitarias para el servicio API
 * Verifica el funcionamiento correcto de las operaciones HTTP
 */
describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform GET request', () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = { data: mockData, message: 'Success', success: true, timestamp: '2023-01-01' };

    service.get('/test').subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should perform POST request', () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = { data: mockData, message: 'Success', success: true, timestamp: '2023-01-01' };
    const requestData = { name: 'Test' };

    service.post('/test', requestData).subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestData);
    req.flush(mockResponse);
  });

  it('should handle HTTP errors', () => {
    service.get('/test').subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.message).toContain('Error del servidor');
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/test`);
    req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
  });
});



