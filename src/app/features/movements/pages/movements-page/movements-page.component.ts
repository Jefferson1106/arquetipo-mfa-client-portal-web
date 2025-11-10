import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { TableComponent, TableColumn, TableAction } from '@shared/components/table/table.component';
import { SearchableSelectComponent, SelectOption } from '@shared/components/searchable-select/searchable-select.component';
import { MovementService } from '@core/services/movement.service';
import { AccountService } from '@core/services/account.service';
import { NotificationService } from '@core/services/notification.service';
import { 
  MovementResponse, 
  CreateMovementRequest, 
  UpdateMovementRequest 
} from '@core/models/movement.model';
import { AccountResponse } from '@core/models/account.model';
import { MovementType, MovementTypeLabels } from '@core/models/movement.model';

/**
 * Componente de página de movimientos
 * Implementa la funcionalidad CRUD completa para la gestión de movimientos bancarios
 * Incluye búsqueda, creación, edición y eliminación de movimientos
 */
@Component({
  selector: 'app-movements-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    ButtonComponent, 
    InputComponent, 
    TableComponent,
    SearchableSelectComponent
  ],
  template: `
    <div class="movements-page">
      <!-- Header de la página -->
      <div class="page-header">
        <h1 class="page-title">Movimientos</h1>
        <div class="page-actions">
          <app-button 
            type="primary" 
            [customClass]="'btn-banca-web'"
            (clicked)="openCreateModal()">
            Nuevo
          </app-button>
        </div>
      </div>

      <!-- Barra de búsqueda -->
      <div class="search-section">
        <app-input
          placeholder="Buscar"
          [(ngModel)]="searchTerm"
          (input)="onSearchChange($event)">
        </app-input>
      </div>

      <!-- Tabla de movimientos -->
      <app-table
        [data]="filteredMovements"
        [columns]="tableColumns"
        [actions]="tableActions"
        [showPagination]="true"
        [pageSize]="pageSize"
        (actionClick)="onTableAction($event)"
        (sortChange)="onSortChange($event)">
      </app-table>

      <!-- Modal de creación/edición -->
      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ isEditing ? 'Detalle del Movimiento' : 'Nuevo Movimiento' }}
            </h2>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="movementForm" (ngSubmit)="onSubmit()" class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Cuenta</label>
                <app-searchable-select
                  formControlName="accountId"
                  [options]="accountOptions"
                  placeholder="Buscar cuenta...">
                </app-searchable-select>
                <div *ngIf="getFieldError('accountId')" class="error-message">
                  {{ getFieldError('accountId') }}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Tipo de Movimiento</label>
                <select formControlName="movementType" class="form-select">
                  <option value="">Seleccionar tipo</option>
                  <option *ngFor="let type of movementTypeOptions" [value]="type.value">
                    {{ type.label }}
                  </option>
                </select>
                <div *ngIf="getFieldError('movementType')" class="error-message">
                  {{ getFieldError('movementType') }}
                </div>
              </div>

              <app-input
                label="Valor"
                type="number"
                formControlName="amount"
                [required]="true"
                [errorMessage]="getFieldError('amount')">
              </app-input>
            </div>

            <!-- Información de saldo actual -->
            <div *ngIf="selectedAccount" class="balance-info">
              <div class="balance-card">
                <h4>Información de la Cuenta</h4>
                <p><strong>Número:</strong> {{ selectedAccount.accountNumber }}</p>
                <p><strong>Cliente:</strong> {{ selectedAccount.client?.name || 'Sin cliente' }}</p>
                <p class="balance-current"><strong>Saldo Actual:</strong> {{ selectedAccount.currentBalance | currency:'USD':'symbol':'1.2-2' }}</p>
                <p *ngIf="movementForm.get('movementType')?.value === 'WITHDRAWAL' && movementForm.get('amount')?.value" 
                   [class.balance-warning]="!hasInsufficientBalance"
                   [class.balance-error]="hasInsufficientBalance">
                  <strong>Saldo después del retiro:</strong> 
                  {{ (selectedAccount.currentBalance - movementForm.get('amount')?.value) | currency:'USD':'symbol':'1.2-2' }}
                </p>
                <p *ngIf="hasInsufficientBalance" class="insufficient-balance-message">
                  ⚠️ Saldo insuficiente. No puede retirar más de lo que tiene disponible.
                </p>
              </div>
            </div>

            <div class="modal-footer">
              <app-button 
                htmlType="button" 
                type="secondary" 
                (clicked)="closeModal()">
                {{ isEditing ? 'Cerrar' : 'Cancelar' }}
              </app-button>
              <app-button 
                *ngIf="!isEditing"
                htmlType="submit" 
                type="primary"
                [customClass]="'btn-banca-web'"
                [disabled]="movementForm.invalid || loading || hasInsufficientBalance">
                Crear
              </app-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./movements-page.component.scss']
})
export class MovementsPageComponent implements OnInit, OnDestroy {
  movements: MovementResponse[] = [];
  filteredMovements: MovementResponse[] = [];
  accounts: AccountResponse[] = [];
  accountOptions: SelectOption[] = [];
  searchTerm = '';
  showModal = false;
  isEditing = false;
  loading = false;
  currentMovement: MovementResponse | null = null;
  selectedAccount: AccountResponse | null = null;
  pageSize = 10;
  totalItems = 0;

  // Configuración de la tabla
  tableColumns: TableColumn[] = [
    { key: 'date', label: 'Fecha', sortable: true, type: 'date' },
    { key: 'transactionType', label: 'Tipo', sortable: true },
    { key: 'amount', label: 'Valor', sortable: true, type: 'currency' },
    { key: 'balance', label: 'Saldo', sortable: true, type: 'currency' },
    { key: 'account.accountNumber', label: 'Cuenta', sortable: true },
    { key: 'account.client.name', label: 'Cliente', sortable: true }
  ];

  tableActions: TableAction[] = [
    { label: 'Ver', action: 'view', variant: 'primary' }
  ];

  // Opciones para el select de tipo de movimiento
  movementTypeOptions = Object.entries(MovementTypeLabels).map(([value, label]) => ({
    value,
    label
  }));

  // Formulario reactivo
  movementForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private movementService: MovementService,
    private accountService: AccountService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.movementForm = this.createForm();
    this.setupFormSubscriptions();
  }

  ngOnInit(): void {
    // Cargar primero las cuentas y clientes, luego los movimientos
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea el formulario reactivo
   */
  private createForm(): FormGroup {
    return this.fb.group({
      accountId: ['', Validators.required],
      movementType: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  /**
   * Configura las suscripciones del formulario
   */
  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en accountId para actualizar selectedAccount
    this.movementForm.get('accountId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(accountId => {
        this.selectedAccount = this.accounts.find(acc => 
          (acc.id === accountId || acc.accountId === accountId)
        ) || null;
        
        // Asegurar que selectedAccount tenga currentBalance inicializado
        if (this.selectedAccount) {
          if (this.selectedAccount.currentBalance === undefined || this.selectedAccount.currentBalance === null) {
            this.selectedAccount.currentBalance = this.selectedAccount.initialBalance ?? 0;
          }
        }
      });
  }

  /**
   * Carga la lista de movimientos
   */
  loadMovements(): void {
    this.loading = true;
    this.movementService.getMovements()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (movements: MovementResponse[]) => {
          this.movements = movements;
          this.filteredMovements = this.movements;
          this.totalItems = movements.length;
          this.loading = false;
          
          // Actualizar opciones de cuentas con los saldos actuales de los movimientos
          this.updateAccountOptions();
        },
        error: (error: Error) => {
          console.error('Error cargando movimientos:', error);
          this.notificationService.showError('Error', 'No se pudieron cargar los movimientos');
          this.loading = false;
        }
      });
  }

  /**
   * Carga la lista de cuentas
   */
  loadAccounts(): void {
    this.accountService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts: AccountResponse[]) => {
          this.accounts = accounts;
          this.updateAccountOptions();
          this.loadMovements();
        },
        error: (error: Error) => {
          console.error('Error cargando cuentas:', error);
          this.notificationService.showError('Error', 'No se pudieron cargar las cuentas');
        }
      });
  }

  /**
   * Maneja el cambio en el término de búsqueda
   */
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterMovements();
  }

  /**
   * Filtra los movimientos según el término de búsqueda
   */
  private filterMovements(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredMovements = this.movements;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredMovements = this.movements.filter(movement => {
      const accountNumber = movement.account?.accountNumber || '';
      const clientName = movement.account?.client?.name || '';
      const type = movement.transactionType || movement.movementType || '';
      
      return accountNumber.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        (movement.description && movement.description.toLowerCase().includes(searchLower)) ||
        (type === 'DEPOSIT' && 'depósito'.includes(searchLower)) ||
        (type === 'WITHDRAWAL' && 'retiro'.includes(searchLower));
    });
  }

  /**
   * Abre el modal para crear un nuevo movimiento
   */
  openCreateModal(): void {
    this.isEditing = false;
    this.currentMovement = null;
    this.selectedAccount = null;
    this.movementForm.reset();
    // Habilitar todos los campos para creación
    this.movementForm.enable();
    this.showModal = true;
  }

  /**
   * Abre el modal para ver un movimiento (solo lectura)
   */
  openEditModal(movement: MovementResponse): void {
    this.isEditing = true;
    this.currentMovement = movement;
    this.movementForm.patchValue({
      accountId: movement.accountId,
      movementType: movement.transactionType || movement.movementType,
      amount: Math.abs(movement.amount)  // Mostrar siempre valor positivo en el formulario
    });
    // Deshabilitar todos los campos para solo lectura
    this.movementForm.disable();
    this.showModal = true;
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentMovement = null;
    this.selectedAccount = null;
    this.movementForm.reset();
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.movementForm.valid) {
      this.loading = true;
      const formData = this.movementForm.value;

      // Validar saldo suficiente para retiros
      if (formData.movementType === 'WITHDRAWAL' && this.selectedAccount) {
        if (formData.amount > this.selectedAccount.currentBalance) {
          this.notificationService.showError('Error', 'Saldo no disponible');
          this.loading = false;
          return;
        }
      }

      if (this.isEditing && this.currentMovement) {
        // Calcular el nuevo saldo basándose en la diferencia del monto
        // El backend almacena el monto con signo (negativo para WITHDRAWAL)
        const oldAmount = this.currentMovement.amount;
        const newAmountAbs = Math.abs(formData.amount);
        const oldBalance = this.currentMovement.balance;
        
        let newBalance = oldBalance;
        
        // Si cambió el tipo de movimiento o el monto, recalcular el saldo
        const currentType = this.currentMovement.transactionType || this.currentMovement.movementType;
        const oldAmountAbs = Math.abs(oldAmount);
        
        if (currentType !== formData.movementType || oldAmountAbs !== newAmountAbs) {
          // Obtener el saldo anterior (antes de este movimiento)
          // Revertir el efecto del movimiento anterior
          const previousBalance = oldBalance - oldAmount;
          
          // Calcular el nuevo saldo con el nuevo monto y tipo (aplicando el signo)
          const newAmountSigned = formData.movementType === 'WITHDRAWAL' ? -newAmountAbs : newAmountAbs;
          newBalance = previousBalance + newAmountSigned;
        }

        // Convertir el monto a negativo si es retiro
        const amount = formData.movementType === 'WITHDRAWAL' ? -Math.abs(formData.amount) : Math.abs(formData.amount);
        
        // Mantener la fecha original del movimiento
        const originalDate = typeof this.currentMovement.date === 'string' 
          ? this.currentMovement.date 
          : new Date(this.currentMovement.date).toISOString();
        
        const updateData: UpdateMovementRequest = {
          date: originalDate,  // Usar la fecha original del movimiento
          transactionType: formData.movementType,
          amount: amount,
          balance: newBalance
        };

        this.movementService.updateMovement(this.currentMovement.id || this.currentMovement.transactionId!, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.showSuccess('Éxito', 'Movimiento actualizado correctamente');
              this.closeModal();
              this.loadMovements();
            },
            error: (error) => {
              this.notificationService.showError('Error', 'No se pudo actualizar el movimiento');
              this.loading = false;
            }
          });
      } else {
        // Convertir el monto a negativo si es retiro
        const amount = formData.movementType === 'WITHDRAWAL' ? -Math.abs(formData.amount) : Math.abs(formData.amount);
        
        const createData: CreateMovementRequest = {
          date: new Date().toISOString(),  // Fecha actual en formato ISO
          accountId: formData.accountId,
          transactionType: formData.movementType,
          amount: amount
        };

        this.movementService.createMovement(createData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.showSuccess('Éxito', 'Movimiento creado correctamente');
              this.closeModal();
              this.loadMovements();
            },
            error: (error) => {
              this.notificationService.showError('Error', 'No se pudo crear el movimiento');
              this.loading = false;
            }
          });
      }
    }
  }

  /**
   * Maneja las acciones de la tabla
   */
  onTableAction(event: { action: string; row: MovementResponse }): void {
    switch (event.action) {
      case 'view':
        this.openEditModal(event.row);
        break;
    }
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    // Implementar lógica de ordenamiento
  }

  /**
   * Obtiene el mensaje de error para un campo del formulario
   */
  getFieldError(fieldName: string): string {
    const field = this.movementForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['min']) {
        return `Valor mínimo: ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  /**
   * Verifica si hay saldo insuficiente para el retiro
   */
  get hasInsufficientBalance(): boolean {
    const movementType = this.movementForm.get('movementType')?.value;
    const amount = this.movementForm.get('amount')?.value;
    
    // Solo validar en modo creación y para retiros
    if (this.isEditing) {
      return false;
    }
    
    if (movementType === 'WITHDRAWAL' && this.selectedAccount && amount) {
      return amount > this.selectedAccount.currentBalance;
    }
    
    return false;
  }

  /**
   * Actualiza las opciones del selector de cuentas con los saldos actuales
   * Filtra solo las cuentas activas
   */
  private updateAccountOptions(): void {
    // Filtrar solo cuentas activas
    const activeAccounts = this.accounts.filter(account => account.status === true);

    this.accountOptions = activeAccounts.map(account => {
      const clientName = account.client?.name || 'Sin cliente';

      let balance: number;
      // Preferir siempre el currentBalance si está disponible
      if (account.currentBalance !== undefined && account.currentBalance !== null) {
        balance = account.currentBalance;
      } else if (this.movements.length > 0) {
        // Caso alterno: usar el último balance reportado por movimientos
        const accountId = account.id || account.accountId;
        const lastMovement = this.movements
          .filter(m => m.accountId === accountId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (lastMovement && lastMovement.balance !== undefined && lastMovement.balance !== null) {
          balance = lastMovement.balance;
          account.currentBalance = lastMovement.balance;
        } else {
          balance = account.initialBalance ?? 0;
          account.currentBalance = balance;
        }
      } else {
        // Fallback: usar saldo inicial
        balance = account.initialBalance ?? 0;
        account.currentBalance = balance;
      }

      return {
        value: account.id || account.accountId,
        label: account.accountNumber,
        secondaryLabel: `${clientName} - Saldo: $${balance.toFixed(2)}`
      };
    });
  }

  /**
   * Formatea un valor como moneda
   */
  private formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}
