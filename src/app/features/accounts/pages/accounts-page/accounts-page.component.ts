import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { TableComponent, TableColumn, TableAction } from '@shared/components/table/table.component';
import { SearchableSelectComponent, SelectOption } from '@shared/components/searchable-select/searchable-select.component';
import { AccountService } from '@core/services/account.service';
import { ClientService } from '@core/services/client.service';
import { NotificationService } from '@core/services/notification.service';
import { 
  AccountResponse, 
  CreateAccountRequest, 
  UpdateAccountRequest 
} from '@core/models/account.model';
import { ClientResponse } from '@core/models/client.model';
import { AccountType, AccountTypeLabels } from '@core/models/account.model';

/**
 * Interfaz extendida para mostrar cuentas con datos enriquecidos
 */
interface EnrichedAccount extends AccountResponse {
  clientName?: string;
}

/**
 * Componente de página de cuentas
 * Implementa la funcionalidad CRUD completa para la gestión de cuentas bancarias
 * Incluye búsqueda, creación, edición y eliminación de cuentas
 */
@Component({
  selector: 'app-accounts-page',
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
    <div class="accounts-page">
      <!-- Header de la página -->
      <div class="page-header">
        <h1 class="page-title">Cuentas</h1>
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

      <!-- Tabla de cuentas -->
      <app-table
        [data]="filteredAccounts"
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
              {{ isEditing ? 'Editar Cuenta' : 'Nueva Cuenta' }}
            </h2>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="modal-body">
            <div class="form-grid">
              <app-input
                label="Número de Cuenta (6 dígitos)"
                formControlName="accountNumber"
                [required]="true"
                [errorMessage]="getFieldError('accountNumber')">
              </app-input>
              <div *ngIf="accountForm.get('accountNumber')?.hasError('accountNumberTaken')" 
                   class="duplicate-warning">
                ⚠️ Este número de cuenta ya está registrado en el sistema. Por favor use otro número.
              </div>

              <div class="form-group">
                <label class="form-label">Tipo de Cuenta</label>
                <select formControlName="accountType" class="form-select">
                  <option value="">Seleccionar tipo</option>
                  <option *ngFor="let type of accountTypeOptions" [value]="type.value">
                    {{ type.label }}
                  </option>
                </select>
                <div *ngIf="getFieldError('accountType')" class="error-message">
                  {{ getFieldError('accountType') }}
                </div>
              </div>

              <app-input
                label="Saldo Inicial"
                type="number"
                formControlName="initialBalance"
                [required]="true"
                [errorMessage]="getFieldError('initialBalance')">
              </app-input>

              <div class="form-group">
                <label class="form-label">Estado</label>
                <select formControlName="status" class="form-select">
                  <option [ngValue]="true">Activo (Sí)</option>
                  <option [ngValue]="false">Inactivo (No)</option>
                </select>
                <div *ngIf="getFieldError('status')" class="error-message">
                  {{ getFieldError('status') }}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Cliente</label>
                <app-searchable-select
                  formControlName="clientId"
                  [options]="clientOptions"
                  placeholder="Buscar cliente...">
                </app-searchable-select>
                <div *ngIf="getFieldError('clientId')" class="error-message">
                  {{ getFieldError('clientId') }}
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <app-button 
                htmlType="button" 
                type="secondary" 
                (clicked)="closeModal()">
                Cancelar
              </app-button>
              <app-button 
                htmlType="submit" 
                type="primary"
                [disabled]="accountForm.invalid || accountForm.pending || loading">
                {{ isEditing ? 'Actualizar' : 'Crear' }}
              </app-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./accounts-page.component.scss']
})
export class AccountsPageComponent implements OnInit, OnDestroy {
  accounts: EnrichedAccount[] = [];
  filteredAccounts: EnrichedAccount[] = [];
  clients: ClientResponse[] = [];
  clientOptions: SelectOption[] = [];
  searchTerm = '';
  showModal = false;
  isEditing = false;
  loading = false;
  currentAccount: AccountResponse | null = null;
  pageSize = 10;
  totalItems = 0;

  // Configuración de la tabla
  tableColumns: TableColumn[] = [
    { key: 'accountNumber', label: 'Número de Cuenta', sortable: true },
    { key: 'accountType', label: 'Tipo', sortable: true },
    { key: 'initialBalance', label: 'Saldo Inicial', sortable: true, type: 'currency' },
    { key: 'clientName', label: 'Cliente', sortable: true },
    { key: 'status', label: 'Estado', sortable: true, type: 'boolean' }
  ];

