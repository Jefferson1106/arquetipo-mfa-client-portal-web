import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { TableComponent, TableColumn, TableAction } from '@shared/components/table/table.component';
import { ClientService } from '@core/services/client.service';
import { NotificationService } from '@core/services/notification.service';
import { 
  ClientResponse, 
  CreateClientRequest, 
  UpdateClientRequest 
} from '@core/models/client.model';
import { Gender, GenderLabels } from '@core/models/person.model';
import * as CryptoJS from 'crypto-js';

/**
 * Componente de página de clientes
 * Implementa la funcionalidad CRUD completa para la gestión de clientes
 * Incluye búsqueda, creación, edición y eliminación de clientes
 */
@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    ButtonComponent, 
    InputComponent, 
    TableComponent
  ],
  template: `
    <div class="clients-page">
      <!-- Header de la página -->
      <div class="page-header">
        <h1 class="page-title">Clientes</h1>
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

      <!-- Tabla de clientes -->
      <app-table
        [data]="filteredClients"
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
              {{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}
            </h2>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="clientForm" (ngSubmit)="onSubmit()" class="modal-body">
            <div class="form-grid">
              <app-input
                label="Nombre"
                formControlName="name"
                [required]="true"
                [errorMessage]="getFieldError('name')">
              </app-input>
              <div *ngIf="clientForm.get('name')?.hasError('nameTaken')" 
                   class="duplicate-warning">
                ⚠️ Este nombre de cliente ya está registrado en el sistema. Por favor use otro nombre.
              </div>

              <app-input
                label="Identificación"
                type="tel"
                formControlName="identification"
                [required]="true"
                [maxlength]="10"
                [errorMessage]="getFieldError('identification')">
              </app-input>
              <div *ngIf="clientForm.get('identification')?.hasError('identificationTaken')" 
                   class="duplicate-warning">
                ⚠️ Esta identificación ya está registrada en el sistema. Por favor use otra identificación.
              </div>

              <div class="form-group">
                <label class="form-label">Género</label>
                <select formControlName="gender" class="form-select">
                  <option value="">Seleccionar género</option>
                  <option *ngFor="let gender of genderOptions" [value]="gender.value">
                    {{ gender.label }}
                  </option>
                </select>
                <div *ngIf="getFieldError('gender')" class="error-message">
                  {{ getFieldError('gender') }}
                </div>
              </div>

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

              <app-input
                label="Edad"
                type="number"
                formControlName="age"
                [required]="true"
                [errorMessage]="getFieldError('age')">
              </app-input>

              <app-input
                label="Dirección"
                formControlName="address"
                [required]="true"
                [errorMessage]="getFieldError('address')">
              </app-input>

              <app-input
                label="Teléfono"
                type="tel"
                formControlName="phone"
                [required]="true"
                [errorMessage]="getFieldError('phone')">
              </app-input>

              <!-- Campos de contraseña para CREAR -->
              <app-input
                *ngIf="!isEditing"
                label="Contraseña"
                type="password"
                formControlName="password"
                [required]="!isEditing"
                [errorMessage]="getFieldError('password')">
              </app-input>
              <app-input
                *ngIf="!isEditing"
                label="Repetir contraseña"
                type="password"
                formControlName="confirmPassword"
                [required]="!isEditing"
                [errorMessage]="getFieldError('confirmPassword')">
              </app-input>

              <!-- Campos de contraseña para EDITAR (opcional) -->
              <div *ngIf="isEditing" class="form-group">
                <label class="form-label">Cambio de contraseña (opcional)</label>
                <app-input
                  label="Contraseña actual"
                  type="password"
                  formControlName="currentPassword"
                  [required]="false"
                  [errorMessage]="getFieldError('currentPassword')">
                </app-input>
                <app-input
                  label="Nueva contraseña"
                  type="password"
                  formControlName="newPassword"
                  [required]="false"
                  [errorMessage]="getFieldError('newPassword')">
                </app-input>
                <app-input
                  label="Repetir nueva contraseña"
                  type="password"
                  formControlName="confirmNewPassword"
                  [required]="false"
                  [errorMessage]="getFieldError('confirmNewPassword')">
                </app-input>
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
                [customClass]="'btn-banca-web'"
                [disabled]="clientForm.invalid || clientForm.pending || loading">
                {{ isEditing ? 'Actualizar' : 'Crear' }}
              </app-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./clients-page.component.scss']
})
export class ClientsPageComponent implements OnInit, OnDestroy {
  clients: ClientResponse[] = [];
  filteredClients: ClientResponse[] = [];
  searchTerm = '';
  showModal = false;
  isEditing = false;
  loading = false;
  currentClient: ClientResponse | null = null;
  pageSize = 10;
  totalItems = 0;

  // Configuración de la tabla
  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'identification', label: 'Identificación', sortable: true },
    { key: 'gender', label: 'Género', sortable: true },
    { key: 'age', label: 'Edad', sortable: true, type: 'number' },
    { key: 'phone', label: 'Teléfono', sortable: true },
    { key: 'status', label: 'Estado', sortable: true, type: 'boolean' }
  ];

  tableActions: TableAction[] = [
    { label: 'Editar', action: 'edit', variant: 'primary' },
    { label: 'Eliminar', action: 'delete', variant: 'danger' }
  ];

  // Opciones para el select de género
  genderOptions = Object.entries(GenderLabels).map(([value, label]) => ({
    value,
    label
  }));

  // Formulario reactivo
  clientForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private clientService: ClientService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.clientForm = this.createForm();
  }
  
  /**
   * Validador de cédula ecuatoriana
   */
  private cedulaValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cedula = control.value;
      if (!cedula || !/^[0-9]{10}$/.test(cedula)) {
        return { cedulaInvalid: true };
      }
      // Algoritmo oficial
      const province = parseInt(cedula.substring(0, 2), 10);
      if (province < 1 || province > 24) return { cedulaInvalid: true };
      const thirdDigit = parseInt(cedula[2], 10);
      if (thirdDigit > 6) return { cedulaInvalid: true };
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        let digit = parseInt(cedula[i], 10);
        if (i % 2 === 0) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
      }
      const verifier = parseInt(cedula[9], 10);
      const expected = sum % 10 === 0 ? 0 : 10 - (sum % 10);
      if (verifier !== expected) return { cedulaInvalid: true };
      return null;
    };
  }

  ngOnInit(): void {
    this.loadClients();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea el formulario reactivo
   */
  private createForm(): FormGroup {
    const group = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)  // Solo letras y espacios
      ], [this.uniqueNameValidator()]],
          identification: ['', [
            Validators.required,
            Validators.pattern(/^\d{10}$/),
            this.cedulaValidator()
          ], [this.uniqueIdentificationValidator()]],
      gender: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(4)]],
      currentPassword: [''],
      newPassword: [''],
      confirmNewPassword: [''],
      status: [true, Validators.required]
    }, { validators: [this.passwordsMatchValidator()] });
    return group;
  }

  /**
   * Configura la búsqueda con debounce
   */
  private setupSearch(): void {
    // Implementar búsqueda con debounce si es necesario
  }

  /**
   * Carga la lista de clientes
   */
  loadClients(): void {
    this.loading = true;
    this.clientService.getClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients: ClientResponse[]) => {
          this.clients = clients;
          this.filteredClients = clients;
          this.totalItems = clients.length;
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Error cargando clientes:', error);
          this.notificationService.showError('Error', 'No se pudieron cargar los clientes');
          this.loading = false;
        }
      });
  }

  /**
   * Maneja el cambio en el término de búsqueda
   */
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterClients();
  }

  /**
   * Filtra los clientes según el término de búsqueda
   */
  private filterClients(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredClients = this.clients;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.identification.includes(searchLower) ||
      client.phone.includes(searchLower) ||
      client.address.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Abre el modal para crear un nuevo cliente
   */
  openCreateModal(): void {
    this.isEditing = false;
    this.currentClient = null;
    this.clientForm.reset();
    this.clientForm.get('password')?.setValidators([Validators.required, Validators.minLength(4)]);
    this.clientForm.get('confirmPassword')?.setValidators([Validators.required, Validators.minLength(4)]);
    this.clientForm.get('password')?.updateValueAndValidity();
    this.clientForm.get('confirmPassword')?.updateValueAndValidity();
    // Valor por defecto para estado al crear
    this.clientForm.get('status')?.setValue(true);
    this.showModal = true;
  }

  /**
   * Abre el modal para editar un cliente
   */
  openEditModal(client: ClientResponse): void {
    this.isEditing = true;
    this.currentClient = client;
    this.clientForm.patchValue({
      name: client.name,
      identification: client.identification,
      gender: client.gender,
      age: client.age,
      address: client.address,
      phone: client.phone,
      status: client.status
    });
    // En edición, contraseña es opcional; si el usuario escribe, validamos coincidencia y longitud
    this.clientForm.get('password')?.clearValidators();
    this.clientForm.get('confirmPassword')?.clearValidators();
    this.clientForm.get('password')?.setValue('');
    this.clientForm.get('confirmPassword')?.setValue('');
    this.clientForm.get('password')?.addValidators([Validators.minLength(4)]);
    this.clientForm.get('confirmPassword')?.addValidators([Validators.minLength(4)]);
    // Campos de cambio de contraseña
    this.clientForm.get('currentPassword')?.setValue('');
    this.clientForm.get('newPassword')?.setValue('');
    this.clientForm.get('confirmNewPassword')?.setValue('');
    this.clientForm.get('newPassword')?.addValidators([Validators.minLength(4)]);
    this.clientForm.get('confirmNewPassword')?.addValidators([Validators.minLength(4)]);
    this.clientForm.get('password')?.updateValueAndValidity();
    this.clientForm.get('confirmPassword')?.updateValueAndValidity();
    this.clientForm.get('newPassword')?.updateValueAndValidity();
    this.clientForm.get('confirmNewPassword')?.updateValueAndValidity();
    this.showModal = true;
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.currentClient = null;
    this.clientForm.reset();
  }

  /**
   * Maneja el envío del formulario
   */
  async onSubmit(): Promise<void> {
    if (this.clientForm.valid) {
      this.loading = true;
      const formData = this.clientForm.value;

      if (this.isEditing && this.currentClient) {
        const updateData: UpdateClientRequest = {
          name: formData.name,
          identification: formData.identification,
          gender: formData.gender,
          age: formData.age,
          address: formData.address,
          phone: formData.phone,
          status: formData.status === true
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        // Si el usuario quiere cambiar la contraseña, validamos localmente y enviamos en el mismo update como 'password'
        const hasPasswordChange = !!(formData.currentPassword || formData.newPassword || formData.confirmNewPassword);
        if (hasPasswordChange) {
          if (!formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmNewPassword) {
            this.notificationService.showError('Error', 'Complete y confirme correctamente la nueva contraseña');
            this.loading = false;
            return;
          }
          // Si el backend devuelve contraseña (hash), validamos localmente
          if (this.currentClient?.password) {
            try {
              const currentHash = await this.hashSha256Hex(formData.currentPassword);
              if (currentHash !== this.currentClient.password) {
                this.notificationService.showError('Error', 'La contraseña actual es incorrecta');
                this.loading = false;
                return;
              }
            } catch (e) {
              this.notificationService.showError('Error', 'No se pudo validar la contraseña actual');
              this.loading = false;
              return;
            }
          }
          updateData.password = formData.newPassword;
        }

        this.clientService.updateClient(this.currentClient.clientId, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.showSuccess('Éxito', 'Cliente actualizado correctamente');
              this.closeModal();
              this.loadClients();
            },
            error: (error) => {
              console.error('Error al actualizar cliente:', error);
              let errorMessage = 'No se pudo actualizar el cliente';
              
              // Verificar si es un error de duplicado o de negocio
              if (error.error?.message) {
                const msg = error.error.message.toLowerCase();
                if (msg.includes('nombre') && (msg.includes('ya existe') || msg.includes('duplicate') || msg.includes('already exists'))) {
                  errorMessage = `El nombre "${formData.name}" ya está registrado. Por favor use otro nombre.`;
                } else if (msg.includes('identificación') || msg.includes('identification')) {
                  if (msg.includes('ya existe') || msg.includes('duplicate') || msg.includes('already exists')) {
                    errorMessage = `La identificación "${formData.identification}" ya está registrada. Por favor use otra identificación.`;
                  }
                } else if (error.status === 409) {
                  errorMessage = 'El cliente ya existe con esos datos. Por favor use otros valores.';
                }
              }
              // No mostrar detalles técnicos como 502, 503, etc.
              
              this.notificationService.showError('Error', errorMessage);
              this.loading = false;
            }
          });
      } else {
        const createData: CreateClientRequest = {
          name: formData.name,
          identification: formData.identification,
          gender: formData.gender,
          age: formData.age,
          address: formData.address,
          phone: formData.phone,
          password: formData.password,
          status: formData.status === true
        };

        this.clientService.createClient(createData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.showSuccess('Éxito', 'Cliente creado correctamente');
              this.closeModal();
              this.loadClients();
            },
            error: (error) => {
              console.error('Error al crear cliente:', error);
              let errorMessage = 'No se pudo crear el cliente';
              
              // Verificar si es un error de duplicado o de negocio
              if (error.error?.message) {
                const msg = error.error.message.toLowerCase();
                if (msg.includes('nombre') && (msg.includes('ya existe') || msg.includes('duplicate') || msg.includes('already exists'))) {
                  errorMessage = `El nombre "${formData.name}" ya está registrado. Por favor use otro nombre.`;
                } else if (msg.includes('identificación') || msg.includes('identification')) {
                  if (msg.includes('ya existe') || msg.includes('duplicate') || msg.includes('already exists')) {
                    errorMessage = `La identificación "${formData.identification}" ya está registrada. Por favor use otra identificación.`;
                  }
                } else if (error.status === 409) {
                  errorMessage = 'El cliente ya existe con esos datos. Por favor use otros valores.';
                }
              }
              // No mostrar detalles técnicos como 502, 503, etc.
              
              this.notificationService.showError('Error', errorMessage);
              this.loading = false;
            }
          });
      }
    }
  }

  /**
   * Maneja las acciones de la tabla
   */
  onTableAction(event: { action: string; row: ClientResponse }): void {
    switch (event.action) {
      case 'edit':
        this.openEditModal(event.row);
        break;
      case 'delete':
        this.deleteClient(event.row);
        break;
    }
  }

  /**
   * Elimina un cliente
   */
  deleteClient(client: ClientResponse): void {
    if (confirm(`¿Está seguro de que desea eliminar al cliente ${client.name}?`)) {
      this.loading = true;
      this.clientService.deleteClient(client.clientId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Éxito', 'Cliente eliminado correctamente');
            this.loadClients();
          },
          error: (error) => {
            this.notificationService.showError('Error', 'No se pudo eliminar el cliente');
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
    const field = this.clientForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['pattern']) {
        // Mensajes específicos según el campo
        if (fieldName === 'name') {
          return 'El nombre solo puede contener letras y espacios';
        }
        if (fieldName === 'identification') {
          return 'La identificación debe tener exactamente 10 dígitos';
        }
        if (fieldName === 'phone') {
          return 'El teléfono debe tener exactamente 10 dígitos';
        }
        return 'Formato inválido';
      }
      if (field.errors['cedulaInvalid']) {
        return 'La cédula ingresada no es válida';
      }
      if (field.errors['min']) {
        return `Valor mínimo: ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `Valor máximo: ${field.errors['max'].max}`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
      if (field.errors['nameTaken']) {
        return 'Este nombre ya está registrado';
      }
      if (field.errors['identificationTaken']) {
        return 'Esta identificación ya está registrada';
      }
    }
    return '';
  }

  /**
   * Validador que asegura que password y confirmPassword coinciden
   */
  private passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirm = control.get('confirmPassword')?.value;

      // No validar en modo edición si no se manejan contraseñas
      if (this.isEditing) {
        return null;
      }

      if (!password && !confirm) {
        return null;
      }

      if (password !== confirm) {
        const confirmControl = control.get('confirmPassword');
        const existing = confirmControl?.errors || {};
        confirmControl?.setErrors({ ...existing, passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        const confirmControl = control.get('confirmPassword');
        if (confirmControl?.errors && confirmControl.errors['passwordMismatch']) {
          const { passwordMismatch, ...rest } = confirmControl.errors;
          confirmControl.setErrors(Object.keys(rest).length ? rest : null);
        }
        return null;
      }
    };
  }

  /**
   * Hash SHA-256 a hex (para validar contraseña actual localmente)
   */
  private async hashSha256Hex(value: string): Promise<string> {
    // Usar CryptoJS que funciona sin HTTPS
    return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
  }

  /**
   * Validador asíncrono para verificar unicidad del nombre del cliente
   */
  private uniqueNameValidator() {
    return (control: AbstractControl) => {
      const value: string = control.value;
      
      if (!value || value.trim().length < 2) {
        return Promise.resolve(null);
      }
      
      const excludeId = this.isEditing && this.currentClient ? this.currentClient.clientId : undefined;
      
      // Validación local como fallback
      const existsLocally = this.clients.some(client => {
        const clientId = client.clientId;
        const clientName = client.name.toLowerCase().trim();
        return clientName === value.toLowerCase().trim() && clientId !== excludeId;
      });
      
      if (existsLocally) {
        return Promise.resolve({ nameTaken: true });
      }
      
      return this.clientService
        .checkNameExists(value, excludeId)
        .pipe(
          ((source: any) => new Promise<ValidationErrors | null>((resolve) => {
            source.subscribe({
              next: (exists: boolean) => {
                resolve(exists ? { nameTaken: true } : null);
              },
              error: () => {
                resolve(existsLocally ? { nameTaken: true } : null);
              }
            });
          })) as any
        );
    };
  }

  /**
   * Validador asíncrono para verificar unicidad de la identificación del cliente
   */
  private uniqueIdentificationValidator() {
    return (control: AbstractControl) => {
      const value: string = control.value;
      
      if (!value || !/^\d+$/.test(value)) {
        return Promise.resolve(null);
      }
      
      const excludeId = this.isEditing && this.currentClient ? this.currentClient.clientId : undefined;
      
      // Validación local como fallback
      const existsLocally = this.clients.some(client => {
        const clientId = client.clientId;
        const clientIdentification = client.identification;
        return clientIdentification === value && clientId !== excludeId;
      });
      
      if (existsLocally) {
        return Promise.resolve({ identificationTaken: true });
      }
      
      return this.clientService
        .checkIdentificationExists(value, excludeId)
        .pipe(
          ((source: any) => new Promise<ValidationErrors | null>((resolve) => {
            source.subscribe({
              next: (exists: boolean) => {
                resolve(exists ? { identificationTaken: true } : null);
              },
              error: () => {
                resolve(existsLocally ? { identificationTaken: true } : null);
              }
            });
          })) as any
        );
    };
  }
}
