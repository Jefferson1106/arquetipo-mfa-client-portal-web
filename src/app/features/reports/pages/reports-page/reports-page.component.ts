import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { TableComponent, TableColumn } from '@shared/components/table/table.component';
import { SearchableSelectComponent, SelectOption } from '@shared/components/searchable-select/searchable-select.component';
import { ReportService, Report, ReportFilters, ReportPdfResponse } from '@core/services/report.service';
import { ClientService } from '@core/services/client.service';
import { NotificationService } from '@core/services/notification.service';
import { ClientResponse } from '@core/models/client.model';

// Interface para agrupar datos por cuenta
interface AccountGroup {
  accountNumber: string;
  accountType: string;
  initialBalance: number;
  movements: Report[];
  totalDeposits: number;
  totalWithdrawals: number;
  finalBalance: number;
}

/**
 * Componente de página de reportes
 * Implementa la funcionalidad de generación y descarga de reportes de movimientos
 * Incluye filtros por fecha, cliente y descarga en formato PDF
 */
@Component({
  selector: 'app-reports-page',
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
    <div class="reports-page">
      <!-- Header de la página -->
      <div class="page-header">
        <h1 class="page-title">Reportes</h1>
        <div class="page-actions">
          <app-button 
            type="primary" 
            (clicked)="generateReport()"
            [customClass]="'btn-banca-web'"
            [disabled]="reportForm.invalid || loading">
            Generar Reporte
          </app-button>
          <app-button 
            *ngIf="reportData.length > 0"
            type="secondary" 
            (clicked)="downloadPdf()"
            [customClass]="'btn-banca-web'"
            [disabled]="loading">
            Descargar PDF
          </app-button>
        </div>
      </div>

      <!-- Formulario de filtros -->
      <div class="filters-section">
        <form [formGroup]="reportForm" class="filters-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Cliente *</label>
              <app-searchable-select
                formControlName="clientId"
                [options]="clientOptions"
                placeholder="Buscar cliente...">
              </app-searchable-select>
              <div *ngIf="getFieldError('clientId')" class="error-message">
                {{ getFieldError('clientId') }}
              </div>
            </div>

            <app-input
              label="Fecha Inicio"
              type="date"
              formControlName="startDate"
              [required]="true"
              [errorMessage]="getFieldError('startDate')">
            </app-input>

            <app-input
              label="Fecha Fin"
              type="date"
              formControlName="endDate"
              [required]="true"
              [errorMessage]="getFieldError('endDate')">
            </app-input>
          </div>
        </form>
      </div>


      <!-- Tablas de reporte agrupadas por cuenta -->
      <div *ngIf="groupedAccounts.length > 0" class="accounts-report">
        <div *ngFor="let account of groupedAccounts; let i = index" class="account-section">
          <!-- Cabecera de la cuenta -->
          <div class="account-header">
            <h3>
              <span class="account-icon">💳</span>
              {{ translateAccountType(account.accountType) }} - {{ account.accountNumber }}
            </h3>
          </div>

          <!-- Totales de la cuenta -->
          <div class="account-summary">
            <div class="account-summary-grid">
              <div class="account-summary-card">
                <div class="summary-label">Saldo Inicial</div>
                <div class="summary-amount">{{ account.initialBalance | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
              <div class="account-summary-card positive-card">
                <div class="summary-label">Total Depósitos</div>
                <div class="summary-amount positive">{{ account.totalDeposits | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
              <div class="account-summary-card negative-card">
                <div class="summary-label">Total Retiros</div>
                <div class="summary-amount negative">{{ account.totalWithdrawals | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
              <div class="account-summary-card final-card">
                <div class="summary-label">Saldo Final</div>
                <div class="summary-amount final">{{ account.finalBalance | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
            </div>
          </div>

          <!-- Tabla de movimientos de esta cuenta -->
          <div class="account-table movement-table">
            <app-table
              [data]="account.movements"
              [columns]="tableColumns"
              [showPagination]="true"
              [pageSize]="pageSize"
              [title]="'Movimientos de la Cuenta'">
            </app-table>
          </div>
        </div>
      </div>

      <!-- Mensaje cuando no hay datos -->
      <div *ngIf="reportData.length === 0 && !loading" class="no-data">
        <div class="no-data-content">
          <h3>No hay datos para mostrar</h3>
          <p>Seleccione un rango de fechas y genere un reporte para ver los movimientos.</p>
        </div>
      </div>

      <!-- Loading indicator -->
      <div *ngIf="loading" class="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Generando reporte...</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./reports-page.component.scss']
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  reportData: Report[] = [];
  groupedAccounts: AccountGroup[] = [];
  clients: ClientResponse[] = [];
  clientOptions: SelectOption[] = [];
  loading = false;
  pageSize = 25;

  // Configuración de la tabla
  tableColumns: TableColumn[] = [
    { key: 'date', label: 'Fecha', sortable: true, type: 'date' },
    { key: 'client', label: 'Cliente', sortable: true },
    { key: 'accountNumber', label: 'Número Cuenta', sortable: true },
    { key: 'type', label: 'Tipo', sortable: true },
    { key: 'initialBalance', label: 'Saldo Inicial', sortable: true, type: 'currency' },
    { key: 'status', label: 'Estado', sortable: true, type: 'boolean' },
    { key: 'movementType', label: 'Tipo de Movimiento', sortable: true },
    { key: 'movement', label: 'Movimiento', sortable: true, type: 'currency' },
    { key: 'availableBalance', label: 'Saldo Disponible', sortable: true, type: 'currency' }
  ];

  // Formulario reactivo
  reportForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private clientService: ClientService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.reportForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadClients();
    this.setDefaultDateRange();
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
      clientId: ['', Validators.required],  // Ahora es obligatorio
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  /**
   * Establece el rango de fechas por defecto (mes actual)
   */
  private setDefaultDateRange(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(1); // Primer día del mes actual

    this.reportForm.patchValue({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
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
          // Convertir clientes a opciones para el searchable-select
          this.clientOptions = clients.map(client => ({
            value: client.clientId,
            label: client.name,
            secondaryLabel: `ID: ${client.identification}`
          }));
        },
        error: (error: Error) => {
          console.error('Error cargando clientes:', error);
          this.notificationService.showError('Error', 'No se pudieron cargar los clientes');
        }
      });
  }

  /**
   * Genera el reporte de movimientos
   */
  generateReport(): void {
    if (this.reportForm.valid) {
      this.loading = true;
      const formData = this.reportForm.value;

      const filters: ReportFilters = {
        clientId: parseInt(formData.clientId),  // Ahora siempre se envía
        startDate: formData.startDate,
        endDate: formData.endDate
      };

      this.reportService.generateAccountStatement(filters)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: Report[]) => {
            this.reportData = [...data];
            if (data.length > 0) {
              this.groupAccountData();
              this.notificationService.showSuccess('Éxito', `Reporte generado: ${data.length} movimientos en ${this.groupedAccounts.length} cuenta(s)`);
            } else {
              this.groupedAccounts = [];
              this.notificationService.showWarning('Sin datos', 'No se encontraron movimientos para el rango de fechas seleccionado');
            }
            this.loading = false;
          },
          error: (error: Error) => {
            console.error('Error generando reporte:', error);
            this.notificationService.showError('Error', 'No se pudo generar el reporte');
            this.reportData = [];
            this.groupedAccounts = [];
            this.loading = false;
          }
        });
    }
  }

  /**
   * Agrupa los datos del reporte por número de cuenta
   */
  private groupAccountData(): void {
    const accountMap = new Map<string, AccountGroup>();

    this.reportData.forEach(report => {
      const accountNumber = report.accountNumber;
      
      if (!accountMap.has(accountNumber)) {
        // Primera vez que vemos esta cuenta
        accountMap.set(accountNumber, {
          accountNumber: accountNumber,
          accountType: report.type,
          initialBalance: report.initialBalance,
          movements: [],
          totalDeposits: 0,
          totalWithdrawals: 0,
          finalBalance: report.initialBalance
        });
      }

      const account = accountMap.get(accountNumber)!;
      
      // Agregar el tipo de movimiento al reporte
      const reportWithType = {
        ...report,
        movementType: this.getMovementType(report.movement)
      };
      
      account.movements.push(reportWithType);

      // Calcular totales
      if (report.movement > 0) {
        account.totalDeposits += report.movement;
      } else if (report.movement < 0) {
        account.totalWithdrawals += Math.abs(report.movement);
      }

      // El saldo final es el saldo disponible del último movimiento
      account.finalBalance = report.availableBalance;
    });

    this.groupedAccounts = Array.from(accountMap.values());
  }

  /**
   * Determina el tipo de movimiento basándose en el valor
   */
  private getMovementType(movement: number): string {
    if (movement > 0) {
      return 'Depósito';
    } else if (movement < 0) {
      return 'Retiro';
    } else {
      return 'Sin movimiento';
    }
  }

  /**
   * Descarga el reporte en formato PDF
   */
  downloadPdf(): void {
    if (this.reportData.length === 0) {
      this.notificationService.showWarning('Advertencia', 'No hay datos para descargar');
      return;
    }

    this.loading = true;
    const formData = this.reportForm.value;

    const filters: ReportFilters = {
      clientId: parseInt(formData.clientId),
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    this.reportService.downloadAccountStatementPdf(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ReportPdfResponse) => {
          // Convertir Base64 a Blob
          const blob = this.base64ToBlob(response.pdfBase64, 'application/pdf');
          
          // Descargar el archivo
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `estado-cuenta-${formData.clientId}-${formData.startDate}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.loading = false;
          this.notificationService.showSuccess('Éxito', 'PDF descargado correctamente');
        },
        error: (error: Error) => {
          console.error('Error descargando PDF:', error);
          this.notificationService.showError('Error', 'No se pudo descargar el PDF');
          this.loading = false;
        }
      });
  }

  /**
   * Convierte una cadena Base64 a Blob
   */
  private base64ToBlob(base64: string, contentType: string = ''): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }


  /**
   * Calcula el saldo inicial total de todas las cuentas
   */
  getTotalInitialBalance(): number {
    return this.groupedAccounts.reduce((total, account) => total + account.initialBalance, 0);
  }

  /**
   * Calcula el total de depósitos de todas las cuentas
   */
  getTotalDeposits(): number {
    return this.groupedAccounts.reduce((total, account) => total + account.totalDeposits, 0);
  }

  /**
   * Calcula el total de retiros de todas las cuentas
   */
  getTotalWithdrawals(): number {
    return this.groupedAccounts.reduce((total, account) => total + account.totalWithdrawals, 0);
  }

  /**
   * Calcula el saldo final total de todas las cuentas
   */
  getTotalFinalBalance(): number {
    return this.groupedAccounts.reduce((total, account) => total + account.finalBalance, 0);
  }

  /**
   * Calcula el saldo neto
   */
  getNetBalance(): number {
    return this.getTotalDeposits() - this.getTotalWithdrawals();
  }

  /**
   * Traduce el tipo de cuenta del inglés al español
   */
  translateAccountType(type: string): string {
    const translations: { [key: string]: string } = {
      'CHECKING': 'CUENTA CORRIENTE',
      'SAVINGS': 'CUENTA AHORROS',
      'Checking': 'Cuenta Corriente',
      'Savings': 'Cuenta Ahorros',
      'checking': 'Cuenta Corriente',
      'savings': 'Cuenta Ahorros',
      'Corriente': 'Cuenta Corriente',
      'Ahorros': 'Cuenta Ahorros'
    };
    
    return translations[type] || type;
  }

  /**
   * Obtiene el mensaje de error para un campo del formulario
   */
  getFieldError(fieldName: string): string {
    const field = this.reportForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
    }
    return '';
  }
}
