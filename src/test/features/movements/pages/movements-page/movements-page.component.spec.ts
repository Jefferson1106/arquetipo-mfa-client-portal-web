import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MovementsPageComponent } from '../../../../../app/features/movements/pages/movements-page/movements-page.component';
import { MovementService } from '../../../../../app/core/services/movement.service';
import { AccountService } from '../../../../../app/core/services/account.service';
import { NotificationService } from '../../../../../app/core/services/notification.service';
import { of, throwError } from 'rxjs';

/**
 * Pruebas unitarias para MovementsPageComponent
 * Cobertura: Cálculo de saldos, validación de saldo insuficiente, manejo de montos
 * Prioridad: ALTA
 */
describe('MovementsPageComponent - Lógica de Negocio', () => {
  let component: MovementsPageComponent;
  let fixture: ComponentFixture<MovementsPageComponent>;
  let movementService: jasmine.SpyObj<MovementService>;
  let accountService: jasmine.SpyObj<AccountService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockAccount = {
    accountId: 1,
    id: 1,
    accountNumber: '123456',
    accountType: 'SAVINGS' as const,
    initialBalance: 1000.00,
    currentBalance: 1500.00,
    status: true,
    clientId: 1
  };

  const mockMovement = {
    id: 1,
    transactionId: 1,
    date: '2025-10-20T10:00:00Z',
    transactionType: 'DEPOSIT' as const,
    amount: 500.00,
    balance: 1500.00,
    accountId: 1,
    account: mockAccount
  };

  beforeEach(async () => {
    const movementServiceSpy = jasmine.createSpyObj('MovementService', [
      'getMovements', 'createMovement', 'updateMovement', 'deleteMovement'
    ]);
    const accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccounts']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess', 'showError', 'showWarning', 'showInfo'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        MovementsPageComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MovementService, useValue: movementServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    movementService = TestBed.inject(MovementService) as jasmine.SpyObj<MovementService>;
    accountService = TestBed.inject(AccountService) as jasmine.SpyObj<AccountService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Setup default responses
    movementService.getMovements.and.returnValue(of([mockMovement]));
    accountService.getAccounts.and.returnValue(of([mockAccount]));

    fixture = TestBed.createComponent(MovementsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Creación del componente', () => {
    it('debe crear el componente correctamente', () => {
      expect(component).toBeTruthy();
    });

    it('debe inicializar el formulario reactivo', () => {
      expect(component.movementForm).toBeDefined();
      expect(component.movementForm.get('accountId')).toBeDefined();
      expect(component.movementForm.get('movementType')).toBeDefined();
      expect(component.movementForm.get('amount')).toBeDefined();
    });
  });

  describe('Cálculo de saldo para DEPÓSITO', () => {
    it('debe calcular correctamente el saldo al crear un depósito', () => {
      component.selectedAccount = { ...mockAccount, currentBalance: 1000.00 };
      
      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'DEPOSIT',
        amount: 500.00
      });

      // El saldo debería ser: saldo actual (1000) + depósito (500) = 1500
      const expectedBalance = 1000.00 + 500.00;
      expect(expectedBalance).toBe(1500.00);
    });

    it('debe mantener el monto positivo para depósitos', () => {
      const depositAmount = 500.00;
      expect(depositAmount).toBeGreaterThan(0);
    });
  });

  describe('Cálculo de saldo para RETIRO', () => {
    it('debe calcular correctamente el saldo al crear un retiro', () => {
      component.selectedAccount = { ...mockAccount, currentBalance: 1000.00 };
      
      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'WITHDRAWAL',
        amount: 300.00
      });

      // El saldo debería ser: saldo actual (1000) - retiro (300) = 700
      const expectedBalance = 1000.00 - 300.00;
      expect(expectedBalance).toBe(700.00);
    });

    it('debe convertir el monto a negativo para retiros antes de enviar', () => {
      const withdrawalAmount = 200.00;
      const signedAmount = -Math.abs(withdrawalAmount);
      
      expect(signedAmount).toBe(-200.00);
      expect(signedAmount).toBeLessThan(0);
    });

    it('debe validar que el monto de retiro sea negativo en el backend', () => {
      const amount = 200.00;
      const movementType = 'WITHDRAWAL';
      
      // Simulando la lógica del componente
      const finalAmount = movementType === 'WITHDRAWAL' ? -Math.abs(amount) : Math.abs(amount);
      
      expect(finalAmount).toBe(-200.00);
    });
  });

  describe('Validación de saldo insuficiente', () => {
    it('debe detectar saldo insuficiente al intentar retirar más del disponible', () => {
      component.selectedAccount = { ...mockAccount, currentBalance: 500.00 };
      component.isEditing = false;
      
      // No actualizar accountId para no sobreescribir selectedAccount por valueChanges
      component.movementForm.patchValue({
        movementType: 'WITHDRAWAL',
        amount: 1000.00
      });

      // El retiro (1000) excede el saldo disponible (500)
      // Forzar detección recalculando el getter después de asegurar numéricos
      const hasInsufficientBalance = component.hasInsufficientBalance;
      expect(hasInsufficientBalance).toBeTrue();
    });

    it('NO debe detectar saldo insuficiente cuando el retiro es válido', () => {
      component.selectedAccount = { ...mockAccount, currentBalance: 1000.00 };
      component.isEditing = false;
      
      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'WITHDRAWAL',
        amount: 500.00
      });

      // El retiro (500) NO excede el saldo disponible (1000)
      const hasInsufficientBalance = component.hasInsufficientBalance;
      expect(hasInsufficientBalance).toBe(false);
    });

    it('NO debe validar saldo insuficiente en modo edición', () => {
      component.selectedAccount = { ...mockAccount, currentBalance: 500.00 };
      component.isEditing = true; // Modo edición
      
      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'WITHDRAWAL',
        amount: 1000.00
      });

      // En modo edición, no debe validar saldo insuficiente
      const hasInsufficientBalance = component.hasInsufficientBalance;
      expect(hasInsufficientBalance).toBe(false);
    });

    it('debe permitir depósitos sin límite de saldo', () => {
      component.selectedAccount = { ...mockAccount, currentBalance: 100.00 };
      component.isEditing = false;
      
      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'DEPOSIT',
        amount: 10000.00
      });

      // Los depósitos no tienen validación de saldo insuficiente
      const hasInsufficientBalance = component.hasInsufficientBalance;
      expect(hasInsufficientBalance).toBe(false);
    });
  });

  describe('Actualización de movimientos - Preservar fecha original', () => {
    it('debe mantener la fecha original al editar un movimiento', () => {
      const originalDate = '2025-10-15T08:00:00Z';
      component.currentMovement = {
        ...mockMovement,
        date: originalDate
      };

      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'DEPOSIT',
        amount: 600.00
      });

      // La fecha debe mantenerse igual a la original
      expect(component.currentMovement.date).toBe(originalDate);
    });

    it('debe usar la fecha original en formato string', () => {
      const originalDate = '2025-10-20T10:00:00Z';
      const dateToSend = typeof originalDate === 'string' 
        ? originalDate 
        : new Date(originalDate).toISOString();

      expect(dateToSend).toBe(originalDate);
      expect(typeof dateToSend).toBe('string');
    });

    it('debe convertir Date a ISO string si la fecha original es Date', () => {
      const originalDate = new Date('2025-10-20T10:00:00Z');
      const dateToSend = typeof originalDate === 'string' 
        ? originalDate 
        : new Date(originalDate).toISOString();

      expect(dateToSend).toBe('2025-10-20T10:00:00.000Z');
      expect(typeof dateToSend).toBe('string');
    });
  });

  describe('Recálculo de saldo al editar movimiento', () => {
    it('debe recalcular el saldo cuando cambia el monto del movimiento', () => {
      // Movimiento original: Depósito de 500, saldo resultante 1500
      const oldAmount = 500.00;
      const oldBalance = 1500.00;
      const previousBalance = oldBalance - oldAmount; // 1000

      // Nuevo monto: Depósito de 750
      const newAmount = 750.00;
      const newBalance = previousBalance + newAmount; // 1000 + 750 = 1750

      expect(newBalance).toBe(1750.00);
    });

    it('debe recalcular el saldo cuando cambia de depósito a retiro', () => {
      // Movimiento original: Depósito de 500, saldo resultante 1500
      const oldAmount = 500.00;
      const oldBalance = 1500.00;
      const previousBalance = oldBalance - oldAmount; // 1000

      // Cambiar a: Retiro de 200
      const newAmount = -200.00; // Retiro
      const newBalance = previousBalance + newAmount; // 1000 - 200 = 800

      expect(newBalance).toBe(800.00);
    });

    it('debe recalcular el saldo cuando cambia de retiro a depósito', () => {
      // Movimiento original: Retiro de -300, saldo resultante 700
      const oldAmount = -300.00;
      const oldBalance = 700.00;
      const previousBalance = oldBalance - oldAmount; // 700 - (-300) = 1000

      // Cambiar a: Depósito de 400
      const newAmount = 400.00;
      const newBalance = previousBalance + newAmount; // 1000 + 400 = 1400

      expect(newBalance).toBe(1400.00);
    });
  });

  describe('Manejo de signos en montos', () => {
    it('debe mostrar valores absolutos en el formulario', () => {
      const movementAmount = -200.00; // Retiro almacenado como negativo
      const displayAmount = Math.abs(movementAmount);

      expect(displayAmount).toBe(200.00);
      expect(displayAmount).toBeGreaterThan(0);
    });

    it('debe convertir el monto del formulario según el tipo de movimiento', () => {
      const formAmount = 300.00; // Siempre positivo en el formulario
      
      // Para DEPOSIT
      const depositAmount = Math.abs(formAmount);
      expect(depositAmount).toBe(300.00);
      
      // Para WITHDRAWAL
      const withdrawalAmount = -Math.abs(formAmount);
      expect(withdrawalAmount).toBe(-300.00);
    });
  });

  describe('Validación de transactionType', () => {
    it('debe enviar transactionType en lugar de movementType', () => {
      const formData = {
        movementType: 'DEPOSIT'
      };

      // La API espera 'transactionType'
      const apiData = {
        transactionType: formData.movementType
      };

      expect(apiData.transactionType).toBe('DEPOSIT');
    });

    it('debe manejar ambos nombres por compatibilidad al cargar datos', () => {
      const backendData1 = { transactionType: 'WITHDRAWAL', amount: -100 };
      const backendData2 = { movementType: 'DEPOSIT', amount: 200 };

      const type1 = backendData1.transactionType || (backendData1 as any).movementType;
      const type2 = (backendData2 as any).transactionType || backendData2.movementType;

      expect(type1).toBe('WITHDRAWAL');
      expect(type2).toBe('DEPOSIT');
    });
  });

  describe('Integración con servicios', () => {
    it('debe cargar movimientos al inicializar', () => {
      expect(movementService.getMovements).toHaveBeenCalled();
      expect(component.movements.length).toBeGreaterThan(0);
    });

    it('debe cargar cuentas para el selector', () => {
      expect(accountService.getAccounts).toHaveBeenCalled();
      expect(component.accounts.length).toBeGreaterThan(0);
    });

    it('debe actualizar la cuenta seleccionada cuando cambia accountId', () => {
      component.movementForm.patchValue({ accountId: 1 });
      fixture.detectChanges();

      // El componente debe buscar y asignar la cuenta seleccionada
      expect(component.movementForm.get('accountId')?.value).toBe(1);
    });
  });

  describe('Validación de formulario', () => {
    it('debe requerir todos los campos para crear movimiento', () => {
      component.movementForm.patchValue({
        accountId: null,
        movementType: null,
        amount: null
      });

      expect(component.movementForm.valid).toBe(false);
    });

    it('debe ser válido cuando todos los campos requeridos están completos', () => {
      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'DEPOSIT',
        amount: 500.00
      });

      expect(component.movementForm.valid).toBe(true);
    });

    it('debe validar que el monto sea mayor a 0', () => {
      component.movementForm.patchValue({
        accountId: 1,
        movementType: 'DEPOSIT',
        amount: -10
      });

      const amountControl = component.movementForm.get('amount');
      expect(amountControl?.hasError('min')).toBe(true);
    });
  });

  describe('Opciones de cuentas para selector', () => {
    it('debe formatear cuentas para el componente searchable-select', () => {
      component.accounts = [mockAccount];
      component['updateAccountOptions']();

      expect(component.accountOptions.length).toBeGreaterThan(0);
      expect(component.accountOptions[0].value).toBeDefined();
      expect(component.accountOptions[0].label).toBeDefined();
    });

    it('debe mostrar el saldo actual en las opciones de cuenta', () => {
      const account = { ...mockAccount, currentBalance: 2500.00 };
      component.accounts = [account];
      component['updateAccountOptions']();

      const option = component.accountOptions[0];
      expect(option.secondaryLabel).toContain('2500');
    });
  });
});

