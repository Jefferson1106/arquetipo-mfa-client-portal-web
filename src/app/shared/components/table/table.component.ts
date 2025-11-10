import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interfaz para definir las columnas de la tabla
 */
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean';
}

/**
 * Interfaz para definir las acciones de la tabla
 */
export interface TableAction {
  label: string;
  icon?: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: (row: any) => boolean;
}

/**
 * Componente de tabla reutilizable
 * Proporciona funcionalidad de ordenamiento, paginación y acciones
 */
@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <!-- Header de la tabla -->
      <div *ngIf="title" class="table-header">
        <h3 class="table-title">{{ title }}</h3>
        <div class="table-actions">
          <ng-content select="[slot=header-actions]"></ng-content>
        </div>
      </div>

      <!-- Contenido de la tabla -->
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th 
                *ngFor="let column of columns" 
                [style.width]="column.width"
                [class.sortable]="column.sortable"
                (click)="onSort(column.key)"
                [class.sorted]="sortColumn === column.key">
                <div class="th-content">
                  <span>{{ column.label }}</span>
                  <span *ngIf="column.sortable" class="sort-icon">
                    <span *ngIf="sortColumn !== column.key">↕</span>
                    <span *ngIf="sortColumn === column.key && sortDirection === 'asc'">↑</span>
                    <span *ngIf="sortColumn === column.key && sortDirection === 'desc'">↓</span>
                  </span>
                </div>
              </th>
              <th *ngIf="actions.length > 0" class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of paginatedData; trackBy: trackByFn" class="table-row">
              <td *ngFor="let column of columns" [class]="getCellClass(column)">
                <ng-container [ngSwitch]="column.type">
                  <span *ngSwitchCase="'currency'">{{ formatCurrency(getCellValue(row, column.key)) }}</span>
                  <span *ngSwitchCase="'date'">{{ formatDate(getCellValue(row, column.key)) }}</span>
                  <span *ngSwitchCase="'boolean'">{{ getCellValue(row, column.key) ? 'Sí' : 'No' }}</span>
                  <span *ngSwitchDefault>{{ getCellValue(row, column.key) }}</span>
                </ng-container>
              </td>
              <td *ngIf="actions.length > 0" class="actions-cell">
                <div class="action-buttons">
                  <button
                    *ngFor="let action of actions"
                    [class]="getActionClass(action)"
                    [disabled]="action.disabled && action.disabled(row)"
                    (click)="onAction(action.action, row)">
                    <span *ngIf="action.icon" class="action-icon">{{ action.icon }}</span>
                    {{ action.label }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div *ngIf="showPagination && totalPages > 1" class="pagination">
        <button 
          class="pagination-btn"
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)">
          Anterior
        </button>
        
        <div class="pagination-info">
          Página {{ currentPage }} de {{ totalPages }}
        </div>
        
        <button 
          class="pagination-btn"
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)">
          Siguiente
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() title = '';
  @Input() pageSize = 10;
  @Input() showPagination = true;

  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();

  currentPage = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Obtiene los datos ordenados y paginados
   */
  get paginatedData(): any[] {
    if (!this.data || this.data.length === 0) {
      return [];
    }
    
    // Ordenar datos si hay una columna seleccionada
    let sortedData = [...this.data];
    
    if (this.sortColumn) {
      sortedData = sortedData.sort((a, b) => {
        const aValue = this.getCellValue(a, this.sortColumn);
        const bValue = this.getCellValue(b, this.sortColumn);
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    // Si no hay paginación, devolver todos los datos ordenados
    if (!this.showPagination) {
      return sortedData;
    }
    
    // Aplicar paginación
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return sortedData.slice(startIndex, endIndex);
  }

  /**
   * Calcula el total de páginas
   */
  get totalPages(): number {
    if (!this.data || this.data.length === 0) {
      return 0;
    }
    return Math.ceil(this.data.length / this.pageSize);
  }

  /**
   * Maneja el ordenamiento de columnas
   */
  onSort(column: string): void {
    // Solo ordenar si la columna es sortable
    const col = this.columns.find(c => c.key === column);
    if (!col || !col.sortable) {
      return;
    }
    
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Volver a la primera página cuando se ordena
    this.currentPage = 1;
    
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  /**
   * Maneja las acciones de la tabla
   */
  onAction(action: string, row: any): void {
    this.actionClick.emit({ action, row });
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Obtiene las clases CSS de una celda
   */
  getCellClass(column: TableColumn): string {
    return `cell-${column.type || 'text'}`;
  }

  /**
   * Obtiene las clases CSS de un botón de acción
   */
  getActionClass(action: TableAction): string {
    const classes = ['action-btn'];
    classes.push(`action-btn-${action.variant || 'secondary'}`);
    return classes.join(' ');
  }

  /**
   * Obtiene el valor de una celda (soporta propiedades anidadas)
   */
  getCellValue(row: any, key: string): any {
    if (!key) return '';
    
    // Soportar propiedades anidadas como 'account.client.name'
    const keys = key.split('.');
    let value = row;
    
    for (const k of keys) {
      if (value && value.hasOwnProperty(k)) {
        value = value[k];
      } else {
        return '';
      }
    }
    
    // Traducir tipos de movimiento
    if (key === 'movementType' || key === 'transactionType') {
      if (value === 'DEPOSIT') return 'Depósito';
      if (value === 'WITHDRAWAL') return 'Retiro';
      return value; // Retornar el valor original si no coincide
    }
    
    // Traducir tipos de cuenta
    if (key === 'accountType' || key === 'type') {
      if (value === 'SAVINGS') return 'Ahorros';
      if (value === 'CHECKING') return 'Corriente';
      return value; // Retornar el valor original si no coincide
    }
    
    return value || '';
  }

  /**
   * Formatea valores de moneda
   */
  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  /**
   * Formatea fechas con hora
   */
  formatDate(value: string | Date): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Función de trackBy para optimización de rendimiento
   */
  trackByFn(index: number, item: any): any {
    return item.id || item.transactionId || item.clientId || item.accountId || index;
  }
}