  tableActions: TableAction[] = [
    { label: 'Editar', action: 'edit', variant: 'primary' },
    { label: 'Inactivar', action: 'delete', variant: 'danger' }
  ];

  // Opciones para el select de tipo de cuenta
  accountTypeOptions = Object.entries(AccountTypeLabels).map(([value, label]) => ({
    value,
    label
  }));

  // Formulario reactivo
  accountForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private accountService: AccountService,
    private clientService: ClientService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    // Cargar primero los clientes, luego las cuentas
    this.loadClients();
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
      accountNumber: ['', [Validators.required, Validators.pattern(/^\d{6}$/)] , [this.uniqueAccountNumberValidator()]],
      accountType: ['', Validators.required],
      initialBalance: ['', [Validators.required, Validators.min(0)]],
      clientId: ['', Validators.required],
      status: [true, Validators.required]
    });
  }

  /**
   * Carga la lista de cuentas
   */
  loadAccounts(): void {
    this.loading = true;
    this.accountService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts: AccountResponse[]) => {
          // Enriquecer cuentas con datos del cliente
          this.accounts = accounts.map(account => {
            const client = this.clients.find(c => c.clientId === account.clientId);
            return {
              ...account,
              clientName: client?.name || account.client?.name || 'N/A'
            };
          });
          this.filteredAccounts = this.accounts;
          this.totalItems = accounts.length;
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Error cargando cuentas:', error);
          this.notificationService.showError('Error', 'No se pudieron cargar las cuentas');
          this.loading = false;
        }
      });
  }

  /**
   * Carga la lista de clientes
   */
  loadClients(): void {
    this.clientService.getClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients: ClientResponse[]) => {
          this.clients = clients;
          // Filtrar solo clientes activos para el combo del modal
          const activeClients = clients.filter(client => client.status === true);
          // Convertir clientes activos a opciones para el searchable-select
          this.clientOptions = activeClients.map(client => ({
            value: client.clientId,
            label: client.name,
            secondaryLabel: `ID: ${client.identification}`
          }));
          // Ahora que tenemos los clientes, cargar las cuentas
          this.loadAccounts();
        },
        error: (error: Error) => {
          console.error('Error cargando clientes:', error);
          this.notificationService.showError('Error', 'No se pudieron cargar los clientes');
        }
      });
  }

  /**
   * Maneja el cambio en el término de búsqueda
   */
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterAccounts();
  }

  /**
   * Filtra las cuentas según el término de búsqueda
   */
  private filterAccounts(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredAccounts = this.accounts;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredAccounts = this.accounts.filter(account =>
      account.accountNumber.toLowerCase().includes(searchLower) ||
      (account.clientName && account.clientName.toLowerCase().includes(searchLower)) ||
      (account.accountType === 'SAVINGS' && 'ahorros'.includes(searchLower)) ||
      (account.accountType === 'CHECKING' && 'corriente'.includes(searchLower))
    );
  }

  /**
   * Abre el modal para crear una nueva cuenta
   */
  openCreateModal(): void {
    this.isEditing = false;
    this.currentAccount = null;
    this.accountForm.reset();
    this.accountForm.get('status')?.setValue(true);
    // Habilitar todos los campos para creación
    this.accountForm.enable();
    // Revalidar unicidad con excludeId undefined
    this.accountForm.get('accountNumber')?.updateValueAndValidity();
    this.showModal = true;
  }

  /**
   * Abre el modal para editar una cuenta
   * Solo permite cambiar el estado
   */
  openEditModal(account: AccountResponse): void {
    this.isEditing = true;
    this.currentAccount = account;
    this.accountForm.patchValue({
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      initialBalance: account.initialBalance,
      clientId: account.clientId,
      status: account.status
    });
    // Deshabilitar todos los campos excepto 'status'
    this.accountForm.get('accountNumber')?.disable();
    this.accountForm.get('accountType')?.disable();
    this.accountForm.get('initialBalance')?.disable();
    this.accountForm.get('clientId')?.disable();
    this.accountForm.get('status')?.enable();
    this.showModal = true;
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentAccount = null;
    this.accountForm.reset();
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    // Para edición, obtener el valor de status directamente ya que otros campos están deshabilitados
    if (this.isEditing && this.currentAccount) {
      this.loading = true;
      
      const updateData: UpdateAccountRequest = {
        accountNumber: this.currentAccount.accountNumber,
        accountType: this.currentAccount.accountType,
        initialBalance: this.currentAccount.initialBalance,
        status: this.accountForm.get('status')?.value === true,
        clientId: this.currentAccount.clientId
      };

      this.accountService.updateAccount(this.currentAccount.id || this.currentAccount.accountId!, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Éxito', 'Estado de cuenta actualizado correctamente');
            this.closeModal();
            this.loadAccounts();
          },
          error: (error) => {
            console.error('Error al actualizar cuenta:', error);
            this.notificationService.showError('Error', 'No se pudo actualizar el estado de la cuenta');
            this.loading = false;
          }
        });
    } else if (this.accountForm.valid) {
      // Crear nueva cuenta
      this.loading = true;
      const formData = this.accountForm.value;
      
      const createData: CreateAccountRequest = {
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        initialBalance: formData.initialBalance,
        clientId: formData.clientId,
        status: formData.status === true
      };

      this.accountService.createAccount(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Éxito', 'Cuenta creada correctamente');
            this.closeModal();
            this.loadAccounts();
          },
          error: (error) => {
            console.error('Error al crear cuenta:', error);
            let errorMessage = 'No se pudo crear la cuenta';
            
            // Verificar si el error es por número de cuenta duplicado
            if (error.message && (
              error.message.includes('ya existe') || 
              error.message.includes('duplicate') || 
              error.message.includes('already exists') ||
              error.message.includes('Conflicto')
            )) {
              errorMessage = `El número de cuenta ${formData.accountNumber} ya existe. Por favor, use otro número de cuenta.`;
            } else if (error.status === 409) {
              errorMessage = `El número de cuenta ${formData.accountNumber} ya existe. Por favor, use otro número de cuenta.`;
            }
            
            this.notificationService.showError('Error', errorMessage);
            this.loading = false;
          }
        });
    }
  }

  /**
   * Maneja las acciones de la tabla
   */
  onTableAction(event: { action: string; row: AccountResponse }): void {
    switch (event.action) {
      case 'edit':
        this.openEditModal(event.row);
        break;
      case 'delete':
        this.deleteAccount(event.row);
        break;
    }
  }

  /**
   * Elimina una cuenta
   */
  deleteAccount(account: AccountResponse): void {
    if (confirm(`¿Está seguro de que desea eliminar la cuenta ${account.accountNumber}?`)) {
      this.loading = true;
      this.accountService.deleteAccount(account.id || account.accountId!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Éxito', 'Cuenta eliminada correctamente');
            this.loadAccounts();
          },
          error: (error) => {
            this.notificationService.showError('Error', 'No se pudo eliminar la cuenta');
            this.loading = false;
          }
        });
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
    const field = this.accountForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'accountNumber') {
          return 'Debe tener exactamente 6 dígitos numéricos';
        }
        return 'Formato inválido';
      }
      if (field.errors['min']) {
        return `Valor mínimo: ${field.errors['min'].min}`;
      }
      if (field.errors['accountNumberTaken']) {
        return 'Este número de cuenta ya existe';
      }
    }
    return '';
  }

  /**
   * Validador asíncrono para verificar unicidad del número de cuenta
   */
  private uniqueAccountNumberValidator() {
    return (control: AbstractControl) => {
      const value: string = control.value;
      
      if (!value || !/^\d{6}$/.test(value)) {
        return Promise.resolve(null);
      }
      
      const excludeId = this.isEditing && this.currentAccount ? (this.currentAccount.id || this.currentAccount.accountId!) : undefined;
      
      // Validación local como fallback
      const existsLocally = this.accounts.some(acc => {
        const accId = acc.id || acc.accountId;
        const accNumber = acc.accountNumber;
        return accNumber === value && accId !== excludeId;
      });
      
      if (existsLocally) {
        return Promise.resolve({ accountNumberTaken: true });
      }
      
      return this.accountService
        .checkAccountNumberExists(value, excludeId)
        .pipe(
          ((source: any) => new Promise<ValidationErrors | null>((resolve) => {
            source.subscribe({
              next: (exists: boolean) => {
                resolve(exists ? { accountNumberTaken: true } : null);
              },
              error: () => {
                resolve(existsLocally ? { accountNumberTaken: true } : null);
              }
            });
          })) as any
        );
    };
  }
}
